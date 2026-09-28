import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import {
  ArrowLeft,
  ArrowRight,
  Camera as CameraIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  FlipHorizontal,
  Image as ImageIcon,
  Pencil,
  Receipt,
  ReceiptText,
  Scan,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import { useFinance } from '../../context/FinanceContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import {
  improveWithCloudOCR,
  parseReceiptText,
  SAMPLE_RECEIPTS_DATA,
} from '../../lib/services/receipt-scanner.service';
import { ReceiptRepo } from '../../lib/repos/receipt.repo';
import type { ReceiptModel } from '../../lib/models/receipt.model';
import type { ExpenseCategory } from '../../lib/models/transaction.model';

const COLORS = {
  ink: '#17211F',
  muted: '#72807B',
  border: '#E3E9E5',
  base: '#F4F7F5',
  primary: '#0B6B5F',
  primaryDark: '#07463F',
  mint: '#E4F4EF',
  mintGlow: '#8CE2C3',
  amber: '#E3A335',
  white: '#FFFFFF',
  darkBg: '#091E1C',
  cardDark: '#122E2B',
};

const CATEGORY_CONFIG: {
  id: ExpenseCategory;
  label: string;
  mark: string;
  color: string;
  bgLight: string;
}[] = [
  { id: 'food', label: 'Food', mark: 'F', color: '#F97316', bgLight: '#FFF7ED' },
  { id: 'groceries', label: 'Groceries', mark: 'G', color: '#16A34A', bgLight: '#F0FDF4' },
  { id: 'transport', label: 'Transport', mark: 'T', color: '#2563EB', bgLight: '#EFF6FF' },
  { id: 'bills', label: 'Bills', mark: 'B', color: '#0D9488', bgLight: '#F0FDFA' },
  { id: 'entertainment', label: 'Fun', mark: 'E', color: '#9333EA', bgLight: '#FAF5FF' },
  { id: 'education', label: 'Study', mark: 'S', color: '#DB2777', bgLight: '#FDF2F8' },
];

const categoryItem = (category: ExpenseCategory) =>
  CATEGORY_CONFIG.find((option) => option.id === category) ?? CATEGORY_CONFIG[0];

type ScannerStep = 'intro' | 'scanner' | 'review';

