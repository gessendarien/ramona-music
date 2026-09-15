import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import VinylIcon from './VinylIcon';

export default function TrackList({ 
  title, tracks, onPlay, onAdd, onEdit, 
  playlist = [], currentTrack = null, isPlaying: globalIsPlaying = false, 
  horizontalOnMobile = false,
  isSelectMode = false,
  selectedTracks = new Set(),
  onToggleSelect,
  onLongPress,
  hasMoreFromServer = false,
  onLoadMore,
  isLoadingMore = false,
  isLoading = false
}) {
  const { t } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(10);
  const touchTimer = React.useRef(null);
  const longPressTriggered = React.useRef(false);
  const touchStartPos = React.useRef(null);
  const prevTracksLength = React.useRef(tracks ? tracks.length : 0);

  useEffect(() => {
    if (tracks && tracks.length !== prevTracksLength.current) {
      if (tracks.length < prevTracksLength.current) {
        setVisibleCount(10); // New search or reset
      } else if (hasMoreFromServer) {
        setVisibleCount(tracks.length); // Auto-expand when new server tracks arrive
      }
      prevTracksLength.current = tracks.length;
    } else if (!tracks || tracks.length === 0) {
      setVisibleCount(10);
      prevTracksLength.current = 0;
    }
  }, [tracks, hasMoreFromServer]);

  const visibleTracks = tracks ? tracks.slice(0, visibleCount) : [];
  const hasMoreLocal = tracks && visibleCount < tracks.length;
  const showLoadMore = hasMoreLocal || hasMoreFromServer;

  const handleTouchStart = (e, trackId) => {
    if (!onLongPress || isSelectMode) return;
    longPressTriggered.current = false;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress(trackId);
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (!touchStartPos.current) return;
    const moveX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const moveY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (moveX > 10 || moveY > 10) {
      if (touchTimer.current) clearTimeout(touchTimer.current);
      touchStartPos.current = null;
    }
  };

  const handlePressStart = (trackId) => {
    if (!onLongPress || isSelectMode) return;
    longPressTriggered.current = false;
    touchTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress(trackId);
    }, 500);
  };

  const handlePressEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchStartPos.current = null;
  };

  return (
    <section>
      {title && (
        <div className="flex justify-between items-end mb-12">
          <h2 className="text-4xl font-black tracking-tighter uppercase">{title}</h2>
        </div>
      )}
      <div className={horizontalOnMobile ? "flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:flex-col md:space-y-4 md:overflow-visible md:snap-none md:mx-0 md:px-0" : "space-y-4"}>
        {visibleTracks && visibleTracks.length > 0 ? visibleTracks.map(track => {
          const isThisTrackCurrent = currentTrack?.id === track.id;
          const isThisTrackPlaying = isThisTrackCurrent && globalIsPlaying;
          const isSelected = isSelectMode && selectedTracks.has(track.id);
          
          return (
          <div key={track.id} 
            className={`group hover:bg-surface-container-low transition-all cursor-pointer md:cursor-default ${isSelected ? 'bg-primary/20 hover:bg-primary/30' : ''} ${horizontalOnMobile ? "flex flex-col gap-2 w-32 shrink-0 snap-start md:w-full md:flex-row md:items-center md:p-4 md:rounded-xl md:gap-0" : "flex items-start md:items-center p-4 rounded-xl"}`} 
            onClick={(e) => {
              if (longPressTriggered.current) {
                longPressTriggered.current = false;
                return;
              }
              if (isSelectMode && onToggleSelect) {
                onToggleSelect(track.id);
                return;
              }
              if (window.innerWidth < 768 && onPlay) onPlay(track);
            }}
            onTouchStart={(e) => handleTouchStart(e, track.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            onMouseDown={() => handlePressStart(track.id)}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onContextMenu={(e) => {
              if (!horizontalOnMobile) {
                // Only prevent context menu if it's a list view where we want long-press to select
                e.preventDefault(); 
              }
            }}
          >
            <div className={`relative rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 ${horizontalOnMobile ? "w-32 h-32 md:w-16 md:h-16 md:mr-6" : "w-16 h-16 mr-4 md:mr-6"}`}>
              <img className={`w-full h-full object-cover transition-opacity duration-300 md:group-hover:opacity-50 ${isThisTrackCurrent ? 'opacity-50' : 'opacity-100'}`} src={track.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Cover'} alt={track.title} referrerPolicy="no-referrer" />
              <button 
                onClick={(e) => { e.stopPropagation(); onPlay && onPlay(track); }}
                className={`absolute inset-0 flex items-center justify-center text-white transition-opacity duration-300 md:group-hover:opacity-100 hover:text-primary ${isThisTrackCurrent ? 'opacity-100' : 'hidden md:flex md:opacity-0'}`}
                title={isThisTrackPlaying ? "Pause" : "Play"}
              >
                <span className="material-symbols-outlined text-4xl shadow-black drop-shadow-md" style={{ fontVariationSettings: '"FILL" 1' }}>
                  {isThisTrackPlaying ? 'pause_circle' : 'play_circle'}
                </span>
              </button>
            </div>
            <div className={`flex-grow flex flex-row items-center min-w-0`}>
              <div className={`flex-grow min-w-0 mr-2 ${horizontalOnMobile ? "" : "mb-1 md:mb-0"}`}>
                <h4 className={`${horizontalOnMobile ? "font-title-md text-body-sm truncate md:text-lg md:font-semibold md:leading-tight" : "text-base md:text-lg font-semibold leading-tight truncate md:whitespace-normal"} ${isThisTrackCurrent ? 'text-primary' : 'text-on-surface'}`}>{track.title}</h4>
                <p className={`${horizontalOnMobile ? "font-body-sm text-[12px] truncate md:text-sm md:font-light" : "text-on-surface-variant text-sm font-light truncate md:whitespace-normal"}`}>{track.artist || track.channel}</p>
                {track.duration && (
                  <p className="text-on-surface-variant/70 text-[10px] md:text-xs font-mono tracking-wider mt-0.5">{track.duration}</p>
                )}
              </div>

              {/* Actions */}
              <div className={`flex items-center justify-end w-auto space-x-2 md:space-x-4 ${horizontalOnMobile ? "hidden md:flex" : "flex"}`}>
                <div className="flex items-center justify-end space-x-2 md:space-x-4 flex-grow-0">
                  <div className={`transition-all duration-500 flex items-center justify-center ${isThisTrackCurrent ? 'opacity-100 scale-100 w-5 md:w-6 mr-1 md:mr-2' : 'opacity-0 scale-50 w-0 overflow-hidden'}`}>
                    {isThisTrackCurrent && <VinylIcon thumbnail={track.thumbnail} isPlaying={globalIsPlaying} className="w-5 h-5 md:w-6 md:h-6 shadow-md" />}
                  </div>
                  
                  <div className={`flex items-center space-x-1 md:space-x-4 transition-opacity ${playlist.find(t => t.id === track.id) ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
                  {track.isLocal && (
                    <button 
                      className={`p-1 md:p-2 transition-colors text-on-surface-variant hover:text-primary ${playlist.find(t => t.id === track.id) ? 'md:opacity-0 md:group-hover:opacity-100' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onEdit && onEdit(track); }}
                      title={t('metadata.title') || "Edit Metadata"}
                    >
                      <span className="material-symbols-outlined text-[20px] md:text-[24px]">edit</span>
                    </button>
                  )}
                  <button 
                    className={`p-1 md:p-2 transition-colors ${playlist.find(t => t.id === track.id) ? 'text-primary cursor-default' : 'hover:text-primary text-on-surface-variant'}`}
                    onClick={(e) => onAdd && !playlist.find(t => t.id === track.id) && onAdd(track, e)}
                    disabled={playlist.find(t => t.id === track.id)}
                    title={playlist.find(t => t.id === track.id) ? 'Already in playlist' : 'Add to playlist'}
                  >
                    <span className="material-symbols-outlined text-[20px] md:text-[24px]">
                      {playlist.find(t => t.id === track.id) ? 'check' : 'add'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}) : (
          isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center p-4 rounded-xl animate-pulse bg-surface-container-low/50">
                  <div className="w-12 h-12 rounded bg-surface-container mr-4"></div>
                  <div className="flex-grow">
                    <div className="h-4 bg-surface-container rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-surface-container rounded w-1/2"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-container ml-4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-surface-container-low/30 border border-outline-variant/10">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">library_music</span>
              <p className="text-on-surface font-semibold text-lg mb-1">{t('library.empty_title') || 'Tu biblioteca está vacía'}</p>
              <p className="text-on-surface-variant text-sm max-w-sm">{t('library.empty_desc') || 'Busca canciones y respáldalas para escucharlas sin conexión.'}</p>
            </div>
          )
        )}
      </div>
      
      {showLoadMore && (
        <div className="mt-4 mb-12 flex justify-center">
          <button 
            onClick={() => {
              if (hasMoreLocal) {
                setVisibleCount(prev => prev + 10);
              } else if (hasMoreFromServer && onLoadMore) {
                onLoadMore();
              }
            }}
            disabled={isLoadingMore}
            className="px-8 py-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-semibold tracking-wide uppercase transition-colors text-sm flex items-center justify-center min-w-[140px] h-[44px]"
          >
            {isLoadingMore ? (
              <span className="material-symbols-outlined animate-pulse text-[24px] text-primary">graphic_eq</span>
            ) : (
              t('common.show_more') || 'Show More'
            )}
          </button>
        </div>
      )}
    </section>
  );
}
