/**
 * Configurazione reCAPTCHA v3 per il frontend
 * 
 * IMPORTANTE: 
 * 1. Sostituire 'your-recaptcha-site-key-here' con la chiave reale
 * 2. La chiave del sito è pubblica e può essere inclusa nel frontend
 * 3. La chiave segreta deve rimanere solo nel backend
 */

export const recaptchaConfig = {
  // Chiave pubblica del sito (visibile nel frontend)
  SITE_KEY: 'your-recaptcha-site-key-here',
  
  // URL di verifica (sempre lo stesso)
  VERIFY_URL: 'https://www.google.com/recaptcha/api/siteverify',
  
  // Azioni predefinite
  ACTIONS: {
    SUBMIT: 'submit',           // Form pubblici
    CRITICAL: 'critical',       // Operazioni critiche
    LOGIN: 'login',             // Accessi
    REGISTRATION: 'registration' // Registrazioni
  },
  
  // Punteggi minimi per azioni
  MIN_SCORES: {
    SUBMIT: 0.3,        // Form pubblici (più permissivo)
    CRITICAL: 0.7,      // Operazioni critiche (più restrittivo)
    LOGIN: 0.5,          // Accessi (medio)
    REGISTRATION: 0.6    // Registrazioni (medio-alto)
  }
};

/**
 * Verifica se reCAPTCHA è configurato correttamente
 */
export const isRecaptchaConfigured = () => {
  return recaptchaConfig.SITE_KEY !== 'your-recaptcha-site-key-here';
};

/**
 * Ottiene la chiave del sito per l'uso
 */
export const getSiteKey = () => {
  if (!isRecaptchaConfigured()) {
    console.warn('⚠️  reCAPTCHA non configurato, usando chiave di test');
    return '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Chiave di test Google
  }
  return recaptchaConfig.SITE_KEY;
};

export default recaptchaConfig;
