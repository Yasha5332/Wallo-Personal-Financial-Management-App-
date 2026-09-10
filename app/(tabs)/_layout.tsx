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
  { name: 'more', title: 'More', Icon: MoreHorizontal },
];

function CustomTabBar({ state, navigation }: any) {
  const { debtBalances } = useFinance();
  const hasPendingSettlements = debtBalances.length > 0;
  const insets = useSafeAreaInsets();

  const floatingBottomOffset = Math.max(
    insets.bottom,
    Platform.select({ ios: 20, android: 14, default: 12 })
  ) + 4;

  const currentRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: floatingBottomOffset,
          left: 18,
          right: 18,
          height: 68,
          borderRadius: 34,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#F1F5F9',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: 6,
        },
        Platform.OS === 'web' && {
          maxWidth: 440,
          left: 0,
          right: 0,
          marginHorizontal: 'auto',
          width: '90%',
        },
      ]}
    >
      {TAB_CONFIGS.map((tab) => {
        const isFocused = currentRouteName === tab.name;
        const showBadge = tab.name === 'more' && hasPendingSettlements;

        const handlePress = () => {
          if (tab.isAction) {
            router.push('/modal/add-transaction');
            return;
          }

          const route = state.routes.find((r: any) => r.name === tab.name);
          if (!route) return;

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(tab.name);
          }
        };

        const handleLongPress = () => {
          if (tab.isAction) return;
          const route = state.routes.find((r: any) => r.name === tab.name);
          if (!route) return;
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        if (tab.isAction) {
          return (
            <Pressable
              key={tab.name}
              onPress={handlePress}
              accessibilityRole="button"
              accessibilityLabel="Add transaction"
              style={({ pressed }) => [
                {
                  flex: 1,
                  height: 68,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                },
              ]}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#FF6B4A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#FF6B4A',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <Plus size={22} color="#FFFFFF" strokeWidth={2.8} />
              </View>
              <Text
                className="font-body-semibold text-[10px] text-ink-muted mt-1"
                numberOfLines={1}
              >
                Add
              </Text>
            </Pressable>
          );
        }

        const Icon = tab.Icon!;

        return (
          <Pressable
            key={tab.name}
            onPress={handlePress}
            onLongPress={handleLongPress}
            accessibilityRole="tab"
            accessibilityLabel={tab.title}
            accessibilityState={{ selected: isFocused }}
            style={({ pressed }) => [
              {
                flex: 1,
                height: 68,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View
              style={{
                width: 40,
                height: 32,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused ? '#FFF1ED' : 'transparent',
              }}
            >
              <Icon
                size={20}
                color={isFocused ? '#FF6B4A' : '#94A3B8'}
                strokeWidth={isFocused ? 2.4 : 1.9}
              />
              {showBadge && (
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: '#FF6B4A',
                    borderWidth: 1.5,
                    borderColor: '#FFFFFF',
                  }}
                />
              )}
            </View>
            <Text
              className={`text-[10px] mt-0.5 ${
                isFocused ? 'font-body-bold text-[#FF6B4A]' : 'font-body-medium text-[#94A3B8]'
              }`}
              numberOfLines={1}
            >
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: '#F7F8FC' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
        }}
      />
      <Tabs.Screen
        name="ledger"
        options={{
          title: 'Add',
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budget',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
        }}
      />
      <Tabs.Screen
        name="shared"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

