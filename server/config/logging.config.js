/**
 * Configurazione Logging Sicuro per Produzione
 * Definisce cosa loggare e cosa nascondere in base all'ambiente
 */

export const loggingConfig = {
  // Livello di logging per ambiente
  levels: {
    development: 'debug',    // Log completo
    staging: 'info',         // Log informativi
    production: 'warn'       // Solo warning ed errori
  },
  
  // Cosa NON loggare mai (nemmeno in sviluppo)
  neverLog: [
    'password',
    'password_hash',
    'jwt_secret',
    'api_key',
    'secret_key',
    'private_key',
    'access_token',
    'refresh_token',
    'session_id',
    'user_id',
    'email',
    'phone',
    'address',
    'personal_data'
  ],
  
  // Cosa loggare solo in sviluppo
  developmentOnly: [
    'database_queries',
    'request_body',
    'response_data',
    'user_details',
    'debug_info',
    'performance_metrics'
  ],
  
  // Cosa loggare sempre (anche in produzione)
  alwaysLog: [
    'security_events',
    'authentication_failures',
    'authorization_denials',
    'rate_limit_exceeded',
    'system_errors',
    'critical_operations'
  ],
  
  // Formato log per produzione
  productionFormat: {
    timestamp: true,
    level: true,
    message: true,
    category: true,
    // NO dati sensibili
    noPersonalData: true,
    noCredentials: true,
    noInternalPaths: true
  }
};

/**
 * Verifica se un campo è sicuro da loggare
 */
export const isFieldSafeToLog = (fieldName) => {
  const lowerField = fieldName.toLowerCase();
  return !loggingConfig.neverLog.some(unsafe => 
    lowerField.includes(unsafe)
  );
};

/**
 * Sanitizza un oggetto per il logging
 */
export const sanitizeForLogging = (obj, isProduction = false) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isFieldSafeToLog(key)) {
      if (isProduction && typeof value === 'string' && value.length > 100) {
        // In produzione, tronca stringhe lunghe
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    } else {
      // Campo non sicuro, sostituisci con placeholder
      sanitized[key] = '[HIDDEN]';
    }
  }
  
  return sanitized;
};

export default loggingConfig;
