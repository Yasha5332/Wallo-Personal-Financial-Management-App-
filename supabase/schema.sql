-- =============================================
-- WALLO — Complete Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  income_pattern TEXT NOT NULL DEFAULT 'monthly_allowance'
    CHECK (income_pattern IN ('fixed_salary', 'monthly_allowance', 'semester_lump_sum', 'no_steady_income')),
  next_income_days INTEGER DEFAULT 30,
  next_income_amount NUMERIC(12,2) DEFAULT 0,
  next_income_label TEXT DEFAULT 'Next Income',
  logging_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- =============================================
-- CHART OF ACCOUNTS
-- =============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  sub_type TEXT,        -- e.g. 'cash', 'bank', 'e_wallet', 'food', 'transport'
  is_default BOOLEAN DEFAULT FALSE,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_own" ON accounts;
CREATE POLICY "accounts_own" ON accounts FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- JOURNAL ENTRIES (GL Header)
-- =============================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memo TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  is_void BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'manual'  -- 'manual' | 'settlement' | 'reversal' | 'system'
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "je_own" ON journal_entries;
CREATE POLICY "je_own" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- JOURNAL ENTRY LINES (Debit/Credit)
-- =============================================
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  debit NUMERIC(12,2) NOT NULL DEFAULT 0,
  credit NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT
);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "jel_own" ON journal_entry_lines;
CREATE POLICY "jel_own" ON journal_entry_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.id = journal_entry_lines.journal_entry_id
        AND je.user_id = auth.uid()
    )
  );

-- =============================================
-- TRANSACTIONS (User-facing, linked to JE)
-- =============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journal_entry_id UUID REFERENCES journal_entries(id),
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category TEXT NOT NULL,
  payment_account_id UUID REFERENCES accounts(id),
  note TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_void BOOLEAN DEFAULT FALSE,
  transacted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tx_own" ON transactions;
CREATE POLICY "tx_own" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS transactions_user_date ON transactions(user_id, transacted_at DESC);

-- =============================================
-- BUDGETS
-- =============================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  limit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW())::DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, period_start)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "budgets_own" ON budgets;
CREATE POLICY "budgets_own" ON budgets FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- GROUPS & SHARED EXPENSES (Tables First)
-- =============================================

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#1E3D3C',
  is_external BOOLEAN DEFAULT FALSE,  -- non-app member (just a name)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group Expenses table
CREATE TABLE IF NOT EXISTS group_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  paid_by_member_id UUID NOT NULL REFERENCES group_members(id),
  split_member_ids UUID[] NOT NULL,  -- array of group_member IDs who share this
  category TEXT DEFAULT 'bills',
  is_settlement BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Debts table (Running balances)
CREATE TABLE IF NOT EXISTS group_debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES group_members(id),
  to_member_id UUID NOT NULL REFERENCES group_members(id),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, from_member_id, to_member_id)
);

-- =============================================
-- HELPER: Check group membership without infinite RLS recursion
-- =============================================
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================
-- RLS POLICIES FOR GROUPS
-- =============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_member" ON groups;
CREATE POLICY "groups_member" ON groups FOR ALL
  USING (
    created_by = auth.uid() OR is_group_member(id)
  );

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gm_member" ON group_members;
CREATE POLICY "gm_member" ON group_members FOR ALL
  USING (
    user_id = auth.uid() OR is_group_member(group_id)
  );

ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ge_member" ON group_expenses;
CREATE POLICY "ge_member" ON group_expenses FOR ALL
  USING (
    is_group_member(group_id)
  );

ALTER TABLE group_debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gd_member" ON group_debts;
CREATE POLICY "gd_member" ON group_debts FOR ALL
  USING (
    is_group_member(group_id)
  );

