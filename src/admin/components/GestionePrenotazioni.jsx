import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import './GestionePrenotazioni.css';

const GestionePrenotazioni = () => {
  // Stati per i tab
  const [activeTab, setActiveTab] = useState('prenotazioni');
  
  // Stati per prenotazioni
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Stati per form nuova prenotazione
  const [showNewBookingForm, setShowNewBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    band_name: '',
    date: '',
    start_time: '',
    duration: 1,
    members_count: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Stati per blocchi disponibilità
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [newAvailabilityBlock, setNewAvailabilityBlock] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: ''
  });

  // Stati per feedback utente
  const [feedback, setFeedback] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (activeTab === 'prenotazioni') {
      fetchBookings();
    } else if (activeTab === 'disponibilita') {
      fetchAvailabilityBlocks();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      setBookings(response);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento delle prenotazioni');
      console.error('Errore fetch prenotazioni:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilityBlocks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/availability-blocks');
      setAvailabilityBlocks(response);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento dei blocchi disponibilità');
      console.error('Errore fetch blocchi disponibilità:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(prev => ({ ...prev, create: true }));
      
      const response = await api.post('/bookings', newBooking);
      
      if (response.success) {
        showFeedback('success', 'Prenotazione creata con successo!');
        setNewBooking({
          band_name: '',
          date: '',
          start_time: '',
          duration: 1,
          members_count: '',
          email: '',
          phone: '',
          notes: ''
        });
        setShowNewBookingForm(false);
        fetchBookings();
      } else {
        showFeedback('error', 'Errore nella creazione della prenotazione');
      }
    } catch (err) {
      showFeedback('error', 'Errore nella creazione della prenotazione');
      console.error('Errore creazione prenotazione:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleCreateAvailabilityBlock = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(prev => ({ ...prev, availability: true }));
      
      const response = await api.post('/bookings/availability-blocks', newAvailabilityBlock);
      
      if (response.success) {
        showFeedback('success', 'Blocco disponibilità creato con successo!');
        setNewAvailabilityBlock({
          start_date: '',
          end_date: '',
          start_time: '',
          end_time: '',
          reason: ''
        });
        setShowAvailabilityForm(false);
        fetchAvailabilityBlocks();
      } else {
        showFeedback('error', 'Errore nella creazione del blocco disponibilità');
      }
    } catch (err) {
      showFeedback('error', 'Errore nella creazione del blocco disponibilità');
      console.error('Errore creazione blocco disponibilità:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, availability: false }));
    }
  };

  const handleDeleteAvailabilityBlock = async (blockId) => {
    try {
      setActionLoading(prev => ({ ...prev, [blockId]: true }));
      
      const response = await api.delete(`/bookings/availability-blocks/${blockId}`);
      
      if (response.success) {
        showFeedback('success', 'Blocco disponibilità eliminato con successo!');
        fetchAvailabilityBlocks();
      } else {
        showFeedback('error', 'Errore nell\'eliminazione del blocco disponibilità');
      }
    } catch (err) {
      showFeedback('error', 'Errore nell\'eliminazione del blocco disponibilità');
      console.error('Errore eliminazione blocco disponibilità:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [blockId]: false }));
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      
      const response = await api.post(`/bookings/${bookingId}/confirm`);
      
      if (response.success) {
        showFeedback('success', `Prenotazione confermata! File .ics generato: ${response.icsFilename}`);
        // Aggiorna la lista per riflettere il nuovo status
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'approved' }
            : booking
        ));
      } else {
        showFeedback('error', 'Errore nella conferma della prenotazione');
      }
    } catch (err) {
      showFeedback('error', 'Errore nella conferma della prenotazione');
      console.error('Errore conferma prenotazione:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCancelBooking = async (bookingId, reason) => {
    try {
      setActionLoading(prev => ({ ...prev, [bookingId]: true }));
      
      const response = await api.post(`/bookings/${bookingId}/cancel`, { reason });
      
      if (response.success) {
        showFeedback('success', `Prenotazione cancellata! File .ics generato: ${response.icsFilename}`);
        // Aggiorna la lista per riflettere il nuovo status
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
        setShowCancelModal(false);
        setSelectedBooking(null);
        setCancelReason('');
      } else {
        showFeedback('error', 'Errore nella cancellazione della prenotazione');
      }
    } catch (err) {
      showFeedback('error', 'Errore nella cancellazione della prenotazione');
      console.error('Errore cancellazione prenotazione:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message });
    setTimeout(() => setFeedback({ show: false, type: '', message: '' }), 5000);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'In Attesa', class: 'status-pending' },
      approved: { text: 'Confermata', class: 'status-approved' },
      rejected: { text: 'Rifiutata', class: 'status-rejected' },
      cancelled: { text: 'Cancellata', class: 'status-cancelled' }
    };
    
    const config = statusConfig[status] || { text: status, class: 'status-unknown' };
    
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const getActionButtons = (booking) => {
    if (booking.status === 'pending') {
      return (
        <div className="action-buttons">
          <button
            className="btn-confirm"
            onClick={() => handleConfirmBooking(booking.id)}
            disabled={actionLoading[booking.id]}
          >
            {actionLoading[booking.id] ? '⏳ Confermando...' : '✅ Conferma'}
          </button>
          <button
            className="btn-cancel"
            onClick={() => openCancelModal(booking)}
            disabled={actionLoading[booking.id]}
          >
            ❌ Cancella
          </button>
        </div>
      );
    } else if (booking.status === 'approved') {
      return (
        <div className="action-buttons">
          <button
            className="btn-cancel"
            onClick={() => openCancelModal(booking)}
            disabled={actionLoading[booking.id]}
          >
            ❌ Cancella
          </button>
        </div>
      );
    }
    
    return <span className="no-actions">Nessuna azione disponibile</span>;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    return timeStr;
  };

  const formatAvailabilityDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const resetNewBookingForm = () => {
    setNewBooking({
      band_name: '',
        date: '',
        start_time: '',
        duration: 1,
      members_count: '',
        email: '',
        phone: '',
        notes: ''
    });
    setShowNewBookingForm(false);
  };

  const resetNewAvailabilityForm = () => {
    setNewAvailabilityBlock({
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      reason: ''
    });
    setShowAvailabilityForm(false);
  };

  if (loading) {
    return (
      <div className="gestione-prenotazioni">
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <p>Caricamento prenotazioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestione-prenotazioni">
        <div className="error-container">
          <h2>❌ Errore</h2>
          <p>{error}</p>
          <button onClick={fetchBookings} className="btn-retry">
            🔄 Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gestione-prenotazioni">
      <div className="header">
        <h1>🎵 Gestione Sala Prove</h1>
        <p>Gestisci prenotazioni, blocchi disponibilità e genera file calendario (.ics) automaticamente</p>
      </div>

      {/* Feedback Messages */}
      {feedback.show && (
        <div className={`feedback-message ${feedback.type}`}>
          <span className="feedback-icon">
            {feedback.type === 'success' ? '✅' : '❌'}
          </span>
          {feedback.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'prenotazioni' ? 'active' : ''}`}
          onClick={() => setActiveTab('prenotazioni')}
        >
          📋 Gestione Prenotazioni
        </button>
        <button
          className={`tab-button ${activeTab === 'disponibilita' ? 'active' : ''}`}
          onClick={() => setActiveTab('disponibilita')}
        >
          🚫 Blocchi Disponibilità
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'prenotazioni' && (
        <div className="tab-content">
          {/* Statistiche Prenotazioni */}
          <div className="stats-container">
            <div className="stat-card">
              <h3>📊 Totale Prenotazioni</h3>
              <p className="stat-number">{bookings.length}</p>
            </div>
            <div className="stat-card">
              <h3>⏳ In Attesa</h3>
              <p className="stat-number">{bookings.filter(b => b.status === 'pending').length}</p>
            </div>
            <div className="stat-card">
              <h3>✅ Confermate</h3>
              <p className="stat-number">{bookings.filter(b => b.status === 'approved').length}</p>
            </div>
            <div className="stat-card">
              <h3>❌ Cancellate</h3>
              <p className="stat-number">{bookings.filter(b => b.status === 'cancelled').length}</p>
            </div>
          </div>

          {/* Form Nuova Prenotazione */}
          <div className="form-section">
            <div className="form-header">
              <h2>➕ Nuova Prenotazione</h2>
              <button
                className="btn-toggle-form"
                onClick={() => setShowNewBookingForm(!showNewBookingForm)}
              >
                {showNewBookingForm ? '❌ Chiudi' : '➕ Nuova Prenotazione'}
              </button>
            </div>

            {showNewBookingForm && (
              <form onSubmit={handleCreateBooking} className="new-booking-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="band_name">Nome Band *</label>
                    <input
                      type="text"
                      id="band_name"
                      value={newBooking.band_name}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, band_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      value={newBooking.email}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

        <div className="form-row">
          <div className="form-group">
                    <label htmlFor="date">Data *</label>
            <input
              type="date"
                      id="date"
                      value={newBooking.date}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
                    <label htmlFor="start_time">Orario Inizio *</label>
            <input
              type="time"
                      id="start_time"
                      value={newBooking.start_time}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, start_time: e.target.value }))}
              required
            />
          </div>
                </div>

                <div className="form-row">
          <div className="form-group">
                    <label htmlFor="duration">Durata (ore) *</label>
            <select
                      id="duration"
                      value={newBooking.duration}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              required
            >
              <option value={1}>1 ora</option>
              <option value={2}>2 ore</option>
              <option value={3}>3 ore</option>
              <option value={4}>4 ore</option>
            </select>
          </div>
          <div className="form-group">
                    <label htmlFor="members_count">Numero Componenti</label>
            <input
                      type="number"
                      id="members_count"
                      value={newBooking.members_count}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, members_count: e.target.value }))}
                      min="1"
                      max="20"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
                    <label htmlFor="phone">Telefono</label>
            <input
              type="tel"
                      id="phone"
                      value={newBooking.phone}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="form-group">
                    <label htmlFor="notes">Note</label>
                    <textarea
                      id="notes"
                      value={newBooking.notes}
                      onChange={(e) => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
                      rows="2"
                    />
          </div>
        </div>

        <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={resetNewBookingForm}>
                    ❌ Annulla
                  </button>
                  <button type="submit" className="btn-primary" disabled={actionLoading.create}>
                    {actionLoading.create ? '⏳ Creando...' : '✅ Crea Prenotazione'}
          </button>
        </div>
      </form>
            )}
          </div>

          {/* Lista Prenotazioni */}
          <div className="bookings-container">
            <h2>📋 Lista Prenotazioni</h2>
            
            {bookings.length === 0 ? (
              <div className="no-bookings">
                <p>Nessuna prenotazione trovata</p>
              </div>
            ) : (
              <div className="bookings-grid">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <h3>{booking.band_name}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="booking-details">
                      <div className="detail-row">
                        <span className="detail-label">📅 Data:</span>
                        <span className="detail-value">{formatDate(booking.date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">🕐 Orario:</span>
                        <span className="detail-value">{formatTime(booking.start_time)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">⏱️ Durata:</span>
                        <span className="detail-value">{booking.duration} {booking.duration === 1 ? 'ora' : 'ore'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">👥 Componenti:</span>
                        <span className="detail-value">{booking.members_count || 'Non specificato'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">📧 Email:</span>
                        <span className="detail-value">{booking.email}</span>
                      </div>
                      {booking.phone && (
                        <div className="detail-row">
                          <span className="detail-label">📞 Telefono:</span>
                          <span className="detail-value">{booking.phone}</span>
                        </div>
                      )}
                      {booking.notes && (
                        <div className="detail-row">
                          <span className="detail-label">📝 Note:</span>
                          <span className="detail-value">{booking.notes}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="booking-actions">
                      {getActionButtons(booking)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'disponibilita' && (
        <div className="tab-content">
          {/* Form Nuovo Blocco Disponibilità */}
          <div className="form-section">
            <div className="form-header">
              <h2>🚫 Nuovo Blocco Disponibilità</h2>
              <button
                className="btn-toggle-form"
                onClick={() => setShowAvailabilityForm(!showAvailabilityForm)}
              >
                {showAvailabilityForm ? '❌ Chiudi' : '🚫 Nuovo Blocco'}
              </button>
            </div>

            {showAvailabilityForm && (
              <form onSubmit={handleCreateAvailabilityBlock} className="new-availability-form">
        <div className="form-row">
          <div className="form-group">
                    <label htmlFor="block_start_date">Data Inizio *</label>
            <input
              type="date"
                      id="block_start_date"
                      value={newAvailabilityBlock.start_date}
                      onChange={(e) => setNewAvailabilityBlock(prev => ({ ...prev, start_date: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
                    <label htmlFor="block_end_date">Data Fine *</label>
            <input
                      type="date"
                      id="block_end_date"
                      value={newAvailabilityBlock.end_date}
                      onChange={(e) => setNewAvailabilityBlock(prev => ({ ...prev, end_date: e.target.value }))}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
                    <label htmlFor="block_start_time">Orario Inizio *</label>
            <input
                      type="time"
                      id="block_start_time"
                      value={newAvailabilityBlock.start_time}
                      onChange={(e) => setNewAvailabilityBlock(prev => ({ ...prev, start_time: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
                    <label htmlFor="block_end_time">Orario Fine *</label>
            <input
                      type="time"
                      id="block_end_time"
                      value={newAvailabilityBlock.end_time}
                      onChange={(e) => setNewAvailabilityBlock(prev => ({ ...prev, end_time: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
                    <label htmlFor="block_reason">Motivo *</label>
            <input
                      type="text"
                      id="block_reason"
                      value={newAvailabilityBlock.reason}
                      onChange={(e) => setNewAvailabilityBlock(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Es: Manutenzione, Evento, Chiusura..."
                      required
            />
          </div>
        </div>

        <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={resetNewAvailabilityForm}>
                    ❌ Annulla
                  </button>
                  <button type="submit" className="btn-primary" disabled={actionLoading.availability}>
                    {actionLoading.availability ? '⏳ Creando...' : '🚫 Crea Blocco'}
          </button>
        </div>
      </form>
            )}
      </div>

          {/* Lista Blocchi Disponibilità */}
          <div className="availability-container">
            <h2>🚫 Blocchi Disponibilità Attivi</h2>
            
            {availabilityBlocks.length === 0 ? (
              <div className="no-blocks">
                <p>Nessun blocco disponibilità trovato</p>
        </div>
            ) : (
              <div className="availability-grid">
                {availabilityBlocks.map(block => (
                  <div key={block.id} className="availability-card">
                    <div className="availability-header">
                      <h3>🚫 {block.reason}</h3>
        <button 
                        className="btn-delete"
                        onClick={() => handleDeleteAvailabilityBlock(block.id)}
                        disabled={actionLoading[block.id]}
                      >
                        {actionLoading[block.id] ? '⏳' : '🗑️'}
        </button>
      </div>

                    <div className="availability-details">
                      <div className="detail-row">
                        <span className="detail-label">📅 Data:</span>
                        <span className="detail-value">
                          {formatAvailabilityDate(block.start_date)} - {formatAvailabilityDate(block.end_date)}
                        </span>
        </div>
                      <div className="detail-row">
                        <span className="detail-label">🕐 Orario:</span>
                        <span className="detail-value">
                          {block.start_time} - {block.end_time}
                        </span>
        </div>
                      <div className="detail-row">
                        <span className="detail-label">⏱️ Durata:</span>
                        <span className="detail-value">
                          {(() => {
                            const start = new Date(`${block.start_date}T${block.start_time}`);
                            const end = new Date(`${block.end_date}T${block.end_time}`);
                            const diffMs = end - start;
                            const diffHours = Math.round(diffMs / (1000 * 60 * 60));
                            return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'}`;
                          })()}
                        </span>
        </div>
        </div>
      </div>
                ))}
          </div>
        )}
      </div>
        </div>
      )}

      {/* Modal Cancellazione */}
      {showCancelModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>❌ Cancella Prenotazione</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCancelModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>
                Stai per cancellare la prenotazione di <strong>{selectedBooking.band_name}</strong> 
                per il <strong>{formatDate(selectedBooking.date)}</strong> alle <strong>{formatTime(selectedBooking.start_time)}</strong>.
              </p>
              
              <div className="form-group">
                <label htmlFor="cancelReason">Motivo della cancellazione:</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Inserisci il motivo della cancellazione..."
                  rows="3"
                />
              </div>
              
              <p className="modal-note">
                <strong>Nota:</strong> Verrà generato automaticamente un file calendario (.ics) 
                e inviato via email al cliente e allo staff.
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Annulla
              </button>
              <button 
                className="btn-danger"
                onClick={() => handleCancelBooking(selectedBooking.id, cancelReason)}
                disabled={actionLoading[selectedBooking.id]}
              >
                {actionLoading[selectedBooking.id] ? '⏳ Cancellando...' : 'Conferma Cancellazione'}
              </button>
            </div>
              </div>
              </div>
        )}
    </div>
  );
};

export default GestionePrenotazioni;