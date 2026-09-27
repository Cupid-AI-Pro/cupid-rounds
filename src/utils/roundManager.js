import { getUsers, saveUsers, getActiveState, setActiveState, createMatch, getCurrentUser, setCurrentUser, getStatesList } from './storage.js';
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
 * 2-Day (48-Hour) Round Lifecyle:
 * - Day 1 (0 to 24 Hours): Entries & Payment Submission (Auto-approved by default; Admin can reject fake payments)
 * - Day 2 (24 to 48 Hours): Live Browsing & Matching (Elite 16h early spotlight, Premium 8h, Basic Open)
 * - Hour 48: Instant Matching Delivered & Refund queue populated for unmatched paid users
 */
export const ROUND_PHASES = {
  ENTRIES_SUBMISSION: 'entries_submission', // Day 1: 24h Registration, Profiles & Auto-Approved Payments
  LIVE_MATCHING: 'live_matching',           // Day 2: 24h Live Browsing (Elite 16h, Premium 8h, Basic Open)
  COMPLETED: 'completed',                    // Hour 48: Round closed, matches revealed, refunds queued
  
  // Backward-compatible aliases for legacy imports
  REGISTRATION: 'entries_submission',
  ELITE_WINDOW: 'live_matching',
  PREMIUM_WINDOW: 'live_matching',
  BASIC_SETTLEMENT: 'live_matching'
};

export const PHASE_LABELS = {
  [ROUND_PHASES.ENTRIES_SUBMISSION]: { 
    title: 'Entries & Payment Submission', 
    subtitle: 'Profiles & Auto-Approved Payments Open (Admin Manual Rejection)', 
    duration: '24 Hours (Day 1)', 
    step: 1 
  },
  [ROUND_PHASES.LIVE_MATCHING]: { 
    title: 'Live Browsing & Matching Window', 
    subtitle: 'Elite (16h Window), Premium (8h Window) & Basic Allocation', 
    duration: '24 Hours (Day 2)', 
    step: 2 
  },
  [ROUND_PHASES.COMPLETED]: { 
    title: 'Round Complete & Matches Delivered', 
    subtitle: '100% Mutual Matches Revealed. Refunds ready for unmatched paid entries.', 
    duration: 'Finalized', 
    step: 3 
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
 * PHASE TRANSITION LOGIC: Advance round to next phase
 */
import { calculateCompatibilityScore } from './compatibility.js';

export const advanceRoundPhase = () => {
  const current = getRoundState();
  let nextPhase = current.currentPhase;

  if (current.currentPhase === ROUND_PHASES.REGISTRATION) {
    // Transition from Registration (24h) -> Elite Window (16h)
    nextPhase = ROUND_PHASES.ELITE_WINDOW;
    runAlgorithmicMatchEngine(current.activeState);

  } else if (current.currentPhase === ROUND_PHASES.ELITE_WINDOW) {
    // Transition from Elite -> Premium Window (8h)
    nextPhase = ROUND_PHASES.PREMIUM_WINDOW;
    runAlgorithmicMatchEngine(current.activeState);

  } else if (current.currentPhase === ROUND_PHASES.PREMIUM_WINDOW) {
    // Transition from Premium -> Basic Settlement
    nextPhase = ROUND_PHASES.BASIC_SETTLEMENT;
    runAlgorithmicMatchEngine(current.activeState);

  } else if (current.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT || current.currentPhase === ROUND_PHASES.COMPLETED) {
    // Current state round is completed! Run matching engine & rotate state to NEXT state in rotation list!
    runAlgorithmicMatchEngine(current.activeState);

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
  runAlgorithmicMatchEngine(current.activeState);

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
          message: `Round ${updated.roundNumber || 1} for ${nextState} is now LIVE! Join now to view matches.`,
          actionUrl: 'explore'
        });
      });
    }
  });

  return updated;
};

/**
 * 3-Tier Algorithmic Matching Engine for Cupid Rounds
 * 1. Elite (₹449) Spotlight Window -> Highest compatibility Elite Boys shown to Females first.
 * 2. Premium (₹250) Window -> High compatibility Premium Boys shown to remaining available Females (< 2 matches).
 * 3. Basic (₹100) Allocation -> Mutual compatibility scoring across remaining pairs.
 * Enforces female max 2 matches and male max 1 match per round.
 */
