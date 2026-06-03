import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold_Italic,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_900Black,
} from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Caveat_600SemiBold, Caveat_700Bold } from "@expo-google-fonts/caveat";

import { queryClient } from "@/lib/query";
import { AuthProvider } from "@/lib/auth";
import { AppLockProvider } from "@/lib/app-lock";
import { NotificationProvider } from "@/lib/inbox";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold_Italic,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Caveat_600SemiBold,
    Caveat_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppLockProvider>
              <NotificationProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="alumni-map" />
                  <Stack.Screen name="inbox" />
                  <Stack.Screen name="login" options={{ presentation: "modal" }} />
                  <Stack.Screen name="register" options={{ presentation: "modal" }} />
                  <Stack.Screen name="notify-primer" options={{ presentation: "modal" }} />
                  <Stack.Screen name="onboarding" options={{ presentation: "modal", gestureEnabled: false }} />
                </Stack>
              </NotificationProvider>
            </AppLockProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
