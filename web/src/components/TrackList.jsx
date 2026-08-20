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
  onLongPress
}) {
  const { t } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(5);
  const touchTimer = React.useRef(null);
  const longPressTriggered = React.useRef(false);

  useEffect(() => {
    setVisibleCount(5);
  }, [tracks]);

  const visibleTracks = tracks ? tracks.slice(0, visibleCount) : [];
  const hasMore = tracks && visibleCount < tracks.length;

  const handlePressStart = (trackId) => {
    if (!onLongPress || isSelectMode) return;
    longPressTriggered.current = false;
    touchTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress(trackId);
    }, 600);
  };

  const handlePressEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
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
              if (isSelectMode && onToggleSelect) {
                onToggleSelect(track.id);
                return;
              }
              if (longPressTriggered.current) {
                longPressTriggered.current = false;
                return;
              }
              if (window.innerWidth < 768 && onPlay) onPlay(track);
            }}
            onTouchStart={() => handlePressStart(track.id)}
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
              <img className={`w-full h-full object-cover transition-opacity duration-300 md:group-hover:opacity-50 ${isThisTrackCurrent ? 'opacity-50' : 'opacity-100'}`} src={track.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Cover'} alt={track.title} />
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
                      title="Edit Metadata"
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
          <p className="text-on-surface-variant">{t('home.no_tracks')}</p>
        )}
      </div>
      
      {hasMore && (
        <div className="mt-4 mb-12 flex justify-center">
          <button 
            onClick={() => setVisibleCount(prev => prev + 5)}
            className="px-8 py-3 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-semibold tracking-wide uppercase transition-colors text-sm"
          >
            {t('common.show_more')}
          </button>
        </div>
      )}
    </section>
  );
}
