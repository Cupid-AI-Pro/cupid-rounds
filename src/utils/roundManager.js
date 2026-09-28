import { 
  getUsers, 
  saveUsers, 
  getActiveState, 
  setActiveState, 
  createMatch, 
  getCurrentUser, 
  setCurrentUser, 
  getStatesList,
  claimUserRefund 
} from './storage.js';
import { PLANS_INFO } from '../data/mockData.js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';

// Round State Storage Key
const ROUND_STATE_KEY = 'cupid_round_state_v2';
const CUSTOM_SCHEDULES_KEY = 'cupid_custom_schedules_v1';
const ENABLED_STATES_KEY = 'cupid_enabled_states_v1';

/**
 * State On/Off Toggles:
 * Admin can toggle any state ON/OFF.
 * Crucial guarantee: Even if a state is toggled OFF, every state's 10-day schedule remains strictly fixed!
 * Delhi NCR does not come early if UP is toggled OFF.
 */
export const getEnabledStates = () => {
  const states = getStatesList();
  const stored = localStorage.getItem(ENABLED_STATES_KEY);
  let map = {};
  if (stored) {
    try {
      map = JSON.parse(stored);
    } catch (e) {}
  }
  const result = {};
  states.forEach(st => {
    result[st] = typeof map[st] === 'boolean' ? map[st] : true;
  });
  return result;
};

export const isStateEnabled = (stateName) => {
  if (!stateName) return true;
  const map = getEnabledStates();
  return map[stateName] !== false;
};

export const toggleStateEnabled = (stateName, enabled) => {
  const map = getEnabledStates();
  map[stateName] = Boolean(enabled);
  localStorage.setItem(ENABLED_STATES_KEY, JSON.stringify(map));
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cupid_round_state_changed'));
    window.dispatchEvent(new CustomEvent('cupid_data_changed'));
  }
  return map;
};

/**
 * 10-Day Rotation Schedule:
 * Every state has a strictly fixed 10-day cycle position (offsetDay: index % 10).
 */
export const getRotationConfig = () => {
  const states = getStatesList();
  return states.map((state, index) => ({
    state,
    offsetDay: index % 10
  }));
};

/**
 * Automated 4-Phase Round Lifecycle:
 * 1. Day 1 (0 to 24 Hours): Entries Collection Only (Dashboard shows collecting entries countdown, no candidate profiles)
 * 2. Day 2 (Next 16 Hours): Elite Tier Spotlight Matching (Top 5 Elite males to Females, females pick up to 2, males decide)
 * 3. Day 2 (Next 8 Hours): Premium Tier Matching (Remaining females [top 4-7] sent to Premium males with 8h window)
 * 4. Settlement: Basic Allocation (Remaining pairs matched algorithmically; unmatched basic informed; round finalized)
 */
export const ROUND_PHASES = {
  ENTRIES_COLLECTION: 'entries_collection', // Day 1: 24h Registration & Entries only
  ELITE_MATCHING: 'elite_matching',         // Day 2 (16 Hours): Top 5 Elite males to females
  PREMIUM_MATCHING: 'premium_matching',     // Day 2 (8 Hours): Remaining females to premium males
  BASIC_SETTLEMENT: 'basic_settlement',     // Day 2 Settlement: Basic allocation & closure
  COMPLETED: 'completed',                    // Round finalized, logs archived, rotates to next state

  // Backward-compatible aliases for legacy components
  ENTRIES_SUBMISSION: 'entries_collection',
  LIVE_MATCHING: 'elite_matching',
  REGISTRATION: 'entries_collection',
  ELITE_WINDOW: 'elite_matching',
  PREMIUM_WINDOW: 'premium_matching'
};

export const PHASE_LABELS = {
  [ROUND_PHASES.ENTRIES_COLLECTION]: { 
    title: 'Entries & Profile Indexing', 
    subtitle: 'Collecting Entries for Matchmaking (Profiles locked until window closes)', 
    duration: '24 Hours (Day 1)', 
    durationHours: 24,
    step: 1 
  },
  [ROUND_PHASES.ELITE_MATCHING]: { 
    title: 'Elite Tier Matching Window', 
    subtitle: 'Top 5 Elite Males sent to Females (Pick up to 2). Males get notified & decide.', 
    duration: '16 Hours', 
    durationHours: 16,
    step: 2 
  },
  [ROUND_PHASES.PREMIUM_MATCHING]: { 
    title: 'Premium Tier Matching Window', 
    subtitle: 'Remaining Females (Top 4-7) sent to Premium Males with 8h Decision Window.', 
    duration: '8 Hours', 
    durationHours: 8,
    step: 3 
  },
  [ROUND_PHASES.BASIC_SETTLEMENT]: { 
    title: 'Basic Matching & Round Settlement', 
    subtitle: 'Remaining Pairs Matched Algorithmically & Round Archives Finalized.', 
    duration: 'Instant Settlement', 
    durationHours: 0,
    step: 4 
  },
  [ROUND_PHASES.COMPLETED]: { 
    title: 'Round Complete & Matches Delivered', 
    subtitle: '100% Mutual Matches Revealed. Next state in pipeline ready.', 
    duration: 'Finalized', 
    durationHours: 0,
    step: 5 
  }
};

