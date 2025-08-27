import { motion } from 'framer-motion'

export default function AdminHeader({ adminData, onLogout }) {
  return (
    <motion.header 
      className="admin-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-left">
        <div className="admin-logo">
          <img src="/images/logos/exmatta-logo.png" alt="AriaPerta Logo" />
          <span className="admin-title">Admin Dashboard</span>
        </div>
      </div>

      <div className="header-center">
        <h1>Gestione Exmatta</h1>
        <p>Pannello di controllo amministrativo</p>
      </div>

      <div className="header-right">
        <div className="admin-info">
          <div className="admin-name">
            <span className="admin-icon">🛡️</span>
            <span className="admin-title">{adminData.role === 'admin' ? 'Amministratore' : adminData.role === 'user' ? 'Utente' : adminData.role === 'news' ? 'News' : adminData.role === 'salaprove' ? 'Sala Prove' : adminData.role === 'salacorsi' ? 'Imparar Suonando' : 'Utente'}</span>
          </div>
          <div className="admin-details">
            <span className="admin-username">{adminData.username}</span>
            <span className="admin-role">{adminData.role}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="reset-password-btn"
            onClick={() => window.location.hash = '#/gestione-utenti'}
            title="Reset Password"
          >
            <span className="reset-icon">🔐</span>
            <span className="reset-text">Reset Password</span>
          </button>
          
          <button 
            className="logout-btn"
            onClick={onLogout}
            title="Logout"
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </div>
    </motion.header>
  )
}
