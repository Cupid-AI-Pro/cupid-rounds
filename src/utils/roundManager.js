import { getUsers, saveUsers, getActiveState, setActiveState, createMatch, getCurrentUser, setCurrentUser } from './storage';
import { STATES_LIST, PLANS_INFO } from '../data/mockData';

// Round State Storage Key
const ROUND_STATE_KEY = 'cupid_round_state_v2';
const ROUND_SCHEDULE_KEY = 'cupid_state_schedules_v2';

/**
 * 10-day State Rotation Schedule Definition
 * Each state has a 1-day active window every 10 days.
 */
export const STATE_ROTATION_CONFIG = [
  { state: "Delhi NCR", offsetDay: 0 },
  { state: "Punjab", offsetDay: 1 },
  { state: "Haryana", offsetDay: 2 },
  { state: "Uttar Pradesh", offsetDay: 3 },
  { state: "Rajasthan", offsetDay: 4 },
  { state: "Maharashtra", offsetDay: 5 },
  { state: "Karnataka", offsetDay: 6 },
  { state: "Gujarat", offsetDay: 7 },
  { state: "West Bengal", offsetDay: 8 },
  { state: "Madhya Pradesh", offsetDay: 9 }
];

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
};

/**
 * Calculate the next upcoming round date for any state based on 10-day cycle
 */
export const getStateRoundSchedule = (stateName) => {
  const roundState = getRoundState();
  const configIndex = STATE_ROTATION_CONFIG.findIndex(s => s.state.toLowerCase() === stateName.toLowerCase());
  const activeIndex = STATE_ROTATION_CONFIG.findIndex(s => s.state.toLowerCase() === roundState.activeState.toLowerCase());

  const daysDifference = (configIndex - activeIndex + 10) % 10;
  const isToday = daysDifference === 0;

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
    roundNumber: roundState.roundNumber + (daysDifference === 0 ? 0 : 0)
  };
};

/**
 * Get all states' 10-day schedule overview
 */
export const getAllStateSchedules = () => {
  return STATE_ROTATION_CONFIG.map(item => getStateRoundSchedule(item.state));
};

/**
 * PHASE TRANSITION LOGIC: Advance round to next phase
 */
export const advanceRoundPhase = () => {
  const current = getRoundState();
  const allUsers = getUsers();
  const stateUsers = allUsers.filter(u => u.state === current.activeState);

  let nextPhase = current.currentPhase;

  if (current.currentPhase === ROUND_PHASES.REGISTRATION) {
    // Transition from Registration -> Elite Window (16h)
    nextPhase = ROUND_PHASES.ELITE_WINDOW;
    // Push Elite male profiles into the receivedLikes/suggestions of all females in the state
    const eliteMales = stateUsers.filter(u => u.gender === 'male' && u.plan === 'elite' && u.status === 'active');
    const females = stateUsers.filter(u => u.gender === 'female' && u.status === 'active');

    eliteMales.forEach(elite => {
      females.forEach(female => {
        if (!female.eliteSpotlight) female.eliteSpotlight = [];
        if (!female.eliteSpotlight.includes(elite.id)) {
          female.eliteSpotlight.push(elite.id);
        }
      });
    });
    saveUsers(allUsers);

  } else if (current.currentPhase === ROUND_PHASES.ELITE_WINDOW) {
    // Transition from Elite -> Premium Window (8h)
    nextPhase = ROUND_PHASES.PREMIUM_WINDOW;

    // Check Elite males who got NO matches in Phase 1 -> Mark Refund Eligible
    const eliteMales = stateUsers.filter(u => u.gender === 'male' && u.plan === 'elite' && u.status === 'active');
    eliteMales.forEach(elite => {
      const hasMatch = elite.matches && elite.matches.length > 0;
      if (!hasMatch) {
        elite.refundEligible = true;
        elite.refundAmount = 450;
        elite.refundReason = 'No mutual match selected during 16h Elite Spotlight';
        elite.status = 'refund_requested';
      }
    });
    saveUsers(allUsers);

  } else if (current.currentPhase === ROUND_PHASES.PREMIUM_WINDOW) {
    // Transition from Premium -> Basic Settlement
    nextPhase = ROUND_PHASES.BASIC_SETTLEMENT;

    // Check Premium males who got NO matches in Phase 2 -> Mark Refund Eligible
    const premiumMales = stateUsers.filter(u => u.gender === 'male' && u.plan === 'premium' && u.status === 'active');
    premiumMales.forEach(prem => {
      const hasMatch = prem.matches && prem.matches.length > 0;
      if (!hasMatch) {
        prem.refundEligible = true;
        prem.refundAmount = 250;
        prem.refundReason = 'No suitable match found in Premium browsing window';
        prem.status = 'refund_requested';
      }
    });

    // Auto-match Basic males (₹100) with remaining females having open slots (< 2 matches)
    const basicMales = stateUsers.filter(u => u.gender === 'male' && u.plan === 'basic' && u.status === 'active' && (!u.matches || u.matches.length === 0));
    const availableFemales = stateUsers.filter(u => u.gender === 'female' && u.status === 'active' && (!u.matches || u.matches.length < 2));

    let basicMatchCount = 0;
    basicMales.forEach((male) => {
      const targetFemale = availableFemales.find(f => (!f.matches || f.matches.length < 2) && !f.matches?.includes(male.id));
      if (targetFemale) {
        createMatch(male.id, targetFemale.id);
        basicMatchCount++;
      }
    });

    saveUsers(allUsers);

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
