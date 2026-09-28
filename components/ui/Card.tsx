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
      className={`rounded-lg p-4 ${getVariantStyles()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};
