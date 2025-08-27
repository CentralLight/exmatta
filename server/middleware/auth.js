import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logUserAction, logError, logWarning, logSuccess } from '../utils/logger.js';
import config from '../config/config.js';

// JWT Secret dalla configurazione centralizzata
const JWT_SECRET = config.jwtSecret;

// Validate JWT_SECRET is set
if (!JWT_SECRET) {
  console.error('❌ CRITICAL: JWT_SECRET non è configurato correttamente!');
  process.exit(1);
}

// Generate JWT token
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token (alias for authenticateToken)
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Alias for verifyToken (used in bug reports)
export const authenticateToken = verifyToken;

// Role-based access control
export const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ error: `${requiredRole} access required` });
    }
    
    next();
  };
};

// Admin role verification
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    logWarning('requireAdmin: No user found', null, null);
    return res.status(401).json({ error: 'Accesso non autorizzato' });
  }
  
  // Log sicuro dell'azione utente DOPO aver verificato che req.user esiste
  logUserAction('Admin access attempt', req.user.userId, req.user.role);
  
  if (req.user.role !== 'admin') {
    logWarning('requireAdmin: User role is not admin', req.user.userId, req.user.role);
    return res.status(403).json({ error: 'Accesso negato: richiesti privilegi amministratore' });
  }
  
  logSuccess('requireAdmin: Access granted', req.user.userId, req.user.role);
  next();
};

// Require sala prove role
export const requireSalaProve = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedRoles = ['admin', 'salaprove'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Sala prove access required' });
  }
  
  next();
};

// Require sala corsi role
export const requireSalaCorsi = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedRoles = ['admin', 'salacorsi'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Sala corsi access required' });
  }
  
  next();
};

// Require news role
export const requireNews = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const allowedRoles = ['admin', 'news'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'News management access required' });
  }
  
  next();
};

// Require user role (basic access)
export const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // All authenticated users can access basic features
  next();
};

// Hash password
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid, but continue without user
      req.user = null;
    }
  }
  
  next();
};
