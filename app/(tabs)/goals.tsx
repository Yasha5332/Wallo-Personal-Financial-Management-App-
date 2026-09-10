import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Target, Plus, X, Calendar, Lightbulb, ArrowLeft, CheckCircle2 } from 'lucide-react-native';

export default function GoalsScreen() {
  const { savingsGoals, addSavingsGoal, contributeToGoal } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [contributeAmount, setContributeAmount] = useState('');

  const handleAddGoal = () => {
    const target = parseFloat(newGoalTarget);
    if (!newGoalTitle.trim() || isNaN(target) || target <= 0) return;
    const weeks = newGoalDate
      ? Math.max(1, Math.ceil((new Date(newGoalDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
      : 12;
    addSavingsGoal({
      title: newGoalTitle.trim(),
      targetAmount: target,
      targetDate: newGoalDate || 'Open-ended',
      weeklySuggested: parseFloat((target / weeks).toFixed(2)),
    });
    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalDate('');
    setShowAddModal(false);
  };

  const handleContribute = (goalId: string) => {
    const amount = parseFloat(contributeAmount);
    if (!isNaN(amount) && amount > 0) {
      contributeToGoal(goalId, amount);
    }
    setContributeAmount('');
    setShowContributeModal(null);
  };

  const totalSavedAll = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTargetAll = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalPctAll = totalTargetAll > 0 ? Math.round((totalSavedAll / totalTargetAll) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-base" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1"
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-5 mt-1">
          <View className="flex-row items-center flex-1 mr-3">
            <Pressable
              onPress={() => router.replace('/(tabs)/more')}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center mr-2.5 active:bg-surface-alt shadow-xs"
              accessibilityLabel="Back to Settings"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </Pressable>
            <View>
              <Text className="font-display text-2xl text-ink">Goals</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center bg-primary px-3.5 py-2 rounded-xl active:bg-primary-pressed shadow-sm"
          >
            <Plus size={16} color="#FFFFFF" />
            <Text className="font-body-semibold text-xs text-surface ml-1.5">New Goal</Text>
          </Pressable>
        </View>

        {/* Quick Summary Card */}
        {savingsGoals.length > 0 && (
          <View
            className="bg-surface rounded-2xl p-4 mb-4 border border-border/70 flex-row items-center justify-between"
            style={{
              shadowColor: '#151A2D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 1,
            }}
          >
            <View>
              <Text className="font-body text-xs text-ink-muted">Total Saved for Goals</Text>
              <Text className="font-display text-xl text-ink mt-0.5 font-bold">
                ${totalSavedAll.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                <Text className="font-body text-xs text-ink-muted font-normal">
                  {' '}of ${totalTargetAll.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </Text>
              </Text>
            </View>
            <View className="items-end">
              <View className="bg-secondary/15 px-2.5 py-1 rounded-full">
                <Text className="font-body-semibold text-xs text-secondary">{totalPctAll}% overall</Text>
              </View>
              <Text className="font-body text-[11px] text-ink-muted mt-1">
                {savingsGoals.length} {savingsGoals.length === 1 ? 'goal' : 'goals'}
              </Text>
            </View>
          </View>
        )}

        {savingsGoals.length === 0 ? (
          <Card className="items-center py-10">
            <Target size={40} color="#64748B" strokeWidth={1.5} />
            <Text className="font-display text-sm text-ink mt-3 mb-1">No goals yet</Text>
            <Text className="font-body text-xs text-ink-muted text-center px-6 mb-4">
              Set a savings goal to start tracking your progress toward something you want.
            </Text>
            <Button label="Create first goal" onPress={() => setShowAddModal(true)} />
          </Card>
        ) : (
          savingsGoals.map((goal) => {
            const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const pct = Math.round(progress * 100);
            const isComplete = progress >= 1;

            return (
              <Card key={goal.id} className="mb-3 p-4">
                {/* Top Row: Icon, Title & Quick Action */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                      style={{
                        backgroundColor: isComplete ? '#ECFDF5' : '#FFF1ED',
                      }}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={20} color="#10B981" />
                      ) : (
                        <Target size={20} color="#FF6B4A" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-display text-base text-ink" numberOfLines={1}>
                        {goal.title}
                      </Text>
                      <Text className="font-body text-xs text-ink-muted mt-0.5" numberOfLines={1}>
                        {isComplete
                          ? 'Goal reached! 🎉'
                          : `${goal.targetDate && goal.targetDate !== 'Open-ended' ? `Due ${goal.targetDate}` : 'Ongoing'}${goal.weeklySuggested > 0 ? ` · $${Math.round(goal.weeklySuggested)}/wk` : ''}`}
                      </Text>
                    </View>
                  </View>

                  {isComplete ? (
                    <View className="bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <Text className="font-body-semibold text-xs text-emerald-600">Reached</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => {
                        setShowContributeModal(goal.id);
                        setContributeAmount('');
                      }}
                      hitSlop={8}
                      className="flex-row items-center bg-secondary/15 hover:bg-secondary/20 active:bg-secondary/25 px-3 py-1.5 rounded-full"
                    >
                      <Plus size={13} color="#FF6B4A" strokeWidth={2.5} />
                      <Text className="font-body-semibold text-xs text-secondary ml-1">Add</Text>
                    </Pressable>
                  )}
                </View>

                {/* Progress bar */}
                <View className="h-2 bg-surface-alt rounded-full overflow-hidden mb-2.5">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: isComplete ? '#10B981' : '#FF6B4A',
                    }}
                  />
                </View>

                {/* Bottom Row: Amount Saved vs Target & Percentage */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-baseline">
                    <Text className="font-display text-sm text-ink font-semibold">
                      ${goal.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </Text>
                    <Text className="font-body text-xs text-ink-muted ml-1">
                      of ${goal.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </Text>
                    {!isComplete && remaining > 0 && (
                      <Text className="font-body text-xs text-ink-muted/70 ml-1.5">
                        (${remaining.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} left)
                      </Text>
                    )}
                  </View>
                  <Text
                    className="font-body-semibold text-xs"
                    style={{ color: isComplete ? '#10B981' : '#FF6B4A' }}
                  >
                    {pct}%
                  </Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add New Goal Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(28,31,29,0.3)', justifyContent: 'flex-end' }}
            onPress={() => setShowAddModal(false)}
          >
            <Pressable
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <Text className="font-display text-lg text-ink">New Savings Goal</Text>
                <Pressable onPress={() => setShowAddModal(false)} hitSlop={8}>
                  <X size={22} color="#667085" />
                </Pressable>
              </View>

              <Text className="font-body text-xs text-ink-muted mb-1">What are you saving for?</Text>
              <TextInput
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                placeholder="e.g. New laptop, Summer trip..."
                placeholderTextColor="#667085"
                style={inputStyle}
              />

              <Text className="font-body text-xs text-ink-muted mb-1 mt-3">Target amount ($)</Text>
              <TextInput
                value={newGoalTarget}
                onChangeText={setNewGoalTarget}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#667085"
                style={inputStyle}
              />

              <Text className="font-body text-xs text-ink-muted mb-1 mt-3">
                Target date (optional, e.g. Dec 15, 2026)
              </Text>
              <TextInput
                value={newGoalDate}
                onChangeText={setNewGoalDate}
                placeholder="e.g. Mar 20, 2027"
                placeholderTextColor="#94A3B8"
                style={inputStyle}
              />

              <View className="flex-row mt-6" style={{ gap: 12 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowAddModal(false)}
                  className="flex-1"
                />
                <Button label="Create Goal" onPress={handleAddGoal} className="flex-1" />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        visible={showContributeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContributeModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(28,31,29,0.3)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
            onPress={() => setShowContributeModal(null)}
          >
            <Pressable style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-display text-base text-ink">Add Money to Goal</Text>
                <Pressable onPress={() => setShowContributeModal(null)} hitSlop={8}>
                  <X size={20} color="#667085" />
                </Pressable>
              </View>
              <Text className="font-body text-xs text-ink-muted mb-1">Amount to add ($)</Text>
              <TextInput
                value={contributeAmount}
                onChangeText={setContributeAmount}
                keyboardType="decimal-pad"
                autoFocus
                placeholder="0.00"
                placeholderTextColor="#667085"
                style={{ ...inputStyle, marginBottom: 16 }}
              />
              <View className="flex-row" style={{ gap: 12 }}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  onPress={() => setShowContributeModal(null)}
                  className="flex-1"
                />
                <Button
                  label="Add"
                  onPress={() => showContributeModal && handleContribute(showContributeModal)}
                  className="flex-1"
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const inputStyle = {
  backgroundColor: '#F8FAFC',
  borderWidth: 1.5,
  borderColor: '#E4E7EC',
  borderRadius: 14,
  height: 52,
  paddingHorizontal: 14,
  fontFamily: 'Inter_400Regular',
  color: '#16202A',
  fontSize: 15,
};
