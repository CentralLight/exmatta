import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useToast from '../hooks/useToast'

const GestioneDisponibilita = () => {
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [blockToDelete, setBlockToDelete] = useState(null)
  const toast = useToast()

  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: ''
  })

  // Load availability blocks on component mount
  useEffect(() => {
    loadBlocks()
  }, [])

  const loadBlocks = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/bookings/availability-blocks')
      if (response.ok) {
        const data = await response.json()
        setBlocks(data)
      } else {
        throw new Error('Failed to load blocks')
      }
    } catch (error) {
      console.error('Error loading blocks:', error)
      toast.showError('Errore nel caricamento dei blocchi di disponibilità')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      reason: ''
    })
    setEditingBlock(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingBlock 
        ? `http://localhost:3001/api/bookings/availability-blocks/${editingBlock.id}`
        : 'http://localhost:3001/api/bookings/availability-blocks'
      
      const method = editingBlock ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.showSuccess(editingBlock ? 'Blocco aggiornato con successo' : 'Blocco creato con successo')
        setShowForm(false)
        resetForm()
        loadBlocks()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore durante l\'operazione')
      }
    } catch (error) {
      console.error('Error saving block:', error)
      toast.showError(error.message || 'Errore durante il salvataggio')
    }
  }

  const handleEdit = (block) => {
    setEditingBlock(block)
    setFormData({
      start_date: block.start_date,
      end_date: block.end_date,
      start_time: block.start_time || '',
      end_time: block.end_time || '',
      reason: block.reason
    })
    setShowForm(true)
  }

  const handleDelete = async (blockId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/availability-blocks/${blockId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.showSuccess('Blocco eliminato con successo')
        loadBlocks()
      } else {
        throw new Error('Failed to delete block')
      }
    } catch (error) {
      console.error('Error deleting block:', error)
      toast.showError('Errore durante l\'eliminazione')
    }
    setShowDeleteModal(false)
    setBlockToDelete(null)
  }

  const confirmDelete = (block) => {
    setBlockToDelete(block)
    setShowDeleteModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'Tutto il giorno'
    return timeString
  }

  const getBlockDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 1 ? '1 giorno' : `${diffDays} giorni`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Caricamento blocchi di disponibilità...</p>
      </div>
    )
  }

  return (
    <div className="gestione-disponibilita">
      <div className="page-header">
        <h1>🚫 Gestione Blocchi di Disponibilità</h1>
        <p>Gestisci i periodi in cui la sala prove non è disponibile</p>
      </div>

      <div className="actions-bar">
        <button 
          className="btn-primary"
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          ➕ Nuovo Blocco
        </button>
      </div>

      {/* Blocks List */}
      <div className="blocks-container">
        {blocks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>Nessun blocco di disponibilità</h3>
            <p>Crea il primo blocco per gestire i periodi di indisponibilità della sala</p>
          </div>
        ) : (
          <div className="blocks-grid">
            {blocks.map((block) => (
              <motion.div
                key={block.id}
                className="block-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="block-header">
                  <div className="block-dates">
                    <span className="block-date">
                      {formatDate(block.start_date)} - {formatDate(block.end_date)}
                    </span>
                    <span className="block-duration">
                      {getBlockDuration(block.start_date, block.end_date)}
                    </span>
                  </div>
                  <div className="block-time">
                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                  </div>
                </div>
                
                <div className="block-reason">
                  <strong>Motivo:</strong> {block.reason}
                </div>
                
                <div className="block-footer">
                  <span className="block-created">
                    Creato da: {block.created_by_username || 'Admin'}
                  </span>
                  <div className="block-actions">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEdit(block)}
                    >
                      ✏️ Modifica
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => confirmDelete(block)}
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <h2>{editingBlock ? 'Modifica Blocco' : 'Nuovo Blocco di Disponibilità'}</h2>
                <button 
                  className="modal-close"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="block-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_date">Data Inizio *</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="end_date">Data Fine *</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_time">Orario Inizio (opzionale)</label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                    />
                    <small>Lascia vuoto per bloccare tutto il giorno</small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="end_time">Orario Fine (opzionale)</label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                    />
                    <small>Lascia vuoto per bloccare tutto il giorno</small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Motivo del Blocco *</label>
                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    placeholder="Es: Manutenzione impianti, Evento speciale, Chiusura per ferie..."
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => {
                      setShowForm(false)
                      resetForm()
                    }}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingBlock ? 'Aggiorna Blocco' : 'Crea Blocco'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content delete-confirmation"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <h2>🗑️ Conferma Eliminazione</h2>
              </div>
              
              <div className="modal-body">
                <p>
                  Sei sicuro di voler eliminare il blocco di disponibilità per il periodo:
                </p>
                <div className="delete-details">
                  <strong>
                    {blockToDelete && formatDate(blockToDelete.start_date) + ' - ' + formatDate(blockToDelete.end_date)}
                  </strong>
                  <br />
                  <em>Motivo: {blockToDelete?.reason}</em>
                </div>
                <p className="warning-text">
                  ⚠️ Questa azione non può essere annullata e renderà nuovamente disponibili le date bloccate.
                </p>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setBlockToDelete(null)
                  }}
                >
                  Annulla
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(blockToDelete.id)}
                >
                  🗑️ Elimina Definitivamente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GestioneDisponibilita
