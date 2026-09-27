import { MOCK_USERS } from '../data/mockData.js';

const KEYS = {
  USERS: 'cupid_users',
  ACTIVE_STATE: 'cupid_active_state',
  CURRENT_USER: 'cupid_current_user',
  PAYMENT_SUBMISSIONS: 'cupid_payment_submissions',
  ADMIN_AUTH: 'cupid_admin_auth_v1',
  STATES_LIST: 'cupid_custom_states_list_v1',
  COLLEGES_MAP: 'cupid_custom_colleges_map_v1'
};

// ─── Admin Auth Helpers ───────────────────────────────────────────────────────
export const isAdminAuthenticated = () => {
  return localStorage.getItem(KEYS.ADMIN_AUTH) === 'true';
};

export const setAdminAuthenticated = (status) => {
  if (status) {
    localStorage.setItem(KEYS.ADMIN_AUTH, 'true');
  } else {
    localStorage.removeItem(KEYS.ADMIN_AUTH);
  }
};

// ─── States Management Helpers ────────────────────────────────────────────────
const DEFAULT_STATES = [
  "Delhi NCR",
  "Uttar Pradesh",
  "Haryana",
  "Punjab",
  "Rajasthan",
  "Maharashtra",
  "Karnataka",
  "Gujarat",
  "West Bengal",
  "Madhya Pradesh"
];

export const getStatesList = () => {
  const json = localStorage.getItem(KEYS.STATES_LIST);
  if (!json) {
    localStorage.setItem(KEYS.STATES_LIST, JSON.stringify(DEFAULT_STATES));
    return DEFAULT_STATES;
  }
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STATES;
  } catch (e) {
    return DEFAULT_STATES;
  }
};

export const notifyDataChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_data_changed'));
  }
};

export const addState = (newStateName) => {
  const trimmed = newStateName?.trim();
  if (!trimmed) return false;
  const list = getStatesList();
  if (!list.includes(trimmed)) {
    list.push(trimmed);
    localStorage.setItem(KEYS.STATES_LIST, JSON.stringify(list));
    notifyDataChanged();
    return true;
  }
  return false;
};

export const updateState = (oldName, newName) => {
  const trimmed = newName?.trim();
  if (!trimmed || oldName === trimmed) return false;
  const list = getStatesList();
  const idx = list.indexOf(oldName);
  if (idx !== -1) {
    list[idx] = trimmed;
    localStorage.setItem(KEYS.STATES_LIST, JSON.stringify(list));

    // Also update active state if affected
    if (getActiveState() === oldName) {
      setActiveState(trimmed);
    }
    notifyDataChanged();
    return true;
  }
  return false;
};

export const deleteState = (stateName) => {
  const list = getStatesList();
  if (list.length <= 1) return false; // Prevent empty list
  const filtered = list.filter(s => s !== stateName);
  localStorage.setItem(KEYS.STATES_LIST, JSON.stringify(filtered));
  if (getActiveState() === stateName) {
    setActiveState(filtered[0]);
  }
  notifyDataChanged();
  return true;
};

