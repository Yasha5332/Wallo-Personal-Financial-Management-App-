import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  AppState,
  Platform,
} from 'react-native';
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react-native';

interface BiometricLockProps {
  enabled?: boolean;
  children: React.ReactNode;
}

// PIN for demo: 1234
const DEMO_PIN = '1234';
const LOCK_AFTER_MS = 30 * 1000; // 30 seconds in background

export const BiometricLock: React.FC<BiometricLockProps> = ({
  enabled = true,
  children,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [backgroundedAt, setBackgroundedAt] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  // Try biometric auth via expo-local-authentication
  const tryBiometric = useCallback(async () => {
    try {
      // Dynamic import so it doesn't crash in Expo Go
      const LocalAuth = await import('expo-local-authentication');
      const hasHardware = await LocalAuth.hasHardwareAsync();
      const isEnrolled = await LocalAuth.isEnrolledAsync();
      setIsBiometricSupported(hasHardware && isEnrolled);

      if (hasHardware && isEnrolled) {
        const result = await LocalAuth.authenticateAsync({
          promptMessage: 'Unlock Wallo',
          cancelLabel: 'Use PIN instead',
          fallbackLabel: 'Use PIN',
          disableDeviceFallback: false,
        });
        if (result.success) {
          setIsLocked(false);
          setUnlocked(true);
        }
      }
    } catch {
      // expo-local-authentication not available (Expo Go on some devices)
      setIsBiometricSupported(false);
    }
  }, []);

  // Lock on initial mount if enabled
  useEffect(() => {
    if (enabled) {
      setIsLocked(true);
      tryBiometric();
    }
  }, [enabled]);

  // Lock when app comes back from background
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        setBackgroundedAt(Date.now());
      } else if (state === 'active') {
        if (backgroundedAt && Date.now() - backgroundedAt > LOCK_AFTER_MS) {
          setIsLocked(true);
          setPin('');
          tryBiometric();
        }
        setBackgroundedAt(null);
      }
    });
    return () => sub.remove();
  }, [enabled, backgroundedAt, tryBiometric]);

  const handlePinDigit = (digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    setPinError(false);

    if (newPin.length === 4) {
      if (newPin === DEMO_PIN) {
        setIsLocked(false);
        setPin('');
      } else {
        setPinError(true);
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((p) => p.slice(0, -1));
    setPinError(false);
  };

  if (!enabled || !isLocked) return <>{children}</>;

  return (
    <>
      {children}
      <Modal visible={isLocked} transparent={false} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: '#0F172A',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          {/* Brand */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: '#FF6B4A',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: '#FF6B4A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Lock size={28} color="#FFFFFF" />
          </View>
          <Text
            style={{
              fontFamily: 'Sora_700Bold',
              fontSize: 24,
              color: '#FFFFFF',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Wallo is locked
          </Text>
          <Text
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              color: '#94A3B8',
              textAlign: 'center',
              marginBottom: 48,
            }}
          >
            {isBiometricSupported ? 'Use biometrics or enter your PIN' : 'Enter your PIN to continue'}
          </Text>

          {/* PIN dots */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  backgroundColor:
                    pinError
                      ? '#F43F5E'
                      : pin.length > i
                      ? '#FF6B4A'
                      : '#FFFFFF33',
                }}
              />
            ))}
          </View>
          {pinError && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#F43F5E', marginBottom: 8 }}>
              Incorrect PIN. Try again.
            </Text>
          )}
          {!pinError && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#8A928E', marginBottom: 32 }}>
              Demo PIN: 1234
            </Text>
          )}

          {/* Numpad */}
          <View style={{ gap: 12, width: '100%', maxWidth: 280 }}>
            {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', gap: 12 }}>
                {row.map((digit) => (
                  <Pressable
                    key={digit}
                    onPress={() => handlePinDigit(String(digit))}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 64,
                      borderRadius: 16,
                      backgroundColor: pressed ? '#FFFFFF33' : '#FFFFFF18',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Text style={{ fontFamily: 'Sora_600SemiBold', fontSize: 22, color: '#F8FAFC' }}>
                      {digit}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}

            {/* Bottom row: biometric | 0 | delete */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={tryBiometric}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: pressed ? '#FFFFFF33' : '#FFFFFF18',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isBiometricSupported ? 1 : 0.3,
                })}
                disabled={!isBiometricSupported}
              >
                <Fingerprint size={24} color="#F8FAFC" />
              </Pressable>

              <Pressable
                onPress={() => handlePinDigit('0')}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: pressed ? '#FFFFFF33' : '#FFFFFF18',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text style={{ fontFamily: 'Sora_600SemiBold', fontSize: 22, color: '#F8FAFC' }}>0</Text>
              </Pressable>

              <Pressable
                onPress={handlePinDelete}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: pressed ? '#FFFFFF33' : '#FFFFFF18',
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 18, color: '#F8FAFC' }}>⌫</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
