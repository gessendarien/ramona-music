import React from 'react';

export default function VinylIcon({ thumbnail, isPlaying, isBuffering, className = '', hideCenterHole = false }) {
  const shouldSpin = isPlaying && !isBuffering;
  
  return (
    <div 
      className={`relative flex items-center justify-center animate-[spin_2s_linear_infinite] ${className}`}
      style={{ animationPlayState: shouldSpin ? 'running' : 'paused' }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none z-10 drop-shadow-md">
        {/* Base dark grey disk */}
        <circle cx="50" cy="50" r="48" fill="#2d2d2d" stroke="#1f1f1f" strokeWidth="1" />
        
        {/* Lighter wedges for geometric reflection */}
        <g fill="#383838" transform="rotate(20 50 50)">
          <path d="M 50 50 L 50 2 A 48 48 0 0 1 98 50 Z" />
          <path d="M 50 50 L 50 98 A 48 48 0 0 1 2 50 Z" />
        </g>

        {/* Concentric groove lines */}
        <g fill="none" stroke="#1f1f1f" strokeWidth="0.8" opacity="0.8">
          <circle cx="50" cy="50" r="43" />
          <circle cx="50" cy="50" r="38" />
          <circle cx="50" cy="50" r="33" />
          <circle cx="50" cy="50" r="28" />
          <circle cx="50" cy="50" r="23" />
        </g>
        
        {/* Center label (App pink color) */}
        <circle cx="50" cy="50" r="23" className="fill-rose-400" stroke="#1f1f1f" strokeWidth="0.5" />
        
        {/* Center hole */}
        {!hideCenterHole && <circle cx="50" cy="50" r="3" fill="#1a1a1a" />}
      </svg>

      {/* Loading Spinner overlay */}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 rounded-full">
          <span className="material-symbols-outlined text-white animate-spin text-xl drop-shadow-md">sync</span>
        </div>
      )}
    </div>
  );
}