/**
 * Initialize or get the global Round Management State
 */
export const getRoundState = () => {
  const defaultState = {
    activeState: 'Delhi NCR',
    roundNumber: 1,
    currentPhase: ROUND_PHASES.ENTRIES_SUBMISSION,
    roundStartDate: new Date().toISOString(),
    phaseStartedAt: new Date().toISOString(),
    pipelinedState: 'Uttar Pradesh',
    femaleMaxMatches: 2,
    stateRoundMap: {
      "Delhi NCR": 1,
      "Uttar Pradesh": 1,
      "Haryana": 1,
      "Punjab": 1,
      "Rajasthan": 1,
      "Maharashtra": 1,
      "Karnataka": 1,
      "Gujarat": 1,
      "West Bengal": 1,
      "Madhya Pradesh": 1
    },
    stats: {
      eliteMatches: 0,
      premiumMatches: 0,
      basicMatches: 0,
      refundCount: 0
    }
  };

  const stored = localStorage.getItem(ROUND_STATE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultState,
          ...parsed,
          activeState: parsed.activeState || defaultState.activeState,
          roundNumber: parsed.roundNumber || defaultState.roundNumber,
          currentPhase: parsed.currentPhase || defaultState.currentPhase,
          femaleMaxMatches: parsed.femaleMaxMatches || 2
        };
      }
    } catch (e) {}
  }

  localStorage.setItem(ROUND_STATE_KEY, JSON.stringify(defaultState));
  return defaultState;
};

/**
 * Sync round state to Supabase so all devices (phones & PCs) see the live round instantly
 */
export const syncRoundStateToSupabase = async (state) => {
  if (!isSupabaseConfigured() || !state) return;
  try {
    const payload = {
      state: state.activeState || 'Delhi NCR',
      round_number: Number(state.roundNumber) || 1,
      phase: state.currentPhase || ROUND_PHASES.REGISTRATION,
      female_max_matches: Number(state.femaleMaxMatches) || 2,
      phase_started_at: state.phaseStartedAt || new Date().toISOString(),
      is_active: true
    };

    const { data: existing, error: selectErr } = await supabase
      .from('rounds')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from('rounds')
        .update(payload)
        .eq('id', existing[0].id);
    } else {
      await supabase
        .from('rounds')
        .insert(payload);
    }
  } catch (err) {
    console.warn('[Supabase] syncRoundStateToSupabase error:', err);
  }
};

/**
 * Fetch active round state from Supabase to synchronize client
 */
export const fetchRoundStateFromSupabase = async () => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('rounds')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const remote = data[0];
    const local = getRoundState();

    const hasChanged = 
      remote.state !== local.activeState ||
      remote.phase !== local.currentPhase ||
      remote.round_number !== local.roundNumber;

    if (hasChanged) {
      const merged = {
        ...local,
        activeState: remote.state,
        currentPhase: remote.phase,
        roundNumber: remote.round_number || 1,
        femaleMaxMatches: remote.female_max_matches || 2,
        phaseStartedAt: remote.phase_started_at || local.phaseStartedAt
      };
      localStorage.setItem(ROUND_STATE_KEY, JSON.stringify(merged));
      if (merged.activeState) {
        setActiveState(merged.activeState);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cupid_round_state_changed'));
        window.dispatchEvent(new CustomEvent('cupid_data_changed'));
      }
      return merged;
    }
    return local;
  } catch (err) {
    console.warn('[Supabase] fetchRoundStateFromSupabase error:', err);
    return null;
  }
};

/**
 * Listen to realtime changes in Supabase rounds table
 */
