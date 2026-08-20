import React, { createContext, useState, useContext, useEffect } from 'react';
import en from '../i18n/en.json';
import es from '../i18n/es.json';

const translations = {
  en,
  es
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Default to English
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('ramona_language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('ramona_language', language);
  }, [language]);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  // Simple key resolver: "config.title" -> translates to "Settings"
  const t = (key, variables = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    // Fallback to English if key missing in Spanish
    if (value === undefined && language !== 'en') {
      let fallbackValue = translations['en'];
      for (const k of keys) {
        if (fallbackValue === undefined) break;
        fallbackValue = fallbackValue[k];
      }
      value = fallbackValue;
    }

    if (value === undefined) {
      return key; // return the key itself if not found
    }

    // Replace {variable} with actual values
    if (typeof value === 'string' && Object.keys(variables).length > 0) {
      Object.keys(variables).forEach(varKey => {
        value = value.replace(new RegExp(`{${varKey}}`, 'g'), variables[varKey]);
      });
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
