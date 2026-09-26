import React, { useState, useEffect } from 'react';
import { getUsers, saveUsers, updateUser, createMatch } from '../utils/storage';
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
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SwipeableDeck from './SwipeableDeck';
import FullProfileModal from './FullProfileModal';
import CampusRadarMap from './CampusRadarMap';
import ChatView from './ChatView';
import ProfileView from './ProfileView';
import PermissionModal from './PermissionModal';
import InteractiveTourGuide from './InteractiveTourGuide';
import NotificationsModal from './NotificationsModal';
import ReEntryModal from './ReEntryModal';
import InAppNotificationToast from './InAppNotificationToast';
import { getRoundState, ROUND_PHASES, joinRound, getStateUpcomingMins, getStateRoundSchedule, fetchRoundStateFromSupabase } from '../utils/roundManager';
import { calculateCompatibilityScore } from '../utils/compatibility';
import { 
  getNotifications, 
  addNotification, 
  getUnreadCount, 
  checkAndTriggerRoundNotifications,
  requestDeviceNotificationPermission,
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
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [activeFilter, setActiveFilter] = useState('forYou'); // 'nearby' | 'forYou'
  const [currentTab, setCurrentTab] = useState('explore'); // 'explore' | 'radar' | 'chat' | 'profile'
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotifications(user?.id));
  const [showTour, setShowTour] = useState(() => {
    return user?.id ? !localStorage.getItem(`tour_shown_${user.id}`) : false;
  });

  const [roundState, setRoundState] = useState(getRoundState());
  const [showReEntryModal, setShowReEntryModal] = useState(false);
  const [reEntryPlan, setReEntryPlan] = useState('elite');
  const [countdown, setCountdown] = useState({ days: '08', hours: '14', mins: '40', secs: '22' });

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
    }).catch(() => {
      loadCandidates();
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
    }) : () => {};

    // Periodic broadcast notification and cloud sync check
    const notifInterval = setInterval(() => {
      if (user?.id) {
        syncBroadcastNotifications(user.id).then(() => {
          setNotifications(getNotifications(user.id));
        });
      }
    }, 8000);

    const hasPrompted = user?.id ? localStorage.getItem(`perm_prompted_${user.id}`) : true;
    if (!hasPrompted) {
      setShowPermissionPrompt(true);
    }

    return () => {
      if (typeof unsubActivity === 'function') unsubActivity();
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
      return {
        ...c,
        hasLikedYou: Boolean(hasLikedYou),
        matchScore: calculateCompatibilityScore(user, c)
      };
    });

    // -------------------------------------------------------------
    // PRIORITY SORTING:
    // A) If Current User is Female (e.g. Sneha):
    //    1. Real Elite Male Profiles (e.g. Aditya) are ALWAYS #1 at the TOP!
    //    2. Other Real Male Profiles are #2
    //    3. Mock/Demo Profiles are #3
    // B) If Current User is Male (e.g. Aditya):
    //    1. Females who already LIKED ME (e.g. Sneha) are ALWAYS #1 at the TOP!
    //    2. Real Female Profiles are #2
    //    3. Mock/Demo Profiles are #3
    // -------------------------------------------------------------
    if (isFemale) {
      stateCandidates.sort((a, b) => {
        // Priority 1: Real Elite Male
        const aIsRealElite = a.isRealUser && a.plan === 'elite';
        const bIsRealElite = b.isRealUser && b.plan === 'elite';
        if (aIsRealElite && !bIsRealElite) return -1;
        if (!aIsRealElite && bIsRealElite) return 1;

        // Priority 2: Any Elite Male
        const aIsElite = a.plan === 'elite';
        const bIsElite = b.plan === 'elite';
        if (aIsElite && !bIsElite) return -1;
        if (!aIsElite && bIsElite) return 1;

        // Priority 3: Real User before Mock
        if (a.isRealUser && !b.isRealUser) return -1;
        if (!a.isRealUser && b.isRealUser) return 1;

        // Priority 4: Compatibility Score
        return (b.matchScore || 0) - (a.matchScore || 0);
      });
    } else {
      stateCandidates.sort((a, b) => {
        // Priority 1: Liked me
        if (a.hasLikedYou && !b.hasLikedYou) return -1;
        if (!a.hasLikedYou && b.hasLikedYou) return 1;

        // Priority 2: Real User before Mock
        if (a.isRealUser && !b.isRealUser) return -1;
        if (!a.isRealUser && b.isRealUser) return 1;

        // Priority 3: Compatibility Score
        return (b.matchScore || 0) - (a.matchScore || 0);
      });
    }

    setCandidates(stateCandidates);
  };

  const handleLike = async (candidate) => {
    const updatedLikes = [...(user.likes || []), candidate.id];
    let isMutualMatch = false;
    let updatedMatches = [...(user.matches || [])];

    // Trigger Like Notification for Candidate
    addNotification(candidate.id, {
      type: 'like',
      title: 'Someone Liked Your Profile',
      message: `${user.name} from ${user.university || user.state || 'your region'} liked your profile. Check your match radar!`,
      actionUrl: 'radar'
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
        title: "Mutual Match Confirmed",
        message: `You and ${candidate.name} liked each other! Tap to start chatting now.`,
        actionUrl: 'chat'
      });

      addNotification(candidate.id, {
        type: 'match',
        title: "Mutual Match Confirmed",
        message: `You and ${user.name} liked each other! Tap to start chatting now.`,
        actionUrl: 'chat'
      });
      
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#FF2E79', '#FF6B8B', '#FF1493', '#FFD166']
      });

      setSelectedMatch(candidate);
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
    const updated = {
      ...user,
      refundRequested: true,
      refundReason: 'No matches in active round'
    };
    updateUser(updated);
    onUpdateUser(updated);
  };

  const getMatchedUsers = () => {
    if (!user) return [];
    const allUsers = getUsers() || [];
    return allUsers.filter(u => u && user?.matches?.includes(u.id));
  };

  const matchedUsers = getMatchedUsers();

  return (
    <div className="flex-1 flex flex-col h-full relative justify-between select-none overflow-hidden pb-20 bg-gradient-to-b from-[#FFF0F4] via-[#FFEBEF] to-[#FFF5F8]">
      
      {/* Background Organic Wave Curves & Floating Soft Pink Heart (Exact Match to Image 1) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute -top-12 -left-12 w-72 h-72 bg-rose-200/40 rounded-full blur-3xl" />
        <div className="absolute top-[18%] -right-16 w-80 h-80 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] left-[10%] w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />

        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 390 844" fill="none">
          <path d="M-60 140 C80 90, 240 200, 450 110" stroke="#FF2E79" strokeWidth="1.8" strokeOpacity="0.25" />
          <path d="M-20 340 C110 290, 290 440, 430 350" stroke="#FF6584" strokeWidth="2.2" strokeOpacity="0.22" />
          <path d="M-40 690 C140 630, 230 790, 440 710" stroke="#FF2E79" strokeWidth="2.5" strokeOpacity="0.2" />
        </svg>

        <div className="absolute top-14 right-20 animate-float opacity-75 z-0">
          <Heart className="w-12 h-12 fill-rose-300/70 text-rose-300/90 drop-shadow-md transform rotate-12" />
        </div>
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
            setCurrentTab('chat');
          }}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 1: EXPLORE / HOME FEED (Matching Image 1)                     */}
      {/* ----------------------------------------------------------------- */}
      {currentTab === 'explore' && (
        <div className="flex-1 flex flex-col px-4 pt-2 pb-2 h-full overflow-hidden z-10">
          
          {/* Top Header Row (Exact Match to Image 1) */}
          <div className="flex items-center justify-between select-none mb-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setCurrentTab('profile')}
                className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#FF2E79] via-pink-400 to-rose-300 shadow-md ring-2 ring-pink-100/60 cursor-pointer hover:scale-105 transition-transform shrink-0"
              >
                <img src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'} alt={user?.name || 'User'} className="w-full h-full object-cover rounded-full bg-white" />
              </div>

              <div className="flex flex-col">
                <h1 className="text-lg font-black text-slate-900 leading-tight flex items-center">
                  <span className="font-cursive text-[#FF2E79] text-2xl font-normal tracking-wide mr-1.5">Hello,</span>
                  <span>{(user?.name || 'User').split(' ')[0]}</span>
                </h1>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-bold mt-0.5">
                  <MapPin className="w-3 h-3 text-[#FF2E79]" />
                  <span>{user?.university ? user.university.split(' ')[0] : 'Bennett'}</span>
                </div>
              </div>
            </div>

            {/* Right Action Icons & Cursive Tagline */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentTab('radar')}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(255,182,193,0.35)] border border-white hover:bg-slate-50 transition-all active:scale-95"
                  title="Search"
                >
                  <Search className="w-4.5 h-4.5 text-slate-800 stroke-[2.2]" />
                </button>
                <button 
                  onClick={() => setShowNotificationsModal(true)}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(255,182,193,0.35)] border border-white hover:bg-slate-50 transition-all active:scale-95 relative"
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
          
          {/* CASE 1: USER'S STATE ROUND IS NOT LIVE YET (EXACT MATCH TO IMAGE 1) */}
          {!isUserInActiveState ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 animate-fade-in relative z-20 my-auto select-none">
              
              {/* Soft Floating Background Elements */}
              <div className="absolute top-10 right-8 w-16 h-16 bg-pink-200/25 rounded-full blur-md pointer-events-none" />
              <div className="absolute bottom-20 left-6 w-20 h-20 bg-rose-200/20 rounded-full blur-lg pointer-events-none" />

              {/* 3D Hourglass Graphic Container */}
              <div className="relative w-48 h-48 mx-auto mb-5 flex items-center justify-center select-none">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-200/50 via-rose-100/60 to-pink-50/30 blur-2xl animate-pulse" />
                <div className="w-40 h-40 rounded-full bg-white/90 backdrop-blur-md border border-pink-100 shadow-[0_12px_35px_rgba(255,182,193,0.35)] flex items-center justify-center relative z-10">
                  <svg width="96" height="96" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
                    <defs>
                      {/* Top & Bottom Metallic Cap Gradients */}
                      <linearGradient id="hg_cap_top" x1="15" y1="10" x2="85" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FAD0C4" />
                        <stop offset="35%" stopColor="#FF9A9E" />
                        <stop offset="70%" stopColor="#F472B6" />
                        <stop offset="100%" stopColor="#BE185D" />
                      </linearGradient>
                      <linearGradient id="hg_cap_bottom" x1="15" y1="76" x2="85" y2="90" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FAD0C4" />
                        <stop offset="35%" stopColor="#FF9A9E" />
                        <stop offset="70%" stopColor="#F472B6" />
                        <stop offset="100%" stopColor="#BE185D" />
                      </linearGradient>
                      {/* Metallic Pillar Gradient */}
                      <linearGradient id="hg_pillar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#DB2777" />
                        <stop offset="30%" stopColor="#FCE7F3" />
                        <stop offset="70%" stopColor="#F472B6" />
                        <stop offset="100%" stopColor="#9D174D" />
                      </linearGradient>
                      {/* Glass Vessel Translucent Gradient */}
                      <linearGradient id="hg_glass" x1="25" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                        <stop offset="40%" stopColor="#FFF0F5" stopOpacity="0.4" />
                        <stop offset="70%" stopColor="#FBCFE8" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#F472B6" stopOpacity="0.8" />
                      </linearGradient>
                      {/* Sand Gradients */}
                      <linearGradient id="hg_sand" x1="25" y1="20" x2="75" y2="80" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FF6596" />
                        <stop offset="50%" stopColor="#FF2E79" />
                        <stop offset="100%" stopColor="#C2185B" />
                      </linearGradient>
                      {/* Drop Shadow Filter */}
                      <filter id="hg_shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#FF2E79" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* Ground Ambient Shadow */}
                    <ellipse cx="50" cy="89" rx="34" ry="4.5" fill="#FF2E79" opacity="0.2" filter="blur(2px)" />

                    {/* 3D Bottom Base Cap */}
                    <rect x="14" y="79" width="72" height="8" rx="4" fill="url(#hg_cap_bottom)" />
                    <ellipse cx="50" cy="79" rx="36" ry="4.5" fill="#FFE4E6" opacity="0.8" />
                    <ellipse cx="50" cy="79" rx="34" ry="3.5" fill="url(#hg_cap_bottom)" />

                    {/* 3D Top Base Cap */}
                    <rect x="14" y="13" width="72" height="8" rx="4" fill="url(#hg_cap_top)" />
                    <ellipse cx="50" cy="13" rx="36" ry="4.5" fill="#FFE4E6" opacity="0.9" />
                    <ellipse cx="50" cy="13" rx="34" ry="3.5" fill="url(#hg_cap_top)" />

                    {/* Side Support Pillars (3D Brass/Rose-Gold Columns) */}
                    <rect x="17" y="19" width="6" height="62" rx="3" fill="url(#hg_pillar)" />
                    <rect x="77" y="19" width="6" height="62" rx="3" fill="url(#hg_pillar)" />

                    {/* Glass Body Double Chamber Outer Silhouette */}
                    <path d="M 27 21 C 27 36 43 45 47 49 C 48.5 50.5 48.5 50.5 47 52 C 43 56 27 65 27 79 H 73 C 73 65 57 56 53 52 C 51.5 50.5 51.5 50.5 53 49 C 57 45 73 36 73 21 Z" 
                          fill="url(#hg_glass)" 
                          stroke="#F472B6" 
                          strokeWidth="2" 
                          strokeLinejoin="round" 
                          filter="url(#hg_shadow)" />

                    {/* Top Chamber Sand */}
                    <path d="M 30 30 C 30 38 43 45 48 49 C 49 50 49 50 48 50 C 43 45 30 38 30 30 Z" fill="url(#hg_sand)" />
                    <ellipse cx="50" cy="30" rx="20" ry="3" fill="#FF85AD" opacity="0.9" />

                    {/* Animated Falling Sand Stream */}
                    <line x1="50" y1="49" x2="50" y2="74" stroke="#FF2E79" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round" className="animate-pulse" />

                    {/* Bottom Chamber Accumulated Sand Mound */}
                    <path d="M 30 79 C 34 71 66 71 70 79 Z" fill="url(#hg_sand)" />
                    <ellipse cx="50" cy="79" rx="20" ry="3" fill="#D91656" opacity="0.6" />

                    {/* Glossy Glass Specular Highlights */}
                    <path d="M 30 24 C 30 32 38 38 42 42" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
                    <path d="M 70 58 C 70 66 62 72 58 76" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* Text Info */}
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400 mb-1 block">
                YOUR STATE ROUND IS NOT LIVE YET
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                Next Round for <span className="text-[#FF2E79]">{user?.state || 'Uttar Pradesh'}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400 mt-2 mb-3 block">
                Starts in
              </span>

              {/* 4-Box Countdown Timer Card (Exact Match to Image 1 & 2) */}
              <div className="bg-white/95 backdrop-blur-xl rounded-[28px] p-4 sm:p-5 shadow-[0_12px_35px_rgba(255,46,121,0.07)] border border-pink-100/80 max-w-xs sm:max-w-sm w-full mx-auto flex items-center justify-around">
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{countdown.days}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">DAYS</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{countdown.hours}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">HOURS</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{countdown.mins}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">MINS</span>
                </div>
                <div className="h-8 w-[1px] bg-slate-100" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl sm:text-3xl font-black text-[#FF2E79] font-mono tracking-tight">{countdown.secs}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">SECS</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-6 leading-relaxed">
                We'll notify you as soon as the round goes live on your phone.
              </p>

            </div>
          ) : (!isUserParticipating) ? (

            /* CASE 2: USER'S STATE ROUND IS LIVE NOW -> RE-ENTER PROMPT (EXACT MATCH TO IMAGE 2) */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 animate-fade-in relative z-20 my-auto select-none">
              
              {/* 3D Floating Pink Hearts Graphic Container */}
              <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-200/60 via-rose-100/80 to-pink-50/40 blur-xl animate-pulse" />
                <div className="w-36 h-36 rounded-full bg-white/80 backdrop-blur-md border border-pink-100 shadow-[0_10px_30px_rgba(255,182,193,0.4)] flex items-center justify-center relative z-10">
                  <svg width="76" height="76" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                    <path d="M48 22C41.5 22 37 27 35 30C33 27 28.5 22 22 22C13.5 22 8 28.5 8 37C8 51 27 64 35 68C43 64 62 51 62 37C62 28.5 56.5 22 48 22Z" fill="url(#heart_main_2)" />
                    <path d="M22 25C17 25 12.5 29.5 12 35C13 31 16.5 27.5 21 27C23 26.8 24 25.5 22 25Z" fill="white" fillOpacity="0.6" />
                    <path d="M58 38C53 38 49.5 42 48 44.5C46.5 42 43 38 38 38C31.5 38 27 43 27 49.5C27 60 41.5 70 48 73C54.5 70 69 60 69 49.5C69 43 64.5 38 58 38Z" fill="url(#heart_front_2)" />
                    <path d="M38 40.5C34 40.5 30.5 44 30 48.5C31 45 33.5 42.5 37 42C38.5 41.8 39.5 40.8 38 40.5Z" fill="white" fillOpacity="0.75" />
                    <defs>
                      <linearGradient id="heart_main_2" x1="8" y1="22" x2="62" y2="68" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FF5C93" />
                        <stop offset="0.5" stopColor="#FF2E79" />
                        <stop offset="1" stopColor="#D91656" />
                      </linearGradient>
                      <linearGradient id="heart_front_2" x1="27" y1="38" x2="69" y2="73" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFE0EB" />
                        <stop offset="0.6" stopColor="#FFB3CB" />
                        <stop offset="1" stopColor="#FF7CA8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Text Info */}
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mb-1 block">
                ROUND #{roundState?.roundNumber || 1} IS LIVE NOW
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                <span className="text-[#FF2E79]">{user?.state || 'Uttar Pradesh'}</span> Round is Live!
              </h2>

              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-2 mb-6 leading-relaxed">
                You can now enter the round and get matched with profiles from your state.
              </p>

              {/* Re-Enter Round Button */}
              <button
                onClick={() => setShowReEntryModal(true)}
                className="w-full max-w-[240px] py-3.5 bg-gradient-to-r from-[#FF2E79] via-pink-600 to-rose-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold text-sm rounded-full shadow-lg shadow-pink-300/60 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>Re-Enter Round</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

            </div>
          ) : (

            /* CASE 3: USER IS PARTICIPATING IN ACTIVE LIVE ROUND -> SHOW CANDIDATE DECK */
            <>
              {/* Segmented Filter Pills Bar */}
              <div className="flex items-center justify-between gap-2 mb-2.5 select-none">
                <div className="bg-white/90 backdrop-blur-md rounded-full p-1 border border-white/90 shadow-2xs flex items-center gap-1 flex-1">
                  <button
                    onClick={() => setActiveFilter('nearby')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all cursor-pointer ${
                      activeFilter === 'nearby'
                        ? 'bg-gradient-to-r from-[#FF2E79] to-pink-600 text-white font-black shadow-md shadow-pink-300/40'
                        : 'text-slate-600 font-bold hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Nearby</span>
                  </button>

                  <button
                    onClick={() => setActiveFilter('forYou')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs transition-all cursor-pointer ${
                      activeFilter === 'forYou'
                        ? 'bg-gradient-to-r from-[#FF2E79] to-pink-600 text-white font-black shadow-md shadow-pink-300/40'
                        : 'text-slate-600 font-bold hover:bg-slate-50'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>For You</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('radar')}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs text-[#FF2E79] font-black bg-pink-50/80 hover:bg-pink-100/80 transition-all cursor-pointer shrink-0"
                  >
                    <Users className="w-3.5 h-3.5 text-[#FF2E79]" />
                    <span>R{roundState?.roundNumber || 1} • Live</span>
                    <span className="w-2 h-2 rounded-full bg-[#FF2E79] animate-ping" />
                  </button>
                </div>
              </div>

              {/* Card Deck Container */}
              {isFemaleLimitReached ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm">
                  <div className="w-14 h-14 bg-pink-50 text-[#FF2E79] rounded-full flex items-center justify-center mb-3">
                    <Heart className="w-7 h-7 fill-current" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">2/2 Matches Selected</h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                    You have selected your 2 matches for Round {roundState.roundNumber}. Chat directly with them in the Chat tab!
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('chat')}
                    className="mt-4 px-6 py-2.5 bg-[#FF2E79] text-white rounded-full text-xs font-extrabold shadow-md shadow-rose-300 cursor-pointer"
                  >
                    Open Chats ({user?.matches?.length || 0})
                  </button>
                </div>
              ) : (
                <div className="flex-1 relative overflow-visible h-full min-h-0 pb-1" style={{ minHeight: 0 }}>
                  <SwipeableDeck
                    candidates={candidates}
                    user={user}
                    onLike={handleLike}
                    onDecline={handleDecline}
                    onOpenDetail={(c) => setExpandedCandidate(c)}
                  />
                </div>
              )}
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
        <CampusRadarMap
          user={user}
          candidates={candidates}
          matchedUsers={matchedUsers}
          onSelectCandidate={(c) => setExpandedCandidate(c)}
          onLikeCandidate={handleLike}
        />
      )}

      {/* TAB 3: CHATS */}
      {currentTab === 'chat' && (
        <ChatView
          user={user}
          matchedUsers={matchedUsers}
          onOpenMatchProfile={(m) => setExpandedCandidate(m)}
        />
      )}

      {/* TAB 4: PROFILE */}
      {currentTab === 'profile' && (
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
      )}

      {/* BOTTOM FLOATING NAVIGATION BAR (Exact Match to Image 1) */}
      <div className="fixed bottom-3 left-4 right-4 z-40 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-2 shadow-[0_15px_40px_rgba(255,46,121,0.18)] flex items-center justify-around max-w-md mx-auto select-none">
        
        <button 
          onClick={() => setCurrentTab('explore')}
          className={`transition-all cursor-pointer ${
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
          onClick={() => setCurrentTab('radar')}
          className={`transition-all cursor-pointer ${
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
          onClick={() => setCurrentTab('chat')}
          className={`transition-all cursor-pointer relative ${
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
          onClick={() => setCurrentTab('profile')}
          className={`transition-all cursor-pointer ${
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

      {/* MUTUAL MATCH MODAL */}
      {selectedMatch && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-5 max-w-[310px] w-full text-center relative border border-white bg-white/95">
            <button 
              onClick={() => setSelectedMatch(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-pink-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>

            <h3 className="text-lg font-black text-slate-900 font-display">It's a Match!</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              You and <strong className="text-slate-800">{selectedMatch.name}</strong> liked each other!
            </p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-[#FF2E79] object-cover" alt="" />
              <div className="w-8 h-8 rounded-full bg-rose-50 text-[#FF2E79] flex items-center justify-center shadow-sm">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <img src={selectedMatch.avatar} className="w-14 h-14 rounded-full border-2 border-[#FF2E79] object-cover" alt="" />
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  setSelectedMatch(null);
                  setCurrentTab('chat');
                }}
                className="w-full py-2.5 rounded-full bg-[#FF2E79] text-white font-bold text-xs shadow-md shadow-rose-300 hover:bg-[#e02447] cursor-pointer"
              >
                Send a Message
              </button>
              <button 
                onClick={() => setSelectedMatch(null)}
                className="w-full py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
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
