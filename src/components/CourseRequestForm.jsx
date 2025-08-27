/**
 * CourseRequestForm - Componente per la richiesta di informazioni sui corsi musicali
 * 
 * Questo componente gestisce:
 * - Form di richiesta con validazione
 * - Invio dati al backend
 * - Gestione stati di loading e errori
 * - Feedback utente tramite toast
 * - Chiusura automatica del form dopo successo
 * - Protezione reCAPTCHA v3
 */
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { courseService } from '../services/api'
import { useRecaptcha } from '../hooks/useRecaptcha'

const CourseRequestForm = ({ onClose, onSuccess, toast, selectedTeacher }) => {
  // Hook reCAPTCHA
  const { executeForPublicForm } = useRecaptcha();
  
  // Stato del form con valori iniziali
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: '',
    tipoCorso: selectedTeacher ? selectedTeacher.instrument : '',
    livello: 'Principiante',
    messaggio: '',
    preferenzaContatto: 'email'
  })
  
  // Stato per gestire il loading durante l'invio
  const [loading, setLoading] = useState(false)

  // Aggiorna il tipo di corso quando cambia l'insegnante selezionato
  useEffect(() => {
    if (selectedTeacher) {
      setFormData(prev => ({
        ...prev,
        tipoCorso: selectedTeacher.instruments
      }))
    }
  }, [selectedTeacher])

  /**
   * Gestisce i cambiamenti nei campi del form
   * @param {Event} e - Evento di cambio input
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Gestisce l'invio del form
   * - Valida i dati
   * - Genera token reCAPTCHA
   * - Invia la richiesta al backend
   * - Gestisce successo/errore
   * - Chiude il form e mostra feedback
   * @param {Event} e - Evento di submit del form
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Timeout di sicurezza per evitare che l'utente aspetti troppo
    const timeoutId = setTimeout(() => {
      setLoading(false)
      toast.showError('Timeout: La richiesta sta impiegando troppo tempo. Riprova.')
    }, 10000) // 10 secondi di timeout
    
    try {
      // Genera token reCAPTCHA prima dell'invio
      const recaptchaToken = await executeForPublicForm();
      
      // Invio della richiesta corso al backend con token reCAPTCHA
      const response = await courseService.create({
        nome: formData.nome,
        email: formData.email,
        telefono: formData.telefono || 'Non fornito',
        strumento: formData.tipoCorso,
        livello: formData.livello,
        descrizione: formData.messaggio,
        teacher_id: selectedTeacher?.id || null,
        recaptchaToken // Aggiungo il token reCAPTCHA
      })
      
      clearTimeout(timeoutId) // Cancella il timeout se la richiesta va a buon fine
      
      if (response && response.success) {
        // Richiesta completata con successo
        // Chiudo immediatamente il form per feedback istantaneo
        onSuccess && onSuccess()
        onClose()
        
        // Mostro il toast di conferma dopo la chiusura del form
        setTimeout(() => {
          toast.showSuccess('Richiesta corso inviata con successo! Ti contatteremo presto.')
        }, 100) // Piccolo delay per assicurarsi che il form sia chiuso
      } else {
        // Errore nella risposta API
        toast.showError('Errore durante l\'invio. Riprova.')
      }
    } catch (error) {
      // Errore di connessione o altro errore
      clearTimeout(timeoutId)
      console.error('Errore richiesta corso:', error)
      toast.showError('Errore di connessione. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Overlay di sfondo per il modal
    <motion.div 
      className="course-request-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Modal principale del form */}
      <motion.div 
        className="course-request-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal con titolo e pulsante chiusura */}
        <div className="modal-header">
          <h2>📚 Richiesta Informazioni Corsi</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {/* Form principale per la richiesta */}
        <form onSubmit={handleSubmit} className="course-form">
          {/* Campo Nome e Cognome - obbligatorio */}
          <div className="form-group">
            <label htmlFor="nome">Nome e Cognome *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Il tuo nome completo"
            />
          </div>

          {/* Campo Email - obbligatorio */}
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="la-tua-email@esempio.com"
            />
          </div>

          {/* Campo Telefono - opzionale */}
          <div className="form-group">
            <label htmlFor="telefono">Telefono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Il tuo numero di telefono"
            />
          </div>

          {/* Selezione tipo di corso - obbligatorio */}
          <div className="form-group">
            <label htmlFor="tipoCorso">Tipo di Corso *</label>
            <select
              id="tipoCorso"
              name="tipoCorso"
              value={formData.tipoCorso}
              onChange={handleChange}
              required
            >
              <option value="">Seleziona un tipo di corso</option>
              <option value="Chitarra">Chitarra</option>
              <option value="Ukulele">Ukulele</option>
              <option value="Basso">Basso</option>
              <option value="Batteria">Batteria</option>
              <option value="Pianoforte">Pianoforte</option>
              <option value="Voce">Voce</option>
            </select>
          </div>

          {/* Selezione livello - obbligatorio */}
          <div className="form-group">
            <label htmlFor="livello">Livello *</label>
            <select
              id="livello"
              name="livello"
              value={formData.livello}
              onChange={handleChange}
              required
            >
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzato">Avanzato</option>
            </select>
          </div>

          {/* Campo messaggio/descrizione - obbligatorio */}
          <div className="form-group">
            <label htmlFor="messaggio">Messaggio *</label>
            <textarea
              id="messaggio"
              name="messaggio"
              value={formData.messaggio}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Descrivi cosa ti interessa sapere sui nostri corsi..."
            />
          </div>

          {/* Selezione preferenza di contatto - opzionale */}
          <div className="form-group">
            <label htmlFor="preferenzaContatto">Preferenza di Contatto</label>
            <select
              id="preferenzaContatto"
              name="preferenzaContatto"
              value={formData.preferenzaContatto}
              onChange={handleChange}
            >
              <option value="email">Email</option>
              <option value="telefono">Telefono</option>
              <option value="entrambi">Entrambi</option>
            </select>
          </div>

          {/* Pulsanti di azione */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={loading}
            >
              Annulla
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Invio in corso...' : 'Invia Richiesta'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default CourseRequestForm