export const runAlgorithmicMatchEngine = (targetStateName) => {
  const stateName = targetStateName || getRoundState().activeState || 'Delhi NCR';
  const allUsers = getUsers();
  const stateUsers = allUsers.filter(u => u.state === stateName && u.status === 'active');

  const males = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'male');
  const females = stateUsers.filter(u => (u.gender || '').toLowerCase() === 'female');

  let eliteMatchCount = 0;
  let premiumMatchCount = 0;
  let basicMatchCount = 0;

  // --------------------------------------------------------------------------
  // TIER 1: ELITE PLAN (₹449) SPOTLIGHT MATCHING
  // --------------------------------------------------------------------------
  const eliteMales = males.filter(m => m.plan === 'elite');

  eliteMales.forEach((male) => {
    if (male.matches && male.matches.length >= 1) return;

    const availableFemales = females.filter(f => !f.matches || f.matches.length < 2);

    const scoredFemales = availableFemales.map(female => ({
      female,
      score: calculateCompatibilityScore(male, female)
    })).sort((a, b) => b.score - a.score);

    for (const item of scoredFemales) {
      const f = item.female;
      if (!f.matches) f.matches = [];
      if (f.matches.length < 2 && !f.matches.includes(male.id)) {
        createMatch(male.id, f.id);
        male.matchScore = item.score;
        f.matchScore = item.score;
        eliteMatchCount++;
        break; // Male gets max 1 match
      }
    }
  });

  // --------------------------------------------------------------------------
  // TIER 2: PREMIUM PLAN (₹250) BROWSING MATCHING
  // --------------------------------------------------------------------------
  const freshUsers1 = getUsers();
  const premiumMales = freshUsers1.filter(u => u.state === stateName && u.status === 'active' && (u.gender || '').toLowerCase() === 'male' && u.plan === 'premium');

  premiumMales.forEach((male) => {
    if (male.matches && male.matches.length >= 1) return;

    const availableFemales = freshUsers1.filter(u => u.state === stateName && u.status === 'active' && (u.gender || '').toLowerCase() === 'female' && (!u.matches || u.matches.length < 2));

    const scoredFemales = availableFemales.map(female => ({
      female,
      score: calculateCompatibilityScore(male, female)
    })).sort((a, b) => b.score - a.score);

    for (const item of scoredFemales) {
      const f = item.female;
      if (!f.matches) f.matches = [];
      if (f.matches.length < 2 && !f.matches.includes(male.id)) {
        createMatch(male.id, f.id);
        male.matchScore = item.score;
        f.matchScore = item.score;
        premiumMatchCount++;
        break;
      }
    }
  });

  // --------------------------------------------------------------------------
  // TIER 3: BASIC PLAN (₹100) & REMAINING PAIRS AUTO-SETTLEMENT
  // --------------------------------------------------------------------------
  const freshUsers2 = getUsers();
  const remainingMales = freshUsers2.filter(u => u.state === stateName && u.status === 'active' && (u.gender || '').toLowerCase() === 'male' && (!u.matches || u.matches.length < 1));
  const remainingFemales = freshUsers2.filter(u => u.state === stateName && u.status === 'active' && (u.gender || '').toLowerCase() === 'female' && (!u.matches || u.matches.length < 2));

  const candidatePairs = [];
  remainingMales.forEach(m => {
    remainingFemales.forEach(f => {
      const score = calculateCompatibilityScore(m, f);
      candidatePairs.push({ male: m, female: f, score });
    });
  });

  candidatePairs.sort((a, b) => b.score - a.score);

  candidatePairs.forEach(pair => {
    const freshM = freshUsers2.find(u => u.id === pair.male.id);
    const freshF = freshUsers2.find(u => u.id === pair.female.id);

    if (freshM && freshF) {
      const maleHasMatch = freshM.matches && freshM.matches.length >= 1;
      const femaleHasMatches = freshF.matches && freshF.matches.length >= 2;
      const alreadyMatched = freshM.matches && freshM.matches.includes(freshF.id);

      if (!maleHasMatch && !femaleHasMatches && !alreadyMatched) {
        createMatch(freshM.id, freshF.id);
        freshM.matchScore = pair.score;
        freshF.matchScore = pair.score;
        basicMatchCount++;
      }
    }
  });

  // Check refund eligibility for Elite/Premium/Basic males who got no matches
  const finalUsers = getUsers();
  finalUsers.forEach(u => {
    if (u.state === stateName && u.status === 'active' && (u.gender || '').toLowerCase() === 'male') {
      const hasMatch = u.matches && u.matches.length > 0;
      if (!hasMatch) {
        if (u.plan === 'elite' || u.plan === 'premium' || u.plan === 'basic') {
          const refundAmt = u.plan === 'elite' ? 449 : (u.plan === 'premium' ? 250 : 100);
          u.refundEligible = true;
          u.refundStatus = 'pending';
          u.refundAmount = refundAmt;
          u.refundReason = `No mutual match found for Round #${getRoundState().roundNumber || 1}`;

          import('../services/notificationManager').then(({ addNotification }) => {
            addNotification(u.id, {
              type: 'refund',
              title: 'Round Complete - Refund Eligible',
              message: `No mutual match could be formed for this round. Your plan payment of ₹${refundAmt} is eligible for a full refund. Admin has been notified.`,
              actionUrl: 'profile'
            });
          });
        }
      }
    }
  });
  saveUsers(finalUsers);

  return {
    stateName,
    eliteMatches: eliteMatchCount,
    premiumMatches: premiumMatchCount,
    basicMatches: basicMatchCount,
    totalMatchedPairs: eliteMatchCount + premiumMatchCount + basicMatchCount
  };
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
  if (!current) return;

  const now = new Date();
  const roundStart = new Date(current.roundStartDate || current.phaseStartedAt || Date.now());
  const totalRoundElapsedMins = Math.max(0, (now.getTime() - roundStart.getTime()) / (1000 * 60));

  const isFastDemo = typeof window !== 'undefined' && localStorage.getItem('cupid_demo_rotation_speed') === 'fast';
  const isAutoRotationEnabled = typeof window !== 'undefined' && localStorage.getItem('cupid_auto_rotation_enabled') === 'true';

  // 48 hours = 2880 mins in standard real-time mode; 4 mins in fast demo mode
  const maxRoundDurationMins = isFastDemo ? 4 : 2880;
  const day1DurationMins = isFastDemo ? 2 : 1440; // 24 hours

  // If automated rotation is not explicitly enabled and not in demo mode, preserve state
  if (!isAutoRotationEnabled && !isFastDemo) {
    return;
  }

  // 1. If 48 hours (or demo 4 mins) elapsed: Deliver matches and rotate state in 10-day cycle!
  if (totalRoundElapsedMins >= maxRoundDurationMins) {
    const states = getStatesList();
    const currentIdx = states.findIndex(s => s.toLowerCase() === (current.activeState || '').toLowerCase());
    const safeCurrentIdx = currentIdx !== -1 ? currentIdx : 0;
    
    // Complete matches and populate refund queue
    runAlgorithmicMatchEngine(current.activeState);

    // Find next state in fixed 10-day rotation
    let nextIdx = (safeCurrentIdx + 1) % states.length;
    let nextState = states[nextIdx];

    // If next state is toggled off, keep advancing cycle day without shifting schedule
    if (!isStateEnabled(nextState)) {
      console.log(`[Cupid Rotation] State "${nextState}" is toggled OFF by Admin. Round skipped for this cycle.`);
    }

    startNextRoundForState(nextState);
    return;
  }

  // 2. Phase calculation within the 48-Hour round window
  let expectedPhase = ROUND_PHASES.ENTRIES_SUBMISSION;
  if (totalRoundElapsedMins >= day1DurationMins) {
    // Hour 24+ -> Day 2: Live Browsing & Matching (Elite 16h, Premium 8h)
    expectedPhase = ROUND_PHASES.LIVE_MATCHING;
  }

  if (current.currentPhase !== expectedPhase) {
    const updated = {
      ...current,
      currentPhase: expectedPhase,
      phaseStartedAt: new Date().toISOString()
    };
    saveRoundState(updated);
  }
};

