import { supabase, isSupabaseConfigured } from './supabaseClient';
import * as localStore from '../utils/storage';
import * as roundManager from '../utils/roundManager';

/**
 * High-Level Backend Service Adapter
 * Automatically routes to Supabase if configured with .env keys,
 * or gracefully defaults to Local Storage state machine so dev environment never crashes!
 */

// -----------------------------------------------------------------------------
// 1. AUTHENTICATION & REGISTRATION
// -----------------------------------------------------------------------------
export const signUpUser = async ({ email, password, name, gender, state, plan = 'basic' }) => {
  if (isSupabaseConfigured()) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, gender, state }
        }
      });
      if (authErr) throw authErr;

      const userId = authData.user?.id;
      const profilePayload = {
        id: userId,
        auth_id: userId,
        email,
        name,
        gender,
        state,
        plan: (gender || '').toLowerCase() === 'female' ? 'free' : plan,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { data: profileData, error: profErr } = await supabase
        .from('profiles')
        .insert(profilePayload)
        .select()
        .single();

      if (profErr) throw profErr;
      return { user: profileData, error: null };
    } catch (err) {
      console.warn('Supabase signUp error, falling back to local:', err.message);
      return localSignUpFallback({ email, name, gender, state, plan });
    }
  } else {
    return localSignUpFallback({ email, name, gender, state, plan });
  }
};

const localSignUpFallback = ({ email, name, gender, state, plan }) => {
  const allUsers = localStore.getUsers();
  const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { user: null, error: 'An account with this email already exists.' };
  }

  const isFemale = (gender || '').toLowerCase() === 'female';
  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    gender,
    state,
    age: 22,
    plan: isFemale ? 'free' : plan,
    status: 'active',
    avatar: isFemale
      ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    university: 'Bennett University',
    branch: 'Computer Science (CSE)',
    yearOfStudy: '3rd Year',
    hometown: state || 'Delhi NCR',
    likes: [],
    dislikes: [],
    matches: [],
    receivedLikes: [],
    suggestedMatches: [],
    created_at: new Date().toISOString()
  };

  allUsers.push(newUser);
  localStore.saveUsers(allUsers);
  localStore.setCurrentUser(newUser);
  return { user: newUser, error: null };
};

export const signInUser = async (email, password) => {
  if (isSupabaseConfigured()) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (authErr) throw authErr;

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();

      if (profErr) throw profErr;
      return { user: profile, error: null };
    } catch (err) {
      console.warn('Supabase signIn error, falling back to local:', err.message);
      return localSignInFallback(email);
    }
  } else {
    return localSignInFallback(email);
  }
};

const localSignInFallback = (email) => {
  const allUsers = localStore.getUsers();
  const found = allUsers.find(u => 
    u.email.toLowerCase() === email.toLowerCase() || 
    u.id.toLowerCase() === email.toLowerCase()
  );
  if (found) {
    localStore.setCurrentUser(found);
    return { user: found, error: null };
  }
  return { user: null, error: 'User not found with provided credentials.' };
};

// -----------------------------------------------------------------------------
// 2. PROFILE MANAGEMENT & AVATAR STORAGE UPLOAD
// -----------------------------------------------------------------------------
export const uploadProfileAvatar = async (userId, file) => {
  if (isSupabaseConfigured() && file) {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Update in profiles table
      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      return { url: avatarUrl, error: null };
    } catch (err) {
      console.error('Supabase storage upload failed:', err);
      return { url: null, error: err.message };
    }
  }
  return { url: null, error: 'Storage not configured' };
};

export const updateProfile = async (userId, profileData) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (err) {
      console.warn('Supabase updateProfile error, syncing local:', err.message);
      const updated = localStore.updateUser({ id: userId, ...profileData });
      return { profile: updated, error: null };
    }
  } else {
    const updated = localStore.updateUser({ id: userId, ...profileData });
    return { profile: updated, error: null };
  }
};

// -----------------------------------------------------------------------------
// 3. REALTIME MESSAGING
// -----------------------------------------------------------------------------
export const getMessagesForMatch = async (matchId) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

export const sendRealtimeMessage = async (matchId, senderId, text) => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          text,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { message: data, error: null };
    } catch (err) {
      return { message: null, error: err.message };
    }
  }
  return { message: { id: `msg_${Date.now()}`, match_id: matchId, sender_id: senderId, text, created_at: new Date().toISOString() }, error: null };
};

