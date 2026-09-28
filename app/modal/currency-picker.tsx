import React, { useRef } from 'react';
import { router } from 'expo-router';
import { CurrencySelectorModal } from '../../components/currency/CurrencySelectorModal';

export default function CurrencyPickerModal() {
  const isDismissing = useRef(false);

  const handleDismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <CurrencySelectorModal
      onClose={handleDismiss}
      onSelect={handleDismiss}
    />
  );
}
