import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { newsService } from '../../services/api'
import CourseRequestForm from '../CourseRequestForm'
import BugReportForm from '../BugReportForm'
import useToast from '../../admin/hooks/useToast'
import useCardPolling from '../../hooks/useCardPolling'

export default function PublicDashboard() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showBugReportForm, setShowBugReportForm] = useState(false)
  const toast = useToast()

  // Utilizza l'hook di polling per le card
  const {
    cards: domCards,
    isPolling,
    isLoading: isPollingLoading,
    error: pollingError,
    attempts: pollingAttempts,
    restartPolling
  } = useCardPolling({
    selector: '.news-card',
    pollInterval: 1000, // Controlla ogni secondo
    maxAttempts: 50, // Più tentativi per essere sicuri
    enableMutationObserver: true,
    enablePolling: true,
    onCardsFound: (foundCards) => {
      console.log('🎯 Card trovate con polling:', foundCards.length);
      // Le card sono state trovate nel DOM
    },
    onCardsUpdated: (updatedCards) => {
      console.log('🔄 Card aggiornate:', updatedCards.length);
      // Le card sono state aggiornate nel DOM
    },
    onError: (error) => {
      console.error('❌ Errore nel polling delle card:', error);
      toast.showError('Errore nel caricamento delle news');
    }
  });

  // Carica le news dal database
  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true)
        const response = await newsService.getAll()
        
        if (response && response.success && response.news) {
          // Filtra solo le news pubblicate
          const publishedNews = response.news.filter(item => item.stato === 'Pubblicato')
          setNews(publishedNews)
        } else {
          setNews([])
        }
      } catch (error) {
        console.error('Errore nel caricamento news:', error)
        setNews([])
        toast.showError('Errore nel caricamento delle news dal database')
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [toast])

  // Effetto per sincronizzare le news del database con quelle del DOM
  useEffect(() => {
    if (domCards.length > 0 && news.length > 0) {
      console.log('🎯 Sincronizzazione news:', {
        database: news.length,
        dom: domCards.length
      });
      
      // Aggiungi classi per le animazioni
      domCards.forEach((card, index) => {
        // Rimuovi classi precedenti
        card.classList.remove('polling', 'loading', 'updated');
        
        // Aggiungi classe per indicare che è stata sincronizzata
        card.classList.add('updated');
        
        // Rimuovi la classe dopo l'animazione
        setTimeout(() => {
          card.classList.remove('updated');
        }, 500);
      });
    }
  }, [domCards, news]);

  const handleCourseRequestSuccess = () => {
    setShowCourseForm(false)
    toast.showSuccess('Richiesta inviata con successo! Ti contatteremo presto.')
  }

  // Funzione per riavviare il polling se necessario
  const handleRetryPolling = () => {
    if (pollingError) {
      restartPolling();
      toast.showInfo('Riavvio del monitoraggio delle news...');
    }
  };

  return (
    <div className="public-dashboard">
      {/* Header */}
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-content">
          <h1>Benvenuti ad AriaPerta</h1>
          <p>Il centro culturale e sociale del mattatoio di Milano</p>
        </div>
        
        {/* Pulsante Bug Report */}
        <motion.div 
          className="bug-report-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <button 
            className="bug-report-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Log rimosso per sicurezza
              setShowBugReportForm(true);
            }}
            title="Segnala un problema"
            type="button"
          >
            <span className="bug-icon">🐛</span>
            <span className="bug-text">Segnala Bug</span>
          </button>
        </motion.div>
      </motion.div>

      {/* Sezione News */}
      <motion.section 
        className="news-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="section-header">
          <h2>📰 Ultime Notizie</h2>
          <p>Rimani aggiornato sulle nostre attività e iniziative</p>
          
          {/* Indicatori di stato del polling */}
          {isPolling && (
            <div className="polling-status">
              <span className="polling-indicator">🔄</span>
              <span>Monitoraggio attivo... Tentativo {pollingAttempts}</span>
            </div>
          )}
          
          {pollingError && (
            <div className="polling-error">
              <span className="error-indicator">❌</span>
              <span>Errore nel monitoraggio</span>
              <button 
                onClick={handleRetryPolling}
                className="retry-btn"
                style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '12px' }}
              >
                Riprova
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Caricamento news dal database...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="no-news-container">
            <div className="no-news-icon">📰</div>
            <h3>Nessuna news disponibile</h3>
            <p>Al momento non ci sono comunicazioni da visualizzare.</p>
            <p>Controlla più tardi per aggiornamenti!</p>
          </div>
        ) : (
          <div className="news-grid">
            {news.map((newsItem, index) => (
              <motion.article
                key={newsItem.id}
                className="news-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <div className="news-content">
                  <h3 className="news-title">{newsItem.titolo}</h3>
                  
                  {newsItem.sottotitolo && (
                    <p className="news-subtitle">{newsItem.sottotitolo}</p>
                  )}
                  
                  <p className="news-excerpt">
                    {newsItem.descrizione.length > 200 
                      ? `${newsItem.descrizione.substring(0, 200)}...` 
                      : newsItem.descrizione
                    }
                  </p>
                  
                  <div className="news-meta">
                    <span className="news-date">
                      {new Date(newsItem.published_at || newsItem.created_at).toLocaleDateString('it-IT')}
                    </span>
                    {newsItem.autore && (
                      <span className="news-author">di {newsItem.autore}</span>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </motion.section>

      {/* Sezioni Corsi e Prenotazioni - nascoste quando il form è aperto */}
      {/* Utilizziamo AnimatePresence per animazioni fluide di entrata/uscita */}
      <AnimatePresence mode="wait">
        {!showCourseForm && (
          <>
            {/* Sezione Corsi */}
            <motion.section 
              className="courses-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="section-header">
                <h2>🎸 Corsi Musicali</h2>
                <p>Scopri i nostri corsi e richiedi informazioni</p>
              </div>

              <div className="courses-content">
                <div className="courses-info">
                  <h3>Offriamo corsi per tutti i livelli</h3>
                  <ul className="courses-list">
                    <li>🎸 Chitarra (acustica ed elettrica)</li>
                    <li>🎹 Pianoforte e tastiere</li>
                    <li>🥁 Batteria e percussioni</li>
                    <li>🎤 Canto e vocal training</li>
                    <li>🎼 Teoria musicale e composizione</li>
                  </ul>
                  
                  <button 
                    className="request-info-btn"
                    onClick={() => setShowCourseForm(true)}
                  >
                    📚 Richiedi Informazioni
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Sezione Prenotazioni */}
            <motion.section 
              className="bookings-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="section-header">
                <h2>🎤 Sala Prove</h2>
                <p>Prenota la nostra sala prove per le tue sessioni musicali</p>
              </div>

              <div className="bookings-content">
                <div className="bookings-info">
                  <h3>Sala prove professionale</h3>
                  <ul className="bookings-features">
                    <li>🎵 Strumenti professionali disponibili</li>
                    <li>🎧 Sistema audio di alta qualità</li>
                    <li>⏰ Prenotazioni flessibili</li>
                    <li>💰 Prezzi accessibili per i soci</li>
                  </ul>
                  
                  <button 
                    className="book-now-btn"
                    onClick={() => toast.showInfo('La prenotazione online sarà disponibile presto!')}
                  >
                    📅 Prenota Ora
                  </button>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      {/* Form Richiesta Corsi - sempre visibile quando showCourseForm è true */}
      {showCourseForm && (
        <CourseRequestForm 
          onClose={() => setShowCourseForm(false)}
          onSuccess={handleCourseRequestSuccess}
        />
      )}

      {/* Form Segnalazione Bug */}
      <BugReportForm 
        isOpen={showBugReportForm}
        onClose={() => setShowBugReportForm(false)}
      />
    </div>
  )
}
