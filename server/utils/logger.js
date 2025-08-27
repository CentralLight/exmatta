/**
 * Sistema di Logging Sicuro per Produzione
 * Evita l'esposizione di dati sensibili nei log
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Logger sicuro per informazioni generali
 */
export const logInfo = (message, data = null) => {
  if (isProduction) {
    // In produzione, log solo messaggi senza dati sensibili
    console.log(`ℹ️  ${message}`);
  } else {
    // In sviluppo, log completo
    console.log(`ℹ️  ${message}`, data);
  }
};

/**
 * Logger sicuro per errori
 */
export const logError = (message, error = null) => {
  if (isProduction) {
    // In produzione, log solo messaggio e tipo di errore
    console.error(`❌ ${message}`);
    if (error) {
      console.error(`❌ Error type: ${error.constructor.name}`);
      console.error(`❌ Error message: ${error.message}`);
    }
  } else {
    // In sviluppo, log completo
    console.error(`❌ ${message}`, error);
  }
};

/**
 * Logger sicuro per warning
 */
export const logWarning = (message, data = null) => {
  if (isProduction) {
    // In produzione, log solo messaggio
    console.warn(`⚠️  ${message}`);
  } else {
    // In sviluppo, log completo
    console.warn(`⚠️  ${message}`, data);
  }
};

/**
 * Logger sicuro per successi
 */
export const logSuccess = (message, data = null) => {
  if (isProduction) {
    // In produzione, log solo messaggio
    console.log(`✅ ${message}`);
  } else {
    // In sviluppo, log completo
    console.log(`✅ ${message}`, data);
  }
};

/**
 * Logger sicuro per dati utente (sempre anonimi)
 */
export const logUserAction = (action, userId = null, role = null) => {
  if (isProduction) {
    // In produzione, log solo azione e ruolo (mai ID o dati personali)
    console.log(`👤 User Action: ${action} | Role: ${role || 'unknown'}`);
  } else {
    // In sviluppo, log completo
    console.log(`👤 User Action: ${action} | User ID: ${userId} | Role: ${role}`);
  }
};

/**
 * Logger sicuro per operazioni database
 */
export const logDatabaseOperation = (operation, table, result = null) => {
  if (isProduction) {
    // In produzione, log solo operazione e tabella
    console.log(`🗄️  DB Operation: ${operation} on ${table}`);
  } else {
    // In sviluppo, log completo
    console.log(`🗄️  DB Operation: ${operation} on ${table}`, result);
  }
};

export default {
  logInfo,
  logError,
  logWarning,
  logSuccess,
  logUserAction,
  logDatabaseOperation
};
