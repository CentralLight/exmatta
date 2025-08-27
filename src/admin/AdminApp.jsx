import { useState, useEffect } from 'react'
import AdminHeader from './components/AdminHeader'
import AdminSidebar from './components/AdminSidebar'
import AdminMobileMenu from './components/AdminMobileMenu'
import Dashboard from './components/Dashboard'
import GestioneCorsi from './components/GestioneCorsi'
import GestionePrenotazioni from './components/GestionePrenotazioni'
import GestioneNews from './components/GestioneNews'
import GestioneBugReports from './components/GestioneBugReports'
import GestioneUtenti from './components/GestioneUtenti'
import ControlloPanel from './components/ControlloPanel'
import Login from './components/Login'
import ToastContainer from './components/ToastContainer'
import useToast from './hooks/useToast'
import { authService } from '../services/api'
import CustomScrollbar from '../components/CustomScrollbar'
import './styles/admin.css'
import './styles/admin-mobile.css'

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [userRole, setUserRole] = useState(null)
  const [adminData, setAdminData] = useState({
    username: '',
    role: '',
    lastLogin: null
  })
  
  const toast = useToast()

  // Debug localStorage tracking rimosso - problema identificato

  // Validate JWT token format
  const isValidJWT = (token) => {
    if (!token) return false;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Basic validation - just check if parts exist and have reasonable length
    // Skip the strict base64 validation that was causing issues
    return parts.every(part => part && part.length > 0);
  };

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const role = localStorage.getItem('userRole')
    const username = localStorage.getItem('adminUsername')
    
    // Validate token format before using it
    if (token && isValidJWT(token) && role && username) {
      setIsAuthenticated(true)
      setUserRole(role)
      setAdminData(prev => ({
        ...prev,
        username: username,
        role: role,
        lastLogin: new Date().toLocaleString('it-IT')
      }))
    } else {
      // Clear corrupted tokens
      if (token && !isValidJWT(token)) {
        console.warn('Corrupted JWT token detected, clearing localStorage');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('adminUsername');
      }
    }
  }, [])

  const handleLogin = async (username, password) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('adminUsername', data.user.username);
          
          setIsAuthenticated(true);
          setUserRole(data.user.role);
          setAdminData(prev => ({
            ...prev,
            username: data.user.username,
            role: data.user.role,
            lastLogin: new Date().toLocaleString('it-IT')
          }));
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Errore durante il login:', error);
      return false;
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('adminUsername') // Remove any old keys
    
    setIsAuthenticated(false)
    setUserRole(null)
    setCurrentView('dashboard')
  }

  // Clear all tokens (useful for JWT errors)
  const clearAllTokens = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('adminUsername')
    setIsAuthenticated(false)
    setUserRole(null)
    setCurrentView('dashboard')
  }

  // Expose clearAllTokens to child components
  const adminContext = {
    clearAllTokens,
    userRole,
    adminData
  }

  const changeView = (view) => {
    setCurrentView(view)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <CustomScrollbar>
      <div className="admin-app">
      <AdminHeader 
        adminData={adminData} 
        onLogout={handleLogout} 
      />
      
      {/* Menu Mobile Admin */}
      <AdminMobileMenu 
        currentView={currentView}
        onViewChange={changeView}
        userRole={userRole}
        onLogout={handleLogout}
        onResetPassword={() => {
          // Funzione per reset password - da implementare
          console.log('Reset password requested')
        }}
      />
      
      <div className="admin-container">
        <AdminSidebar 
          currentView={currentView} 
          onViewChange={changeView}
          userRole={userRole}
        />
        
        <main className="admin-main">
          {currentView === 'dashboard' && (
            <div className="dashboard-view">
              <Dashboard onViewChange={changeView} toast={toast} userRole={userRole} clearAllTokens={clearAllTokens} />
            </div>
          )}
          
          {currentView === 'corsi' && (userRole === 'admin' || userRole === 'salacorsi' || userRole === 'docente') && (
            <div className="corsi-view">
              <GestioneCorsi onViewChange={changeView} toast={toast} userRole={userRole} clearAllTokens={clearAllTokens} />
            </div>
          )}
          
          {currentView === 'prenotazioni' && (userRole === 'admin' || userRole === 'salaprove' || userRole === 'salacorsi') && (
            <div className="prenotazioni-view">
              <GestionePrenotazioni />
            </div>
          )}
          
          {currentView === 'gestione-utenti' && userRole === 'admin' && (
            <div className="utenti-view">
              <GestioneUtenti onViewChange={changeView} toast={toast} userRole={userRole} clearAllTokens={clearAllTokens} />
            </div>
          )}
          
          {currentView === 'bug-reports' && (userRole === 'admin' || userRole === 'news') && (
            <div className="bug-reports-view">
              <GestioneBugReports onViewChange={changeView} toast={toast} userRole={userRole} clearAllTokens={clearAllTokens} />
            </div>
          )}
          
          {currentView === 'disponibilita' && (userRole === 'admin' || userRole === 'salaprove') && (
            <div className="disponibilita-view">
              <GestioneDisponibilita onViewChange={changeView} toast={toast} userRole={userRole} clearAllTokens={clearAllTokens} />
            </div>
          )}
          
          {currentView === 'news' && (userRole === 'admin' || userRole === 'news') && (
            <div className="news-view">
              <GestioneNews onViewChange={changeView} toast={toast} userRole={userRole} clearAllTokens={clearAllTokens} />
            </div>
          )}
          
          {currentView === 'controllo' && userRole === 'admin' && (
            <div className="controllo-view">
              <ControlloPanel onViewChange={changeView} toast={toast} clearAllTokens={clearAllTokens} />
            </div>
          )}
        </main>
      </div>
      
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      </div>
    </CustomScrollbar>
  )
}