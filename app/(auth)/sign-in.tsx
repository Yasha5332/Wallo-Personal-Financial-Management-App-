import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    // Mock sign-in: go straight to tabs
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {/* Top brand area */}
          <View style={{ paddingHorizontal: 28, paddingTop: 56, paddingBottom: 40 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: '#FF6B4A',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 28,
                shadowColor: '#FF6B4A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 26, fontFamily: 'Sora_700Bold', color: '#FFFFFF' }}>W</Text>
            </View>
            <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 30, color: '#F8FAFC', lineHeight: 36, marginBottom: 8 }}>
              Welcome back
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#94A3B8', lineHeight: 22 }}>
              Sign in to continue tracking your finances
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 40,
            }}
          >
            {error ? (
              <View style={{
                backgroundColor: '#F43F5E18',
                borderWidth: 1,
                borderColor: '#F43F5E40',
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
              }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#F43F5E', textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Email field */}
            <Text style={labelStyle}>Email address</Text>
            <View style={[fieldWrapStyle, focusedField === 'email' && focusedBorderStyle]}>
              <Mail size={18} color={focusedField === 'email' ? '#FF6B4A' : '#64748B'} />
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle}
              />
            </View>

            {/* Password field */}
            <Text style={[labelStyle, { marginTop: 16 }]}>Password</Text>
            <View style={[fieldWrapStyle, focusedField === 'password' && focusedBorderStyle]}>
              <Lock size={18} color={focusedField === 'password' ? '#FF6B4A' : '#64748B'} />
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPass}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={[inputStyle, { flex: 1 }]}
              />
              <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                {showPass
                  ? <EyeOff size={18} color="#64748B" />
                  : <Eye size={18} color="#64748B" />
                }
              </Pressable>
            </View>

            <Pressable style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#FF6B4A' }}>
                Forgot password?
              </Text>
            </Pressable>

            {/* Sign In button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              style={[
                primaryBtnStyle,
                { marginTop: 28, opacity: isLoading ? 0.7 : 1 },
              ]}
            >
              <Text style={primaryBtnTextStyle}>
                {isLoading ? 'Signing in…' : 'Sign In'}
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#94A3B8', marginHorizontal: 12 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </View>

            {/* Demo mode button */}
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={secondaryBtnStyle}
            >
              <Text style={secondaryBtnTextStyle}>Continue in Demo Mode</Text>
            </Pressable>

            {/* Sign up link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B' }}>
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FF6B4A' }}>
                  Sign up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const labelStyle = {
  fontFamily: 'Inter_500Medium' as const,
  fontSize: 12,
  color: '#64748B',
  marginBottom: 6,
};
const fieldWrapStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: '#F8FAFC',
  borderWidth: 1.5,
  borderColor: '#E2E8F0',
  borderRadius: 14,
  paddingHorizontal: 14,
  height: 52,
  gap: 10,
};
const focusedBorderStyle = { borderColor: '#FF6B4A', backgroundColor: '#FFFFFF' };
const inputStyle = {
  flex: 1,
  fontFamily: 'Inter_400Regular' as const,
  fontSize: 15,
  color: '#0F172A',
  padding: 0,
};
const primaryBtnStyle = {
  backgroundColor: '#0F172A',
  borderRadius: 14,
  height: 54,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 2,
};
const primaryBtnTextStyle = {
  fontFamily: 'Inter_600SemiBold' as const,
  fontSize: 16,
  color: '#FFFFFF',
};
const secondaryBtnStyle = {
  backgroundColor: '#F1F5F9',
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 14,
  height: 52,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const secondaryBtnTextStyle = {
  fontFamily: 'Inter_600SemiBold' as const,
  fontSize: 15,
  color: '#0F172A',
};
