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
import { AuthProvider } from '../context/AuthContext';
import { CurrencyProvider } from '../context/CurrencyContext';
import { FinanceProvider } from '../context/FinanceContext';
import { BiometricLock } from '../components/BiometricLock';
import { BrandLogo } from '../components/ui/BrandLogo';
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
      <View style={{ flex: 1, backgroundColor: '#F3F5F4', alignItems: 'center', justifyContent: 'center' }}>
        <BrandLogo size={64} style={{ marginBottom: 18 }} />
        <ActivityIndicator size="small" color="#1E3D3C" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <CurrencyProvider>
        <FinanceProvider>
          {/* Biometric lock wraps the entire app — set enabled={false} to disable */}
          <BiometricLock enabled={false}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F3F5F4', flex: 1 },
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
                name="modal/edit-transaction"
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
              <Stack.Screen
                name="modal/currency-picker"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/currency-showcase"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/export-backup"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="modal/scan-receipt"
                options={{ presentation: 'fullScreenModal', headerShown: false }}
              />
            </Stack>
          </BiometricLock>
        </FinanceProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
