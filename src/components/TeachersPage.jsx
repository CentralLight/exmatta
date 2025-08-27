import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function TeachersPage({ goHome, onShowCourseForm }) {
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Scroll automatico in cima alla pagina quando si apre la sezione
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fetch insegnanti dal database
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:3001/api/teachers/public')
        
        if (!response.ok) {
          throw new Error('Errore nel caricamento degli insegnanti')
        }
        
        const data = await response.json()
        setTeachers(data)
        setError(null)
      } catch (err) {
        console.error('Errore nel fetch degli insegnanti:', err)
        setError('Impossibile caricare gli insegnanti')
        // Fallback con dati di esempio per sviluppo
        setTeachers([
          { 
            id: 1, 
            name: 'Angelo Capozzi', 
            instruments: 'Chitarra',
            bio: 'Insegnante di chitarra con oltre 10 anni di esperienza. Specializzato in chitarra classica, acustica ed elettrica. Ha suonato in diverse band locali e insegna a studenti di tutte le età.',
            email: 'angelo@example.com'
          },
          { 
            id: 2, 
            name: 'Fabio Accurso', 
            instruments: 'Basso',
            bio: 'Bassista esperto in diversi generi musicali. Ha suonato in numerose band e insegna tecniche di basso elettrico e contrabbasso.',
            email: 'fabio@example.com'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher)
    // Scroll automatico in cima quando si apre un dettaglio
    window.scrollTo(0, 0)
  }

  // Debug: log per verificare che goHome sia passata correttamente
  useEffect(() => {
    console.log('TeachersPage - goHome prop:', goHome)
    console.log('TeachersPage - goHome type:', typeof goHome)
  }, [goHome])

  const handleBackToGrid = () => {
    setSelectedTeacher(null)
    // Scroll automatico in cima quando si torna alla griglia
    window.scrollTo(0, 0)
  }

  const handleRequestInfo = () => {
    if (onShowCourseForm) {
      onShowCourseForm(selectedTeacher)
    }
  }

  const handleOutsideClick = (e) => {
    if (e.target.classList.contains('teachers-page')) {
      if (selectedTeacher) {
        setSelectedTeacher(null)
      } else {
        goHome()
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <motion.div 
        className="teachers-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="teachers-header">
          <button 
            className="back-btn"
            onClick={() => {
              console.log('Back button clicked (loading state), goHome function:', goHome)
              goHome()
            }}
            aria-label="Torna alla home"
          >
            ← Torna alla Home
          </button>
          
          <div className="header-content">
            <h1 className="page-title">🎸 Imparar Suonando</h1>
            <p className="page-subtitle">Caricamento insegnanti...</p>
          </div>
        </div>
        
        <div className="teachers-loading">
          <div className="loading-spinner"></div>
          <p>Caricamento insegnanti in corso...</p>
        </div>
      </motion.div>
    )
  }

  // Error state
  if (error) {
    return (
      <motion.div 
        className="teachers-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="teachers-header">
          <button 
            className="back-btn"
            onClick={() => {
              console.log('Back button clicked (error state), goHome function:', goHome)
              goHome()
            }}
            aria-label="Torna alla home"
          >
            ← Torna alla Home
          </button>
          
          <div className="header-content">
            <h1 className="page-title">🎸 Imparar Suonando</h1>
            <p className="page-subtitle">Errore nel caricamento</p>
          </div>
        </div>
        
        <div className="teachers-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            Riprova
          </button>
        </div>
      </motion.div>
    )
  }

  // No teachers state
  if (teachers.length === 0) {
    return (
      <motion.div 
        className="teachers-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="teachers-header">
          <button 
            className="back-btn"
            onClick={() => {
              console.log('Back button clicked (no teachers state), goHome function:', goHome)
              goHome()
            }}
            aria-label="Torna alla home"
          >
            ← Torna alla Home
          </button>
          
          <div className="header-content">
            <h1 className="page-title">🎸 Imparar Suonando</h1>
            <p className="page-subtitle">Nessun insegnante disponibile</p>
          </div>
        </div>
        
        <div className="teachers-empty">
          <div className="empty-icon">🎵</div>
          <p>Al momento non ci sono insegnanti disponibili.</p>
          <p>Riprova più tardi o contattaci per informazioni.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleOutsideClick}
    >
      <div className="overlayInner" onClick={(e) => e.stopPropagation()}>
        <div className="teachers-page">
      {/* Header */}
      <div className="teachers-header">
        <button 
          className="back-btn"
          onClick={() => {
            if (selectedTeacher) {
              handleBackToGrid()
            } else {
              console.log('Back button clicked (main state), goHome function:', goHome)
              goHome()
            }
          }}
          aria-label={selectedTeacher ? "Torna alla griglia" : "Torna alla home"}
        >
          {selectedTeacher ? "← Torna alla Griglia" : "← Torna alla Home"}
        </button>
        
        <div className="header-content">
          <h1 className="page-title">🎸 Imparar Suonando</h1>
          <p className="page-subtitle">
            {selectedTeacher ? `Dettagli di ${selectedTeacher.name}` : `${teachers.length} insegnante${teachers.length !== 1 ? 'i' : ''} disponibili`}
          </p>
        </div>
      </div>

      {/* Contenuto principale */}
      {!selectedTeacher ? (
        /* Griglia insegnanti */
        <div className="teachers-grid-container">
          <div className="teachers-grid">
            {teachers.map((teacher) => (
              <motion.div 
                key={teacher.id} 
                className="teacher-card"
                onClick={() => handleTeacherClick(teacher)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="teacher-card-content">
                  <div className="teacher-card-arrow">→</div>
                  <div className="teacher-card-info">
                    <div className="teacher-instrument">{teacher.instruments}</div>
                    <div className="teacher-name">{teacher.name}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Dettagli insegnante selezionato */
        <motion.div 
          className="teacher-detail-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="teacher-detail-card">
            <div className="teacher-detail-image">
              <img src="/images/card/incognito.png" alt={selectedTeacher.name} />
            </div>
            
            <div className="teacher-detail-info">
              <h2 className="teacher-detail-name">{selectedTeacher.name}</h2>
              <div className="teacher-detail-instrument">{selectedTeacher.instruments}</div>
              
              <div className="teacher-detail-bio">
                <h3>Biografia</h3>
                <p>{selectedTeacher.bio}</p>
              </div>
              
              <div className="teacher-detail-social">
                <h3>Email</h3>
                <a 
                  href={`mailto:${selectedTeacher.email}`}
                  className="email-link"
                >
                  <span className="email-icon">📧</span>
                  {selectedTeacher.email}
                </a>
              </div>
              
              <button 
                className="request-info-btn"
                onClick={handleRequestInfo}
              >
                📝 Richiedi Informazioni
              </button>
            </div>
          </div>
        </motion.div>
      )}
        </div>
      </div>
    </motion.div>
  )
}
