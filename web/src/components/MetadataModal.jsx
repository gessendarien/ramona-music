import React, { useState, useEffect, useRef } from 'react';
import { searchCover } from '../services/apiService';
import { useLanguage } from '../contexts/LanguageContext';

export default function MetadataModal({ isOpen, onClose, track, onSave }) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (track) {
      setTitle(track.title || '');
      setArtist(track.artist || '');
      setAlbum(track.album || '');
      setCoverUrl(track.thumbnail || '');
      setSearchResults([]);
    }
  }, [track]);

  const handleSearchCover = async () => {
    if (!artist && !title) return;
    setIsSearching(true);
    try {
      // Clean up the search terms for better iTunes API results
      let cleanArtist = artist.replace(/Unknown Artist/gi, '').trim();
      let cleanTitle = title.replace(/\[.*?\]|\(.*?\)/g, '').trim();
      let cleanAlbum = album.replace(/\[.*?\]|\(.*?\)/g, '').trim();
      
      // If title looks like "Artist - Title", split it
      if (!cleanArtist && cleanTitle.includes('-')) {
        const parts = cleanTitle.split('-');
        cleanArtist = parts[0].trim();
        cleanTitle = parts.slice(1).join('-').trim();
      }

      const query = `${cleanArtist} ${cleanTitle} ${cleanAlbum}`.replace(/\s+/g, ' ').trim();
      const response = await searchCover(query, cleanArtist);
      
      if (response && response.results) {
        const results = response.results.map(item => ({
          url: item.artworkUrl100.replace('100x100bb', '600x600bb'),
          album: item.collectionName,
          artist: item.artistName
        }));
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Failed to fetch covers', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        filePath: track.filePath,
        title,
        artist,
        album,
        coverUrl: coverUrl !== track.thumbnail ? coverUrl : undefined
      });
      onClose();
    } catch (error) {
      console.error('Save failed', error);
      alert('Failed to save metadata');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-surface-container-highest border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-surface-container flex justify-between items-center">
          <h2 className="text-xl font-bold text-on-surface">{t('metadata.title') || 'Edit Metadata'}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow flex flex-col md:flex-row gap-8">
          {/* Left Column: Image */}
          <div className="flex flex-col items-center w-full md:w-1/3 space-y-4">
            <div className="w-48 h-48 rounded-xl bg-surface-container overflow-hidden shadow-lg border border-white/5 flex items-center justify-center">
              {coverUrl ? (
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">album</span>
              )}
            </div>
            
            <button 
              onClick={handleSearchCover}
              disabled={isSearching}
              className="w-full py-2 bg-surface-container-low hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined mr-2 text-sm">image_search</span>
              {isSearching ? (t('metadata.searching') || 'Searching...') : (t('metadata.find_cover') || 'Find Cover')}
            </button>
            <div className="text-center w-full mt-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <span 
                onClick={() => fileInputRef.current?.click()} 
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {t('metadata.upload_cover') || 'Upload your own cover'}
              </span>
            </div>
          </div>

          {/* Right Column: Inputs */}
          <div className="flex-grow space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{t('metadata.track_title') || 'Title'}</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{t('metadata.track_artist') || 'Artist'}</label>
              <input 
                type="text" 
                value={artist} 
                onChange={e => setArtist(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">{t('metadata.track_album') || 'Album'}</label>
              <input 
                type="text" 
                value={album} 
                onChange={e => setAlbum(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="px-6 pb-6 pt-0">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-3">{t('metadata.select_cover') || 'Select a cover:'}</h3>
            <div className="flex space-x-4 overflow-x-auto pb-4 snap-x">
              {searchResults.map((res, i) => (
                <div 
                  key={i} 
                  onClick={() => setCoverUrl(res.url)}
                  className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer snap-start transition-all ${coverUrl === res.url ? 'ring-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                >
                  <img src={res.url} alt={res.album} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 border-t border-surface-container flex justify-center space-x-4 bg-surface-container-low/50">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {t('metadata.cancel') || 'Cancel'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 rounded-full font-bold bg-primary text-on-primary hover:brightness-110 transition-all active:scale-95 shadow-[0_0_15px_rgba(254,205,211,0.4)] flex items-center"
          >
            {isSaving ? (
              <span className="material-symbols-outlined animate-spin mr-2">sync</span>
            ) : (
              <span className="material-symbols-outlined mr-2">save</span>
            )}
            {t('metadata.save') || 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