export const subscribeToRoundChanges = (callback) => {
  if (!isSupabaseConfigured()) return () => {};
  try {
    const channel = supabase
      .channel('cupid_live_rounds_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds' },
        async () => {
          const fresh = await fetchRoundStateFromSupabase();
          if (fresh && callback) callback(fresh);
        }
      )
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

export const saveRoundState = (state) => {
  localStorage.setItem(ROUND_STATE_KEY, JSON.stringify(state));
  if (state.activeState) {
    setActiveState(state.activeState);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cupid_round_state_changed'));
  }
  // Async push to Supabase for multi-device sync
  syncRoundStateToSupabase(state);
};

/**
 * Custom override schedule storage helper
 */
const getCustomSchedules = () => {
  const json = localStorage.getItem(CUSTOM_SCHEDULES_KEY);
  return json ? JSON.parse(json) : {};
};

export const updateStateScheduleDate = (stateName, dateString, roundNum = 1) => {
  const customMap = getCustomSchedules();
  customMap[stateName] = {
    customDate: dateString,
    roundNumber: Number(roundNum) || 1,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(CUSTOM_SCHEDULES_KEY, JSON.stringify(customMap));
};

/**
 * Calculate the next upcoming round date for any state based on fixed 10-day cycle
 * User requirement: Even if a state is toggled OFF, every state's 10-day schedule remains strictly fixed!
 * Delhi NCR does not come early if UP is toggled OFF. Each round only comes after 10 days.
 */
export const getStateRoundSchedule = (stateName) => {
  const roundState = getRoundState();
  const rotationConfig = getRotationConfig();
  const isEnabled = isStateEnabled(stateName);

  const configIndex = rotationConfig.findIndex(s => s.state.toLowerCase() === stateName.toLowerCase());
  const activeIndex = rotationConfig.findIndex(s => s.state.toLowerCase() === roundState.activeState.toLowerCase());

  const safeConfigIndex = configIndex !== -1 ? configIndex : 0;
  const safeActiveIndex = activeIndex !== -1 ? activeIndex : 0;

  // STRICT 10-Day Cycle Difference
  const daysDifference = (safeConfigIndex - safeActiveIndex + 10) % 10;
  const isToday = daysDifference === 0 && stateName.toLowerCase() === roundState.activeState.toLowerCase();

  const customMap = getCustomSchedules();
  if (customMap[stateName] && customMap[stateName].customDate) {
    const customDate = new Date(customMap[stateName].customDate);
    const formatted = customDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      year: 'numeric'
    });
    return {
      state: stateName,
      isToday,
      isEnabled,
      isPaused: !isEnabled,
      daysLeft: daysDifference,
      nextRoundDate: formatted,
      rawDate: customMap[stateName].customDate,
      roundNumber: customMap[stateName].roundNumber || roundState.roundNumber,
      status: !isEnabled ? 'Round Paused by Administration' : (isToday ? 'Live Today' : `In ${daysDifference} Days`)
    };
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysDifference);

  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });

  return {
    state: stateName,
    isToday,
    isEnabled,
    isPaused: !isEnabled,
    daysLeft: daysDifference,
    nextRoundDate: formattedDate,
    rawDate: targetDate.toISOString().split('T')[0],
    roundNumber: roundState.roundNumber,
    status: !isEnabled ? 'Round Paused by Administration' : (isToday ? 'Live Today' : `In ${daysDifference} Days`)
  };
};

/**
 * Multi-State Pipeline Engine Status:
 * Returns the current overlapping 2-day pipeline state:
 * - Live Matching State (Day 2: 24h to 48h)
 * - Pipelined Entries State (Day 1: 0 to 24h)
 */
export const getPipelinedRoundStatus = () => {
  const current = getRoundState();
  const states = getStatesList();
  const currentIdx = states.findIndex(s => s.toLowerCase() === (current.activeState || '').toLowerCase());
  const safeCurrentIdx = currentIdx !== -1 ? currentIdx : 0;

  // Next state in rotation
  const nextIdx = (safeCurrentIdx + 1) % states.length;
  const nextState = states[nextIdx];

  const currentEnabled = isStateEnabled(current.activeState);
  const nextEnabled = isStateEnabled(nextState);

  return {
    activeState: current.activeState,
    activePhase: current.currentPhase,
    activeStateEnabled: currentEnabled,
    roundNumber: current.roundNumber,
    
    // Pipelined secondary state in Day 1 (Entries submission)
    pipelinedState: nextState,
    pipelinedStateEnabled: nextEnabled,
    pipelinedPhase: ROUND_PHASES.ENTRIES_SUBMISSION,

    allSchedules: getAllStateSchedules()
  };
};

/**
 * Calculate upcoming minutes until a specific state's round goes live in 1-hour testing rotation
 */
export const getStateUpcomingMins = (stateName) => {
  const roundState = getRoundState();
  if (!stateName || stateName.toLowerCase() === (roundState.activeState || '').toLowerCase()) {
    return 0; // Currently live!
  }

  const states = getStatesList();
  const currentIdx = states.findIndex(s => s.toLowerCase() === (roundState.activeState || '').toLowerCase());
  const targetIdx = states.findIndex(s => s.toLowerCase() === stateName.toLowerCase());

  const safeCurrentIdx = currentIdx !== -1 ? currentIdx : 0;
  const safeTargetIdx = targetIdx !== -1 ? targetIdx : 0;

  // Number of state steps ahead in rotation list
  const stepsAhead = (safeTargetIdx - safeCurrentIdx + states.length) % states.length;

  // Minutes remaining in current active state round (1-hour = 60 mins total)
  const started = new Date(roundState.roundStartDate || roundState.phaseStartedAt || Date.now());
  const elapsedMins = Math.max(0, (new Date().getTime() - started.getTime()) / (1000 * 60));
  const minsRemainingInCurrent = Math.max(1, Math.ceil(60 - elapsedMins));

  // Each step ahead adds 60 minutes
  const totalMins = Math.ceil(minsRemainingInCurrent + ((stepsAhead - 1) * 60));
  return Math.max(1, totalMins);
};

/**
 * Get all states' 10-day schedule overview
 */
export const getAllStateSchedules = () => {
  return getStatesList().map(st => getStateRoundSchedule(st));
};

/**
 * PHASE TRANSITION & AUTOMATED DISTRIBUTION ENGINES
 */
import { calculateCompatibilityScore } from './compatibility.js';

/**
 * TIER 1: Elite Profile Distribution to Females (16-Hour Matching Window)
 * - Ranks Elite males by mutual preference compatibility with each female.
 * - Sends top 5 (or all available) Elite males to female's assignedCandidates.
 * - Notifies females: "Choose your match! Top 5 Elite profiles are ready."
 */
