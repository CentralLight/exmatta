import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminApp from './admin/AdminApp'
import { newsService, courseService } from './services/api'
import CourseRequestForm from './components/CourseRequestForm'
import BugReportForm from './components/BugReportForm'
import TeachersPage from './components/TeachersPage'
import ToastContainer from './admin/components/ToastContainer'
import useToast from './admin/hooks/useToast'
import CustomScrollbar from './components/CustomScrollbar'

const FB_LINK = 'https://www.facebook.com/lafreccia.arci/?locale=it_IT'
const IG_LINK = 'https://www.instagram.com/exmatta'

// Custom hook per leggere la configurazione della dashboard
function useDashboardConfig() {
  const [config, setConfig] = useState({
    quadrants: {
      salaProve: { enabled: true, title: 'PRENOTA SALA PROVE', icon: '🎤' },
      salaCorsi: { enabled: true, title: 'IMPARAR SUONANDO', icon: '🎸' },
      news: { enabled: true, title: 'NEWS & COMUNICAZIONI', icon: '📰' },
      mattascuola: { enabled: true, title: 'MATTASCUOLA', icon: '📚' },
      sostienici: { enabled: true, title: 'SOSTIENICI', icon: '❤️' },
      tesseraArci: { enabled: true, title: 'TESSERA ARCI 2024-2025', icon: '🎫' }
    },
    dashboard: {
      title: 'AriaPerta',
      subtitle: 'Centro Culturale e Sociale',
      showSocialLinks: true,
      showBugReport: true,
      showAdminButton: true
    }
  })

  useEffect(() => {
    const loadConfig = () => {
      const savedConfig = localStorage.getItem('dashboardConfig')
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig)
          setConfig(parsed)
        } catch (error) {
          console.error('Error loading dashboard config:', error)
        }
      }
    }

    // Carica la configurazione iniziale
    loadConfig()

    // Listener per aggiornamenti in tempo reale
    const handleStorageChange = (e) => {
      if (e.key === 'dashboardConfig') {
        loadConfig()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Listener per aggiornamenti nella stessa tab
    const handleCustomStorageChange = () => {
      loadConfig()
    }
    
    window.addEventListener('dashboardConfigChanged', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dashboardConfigChanged', handleCustomStorageChange)
    }
  }, [])

  return config
}

const fade = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: .25 } },
  exit: { opacity: 0, y: -8, transition: { duration: .2 } }
}

