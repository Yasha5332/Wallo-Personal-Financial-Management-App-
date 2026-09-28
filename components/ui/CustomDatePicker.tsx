import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

interface CustomDatePickerProps {
  value: string; // ISO string
  onChange: (isoString: string) => void;
  label?: string;
  className?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label = 'Date',
  className = '',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Parse initial selected date
  const parsedDate = useMemo(() => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  // Current view month & year in calendar
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth()); // 0-indexed

  // When modal opens, sync view with selected date
  const handleOpen = () => {
    setViewYear(parsedDate.getFullYear());
    setViewMonth(parsedDate.getMonth());
    setModalVisible(true);
  };

  const today = useMemo(() => new Date(), []);
  const isToday =
    parsedDate.getFullYear() === today.getFullYear() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getDate() === today.getDate();

  const yesterday = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }, [today]);

  const isYesterday =
    parsedDate.getFullYear() === yesterday.getFullYear() &&
    parsedDate.getMonth() === yesterday.getMonth() &&
    parsedDate.getDate() === yesterday.getDate();

  const isPast = parsedDate.getTime() < today.getTime() && !isToday;

  // Formatted date string for trigger field
  const formattedDisplay = useMemo(() => {
    const monthStr = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (isToday) return `Today · ${monthStr}`;
    if (isYesterday) return `Yesterday · ${monthStr}`;
    return monthStr;
  }, [parsedDate, isToday, isYesterday]);

  // Quick preset handlers
  const handleSelectPreset = (daysAgo: number) => {
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    // Retain current time components
    target.setHours(parsedDate.getHours(), parsedDate.getMinutes(), parsedDate.getSeconds());
    onChange(target.toISOString());
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  // Calendar navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Days in viewMonth
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [viewYear, viewMonth]);

  const monthYearLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  const handleSelectDay = (day: number) => {
    const nextDate = new Date(viewYear, viewMonth, day);
    // Retain current time
    nextDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), parsedDate.getSeconds());
    onChange(nextDate.toISOString());
  };

  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="font-body text-xs text-ink-muted mb-1.5">{label}</Text> : null}

      {/* Trigger Button */}
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={`Select date, currently ${formattedDisplay}`}
        className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-3.5 h-12 active:bg-surface-alt"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-2.5">
            <CalendarIcon size={16} color="#1E3D3C" />
          </View>
          <Text className="font-body-medium text-sm text-ink" numberOfLines={1}>
            {formattedDisplay}
          </Text>
        </View>

        {isPast ? (
          <View className="bg-accent/15 px-2 py-0.5 rounded-full border border-accent/30">
            <Text className="font-body-medium text-[11px] text-accent-dark">Backdated</Text>
          </View>
        ) : (
          <View className="bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            <Text className="font-body-medium text-[11px] text-primary">Today</Text>
          </View>
        )}
      </Pressable>

      {/* Modal Calendar Picker */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          className="flex-1 bg-ink/40 justify-center items-center p-5"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface rounded-2xl p-5 shadow-lg border border-border"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border/80 mb-3">
              <View>
                <Text className="font-display text-base text-ink">Select Date</Text>
                <Text className="font-body text-xs text-ink-muted mt-0.5">
                  {formattedDisplay}
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={8}
                className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center active:bg-border"
              >
                <X size={16} color="#1C1F1D" />
              </Pressable>
            </View>

            {/* Quick Presets */}
            <Text className="font-body text-[11px] text-ink-muted uppercase tracking-wider mb-2">
              Quick Pick
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 6 }}
            >
              {[
                { label: 'Today', days: 0 },
                { label: 'Yesterday', days: 1 },
                { label: '2 days ago', days: 2 },
                { label: '3 days ago', days: 3 },
                { label: '1 week ago', days: 7 },
              ].map((preset) => {
                const checkDate = new Date();
                checkDate.setDate(checkDate.getDate() - preset.days);
                const isSelected =
                  checkDate.getFullYear() === parsedDate.getFullYear() &&
                  checkDate.getMonth() === parsedDate.getMonth() &&
                  checkDate.getDate() === parsedDate.getDate();

                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => handleSelectPreset(preset.days)}
                    className={`px-3 py-1.5 rounded-full border ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-surface-alt border-border active:bg-border'
                    }`}
                  >
                    <Text
                      className={`font-body-medium text-xs ${
                        isSelected ? 'text-surface' : 'text-ink'
                      }`}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Month / Year Navigator */}
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Pressable
                onPress={handlePrevMonth}
                hitSlop={8}
                className="w-8 h-8 rounded-lg bg-surface-alt items-center justify-center border border-border active:bg-border"
              >
                <ChevronLeft size={16} color="#1C1F1D" />
              </Pressable>
              <Text className="font-display text-sm text-ink">{monthYearLabel}</Text>
              <Pressable
                onPress={handleNextMonth}
                hitSlop={8}
                className="w-8 h-8 rounded-lg bg-surface-alt items-center justify-center border border-border active:bg-border"
              >
                <ChevronRight size={16} color="#1C1F1D" />
              </Pressable>
            </View>

            {/* Days of week header */}
            <View className="flex-row mb-1">
              {DAYS_OF_WEEK.map((dw) => (
                <View key={dw} className="flex-1 items-center py-1">
                  <Text className="font-body-medium text-[11px] text-ink-muted">{dw}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View className="flex-row flex-wrap mb-4">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty_${idx}`} style={{ width: '14.28%', height: 38 }} />;
                }

                const isSelected =
                  viewYear === parsedDate.getFullYear() &&
                  viewMonth === parsedDate.getMonth() &&
                  day === parsedDate.getDate();

                const isDayToday =
                  viewYear === today.getFullYear() &&
                  viewMonth === today.getMonth() &&
                  day === today.getDate();

                return (
                  <Pressable
                    key={`day_${day}`}
                    onPress={() => handleSelectDay(day)}
                    style={{ width: '14.28%', height: 38 }}
                    className="items-center justify-center"
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        isSelected
                          ? 'bg-primary shadow-xs'
                          : isDayToday
                          ? 'border border-primary bg-primary/5'
                          : 'active:bg-surface-alt'
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'font-body-bold text-surface'
                            : isDayToday
                            ? 'font-body-semibold text-primary'
                            : 'font-body text-ink'
                        }`}
                      >
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Footer / Confirm button */}
            <Pressable
              onPress={() => setModalVisible(false)}
              className="w-full h-11 bg-primary rounded-xl items-center justify-center active:bg-primary-pressed"
            >
              <Text className="font-body-semibold text-sm text-surface">Confirm Date</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};
