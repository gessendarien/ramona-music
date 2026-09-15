import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const INJECTED_JS = `
  (function() {
    var extracted = false;
    
    var checkAndSendUrl = function(url) {
      if (extracted) return;
      if (typeof url === 'string' && url.includes('videoplayback') && (url.includes('mime=audio') || url.includes('itag=140') || url.includes('itag=251'))) {
        extracted = true;
        window.ReactNativeWebView.postMessage(url);
      }
    };

    var originalFetch = window.fetch;
    window.fetch = async function() {
      var url = arguments[0];
      if (typeof url === 'string') checkAndSendUrl(url);
      if (url && url.url) checkAndSendUrl(url.url);
      return originalFetch.apply(this, arguments);
    };
    
    var originalXhrOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      if (typeof url === 'string') checkAndSendUrl(url);
      return originalXhrOpen.apply(this, arguments);
    };
    
    var interval = setInterval(function() {
      if (!extracted && window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.streamingData) {
         var formats = window.ytInitialPlayerResponse.streamingData.adaptiveFormats || [];
         var audio = formats.find(f => f.mimeType && f.mimeType.includes('audio'));
         if (audio && audio.url) {
           extracted = true;
           window.ReactNativeWebView.postMessage(audio.url);
         }
      }
      
      var video = document.querySelector('video');
      if (video) {
        video.muted = true;
        video.pause();
      }
    }, 200);
  })();
  true;
`;

const StreamExtractor = forwardRef((props, ref) => {
  const [currentUrl, setCurrentUrl] = useState('about:blank');
  const resolverRef = useRef(null);
  const rejecterRef = useRef(null);
  const webViewRef = useRef(null);
  const timeoutRef = useRef(null);

  useImperativeHandle(ref, () => ({
    extractUrl: (videoId) => {
      return new Promise((resolve, reject) => {
        // Cancel previous request if any
        if (rejecterRef.current) {
          rejecterRef.current(new Error('Cancelled by new extraction'));
          clearTimeout(timeoutRef.current);
        }
        
        resolverRef.current = resolve;
        rejecterRef.current = reject;
        
        // Timeout after 10 seconds
        timeoutRef.current = setTimeout(() => {
          if (rejecterRef.current) {
            rejecterRef.current(new Error('Timeout extracting stream'));
            resolverRef.current = null;
            rejecterRef.current = null;
          }
        }, 10000);

        setCurrentUrl(`https://music.youtube.com/watch?v=${videoId}`);
      });
    }
  }));

  const handleMessage = (event) => {
    const streamUrl = event.nativeEvent.data;
    if (streamUrl && resolverRef.current) {
      resolverRef.current(streamUrl);
      clearTimeout(timeoutRef.current);
      resolverRef.current = null;
      rejecterRef.current = null;
      // Reset WebView to stop loading/playing
      setCurrentUrl('about:blank');
    }
  };

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        injectedJavaScriptBeforeContentLoaded={`
          document.cookie = 'CONSENT=YES+cb.20210328-17-p0.en+FX+478; domain=.youtube.com; path=/';
        `}
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  hiddenContainer: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
    top: -1000,
    left: -1000,
  }
});

export default StreamExtractor;
