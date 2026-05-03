import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en';
import ta from '../locales/ta';
import fr from '../locales/fr';

const translations = { en, ta, fr };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'en');

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  const t = (key, params = {}) => {
    const template = translations[language]?.[key] || translations['en']?.[key] || key;
    return Object.entries(params).reduce((result, [paramKey, value]) => {
      return result.replaceAll(`{{${paramKey}}}`, String(value ?? ''));
    }, template);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