export const distributeEliteProfilesToFemales = (targetStateName) => {
  const stateName = targetStateName || getRoundState().activeState || 'Delhi NCR';
  const allUsers = getUsers();
  const stateUsers = allUsers.filter(u => (u.state || '').toLowerCase() === stateName.toLowerCase() && u.status === 'active');

  const females = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'female');
  const eliteMales = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'male' && u.plan === 'elite');

  females.forEach(female => {
    // Score all elite males against this female's preferences
    const scoredMales = eliteMales.map(male => ({
      male,
      score: calculateCompatibilityScore(male, female)
    })).sort((a, b) => b.score - a.score);

    // Pick top 5 (or all available if < 5)
    const top5 = scoredMales.slice(0, 5).map(item => item.male.id);
    female.assignedCandidates = top5;
    female.assignedEliteCandidates = top5;

    // Send in-app and push notification
    import('../services/notificationManager').then(({ addNotification }) => {
      addNotification(female.id, {
        type: 'match_ready',
        title: 'Profiles Are Ready! 💖',
        message: `Top ${top5.length} Elite profiles curated for you in Round #${getRoundState().roundNumber || 1}. Choose up to 2 matches within 16 hours!`,
        actionUrl: 'explore'
      });
    }).catch(() => {});
  });

  saveUsers(allUsers);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_data_changed'));
  }
  return { femaleCount: females.length, eliteMaleCount: eliteMales.length };
};

/**
 * TIER 2: Premium Profile Distribution to Males (8-Hour Matching Window)
 * - Auto-refunds any Elite males who got 0 matches during 16h window.
 * - Identifies remaining available females (< 2 matches).
 * - Sends top 4 to 7 females to each Premium male based on preferences.
 * - Notifies Premium males: "Profiles ready! Choose your match within 8 hours."
 */
export const distributePremiumProfilesToMales = (targetStateName) => {
  const stateName = targetStateName || getRoundState().activeState || 'Delhi NCR';
  const allUsers = getUsers();
  const stateUsers = allUsers.filter(u => (u.state || '').toLowerCase() === stateName.toLowerCase() && u.status === 'active');

  // 1. Auto-refund Elite males who didn't get any mutual matches
  const eliteMales = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'male' && u.plan === 'elite');
  eliteMales.forEach(male => {
    const hasMatch = Array.isArray(male.matches) && male.matches.length > 0;
    if (!hasMatch && !male.refundClaimedInRound) {
      claimUserRefund(male.id, 'Auto-refund: 16h Elite matching window expired without a mutual match');
    }
  });

  // 2. Find remaining available females (less than 2 matches)
  const availableFemales = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'female' && (!u.matches || u.matches.length < 2));
  const premiumMales = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'male' && u.plan === 'premium' && (!u.matches || u.matches.length === 0));

  premiumMales.forEach(male => {
    const scoredFemales = availableFemales.map(female => ({
      female,
      score: calculateCompatibilityScore(male, female)
    })).sort((a, b) => b.score - a.score);

    // Pick top 4 to 7 females (or all remaining if < 4)
    const countToPick = Math.min(Math.max(4, Math.min(7, scoredFemales.length)), scoredFemales.length);
    const topCandidates = scoredFemales.slice(0, countToPick).map(item => item.female.id);
    male.assignedCandidates = topCandidates;
    male.assignedPremiumCandidates = topCandidates;

    import('../services/notificationManager').then(({ addNotification }) => {
      addNotification(male.id, {
        type: 'match_ready',
        title: 'Premium Profiles Ready! ✨',
        message: `Top ${topCandidates.length} profiles waiting for your review in Round #${getRoundState().roundNumber || 1}. 8 hours remaining to select!`,
        actionUrl: 'explore'
      });
    }).catch(() => {});
  });

  saveUsers(allUsers);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_data_changed'));
  }
  return { availableFemalesCount: availableFemales.length, premiumMalesCount: premiumMales.length };
};

/**
 * TIER 3: Basic Settlement & Completion
 * - Auto-refunds any Premium males who got 0 matches during 8h window.
 * - Algorithmically pairs remaining females with Basic males.
 * - Delivers confirmed matches immediately to dashboards.
 * - Informs unmatched Basic males with polite notice ("Next time choose refundable plans").
 * - Archives round snapshot to Round Logs!
 */
