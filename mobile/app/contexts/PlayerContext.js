import React, { createContext, useContext, useState, useRef } from 'react';
import TrackPlayer from 'react-native-track-player';
import StreamExtractor from '../components/StreamExtractor';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const extractorRef = useRef(null);

  const playTrack = async (track) => {
    try {
      setCurrentTrack(track);
      await TrackPlayer.reset();
      
      let streamUrl = track.url || track.localUrl;
      
      if (!streamUrl) {
        if (extractorRef.current) {
          try {
            streamUrl = await extractorRef.current.extractUrl(track.id);
          } catch (e) {
            import('react-native').then(({ Alert }) => {
              Alert.alert(
                'Error de Extracción',
                'No se pudo extraer el audio de YouTube. ' + e.message
              );
            });
            return;
          }
        }
      }
      
      if (!streamUrl) return;

      await TrackPlayer.add({
        id: track.id,
        url: streamUrl,
        title: track.title,
        artist: track.artist,
        artwork: track.thumbnail,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
        }
      });
      
      await TrackPlayer.play();
    } catch (error) {
      console.error("Error al reproducir pista:", error);
    }
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, playTrack }}>
      {children}
      <StreamExtractor ref={extractorRef} />
    </PlayerContext.Provider>
  );
};
