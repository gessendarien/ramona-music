import React from 'react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 z-[60] w-full px-12 py-6 flex justify-between items-center bg-neutral-950/90 backdrop-blur-xl no-border tonal-block-bg">
      <div className="text-4xl font-black tracking-tighter text-neutral-100 uppercase">Ramona</div>
      <div className="hidden md:flex items-center space-x-12">
        <a className="text-rose-200 font-semibold border-b-2 border-rose-200 pb-1 font-['Inter'] font-light tracking-tight" href="#">Recommended</a>
        <a className="text-neutral-400 font-medium hover:text-neutral-200 transition-colors font-['Inter'] font-light tracking-tight" href="#">Player</a>
        <a className="text-neutral-400 font-medium hover:text-neutral-200 transition-colors font-['Inter'] font-light tracking-tight" href="#">Library</a>
      </div>
      <div className="flex items-center space-x-6">
        <button className="hover:bg-neutral-800/50 rounded-lg transition-all p-2 scale-95 active:opacity-80 transition-transform">
          <span className="material-symbols-outlined text-rose-200">contrast</span>
        </button>
        <button className="hover:bg-neutral-800/50 rounded-lg transition-all p-2 scale-95 active:opacity-80 transition-transform">
          <span className="material-symbols-outlined text-rose-200">settings</span>
        </button>
      </div>
    </nav>
  );
}
