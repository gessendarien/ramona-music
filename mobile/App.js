import React, { useRef, useEffect, useState, useCallback } from 'react';
import { StatusBar, BackHandler, Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { WebView } from 'react-native-webview';
import TrackPlayer, { State, Capability } from 'react-native-track-player';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { searchTracks as nativeSearch, getRecommendations as nativeRecommendations } from './app/services/apiService';

// Native module for stream extraction and downloads (Kotlin)
const { RamonaDownloader } = NativeModules;
const downloaderEvents = new NativeEventEmitter(RamonaDownloader);

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const initPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
          ],
        });
      } catch (e) {
        console.log("Player ya inicializado");
      }
    };
    initPlayer();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [canGoBack]);

  const sendToWebView = useCallback((payload) => {
    if (webViewRef.current) {
      // encodeURIComponent doesn't escape single quotes, which we use as string delimiters in the injected JS
      const safePayload = encodeURIComponent(JSON.stringify(payload)).replace(/'/g, "%27");
      webViewRef.current.injectJavaScript(`
        try {
          const payloadObj = JSON.parse(decodeURIComponent('${safePayload}'));
          window.dispatchEvent(new CustomEvent('nativeMessage', { detail: payloadObj }));
        } catch(e) {
          console.error('WebView decode error', e);
        }
        true;
      `);
    }
  }, []);

  // Listen for native download events (progress, complete, error) from DownloadService
  useEffect(() => {
    const progressSub = downloaderEvents.addListener('DOWNLOAD_PROGRESS', (data) => {
      sendToWebView({
        type: 'DOWNLOAD_PROGRESS',
        trackId: data.trackId,
        progress: data.progress
      });
    });

    const completeSub = downloaderEvents.addListener('DOWNLOAD_COMPLETE', (data) => {
      sendToWebView({
        type: 'DOWNLOAD_COMPLETE',
        trackId: data.trackId,
        filename: data.filename
      });
    });

    const errorSub = downloaderEvents.addListener('DOWNLOAD_ERROR', (data) => {
      sendToWebView({
        type: 'DOWNLOAD_ERROR',
        trackId: data.trackId,
        error: data.error
      });
    });

    return () => {
      progressSub.remove();
      completeSub.remove();
      errorSub.remove();
    };
  }, [sendToWebView]);

  // Download a track using the native Kotlin module (NewPipeExtractor + Foreground Service)
  const downloadTrack = useCallback(async (track) => {
    try {
      sendToWebView({ type: 'DOWNLOAD_STARTED', trackId: track.id, title: track.title });
      await RamonaDownloader.startDownload(
        track.id,
        track.title || 'Unknown',
        track.artist || 'Unknown Artist'
      );
    } catch (e) {
      console.error('Failed to start download:', e);
      sendToWebView({ type: 'DOWNLOAD_ERROR', trackId: track.id, error: e.message });
    }
  }, [sendToWebView]);

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'PLAY_TRACK' && data.track) {
        await TrackPlayer.reset();
        
        let streamUrl = data.track.url || data.track.localUrl;
        if (!streamUrl) {
          // Use native module for stream extraction (replaces WebView-based StreamExtractor)
          try {
            streamUrl = await RamonaDownloader.extractStreamUrl(data.track.id);
          } catch (e) {
            console.error("No se pudo extraer el audio:", e);
            return;
          }
        }
        
        if (!streamUrl) return;

        await TrackPlayer.add({
          id: data.track.id,
          url: streamUrl,
          title: data.track.title,
          artist: data.track.artist,
          artwork: data.track.thumbnail,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
          }
        });
        await TrackPlayer.play();
      } else if (data.type === 'TOGGLE_PLAYBACK') {
        const state = await TrackPlayer.getState();
        if (state === State.Playing) {
          await TrackPlayer.pause();
        } else {
          await TrackPlayer.play();
        }
      } else if (data.type === 'SEEK' && data.position !== undefined) {
        const duration = await TrackPlayer.getDuration();
        if (duration > 0) {
          await TrackPlayer.seekTo(duration * data.position);
        }
      } else if (data.type === 'DOWNLOAD_TRACK' && data.track) {
        // Handle download request from WebView — delegates to native Kotlin module
        downloadTrack(data.track);
      } else if (data.type === 'GET_LIBRARY') {
        // Handle library scan request from WebView
        try {
          const result = await RamonaDownloader.getLibraryTracks();
          sendToWebView({
            type: 'LIBRARY_RESPONSE',
            queryId: data.queryId,
            tracks: result.tracks || []
          });
        } catch (e) {
          console.error('Library scan error:', e);
          sendToWebView({
            type: 'LIBRARY_RESPONSE',
            queryId: data.queryId,
            tracks: []
          });
        }
      } else if (data.type === 'SEARCH_TRACKS') {
        nativeSearch(data.query)
          .then(result => {
            sendToWebView({ type: 'SEARCH_RESPONSE', queryId: data.queryId, results: result.tracks || [] });
          })
          .catch(err => {
            console.error('Native search error:', err);
            sendToWebView({ type: 'SEARCH_RESPONSE', queryId: data.queryId, results: [] });
          });
      } else if (data.type === 'GET_RECOMMENDATIONS') {
        nativeRecommendations()
          .then(result => {
            sendToWebView({ type: 'RECOMMENDATIONS_RESPONSE', queryId: data.queryId, results: result.tracks || [] });
          })
          .catch(err => {
            console.error('Native recommendations error:', err);
            sendToWebView({ type: 'RECOMMENDATIONS_RESPONSE', queryId: data.queryId, results: [] });
          });
      }
    } catch (e) {
      console.error("Error procesando mensaje del WebView:", e);
    }
  };

  const INJECTED_JAVASCRIPT = `
    window.isMobileNative = true;
    true; // note: this is required, or you'll sometimes get silent failures
  `;

  // We load the bundled static files
  const sourceUrl = Platform.OS === 'android' 
    ? 'file:///android_asset/www/index.html'
    : './assets/www/index.html'; // Fallback

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0e0e0e' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0e0e0e" translucent={false} />
        <WebView
          ref={webViewRef}
          source={{ uri: sourceUrl }}
          injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT}
          onMessage={handleMessage}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          style={{ flex: 1, backgroundColor: '#0e0e0e' }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
