import React, { useState, useEffect } from 'react'

export default function ControlloPanel({ toast }) {
  const [isEditing, setIsEditing] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    quadrants: true,
    dashboard: true,
    events: true,
    contacts: true,
    users: true,
    backup: false // Nuova sezione backup
  })
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: null,
    backupSize: 0,
    availableSpace: 0,
    backupHistory: [],
    isCreating: false
  })
  const [config, setConfig] = useState({
    // Dashboard quadrants
    quadrants: {
      salaProve: { enabled: true, title: 'SALA PROVE', icon: '🎤' },
      salaCorsi: { enabled: true, title: 'IMPARAR SUONANDO', icon: '🎸' },
      news: { enabled: true, title: 'NEWS & COMUNICAZIONI', icon: '📰' },
      mattascuola: { enabled: true, title: 'MATTASCUOLA', icon: '📚' },
      sostienici: { enabled: true, title: 'SOSTIENICI', icon: '❤️' },
      tesseraArci: { enabled: true, title: 'TESSERA ARCI 2024-2025', icon: '🎫' }
    },
    // Dashboard settings
    dashboard: {
              title: 'AriaPerta',
      subtitle: 'Centro Culturale e Sociale',
      showSocialLinks: true,
      showBugReport: true,
      showAdminButton: true
    },
    // Event settings
    events: {
      ariapertaParty: {
        enabled: true,
        title: 'ARIAPERTAPARTY',
        startDate: '2024-12-31',
        endDate: '2025-01-01',
        isFree: true
      }
    },
    // Contact settings
    contacts: {
              email: 'info@ariaperta.it',
      phone: '+39 123 456 789',
      address: 'Via Roma 123, Milano'
    }
  })

  const [originalConfig, setOriginalConfig] = useState(null)

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

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    localStorage.setItem('dashboardConfig', JSON.stringify(config))
    setOriginalConfig(config)
    setIsEditing(false)
    
    // Emette un evento personalizzato per aggiornare la dashboard in tempo reale
    window.dispatchEvent(new CustomEvent('dashboardConfigChanged'))
    
              // Show success message
          toast.showSuccess('Configurazione salvata con successo!', 4000)
  }

  const handleCancel = () => {
    setConfig(originalConfig)
    setIsEditing(false)
  }

  const handleReset = () => {
    const defaultConfig = {
      // Dashboard quadrants
      quadrants: {
        salaProve: { enabled: true, title: 'SALA PROVE', icon: '🎤' },
        salaCorsi: { enabled: true, title: 'IMPARAR SUONANDO', icon: '🎸' },
        news: { enabled: true, title: 'NEWS & COMUNICAZIONI', icon: '📰' },
        mattascuola: { enabled: true, title: 'MATTASCUOLA', icon: '📚' },
        sostienici: { enabled: true, title: 'SOSTIENICI', icon: '❤️' },
        tesseraArci: { enabled: true, title: 'TESSERA ARCI 2024-2025', icon: '🎫' }
      },
      // Dashboard settings
      dashboard: {
        title: 'AriaPerta',
        subtitle: 'Centro Culturale e Sociale',
        showSocialLinks: true,
        showBugReport: true,
        showAdminButton: true
      },
      // Event settings
      events: {
        ariapertaParty: {
          enabled: true,
          title: 'ARIAPERTAPARTY',
          startDate: '2024-12-31',
          endDate: '2025-01-01',
          isFree: true
        }
      },
      // Contact settings
      contacts: {
        email: 'info@ariaperta.it',
        phone: '+39 123 456 789',
        address: 'Via Roma 123, Milano'
      }
    }
    
    setConfig(defaultConfig)
    setOriginalConfig(defaultConfig)
    localStorage.setItem('dashboardConfig', JSON.stringify(defaultConfig))
    
    // Emette un evento personalizzato per aggiornare la dashboard in tempo reale
    window.dispatchEvent(new CustomEvent('dashboardConfigChanged'))
    
    toast.showSuccess('Configurazione resettata ai valori predefiniti!', 4000)
  }

  const toggleQuadrant = (key) => {
    if (!isEditing) return
    setConfig(prev => ({
      ...prev,
      quadrants: {
        ...prev.quadrants,
        [key]: {
          ...prev.quadrants[key],
          enabled: !prev.quadrants[key].enabled
        }
      }
    }))
  }

  const updateQuadrant = (key, field, value) => {
    if (!isEditing) return
    setConfig(prev => ({
      ...prev,
      quadrants: {
        ...prev.quadrants,
        [key]: {
          ...prev.quadrants[key],
          [field]: value
        }
      }
    }))
  }

  const updateDashboardSetting = (field, value) => {
    if (!isEditing) return
    setConfig(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        [field]: value
      }
    }))
  }

  const updateEventSetting = (field, value) => {
    if (!isEditing) return
    setConfig(prev => ({
      ...prev,
      events: {
        ...prev.events,
        ariapertaParty: {
          ...prev.events.ariapertaParty,
          [field]: value
        }
      }
    }))
  }

  const updateContactSetting = (field, value) => {
    if (!isEditing) return
    setConfig(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [field]: value
      }
    }))
  }

  // Funzioni per gestione backup
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const createBackup = async () => {
    setBackupStatus(prev => ({ ...prev, isCreating: true }))
    
    try {
      const response = await fetch('http://localhost:3001/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setBackupStatus(prev => ({
          ...prev,
          lastBackup: new Date().toLocaleString('it-IT'),
          backupSize: result.size || 0,
          isCreating: false
        }))
        toast.showSuccess('Backup creato con successo!')
        loadBackupStatus() // Ricarica lo stato
      } else {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        throw new Error('Errore nella creazione del backup')
      }
    } catch (error) {
      console.error('Errore backup:', error)
      setBackupStatus(prev => ({ ...prev, isCreating: false }))
      toast.showError('Errore nella creazione del backup')
    }
  }

  const loadBackupStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/backup/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      
      if (response.ok) {
        const status = await response.json()
        setBackupStatus(prev => ({
          ...prev,
          lastBackup: status.lastBackup,
          backupSize: status.backupSize,
          availableSpace: status.availableSpace,
          backupHistory: status.backupHistory || []
        }))
      } else {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
      }
    } catch (error) {
      console.error('Errore caricamento stato backup:', error)
    }
  }

  useEffect(() => {
    // Load configuration from localStorage or use default
    const savedConfig = localStorage.getItem('dashboardConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        setOriginalConfig(parsed)
      } catch (error) {
        console.error('Error loading config:', error)
        setOriginalConfig(config)
      }
    } else {
      setOriginalConfig(config)
    }

    // Carica stato backup
    loadBackupStatus()
  }, [])

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

  return (
    <div className="controllo-panel">
      <div className="panel-header">
        <h1>🎯 Pannello di Controllo</h1>
        <p>Gestisci la configurazione della dashboard e dei quadranti</p>
      </div>

      <div className="panel-actions">
        {!isEditing ? (
          <>
            <button className="edit-btn" onClick={handleEdit}>
              ✏️ Modifica Configurazione
            </button>
            <button className="reset-btn" onClick={handleReset}>
              🔄 Reset Configurazione
            </button>
          </>
        ) : (
          <>
            <button className="save-btn" onClick={handleSave}>
              💾 Salva Modifiche
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              ❌ Annulla
            </button>
            <button className="reset-btn" onClick={handleReset}>
              🔄 Reset Configurazione
            </button>
          </>
        )}
      </div>

      <div className="config-sections">
        {/* Quadrants Configuration */}
        <section className="config-section">
          <div className="section-header" onClick={() => toggleSection('quadrants')}>
            <h2>🎯 Configurazione Quadranti</h2>
            <span className="toggle-icon">{expandedSections.quadrants ? '▼' : '▶'}</span>
          </div>
          {expandedSections.quadrants && (
          <div className="quadrants-grid">
            {Object.entries(config.quadrants).map(([key, quadrant]) => (
              <div key={key} className={`quadrant-item ${!quadrant.enabled ? 'disabled' : ''}`}>
                <div className="quadrant-header">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={quadrant.enabled}
                      onChange={() => toggleQuadrant(key)}
                      disabled={!isEditing}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="quadrant-icon">{quadrant.icon}</span>
                </div>
                
                {isEditing ? (
                  <input
                    type="text"
                    value={quadrant.title}
                    onChange={(e) => updateQuadrant(key, 'title', e.target.value)}
                    className="quadrant-title-input"
                    placeholder="Titolo quadrante"
                  />
                ) : (
                  <h3 className="quadrant-title">{quadrant.title}</h3>
                )}
                
                {isEditing && (
                  <input
                    type="text"
                    value={quadrant.icon}
                    onChange={(e) => updateQuadrant(key, 'icon', e.target.value)}
                    className="quadrant-icon-input"
                    placeholder="Icona (emoji)"
                  />
                )}
                
                <div className="quadrant-status">
                  {quadrant.enabled ? '✅ Abilitato' : '❌ Disabilitato'}
                </div>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* Dashboard Settings */}
        <section className="config-section">
          <div className="section-header" onClick={() => toggleSection('dashboard')}>
            <h2>🏠 Impostazioni Dashboard</h2>
            <span className="toggle-icon">{expandedSections.dashboard ? '▼' : '▶'}</span>
          </div>
          {expandedSections.dashboard && (
          <div className="settings-grid">
            <div className="setting-item">
              <label>Titolo Principale:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={config.dashboard.title}
                  onChange={(e) => updateDashboardSetting('title', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.dashboard.title}</span>
              )}
            </div>
            
            <div className="setting-item">
              <label>Sottotitolo:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={config.dashboard.subtitle}
                  onChange={(e) => updateDashboardSetting('subtitle', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.dashboard.subtitle}</span>
              )}
            </div>
            
            <div className="setting-item">
              <label>Mostra Link Social:</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.dashboard.showSocialLinks}
                  onChange={(e) => updateDashboardSetting('showSocialLinks', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="setting-item">
              <label>Mostra Segnala Bug:</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.dashboard.showBugReport}
                  onChange={(e) => updateDashboardSetting('showBugReport', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="setting-item">
              <label>Mostra Pulsante Admin:</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.dashboard.showAdminButton}
                  onChange={(e) => updateDashboardSetting('showAdminButton', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          )}
        </section>

        {/* Event Settings */}
        <section className="config-section">
          <div className="section-header" onClick={() => toggleSection('events')}>
            <h2>🎉 Impostazioni Eventi</h2>
            <span className="toggle-icon">{expandedSections.events ? '▼' : '▶'}</span>
          </div>
          {expandedSections.events && (
          <div className="settings-grid">
            <div className="setting-item">
              <label>Abilita ARIAPERTAPARTY:</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.events.ariapertaParty.enabled}
                  onChange={(e) => updateEventSetting('enabled', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="setting-item">
              <label>Titolo Evento:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={config.events.ariapertaParty.title}
                  onChange={(e) => updateEventSetting('title', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.events.ariapertaParty.title}</span>
              )}
            </div>
            
            <div className="setting-item">
              <label>Data Inizio:</label>
              {isEditing ? (
                <input
                  type="date"
                  value={config.events.ariapertaParty.startDate}
                  onChange={(e) => updateEventSetting('startDate', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.events.ariapertaParty.startDate}</span>
              )}
            </div>
            
            <div className="setting-item">
              <label>Data Fine:</label>
              {isEditing ? (
                <input
                  type="date"
                  value={config.events.ariapertaParty.endDate}
                  onChange={(e) => updateEventSetting('endDate', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.events.ariapertaParty.endDate}</span>
              )}
            </div>
            
            <div className="setting-item">
              <label>Evento Gratuito:</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={config.events.ariapertaParty.isFree}
                  onChange={(e) => updateEventSetting('isFree', e.target.checked)}
                  disabled={!isEditing}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          )}
        </section>

        {/* Contact Settings */}
        <section className="config-section">
          <div className="section-header" onClick={() => toggleSection('contacts')}>
            <h2>📞 Impostazioni Contatti</h2>
            <span className="toggle-icon">{expandedSections.contacts ? '▼' : '▶'}</span>
          </div>
          {expandedSections.contacts && (
          <div className="settings-grid">
            <div className="setting-item">
              <label>Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  value={config.contacts.email}
                  onChange={(e) => updateContactSetting('email', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.contacts.email}</span>
              )}
            </div>
            
            <div className="setting-item">
              <label>Telefono:</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={config.contacts.phone}
                  onChange={(e) => updateContactSetting('phone', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.contacts.phone}</span>
              )}
            </div>
            
            <div className="setting-item">
              <label>Indirizzo:</label>
              {isEditing ? (
                <input
                  type="text"
                  value={config.contacts.address}
                  onChange={(e) => updateContactSetting('address', e.target.value)}
                  className="setting-input"
                />
              ) : (
                <span className="setting-value">{config.contacts.address}</span>
              )}
            </div>
          </div>
          )}
        </section>

        {/* User Management Section */}
        <section className="config-section">
          <div className="section-header" onClick={() => toggleSection('users')}>
            <h2>👥 Gestione Utenti</h2>
            <span className="toggle-icon">{expandedSections.users ? '▼' : '▶'}</span>
          </div>
          {expandedSections.users && (
          <div className="user-management-info">
            <p>Gestisci utenti e permessi del sistema. Monitora l'attività e gestisci i ruoli degli utenti.</p>
            
            <div className="user-management-stats">
              <div className="user-stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">9</div>
                  <div className="stat-label">Utenti Totali</div>
                </div>
              </div>
              
              <div className="user-stat-card">
                <div className="stat-icon">👑</div>
                <div className="stat-content">
                  <div className="stat-number">2</div>
                  <div className="stat-label">Amministratori</div>
                </div>
              </div>
              
              <div className="user-stat-card">
                <div className="stat-icon">🎸</div>
                <div className="stat-content">
                  <div className="stat-number">2</div>
                  <div className="stat-label">Sala Prove</div>
                </div>
              </div>
              
              <div className="user-stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">1</div>
                  <div className="stat-label">Imparar Suonando</div>
                </div>
              </div>
              
              <div className="user-stat-card">
                <div className="stat-icon">📰</div>
                <div className="stat-content">
                  <div className="stat-number">1</div>
                  <div className="stat-label">Gestione News</div>
                </div>
              </div>
              
              <div className="user-stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <div className="stat-number">3</div>
                  <div className="stat-label">Utenti Base</div>
                </div>
              </div>
            </div>
            
            <div className="user-management-actions">
              <button 
                className="btn-primary"
                onClick={() => window.location.hash = '#/gestione-utenti'}
              >
                🔐 Gestione Utenti Completa
              </button>
              
              <button 
                className="btn-secondary"
                onClick={() => window.location.hash = '#/gestione-utenti'}
              >
                📊 Statistiche Dettagliate
              </button>
            </div>
            
            <div className="user-management-info-details">
              <h4>Funzionalità Disponibili:</h4>
              <ul>
                <li>✅ Visualizzazione completa degli utenti</li>
                <li>✅ Gestione ruoli e permessi</li>
                <li>✅ Reset password utenti</li>
                <li>✅ Monitoraggio ultimi accessi</li>
                <li>✅ Statistiche per ruolo</li>
              </ul>
            </div>
          </div>
          )}
        </section>

        {/* Backup Management Section */}
        <section className="config-section">
          <div className="section-header" onClick={() => toggleSection('backup')}>
            <h2>📦 Gestione Backup</h2>
            <span className="toggle-icon">{expandedSections.backup ? '▼' : '▶'}</span>
          </div>
          {expandedSections.backup && (
          <div className="backup-management-info">
            <p>Gestisci i backup del sistema. Crea backup manuali, monitora lo stato e gestisci lo spazio disco.</p>
            
            {/* Stato Backup */}
            <div className="backup-status-overview">
              <div className="backup-stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <div className="stat-number">{backupStatus.lastBackup ? '✅' : '❌'}</div>
                  <div className="stat-label">Ultimo Backup</div>
                  <div className="stat-value">
                    {backupStatus.lastBackup || 'Mai creato'}
                  </div>
                </div>
              </div>
              
              <div className="backup-stat-card">
                <div className="stat-icon">💾</div>
                <div className="stat-content">
                  <div className="stat-number">{backupStatus.backupSize}MB</div>
                  <div className="stat-label">Dimensione Backup</div>
                  <div className="stat-value">
                    {backupStatus.backupSize > 0 ? 'Backup disponibile' : 'Nessun backup'}
                  </div>
                </div>
              </div>
              
              <div className="backup-stat-card">
                <div className="stat-icon">💿</div>
                <div className="stat-content">
                  <div className="stat-number">{backupStatus.availableSpace}GB</div>
                  <div className="stat-label">Spazio Disponibile</div>
                  <div className="stat-value">
                    {backupStatus.availableSpace > 1 ? 'Spazio sufficiente' : 'Spazio limitato'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Backup */}
            <div className="backup-actions">
              <button 
                className={`btn-primary ${backupStatus.isCreating ? 'disabled' : ''}`}
                onClick={createBackup}
                disabled={backupStatus.isCreating}
              >
                {backupStatus.isCreating ? '⏳ Creazione Backup...' : '📦 Crea Backup'}
              </button>
              
              <button 
                className="btn-secondary"
                onClick={loadBackupStatus}
              >
                🔄 Aggiorna Stato
              </button>
            </div>
            
            {/* Storico Backup */}
            {backupStatus.backupHistory.length > 0 && (
              <div className="backup-history">
                <h4>📁 Storico Backup:</h4>
                <div className="backup-list">
                  {backupStatus.backupHistory.map((backup, index) => (
                    <div key={index} className="backup-item">
                      <span className="backup-date">{backup.date}</span>
                      <span className="backup-size">{backup.size}MB</span>
                      <span className="backup-type">{backup.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Informazioni Backup */}
            <div className="backup-info-details">
              <h4>ℹ️ Informazioni Backup:</h4>
              <ul>
                <li>✅ Backup completo del database e file di configurazione</li>
                <li>✅ Compressione automatica per risparmiare spazio</li>
                <li>✅ Rotazione automatica (mantiene ultimi 7 giorni)</li>
                <li>✅ Verifica integrità automatica</li>
                <li>✅ Download manuale dei backup</li>
              </ul>
              
              <div className="backup-warning">
                <p>⚠️ <strong>Importante:</strong> I backup vengono salvati localmente. Per maggiore sicurezza, considera di copiarli su un dispositivo esterno o cloud storage.</p>
              </div>
            </div>
          </div>
          )}
        </section>
      </div>
    </div>
  )
}