export const settleBasicUsersMatching = (targetStateName) => {
  const stateName = targetStateName || getRoundState().activeState || 'Delhi NCR';
  const allUsers = getUsers();
  const stateUsers = allUsers.filter(u => (u.state || '').toLowerCase() === stateName.toLowerCase() && u.status === 'active');

  // 1. Auto-refund Premium males who didn't get any mutual matches
  const premiumMales = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'male' && u.plan === 'premium');
  premiumMales.forEach(male => {
    const hasMatch = Array.isArray(male.matches) && male.matches.length > 0;
    if (!hasMatch && !male.refundClaimedInRound) {
      claimUserRefund(male.id, 'Auto-refund: 8h Premium matching window expired without a match');
    }
  });

  // 2. Remaining available females & Basic males
  const freshUsers = getUsers();
  const remainingFemales = freshUsers.filter(u => (u.state || '').toLowerCase() === stateName.toLowerCase() && u.status === 'active' && (u.gender || '').toLowerCase() === 'female' && (!u.matches || u.matches.length < 2));
  const remainingBasicMales = freshUsers.filter(u => (u.state || '').toLowerCase() === stateName.toLowerCase() && u.status === 'active' && (u.gender || '').toLowerCase() === 'male' && (!u.plan || u.plan === 'basic') && (!u.matches || u.matches.length === 0));

  let basicMatchesCount = 0;
  const candidatePairs = [];
  remainingBasicMales.forEach(m => {
    remainingFemales.forEach(f => {
      const score = calculateCompatibilityScore(m, f);
      candidatePairs.push({ male: m, female: f, score });
    });
  });

  candidatePairs.sort((a, b) => b.score - a.score);

  candidatePairs.forEach(pair => {
    const freshM = freshUsers.find(u => u.id === pair.male.id);
    const freshF = freshUsers.find(u => u.id === pair.female.id);
    if (freshM && freshF) {
      const maleHasMatch = freshM.matches && freshM.matches.length >= 1;
      const femaleHasMatches = freshF.matches && freshF.matches.length >= 2;
      const alreadyMatched = freshM.matches && freshM.matches.includes(freshF.id);

      if (!maleHasMatch && !femaleHasMatches && !alreadyMatched) {
        createMatch(freshM.id, freshF.id);
        freshM.matchScore = pair.score;
        freshF.matchScore = pair.score;
        basicMatchesCount++;
      }
    }
  });

  // 3. Notify unmatched Basic males
  const finalUsers = getUsers();
  const unmatchedBasic = finalUsers.filter(u => (u.state || '').toLowerCase() === stateName.toLowerCase() && u.status === 'active' && (u.gender || '').toLowerCase() === 'male' && (!u.plan || u.plan === 'basic') && (!u.matches || u.matches.length === 0));
  unmatchedBasic.forEach(u => {
    u.unmatchedNotice = true;
    import('../services/notificationManager').then(({ addNotification }) => {
      addNotification(u.id, {
        type: 'round_complete',
        title: 'Round Complete',
        message: "We're sorry, no mutual match could be found for your profile this round. Next time, choose our Refundable Plans (Elite or Premium) for priority matching and 100% money-back guarantee!",
        actionUrl: 'profile'
      });
    }).catch(() => {});
  });

  saveUsers(finalUsers);

  // 4. Archive snapshot to Round Logs
  archiveCurrentRound('completed', `Automated round completed for ${stateName}`);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_data_changed'));
  }

  return { basicMatches: basicMatchesCount };
};

export const advanceRoundPhase = () => {
  const current = getRoundState();
  let nextPhase = current.currentPhase;

  if (current.currentPhase === ROUND_PHASES.ENTRIES_COLLECTION || current.currentPhase === 'entries_submission') {
    // Transition: Entries (24h) -> Elite Tier Matching (16h)
    nextPhase = ROUND_PHASES.ELITE_MATCHING;
    distributeEliteProfilesToFemales(current.activeState);

  } else if (current.currentPhase === ROUND_PHASES.ELITE_MATCHING || current.currentPhase === 'live_matching') {
    // Transition: Elite (16h) -> Premium Tier Matching (8h)
    nextPhase = ROUND_PHASES.PREMIUM_MATCHING;
    distributePremiumProfilesToMales(current.activeState);

  } else if (current.currentPhase === ROUND_PHASES.PREMIUM_MATCHING) {
    // Transition: Premium (8h) -> Basic Settlement
    nextPhase = ROUND_PHASES.BASIC_SETTLEMENT;
    settleBasicUsersMatching(current.activeState);

  } else if (current.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT || current.currentPhase === ROUND_PHASES.COMPLETED) {
    // Completed! Rotate state to next state in fixed 10-day cycle!
    const states = getStatesList();
    const currentIdx = states.findIndex(s => s.toLowerCase() === (current.activeState || '').toLowerCase());
    const nextIdx = (currentIdx + 1) % states.length;
    const nextState = states[nextIdx];

    return startNextRoundForState(nextState);
  }

  const updatedState = {
    ...current,
    currentPhase: nextPhase,
    phaseStartedAt: new Date().toISOString()
  };

  saveRoundState(updatedState);
  return updatedState;
};

/**
 * Force rotate active round to the NEXT state immediately
 */
export const forceRotateToNextState = () => {
  const current = getRoundState();
  settleBasicUsersMatching(current.activeState);

  const states = getStatesList();
  const currentIdx = states.findIndex(s => s.toLowerCase() === (current.activeState || '').toLowerCase());
  const nextIdx = (currentIdx + 1) % states.length;
  const nextState = states[nextIdx];

  const updated = startNextRoundForState(nextState);

  // Dispatch live round notification for candidates of the new state
  const allUsers = getUsers();
  allUsers.forEach(u => {
    if (u.state && u.state.toLowerCase() === nextState.toLowerCase()) {
      import('../services/notificationManager').then(({ addNotification }) => {
        addNotification(u.id, {
          type: 'round_live',
          title: 'Live Round Start',
          message: `Round ${updated.roundNumber || 1} for ${nextState} is now LIVE! Join now to submit your entry.`,
          actionUrl: 'explore'
        });
      });
    }
  });

  return updated;
};

