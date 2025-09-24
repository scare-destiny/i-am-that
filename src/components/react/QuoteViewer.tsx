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

  // Get random quote that hasn't been shown recently
  const getRandomQuote = (): Quote => {
    const availableQuotes = quotes.filter(quote => 
      !quoteHistory.slice(-3).includes(quote.id) // Avoid last 3 quotes
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
      
      // Show quote after brief delay
      setTimeout(() => setIsVisible(true), 500);
    }
  }, [quotes]);

  const showNextQuote = () => {
    if (!currentQuote) return;
    
    setIsVisible(false);
    
    setTimeout(() => {
      const nextQuote = getRandomQuote();
      setCurrentQuote(nextQuote);
      setQuoteHistory(prev => [...prev.slice(-4), nextQuote.id]); // Keep last 5
      setIsVisible(true);
    }, 400);
  };

  // Click handler
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
      className=" m-auto"
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

      {/* Main quote display */}
      <div 
        className={`quote-display ${isVisible ? 'visible' : ''}`}
        style={{
          maxWidth: "800px",
          textAlign: "center",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s ease",
          position: "relative"
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
            fontSize: "clamp(1.8rem, 4vw, 3.2rem)",
            lineHeight: 1.6,
            color: "#2c2c2c",
            marginBottom: "3rem",
            fontWeight: 400,
            letterSpacing: "0.02em"
          }}
        >
          "{currentQuote.data.text}"
        </div>
        
        <div 
          className="quote-attribution"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1rem",
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