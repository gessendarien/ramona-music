import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

// The URL of the responsive web application.
// For Android emulator, use 10.0.2.2. For physical device, use your machine's LAN IP.
const WEB_APP_URL = 'http://192.168.100.20:3000';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0e0e0e" />
      <WebView 
        source={{ uri: WEB_APP_URL }} 
        style={styles.webview}
        bounces={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    // Ensures WebView doesn't overlap with Android status bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
});
