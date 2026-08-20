import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function MobileNav({ activeTab, onTabChange, activeDownloads = [] }) {
  const { t } = useLanguage();
  // Map current app tabs to mobile labels
  // recommended -> today
  // player -> search
  // library -> library
  
  return (
    <nav className="sticky top-0 w-full z-40 bg-background/95 backdrop-blur-md md:hidden pt-safe">
      <div className="h-16 flex items-center justify-around px-2 border-b border-white/5">
        <button 
          className={`flex flex-col items-center gap-1 w-20 transition-colors ${activeTab === 'recommended' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => onTabChange('recommended')}
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          <span className="font-label-caps text-[10px] uppercase">{t('nav.recommended')}</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 w-20 transition-colors ${activeTab === 'player' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => onTabChange('player')}
        >
          <span className="material-symbols-outlined">search</span>
          <span className="font-label-caps text-[10px] uppercase">{t('nav.player')}</span>
        </button>
        <button 
          className={`relative flex flex-col items-center gap-1 w-20 transition-colors ${activeTab === 'library' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => onTabChange('library')}
        >
          <span className="material-symbols-outlined">library_music</span>
          <span className="font-label-caps text-[10px] uppercase">{t('nav.library')}</span>
          {activeDownloads.length > 0 && (
            <span className="absolute top-0 right-3 bg-primary text-on-primary text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-sm">
              {activeDownloads.length}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
