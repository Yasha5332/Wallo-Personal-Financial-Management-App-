import React, { useRef } from 'react';
import { router } from 'expo-router';
import { CurrencySelectorModal } from '../../components/currency/CurrencySelectorModal';

export default function CurrencyShowcaseModal() {
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
      title="Select Currency"
      subtitle="Choose your currency to display balances and finances"
      onClose={handleDismiss}
      onSelect={handleDismiss}
    />
  );
}
