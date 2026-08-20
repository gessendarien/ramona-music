import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import Mosaic from './components/Mosaic';
import TrackList from './components/TrackList';
import PlayerBar from './components/PlayerBar';
import ConfigPanel from './components/ConfigPanel';
import PlaylistPanel from './components/PlaylistPanel';
import MetadataModal from './components/MetadataModal';
import MobileHeader from './components/MobileHeader';
import MobileNav from './components/MobileNav';
import { getRecommendations, searchTracks, getLibraryTracks, getBackupStatus, updateMetadata, getConfig, saveConfig, API_URL } from './services/apiService';
import { useLanguage } from './contexts/LanguageContext';

function App() {
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' | 'player' | 'library'
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [appConfig, setAppConfig] = useState(null);
  
  const [playlist, setPlaylist] = useState([]);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [animations, setAnimations] = useState([]);
  const [activeDownloads, setActiveDownloads] = useState([]);
  const activeSearchSourceRef = useRef(null);
  const [librarySortMode, setLibrarySortMode] = useState('recent'); // 'recent' | 'az' | 'artist'
  const [editingTrack, setEditingTrack] = useState(null);

  const [playerSearch, setPlayerSearch] = useState({ query: '', results: [], isSearching: false, error: '' });
  const [librarySearch, setLibrarySearch] = useState({ query: '', results: [], isSearching: false, error: '' });

  useEffect(() => {
    // Load recommendations on mount (HMR trigger)
    getRecommendations()
      .then(data => setRecommendations(data))
      .catch(err => console.error("Failed to load recommendations", err));
      
    // Load config on mount
    getConfig()
      .then(data => setAppConfig(data))
      .catch(err => console.error("Failed to load config", err));
  }, []);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchLibrary();
    }
  }, [activeTab]);

  const fetchLibrary = () => {
    getLibraryTracks()
      .then(data => {
        if (data && data.tracks) setLibraryTracks(data.tracks);
      })
      .catch(err => console.error("Failed to load library", err));
  };

  useEffect(() => {
    // Poll for active downloads
    const checkStatus = async () => {
      try {
        const data = await getBackupStatus();
        if (data && data.activeDownloads) {
          setActiveDownloads(data.activeDownloads);
          // If a download just finished and we are in library, refresh library
          if (activeDownloads.length > 0 && data.activeDownloads.length < activeDownloads.length) {
            if (activeTab === 'library') fetchLibrary();
          }
        }
      } catch (e) {
        console.error("Failed to check backup status", e);
      }
    };
    
    // Poll less frequently to avoid rate limiting
    const interval = setInterval(checkStatus, activeDownloads.length > 0 ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [activeDownloads.length, activeTab]);

  const handleSearch = (query, source = 'youtube') => {
    if (!query) return;
    const isPlayer = activeTab === 'player';
    const setSectionSearch = isPlayer ? setPlayerSearch : setLibrarySearch;
    
    setSectionSearch(prev => ({ ...prev, isSearching: true, query, error: '', results: [] }));
    
    if (activeSearchSourceRef.current) {
      activeSearchSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_URL}/search/stream?q=${encodeURIComponent(query)}`);
    activeSearchSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data) {
        try {
          const track = JSON.parse(event.data);
          setSectionSearch(prev => {
            if (prev.results.find(t => t.id === track.id)) return prev;
            return { ...prev, results: [...prev.results, track] };
          });
        } catch (e) {
          console.error("Failed to parse SSE data", e);
        }
      }
    };

    eventSource.addEventListener('end', () => {
      eventSource.close();
      setSectionSearch(prev => {

        if (prev.results.length === 0) {
          return { ...prev, isSearching: false, error: t('search.no_results') };
        }
        return { ...prev, isSearching: false };
      });
      activeSearchSourceRef.current = null;
    });

    eventSource.onerror = (error) => {
      eventSource.close();
      setSectionSearch(prev => {
        if (prev.results.length === 0) {
          return { ...prev, isSearching: false, error: t('search.error') };
        }
        return { ...prev, isSearching: false };
      });
      activeSearchSourceRef.current = null;
    };
  };

  const handleQueryChange = (newQuery) => {
    const isPlayer = activeTab === 'player';
    const setSectionSearch = isPlayer ? setPlayerSearch : setLibrarySearch;
    setSectionSearch(prev => ({ ...prev, query: newQuery }));
  };

  const handlePlay = (track) => {
    if (currentTrack && track.id === currentTrack.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
      setIsPlaying(true);
    } else if (playlist.length > 0) {
      setCurrentTrack(playlist[0]);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1]);
      setIsPlaying(true);
    } else if (playlist.length > 0) {
      setCurrentTrack(playlist[playlist.length - 1]);
      setIsPlaying(true);
    }
  };

  const goHome = () => {
    setActiveTab('recommended');
  };

  const goPlayer = () => {
    setActiveTab('player');
  };

  const goLibrary = () => {
    setActiveTab('library');
  };

  const alertNotImplemented = (feature) => {
    alert(t('player.not_implemented', { feature }));
  };

  const handleSaveConfig = async (newConfig) => {
    try {
      const result = await saveConfig(newConfig);
      if (result.config) setAppConfig(result.config);
      setIsConfigOpen(false);
    } catch (err) {
      console.error("Failed to save config", err);
      alert("Failed to save configuration");
    }
  };

  const handleAddToPlaylist = (track, e) => {
    if (!playlist.find(t => t.id === track.id)) {
      setPlaylist(prev => [...prev, track]);
    }
    
    // Trigger animation if event is provided
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const desktopBtn = document.getElementById('btn-queue-music-desktop');
      const mobileBtn = document.getElementById('btn-queue-music-mobile');
      const targetEl = (mobileBtn && window.innerWidth < 768) ? mobileBtn : desktopBtn;
      const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight };
      
      const animId = Date.now();
      setAnimations(prev => [...prev, {
        id: animId,
        startX: rect.left,
        startY: rect.top,
        endX: targetRect.left,
        endY: targetRect.top
      }]);
      
      setTimeout(() => {
        setAnimations(prev => prev.filter(a => a.id !== animId));
      }, 600);
    }
  };

  const handleAddAllToPlaylist = (tracks, e) => {
    let addedCount = 0;
    setPlaylist(prev => {
      const newPlaylist = [...prev];
      tracks.forEach(track => {
        if (!newPlaylist.find(t => t.id === track.id)) {
          newPlaylist.push(track);
          addedCount++;
        }
      });
      return newPlaylist;
    });

    // Trigger animation if items were added
    if (e && addedCount > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const desktopBtn = document.getElementById('btn-queue-music-desktop');
      const mobileBtn = document.getElementById('btn-queue-music-mobile');
      const targetEl = (mobileBtn && window.innerWidth < 768) ? mobileBtn : desktopBtn;
      const targetRect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight };
      
      const animId = Date.now();
      setAnimations(prev => [...prev, {
        id: animId,
        startX: rect.left,
        startY: rect.top,
        endX: targetRect.left,
        endY: targetRect.top
      }]);
      
      setTimeout(() => {
        setAnimations(prev => prev.filter(a => a.id !== animId));
      }, 600);
    }
  };

  const handleRemoveFromPlaylist = (trackId) => {
    setPlaylist(prev => prev.filter(t => t.id !== trackId));
  };

  const handleSaveMetadata = async (metadata) => {
    try {
      await updateMetadata(metadata);
      fetchLibrary(); // Refresh library after save
    } catch (e) {
      throw e;
    }
  };

  const currentSearchState = activeTab === 'player' ? playerSearch : librarySearch;

  return (
    <>
      {animations.map(anim => (
        <div key={anim.id} className="flying-dot-y" style={{
          '--start-y': `${anim.startY}px`,
          '--end-y': `${anim.endY}px`,
        }}>
          <div className="flying-dot-x" style={{
            '--start-x': `${anim.startX}px`,
            '--end-x': `${anim.endX}px`,
          }}></div>
        </div>
      ))}
      <MobileHeader onSettingsClick={() => setIsConfigOpen(true)} />
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} activeDownloads={activeDownloads} />
      <nav className="hidden md:flex fixed top-0 z-[60] w-full px-12 py-6 justify-between items-center bg-neutral-950/90 backdrop-blur-xl no-border tonal-block-bg">
        <div className="text-4xl font-black tracking-tighter text-neutral-100 uppercase cursor-pointer" onClick={goHome}>Ramona</div>
        <div className="hidden md:flex items-center space-x-12">
          <a className={`flex flex-col items-center gap-1 font-semibold font-['Inter'] font-light tracking-tight cursor-pointer transition-colors ${activeTab === 'recommended' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-200'}`} onClick={goHome}>
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            <span className="font-label-caps text-[12px] uppercase">{t('nav.recommended')}</span>
          </a>
          <a className={`flex flex-col items-center gap-1 font-semibold font-['Inter'] font-light tracking-tight cursor-pointer transition-colors ${activeTab === 'player' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-200'}`} onClick={goPlayer}>
            <span className="material-symbols-outlined text-[24px]">search</span>
            <span className="font-label-caps text-[12px] uppercase">{t('nav.player')}</span>
          </a>
          <a className={`relative flex flex-col items-center gap-1 font-semibold font-['Inter'] font-light tracking-tight cursor-pointer transition-colors ${activeTab === 'library' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-200'}`} onClick={goLibrary}>
            <span className="material-symbols-outlined text-[24px]">library_music</span>
            <span className="font-label-caps text-[12px] uppercase">{t('nav.library')}</span>
            {activeDownloads.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                {activeDownloads.length}
              </span>
            )}
          </a>
        </div>
        <div className="flex items-center space-x-6">
          <button className="hover:bg-neutral-800/50 rounded-lg transition-all p-2 scale-95 active:opacity-80 transition-transform" onClick={() => setIsConfigOpen(true)}>
            <span className="material-symbols-outlined text-rose-200">settings</span>
          </button>
        </div>
      </nav>

      <main className="pt-6 md:pt-40 pb-28 md:pb-48 px-4 md:px-12 max-w-[1600px] mx-auto min-h-screen">
        {(activeTab === 'player' || activeTab === 'library') && (
          <SearchBar 
            searchId="global"
            onSearch={handleSearch} 
            hideIcons={activeTab === 'library'} 
            query={currentSearchState.query}
            onQueryChange={handleQueryChange}
          />
        )}
        
        {activeTab === 'recommended' && (
          <>
            <Mosaic tracks={recommendations} onPlay={handlePlay} currentTrack={currentTrack} isPlaying={isPlaying} />
            <TrackList 
              title={t('home.featured') || 'Recommended'} 
              tracks={recommendations} 
              onPlay={handlePlay} 
              onAdd={handleAddToPlaylist} 
              playlist={playlist} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
            />
          </>
        )}

        {activeTab === 'library' && activeDownloads.length > 0 && !librarySearch.isSearching && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">Downloading...</h2>
            <div className="space-y-4">
              {activeDownloads.map(dl => (
                <div key={dl.id} className="flex items-center p-4 bg-surface-container-low rounded-xl">
                  <div className="w-16 h-16 mr-4 flex-shrink-0 bg-surface-container-high rounded-lg overflow-hidden">
                    <img src={dl.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Cover'} alt={dl.title} className="w-full h-full object-cover opacity-70" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-lg font-semibold text-on-surface leading-tight truncate">{dl.title}</h4>
                    <p className="text-on-surface-variant text-sm font-light">{dl.artist}</p>
                    <div className="w-full bg-surface-container mt-2 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${dl.progress}%` }}></div>
                    </div>
                  </div>
                  <div className="ml-4 text-sm font-bold text-primary">{dl.progress}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'library' && !librarySearch.isSearching && (
          <div className="mb-4 flex justify-end">
            <select 
              className="bg-surface-container-high text-on-surface-variant text-sm px-4 py-2 rounded-lg outline-none cursor-pointer hover:bg-surface-container-highest transition-colors"
              value={librarySortMode}
              onChange={(e) => setLibrarySortMode(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="az">A-Z</option>
              <option value="artist">Artist</option>
            </select>
          </div>
        )}

        {activeTab === 'library' && !librarySearch.isSearching && (
          <>
            <TrackList 
              tracks={[...libraryTracks].sort((a, b) => {
              if (librarySortMode === 'az') return a.title.localeCompare(b.title);
              if (librarySortMode === 'artist') return a.artist.localeCompare(b.artist);
              return 0; // Default to natural file order (which usually is somewhat recent depending on fs, or we can add a date field)
            })} 
            onPlay={handlePlay} 
            onAdd={handleAddToPlaylist} 
            onEdit={setEditingTrack}
            playlist={playlist} 
            currentTrack={currentTrack}
            isPlaying={isPlaying}
          />
          </>
        )}



        {(activeTab === 'player' || activeTab === 'library') && (
          <>
            {currentSearchState.isSearching && (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="material-symbols-outlined animate-pulse text-5xl text-primary mb-4">graphic_eq</span>
                <p className="text-on-surface-variant font-light animate-pulse">{t('common.loading')}</p>
              </div>
            )}
            {!currentSearchState.isSearching && currentSearchState.error && <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 text-center">{currentSearchState.error}</div>}
            {!currentSearchState.isSearching && currentSearchState.results.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-end mb-2">
                  <button 
                    onClick={(e) => handleAddAllToPlaylist(currentSearchState.results, e)}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-high hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-colors shadow-sm"
                    title="Añadir todas"
                  >
                    <span className="material-symbols-outlined">playlist_add</span>
                  </button>
                </div>
                <TrackList tracks={currentSearchState.results} onPlay={handlePlay} onAdd={handleAddToPlaylist} playlist={playlist} currentTrack={currentTrack} isPlaying={isPlaying} />
              </div>
            )}
          </>
        )}
      </main>
      <PlayerBar 
        currentTrack={currentTrack} 
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onMockAction={alertNotImplemented} 
        onAddToPlaylist={handleAddToPlaylist}
        onOpenPlaylist={() => setIsPlaylistOpen(true)}
        playlist={playlist}
        libraryTracks={libraryTracks}
        onBackupSuccess={() => {
          getBackupStatus().then(data => data && setActiveDownloads(data.activeDownloads));
          getLibraryTracks().then(data => {
            if (data && data.tracks) setLibraryTracks(data.tracks);
          });
        }}
      />

      <ConfigPanel 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        initialConfig={appConfig}
        onSaveConfig={handleSaveConfig}
      />

      <PlaylistPanel 
        isOpen={isPlaylistOpen} 
        onClose={() => setIsPlaylistOpen(false)} 
        playlist={playlist}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        libraryTracks={libraryTracks}
        onBackupSuccess={() => {
          // Eagerly update active downloads logic if needed
          getBackupStatus().then(data => data && setActiveDownloads(data.activeDownloads));
          getLibraryTracks().then(data => {
            if (data && data.tracks) setLibraryTracks(data.tracks);
          });
        }}
        onRemove={handleRemoveFromPlaylist}
        onClearPlaylist={() => setPlaylist([])}
      />

      <MetadataModal 
        isOpen={!!editingTrack}
        track={editingTrack}
        onClose={() => setEditingTrack(null)}
        onSave={handleSaveMetadata}
      />
    </>
  );
}

export default App;
