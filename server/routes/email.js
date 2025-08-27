import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /api/email/stats
router.get('/stats', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const stats = {
      total: 0,
      today: 0,
      success: 0,
      failure: 0
    };

    db.get(`SELECT COUNT(*) AS total FROM email_logs`, [], (err, row) => {
      if (err) return res.status(500).json({ error: 'DB error (total)' });
      stats.total = row?.total || 0;

      db.get(`SELECT COUNT(*) AS today FROM email_logs WHERE date(created_at) = date(?)`, [today], (err2, row2) => {
        if (err2) return res.status(500).json({ error: 'DB error (today)' });
        stats.today = row2?.today || 0;

        db.get(`SELECT COUNT(*) AS success FROM email_logs WHERE status = 'success'`, [], (err3, row3) => {
          if (err3) return res.status(500).json({ error: 'DB error (success)' });
          stats.success = row3?.success || 0;

          db.get(`SELECT COUNT(*) AS failure FROM email_logs WHERE status = 'failure'`, [], (err4, row4) => {
            if (err4) return res.status(500).json({ error: 'DB error (failure)' });
            stats.failure = row4?.failure || 0;
            res.json(stats);
          });
        });
      });
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal error' });
  }
});

export default router;


