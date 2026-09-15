import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function SearchBar({ onSearch, hideIcons, query, onQueryChange, searchId = 'default' }) {
  const { t } = useLanguage();
  const [topicMode, setTopicMode] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecents, setShowRecents] = useState(false);
  const containerRef = useRef(null);

  const executeSearch = (term, isTopic) => {
    const finalTerm = isTopic && !term.toLowerCase().includes('topic') ? `${term} topic` : term;
    onSearch(finalTerm, 'youtube', term);
  };

  useEffect(() => {
    const saved = localStorage.getItem(`recent_searches_${searchId}`);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) { }
    }
  }, [searchId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowRecents(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    let updated = [cleanTerm, ...recentSearches.filter(s => s.toLowerCase() !== cleanTerm.toLowerCase())];
    updated = updated.slice(0, 5); // Keep last 5
    setRecentSearches(updated);
    localStorage.setItem(`recent_searches_${searchId}`, JSON.stringify(updated));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query && query.trim()) {
      saveRecentSearch(query);
      setShowRecents(false);
      executeSearch(query, topicMode);
    }
  };

  const handleRecentClick = (term) => {
    onQueryChange(term);
    saveRecentSearch(term);
    setShowRecents(false);
    executeSearch(term, topicMode);
  };

  const handleClearRecents = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(`recent_searches_${searchId}`);
  };

  const handleRemoveRecent = (term, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    if (updated.length > 0) {
      localStorage.setItem(`recent_searches_${searchId}`, JSON.stringify(updated));
    } else {
      localStorage.removeItem(`recent_searches_${searchId}`);
    }
  };

  return (
    <section className="mb-8 md:mb-16 flex flex-col items-center relative w-full" ref={containerRef}>
      <div className="w-full max-w-3xl relative px-1 md:px-0">
        <form onSubmit={handleSubmit} className="w-full flex items-center bg-surface-container-high md:bg-surface-container-low rounded-full px-6 py-4 md:py-4 focus-within:bg-surface-container transition-all shadow-sm">
          {!hideIcons && (
            <div className="flex space-x-3 mr-4">
              <button 
                type="button" 
                onClick={() => {
                  setTopicMode(false);
                  if (query && query.trim()) {
                    saveRecentSearch(query);
                    executeSearch(query, false);
                  }
                }}
                className={`transition-colors ${!topicMode ? 'text-primary scale-110' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
                title="Búsqueda normal"
              >
                <span className="material-symbols-outlined">play_circle</span>
              </button>
              <button 
                type="button"
                onClick={() => {
                  setTopicMode(true);
                  if (query && query.trim()) {
                    saveRecentSearch(query);
                    executeSearch(query, true);
                  }
                }}
                className={`transition-colors ${topicMode ? 'text-primary scale-110' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
                title={t('search.topic_mode')}
              >
                <span className="material-symbols-outlined">music_note</span>
              </button>
            </div>
          )}
          <input 
            className="bg-transparent border-none focus:ring-0 w-full text-on-surface font-body text-[16px] placeholder:text-on-surface-variant/60 outline-none" 
            placeholder={hideIcons ? (t('library.search_placeholder') || 'Título o artista...') : t('search.placeholder')}
            type="text"
            value={query || ''}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setShowRecents(true)}
          />
          <button type="submit" className="hover:text-primary transition-colors text-on-surface">
            <span className="material-symbols-outlined ml-4">search</span>
          </button>
        </form>


        {/* Recent Searches Dropdown */}
        {showRecents && recentSearches.length > 0 && !hideIcons && (
          <div className="absolute top-full left-1 md:left-0 right-1 md:right-auto md:w-full mt-2 bg-surface-container-high rounded-xl shadow-xl overflow-hidden z-20 border border-white/5">
            <div className="flex justify-between items-center px-6 py-3 border-b border-surface-container">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recientes</span>
              <button 
                className="text-xs text-primary hover:text-rose-300 transition-colors"
                onClick={handleClearRecents}
              >
                Borrar
              </button>
            </div>
            <ul>
              {recentSearches.map((term, idx) => (
                <li key={idx} className="flex items-center hover:bg-surface-container-highest transition-colors group">
                  <button 
                    className="flex-grow text-left px-6 py-3 flex items-center text-on-surface font-light min-w-0"
                    onClick={() => handleRecentClick(term)}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant mr-4 text-sm flex-shrink-0">history</span>
                    <span className="truncate">{term}</span>
                  </button>
                  <button 
                    onClick={(e) => handleRemoveRecent(term, e)}
                    className="px-4 py-3 text-on-surface-variant hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </section>
  );
}
