import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { courseService, bookingService, newsService, emailService, exportService, backupService } from '../../services/api'

export default function Dashboard({ onViewChange, toast, userRole }) {
  // Se l'utente è un docente, mostra solo le sue statistiche
  const isTeacher = userRole === 'docente';
  const [stats, setStats] = useState({
    totalCorsi: 0,
    totalPrenotazioni: 0,
    corsiOggi: 0,
    prenotazioniOggi: 0,
    corsiInAttesa: 0,
    prenotazioniAttive: 0,
    totalNews: 0,
    newsOggi: 0,
    emailInviate: 0,
    emailOggi: 0
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [activitiesError, setActivitiesError] = useState(false)

  // Carica le statistiche dal backend
  const loadStats = async () => {
    try {
      // Verifica che l'utente sia autenticato prima di fare chiamate API
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.warn('Dashboard: Token non trovato, saltando caricamento statistiche');
        return;
      }

      if (isTeacher) {
         // Per i docenti, carica solo le loro richieste corsi
         const recentCourses = await courseService.getAll().catch(err => {
           console.error('Errore caricamento corsi docente:', err)
           return []
         });
         
         // Calcola le statistiche dai dati effettivi
         const today = new Date().toISOString().split('T')[0];
         const corsiOggi = recentCourses.filter(course => 
           course.created_at && course.created_at.startsWith(today)
         ).length;
         
         const corsiInAttesa = recentCourses.filter(course => 
           course.status === 'In attesa'
         ).length;
         
         const newStats = {
           totalCorsi: recentCourses.length || 0,
           totalPrenotazioni: 0, // I docenti non gestiscono prenotazioni
           corsiOggi: corsiOggi,
           prenotazioniOggi: 0,
           corsiInAttesa: corsiInAttesa,
           prenotazioniAttive: 0,
           totalNews: 0, // I docenti non gestiscono news
           newsOggi: 0,
           emailInviate: 0, // I docenti non gestiscono email
           emailOggi: 0
         }
         
         setStats(newStats)
      } else {
        // Per admin e altri ruoli, carica tutte le statistiche
        const [courseStats, bookingStats, newsStats, emailStats] = await Promise.all([
          courseService.getStats().catch(err => {
            console.error('Errore statistiche corsi:', err)
            return { total_requests: 0, nuove_richieste: 0 }
          }),
          bookingService.getAll().catch(err => {
            console.error('Errore statistiche prenotazioni:', err)
            return []
          }),
          newsService.getStats().catch(err => {
            console.error('Errore statistiche news:', err)
            return { total_news: 0, pubblicate: 0 }
          }),
          emailService.getStats().catch(err => {
            console.error('Errore statistiche email:', err)
            return { total: 0, today: 0 }
          })
        ])
        
        const newStats = {
          totalCorsi: courseStats?.total_requests || 0,
          totalPrenotazioni: Array.isArray(bookingStats) ? bookingStats.length : 0,
          corsiOggi: courseStats?.today || 0,
          prenotazioniOggi: Array.isArray(bookingStats) ? 
            bookingStats.filter(b => {
              const today = new Date().toISOString().split('T')[0]
              return b.date === today
            }).length : 0,
          corsiInAttesa: courseStats?.nuove_richieste || 0,
          prenotazioniAttive: Array.isArray(bookingStats) ? 
            bookingStats.filter(b => b.status === 'approved').length : 0,
          totalNews: newsStats?.total_news || 0,
          newsOggi: newsStats?.pubblicate || 0,
          emailInviate: emailStats?.total || 0,
          emailOggi: emailStats?.today || 0
        }
        
        setStats(newStats)
      }
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error)
      // Fallback con dati demo
      setStats({
        totalCorsi: 24,
        totalPrenotazioni: 156,
        corsiOggi: 3,
        prenotazioniOggi: 8,
        corsiInAttesa: 7,
        prenotazioniAttive: 12,
        totalNews: 15,
        newsOggi: 3,
        emailInviate: 342,
        emailOggi: 12
      })
    }
  }

  // Carica le attività recenti
  const loadRecentActivities = async () => {
    try {
      // Verifica che l'utente sia autenticato prima di fare chiamate API
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.warn('Dashboard: Token non trovato, saltando caricamento attività recenti');
        return;
      }

      setActivitiesLoading(true)
      setActivitiesError(false)
      
      if (isTeacher) {
        // Per i docenti, carica solo le loro richieste corsi
        const recentCourses = await courseService.getAll().catch(() => [])
        
        const activities = []
        
        // Aggiungi solo richieste corsi recenti
        if (Array.isArray(recentCourses)) {
          recentCourses.slice(0, 5).forEach(course => {
            activities.push({
              id: `course-${course.id}`,
              type: 'course',
              icon: '🎸',
              title: 'Nuova richiesta corso',
              description: `${course.nome} - ${course.strumento}`,
              timestamp: new Date(course.created_at || Date.now()),
              status: course.status
            })
          })
        }
        
        setRecentActivities(activities)
      } else {
        // Per admin e altri ruoli, carica tutte le attività
        const [recentBookings, recentCourses] = await Promise.all([
          bookingService.getAll().catch(() => []),
          courseService.getAll().catch(() => [])
        ])
        
        const activities = []
        
        // Aggiungi prenotazioni recenti
        if (Array.isArray(recentBookings)) {
          recentBookings.slice(0, 5).forEach(booking => {
            activities.push({
              id: `booking-${booking.id}`,
              type: 'booking',
              icon: '🎤',
              title: `Prenotazione ${booking.status === 'approved' ? 'confermata' : 'in attesa'}`,
              description: `${booking.band_name} - ${new Date(booking.date).toLocaleDateString('it-IT')} ${booking.start_time}`,
              timestamp: new Date(booking.created_at || Date.now()),
              status: booking.status
            })
          })
        }
        
        // Aggiungi richieste corsi recenti
        if (Array.isArray(recentCourses)) {
          recentCourses.slice(0, 3).forEach(course => {
            activities.push({
              id: `course-${course.id}`,
              type: 'course',
              icon: '🎸',
              title: 'Nuova richiesta corso',
              description: `${course.nome} - ${course.strumento}`,
              timestamp: new Date(course.created_at || Date.now()),
              status: course.status
            })
          })
        }
        
        // Ordina per timestamp e prendi le ultime 5
        const sortedActivities = activities
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5)
        
        setRecentActivities(sortedActivities)
      }
    } catch (error) {
      console.error('Errore nel caricamento attività recenti:', error)
      setActivitiesError(true)
    } finally {
      setActivitiesLoading(false)
    }
  }

  // Formatta il tempo trascorso
  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Adesso'
    if (minutes < 60) return `${minutes} minuti fa`
    if (hours < 24) return `${hours} ore fa`
    return `${days} giorni fa`
  }

  useEffect(() => {
    loadStats()
    loadRecentActivities()
    
    // Aggiorna le statistiche ogni 30 secondi
    const interval = setInterval(() => {
      loadStats()
      loadRecentActivities()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [userRole]) // Aggiungi userRole come dipendenza

  const quickActions = [
    {
      id: 'nuova-prenotazione',
      label: 'Nuova Prenotazione',
      icon: '➕',
      description: 'Aggiungi una sala prove',
      action: () => {
        try { sessionStorage.setItem('openNewBooking', '1') } catch {}
        onViewChange && onViewChange('prenotazioni')
      },
      available: true,
      showFor: ['admin', 'salaprove']
    },
    {
      id: 'gestisci-corsi',
      label: 'Gestisci Corsi',
      icon: '🎸',
      description: 'Visualizza richieste iscrizione',
      action: () => onViewChange && onViewChange('corsi'),
      available: true,
      showFor: ['admin', 'salacorsi', 'docente']
    },
    {
      id: 'esporta-dati',
      label: 'Esporta Dati',
      icon: '📊',
      description: 'Scarica report e statistiche',
      action: () => exportData(),
      available: true,
      showFor: ['admin', 'salaprove', 'salacorsi', 'news']
    },
    {
      id: 'backup',
      label: 'Backup Sistema',
      icon: '💾',
      description: 'Crea backup del database',
      action: () => createBackup(),
      available: true,
      showFor: ['admin']
    }
  ]

  // Filtra le azioni rapide in base al ruolo dell'utente
  const getFilteredActions = () => {
    return quickActions.filter(action => action.showFor.includes(userRole))
  }

  const showNotAvailable = (featureName) => {
    toast.showInfo(
      `La funzione "${featureName}" non è ancora disponibile.\n\nQuesta funzionalità sarà implementata nelle prossime versioni del sistema.`,
      8000
    )
  }

  // Funzione per esportare i dati
  const exportData = async () => {
    try {
      toast.showInfo('📊 Esportazione dati in corso...', 3000)
      
      // Mostra modal di selezione tipo export
      const exportType = await showExportModal()
      
      if (!exportType) return
      
      let response
      let filename
      
      switch (exportType) {
        case 'bookings':
          response = await exportService.exportBookings()
          filename = `prenotazioni_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'courses':
          response = await exportService.exportCourses()
          filename = `corsi_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'news':
          response = await exportService.exportNews()
          filename = `news_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'all':
          response = await exportService.exportAll()
          filename = `export_completo_${new Date().toISOString().split('T')[0]}.json`
          break
        default:
          return
      }
      
      // Crea e scarica il file
      const blob = new Blob([response], { 
        type: exportType === 'all' ? 'application/json' : 'text/csv' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.showSuccess(`✅ ${exportType === 'all' ? 'Export completo' : 'CSV'} scaricato con successo!`)
    } catch (error) {
      console.error('Errore nell\'esportazione:', error)
      toast.showError('❌ Errore nell\'esportazione dei dati')
    }
  }

  // Funzione per creare backup del sistema
  const createBackup = async () => {
    try {
      toast.showInfo('💾 Creazione backup in corso...', 3000)
      
      // Crea il backup
      const response = await backupService.createBackup()
      
      // Il backup viene scaricato automaticamente dal browser
      toast.showSuccess('✅ Backup del database creato e scaricato!')
    } catch (error) {
      console.error('Errore nella creazione backup:', error)
      toast.showError('❌ Errore nella creazione del backup')
    }
  }

  // Modal per selezione tipo export
  const showExportModal = () => {
    return new Promise((resolve) => {
      const modal = document.createElement('div')
      modal.className = 'export-modal-overlay'
      modal.innerHTML = `
        <div class="export-modal">
          <h3>📊 Seleziona tipo di export</h3>
          <div class="export-options">
            <button class="export-option" data-type="bookings">
              <span class="export-icon">🎤</span>
              <div class="export-text">
                <strong>Prenotazioni</strong>
                <small>CSV con tutte le prenotazioni sala prove</small>
              </div>
            </button>
            <button class="export-option" data-type="courses">
              <span class="export-icon">🎸</span>
              <div class="export-text">
                <strong>Corsi</strong>
                <small>CSV con richieste iscrizione corsi</small>
              </div>
            </button>
            <button class="export-option" data-type="news">
              <span class="export-icon">📰</span>
              <div class="export-text">
                <strong>News</strong>
                <small>CSV con contenuti e articoli</small>
              </div>
            </button>
            <button class="export-option" data-type="all">
              <span class="export-icon">📦</span>
              <div class="export-text">
                <strong>Export Completo</strong>
                <small>JSON con tutti i dati del sistema</small>
              </div>
            </button>
          </div>
          <div class="export-actions">
            <button class="export-cancel">Annulla</button>
          </div>
        </div>
      `
      
      document.body.appendChild(modal)
      
      // Event listeners
      modal.querySelectorAll('.export-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type
          document.body.removeChild(modal)
          resolve(type)
        })
      })
      
      modal.querySelector('.export-cancel').addEventListener('click', () => {
        document.body.removeChild(modal)
        resolve(null)
      })
      
      // Chiudi cliccando fuori
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal)
          resolve(null)
        }
      })
    })
  }

  // Funzione per aggiornare le statistiche manualmente
  const refreshStats = () => {
    loadStats()
    toast.showSuccess('Statistiche aggiornate!')
  }

  // Filtra le statistiche in base al ruolo dell'utente
  const getFilteredStats = () => {
    const allStats = [
      {
        id: 'corsi',
        icon: '🎸',
        title: 'Iscrizioni Corsi',
        number: stats.totalCorsi,
        detail1: `+${stats.corsiOggi} oggi`,
        detail2: `${stats.corsiInAttesa} in attesa`,
        showFor: ['admin', 'salacorsi', 'docente', 'user']
      },
      {
        id: 'prenotazioni',
        icon: '🎤',
        title: 'Prenotazioni Sala',
        number: stats.totalPrenotazioni,
        detail1: `+${stats.prenotazioniOggi} oggi`,
        detail2: `${stats.prenotazioniAttive} attive`,
        showFor: ['admin', 'salaprove', 'user']
      },
      {
        id: 'news',
        icon: '📰',
        title: 'News Pubblicate',
        number: stats.totalNews || 0,
        detail1: `+${stats.newsOggi || 0} questa settimana`,
        detail2: 'Contenuti attivi',
        showFor: ['admin', 'news', 'user']
      },
      {
        id: 'email',
        icon: '📧',
        title: 'Email Inviate',
        number: stats.emailInviate || 0,
        detail1: `+${stats.emailOggi || 0} oggi`,
        detail2: 'Conferme e notifiche',
        showFor: ['admin', 'user']
      }
    ]

    return allStats.filter(stat => stat.showFor.includes(userRole))
  }

  return (
    <div className="admin-dashboard">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
                  <div className="header-text">
          <h1>{isTeacher ? 'Dashboard Docente' : 'Dashboard'}</h1>
          <p>{isTeacher ? 'Le tue richieste corsi e statistiche' : 'Panoramica generale di Exmatta'}</p>
        </div>
          <button 
            onClick={refreshStats}
            className="refresh-btn"
            title="Aggiorna statistiche"
          >
            Aggiorna 
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {getFilteredStats().map((stat, index) => (
          <motion.div 
            key={stat.id}
            className={`stat-card ${stat.id === 'corsi' ? 'primary' : stat.id === 'prenotazioni' ? 'secondary' : stat.id === 'news' ? 'accent' : 'info'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-detail">
                <span className="stat-change positive">{stat.detail1}</span>
                <span className={stat.id === 'corsi' ? 'stat-pending' : stat.id === 'prenotazioni' ? 'stat-active' : stat.id === 'news' ? 'stat-trend' : 'stat-status'}>{stat.detail2}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="quick-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2>{isTeacher ? 'Azioni Disponibili' : 'Azioni Rapide'}</h2>
        <div className="actions-grid">
          {getFilteredActions().map((action, index) => (
            <motion.div
              key={action.id}
              className={`action-card ${!action.available ? 'not-available' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            >
              <span className="action-icon">{action.icon}</span>
              <div className="action-content">
                <h3>{action.label}</h3>
                <p>{action.description}</p>
                {!action.available && (
                  <div className="not-available-banner">
                    Questa funzione non è ancora disponibile
                  </div>
                )}
              </div>
              {action.available ? (
                <motion.button
                  className="action-button"
                  onClick={action.action}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Accedi
                </motion.button>
              ) : (
                <button
                  className="action-button disabled"
                  onClick={action.action}
                >
                  Info
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        className="recent-activity"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h2>{isTeacher ? 'Le Tue Richieste Recenti' : 'Attività Recenti'}</h2>
        <div className="activity-list">
                  {activitiesLoading ? (
          <div className="activity-loading">
            <div className="loading-spinner"></div>
            <p>Caricamento attività...</p>
          </div>
        ) : activitiesError ? (
            <div className="activity-error">
              <span className="error-icon">❌</span>
              <p>Errore nel caricamento delle attività</p>
              <button onClick={loadRecentActivities} className="retry-btn">
                Riprova
              </button>
            </div>
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <motion.div
                key={activity.id}
                className={`activity-item ${activity.type} ${activity.status}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-content">
                  <strong>{activity.title}</strong>
                  <p>{activity.description}</p>
                  <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                </div>
                <span className={`activity-status ${activity.status}`}>
                  {activity.status === 'approved' ? '✅' : 
                   activity.status === 'pending' ? '⏳' : '❌'}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="activity-empty">
              <span className="empty-icon">📭</span>
              <p>Nessuna attività recente</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
