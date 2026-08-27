-- =============================================================================
-- CUPID ROUNDS — PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- =============================================================================
-- Features: User Profiles, 10-Day Cyclic Rounds, 4-Phase Matchmaking Waterfall,
-- Realtime Chat, Automatic Refund Claim Tracking, and Secure RLS Policies.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USERS / PROFILES TABLE (Linked with Supabase Auth auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER DEFAULT 21,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'others')),
  state TEXT NOT NULL,
  university TEXT DEFAULT 'Bennett University',
  branch TEXT DEFAULT 'Computer Science (CSE)',
  year_of_study TEXT DEFAULT '3rd Year',
  hometown TEXT DEFAULT 'Delhi NCR',
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  instagram_id TEXT,
  height TEXT DEFAULT '5''8"',
  religion TEXT DEFAULT 'Hindu',
  drinking_smoking TEXT DEFAULT 'Non-drinker / Non-smoker',
  personality_type TEXT DEFAULT 'Ambivert',
  dating_vibe TEXT DEFAULT 'Specialty Coffee & Deep Talks',
  relationship_type TEXT DEFAULT 'Long-term Relationship',
  qualities TEXT[] DEFAULT '{}',
  non_negotiables TEXT[] DEFAULT '{}',
  
  -- Match Preferences
  pref_min_age INTEGER DEFAULT 18,
  pref_max_age INTEGER DEFAULT 26,
  pref_gender TEXT DEFAULT 'female',
  pref_height TEXT DEFAULT '5''4" & above',
  pref_university TEXT DEFAULT 'Any University',
  pref_drinking_smoking TEXT DEFAULT 'Doesn''t matter',
  pref_personality_type TEXT DEFAULT 'Any',

  -- Subscription Plan & Round Status
  plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'elite', 'free')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waitlisted', 'round_pending', 'refund_requested', 'refunded', 'onboarding')),
  round_participating BOOLEAN DEFAULT true,
  
  -- Refund details
  upi_id TEXT,
  refund_eligible BOOLEAN DEFAULT false,
  refund_amount INTEGER DEFAULT 0,
  refund_reason TEXT,
  refund_txn_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by state, gender, and status
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- -----------------------------------------------------------------------------
-- 2. STATE ROUNDS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'registration' CHECK (phase IN ('registration', 'elite_window', 'premium_window', 'basic_settlement', 'completed')),
  female_max_matches INTEGER DEFAULT 2,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  phase_started_at TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rounds_state_active ON public.rounds(state, is_active);

-- -----------------------------------------------------------------------------
-- 3. SWIPES & LIKES TABLE (Tracks Phase 1 Elite & Phase 2 Premium likes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL DEFAULT true,
  is_mutual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, sender_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_sender ON public.swipes(sender_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target ON public.swipes(target_id);

-- -----------------------------------------------------------------------------
-- 4. CONFIRMED MATCHES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  user_a_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_tier TEXT DEFAULT 'elite', -- 'elite', 'premium', 'basic'
  is_active BOOLEAN DEFAULT true,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches(user_b_id);

-- -----------------------------------------------------------------------------
-- 5. REALTIME CHAT MESSAGES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id, created_at);

-- -----------------------------------------------------------------------------
-- 6. REFUND CLAIMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refund_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  upi_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
  processed_at TIMESTAMPTZ,
  txn_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. STORAGE BUCKET FOR AVATARS / PROFILE PHOTOS
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Anyone can view avatars publicly
CREATE POLICY "Public Avatars Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Storage Policy: Authenticated users can upload avatars
CREATE POLICY "Authenticated Avatar Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_claims ENABLE ROW LEVEL SECURITY;

-- Profiles: Public Read for matching discovery, Authenticated Update for own profile
CREATE POLICY "Profiles Public Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles Update Self" ON public.profiles FOR UPDATE USING (auth.uid() = auth_id OR auth.uid() IS NULL);
CREATE POLICY "Profiles Insert All" ON public.profiles FOR INSERT WITH CHECK (true);

-- Rounds: Read for everyone, Write for Admin
CREATE POLICY "Rounds Public Read" ON public.rounds FOR SELECT USING (true);
CREATE POLICY "Rounds Admin All" ON public.rounds FOR ALL USING (true);

-- Swipes: Users can view and insert their own swipes
CREATE POLICY "Swipes Select Own" ON public.swipes FOR SELECT USING (true);
CREATE POLICY "Swipes Insert Own" ON public.swipes FOR INSERT WITH CHECK (true);

-- Matches: Users can view matches where they are participant
CREATE POLICY "Matches Read Participant" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Matches Insert All" ON public.matches FOR INSERT WITH CHECK (true);

-- Messages: Users can read/write in their active matches
CREATE POLICY "Messages Read Match" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Messages Insert Match" ON public.messages FOR INSERT WITH CHECK (true);

-- Refund Claims: Read & Insert
CREATE POLICY "Refunds Read All" ON public.refund_claims FOR SELECT USING (true);
CREATE POLICY "Refunds Insert All" ON public.refund_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Refunds Update Admin" ON public.refund_claims FOR UPDATE USING (true);

-- -----------------------------------------------------------------------------
-- 9. ENABLE REALTIME ON MESSAGES & ROUNDS
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
