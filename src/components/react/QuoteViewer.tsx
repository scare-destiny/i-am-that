// src/components/QuoteViewer.tsx
import { useState, useEffect } from 'react';

interface Quote {
  id: string;
  data: {
    text: string;
    theme: string;
    page?: number;
    difficulty?: string;
    tags?: string[];
  };
}

interface QuoteViewerProps {
  quotes: Quote[];
}

export default function QuoteViewer({ quotes }: QuoteViewerProps) {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState('2.5rem');
  const [lineHeight, setLineHeight] = useState(1.6);

  // Calculate optimal font size based on quote length and screen width
  const calculateFontSize = (text: string) => {
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    
    // Get screen width
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    
    // Base sizes for different screen types
    let baseSize: number;
    let baseLineHeight: number;
    
    if (isMobile) {
      baseSize = 1.6; // rem
      baseLineHeight = 1.5;
    } else if (isTablet) {
      baseSize = 2.0; // rem
      baseLineHeight = 1.55;
    } else {
      baseSize = 2.5; // rem
      baseLineHeight = 1.6;
    }
    
    // Adjust based on quote length
    let sizeMultiplier = 1;
    let lineHeightMultiplier = 1;
    
    if (wordCount > 100 || charCount > 600) {
      // Very long quotes - significantly smaller
      sizeMultiplier = 0.6;
      lineHeightMultiplier = 1.1;
    } else if (wordCount > 60 || charCount > 400) {
      // Long quotes - smaller
      sizeMultiplier = 0.75;
      lineHeightMultiplier = 1.05;
    } else if (wordCount > 40 || charCount > 250) {
      // Medium-long quotes
      sizeMultiplier = 0.85;
      lineHeightMultiplier = 1.0;
    } else if (wordCount > 25 || charCount > 150) {
      // Medium quotes
      sizeMultiplier = 0.95;
      lineHeightMultiplier = 0.98;
    }
    // Short quotes use base size (multiplier = 1)
    
    const calculatedSize = baseSize * sizeMultiplier;
    const calculatedLineHeight = baseLineHeight * lineHeightMultiplier;
    
    return {
      fontSize: `${Math.max(calculatedSize, 1.2)}rem`, // Minimum 1.2rem
      lineHeight: Math.max(calculatedLineHeight, 1.3)
    };
  };

  // Update font size when quote changes or window resizes
  useEffect(() => {
    if (currentQuote) {
      const { fontSize: newFontSize, lineHeight: newLineHeight } = calculateFontSize(currentQuote.data.text);
      setFontSize(newFontSize);
      setLineHeight(newLineHeight);
    }
    
    const handleResize = () => {
      if (currentQuote) {
        const { fontSize: newFontSize, lineHeight: newLineHeight } = calculateFontSize(currentQuote.data.text);
        setFontSize(newFontSize);
        setLineHeight(newLineHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentQuote]);

  // Get random quote that hasn't been shown recently
  const getRandomQuote = (): Quote => {
    const availableQuotes = quotes.filter(quote => 
      !quoteHistory.slice(-3).includes(quote.id)
    );
    
    const quotesToChooseFrom = availableQuotes.length > 0 ? availableQuotes : quotes;
    const randomIndex = Math.floor(Math.random() * quotesToChooseFrom.length);
    return quotesToChooseFrom[randomIndex];
  };

  // Initialize with random quote
  useEffect(() => {
    if (quotes.length > 0) {
      const initialQuote = getRandomQuote();
      setCurrentQuote(initialQuote);
      setQuoteHistory([initialQuote.id]);
      
      // Calculate initial font size
      const { fontSize: initialFontSize, lineHeight: initialLineHeight } = calculateFontSize(initialQuote.data.text);
      setFontSize(initialFontSize);
      setLineHeight(initialLineHeight);
      
      setTimeout(() => setIsVisible(true), 500);
    }
  }, [quotes]);

  const showNextQuote = () => {
    if (!currentQuote) return;
    
    setIsVisible(false);
    
    setTimeout(() => {
      const nextQuote = getRandomQuote();
      setCurrentQuote(nextQuote);
      setQuoteHistory(prev => [...prev.slice(-4), nextQuote.id]);
      
      // Calculate font size for new quote
      const { fontSize: newFontSize, lineHeight: newLineHeight } = calculateFontSize(nextQuote.data.text);
      setFontSize(newFontSize);
      setLineHeight(newLineHeight);
      
      setIsVisible(true);
    }, 400);
  };

  const handleClick = () => {
    showNextQuote();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        showNextQuote();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuote]);

  if (!currentQuote) {
    return <div className="loading">Loading wisdom...</div>;
  }

  return (
    <div 
      className="quote-container"
      onClick={handleClick}
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)",
        minHeight: "100vh",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        position: "relative"
      }}
    >
      {/* Quote counter */}
      <div 
        className="quote-counter"
        style={{
          position: "fixed",
          top: "2rem",
          left: "2rem",
          fontSize: "0.9rem",
          color: "#999",
          fontWeight: 300
        }}
      >
        {quotes.length} insights available
      </div>

      {/* Quote length indicator (debug) */}
      <div 
        className="length-indicator"
        style={{
          position: "fixed",
          top: "4rem",
          left: "2rem",
          fontSize: "0.7rem",
          color: "#ccc",
          fontWeight: 300
        }}
      >
        {currentQuote.data.text.length} chars • {currentQuote.data.text.split(/\s+/).length} words
      </div>

      {/* Main quote display */}
      <div 
        className={`quote-display ${isVisible ? 'visible' : ''}`}
        style={{
          maxWidth: "min(800px, 90vw)",
          textAlign: "center",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s ease",
          position: "relative",
          padding: "0 1rem"
        }}
      >
        {/* Theme indicator */}
        <div 
          className="theme-indicator"
          style={{
            position: "absolute",
            top: "-2rem",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "0.8rem",
            color: "#aaa",
            textTransform: "lowercase",
            fontStyle: "italic"
          }}
        >
          {currentQuote.data.theme}
        </div>
        
        <div 
          className="quote-text"
          style={{
            fontFamily: "'Crimson Text', serif",
            fontSize: fontSize,
            lineHeight: lineHeight,
            color: "#2c2c2c",
            marginBottom: "3rem",
            fontWeight: 400,
            letterSpacing: "0.02em",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto"
          }}
        >
          "{currentQuote.data.text}"
        </div>
        
        <div 
          className="quote-attribution"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(0.8rem, 2vw, 1rem)",
            color: "#666",
            fontWeight: 300,
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}
        >
          — I Am That
          {currentQuote.data.page && (
            <span style={{
              display: "block",
              marginTop: "0.5rem",
              fontSize: "0.8rem",
              color: "#999",
              textTransform: "none",
              letterSpacing: "normal"
            }}>
              location: {currentQuote.data.page}
            </span>
          )}
        </div>
      </div>

      {/* Navigation hint */}
      <div 
        className="navigation-hint"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          fontSize: "0.9rem",
          color: "#999",
          opacity: 0.7,
          fontWeight: 300,
          pointerEvents: "none"
        }}
      >
        click anywhere for next wisdom
      </div>
    </div>
  );
}