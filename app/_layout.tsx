import '../global.css';
import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { FinanceProvider } from '../context/FinanceContext';
import { BiometricLock } from '../components/BiometricLock';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F7F8FC', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B4A" />
      </View>
    );
  }

  return (
    <FinanceProvider>
      {/* Biometric lock wraps the entire app — set enabled={false} to disable */}
      <BiometricLock enabled={false}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F7F8FC', flex: 1 },
          }}
        >
          {/* Auth flow */}
          <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
          {/* Main app */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/* Modals */}
          <Stack.Screen
            name="modal/add-transaction"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="modal/settle-up"
            options={{ presentation: 'modal', headerShown: false }}
          />
          <Stack.Screen
            name="modal/edit-pay-period"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
      </BiometricLock>
    </FinanceProvider>
  );
}
