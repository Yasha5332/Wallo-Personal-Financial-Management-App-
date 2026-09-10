import React from 'react';
import { Text, TextProps } from 'react-native';

interface AmountTextProps extends TextProps {
  amount: number;
  type?: 'expense' | 'income' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'display';
  showSign?: boolean;
  className?: string;
}

export const AmountText: React.FC<AmountTextProps> = ({
  amount,
  type = 'neutral',
  size = 'md',
  showSign = false,
  className = '',
  style,
  ...props
}) => {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const getSign = () => {
    if (!showSign) return '';
    if (type === 'income') return '+';
    if (type === 'expense') return '−';
    return '';
  };

  const getColorClass = () => {
    switch (type) {
      case 'income':
        return 'text-income';
      case 'expense':
        return 'text-expense';
      case 'neutral':
      default:
        return 'text-ink';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'display':
        return 'font-display-bold text-[38px]'; // 38pt
      case 'lg':
        return 'font-display-bold text-2xl'; // 28pt
      case 'sm':
        return 'font-body-medium text-xs';
      case 'md':
      default:
        return 'font-body-semibold text-base'; // 15-16pt
    }
  };

  return (
    <Text
      className={`${getSizeClass()} ${getColorClass()} ${className}`}
      style={[{ fontVariant: ['tabular-nums'], letterSpacing: size === 'display' ? -1 : -0.2 }, style]}
      {...props}
    >
      {getSign()}${formatted}
    </Text>
  );
};
