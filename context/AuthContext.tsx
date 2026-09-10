import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbProfile } from '../lib/database.types';

// ─── Demo mode profile (used when Supabase not configured) ───────────────────
const DEMO_PROFILE: DbProfile = {
  id: 'demo-user',
  name: 'Sam',
  income_pattern: 'monthly_allowance',
  next_income_days: 9,
  next_income_amount: 750,
  next_income_label: 'Monthly Allowance',
  created_at: new Date().toISOString(),
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: DbProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  hasCompletedOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  completeOnboarding: (
    name: string,
    incomePattern: DbProfile['income_pattern']
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isDemoMode = !isSupabaseConfigured;

  // ── Fetch profile from DB ──────────────────────────────────────────────────
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) setProfile(data as DbProfile);
    else setProfile(null);
  };

  // ── Bootstrap session on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) {
      // Demo mode: skip auth, use fake profile
      setProfile(DEMO_PROFILE);
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id).finally(() => setIsLoading(false));
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  // ── Auth operations ────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const completeOnboarding = async (
    name: string,
    incomePattern: DbProfile['income_pattern']
  ) => {
    if (!session?.user || isDemoMode) return;
    const uid = session.user.id;

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: uid,
      name,
      income_pattern: incomePattern,
    });

    // Create default accounts and budgets via Postgres functions
    await supabase.rpc('create_default_accounts', { p_user_id: uid });
    await supabase.rpc('create_default_budgets', { p_user_id: uid });

    await fetchProfile(uid);
  };

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id);
  };

  const hasCompletedOnboarding = isDemoMode ? true : profile !== null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile: isDemoMode ? DEMO_PROFILE : profile,
        isLoading,
        isDemoMode,
        hasCompletedOnboarding,
        signIn,
        signUp,
        signOut,
        completeOnboarding,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
