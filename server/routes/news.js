import express from 'express';
import db from '../config/database.js';
import upload from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/news - Get all published news (public)
router.get('/', (req, res) => {
  const { status = 'Pubblicato', limit = 10, offset = 0 } = req.query;
  
  let query = `SELECT * FROM news WHERE stato = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const params = [status, parseInt(limit), parseInt(offset)];
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching news:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Restituisce il formato corretto per il frontend
    res.json({
      success: true,
      news: rows,
      total: rows.length
    });
  });
});

// GET /api/news/all - Get all news (admin only)
router.get('/all', (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  
  let query = `SELECT * FROM news WHERE 1=1`;
  const params = [];
  
  if (status) {
    query += ` AND stato = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching all news:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Restituisce il formato corretto per il frontend
    res.json({
      success: true,
      news: rows,
      total: rows.length
    });
  });
});

// GET /api/news/stats - Get news statistics
router.get('/stats', (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_news,
      COUNT(CASE WHEN stato = 'Bozza' THEN 1 END) as bozze,
      COUNT(CASE WHEN stato = 'Pubblicato' THEN 1 END) as pubblicate,
      COUNT(CASE WHEN stato = 'Archiviato' THEN 1 END) as archiviate,
      COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as ultima_settimana,
      COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as ultimo_mese
    FROM news
  `;
  
  db.get(statsQuery, [], (err, stats) => {
    if (err) {
      console.error('Error fetching news stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(stats);
  });
});

// GET /api/news/:id - Get specific news article
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `SELECT * FROM news WHERE id = ?`;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error fetching news article:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    // Restituisce il formato corretto per il frontend
    res.json({
      success: true,
      news: row
    });
  });
});

// POST /api/news - Create new news article
router.post('/', upload.single('image'), (req, res) => {
  const { titolo, sottotitolo, descrizione, stato, autore } = req.body;
  const imageFilename = req.file ? req.file.filename : null;
  
  // Validation
  if (!titolo || !descrizione) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  
  if (titolo.length > 100) {
    return res.status(400).json({ error: 'Title too long (max 100 characters)' });
  }
  
  if (descrizione.length > 1000) {
    return res.status(400).json({ error: 'Description too long (max 1000 characters)' });
  }
  
  if (stato && !['Bozza', 'Pubblicato', 'Archiviato'].includes(stato)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const insertQuery = `
    INSERT INTO news (titolo, sottotitolo, descrizione, image_filename, stato, autore)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    titolo,
    sottotitolo || '',
    descrizione,
    imageFilename,
    stato || 'Bozza',
    autore || 'Redazione AriaPerta'
  ];
  
  db.run(insertQuery, params, function(err) {
    if (err) {
      console.error('Error creating news article:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.status(201).json({
      success: true,
      message: 'News article created successfully',
      articleId: this.lastID,
      imageFilename: imageFilename
    });
  });
});

