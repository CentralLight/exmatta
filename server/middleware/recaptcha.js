/**
 * Middleware reCAPTCHA v3
 * Verifica automaticamente i token reCAPTCHA per proteggere i form pubblici
 */

import axios from 'axios';
import { logSuccess, logWarning, logError } from '../utils/logger.js';

// Configurazione reCAPTCHA
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = process.env.RECAPTCHA_VERIFY_URL || 'https://www.google.com/recaptcha/api/siteverify';

// Validazione configurazione
if (!RECAPTCHA_SECRET_KEY) {
  console.error('❌ CRITICAL: RECAPTCHA_SECRET_KEY environment variable is not set!');
  console.error('❌ reCAPTCHA protection will be disabled');
}

/**
 * Middleware per verificare token reCAPTCHA
 * @param {number} minScore - Punteggio minimo accettabile (0.0 - 1.0)
 * @param {string} action - Azione specifica da verificare
 */
export const verifyRecaptcha = (minScore = 0.5, action = 'submit') => {
  return async (req, res, next) => {
    // Se reCAPTCHA non è configurato, salta la verifica
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn('⚠️  reCAPTCHA non configurato, verifica saltata');
      return next();
    }

    try {
      const { recaptchaToken } = req.body;

      // Verifica che il token sia presente
      if (!recaptchaToken) {
        return res.status(400).json({
          error: 'Token reCAPTCHA mancante',
          details: 'Il form richiede verifica reCAPTCHA'
        });
      }

      // Verifica il token con Google
      const verificationResponse = await axios.post(RECAPTCHA_VERIFY_URL, null, {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        }
      });

      const { success, score, action: verifiedAction, 'error-codes': errorCodes } = verificationResponse.data;

      // Verifica il risultato
      if (!success) {
        console.warn('❌ reCAPTCHA verification failed:', errorCodes);
        return res.status(400).json({
          error: 'Verifica reCAPTCHA fallita',
          details: 'Impossibile verificare la richiesta'
        });
      }

      // Verifica il punteggio
      if (score < minScore) {
        console.warn(`❌ reCAPTCHA score too low: ${score} < ${minScore}`);
        return res.status(400).json({
          error: 'Verifica reCAPTCHA fallita',
          details: 'Punteggio di sicurezza troppo basso'
        });
      }

      // Verifica l'azione
      if (verifiedAction !== action) {
        console.warn(`❌ reCAPTCHA action mismatch: ${verifiedAction} !== ${action}`);
        return res.status(400).json({
          error: 'Verifica reCAPTCHA fallita',
          details: 'Azione non autorizzata'
        });
      }

      // Verifica superata
      logSuccess('reCAPTCHA verification passed', { score, action: verifiedAction });
      
      // Aggiungi i dati reCAPTCHA alla richiesta per logging
      req.recaptchaData = { score, action: verifiedAction };
      
      next();

    } catch (error) {
      logError('Errore verifica reCAPTCHA', error.message);
      
      // In caso di errore, per sicurezza blocchiamo la richiesta
      return res.status(500).json({
        error: 'Errore verifica sicurezza',
        details: 'Impossibile completare la verifica reCAPTCHA'
      });
    }
  };
};

/**
 * Middleware per form pubblici (punteggio più permissivo)
 */
export const verifyPublicForm = verifyRecaptcha(0.3, 'submit');

/**
 * Middleware per operazioni critiche (punteggio più restrittivo)
 */
export const verifyCriticalAction = verifyRecaptcha(0.7, 'critical');

export default verifyRecaptcha;