export const subscribeToMatchChat = (matchId, onNewMessage) => {
  if (isSupabaseConfigured()) {
    return supabase
      .channel(`chat_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          onNewMessage(payload.new);
        }
      )
      .subscribe();
  }
  return { unsubscribe: () => {} };
};

// -----------------------------------------------------------------------------
// 4. REAL-TIME PROFILES, SWIPES & CLOUD MATCHMAKING
// -----------------------------------------------------------------------------

/**
 * Fetch all verified real users from Supabase profiles
 */
export const fetchProfilesFromSupabase = async () => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      gender: (p.gender || 'male').toLowerCase(),
      age: Number(p.age) || 21,
      state: p.state || 'Delhi NCR',
      hometown: p.hometown || p.state || 'Delhi NCR',
      university: p.university || 'Bennett University',
      branch: p.branch || 'Computer Science (CSE)',
      yearOfStudy: p.year_of_study || '3rd Year',
      avatar: p.avatar_url || (p.gender === 'female' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'),
      bio: p.bio || '',
      height: p.height || "5'7\"",
      religion: p.religion || 'Hindu',
      drinkingSmoking: p.drinking_smoking || 'Non-drinker',
      personalityType: p.personality_type || 'Ambivert',
      datingVibe: p.dating_vibe || 'Cafes & Coffee',
      relationshipType: p.relationship_type || 'Serious Relationship',
      qualities: Array.isArray(p.qualities) ? p.qualities : ['Loyal', 'Humorous'],
      plan: p.plan || ((p.gender || '').toLowerCase() === 'female' ? 'free' : 'basic'),
      status: p.status || 'active',
      isRealUser: true,
      likes: [],
      matches: []
    }));
  } catch (err) {
    console.warn('[Supabase] fetchProfilesFromSupabase warning:', err);
    return [];
  }
};

/**
 * Record a swipe (Like or Pass) in Supabase and check for instant mutual match
 */
export const recordSwipeInSupabase = async (senderId, targetId, isLike) => {
  if (!isSupabaseConfigured() || !senderId || !targetId) {
    return { isMutual: false };
  }

  const isValidUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  if (!isValidUuid(senderId) || !isValidUuid(targetId)) {
    return { isMutual: false };
  }

  try {
    // 1. Insert swipe record
    await supabase.from('swipes').insert({
      sender_id: senderId,
      target_id: targetId,
      is_like: Boolean(isLike)
    });

    // 2. If it's a LIKE, check if the other person has also liked this user
    if (isLike) {
      const { data: reciprocalLikes } = await supabase
        .from('swipes')
        .select('*')
        .eq('sender_id', targetId)
        .eq('target_id', senderId)
        .eq('is_like', true)
        .limit(1);

      if (reciprocalLikes && reciprocalLikes.length > 0) {
        // Form Mutual Match!
        const { data: matchRecord, error: matchErr } = await supabase
          .from('matches')
          .insert({
            user_a_id: senderId,
            user_b_id: targetId,
            matched_tier: 'elite',
            is_active: true
          })
          .select()
          .single();

        if (!matchErr && matchRecord) {
          return { isMutual: true, match: matchRecord };
        }
        return { isMutual: true };
      }
    }

    return { isMutual: false };
  } catch (err) {
    console.warn('[Supabase] recordSwipeInSupabase notice:', err);
    return { isMutual: false };
  }
};

/**
 * Fetch list of user IDs who have liked this user
 */
export const fetchLikesForUser = async (userId) => {
  if (!isSupabaseConfigured() || !userId) return [];
  const isValidUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  if (!isValidUuid(userId)) return [];

  try {
    const { data, error } = await supabase
      .from('swipes')
      .select('sender_id')
      .eq('target_id', userId)
      .eq('is_like', true);

    if (error || !data) return [];
    return data.map(d => d.sender_id);
  } catch (e) {
    return [];
  }
};

/**
 * Fetch all active match partner IDs for this user
 */
export const fetchMatchesForUser = async (userId) => {
  if (!isSupabaseConfigured() || !userId) return [];
  const isValidUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  if (!isValidUuid(userId)) return [];

  try {
    // Check which users THIS user has actively swiped LIKE on
    const { data: mySwipes } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('sender_id', userId)
      .eq('is_like', true);

    const myLikedIds = new Set((mySwipes || []).map(s => s.target_id));

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
      .eq('is_active', true);

    if (error || !data) return [];
    
    // Only treat as an existing match if THIS user has also reciprocally swiped like!
    // If this user hasn't swiped like yet, the candidate must remain in the deck so they can see & swipe on them!
    return data
      .map(m => m.user_a_id === userId ? m.user_b_id : m.user_a_id)
      .filter(partnerId => myLikedIds.has(partnerId));
  } catch (e) {
    return [];
  }
};

/**
 * Realtime subscription for incoming likes and matches
 */
export const subscribeToLikesAndMatches = (userId, onUpdate) => {
  if (!isSupabaseConfigured() || !userId) return () => {};
  try {
    const channel = supabase
      .channel(`cupid_user_activity_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'swipes' }, () => {
        if (typeof onUpdate === 'function') onUpdate();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, () => {
        if (typeof onUpdate === 'function') onUpdate();
      })
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
};

