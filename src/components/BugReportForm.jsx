import React, { useState } from 'react';
import { useRecaptcha } from '../hooks/useRecaptcha';

export default function BugReportForm({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Hook reCAPTCHA
  const { executeForPublicForm } = useRecaptcha();

  // Funzione per rilevare automaticamente browser e OS
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let osName = 'Unknown';

    // Rileva il browser
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      if (match) browserVersion = match[1];
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      if (match) browserVersion = match[1];
    } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      if (match) browserVersion = match[1];
    } else if (userAgent.indexOf('Edg') > -1) {
      browserName = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      if (match) browserVersion = match[1];
    }

    // Rileva il sistema operativo
    if (userAgent.indexOf('Windows') > -1) {
      osName = 'Windows';
      if (userAgent.indexOf('Windows NT 10.0') > -1) osName += ' 10/11';
      else if (userAgent.indexOf('Windows NT 6.3') > -1) osName += ' 8.1';
      else if (userAgent.indexOf('Windows NT 6.2') > -1) osName += ' 8';
      else if (userAgent.indexOf('Windows NT 6.1') > -1) osName += ' 7';
    } else if (userAgent.indexOf('Mac') > -1) {
      osName = 'macOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      osName = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      osName = 'Android';
    } else if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
      osName = 'iOS';
    }

    return `${browserName} ${browserVersion} / ${osName}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      alert('Per favore, descrivi il problema che hai riscontrato.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Genera token reCAPTCHA prima dell'invio
      const recaptchaToken = await executeForPublicForm();
      
      const browserInfo = getBrowserInfo();
      
      const response = await fetch('http://localhost:3001/api/bug-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: formData.description.trim(),
          browser_info: browserInfo,
          recaptchaToken // Aggiungo il token reCAPTCHA
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setShowSuccess(true);
        setFormData({ description: '' });
        
        // Mostra il messaggio di successo per 3 secondi
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Errore durante l\'invio');
      }
    } catch (error) {
      console.error('Errore durante l\'invio:', error);
      alert('Si è verificato un errore durante l\'invio della segnalazione. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

    if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className={`bug-report-overlay ${isOpen ? 'active' : 'hidden'}`}>
        <div className="bug-report-modal success">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>Grazie per la tua segnalazione!</h2>
            <p>Il tuo report è stato inviato con successo. Il nostro team lo esaminerà al più presto.</p>
            <div className="success-details">
              <p><strong>Sistema rilevato:</strong> {getBrowserInfo()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bug-report-overlay ${isOpen ? 'active' : 'hidden'}`}>
      <div className="bug-report-modal">
        <div className="modal-header">
          <h2>🐛 Segnala un Problema</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-intro">
            <p>Hai riscontrato un problema nel sito? Segnalacelo e lo risolveremo al più presto!</p>
            <div className="auto-detect-info">
              <strong>🌐 Sistema rilevato automaticamente:</strong>
              <span className="browser-info">{getBrowserInfo()}</span>
            </div>
          </div>

          <form className="bug-report-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="description">
                Descrizione del problema *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrivi dettagliatamente il problema che hai riscontrato. Ad esempio: 'Il pulsante per prenotare la sala non funziona' oppure 'La pagina si carica lentamente su mobile'..."
                rows={6}
                required
                disabled={isSubmitting}
              />
              <small className="char-count">
                {formData.description.length}/1000 caratteri
              </small>
            </div>

            <div className="privacy-notice">
              <p>
                <strong>📋 Nota sulla privacy:</strong> Non raccogliamo email o dati personali. 
                Le informazioni del browser vengono rilevate automaticamente per aiutarci a risolvere il problema.
              </p>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annulla
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting || !formData.description.trim()}
              >
                {isSubmitting ? '⏳ Invio in corso...' : '📤 Invia Segnalazione'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
