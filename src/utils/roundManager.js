import { getUsers, saveUsers, getActiveState, setActiveState, createMatch, getCurrentUser, setCurrentUser, getStatesList } from './storage';
import { PLANS_INFO } from '../data/mockData';

// Round State Storage Key
const ROUND_STATE_KEY = 'cupid_round_state_v2';
const CUSTOM_SCHEDULES_KEY = 'cupid_custom_schedules_v1';

export const getRotationConfig = () => {
  const states = getStatesList();
  return states.map((state, index) => ({
    state,
    offsetDay: index % 10
  }));
};

export const ROUND_PHASES = {
  REGISTRATION: 'registration', // Phase 0: 24h Registration & Plan Purchase
  ELITE_WINDOW: 'elite_window', // Phase 1: 16h Elite male profiles shown to females (max 2 matches)
  PREMIUM_WINDOW: 'premium_window', // Phase 2: 8h Premium males pick from remaining females
  BASIC_SETTLEMENT: 'basic_settlement', // Phase 3: Basic males auto-matched on preferences
  COMPLETED: 'completed' // Phase 4: Round closed, results locked, next round re-entry open
};

export const PHASE_LABELS = {
  [ROUND_PHASES.REGISTRATION]: { title: 'Registration & Entry', duration: '30 Mins', step: 1 },
  [ROUND_PHASES.ELITE_WINDOW]: { title: 'Elite Spotlight Window', duration: '15 Mins', step: 2 },
  [ROUND_PHASES.PREMIUM_WINDOW]: { title: 'Premium Matching Window', duration: '10 Mins', step: 3 },
  [ROUND_PHASES.BASIC_SETTLEMENT]: { title: 'Basic Allocation & Settlement', duration: '5 Mins', step: 4 },
  [ROUND_PHASES.COMPLETED]: { title: 'Round Completed', duration: 'Archived', step: 5 }
};

/**
 * Initialize or get the global Round Management State
 */
export const getRoundState = () => {
  const stored = localStorage.getItem(ROUND_STATE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }

  // Default state: Delhi NCR, Round 1, Registration Phase
  const defaultState = {
    activeState: 'Delhi NCR',
    roundNumber: 1,
    currentPhase: ROUND_PHASES.REGISTRATION,
    roundStartDate: new Date().toISOString(),
    phaseStartedAt: new Date().toISOString(),
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
  localStorage.setItem(ROUND_STATE_KEY, JSON.stringify(defaultState));
  return defaultState;
};

export const saveRoundState = (state) => {
  localStorage.setItem(ROUND_STATE_KEY, JSON.stringify(state));
  if (state.activeState) {
    setActiveState(state.activeState);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cupid_round_state_changed'));
  }
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
 * Calculate the next upcoming round date for any state based on 10-day cycle
 */
export const getStateRoundSchedule = (stateName) => {
  const roundState = getRoundState();
  const rotationConfig = getRotationConfig();
  const configIndex = rotationConfig.findIndex(s => s.state.toLowerCase() === stateName.toLowerCase());
  const activeIndex = rotationConfig.findIndex(s => s.state.toLowerCase() === roundState.activeState.toLowerCase());

  const safeConfigIndex = configIndex !== -1 ? configIndex : 0;
  const safeActiveIndex = activeIndex !== -1 ? activeIndex : 0;

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
      daysLeft: daysDifference,
      nextRoundDate: formatted,
      rawDate: customMap[stateName].customDate,
      roundNumber: customMap[stateName].roundNumber || roundState.roundNumber
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
    daysLeft: daysDifference,
    nextRoundDate: formattedDate,
    rawDate: targetDate.toISOString().split('T')[0],
    roundNumber: roundState.roundNumber
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
import { calculateCompatibilityScore } from './compatibility';

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
 * Automated 1-Hour Round Timer & State Rotation Engine (Testing Mode)
 * Automatically advances round phases & rotates state every 60 minutes.
 * - Registration Phase: 30 Mins
 * - Elite Spotlight Window: 15 Mins
 * - Premium Matching Window: 10 Mins
 * - Basic Allocation & Settlement: 5 Mins
 */
export const checkAndRotateRoundAutomated = () => {
  const current = getRoundState();
  if (!current || !current.phaseStartedAt) return;

  const isFastDemo = typeof window !== 'undefined' && localStorage.getItem('cupid_demo_rotation_speed') === 'fast';

  const now = new Date();
  const started = new Date(current.phaseStartedAt);
  const elapsedMinutes = (now.getTime() - started.getTime()) / (1000 * 60);

  // 1-Hour testing cycle phase durations (in minutes)
  let targetPhaseDurationMins = 30; // Registration = 30 mins
  if (current.currentPhase === ROUND_PHASES.ELITE_WINDOW) {
    targetPhaseDurationMins = 15; // Elite = 15 mins
  } else if (current.currentPhase === ROUND_PHASES.PREMIUM_WINDOW) {
    targetPhaseDurationMins = 10; // Premium = 10 mins
  } else if (current.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT) {
    targetPhaseDurationMins = 5; // Basic Settlement = 5 mins
  }

  // Fast Demo mode elapses phases in 1 minute for instant UI testing
  const isExpired = isFastDemo ? (elapsedMinutes >= 1) : (elapsedMinutes >= targetPhaseDurationMins);

  if (isExpired) {
    advanceRoundPhase();
  }

  // Pre-Round Alert Dispatcher: Check if upcoming state round starts in <= 10 mins
  try {
    const states = getStatesList();
    const currentIdx = states.findIndex(s => s.toLowerCase() === (current.activeState || '').toLowerCase());
    const nextIdx = (currentIdx + 1) % states.length;
    const nextState = states[nextIdx];

    const roundStart = new Date(current.roundStartDate || current.phaseStartedAt);
    const totalElapsedMins = Math.max(0, (now.getTime() - roundStart.getTime()) / (1000 * 60));
    const minsUntilNextState = Math.max(1, Math.ceil(60 - totalElapsedMins));

    if (minsUntilNextState <= 10) {
      const alertKey = `alert_10m_${nextState}_r${(current.stateRoundMap?.[nextState] || 1)}`;
      if (!localStorage.getItem(alertKey)) {
        localStorage.setItem(alertKey, 'true');
        const allUsers = getUsers();
        allUsers.forEach(u => {
          if (u.state && u.state.toLowerCase() === nextState.toLowerCase()) {
            import('../services/notificationManager').then(({ addNotification }) => {
              addNotification(u.id, {
                type: 'round_1day',
                title: 'Upcoming Round Alert',
                message: `Round #${(current.stateRoundMap?.[nextState] || 1)} for ${nextState} starts in ~${minsUntilNextState} minutes! Preferences & profile pre-locked.`,
                actionUrl: 'explore'
              });
            });
          }
        });
      }
    }
  } catch (e) {
    console.warn('Pre-round alert check error:', e);
  }
};
