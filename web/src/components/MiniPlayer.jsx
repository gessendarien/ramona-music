import React from 'react';
import VinylIcon from './VinylIcon';
import ScrollingText from './ScrollingText';

export default function MiniPlayer({ currentTrack, isPlaying, onTogglePlay, progress, onOpenFullScreen, onOpenPlaylist, playlist = [], onNext, onPrevious }) {
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 md:hidden animate-slide-up">
      {/* Progress Bar */}
      <div 
        className="w-full h-[2px] bg-white/10 relative z-10 cursor-pointer"
        onClick={onOpenFullScreen}
      >
        <div 
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="mini-player-blur bg-surface-container-high/95 backdrop-blur-xl flex items-center px-4 py-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.5)] relative gap-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        
        {/* Duration below progress line on far right */}
        <div className="absolute top-0.5 right-2 text-[10px] text-on-surface-variant/70 font-mono italic">
          {currentTrack.duration}
        </div>

        {/* Left Column: Large Thumbnail */}
        <div 
          className="w-16 h-16 bg-surface-variant rounded-md flex-shrink-0 overflow-hidden shadow-sm cursor-pointer"
          onClick={onOpenFullScreen}
        >
          {currentTrack.thumbnail ? (
            <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-on-secondary-fixed"></div>
          )}
        </div>

        {/* Right Column: Text (Top) + Controls (Bottom) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          {/* Top Row: Song Info */}
          <div className="w-full overflow-hidden cursor-pointer" onClick={onOpenFullScreen}>
            <ScrollingText text={currentTrack.title} className="text-[13px] font-bold text-on-surface leading-tight mb-0.5" />
            <ScrollingText text={currentTrack.artist || currentTrack.channel} className="text-[10px] text-on-surface-variant uppercase tracking-widest" />
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex items-center justify-center w-full mt-1">
            {/* Centered Controls */}
            <div className="flex items-center gap-2">
              <button 
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant disabled:opacity-30" 
                onClick={(e) => { e.stopPropagation(); onPrevious && onPrevious(); }}
                disabled={!currentTrack || playlist.length === 0}
              >
                <span className="material-symbols-outlined text-[26px]">skip_previous</span>
              </button>
              
              <button 
                className="relative rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-transform overflow-hidden active:scale-95"
                onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
              >
                <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden">
                  <VinylIcon 
                    isPlaying={isPlaying} 
                    isBuffering={false}
                    className="w-full h-full" 
                    hideCenterHole={true}
                  />
                </div>
                <span className="material-symbols-outlined relative z-30 text-white drop-shadow-md text-[22px]" style={{ fontVariationSettings: '"FILL" 1, "wght" 400' }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              
              <button 
                className="w-10 h-10 flex items-center justify-center text-on-surface-variant disabled:opacity-30" 
                onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}
                disabled={!currentTrack || playlist.length === 0}
              >
                <span className="material-symbols-outlined text-[26px]">skip_next</span>
              </button>
            </div>
          </div>
        </div>

        {/* Far Right Column: Playlist Button */}
        <div className="flex-shrink-0 flex items-center justify-center px-1 md:hidden">
          <button 
            id="btn-queue-music-mobile"
            className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-95"
            onClick={(e) => { e.stopPropagation(); if (onOpenPlaylist) onOpenPlaylist(); }}
          >
            <span className="material-symbols-outlined text-[30px]">queue_music</span>
            {playlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {playlist.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