export const runAlgorithmicMatchEngine = (targetStateName) => {
  const state = targetStateName || getRoundState().activeState || 'Delhi NCR';
  distributeEliteProfilesToFemales(state);
  distributePremiumProfilesToMales(state);
  return settleBasicUsersMatching(state);
};



/**
 * Start a brand new round for the state (Round 2, Round 3, etc.)
 */
export const startNextRoundForState = (stateName) => {
  const current = getRoundState();
  const allUsers = getUsers();

  const stateRoundMap = current.stateRoundMap || {};
  const currentRoundForState = stateRoundMap[stateName] || 1;
  const newRoundNumber = currentRoundForState + 1;
  stateRoundMap[stateName] = newRoundNumber;

  // Archive & prepare users for next round
  allUsers.forEach(u => {
    if (u.state === stateName) {
      u.lastRoundMatches = [...(u.matches || [])];
      u.matches = [];
      u.likes = [];
      u.dislikes = [];
      u.receivedLikes = [];
      u.suggestedMatches = [];
      u.eliteSpotlight = [];
      u.roundParticipating = false; // Must re-confirm or purchase plan for Round 2
      if (u.status === 'active') {
        u.status = 'round_pending'; // Prompts user to review profile & choose plan
      }
    }
  });

  saveUsers(allUsers);

  const updatedState = {
    ...current,
    activeState: stateName,
    roundNumber: newRoundNumber,
    stateRoundMap: stateRoundMap,
    currentPhase: ROUND_PHASES.REGISTRATION,
    roundStartDate: new Date().toISOString(),
    phaseStartedAt: new Date().toISOString(),
    femaleMaxMatches: 2,
    stats: {
      eliteMatches: 0,
      premiumMatches: 0,
      basicMatches: 0,
      refundCount: 0
    }
  };

  saveRoundState(updatedState);
  return updatedState;
};

/**
 * Re-join/Participate in Round 2, Round 3
 */
export const joinRound = (userId, planName = 'basic') => {
  const allUsers = getUsers();
  const user = allUsers.find(u => u.id === userId);
  if (user) {
    user.plan = (user.gender || '').toLowerCase() === 'female' ? 'free' : planName;
    user.status = 'active';
    user.roundParticipating = true;
    user.refundRequested = false;
    user.refundEligible = false;
    user.refundStatus = null;
    saveUsers(allUsers);
    
    const current = getCurrentUser();
    if (current && current.id === userId) {
      setCurrentUser(user);
    }
    return user;
  }
  return null;
};

/**
 * Automated 2-Day (48-Hour) Round Timer & Pipelined State Rotation Engine
 *
 * User specification:
 * - Each round lasts exactly 2 DAYS (48 Hours).
 * - Day 1 (First 24 Hours): Entries submission & payment verification (Auto-approved by default; Admin can reject fake payments).
 * - Day 2 (Next 24 Hours): Live browsing & matching (16h timer for Elite, 8h timer for Premium).
 * - Hour 48: Instant Matching Delivered & Refund queue populated for unmatched paid users.
 * - Pipelining: While State A is in Day 2 (Matching), State B (next in 10-day cycle) starts Day 1 (Entries), unless toggled OFF!
 */
export const checkAndRotateRoundAutomated = () => {
  const current = getRoundState();
  if (!current || current.isPaused) return;

  const now = Date.now();
  const phaseStart = new Date(current.phaseStartedAt || current.roundStartDate || Date.now()).getTime();
  const elapsedSecs = Math.max(0, Math.floor((now - phaseStart) / 1000));

  const isFastDemo = typeof window !== 'undefined' && localStorage.getItem('cupid_demo_rotation_speed') === 'fast';

  // Strict User-Specified Phase Durations:
  // Phase 1 (Entries Collection): 24 Hours = 86400s (or 120s in demo)
  // Phase 2 (Elite Matching): 16 Hours = 57600s (or 120s in demo)
  // Phase 3 (Premium Matching): 8 Hours = 28800s (or 60s in demo)
  // Phase 4 (Basic Settlement): Settlement & Rotation
  let phaseDurationSecs = 86400; // default 24h
  if (current.customDurationHours) {
    phaseDurationSecs = current.customDurationHours * 3600;
  } else if (current.currentPhase === ROUND_PHASES.ENTRIES_COLLECTION || current.currentPhase === 'entries_submission') {
    phaseDurationSecs = isFastDemo ? 120 : 86400; // 24 Hours
  } else if (current.currentPhase === ROUND_PHASES.ELITE_MATCHING || current.currentPhase === 'live_matching') {
    phaseDurationSecs = isFastDemo ? 120 : 57600; // 16 Hours
  } else if (current.currentPhase === ROUND_PHASES.PREMIUM_MATCHING) {
    phaseDurationSecs = isFastDemo ? 60 : 28800; // 8 Hours
  } else if (current.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT || current.currentPhase === ROUND_PHASES.COMPLETED) {
    phaseDurationSecs = isFastDemo ? 30 : 3600;
  }

  // If time in current phase has elapsed, transition automatically!
  if (elapsedSecs >= phaseDurationSecs) {
    advanceRoundPhase();
  }
};

