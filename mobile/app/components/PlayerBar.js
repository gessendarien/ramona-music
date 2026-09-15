import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TrackPlayer, { State, usePlaybackState } from 'react-native-track-player';
import { usePlayer } from '../contexts/PlayerContext';

export default function PlayerBar() {
  const playbackState = usePlaybackState();
  const { currentTrack } = usePlayer();

  const togglePlayback = async () => {
    const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
    if (currentTrackIndex != null) {
      if (playbackState.state === State.Playing) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={{ uri: currentTrack?.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Cover' }} 
          style={styles.thumbnail} 
        />
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack?.title || 'No hay pista'}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack?.artist || 'Selecciona algo para escuchar'}</Text>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
          <Ionicons 
            name={playbackState.state === State.Playing ? "pause" : "play"} 
            size={28} 
            color="#0e0e0e" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Above bottom tabs
    left: 10,
    right: 10,
    backgroundColor: '#ffb3ae', // Using primary color
    borderRadius: 16,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#0e0e0e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  artist: {
    color: '#0e0e0e',
    fontSize: 12,
    opacity: 0.8,
  },
  playButton: {
    padding: 10,
  }
});
