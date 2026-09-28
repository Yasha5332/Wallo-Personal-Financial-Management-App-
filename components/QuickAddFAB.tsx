import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { router } from 'expo-router';

interface QuickAddFABProps {
  className?: string;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({ className = '' }) => {
  return (
    <Pressable
      onPress={() => router.push('/modal/add-transaction')}
      className={`absolute bottom-6 right-6 flex-row items-center bg-primary px-4 py-3.5 rounded-pill active:opacity-90 ${className}`}
      style={{
        shadowColor: '#1E3D3C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
        elevation: 6,
      }}
    >
      <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
      <Text className="ml-1.5 font-body-semibold text-white text-sm">
        Add
      </Text>
    </Pressable>
  );
};
