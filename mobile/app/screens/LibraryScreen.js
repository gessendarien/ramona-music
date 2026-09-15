import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLibraryTracks } from '../services/apiService';

export default function LibraryScreen() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const data = await getLibraryTracks();
      setTracks(data || []);
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.trackItem}>
      <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Cover' }} style={styles.thumbnail} />
      <View style={styles.trackInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity style={styles.playButton}>
        <Ionicons name="play" size={24} color="#ffb3ae" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>BIBLIOTECA</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffb3ae" />
        </View>
      ) : tracks.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={64} color="#a79b9a" />
          <Text style={styles.emptyText}>Tu biblioteca está vacía.</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    padding: 16,
  },
  headerTitle: {
    color: '#e7e5e4',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#a79b9a',
    fontSize: 16,
    marginTop: 16,
  },
  list: {
    paddingBottom: 100,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1f2020',
    padding: 10,
    borderRadius: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#e7e5e4',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    color: '#acabaa',
    fontSize: 14,
  },
  playButton: {
    padding: 10,
  }
});
