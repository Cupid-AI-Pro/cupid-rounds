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
        plan: gender === 'female' ? 'free' : plan,
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

  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    gender,
    state,
    age: 22,
    plan: gender === 'female' ? 'free' : plan,
    status: 'active',
    avatar: gender === 'female'
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