// ─── Colleges Management Helpers ──────────────────────────────────────────────
const DEFAULT_COLLEGES = {
  "Delhi NCR": [
    "IIT Delhi", "Bennett University", "Sharda University", "JIIT Noida", 
    "Galgotias University", "Amity University", "Delhi University (DU)", "DTU",
    "NSUT Dwarka", "IIIT Delhi", "Ashoka University", "NIET Greater Noida"
  ],
  "Uttar Pradesh": [
    "AKGEC Ghaziabad", "KIET Ghaziabad", "BHU Varanasi", "IIT Kanpur", 
    "MNNIT Allahabad", "Amity Lucknow", "HBTI Kanpur", "IMS Ghaziabad", 
    "Integral University", "SRM Modinagar", "AKTU Lucknow"
  ],
  "Maharashtra": [
    "IIT Bombay", "COEP Pune", "VJTI Mumbai", "Symbiosis Pune", 
    "NMIMS Mumbai", "PICT Pune", "MIT WPU Pune", "SPIT Mumbai", 
    "VIT Pune", "DY Patil Pune"
  ],
  "Karnataka": [
    "IISc Bangalore", "RVCE Bangalore", "BMSCE Bangalore", "PES University", 
    "MSRIT Bangalore", "Manipal University (MAHE)", "BMSIT Bangalore", "JSSATE Bangalore"
  ],
  "Tamil Nadu": [
    "IIT Madras", "Anna University", "PSG Tech Coimbatore", "SRM Kattankulathur", 
    "VIT Vellore", "SASTRA Tanjore", "SSN College Chennai", "Loyola College Chennai"
  ],
  "Telangana": [
    "IIT Hyderabad", "IIIT Hyderabad", "CBIT Hyderabad", "BITS Hyderabad", 
    "JNTU Hyderabad", "VNR VJIET", "Vasavi College", "Osmania University"
  ],
  "West Bengal": [
    "IIT Kharagpur", "Jadavpur University", "IIM Calcutta", "St. Xavier's Kolkata", 
    "Heritage Institute", "Techno India Kolkata", "IIEST Shibpur", "Presidency University"
  ],
  "Haryana": [
    "Ashoka University", "O.P. Jindal Global University", "YMCA Faridabad", "Manav Rachna", "NCU Gurugram"
  ],
  "Punjab": [
    "Thapar University", "LPU Phagwara", "Chandigarh University", "PEC Chandigarh", "IIT Ropar"
  ],
  "Rajasthan": [
    "BITS Pilani", "MNIT Jaipur", "Manipal University Jaipur", "JK Lakshmipat University", "IIT Jodhpur"
  ],
  "Gujarat": [
    "IIT Gandhinagar", "DAIICT Gandhinagar", "Nirma University", "SVNIT Surat", "PDPU Gandhinagar"
  ]
};

export const getCollegesMap = () => {
  const json = localStorage.getItem(KEYS.COLLEGES_MAP);
  if (!json) {
    localStorage.setItem(KEYS.COLLEGES_MAP, JSON.stringify(DEFAULT_COLLEGES));
    return DEFAULT_COLLEGES;
  }
  try {
    return JSON.parse(json);
  } catch (e) {
    return DEFAULT_COLLEGES;
  }
};

export const getCollegesByState = (stateName) => {
  const map = getCollegesMap();
  if (map[stateName]) return map[stateName];
  // Fallback to default list if state is new
  return [
    "Central State University",
    "State Institute of Technology",
    "Government Degree College",
    "City Arts & Science College"
  ];
};

export const addCollege = (stateName, collegeName) => {
  const trimmed = collegeName?.trim();
  if (!trimmed) return false;
  const map = getCollegesMap();
  if (!map[stateName]) map[stateName] = [];
  if (!map[stateName].includes(trimmed)) {
    map[stateName].push(trimmed);
    localStorage.setItem(KEYS.COLLEGES_MAP, JSON.stringify(map));
    notifyDataChanged();
    return true;
  }
  return false;
};

export const updateCollege = (stateName, oldCollegeName, newCollegeName) => {
  const trimmed = newCollegeName?.trim();
  if (!trimmed || oldCollegeName === trimmed) return false;
  const map = getCollegesMap();
  if (map[stateName]) {
    const idx = map[stateName].indexOf(oldCollegeName);
    if (idx !== -1) {
      map[stateName][idx] = trimmed;
      localStorage.setItem(KEYS.COLLEGES_MAP, JSON.stringify(map));
      notifyDataChanged();
      return true;
    }
  }
  return false;
};

export const deleteCollege = (stateName, collegeName) => {
  const map = getCollegesMap();
  if (map[stateName]) {
    map[stateName] = map[stateName].filter(c => c !== collegeName);
    localStorage.setItem(KEYS.COLLEGES_MAP, JSON.stringify(map));
    notifyDataChanged();
    return true;
  }
  return false;
};


// ─── Payment Submission Helpers ───────────────────────────────────────────────
export const getPaymentSubmissions = () => {
  const json = localStorage.getItem(KEYS.PAYMENT_SUBMISSIONS);
  return json ? JSON.parse(json) : [];
};

