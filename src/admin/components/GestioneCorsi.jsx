import React, { useState, useEffect } from 'react'
import { courseService } from '../../services/api'

export default function GestioneCorsi({ userRole }) {
  // Se l'utente è un docente, mostra solo le sue richieste
  const isTeacher = userRole === 'docente';
  const [richieste, setRichieste] = useState([])
  const [filteredRichieste, setFilteredRichieste] = useState([])
  const [filter, setFilter] = useState('tutte')
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Carica le richieste dal database
  useEffect(() => {
    const loadRichieste = async () => {
      try {
        // Verifica che l'utente sia autenticato prima di fare chiamate API
        const token = localStorage.getItem('adminToken');
        if (!token) {
          console.warn('GestioneCorsi: Token non trovato, saltando caricamento richieste');
          return;
        }

        const response = await courseService.getAll()
        if (response && Array.isArray(response)) {
          setRichieste(response)
          setFilteredRichieste(response)
        } else if (response && response.requests) {
          setRichieste(response.requests)
          setFilteredRichieste(response.requests)
        } else {
          setRichieste([])
          setFilteredRichieste([])
        }
      } catch (error) {
        console.error('Errore nel caricamento richieste:', error)
        // Fallback con dati mock se l'API non è disponibile
        const mockData = [
          {
            id: 1,
            nome: 'Mario Rossi',
            email: 'mario.rossi@email.com',
            telefono: '333 123 4567',
            tipoCorso: 'Musica',
            messaggio: 'Sono un principiante, vorrei iniziare con la chitarra acustica',
            dataCreazione: '2024-01-15',
            status: 'In attesa'
          }
        ]
        setRichieste(mockData)
        setFilteredRichieste(mockData)
      }
    }
    
    loadRichieste()
  }, [])

  // Filtra le richieste in base allo stato e al termine di ricerca
  useEffect(() => {
    let filtered = richieste

    // Filtro per stato
    if (filter !== 'tutte') {
      filtered = filtered.filter(richiesta => richiesta.status === filter)
    }

    // Filtro per ricerca
    if (searchTerm) {
      filtered = filtered.filter(richiesta => 
        richiesta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        richiesta.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        richiesta.strumento.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRichieste(filtered)
  }, [richieste, filter, searchTerm])

  // Cambia stato richiesta
  const cambiaStato = async (id, nuovoStato) => {
    try {
      const response = await courseService.updateStatus(id, nuovoStato)
      if (response.success) {
        setRichieste(prev => 
          prev.map(richiesta => 
            richiesta.id === id 
              ? { ...richiesta, status: nuovoStato }
              : richiesta
          )
        )
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dello stato:', error)
    }
  }

  // Elimina richiesta
  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa richiesta? L\'operazione non può essere annullata.')) {
      try {
        const response = await courseService.delete(id)
        if (response.success) {
          setRichieste(prev => prev.filter(richiesta => richiesta.id !== id))
        }
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error)
        alert('Errore durante l\'eliminazione della richiesta')
      }
    }
  }

  // Mostra banner di conferma eliminazione
  const showDeleteConfirm = (richiesta) => {
    setDeleteConfirm(richiesta)
  }

  // Conferma eliminazione
  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        const response = await courseService.delete(deleteConfirm.id)
        if (response.success) {
          setRichieste(prev => prev.filter(richiesta => richiesta.id !== deleteConfirm.id))
          setDeleteConfirm(null)
        }
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error)
        alert('Errore durante l\'eliminazione della richiesta')
      }
    }
  }

  // Conta richieste per stato
  const contaRichieste = (stato) => {
    if (stato === 'tutte') return richieste.length
    return richieste.filter(r => r.status === stato).length
  }

  return (
    <div className="gestione-corsi">
      <div className="page-header">
        <h1>🎸 {isTeacher ? 'Le Tue Richieste Corsi' : 'Richieste Info Corsi'}</h1>
                  <p>{isTeacher ? 'Visualizza le richieste di informazioni sui tuoi corsi' : 'Gestisci le richieste sui corsi musicali'}</p>
      </div>

      {/* Statistiche */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{contaRichieste('In attesa')}</div>
            <div className="stat-label">{isTeacher ? 'Tue Richieste in Attesa' : 'Richieste in Attesa'}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{contaRichieste('Completata')}</div>
            <div className="stat-label">{isTeacher ? 'Tue Richieste Completate' : 'Completate'}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{contaRichieste('tutte')}</div>
            <div className="stat-label">{isTeacher ? 'Totale Tue Richieste' : 'Totale'}</div>
          </div>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="filters-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Filtra per stato:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="tutte">{isTeacher ? 'Tutte le tue richieste' : 'Tutte le richieste'}</option>
              <option value="In attesa">In attesa</option>
              <option value="Completata">Completate</option>
            </select>
          </div>
          
          <div className="search-group">
            <label>Cerca:</label>
            <input
              type="text"
              placeholder={isTeacher ? "Cerca nelle tue richieste..." : "Nome, email o tipo corso..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabella Richieste */}
      <div className="table-container">
        <table className="richieste-table">
          <thead>
            <tr>
              <th>📅 Data</th>
              <th>👤 Nome</th>
              <th className="dont-display">📧 Email</th>
              <th className="dont-display">📞 Telefono</th>
              <th className="dont-display">🎸 Tipo Corso</th>
              <th className="dont-display">👨‍🏫 Insegnante</th>
              <th className="dont-display">💬 Messaggio</th>
              <th className="dont-display">📊 Stato</th>
              <th>⚡ Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredRichieste.map(richiesta => (
              <tr key={richiesta.id} className={`richiesta-row ${richiesta.status}`}>
                <td className="data-cell">
                  {new Date(richiesta.created_at).toLocaleDateString('it-IT')}
                </td>
                <td className="nome-cell">
                  <strong>{richiesta.nome}</strong>
                </td>
                <td className="email-cell">
                  <a href={`mailto:${richiesta.email}`} className="email-link">
                    {richiesta.email}
                  </a>
                </td>
                <td className="telefono-cell">
                  {richiesta.telefono ? (
                    <a href={`tel:${richiesta.telefono}`} className="phone-link">
                      {richiesta.telefono}
                    </a>
                  ) : (
                    <span className="no-phone">-</span>
                  )}
                </td>
                <td className="tipo-corso-cell">
                  <span className="tipo-corso-badge">{richiesta.strumento}</span>
                </td>
                                 <td className="insegnante-cell">
                   {richiesta.teacher_name ? (
                     <div className="insegnante-info">
                       <span className="insegnante-nome">{richiesta.teacher_name}</span>
                     </div>
                   ) : (
                     <span className="no-insegnante">Non specificato</span>
                   )}
                 </td>
                <td className="messaggio-cell">
                  <div className="messaggio-text">
                    {richiesta.descrizione || 'Nessun messaggio'}
                  </div>
                </td>
                <td className="stato-cell">
                  <span className={`stato-badge ${richiesta.status}`}>
                    {richiesta.status === 'In attesa' ? '⏳ In attesa' : '✅ Completata'}
                  </span>
                </td>
                <td className="azioni-cell">
                  {richiesta.status === 'In attesa' ? (
                    <button
                      className="btn-completa"
                      onClick={() => cambiaStato(richiesta.id, 'Completata')}
                      title="Segna come completata"
                    >
                      ✅
                    </button>
                  ) : (
                    <button
                      className="btn-nuova"
                      onClick={() => cambiaStato(richiesta.id, 'In attesa')}
                      title="Rimetti come in attesa"
                    >
                      ⏳
                    </button>
                  )}
                  
                  {richiesta.telefono && richiesta.telefono !== 'Non fornito' && (
                    <button
                      className="btn-chiama"
                      onClick={() => window.open(`tel:${richiesta.telefono}`)}
                      title="Chiama"
                    >
                      📞
                    </button>
                  )}
                  
                  <button
                    className="btn-email"
                    onClick={() => window.open(`mailto:${richiesta.email}`)}
                    title="Invia email"
                  >
                    📧
                  </button>
                  
                  <button
                    className="btn-elimina"
                    onClick={() => showDeleteConfirm(richiesta)}
                    title="Elimina richiesta"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredRichieste.length === 0 && (
          <div className="no-results">
            <p>📭 Nessuna richiesta trovata con i filtri selezionati.</p>
          </div>
        )}
      </div>

      {/* Banner di conferma eliminazione */}
      {deleteConfirm && (
        <div className="delete-confirmation-banner">
          <div className="banner-content">
            <div className="banner-icon">🗑️</div>
            <div className="banner-text">
              <h3>🗑️ Conferma Eliminazione</h3>
              <p>
                Sei sicuro di voler eliminare la richiesta di <strong>{deleteConfirm.nome} </strong>
                per il corso di <strong>{deleteConfirm.strumento}</strong>?
              </p>
              <p className="warning-text">
                <strong>⚠️ Attenzione:</strong> Questa azione non può essere annullata.
              </p>
            </div>
            <div className="banner-actions">
              <button 
                className="btn-cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                ❌ Annulla
              </button>
              <button 
                className="btn-confirm-delete"
                onClick={confirmDelete}
              >
                🗑️ Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
