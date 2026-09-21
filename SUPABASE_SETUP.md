# ⚡ Supabase Setup & Production Deployment Guide for Cupid Rounds

This guide explains how to connect your Supabase database to **Cupid Rounds** for real users.

---

## 🛠️ Step 1: Create a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **Sign Up** (Free tier).
2. Click **New Project**:
   - **Name**: `Cupid-Rounds-Production`
   - **Database Password**: Choose a strong password and save it safely.
   - **Region**: Select `Mumbai (ap-south-1)` (fastest response time for India).

---

## 📜 Step 2: Run the SQL Migration Script

In your Supabase Dashboard, go to **SQL Editor** (left sidebar) → click **New Query** → Paste the SQL script below and click **RUN**:

```sql
-- 1. Create Profiles Table (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Delhi NCR',
  university TEXT,
  branch TEXT,
  year_of_study TEXT,
  hometown TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  instagram_id TEXT,
  height TEXT,
  religion TEXT,
  drinking_smoking TEXT,
  personality_type TEXT,
  dating_vibe TEXT,
  relationship_type TEXT,
  qualities TEXT[],
  non_negotiables TEXT[],
  plan TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'active',
  upi_id TEXT,
  refund_eligible BOOLEAN DEFAULT false,
  refund_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id TEXT NOT NULL,
  user_b_id TEXT NOT NULL,
  match_score NUMERIC DEFAULT 85,
  state_name TEXT DEFAULT 'Delhi NCR',
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- 3. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  plan TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  utr_number TEXT,
  user_state TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending_verification',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) & Public Access Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert matches" ON public.matches FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update payments" ON public.payments FOR UPDATE USING (true);

CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notifications" ON public.notifications FOR UPDATE USING (true);
```

---

## 🔑 Step 3: Copy API Keys to Your Hosting Environment (Vercel / Netlify / Local `.env`)

1. In Supabase Dashboard, go to **Project Settings** → **API**.
2. Copy **Project URL** and **`anon` `public` key**.
3. In Vercel or Netlify (Environment Variables settings), add:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Trigger a Redeploy!

---

## 🚀 How Offline Fallback Works

The app features a **Hybrid Dual Sync Architecture**:
- When Supabase environment variables are configured, all profile edits, likes, matches, payment submissions, and notifications automatically write & read from Supabase in real time.
- If Supabase keys are not set yet or network goes offline, the app seamlessly uses `LocalStorage` without crashing or showing error screens to users!
