import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function PrenotazioniManager() {
  const [prenotazioni, setPrenotazioni] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrenotazione, setNewPrenotazione] = useState({
    nome: '',
    telefono: '',
    email: '',
    data: '',
    ora: '',
    durata: 1,
    note: ''
  })

  // Mock data for demo
  useEffect(() => {
    setPrenotazioni([
      {
        id: 1,
        nome: 'Luca Bianchi',
        telefono: '333 123 4567',
        email: 'luca.bianchi@email.com',
        data: '2024-08-16',
        ora: '14:00',
        durata: 2,
        note: 'Prove con la band',
        status: 'confirmed'
      },
      {
        id: 2,
        nome: 'Marco Rossi',
        telefono: '333 987 6543',
        email: 'marco.rossi@email.com',
        data: '2024-08-16',
        ora: '16:00',
        durata: 1,
        note: 'Sessione individuale',
        status: 'confirmed'
      },
      {
        id: 3,
        nome: 'Anna Verdi',
        telefono: '333 555 1234',
        email: 'anna.verdi@email.com',
        data: '2024-08-17',
        ora: '10:00',
        durata: 3,
        note: 'Registrazione demo',
        status: 'pending'
      }
    ])
  }, [])

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 9
    return `${hour.toString().padStart(2, '0')}:00`
  })

  const getCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    // Add previous month days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift({ date: prevDate, isCurrentMonth: false })
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }
    
    // Add next month days to complete the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({ date: nextDate, isCurrentMonth: false })
    }
    
    return days
  }

  const getPrenotazioniForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return prenotazioni.filter(p => p.data === dateStr)
  }

  const handleAddPrenotazione = (e) => {
    e.preventDefault()
    const newId = Math.max(...prenotazioni.map(p => p.id)) + 1
    const prenotazione = {
      ...newPrenotazione,
      id: newId,
      status: 'confirmed'
    }
    setPrenotazioni(prev => [...prev, prenotazione])
    setNewPrenotazione({
      nome: '',
      telefono: '',
      email: '',
      data: '',
      ora: '',
      durata: 1,
      note: ''
    })
    setShowAddForm(false)
  }

  const handleDeletePrenotazione = (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      setPrenotazioni(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleStatusChange = (id, newStatus) => {
    setPrenotazioni(prev => prev.map(p => 
      p.id === id ? { ...p, status: newStatus } : p
    ))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'green'
      case 'pending': return 'orange'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confermata'
      case 'pending': return 'In Attesa'
      case 'cancelled': return 'Cancellata'
      default: return 'Sconosciuto'
    }
  }

  return (
    <div className="prenotazioni-manager">
      <motion.div 
        className="manager-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Gestione Prenotazioni Sala Prove</h1>
        <p>Gestisci il calendario delle prenotazioni della sala prove</p>
      </motion.div>

      {/* Controls */}
      <motion.div 
        className="manager-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <button
          className="add-btn"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Nuova Prenotazione
        </button>
        
        <div className="view-controls">
          <button className="view-btn active">Calendario</button>
          <button className="view-btn">Lista</button>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div 
        className="calendar-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="calendar-header">
          <button 
            className="calendar-nav-btn"
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
          >
            ←
          </button>
          <h3 className="calendar-month">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </h3>
          <button 
            className="calendar-nav-btn"
            onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
          >
            →
          </button>
        </div>
        
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            <div>Dom</div>
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Gio</div>
            <div>Ven</div>
            <div>Sab</div>
          </div>
          
          <div className="calendar-days">
            {getCalendarDays().map((day, index) => {
              const dayPrenotazioni = getPrenotazioniForDate(day.date)
              const isToday = day.date.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
                    isToday ? 'today' : ''
                  } ${dayPrenotazioni.length > 0 ? 'has-bookings' : ''}`}
                  onClick={() => {
                    if (day.isCurrentMonth) {
                      setSelectedDate(day.date)
                    }
                  }}
                >
                  <span className="day-number">{day.date.getDate()}</span>
                  {dayPrenotazioni.length > 0 && (
                    <div className="day-bookings">
                      {dayPrenotazioni.slice(0, 2).map(p => (
                        <div 
                          key={p.id} 
                          className={`booking-dot ${getStatusColor(p.status)}`}
                          title={`${p.nome} - ${p.ora} (${p.durata}h)`}
                        />
                      ))}
                      {dayPrenotazioni.length > 2 && (
                        <span className="more-bookings">+{dayPrenotazioni.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* Selected Date Bookings */}
      <motion.div 
        className="date-bookings"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3>Prenotazioni per {selectedDate.toLocaleDateString('it-IT', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h3>
        
        <div className="bookings-list">
          {getPrenotazioniForDate(selectedDate).map((prenotazione) => (
            <div key={prenotazione.id} className="booking-card">
              <div className="booking-header">
                <h4>{prenotazione.nome}</h4>
                <span className={`status-badge ${getStatusColor(prenotazione.status)}`}>
                  {getStatusLabel(prenotazione.status)}
                </span>
              </div>
              
              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Orario:</span>
                  <span className="detail-value">{prenotazione.ora} ({prenotazione.durata}h)</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Telefono:</span>
                  <span className="detail-value">{prenotazione.telefono}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{prenotazione.email}</span>
                </div>
                {prenotazione.note && (
                  <div className="detail-row">
                    <span className="detail-label">Note:</span>
                    <span className="detail-value">{prenotazione.note}</span>
                  </div>
                )}
              </div>
              
              <div className="booking-actions">
                <button
                  className={`status-btn confirm ${prenotazione.status === 'confirmed' ? 'active' : ''}`}
                  onClick={() => handleStatusChange(prenotazione.id, 'confirmed')}
                  disabled={prenotazione.status === 'confirmed'}
                >
                  ✅ Conferma
                </button>
                <button
                  className={`status-btn pending ${prenotazione.status === 'pending' ? 'active' : ''}`}
                  onClick={() => handleStatusChange(prenotazione.id, 'pending')}
                  disabled={prenotazione.status === 'pending'}
                >
                  ⏳ In Attesa
                </button>
                <button
                  className={`status-btn cancel ${prenotazione.status === 'cancelled' ? 'active' : ''}`}
                  onClick={() => handleStatusChange(prenotazione.id, 'cancelled')}
                  disabled={prenotazione.status === 'cancelled'}
                >
                  ❌ Cancella
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeletePrenotazione(prenotazione.id)}
                  title="Elimina prenotazione"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          
          {getPrenotazioniForDate(selectedDate).length === 0 && (
            <div className="no-bookings">
              <p>Nessuna prenotazione per questa data</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Prenotazione Modal */}
      {showAddForm && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAddForm(false)}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Nuova Prenotazione</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddPrenotazione} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nome">Nome e Cognome *</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={newPrenotazione.nome}
                    onChange={(e) => setNewPrenotazione(prev => ({ ...prev, nome: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="telefono">Telefono *</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={newPrenotazione.telefono}
                    onChange={(e) => setNewPrenotazione(prev => ({ ...prev, telefono: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newPrenotazione.email}
                  onChange={(e) => setNewPrenotazione(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="data">Data *</label>
                  <input
                    type="date"
                    id="data"
                    name="data"
                    value={newPrenotazione.data}
                    onChange={(e) => setNewPrenotazione(prev => ({ ...prev, data: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="ora">Orario *</label>
                  <select
                    id="ora"
                    name="ora"
                    value={newPrenotazione.ora}
                    onChange={(e) => setNewPrenotazione(prev => ({ ...prev, ora: e.target.value }))}
                    required
                  >
                    <option value="">Seleziona orario</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="durata">Durata (ore) *</label>
                  <select
                    id="durata"
                    name="durata"
                    value={newPrenotazione.durata}
                    onChange={(e) => setNewPrenotazione(prev => ({ ...prev, durata: parseInt(e.target.value) }))}
                    required
                  >
                    <option value={1}>1 ora</option>
                    <option value={2}>2 ore</option>
                    <option value={3}>3 ore</option>
                    <option value={4}>4 ore</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="note">Note</label>
                <textarea
                  id="note"
                  name="note"
                  value={newPrenotazione.note}
                  onChange={(e) => setNewPrenotazione(prev => ({ ...prev, note: e.target.value }))}
                  rows="3"
                  placeholder="Note aggiuntive..."
                />
              </div>
            </form>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Annulla
              </button>
              <button 
                className="btn-primary"
                onClick={handleAddPrenotazione}
              >
                Aggiungi Prenotazione
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
