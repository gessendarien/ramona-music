import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getLyrics, translateLyrics, backupTrack } from '../services/apiService';
import { useNotification } from '../contexts/NotificationContext';

export default function FullScreenPlayer({ 
  currentTrack, 
  isPlaying, 
  onTogglePlay, 
  progress, 
  currentSeconds,
  onClose,
  onSeek,
  onOpenLyrics,
  isTranslationActive,
  onToggleTranslation,
  libraryTracks = [],
  onBackupSuccess,
  onNext,
  onPrevious
}) {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const [lyrics, setLyrics] = useState([]);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLines, setTranslatedLines] = useState({});
  const [isBackingUp, setIsBackingUp] = useState(false);

  const activeLineRef = useRef(null);
  const lyricsContainerRef = useRef(null);

  // Fetch Lyrics
  useEffect(() => {
    if (!currentTrack) return;
    let isMounted = true;
    
    const fetch = async () => {
      setLoadingLyrics(true);
      setLyricsError(null);
      setLyrics([]);
      // Do not reset global translation state here
      
      try {
        const title = currentTrack.title;
        const artist = currentTrack.artist || currentTrack.channel;
        const data = await getLyrics(title, artist);
        
        if (!isMounted) return;
        
        if (data && data.syncedLyrics) {
          setLyrics(parseLrc(data.syncedLyrics));
        } else if (data && data.plainLyrics) {
          setLyrics([{ time: 0, text: data.plainLyrics, isPlain: true }]);
        } else {
          setLyricsError(t('lyrics.not_found') || 'Lyrics not found');
        }
      } catch (err) {
        if (isMounted) setLyricsError(t('lyrics.not_found') || 'Lyrics not found');
      } finally {
        if (isMounted) setLoadingLyrics(false);
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [currentTrack]);

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
    if (activeLineRef.current && lyricsContainerRef.current) {
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
        if (text) parsed.push({ time: timeInSeconds, text });
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

  const isDownloaded = currentTrack && (currentTrack.isLocal || libraryTracks.some(l => l.originalId === currentTrack.id || l.id === currentTrack.id));

  const handleDownload = async () => {
    if (isDownloaded) {
      addNotification(t('playlist.already_backed_up') || 'Already downloaded', 'info');
      return;
    }
    setIsBackingUp(true);
    try {
      await backupTrack(currentTrack);
      if (onBackupSuccess) onBackupSuccess(currentTrack);
      addNotification(t('common.download_started') || 'Descarga iniciada...', 'info');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        if (error.response.data && error.response.data.error === 'Already downloading this track') {
          addNotification('Ya se está descargando...', 'info');
        } else {
          addNotification(t('playlist.already_backed_up') || 'Already downloaded', 'info');
        }
      } else {
        addNotification(`${t('playlist.backup_error') || 'Error downloading'} ${currentTrack.title}`, 'error');
        console.error(error);
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  if (!currentTrack) return null;

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    if (onSeek) onSeek(percentage);
  };
  return (
    <div className="fixed inset-0 z-[100] bg-background md:hidden flex flex-col overflow-hidden animate-slide-up">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container/80 to-background z-10"></div>
        {currentTrack.thumbnail && (
          <img 
            src={currentTrack.thumbnail}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
        )}
      </div>

      <div className="relative z-10 flex flex-col w-full pt-safe flex-grow overflow-y-auto">
        <div className="flex items-center justify-between w-full mt-4 mb-8 px-6">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container/50 text-on-surface hover:bg-surface-container-high transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[24px]">keyboard_arrow_down</span>
          </button>
          <span className="font-label-caps text-on-surface-variant tracking-widest text-[10px] uppercase">Now Playing</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container/50 text-on-surface hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>

        <div className="w-full aspect-square mb-10 px-6 shrink-0">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative group">
            {currentTrack.thumbnail ? (
              <img 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary to-on-secondary-fixed"></div>
            )}
          </div>
        </div>

        <div className="flex flex-col w-full mb-8 px-6 shrink-0">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex flex-col min-w-0 pr-4">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface truncate mb-1">
                {currentTrack.title}
              </h1>
              <h2 className="font-title-md text-on-surface-variant truncate">
                {currentTrack.artist || currentTrack.channel || 'Unknown Artist'}
              </h2>
            </div>
            {isDownloaded ? (
              <div 
                className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-low text-primary flex-shrink-0 cursor-default"
                onClick={handleDownload}
              >
                <span className="material-symbols-outlined text-[28px]">cloud_done</span>
              </div>
            ) : (
              <button 
                onClick={handleDownload}
                disabled={isBackingUp}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-primary/20 text-on-surface-variant hover:text-primary flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
              >
                <span className="material-symbols-outlined text-[28px]">
                  {isBackingUp ? 'cloud_sync' : 'cloud_download'}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col mb-8 px-6 shrink-0">
          <div 
            className="w-full h-1.5 bg-surface-variant/50 rounded-full mb-3 relative cursor-pointer overflow-hidden group"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between w-full font-body-sm text-on-surface-variant text-[12px]">
            <span>{formatTime(currentSeconds)}</span>
            <span>--:--</span>
          </div>
        </div>

        <div className="w-full flex items-center justify-between px-8 mb-8 shrink-0">
          <button className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[24px]">shuffle</span>
          </button>
          <button 
            className="w-14 h-14 flex items-center justify-center text-on-surface-variant/70 hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-default" 
            onClick={onPrevious}
            disabled={!currentTrack}
          >
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: '"FILL" 1' }}>skip_previous</span>
          </button>
          <button 
            className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg shadow-primary/30 transition-transform active:scale-95 hover:bg-primary/90"
            onClick={onTogglePlay}
          >
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1, "wght" 400' }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button 
            className="w-14 h-14 flex items-center justify-center text-on-surface-variant/70 hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-default" 
            onClick={onNext}
            disabled={!currentTrack}
          >
            <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: '"FILL" 1' }}>skip_next</span>
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-secondary hover:text-secondary-fixed transition-colors">
            <span className="material-symbols-outlined text-[24px]">repeat</span>
          </button>
        </div>

        <div className="w-full bg-surface-container-low/80 backdrop-blur-md rounded-t-[32px] p-6 pb-safe mt-auto flex flex-col flex-1 min-h-[50vh]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-title-md text-on-surface text-[18px]">Lyrics</span>
            <div className="flex items-center gap-3">
              {lyrics.length > 0 && !lyrics[0].isPlain && (
                <button 
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isTranslationActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'}`}
                  onClick={() => handleTranslate(false)}
                  disabled={isTranslating}
                  title="Translate Lyrics"
                >
                  {isTranslating ? (
                    <span className="material-symbols-outlined animate-pulse text-[20px]">graphic_eq</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">translate</span>
                  )}
                </button>
              )}
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                onClick={onOpenLyrics}
                title="Full Screen"
              >
                <span className="material-symbols-outlined text-[20px]">open_in_full</span>
              </button>
            </div>
          </div>
          
          <div 
            ref={lyricsContainerRef}
            className="flex flex-col flex-1 overflow-y-auto no-scrollbar mask-vertical pb-4"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
            }}
          >
            {loadingLyrics ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <span className="material-symbols-outlined animate-pulse text-3xl text-primary">graphic_eq</span>
              </div>
            ) : lyricsError ? (
              <div className="flex items-center justify-center h-full text-on-surface-variant text-center">
                {lyricsError}
              </div>
            ) : lyrics.length > 0 && lyrics[0].isPlain ? (
              <div className="text-on-surface text-lg font-medium leading-relaxed whitespace-pre-line text-center">
                {lyrics[0].text}
              </div>
            ) : lyrics.length > 0 ? (
              <div className="space-y-4">
                {lyrics.map((line, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <div 
                      key={index}
                      ref={isActive ? activeLineRef : null}
                      className={`transition-all duration-300 ${isActive ? 'opacity-100 scale-105 origin-left text-on-surface' : 'opacity-40 scale-100 origin-left text-on-surface-variant hover:opacity-70'}`}
                    >
                      <p className={`font-title-lg text-[18px] leading-snug font-bold`}>
                        {line.text}
                      </p>
                      {isTranslationActive && translatedLines[index] && (
                        <p className="font-body-md text-primary mt-1 leading-snug">
                          {translatedLines[index]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant text-center">
                {t('lyrics.not_found') || 'Lyrics not found'}
              </div>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
