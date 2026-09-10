import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import {
  Briefcase,
  Banknote,
  GraduationCap,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';

type IncomePattern = 'fixed_salary' | 'monthly_allowance' | 'semester_lump_sum' | 'no_steady_income';

const INCOME_OPTIONS: {
  id: IncomePattern;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
}[] = [
  {
    id: 'fixed_salary',
    icon: <Briefcase size={24} color="#FF6B4A" strokeWidth={1.75} />,
    title: 'Fixed Salary',
    subtitle: 'Monthly or bi-weekly paycheck from a job',
    color: '#FF6B4A',
  },
  {
    id: 'monthly_allowance',
    icon: <Banknote size={24} color="#10B981" strokeWidth={1.75} />,
    title: 'Monthly Allowance',
    subtitle: 'Regular transfers from family or a stipend',
    color: '#10B981',
  },
  {
    id: 'semester_lump_sum',
    icon: <GraduationCap size={24} color="#0284C7" strokeWidth={1.75} />,
    title: 'Semester / Lump Sum',
    subtitle: 'Scholarship, student loan, or financial aid',
    color: '#0284C7',
  },
  {
    id: 'no_steady_income',
    icon: <HelpCircle size={24} color="#EC4899" strokeWidth={1.75} />,
    title: 'No Steady Income',
    subtitle: 'Freelance, gig work, or currently no income',
    color: '#EC4899',
  },
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<IncomePattern | null>(null);
  const [step, setStep] = useState<'income' | 'done'>('income');

  const handleContinue = () => {
    if (!selected) return;
    // Mock: just navigate to main app
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Progress dots */}
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingTop: 24 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                height: 4,
                flex: i === 0 ? 2 : 1,
                borderRadius: 999,
                backgroundColor: i === 0 ? '#0F172A' : '#E2E8F0',
              }}
            />
          ))}
        </View>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: '#FF6B4A',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              shadowColor: '#FF6B4A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 22, fontFamily: 'Sora_700Bold', color: '#FFFFFF' }}>W</Text>
          </View>
          <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 26, color: '#0F172A', lineHeight: 32, marginBottom: 8 }}>
            How does your money arrive?
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B', lineHeight: 21 }}>
            This helps Wallo build a budget model that fits how you actually get paid — not how most apps assume you do.
          </Text>
        </View>

        {/* Income type cards */}
        <View style={{ paddingHorizontal: 24, gap: 12 }}>
          {INCOME_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setSelected(opt.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isSelected ? '#0F172A' : '#FFFFFF',
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#0F172A' : '#E2E8F0',
                  gap: 14,
                  shadowColor: isSelected ? '#0F172A' : 'rgba(15,23,42,0.04)',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.15 : 1,
                  shadowRadius: 6,
                  elevation: isSelected ? 3 : 1,
                }}
              >
                {/* Icon pill */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    backgroundColor: isSelected ? '#FFFFFF22' : `${opt.color}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {React.cloneElement(opt.icon as React.ReactElement<any>, {
                    color: isSelected ? '#FFFFFF' : opt.color,
                  })}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 15,
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      marginBottom: 2,
                    }}
                  >
                    {opt.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 13,
                      color: isSelected ? '#94A3B8' : '#64748B',
                      lineHeight: 18,
                    }}
                  >
                    {opt.subtitle}
                  </Text>
                </View>

                {/* Selected check */}
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    backgroundColor: isSelected ? '#FF6B4A' : '#E2E8F0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_700Bold' }}>✓</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Bottom note */}
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          color: '#64748B',
          lineHeight: 18,
          textAlign: 'center',
          paddingHorizontal: 32,
          marginTop: 20,
        }}>
          You can change this later in Settings. Wallo never accesses your bank — everything is manual or optional.
        </Text>

        {/* Continue button */}
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <Pressable
            onPress={handleContinue}
            disabled={!selected}
            style={{
              backgroundColor: selected ? '#0F172A' : '#E2E8F0',
              borderRadius: 16,
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              shadowColor: selected ? '#0F172A' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: selected ? 2 : 0,
            }}
          >
            <Text style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 16,
              color: selected ? '#FFFFFF' : '#94A3B8',
            }}>
              Set Up My Budget
            </Text>
            {selected && <ChevronRight size={20} color="#FFFFFF" />}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
