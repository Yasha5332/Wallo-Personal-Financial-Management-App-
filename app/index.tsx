import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/ui/BrandLogo';

export default function Index() {
  const { user, profile, isLoading, isDemoMode, hasCompletedOnboarding } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F3F5F4', alignItems: 'center', justifyContent: 'center' }}>
        <BrandLogo size={64} style={{ marginBottom: 18 }} />
        <ActivityIndicator size="small" color="#1E3D3C" />
      </View>
    );
  }

  // If in demo mode, go directly to tabs
  if (isDemoMode) {
    return <Redirect href="/(tabs)" />;
  }

  // If logged in via Supabase
  if (user) {
    if (hasCompletedOnboarding || profile) {
      return <Redirect href="/(tabs)" />;
    }
    return <Redirect href="/(auth)/onboarding" />;
  }

  // Otherwise, user needs to sign in
  return <Redirect href="/(auth)/sign-in" />;
}
