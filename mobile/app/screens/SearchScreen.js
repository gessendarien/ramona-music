import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchTracks } from '../services/apiService';
import { usePlayer } from '../contexts/PlayerContext';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const { playTrack } = usePlayer();
  const inputRef = useRef(null);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('@recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  };

  const saveRecentSearch = async (searchTerm) => {
    try {
      const safeRecent = Array.isArray(recentSearches) ? recentSearches : [];
      const updated = [searchTerm, ...safeRecent.filter(s => s !== searchTerm)].slice(0, 15);
      setRecentSearches(updated);
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

  const removeRecentSearch = async (searchTerm) => {
    try {
      const updated = recentSearches.filter(s => s !== searchTerm);
      setRecentSearches(updated);
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove recent search', e);
    }
  };

  const executeSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    Keyboard.dismiss();
    setQuery(searchTerm);
    setLoading(true);
    saveRecentSearch(searchTerm);
    try {
      const data = await searchTracks(searchTerm);
      setResults(data.tracks || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    if (inputRef.current) {
      inputRef.current.blur();
    }
    executeSearch(query);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.trackItem}>
      <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Cover' }} style={styles.thumbnail} />
      <View style={styles.trackInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist || item.author}</Text>
      </View>
      <TouchableOpacity style={styles.playButton} onPress={() => playTrack(item)}>
        <Ionicons name="play" size={24} color="#ffb3ae" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Artistas, URL o URL de playlist..."
          placeholderTextColor="#a79b9a"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          blurOnSubmit={true}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#e7e5e4" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffb3ae" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.recentContainer}>
          {recentSearches.length > 0 && (
            <Text style={styles.recentTitle}>Búsquedas Recientes</Text>
          )}
          <FlatList
            data={recentSearches}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.recentItemContainer}>
                <TouchableOpacity 
                  style={styles.recentItemRow} 
                  onPress={() => executeSearch(item)}
                >
                  <Ionicons name="time-outline" size={20} color="#a79b9a" />
                  <Text style={styles.recentItemText}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteRecentButton} 
                  onPress={() => removeRecentSearch(item)}
                >
                  <Ionicons name="close" size={20} color="#a79b9a" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f2020',
    borderRadius: 30,
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    marginTop: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#e7e5e4',
    fontSize: 16,
  },
  searchButton: {
    padding: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 100, // padding for PlayerBar
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
  },
  recentContainer: {
    flex: 1,
  },
  recentTitle: {
    color: '#ffb3ae',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  recentItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2020',
  },
  recentItemRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentItemText: {
    color: '#e7e5e4',
    fontSize: 15,
    marginLeft: 12,
  },
  deleteRecentButton: {
    padding: 5,
  }
});
