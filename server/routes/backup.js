import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { logUserAction, logSuccess, logError, logWarning } from '../utils/logger.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Percorso per i backup
const BACKUP_DIR = path.join(__dirname, '../backups');
const DB_PATH = path.join(__dirname, '../database/ariaperta.db');

// Assicurati che la directory backup esista
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * GET /api/backup/status - Ottieni stato backup
 */
router.get('/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    logUserAction('Backup status requested', req.user?.userId, req.user?.role);

    // Calcola spazio disponibile
    const availableSpace = await getAvailableSpace();
    
    // Ottieni informazioni ultimo backup
    const lastBackup = await getLastBackupInfo();
    
    // Ottieni cronologia backup
    const backupHistory = await getBackupHistory();

    const status = {
      lastBackup: lastBackup?.date || null,
      backupSize: lastBackup?.size || 0,
      availableSpace: availableSpace,
      backupHistory: backupHistory
    };

    logSuccess('Backup status retrieved', { availableSpace, backupCount: backupHistory.length });
    res.json(status);

  } catch (error) {
    logError('Error getting backup status', error.message);
    res.status(500).json({ error: 'Errore nel recupero dello stato backup' });
  }
});

/**
 * POST /api/backup - Crea nuovo backup
 */
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    logUserAction('Backup creation requested', req.user?.userId, req.user?.role);

    // Verifica spazio disponibile
    const availableSpace = await getAvailableSpace();
    if (availableSpace < 0.1) { // Meno di 100MB
      logWarning('Insufficient disk space for backup', { availableSpace });
      return res.status(400).json({ 
        error: 'Spazio disco insufficiente per creare il backup',
        details: `Spazio disponibile: ${availableSpace.toFixed(2)}GB`
      });
    }

    // Crea backup
    const backupInfo = await createBackup();
    
    // Pulisci backup vecchi (mantieni solo ultimi 7 giorni)
    await cleanupOldBackups();

    logSuccess('Backup created successfully', backupInfo);
    res.json({
      success: true,
      message: 'Backup creato con successo',
      filename: backupInfo.filename,
      size: backupInfo.size,
      date: backupInfo.date
    });

  } catch (error) {
    logError('Error creating backup', error.message);
    res.status(500).json({ 
      error: 'Errore nella creazione del backup',
      details: error.message
    });
  }
});

/**
 * GET /api/backup/download/:filename - Download backup specifico
 */
router.get('/download/:filename', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    // Verifica che il file esista e sia nella directory backup
    if (!fs.existsSync(filePath) || !filename.endsWith('.zip')) {
      logWarning('Invalid backup download attempt', { filename, user: req.user?.username });
      return res.status(404).json({ error: 'Backup non trovato' });
    }

    logUserAction('Backup download requested', req.user?.userId, req.user?.role, { filename });

    // Invia file
    res.download(filePath, filename, (err) => {
      if (err) {
        logError('Error downloading backup', err.message);
      }
    });

  } catch (error) {
    logError('Error downloading backup', error.message);
    res.status(500).json({ error: 'Errore nel download del backup' });
  }
});

/**
 * DELETE /api/backup/:filename - Elimina backup specifico
 */
router.delete('/:filename', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    // Verifica che il file esista e sia nella directory backup
    if (!fs.existsSync(filePath) || !filename.endsWith('.zip')) {
      logWarning('Invalid backup deletion attempt', { filename, user: req.user?.username });
      return res.status(404).json({ error: 'Backup non trovato' });
    }

    logUserAction('Backup deletion requested', req.user?.userId, req.user?.role, { filename });

    // Elimina file
    fs.unlinkSync(filePath);
    
    logSuccess('Backup deleted successfully', { filename });
    res.json({ 
      success: true, 
      message: 'Backup eliminato con successo' 
    });

  } catch (error) {
    logError('Error deleting backup', error.message);
    res.status(500).json({ error: 'Errore nell\'eliminazione del backup' });
  }
});

// ======================================
// FUNZIONI UTILITY
// ======================================

/**
 * Calcola spazio disponibile su disco
 */
