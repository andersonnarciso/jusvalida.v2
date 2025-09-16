import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
  version: string;
}

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  hasConsent: boolean;
  canUseAnalytics: boolean;
  canUseFunctional: boolean;
  updatePreferences: (newPreferences: Partial<CookiePreferences>) => void;
  clearPreferences: () => void;
  showBanner: boolean;
  hideBanner: () => void;
  openCookieSettings: () => void;
  setCookieSettingsOpen: (open: boolean) => void;
  cookieSettingsOpen: boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  
  // Check if consent has been given
  useEffect(() => {
    try {
      const consent = localStorage.getItem('cookie_preferences');
      if (!consent) {
        // Show banner after a brief delay for better UX
        const timer = setTimeout(() => setShowBanner(true), 1000);
        return () => clearTimeout(timer);
      } else {
        try {
          setPreferences(JSON.parse(consent));
        } catch (error) {
          console.error('Error parsing cookie preferences:', error);
          setShowBanner(true);
        }
      }
    } catch (error) {
      console.error('Error in CookieConsentProvider useEffect:', error);
      setShowBanner(true);
    }
  }, []);

  const updatePreferences = (newPreferences: Partial<CookiePreferences>) => {
    const updated: CookiePreferences = {
      essential: true,
      functional: preferences?.functional ?? false,
      analytics: preferences?.analytics ?? false,
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...newPreferences
    };
    
    localStorage.setItem('cookie_preferences', JSON.stringify(updated));
    setPreferences(updated);
    setShowBanner(false);
    setCookieSettingsOpen(false);
  };
  
  const clearPreferences = () => {
    localStorage.removeItem('cookie_preferences');
    setPreferences(null);
    setShowBanner(true);
  };

  const hideBanner = () => {
    setShowBanner(false);
  };

  const openCookieSettings = () => {
    setCookieSettingsOpen(true);
  };
  
  const contextValue: CookieConsentContextType = {
    preferences,
    updatePreferences,
    clearPreferences,
    hasConsent: !!preferences,
    canUseAnalytics: preferences?.analytics ?? false,
    canUseFunctional: preferences?.functional ?? false,
    showBanner,
    hideBanner,
    openCookieSettings,
    setCookieSettingsOpen,
    cookieSettingsOpen
  };

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookiePreferences() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookiePreferences must be used within a CookieConsentProvider');
  }
  return context;
}

// Hook for checking if a specific cookie type is allowed
export function useCookieConsent(type: 'essential' | 'functional' | 'analytics') {
  const { preferences } = useCookiePreferences();
  
  if (type === 'essential') return true;
  if (!preferences) return false;
  
  return preferences[type] ?? false;
}

// Hook for analytics tracking (only if consent given)
export function useAnalytics() {
  const { canUseAnalytics } = useCookiePreferences();
  
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    if (!canUseAnalytics) return;
    
    // Only track if user has given analytics consent
    console.log('Analytics event:', eventName, properties);
    // Here you would integrate with your analytics service
  };
  
  const trackPageView = (path: string) => {
    if (!canUseAnalytics) return;
    
    console.log('Page view:', path);
    // Here you would track page views
  };
  
  return {
    trackEvent,
    trackPageView,
    canTrack: canUseAnalytics
  };
}