// ─── ROUND LOGS & HISTORICAL ARCHIVE ENGINE ──────────────────────────────────
export const ROUND_LOGS_KEY = 'cupid_round_history_logs_v1';

export const getRoundLogs = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ROUND_LOGS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }

  // Initial seed archive if no logs exist yet
  const initialLogs = [
    {
      id: 'log_delhi_ncr_r1_init',
      state: 'Delhi NCR',
      roundNumber: 1,
      startDate: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      completedDate: new Date().toISOString(),
      status: 'completed',
      notes: 'Official Inaugural Round for Delhi NCR',
      totalParticipants: 48,
      maleParticipants: 28,
      femaleParticipants: 20,
      participants: [
        { id: 'p_1', name: 'Kabir Verma', gender: 'male', plan: 'elite', email: 'kabir.v@gmail.com', phone: '+91 98112 34567', university: 'Bennett University', status: 'active', matches: ['p_2'] },
        { id: 'p_2', name: 'Ananya Sharma', gender: 'female', plan: 'free', email: 'ananya.s@gmail.com', phone: '+91 98223 45678', university: 'Bennett University', status: 'active', matches: ['p_1'] },
        { id: 'p_3', name: 'Rohan Gupta', gender: 'male', plan: 'premium', email: 'rohan.g@gmail.com', phone: '+91 98334 56789', university: 'IIT Delhi', status: 'active', matches: ['p_4'] },
        { id: 'p_4', name: 'Rhea Kapoor', gender: 'female', plan: 'free', email: 'rhea.k@gmail.com', phone: '+91 98445 67890', university: 'IIT Delhi', status: 'active', matches: ['p_3'] },
        { id: 'p_5', name: 'Arjun Singhal', gender: 'male', plan: 'elite', email: 'arjun.s@gmail.com', phone: '+91 98556 78901', university: 'Sharda University', status: 'active', matches: [] }
      ],
      matches: [
        {
          male: { id: 'p_1', name: 'Kabir Verma', email: 'kabir.v@gmail.com', avatar: '/avatars/kabir.jpg', plan: 'elite' },
          female: { id: 'p_2', name: 'Ananya Sharma', email: 'ananya.s@gmail.com', avatar: '/avatars/ananya.jpg', plan: 'free' },
          compatibilityScore: 96,
          matchedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
        },
        {
          male: { id: 'p_3', name: 'Rohan Gupta', email: 'rohan.g@gmail.com', avatar: '/avatars/aarav.jpg', plan: 'premium' },
          female: { id: 'p_4', name: 'Rhea Kapoor', email: 'rhea.k@gmail.com', avatar: '/avatars/rhea.jpg', plan: 'free' },
          compatibilityScore: 91,
          matchedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
        }
      ],
      refunds: [
        {
          userId: 'p_5',
          userName: 'Arjun Singhal',
          userPhone: '+91 98556 78901',
          userEmail: 'arjun.s@gmail.com',
          plan: 'elite',
          amount: 449,
          upiId: 'arjun.singhal@okhdfcbank',
          reason: 'No mutual match found in Round #1',
          status: 'pending',
          utr: null
        }
      ]
    }
  ];

  localStorage.setItem(ROUND_LOGS_KEY, JSON.stringify(initialLogs));
  return initialLogs;
};

