import React from 'react';
import { Pressable, Text, PressableProps, ActivityIndicator, View } from 'react-native';

interface ButtonProps extends PressableProps {
  title?: string;
  label?: string; // alias for title
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  label,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const buttonText = label ?? title ?? '';
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary active:bg-primary-pressed';
      case 'secondary':
        return 'bg-surface-alt border border-border active:bg-border/60';
      case 'danger':
        return 'bg-danger active:opacity-90';
      case 'ghost':
        return 'bg-transparent active:bg-surface-alt';
      default:
        return 'bg-primary active:bg-primary-pressed shadow-sm';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return 'text-surface';
      case 'secondary':
        return 'text-ink';
      case 'ghost':
        return 'text-ink-muted';
      default:
        return 'text-surface';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-10 px-3.5 rounded-md';
      case 'lg':
        return 'h-14 px-6 rounded-md';
      case 'md':
      default:
        return 'h-12 px-5 rounded-md';
    }
  };

  return (
    <Pressable
      className={`flex-row items-center justify-center ${getSizeStyles()} ${getVariantStyles()} ${
        disabled || loading ? 'opacity-50' : ''
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#151A2D' : '#FFFFFF'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-body-semibold text-sm ${getTextStyles()}`}>
            {buttonText}
          </Text>
        </>
      )}
    </Pressable>
  );
};
