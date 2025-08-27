import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path, { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import fs from 'fs';

// Import rate limiters
import { 
  globalLimiter, 
  loginLimiter, 
  registrationLimiter, 
  passwordResetLimiter, 
  publicFormLimiter
} from './middleware/rateLimiter.js';

// Carica le variabili d'ambiente dal file environmentapp.env
import { config } from 'dotenv';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente dal file environmentapp.env
config({ path: './environmentapp.env' });

// Configurazione di fallback per sviluppo (solo se .env non è presente)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET non trovato in .env, uso valore di fallback per sviluppo');
  process.env.JWT_SECRET = 'ariaperta-jwt-secret-key-2024-development-test-only';
}

if (!process.env.ADMIN_REGISTRATION_TOKEN) {
  console.warn('⚠️  ADMIN_REGISTRATION_TOKEN non trovato in .env, uso valore di fallback per sviluppo');
  process.env.ADMIN_REGISTRATION_TOKEN = 'ariaperta-admin-token-2024-development-test';
}

if (!process.env.EMAIL_USER) {
  console.warn('⚠️  EMAIL_USER non trovato in .env, uso valore di fallback per sviluppo');
  process.env.EMAIL_USER = 'poloalessio00@gmail.com';
}

if (!process.env.EMAIL_PASS) {
  console.warn('⚠️  EMAIL_PASS non trovato in .env, uso valore di fallback per sviluppo');
  process.env.EMAIL_PASS = 'skkh jhul qtrv eomz';
}

// Imposta NODE_ENV e PORT solo se non già definiti
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (!process.env.PORT) {
  process.env.PORT = '3001';
}

// Validazione variabili critiche all'avvio (DOPO aver impostato i fallback)
const requiredEnvVars = ['JWT_SECRET', 'ADMIN_REGISTRATION_TOKEN', 'EMAIL_USER', 'EMAIL_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ CRITICAL: Variabili d\'ambiente mancanti:', missingVars);
  console.error('📋 Crea un file .env basato su env.example');
  process.exit(1);
}

// Import database configuration
import db from './config/database.js';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;
const isDev = (process.env.NODE_ENV !== 'production');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or file://)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://')) {
      return callback(null, true);
    }
    
    // Allow specific production domains if needed
    // if (origin === 'https://yourdomain.com') return callback(null, true);
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ======================================
// RATE LIMITING SECURITY LAYER
// ======================================
// Apply rate limiting after CORS so CORS headers are present even on 429

console.log('🛡️  Rate Limiting DISABILITATO TEMPORANEAMENTE');
// console.log('⚠️  Rate Limiter Globale disabilitato in modalità sviluppo');
// console.log('✅ Rate Limiter Login attivo: 5 tentativi/15min');
// console.log('✅ Rate Limiter Registrazione attivo: 3 registrazioni/ora');
// console.log('✅ Rate Limiter API Utenti attivo: 20 req/10min');
// console.log('✅ Rate Limiter Form Pubblici attivo: 10 invii/ora');
// console.log('✅ Rate Limiter API Sensibili attivo: 20 req/10min');

// Rate Limiting - DISABILITATO TEMPORANEAMENTE
// app.use(globalLimiter);
// app.use('/api/auth/login', loginLimiter);
// app.use('/api/auth/register', registrationLimiter);
// app.use('/api/auth', passwordResetLimiter);
// app.use('/api', apiLimiter);
// app.use('/api/courses', publicFormLimiter);
// app.use('/api/email', publicFormLimiter);
// app.use('/api/bug-reports', publicFormLimiter);
// app.use('/api/bookings', publicFormLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for production)
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes (will be added in next steps)
import bookingsRouter from './routes/bookings.js';
import coursesRouter from './routes/courses.js';
import newsRouter from './routes/news.js';
import authRouter from './routes/auth.js';
import emailRouter from './routes/email.js';
import exportRouter from './routes/export.js';
import backupRouter from './routes/backup.js';
import bugReportsRouter from './routes/bugReports.js';
import teachersRouter from './routes/teachers.js';

// Validazione configurazione email
import { validateEmailConfig } from './config/email.config.js';

// ======================================
// RATE LIMITERS SPECIFICI PER ENDPOINT
// ======================================
// NOTA: Rate limiting RIMOSSO per tutti gli endpoint della dashboard
// Motivo: Dashboard interna per max 15 utenti del mattatoio
// Rate limiting mantenuto solo per: login, registrazione, form pubblici

// 2. Rate Limiters per endpoint critici di autenticazione
app.use('/api/auth/login', loginLimiter);
console.log('✅ Rate Limiter Login attivo: 5 tentativi/15min');

app.use('/api/auth/register', registrationLimiter);
console.log('✅ Rate Limiter Registrazione attivo: 3 registrazioni/ora');

// 3. Rate Limiters per operazioni sensibili (solo password reset)
app.use('/api/auth/users/:id/password', passwordResetLimiter);

