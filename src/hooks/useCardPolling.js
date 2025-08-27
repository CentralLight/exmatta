import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook per il polling delle card e monitoraggio DOM con Mutation Observer
 * Implementa una soluzione robusta per rilevare quando le card sono disponibili
 * e monitorare i cambiamenti in tempo reale
 */
export const useCardPolling = (options = {}) => {
  const {
    pollInterval = 2000, // Intervallo di polling in ms
    maxAttempts = 30, // Numero massimo di tentativi
    selector = '.news-card', // Selettore CSS per le card
    enableMutationObserver = true, // Abilita Mutation Observer
    enablePolling = true, // Abilita polling fallback
    onCardsFound = null, // Callback quando le card sono trovate
    onCardsUpdated = null, // Callback quando le card sono aggiornate
    onError = null // Callback per errori
  } = options;

  const [cards, setCards] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  
  const observerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const cardsRef = useRef([]);
  const lastCardsHashRef = useRef('');

  // Funzione per calcolare l'hash delle card (per rilevare cambiamenti)
  const calculateCardsHash = useCallback((cardElements) => {
    if (!cardElements || cardElements.length === 0) return '';
    
    return Array.from(cardElements)
      .map(card => {
        const title = card.querySelector('.news-title')?.textContent || '';
        const content = card.querySelector('.news-excerpt')?.textContent || '';
        const date = card.querySelector('.news-date')?.textContent || '';
        return `${title}|${content}|${date}`;
      })
      .join('||');
  }, []);

  // Funzione per trovare le card nel DOM
  const findCards = useCallback(() => {
    try {
      const cardElements = document.querySelectorAll(selector);
      if (cardElements && cardElements.length > 0) {
        const newCards = Array.from(cardElements);
        const newHash = calculateCardsHash(newCards);
        
        // Se le card sono cambiate, aggiorna lo stato
        if (newHash !== lastCardsHashRef.current) {
          setCards(newCards);
          cardsRef.current = newCards;
          lastCardsHashRef.current = newHash;
          
          // Aggiungi classi per le animazioni
          newCards.forEach((card, index) => {
            card.classList.remove('polling', 'loading', 'updated');
            card.classList.add('updated');
            
            // Rimuovi la classe 'updated' dopo l'animazione
            setTimeout(() => {
              card.classList.remove('updated');
            }, 500);
          });
          
          if (onCardsUpdated) {
            onCardsUpdated(newCards);
          }
        }
        
        return newCards;
      }
      return null;
    } catch (err) {
      console.error('Errore nel trovare le card:', err);
      setError(err);
      if (onError) onError(err);
      return null;
    }
  }, [selector, calculateCardsHash, onCardsUpdated, onError]);

  // Funzione per il polling delle card
  const startPolling = useCallback(() => {
    if (!enablePolling) return;
    
    setIsPolling(true);
    setAttempts(0);
    
    const poll = () => {
      setAttempts(prev => prev + 1);
      
      const foundCards = findCards();
      if (foundCards) {
        setIsPolling(false);
        setIsLoading(false);
        setError(null);
        
        if (onCardsFound) {
          onCardsFound(foundCards);
        }
        
        // Ferma il polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }
      
      // Se abbiamo raggiunto il numero massimo di tentativi
      if (attempts >= maxAttempts) {
        setIsPolling(false);
        setIsLoading(false);
        setError(new Error(`Impossibile trovare le card dopo ${maxAttempts} tentativi`));
        
        if (onError) {
          onError(new Error(`Impossibile trovare le card dopo ${maxAttempts} tentativi`));
        }
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }
    };
    
    // Esegui il primo controllo immediatamente
    poll();
    
    // Imposta l'intervallo di polling
    pollIntervalRef.current = setInterval(poll, pollInterval);
  }, [enablePolling, attempts, maxAttempts, pollInterval, findCards, onCardsFound, onError]);

  // Funzione per fermare il polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Funzione per riavviare il polling
  const restartPolling = useCallback(() => {
    stopPolling();
    startPolling();
  }, [stopPolling, startPolling]);

  // Setup del Mutation Observer
  useEffect(() => {
    if (!enableMutationObserver) return;
    
    try {
      // Crea il Mutation Observer per monitorare i cambiamenti nel DOM
      observerRef.current = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach((mutation) => {
          // Controlla se sono stati aggiunti/rimossi nodi
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const removedNodes = Array.from(mutation.removedNodes);
            
            // Se sono state aggiunte o rimosse card, ricontrolla
            if (addedNodes.some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node.matches?.(selector) || node.querySelector?.(selector))
            ) || removedNodes.some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node.matches?.(selector) || node.querySelector?.(selector))
            )) {
              shouldCheck = true;
            }
          }
          
          // Controlla se sono cambiati attributi o contenuto
          if (mutation.type === 'attributes' || mutation.type === 'characterData') {
            const target = mutation.target;
            if (target.nodeType === Node.ELEMENT_NODE && 
                (target.matches?.(selector) || target.closest?.(selector))) {
              shouldCheck = true;
            }
          }
        });
        
        // Se necessario, ricontrolla le card
        if (shouldCheck) {
          setTimeout(() => {
            findCards();
          }, 100); // Piccolo delay per assicurarsi che il DOM sia aggiornato
        }
      });
      
      // Inizia a osservare il documento
      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-*'],
        characterData: true
      });
      
    } catch (err) {
      console.error('Errore nell\'inizializzazione del Mutation Observer:', err);
      setError(err);
      if (onError) onError(err);
    }
    
    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enableMutationObserver, selector, findCards, onError]);

  // Setup del polling iniziale
  useEffect(() => {
    // Prova prima a trovare le card immediatamente
    const foundCards = findCards();
    if (foundCards) {
      setIsLoading(false);
      if (onCardsFound) {
        onCardsFound(foundCards);
      }
      return;
    }
    
    // Se non le trova, avvia il polling
    startPolling();
    
    // Cleanup
    return () => {
      stopPolling();
    };
  }, [findCards, startPolling, stopPolling, onCardsFound]);

  // Cleanup finale
  useEffect(() => {
    return () => {
      stopPolling();
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [stopPolling]);

  return {
    cards,
    isPolling,
    isLoading,
    error,
    attempts,
    startPolling,
    stopPolling,
    restartPolling,
    findCards
  };
};

export default useCardPolling;
