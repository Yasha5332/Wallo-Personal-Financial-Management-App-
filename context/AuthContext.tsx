import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ProfileModel } from '../lib/models/profile.model';

// ─── Demo mode profile (used when Demo mode is active) ────────────────────────
const DEMO_PROFILE: ProfileModel = {
  id: 'demo-user',
  name: 'Sam',
  income_pattern: 'monthly_allowance',
  next_income_days: 9,
  next_income_amount: 750,
  next_income_label: 'Monthly Allowance',
  logging_streak: 0,
  created_at: new Date().toISOString(),
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: ProfileModel | null;
  isLoading: boolean;
  isDemoMode: boolean;
  hasCompletedOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; code?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean; user?: User | null }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  completeOnboarding: (
    name: string,
    incomePattern: ProfileModel['income_pattern']
  ) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoActive, setIsDemoActive] = useState(!isSupabaseConfigured);

  const isDemoMode = isDemoActive || !isSupabaseConfigured;

  // ── Fetch profile from DB ──────────────────────────────────────────────────
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data as ProfileModel);
        return data as ProfileModel;
      } else {
        setProfile(null);
        return null;
      }
    } catch {
      setProfile(null);
      return null;
    }
  };

  // ── Bootstrap session on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (isDemoActive) {
      setProfile(DEMO_PROFILE);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!isMounted) return;
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!isMounted) return;
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isDemoActive]);

  // ── Auth operations ────────────────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null; code?: string }> => {
    setIsDemoActive(false);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message, code: (error as any).code };
    }

    if (data.user) {
      await fetchProfile(data.user.id);
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ error: string | null; needsEmailConfirmation?: boolean; user?: User | null }> => {
    setIsDemoActive(false);
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name: trimmedName },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Check if user already exists (Supabase returns empty identities when email confirmation is active)
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return { error: 'An account with this email already exists. Please sign in instead.' };
    }

    const needsEmailConfirmation = !data.session && !!data.user;

    if (data.session && data.user) {
      // Instant login (email confirmation turned off in Supabase)
      setSession(data.session);
      await fetchProfile(data.user.id);
    }

    return {
      error: null,
      needsEmailConfirmation,
      user: data.user,
    };
  };

  const resendConfirmationEmail = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    return { error: error?.message ?? null };
  };

  const enterDemoMode = () => {
    setIsDemoActive(true);
    setProfile(DEMO_PROFILE);
  };

  const signOut = async () => {
    if (!isDemoActive && isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    setSession(null);
    setProfile(null);
    setIsDemoActive(false);
  };

  const completeOnboarding = async (
    name: string,
    incomePattern: ProfileModel['income_pattern']
  ): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      setProfile((prev) => ({
        ...(prev || DEMO_PROFILE),
        name: name || 'Demo User',
        income_pattern: incomePattern,
      }));
      return { error: null };
    }

    const currentUser = session?.user;
    if (!currentUser) {
      return { error: 'No active session. Please sign in.' };
    }
    const uid = currentUser.id;

    try {
      // 1. Upsert profile
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: uid,
        name: name || currentUser.user_metadata?.name || 'User',
        income_pattern: incomePattern,
      });

      if (profileErr) throw profileErr;

      // 2. Initialize default accounts, budgets, and pay period via RPC
      await Promise.allSettled([
        supabase.rpc('create_default_accounts', { p_user_id: uid }),
        supabase.rpc('create_default_budgets', { p_user_id: uid }),
        supabase.rpc('create_default_pay_period', { p_user_id: uid }),
      ]);

      await fetchProfile(uid);
      return { error: null };
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      return { error: err?.message || 'Failed to initialize account profile.' };
    }
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
        resendConfirmationEmail,
        resetPassword,
        signOut,
        enterDemoMode,
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
