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
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

export default function SignInScreen() {
  const { signIn, enterDemoMode, resendConfirmationEmail, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    setInfoMessage('');
    setUnconfirmedEmail(null);

    const res = await signIn(email, password);
    setIsLoading(false);

    if (res.error) {
      if (res.code === 'email_not_confirmed' || res.error.toLowerCase().includes('email not confirmed')) {
        setUnconfirmedEmail(email.trim());
        setError('Your email has not been confirmed yet. Please verify your email to continue.');
      } else if (res.error.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(res.error);
      }
      return;
    }

    router.replace('/(tabs)');
  };

  const handleResendConfirmation = async () => {
    const targetEmail = unconfirmedEmail || email.trim();
    if (!targetEmail) return;
    setIsResending(true);
    const { error: resendErr } = await resendConfirmationEmail(targetEmail);
    setIsResending(false);
    if (resendErr) {
      setError(resendErr);
    } else {
      setInfoMessage(`A fresh confirmation link has been sent to ${targetEmail}. Please check your inbox.`);
      setError('');
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please type your email address above, then tap "Forgot password?".');
      return;
    }
    setIsResetting(true);
    setError('');
    setInfoMessage('');
    const { error: resetErr } = await resetPassword(email);
    setIsResetting(false);
    if (resetErr) {
      setError(resetErr);
    } else {
      setInfoMessage(`Password reset instructions have been sent to ${email.trim()}.`);
    }
  };

  const handleContinueDemo = () => {
    enterDemoMode();
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050811' }}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#080D22', '#1E2A63', '#512B81', '#0E7490']}
        locations={[0, 0.36, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
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
            <View style={{ paddingHorizontal: 28, paddingTop: 48, paddingBottom: 36 }}>
              <View style={{ marginBottom: 18 }}>
                <BrandLogo size={62} dark />
              </View>
              <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 32, color: '#FFFFFF', lineHeight: 38, marginBottom: 8, letterSpacing: -0.5 }}>
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
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                paddingHorizontal: 24,
                paddingTop: 32,
                paddingBottom: 40,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
            {/* Error Message */}
            {error ? (
              <View style={{
                backgroundColor: '#F43F5E12',
                borderWidth: 1,
                borderColor: '#F43F5E40',
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <AlertCircle size={18} color="#F43F5E" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#E11D48', lineHeight: 18 }}>
                    {error}
                  </Text>
                  {unconfirmedEmail && (
                    <Pressable
                      onPress={handleResendConfirmation}
                      disabled={isResending}
                      style={{ marginTop: 8, alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#A87317', textDecorationLine: 'underline' }}>
                        {isResending ? 'Sending…' : 'Resend confirmation link'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : null}

            {/* Success / Info Message */}
            {infoMessage ? (
              <View style={{
                backgroundColor: '#10B98114',
                borderWidth: 1,
                borderColor: '#10B98140',
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <CheckCircle2 size={18} color="#10B981" style={{ marginTop: 2 }} />
                <Text style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: '#047857', lineHeight: 18 }}>
                  {infoMessage}
                </Text>
              </View>
            ) : null}

            {/* Email field */}
            <Text style={labelStyle}>Email address</Text>
            <View style={[fieldWrapStyle, focusedField === 'email' && focusedBorderStyle]}>
              <Mail size={18} color={focusedField === 'email' ? '#A87317' : '#64748B'} />
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); setInfoMessage(''); }}
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
              <Lock size={18} color={focusedField === 'password' ? '#A87317' : '#64748B'} />
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); setInfoMessage(''); }}
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

            <Pressable
              onPress={handleForgotPassword}
              disabled={isResetting}
              style={{ alignSelf: 'flex-end', marginTop: 8, paddingVertical: 4 }}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#A87317' }}>
                {isResetting ? 'Sending reset email…' : 'Forgot password?'}
              </Text>
            </Pressable>

            {/* Sign In button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              style={[
                primaryBtnStyle,
                { marginTop: 24, opacity: isLoading ? 0.75 : 1 },
              ]}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={primaryBtnTextStyle}>Signing in…</Text>
                </View>
              ) : (
                <Text style={primaryBtnTextStyle}>Sign In</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 22 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#94A3B8', marginHorizontal: 12 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </View>

            {/* Demo mode button */}
            <Pressable
              onPress={handleContinueDemo}
              style={secondaryBtnStyle}
            >
              <Text style={secondaryBtnTextStyle}>Continue in Demo Mode</Text>
            </Pressable>

            {/* Sign up link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 26 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B' }}>
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#A87317' }}>
                  Sign up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
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
const focusedBorderStyle = { borderColor: '#1E3D3C', backgroundColor: '#FFFFFF' };
const inputStyle = {
  flex: 1,
  fontFamily: 'Inter_400Regular' as const,
  fontSize: 15,
  color: '#1C1F1D',
  padding: 0,
};
const primaryBtnStyle = {
  backgroundColor: '#1E3D3C',
  borderRadius: 14,
  height: 54,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  shadowColor: '#1E3D3C',
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
  backgroundColor: '#EAEDEA',
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
  color: '#1C1F1D',
};
