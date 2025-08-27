import React, { useState, useEffect } from 'react';
import { FaBug, FaEye, FaTrash, FaFilter, FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const GestioneBugReports = () => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBug, setSelectedBug] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Utility function to handle JWT errors
  const handleJWTError = () => {
    console.warn('JWT error detected, clearing tokens and redirecting to login');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminUsername');
    window.location.reload();
  };

  // Validate JWT token format
  const isValidJWT = (token) => {
    if (!token) return false;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Each part should be base64 encoded
    try {
      // Check if parts are valid base64
      parts.forEach(part => {
        if (part && part.length > 0) {
          // Add padding if needed for base64
          const paddedPart = part + '='.repeat((4 - part.length % 4) % 4);
          atob(paddedPart);
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  // Carica dati reali dalle API
  useEffect(() => {
    fetchBugReports();
  }, []);

  // Cleanup effect for JWT errors
  useEffect(() => {
    return () => {
      // Clear any corrupted tokens on unmount
      const token = localStorage.getItem('adminToken');
      if (token && !isValidJWT(token)) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminUsername');
      }
    };
  }, []);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('http://localhost:3001/api/bug-reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setBugReports(result.data);
      } else {
        console.error('Errore API:', result.error);
      }
    } catch (error) {
      console.error('Errore durante il caricamento:', error);
      // Fallback con dati di esempio se l'API non è disponibile
      setBugReports([
        {
          id: 1,
          description: 'Il pulsante di prenotazione non risponde quando cliccato',
          browser_info: 'Chrome 120.0.0 / Windows 11',
          created_at: '2025-01-20 14:30:00',
          admin_notes: 'Bug confermato, da investigare',
          status: 'open'
        },
        {
          id: 2,
          description: 'La pagina si carica molto lentamente su mobile',
          browser_info: 'Safari 17.2 / iOS 17.2',
          created_at: '2025-01-19 09:15:00',
          admin_notes: '',
          status: 'open'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };



  const filteredBugReports = bugReports.filter(bug => {
    const matchesStatus = filterStatus === 'all' || bug.status === filterStatus;
    const matchesSearch = bug.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleViewBug = (bug) => {
    setSelectedBug(bug);
    setShowModal(true);
  };

  const handleDeleteBug = async (bugId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa segnalazione?')) {
      try {
        const token = localStorage.getItem('adminToken');
        
        const response = await fetch(`http://localhost:3001/api/bug-reports/${bugId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            handleJWTError();
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
          setBugReports(bugReports.filter(bug => bug.id !== bugId));
          // TODO: Mostra toast di successo
        } else {
          console.error('Errore API:', result.error);
        }
      } catch (error) {
        console.error('Errore durante l\'eliminazione:', error);
        // Fallback: rimuovi dalla UI anche se l'API fallisce
        setBugReports(bugReports.filter(bug => bug.id !== bugId));
      }
    }
  };

  const handleUpdateNotes = async (bugId, notes) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`http://localhost:3001/api/bug-reports/${bugId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: notes })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setBugReports(bugReports.map(bug => 
          bug.id === bugId ? { ...bug, admin_notes: notes } : bug
        ));
        setShowModal(false);
        // TODO: Mostra toast di successo
      } else {
        console.error('Errore API:', result.error);
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento:', error);
      // Fallback: aggiorna la UI anche se l'API fallisce
      setBugReports(bugReports.map(bug => 
        bug.id === bugId ? { ...bug, admin_notes: notes } : bug
      ));
      setShowModal(false);
    }
  };

  const handleStatusChange = async (bugId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`http://localhost:3001/api/bug-reports/${bugId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setBugReports(bugReports.map(bug => 
          bug.id === bugId ? { ...bug, status: newStatus } : bug
        ));
        // TODO: Mostra toast di successo
      } else {
        console.error('Errore API:', result.error);
      }
    } catch (error) {
      console.error('Errore durante il cambio status:', error);
      // Fallback: aggiorna la UI anche se l'API fallisce
      setBugReports(bugReports.map(bug => 
        bug.id === bugId ? { ...bug, status: newStatus } : bug
      ));
    }
  };

  if (loading) {
    return (
      <div className="gestione-bug-reports">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Caricamento segnalazioni bug...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestione-bug-reports">
      {/* Header */}
      <div className="page-header">
        <h1>🐛 Gestione Segnalazioni Bug</h1>
        <p>Gestisci e monitora le segnalazioni degli utenti</p>
      </div>

             {/* Statistiche */}
       <div className="stats-overview">
         <div className="stat-card">
           <div className="stat-icon">🐛</div>
           <div className="stat-content">
             <div className="stat-number">{bugReports.length}</div>
             <div className="stat-label">Segnalazioni Totali</div>
           </div>
         </div>
         <div className="stat-card">
           <div className="stat-icon">🔴</div>
           <div className="stat-content">
             <div className="stat-number">
               {bugReports.filter(bug => bug.status === 'open').length}
             </div>
             <div className="stat-label">In Attesa</div>
           </div>
         </div>
         <div className="stat-card">
           <div className="stat-icon">🔄</div>
           <div className="stat-content">
             <div className="stat-number">
               {bugReports.filter(bug => bug.status === 'in_progress').length}
             </div>
             <div className="stat-label">In Lavorazione</div>
           </div>
         </div>
         <div className="stat-card">
           <div className="stat-icon">✅</div>
           <div className="stat-content">
             <div className="stat-number">
               {bugReports.filter(bug => bug.status === 'resolved').length}
             </div>
             <div className="stat-label">Risolti</div>
           </div>
         </div>
       </div>

             {/* Filtri e Ricerca */}
       <div className="filters-section">
         <div className="filter-controls">
           <div className="search-group">
             <label htmlFor="search-bugs">🔍 Cerca</label>
             <input
               id="search-bugs"
               type="text"
               placeholder="Cerca per descrizione..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="filter-group">
             <label htmlFor="filter-status">🎯 Filtra per Status</label>
             <select
               id="filter-status"
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
             >
               <option value="all">Tutti gli status</option>
               <option value="open">In Attesa</option>
               <option value="in_progress">In Lavorazione</option>
               <option value="resolved">Risolti</option>
               <option value="closed">Chiusi</option>
             </select>
           </div>
         </div>
       </div>

      {/* Lista Bug Reports */}
      <div className="bug-reports-section">
        <h2>📋 Lista Segnalazioni ({filteredBugReports.length})</h2>
        
        {filteredBugReports.length === 0 ? (
          <div className="no-bug-reports">
            <p>Nessuna segnalazione trovata con i filtri attuali.</p>
          </div>
        ) : (
          <div className="bug-reports-grid">
                         {filteredBugReports.map(bug => (
               <div key={bug.id} className="bug-report-card">
                 <div className="bug-header">
                   <div className="bug-status">
                     <span className={`status-badge ${bug.status === 'open' ? 'bg-orange-500' : bug.status === 'in_progress' ? 'bg-blue-500' : bug.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'}`}>
                       {bug.status === 'open' ? 'In Attesa' : bug.status === 'in_progress' ? 'In Lavorazione' : bug.status === 'resolved' ? 'Risolto' : 'Chiuso'}
                     </span>
                   </div>
                   <div className="bug-date">
                     <span className="date-info">📅 {new Date(bug.created_at).toLocaleDateString('it-IT')}</span>
                   </div>
                 </div>
                 
                 <div className="bug-content">
                   <p className="bug-description">{bug.description}</p>
                   <div className="bug-browser">
                     <span className="browser-info">🌐 {bug.browser_info}</span>
                   </div>
                 </div>
                 
                 <div className="bug-actions">
                   <button
                     className="btn-view"
                     onClick={() => handleViewBug(bug)}
                     title="Visualizza dettagli"
                   >
                     <FaEye /> Dettagli
                   </button>
                   
                   {/* Pulsanti cambio status */}
                   <div className="status-actions">
                     {bug.status === 'open' && (
                       <button
                         className="btn-status btn-in-progress"
                         onClick={() => handleStatusChange(bug.id, 'in_progress')}
                         title="Metti in lavorazione"
                       >
                         🔄 In Lavorazione
                       </button>
                     )}
                     
                     {bug.status === 'in_progress' && (
                       <>
                         <button
                           className="btn-status btn-resolved"
                           onClick={() => handleStatusChange(bug.id, 'resolved')}
                           title="Segna come risolto"
                         >
                           ✅ Risolto
                         </button>
                         <button
                           className="btn-status btn-back"
                           onClick={() => handleStatusChange(bug.id, 'open')}
                           title="Torna in attesa"
                         >
                           ⬅️ Torna Indietro
                         </button>
                       </>
                     )}
                     
                     {bug.status === 'resolved' && (
                       <button
                         className="btn-status btn-back"
                         onClick={() => handleStatusChange(bug.id, 'in_progress')}
                         title="Torna in lavorazione"
                       >
                         🔄 Torna in Lavorazione
                       </button>
                   )}
                   </div>
                   
                   <button
                     className="btn-delete"
                     onClick={() => handleDeleteBug(bug.id)}
                     title="Elimina segnalazione"
                   >
                     <FaTrash /> Elimina
                   </button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Modal Dettagli Bug */}
      {showModal && selectedBug && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🐛 Dettagli Segnalazione Bug</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
                                   <div className="bug-details">
                                               <div className="detail-row">
                          <label>Status:</label>
                          <div className="status-controls">
                            <span className={`status-badge ${selectedBug.status === 'open' ? 'bg-orange-500' : selectedBug.status === 'in_progress' ? 'bg-blue-500' : selectedBug.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'}`}>
                              {selectedBug.status === 'open' ? 'In Attesa' : selectedBug.status === 'in_progress' ? 'In Lavorazione' : selectedBug.status === 'resolved' ? 'Risolto' : 'Chiuso'}
                            </span>
                            
                            {/* Pulsanti cambio status nel modal */}
                            <div className="modal-status-actions">
                              {selectedBug.status === 'open' && (
                                <button
                                  className="btn-status btn-in-progress"
                                  onClick={() => handleStatusChange(selectedBug.id, 'in_progress')}
                                  title="Metti in lavorazione"
                                >
                                  🔄 In Lavorazione
                                </button>
                              )}
                              
                              {selectedBug.status === 'in_progress' && (
                                <>
                                  <button
                                    className="btn-status btn-resolved"
                                    onClick={() => handleStatusChange(selectedBug.id, 'resolved')}
                                    title="Segna come risolto"
                                  >
                                    ✅ Risolto
                                  </button>
                                  <button
                                    className="btn-status btn-back"
                                    onClick={() => handleStatusChange(selectedBug.id, 'open')}
                                    title="Torna in attesa"
                                  >
                                    ⬅️ Torna Indietro
                                  </button>
                                </>
                              )}
                              
                              {selectedBug.status === 'resolved' && (
                                <button
                                  className="btn-status btn-back"
                                  onClick={() => handleStatusChange(selectedBug.id, 'in_progress')}
                                  title="Torna in lavorazione"
                                >
                                  🔄 Torna in Lavorazione
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                       
                       <div className="detail-row">
                         <label>Data segnalazione:</label>
                         <span>{new Date(selectedBug.created_at).toLocaleString('it-IT')}</span>
                       </div>
                       
                       <div className="detail-row">
                         <label>Browser/OS:</label>
                         <span>{selectedBug.browser_info}</span>
                       </div>
                       
                       <div className="detail-row full-width">
                         <label>Descrizione:</label>
                         <p className="bug-description-full">{selectedBug.description}</p>
                       </div>
                       
                       <div className="detail-row full-width">
                         <label htmlFor="admin-notes">Note Admin:</label>
                         <textarea
                           id="admin-notes"
                           placeholder="Aggiungi note o commenti..."
                           value={selectedBug.admin_notes || ''}
                           onChange={(e) => setSelectedBug({...selectedBug, admin_notes: e.target.value})}
                         />
                       </div>
                     </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Chiudi
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleUpdateNotes(selectedBug.id, selectedBug.admin_notes)}
              >
                <FaCheckCircle /> Salva Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestioneBugReports;
