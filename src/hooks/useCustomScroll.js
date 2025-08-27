import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook per gestire lo scroll personalizzato con indicatori e animazioni
 * Implementa uno scrollbar personalizzato e indicatori di progresso
 */
export const useCustomScroll = (options = {}) => {
  const {
    enableScrollIndicator = true, // Abilita l'indicatore di scroll
    enableSmoothScroll = true, // Abilita lo scroll fluido
    scrollThreshold = 100, // Soglia per mostrare l'indicatore
    onScroll = null, // Callback per eventi di scroll
    onScrollEnd = null // Callback quando lo scroll finisce
  } = options;

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('down');
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  
  const scrollTimeoutRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const scrollIndicatorRef = useRef(null);

  // Funzione per calcolare il progresso dello scroll
  const calculateScrollProgress = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (documentHeight <= windowHeight) {
      return 0;
    }
    
    const scrollableHeight = documentHeight - windowHeight;
    const progress = (scrollTop / scrollableHeight) * 100;
    
    return Math.min(100, Math.max(0, progress));
  }, []);

  // Funzione per aggiornare l'indicatore di scroll
  const updateScrollIndicator = useCallback(() => {
    if (!enableScrollIndicator || !scrollIndicatorRef.current) return;
    
    const progress = calculateScrollProgress();
    setScrollProgress(progress);
    
    // Mostra l'indicatore solo se c'è scroll
    if (progress > 0) {
      setShowScrollIndicator(true);
      
      // Aggiorna la larghezza dell'indicatore
      if (scrollIndicatorRef.current) {
        scrollIndicatorRef.current.style.transform = `scaleX(${progress / 100})`;
      }
    } else {
      setShowScrollIndicator(false);
    }
  }, [enableScrollIndicator, calculateScrollProgress]);

  // Funzione per gestire lo scroll
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const currentTime = Date.now();
    
    // Determina la direzione dello scroll
    if (scrollTop > lastScrollTopRef.current) {
      setScrollDirection('down');
    } else if (scrollTop < lastScrollTopRef.current) {
      setScrollDirection('up');
    }
    
    lastScrollTopRef.current = scrollTop;
    setIsScrolling(true);
    
    // Aggiorna l'indicatore di scroll
    updateScrollIndicator();
    
    // Callback per eventi di scroll
    if (onScroll) {
      onScroll({
        scrollTop,
        scrollProgress: calculateScrollProgress(),
        direction: scrollDirection,
        timestamp: currentTime
      });
    }
    
    // Reset del timeout per lo scroll
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Imposta il timeout per la fine dello scroll
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      
      if (onScrollEnd) {
        onScrollEnd({
          scrollTop,
          scrollProgress: calculateScrollProgress(),
          direction: scrollDirection,
          timestamp: Date.now()
        });
      }
    }, 150); // 150ms di delay per considerare lo scroll finito
  }, [updateScrollIndicator, onScroll, onScrollEnd, scrollDirection, calculateScrollProgress]);

  // Funzione per scroll fluido verso un elemento
  const scrollToElement = useCallback((element, options = {}) => {
    if (!element) return;
    
    const {
      offset = 0,
      behavior = enableSmoothScroll ? 'smooth' : 'auto',
      duration = 800
    } = options;
    
    const elementTop = element.offsetTop - offset;
    
    if (behavior === 'smooth' && duration > 0) {
      // Scroll fluido personalizzato
      const startPosition = window.pageYOffset || document.documentElement.scrollTop;
      const distance = elementTop - startPosition;
      const startTime = performance.now();
      
      const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      };
      
      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);
        
        const newPosition = startPosition + (distance * easedProgress);
        window.scrollTo(0, newPosition);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };
      
      requestAnimationFrame(animateScroll);
    } else {
      // Scroll istantaneo
      window.scrollTo({
        top: elementTop,
        behavior: behavior
      });
    }
  }, [enableSmoothScroll]);

  // Funzione per scroll verso l'alto
  const scrollToTop = useCallback((options = {}) => {
    const { behavior = enableSmoothScroll ? 'smooth' : 'auto' } = options;
    
    window.scrollTo({
      top: 0,
      behavior: behavior
    });
  }, [enableSmoothScroll]);

  // Funzione per scroll verso il basso
  const scrollToBottom = useCallback((options = {}) => {
    const { behavior = enableSmoothScroll ? 'smooth' : 'auto' } = options;
    
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    
    window.scrollTo({
      top: documentHeight - windowHeight,
      behavior: behavior
    });
  }, [enableSmoothScroll]);

  // Setup degli event listener
  useEffect(() => {
    // Abilita lo scroll fluido se richiesto
    if (enableSmoothScroll) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
    
    // Event listener per lo scroll
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Event listener per il resize della finestra
    const handleResize = () => {
      updateScrollIndicator();
    };
    window.addEventListener('resize', handleResize);
    
    // Event listener per il cambio orientamento (mobile)
    window.addEventListener('orientationchange', handleResize);
    
    // Inizializzazione
    updateScrollIndicator();
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Ripristina lo scroll behavior originale
      document.documentElement.style.scrollBehavior = '';
    };
  }, [handleScroll, updateScrollIndicator, enableSmoothScroll]);

  // Cleanup finale
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    scrollProgress,
    isScrolling,
    scrollDirection,
    showScrollIndicator,
    scrollToElement,
    scrollToTop,
    scrollToBottom,
    updateScrollIndicator
  };
};

export default useCustomScroll;

