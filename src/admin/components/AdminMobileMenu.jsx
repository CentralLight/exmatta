import React, { useState } from 'react'

export default function AdminMobileMenu({ currentView, onViewChange, userRole, onClose, onLogout, onResetPassword }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    if (onClose) onClose()
  }

  const handleViewChange = (viewId) => {
    onViewChange(viewId)
    closeMobileMenu()
  }

  const handleResetPassword = () => {
    if (onResetPassword) {
      onResetPassword()
    }
    closeMobileMenu()
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
    closeMobileMenu()
  }

  const handleGoToPublic = () => {
    // Naviga alla dashboard pubblica
    window.location.href = '/'
  }

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

  return (
    <>
      {/* HAMBURGER MENU MOBILE - SEMPRE VISIBILE */}
      <button 
        className={`admin-mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Apri menu mobile admin"
        aria-expanded={isMobileMenuOpen}
      >
        <div className="admin-hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {/* MOBILE MENU OVERLAY */}
      <div className={`admin-mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="admin-mobile-menu-content">
          <div className="admin-mobile-menu-header">
            <div className="admin-mobile-menu-header-actions">
              <button 
                className="admin-mobile-menu-public"
                onClick={handleGoToPublic}
                aria-label="Torna alla dashboard pubblica"
              >
                🏠
              </button>
            </div>
          </div>
          
          <div className="admin-mobile-menu-items">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`admin-mobile-menu-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => handleViewChange(item.id)}
              >
                <span className="admin-item-icon">{item.icon}</span>
                <div className="admin-item-content">
                  <span className="admin-item-label">{item.label}</span>
                  <span className="admin-item-description">{item.description}</span>
                </div>
                {currentView === item.id && (
                  <span className="admin-item-indicator">▶️</span>
                )}
              </button>
            ))}
          </div>

          <div className="admin-mobile-menu-footer">
            <div className="admin-user-info">
              <span className="admin-user-role">👑 {userRole?.toUpperCase()}</span>
            </div>
            
            {/* Pulsanti azioni speciali */}
            <div className="admin-mobile-menu-actions">
              <button
                className="admin-mobile-menu-action-btn admin-mobile-menu-reset"
                onClick={handleResetPassword}
              >
                <span className="admin-mobile-menu-action-icon">🔐</span>
                <span className="admin-mobile-menu-action-label">Reset Password</span>
              </button>
              
              <button
                className="admin-mobile-menu-action-btn admin-mobile-menu-logout"
                onClick={handleLogout}
              >
                <span className="admin-mobile-menu-action-icon">🚪</span>
                <span className="admin-mobile-menu-action-label">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
