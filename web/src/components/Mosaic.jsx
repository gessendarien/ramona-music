import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import VinylIcon from './VinylIcon';

export default function Mosaic({ tracks = [], onPlay, currentTrack, isPlaying }) {
  const { t } = useLanguage();

  const handlePlayClick = (track) => {
    if (onPlay && track) onPlay(track);
  };

  const t1 = tracks.length > 0 ? tracks[0] : null;
  const t2 = tracks.length > 1 ? tracks[1] : null;
  const t3 = tracks.length > 2 ? tracks[2] : null;
  const t4 = tracks.length > 3 ? tracks[3] : null;

  const renderTitle = (track) => {
    if (!track) return null;
    const isCurrentTrack = currentTrack && currentTrack.id === track.id;
    return (
      <span className="inline" title={track.title}>
        {isCurrentTrack && (
          <span 
            className="relative inline-flex items-center justify-center mr-2 w-[1.2em] h-[1.2em] animate-[spin_3s_linear_infinite] text-rose-300 align-middle"
            style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2em' }}>album</span>
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
              <g fill="rgba(255,255,255,0.25)" transform="rotate(20 50 50)">
                <path d="M 50 50 L 50 15 A 35 35 0 0 1 85 50 Z" />
                <path d="M 50 50 L 50 85 A 35 35 0 0 1 15 50 Z" />
              </g>
            </svg>
          </span>
        )}
        <span className="align-middle">{track.title}</span>
      </span>
    );
  };

  return (
    <section className="mb-12 md:mb-24">
      <div className="grid grid-cols-2 md:grid-cols-12 md:grid-rows-2 gap-4 md:h-[600px]">
        {!t1 ? (
          <div className="col-span-2 md:col-span-6 row-span-2 h-[55vh] md:h-auto rounded-3xl bg-surface-container-high animate-pulse"></div>
        ) : (
          <div 
            className="col-span-2 md:col-span-6 row-span-2 h-[55vh] md:h-auto relative overflow-hidden rounded-3xl bg-surface-container-low group cursor-pointer"
            onClick={() => handlePlayClick(t1)}
          >
            <img className="absolute inset-0 w-full h-full object-cover grayscale-0 group-hover:scale-105 transition-transform duration-700" src={t1.thumbnail} alt={t1.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent md:from-black/80 md:via-transparent md:to-transparent p-6 md:p-8 flex flex-col justify-end">
              <h2 className="font-display-lg text-headline-lg-mobile md:text-5xl md:font-black tracking-tight leading-none mb-1 md:mb-4 uppercase md:normal-case text-primary line-clamp-2">{renderTitle(t1)}</h2>
              <p className="font-body-lg text-body-sm text-on-surface-variant max-w-[80%] md:max-w-sm md:font-light truncate">{t1.artist}</p>
            </div>
          </div>
        )}

        {/* t4 is wide on mobile and desktop, let's render it second on mobile visually by re-ordering using CSS if possible, but actually we can just leave the order t2, t3, t4 and adjust col-span */}
        
        {!t4 ? (
          <div className="col-span-2 md:col-span-6 row-span-1 h-48 md:h-auto rounded-2xl bg-surface-container-high animate-pulse order-2 md:order-4"></div>
        ) : (
          <div 
            className="col-span-2 md:col-span-6 row-span-1 h-48 md:h-auto relative overflow-hidden rounded-2xl bg-surface-container-low cursor-pointer group order-2 md:order-4 shadow-xl"
            onClick={() => handlePlayClick(t4)}
          >
            <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={t4.thumbnail} alt={t4.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent md:bg-gradient-to-r md:from-black/80 md:to-transparent p-4 md:p-8 flex flex-col justify-end md:justify-center">
              <h3 className="font-title-md text-title-md md:text-3xl md:font-black md:uppercase text-primary leading-tight mb-1 line-clamp-2">{renderTitle(t4)}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant md:font-light truncate">{t4.artist}</p>
            </div>
          </div>
        )}

        {!t2 ? (
          <div className="col-span-1 md:col-span-3 row-span-1 h-40 md:h-auto rounded-2xl bg-surface-container-high animate-pulse order-3 md:order-2"></div>
        ) : (
          <div 
            className="col-span-1 md:col-span-3 row-span-1 h-40 md:h-auto relative overflow-hidden rounded-2xl bg-surface-container-low cursor-pointer group order-3 md:order-2 shadow-md"
            onClick={() => handlePlayClick(t2)}
          >
            <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={t2.thumbnail} alt={t2.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-black/40 md:hover:bg-black/20 transition-colors p-3 md:p-6 flex flex-col justify-end">
              <h3 className="font-title-md text-body-sm md:text-xl md:font-bold md:uppercase text-primary line-clamp-2">{renderTitle(t2)}</h3>
              <p className="md:hidden font-body-sm text-[11px] text-on-surface-variant mt-0.5 truncate">{t2.artist}</p>
            </div>
          </div>
        )}

        {!t3 ? (
          <div className="col-span-1 md:col-span-3 row-span-1 h-40 md:h-auto rounded-2xl bg-surface-container-high animate-pulse order-4 md:order-3"></div>
        ) : (
          <div 
            className="col-span-1 md:col-span-3 row-span-1 h-40 md:h-auto relative overflow-hidden rounded-2xl bg-surface-container-low cursor-pointer group order-4 md:order-3 shadow-md"
            onClick={() => handlePlayClick(t3)}
          >
            <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={t3.thumbnail} alt={t3.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:bg-black/40 md:hover:bg-black/20 transition-colors p-3 md:p-6 flex flex-col justify-end">
              <h3 className="font-title-md text-body-sm md:text-xl md:font-bold md:uppercase text-primary line-clamp-2">{renderTitle(t3)}</h3>
              <p className="md:hidden font-body-sm text-[11px] text-on-surface-variant mt-0.5 truncate">{t3.artist}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