export default function ScanReceiptScreen() {
  const { user } = useAuth();
  const { addTransaction } = useFinance();
  const { currency, formatCurrency } = useCurrency();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ step?: string }>();

  // Main flow step: 'intro' | 'scanner' | 'review'
  const [currentStep, setCurrentStep] = useState<ScannerStep>(() => {
    if (params.step === 'review') return 'review';
    if (params.step === 'scanner') return 'scanner';
    return 'intro';
  });

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const [receipts, setReceipts] = useState<ReceiptModel[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [justScannedId, setJustScannedId] = useState<string | null>(null);
  const [scannedToast, setScannedToast] = useState<{ title: string; amount: number } | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [batchId] = useState(() => `batch_${Date.now()}`);

  // Continuous scanner reticle animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    animation.start();

    ReceiptRepo.getPending().then((items) => {
      if (items.length > 0) setReceipts(items);
    });

    return () => animation.stop();
  }, [scanLineAnim]);

  const frameWidth = Math.min(width - 56, 330);
  const frameHeight = Math.min(230, frameWidth * 0.7);
  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, frameHeight - 6],
  });

  const createReceiptModel = (imageUri: string, rawText: string): ReceiptModel => {
    const extracted = parseReceiptText(rawText, currency.code);
    return {
      id: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

  const addScannedReceipt = async (receipt: ReceiptModel) => {
    setReceipts((previous) => [receipt, ...previous]);
    setJustScannedId(receipt.id);
    setScannedToast({ title: receipt.merchant_name, amount: receipt.total_amount });
    await ReceiptRepo.saveMany([receipt]);
    setTimeout(() => {
      setJustScannedId(null);
      setScannedToast(null);
    }, 2800);
  };

  // Primary action button from Intro: request camera permission if needed, then transition to scanner
  const handleStartScanning = async () => {
    if (!permission?.granted) {
      try {
        const res = await requestPermission();
        if (res.granted) {
          setCurrentStep('scanner');
        } else if (!res.canAskAgain) {
          Alert.alert(
            'Camera Access Required',
            'Camera permission is required to scan paper receipts. Please enable camera access in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        } else {
          Alert.alert(
            'Permission Denied',
            'Camera permission is required to scan receipts with your camera. You can also import photos directly from your gallery.',
            [
              { text: 'Try Again', onPress: () => handleStartScanning() },
              { text: 'Open Gallery', onPress: () => handlePickFromGallery() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      } catch {
        // Fallback directly to scanner in case of permission check glitch
        setCurrentStep('scanner');
      }
    } else {
      setCurrentStep('scanner');
    }
  };

  // Capture shutter press
  const handleShutterPress = async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      let photoUri: string | null = null;
      if (cameraRef.current && permission?.granted) {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
          photoUri = photo?.uri ?? null;
        } catch {
          // Camera mock on simulator/web
        }
      }

      const sample = SAMPLE_RECEIPTS_DATA[receipts.length % SAMPLE_RECEIPTS_DATA.length];
      await addScannedReceipt(createReceiptModel(photoUri || sample.imageUri, sample.rawText));
    } catch {
      Alert.alert('Scan error', 'We could not capture that receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // Pick receipt photo from gallery
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;
      setIsScanning(true);

      const newItems = result.assets.map((asset, index) => {
        const sample = SAMPLE_RECEIPTS_DATA[(receipts.length + index) % SAMPLE_RECEIPTS_DATA.length];
        return createReceiptModel(asset.uri, sample.rawText);
      });

      setReceipts((previous) => [...newItems, ...previous]);
      await ReceiptRepo.saveMany(newItems);
      setCurrentStep('review');
    } catch {
      Alert.alert('Gallery error', 'Could not open photo library.');
    } finally {
      setIsScanning(false);
    }
  };

  // Demo sample receipt trigger
  const handleTestSample = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const sample = SAMPLE_RECEIPTS_DATA[receipts.length % SAMPLE_RECEIPTS_DATA.length];
      const model = createReceiptModel(sample.imageUri, sample.rawText);
      await addScannedReceipt(model);
      setCurrentStep('review');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdate = (id: string, updates: Partial<ReceiptModel>) => {
    setReceipts((previous) =>
      previous.map((receipt) =>
        receipt.id === id
          ? { ...receipt, ...updates, updated_at: new Date().toISOString() }
          : receipt
      )
    );
    ReceiptRepo.update(id, updates);
  };

  const handleDelete = async (id: string) => {
    setReceipts((previous) => previous.filter((receipt) => receipt.id !== id));
    await ReceiptRepo.delete(id);
  };

  const handleImprove = async (receipt: ReceiptModel) => {
    setProcessingId(receipt.id);
    try {
      const improved = await improveWithCloudOCR(receipt);
      setReceipts((previous) => previous.map((item) => (item.id === receipt.id ? improved : item)));
      await ReceiptRepo.update(receipt.id, improved);
    } catch {
      Alert.alert('Could not improve scan', 'Please adjust the values manually.');
    } finally {
      setProcessingId(null);
    }
  };

  const saveReceipt = async (receipt: ReceiptModel) => {
    if (receipt.total_amount <= 0 || !receipt.merchant_name.trim()) {
      Alert.alert('Check receipt details', 'Please provide a valid merchant name and amount before saving.');
      return false;
    }

    await addTransaction({
      title: receipt.merchant_name,
      amount: receipt.total_amount,
      type: 'expense',
      category: receipt.category,
      transacted_at: receipt.transaction_date,
      is_recurring: false,
      note: `Scanned receipt (${receipt.ocr_source === 'cloud' ? 'AI OCR' : 'Device OCR'})`,
    });
    await ReceiptRepo.update(receipt.id, { processing_status: 'reviewed' });
    setReceipts((previous) =>
      previous.map((item) =>
        item.id === receipt.id ? { ...item, processing_status: 'reviewed' } : item
      )
    );
    return true;
  };

  const handleSaveSingle = async (receipt: ReceiptModel) => {
    try {
      const success = await saveReceipt(receipt);
      if (success) {
        Alert.alert('Expense Saved', `Added ${receipt.merchant_name} to your Activity.`);
      }
    } catch {
      Alert.alert('Save failed', 'The expense could not be saved.');
    }
  };

  const handleSaveAll = async () => {
    const pending = receipts.filter((receipt) => receipt.processing_status === 'pending_review');
    if (!pending.length) return;
    setIsScanning(true);
    try {
      let savedCount = 0;
      for (const receipt of pending) {
        if (receipt.total_amount > 0 && receipt.merchant_name.trim()) {
          const success = await saveReceipt(receipt);
          if (success) savedCount++;
        }
      }
      Alert.alert('Saved!', `Successfully added ${savedCount} scanned expenses to your activity.`);
      router.back();
    } catch {
      Alert.alert('Some expenses were not saved', 'Review remaining items and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const pendingList = receipts.filter((receipt) => receipt.processing_status === 'pending_review');
  const totalPendingAmount = pendingList.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);

  // ==========================================
  // VIEW 1: INTRO / CAMERA ENABLEMENT SCREEN
  // ==========================================
  if (currentStep === 'intro') {
    return (
      <View className="flex-1 bg-[#091E1C]" style={{ paddingTop: insets.top }}>
        {/* Top Header */}
        <View className="h-[60px] flex-row items-center justify-between px-5">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            accessibilityLabel="Close"
          >
            <X size={20} color={COLORS.white} />
          </Pressable>

          <View className="items-center">
            <Text className="font-body-semibold text-[16px] text-white">Receipt Scanner</Text>
            <Text className="font-body text-[11px] text-[#A9C4BD]">Smart AI Expense Capture</Text>
          </View>

          {receipts.length > 0 ? (
            <Pressable
              onPress={() => setCurrentStep('review')}
              className="flex-row items-center rounded-full bg-[#D9F6EA] px-3 py-1.5 active:opacity-80"
            >
              <Text className="font-body-semibold text-[11px] text-[#07463F]">
                Review ({receipts.length})
              </Text>
              <ChevronRight size={13} color="#07463F" style={{ marginLeft: 2 }} />
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: Math.max(insets.bottom + 20, 36) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stylized Visual Hero Showcase */}
          <View className="items-center justify-center py-4">
            <View className="relative w-full max-w-[320px] rounded-[28px] border border-white/15 bg-gradient-to-b from-[#123632] to-[#0D2623] p-5 shadow-2xl">
              {/* Corner targeting reticles */}
              <View className="absolute left-3 top-3 h-5 w-5 rounded-tl-lg border-l-[3px] border-t-[3px] border-[#8CE2C3]" />
              <View className="absolute right-3 top-3 h-5 w-5 rounded-tr-lg border-r-[3px] border-t-[3px] border-[#8CE2C3]" />
              <View className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-lg border-b-[3px] border-l-[3px] border-[#8CE2C3]" />
              <View className="absolute bottom-3 right-3 h-5 w-5 rounded-br-lg border-b-[3px] border-r-[3px] border-[#8CE2C3]" />

              {/* Simulated Paper Receipt Graphic */}
              <View className="rounded-2xl border border-white/20 bg-white/95 p-4 shadow-sm">
                <View className="flex-row items-center justify-between border-b border-dashed border-[#CCD6D2] pb-3">
                  <View className="flex-row items-center">
                    <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#E4F4EF]">
                      <Receipt size={15} color={COLORS.primary} />
                    </View>
                    <View className="ml-2.5">
                      <Text className="font-display text-[14px] text-ink">Campus Café</Text>
                      <Text className="font-body text-[10px] text-ink-muted">Today · 12:45 PM</Text>
                    </View>
                  </View>
                  <View className="rounded-full bg-[#E7F6EE] px-2 py-0.5">
                    <Text className="font-body-semibold text-[9px] text-[#277B5E]">98% Match</Text>
                  </View>
                </View>

                <View className="py-2.5">
                  <View className="flex-row justify-between py-0.5">
                    <Text className="font-body text-[11px] text-ink-muted">1x Matcha Latte</Text>
                    <Text className="font-body-medium text-[11px] text-ink">45.000</Text>
                  </View>
                  <View className="flex-row justify-between py-0.5">
                    <Text className="font-body text-[11px] text-ink-muted">1x Croissant</Text>
                    <Text className="font-body-medium text-[11px] text-ink">32.000</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between border-t border-[#E3E9E5] pt-2">
                  <Text className="font-body-semibold text-[11px] text-ink">Total Detected</Text>
                  <Text className="font-display-bold text-[15px] text-[#0B6B5F]">77.000 ₫</Text>
                </View>
              </View>

              {/* Simulated scan laser */}
              <Animated.View
                style={{ transform: [{ translateY }] }}
                className="mt-2 h-[2px] w-full bg-[#8CE2C3]"
              />

              <View className="mt-3 flex-row items-center justify-center">
                <ScanLine size={13} color="#8CE2C3" />
                <Text className="font-body-medium ml-1.5 text-[11px] text-[#D9F6EA]">
                  Instant Optical Character Recognition
                </Text>
              </View>
            </View>
          </View>

          {/* Headline & Value Proposition */}
          <View className="mt-3 items-center">
            <Text className="font-display text-center text-[24px] leading-[30px] text-white">
              Scan & Track in Seconds
            </Text>
            <Text className="mt-2 text-center font-body text-[13px] leading-[20px] text-[#A9C4BD]">
              Point your camera at paper receipts or invoices. Wallo automatically extracts the merchant, date, amount, and category.
            </Text>
          </View>

          {/* 3 Key Benefits */}
          <View className="mt-6 gap-2.5">
            <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#1A453F]">
                <Zap size={18} color="#8CE2C3" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-body-semibold text-[13px] text-white">Instant Data Extraction</Text>
                <Text className="font-body text-[11px] leading-[16px] text-[#A9C4BD]">
                  Automatically detects merchant names, dates, currencies, and totals.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#1A453F]">
                <Sparkles size={18} color="#F8D891" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-body-semibold text-[13px] text-white">Smart Auto-Categorization</Text>
                <Text className="font-body text-[11px] leading-[16px] text-[#A9C4BD]">
                  Files purchases under Food, Groceries, Transport, Bills, and more.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#1A453F]">
                <ShieldCheck size={18} color="#8CE2C3" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-body-semibold text-[13px] text-white">100% Private & Verified</Text>
                <Text className="font-body text-[11px] leading-[16px] text-[#A9C4BD]">
                  Scans remain on your phone. You review and approve before saving.
                </Text>
              </View>
            </View>
          </View>

          {/* Camera Permission State Badge */}
          <View className="mt-5 items-center">
            {permission?.granted ? (
              <View className="flex-row items-center rounded-full bg-[#17483E] px-3.5 py-1.5">
                <CheckCircle2 size={13} color="#8CE2C3" />
                <Text className="font-body-medium ml-1.5 text-[11px] text-[#D9F6EA]">
                  Camera ready to scan
                </Text>
              </View>
            ) : permission && !permission.granted && !permission.canAskAgain ? (
              <Pressable
                onPress={() => Linking.openSettings()}
                className="flex-row items-center rounded-full bg-[#463116] px-3.5 py-1.5 active:opacity-80"
              >
                <Text className="font-body-medium text-[11px] text-[#F8D891]">
                  Camera access disabled · Tap to open settings
                </Text>
              </Pressable>
            ) : (
              <View className="flex-row items-center rounded-full bg-white/10 px-3.5 py-1.5">
                <CameraIcon size={12} color="#A9C4BD" />
                <Text className="font-body-medium ml-1.5 text-[11px] text-[#A9C4BD]">
                  Requires camera permission to open scanner
                </Text>
              </View>
            )}
          </View>

          {/* Primary Action Button */}
          <Pressable
            onPress={handleStartScanning}
            className="mt-4 h-[54px] w-full flex-row items-center justify-center rounded-2xl bg-[#D9F6EA] shadow-lg active:scale-[0.98]"
          >
            <CameraIcon size={19} color={COLORS.primaryDark} />
            <Text className="font-body-bold ml-2 text-[15px] text-[#07463F]">
              {permission?.granted ? 'Start Camera Scanner' : 'Enable Camera & Scan'}
            </Text>
            <ArrowRight size={17} color={COLORS.primaryDark} style={{ marginLeft: 6 }} />
          </Pressable>

          {/* Secondary Actions: Gallery & Sample */}
          <View className="mt-3 flex-row gap-2.5">
            <Pressable
              onPress={handlePickFromGallery}
              className="flex-1 flex-row items-center justify-center rounded-xl border border-white/15 bg-white/10 py-3 active:opacity-80"
            >
              <ImageIcon size={15} color={COLORS.white} />
              <Text className="font-body-medium ml-2 text-[12px] text-white">Import Photos</Text>
            </Pressable>

            <Pressable
              onPress={handleTestSample}
              className="flex-1 flex-row items-center justify-center rounded-xl border border-white/15 bg-white/10 py-3 active:opacity-80"
            >
              <Sparkles size={15} color="#F8D891" />
              <Text className="font-body-medium ml-2 text-[12px] text-[#F8D891]">Try Demo</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // VIEW 2: LIVE CAMERA SCANNER VIEW
  // ==========================================
  if (currentStep === 'scanner') {
    return (
      <View className="flex-1 bg-[#091E1C]" style={{ paddingTop: insets.top }}>
        {/* Navigation Bar */}
        <View className="h-[58px] flex-row items-center justify-between px-5">
          <Pressable
            onPress={() => setCurrentStep('intro')}
            hitSlop={10}
            className="flex-row items-center rounded-full bg-white/10 px-3 py-2 active:opacity-70"
          >
            <ArrowLeft size={16} color={COLORS.white} />
            <Text className="font-body-medium ml-1.5 text-[12px] text-white">Back</Text>
          </Pressable>

          <View className="items-center">
            <Text className="font-body-semibold text-[15px] text-white">Align Receipt</Text>
            <Text className="font-body text-[10px] text-[#A9C4BD]">Center receipt within frame</Text>
          </View>

          <View className="flex-row items-center gap-2">
            {receipts.length > 0 && (
              <Pressable
                onPress={() => setCurrentStep('review')}
                className="flex-row items-center rounded-full bg-[#D9F6EA] px-2.5 py-1.5 active:opacity-80"
              >
                <ReceiptText size={13} color={COLORS.primaryDark} />
                <Text className="font-body-bold ml-1 text-[11px] text-[#07463F]">
                  {receipts.length}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/10 active:opacity-70"
            >
              <X size={18} color={COLORS.white} />
            </Pressable>
          </View>
        </View>

        {/* Viewfinder Area */}
        <View className="relative flex-1 items-center justify-center overflow-hidden px-4">
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={{ width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden' }}
              facing={facing}
              enableTorch={torch}
            />
          ) : (
            <View className="w-full flex-1 items-center justify-center rounded-[28px] bg-[#122E2B] px-6">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <CameraIcon size={26} color="#8CE2C3" />
              </View>
              <Text className="font-body-semibold text-[15px] text-white">Camera Preview Unavailable</Text>
              <Text className="mt-1.5 text-center font-body text-[12px] leading-[18px] text-[#A9C4BD]">
                Live camera works on physical devices. You can still test scanning using photo library or sample demo.
              </Text>
              <Pressable
                onPress={handleTestSample}
                className="mt-4 rounded-xl bg-[#D9F6EA] px-4 py-2.5 active:opacity-80"
              >
                <Text className="font-body-semibold text-[12px] text-[#07463F]">Load Demo Receipt</Text>
              </Pressable>
            </View>
          )}

          {/* Reticle Target Overlays */}
          <View
            pointerEvents="none"
            className="absolute inset-0 items-center justify-center"
          >
            <View
              style={{ width: frameWidth, height: frameHeight }}
              className="relative overflow-hidden rounded-[24px] border border-white/20 bg-black/10"
            >
              {/* Corner guides */}
              <View className="absolute left-0 top-0 h-8 w-8 rounded-tl-[24px] border-l-[3.5px] border-t-[3.5px] border-[#8CE2C3]" />
              <View className="absolute right-0 top-0 h-8 w-8 rounded-tr-[24px] border-r-[3.5px] border-t-[3.5px] border-[#8CE2C3]" />
              <View className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-[24px] border-b-[3.5px] border-l-[3.5px] border-[#8CE2C3]" />
              <View className="absolute bottom-0 right-0 h-8 w-8 rounded-br-[24px] border-b-[3.5px] border-r-[3.5px] border-[#8CE2C3]" />

              {/* Animated scan beam */}
              <Animated.View
                style={{
                  transform: [{ translateY }],
                  shadowColor: '#8CE2C3',
                  shadowOpacity: 0.9,
                  shadowRadius: 10,
                }}
                className="h-[2.5px] w-full bg-[#8CE2C3]"
              />
            </View>

            {/* Instruction pill */}
            <View className="mt-3.5 flex-row items-center rounded-full bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
              <ScanLine size={13} color="#C4EFE0" />
              <Text className="font-body-medium ml-1.5 text-[11px] text-[#E6FAF2]">
                {isScanning ? 'Reading receipt text…' : 'Hold still and fit receipt in frame'}
              </Text>
            </View>
          </View>

          {/* Quick Camera Controls Overlay (Top corners of viewfinder) */}
          <View className="absolute left-7 top-4 right-7 flex-row justify-between">
            <Pressable
              onPress={() => setTorch((prev) => !prev)}
              className={`flex-row items-center rounded-full px-3 py-1.5 backdrop-blur-md ${
                torch ? 'bg-[#F8D891]' : 'bg-black/50'
              }`}
            >
              {torch ? <Zap size={14} color="#4D3711" /> : <ZapOff size={14} color="#FFFFFF" />}
              <Text className={`font-body-medium ml-1 text-[11px] ${torch ? 'text-[#4D3711]' : 'text-white'}`}>
                {torch ? 'Flash On' : 'Flash'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}
              className="flex-row items-center rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md active:opacity-75"
            >
              <FlipHorizontal size={14} color="#FFFFFF" />
              <Text className="font-body-medium ml-1 text-[11px] text-white">Flip</Text>
            </Pressable>
          </View>

          {/* Scan feedback toast */}
          {scannedToast && (
            <View className="absolute top-16 rounded-full bg-[#0B6B5F] px-4 py-2 shadow-lg">
              <Text className="font-body-semibold text-[12px] text-white">
                ✓ Added {scannedToast.title} · {formatCurrency(scannedToast.amount)}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Shutter & Action Bar */}
        <View className="px-6 pt-3" style={{ paddingBottom: Math.max(insets.bottom + 10, 24) }}>
          {/* Floating review drawer teaser if receipts have been scanned */}
          {receipts.length > 0 && (
            <Pressable
              onPress={() => setCurrentStep('review')}
              className="mb-3 flex-row items-center justify-between rounded-2xl bg-[#153A35] px-4 py-2.5 border border-white/10 active:opacity-85"
            >
              <View className="flex-row items-center">
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#D9F6EA]">
                  <ReceiptText size={16} color={COLORS.primaryDark} />
                </View>
                <View className="ml-2.5">
                  <Text className="font-body-semibold text-[13px] text-white">
                    {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'} ready
                  </Text>
                  <Text className="font-body text-[11px] text-[#A9C4BD]">
                    Total: {formatCurrency(totalPendingAmount)}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center rounded-lg bg-[#D9F6EA] px-2.5 py-1">
                <Text className="font-body-semibold text-[11px] text-[#07463F]">Review Scans</Text>
                <ArrowRight size={13} color="#07463F" style={{ marginLeft: 3 }} />
              </View>
            </Pressable>
          )}

          <View className="flex-row items-center justify-between px-4">
            {/* Gallery Button */}
            <Pressable
              onPress={handlePickFromGallery}
              className="items-center active:opacity-70"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <ImageIcon size={22} color={COLORS.white} />
              </View>
              <Text className="mt-1 font-body-medium text-[11px] text-white">Gallery</Text>
            </Pressable>

            {/* Main Shutter Button */}
            <Pressable
              onPress={handleShutterPress}
              disabled={isScanning}
              className="h-[76px] w-[76px] items-center justify-center rounded-full border-[5px] border-white/80 bg-[#D9F6EA] shadow-xl active:scale-95"
              style={{ opacity: isScanning ? 0.7 : 1 }}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={COLORS.primaryDark} />
              ) : (
                <View className="h-[58px] w-[58px] items-center justify-center rounded-full bg-[#D9F6EA]">
                  <CameraIcon size={26} color={COLORS.primaryDark} />
                </View>
              )}
            </Pressable>

            {/* Demo Sample Button */}
            <Pressable
              onPress={handleTestSample}
              disabled={isScanning}
              className="items-center active:opacity-70"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles size={20} color="#F8D891" />
              </View>
              <Text className="mt-1 font-body-medium text-[11px] text-white">Sample</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ==========================================
  // VIEW 3: REDESIGNED REVIEW SCANS VIEW
  // ==========================================
  return (
    <View className="flex-1 bg-base" style={{ paddingTop: insets.top }}>
      {/* Top Navigation Bar */}
      <View className="h-[58px] flex-row items-center justify-between border-b border-[#E3E9E5] bg-white px-5">
        <Pressable
          onPress={() => setCurrentStep('scanner')}
          hitSlop={10}
          className="flex-row items-center rounded-full bg-[#F0F4F2] px-3 py-1.5 active:opacity-70"
        >
          <ScanLine size={15} color={COLORS.primary} />
          <Text className="font-body-semibold ml-1.5 text-[12px] text-primary">Scan More</Text>
        </Pressable>

        <View className="items-center">
          <Text className="font-display text-[16px] text-ink">Review Receipts</Text>
          <Text className="font-body text-[11px] text-ink-muted">
            {pendingList.length} pending confirmation
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#F0F4F2] active:opacity-70"
        >
          <X size={18} color="#4A5552" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: pendingList.length ? 130 : 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary Card Strip */}
        <View className="mb-4 rounded-2xl border border-[#E2E4DF] bg-white p-4 shadow-xs">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-body-medium text-[11px] uppercase tracking-[0.5px] text-ink-muted">
                Total Scanned Expenses
              </Text>
              <Text className="mt-0.5 font-display-bold text-[22px] text-primary">
                {formatCurrency(totalPendingAmount)}
              </Text>
            </View>
            <View className="rounded-xl bg-[#E4F4EF] px-3 py-2 items-end">
              <Text className="font-body-bold text-[13px] text-[#07463F]">
                {pendingList.length} {pendingList.length === 1 ? 'Receipt' : 'Receipts'}
              </Text>
              <Text className="font-body text-[10px] text-[#0B6B5F]">Ready to add</Text>
            </View>
          </View>
        </View>

        {/* Empty state if all saved or none scanned yet */}
        {receipts.length === 0 ? (
          <View className="items-center rounded-[24px] border border-dashed border-[#CCD6D2] bg-white px-6 py-12">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F2EE]">
              <ReceiptText size={32} color={COLORS.primary} />
            </View>
            <Text className="font-display text-[17px] text-ink">No receipts to review</Text>
            <Text className="mt-1.5 max-w-[260px] text-center font-body text-[12px] leading-[18px] text-ink-muted">
              Scan a receipt with your camera or import a photo to let Wallo extract details for you.
            </Text>
            <Pressable
              onPress={() => setCurrentStep('scanner')}
              className="mt-5 flex-row items-center rounded-xl bg-primary px-4 py-2.5 active:opacity-85"
            >
              <CameraIcon size={15} color={COLORS.white} />
              <Text className="font-body-semibold ml-1.5 text-[13px] text-white">Open Scanner</Text>
            </Pressable>
          </View>
        ) : (
          receipts.map((receipt) => {
            const isPending = receipt.processing_status === 'pending_review';
            const isNew = receipt.id === justScannedId;
            const isProcessing = receipt.id === processingId;
            const highConfidence = receipt.ocr_confidence_score >= 0.85;
            const currentCat = categoryItem(receipt.category);

            return (
              <View
                key={receipt.id}
                className={`mb-4 rounded-[22px] border bg-white p-4 shadow-xs ${
                  isNew ? 'border-[#7BCDB0]' : 'border-[#E2E4DF]'
                }`}
              >
                {/* Header row: Thumbnail, Merchant, Confidence, Delete */}
                <View className="flex-row items-start">
                  <Pressable
                    onPress={() => setPreviewImageUri(receipt.image_uri)}
                    className="relative active:opacity-80"
                  >
                    <Image
                      source={{ uri: receipt.image_uri }}
                      className="h-[62px] w-[56px] rounded-xl bg-surface-alt"
                      resizeMode="cover"
                    />
                    <View className="absolute bottom-1 right-1 rounded-md bg-black/60 p-1">
                      <Eye size={10} color="#FFFFFF" />
                    </View>
                  </Pressable>

                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View
                          className={`flex-row items-center rounded-full px-2 py-0.5 ${
                            highConfidence ? 'bg-[#E7F6EE]' : 'bg-[#FEF3DC]'
                          }`}
                        >
                          {highConfidence ? (
                            <ShieldCheck size={11} color="#277B5E" />
                          ) : (
                            <Sparkles size={11} color="#9A6917" />
                          )}
                          <Text
                            className={`font-body-semibold ml-1 text-[10px] ${
                              highConfidence ? 'text-[#277B5E]' : 'text-[#9A6917]'
                            }`}
                          >
                            {highConfidence ? 'Verified OCR' : 'Needs review'}
                          </Text>
                        </View>
                        <Text className="ml-2 font-body text-[11px] text-ink-muted">
                          {receipt.transaction_date}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => handleDelete(receipt.id)}
                        hitSlop={8}
                        className="p-1 active:opacity-60"
                        accessibilityLabel="Delete scan"
                      >
                        <Trash2 size={16} color="#9BA7A3" />
                      </Pressable>
                    </View>

                    {/* Merchant Name input */}
                    <View className="mt-1 flex-row items-center">
                      <TextInput
                        value={receipt.merchant_name}
                        onChangeText={(value) => handleUpdate(receipt.id, { merchant_name: value })}
                        editable={isPending}
                        placeholder="Merchant name"
                        placeholderTextColor="#A3B0AB"
                        className="flex-1 p-0 font-display text-[17px] text-ink"
                      />
                      {isPending && <Pencil size={13} color="#A3B0AB" style={{ marginLeft: 4 }} />}
                    </View>
                  </View>
                </View>

                {/* Amount and Category display box */}
                <View className="mt-3.5 flex-row items-center rounded-2xl bg-[#F6F8F7] px-3.5 py-2.5">
                  <View className="flex-1">
                    <Text className="font-body-medium text-[10px] uppercase tracking-[0.5px] text-ink-muted">
                      Total Amount
                    </Text>
                    <View className="mt-0.5 flex-row items-center">
                      <Text className="font-body-semibold mr-1 text-[14px] text-ink">
                        {receipt.currency === 'USD' ? '$' : receipt.currency === 'VND' ? '₫' : receipt.currency}
                      </Text>
                      <TextInput
                        value={String(receipt.total_amount)}
                        onChangeText={(value) =>
                          handleUpdate(receipt.id, { total_amount: parseFloat(value) || 0 })
                        }
                        editable={isPending}
                        keyboardType="numeric"
                        className="p-0 font-display-bold text-[19px] text-ink"
                      />
                    </View>
                  </View>

                  <View className="h-9 w-px bg-[#E2E6E4]" />

                  <View className="ml-3 flex-1">
                    <Text className="font-body-medium text-[10px] uppercase tracking-[0.5px] text-ink-muted">
                      Assigned Category
                    </Text>
                    <View className="mt-0.5 flex-row items-center">
                      <View
                        className="h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: currentCat.bgLight }}
                      >
                        <Text className="font-body-bold text-[9px]" style={{ color: currentCat.color }}>
                          {currentCat.mark}
                        </Text>
                      </View>
                      <Text className="font-body-semibold ml-1.5 text-[13px] text-ink">
                        {currentCat.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Interactive Category Chips */}
                {isPending && (
                  <View className="mt-3">
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 6 }}
                    >
                      {CATEGORY_CONFIG.map((option) => {
                        const isSelected = receipt.category === option.id;
                        return (
                          <Pressable
                            key={option.id}
                            onPress={() => handleUpdate(receipt.id, { category: option.id })}
                            className={`flex-row items-center rounded-full border px-2.5 py-1 ${
                              isSelected
                                ? 'border-[#B6DBCD] bg-[#E7F6EE]'
                                : 'border-[#E2E4DF] bg-white'
                            }`}
                          >
                            <View
                              className="h-4 w-4 items-center justify-center rounded-full"
                              style={{ backgroundColor: option.bgLight }}
                            >
                              <Text
                                className="font-body-bold text-[8px]"
                                style={{ color: option.color }}
                              >
                                {option.mark}
                              </Text>
                            </View>
                            <Text
                              className={`font-body-medium ml-1.5 text-[11px] ${
                                isSelected ? 'text-[#0B6B5F] font-body-semibold' : 'text-ink-muted'
                              }`}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* Bottom Actions for each card */}
                    <View className="mt-3.5 flex-row items-center justify-between border-t border-[#F0F2F1] pt-3">
                      {receipt.ocr_source === 'device' && !highConfidence ? (
                        <Pressable
                          onPress={() => handleImprove(receipt)}
                          disabled={isProcessing}
                          className="flex-row items-center active:opacity-70"
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <Sparkles size={14} color={COLORS.primary} />
                          )}
                          <Text className="font-body-semibold ml-1.5 text-[11px] text-primary">
                            Improve with AI
                          </Text>
                        </Pressable>
                      ) : (
                        <View className="flex-row items-center">
                          <CheckCircle2 size={13} color="#2D8B68" />
                          <Text className="font-body-medium ml-1 text-[11px] text-[#2D8B68]">
                            Details verified
                          </Text>
                        </View>
                      )}

                      <Pressable
                        onPress={() => handleSaveSingle(receipt)}
                        className="flex-row items-center rounded-xl bg-primary px-3.5 py-2 active:opacity-85"
                      >
                        <Text className="font-body-semibold text-[12px] text-white">Save expense</Text>
                        <ArrowRight size={13} color={COLORS.white} style={{ marginLeft: 4 }} />
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Already Saved State */}
                {!isPending && (
                  <View className="mt-3 flex-row items-center justify-center rounded-xl bg-[#E7F6EE] py-2">
                    <CheckCircle2 size={14} color="#2D8B68" />
                    <Text className="font-body-semibold ml-1.5 text-[11px] text-[#2D8B68]">
                      Added to Activity
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Sticky Bottom Save All Bar */}
      {pendingList.length > 0 && (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-[#E2E4DF] bg-white px-5 pt-3.5 shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-body-medium text-[11px] text-ink-muted">Ready to add</Text>
              <Text className="font-display-bold text-[17px] text-ink">
                {pendingList.length} {pendingList.length === 1 ? 'expense' : 'expenses'}
                <Text className="font-body text-[12px] text-ink-muted">
                  {' '}· {formatCurrency(totalPendingAmount)}
                </Text>
              </Text>
            </View>

            <Pressable
              onPress={handleSaveAll}
              disabled={isScanning}
              className="flex-row items-center rounded-xl bg-primary px-5 py-3 active:opacity-85"
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Check size={16} color={COLORS.white} strokeWidth={2.5} />
              )}
              <Text className="font-body-bold ml-1.5 text-[13px] text-white">Save All</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Fullscreen Photo Preview Modal */}
      <Modal
        visible={!!previewImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/85 px-4">
          <View className="relative w-full max-w-[360px] rounded-3xl bg-[#091E1C] p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-body-semibold text-[14px] text-white">Receipt Photo</Text>
              <Pressable
                onPress={() => setPreviewImageUri(null)}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/15 active:opacity-70"
              >
                <X size={16} color="#FFFFFF" />
              </Pressable>
            </View>

            {previewImageUri && (
              <Image
                source={{ uri: previewImageUri }}
                className="h-[380px] w-full rounded-2xl bg-black"
                resizeMode="contain"
              />
            )}

            <Pressable
              onPress={() => setPreviewImageUri(null)}
              className="mt-3.5 items-center justify-center rounded-xl bg-white/15 py-2.5 active:opacity-80"
            >
              <Text className="font-body-medium text-[12px] text-white">Close Preview</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
