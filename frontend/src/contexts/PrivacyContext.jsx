import { createContext, useContext, useState, useEffect } from 'react';

const PrivacyContext = createContext();

export function PrivacyProvider({ children }) {
  // Default to masked (hidden) for privacy
  const [isHidden, setIsHidden] = useState(() => {
    // Check localStorage for saved preference, default to true (hidden)
    const saved = localStorage.getItem('portfolio-privacy-hidden');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Persist preference
  useEffect(() => {
    localStorage.setItem('portfolio-privacy-hidden', JSON.stringify(isHidden));
  }, [isHidden]);

  const togglePrivacy = () => setIsHidden(prev => !prev);
  const showAmounts = () => setIsHidden(false);
  const hideAmounts = () => setIsHidden(true);

  return (
    <PrivacyContext.Provider value={{ isHidden, togglePrivacy, showAmounts, hideAmounts }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}

// Component to mask/reveal amounts with click functionality
export function PrivateAmount({ children, className = '' }) {
  const { isHidden, togglePrivacy } = usePrivacy();
  
  if (isHidden) {
    return (
      <span 
        onClick={togglePrivacy}
        className={`cursor-pointer select-none ${className}`}
        title="Click to reveal"
      >
        ••••••
      </span>
    );
  }
  
  return (
    <span 
      onClick={togglePrivacy}
      className={`cursor-pointer ${className}`}
      title="Click to hide"
    >
      {children}
    </span>
  );
}
