import React, { useState, useEffect, useRef } from 'react';
import { getLyrics, translateLyrics } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

const LyricsModal = ({ track, currentSeconds, isOpen, onClose, isTranslationActive, onToggleTranslation }) => {
  const { t } = useLanguage();
  const [lyrics, setLyrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLines, setTranslatedLines] = useState({});

  const containerRef = useRef(null);
  const activeLineRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !track) return;
    
    let isMounted = true;

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);
      setLyrics([]);
      // Do not reset global translation state here
      
      try {
        const title = track.title;
        const artist = track.artist || track.channel;
        
        const data = await getLyrics(title, artist);
        
        if (!isMounted) return;
        
        if (data && data.syncedLyrics) {
          const parsed = parseLrc(data.syncedLyrics);
          setLyrics(parsed);
        } else if (data && data.plainLyrics) {
          setLyrics([{ time: 0, text: data.plainLyrics, isPlain: true }]);
        } else {
          setError(t('lyrics.not_found') || 'Lyrics not found.');
        }
      } catch (err) {
        if (isMounted) setError(t('lyrics.not_found') || 'Lyrics not found.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLyrics();

    return () => { isMounted = false; };
  }, [track, isOpen]);

  // Determine active index
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentSeconds) {
      activeIndex = i;
    } else {
      break; 
    }
  }

  // Scroll to active line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, lyrics]);

  const parseLrc = (lrcString) => {
    const lines = lrcString.split('\n');
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
    
    lines.forEach(line => {
      const match = timeRegex.exec(line);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
        const timeInSeconds = min * 60 + sec + ms / 1000;
        const text = line.replace(timeRegex, '').trim();
        
        if (text) {
          parsed.push({ time: timeInSeconds, text });
        }
      }
    });
    
    return parsed;
  };

  const handleTranslate = async (autoFetch = false) => {
    if (!autoFetch && isTranslationActive) {
      onToggleTranslation(false);
      return;
    }
    if (!autoFetch && Object.keys(translatedLines).length > 0) {
      onToggleTranslation(true);
      return;
    }
    if (lyrics.length === 0) return;
    
    setIsTranslating(true);
    if (!autoFetch) onToggleTranslation(true);
    try {
      const textToTranslate = lyrics.map(l => l.text).join('\n');
      const response = await translateLyrics(textToTranslate);
      
      const translatedArray = response.translatedText.split('\n');
      const newTranslatedLines = {};
      lyrics.forEach((l, index) => {
        if (translatedArray[index]) {
          newTranslatedLines[index] = translatedArray[index].trim();
        }
      });
      setTranslatedLines(newTranslatedLines);
    } catch (err) {
      console.error(err);
      onToggleTranslation(false);
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (isTranslationActive && Object.keys(translatedLines).length === 0 && lyrics.length > 0 && !lyrics[0].isPlain && !isTranslating) {
      handleTranslate(true);
    }
  }, [lyrics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/80 transition-opacity duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Top right buttons anchored to viewport */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-[210]">
        {lyrics.length > 0 && !lyrics[0].isPlain && (
          <button 
            onClick={() => handleTranslate(false)}
            disabled={isTranslating}
            className={`p-4 transition-colors ${isTranslationActive ? 'text-primary' : 'text-white/50 hover:text-white'}`}
          >
            {isTranslating ? (
              <span className="material-symbols-outlined animate-pulse text-4xl">graphic_eq</span>
            ) : (
              <span className="material-symbols-outlined text-4xl">translate</span>
            )}
          </button>
        )}
        <button 
          onClick={onClose}
          className="p-4 text-white/50 hover:text-white"
        >
          <span className="material-symbols-outlined text-4xl">close</span>
        </button>
      </div>

      <div className="relative w-full max-w-4xl max-h-[80vh] flex flex-col items-center mt-16 md:mt-0">

        <div className="text-center mb-8 shrink-0 mt-12 md:mt-0">
          <h2 className="text-3xl font-black text-white tracking-tight">{track?.title}</h2>
          <p className="text-lg text-white/60">{track?.artist || track?.channel}</p>
        </div>

        <div 
          ref={containerRef}
          className="w-full overflow-y-auto hide-scrollbar flex-1 px-4 md:px-8 py-10 mask-vertical text-center"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined animate-pulse text-4xl text-primary">graphic_eq</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-white/50 text-xl font-medium">
              {error}
            </div>
          ) : lyrics.length > 0 && lyrics[0].isPlain ? (
            <div className="text-white/80 text-2xl font-bold leading-relaxed whitespace-pre-line">
              {lyrics[0].text}
            </div>
          ) : lyrics.length > 0 ? (
            <div className="space-y-6 pb-[40vh]">
              {lyrics.map((line, index) => {
                const isActive = index === activeIndex;
                const isPassed = index < activeIndex;
                
                return (
                  <div 
                    key={index} 
                    ref={isActive ? activeLineRef : null}
                    className={`transition-all duration-500 cursor-default
                      ${isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-30 hover:opacity-50'}
                    `}
                  >
                    <p 
                      className="text-2xl md:text-5xl font-black tracking-tight text-white"
                      style={{ textShadow: isActive ? '0 0 40px rgba(255,255,255,0.3)' : 'none' }}
                    >
                      {line.text}
                    </p>
                    {isTranslationActive && translatedLines[index] && (
                      <p className="text-xl md:text-3xl font-bold tracking-tight text-primary mt-2">
                        {translatedLines[index]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-white/50 text-xl font-medium">
              {t('lyrics.not_found') || 'No lyrics available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsModal;
