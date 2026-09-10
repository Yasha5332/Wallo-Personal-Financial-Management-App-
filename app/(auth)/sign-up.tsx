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
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react-native';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setIsLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 900));
    setIsLoading(false);
    // Go to onboarding
    router.push('/(auth)/onboarding');
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
          <View style={{ paddingHorizontal: 28, paddingTop: 48, paddingBottom: 36 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ marginBottom: 24, width: 36, height: 36, borderRadius: 999, backgroundColor: '#FFFFFF1A', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#F8FAFC', fontSize: 18 }}>←</Text>
            </Pressable>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundColor: '#FF6B4A',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: '#FF6B4A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 26, fontFamily: 'Sora_700Bold', color: '#FFFFFF' }}>W</Text>
            </View>
            <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 28, color: '#F8FAFC', lineHeight: 34, marginBottom: 8 }}>
              Create your account
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#94A3B8', lineHeight: 20 }}>
              Track your finances, split with roommates, hit your goals.
            </Text>
          </View>

          {/* Form card */}
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
              <View style={{ backgroundColor: '#F43F5E18', borderWidth: 1, borderColor: '#F43F5E40', borderRadius: 12, padding: 12, marginBottom: 20 }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#F43F5E', textAlign: 'center' }}>{error}</Text>
              </View>
            ) : null}

            {/* Name */}
            <Text style={labelStyle}>Your name</Text>
            <View style={[fieldWrapStyle, focusedField === 'name' && focusedBorderStyle]}>
              <User size={18} color={focusedField === 'name' ? '#FF6B4A' : '#64748B'} />
              <TextInput
                value={name}
                onChangeText={(v) => { setName(v); setError(''); }}
                placeholder="Alex"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle}
              />
            </View>

            {/* Email */}
            <Text style={[labelStyle, { marginTop: 16 }]}>Email address</Text>
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

            {/* Password */}
            <Text style={[labelStyle, { marginTop: 16 }]}>Password</Text>
            <View style={[fieldWrapStyle, focusedField === 'password' && focusedBorderStyle]}>
              <Lock size={18} color={focusedField === 'password' ? '#FF6B4A' : '#64748B'} />
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                placeholder="At least 8 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPass}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={[inputStyle, { flex: 1 }]}
              />
              <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                {showPass ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
              </Pressable>
            </View>

            {/* Password strength dots */}
            {password.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                {[4, 8, 12].map((threshold, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 999,
                      backgroundColor: password.length >= threshold ? '#10B981' : '#E2E8F0',
                    }}
                  />
                ))}
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#64748B', marginLeft: 4 }}>
                  {password.length < 4 ? 'Weak' : password.length < 8 ? 'Fair' : 'Strong'}
                </Text>
              </View>
            )}

            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', lineHeight: 18, marginTop: 20, marginBottom: 24 }}>
              By signing up, you agree to Wallo's{' '}
              <Text style={{ color: '#FF6B4A', fontFamily: 'Inter_500Medium' }}>Terms of Service</Text>{' '}
              and{' '}
              <Text style={{ color: '#FF6B4A', fontFamily: 'Inter_500Medium' }}>Privacy Policy</Text>.
            </Text>

            <Pressable
              onPress={handleSignUp}
              disabled={isLoading}
              style={[primaryBtnStyle, { opacity: isLoading ? 0.7 : 1 }]}
            >
              <Text style={primaryBtnTextStyle}>
                {isLoading ? 'Creating account…' : 'Create Account'}
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B' }}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => router.back()}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FF6B4A' }}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const labelStyle = { fontFamily: 'Inter_500Medium' as const, fontSize: 12, color: '#64748B', marginBottom: 6 };
const fieldWrapStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10 };
const focusedBorderStyle = { borderColor: '#FF6B4A', backgroundColor: '#FFFFFF' };
const inputStyle = { flex: 1, fontFamily: 'Inter_400Regular' as const, fontSize: 15, color: '#0F172A', padding: 0 };
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
const primaryBtnTextStyle = { fontFamily: 'Inter_600SemiBold' as const, fontSize: 16, color: '#FFFFFF' };