// PUT /api/news/:id - Update news article
router.put('/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { titolo, sottotitolo, descrizione, stato, autore, removeImage } = req.body;
  const imageFilename = req.file ? req.file.filename : null;
  
  // Validation
  if (!titolo || !descrizione) {
    return res.status(400).json({ error: 'Title and description are required' });
  }
  
  if (titolo.length > 100) {
    return res.status(400).json({ error: 'Title too long (max 100 characters)' });
  }
  
  if (descrizione.length > 1000) {
    return res.status(400).json({ error: 'Description too long (max 1000 characters)' });
  }
  
  if (stato && !['Bozza', 'Pubblicato', 'Archiviato'].includes(stato)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  // Get current image filename to handle deletion
  db.get('SELECT image_filename FROM news WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching current image:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    let finalImageFilename = row.image_filename;
    
    // Handle image updates
    if (imageFilename) {
      // New image uploaded
      finalImageFilename = imageFilename;
    } else if (removeImage === 'true') {
      // Image removal requested
      finalImageFilename = null;
    }
    
    const updateQuery = `
      UPDATE news 
      SET titolo = ?, sottotitolo = ?, descrizione = ?, image_filename = ?, stato = ?, autore = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const params = [
      titolo,
      sottotitolo || '',
      descrizione,
      finalImageFilename,
      stato || 'Bozza',
      autore || 'Redazione AriaPerta',
      id
    ];
    
    db.run(updateQuery, params, function(err) {
      if (err) {
        console.error('Error updating news article:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'News article not found' });
      }
      
      res.json({
        success: true,
        message: 'News article updated successfully',
        imageFilename: finalImageFilename
      });
    });
  });
});

// PUT /api/news/:id/status - Update news status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { stato } = req.body;
  
  if (!stato || !['Bozza', 'Pubblicato', 'Archiviato'].includes(stato)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  let updateQuery = `UPDATE news SET stato = ?, updated_at = CURRENT_TIMESTAMP`;
  const params = [stato];
  
  // If publishing, set published_at timestamp
  if (stato === 'Pubblicato') {
    updateQuery += `, published_at = CURRENT_TIMESTAMP`;
  }
  
  updateQuery += ` WHERE id = ?`;
  params.push(id);
  
  db.run(updateQuery, params, function(err) {
    if (err) {
      console.error('Error updating news status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    res.json({
      success: true,
      message: `News status updated to ${stato}`
    });
  });
});

// DELETE /api/news/:id - Delete news article
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Prima recupera il nome del file immagine per poterlo eliminare
  db.get('SELECT image_filename FROM news WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching news image before deletion:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    // Se c'è un'immagine, eliminala dalla cartella
    if (row.image_filename) {
      const imagePath = path.join(__dirname, '../../public/images/news', row.image_filename);
      
      // Elimina il file se esiste
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log(`✅ Immagine eliminata: ${row.image_filename}`);
        } catch (unlinkErr) {
          console.error(`⚠️  Errore nell'eliminazione dell'immagine ${row.image_filename}:`, unlinkErr.message);
          // Non bloccare l'eliminazione della news se l'immagine non può essere eliminata
        }
      } else {
        console.log(`⚠️  Immagine non trovata: ${imagePath}`);
      }
    }
    
    // Ora elimina la news dal database
    const deleteQuery = `DELETE FROM news WHERE id = ?`;
    
    db.run(deleteQuery, [id], function(err) {
      if (err) {
        console.error('Error deleting news article:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'News article not found' });
      }
      
      res.json({
        success: true,
        message: 'News article deleted successfully'
      });
    });
  });
});

// DELETE /api/news/:id/image - Remove image from news article
router.delete('/:id/image', (req, res) => {
  const { id } = req.params;
  
  // Get current image filename
  db.get('SELECT image_filename FROM news WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Error fetching news image:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'News article not found' });
    }
    
    if (!row.image_filename) {
      return res.status(400).json({ error: 'No image to remove' });
    }
    
    // Elimina fisicamente il file dalla cartella
    const imagePath = path.join(__dirname, '../../public/images/news', row.image_filename);
    
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
        console.log(`✅ Immagine rimossa: ${row.image_filename}`);
      } catch (unlinkErr) {
        console.error(`⚠️  Errore nell'eliminazione dell'immagine ${row.image_filename}:`, unlinkErr.message);
        // Non bloccare l'aggiornamento del database se l'immagine non può essere eliminata
      }
    } else {
      console.log(`⚠️  Immagine non trovata: ${imagePath}`);
    }
    
    // Update database to remove image reference
    const updateQuery = `UPDATE news SET image_filename = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(updateQuery, [id], function(err) {
      if (err) {
        console.error('Error removing image from news:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'News article not found' });
      }
      
      res.json({
        success: true,
        message: 'Image removed from news article successfully'
      });
    });
  });
});

// GET /api/news/stats/overview - Get news statistics (legacy endpoint)
router.get('/stats/overview', (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_articles,
      COUNT(CASE WHEN stato = 'Bozza' THEN 1 END) as bozze,
      COUNT(CASE WHEN stato = 'Pubblicato' THEN 1 END) as pubblicati,
      COUNT(CASE WHEN stato = 'Archiviato' THEN 1 END) as archiviati,
      COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) as ultima_settimana,
      COUNT(CASE WHEN created_at >= date('now', '-30 days') THEN 1 END) as ultimo_mese
    FROM news
  `;
  
  db.get(statsQuery, [], (err, stats) => {
    if (err) {
      console.error('Error fetching news stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(stats);
  });
});

export default router;
