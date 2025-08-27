import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /api/teachers/public - Get all teachers (public endpoint)
router.get('/public', (req, res) => {
  console.log('🌐 GET /api/teachers/public - Public request');
  
  const query = `
    SELECT id, name, instruments, bio, email
    FROM teachers 
    WHERE id IS NOT NULL
    ORDER BY name ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching public teachers:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('✅ Public teachers fetched:', rows.length);
    res.json(rows);
  });
});

// GET /api/teachers - Get all teachers (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  console.log('🔍 GET /api/teachers - User:', req.user);
  console.log('🔍 User role:', req.user?.role);
  
  const query = `
    SELECT id, name, email, instruments, bio, created_at, updated_at
    FROM teachers 
    ORDER BY name ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching teachers:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('✅ Teachers fetched:', rows.length);
    res.json(rows);
  });
});

// GET /api/teachers/:id - Get teacher by ID
router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM teachers WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching teacher:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json(row);
  });
});

// POST /api/teachers - Create new teacher
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, email, instruments, bio, username } = req.body;
  
  if (!name || !email || !instruments || !bio) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    // Check if email already exists in teachers table
    const existingTeacher = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM teachers WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already exists for another teacher' });
    }
    
    // Check if email already exists in users table
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingUser) {
      // Se l'utente esiste già, aggiorna solo il ruolo a 'docente'
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE users 
          SET role = 'docente', is_active = 1
          WHERE id = ?
        `, [existingUser.id], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Crea il profilo insegnante collegato all'utente esistente
      const teacherId = await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO teachers (name, email, instruments, bio, user_id)
          VALUES (?, ?, ?, ?, ?)
        `, [name, email, instruments, bio, existingUser.id], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      
      // Get the created teacher
      const teacher = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM teachers WHERE id = ?', [teacherId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      return res.status(200).json({
        success: true,
        message: 'Existing user updated with docente role and teacher profile created',
        teacher: teacher,
        userUpdated: true
      });
    }
    
    // Hash password per nuovo utente
    const hashedPassword = await bcrypt.hash('exmatta2024', 10);
    
    // Create new user account with 'docente' role
    const userId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, 'docente', 1)
      `, [username, email, hashedPassword], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Create teacher profile
    const teacherId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO teachers (name, email, instruments, bio, user_id)
        VALUES (?, ?, ?, ?, ?)
      `, [name, email, instruments, bio, userId], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Get the created teacher
    const teacher = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM teachers WHERE id = ?', [teacherId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      teacher: teacher,
      userUpdated: false
    });
    
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// PUT /api/teachers/:id - Update teacher
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, instruments, bio, username } = req.body;
  
  if (!name || !email || !instruments || !bio) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    // Check if email already exists for other teachers
    const existingTeacher = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM teachers WHERE email = ? AND id != ?', [email, id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Get current teacher to find user_id
    const currentTeacher = await new Promise((resolve, reject) => {
      db.get('SELECT user_id FROM teachers WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!currentTeacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Update teacher profile
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE teachers 
        SET name = ?, email = ?, instruments = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, email, instruments, bio, id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Update username in users table if user_id exists
    if (currentTeacher.user_id && username) {
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE users 
          SET username = ?
          WHERE id = ?
        `, [username, currentTeacher.user_id], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    // Get the updated teacher
    const teacher = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM teachers WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.json({
      success: true,
      message: 'Teacher updated successfully',
      teacher: teacher
    });
    
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/teachers/:id - Delete teacher
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  try {
    // Get teacher info first
    db.get('SELECT user_id FROM teachers WHERE id = ?', [id], (err, teacher) => {
      if (err) {
        console.error('Error fetching teacher:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
      
      // Delete teacher profile
      db.run('DELETE FROM teachers WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting teacher profile:', err);
          return res.status(500).json({ error: 'Failed to delete teacher profile' });
        }
        
        // Delete associated user account if exists
        if (teacher.user_id) {
          db.run('DELETE FROM users WHERE id = ?', [teacher.user_id], (err) => {
            if (err) {
              console.error('Error deleting user account:', err);
              // Don't fail the request if user deletion fails
            }
          });
        }
        
        res.json({
          success: true,
          message: 'Teacher deleted successfully'
        });
      });
    });
    
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
