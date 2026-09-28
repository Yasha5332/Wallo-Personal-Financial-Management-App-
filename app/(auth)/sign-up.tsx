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
import { Eye, EyeOff, Mail, Lock, User, MailCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { ModernGridGradient } from '../../components/ui/ModernGridGradient';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen() {
  const { signUp, resendConfirmationEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  // When email confirmation is required by Supabase
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResendSuccess(false);

    const res = await signUp(email, password, name);
    setIsLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.needsEmailConfirmation) {
      setRegisteredEmail(email.trim());
      setIsAwaitingConfirmation(true);
    } else {
      // Instant login permitted by Supabase project settings
      router.replace({
        pathname: '/(auth)/onboarding',
        params: { name: name.trim() },
      });
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setIsResending(true);
    setError('');
    const { error: resendErr } = await resendConfirmationEmail(registeredEmail);
    setIsResending(false);
    if (resendErr) {
      setError(resendErr);
    } else {
      setResendSuccess(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050811' }}>
      <StatusBar style="light" />

      {/* Modern Aurora Mesh Gradient & Precision Tech Grid */}
      <ModernGridGradient />

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
            <View style={{ paddingHorizontal: 28, paddingTop: 44, paddingBottom: 32 }}>
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(auth)/sign-in');
                  }
                }}
                style={{ marginBottom: 20, width: 36, height: 36, borderRadius: 999, backgroundColor: '#FFFFFF1A', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} color="#F8FAFC" />
              </Pressable>
              <View style={{ marginBottom: 18 }}>
                <BrandLogo size={62} dark />
              </View>
              <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 30, color: '#FFFFFF', lineHeight: 36, marginBottom: 8, letterSpacing: -0.5 }}>
                {isAwaitingConfirmation ? 'Confirm your email' : 'Create your account'}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#94A3B8', lineHeight: 20 }}>
                {isAwaitingConfirmation
                  ? 'One last step to activate your Wallo financial dashboard'
                  : 'Track your finances, split with roommates, hit your goals.'}
              </Text>
            </View>

            {/* Form or Confirmation Card */}
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
            {isAwaitingConfirmation ? (
              /* Email Confirmation State */
              <View style={{ alignItems: 'center', paddingTop: 12 }}>
                <View style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#1E3D3C14',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <MailCheck size={36} color="#1E3D3C" />
                </View>

                <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 22, color: '#1C1F1D', textAlign: 'center', marginBottom: 8 }}>
                  Check your inbox
                </Text>

                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>
                  We've sent a verification link to:
                </Text>

                <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#1E3D3C' }}>
                    {registeredEmail}
                  </Text>
                </View>

                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 12 }}>
                  Click the link in the email to activate your account. Once confirmed, you can sign in directly.
                </Text>

                {error ? (
                  <View style={{ backgroundColor: '#F43F5E12', borderWidth: 1, borderColor: '#F43F5E40', borderRadius: 12, padding: 12, marginBottom: 16, width: '100%' }}>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#F43F5E', textAlign: 'center' }}>{error}</Text>
                  </View>
                ) : null}

                {resendSuccess ? (
                  <View style={{ backgroundColor: '#10B98114', borderWidth: 1, borderColor: '#10B98140', borderRadius: 12, padding: 12, marginBottom: 16, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} color="#10B981" />
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#047857' }}>A new confirmation link was sent!</Text>
                  </View>
                ) : null}

                {/* Primary: Go to Sign In */}
                <Pressable
                  onPress={() => router.replace('/(auth)/sign-in')}
                  style={[primaryBtnStyle, { width: '100%', marginBottom: 16 }]}
                >
                  <Text style={primaryBtnTextStyle}>Go to Sign In</Text>
                </Pressable>

                {/* Resend button */}
                <Pressable
                  onPress={handleResend}
                  disabled={isResending}
                  style={{ paddingVertical: 10 }}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#A87317', textAlign: 'center' }}>
                    {isResending ? 'Sending…' : "Didn't receive the email? Resend link"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* Standard Registration Form */
              <>
                {error ? (
                  <View style={{
                    backgroundColor: '#F43F5E12',
                    borderWidth: 1,
                    borderColor: '#F43F5E40',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <AlertCircle size={18} color="#F43F5E" />
                    <Text style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, color: '#E11D48', lineHeight: 18 }}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* Name */}
                <Text style={labelStyle}>Your name</Text>
                <View style={[fieldWrapStyle, focusedField === 'name' && focusedBorderStyle]}>
                  <User size={18} color={focusedField === 'name' ? '#A87317' : '#64748B'} />
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
                  <Mail size={18} color={focusedField === 'email' ? '#A87317' : '#64748B'} />
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
                  <Lock size={18} color={focusedField === 'password' ? '#A87317' : '#64748B'} />
                  <TextInput
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(''); }}
                    placeholder="At least 6 characters"
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
                    {[4, 6, 10].map((threshold, i) => (
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
                      {password.length < 4 ? 'Weak' : password.length < 6 ? 'Fair' : 'Strong'}
                    </Text>
                  </View>
                )}

                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', lineHeight: 18, marginTop: 20, marginBottom: 24 }}>
                  By signing up, you agree to Wallo's{' '}
                  <Text style={{ color: '#A87317', fontFamily: 'Inter_500Medium' }}>Terms of Service</Text>{' '}
                  and{' '}
                  <Text style={{ color: '#A87317', fontFamily: 'Inter_500Medium' }}>Privacy Policy</Text>.
                </Text>

                <Pressable
                  onPress={handleSignUp}
                  disabled={isLoading}
                  style={[primaryBtnStyle, { opacity: isLoading ? 0.75 : 1 }]}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={primaryBtnTextStyle}>Creating account…</Text>
                    </View>
                  ) : (
                    <Text style={primaryBtnTextStyle}>Create Account</Text>
                  )}
                </Pressable>

                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B' }}>
                    Already have an account?{' '}
                  </Text>
                  <Pressable onPress={() => router.replace('/(auth)/sign-in')}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#A87317' }}>
                      Sign in
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
);
}

const labelStyle = { fontFamily: 'Inter_500Medium' as const, fontSize: 12, color: '#64748B', marginBottom: 6 };
const fieldWrapStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10 };
const focusedBorderStyle = { borderColor: '#1E3D3C', backgroundColor: '#FFFFFF' };
const inputStyle = { flex: 1, fontFamily: 'Inter_400Regular' as const, fontSize: 15, color: '#1C1F1D', padding: 0 };
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
const primaryBtnTextStyle = { fontFamily: 'Inter_600SemiBold' as const, fontSize: 16, color: '#FFFFFF' };

