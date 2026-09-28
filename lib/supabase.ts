import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** True when Supabase credentials are configured */
export const isSupabaseConfigured =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey.length > 20;