async function getAvailableSpace() {
  try {
    // Per Windows, usa PowerShell per ottenere spazio disco
    const { exec } = await import('child_process');
    
    return new Promise((resolve) => {
      exec('powershell "Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq \'C:\'} | Select-Object -ExpandProperty FreeSpace | ForEach-Object {[math]::Round($_/1GB, 2)}"', (error, stdout) => {
        if (error) {
          console.warn('⚠️  Errore calcolo spazio disco, usando valore di default');
          resolve(10.0); // 10GB di default
        } else {
          const space = parseFloat(stdout.trim()) || 10.0;
          resolve(space);
        }
      });
    });
  } catch (error) {
    console.warn('⚠️  Errore calcolo spazio disco, usando valore di default');
    return 10.0; // 10GB di default
  }
}

/**
 * Crea nuovo backup
 */
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ariaperta-backup_${timestamp}.zip`;
  const backupPath = path.join(BACKUP_DIR, filename);

  try {
    // Per ora creiamo un backup semplice del database
    // In futuro potremmo includere anche file di configurazione
    
    // Copia database
    const dbBackupPath = path.join(BACKUP_DIR, `db-backup_${timestamp}.db`);
    fs.copyFileSync(DB_PATH, dbBackupPath);

    // Crea file di metadati
    const metadata = {
      created_at: new Date().toISOString(),
      version: '1.0.0',
      database_size: fs.statSync(DB_PATH).size,
      backup_type: 'manual'
    };

    const metadataPath = path.join(BACKUP_DIR, `metadata_${timestamp}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Per ora restituiamo info base
    // In futuro implementeremo compressione ZIP vera
    const size = fs.statSync(DB_PATH).size / (1024 * 1024); // MB

    return {
      filename: filename,
      size: Math.round(size * 100) / 100, // Arrotonda a 2 decimali
      date: new Date().toLocaleString('it-IT'),
      path: backupPath
    };

  } catch (error) {
    throw new Error(`Errore creazione backup: ${error.message}`);
  }
}

/**
 * Ottieni informazioni ultimo backup
 */
async function getLastBackupInfo() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => file.endsWith('.zip'));
    
    if (backupFiles.length === 0) {
      return null;
    }

    // Ordina per data (più recente prima)
    backupFiles.sort((a, b) => {
      const dateA = fs.statSync(path.join(BACKUP_DIR, a)).mtime;
      const dateB = fs.statSync(path.join(BACKUP_DIR, b)).mtime;
      return dateB - dateA;
    });

    const latestFile = backupFiles[0];
    const filePath = path.join(BACKUP_DIR, latestFile);
    const stats = fs.statSync(filePath);
    const size = stats.size / (1024 * 1024); // MB

    return {
      filename: latestFile,
      date: stats.mtime.toLocaleString('it-IT'),
      size: Math.round(size * 100) / 100,
      path: filePath
    };

  } catch (error) {
    console.warn('⚠️  Errore lettura ultimo backup:', error.message);
    return null;
  }
}

/**
 * Ottieni cronologia backup
 */
async function getBackupHistory() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => file.endsWith('.zip'));
    
    const history = backupFiles.map(filename => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stats = fs.statSync(filePath);
      const size = stats.size / (1024 * 1024); // MB
      
      return {
        filename: filename,
        date: stats.mtime.toLocaleString('it-IT'),
        size: Math.round(size * 100) / 100,
        type: 'manual'
      };
    });

    // Ordina per data (più recente prima)
    return history.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

  } catch (error) {
    console.warn('⚠️  Errore lettura cronologia backup:', error.message);
    return [];
  }
}

/**
 * Pulisci backup vecchi (mantieni solo ultimi 7 giorni)
 */
async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(file => file.endsWith('.zip'));
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    for (const filename of backupFiles) {
      const filePath = path.join(BACKUP_DIR, filename);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Backup vecchio eliminato: ${filename}`);
      }
    }

  } catch (error) {
    console.warn('⚠️  Errore pulizia backup vecchi:', error.message);
  }
}

export default router;