export const savePaymentSubmission = (submission) => {
  try {
    const list = getPaymentSubmissions();
    const idx = list.findIndex(s => s.userId === submission.userId);
    // User requested: All entries are AUTO-APPROVED by default! Admin can manually reject if payment is invalid.
    const entry = { 
      ...submission, 
      submittedAt: submission.submittedAt || new Date().toISOString(), 
      status: submission.status || 'approved',
      autoApproved: true,
      verified: true
    };
    if (idx !== -1) { 
      list[idx] = { ...list[idx], ...entry }; 
    } else { 
      list.push(entry); 
    }
    localStorage.setItem(KEYS.PAYMENT_SUBMISSIONS, JSON.stringify(list));

    // Also ensure user's round participation and plan are active
    if (submission.userId) {
      const allUsers = getUsers();
      const uIdx = allUsers.findIndex(u => u.id === submission.userId);
      if (uIdx !== -1) {
        allUsers[uIdx].roundParticipating = true;
        allUsers[uIdx].status = 'active';
        allUsers[uIdx].paymentVerified = true;
        if (submission.plan) allUsers[uIdx].plan = submission.plan;
        if (submission.upiId) allUsers[uIdx].refundUpi = submission.upiId;
        saveUsers(allUsers);
      }
    }

    notifyDataChanged();
    return entry;
  } catch (err) {
    console.warn("Storage quota limit reached while saving payment submission:", err);
    try {
      const list = getPaymentSubmissions();
      const idx = list.findIndex(s => s.userId === submission.userId);
      const safeEntry = { 
        ...submission, 
        screenshotBase64: null, 
        submittedAt: submission.submittedAt || new Date().toISOString(), 
        status: submission.status || 'approved',
        autoApproved: true,
        verified: true 
      };
      if (idx !== -1) { list[idx] = { ...list[idx], ...safeEntry }; } else { list.push(safeEntry); }
      localStorage.setItem(KEYS.PAYMENT_SUBMISSIONS, JSON.stringify(list));
      notifyDataChanged();
      return safeEntry;
    } catch (innerErr) {
      console.error("Critical storage error:", innerErr);
    }
  }
};

export const updatePaymentStatus = (userId, status) => {
  const list = getPaymentSubmissions();
  const idx = list.findIndex(s => s.userId === userId);
  if (idx !== -1) {
    list[idx].status = status;
    list[idx].resolvedAt = new Date().toISOString();
    localStorage.setItem(KEYS.PAYMENT_SUBMISSIONS, JSON.stringify(list));
    notifyDataChanged();
    return list[idx];
  }
  return null;
};

export const rejectPaymentSubmission = (userId, reason = 'Payment screenshot or UPI transaction could not be verified') => {
  const list = getPaymentSubmissions();
  const idx = list.findIndex(s => s.userId === userId);
  if (idx !== -1) {
    list[idx].status = 'rejected';
    list[idx].autoApproved = false;
    list[idx].rejectionReason = reason;
    list[idx].resolvedAt = new Date().toISOString();
    localStorage.setItem(KEYS.PAYMENT_SUBMISSIONS, JSON.stringify(list));
  }

  // Revoke user's round participation
  const allUsers = getUsers();
  const uIdx = allUsers.findIndex(u => u.id === userId);
  if (uIdx !== -1) {
    allUsers[uIdx].roundParticipating = false;
    allUsers[uIdx].status = 'payment_rejected';
    allUsers[uIdx].paymentVerified = false;
    allUsers[uIdx].rejectionReason = reason;
    saveUsers(allUsers);

    // Send push notification to user
    import('../services/notificationManager').then(({ addNotification }) => {
      addNotification(userId, {
        type: 'payment',
        title: 'Payment Entry Rejected',
        message: `Your payment verification was rejected: "${reason}". Please submit a valid screenshot to participate.`,
        actionUrl: 'profile'
      });
    }).catch(() => {});
  }

  notifyDataChanged();
  return true;
};

// ─── Refund Queue Management ──────────────────────────────────────────────────
export const getRefundQueue = () => {
  const allUsers = getUsers();
  const submissions = getPaymentSubmissions();
  const subMap = new Map(submissions.map(s => [s.userId, s]));

  const refunds = [];

  allUsers.forEach(u => {
    const isEligible = u.refundEligible === true || 
                       u.refundStatus === 'pending' || 
                       u.status === 'refund_requested' || 
                       u.refundRequested === true;

    if (isEligible || u.refundStatus === 'processed') {
      const sub = subMap.get(u.id);
      const defaultAmount = u.plan === 'elite' ? 449 : (u.plan === 'premium' ? 250 : 100);

      refunds.push({
        userId: u.id,
        name: u.name || 'Anonymous User',
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        gender: u.gender || 'male',
        avatar: u.avatar || '',
        university: u.university || 'Delhi University',
        state: u.state || 'Delhi NCR',
        plan: u.plan || 'basic',
        amount: u.refundAmount || sub?.amount || defaultAmount,
        upiId: u.refundUpi || sub?.upiId || u.upiId || 'Not provided',
        status: u.refundStatus || 'pending',
        reason: u.refundReason || (u.matches?.length === 0 ? 'No mutual matches formed in round' : 'User requested refund'),
        requestedAt: u.refundRequestedAt || sub?.submittedAt || new Date().toISOString(),
        processedAt: u.refundProcessedAt || null,
        transactionRef: u.refundUtr || null
      });
    }
  });

  return refunds;
};

