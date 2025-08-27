import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Funzione helper per convertire array in CSV
const arrayToCSV = (data, headers) => {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or newline
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('\n') ? `"${escaped}"` : escaped;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

// GET /api/export/bookings
router.get('/bookings', (req, res) => {
  try {
    db.all(`
      SELECT 
        id, date, start_time, duration, band_name, email, phone, 
        members_count, notes, status, created_at, updated_at
      FROM bookings 
      ORDER BY created_at DESC
    `, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero prenotazioni' });
      }
      
      const headers = [
        'ID', 'Data', 'Orario Inizio', 'Durata (ore)', 'Nome Band', 'Email', 
        'Telefono', 'Componenti', 'Note', 'Stato', 'Data Creazione', 'Ultimo Aggiornamento'
      ];
      
      const csvData = arrayToCSV(rows, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="prenotazioni_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    });
  } catch (e) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

// GET /api/export/courses
router.get('/courses', (req, res) => {
  try {
    db.all(`
      SELECT 
        id, nome, cognome, email, telefono, strumento, livello, 
        descrizione, status, created_at, updated_at
      FROM course_requests 
      ORDER BY created_at DESC
    `, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero corsi' });
      }
      
      const headers = [
        'ID', 'Nome', 'Cognome', 'Email', 'Telefono', 'Strumento', 
        'Livello', 'Descrizione', 'Stato', 'Data Creazione', 'Ultimo Aggiornamento'
      ];
      
      const csvData = arrayToCSV(rows, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="corsi_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    });
  } catch (e) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

// GET /api/export/news
router.get('/news', (req, res) => {
  try {
    db.all(`
      SELECT 
        id, titolo, sottotitolo, descrizione, stato, autore, 
        created_at, updated_at, published_at
      FROM news 
      ORDER BY created_at DESC
    `, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Errore nel recupero news' });
      }
      
      const headers = [
        'ID', 'Titolo', 'Sottotitolo', 'Descrizione', 'Stato', 'Autore',
        'Data Creazione', 'Ultimo Aggiornamento', 'Data Pubblicazione'
      ];
      
      const csvData = arrayToCSV(rows, headers);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="news_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    });
  } catch (e) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

// GET /api/export/all
router.get('/all', (req, res) => {
  try {
    Promise.all([
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM bookings ORDER BY created_at DESC', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM course_requests ORDER BY created_at DESC', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
      new Promise((resolve, reject) => {
        db.all('SELECT * FROM news ORDER BY created_at DESC', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      })
    ]).then(([bookings, courses, news]) => {
      const allData = {
        prenotazioni: bookings,
        corsi: courses,
        news: news,
        exportDate: new Date().toISOString()
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="export_completo_${new Date().toISOString().split('T')[0]}.json"`);
      res.json(allData);
    }).catch(err => {
      res.status(500).json({ error: 'Errore nel recupero dati' });
    });
  } catch (e) {
    res.status(500).json({ error: 'Errore interno' });
  }
});

export default router;
