import React, { useState } from 'react';
import { backupTrack } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import VinylIcon from './VinylIcon';

export default function PlaylistPanel({ isOpen, onClose, playlist, currentTrack, isPlaying: globalIsPlaying, onPlay, libraryTracks = [], onBackupSuccess, onRemove, onClearPlaylist }) {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  const [backingUp, setBackingUp] = useState({});
  const [trackToRemove, setTrackToRemove] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleBackup = async (track) => {
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
      setBackingUp(prev => ({ ...prev, [track.id]: false }));
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
            {playlist.length > 0 && (
              <button 
                onClick={() => setShowClearConfirm(true)} 
                className="p-2 hover:bg-error/20 rounded-full transition-colors text-on-surface-variant hover:text-error"
                title="Clear Playlist"
              >
                <span className="material-symbols-outlined">delete_sweep</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant hover:text-primary">
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
                const isDownloaded = track.isLocal || libraryTracks.some(l => l.originalId === track.id || l.id === track.id);
                
                return (
                <div key={track.id} className="p-4 flex items-center hover:bg-surface-container-low transition-colors group">
                  <div 
                    className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-container-high mr-4 flex-shrink-0 cursor-pointer"
                    onClick={() => onPlay && onPlay(track)}
                  >
                    <img className={`w-full h-full object-cover transition-opacity duration-300 md:group-hover:opacity-50 ${isThisTrackCurrent ? 'opacity-50' : ''}`} src={track.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Track'} alt={track.title} />
                    <div className={`absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 md:group-hover:opacity-100 hover:text-primary ${isThisTrackCurrent ? 'opacity-100' : 'opacity-0 md:opacity-0'}`}>
                      <span className="material-symbols-outlined text-3xl shadow-black drop-shadow-md">
                        {isThisTrackPlaying ? 'pause_circle' : 'play_circle'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow min-w-0 pr-4">
                    <h4 className={`text-sm font-bold truncate transition-colors ${isThisTrackCurrent ? 'text-primary' : 'text-on-surface'}`}>{track.title}</h4>
                    <p className="text-xs text-on-surface-variant font-light truncate">{track.artist || track.channel}</p>
                  </div>
                  <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    {isDownloaded ? (
                      <div 
                        className="p-2 text-primary rounded-full flex-shrink-0 cursor-default"
                        title="Already Downloaded"
                      >
                        <span className="material-symbols-outlined text-sm">cloud_done</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleBackup(track)}
                        disabled={backingUp[track.id]}
                        className="p-2 hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded-full transition-colors flex-shrink-0"
                        title={t('playlist.backup_track')}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {backingUp[track.id] ? 'cloud_sync' : 'cloud_download'}
                        </span>
                      </button>
                    )}
                    <button 
                      onClick={() => setTrackToRemove(track)}
                      className="p-2 hover:bg-error/20 text-on-surface-variant hover:text-error rounded-full transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  
                  {/* Playing Indicator */}
                  <div className={`ml-2 transition-all duration-500 ${isThisTrackCurrent ? 'opacity-100 scale-100 w-8 h-8' : 'opacity-0 scale-50 w-0 h-8 ml-0 overflow-hidden'}`}>
                    {isThisTrackCurrent && <VinylIcon thumbnail={track.thumbnail} isPlaying={globalIsPlaying} className="w-8 h-8 shadow-sm" />}
                  </div>
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

          {/* Clear All Confirmation Modal Overlay */}
          {showClearConfirm && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-6 z-10">
              <div className="bg-surface-container-highest border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-on-surface mb-2">Clear Playlist</h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  Are you sure you want to remove all {playlist.length} tracks from the playlist?
                </p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (onClearPlaylist) onClearPlaylist();
                      setShowClearConfirm(false);
                    }}
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-error text-on-error hover:bg-error/90 transition-colors shadow-sm"
                  >
                    Clear All
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
