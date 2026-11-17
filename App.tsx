import React, { useEffect, type ComponentType } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { Home, Library, Search, UploadCloud } from 'lucide-react-native';
import { useAuthUser, useAuthReady } from './src/lib/useAuth';
import { useLikes } from './src/store/likes';
import { PlayerEngine } from './src/components/PlayerEngine';
import { MiniPlayer } from './src/components/MiniPlayer';
import { Toaster } from './src/components/Toaster';
import { colors } from './src/theme';
import type { RootStackParamList, TabParamList } from './src/navigation';

import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { UploadScreen } from './src/screens/UploadScreen';
import { PlaylistScreen } from './src/screens/PlaylistScreen';
import { AlbumScreen } from './src/screens/AlbumScreen';
import { ArtistScreen } from './src/screens/ArtistScreen';
import { GenreScreen } from './src/screens/GenreScreen';
import { FullPlayer } from './src/components/FullPlayer';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// react-native-screens is disabled on web by default, so every tab scene stays
// mounted and visible in the web preview. Enabling it lets the native Screen
// container hide inactive tabs there as well.
enableScreens();

function withMiniPlayer<P extends object>(Screen: ComponentType<P>) {
  return function WrappedScreen(props: P) {
    return (
      <View style={{ flex: 1 }}>
        <Screen {...props} />
        <MiniPlayer />
      </View>
    );
  };
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={withMiniPlayer(HomeScreen)}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={withMiniPlayer(SearchScreen)}
        options={{
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={withMiniPlayer(LibraryScreen)}
        options={{
          tabBarIcon: ({ color, size }) => <Library size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="UploadTab"
        component={withMiniPlayer(UploadScreen)}
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => <UploadCloud size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function RootStack() {
  const user = useAuthUser();
  const ready = useAuthReady();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.base } }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={Tabs} />
          <Stack.Screen name="Album" component={AlbumScreen} />
          <Stack.Screen name="Artist" component={ArtistScreen} />
          <Stack.Screen name="Playlist" component={PlaylistScreen} />
          <Stack.Screen name="Genre" component={GenreScreen} />
          <Stack.Screen
            name="Player"
            component={FullPlayer}
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const user = useAuthUser();

  useEffect(() => {
    if (user) void useLikes.getState().load(user.id);
  }, [user?.id]);

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <StatusBar style="light" backgroundColor={colors.base} />
        <NavigationContainer
          documentTitle={{ enabled: false }}
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              primary: colors.accent,
              background: colors.base,
              card: colors.surface,
              text: colors.fg,
              border: colors.line,
              notification: colors.accent,
            },
          }}
        >
          <RootStack />
        </NavigationContainer>
        <PlayerEngine />
        <Toaster />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.base },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.base },
});
