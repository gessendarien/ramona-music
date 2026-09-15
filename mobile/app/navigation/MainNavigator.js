import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import PlayerBar from '../components/PlayerBar';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0e0e0e' }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1f2020',
            borderTopWidth: 0,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarActiveTintColor: '#ffb3ae',
          tabBarInactiveTintColor: '#a79b9a',
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Library') {
              iconName = focused ? 'library' : 'library-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Hoy' }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Buscar' }} />
        <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Biblioteca' }} />
      </Tab.Navigator>
      <PlayerBar />
    </View>
  );
}
