import React, { useState, useEffect } from 'react'

export default function AdminSidebar({ currentView, onViewChange, userRole }) {
  const [serverStatus, setServerStatus] = useState('checking') // 'online', 'offline', 'checking'

  // Funzione per controllare lo stato del server
  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // Timeout di 3 secondi
      })
      
      if (response.ok) {
        setServerStatus('online')
      } else {
        setServerStatus('offline')
      }
    } catch (error) {
      setServerStatus('offline')
    }
  }

  // Controlla lo stato del server al mount e ogni 30 secondi
  useEffect(() => {
    checkServerStatus()
    
    const interval = setInterval(checkServerStatus, 30000) // Controlla ogni 30 secondi
    
    return () => clearInterval(interval)
  }, [])

  const getMenuItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        description: 'Panoramica generale',
        icon: '📊'
      }
    ]

    // Solo admin, salacorsi e docente possono vedere Gestione Corsi
    if (userRole === 'admin' || userRole === 'salacorsi' || userRole === 'docente') {
      baseItems.push({
        id: 'corsi',
        label: 'Gestione Corsi',
        description: 'Richieste informazioni',
        icon: '🎸'
      })
    }

    // Solo admin e salaprove possono vedere Gestione Prenotazioni
    if (userRole === 'admin' || userRole === 'salaprove') {
      baseItems.push({
        id: 'prenotazioni',
        label: 'Gestione Prenotazioni',
        description: 'Sala prove e disponibilità',
        icon: '🎤'
      })
    }

    // Solo admin e news possono gestire le News
    if (userRole === 'admin' || userRole === 'news') {
      baseItems.push({
        id: 'news',
        label: 'Gestione News',
        description: 'Articoli e comunicazioni',
        icon: '📰'
      })
    }

    // Solo admin può gestire gli Utenti
    if (userRole === 'admin') {
      baseItems.push({
        id: 'gestione-utenti',
        label: 'Gestione Utenti',
        description: 'Utenti e permessi',
        icon: '👥'
      })
    }

    // Solo admin può gestire i Bug Reports
    if (userRole === 'admin') {
      baseItems.push({
        id: 'bug-reports',
        label: 'Bug Reports',
        description: 'Segnalazioni utenti',
        icon: '🐛'
      })
    }

    // Solo admin può vedere Pannello di Controllo
    if (userRole === 'admin') {
      baseItems.push({
        id: 'controllo',
        label: 'Pannello di Controllo',
        description: 'Configurazione dashboard',
        icon: '⚙️'
      })
    }

    return baseItems
  }

  const menuItems = getMenuItems()

  // Funzione per ottenere la classe CSS del pallino di stato
  const getStatusDotClass = () => {
    switch (serverStatus) {
      case 'online':
        return 'status-dot online'
      case 'offline':
        return 'status-dot offline'
      case 'checking':
        return 'status-dot checking'
      default:
        return 'status-dot offline'
    }
  }

  // Funzione per ottenere il testo dello stato
  const getStatusText = () => {
    switch (serverStatus) {
      case 'online':
        return 'Sistema Online'
      case 'offline':
        return 'Sistema Offline'
      case 'checking':
        return 'Controllo Server...'
      default:
        return 'Sistema Offline'
    }
  }

  return (
    <div className="admin-sidebar">
      <div className="sidebar-nav">
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-button ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <div className="nav-content">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
                {currentView === item.id && (
                  <span className="nav-indicator"></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="sidebar-footer">
        <div className="admin-status">
          <span className={getStatusDotClass()}></span>
          <span className="status-text">
            {getStatusText()}
          </span>
        </div>
        
        <div className="version-info">
          <div className="version">v1.0.0</div>
        </div>
        
        {/* Pulsante per tornare alla dashboard pubblica - sempre visibile */}
        <button
          className="nav-button"
          onClick={() => window.location.href = '/'}
          style={{
            marginTop: '1rem',
            background: 'var(--admin-info)',
            color: 'white',
            border: 'none'
          }}
        >
          <span className="nav-icon">🏠</span>
          <div className="nav-content">
            <span className="nav-label">Torna alla Dashboard</span>
            <span className="nav-description">Dashboard pubblica</span>
          </div>
        </button>
      </div>
    </div>
  )
}