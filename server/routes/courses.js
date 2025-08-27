import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyPublicForm } from '../middleware/recaptcha.js';

const router = express.Router();

// GET /api/courses - Get all course requests (filtered by user role)
router.get('/', authenticateToken, (req, res) => {
  const { status, strumento, livello } = req.query;
  
  // Get user info from request (set by authenticateToken middleware)
  const user = req.user;
  // Debug info (rimosso per sicurezza)
  // console.log('🔍 GET /api/courses - User:', user?.username, 'Role:', user?.role);
  
  let query = `
    SELECT 
      cr.*,
      t.name as teacher_name
    FROM course_requests cr
    LEFT JOIN teachers t ON cr.teacher_id = t.id
    WHERE 1=1
  `;
  const params = [];
  
  // If user is a teacher (docente), only show their requests
  if (user && user.role === 'docente') {
    // Get teacher ID from users table
    db.get('SELECT id FROM teachers WHERE user_id = ?', [user.userId], (err, teacher) => {
      if (err) {
        console.error('Error getting teacher ID:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!teacher) {
        console.log('❌ Teacher not found for user:', user.userId);
        return res.status(404).json({ error: 'Teacher profile not found' });
      }
      
      // Filter by teacher_id
      query += ` AND cr.teacher_id = ?`;
      params.push(teacher.id);
      
      // Apply other filters
      if (status) {
        query += ` AND cr.status = ?`;
        params.push(status);
      }
      
      if (strumento) {
        query += ` AND cr.strumento LIKE ?`;
        params.push(`%${strumento}%`);
      }
      
      if (livello) {
        query += ` AND cr.livello = ?`;
        params.push(livello);
      }
      
      query += ` ORDER BY cr.created_at DESC`;
      
      // console.log('🔍 Query for teacher:', query);
      // console.log('🔍 Params:', params);
      
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error fetching teacher course requests:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        // console.log(`✅ Teacher ${user.username} sees ${rows.length} requests`);
        res.json(rows);
      });
    });
  } else {
    // Admin or other roles see all requests
    if (status) {
      query += ` AND cr.status = ?`;
      params.push(status);
    }
    
    if (strumento) {
      query += ` AND cr.strumento LIKE ?`;
      params.push(`%${strumento}%`);
    }
    
    if (livello) {
      query += ` AND cr.livello = ?`;
      params.push(livello);
    }
    
    query += ` ORDER BY cr.created_at DESC`;
    
    // console.log('🔍 Query for admin:', query);
    // console.log('🔍 Params:', params);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching all course requests:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      // console.log(`✅ Admin ${user?.username || 'anonymous'} sees ${rows.length} requests`);
      res.json(rows);
    });
  }
});

// GET /api/courses/stats - Get course request statistics
router.get('/stats', (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_requests,
      COUNT(CASE WHEN status = 'In attesa' THEN 1 END) as nuove_richieste,
      COUNT(CASE WHEN status = 'Completata' THEN 1 END) as completate,
      COUNT(CASE WHEN strumento = 'Chitarra' THEN 1 END) as chitarra,
      COUNT(CASE WHEN strumento = 'Pianoforte' THEN 1 END) as pianoforte,
      COUNT(CASE WHEN strumento = 'Batteria' THEN 1 END) as batteria,
      COUNT(CASE WHEN strumento = 'Basso' THEN 1 END) as basso,
      COUNT(CASE WHEN strumento = 'Canto' THEN 1 END) as canto,
      COUNT(CASE WHEN strumento = 'Altro' THEN 1 END) as altro
    FROM course_requests
  `;
  
  db.get(statsQuery, [], (err, stats) => {
    if (err) {
      console.error('Error fetching course stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(stats);
  });
});

// POST /api/courses - Create new course request
router.post('/', verifyPublicForm, (req, res) => {
  const { nome, email, telefono, strumento, livello, descrizione, teacher_id } = req.body;
  
  // Validation - Solo i campi obbligatori del frontend
  if (!nome || !email || !strumento || !descrizione) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Livello è opzionale, se non fornito usa 'Principiante' come default
  const livelloFinale = livello || 'Principiante';
  
  if (!['Principiante', 'Intermedio', 'Avanzato'].includes(livelloFinale)) {
    return res.status(400).json({ error: 'Invalid level' });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  const insertQuery = `
    INSERT INTO course_requests (nome, email, telefono, strumento, livello, descrizione, teacher_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'In attesa')
  `;
  
  db.run(insertQuery, [nome, email, telefono || '', strumento, livelloFinale, descrizione || '', teacher_id || null], function(err) {
    if (err) {
      console.error('Error creating course request:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({
      success: true,
      message: 'Course request created successfully',
      requestId: this.lastID
    });
  });
});

// PUT /api/courses/:id/status - Update course request status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['In attesa', 'Completata'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const query = `UPDATE course_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  
  db.run(query, [status, id], function(err) {
    if (err) {
      console.error('Error updating course request status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course request not found' });
    }
    
    res.json({
      success: true,
      message: `Course request status updated to ${status}`
    });
  });
});

// PUT /api/courses/:id - Update course request details
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, telefono, strumento, livello, descrizione } = req.body;
  
  if (!nome || !email || !telefono || !strumento || !livello) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!['Principiante', 'Intermedio', 'Avanzato'].includes(livello)) {
    return res.status(400).json({ error: 'Invalid level' });
  }
  
  const query = `
    UPDATE course_requests 
    SET nome = ?, email = ?, telefono = ?, strumento = ?, livello = ?, descrizione = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(query, [nome, email, telefono, strumento, livello, descrizione || '', id], function(err) {
    if (err) {
      console.error('Error updating course request:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course request not found' });
    }
    
    res.json({
      success: true,
      message: 'Course request updated successfully'
    });
  });
});

// DELETE /api/courses/:id - Delete course request
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `DELETE FROM course_requests WHERE id = ?`;
  
  db.run(query, [id], function(err) {
    if (err) {
      console.error('Error deleting course request:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course request not found' });
    }
    
    res.json({
      success: true,
      message: 'Course request deleted successfully'
    });
  });
});

// GET /api/courses/:id - Get specific course request
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `SELECT * FROM course_requests WHERE id = ?`;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching course request:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Course request not found' });
    }
    
    res.json(row);
  });
});

export default router;
