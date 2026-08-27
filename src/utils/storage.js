const KEYS = {
  USERS: 'cupid_users',
  ACTIVE_STATE: 'cupid_active_state',
  CURRENT_USER: 'cupid_current_user'
};

export const initializeStorage = () => {
  const existingUsersJson = localStorage.getItem(KEYS.USERS);
  if (!existingUsersJson) {
    localStorage.setItem(KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.ACTIVE_STATE)) {
    localStorage.setItem(KEYS.ACTIVE_STATE, 'Delhi NCR');
  }
};

export const clearAllData = () => {
  localStorage.setItem(KEYS.USERS, JSON.stringify([]));
  localStorage.removeItem(KEYS.CURRENT_USER);
};

export const getUsers = () => {
  initializeStorage();
  const usersJson = localStorage.getItem(KEYS.USERS);
  return usersJson ? JSON.parse(usersJson) : [];
};

export const saveUsers = (users) => {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getActiveState = () => {
  initializeStorage();
  return localStorage.getItem(KEYS.ACTIVE_STATE) || 'Delhi NCR';
};

export const setActiveState = (state) => {
  localStorage.setItem(KEYS.ACTIVE_STATE, state);
};

export const getCurrentUser = () => {
  const userJson = localStorage.getItem(KEYS.CURRENT_USER);
  if (!userJson) return null;
  
  // Refresh current user data from the central users list
  const sessionUser = JSON.parse(userJson);
  const users = getUsers();
  const freshUser = users.find(u => u.id === sessionUser.id);
  
  if (freshUser) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(freshUser));
    return freshUser;
  }
  return sessionUser;
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

export const logout = () => {
  localStorage.removeItem(KEYS.CURRENT_USER);
};

export const updateUser = (updatedUser) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updatedUser };
    saveUsers(users);
    
    // If this is the logged-in user, sync their session
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(users[index]);
    }

    // Async sync to Supabase in background
    if (typeof window !== 'undefined') {
      import('../services/supabaseClient').then(({ supabase, isSupabaseConfigured }) => {
        if (isSupabaseConfigured()) {
          supabase
            .from('profiles')
            .upsert({
              id: updatedUser.id.startsWith('user_') ? undefined : updatedUser.id,
              email: updatedUser.email,
              name: updatedUser.name,
              gender: updatedUser.gender,
              state: updatedUser.state,
              university: updatedUser.university,
              branch: updatedUser.branch,
              year_of_study: updatedUser.yearOfStudy,
              hometown: updatedUser.hometown,
              avatar_url: updatedUser.avatar,
              bio: updatedUser.bio,
              phone: updatedUser.phone,
              instagram_id: updatedUser.instagramId,
              height: updatedUser.height,
              religion: updatedUser.religion,
              drinking_smoking: updatedUser.drinkingSmoking,
              personality_type: updatedUser.personalityType,
              dating_vibe: updatedUser.datingVibe,
              relationship_type: updatedUser.relationshipType,
              qualities: updatedUser.qualities || [],
              non_negotiables: updatedUser.nonNegotiables || [],
              plan: updatedUser.plan || 'basic',
              status: updatedUser.status || 'active',
              upi_id: updatedUser.refundUpi,
              updated_at: new Date().toISOString()
            }, { onConflict: 'email' })
            .then(({ error }) => {
              if (error) console.warn('Supabase profile sync notice:', error.message);
            });
        }
      });
    }

    return users[index];
  }
  return null;
};

export const createMatch = (userAId, userBId) => {
  const users = getUsers();
  const userA = users.find(u => u.id === userAId);
  const userB = users.find(u => u.id === userBId);
  
  if (userA && userB) {
    // Add to matches
    if (!userA.matches) userA.matches = [];
    if (!userB.matches) userB.matches = [];
    if (!userA.matches.includes(userBId)) userA.matches.push(userBId);
    if (!userB.matches.includes(userAId)) userB.matches.push(userAId);
    
    // Remove from suggested if present
    if (userA.suggestedMatches) userA.suggestedMatches = userA.suggestedMatches.filter(id => id !== userBId);
    if (userB.suggestedMatches) userB.suggestedMatches = userB.suggestedMatches.filter(id => id !== userAId);
    
    saveUsers(users);
    
    // Sync current session
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (currentUser.id === userAId) setCurrentUser(userA);
      if (currentUser.id === userBId) setCurrentUser(userB);
    }

    // Async sync match to Supabase matches table
    if (typeof window !== 'undefined') {
      import('../services/supabaseClient').then(({ supabase, isSupabaseConfigured }) => {
        if (isSupabaseConfigured()) {
          supabase
            .from('matches')
            .insert({
              user_a_id: userAId.startsWith('user_') ? undefined : userAId,
              user_b_id: userBId.startsWith('user_') ? undefined : userBId,
              matched_at: new Date().toISOString(),
              is_active: true
            })
            .then(({ error }) => {
              if (error) console.warn('Supabase match sync notice:', error.message);
            });
        }
      });
    }

    return true;
  }
  return false;
};

export const suggestMatch = (userAId, userBId) => {
  const users = getUsers();
  const userA = users.find(u => u.id === userAId);
  if (userA) {
    if (!userA.suggestedMatches.includes(userBId)) {
      userA.suggestedMatches.push(userBId);
    }
    saveUsers(users);
    return true;
  }
  return false;
};
