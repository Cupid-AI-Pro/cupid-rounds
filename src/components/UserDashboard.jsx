import React, { useState, useEffect } from 'react';
import { getUsers, saveUsers, updateUser, createMatch, unmatchUser, claimUserRefund } from '../utils/storage';
import { 
  Heart, 
  X, 
  MessageCircle,
  MapPin, 
  Search, 
  Bell,
  Compass, 
  User, 
  Home,
  Users,
  Award,
  Check,
  ChevronRight,
  DollarSign,
  Zap,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SwipeableDeck from './SwipeableDeck';
import FullProfileModal from './FullProfileModal';
import MatchCelebrationModal from './MatchCelebrationModal';
import CampusRadarMap from './CampusRadarMap';
import ChatView from './ChatView';
import ProfileView from './ProfileView';
import PermissionModal from './PermissionModal';
import InteractiveTourGuide from './InteractiveTourGuide';
import NotificationsModal from './NotificationsModal';
import ReEntryModal from './ReEntryModal';
import InAppNotificationToast from './InAppNotificationToast';
import { getRoundState, ROUND_PHASES, joinRound, getStateUpcomingMins, getStateRoundSchedule, fetchRoundStateFromSupabase, isStateEnabled, getEnabledStates, checkAndRotateRoundAutomated } from '../utils/roundManager';
import { calculateCompatibilityScore } from '../utils/compatibility';
import { 
  getNotifications, 
  addNotification, 
  getUnreadCount, 
  checkAndTriggerRoundNotifications,
  requestDeviceNotificationPermission,
  requestNotificationPermissionUserGesture,
  getDeviceNotificationStatus,
  setupRealtimeBroadcastListener,
  syncBroadcastNotifications
} from '../services/notificationManager';
import { 
  fetchProfilesFromSupabase, 
  recordSwipeInSupabase, 
  fetchLikesForUser, 
  fetchMatchesForUser, 
  subscribeToLikesAndMatches 
} from '../services/supabaseService';

export default function UserDashboard({ user, onUpdateUser, onLogout }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [cloudMatchedUsers, setCloudMatchedUsers] = useState([]);
  const [activeDirectChatUser, setActiveDirectChatUser] = useState(null);
  const [isDirectChatActive, setIsDirectChatActive] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [activeFilter, setActiveFilter] = useState('forYou'); // 'nearby' | 'forYou'
  const [currentTab, setCurrentTab] = useState('explore'); // 'explore' | 'radar' | 'chat' | 'profile'
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotifications(user?.id));
  const [hasDismissedNotifBanner, setHasDismissedNotifBanner] = useState(false);
  const [showTour, setShowTour] = useState(() => {
    return user?.id ? !localStorage.getItem(`tour_shown_${user.id}`) : false;
  });

  const [roundState, setRoundState] = useState(getRoundState());
  const [showReEntryModal, setShowReEntryModal] = useState(false);
  const [reEntryPlan, setReEntryPlan] = useState('elite');
  const [countdown, setCountdown] = useState({ days: '08', hours: '14', mins: '40', secs: '22' });
  const [phaseCountdown, setPhaseCountdown] = useState({ hours: '24', mins: '00', secs: '00' });

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const stateName = user?.state || 'Uttar Pradesh';
        const upcomingMins = typeof getStateUpcomingMins === 'function' ? getStateUpcomingMins(stateName) : 0;

        const roundStartMs = new Date(roundState?.roundStartDate || roundState?.phaseStartedAt || Date.now()).getTime();
        const nowMs = Date.now();
        const elapsedMs = Math.max(0, nowMs - roundStartMs);

        let totalSecs = 0;
        if (upcomingMins > 0) {
          totalSecs = Math.max(0, Math.floor(((upcomingMins * 60 * 1000) - (elapsedMs % (60 * 1000))) / 1000));
        } else {
          const baseTargetSecs = (8 * 24 * 3600) + (14 * 3600) + (40 * 60) + 22;
          const elapsedSecs = Math.floor(elapsedMs / 1000) % baseTargetSecs;
          totalSecs = Math.max(0, baseTargetSecs - elapsedSecs);
        }

        if (typeof getStateRoundSchedule === 'function') {
          const sched = getStateRoundSchedule(stateName);
          if (sched && sched.rawDate && sched.daysLeft > 0) {
            const targetDate = new Date(sched.rawDate).getTime();
            const diffMs = targetDate - nowMs;
            if (diffMs > 0) {
              totalSecs = Math.floor(diffMs / 1000);
            }
          }
        }

        const d = Math.floor(totalSecs / (3600 * 24));
        const h = Math.floor((totalSecs % (3600 * 24)) / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = Math.floor(totalSecs % 60);

        setCountdown({
          days: String(d).padStart(2, '0'),
          hours: String(h).padStart(2, '0'),
          mins: String(m).padStart(2, '0'),
          secs: String(s).padStart(2, '0')
        });

        // Dynamic Active Round Phase Countdown Calculation
        const rs = getRoundState();
        const phaseStart = new Date(rs?.phaseStartedAt || rs?.roundStartDate || Date.now()).getTime();
        let phaseSecs = 24 * 3600; // Phase 1: 24h
        if (rs?.customDurationHours) {
          phaseSecs = rs.customDurationHours * 3600;
        } else if (rs?.currentPhase === ROUND_PHASES.ELITE_MATCHING || rs?.currentPhase === 'live_matching') {
          phaseSecs = 16 * 3600; // Phase 2: 16h
        } else if (rs?.currentPhase === ROUND_PHASES.PREMIUM_MATCHING) {
          phaseSecs = 8 * 3600;  // Phase 3: 8h
        } else if (rs?.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT || rs?.currentPhase === ROUND_PHASES.COMPLETED) {
          phaseSecs = 0;
        }

        const elapsedPhaseSecs = Math.max(0, Math.floor((nowMs - phaseStart) / 1000));
        const remPhaseSecs = Math.max(0, phaseSecs - elapsedPhaseSecs);
        const phH = Math.floor(remPhaseSecs / 3600);
        const phM = Math.floor((remPhaseSecs % 3600) / 60);
        const phS = remPhaseSecs % 60;

        setPhaseCountdown({
          hours: String(phH).padStart(2, '0'),
          mins: String(phM).padStart(2, '0'),
          secs: String(phS).padStart(2, '0')
        });

        if (remPhaseSecs === 0 && rs?.currentPhase !== ROUND_PHASES.COMPLETED && !rs?.isPaused) {
          checkAndRotateRoundAutomated();
        }
      } catch (err) {
        console.warn('Countdown update notice:', err);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user?.state, roundState]);

  useEffect(() => {
    const handleSync = () => {
      setRoundState(getRoundState());
      loadCandidates();
      loadMatches();
      if (user?.id) {
        syncBroadcastNotifications(user.id).then(() => {
          setNotifications(getNotifications(user.id));
        });
      }
    };
    window.addEventListener('cupid_round_state_changed', handleSync);
    window.addEventListener('cupid_data_changed', handleSync);
    return () => {
      window.removeEventListener('cupid_round_state_changed', handleSync);
      window.removeEventListener('cupid_data_changed', handleSync);
    };
  }, [user]);

  useEffect(() => {
    requestDeviceNotificationPermission();
    fetchRoundStateFromSupabase().then((rs) => {
      if (rs && rs.activeState) {
        setRoundState(rs);
      }
      loadCandidates();
      loadMatches();
    }).catch(() => {
      loadCandidates();
      loadMatches();
    });
    if (user && user.id) {
      checkAndTriggerRoundNotifications(user);
      syncBroadcastNotifications(user.id).then(() => {
        setNotifications(getNotifications(user.id));
      });
    }

    // Real-time subscription for incoming likes, swipes and mutual matches from Supabase
    const unsubActivity = user?.id ? subscribeToLikesAndMatches(user.id, () => {
      loadCandidates();
      loadMatches();
    }) : () => {};

    // Real-time broadcast listener for instant push notifications to user phones
    const unsubBroadcasts = user?.id ? setupRealtimeBroadcastListener(user.id, () => {
      setNotifications(getNotifications(user.id));
    }) : () => {};

    // Periodic broadcast notification and cloud sync check (fast 4s polling fallback)
    const notifInterval = setInterval(() => {
      if (user?.id) {
        syncBroadcastNotifications(user.id).then(() => {
          setNotifications(getNotifications(user.id));
        });
      }
    }, 4000);

    const hasPrompted = user?.id ? localStorage.getItem(`perm_prompted_${user.id}`) : true;
    if (!hasPrompted) {
      setShowPermissionPrompt(true);
    }

    return () => {
      if (typeof unsubActivity === 'function') unsubActivity();
      if (typeof unsubBroadcasts === 'function') unsubBroadcasts();
      clearInterval(notifInterval);
    };
  }, [user?.id, user?.gender, user?.interestedIn, user?.university, activeFilter, roundState?.currentPhase]);

  // Render loading placeholder if user object is not available
  if (!user || typeof user !== 'object') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#FFF0F4] to-[#FFF5F8] text-center font-sans">
        <div className="w-12 h-12 bg-pink-100 text-[#FF2E79] rounded-2xl flex items-center justify-center animate-spin mb-3">
          <Heart className="w-6 h-6 fill-current" />
        </div>
        <p className="text-xs font-extrabold text-slate-700">Loading Cupid Dashboard...</p>
      </div>
    );
  }

  const isFemale = (user?.gender || '').toLowerCase() === 'female';
  const isEliteMale = (user?.gender || '').toLowerCase() === 'male' && user?.plan === 'elite';
  const isPremiumMale = (user?.gender || '').toLowerCase() === 'male' && user?.plan === 'premium';
  const femaleMatchesCount = user?.matches?.length || 0;
  const isFemaleLimitReached = isFemale && femaleMatchesCount >= (roundState?.femaleMaxMatches || 2);

  const normalizeState = (s) => {
    if (!s) return '';
    const clean = String(s).toLowerCase().trim();
    if (clean.includes('delhi') || clean.includes('ncr') || clean.includes('noida') || clean.includes('gurgaon')) return 'delhi ncr';
    if (clean.includes('uttar pradesh') || clean === 'up') return 'uttar pradesh';
    if (clean.includes('maharashtra') || clean.includes('mumbai') || clean.includes('pune')) return 'maharashtra';
    if (clean.includes('karnataka') || clean.includes('bangalore') || clean.includes('bengaluru')) return 'karnataka';
    return clean;
  };

  const userStateClean = normalizeState(user?.state || user?.hometown);
  const activeStateClean = normalizeState(roundState?.activeState);
  const isUserInActiveState = userStateClean && activeStateClean ? userStateClean === activeStateClean : true;
  const isUserParticipating = user?.roundParticipating !== false && user?.status !== 'round_pending' && user?.status !== 'inactive';
  const upcomingMins = getStateUpcomingMins(user?.state);

  const refreshNotifications = () => {
    if (user?.id) {
      setNotifications(getNotifications(user.id));
    }
  };

  const loadMatches = async () => {
    if (!user?.id) return;
    try {
      const matchIds = await fetchMatchesForUser(user.id);
      let allUsers = getUsers() || [];
      const realProfiles = await fetchProfilesFromSupabase();
      if (realProfiles && realProfiles.length > 0) {
        const map = new Map(allUsers.map(u => [u.id, u]));
        realProfiles.forEach(p => map.set(p.id, { ...map.get(p.id), ...p }));
        allUsers = Array.from(map.values());
      }
      
      const allMatchIds = Array.from(new Set([...(user?.matches || []), ...matchIds]));
      let resolvedMatches = allUsers.filter(u => u && allMatchIds.includes(u.id));

      // Fallback for any matchId not found in local allUsers
      const foundIds = new Set(resolvedMatches.map(m => m.id));
      matchIds.forEach(id => {
        if (!foundIds.has(id)) {
          const fallback = realProfiles?.find(p => p.id === id);
          if (fallback) resolvedMatches.push(fallback);
        }
      });
      
      setCloudMatchedUsers(resolvedMatches);

      // Keep user.matches in sync in local storage
      if (allMatchIds.length !== (user?.matches || []).length) {
        const updatedUser = { ...user, matches: allMatchIds };
        updateUser(updatedUser);
        if (typeof onUpdateUser === 'function') onUpdateUser(updatedUser);
      }
    } catch (err) {
      console.warn('Error loading matches:', err);
    }
  };

  const loadCandidates = async () => {
    if (!user) return;
    let allUsers = getUsers() || [];

    // 1. Fetch real user profiles from Supabase cloud database
    try {
      const realProfiles = await fetchProfilesFromSupabase();
      if (realProfiles && realProfiles.length > 0) {
        // Merge real profiles into allUsers (real profiles take precedence)
        const realMap = new Map(realProfiles.map(p => [p.id, p]));
        const merged = [...realProfiles];
        allUsers.forEach(u => {
          if (!realMap.has(u.id) && !realProfiles.some(p => p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase())) {
            merged.push(u);
          }
        });
        allUsers = merged;
        saveUsers(allUsers);
      }
    } catch (e) {
      console.warn('Real profiles sync notice:', e);
    }

    // Filter out ANY legacy fake/dummy profiles - strictly real database users
    const mockIds = new Set(['girl_priya', 'girl_sophia', 'girl_ananya', 'girl_riya', 'girl_isha', 'girl_meera', 'boy_rohan', 'boy_aditya', 'boy_kabir', 'boy_henry', 'boy_arjun']);
    allUsers = allUsers.filter(u => 
      u && 
      !mockIds.has(u.id) && 
      !u.id?.startsWith('girl_') && 
      !u.id?.startsWith('boy_') && 
      !u.id?.startsWith('mock_') && 
      !u.isMock
    );

    // 2. Fetch cloud likes and matches from Supabase
    let cloudLikes = [];
    let cloudMatches = [];
    try {
      cloudLikes = await fetchLikesForUser(user.id);
      cloudMatches = await fetchMatchesForUser(user.id);
    } catch (e) {}

    const userLikes = Array.from(new Set([...(user?.likes || [])]));
    const userDislikes = user?.dislikes || [];
    const userMatches = Array.from(new Set([...(user?.matches || []), ...cloudMatches]));
    const excludedIds = [user?.id, ...userLikes, ...userDislikes, ...userMatches];

    // Normalize active state
    const activeStateClean = normalizeState(roundState?.activeState || user?.state);

    let stateCandidates = allUsers.filter(u => {
      if (!u || excludedIds.includes(u.id)) return false;
      const uStateClean = normalizeState(u.state || u.hometown);
      const matchesState = uStateClean === activeStateClean;
      return matchesState && u.status === 'active';
    });

    if (user?.interestedIn && user.interestedIn !== 'Everyone') {
      stateCandidates = stateCandidates.filter(u => u.gender === user.interestedIn);
    } else {
      stateCandidates = stateCandidates.filter(u => u.gender !== user?.gender);
    }

    // Attach real mutual compatibility scores & cloud like flags
    stateCandidates = stateCandidates.map(c => {
      const hasLikedYou = cloudLikes.includes(c.id) || (c.likes && c.likes.includes(user?.id));
      const isRecommended = Boolean(user?.suggestedMatches && user.suggestedMatches.includes(c.id));
      return {
        ...c,
        hasLikedYou: Boolean(hasLikedYou || isRecommended),
        isRecommended,
        matchScore: calculateCompatibilityScore(user, c)
      };
    });

    // Sort strictly by genuine priority:
    // 1. Handpicked recommendation / Candidate who already liked current user (instant match potential)
    // 2. Elite Tier candidates
    // 3. Match Compatibility Score
    stateCandidates.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;

      if (a.hasLikedYou && !b.hasLikedYou) return -1;
      if (!a.hasLikedYou && b.hasLikedYou) return 1;

      const aIsElite = a.plan === 'elite';
      const bIsElite = b.plan === 'elite';
      if (aIsElite && !bIsElite) return -1;
      if (!aIsElite && bIsElite) return 1;

      return (b.matchScore || 0) - (a.matchScore || 0);
    });

    // Phase & Tier Distribution Engine strictly adhering to User Lifecycle
    const phase = roundState?.currentPhase || ROUND_PHASES.ENTRIES_COLLECTION;

    // Phase 1 (Entries Collection - 24 Hours): Dashboard shows NO PROFILES. Collecting entries only.
    if (phase === ROUND_PHASES.ENTRIES_COLLECTION || phase === 'entries_submission' || phase === 'registration') {
      setCandidates([]);
      return;
    }

    // Phase 2 (Elite Matching Window - 16 Hours):
    if (phase === ROUND_PHASES.ELITE_MATCHING || phase === 'live_matching') {
      if (isFemale) {
        // Send top 5 Elite male profiles to females based on mutual preferences (if fewer than 5, send all available)
        const eliteMales = stateCandidates.filter(c => (c.gender || '').toLowerCase() === 'male' && c.plan === 'elite');
        eliteMales.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        setCandidates(eliteMales.slice(0, 5));
        return;
      } else if (isEliteMale) {
        // Elite Male sees the females who picked/liked his profile during this 16h window
        const interestedFemales = stateCandidates.filter(c => 
          (c.gender || '').toLowerCase() === 'female' &&
          (c.hasLikedYou || (user.receivedLikes && user.receivedLikes.includes(c.id)) || (c.likes && c.likes.includes(user.id)))
        );
        interestedFemales.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        setCandidates(interestedFemales);
        return;
      } else {
        // Premium & Basic males wait for Phase 2 to conclude
        setCandidates([]);
        return;
      }
    }

    // Phase 3 (Premium Matching Window - 8 Hours):
    if (phase === ROUND_PHASES.PREMIUM_MATCHING) {
      if (isPremiumMale) {
        // Send top 4 to 7 remaining females (< 2 matches) based on mutual preferences (if fewer, all remaining)
        const availableFemales = stateCandidates.filter(c => (c.gender || '').toLowerCase() === 'female' && (!c.matches || c.matches.length < 2));
        availableFemales.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        const pickCount = Math.min(Math.max(4, Math.min(7, availableFemales.length)), availableFemales.length);
        setCandidates(availableFemales.slice(0, pickCount));
        return;
      } else if (isFemale) {
        if (femaleMatchesCount >= 2) {
          setCandidates([]);
        } else {
          setCandidates(stateCandidates.slice(0, 5));
        }
        return;
      } else {
        // Elite males (already matched or auto-refunded) and Basic males (awaiting settlement)
        setCandidates([]);
        return;
      }
    }

    // Phase 4 (Basic Settlement & Completed):
    if (phase === ROUND_PHASES.BASIC_SETTLEMENT || phase === ROUND_PHASES.COMPLETED) {
      setCandidates([]);
      return;
    }

    setCandidates(stateCandidates);
  };

  const handleLike = async (candidate) => {
    const updatedLikes = [...(user.likes || []), candidate.id];
    let isMutualMatch = false;
    let updatedMatches = [...(user.matches || [])];

    // Track female selections on male profile so he can review and match in his decision window
    const allUsers = getUsers();
    const candObj = allUsers.find(u => u.id === candidate.id);
    if (candObj) {
      if (!candObj.receivedLikes) candObj.receivedLikes = [];
      if (!candObj.receivedLikes.includes(user.id)) candObj.receivedLikes.push(user.id);
      saveUsers(allUsers);
    }

    // Trigger Like Notification for Candidate
    addNotification(candidate.id, {
      type: 'like',
      title: `${user.name} Liked Your Profile! 💖`,
      message: `${user.name} from ${user.university || user.state || 'your region'} selected your profile! Check your Explore dashboard to confirm match.`,
      actionUrl: 'explore'
    });

    // Record swipe in Supabase cloud database
    try {
      const swipeRes = await recordSwipeInSupabase(user.id, candidate.id, true);
      if (swipeRes && swipeRes.isMutual) {
        isMutualMatch = true;
      }
    } catch (e) {
      console.warn('Cloud swipe record warning:', e);
    }

    if (candidate.hasLikedYou || (candidate.likes && candidate.likes.includes(user.id)) || isMutualMatch) {
      isMutualMatch = true;
      if (!updatedMatches.includes(candidate.id)) {
        updatedMatches.push(candidate.id);
      }
      createMatch(user.id, candidate.id);

      // Trigger Mutual Match Notifications for Both Users
      addNotification(user.id, {
        type: 'match',
        title: "Mutual Match Confirmed! 💖",
        message: `You and ${candidate.name} liked each other! Direct chat is now unlocked.`,
        actionUrl: 'chat'
      });

      addNotification(candidate.id, {
        type: 'match',
        title: "Mutual Match Confirmed! 💖",
        message: `You and ${user.name} liked each other! Direct chat is now unlocked.`,
        actionUrl: 'chat'
      });
      
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#FF2E79', '#FF6B8B', '#FF1493', '#FFD166']
      });

      setSelectedMatch(candidate);
      loadMatches();
    }

    const updatedUser = {
      ...user,
      likes: updatedLikes,
      matches: updatedMatches
    };

    updateUser(updatedUser);
    onUpdateUser(updatedUser);
    refreshNotifications();
    setCandidates(prev => prev.filter(c => c.id !== candidate.id));
  };

  const handleDecline = (candidate) => {
    const updatedDislikes = [...(user.dislikes || []), candidate.id];
    const updatedUser = { ...user, dislikes: updatedDislikes };
    updateUser(updatedUser);
    onUpdateUser(updatedUser);
    setCandidates(prev => prev.filter(c => c.id !== candidate.id));
    recordSwipeInSupabase(user.id, candidate.id, false);
  };

  const handlePermissionsComplete = () => {
    setShowPermissionPrompt(false);
    if (user?.id) {
      localStorage.setItem(`perm_prompted_${user.id}`, 'true');
    }
  };

  const handleRequestRefund = () => {
    if (!user) return;
    const res = claimUserRefund(user.id, 'User claimed 100% money-back guarantee in active matching round');
    if (res.success) {
      if (res.user) {
        updateUser(res.user);
        onUpdateUser(res.user);
      }
      alert(`✅ ${res.message}`);
    } else {
      alert(`⚠️ ${res.message}`);
    }
  };

  const getMatchedUsers = () => {
    if (!user) return [];
    if (cloudMatchedUsers && cloudMatchedUsers.length > 0) return cloudMatchedUsers;
    const allUsers = getUsers() || [];
    return allUsers.filter(u => u && user?.matches?.includes(u.id));
  };

  const matchedUsers = getMatchedUsers();

  return (
    <div className={`flex-1 flex flex-col h-full relative justify-between select-none overflow-hidden ${currentTab === 'chat' && (isDirectChatActive || activeDirectChatUser) ? 'pb-0' : 'pb-20'} bg-[#FBF9FA]`}>
      
      {/* Subtle Ambient Pearl Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-pink-100/30 rounded-full blur-3xl" />
      </div>

      {/* Floating In-App Notification Toast */}
      <InAppNotificationToast onOpenNotifications={() => setShowNotificationsModal(true)} />

      {/* Guided Tour */}
      {showTour && (
        <InteractiveTourGuide
          user={user}
          userId={user.id}
          onComplete={() => setShowTour(false)}
        />
      )}

      {/* Permission Modal */}
      {showPermissionPrompt && (
        <PermissionModal onComplete={handlePermissionsComplete} />
      )}

      {/* Profile Modal */}
      {expandedCandidate && (
        <FullProfileModal
          candidate={expandedCandidate}
          onClose={() => setExpandedCandidate(null)}
          onLike={handleLike}
          onDecline={handleDecline}
          onOpenChat={(c) => {
            handleLike(c);
            setExpandedCandidate(null);
            setActiveDirectChatUser(c);
            setIsDirectChatActive(true);
            setCurrentTab('chat');
          }}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 1: EXPLORE / HOME FEED (Matching Image 1)                     */}
      {/* ----------------------------------------------------------------- */}
      {currentTab === 'explore' && (
        <div className="flex-1 flex flex-col px-4 pt-2 pb-2 h-full overflow-hidden z-10 animate-screen-enter">
          
          {/* Top Header Row */}
          <div className="flex items-center justify-between select-none mb-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setCurrentTab('profile')}
                className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#FF2E79] to-rose-400 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
              >
                <img src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'} alt={user?.name || 'User'} className="w-full h-full object-cover rounded-full bg-white" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-slate-400">Hello,</span>
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    {(user?.name || 'User').split(' ')[0]}
                  </h1>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                  <MapPin className="w-3 h-3 text-[#FF2E79]" />
                  <span>{user?.university ? user.university.split(' ')[0] : (user?.state || 'Campus')}</span>
                </div>
              </div>
            </div>

            {/* Right Action Icons & Cursive Tagline */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentTab('radar')}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(255,182,193,0.35)] border border-white hover:bg-slate-50 transition-all saas-tap"
                  title="Search"
                >
                  <Search className="w-4.5 h-4.5 text-slate-800 stroke-[2.2]" />
                </button>
                <button 
                  onClick={() => setShowNotificationsModal(true)}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(255,182,193,0.35)] border border-white hover:bg-slate-50 transition-all relative saas-tap"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5 text-slate-800 stroke-[2.2]" />
                  {getUnreadCount(user?.id) > 0 && (
                    <span className="w-2.5 h-2.5 bg-[#FF2E79] rounded-full absolute top-1.5 right-1.5 border border-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Phone Notification Permission Prompt Banner */}
          {getDeviceNotificationStatus() !== 'granted' && !hasDismissedNotifBanner && (
            <div className="mb-2.5 px-3.5 py-2.5 bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-rose-200/90 rounded-2xl flex items-center justify-between gap-2 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-[#FF2E79] text-white flex items-center justify-center shrink-0 shadow-xs shadow-rose-200">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold text-slate-800 leading-tight truncate">
                    Enable Phone Status Bar Alerts
                  </p>
                  <p className="text-[9.5px] font-medium text-slate-500 leading-tight truncate">
                    Receive matches & broadcasts in your notification shade
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={async () => {
                    await requestNotificationPermissionUserGesture();
                    setHasDismissedNotifBanner(true);
                  }}
                  className="px-3 py-1.5 bg-[#FF2E79] hover:bg-rose-600 text-white text-[10.5px] font-black rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Enable
                </button>
                <button
                  onClick={() => setHasDismissedNotifBanner(true)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Refund Alert Banner for Unmatched Paid Users */}
          {(user?.refundEligible || user?.refundStatus === 'pending') && (
            <div className="mb-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md border border-amber-300/40 select-none">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1 text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-100">
                      Refund Status
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white text-orange-600">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-snug">
                    No mutual match could be formed for this round. Your plan payment of ₹{user?.refundAmount || (user?.plan === 'elite' ? 449 : (user?.plan === 'premium' ? 250 : 100))} is eligible for a full refund.
                  </p>
                  <p className="text-[10px] text-amber-100 font-medium">
                    Admin has been notified. The amount will be refunded to your UPI within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* DYNAMIC HOME TAB VIEW BASED ON USER STATE ROUND STATUS            */}
          {/* ----------------------------------------------------------------- */}
          
          {/* CASE 1: USER'S STATE ROUND IS NOT LIVE YET */}
          {!isUserInActiveState ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 animate-fade-in relative z-20 my-auto select-none max-w-md mx-auto">
              
              {/* Elegant Luxury Emblem */}
              <div className="relative mb-6 flex items-center justify-center">
                {/* Subtle Ambient Pulse Ring */}
                <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-rose-200/40 via-pink-100/50 to-amber-100/30 blur-2xl pointer-events-none" />
                
                {/* Sleek Frosted Emblem Plate */}
                <div className="relative w-28 h-28 rounded-3xl bg-white/90 backdrop-blur-xl border border-rose-100/80 shadow-[0_8px_30px_rgba(255,46,121,0.08)] flex items-center justify-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 via-pink-50 to-white flex items-center justify-center border border-rose-100/60 shadow-inner">
                    <Clock className="w-8 h-8 text-[#FF2E79] stroke-[1.75]" />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50/80 border border-rose-200/50 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#FF2E79] mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E79] animate-pulse" />
                Upcoming State Round
              </div>

              {/* Editorial Headline */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                Next Round for <span className="text-[#FF2E79]">{user?.state || 'Uttar Pradesh'}</span>
              </h2>

              <p className="text-xs text-slate-500 font-medium mt-1.5 mb-6">
                Curated matchmaking opens in
              </p>

              {/* High-End Monospace Countdown Timer Card */}
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/70 w-full max-w-xs sm:max-w-sm flex items-center justify-around">
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{countdown.days}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Days</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{countdown.hours}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Hours</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{countdown.mins}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Mins</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#FF2E79] font-mono tracking-tight">{countdown.secs}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Secs</span>
                </div>
              </div>

              {/* Informative Push Notification Note */}
              <div className="inline-flex items-center gap-2 mt-6 px-3.5 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/60 text-[11px] font-medium text-slate-600">
                <Bell className="w-3.5 h-3.5 text-[#FF2E79]" />
                <span>You'll get a notification the instant the round goes live</span>
              </div>

            </div>
          ) : (!isUserParticipating) ? (

            /* CASE 2: USER'S STATE ROUND IS LIVE NOW -> RE-ENTER PROMPT */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 animate-fade-in relative z-20 my-auto select-none max-w-md mx-auto">
              
              {/* Elegant Luxury Live Emblem */}
              <div className="relative mb-6 flex items-center justify-center">
                {/* Subtle Ambient Pulse Ring */}
                <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-rose-200/50 via-pink-100/60 to-purple-100/40 blur-2xl pointer-events-none" />
                
                {/* Sleek Frosted Emblem Plate */}
                <div className="relative w-28 h-28 rounded-3xl bg-white/90 backdrop-blur-xl border border-rose-100/80 shadow-[0_8px_30px_rgba(255,46,121,0.1)] flex items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-[#FF2E79] flex items-center justify-center shadow-md shadow-rose-500/25">
                    <Sparkles className="w-8 h-8 text-white stroke-[2]" />
                  </div>
                </div>
              </div>

              {/* Live Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10.5px] font-bold uppercase tracking-[0.16em] text-emerald-700 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Round #{roundState?.roundNumber || 1} • Live Now
              </div>

              {/* Editorial Headline */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                <span className="text-[#FF2E79]">{user?.state || 'Uttar Pradesh'}</span> Round is Active
              </h2>

              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-2 mb-6 leading-relaxed">
                Matchmaking entries are live in your state. Enter now to explore verified profiles and connect.
              </p>

              {/* Refined Luxury Button */}
              <button
                onClick={() => setShowReEntryModal(true)}
                className="w-full max-w-[240px] py-3.5 bg-gradient-to-r from-[#FF2E79] via-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-sm rounded-full shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>Enter Round Deck</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

            </div>
          ) : (

            /* CASE 3: USER IS PARTICIPATING IN ACTIVE LIVE ROUND -> SHOW CANDIDATE DECK */
            <>
              {/* Segmented Filter Pills Bar (Clean 1-Line Layout without wrapping) */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2.5 select-none">
                {/* Left: Nearby / For You segmented toggle pill */}
                <div className="bg-white/95 backdrop-blur-md rounded-full p-1 border border-pink-100 shadow-2xs flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('nearby');
                      setCurrentTab('radar');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ${
                      currentTab === 'radar'
                        ? 'bg-gradient-to-r from-[#FF2E79] to-pink-600 text-white font-black shadow-sm shadow-pink-300/40'
                        : 'text-slate-600 font-bold hover:text-slate-900'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Nearby</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter('forYou');
                      setCurrentTab('explore');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ${
                      currentTab === 'explore' && activeFilter === 'forYou'
                        ? 'bg-gradient-to-r from-[#FF2E79] to-pink-600 text-white font-black shadow-sm shadow-pink-300/40'
                        : 'text-slate-600 font-bold hover:text-slate-900'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>For You</span>
                  </button>
                </div>

                {/* Right: Round & State Live Badge */}
                <button
                  type="button"
                  onClick={() => setCurrentTab('radar')}
                  className="bg-white/95 backdrop-blur-md border border-pink-100 hover:border-pink-200 rounded-full py-1.5 px-2.5 sm:px-3 shadow-2xs flex items-center gap-1.5 text-xs text-[#FF2E79] font-black cursor-pointer transition-all active:scale-95 shrink-0"
                  title="View Campus Radar"
                >
                  <Users className="w-3.5 h-3.5 text-[#FF2E79] shrink-0" />
                  <span className="whitespace-nowrap truncate max-w-[110px] sm:max-w-none">
                    {roundState?.activeState || user?.state || 'Delhi NCR'} #{roundState?.roundNumber || 1}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 inline-block" />
                </button>
              </div>

              {/* Dynamic Phase-Aware Candidate Deck Container */}
              {(() => {
                const phase = roundState?.currentPhase || ROUND_PHASES.ENTRIES_COLLECTION;

                // ─────────────────────────────────────────────────────────────
                // PHASE 1: Entries Collection (First 24 Hours)
                // Dashboard shows NO PROFILES. Collecting entries countdown only!
                // ─────────────────────────────────────────────────────────────
                if (phase === ROUND_PHASES.ENTRIES_COLLECTION || phase === 'entries_submission' || phase === 'registration') {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-5 bg-white/90 backdrop-blur-md rounded-[28px] border border-white shadow-sm space-y-4 animate-fade-in my-auto">
                      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-pink-300/30 animate-ping" />
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF2E79] to-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-300/50 relative z-10">
                          <Users className="w-8 h-8" />
                        </div>
                      </div>

                      <div className="space-y-1 max-w-xs mx-auto">
                        <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-[#FF2E79] border border-pink-200 text-[10px] font-black uppercase tracking-wider inline-block">
                          Phase 1: Entry Window Live
                        </span>
                        <h3 className="text-xl font-black text-slate-900 font-display">
                          We are Collecting Entries
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Profiles from {roundState?.activeState || user?.state || 'your region'} are registering and being indexed by Cupid AI. Matchmaking will officially begin in:
                        </p>
                      </div>

                      {/* 3-Box Countdown Clock */}
                      <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 rounded-2xl p-3 border border-pink-200/80 w-full max-w-xs flex items-center justify-around shadow-2xs">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900 font-mono">{phaseCountdown.hours}</span>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Hours</span>
                        </div>
                        <div className="text-xl font-black text-[#FF2E79] animate-pulse">:</div>
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900 font-mono">{phaseCountdown.mins}</span>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Mins</span>
                        </div>
                        <div className="text-xl font-black text-[#FF2E79] animate-pulse">:</div>
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-black text-[#FF2E79] font-mono">{phaseCountdown.secs}</span>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Secs</span>
                        </div>
                      </div>

                      {/* User Entry Confirmation Badge */}
                      <div className="p-3 rounded-2xl bg-white border border-pink-100 w-full max-w-xs text-left flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span>Entry Confirmed</span>
                              <span className="text-[10px] font-extrabold text-[#FF2E79] uppercase">({user?.plan || 'Basic'})</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">Round #{roundState?.roundNumber || 1} • {user?.university || user?.state}</p>
                          </div>
                        </div>
                        {(user?.plan === 'elite' || user?.plan === 'premium') && (
                          <span className="text-[9.5px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                            100% Refundable
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // ─────────────────────────────────────────────────────────────
                // PHASE 2: Elite Matching Window (Next 16 Hours)
                // ─────────────────────────────────────────────────────────────
                if (phase === ROUND_PHASES.ELITE_MATCHING || phase === 'live_matching') {
                  if (isFemale) {
                    if (isFemaleLimitReached) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm space-y-3">
                          <div className="w-14 h-14 bg-pink-50 text-[#FF2E79] rounded-full flex items-center justify-center mx-auto">
                            <Heart className="w-7 h-7 fill-current" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 font-display">2/2 Matches Selected!</h3>
                          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                            You've picked your 2 matches for Round {roundState.roundNumber}. Chat directly in the Chat tab!
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDirectChatUser(null);
                              setIsDirectChatActive(false);
                              setCurrentTab('chat');
                            }}
                            className="mt-2 px-6 py-2.5 bg-[#FF2E79] text-white rounded-full text-xs font-extrabold shadow-md shadow-rose-300 cursor-pointer"
                          >
                            Open Chats ({user?.matches?.length || 0})
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="flex-1 flex flex-col h-full min-h-0">
                        {/* 16h Elite Banner for Females */}
                        <div className="mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 flex items-center justify-between text-xs text-purple-900 shrink-0">
                          <span className="font-extrabold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>Top 5 Elite Picks (Pick up to 2)</span>
                          </span>
                          <span className="font-black text-[#FF2E79] bg-white px-2 py-0.5 rounded-lg border border-pink-100 shadow-2xs font-mono">
                            ⏱️ {phaseCountdown.hours}:{phaseCountdown.mins}:{phaseCountdown.secs}
                          </span>
                        </div>
                        <div className="flex-1 relative overflow-visible min-h-0 pb-1">
                          <SwipeableDeck
                            candidates={candidates}
                            user={user}
                            onLike={handleLike}
                            onDecline={handleDecline}
                            onOpenDetail={(c) => setExpandedCandidate(c)}
                          />
                        </div>
                      </div>
                    );
                  }

                  if (isEliteMale) {
                    return (
                      <div className="flex-1 flex flex-col h-full min-h-0">
                        {/* 16h Elite Banner for Elite Males */}
                        <div className="mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 flex items-center justify-between text-xs text-purple-900 shrink-0">
                          <span className="font-extrabold flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-purple-600" />
                            <span>16-Hour Decision Window</span>
                          </span>
                          <span className="font-black text-[#FF2E79] bg-white px-2 py-0.5 rounded-lg border border-pink-100 shadow-2xs font-mono">
                            ⏱️ {phaseCountdown.hours}:{phaseCountdown.mins}:{phaseCountdown.secs}
                          </span>
                        </div>

                        {candidates.length > 0 ? (
                          <div className="flex-1 flex flex-col min-h-0">
                            <p className="text-[11px] font-bold text-slate-600 mb-1 text-center">
                              💖 {candidates.length} female(s) selected your Elite profile! Like them to confirm mutual match.
                            </p>
                            <div className="flex-1 relative overflow-visible min-h-0 pb-1">
                              <SwipeableDeck
                                candidates={candidates}
                                user={user}
                                onLike={handleLike}
                                onDecline={handleDecline}
                                onOpenDetail={(c) => setExpandedCandidate(c)}
                              />
                            </div>
                            {/* Claim Refund Option */}
                            {(!user?.matches || user.matches.length === 0) && (
                              <div className="pt-2 text-center shrink-0">
                                <button
                                  type="button"
                                  onClick={handleRequestRefund}
                                  className="text-xs font-bold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                >
                                  Not interested in these profiles? Claim 100% Refund (₹449)
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm space-y-4 my-auto">
                            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                              <Clock className="w-8 h-8" />
                            </div>
                            <div className="space-y-1 max-w-xs mx-auto">
                              <h3 className="text-base font-black text-slate-900 font-display">
                                16h Elite Spotlight Active
                              </h3>
                              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                Females in {roundState.activeState} are reviewing top Elite profiles. When a female picks your profile, she will appear right here!
                              </p>
                            </div>
                            <div className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl font-mono">
                              Window Closes in: {phaseCountdown.hours}:{phaseCountdown.mins}:{phaseCountdown.secs}
                            </div>
                            {(!user?.matches || user.matches.length === 0) && !user?.refundRequested && (
                              <button
                                type="button"
                                onClick={handleRequestRefund}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-[#FF2E79] border border-slate-200 text-xs font-extrabold transition-all cursor-pointer"
                              >
                                Claim 100% Refund (₹449)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Premium & Basic Males waiting for Phase 2 to conclude
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm space-y-4 my-auto">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                        <Clock className="w-8 h-8" />
                      </div>
                      <div className="space-y-1 max-w-xs mx-auto">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase tracking-wider inline-block">
                          Elite Matching Live (16h)
                        </span>
                        <h3 className="text-base font-black text-slate-900 font-display">
                          {isPremiumMale ? 'Your Premium Window Opens Next' : 'Matching Underway'}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {isPremiumMale 
                            ? 'Top 4-7 curated female profiles will be sent to your dashboard in the next window.'
                            : 'Basic algorithm matching will settle at the end of the round.'}
                        </p>
                      </div>
                      <div className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl font-mono">
                        Next Window Starts in: {phaseCountdown.hours}:{phaseCountdown.mins}:{phaseCountdown.secs}
                      </div>
                    </div>
                  );
                }

                // ─────────────────────────────────────────────────────────────
                // PHASE 3: Premium Matching Window (Next 8 Hours)
                // ─────────────────────────────────────────────────────────────
                if (phase === ROUND_PHASES.PREMIUM_MATCHING) {
                  if (isPremiumMale) {
                    return (
                      <div className="flex-1 flex flex-col h-full min-h-0">
                        {/* 8h Premium Banner */}
                        <div className="mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-pink-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
                          <span className="font-extrabold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Top 4-7 Curated Profiles</span>
                          </span>
                          <span className="font-black text-[#FF2E79] bg-white px-2 py-0.5 rounded-lg border border-pink-100 shadow-2xs font-mono">
                            ⏱️ {phaseCountdown.hours}:{phaseCountdown.mins}:{phaseCountdown.secs}
                          </span>
                        </div>

                        {candidates.length > 0 ? (
                          <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 relative overflow-visible min-h-0 pb-1">
                              <SwipeableDeck
                                candidates={candidates}
                                user={user}
                                onLike={handleLike}
                                onDecline={handleDecline}
                                onOpenDetail={(c) => setExpandedCandidate(c)}
                              />
                            </div>
                            {(!user?.matches || user.matches.length === 0) && (
                              <div className="pt-2 text-center shrink-0">
                                <button
                                  type="button"
                                  onClick={handleRequestRefund}
                                  className="text-xs font-bold text-slate-500 hover:text-rose-600 underline cursor-pointer"
                                >
                                  Claim 100% Refund (₹250)
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm space-y-4 my-auto">
                            <h3 className="text-base font-black text-slate-900 font-display">
                              All Profiles Reviewed
                            </h3>
                            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                              If you did not form a match, you can claim your 100% money-back refund before the 8h window expires.
                            </p>
                            {(!user?.matches || user.matches.length === 0) && !user?.refundRequested && (
                              <button
                                type="button"
                                onClick={handleRequestRefund}
                                className="px-5 py-2.5 rounded-xl bg-[#FF2E79] text-white text-xs font-extrabold shadow-md shadow-pink-300 cursor-pointer"
                              >
                                Claim 100% Refund (₹250)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // For Females in Phase 3
                  if (isFemale) {
                    if (isFemaleLimitReached) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm space-y-3">
                          <div className="w-14 h-14 bg-pink-50 text-[#FF2E79] rounded-full flex items-center justify-center mx-auto">
                            <Heart className="w-7 h-7 fill-current" />
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 font-display">2/2 Matches Selected</h3>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDirectChatUser(null);
                              setIsDirectChatActive(false);
                              setCurrentTab('chat');
                            }}
                            className="mt-2 px-6 py-2.5 bg-[#FF2E79] text-white rounded-full text-xs font-extrabold shadow-md shadow-rose-300 cursor-pointer"
                          >
                            Open Chats ({user?.matches?.length || 0})
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="flex-1 relative overflow-visible h-full min-h-0 pb-1">
                        <SwipeableDeck
                          candidates={candidates}
                          user={user}
                          onLike={handleLike}
                          onDecline={handleDecline}
                          onOpenDetail={(c) => setExpandedCandidate(c)}
                        />
                      </div>
                    );
                  }

                  // Basic males or Elite males during Phase 3
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm space-y-4 my-auto">
                      <div className="w-16 h-16 rounded-2xl bg-pink-50 text-[#FF2E79] flex items-center justify-center mx-auto border border-pink-100">
                        <Users className="w-8 h-8" />
                      </div>
                      <div className="space-y-1 max-w-xs mx-auto">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wider inline-block">
                          Premium Window Live (8h)
                        </span>
                        <h3 className="text-base font-black text-slate-900 font-display">
                          {isEliteMale ? '16h Elite Window Finished' : 'Basic Matchmaking Underway'}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          {isEliteMale 
                            ? (user?.matches && user.matches.length > 0 
                                ? 'Your mutual match is confirmed! Open the Chat tab.' 
                                : 'If unmatched, your ₹449 auto-refund has been queued to Admin.')
                            : 'Basic algorithmic pairs will be calculated and finalized upon round settlement.'}
                        </p>
                      </div>
                      <div className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-mono">
                        Settlement in: {phaseCountdown.hours}:{phaseCountdown.mins}:{phaseCountdown.secs}
                      </div>
                    </div>
                  );
                }

                // ─────────────────────────────────────────────────────────────
                // PHASE 4: Basic Settlement & Completed
                // ─────────────────────────────────────────────────────────────
                if (phase === ROUND_PHASES.BASIC_SETTLEMENT || phase === ROUND_PHASES.COMPLETED) {
                  // If user got matched
                  if (user?.matches && user.matches.length > 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm space-y-4 my-auto">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF2E79] to-pink-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-pink-300">
                          <Heart className="w-8 h-8 fill-current" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 font-display">
                          Mutual Match Confirmed!
                        </h3>
                        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                          Your round is complete. Start a conversation with your match in the Chat tab!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDirectChatUser(null);
                            setIsDirectChatActive(false);
                            setCurrentTab('chat');
                          }}
                          className="px-6 py-2.5 bg-[#FF2E79] text-white rounded-full text-xs font-black shadow-md shadow-pink-300 cursor-pointer"
                        >
                          Open Chat ({user.matches.length})
                        </button>
                      </div>
                    );
                  }

                  // If Basic Male with NO matches -> Show the requested Apology Card!
                  if (!isFemale && (!user?.plan || user.plan === 'basic')) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-md rounded-[28px] border border-pink-100 text-center shadow-md space-y-4 my-auto animate-fade-in">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#FF2E79] flex items-center justify-center mx-auto border border-rose-100">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-1.5 max-w-xs mx-auto">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider inline-block">
                            Round Complete
                          </span>
                          <h3 className="text-base font-black text-slate-900 font-display">
                            No Match Found This Round
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            We're sorry, no mutual match could be found for your profile this round. Next time, choose our <strong>Refundable Plans (Elite or Premium)</strong> for priority matching and 100% money-back guarantee!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowReEntryModal(true)}
                          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FF2E79] to-pink-600 text-white text-xs font-black shadow-md shadow-pink-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          Join Next Round with Refundable Plan →
                        </button>
                      </div>
                    );
                  }
                }

                // Default Fallback: Deck
                return (
                  <div className="flex-1 relative overflow-visible h-full min-h-0 pb-1" style={{ minHeight: 0 }}>
                    <SwipeableDeck
                      candidates={candidates}
                      user={user}
                      onLike={handleLike}
                      onDecline={handleDecline}
                      onOpenDetail={(c) => setExpandedCandidate(c)}
                    />
                  </div>
                );
              })()}
            </>
          )}

        </div>
      )}

      {/* Round 2 Re-Entry Modal */}
      {showReEntryModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-5 w-full max-w-[340px] shadow-2xl border border-pink-100 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 font-display">
                Join Round {(roundState.roundNumber || 1) + 1}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Re-enter the next live round for {user?.state || 'your state'}.
              </p>
            </div>

            {!isFemale && (
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Select Your Plan:
                </span>
                {[
                  { id: 'elite', name: 'Elite (₹450)', desc: '16h Spotlight + Refund Protected' },
                  { id: 'premium', name: 'Premium (₹250)', desc: '8h Browsing + Refund Protected' },
                  { id: 'basic', name: 'Basic (₹100)', desc: 'Auto Preference Match' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setReEntryPlan(p.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                      reEntryPlan === p.id
                        ? 'border-[#FF2E79] bg-pink-50/60 ring-2 ring-[#FF2E79]/20'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{p.desc}</div>
                    </div>
                    {reEntryPlan === p.id && <Check className="w-4 h-4 text-[#FF2E79] stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReEntryModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (user?.id) {
                    const updated = joinRound(user.id, reEntryPlan);
                    if (updated) {
                      onUpdateUser(updated);
                      setShowReEntryModal(false);
                      confetti({ particleCount: 70, spread: 60 });
                    }
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#FF2E79] text-white text-xs font-black cursor-pointer shadow-md shadow-rose-300"
              >
                Confirm & Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCOVER */}
      {currentTab === 'radar' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-screen-enter">
          <CampusRadarMap
            user={user}
            candidates={candidates}
            matchedUsers={matchedUsers}
            onSelectCandidate={(c) => setExpandedCandidate(c)}
            onLikeCandidate={handleLike}
          />
        </div>
      )}

      {/* TAB 3: CHATS */}
      {currentTab === 'chat' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-screen-enter">
          <ChatView
            user={user}
            matchedUsers={matchedUsers}
            initialChatUser={activeDirectChatUser}
            onOpenMatchProfile={(m) => setExpandedCandidate(m)}
            onActiveChatChange={(chatPartner) => {
              setIsDirectChatActive(Boolean(chatPartner));
              setActiveDirectChatUser(chatPartner);
            }}
            onGoToDeck={() => {
              setActiveDirectChatUser(null);
              setIsDirectChatActive(false);
              setCurrentTab('explore');
            }}
            onUnmatch={(partnerId) => {
              unmatchUser(user.id, partnerId);
              loadMatches();
              loadCandidates();
            }}
          />
        </div>
      )}

      {/* TAB 4: PROFILE */}
      {currentTab === 'profile' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-screen-enter">
          <ProfileView
            user={user}
            onLogout={onLogout}
            onRequestRefund={handleRequestRefund}
            onOpenPermissions={() => setShowPermissionPrompt(true)}
            onUpdateUser={onUpdateUser}
            onReplayTour={() => {
              setCurrentTab('explore');
              setShowTour(true);
            }}
          />
        </div>
      )}

      {/* BOTTOM FLOATING NAVIGATION BAR (Exact Match to Image 1) - Hidden during direct chat to eliminate bottom gap */}
      {!(currentTab === 'chat' && (isDirectChatActive || activeDirectChatUser)) && (
        <div className="fixed bottom-3 left-4 right-4 z-40 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-2 shadow-[0_15px_40px_rgba(255,46,121,0.18)] flex items-center justify-around max-w-md mx-auto select-none animate-slide-up">
          
          <button 
            onClick={() => {
              setActiveDirectChatUser(null);
              setIsDirectChatActive(false);
              setCurrentTab('explore');
            }}
            className={`transition-all cursor-pointer saas-tap ${
              currentTab === 'explore' 
                ? 'bg-[#FFEBF2] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
                : 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 text-slate-700 font-extrabold hover:text-black'
            }`}
            title="Home"
          >
            <Home className={`w-5 h-5 ${currentTab === 'explore' ? 'fill-[#FF2E79] text-[#FF2E79]' : 'stroke-[2.2]'}`} />
            <span className="text-[11px]">Home</span>
          </button>

          <button 
            onClick={() => {
              setActiveDirectChatUser(null);
              setIsDirectChatActive(false);
              setCurrentTab('radar');
            }}
            className={`transition-all cursor-pointer saas-tap ${
              currentTab === 'radar' 
                ? 'bg-[#FFEBF2] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
                : 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 text-slate-700 font-extrabold hover:text-black'
            }`}
            title="Discover"
          >
            <Compass className={`w-5 h-5 ${currentTab === 'radar' ? 'text-[#FF2E79]' : 'stroke-[2.2]'}`} />
            <span className="text-[11px]">Discover</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveDirectChatUser(null);
              setIsDirectChatActive(false);
              setCurrentTab('chat');
              loadMatches();
            }}
            className={`transition-all cursor-pointer relative saas-tap ${
              currentTab === 'chat' 
                ? 'bg-[#FFEBF2] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
                : 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 text-slate-700 font-extrabold hover:text-black'
            }`}
            title="Chats"
          >
            <div className="relative">
              <MessageCircle className={`w-5 h-5 ${currentTab === 'chat' ? 'text-[#FF2E79]' : 'stroke-[2.2]'}`} />
              <span className="w-2 h-2 bg-[#FF2E79] rounded-full absolute -top-0.5 -right-1 border border-white" />
            </div>
            <span className="text-[11px]">Chats</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveDirectChatUser(null);
              setIsDirectChatActive(false);
              setCurrentTab('profile');
            }}
            className={`transition-all cursor-pointer saas-tap ${
              currentTab === 'profile' 
                ? 'bg-[#FFEBF2] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
                : 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 text-slate-700 font-extrabold hover:text-black'
            }`}
            title="Profile"
          >
            <User className={`w-5 h-5 ${currentTab === 'profile' ? 'text-[#FF2E79]' : 'stroke-[2.2]'}`} />
            <span className="text-[11px]">Profile</span>
          </button>
        </div>
      )}

      {/* MUTUAL MATCH CELEBRATION MODAL WITH ROLLING AVATAR COLLISION PHYSICS */}
      {selectedMatch && (
        <MatchCelebrationModal
          user={user}
          partner={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onStartChat={(partner) => {
            setActiveDirectChatUser(partner);
            setSelectedMatch(null);
            setCurrentTab('chat');
            loadMatches();
          }}
        />
      )}

      {/* NOTIFICATIONS MODAL */}
      {showNotificationsModal && (
        <NotificationsModal
          user={user}
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onRefresh={refreshNotifications}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* RE-ENTRY PARTICIPATION MODAL */}
      {showReEntryModal && (
        <ReEntryModal
          user={user}
          roundState={roundState}
          onClose={() => setShowReEntryModal(false)}
          onEditQuestionnaire={() => {
            setShowReEntryModal(false);
            const allUsers = getUsers();
            const idx = allUsers.findIndex(u => u.id === user.id);
            if (idx !== -1) {
              allUsers[idx].status = 'onboarding';
              saveUsers(allUsers);
              onUpdateUser(allUsers[idx]);
            }
          }}
          onCompleteReEntry={(updatedUser) => {
            setShowReEntryModal(false);
            if (updatedUser) {
              onUpdateUser(updatedUser);
            }
            loadCandidates();
          }}
        />
      )}

    </div>
  );
}
