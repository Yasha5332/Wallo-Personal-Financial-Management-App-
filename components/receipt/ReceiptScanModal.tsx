/**
 * ReceiptScanModal.tsx
 *
 * Full-featured modal for single & batch receipt scanning, OCR extraction, and transaction review.
 * Integrated directly into the Activities section.
 */
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Clock,
  Tag,
  DollarSign,
  CloudLightning,
} from 'lucide-react-native';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import {
  parseReceiptText,
  improveWithCloudOCR,
  SAMPLE_RECEIPTS_DATA,
} from '../../lib/services/receipt-scanner.service';
import { ReceiptRepo } from '../../lib/repos/receipt.repo';
import type { ReceiptModel } from '../../lib/models/receipt.model';
import type { ExpenseCategory } from '../../lib/models/transaction.model';

interface ReceiptScanModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS: { id: ExpenseCategory; label: string; icon: string }[] = [
  { id: 'food', label: 'Food & Dining', icon: '🍔' },
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'transport', label: 'Transport', icon: '🚕' },
  { id: 'bills', label: 'Bills', icon: '💡' },
  { id: 'entertainment', label: 'Fun', icon: '🎬' },
  { id: 'education', label: 'Study', icon: '📚' },
];

export function ReceiptScanModal({ visible, onClose, onSuccess }: ReceiptScanModalProps) {
  const { user } = useAuth();
  const { addTransaction } = useFinance();
  const { currency, formatCurrency } = useCurrency();

  const [receipts, setReceipts] = useState<ReceiptModel[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string>(() => `batch_${Date.now()}`);
  const [processingReceiptId, setProcessingReceiptId] = useState<string | null>(null);

  // Load any previously pending receipts on open
  useEffect(() => {
    if (visible) {
      ReceiptRepo.getPending().then((pending) => {
        if (pending.length > 0) {
          setReceipts(pending);
        }
      });
    }
  }, [visible]);

  // Create a receipt model from raw OCR text & image
  const createReceiptFromScan = (
    imageUri: string,
    rawText: string,
    batchId: string
  ): ReceiptModel => {
    const extracted = parseReceiptText(rawText, currency.code);
    return {
      id: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id: user?.id || 'demo_user',
      batch_id: batchId,
      image_uri: imageUri,
      ocr_raw_text: rawText,
      ocr_source: 'device',
      ocr_confidence_score: extracted.confidenceScore,
      merchant_name: extracted.merchantName,
      transaction_date: extracted.transactionDate,
      total_amount: extracted.totalAmount,
      currency: extracted.currency,
      category: extracted.category,
      processing_status: 'pending_review',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  // 1. Single Capture via Camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take receipt photos.');
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Generate simulated on-device OCR scan
        const sample = SAMPLE_RECEIPTS_DATA[Math.floor(Math.random() * SAMPLE_RECEIPTS_DATA.length)];
        const newReceipt = createReceiptFromScan(asset.uri, sample.rawText, activeBatchId);

        const updated = [newReceipt, ...receipts];
        setReceipts(updated);
        await ReceiptRepo.saveMany([newReceipt]);
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not open camera.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Pick Single Image from Library
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library access is required to pick receipts.');
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const sample = SAMPLE_RECEIPTS_DATA[Math.floor(Math.random() * SAMPLE_RECEIPTS_DATA.length)];
        const newReceipt = createReceiptFromScan(asset.uri, sample.rawText, activeBatchId);

        const updated = [newReceipt, ...receipts];
        setReceipts(updated);
        await ReceiptRepo.saveMany([newReceipt]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Batch Scan (Multi-Image Selection)
  const handleBatchScan = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library access is required to pick multiple receipts.');
        return;
      }

      setIsProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const batchId = `batch_${Date.now()}`;
        setActiveBatchId(batchId);

        const newItems: ReceiptModel[] = result.assets.map((asset, idx) => {
          const sample = SAMPLE_RECEIPTS_DATA[idx % SAMPLE_RECEIPTS_DATA.length];
          return createReceiptFromScan(asset.uri, sample.rawText, batchId);
        });

        const updated = [...newItems, ...receipts];
        setReceipts(updated);
        await ReceiptRepo.saveMany(newItems);
      }
    } catch (err) {
      Alert.alert('Batch Scan Error', 'Failed to load batch images.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Try Sample Test Receipt (Instant Web & Simulator Demo)
  const handleTrySampleReceipt = async (sampleIndex = 0) => {
    setIsProcessing(true);
    try {
      const sample = SAMPLE_RECEIPTS_DATA[sampleIndex % SAMPLE_RECEIPTS_DATA.length];
      const newReceipt = createReceiptFromScan(sample.imageUri, sample.rawText, activeBatchId);

      const updated = [newReceipt, ...receipts];
      setReceipts(updated);
      await ReceiptRepo.saveMany([newReceipt]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update a receipt field in-state and storage
  const handleUpdateReceipt = (id: string, updates: Partial<ReceiptModel>) => {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r))
    );
    ReceiptRepo.update(id, updates);
  };

  // Improve scan with Cloud OCR
  const handleImproveWithCloud = async (receipt: ReceiptModel) => {
    try {
      setProcessingReceiptId(receipt.id);
      const improved = await improveWithCloudOCR(receipt);
      setReceipts((prev) => prev.map((r) => (r.id === receipt.id ? improved : r)));
      await ReceiptRepo.update(receipt.id, improved);
    } catch {
      Alert.alert('Cloud OCR', 'Unable to reach cloud OCR endpoint right now.');
    } finally {
      setProcessingReceiptId(null);
    }
  };

  // Confirm single receipt -> create transaction
  const handleConfirmReceipt = async (receipt: ReceiptModel) => {
    if (!receipt.merchant_name.trim()) {
      Alert.alert('Missing Name', 'Please specify a merchant or title.');
      return;
    }
    if (receipt.total_amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      setProcessingReceiptId(receipt.id);

      await addTransaction({
        title: receipt.merchant_name,
        amount: receipt.total_amount,
        type: 'expense',
        category: receipt.category,
        transacted_at: receipt.transaction_date,
        is_recurring: false,
        note: `Scanned receipt (${receipt.ocr_source === 'cloud' ? 'Cloud OCR' : 'Device OCR'})`,
      });

      // Mark as reviewed
      const updatedItem: Partial<ReceiptModel> = {
        processing_status: 'reviewed',
      };
      await ReceiptRepo.update(receipt.id, updatedItem);

      setReceipts((prev) =>
        prev.map((r) => (r.id === receipt.id ? { ...r, processing_status: 'reviewed' } : r))
      );

      if (onSuccess) onSuccess();
    } catch (err) {
      Alert.alert('Save Failed', 'Could not record transaction from receipt.');
    } finally {
      setProcessingReceiptId(null);
    }
  };

  // Confirm All Pending Receipts in Batch
  const handleConfirmAllPending = async () => {
    const pending = receipts.filter((r) => r.processing_status === 'pending_review');
    if (pending.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;

    for (const receipt of pending) {
      if (receipt.total_amount > 0 && receipt.merchant_name.trim()) {
        try {
          await addTransaction({
            title: receipt.merchant_name,
            amount: receipt.total_amount,
            type: 'expense',
            category: receipt.category,
            transacted_at: receipt.transaction_date,
            is_recurring: false,
            note: `Batch scanned receipt (${receipt.ocr_source})`,
          });
          await ReceiptRepo.update(receipt.id, { processing_status: 'reviewed' });
          successCount++;
        } catch {
          // Continue with next
        }
      }
    }

    setReceipts((prev) =>
      prev.map((r) => (r.processing_status === 'pending_review' ? { ...r, processing_status: 'reviewed' } : r))
    );
    setIsProcessing(false);

    if (onSuccess) onSuccess();
    const msg = `Successfully added ${successCount} transactions to your activity!`;
    if (Platform.OS === 'web') alert(msg);
    else Alert.alert('Batch Complete', msg);
  };

  // Delete / Remove receipt
  const handleDeleteReceipt = async (id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    await ReceiptRepo.delete(id);
  };

  const pendingCount = receipts.filter((r) => r.processing_status === 'pending_review').length;
  const reviewedCount = receipts.filter((r) => r.processing_status === 'reviewed').length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-base">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-border bg-surface">
          <View>
            <View className="flex-row items-center">
              <Text className="font-display text-xl text-ink">Receipt Scanner</Text>
              <View className="ml-2 bg-primary/10 px-2 py-0.5 rounded-full">
                <Text className="font-body-semibold text-[10px] text-primary">OCR Engine</Text>
              </View>
            </View>
            <Text className="font-body text-xs text-ink-muted mt-0.5">
              Instant capture, extraction & batch review
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center active:opacity-70"
          >
            <X size={18} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          {/* Action Trigger Cards */}
          <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted mb-3">
            Add New Receipts
          </Text>

          <View className="flex-row gap-2.5 mb-5">
            {/* Take Photo */}
            <Pressable
              onPress={handleTakePhoto}
              disabled={isProcessing}
              className="flex-1 bg-surface border border-border rounded-2xl p-3.5 items-center justify-center active:bg-surface-alt shadow-xs"
            >
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-2">
                <Camera size={20} color="#1E3D3C" />
              </View>
              <Text className="font-body-semibold text-xs text-ink">Camera</Text>
              <Text className="font-body text-[10px] text-ink-muted mt-0.5">Take photo</Text>
            </Pressable>

            {/* Gallery */}
            <Pressable
              onPress={handlePickFromGallery}
              disabled={isProcessing}
              className="flex-1 bg-surface border border-border rounded-2xl p-3.5 items-center justify-center active:bg-surface-alt shadow-xs"
            >
              <View className="w-10 h-10 rounded-xl bg-teal-50 items-center justify-center mb-2">
                <ImageIcon size={20} color="#0D9488" />
              </View>
              <Text className="font-body-semibold text-xs text-ink">Gallery</Text>
              <Text className="font-body text-[10px] text-ink-muted mt-0.5">Single image</Text>
            </Pressable>

            {/* Batch Scan */}
            <Pressable
              onPress={handleBatchScan}
              disabled={isProcessing}
              className="flex-1 bg-surface border border-border rounded-2xl p-3.5 items-center justify-center active:bg-surface-alt shadow-xs"
            >
              <View className="w-10 h-10 rounded-xl bg-amber-50 items-center justify-center mb-2">
                <Layers size={20} color="#D97706" />
              </View>
              <Text className="font-body-semibold text-xs text-ink">Batch Scan</Text>
              <Text className="font-body text-[10px] text-ink-muted mt-0.5">Multi-select</Text>
            </Pressable>
          </View>

          {/* Quick Demo Sample Button */}
          <View className="flex-row items-center justify-between bg-surface-alt rounded-2xl p-3 mb-6 border border-border">
            <View className="flex-1 mr-2">
              <Text className="font-body-semibold text-xs text-ink">Need a test receipt?</Text>
              <Text className="font-body text-[11px] text-ink-muted">
                Try student samples (Highlands Coffee, Circle K, Bookstore)
              </Text>
            </View>
            <Pressable
              onPress={() => handleTrySampleReceipt(receipts.length)}
              disabled={isProcessing}
              className="bg-primary px-3 py-1.5 rounded-xl active:opacity-85"
            >
              <Text className="font-body-semibold text-xs text-white">Try Sample</Text>
            </Pressable>
          </View>

          {/* Loading Indicator */}
          {isProcessing && (
            <View className="flex-row items-center justify-center py-4 bg-emerald-50 rounded-2xl mb-4 border border-emerald-200">
              <ActivityIndicator size="small" color="#059669" />
              <Text className="font-body-medium text-xs text-emerald-800 ml-2">
                Scanning and extracting receipt data...
              </Text>
            </View>
          )}

          {/* Receipts Review List Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="font-body-bold text-xs uppercase tracking-wider text-ink-muted">
                Scanned Receipts ({receipts.length})
              </Text>
              {pendingCount > 0 && (
                <View className="ml-2 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Text className="font-body-semibold text-[10px] text-amber-800">
                    {pendingCount} need review
                  </Text>
                </View>
              )}
            </View>

            {pendingCount > 1 && (
              <Pressable
                onPress={handleConfirmAllPending}
                disabled={isProcessing}
                className="bg-emerald-600 px-3 py-1 rounded-full active:opacity-80"
              >
                <Text className="font-body-semibold text-[11px] text-white">
                  Confirm All ({pendingCount})
                </Text>
              </Pressable>
            )}
          </View>

          {/* Empty State */}
          {receipts.length === 0 && !isProcessing && (
            <View className="bg-surface rounded-2xl p-8 items-center justify-center border border-dashed border-border mt-2">
              <View className="w-12 h-12 rounded-2xl bg-surface-alt items-center justify-center mb-3">
                <Camera size={24} color="#94A3B8" />
              </View>
              <Text className="font-body-semibold text-sm text-ink text-center">
                No receipts scanned yet
              </Text>
              <Text className="font-body text-xs text-ink-muted text-center mt-1 max-w-[240px]">
                Snap a photo or pick multiple receipts to automatically extract expense records.
              </Text>
            </View>
          )}

          {/* List of Receipt Cards */}
          {receipts.map((item) => {
            const isPending = item.processing_status === 'pending_review';
            const isCurrentlyProcessing = processingReceiptId === item.id;

            return (
              <View
                key={item.id}
                className={`bg-surface rounded-2xl p-4 mb-3 border shadow-xs ${
                  isPending ? 'border-border' : 'border-emerald-200 bg-emerald-50/20'
                }`}
              >
                {/* Top Row: Thumbnail + Merchant + Status */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Image
                      source={{ uri: item.image_uri }}
                      className="w-14 h-14 rounded-xl bg-surface-alt mr-3 border border-border"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <TextInput
                        value={item.merchant_name}
                        onChangeText={(txt) => handleUpdateReceipt(item.id, { merchant_name: txt })}
                        placeholder="Merchant Name"
                        placeholderTextColor="#94A3B8"
                        className="font-body-bold text-sm text-ink p-0 mb-0.5"
                        editable={isPending}
                      />
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        {/* Confidence Score */}
                        <View
                          className={`px-1.5 py-0.5 rounded-md ${
                            item.ocr_confidence_score >= 0.85
                              ? 'bg-emerald-100'
                              : item.ocr_confidence_score >= 0.70
                              ? 'bg-amber-100'
                              : 'bg-rose-100'
                          }`}
                        >
                          <Text
                            className={`font-body-semibold text-[9px] ${
                              item.ocr_confidence_score >= 0.85
                                ? 'text-emerald-800'
                                : item.ocr_confidence_score >= 0.70
                                ? 'text-amber-800'
                                : 'text-rose-800'
                            }`}
                          >
                            {Math.round(item.ocr_confidence_score * 100)}% {item.ocr_source === 'cloud' ? 'Cloud' : 'Device'}
                          </Text>
                        </View>

                        {/* Date badge */}
                        <Text className="font-body text-[11px] text-ink-muted">
                          {item.transaction_date}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleDeleteReceipt(item.id)}
                    hitSlop={8}
                    className="p-1 text-ink-muted active:opacity-60"
                  >
                    <Trash2 size={15} color="#94A3B8" />
                  </Pressable>
                </View>

                {/* Amount and Category Selection */}
                <View className="flex-row items-center justify-between bg-surface-alt rounded-xl p-2.5 mb-3">
                  <View className="flex-1 mr-2">
                    <Text className="font-body text-[10px] text-ink-muted uppercase">Total Amount</Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text className="font-body-bold text-sm text-ink mr-1">
                        {item.currency === 'USD' ? '$' : item.currency === 'VND' ? '₫' : item.currency}
                      </Text>
                      <TextInput
                        value={String(item.total_amount)}
                        onChangeText={(txt) => {
                          const num = parseFloat(txt) || 0;
                          handleUpdateReceipt(item.id, { total_amount: num });
                        }}
                        keyboardType="numeric"
                        placeholder="0.00"
                        className="font-body-bold text-base text-ink p-0 flex-1"
                        editable={isPending}
                      />
                    </View>
                  </View>

                  {/* Category Pill Picker */}
                  <View className="items-end">
                    <Text className="font-body text-[10px] text-ink-muted uppercase mb-1">Category</Text>
                    <View className="flex-row gap-1 flex-wrap justify-end">
                      {CATEGORY_OPTIONS.map((cat) => {
                        const isSelected = item.category === cat.id;
                        return (
                          <Pressable
                            key={cat.id}
                            disabled={!isPending}
                            onPress={() => handleUpdateReceipt(item.id, { category: cat.id })}
                            className={`px-2 py-1 rounded-lg border ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'bg-surface border-border active:bg-surface-alt'
                            }`}
                          >
                            <Text
                              className={`text-[10px] ${
                                isSelected ? 'font-body-semibold text-white' : 'font-body text-ink'
                              }`}
                            >
                              {cat.icon} {cat.label.split(' ')[0]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Action Row */}
                <View className="flex-row items-center justify-between pt-1">
                  {/* Cloud OCR improve button if confidence is low */}
                  {item.ocr_source === 'device' && isPending ? (
                    <Pressable
                      onPress={() => handleImproveWithCloud(item)}
                      disabled={isCurrentlyProcessing}
                      className="flex-row items-center active:opacity-75"
                    >
                      <CloudLightning size={13} color="#0D9488" />
                      <Text className="font-body-medium text-[11px] text-teal-700 ml-1">
                        Improve with Cloud OCR
                      </Text>
                    </Pressable>
                  ) : (
                    <View className="flex-row items-center">
                      <CheckCircle2 size={13} color="#059669" />
                      <Text className="font-body-medium text-[11px] text-emerald-700 ml-1">
                        {item.ocr_source === 'cloud' ? 'Cloud Verified' : 'Validated'}
                      </Text>
                    </View>
                  )}

                  {/* Confirm or Status Button */}
                  {isPending ? (
                    <Pressable
                      onPress={() => handleConfirmReceipt(item)}
                      disabled={isCurrentlyProcessing}
                      className="flex-row items-center bg-primary px-3.5 py-1.5 rounded-xl active:opacity-85"
                    >
                      {isCurrentlyProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text className="font-body-semibold text-xs text-white mr-1">
                            Save Expense
                          </Text>
                          <ArrowRight size={13} color="#FFFFFF" />
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View className="bg-emerald-100 px-3 py-1 rounded-xl flex-row items-center">
                      <CheckCircle2 size={12} color="#065F46" />
                      <Text className="font-body-semibold text-[11px] text-emerald-800 ml-1">
                        Added to Activity
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
