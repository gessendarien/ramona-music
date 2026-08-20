import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { useLanguage } from '../contexts/LanguageContext';
import VinylIcon from './VinylIcon';
import ScrollingText from './ScrollingText';
import LyricsModal from './LyricsModal';
import MiniPlayer from './MiniPlayer';
import FullScreenPlayer from './FullScreenPlayer';

export default function PlayerBar({ currentTrack, isPlaying, setIsPlaying, onMockAction, onAddToPlaylist, onOpenPlaylist, playlist = [], libraryTracks = [], activeDownloads = [], onBackupSuccess, onNext, onPrevious, isShuffle, onToggleShuffle, repeatMode, onToggleRepeat }) {
  const { t } = useLanguage();
  const [isBuffering, setIsBuffering] = useState(false);
  const [playedPercentage, setPlayedPercentage] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isTranslationActive, setIsTranslationActive] = useState(false);
  const [actualDuration, setActualDuration] = useState(0);
  const playerRef = useRef(null);
  const lastSecondRef = useRef(0);

  const getTrackUrl = () => {
    if (!currentTrack) return '';
    return currentTrack.url || `https://www.youtube.com/watch?v=${currentTrack.id}`;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgress = (state) => {
    setPlayedPercentage(state.played * 100);
    // Only update currentSeconds when the integer second changes (throttle re-renders)
    const newSecond = Math.floor(state.playedSeconds);
    if (newSecond !== lastSecondRef.current) {
      lastSecondRef.current = newSecond;
      setCurrentSeconds(state.playedSeconds);
    }
  };

  const handleSeek = (e) => {
    if (!playerRef.current || !currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    setPlayedPercentage(percentage * 100);
    playerRef.current.seekTo(percentage, 'fraction');
  };

  return (
    <>
      {/* Hidden ReactPlayer */}
      <div style={{ display: 'none' }}>
        {currentTrack && (
          <ReactPlayer 
            ref={playerRef}
            url={getTrackUrl()}
            playing={isPlaying}
            onProgress={handleProgress}
            onDuration={(duration) => setActualDuration(duration)}
            onEnded={() => {
              if (repeatMode === 'one' && playerRef.current) {
                playerRef.current.seekTo(0);
              } else if (onNext) {
                onNext();
              } else {
                setIsPlaying(false);
              }
            }}
            onBuffer={() => setIsBuffering(true)}
            onBufferEnd={() => setIsBuffering(false)}
            onPlay={() => setIsBuffering(false)}
            volume={volume}
            muted={isMuted}
            config={{ file: { forceAudio: true } }}
          />
        )}
      </div>

      <div className="hidden md:block fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50">
        <div className="bg-neutral-900/80 backdrop-blur-2xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col relative overflow-hidden">
        {/* Clickable Progress Bar */}
        <div className="px-5 pt-1.5">
          <div 
            className="w-full h-1.5 bg-neutral-800/80 rounded-full cursor-pointer relative group"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-200" 
              style={{ width: `${playedPercentage}%` }}
            ></div>
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ left: `calc(${playedPercentage}% - 6px)` }}
            ></div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between">
        <div className="flex items-center pl-2 flex-1 min-w-0 pr-4">
          {currentTrack && currentTrack.thumbnail ? (
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-14 h-14 min-w-[56px] mr-4 shadow-lg flex-shrink-0 object-cover rounded-md" 
            />
          ) : (
            <div className="w-14 h-14 min-w-[56px] mr-4 shadow-lg flex-shrink-0 bg-surface-container-high rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">music_note</span>
            </div>
          )}
          <div className="hidden sm:block min-w-0 overflow-hidden pr-2">
            <ScrollingText text={currentTrack ? currentTrack.title : ''} className="text-sm font-bold leading-none mb-1 text-on-surface" />
            <ScrollingText text={currentTrack ? (currentTrack.artist || currentTrack.channel) : ''} className="text-[10px] text-on-surface-variant uppercase tracking-widest" />
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <button 
            className={`transition-colors disabled:opacity-30 disabled:cursor-default ${isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`} 
            onClick={onToggleShuffle}
            disabled={!currentTrack}
          >
            <span className="material-symbols-outlined">shuffle</span>
          </button>
          
          <button 
            className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-default" 
            onClick={onPrevious}
            disabled={!currentTrack || playlist.length === 0}
          >
            <span className="material-symbols-outlined">skip_previous</span>
          </button>
          
          <button 
            className={`relative rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform overflow-hidden ${currentTrack ? 'hover:scale-110' : 'opacity-50 cursor-default'}`}
            onClick={currentTrack ? togglePlay : undefined}
            disabled={!currentTrack}
          >
            <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden">
              <VinylIcon 
                isPlaying={isPlaying} 
                isBuffering={isBuffering}
                className="w-full h-full" 
                hideCenterHole={true}
              />
            </div>
            <span className="material-symbols-outlined relative z-30 text-white drop-shadow-md" style={{ fontVariationSettings: '"FILL" 1' }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          
          <button 
            className="text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-default" 
            onClick={onNext}
            disabled={!currentTrack || playlist.length === 0}
          >
            <span className="material-symbols-outlined">skip_next</span>
          </button>

          <button 
            className={`transition-colors disabled:opacity-30 disabled:cursor-default ${repeatMode !== 'off' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`} 
            onClick={onToggleRepeat}
            disabled={!currentTrack}
          >
            <span className="material-symbols-outlined">{repeatMode === 'one' ? 'repeat_one' : 'repeat'}</span>
          </button>
        </div>
        <div className="hidden md:flex items-center pr-6 space-x-4 flex-1 justify-end min-w-0 pl-4">
          <div className="flex items-center">
            <button 
              className={`text-on-surface-variant transition-colors flex items-center ${isLyricsOpen ? 'text-primary' : 'hover:text-primary'} disabled:opacity-30 disabled:cursor-default`}
              onClick={() => setIsLyricsOpen(true)}
              disabled={!currentTrack}
              title="Lyrics"
            >
              <span className="material-symbols-outlined text-lg">lyrics</span>
            </button>
          </div>
          
          <div className="w-[1px] h-4 bg-white/10"></div>
          
          <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center" onClick={toggleMute}>
            <span className="material-symbols-outlined text-sm">
              {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
            </span>
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step="any"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted && parseFloat(e.target.value) > 0) setIsMuted(false);
            }}
            className="w-24 h-1 rounded-full appearance-none cursor-pointer thumbless-slider"
            style={{
              background: `linear-gradient(to right, #fecdd3 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%)`
            }}
          />
          <button 
            className={`text-on-surface-variant transition-colors ml-2 ${currentTrack && playlist.find(t => t.id === currentTrack.id) ? 'text-primary/50 cursor-default' : 'hover:text-primary disabled:opacity-30 disabled:cursor-default'}`} 
            onClick={(e) => {
              if (currentTrack && !playlist.find(t => t.id === currentTrack.id) && onAddToPlaylist) {
                onAddToPlaylist(currentTrack, e);
                // Trigger bounce animation on queue icon
                const queueIcon = document.getElementById('btn-queue-music-desktop');
                if (queueIcon) {
                  queueIcon.classList.add('animate-bounce');
                  setTimeout(() => queueIcon.classList.remove('animate-bounce'), 1000);
                }
              }
            }} 
            title={currentTrack && playlist.find(t => t.id === currentTrack.id) ? 'Already in playlist' : t('player.add_to_playlist')}
            disabled={!currentTrack || (currentTrack && playlist.find(t => t.id === currentTrack.id))}
          >
            <span className="material-symbols-outlined">
              {currentTrack && playlist.find(t => t.id === currentTrack.id) ? 'check' : 'playlist_add'}
            </span>
          </button>
          <button 
            id="btn-queue-music-desktop"
            className="text-on-surface-variant hover:text-primary transition-colors ml-2" 
            onClick={() => onOpenPlaylist && onOpenPlaylist()} 
            title={t('player.view_playlist')}
          >
            <span className="material-symbols-outlined">queue_music</span>
          </button>
        </div>
      </div>
      </div>
      </div>

      <MiniPlayer 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        progress={playedPercentage}
        currentSeconds={currentSeconds}
        totalSeconds={actualDuration}
        onOpenFullScreen={() => setIsFullScreenOpen(true)}
        onOpenPlaylist={onOpenPlaylist}
        playlist={playlist}
        onNext={onNext}
        onPrevious={onPrevious}
      />

      {isFullScreenOpen && (
        <FullScreenPlayer 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={playedPercentage}
          currentSeconds={currentSeconds}
          totalSeconds={actualDuration}
          onTogglePlay={togglePlay}
          onClose={() => setIsFullScreenOpen(false)}
          onNext={onNext}
          onPrevious={onPrevious}
          onOpenLyrics={() => {
            setIsFullScreenOpen(false);
            setIsLyricsOpen(true);
          }}
          onSeek={(percentage) => {
            setPlayedPercentage(percentage * 100);
            if (playerRef.current) playerRef.current.seekTo(percentage, 'fraction');
          }}
          isTranslationActive={isTranslationActive}
          onToggleTranslation={setIsTranslationActive}
          libraryTracks={libraryTracks}
          activeDownloads={activeDownloads}
          onBackupSuccess={onBackupSuccess}
          playlist={playlist}
          onAddToPlaylist={onAddToPlaylist}
        />
      )}

      <LyricsModal 
        track={currentTrack} 
        currentSeconds={currentSeconds} 
        isOpen={isLyricsOpen} 
        onClose={() => setIsLyricsOpen(false)} 
        isTranslationActive={isTranslationActive}
        onToggleTranslation={setIsTranslationActive}
      />
    </>
  );
}
