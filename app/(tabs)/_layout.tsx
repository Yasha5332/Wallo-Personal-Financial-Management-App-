import React from 'react';
import { router, Tabs } from 'expo-router';
import { House, History, PieChart, Plus, MoreHorizontal } from 'lucide-react-native';
import { useFinance } from '../../context/FinanceContext';
import { View, Platform, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabItemConfig {
  name: string;
  title: string;
  Icon?: React.ComponentType<any>;
  isAction?: boolean;
}

const TAB_CONFIGS: TabItemConfig[] = [
  { name: 'index', title: 'Home', Icon: House },
  { name: 'activity', title: 'Activity', Icon: History },
  { name: 'ledger', title: 'Add', isAction: true },
  { name: 'budgets', title: 'Budget', Icon: PieChart },
  { name: 'more', title: 'Settings', Icon: MoreHorizontal },
];

function CustomTabBar({ state, navigation }: any) {
  const { debtBalances } = useFinance();
  const insets = useSafeAreaInsets();
  const hasPendingSettlements = debtBalances.length > 0;
  const bottom = Math.max(insets.bottom, Platform.select({ ios: 16, android: 10, default: 10 })) + 4;
  const currentRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom,
          left: 16,
          right: 16,
          height: 72,
          borderRadius: 22,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E4DF',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 5,
          shadowColor: '#1C1F1D',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        },
        Platform.OS === 'web' && { maxWidth: 480, left: 0, right: 0, marginHorizontal: 'auto', width: '90%' },
      ]}
    >
      {TAB_CONFIGS.map((tab) => {
        const isFocused = currentRouteName === tab.name;
        const Icon = tab.Icon;

        const handlePress = () => {
          if (tab.isAction) {
            router.push('/modal/add-transaction');
            return;
          }
          const route = state.routes.find((r: any) => r.name === tab.name);
          if (!route) return;
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(tab.name);
        };

        if (tab.isAction) {
          return (
            <Pressable
              key={tab.name}
              onPress={handlePress}
              accessibilityRole="button"
              accessibilityLabel="Add transaction"
              style={({ pressed }) => ({ flex: 1, alignItems: 'center', opacity: pressed ? 0.75 : 1 })}
            >
              <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: '#E3A335', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="#1C1F1D" strokeWidth={2.5} />
              </View>
              <Text className="font-body-semibold text-[10px] text-ink mt-1">Add</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.name}
            onPress={handlePress}
            accessibilityRole="tab"
            accessibilityLabel={tab.title}
            accessibilityState={{ selected: isFocused }}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ width: 40, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isFocused ? '#E6EFED' : 'transparent' }}>
              {Icon && <Icon size={20} color={isFocused ? '#1E3D3C' : '#8A928E'} strokeWidth={isFocused ? 2.4 : 1.8} />}
              {tab.name === 'more' && hasPendingSettlements && (
                <View style={{ position: 'absolute', top: 3, right: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: '#E3A335', borderWidth: 1.5, borderColor: '#FFFFFF' }} />
              )}
            </View>
            <Text className={`text-[10px] mt-1 ${isFocused ? 'font-body-semibold text-primary' : 'font-body-medium text-ink-muted'}`}>
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { flex: 1, backgroundColor: '#F3F5F4' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="ledger" options={{ title: 'Add' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Budget' }} />
      <Tabs.Screen name="more" options={{ title: 'Settings' }} />
      <Tabs.Screen name="shared" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
    </Tabs>
  );
}
