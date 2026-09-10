import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1 (or > 1 if over budget)
  className?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  height = 8,
}) => {
  const percentage = Math.min(Math.max(progress * 100, 0), 100);

  // Dynamic fill color according to design system:
  // income green < 80%, warning amber 80-99%, danger coral >= 100%
  const getFillColor = () => {
    if (progress >= 1.0) {
      return 'bg-danger';
    }
    if (progress >= 0.8) {
      return 'bg-warning';
    }
    return 'bg-income';
  };

  return (
    <View
      className={`w-full bg-surface-alt rounded-pill overflow-hidden ${className}`}
      style={{ height }}
    >
      <View
        className={`h-full rounded-pill ${getFillColor()}`}
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
};
