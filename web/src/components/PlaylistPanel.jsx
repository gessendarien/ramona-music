import React, { useState, useRef } from 'react';
import { backupTrack } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import VinylIcon from './VinylIcon';

export default function PlaylistPanel({ isOpen, onClose, playlist, currentTrack, isPlaying: globalIsPlaying, onPlay, libraryTracks = [], activeDownloads = [], onBackupSuccess, onRemove, onClearPlaylist }) {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const [backingUp, setBackingUp] = useState({});
  const [trackToRemove, setTrackToRemove] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const touchTimer = useRef(null);
  const longPressTriggered = useRef(false);

  const handlePressStart = (track) => {
    if (isSelectMode) return;
    touchTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setIsSelectMode(true);
      setSelectedTracks(new Set([track.id]));
    }, 600);
  };

  const handlePressEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
  };

  const handleBackup = async (track) => {
    if (backingUp[track.id] || activeDownloads?.some(dl => dl.trackId === track.id)) {
      addNotification('Ya se está descargando...', 'info');
      return;
    }
    setBackingUp(prev => ({ ...prev, [track.id]: true }));
    try {
      await backupTrack(track);
      if (onBackupSuccess) onBackupSuccess(track);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        if (error.response.data && error.response.data.error === 'Already downloading this track') {
          addNotification('Ya se está descargando...', 'info');
        } else {
          addNotification(t('playlist.already_backed_up'), 'info');
        }
      } else {
        addNotification(`${t('playlist.backup_error')} ${track.title}`, 'error');
        console.error(error);
      }
    } finally {
      setTimeout(() => setBackingUp(prev => ({ ...prev, [track.id]: false })), 2000);
    }
  };

  const handleBackupAll = () => {
    if (playlist.length === 1) {
      const track = playlist[0];
      const isDownloaded = track.isLocal || libraryTracks.some(l => l.originalId === track.id || l.id === track.id);
      if (isDownloaded) {
        addNotification(t('playlist.already_backed_up'), 'info');
        return;
      }
    }

    playlist.forEach(track => {
      const isDownloaded = track.isLocal || libraryTracks.some(l => l.originalId === track.id || l.id === track.id);
      if (!isDownloaded && !backingUp[track.id]) {
        handleBackup(track);
      }
    });
  };

  const confirmRemove = () => {
    if (trackToRemove && onRemove) {
      onRemove(trackToRemove.id);
      setTrackToRemove(null);
    }
  };

  return (
    <>
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-surface-container-highest/95 backdrop-blur-3xl shadow-2xl z-[80] transform transition-transform duration-500 ease-in-out border-l border-white/5 ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-surface-container flex justify-between items-center bg-surface-container">
          <h2 className="text-xl font-bold text-on-surface flex items-center">
            <span className="material-symbols-outlined mr-2 text-primary">queue_music</span>
            {t('playlist.title')}
          </h2>
          <div className="flex items-center space-x-2">
            {isSelectMode && (
              <button 
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedTracks(new Set());
                }} 
                className="text-sm font-bold text-primary mr-2"
              >
                {t('playlist.cancel')}
              </button>
            )}
            {isSelectMode && selectedTracks.size > 0 ? (
              <button 
                onClick={() => setShowDeleteSelectedConfirm(true)} 
                className="w-10 h-10 flex items-center justify-center hover:bg-error/20 rounded-full transition-colors text-error"
                title={t('playlist.remove_selected_title')}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            ) : playlist.length > 0 && !isSelectMode && (
              <button 
                onClick={() => setShowClearConfirm(true)} 
                className="w-10 h-10 flex items-center justify-center hover:bg-error/20 rounded-full transition-colors text-on-surface-variant hover:text-error"
                title={t('playlist.clear_all_title')}
              >
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto relative">
          {playlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant p-6 text-center">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">library_music</span>
              <p>{t('playlist.empty')}</p>
              <p className="text-sm font-light mt-2">{t('playlist.empty_desc')}</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container">
              {playlist.map(track => {
                const isThisTrackCurrent = currentTrack?.id === track.id;
                const isThisTrackPlaying = isThisTrackCurrent && globalIsPlaying;
                const isDownloading = backingUp[track.id] || activeDownloads?.some(dl => dl.trackId === track.id);
                const isDownloaded = !isDownloading && (track.isLocal || libraryTracks.some(l => l.originalId === track.id || l.id === track.id));
                
                return (
                <div 
                  key={track.id} 
                  className={`p-4 flex items-center hover:bg-surface-container-low transition-colors group ${selectedTracks.has(track.id) ? 'bg-primary/10' : ''}`}
                  onMouseDown={() => handlePressStart(track)}
                  onMouseUp={handlePressEnd}
                  onMouseLeave={handlePressEnd}
                  onTouchStart={() => handlePressStart(track)}
                  onTouchEnd={handlePressEnd}
                  onTouchCancel={handlePressEnd}
                  onClick={(e) => {
                    if (longPressTriggered.current) {
                      longPressTriggered.current = false;
                      return;
                    }
                    if (isSelectMode) {
                      setSelectedTracks(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(track.id)) {
                          newSet.delete(track.id);
                          if (newSet.size === 0) setIsSelectMode(false);
                        } else {
                          newSet.add(track.id);
                        }
                        return newSet;
                      });
                    }
                  }}
                >
                  {isSelectMode && (
                    <div className="mr-4 flex-shrink-0 flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedTracks.has(track.id)}
                        readOnly
                        className="w-5 h-5 accent-primary cursor-pointer pointer-events-none"
                      />
                    </div>
                  )}
                  <div 
                    className={`relative w-12 h-12 rounded-lg overflow-hidden bg-surface-container-high mr-4 flex-shrink-0 ${isSelectMode ? 'cursor-default' : 'cursor-pointer'}`}
                    onClick={(e) => {
                      if (!isSelectMode && onPlay) onPlay(track);
                      if (isSelectMode) e.stopPropagation();
                    }}
                  >
                    <img className={`w-full h-full object-cover transition-opacity duration-300 md:group-hover:opacity-50 ${isThisTrackCurrent ? 'opacity-50' : ''}`} src={track.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Track'} alt={track.title} />
                    <div className={`absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 md:group-hover:opacity-100 hover:text-primary ${isThisTrackCurrent ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
                      <span className="material-symbols-outlined text-3xl shadow-black drop-shadow-md">
                        {isThisTrackPlaying ? 'pause_circle' : 'play_circle'}
                      </span>
                    </div>
                  </div>
                  <div 
                    className={`flex-grow min-w-0 pr-4 ${!isSelectMode ? 'cursor-pointer hover:opacity-80' : ''}`}
                    onClick={(e) => {
                      if (!isSelectMode && onPlay) {
                        e.stopPropagation();
                        onPlay(track);
                      }
                    }}
                  >
                    <h4 className={`text-sm font-bold truncate transition-colors ${isThisTrackCurrent ? 'text-primary' : 'text-on-surface'}`}>{track.title}</h4>
                    <p className="text-xs text-on-surface-variant font-light truncate">{track.artist || track.channel}</p>
                  </div>
                  
                  {/* Playing Indicator */}
                  <div className={`mr-2 transition-all duration-500 flex-shrink-0 ${isThisTrackCurrent ? 'opacity-100 scale-100 w-8 h-8' : 'opacity-0 scale-50 w-0 h-8 mr-0 overflow-hidden'}`}>
                    {isThisTrackCurrent && <VinylIcon thumbnail={track.thumbnail} isPlaying={globalIsPlaying} className="w-8 h-8 shadow-sm" />}
                  </div>
                  {!isSelectMode && (
                    <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {isDownloaded ? (
                        <button 
                          onClick={() => addNotification(t('playlist.already_downloaded') || 'Already backed up', 'info')}
                          className="w-10 h-10 flex items-center justify-center text-primary hover:bg-primary/10 rounded-full flex-shrink-0 transition-colors cursor-pointer"
                          title="Already Backed Up"
                        >
                          <span className="material-symbols-outlined text-sm">cloud_done</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleBackup(track)}
                          className="w-10 h-10 flex items-center justify-center relative hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded-full transition-colors flex-shrink-0"
                          title={t('playlist.backup_track')}
                        >
                          {isDownloading && (
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90 p-[2px]" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-surface-container-high" />
                              <circle 
                                cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" 
                                className="text-primary transition-all duration-500 ease-out"
                                strokeDasharray={2 * Math.PI * 16}
                                strokeDashoffset={(2 * Math.PI * 16) - (Math.max(5, activeDownloads?.find(dl => dl.trackId === track.id)?.progress || 0) / 100) * (2 * Math.PI * 16)}
                              />
                            </svg>
                          )}
                          <span className="material-symbols-outlined text-sm relative z-10 block">
                            cloud_download
                          </span>
                        </button>
                      )}
                      <button 
                        onClick={() => setTrackToRemove(track)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-error/20 text-on-surface-variant hover:text-error rounded-full transition-colors flex-shrink-0"
                        title="Remove"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                       </button>
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}

          {/* Confirmation Modal Overlay */}
          {trackToRemove && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-6 z-10">
              <div className="bg-surface-container-highest border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-on-surface mb-2">{t('playlist.remove_title')}</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  {t('playlist.remove_confirm').split('{track}')[0]}
                  <span className="text-primary font-semibold">{trackToRemove.title}</span>
                  {t('playlist.remove_confirm').split('{track}')[1]}
                </p>
                <div className="flex space-x-3 justify-end">
                  <button 
                    onClick={() => setTrackToRemove(null)}
                    className="px-4 py-2 rounded-full font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    {t('playlist.cancel')}
                  </button>
                  <button 
                    onClick={confirmRemove}
                    className="px-4 py-2 rounded-full font-bold bg-error text-on-error hover:brightness-110 transition-all active:scale-95"
                  >
                    {t('playlist.remove')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Delete Selected Confirmation Modal Overlay */}
          {showDeleteSelectedConfirm && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-6 z-10">
              <div className="bg-surface-container-highest border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-on-surface mb-2">{t('playlist.remove_selected_title')}</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  {t('playlist.remove_selected_confirm').replace('{count}', selectedTracks.size)}
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowDeleteSelectedConfirm(false)}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    {t('playlist.cancel')}
                  </button>
                  <button 
                    onClick={() => {
                      if (onRemove) onRemove(Array.from(selectedTracks));
                      setIsSelectMode(false);
                      setSelectedTracks(new Set());
                      setShowDeleteSelectedConfirm(false);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-error text-on-error hover:bg-error/90 transition-colors shadow-sm"
                  >
                    {t('playlist.remove')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clear All Confirmation Modal Overlay */}
          {showClearConfirm && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-6 z-10">
              <div className="bg-surface-container-highest border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-on-surface mb-2">{t('playlist.clear_all_title')}</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  {t('playlist.clear_all_confirm').replace('{count}', playlist.length)}
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    {t('playlist.cancel')}
                  </button>
                  <button 
                    onClick={() => {
                      if (onClearPlaylist) onClearPlaylist();
                      setShowClearConfirm(false);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-error text-on-error hover:bg-error/90 transition-colors shadow-sm"
                  >
                    {t('playlist.remove')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {playlist.length > 0 && (
          <div className="p-6 border-t border-surface-container bg-surface-container-low z-20">
            <button 
              onClick={handleBackupAll}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg hover:brightness-110 transition-all active:scale-95 flex items-center justify-center"
            >
              <span className="material-symbols-outlined mr-2">library_add_check</span>
              {t('playlist.backup_all')}
            </button>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] transition-opacity" 
          onClick={onClose}
        />
      )}
    </>
  );
}