function Home({ go, onPracticeRoomClick, onCourseFormClick, onBugReportClick, onShowRecaptchaBanner }) {
  const titleCardRef = useRef(null)
  const salaProveRef = useRef(null)
  const salaCorsiRef = useRef(null)
  const socialRefs = useRef([])
  const config = useDashboardConfig()

  // Hero Gallery State
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  


  // Hero Gallery Images
  const heroImages = [
    '/images/background-hero/EXMATTA_HOMEPAGE_1.jpg',
    '/images/background-hero/EXMATTA_HOMEPAGE_4.jpg', 
    '/images/background-hero/EXMATTA_HOMEPAGE_5.jpg', 
    '/images/background-hero/EXMATTA_HOMEPAGE_2.jpg',
    '/images/background-hero/EXMATTA_HOMEPAGE_8.jpg',
    '/images/background-hero/EXMATTA_HOMEPAGE_3.jpg'
  ]

  // Hero Gallery Auto-scroll Effect
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroImages.length)
    }, 5000) // 2.5 secondi come richiesto

    return () => clearInterval(interval)
  }, [isPlaying, heroImages.length])

  // Precaricamento immagini per transizioni smooth
  useEffect(() => {
    heroImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

         // Hero Gallery Controls
       const handleMouseEnter = () => setIsPlaying(false)
       const handleMouseLeave = () => setIsPlaying(true)
       


  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'Tab':
          // Natural tab navigation
          break
        case 'Enter':
        case ' ':
          if (document.activeElement === titleCardRef.current) {
            e.preventDefault()
            go('party')
          } else if (document.activeElement === salaProveRef.current) {
            e.preventDefault()
            onPracticeRoomClick()
          } else if (document.activeElement === salaCorsiRef.current) {
            e.preventDefault()
            onCourseFormClick()
          }
          break
        case 'Escape':
          // Could be used for closing modals in the future
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
      }, [go, onPracticeRoomClick, onCourseFormClick])

  return (
    <motion.div className="page" initial="hidden" animate="visible" exit="exit" variants={fade}>


      {/* Hero Section Exmatta - Gallery automatica */}
      <div 
        className="exmatta-card hero-gallery"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Hero Section Gallery"
      >
                 {/* Logo ARCI in alto a destra */}
         <div className="hero-arci-logo">
           <img src="/images/logos/arci-logo.png" alt="ARCI Logo" />
         </div>

         {/* Immagine hero-text fissa sopra tutto */}
         <div className="hero-text-overlay">
           <img src="/images/logos/hero-text.png" alt="Hero Text" />
         </div>

         {/* Immagini di sfondo con transizioni */}
         <div className="hero-backgrounds">
           {heroImages.map((image, index) => (
             <div
               key={index}
               className={`hero-bg ${index === currentSlide ? 'active' : ''}`}
               style={{ backgroundImage: `url(${image})` }}
             />
           ))}
         </div>

         {/* Indicatori di slide rimossi */}
      </div>



      <div 
        className="titleCard" 
        role="button" 
        tabIndex={0}
        ref={titleCardRef}
        onClick={() => go('party')}
        onKeyDown={(e) => e.key === 'Enter' && go('party')}
        aria-label="Vai alla pagina ARIAPERTAPARTY"
        style={{
          display: 'none'
        }}
      >
        <span className="card-icon">🎉</span>
        ARIAPERTAPARTY
      </div>



      <div className="grid">
        {config.quadrants.salaProve.enabled && (
          <div 
            className="card" 
            role="button"
            tabIndex={0}
            ref={salaProveRef}
            onClick={onPracticeRoomClick}
            onKeyDown={(e) => e.key === 'Enter' && onPracticeRoomClick()}
            aria-label="Prenota sala prove"
          >
            <span className="card-icon">{config.quadrants.salaProve.icon}</span>
            {config.quadrants.salaProve.title}
          </div>
        )}
        {config.quadrants.salaCorsi.enabled && (
          <div 
            className="card" 
            role="button"
            tabIndex={0}
            ref={salaCorsiRef}
            onClick={onCourseFormClick}
            onKeyDown={(e) => e.key === 'Enter' && onCourseFormClick()}
            aria-label="Vai ai corsi"
          >
            <span className="card-icon">{config.quadrants.salaCorsi.icon}</span>
            {config.quadrants.salaCorsi.title}
          </div>
        )}
      </div>

      {/* NEWS Section - positioned between main grid and secondary grid */}
      {config.quadrants.news.enabled && (
        <div className="news-section">
          <div className="news-card" onClick={() => go('news')}>
            <div className="news-icon">{config.quadrants.news.icon}</div>
            <h3>{config.quadrants.news.title}</h3>
            <p>Leggi tutte le ultime notizie e comunicazioni del mattatoio</p>
            <div className="news-footer">
              <button className="view-all-news-btn" onClick={(e) => { e.stopPropagation(); go('news'); }}>
                📖 Leggi tutte le News
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid-secondary">
        {config.quadrants.mattascuola.enabled && (
          <div className="card-secondary">
            <span className="card-icon">{config.quadrants.mattascuola.icon}</span>
            <div className="card-content">
              <h3>{config.quadrants.mattascuola.title}</h3>
              <div className="banner-info">
                <p>L'iscrizione al nuovo anno scolastico per il doposcuola popolare non è ancora aperta.</p>
                <p className="banner-note">Aspetta fiducioso!</p>
              </div>
            </div>
          </div>
        )}
        
        {config.quadrants.sostienici.enabled && (
          <div className="card-secondary">
            <span className="card-icon">{config.quadrants.sostienici.icon}</span>
            <div className="card-content">
              <h3>{config.quadrants.sostienici.title}</h3>
              <div className="banner-info">
                <p>Sostienici al 5x1000!</p>
                <p className="banner-note">Basta una semplice firma e il CF <strong>91069940590</strong> nella dichiarazione dei redditi.</p>
              </div>
            </div>
          </div>
        )}
        
        {config.quadrants.tesseraArci.enabled && (
          <div className="card-secondary">
            <span className="card-icon">{config.quadrants.tesseraArci.icon}</span>
            <div className="card-content">
              <h3>{config.quadrants.tesseraArci.title}</h3>
              <div className="banner-info">
                <p>Iscriviti alla tessera ARCI</p>
                <a 
                  href="https://portale.arci.it/preadesione/lafreccia/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="arci-link"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  Clicca qui per l'iscrizione
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {config.dashboard.showSocialLinks && (
        <div className="social" aria-label="social links">
          <a 
            href={FB_LINK} 
            target="_blank" 
            rel="noopener noreferrer" 
            title="Facebook"
            ref={el => socialRefs.current[0] = el}
            tabIndex={0}
          >
            fb
          </a>
          <a 
            href={IG_LINK} 
            target="_blank" 
            rel="noopener noreferrer" 
            title="Instagram"
            ref={el => socialRefs.current[1] = el}
            tabIndex={0}
          >
            ig
          </a>
        </div>
      )}



      <div className="bug-report-section">
        {config.dashboard.showBugReport && (
          <button 
            className="bug-report-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBugReportClick();
            }}
            title="Segnala un bug"
            aria-label="Segnala un bug nella dashboard"
            type="button"
          >
            <span className="bug-icon">🐛</span>
            <span className="bug-text">Segnala Bug</span>
          </button>
        )}
        
        {config.dashboard.showAdminButton && (
          <button 
            className="admin-btn"
            onClick={() => go('admin')}
            title="Accesso amministrativo"
          >
            <span className="admin-icon">⚙️</span>
            <span className="admin-text">Admin</span>
          </button>
        )}

        {/* Pulsante reCaptcha informativo */}
        <button 
          className="recaptcha-info-btn"
          onClick={onShowRecaptchaBanner}
          title="Cos'è reCaptcha? Clicca per saperne di più"
          aria-label="Informazioni su reCaptcha"
        >
          <span className="recaptcha-icon">🔒</span>
          <span className="recaptcha-text">reCaptcha</span>
        </button>
      </div>
    </motion.div>
  )
}

function Party({ goHome }) {
  const [timeLeft, setTimeLeft] = useState({})
  const [eventStatus, setEventStatus] = useState('countdown')
  
  const eventStartDate = new Date('2025-09-12T19:00:00')
  const eventEndDate = new Date('2025-09-15T00:00:00')
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const timeToStart = eventStartDate - now
      const timeToEnd = eventEndDate - now
      
      if (timeToStart > 0) {
        // Event hasn't started yet - show countdown
        setEventStatus('countdown')
        const days = Math.floor(timeToStart / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeToStart % (1000 * 60)) / 1000)
        
        setTimeLeft({ days, hours, minutes, seconds })
      } else if (timeToEnd > 0) {
        // Event is live - show "LIVE NOW"
        setEventStatus('live')
        setTimeLeft({})
      } else {
        // Event is finished
        setEventStatus('finished')
        setTimeLeft({})
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  const days = [
    { 
      date: '12 Settembre 2025', 
      artists: [
        { name: 'CHICORIA', isMain: true },
        { name: 'Sace & Wiser', isMain: false },
        { name: 'Goblin', isMain: false },
        { name: 'Alani Gang', isMain: false },
        { name: 'Izzeta', isMain: false },
        { name: 'Pecetta', isMain: false }
      ], 
      start: '19:00' 
    },
    { 
      date: '13 Settembre 2025', 
      artists: [
        { name: 'GENERIC ANIMAL', isMain: true },
        { name: 'Giuro', isMain: false },
        { name: 'Rick Thistle', isMain: false },
        { name: 'Danxgerous', isMain: false },
        { name: 'Luca Coi Baffi', isMain: false },
        { name: 'Goldoni', isMain: false }
      ], 
      start: '19:00' 
    },
    { 
      date: '14 Settembre 2025', 
      artists: [
        { name: 'THE MENTOS', isMain: true },
        { name: 'Maronna', isMain: false },
        { name: 'AcquaChiara', isMain: false },           
        { name: 'Overxposed', isMain: false },
        { name: 'Dusty Eyes', isMain: false },
        { name: 'Le Cose', isMain: false }
      ], 
      start: '19:00' 
    },
  ]

  // MOBILE: Gestione card singola con swipe
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Configurazione swipe
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentCardIndex < days.length - 1) {
      // Swipe sinistra: prossima card
      animateCardChange(() => setCurrentCardIndex(prev => prev + 1))
    } else if (isRightSwipe && currentCardIndex > 0) {
      // Swipe destra: card precedente
      animateCardChange(() => setCurrentCardIndex(prev => prev - 1))
    }
  }

  // Funzione per animare il cambio card
  const animateCardChange = (callback) => {
    const card = document.querySelector('#ariaperta-party-overlay .partyCard')
    if (card) {
      // Aggiungi classe per l'animazione
      card.classList.add('changing')
      
      // Dopo l'animazione, cambia la card e rimuovi la classe
      setTimeout(() => {
        callback()
        setTimeout(() => {
          card.classList.remove('changing')
        }, 100)
      }, 200)
    } else {
      // Fallback se non trova la card
      callback()
    }
  }

  const stop = (e) => e.stopPropagation()

  const renderCountdownSection = () => {
    switch(eventStatus) {
      case 'countdown':
        return (
          <div className="countdown-section">
            <h2 className="countdown-title">ARIAPERTAPARTY 2025</h2>
            <div className="countdown-timer">
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.days || 0}</span>
                <span className="countdown-label">Giorni</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.hours || 0}</span>
                <span className="countdown-label">Ore</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.minutes || 0}</span>
                <span className="countdown-label">Minuti</span>
              </div>
              <div className="countdown-item">
                <span className="countdown-number">{timeLeft.seconds || 0}</span>
                <span className="countdown-label">Secondi</span>
              </div>
            </div>
          </div>
        )
      
      case 'live':
        return (
          <div className="countdown-section live-now">
            <h2 className="countdown-title">ARIAPERTAPARTY 2025</h2>
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span className="live-text">LIVE NOW</span>
            </div>
            <p className="live-message">Il festival è in corso!</p>
          </div>
        )
      
      case 'finished':
        return (
          <div className="countdown-section event-finished">
            <h2 className="countdown-title">ARIAPERTAPARTY 2025</h2>
            <div className="finished-indicator">
              <span className="finished-icon">🎉</span>
              <span className="finished-text">EVENTO CONCLUSO</span>
            </div>
            <p className="finished-message">Grazie a tutti per aver partecipato! Vi aspettiamo l'anno prossimo!</p>
            <div className="highlights">
              <h3>Highlights dell'Evento</h3>
              <ul>
                <li>3 giorni di musica incredibile</li>
                <li>Ospiti speciali: CHICORIA, GENERIC ANIMAL, GIURO</li>
                <li>Oltre 1000 partecipanti</li>
                <li>Atmosfera indimenticabile</li>
              </ul>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <motion.div id="ariaperta-party-overlay" className="overlay" data-view="party" onClick={goHome} initial="hidden" animate="visible" exit="exit" variants={fade}>
      <div className="overlayInner" onClick={stop}>
        {renderCountdownSection()}
        
        <div className="event-free-notice">
          <span className="free-text">L'evento è completamente gratuito!</span>
        </div>
        
        <div 
          className="partyGrid"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* MOBILE: Mostra solo la card corrente */}
          <div className="partyCard">
            <h3>{days[currentCardIndex].date}</h3>
            <div><strong>Inizio:</strong> {days[currentCardIndex].start}</div>
            <div style={{marginTop: 16}}><strong>Artisti</strong></div>
            <ul className="artists-list">
              {days[currentCardIndex].artists.map((artist, j) => (
                <li key={j} className={artist.isMain ? 'main-artist' : 'regular-artist'}>
                  {artist.isMain && <span className="main-badge">MAIN</span>}
                  {artist.name}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Scritta elegante per suggerire lo swipe */}
          <div className="swipeHint">
            <em>scorri per altre giornate</em>
          </div>
          
          {/* Indicatore di navigazione mobile */}
          <div className="mobile-card-indicator">
            <span className="indicator-text">
              {currentCardIndex + 1} di {days.length}
            </span>
            <div className="indicator-dots">
              {days.map((_, i) => (
                <span 
                  key={i} 
                  className={`indicator-dot ${i === currentCardIndex ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="location" onClick={() => window.open('https://maps.google.com/?q=Parco+Roberto+Fiorentini+Aprilia+LT', '_blank')}>
          <span className="location-icon">📍</span>
          Parco Roberto Fiorentini, via Ugo La Malfa Aprilia (LT)
        </div>

        <div className="services-section">
          <h3 className="services-title">Servizi & Attrazioni</h3>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🍔</div>
              <h4>Food Stand</h4>
              <p>Street food di qualità per tutti i gusti</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🍹</div>
              <h4>Drink Bar</h4>
              <p>Bevande fresche e cocktail artigianali</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🛍️</div>
              <h4>Mercatini</h4>
              <p>Arti e mestieri, vintage e creatività</p>
            </div>
          </div>
        </div>

        <div className="backHint">Clicca fuori dai riquadri per tornare alla home</div>
      </div>
    </motion.div>
  )
}

function Courses({ goHome }) {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    telefono: '',
    strumento: '',
    descrizione: ''
  })
  const [showPopup, setShowPopup] = useState(false)
  
  const strumenti = ['Voce', 'Pianoforte', 'Chitarra', 'Basso', 'Batteria']
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.nome && formData.cognome && formData.telefono && formData.strumento) {
      setShowPopup(true)
      // Reset form
      setFormData({
        nome: '',
        cognome: '',
        telefono: '',
        strumento: '',
        descrizione: ''
      })
      // Hide popup after 3 seconds
      setTimeout(() => setShowPopup(false), 8000)
    }
  }
  
  const handleOverlayClick = (e) => {
    // Always return to home when clicking outside, regardless of popup state
    goHome()
  }
  
  const stop = (e) => e.stopPropagation()
  
  return (
    <motion.div className="overlay" onClick={handleOverlayClick} initial="hidden" animate="visible" exit="exit" variants={fade}>
      <div className="overlayInner" onClick={stop}>
        <div className="courses-form-container">
          <h2 className="courses-title">Richiesta Informazioni sui Corsi</h2>
          <p className="courses-subtitle">Compila il form per ricevere informazioni sui nostri corsi musicali</p>
          
          <form onSubmit={handleSubmit} className="courses-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome">Nome *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Il tuo nome"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cognome">Cognome *</label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleInputChange}
                  required
                  placeholder="Il tuo cognome"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Numero di telefono *</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                placeholder="Es. 333 123 4567"
                pattern="[0-9 +()-]{6,}"
                title="Inserisci un numero di telefono valido"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="strumento">Strumento da Imparare *</label>
              <select
                id="strumento"
                name="strumento"
                value={formData.strumento}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleziona uno strumento</option>
                {strumenti.map((strumento, index) => (
                  <option key={index} value={strumento}>{strumento}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="descrizione">Descrizione (opzionale)</label>
              <textarea
                id="descrizione"
                name="descrizione"
                value={formData.descrizione}
                onChange={handleInputChange}
                placeholder="Raccontaci qualcosa di te e delle tue aspirazioni musicali..."
                rows="4"
              />
            </div>
            
            <button type="submit" className="submit-btn">
              Richiedi Informazioni
            </button>
          </form>
          
          {/* Success Popup - now positioned relative to the form */}
          {showPopup && (
            <motion.div 
              className="success-popup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="popup-content">
                <div className="popup-icon">✅</div>
                <h3>Richiesta Inviata con Successo!</h3>
                <p>Grazie per la tua richiesta di informazioni sui corsi. Il nostro referente ti contatterà presto per fornirti tutti i dettagli e programmare un incontro conoscitivo.</p>
              </div>
            </motion.div>
          )}
        </div>
        
        <div className="backHint">Clicca fuori dal riquadro per tornare alla home</div>
      </div>
    </motion.div>
  )
}

function PracticeRoom({ goHome, toast }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    // Always start with tomorrow - no same-day bookings
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  })
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [bookingData, setBookingData] = useState({
    nome: '',
    email: '',
    telefono: '',
    componenti: 1,
    note: ''
  })
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  
  // Get current date for comparison
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const currentDay = currentDate.getDate()
  const currentHour = currentDate.getHours()
  
  // Available durations for booking (in hours)
  const availableDurations = [1, 2, 3, 4]
  
  // Generate available time slots (9:00 - 23:30, every 30 minutes)
  const timeSlots = []
  for (let hour = 9; hour <= 23; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  
  // Booked slots loaded from backend
  const [bookedSlots, setBookedSlots] = useState([])
  
  // Availability blocks loaded from backend
  const [availabilityBlocks, setAvailabilityBlocks] = useState([])
  
  // Check if a date is in the past or today (disabled)
  const isDateDisabled = (date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const currentDateOnly = new Date(currentYear, currentMonth, currentDay)
    // Disable today and past dates - only allow tomorrow and future
    return dateOnly <= currentDateOnly
  }

  // Check if a date is blocked by availability blocks
  const isDateBlocked = (date) => {
    const dateStr = formatDateConsistent(date)
    return availabilityBlocks.some(block => {
      const blockStart = new Date(block.start_date)
      const blockEnd = new Date(block.end_date)
      const checkDate = new Date(dateStr)
      
      // Check if date falls within block range
      return checkDate >= blockStart && checkDate <= blockEnd
    })
  }

  // Check if a date is completely unavailable (all time slots are booked)
  const isDateUnavailable = (date) => {
    const dateStr = formatDateConsistent(date)
    const dateBookings = bookedSlots.filter(slot => slot.date === dateStr)
    
    if (dateBookings.length === 0) return false
    
    // Calculate total booked hours for this date
    const totalBookedHours = dateBookings.reduce((total, slot) => total + slot.duration, 0)
    
    // Check if all available hours are booked (from 9:00 to 23:30 = 14.5 hours)
    // We consider a date unavailable if more than 13 hours are booked (leaving 1.5 hours buffer)
    return totalBookedHours >= 13
  }
  
  // Check if a date is today (for special styling)
  const isToday = (date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const currentDateOnly = new Date(currentYear, currentMonth, currentDay)
    return dateOnly.getTime() === currentDateOnly.getTime()
  }
  
  // Check if we can go back to previous month
  const canGoBack = () => {
    const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    // Allow going back to previous month if it's not more than 1 month before current date
    const oneMonthAgo = new Date(currentYear, currentMonth - 1, 1)
    return prevMonth >= oneMonthAgo
  }
  
  // Check if a time slot conflicts with existing bookings
  const hasTimeConflict = (date, time, duration) => {
    const dateStr = formatDateConsistent(date)
    const startHour = parseInt(time.split(':')[0])
    const startMinute = parseInt(time.split(':')[1])
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = startMinutes + (duration * 60)
    
    return bookedSlots.some(slot => {
      if (slot.date !== dateStr) return false
      
      const slotStartHour = parseInt(slot.time.split(':')[0])
      const slotStartMinute = parseInt(slot.time.split(':')[1])
      const slotStartMinutes = slotStartHour * 60 + slotStartMinute
      const slotEndMinutes = slotStartMinutes + (slot.duration * 60)
      
      // Check for overlap
      return (startMinutes < slotEndMinutes && endMinutes > slotStartMinutes)
    })
  }
  
  // Get available time slots based on selected duration
  const getAvailableTimeSlots = (date, duration) => {
    return timeSlots.filter(time => {
      // Check if duration fits within available hours
      const startHour = parseInt(time.split(':')[0])
      const startMinute = parseInt(time.split(':')[1])
      const totalMinutes = startHour * 60 + startMinute + (duration * 60)
      
      // Check if duration fits within the day (until 00:00)
      if (totalMinutes > 24 * 60) return false
      
      // Check for conflicts with existing bookings
      if (hasTimeConflict(date, time, duration)) return false
      
      return true
    })
  }
  
  // Funzione per formattare le date in modo consistente
  const formatDateConsistent = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const isSlotBooked = (date, time) => {
    const dateStr = formatDateConsistent(date)
    return bookedSlots.some(slot => {
      if (slot.date !== dateStr) return false
      
      // Converti l'orario in minuti per facilitare i calcoli
      const slotStart = parseInt(slot.time.split(':')[0]) * 60 + parseInt(slot.time.split(':')[1])
      const slotEnd = slotStart + (slot.duration * 60)
      const timeStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
      const timeEnd = timeStart + 30 // Ogni slot è di 30 minuti
      
      // Controlla se c'è sovrapposizione
      return (slotStart < timeEnd && slotEnd > timeStart)
    })
  }
  
  const getSlotDuration = (date, time) => {
    const dateStr = formatDateConsistent(date)
    // Trova la prenotazione che sovrappone questo slot
    const overlappingSlot = bookedSlots.find(s => {
      if (s.date !== dateStr) return false
      
      const slotStart = parseInt(s.time.split(':')[0]) * 60 + parseInt(s.time.split(':')[1])
      const slotEnd = slotStart + (s.duration * 60)
      const timeStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
      const timeEnd = timeStart + 30
      
      return (slotStart < timeEnd && slotEnd > timeStart)
    })
    
    return overlappingSlot ? overlappingSlot.duration : 0
  }

  // Carica gli slot prenotati dal backend
  const loadAvailableSlots = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bookings')
      if (response.ok) {
        const bookings = await response.json()
        // Converti le prenotazioni nel formato atteso
        const slots = bookings
          .filter(booking => ['pending', 'approved'].includes(booking.status))
          .map(booking => ({
            date: booking.date,
            time: booking.start_time,
            duration: booking.duration
          }))
        setBookedSlots(slots)
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento degli slot:', error)
    }
  }

  // Carica i blocchi di disponibilità dal backend
  const loadAvailabilityBlocks = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bookings/availability-blocks');
      const blocks = await response.json();
      setAvailabilityBlocks(blocks);
    } catch (error) {
      console.error('❌ Errore nel caricamento dei blocchi di disponibilità:', error)
    }
  }
  
  // Carica gli slot all'avvio
  useEffect(() => {
    loadAvailableSlots()
    loadAvailabilityBlocks()
  }, [])
  
  const handleDurationSelect = (duration) => {
    setSelectedDuration(duration)
    setShowCalendar(true)
  }
  
  const handleDateSelect = (date) => {
    // Only allow selection of future dates (tomorrow and beyond)
    if (!isDateDisabled(date)) {
      setSelectedDate(date)
      setSelectedSlot(null)
    }
  }
  
  const handleSlotSelect = (time) => {
    // Ricarica gli slot disponibili prima di aprire il form
    loadAvailableSlots()
    loadAvailabilityBlocks()
    
    setSelectedSlot(time)
    setShowBookingForm(true)
  }
  
  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    if (bookingData.nome && bookingData.email && selectedSlot && selectedDuration) {
      try {
        // Preparo i dati nel formato corretto per il backend
        const formatDate = (date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        const bookingPayload = {
          date: formatDate(selectedDate),                 // Formato YYYY-MM-DD sicuro
          start_time: selectedSlot,                       // Orario selezionato (es: "14:00")
          duration: selectedDuration,                     // Durata selezionata (1, 2, 3, 4)
          band_name: bookingData.nome,                    // Nome della band (dal campo nome)
          email: bookingData.email,                       // Email cliente
          phone: bookingData.telefono,                    // Telefono cliente
          members_count: bookingData.componenti,          // Numero componenti
          notes: bookingData.note || ''                   // Note opzionali
        }

        // Chiamata API reale al backend
        const response = await fetch('http://localhost:3001/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingPayload)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Errore durante la prenotazione')
        }

        const result = await response.json()
        if (result.success) {
          // Prenotazione completata con successo
          setShowSuccessMessage(true);
          setBookingData(initialBookingData);
          setSelectedDate(null);
          setSelectedTime('');
          setSelectedDuration(1);
          
          // Nascondi il messaggio di successo dopo 5 secondi
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 5000);
        } else {
          // Prenotazione fallita o errore non previsto
          throw new Error('Errore durante la prenotazione o dati non validi.');
        }
        
        // Mostra toast di successo
        toast.showSuccess('Prenotazione confermata! Ti abbiamo inviato una conferma. A presto in sala prove!')
        
        // Chiudi il form e resetta i dati
        setShowBookingForm(false)
        setBookingData({ nome: '', email: '', telefono: '', componenti: 1, note: '' })
        setSelectedSlot(null)
        setSelectedDuration(null)
        
        // Remove overlay classes
        document.documentElement.classList.remove('overlay-open')
        document.body.classList.remove('overlay-open')
        
        // Ricarica gli slot disponibili IMMEDIATAMENTE
        await loadAvailableSlots()
        
        // Ricarica anche i blocchi di disponibilità
        await loadAvailabilityBlocks()
        
      } catch (error) {
        console.error('❌ Errore durante la prenotazione:', error)
        toast.showError(`Errore durante la prenotazione: ${error.message}`)
      }
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const stop = (e) => e.stopPropagation()
  
  // Generate calendar days for current month
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    // Add previous month days
    for (let i = 0; i < firstDay.getDay(); i++) {
      const prevDate = new Date(year, month, -i)
      days.unshift({ date: prevDate, isCurrentMonth: false, isDisabled: true })
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const isDisabled = isDateDisabled(date)
      const isTodayDate = isToday(date)
      const isUnavailable = isDateUnavailable(date)
      const isBlocked = isDateBlocked(date)
      days.push({ 
        date, 
        isCurrentMonth: true, 
        isDisabled: isDisabled,
        isToday: isTodayDate,
        isUnavailable: isUnavailable,
        isBlocked: isBlocked,
        hasBookings: bookedSlots.some(booked => {
          const currentDate = new Date(year, month, i)
          const currentDateStr = formatDateConsistent(currentDate)
          return booked.date === currentDateStr
        })
      })
    }
    
    // Add next month days to complete the grid
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i)
      days.push({ date: nextDate, isCurrentMonth: false, isDisabled: true })
    }
    
    return days
  }
  
  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    })
  }
  
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]
  
  // Add/remove CSS classes when overlay opens/closes
  useEffect(() => {
    if (showBookingForm) {
      document.documentElement.classList.add('overlay-open')
      document.body.classList.add('overlay-open')
    } else {
      document.documentElement.classList.remove('overlay-open')
      document.body.classList.remove('overlay-open')
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('overlay-open')
      document.body.classList.remove('overlay-open')
    }
  }, [showBookingForm])
  
  return (
    <motion.div className="overlay" onClick={goHome} initial="hidden" animate="visible" exit="exit" variants={fade}>
      <div className="overlayInner" onClick={stop}>
        <div className="practice-room-container">
          
          {/* Duration Selection */}
          <div className="duration-selection">
            <h3>Seleziona la durata della prenotazione</h3>
            <div className="duration-options">
              {availableDurations.map((duration, index) => (
                <button
                  key={index}
                  className={`duration-option ${selectedDuration === duration ? 'selected' : ''}`}
                  onClick={() => handleDurationSelect(duration)}
                >
                  {duration}h
                </button>
              ))}
            </div>
            <p className="duration-note">La prenotazione deve essere compresa tra 1 e 4 ore.</p>
            {!showCalendar && (
              <div className="backHint">Clicca fuori dal riquadro per tornare alla home</div>
            )}
          </div>

          {/* Calendar + Time Slots (side-by-side) */}
          {showCalendar && (
            <div className="booking-grid">
              {/* Title Section - centered at the top */}
              <div className="booking-title-section">
                <h2 className="practice-room-title">Prenotazione Sala Prove</h2>
                <p className="practice-room-subtitle">Seleziona una data e un orario disponibile</p>
              </div>
              
              {/* Content Section - calendar and time slots side by side */}
              <div className="booking-content">
                <div className="calendar-section">
                  <div className="calendar-header">
                    <button 
                      className="calendar-nav-btn"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                      disabled={!canGoBack()}
                    >
                      ←
                    </button>
                    <h3 className="calendar-month">
                      {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </h3>
                    <button 
                      className="calendar-nav-btn"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                    >
                      →
                    </button>
                  </div>
                  
                  <div className="calendar-grid">
                    <div className="calendar-weekdays">
                      <div>Dom</div>
                      <div>Lun</div>
                      <div>Mar</div>
                      <div>Mer</div>
                      <div>Gio</div>
                      <div>Ven</div>
                      <div>Sab</div>
                    </div>
                    
                    <div className="calendar-days">
                      {getCalendarDays().map((day, index) => (
                        <div
                          key={index}
                          className={`calendar-day ${
                            !day.isCurrentMonth ? 'other-month' : ''
                          } ${
                            day.date.toDateString() === selectedDate.toDateString() ? 'selected' : ''
                          } ${
                            day.isDisabled ? 'disabled' : ''
                          } ${
                            day.isToday ? 'today' : ''
                          } ${
                            day.hasBookings ? 'has-bookings' : ''
                          } ${
                            day.isUnavailable ? 'unavailable' : ''
                          } ${
                            day.isBlocked ? 'blocked' : ''
                          }`}
                          onClick={() => {
                            if (!day.isDisabled && !day.isOtherMonth && !day.isUnavailable && !day.isBlocked) {
                              handleDateSelect(day.date)
                            }
                          }}
                          style={{
                            cursor: day.isDisabled || !day.isCurrentMonth || day.isUnavailable || day.isBlocked ? 'default' : 'pointer',
                            opacity: day.isDisabled || day.isUnavailable || day.isBlocked ? 0.5 : 1
                          }}
                          title={
                            day.isToday ? 'Non prenotabile per oggi' : 
                            day.isUnavailable ? 'Giorno completamente prenotato' : ''
                          }
                        >
                          <span className="day-number">{day.date.getDate()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Time Slots Section - on the right */}
                {selectedDate && (
                  <div className="time-slots-section">
                    <h3 className="time-slots-title">
                      Orari disponibili per {formatDate(selectedDate)}
                    </h3>
                    <div className="time-slots-grid">
                      {getAvailableTimeSlots(selectedDate, selectedDuration).map((time) => {
                        const isBooked = isSlotBooked(selectedDate, time)
                        const duration = getSlotDuration(selectedDate, time)
                        const isHalfHour = parseInt(time.split(':')[1]) === 30
                        
                        return (
                          <div
                            key={time}
                            className={`time-slot ${isBooked ? 'booked' : isHalfHour ? 'half-hour' : 'available'} ${
                              selectedSlot === time ? 'selected' : ''
                            }`}
                            onClick={() => !isBooked && handleSlotSelect(time)}
                            style={{
                              cursor: !isBooked ? 'pointer' : 'default'
                            }}
                          >
                            <span className="slot-time">{time}</span>
                            {isBooked && (
                              <span className="slot-duration">{duration}h</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Booking Form Overlay - positioned outside calendar container */}
      {showBookingForm && (
        <motion.div 
          className="booking-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="booking-form-container" onClick={stop}>
            <h3 className="booking-form-title">
              Prenota {selectedSlot} - {formatDate(selectedDate)}
            </h3>
            <div className="booking-duration-info">
              <span className="duration-badge">{selectedDuration}h</span>
              <span className="duration-text">Durata prenotazione</span>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="booking-nome">Nome e Cognome *</label>
                <input
                  type="text"
                  id="booking-nome"
                  name="nome"
                  value={bookingData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="Il tuo nome completo"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="booking-email">Email *</label>
                <input
                  type="email"
                  id="booking-email"
                  name="email"
                  value={bookingData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="La tua email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="booking-telefono">Numero di telefono</label>
                <input
                  type="tel"
                  id="booking-telefono"
                  name="telefono"
                  value={bookingData.telefono}
                  onChange={handleInputChange}
                  placeholder="Il tuo numero di telefono (opzionale)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="booking-componenti">Numero di componenti della band *</label>
                <select
                  id="booking-componenti"
                  name="componenti"
                  value={bookingData.componenti}
                  onChange={handleInputChange}
                  required
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'componente' : 'componenti'}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="booking-note">Note (opzionale)</label>
                <textarea
                  id="booking-note"
                  name="note"
                  value={bookingData.note}
                  onChange={handleInputChange}
                  placeholder="Specifiche particolari o richieste..."
                  rows="3"
                />
              </div>
              
              <div className="booking-form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowBookingForm(false)
                    // Keep calendar open and duration selected
                    setSelectedSlot(null)
                    setBookingData({ nome: '', email: '', telefono: '', componenti: 1, note: '' })
                    // Remove overlay classes
                    document.documentElement.classList.remove('overlay-open')
                    document.body.classList.remove('overlay-open')
                    // Ensure calendar and duration selection are visible
                    setShowCalendar(true)
                  }}
                >
                  Annulla
                </button>
                <button type="submit" className="confirm-btn">
                  Conferma Prenotazione
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function NewsPage({ goHome }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Scroll to top quando la pagina si carica
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Carica le news dal backend
  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true)
        const response = await newsService.getPublished()
        if (response && Array.isArray(response)) {
          setNews(response)
        } else if (response && response.news) {
          setNews(response.news)
        } else {
          setNews([])
        }
      } catch (error) {
        console.error('Errore nel caricamento news:', error)
        setError('Impossibile caricare le news. Riprova più tardi.')
        
        // Fallback con dati mock se l'API non è disponibile
        setNews([
          {
            id: 1,
            titolo: 'Benvenuti nella nuova dashboard AriaPerta!',
            sottotitolo: 'La piattaforma digitale per i nostri soci',
            descrizione: 'Abbiamo lanciato la nuova dashboard digitale per mantenere tutti i soci informati sulle attività del mattatoio e le iniziative culturali. Questa piattaforma ci permetterà di comunicare in tempo reale con tutti i membri della nostra comunità, mantenendoli aggiornati su eventi, iniziative e opportunità.\n\nLa dashboard è stata progettata per essere intuitiva e accessibile a tutti, con una sezione dedicata alle news dove potrete trovare comunicazioni importanti, aggiornamenti sui progetti in corso e anticipazioni sulle prossime iniziative.\n\nRingraziamo tutti coloro che hanno contribuito a questo progetto e invitiamo i soci a esplorare le nuove funzionalità disponibili.',
            dataPubblicazione: '15 Gennaio 2025',
            stato: 'Pubblicato',
            image_filename: 'exmatta-logo.png',
            autore: 'Redazione AriaPerta'
          },
          {
            id: 2,
            titolo: 'Nuove iniziative culturali in arrivo',
            sottotitolo: 'Espandiamo la nostra offerta culturale',
            descrizione: 'Stiamo lavorando a nuove iniziative culturali e sociali per arricchire l\'offerta del nostro centro e coinvolgere sempre più la comunità. Presto annunceremo i dettagli di questi nuovi progetti che includeranno workshop, laboratori creativi e eventi di networking.\n\nL\'obiettivo è creare uno spazio dove i soci possano non solo partecipare alle attività esistenti, ma anche proporre nuove idee e collaborare alla crescita del centro. Stiamo raccogliendo feedback e suggerimenti per rendere queste iniziative il più inclusive e interessanti possibile.\n\nRestate sintonizzati per gli annunci ufficiali e le date di inizio dei nuovi programmi.',
            dataPubblicazione: '10 Gennaio 2025',
            stato: 'Pubblicato',
            image_filename: 'arci-logo.png',
            autore: 'Redazione AriaPerta'
          },
          {
            id: 3,
            titolo: 'Riapertura della sala prove dopo i lavori di manutenzione',
            sottotitolo: 'Miglioramenti e nuove attrezzature disponibili',
            descrizione: 'Dopo settimane di lavori di manutenzione e miglioramento, la nostra sala prove è finalmente pronta per accogliere nuovamente i musicisti. I lavori hanno incluso la sostituzione dell\'impianto audio, la revisione dell\'acustica e l\'aggiunta di nuove attrezzature professionali.\n\nOra la sala è dotata di un sistema di monitoraggio di alta qualità, microfoni professionali e un mixer digitale che permette registrazioni di qualità studio. L\'acustica è stata ottimizzata per garantire il miglior suono possibile durante le prove e le registrazioni.\n\nLe prenotazioni sono già aperte e invitiamo tutti i soci a venire a testare le nuove attrezzature. La sala è disponibile per sessioni di prova, registrazioni demo e workshop musicali.',
            dataPubblicazione: '8 Gennaio 2025',
            stato: 'Pubblicato',
            image_filename: 'exmatta-logo.png',
            autore: 'Staff Tecnico'
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    
    loadNews()
  }, [])

  return (
    <motion.div className="overlay" onClick={goHome} initial="hidden" animate="visible" exit="exit" variants={fade}>
      <div className="overlayInner" onClick={stop}>
        <div className="news-page-container">
          <div className="news-page-header">
            <h1>📰 NEWS & COMUNICAZIONI</h1>
            <p>Leggi tutte le ultime notizie e comunicazioni del mattatoio</p>
          </div>

          <div className="news-articles">
                    {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Caricamento news...</p>
          </div>
        )}
            
            {error && (
              <div className="error-message">
                <p>⚠️ {error}</p>
                <button onClick={() => window.location.reload()}>Riprova</button>
              </div>
            )}
            
            {!loading && !error && news.length === 0 && (
              <div className="no-news">
                <p>📰 Nessuna news disponibile al momento.</p>
                <p>Ritorna più tardi per le ultime novità!</p>
              </div>
            )}
            
            {!loading && !error && news.map((article) => (
              <article key={article.id} className="news-article">
                <div className="article-header">
                  <div className="article-meta">
                    <span className="article-date">{article.dataPubblicazione}</span>
                    <span className="article-author">di {article.autore}</span>
                  </div>
                  <h2 className="article-title">{article.titolo}</h2>
                  {article.sottotitolo && (
                    <h3 className="article-subtitle">{article.sottotitolo}</h3>
                  )}
                </div>

                {/* Mostra immagine se presente */}
                {article.image_filename && (
                  <div className="article-image">
                    <img 
                      src={`/images/news/${article.image_filename}`} 
                      alt={article.titolo}
                      style={{ 
                        width: '100%', 
                        height: 'auto',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        marginBottom: '20px'
                      }}
                    />
                  </div>
                )}

                <div className="article-content">
                  {article.descrizione.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="article-paragraph">
                      {paragraph}
                    </p>
                  ))}
                </div>


              </article>
            ))}
          </div>

          <div className="news-page-footer">
            <button className="back-to-dashboard-btn" onClick={goHome}>
              🏠 Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function App() {
  const [view, setView] = useState('home')

  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showBugReportForm, setShowBugReportForm] = useState(false)
  const [selectedTeacherForForm, setSelectedTeacherForForm] = useState(null)
  const toast = useToast()

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showRecaptchaBanner, setShowRecaptchaBanner] = useState(false)

  // Mobile Menu Controls
  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  
  const go = (newView) => {
    setView(newView)
  }
  
  const goHome = () => {
    setView('home')
  }
  
  const handlePracticeRoomClick = () => {
    go('practiceRoom')
  }
  
  const handleCourseFormSuccess = () => {
    // Aggiorna la dashboard con le nuove richieste
    // Log rimosso per sicurezza
  }
  
  useEffect(() => {
    document.title = 'Exmatta Dashboard'
  }, [])

  // Funzione per gestire dinamicamente il CSS delle card Ariapertaparty
  useEffect(() => {
    const handleCardBackground = () => {
      const isMobile = window.innerWidth <= 900
      const partyCards = document.querySelectorAll('#ariaperta-party-overlay .partyCard')
      
      console.log('🔄 handleCardBackground chiamato:')
      console.log('📱 isMobile:', isMobile)
      console.log('📏 window.innerWidth:', window.innerWidth)
      console.log('🎴 partyCards trovate:', partyCards.length)
      
      partyCards.forEach((card, index) => {
        if (isMobile) {
          // Su mobile: sfondo trasparente (come richiesto dal mobile.css)
          card.style.setProperty('background', 'rgba(255, 255, 255, 0.1)', 'important')
          console.log(`📱 Card ${index + 1}: Impostata trasparente`)
        } else {
          // Su desktop: sfondo rosa solido con !important per sovrascrivere mobile.css
          card.style.setProperty('background', 'linear-gradient(135deg, var(--pink) 0%, var(--pink-light) 100%)', 'important')
          console.log(`💻 Card ${index + 1}: Impostata rosa solido`)
        }
      })
    }

    // Esegui al caricamento
    handleCardBackground()

    // Esegui al ridimensionamento della finestra
    window.addEventListener('resize', handleCardBackground)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleCardBackground)
    }
  }, [view]) // Si attiva quando cambia la view (incluso quando si va su Ariapertaparty)

    // Esegui anche quando si è sulla pagina Ariapertaparty
  useEffect(() => {
    if (view === 'party') {
      let intervalId = null
      let mutationObserver = null
      
      // Funzione per applicare gli stili alle card
      const applyCardStyles = () => {
        const isMobile = window.innerWidth <= 900
        const partyCards = document.querySelectorAll('#ariaperta-party-overlay .partyCard')
        
        console.log('🎉 Ariapertaparty - applyCardStyles chiamato:')
        console.log('📱 isMobile:', isMobile)
        console.log('📏 window.innerWidth:', window.innerWidth)
        console.log('🎴 partyCards trovate:', partyCards.length)
        
        if (partyCards.length > 0) {
          partyCards.forEach((card, index) => {
            if (isMobile) {
              card.style.setProperty('background', 'rgba(255, 255, 255, 0.1)', 'important')
              console.log(`📱 Card ${index + 1}: Impostata trasparente`)
            } else {
              card.style.setProperty('background', 'linear-gradient(135deg, var(--pink) 0%, var(--pink-light) 100%)', 'important')
              console.log(`💻 Card ${index + 1}: Impostata rosa solido`)
            }
          })
          
          // Se le card sono state trovate e stilizzate, ferma il polling
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        }
      }
      
      // Polling ogni 100ms per le prime 5 volte (500ms totali)
      let attempts = 0
      intervalId = setInterval(() => {
        attempts++
        console.log(`🔄 Tentativo ${attempts} di trovare le card...`)
        applyCardStyles()
        
        if (attempts >= 5) {
          clearInterval(intervalId)
          intervalId = null
        }
      }, 100)
      
      // Mutation Observer per monitorare cambiamenti nel DOM
      const targetNode = document.getElementById('ariaperta-party-overlay')
      if (targetNode) {
        mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
              // Se sono state aggiunte/rimosse card, riapplica gli stili
              setTimeout(applyCardStyles, 50)
            }
          })
        })
        
        mutationObserver.observe(targetNode, {
          childList: true,
          subtree: true
        })
      }
      
      // Cleanup
      return () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
        if (mutationObserver) {
          mutationObserver.disconnect()
        }
      }
    }
  }, [view])

  // (rimosso) caricamento slot a livello App

  // Admin route
  if (view === 'admin') {
    return <AdminApp />
  }

  return (
    <CustomScrollbar>
      {/* HAMBURGER MENU MOBILE - SEMPRE VISIBILE */}
      <button 
        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Apri menu mobile"
        aria-expanded={isMobileMenuOpen}
      >
                        <div className="hamburger-icon">
                  <span></span>
                </div>
      </button>



      {/* ICONA ADMIN - ALTO A DESTRA - SOLO QUANDO MENU È APERTO */}
      {isMobileMenuOpen && (
        <button 
          className="admin-icon-mobile"
          onClick={() => go('admin')}
          aria-label="Accedi alla dashboard admin"
        >
          <span className="admin-icon">👑</span>
        </button>
      )}

      {/* MOBILE MENU OVERLAY */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          <h2 className="mobile-menu-title">Menu Principale</h2>
          <div className="mobile-menu-items">


            {view !== 'home' && (
              <button 
                className="mobile-menu-item"
                onClick={() => { 
                  console.log('CLICK: Pulsante HOME cliccato');
                  go('home'); 
                  closeMobileMenu(); 
                }}
                onMouseDown={() => console.log('MOUSEDOWN: Pulsante HOME')}
                onTouchStart={() => console.log('TOUCHSTART: Pulsante HOME')}
              >
                <span className="item-icon">🏠</span>
                HOME
              </button>
            )}
            <button 
              className="mobile-menu-item"
              onClick={() => { 
                console.log('CLICK: Pulsante ARIAPERTAPARTY cliccato');
                go('party'); 
                closeMobileMenu(); 
              }}
              onMouseDown={() => console.log('MOUSEDOWN: Pulsante ARIAPERTAPARTY')}
              onTouchStart={() => console.log('TOUCHSTART: Pulsante ARIAPERTAPARTY')}
            >
              <span className="item-icon">🎉</span>
              ARIAPERTAPARTY
            </button>
            <button 
              className="mobile-menu-item"
              onClick={() => { 
                console.log('CLICK: Pulsante PRENOTA SALA PROVE cliccato');
                go('practiceRoom'); 
                closeMobileMenu(); 
              }}
              onMouseDown={() => console.log('MOUSEDOWN: Pulsante PRENOTA SALA PROVE')}
              onTouchStart={() => console.log('TOUCHSTART: Pulsante PRENOTA SALA PROVE')}
            >
              <span className="item-icon">🎤</span>
              PRENOTA SALA PROVE
            </button>
            <button 
              className="mobile-menu-item"
              onClick={() => { 
                console.log('CLICK: Pulsante IMPARAR SUONANDO cliccato');
                go('teachers'); 
                closeMobileMenu(); 
              }}
              onMouseDown={() => console.log('MOUSEDOWN: Pulsante IMPARAR SUONANDO')}
              onTouchStart={() => console.log('TOUCHSTART: Pulsante IMPARAR SUONANDO')}
            >
              <span className="item-icon">🎸</span>
              IMPARAR SUONANDO
            </button>
            <button 
              className="mobile-menu-item"
              onClick={() => { 
                console.log('CLICK: Pulsante NEWS cliccato');
                go('news'); 
                closeMobileMenu(); 
              }}
              onMouseDown={() => console.log('MOUSEDOWN: Pulsante NEWS')}
              onTouchStart={() => console.log('TOUCHSTART: Pulsante NEWS')}
            >
              <span className="item-icon">📰</span>
              NEWS & COMUNICAZIONI
            </button>
            <button 
              className="mobile-menu-item"
              onClick={() => { 
                console.log('CLICK: Pulsante SEGNALA BUG cliccato');
                setShowBugReportForm(true); 
                closeMobileMenu(); 
              }}
              onMouseDown={() => console.log('MOUSEDOWN: Pulsante SEGNALA BUG')}
              onTouchStart={() => console.log('TOUCHSTART: Pulsante SEGNALA BUG')}
            >
              <span className="item-icon">🐛</span>
              SEGNALA BUG
            </button>
            



          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'home' && <Home key="home" go={go} onPracticeRoomClick={handlePracticeRoomClick} onCourseFormClick={() => go('teachers')} onBugReportClick={() => setShowBugReportForm(true)} onShowRecaptchaBanner={() => setShowRecaptchaBanner(true)} />}
        {view === 'party' && <Party key="party" goHome={goHome} />}
        {view === 'courses' && <Courses key="courses" goHome={goHome} />}
        {view === 'practiceRoom' && <PracticeRoom key="practiceRoom" goHome={goHome} toast={toast} />}
        {view === 'news' && <NewsPage key="news" goHome={goHome} />}
        {view === 'teachers' && <TeachersPage key="teachers" goHome={goHome} onShowCourseForm={(teacher) => {
          setSelectedTeacherForForm(teacher)
          setShowCourseForm(true)
        }} />}
      </AnimatePresence>
      
      
      
      {/* Teachers Grid */}


      {/* Course Request Form */}
      {showCourseForm && (
        <CourseRequestForm 
          onClose={() => setShowCourseForm(false)}
          onSuccess={handleCourseFormSuccess}
          toast={toast}
          selectedTeacher={selectedTeacherForForm}
        />
      )}

      {/* Bug Report Form */}
      <BugReportForm 
        isOpen={showBugReportForm}
        onClose={() => setShowBugReportForm(false)}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />

      {/* Banner reCaptcha */}
      {showRecaptchaBanner && (
        <div className="recaptcha-banner-overlay">
          <div className="recaptcha-banner">
            <button 
              className="recaptcha-banner-close"
              onClick={() => setShowRecaptchaBanner(false)}
              aria-label="Chiudi banner reCaptcha"
            >
              ✕
            </button>
            
            <div className="recaptcha-banner-icon">🔒</div>
            <h3 className="recaptcha-banner-title">Cos'è reCaptcha?</h3>
            <p className="recaptcha-banner-description">
              reCaptcha è un servizio di Google che protegge questo sito da bot e spam, 
              garantendo che solo gli utenti umani possano interagire con le funzionalità.
            </p>
            
            <div className="recaptcha-banner-actions">
              <button 
                className="recaptcha-banner-btn recaptcha-banner-btn-secondary"
                onClick={() => setShowRecaptchaBanner(false)}
              >
                Chiudi
              </button>
              <button 
                className="recaptcha-banner-btn recaptcha-banner-btn-primary"
                onClick={() => {
                  window.open('https://www.google.com/recaptcha/about/', '_blank');
                  setShowRecaptchaBanner(false);
                }}
              >
                Visita Google reCaptcha
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomScrollbar>
  )
}
