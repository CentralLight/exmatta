import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function CorsiManager() {
  const [corsi, setCorsi] = useState([])
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCorso, setSelectedCorso] = useState(null)

  // Mock data for demo
  useEffect(() => {
    setCorsi([
      {
        id: 1,
        nome: 'Mario Rossi',
        cognome: 'Rossi',
        telefono: '333 123 4567',
        email: 'mario.rossi@email.com',
        strumento: 'Chitarra',
        descrizione: 'Principiante, vorrei imparare le basi',
        data: '2024-08-16 14:30',
        status: 'pending',
        spam: false
      },
      {
        id: 2,
        nome: 'Laura Bianchi',
        cognome: 'Bianchi',
        telefono: '333 987 6543',
        email: 'laura.bianchi@email.com',
        strumento: 'Pianoforte',
        descrizione: 'Livello intermedio, perfezionamento tecnica',
        data: '2024-08-16 12:15',
        status: 'approved',
        spam: false
      },
      {
        id: 3,
        nome: 'Giuseppe Verdi',
        cognome: 'Verdi',
        telefono: '333 555 1234',
        email: 'giuseppe.verdi@email.com',
        strumento: 'Batteria',
        descrizione: 'Esperienza con altri strumenti',
        data: '2024-08-16 10:45',
        status: 'rejected',
        spam: true
      }
    ])
  }, [])

  const filteredCorsi = corsi.filter(corso => {
    const matchesFilter = filter === 'all' || corso.status === filter
    const matchesSearch = corso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corso.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corso.strumento.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleStatusChange = (id, newStatus) => {
    setCorsi(prev => prev.map(corso => 
      corso.id === id ? { ...corso, status: newStatus } : corso
    ))
  }

  const handleSpamToggle = (id) => {
    setCorsi(prev => prev.map(corso => 
      corso.id === id ? { ...corso, spam: !corso.spam } : corso
    ))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'approved': return 'green'
      case 'rejected': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'In Attesa'
      case 'approved': return 'Approvata'
      case 'rejected': return 'Rifiutata'
      default: return 'Sconosciuto'
    }
  }

  return (
    <div className="corsi-manager">
      <motion.div 
        className="manager-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Gestione Iscrizioni Corsi</h1>
        <p>Gestisci le richieste di iscrizione ai corsi musicali</p>
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        className="manager-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="search-box">
          <input
            type="text"
            placeholder="Cerca per nome, cognome o strumento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tutte ({corsi.length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            In Attesa ({corsi.filter(c => c.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approvate ({corsi.filter(c => c.status === 'approved').length})
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rifiutate ({corsi.filter(c => c.status === 'rejected').length})
          </button>
        </div>
      </motion.div>

      {/* Corsi List */}
      <motion.div 
        className="corsi-list"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {filteredCorsi.map((corso, index) => (
          <motion.div
            key={corso.id}
            className={`corso-card ${corso.spam ? 'spam' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
          >
            <div className="corso-header">
              <div className="corso-info">
                <h3>{corso.nome} {corso.cognome}</h3>
                <span className={`status-badge ${getStatusColor(corso.status)}`}>
                  {getStatusLabel(corso.status)}
                </span>
                {corso.spam && <span className="spam-badge">SPAM</span>}
              </div>
              <div className="corso-actions">
                <button
                  className="action-btn view"
                  onClick={() => setSelectedCorso(corso)}
                  title="Visualizza dettagli"
                >
                  👁️
                </button>
                <button
                  className="action-btn spam"
                  onClick={() => handleSpamToggle(corso.id)}
                  title={corso.spam ? "Rimuovi da spam" : "Segna come spam"}
                >
                  {corso.spam ? '✅' : '🚫'}
                </button>
              </div>
            </div>

            <div className="corso-details">
              <div className="detail-row">
                <span className="detail-label">Strumento:</span>
                <span className="detail-value">{corso.strumento}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Telefono:</span>
                <span className="detail-value">{corso.telefono}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{corso.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Data richiesta:</span>
                <span className="detail-value">{corso.data}</span>
              </div>
            </div>

            {corso.descrizione && (
              <div className="corso-description">
                <strong>Descrizione:</strong> {corso.descrizione}
              </div>
            )}

            <div className="corso-status-actions">
              <button
                className={`status-btn approve ${corso.status === 'approved' ? 'active' : ''}`}
                onClick={() => handleStatusChange(corso.id, 'approved')}
                disabled={corso.status === 'approved'}
              >
                ✅ Approva
              </button>
              <button
                className={`status-btn reject ${corso.status === 'rejected' ? 'active' : ''}`}
                onClick={() => handleStatusChange(corso.id, 'rejected')}
                disabled={corso.status === 'rejected'}
              >
                ❌ Rifiuta
              </button>
              <button
                className={`status-btn pending ${corso.status === 'pending' ? 'active' : ''}`}
                onClick={() => handleStatusChange(corso.id, 'pending')}
                disabled={corso.status === 'pending'}
              >
                ⏳ In Attesa
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Corso Detail Modal */}
      {selectedCorso && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedCorso(null)}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Dettagli Richiesta</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedCorso(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>Informazioni Personali</h3>
                <p><strong>Nome:</strong> {selectedCorso.nome} {selectedCorso.cognome}</p>
                <p><strong>Telefono:</strong> {selectedCorso.telefono}</p>
                <p><strong>Email:</strong> {selectedCorso.email}</p>
              </div>
              
              <div className="detail-section">
                <h3>Dettagli Corso</h3>
                <p><strong>Strumento:</strong> {selectedCorso.strumento}</p>
                <p><strong>Data richiesta:</strong> {selectedCorso.data}</p>
                <p><strong>Status:</strong> {getStatusLabel(selectedCorso.status)}</p>
              </div>
              
              {selectedCorso.descrizione && (
                <div className="detail-section">
                  <h3>Descrizione</h3>
                  <p>{selectedCorso.descrizione}</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedCorso(null)}
              >
                Chiudi
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