-- =============================================
-- HELPER FUNCTION: Auto-create default chart of accounts
-- Called after profile creation via onboarding
-- =============================================
CREATE OR REPLACE FUNCTION create_default_accounts(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO accounts (user_id, name, type, sub_type, is_default) VALUES
    (p_user_id, 'Cash on Hand', 'asset', 'cash', true),
    (p_user_id, 'Bank Account', 'asset', 'bank', true),
    (p_user_id, 'E-Wallet', 'asset', 'e_wallet', false),
    -- Income accounts
    (p_user_id, 'Allowance', 'income', 'allowance', false),
    (p_user_id, 'Part-time Job', 'income', 'part_time', false),
    (p_user_id, 'Scholarship', 'income', 'scholarship', false),
    (p_user_id, 'Loan / Aid', 'income', 'loan_aid', false),
    (p_user_id, 'Other Income', 'income', 'other', false),
    -- Expense accounts
    (p_user_id, 'Food & Dining', 'expense', 'food', false),
    (p_user_id, 'Groceries', 'expense', 'groceries', false),
    (p_user_id, 'Transport', 'expense', 'transport', false),
    (p_user_id, 'Entertainment', 'expense', 'entertainment', false),
    (p_user_id, 'Bills & Utilities', 'expense', 'bills', false),
    (p_user_id, 'Education', 'expense', 'education', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DEFAULT BUDGETS FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION create_default_budgets(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO budgets (user_id, category, name, limit_amount) VALUES
    (p_user_id, 'food', 'Food & Dining', 240),
    (p_user_id, 'groceries', 'Groceries', 180),
    (p_user_id, 'entertainment', 'Entertainment', 90),
    (p_user_id, 'transport', 'Transport', 60),
    (p_user_id, 'bills', 'Bills & Utilities', 70),
    (p_user_id, 'education', 'Education', 120)
  ON CONFLICT (user_id, category, period_start) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PAY PERIODS (Cycle-based Budgeting)
-- =============================================
CREATE TABLE IF NOT EXISTS pay_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  income_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  fixed_costs_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  savings_target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pay_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pay_periods_own" ON pay_periods;
CREATE POLICY "pay_periods_own" ON pay_periods FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS pay_periods_user_active ON pay_periods(user_id, is_active);

-- =============================================
-- SAVINGS GOALS & VAULTS
-- =============================================
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_date TEXT,
  weekly_suggested NUMERIC(12,2) DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "savings_goals_own" ON savings_goals;
CREATE POLICY "savings_goals_own" ON savings_goals FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS savings_goals_user ON savings_goals(user_id, created_at);

-- =============================================
-- SUBSCRIPTIONS & RECURRING BILLS
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  renewal_day INTEGER NOT NULL CHECK (renewal_day BETWEEN 1 AND 31),
  category TEXT NOT NULL DEFAULT 'bills',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_own" ON subscriptions;
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS subscriptions_user_active ON subscriptions(user_id, is_active);

-- =============================================
-- DEFAULT PAY PERIOD FUNCTION (RPC)
-- =============================================
CREATE OR REPLACE FUNCTION create_default_pay_period(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_period_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_start DATE := DATE_TRUNC('month', v_now)::DATE;
  v_end DATE := (v_now + INTERVAL '30 days')::DATE;
BEGIN
  -- Deactivate any previously active period
  UPDATE pay_periods SET is_active = FALSE WHERE user_id = p_user_id AND is_active = TRUE;

  INSERT INTO pay_periods (
    user_id, name, start_date, end_date,
    income_amount, fixed_costs_amount, savings_target_amount,
    currency, is_active
  ) VALUES (
    p_user_id,
    TO_CHAR(v_now, 'Month YYYY'),
    v_start,
    v_end,
    750.00,
    210.00,
    80.00,
    'USD',
    TRUE
  ) RETURNING id INTO v_period_id;

  RETURN v_period_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RECEIPT BATCHES
-- =============================================
CREATE TABLE IF NOT EXISTS receipt_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE receipt_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receipt_batches_own" ON receipt_batches;
CREATE POLICY "receipt_batches_own" ON receipt_batches FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- RECEIPTS & OCR DATA
-- =============================================
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES receipt_batches(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  thumbnail_path TEXT,
  ocr_raw_text TEXT,
  ocr_source TEXT CHECK (ocr_source IN ('device', 'cloud')) DEFAULT 'device',
  ocr_confidence_score NUMERIC(3,2) DEFAULT 0.80,
  merchant_name TEXT,
  transaction_date DATE,
  total_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'VND',
  category TEXT DEFAULT 'food',
  processing_status TEXT CHECK (
    processing_status IN ('pending_review', 'reviewed', 'failed')
  ) DEFAULT 'pending_review',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "receipts_own" ON receipts;
CREATE POLICY "receipts_own" ON receipts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_batch ON receipts(batch_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(processing_status);

