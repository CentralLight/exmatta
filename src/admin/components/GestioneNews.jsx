/**
 * GestioneNews - Componente per la gestione delle news nell'admin panel
 * 
 * Questo componente gestisce:
 * - Visualizzazione lista news dal database
 * - Creazione nuove news
 * - Modifica news esistenti
 * - Eliminazione news con conferma
 * - Gestione stati (Bozza, Pubblicato, Archiviato)
 * - Form integrato per creazione/modifica
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { newsService } from '../../services/api'

export default function GestioneNews({ toast }) {
  // Stato per la lista delle news
  const [news, setNews] = useState([])
  
  // Stato per mostrare/nascondere il form
  const [showForm, setShowForm] = useState(false)
  
  // Stato per la news in modifica (null se creazione nuova)
  const [editingNews, setEditingNews] = useState(null)
  
  // Stato per la conferma di eliminazione
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  // Stato del form con valori iniziali
  const [formData, setFormData] = useState({
    titolo: '',
    sottotitolo: '',
    descrizione: '',
    stato: 'Bozza',
    image: null
  })

  // Carica le news dal database all'avvio del componente
  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await newsService.getAll()
        
        if (response && response.success && response.news) {
          setNews(response.news)
        } else {
          setNews([])
        }
      } catch (error) {
        console.error('Errore nel caricamento news:', error)
        setNews([])
      }
    }
    
    loadNews()
  }, [])

  // Array degli stati possibili per le news
  const stati = ['Bozza', 'Pubblicato', 'Archiviato']

  /**
   * Gestisce i cambiamenti nei campi del form
   * @param {Event} e - Evento di cambio input
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Gestisce l'invio del form per creazione o modifica
   * - Valida i dati obbligatori
   * - Invia la richiesta al backend
   * - Aggiorna la lista locale
   * - Mostra feedback utente
   * @param {Event} e - Evento di submit del form
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titolo || !formData.descrizione) {
      toast.showError('Titolo e descrizione sono obbligatori', 3000)
      return
    }

    if (formData.descrizione.length > 1000) {
      toast.showError('La descrizione non può superare 1000 caratteri', 3000)
      return
    }

    try {
      // Crea FormData per gestire l'upload del file
      const formDataToSend = new FormData();
      formDataToSend.append('titolo', formData.titolo);
      formDataToSend.append('sottotitolo', formData.sottotitolo);
      formDataToSend.append('descrizione', formData.descrizione);
      formDataToSend.append('stato', formData.stato);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingNews) {
        // Modifica news esistente
        const response = await newsService.update(editingNews.id, formDataToSend)
        
        if (response.success) {
          // Aggiorna la lista locale
          const updatedNews = news.map(item => 
            item.id === editingNews.id 
              ? { 
                  ...item, 
                  titolo: formData.titolo,
                  sottotitolo: formData.sottotitolo,
                  descrizione: formData.descrizione,
                  stato: formData.stato,
                  updated_at: new Date().toISOString()
                }
              : item
          )
          setNews(updatedNews)
          toast.showSuccess('News modificata con successo!', 3000)
        }
      } else {
        // Crea nuova news
        const response = await newsService.create(formDataToSend)
        
        if (response.success) {
          // Aggiorna la lista locale
          const newNews = {
            id: response.articleId,
            titolo: formData.titolo,
            sottotitolo: formData.sottotitolo,
            descrizione: formData.descrizione,
            stato: formData.stato,
            created_at: new Date().toISOString()
          }
          setNews([newNews, ...news])
          toast.showSuccess('News creata con successo!', 3000)
        }
      }
      
      // Reset form
      setFormData({
        titolo: '',
        sottotitolo: '',
        descrizione: '',
        stato: 'Bozza'
      })
      setShowForm(false)
      setEditingNews(null)
      
    } catch (error) {
      console.error('Errore durante il salvataggio:', error)
      toast.showError('Errore durante il salvataggio. Riprova.', 3000)
    }
  }

  /**
   * Prepara il form per la modifica di una news esistente
   * @param {Object} newsItem - Oggetto news da modificare
   */
  const handleEdit = (newsItem) => {
    setEditingNews(newsItem)
    setFormData({
      titolo: newsItem.titolo,
      sottotitolo: newsItem.sottotitolo,
      descrizione: newsItem.descrizione,
      stato: newsItem.stato,
      image: null // Reset immagine per nuova selezione
    })
    setShowForm(true)
  }

  /**
   * Gestisce l'eliminazione diretta (metodo legacy)
   * @param {number} id - ID della news da eliminare
   */
  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa news?')) {
      try {
        const response = await newsService.delete(id)
        if (response.success) {
          setNews(news.filter(item => item.id !== id))
          toast.showSuccess('News eliminata con successo!', 3000)
        }
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error)
        toast.showError('Errore durante l\'eliminazione. Riprova.', 3000)
      }
    }
  }

  /**
   * Mostra il banner di conferma per l'eliminazione
   * @param {Object} newsItem - Oggetto news da eliminare
   */
  const showDeleteConfirm = (newsItem) => {
    setDeleteConfirm(newsItem)
  }

  /**
   * Conferma l'eliminazione della news selezionata
   * - Elimina dal database
   * - Aggiorna la lista locale
   * - Nasconde il banner di conferma
   */
  const confirmDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      const response = await newsService.delete(deleteConfirm.id)
      if (response.success) {
        setNews(news.filter(item => item.id !== deleteConfirm.id))
        toast.showSuccess('News eliminata con successo!', 3000)
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error)
      toast.showError('Errore durante l\'eliminazione. Riprova.', 3000)
    }
  }

  /**
   * Resetta il form e torna alla visualizzazione lista
   */
  const resetForm = () => {
    setFormData({
      titolo: '',
      sottotitolo: '',
      descrizione: '',
      stato: 'Bozza',
      image: null
    })
    setEditingNews(null)
    setShowForm(false)
  }

  /**
   * Calcola il numero di caratteri nel campo descrizione
   * @returns {number} Numero di caratteri attuali
   */
  const getCharacterCount = () => {
    return formData.descrizione.length
  }

  return (
    <div className="gestione-news">
      <div className="news-header">
        <h2>📰 Gestione News</h2>
        <p>Gestisci gli articoli e le comunicazioni per i soci</p>
        
        <button 
          className="add-news-btn"
          onClick={() => setShowForm(true)}
        >
          ✨ Nuova News
        </button>
      </div>

      {/* Form per creare/modificare news */}
      {showForm && (
        <motion.div 
          className="news-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="news-form-container">
            <div className="form-header">
              <h3>{editingNews ? 'Modifica News' : 'Crea Nuova News'}</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowForm(false)}
                aria-label="Chiudi form"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="news-form">
              <div className="form-group">
                <label htmlFor="news-titolo">Titolo *</label>
                <input
                  type="text"
                  id="news-titolo"
                  name="titolo"
                  value={formData.titolo}
                  onChange={handleInputChange}
                  required
                  placeholder="Titolo dell'articolo"
                  maxLength={100}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="news-sottotitolo">Sottotitolo (opzionale)</label>
                  <input
                    type="text"
                    id="news-sottotitolo"
                    name="sottotitolo"
                    value={formData.sottotitolo}
                    onChange={handleInputChange}
                    placeholder="Sottotitolo dell'articolo"
                    maxLength={150}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="news-image">Immagine (opzionale, 16:9)</label>
                  <input
                    type="file"
                    id="news-image"
                    name="image"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Validazione dimensione (5MB max)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.showError('L\'immagine non può superare 5MB', 3000);
                          e.target.value = '';
                          return;
                        }
                        setFormData(prev => ({ ...prev, image: file }));
                      }
                    }}
                  />
                  <small className="form-help">
                    Formati supportati: JPG, PNG, GIF, WebP. Dimensione max: 5MB
                  </small>
                  {formData.image && (
                    <div className="image-preview">
                      <img 
                        src={URL.createObjectURL(formData.image)} 
                        alt="Anteprima" 
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }}
                      />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                      >
                        ❌ Rimuovi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="news-stato">Stato</label>
                <select
                  id="news-stato"
                  name="stato"
                  value={formData.stato}
                  onChange={handleInputChange}
                >
                  {stati.map(stato => (
                    <option key={stato} value={stato}>{stato}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="news-descrizione">
                  Descrizione * (max 1000 caratteri)
                  <span className="char-count">{getCharacterCount()}/1000</span>
                </label>
                <textarea
                  id="news-descrizione"
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleInputChange}
                  required
                  placeholder="Contenuto dell'articolo..."
                  rows={8}
                  maxLength={1000}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  ❌ Annulla
                </button>
                <button type="submit" className="submit-btn">
                  {editingNews ? '✏️ Modifica News' : '✨ Crea News'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Lista delle news esistenti */}
      <div className="news-list">
        <h3>News Esistenti ({news.length})</h3>
        
        {news.length === 0 ? (
          <div className="no-news-message">
            <p>Nessuna news presente. Crea la prima news per iniziare!</p>
          </div>
        ) : (
          <div className="news-grid-admin">
            {news.map((newsItem) => (
              <div key={newsItem.id} className="news-card-admin">
                
                <div className="news-content-admin">
                  <div className="news-item-header">
                    <div className="news-title-section">
                      <h3 className="news-title">{newsItem.titolo}</h3>
                      <span className={`news-status status-${newsItem.stato.toLowerCase()}`}>
                        {newsItem.stato}
                      </span>
                    </div>
                    <div className="news-meta">
                      <span className="news-date">
                        {newsItem.published_at ? new Date(newsItem.published_at).toLocaleDateString('it-IT') : 
                         newsItem.created_at ? new Date(newsItem.created_at).toLocaleDateString('it-IT') : 'Data non disponibile'}
                      </span>
                    </div>
                  </div>
                  {newsItem.sottotitolo && (
                    <p className="news-subtitle-admin">{newsItem.sottotitolo}</p>
                  )}
                  
                  {/* Mostra immagine se presente */}
                  {newsItem.image_filename && (
                    <div className="news-image-admin">
                      <img 
                        src={`/images/news/${newsItem.image_filename}`} 
                        alt={newsItem.titolo}
                        style={{ 
                          width: '100%', 
                          height: '120px', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '10px'
                        }}
                      />
                    </div>
                  )}
                  
                  <p className="news-excerpt-admin">
                    {newsItem.descrizione && newsItem.descrizione.length > 150 
                      ? `${newsItem.descrizione.substring(0, 150)}...` 
                      : newsItem.descrizione || 'Nessuna descrizione disponibile'
                    }
                  </p>
                  
                  <div className="news-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(newsItem)}
                    >
                      ✏️ Modifica
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => showDeleteConfirm(newsItem)}
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner di conferma eliminazione */}
      {deleteConfirm && (
        <motion.div 
          className="delete-confirmation-banner"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
        >
          <div className="banner-content">
            <div className="banner-icon">⚠️</div>
            <div className="banner-text">
              <h3>Conferma Eliminazione</h3>
              <p>Sei sicuro di voler eliminare la news "{deleteConfirm.titolo} "?</p>
              <p className="banner-warning">Questa azione non può essere annullata.</p>
            </div>
            <div className="banner-actions">
              <button 
                className="cancel-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                Annulla
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={confirmDelete}
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
