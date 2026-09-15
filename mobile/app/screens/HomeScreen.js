import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getRecommendations } from '../services/apiService';
import { usePlayer } from '../contexts/PlayerContext';

export default function HomeScreen() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayer();

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const data = await getRecommendations();
      setRecommendations(data.tracks || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => playTrack(item)}>
      <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/150/000000/ffb3ae?text=Cover' }} style={styles.thumbnail} />
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>HOY</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffb3ae" />
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.columnWrapper}
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
  grid: {
    paddingBottom: 100, // padding for PlayerBar
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 0.48,
    backgroundColor: '#1f2020',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
  },
  title: {
    color: '#e7e5e4',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  artist: {
    color: '#acabaa',
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 8,
  }
});
