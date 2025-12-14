'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, Locale, TranslationKeys } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && ['en', 'rw', 'fr'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (isClient) {
      localStorage.setItem('locale', newLocale);
    }
  }, [isClient]);

  const t = useCallback((key: TranslationKeys): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t
  }), [locale, setLocale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