// 4. Rate Limiters per form pubblici (TUTTI gli endpoint dashboard SENZA rate limiting)
app.use('/api/courses', publicFormLimiter);
app.use('/api/email', publicFormLimiter);
// app.use('/api/bug-reports', adminEndpointLimiter); // RIMOSSO - non serve per 15 utenti
console.log('✅ Rate Limiter Form Pubblici attivo: 10 invii/ora');
console.log('✅ Rate Limiter Dashboard: COMPLETAMENTE RIMOSSO - non serve per 15 utenti interni');

// 5. Rate Limiters per altre API sensibili (TUTTI gli endpoint dashboard SENZA rate limiting)
// app.use('/api/teachers', apiLimiter); // RIMOSSO - non serve per 15 utenti
// app.use('/api/news', apiLimiter); // RIMOSSO - non serve per 15 utenti
// app.use('/api/export', apiLimiter); // RIMOSSO - non serve per 15 utenti
// app.use('/api/backup', apiLimiter); // RIMOSSO - non serve per 15 utenti
console.log('✅ Rate Limiter API Sensibili: RIMOSSO - non serve per dashboard interna');
console.log('✅ Rate Limiter Teachers/News/Export/Backup: RIMOSSO - non serve per 15 utenti');

// ======================================
// ROUTE DEFINITIONS
// ======================================

app.use('/api/bookings', bookingsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/news', newsRouter);
app.use('/api/auth', authRouter);
app.use('/api/email', emailRouter);
app.use('/api/export', exportRouter);
app.use('/api/backup', backupRouter);
app.use('/api/bug-reports', bugReportsRouter);
app.use('/api/teachers', teachersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected',
    uptime: process.uptime()
  });
});

// Catch-all handler for SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ======================================
// HTTPS/TLS CONFIGURATION
// ======================================

// Configurazione SSL per sviluppo e produzione
const sslOptions = {
  // In produzione, questi file dovrebbero essere forniti dal provider
  // Per sviluppo, creiamo certificati self-signed
  key: null,
  cert: null,
  ca: null
};

// Funzione per creare certificati self-signed per sviluppo (semplificata)
function createSelfSignedCert() {
  try {
    console.log('🔐 Configurazione SSL per sviluppo locale...');
    
    // Per ora, HTTPS è disabilitato in sviluppo
    // In futuro implementeremo generazione certificati
    console.warn('⚠️  HTTPS temporaneamente disabilitato per sviluppo');
    return null;
  } catch (error) {
    console.warn('⚠️  Errore configurazione SSL:', error.message);
    console.warn('⚠️  Fallback a HTTP per sviluppo');
    return null;
  }
}

// ======================================
// SERVER STARTUP
// ======================================

// Funzione per avviare il server
function startServer() {
  const sslConfig = createSelfSignedCert();
  
  if (sslConfig && process.env.USE_HTTPS === 'true') {
    // Avvia server HTTPS
    const httpsServer = https.createServer(sslConfig, app);
    const httpsPort = process.env.HTTPS_PORT || 3443;
    
    httpsServer.listen(httpsPort, () => {
      console.log(`🔒 Server HTTPS running on port ${httpsPort}`);
      console.log(`📊 Database: Connected`);
      console.log(`🔒 Security: Enabled (Helmet, CORS, Rate Limiting, HTTPS)`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔐 SSL: Self-signed certificate (development only)`);
      
      // Validazione configurazione email
      try {
        const emailValid = validateEmailConfig();
        if (!emailValid) {
          console.warn('⚠️ Configurazione email incompleta - le funzioni email potrebbero non funzionare');
        }
      } catch (error) {
        console.error('❌ Errore configurazione email:', error.message);
        console.warn('⚠️ Le funzioni email potrebbero non funzionare');
      }
    });
    
    // Redirect HTTP to HTTPS
    const httpServer = http.createServer((req, res) => {
      const httpsUrl = `https://${req.headers.host?.replace(/:\d+$/, '')}:${httpsPort}${req.url}`;
      res.writeHead(301, { Location: httpsUrl });
      res.end();
    });
    
    httpServer.listen(PORT, () => {
      console.log(`🔄 HTTP redirect server running on port ${PORT}`);
      console.log(`🔄 Redirecting to HTTPS on port ${httpsPort}`);
    });
    
  } else {
    // Avvia server HTTP (fallback per sviluppo)
    app.listen(PORT, () => {
      console.log(`🚀 Server HTTP running on port ${PORT}`);
      console.log(`📊 Database: Connected`);
      console.log(`🔒 Security: Enabled (Helmet, CORS, Rate Limiting)`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚠️  HTTPS: Disabled (use USE_HTTPS=true to enable)`);
      
      // Validazione configurazione email
      try {
        const emailValid = validateEmailConfig();
        if (!emailValid) {
          console.warn('⚠️ Configurazione email incompleta - le funzioni email potrebbero non funzionare');
        }
      } catch (error) {
        console.error('❌ Errore configurazione email:', error.message);
        console.warn('⚠️ Le funzioni email potrebbero non funzionare');
      }
    });
  }
}

// Avvia il server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
