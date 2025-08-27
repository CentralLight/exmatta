/**
 * Middleware di Validazione e Sanitizzazione Input
 * Protegge da XSS, SQL Injection e input malevoli
 */

// Validazione Email
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  const isLengthValid = email.length >= 5 && email.length <= 100;
  
  return isValid && isLengthValid;
};

// Validazione Password
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

// Validazione Password per aggiornamento (senza middleware)
const validatePasswordUpdate = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

// Validazione Nome e Cognome
const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // Solo lettere, spazi, apostrofi e caratteri accentati
  const nameRegex = /^[a-zA-ZÀ-ÿ\s']{2,50}$/;
  return nameRegex.test(name.trim());
};

// Validazione Username
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  
  // Solo lettere minuscole, numeri e punti
  const usernameRegex = /^[a-z0-9.]+$/;
  const isLengthValid = username.length >= 3 && username.length <= 30;
  
  return usernameRegex.test(username) && isLengthValid;
};

// Sanitizzazione HTML (previene XSS)
const sanitizeHTML = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/&/g, '&amp;')
    .replace(/\//g, '&#x2F;');
};

// Sanitizzazione Bio/Testi lunghi
const sanitizeBio = (bio) => {
  if (!bio || typeof bio !== 'string') return '';
  
  // Rimuove script tags e altri tag pericolosi
  const cleanBio = bio
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // Limita lunghezza
  const maxLength = 500;
  const truncated = cleanBio.length > maxLength ? 
    cleanBio.substring(0, maxLength) + '...' : cleanBio;
  
  return sanitizeHTML(truncated);
};

// Validazione Strumenti
const validateInstruments = (instruments) => {
  if (!instruments || typeof instruments !== 'string') return false;
  
  const maxLength = 100;
  const cleanInstruments = instruments.trim();
  
  return cleanInstruments.length > 0 && cleanInstruments.length <= maxLength;
};

// Validazione generale per registrazione utente
const validateUserRegistration = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors = [];

  // Validazione Username
  if (!validateUsername(username)) {
    errors.push('Username deve contenere solo lettere minuscole, numeri e punti (3-30 caratteri)');
  }

  // Validazione Email
  if (!validateEmail(email)) {
    errors.push('Email non valida o troppo lunga (max 100 caratteri)');
  }

  // Validazione Password
  if (!validatePassword(password)) {
    errors.push('Password deve essere di almeno 8 caratteri con maiuscole, minuscole, numeri e simboli');
  }

  // Validazione Nome
  if (!validateName(firstName)) {
    errors.push('Nome deve contenere solo lettere (2-50 caratteri)');
  }

  // Validazione Cognome
  if (!validateName(lastName)) {
    errors.push('Cognome deve contenere solo lettere (2-50 caratteri)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validazione fallita',
      details: errors
    });
  }

  // Sanitizza gli input prima di procedere
  req.body.username = username.toLowerCase().trim();
  req.body.email = email.toLowerCase().trim();
  req.body.firstName = sanitizeHTML(firstName.trim());
  req.body.lastName = sanitizeHTML(lastName.trim());

  next();
};

// Validazione per creazione insegnante
const validateTeacherCreation = (req, res, next) => {
  const { email, firstName, lastName, instruments, bio } = req.body;
  const errors = [];

  // Validazione Email
  if (!validateEmail(email)) {
    errors.push('Email non valida o troppo lunga');
  }

  // Validazione Nome
  if (!validateName(firstName)) {
    errors.push('Nome deve contenere solo lettere (2-50 caratteri)');
  }

  // Validazione Cognome
  if (!validateName(lastName)) {
    errors.push('Cognome deve contenere solo lettere (2-50 caratteri)');
  }

  // Validazione Strumenti
  if (!validateInstruments(instruments)) {
    errors.push('Strumenti non validi o troppo lunghi');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validazione fallita',
      details: errors
    });
  }

  // Sanitizza gli input
  req.body.email = email.toLowerCase().trim();
  req.body.firstName = sanitizeHTML(firstName.trim());
  req.body.lastName = sanitizeHTML(lastName.trim());
  req.body.instruments = sanitizeHTML(instruments.trim());
  req.body.bio = sanitizeBio(bio || '');

  next();
};

// Validazione per richieste corsi
const validateCourseRequest = (req, res, next) => {
  const { name, email, courseType, message } = req.body;
  const errors = [];

  // Validazione Nome
  if (!validateName(name)) {
    errors.push('Nome deve contenere solo lettere (2-50 caratteri)');
  }

  // Validazione Email
  if (!validateEmail(email)) {
    errors.push('Email non valida');
  }

  // Validazione Tipo Corso
  if (!courseType || typeof courseType !== 'string' || courseType.trim().length === 0) {
    errors.push('Tipo di corso richiesto');
  }

  // Validazione Messaggio (opzionale ma se presente deve essere valido)
  if (message && typeof message === 'string' && message.trim().length > 1000) {
    errors.push('Messaggio troppo lungo (max 1000 caratteri)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validazione fallita',
      details: errors
    });
  }

  // Sanitizza gli input
  req.body.name = sanitizeHTML(name.trim());
  req.body.email = email.toLowerCase().trim();
  req.body.courseType = sanitizeHTML(courseType.trim());
  req.body.message = message ? sanitizeHTML(message.trim()) : '';

  next();
};

export {
  validateEmail,
  validatePassword,
  validatePasswordUpdate,
  validateName,
  validateUsername,
  sanitizeHTML,
  sanitizeBio,
  validateInstruments,
  validateUserRegistration,
  validateTeacherCreation,
  validateCourseRequest
};