export const archiveCurrentRound = (status = 'completed', notes = '') => {
  const current = getRoundState();
  const stateName = current.activeState || 'Delhi NCR';
  const roundNum = current.roundNumber || 1;
  const allUsers = getUsers();
  const stateUsers = allUsers.filter(u => (u.state || '').toLowerCase() === stateName.toLowerCase());

  const males = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'male');
  const females = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'female');

  // Collect matches
  const matchedPairs = [];
  const processedPairKeys = new Set();

  stateUsers.forEach(u => {
    if (Array.isArray(u.matches) && u.matches.length > 0) {
      u.matches.forEach(mId => {
        const partner = allUsers.find(p => p.id === mId);
        if (partner) {
          const key = [u.id, partner.id].sort().join('__');
          if (!processedPairKeys.has(key)) {
            processedPairKeys.add(key);
            const isMaleA = (u.gender || '').toLowerCase() === 'male';
            matchedPairs.push({
              male: {
                id: isMaleA ? u.id : partner.id,
                name: isMaleA ? u.name : partner.name,
                email: isMaleA ? u.email : partner.email,
                avatar: (isMaleA ? u.avatar : partner.avatar) || (isMaleA ? u.photos?.[0] : partner.photos?.[0]),
                plan: isMaleA ? u.plan : partner.plan
              },
              female: {
                id: !isMaleA ? u.id : partner.id,
                name: !isMaleA ? u.name : partner.name,
                email: !isMaleA ? u.email : partner.email,
                avatar: (!isMaleA ? u.avatar : partner.avatar) || (!isMaleA ? u.photos?.[0] : partner.photos?.[0]),
                plan: !isMaleA ? u.plan : partner.plan
              },
              compatibilityScore: u.matchScore || partner.matchScore || 92,
              matchedAt: new Date().toISOString()
            });
          }
        }
      });
    }
  });

  // Collect refunds
  const refundItems = stateUsers
    .filter(u => u.refundEligible === true || u.refundStatus || u.status === 'refund_requested' || u.status === 'refunded')
    .map(u => ({
      userId: u.id,
      userName: u.name,
      userPhone: u.phone,
      userEmail: u.email,
      plan: u.plan || 'elite',
      amount: u.refundAmount || (u.plan === 'elite' ? 449 : u.plan === 'premium' ? 250 : 100),
      upiId: u.refundUpi || u.phone || 'upi@bank',
      reason: u.refundReason || 'No mutual match found',
      status: u.refundStatus || 'pending',
      utr: u.refundUtr || null
    }));

  const newLogEntry = {
    id: `log_${stateName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_r${roundNum}_${Date.now()}`,
    state: stateName,
    roundNumber: roundNum,
    startDate: current.roundStartDate || current.phaseStartedAt || new Date().toISOString(),
    completedDate: new Date().toISOString(),
    status,
    notes: notes || `Archived on ${new Date().toLocaleDateString()}`,
    totalParticipants: stateUsers.length,
    maleParticipants: males.length,
    femaleParticipants: females.length,
    participants: stateUsers.map(u => ({
      id: u.id,
      name: u.name,
      gender: u.gender,
      email: u.email,
      phone: u.phone,
      plan: u.plan,
      avatar: u.avatar || u.photos?.[0],
      university: u.university,
      branch: u.branch,
      status: u.status,
      paymentVerified: u.paymentVerified,
      refundEligible: u.refundEligible,
      refundStatus: u.refundStatus,
      refundUpi: u.refundUpi,
      matches: u.matches || []
    })),
    matches: matchedPairs,
    refunds: refundItems
  };

  const logs = getRoundLogs();
  logs.unshift(newLogEntry);
  localStorage.setItem(ROUND_LOGS_KEY, JSON.stringify(logs));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_round_state_changed'));
    window.dispatchEvent(new CustomEvent('cupid_data_changed'));
  }

  return newLogEntry;
};

export const deleteRoundLog = (logId) => {
  const logs = getRoundLogs();
  const filtered = logs.filter(l => l.id !== logId);
  localStorage.setItem(ROUND_LOGS_KEY, JSON.stringify(filtered));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cupid_data_changed'));
  }
  return filtered;
};

// ─── ROUND TIMING & PHASE ALTERATION CONTROLS ────────────────────────────────
export const alterRoundTiming = ({
  newPhase = null,
  extendHours = null,
  customStartDate = null,
  customPhaseDate = null,
  customRoundNumber = null,
  customDurationHours = null
}) => {
  const current = getRoundState();
  const updated = { ...current };

  if (newPhase) {
    updated.currentPhase = newPhase;
    updated.phaseStartedAt = new Date().toISOString();

    // Trigger distribution logic immediately for the selected phase
    if (newPhase === ROUND_PHASES.ELITE_MATCHING || newPhase === 'elite_matching') {
      distributeEliteProfilesToFemales(updated.activeState);
    } else if (newPhase === ROUND_PHASES.PREMIUM_MATCHING || newPhase === 'premium_matching') {
      distributePremiumProfilesToMales(updated.activeState);
    } else if (newPhase === ROUND_PHASES.BASIC_SETTLEMENT || newPhase === 'basic_settlement') {
      settleBasicUsersMatching(updated.activeState);
    }
  }

  if (customRoundNumber !== null && customRoundNumber !== undefined) {
    updated.roundNumber = Number(customRoundNumber) || updated.roundNumber;
  }

  if (customStartDate) {
    updated.roundStartDate = new Date(customStartDate).toISOString();
  }

  if (customPhaseDate) {
    updated.phaseStartedAt = new Date(customPhaseDate).toISOString();
  }

  if (extendHours && typeof extendHours === 'number') {
    // Extending current phase by pushing phaseStartedAt forward
    const currentStart = new Date(updated.phaseStartedAt || Date.now());
    currentStart.setHours(currentStart.getHours() + extendHours);
    updated.phaseStartedAt = currentStart.toISOString();
  }

  if (customDurationHours) {
    updated.customDurationHours = Number(customDurationHours);
  }

  saveRoundState(updated);
  return updated;
};

export const pauseOrCancelActiveRound = (reason = 'Round temporarily paused by administration') => {
  const current = getRoundState();
  const updated = {
    ...current,
    isPaused: true,
    pauseReason: reason,
    pausedAt: new Date().toISOString()
  };
  saveRoundState(updated);
  return updated;
};

export const resumeActiveRound = () => {
  const current = getRoundState();
  const updated = {
    ...current,
    isPaused: false,
    pauseReason: null,
    phaseStartedAt: new Date().toISOString()
  };
  saveRoundState(updated);
  return updated;
};

export const skipActiveRound = (notes = 'Skipped by admin') => {
  // Archive current round snapshot before skipping
  archiveCurrentRound('skipped', notes);
  // Force rotate to next state
  return forceRotateToNextState();
};