export const processRefund = (userId, { transactionRef, notes } = {}) => {
  const allUsers = getUsers();
  const uIdx = allUsers.findIndex(u => u.id === userId);
  if (uIdx !== -1) {
    const u = allUsers[uIdx];
    u.refundStatus = 'processed';
    u.refundProcessedAt = new Date().toISOString();
    u.refundUtr = transactionRef || `UPI-TXN-${Date.now().toString().slice(-6)}`;
    u.refundNotes = notes || '';
    u.refundEligible = false;
    saveUsers(allUsers);

    // Send push notification to user
    import('../services/notificationManager').then(({ addNotification }) => {
      addNotification(userId, {
        type: 'refund',
        title: 'Refund Processed Successfully',
        message: `Your refund of ₹${u.refundAmount || 449} has been sent to UPI ID: ${u.refundUpi || 'your account'}. Ref: ${u.refundUtr}`,
        actionUrl: 'profile'
      });
    }).catch(() => {});

    notifyDataChanged();
    return true;
  }
  return false;
};

export const rejectRefund = (userId, reason = 'Criteria for 100% money-back guarantee not met') => {
  const allUsers = getUsers();
  const uIdx = allUsers.findIndex(u => u.id === userId);
  if (uIdx !== -1) {
    const u = allUsers[uIdx];
    u.refundStatus = 'rejected';
    u.refundEligible = false;
    u.refundRejectReason = reason;
    saveUsers(allUsers);

    import('../services/notificationManager').then(({ addNotification }) => {
      addNotification(userId, {
        type: 'refund',
        title: 'Refund Request Declined',
        message: `Your refund request was declined: ${reason}`,
        actionUrl: 'profile'
      });
    }).catch(() => {});

    notifyDataChanged();
    return true;
  }
  return false;
};


export const initializeStorage = () => {
  const existingUsersJson = localStorage.getItem(KEYS.USERS);
  if (!existingUsersJson) {
    localStorage.setItem(KEYS.USERS, JSON.stringify([]));
  } else {
    // Purge any legacy fake/dummy profiles from localStorage
    try {
      const currentList = JSON.parse(existingUsersJson);
      const mockIds = new Set(['girl_priya', 'girl_sophia', 'girl_ananya', 'girl_riya', 'girl_isha', 'girl_meera', 'boy_rohan', 'boy_aditya', 'boy_kabir', 'boy_henry', 'boy_arjun']);
      let modified = false;
      const realUsersOnly = currentList.filter(u => 
        u && 
        !mockIds.has(u.id) && 
        !u.id?.startsWith('girl_') && 
        !u.id?.startsWith('boy_') && 
        !u.id?.startsWith('mock_') &&
        !u.isMock
      ).map(u => {
        // Reset any glitched user profiles that bypassed onboarding without real photos
        if (u.role !== 'admin' && u.id !== 'test_onboarding_user') {
          const hasRealPhotos = Array.isArray(u.photos) && u.photos.length >= 2 && !u.photos.some(p => typeof p === 'string' && p.includes('unsplash'));
          if (!hasRealPhotos && u.status === 'active') {
            modified = true;
            return {
              ...u,
              status: 'onboarding',
              avatar: (u.avatar && typeof u.avatar === 'string' && u.avatar.includes('unsplash')) ? null : u.avatar,
              photos: (Array.isArray(u.photos) && !u.photos.some(p => typeof p === 'string' && p.includes('unsplash'))) ? u.photos : []
            };
          }
        }
        return u;
      });
      if (modified || realUsersOnly.length !== currentList.length) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(realUsersOnly));
      }
    } catch (e) {
      localStorage.setItem(KEYS.USERS, JSON.stringify([]));
    }
  }

  if (!localStorage.getItem(KEYS.ACTIVE_STATE)) {
    localStorage.setItem(KEYS.ACTIVE_STATE, 'Delhi NCR');
  }
};

