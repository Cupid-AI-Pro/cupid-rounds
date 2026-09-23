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
  [ROUND_PHASES.REGISTRATION]: { title: 'Registration & Entry', duration: '24 Hours', step: 1 },
  [ROUND_PHASES.ELITE_WINDOW]: { title: 'Elite Spotlight Window', duration: '16 Hours', step: 2 },
  [ROUND_PHASES.PREMIUM_WINDOW]: { title: 'Premium Matching Window', duration: '8 Hours', step: 3 },
  [ROUND_PHASES.BASIC_SETTLEMENT]: { title: 'Basic Allocation & Settlement', duration: 'Instant', step: 4 },
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

  } else if (current.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT) {
    // Transition to Completed
    nextPhase = ROUND_PHASES.COMPLETED;
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

  const males = stateUsers.filter(u => u.gender === 'male');
  const females = stateUsers.filter(u => u.gender === 'female');

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
  const premiumMales = freshUsers1.filter(u => u.state === stateName && u.status === 'active' && u.gender === 'male' && u.plan === 'premium');

  premiumMales.forEach((male) => {
    if (male.matches && male.matches.length >= 1) return;

    const availableFemales = freshUsers1.filter(u => u.state === stateName && u.status === 'active' && u.gender === 'female' && (!u.matches || u.matches.length < 2));

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
  const remainingMales = freshUsers2.filter(u => u.state === stateName && u.status === 'active' && u.gender === 'male' && (!u.matches || u.matches.length < 1));
  const remainingFemales = freshUsers2.filter(u => u.state === stateName && u.status === 'active' && u.gender === 'female' && (!u.matches || u.matches.length < 2));

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

  // Check refund eligibility for Elite/Premium males who got no matches
  const finalUsers = getUsers();
  finalUsers.forEach(u => {
    if (u.state === stateName && u.status === 'active' && u.gender === 'male') {
      const hasMatch = u.matches && u.matches.length > 0;
      if (!hasMatch) {
        if (u.plan === 'elite') {
          u.refundEligible = true;
          u.refundAmount = 450;
          u.refundReason = 'No mutual match found in Elite Spotlight';
        } else if (u.plan === 'premium') {
          u.refundEligible = true;
          u.refundAmount = 250;
          u.refundReason = 'No mutual match found in Premium window';
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

  const newRoundNumber = (current.roundNumber || 1) + 1;

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
    activeState: stateName,
    roundNumber: newRoundNumber,
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
    user.plan = user.gender === 'female' ? 'free' : planName;
    user.status = 'active';
    user.roundParticipating = true;
    user.refundRequested = false;
    user.refundEligible = false;
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
 * Automated 24h Round Timer & State Rotation Engine
 * Automatically advances round phases & rotates state after duration elapses.
 * Triggers matching algorithm and dispatches notifications automatically.
 */
export const checkAndRotateRoundAutomated = () => {
  const current = getRoundState();
  if (!current || !current.phaseStartedAt) return;

  const now = new Date();
  const started = new Date(current.phaseStartedAt);
  const elapsedHours = (now.getTime() - started.getTime()) / (1000 * 60 * 60);

  let phaseDurationHours = 24; // Registration Phase = 24h
  if (current.currentPhase === ROUND_PHASES.ELITE_WINDOW) {
    phaseDurationHours = 16;
  } else if (current.currentPhase === ROUND_PHASES.PREMIUM_WINDOW) {
    phaseDurationHours = 8;
  }

  if (elapsedHours >= phaseDurationHours) {
    if (current.currentPhase === ROUND_PHASES.COMPLETED) {
      // Rotate state to next state in rotation list
      const states = getStatesList();
      const currentIdx = states.findIndex(s => s.toLowerCase() === (current.activeState || '').toLowerCase());
      const nextIdx = (currentIdx + 1) % states.length;
      const nextState = states[nextIdx];

      startNextRoundForState(nextState);

      // Trigger In-App Notifications for new active state candidates
      const allUsers = getUsers();
      allUsers.forEach(u => {
        if (u.state && u.state.toLowerCase() === nextState.toLowerCase()) {
          import('../services/notificationManager').then(({ addNotification }) => {
            addNotification(u.id, {
              type: 'round_live',
              title: `🚀 Live Round Start!`,
              message: `Round ${current.roundNumber + 1} for ${nextState} is now LIVE! Join now to view matches.`,
              linkTab: 'explore'
            });
          });
        }
      });
    } else {
      // Auto-advance phase & run matching algorithm automatically!
      advanceRoundPhase();
    }
  }
};
