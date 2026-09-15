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
import { getRecommendations, searchTracks, getLibraryTracks, getBackupStatus, updateMetadata, getConfig, saveConfig, API_URL, deleteTracks } from './services/apiService';
import { useLanguage } from './contexts/LanguageContext';

function App() {
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('recommended'); // 'recommended' | 'player' | 'library'
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [appConfig, setAppConfig] = useState(null);
  
  const [playlist, setPlaylist] = useState([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'all', 'one'
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [animations, setAnimations] = useState([]);
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [animatingDownloads, setAnimatingDownloads] = useState([]);
  const activeSearchSourceRef = useRef(null);
  const [librarySortMode, setLibrarySortMode] = useState('recent'); // 'recent' | 'az' | 'artist'
  const [editingTrack, setEditingTrack] = useState(null);
  const [isLibrarySelectMode, setIsLibrarySelectMode] = useState(false);
  const [librarySelectedTracks, setLibrarySelectedTracks] = useState(new Set());
  const [isDeletingLibrary, setIsDeletingLibrary] = useState(false);
  const [showLibraryDeleteConfirm, setShowLibraryDeleteConfirm] = useState(false);

  const [playerSearch, setPlayerSearch] = useState({ query: '', results: [], isSearching: false, error: '' });
  const [librarySearch, setLibrarySearch] = useState({ query: '', results: [], isSearching: false, error: '' });

  useEffect(() => {
    // Load recommendations on mount (HMR trigger)
    setIsRecommendationsLoading(true);
    getRecommendations()
      .then(data => setRecommendations(Array.isArray(data) ? data : (data.tracks || data || [])))
      .catch(err => {
        console.error("Failed to load recommendations", err);
        setRecommendations([]);
      })
      .finally(() => {
        setIsRecommendationsLoading(false);
      });
      
    // Load config on mount (returns {} on mobile native - no backend)
    getConfig()
      .then(data => setAppConfig(data))
      .catch(err => console.error("Failed to load config", err));
  }, []);

  useEffect(() => {
    if (window.isMobileNative && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GET_LIBRARY' }));
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchLibrary();
    }
  }, [activeTab]);

  const fetchLibrary = () => {
    setIsLibraryLoading(true);
    getLibraryTracks()
      .then(data => {
        if (data && data.tracks) setLibraryTracks(data.tracks);
        else setLibraryTracks([]);
      })
      .catch(err => {
        console.error("Failed to load library", err);
        setLibraryTracks([]);
      })
      .finally(() => {
        setIsLibraryLoading(false);
      });
  };

  // Handle Native Messages (for standalone mobile downloads)
  useEffect(() => {
    if (!window.isMobileNative) return;
    
    const handleNativeMessage = (e) => {
      const data = e.detail;
      if (!data) return;
      
      if (data.type === 'DOWNLOAD_STARTED') {
        setActiveDownloads(prev => [...prev.filter(d => d.trackId !== data.trackId), {
          trackId: data.trackId,
          title: data.title,
          progress: 0,
          status: 'downloading'
        }]);
      } else if (data.type === 'DOWNLOAD_PROGRESS') {
        setActiveDownloads(prev => prev.map(d =>
          d.trackId === data.trackId ? { ...d, progress: data.progress } : d
        ));
      } else if (data.type === 'DOWNLOAD_COMPLETE') {
        const finishedDl = { trackId: data.trackId, title: data.filename };
        setActiveDownloads(prev => prev.filter(d => d.trackId !== data.trackId));
        
        // Anim and library update
        setAnimatingDownloads(prevAnim => [...prevAnim, { ...finishedDl, progress: 100 }]);
        setTimeout(() => {
          setAnimatingDownloads(prevAnim => prevAnim.filter(a => a.trackId !== data.trackId));
        }, 500);

        setLibraryTracks(libPrev => {
          const parts = data.filename.replace('.mp3', '').split(' - ');
          const artist = parts[0] || 'Unknown';
          const title = parts.slice(1).join(' - ') || 'Unknown';
          const newTrack = {
            id: data.trackId,
            originalId: data.trackId,
            title: title,
            artist: artist,
            isLocal: true,
            // TrackPlayer will play localUrl directly
            localUrl: 'file:///data/user/0/com.ramonamusic.app/files/ramona/backups/' + data.filename
          };
          return [newTrack, ...libPrev.filter(l => l.originalId !== data.trackId)];
        });
      } else if (data.type === 'DOWNLOAD_ERROR') {
        setActiveDownloads(prev => prev.filter(d => d.trackId !== data.trackId));
        console.error('Download error from native:', data.error);
      } else if (data.type === 'LIBRARY_RESPONSE') {
        if (data.tracks && Array.isArray(data.tracks)) {
          setLibraryTracks(data.tracks);
          setIsLibraryLoading(false);
        }
      }
    };
    
    window.addEventListener('nativeMessage', handleNativeMessage);
    return () => window.removeEventListener('nativeMessage', handleNativeMessage);
  }, []);

  useEffect(() => {
    // Poll for active downloads
    const checkStatus = async () => {
      try {
        const data = await getBackupStatus();
        if (data && data.activeDownloads) {
          setActiveDownloads(prev => {
            const finished = prev.filter(oldDl => !data.activeDownloads.some(newDl => newDl.trackId === oldDl.trackId));
            if (finished.length > 0) {
              const anims = finished.map(f => ({ ...f, progress: 100 }));
              setAnimatingDownloads(prevAnim => [...prevAnim, ...anims]);
              setTimeout(() => {
                setAnimatingDownloads(prevAnim => prevAnim.filter(a => !anims.some(newA => newA.trackId === a.trackId)));
              }, 500);

              setLibraryTracks(libPrev => {
                const newTracks = finished.map(f => ({
                  id: f.trackId,
                  originalId: f.trackId,
                  title: f.title,
                  artist: f.artist,
                  isLocal: true
                }));
                const filteredLib = libPrev.filter(l => !finished.some(f => f.trackId === l.originalId));
                return [...newTracks, ...filteredLib];
              });
              setTimeout(() => fetchLibrary(), 2000);
            }
            return data.activeDownloads;
          });
        }
      } catch (e) {
        console.error("Failed to check backup status", e);
      }
    };
    
    // Poll less frequently to avoid rate limiting
    const interval = setInterval(checkStatus, activeDownloads.length > 0 ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [activeDownloads.length, activeTab]);

  const handleSearch = (query, source = 'youtube', displayQuery = query) => {
    if (!query) return;
    const isPlayer = activeTab === 'player';
    const setSectionSearch = isPlayer ? setPlayerSearch : setLibrarySearch;
    
    // On mobile native, use direct API call via Invidious instead of SSE
    if (window.isMobileNative) {
      setSectionSearch(prev => ({ ...prev, isSearching: true, query: displayQuery, error: '', results: [] }));
      searchTracks(query)
        .then(data => {
          const tracks = Array.isArray(data) ? data : (data.tracks || []);
          setSectionSearch(prev => ({
            ...prev,
            isSearching: false,
            results: tracks,
            error: tracks.length === 0 ? t('search.no_results') : ''
          }));
        })
        .catch(err => {
          console.error('Mobile search failed:', err);
          setSectionSearch(prev => ({ ...prev, isSearching: false, error: t('search.error') }));
        });
      return;
    }

    const isUrl = /^https?:\/\/(www\.youtube\.com|youtu\.be)\//.test(query);
    const initialStartIndex = 1;
    const initialLimit = 10;
    
    setSectionSearch(prev => ({ 
      ...prev, 
      isSearching: true, 
      query: displayQuery, 
      error: '', 
      results: [],
      isPlaylist: isUrl,
      playlistUrl: isUrl ? query : null,
      nextStartIndex: isUrl ? initialStartIndex + initialLimit : null,
      hasMore: isUrl // Assume it has more initially, we'll verify when it ends
    }));
    
    if (activeSearchSourceRef.current) {
      activeSearchSourceRef.current.close();
    }

    let streamUrl = `${API_URL}/search/stream?q=${encodeURIComponent(query)}`;
    if (isUrl) streamUrl += `&startIndex=${initialStartIndex}&limit=${initialLimit}`;
    const eventSource = new EventSource(streamUrl);
    activeSearchSourceRef.current = eventSource;
    let batchItemCount = 0;

    eventSource.onmessage = (event) => {
      if (event.data) {
        try {
          const track = JSON.parse(event.data);
          batchItemCount++;
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
      const updatedHasMore = isUrl ? batchItemCount >= initialLimit : false;
      setSectionSearch(prev => {
        if (prev.results.length === 0) {
          return { ...prev, isSearching: false, hasMore: updatedHasMore, error: t('search.no_results') };
        }
        return { ...prev, isSearching: false, hasMore: updatedHasMore };
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
      if (window.isMobileNative && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_PLAYBACK' }));
      }
      setIsPlaying(!isPlaying);
    } else {
      if (window.isMobileNative && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PLAY_TRACK', track }));
      }
      setCurrentTrack(track);
      setIsPlaying(true);
      
      // Añadir a la lista de reproducción solo si no está ya
      setPlaylist(prev => {
        if (!prev.find(t => t.id === track.id)) {
          return [...prev, track];
        }
        return prev;
      });
    }
  };

  const handleNext = () => {
    if (!currentTrack || playlist.length === 0) return;
    
    if (isShuffle && playlist.length > 1) {
      const available = playlist.filter(t => t.id !== currentTrack.id);
      const randomTrack = available[Math.floor(Math.random() * available.length)];
      setCurrentTrack(randomTrack);
      setIsPlaying(true);
      return;
    }

    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
      setIsPlaying(true);
    } else if (playlist.length > 0) {
      if (repeatMode === 'all' || isShuffle) {
        setCurrentTrack(playlist[0]);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        setCurrentTrack(playlist[0]);
      }
    }
  };

  const handlePrevious = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1]);
      setIsPlaying(true);
    } else if (playlist.length > 0) {
      if (repeatMode === 'all') {
        setCurrentTrack(playlist[playlist.length - 1]);
        setIsPlaying(true);
      }
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
    if (Array.isArray(trackId)) {
      setPlaylist(prev => prev.filter(t => !trackId.includes(t.id)));
    } else {
      setPlaylist(prev => prev.filter(t => t.id !== trackId));
    }
  };

  const handleSaveMetadata = async (metadata) => {
    try {
      await updateMetadata(metadata);
      fetchLibrary(); // Refresh library after save
    } catch (e) {
      throw e;
    }
  };

  const handleDeleteLibraryTracks = async () => {
    if (librarySelectedTracks.size === 0) return;
    
    setIsDeletingLibrary(true);
    try {
      const tracksToDelete = libraryTracks.filter(t => librarySelectedTracks.has(t.id));
      const filePaths = tracksToDelete.map(t => t.filePath).filter(Boolean);
      
      if (filePaths.length > 0) {
        await deleteTracks(filePaths);
      }
      
      setLibraryTracks(prev => prev.filter(t => !librarySelectedTracks.has(t.id)));
      
      // If any of the deleted tracks are in the current playlist, remove them
      setPlaylist(prev => prev.filter(t => !librarySelectedTracks.has(t.id)));
      
      setLibrarySelectedTracks(new Set());
      setIsLibrarySelectMode(false);
      addNotification(t('library.deleted_success') || 'Tracks deleted successfully', 'success');
    } catch (e) {
      console.error(e);
      addNotification(t('library.deleted_error') || 'Failed to delete tracks', 'error');
    } finally {
      setIsDeletingLibrary(false);
    }
  };

  const handleLoadMore = () => {
    const isPlayer = activeTab === 'player';
    const setSectionSearch = isPlayer ? setPlayerSearch : setLibrarySearch;
    const currentSearch = isPlayer ? playerSearch : librarySearch;

    if (!currentSearch.isPlaylist || !currentSearch.playlistUrl || currentSearch.isLoadingMore) return;

    setSectionSearch(prev => ({ ...prev, isLoadingMore: true }));

    const limit = 10;
    const startIndex = currentSearch.nextStartIndex;
    let batchItemCount = 0;
    
    const eventSource = new EventSource(`${API_URL}/search/stream?q=${encodeURIComponent(currentSearch.playlistUrl)}&startIndex=${startIndex}&limit=${limit}`);
    
    eventSource.onmessage = (event) => {
      if (event.data) {
        try {
          const track = JSON.parse(event.data);
          batchItemCount++;
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
      const hasMore = batchItemCount >= limit;
      setSectionSearch(prev => ({ 
        ...prev, 
        isLoadingMore: false, 
        hasMore,
        nextStartIndex: hasMore ? startIndex + limit : prev.nextStartIndex
      }));
    });

    eventSource.addEventListener('error', () => {
      eventSource.close();
      setSectionSearch(prev => ({ ...prev, isLoadingMore: false, hasMore: false }));
    });
  };

  const currentSearchState = activeTab === 'player' ? playerSearch : librarySearch;
  const currentResults = currentSearchState.results;

  // Auto-load more if it's a playlist and there are more items to load
  useEffect(() => {
    if (currentSearchState.isPlaylist && currentSearchState.hasMore && !currentSearchState.isSearching && !currentSearchState.isLoadingMore) {
      handleLoadMore();
    }
  }, [currentSearchState.isPlaylist, currentSearchState.hasMore, currentSearchState.isSearching, currentSearchState.isLoadingMore]);

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
      <MobileHeader onSettingsClick={window.isMobileNative ? undefined : () => setIsConfigOpen(true)} />
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
          {!window.isMobileNative && (
          <button className="hover:bg-neutral-800/50 rounded-lg transition-all p-2 scale-95 active:opacity-80 transition-transform" onClick={() => setIsConfigOpen(true)}>
            <span className="material-symbols-outlined text-rose-200">settings</span>
          </button>
          )}
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
            <Mosaic 
              tracks={recommendations} 
              onPlay={handlePlay} 
              currentTrack={currentTrack} 
              isPlaying={isPlaying} 
              isLoading={isRecommendationsLoading}
            />
            {recommendations && recommendations.length > 0 && (
              <TrackList 
                title={t('home.featured') || 'Recommended'} 
                tracks={recommendations} 
                onPlay={handlePlay} 
                onAdd={handleAddToPlaylist} 
                playlist={playlist} 
                currentTrack={currentTrack} 
                isPlaying={isPlaying} 
              />
            )}
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
          <div className="mb-3 mt-[-4px] flex justify-start items-center gap-2 flex-wrap">
            {isLibrarySelectMode && (
              <div className="flex items-center w-full mb-2">
                <span className="text-sm text-on-surface-variant font-bold mr-auto">{librarySelectedTracks.size} selected</span>
                <button 
                  onClick={() => setShowLibraryDeleteConfirm(true)}
                  disabled={librarySelectedTracks.size === 0 || isDeletingLibrary}
                  className="bg-error/10 hover:bg-error/20 text-error text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center disabled:opacity-50 mr-2"
                  title="Delete Selected"
                >
                  <span className="material-symbols-outlined text-sm mr-1">delete</span>
                  {isDeletingLibrary ? 'Deleting...' : 'Delete'}
                </button>
                <button 
                  onClick={() => {
                    setIsLibrarySelectMode(false);
                    setLibrarySelectedTracks(new Set());
                  }}
                  className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button 
                onClick={() => setLibrarySortMode('recent')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${librarySortMode === 'recent' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-transparent text-on-surface-variant border-surface-container hover:bg-surface-container'}`}
              >
                {t('library.sort_recent') || 'Most Recent'}
              </button>
              <button 
                onClick={() => setLibrarySortMode('az')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${librarySortMode === 'az' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-transparent text-on-surface-variant border-surface-container hover:bg-surface-container'}`}
              >
                {t('library.sort_az') || 'A-Z'}
              </button>
              <button 
                onClick={() => setLibrarySortMode('artist')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${librarySortMode === 'artist' ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-transparent text-on-surface-variant border-surface-container hover:bg-surface-container'}`}
              >
                {t('library.sort_artist') || 'Artist'}
              </button>
            </div>
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
            isLoading={isLibraryLoading}
            onPlay={handlePlay} 
            onAdd={handleAddToPlaylist} 
            onEdit={setEditingTrack}
            playlist={playlist} 
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isSelectMode={isLibrarySelectMode}
            selectedTracks={librarySelectedTracks}
            onToggleSelect={(trackId) => {
              setLibrarySelectedTracks(prev => {
                const newSet = new Set(prev);
                if (newSet.has(trackId)) {
                  newSet.delete(trackId);
                  if (newSet.size === 0) setIsLibrarySelectMode(false);
                } else {
                  newSet.add(trackId);
                }
                return newSet;
              });
            }}
            onLongPress={(trackId) => {
              setIsLibrarySelectMode(true);
              setLibrarySelectedTracks(new Set([trackId]));
            }}
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
                  {(() => {
                    const allAdded = currentSearchState.results.length > 0 && currentSearchState.results.every(track => playlist.some(t => t.id === track.id));
                    return (
                      <button 
                        onClick={(e) => !allAdded && handleAddAllToPlaylist(currentSearchState.results, e)}
                        className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors shadow-sm ${allAdded ? 'bg-primary/20 text-primary cursor-default' : 'bg-surface-container-high hover:bg-primary/20 text-on-surface-variant hover:text-primary'}`}
                        title={allAdded ? "Todas añadidas" : "Añadir todas"}
                      >
                        <span className="material-symbols-outlined">{allAdded ? 'playlist_add_check' : 'playlist_add'}</span>
                      </button>
                    );
                  })()}
                </div>
                <TrackList 
                  tracks={currentSearchState.results} 
                  onPlay={handlePlay} 
                  onAdd={handleAddToPlaylist} 
                  playlist={playlist} 
                  currentTrack={currentTrack} 
                  isPlaying={isPlaying} 
                  hasMoreFromServer={currentSearchState.hasMore}
                  onLoadMore={handleLoadMore}
                  isLoadingMore={currentSearchState.isLoadingMore}
                />
              </div>
            )}
          </>
        )}

        {/* Library Delete Confirmation Modal Overlay */}
        {showLibraryDeleteConfirm && (
          <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-6 z-[60]">
            <div className="bg-surface-container-highest border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-on-surface mb-2">{t('library.remove_selected_title') || 'Remove Tracks'}</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                {(t('library.remove_selected_confirm') || `Are you sure you want to delete {count} selected track(s) from the library?`).replace('{count}', librarySelectedTracks.size)}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowLibraryDeleteConfirm(false)}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  {t('playlist.cancel')}
                </button>
                <button 
                  onClick={() => {
                    setShowLibraryDeleteConfirm(false);
                    handleDeleteLibraryTracks();
                  }}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-error text-on-error hover:bg-error/90 transition-colors"
                >
                  {t('playlist.remove')}
                </button>
              </div>
            </div>
          </div>
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
        activeDownloads={[...activeDownloads, ...animatingDownloads]}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        repeatMode={repeatMode}
        onToggleRepeat={() => {
          setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
        }}
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
        activeDownloads={activeDownloads}
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
