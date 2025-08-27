import React, { useEffect, useRef, useState } from 'react';
import { useCustomScroll } from '../hooks/useCustomScroll';

const CustomScrollbar = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);

  // Utilizza l'hook personalizzato per lo scroll
  const {
    scrollProgress,
    isScrolling: isPageScrolling,
    scrollDirection,
    showScrollIndicator
  } = useCustomScroll({
    enableScrollIndicator: true,
    enableSmoothScroll: true,
    onScroll: (scrollData) => {
      // Aggiorna la posizione del thumb quando la pagina scorre
      updateThumbSize();
    }
  });

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;

    if (!container || !track || !thumb) return;

    const updateThumbSize = () => {
      // Monitora lo scroll della pagina invece del contenitore
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Forza sempre la visualizzazione per debug
      track.style.display = 'block';
      
      // Calcolo sicuro per evitare divisioni per zero
      if (documentHeight <= windowHeight) {
        setThumbHeight(50);
        setThumbTop(0);
        return;
      }
      
      const scrollableHeight = documentHeight - windowHeight;
      const thumbHeightRatio = windowHeight / documentHeight;
      const newThumbHeight = Math.max(50, windowHeight * thumbHeightRatio);
      setThumbHeight(newThumbHeight);
      
      // Calcolo sicuro per thumbTop
      const maxThumbTop = windowHeight - newThumbHeight;
      let newThumbTop = 0;
      
      if (scrollableHeight > 0 && maxThumbTop > 0) {
        newThumbTop = (scrollTop / scrollableHeight) * maxThumbTop;
      }
      
      // Assicurati che sia un numero valido
      newThumbTop = Math.max(0, Math.min(maxThumbTop, newThumbTop));
      
      setThumbTop(newThumbTop);
    };

    const handleScroll = () => {
      updateThumbSize();
    };

    const handleMouseDown = (e) => {
      if (e.target === thumb) {
        setIsScrolling(true);
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (!isScrolling) return;
      
      const trackRect = track.getBoundingClientRect();
      const trackTop = trackRect.top;
      const trackHeight = trackRect.height;
      const mouseY = e.clientY;
      
      const newThumbTop = Math.max(0, Math.min(trackHeight - thumbHeight, mouseY - trackTop));
      const scrollRatio = newThumbTop / (trackHeight - thumbHeight);
      
      // Scroll della pagina invece del contenitore
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollableHeight = documentHeight - windowHeight;
      const newScrollTop = scrollRatio * scrollableHeight;
      
      // Scroll istantaneo per movimento più reattivo
      window.scrollTo({
        top: newScrollTop,
        behavior: 'auto' // 'auto' = istantaneo, 'smooth' = fluido
      });
    };

    const handleMouseUp = () => {
      setIsScrolling(false);
    };

    // Event listeners per lo scroll della pagina
    window.addEventListener('scroll', handleScroll);
    track.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Initial update
    updateThumbSize();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      track.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrolling, thumbHeight]);

  // Protezione per evitare valori NaN negli stili
  const safeThumbHeight = isNaN(thumbHeight) ? 50 : thumbHeight;
  const safeThumbTop = isNaN(thumbTop) ? 0 : thumbTop;

  return (
    <div className={`custom-scrollbar ${className}`} ref={containerRef}>
      {children}
      
      {/* Scrollbar personalizzato */}
      <div className="custom-scrollbar-track" ref={trackRef}>
        <div
          className="custom-scrollbar-thumb"
          ref={thumbRef}
          style={{
            height: safeThumbHeight,
            top: safeThumbTop,
          }}
        />
      </div>
      
      {/* Indicatore di scroll in alto */}
      {showScrollIndicator && (
        <div 
          className="scroll-indicator"
          style={{
            transform: `scaleX(${scrollProgress / 100})`
          }}
        />
      )}
    </div>
  );
};

export default CustomScrollbar;
