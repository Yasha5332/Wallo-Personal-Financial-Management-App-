import React from 'react';
import { Text, TextProps } from 'react-native';
import { useCurrency } from '../../context/CurrencyContext';

export interface AmountTextProps extends TextProps {
  amount: number;
  type?: 'expense' | 'income' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'display';
  showSign?: boolean;
  compact?: boolean;
  currencyCode?: string;
  fromCurrency?: string;
  skipConversion?: boolean;
  className?: string;
}

export const AmountText: React.FC<AmountTextProps> = ({
  amount,
  type = 'neutral',
  size = 'md',
  showSign = false,
  compact = false,
  currencyCode,
  fromCurrency,
  skipConversion = false,
  className = '',
  style,
  ...props
}) => {
  const { formatCurrency } = useCurrency();

  const formatted = formatCurrency(amount, {
    showSign,
    type,
    compact,
    fromCurrency,
    toCurrency: currencyCode,
    skipConversion,
  });

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
      {formatted}
    </Text>
  );
};