export const clearAllData = () => {
  localStorage.setItem(KEYS.USERS, JSON.stringify([]));
  localStorage.removeItem(KEYS.CURRENT_USER);
  notifyDataChanged();
};

export const getUsers = () => {
  initializeStorage();
  const usersJson = localStorage.getItem(KEYS.USERS);
  if (!usersJson) return [];
  try {
    const parsed = JSON.parse(usersJson);
    if (!Array.isArray(parsed)) return [];
    const mockIds = new Set(['girl_priya', 'girl_sophia', 'girl_ananya', 'girl_riya', 'girl_isha', 'girl_meera', 'boy_rohan', 'boy_aditya', 'boy_kabir', 'boy_henry', 'boy_arjun']);
    return parsed.filter(u => 
      u && 
      !mockIds.has(u.id) && 
      !u.id?.startsWith('girl_') && 
      !u.id?.startsWith('boy_') && 
      !u.id?.startsWith('mock_') &&
      !u.isMock
    );
  } catch (e) {
    return [];
  }
};

export const saveUsers = (users) => {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users || []));
  notifyDataChanged();
};

export const getActiveState = () => {
  initializeStorage();
  return localStorage.getItem(KEYS.ACTIVE_STATE) || 'Delhi NCR';
};

export const setActiveState = (state) => {
  localStorage.setItem(KEYS.ACTIVE_STATE, state || 'Delhi NCR');
  notifyDataChanged();
};

export const getCurrentUser = () => {
  const userJson = localStorage.getItem(KEYS.CURRENT_USER);
  if (!userJson || userJson === 'null' || userJson === 'undefined') return null;
  
  try {
    const sessionUser = JSON.parse(userJson);
    if (!sessionUser || typeof sessionUser !== 'object' || !sessionUser.id) {
      return null;
    }
    const users = getUsers();
    let freshUser = users.find(u => u && u.id === sessionUser.id) || sessionUser;

    // Check if non-admin user has completed full onboarding (real photos uploaded)
    const isSpecial = freshUser.role === 'admin' || freshUser.id === 'test_onboarding_user';
    const hasRealPhotos = Array.isArray(freshUser.photos) && freshUser.photos.length >= 2 && !freshUser.photos.some(p => typeof p === 'string' && p.includes('unsplash'));

    if (!isSpecial && !hasRealPhotos && freshUser.status !== 'waitlisted') {
      freshUser = {
        ...freshUser,
        status: 'onboarding',
        avatar: (freshUser.avatar && typeof freshUser.avatar === 'string' && freshUser.avatar.includes('unsplash')) ? null : freshUser.avatar,
        photos: (Array.isArray(freshUser.photos) && !freshUser.photos.some(p => typeof p === 'string' && p.includes('unsplash'))) ? freshUser.photos : []
      };
    }
    
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(freshUser));
    return freshUser;
  } catch (e) {
    localStorage.removeItem(KEYS.CURRENT_USER);
    return null;
  }
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
  localStorage.removeItem(KEYS.ADMIN_AUTH);
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
      import('../services/supabaseClient.js').then(({ supabase, isSupabaseConfigured }) => {
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
      import('../services/supabaseClient.js').then(({ supabase, isSupabaseConfigured }) => {
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

export const unmatchUser = (userAId, userBId) => {
  if (!userAId || !userBId) return false;
  const users = getUsers();
  const userA = users.find(u => u.id === userAId);
  const userB = users.find(u => u.id === userBId);

  if (userA) {
    userA.matches = (userA.matches || []).filter(id => id !== userBId);
  }
  if (userB) {
    userB.matches = (userB.matches || []).filter(id => id !== userAId);
  }
  saveUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser) {
    if (currentUser.id === userAId) setCurrentUser(userA);
    if (currentUser.id === userBId) setCurrentUser(userB);
  }

  // Deactivate in Supabase
  if (typeof window !== 'undefined') {
    import('../services/supabaseClient.js').then(({ supabase, isSupabaseConfigured }) => {
      if (isSupabaseConfigured()) {
        supabase
          .from('matches')
          .update({ is_active: false })
          .or(`and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`)
          .then(() => {});
      }
    });
  }

  notifyDataChanged();
  return true;
};

