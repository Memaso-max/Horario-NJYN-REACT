// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { currentUser, isLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // debug: log current navigation state to diagnose unexpected redirects
    try {
      // eslint-disable-next-line no-console
      console.log('RootLayoutNav:', { currentUser, isLoading, segments });
    } catch (e) {}

    const inTabs = String(segments[0]) === '(tabs)';
    const inWelcome = String(segments[0]) === 'welcome';

    if (!currentUser && !inWelcome) {
      router.replace('/welcome');
    } else if (currentUser && inWelcome) {
      if (currentUser.role === 'admin') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [currentUser, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Atrás" }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
