import { useCallback } from 'react';
import { getSiteKey } from '../config/recaptcha';

/**
 * Hook personalizzato per gestire reCAPTCHA v3
 * Fornisce funzioni per eseguire e verificare token reCAPTCHA
 */
export const useRecaptcha = () => {
  // Verifica che reCAPTCHA sia disponibile
  const isRecaptchaAvailable = () => {
    return typeof window !== 'undefined' && 
           window.grecaptcha && 
           window.grecaptcha.ready;
  };

  /**
   * Esegue reCAPTCHA e restituisce un token
   * @param {string} action - Azione da eseguire (default: 'submit')
   * @returns {Promise<string>} Token reCAPTCHA
   */
  const executeRecaptcha = useCallback(async (action = 'submit') => {
    if (!isRecaptchaAvailable()) {
      console.warn('⚠️  reCAPTCHA non disponibile, restituisco token fittizio');
      return 'recaptcha-not-available';
    }

    try {
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          const siteKey = getSiteKey(); // Usa la configurazione centralizzata
          
          window.grecaptcha.execute(siteKey, { action })
            .then(token => {
              // Token reCAPTCHA generato per azione - log rimosso per sicurezza
              resolve(token);
            })
            .catch(error => {
              console.error('❌ Errore generazione token reCAPTCHA:', error);
              reject(error);
            });
        });
      });
    } catch (error) {
      console.error('❌ Errore esecuzione reCAPTCHA:', error);
      throw error;
    }
  });

  /**
   * Esegue reCAPTCHA per form pubblici
   * @returns {Promise<string>} Token reCAPTCHA
   */
  const executeForPublicForm = useCallback(async () => {
    return executeRecaptcha('submit');
  });

  /**
   * Esegue reCAPTCHA per azioni critiche
   * @returns {Promise<string>} Token reCAPTCHA
   */
  const executeForCriticalAction = useCallback(async () => {
    return executeRecaptcha('critical');
  });

  return {
    isRecaptchaAvailable,
    executeRecaptcha,
    executeForPublicForm,
    executeForCriticalAction
  };
};

export default useRecaptcha;
