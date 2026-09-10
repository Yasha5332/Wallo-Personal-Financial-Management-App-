import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  variant?: 'flat' | 'highlight' | 'alt';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'flat',
  className = '',
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'highlight':
        return 'bg-surface border border-accent/30';
      case 'alt':
        return 'bg-surface-alt border border-border/80';
      case 'flat':
      default:
        return 'bg-surface border border-border/70';
    }
  };

  return (
    <View
      className={`rounded-3xl p-5 ${getVariantStyles()} ${className}`}
      style={[
        {
          shadowColor: '#151A2D',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
