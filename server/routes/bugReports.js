import express from 'express';
import db from '../config/database.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { verifyPublicForm } from '../middleware/recaptcha.js';

const router = express.Router();

// GET /api/bug-reports - Ottieni tutti i bug reports (solo admin)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let query = `
      SELECT * FROM bug_reports 
      WHERE 1=1
    `;
    const params = [];
    
    // Filtri
    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND description LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
    }
    
    // Ordinamento per data di creazione (più recenti prima)
    query += ` ORDER BY created_at DESC`;
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Errore del database',
          details: err.message 
        });
      }
      
      res.json({
        success: true,
        data: rows,
        count: rows.length
      });
    });
  } catch (error) {
    console.error('Error in GET /api/bug-reports:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// GET /api/bug-reports/:id - Ottieni un bug report specifico (solo admin)
router.get('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    db.get('SELECT * FROM bug_reports WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Errore del database',
          details: err.message 
        });
      }
      
      if (!row) {
        return res.status(404).json({ 
          error: 'Bug report non trovato' 
        });
      }
      
      res.json({
        success: true,
        data: row
      });
    });
  } catch (error) {
    console.error('Error in GET /api/bug-reports/:id:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// POST /api/bug-reports - Crea un nuovo bug report (pubblico)
router.post('/', verifyPublicForm, async (req, res) => {
  try {
    const { description, browser_info } = req.body;
    
    // Validazione campi obbligatori
    if (!description) {
      return res.status(400).json({
        error: 'Campi mancanti',
        required: ['description']
      });
    }
    
    const query = `
      INSERT INTO bug_reports (description, browser_info, status)
      VALUES (?, ?, 'open')
    `;
    
    db.run(query, [description, browser_info || null], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Errore del database',
          details: err.message 
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Bug report inviato con successo',
        data: {
          id: this.lastID,
          description,
          browser_info,
          status: 'open',
          created_at: new Date().toISOString()
        }
      });
    });
  } catch (error) {
    console.error('Error in POST /api/bug-reports:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// PUT /api/bug-reports/:id - Aggiorna un bug report (solo admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes, status } = req.body;
    
    // Verifica che il bug report esista
    db.get('SELECT id FROM bug_reports WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Errore del database',
          details: err.message 
        });
      }
      
      if (!row) {
        return res.status(404).json({ 
          error: 'Bug report non trovato' 
        });
      }
      
      // Costruisci query di aggiornamento dinamica
      let updateFields = [];
      let params = [];
      
      if (admin_notes !== undefined) {
        updateFields.push('admin_notes = ?');
        params.push(admin_notes);
      }
      
      if (status !== undefined) {
        const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: 'Status non valido',
            valid: validStatuses
          });
        }
        updateFields.push('status = ?');
        params.push(status);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Nessun campo da aggiornare'
        });
      }
      
      // Aggiungi ID per la clausola WHERE
      params.push(id);
      
      const query = `
        UPDATE bug_reports 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(query, params, function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            error: 'Errore del database',
            details: err.message 
        });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({
            error: 'Bug report non trovato o nessuna modifica applicata'
          });
        }
        
        res.json({
          success: true,
          message: 'Bug report aggiornato con successo',
          changes: this.changes
        });
      });
    });
  } catch (error) {
    console.error('Error in PUT /api/bug-reports/:id:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// DELETE /api/bug-reports/:id - Elimina un bug report (solo admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    db.run('DELETE FROM bug_reports WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Errore del database',
          details: err.message 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Bug report non trovato'
        });
      }
      
      res.json({
        success: true,
        message: 'Bug report eliminato con successo',
        changes: this.changes
      });
    });
  } catch (error) {
    console.error('Error in DELETE /api/bug-reports/:id:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

// GET /api/bug-reports/stats/summary - Statistiche riassuntive (solo admin)
router.get('/stats/summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_issues,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_issues,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_issues
      FROM bug_reports
    `;
    
    db.get(statsQuery, [], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          error: 'Errore del database',
          details: err.message 
        });
      }
      
      res.json({
        success: true,
        data: row
      });
    });
  } catch (error) {
    console.error('Error in GET /api/bug-reports/stats/summary:', error);
    res.status(500).json({ 
      error: 'Errore interno del server',
      details: error.message 
    });
  }
});

export default router;
