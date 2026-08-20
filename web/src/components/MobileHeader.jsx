import React from 'react';

export default function MobileHeader({ onSettingsClick }) {
  return (
    <header className="relative w-full z-40 bg-background/80 backdrop-blur-xl pt-safe md:hidden">
      <div className="h-16 flex items-center justify-between px-gutter">
        <span className="font-display-lg text-headline-lg-mobile tracking-tighter text-primary">Ramona</span>
        <button 
          className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center transition-transform active:scale-95"
          onClick={onSettingsClick}
        >
          <span className="material-symbols-outlined text-on-surface text-[18px]">music_note</span>
        </button>
      </div>
    </header>
  );
}
