/**
 * Middleware di Rate Limiting per protezione da attacchi
 * Implementa limiti specifici per diverse tipologie di endpoint
 */

import rateLimit from 'express-rate-limit';

// Funzione helper per escludere utenti admin dal rate limiting
const skipAdminUsers = (req) => {
  // COMPLETAMENTE BYPASSATO per utenti admin autenticati
  if (req.user && req.user.role === 'admin') {
    console.log(`🔓 Admin rate limit COMPLETAMENTE BYPASSATO per: ${req.path} - User: ${req.user.username}`);
    return true;
  }
  
  // COMPLETAMENTE BYPASSATO per username specifici
  if (req.user && (req.user.username === 'a.polo' || req.user.username === 'admin')) {
    console.log(`🔓 Admin rate limit COMPLETAMENTE BYPASSATO per: ${req.path} - User: ${req.user.username}`);
    return true;
  }
  
  // Se non c'è utente autenticato, controlla se è una richiesta di login/registrazione
  // per permettere di identificare l'utente prima di applicare i limiti
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return false; // Applica sempre il rate limiting per login/registrazione
  }
  
  // Per richieste pubbliche di lettura, non applicare rate limiting troppo aggressivo
  if (req.method === 'GET' && (
    req.path.includes('/courses') || 
    req.path.includes('/teachers/public') || 
    req.path.includes('/news') ||
    req.path.includes('/stats')
  )) {
    return true; // Salta rate limiting per letture pubbliche
  }
  
  // BYPASS SPECIFICO PER ENDPOINT ADMIN AUTENTICATI
  if (req.user && req.user.role === 'admin' && (
    req.path.includes('/api/auth/users') ||
    req.path.includes('/api/bug-reports') ||
    req.path.includes('/api/backup') ||
    req.path.includes('/api/teachers') ||
    req.path.includes('/api/courses')
  )) {
    console.log(`🔓 Admin rate limit bypassed for: ${req.path}`);
    return true;
  }
  
  return false;
};

// Rate Limiter Globale - Protezione generale DDoS
export const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 1000, // massimo 1000 richieste per ora per IP
  skip: skipAdminUsers, // Salta per utenti admin
  message: {
    error: 'Troppe richieste da questo IP. Riprova tra un\'ora.',
    type: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 3600 // secondi
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.warn(`🚨 Rate limit globale superato per IP: ${req.ip} - URL: ${req.originalUrl}`);
    res.status(429).json({
      error: 'Troppe richieste da questo IP. Riprova tra un\'ora.',
      type: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

// Rate Limiter per Login - Protezione Brute Force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // massimo 5 tentativi di login per 15 minuti
  skip: (req) => {
    // Bypass per username specifici di admin
    if (req.body?.username === 'a.polo' || req.body?.username === 'admin') {
      console.log(`🔓 Login rate limit bypassed for admin user: ${req.body.username}`);
      return true;
    }
    return false;
  },
  message: {
    error: 'Troppi tentativi di login falliti. Riprova tra 15 minuti.',
    type: 'LOGIN_RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // secondi
  },
  skipSuccessfulRequests: true, // Non conta le richieste di login riuscite
  handler: (req, res) => {
    console.warn(`🚨 Rate limit login superato per IP: ${req.ip} - Username tentativo: ${req.body?.username || 'N/A'}`);
    res.status(429).json({
      error: 'Troppi tentativi di login falliti. Riprova tra 15 minuti.',
      type: 'LOGIN_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

// Rate Limiter per Registrazione - Protezione Spam Account
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3, // massimo 3 registrazioni per ora per IP
  skip: skipAdminUsers, // Salta per utenti admin
  message: {
    error: 'Troppe registrazioni da questo IP. Riprova tra un\'ora.',
    type: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit registrazione superato per IP: ${req.ip}`);
    res.status(429).json({
      error: 'Troppe registrazioni da questo IP. Riprova tra un\'ora.',
      type: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

// Rate Limiter per API Sensibili - Protezione operazioni critiche
export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minuti
  max: 20, // massimo 20 richieste per 10 minuti
  skip: skipAdminUsers, // Salta per utenti admin
  message: {
    error: 'Limite API raggiunto. Riprova tra 10 minuti.',
    type: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: 600
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit API superato per IP: ${req.ip} - URL: ${req.originalUrl}`);
    res.status(429).json({
      error: 'Limite API raggiunto. Riprova tra 10 minuti.',
      type: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: 600
    });
  }
});

// Rate Limiter per Reset Password - Protezione abuso reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3, // massimo 3 reset password per ora
  skip: skipAdminUsers, // Salta per utenti admin
  message: {
    error: 'Troppi tentativi di reset password. Riprova tra un\'ora.',
    type: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit reset password superato per IP: ${req.ip}`);
    res.status(429).json({
      error: 'Troppi tentativi di reset password. Riprova tra un\'ora.',
      type: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

// Rate Limiter per Endpoint Admin - COMPLETAMENTE BYPASSATO per admin autenticati
export const adminEndpointLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minuti
  max: 1000, // Molto alto come fallback (non dovrebbe mai essere raggiunto)
  skip: (req) => {
    // COMPLETAMENTE BYPASSATO per utenti admin autenticati
    if (req.user && req.user.role === 'admin') {
      console.log(`🔓 Admin rate limit COMPLETAMENTE BYPASSATO per: ${req.path} - User: ${req.user.username}`);
      return true;
    }
    
    // COMPLETAMENTE BYPASSATO per username specifici
    if (req.user && (req.user.username === 'a.polo' || req.user.username === 'admin')) {
      console.log(`🔓 Admin rate limit COMPLETAMENTE BYPASSATO per: ${req.path} - User: ${req.user.username}`);
      return true;
    }
    
    return false;
  },
  message: {
    error: 'Limite endpoint admin raggiunto. Riprova tra 5 minuti.',
    type: 'ADMIN_ENDPOINT_RATE_LIMIT_EXCEEDED',
    retryAfter: 300
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit endpoint admin superato per IP: ${req.ip} - URL: ${req.originalUrl}`);
    res.status(429).json({
      error: 'Limite endpoint admin raggiunto. Riprova tra 5 minuti.',
      type: 'ADMIN_ENDPOINT_RATE_LIMIT_EXCEEDED',
      retryAfter: 300
    });
  }
});

// Rate Limiter per Form Pubblici - Protezione spam form
export const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 50, // Aumentato da 10 a 50 per permettere più operazioni di lettura
  skip: (req) => {
    // Salta per utenti admin
    if (skipAdminUsers(req)) {
      return true;
    }
    
    // Salta per richieste GET (lettura) - non sono form submissions
    if (req.method === 'GET') {
      return true;
    }
    
    // Salta per richieste di statistiche e dati pubblici
    if (req.path.includes('/stats') || req.path.includes('/public')) {
      return true;
    }
    
    return false;
  },
  message: {
    error: 'Troppi invii form da questo IP. Riprova tra un\'ora.',
    type: 'FORM_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  },
  handler: (req, res) => {
    console.warn(`🚨 Rate limit form pubblici superato per IP: ${req.ip} - URL: ${req.originalUrl}`);
    res.status(429).json({
      error: 'Troppi invii form da questo IP. Riprova tra un\'ora.',
      type: 'FORM_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

// Esportazione di tutti i limiters
export default {
  globalLimiter,
  loginLimiter,
  registrationLimiter,
  apiLimiter,
  passwordResetLimiter,
  publicFormLimiter,
  adminEndpointLimiter
};
