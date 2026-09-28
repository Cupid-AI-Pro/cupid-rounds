import React, { useState, useEffect } from 'react';
import { 
  getUsers, 
  saveUsers, 
  getActiveState, 
  setActiveState, 
  createMatch, 
  unmatchUser,
  assignManualMatch,
  updateUser,
  clearAllData,
  getPaymentSubmissions,
  updatePaymentStatus,
  rejectPaymentSubmission,
  getRefundQueue,
  processRefund,
  rejectRefund,
  isAdminAuthenticated,
  setAdminAuthenticated,
  getStatesList,
  addState,
  updateState,
  deleteState,
  getCollegesByState,
  addCollege,
  updateCollege,
  deleteCollege,
  recommendCandidatesToUser
} from '../utils/storage';
import { 
  getRoundState, 
  saveRoundState, 
  fetchRoundStateFromSupabase,
  advanceRoundPhase, 
  startNextRoundForState, 
  forceRotateToNextState,
  getAllStateSchedules, 
  updateStateScheduleDate,
  runAlgorithmicMatchEngine,
  getEnabledStates,
  isStateEnabled,
  toggleStateEnabled,
  getPipelinedRoundStatus,
  getStateRoundSchedule,
  ROUND_PHASES, 
  PHASE_LABELS,
  getRoundLogs,
  archiveCurrentRound,
  deleteRoundLog,
  alterRoundTiming,
  pauseOrCancelActiveRound,
  resumeActiveRound,
  skipActiveRound,
  checkAndRotateRoundAutomated
} from '../utils/roundManager';
import { PLANS_INFO } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { 
  broadcastNotification, 
  sendDeviceNotification, 
  requestNotificationPermissionUserGesture, 
  getDeviceNotificationStatus 
} from '../services/notificationManager';
import { 
  LayoutDashboard,
  Users, 
  ShieldCheck, 
  Heart, 
  Flame, 
  Flag, 
  CreditCard, 
  BarChart3, 
  FileText, 
  Bell, 
  Settings, 
  Search, 
  Calendar, 
  TrendingUp, 
  UserPlus, 
  IndianRupee, 
  RefreshCw, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  Maximize2, 
  Lock, 
  Mail, 
  AlertTriangle, 
  Check, 
  MapPin, 
  Building2, 
  Play, 
  Clock, 
  Award, 
  DollarSign, 
  Trash2, 
  Edit3, 
  MoreHorizontal,
  Menu,
  X,
  Send,
  Eye,
  Zap,
  Copy,
  CheckCheck,
  ToggleLeft,
  ToggleRight,
  Power,
  ShieldAlert,
  Pause,
  SkipForward,
  Sliders,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CupidLogo from './CupidLogo';
import CustomSelect from './CustomSelect';

export default function AdminDashboard({ activeState, onStateChange, onOpenApp, onOpenLanding }) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Mobile Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Navigation Tab (matching Image 2 sidebar items)
  // 'dashboard' | 'users' | 'verifications' | 'matches' | 'rounds' | 'reports' | 'payments' | 'analytics' | 'content' | 'notifications' | 'settings' | 'states' | 'colleges'
  const [activeNav, setActiveNav] = useState('dashboard');

  // Dashboard Data States
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roundState, setRoundState] = useState(getRoundState());
  const [stateSchedules, setStateSchedules] = useState(getAllStateSchedules());

  // Custom States & Colleges Management
  const [statesList, setStatesList] = useState(getStatesList());
  const [editingState, setEditingState] = useState(null);
  const [newStateName, setNewStateName] = useState('');

  const [selectedCollegeState, setSelectedCollegeState] = useState(activeState || 'Delhi NCR');
  const [collegesList, setCollegesList] = useState(getCollegesByState(activeState || 'Delhi NCR'));
  const [editingCollege, setEditingCollege] = useState(null);
  const [newCollegeName, setNewCollegeName] = useState('');

  // Live Round Active State (Synced with Supabase & Mobile Devices)
  const [liveStateSelect, setLiveStateSelect] = useState(activeState || 'Delhi NCR');

  // Schedule Modification
  const [scheduleStateSelect, setScheduleStateSelect] = useState(activeState || 'Delhi NCR');
  const [customRoundDate, setCustomRoundDate] = useState('');
  const [customRoundNum, setCustomRoundNum] = useState('1');

  // Filters & Search
  const [filterState, setFilterState] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Submissions & Lightbox
  const [paymentSubmissions, setPaymentSubmissions] = useState([]);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  // Refund Queue & State Toggles Management
  const [refundQueue, setRefundQueue] = useState(() => getRefundQueue());
  const [enabledStates, setEnabledStates] = useState(() => getEnabledStates());
  const [copiedUpi, setCopiedUpi] = useState(null);
  const [refundModalUser, setRefundModalUser] = useState(null);
  const [refundTransactionRef, setRefundTransactionRef] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [rejectModalEntry, setRejectModalEntry] = useState(null);
  const [rejectReason, setRejectReason] = useState('Payment screenshot or UPI transaction mismatch');

  // Stats (strictly computed from real database profiles & transactions)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    newSignups: 0,
    revenue: 0,
    active: 0,
    waitlisted: 0,
    refunds: 0,
    pendingPayments: 0
  });

  // Round Logs & Historical Archive State
  const [roundLogs, setRoundLogs] = useState(() => getRoundLogs());
  const [selectedLogId, setSelectedLogId] = useState(() => getRoundLogs()[0]?.id || null);
  const [logActiveSubTab, setLogActiveSubTab] = useState('participants'); // 'participants' | 'matches' | 'refunds'

  // Dynamic Phase Timer State (ticking live every second)
  const [phaseCountdown, setPhaseCountdown] = useState({ hours: '23', mins: '59', secs: '59', totalSecs: 86400 });

  // Manual Matchmaker State
  const [matchmakerUserA, setMatchmakerUserA] = useState('');
  const [matchmakerSelectedTargets, setMatchmakerSelectedTargets] = useState([]);
  const [matchmakerScore, setMatchmakerScore] = useState(96);
  const [matchmakerUserAFilter, setMatchmakerUserAFilter] = useState('elite'); // 'elite' | 'all' | 'male' | 'female'
  const [matchmakerUserASearch, setMatchmakerUserASearch] = useState('');
  const [matchmakerSearchQuery, setMatchmakerSearchQuery] = useState('');
  const [matchmakerGenderFilter, setMatchmakerGenderFilter] = useState('all');
  const [matchmakerStateFilter, setMatchmakerStateFilter] = useState('all');
  const [matchmakerSortBy, setMatchmakerSortBy] = useState('score'); // 'score' | 'elite' | 'campus'
  const [matchmakerActionFeedback, setMatchmakerActionFeedback] = useState(null);

  // Round Alteration States
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseReasonInput, setPauseReasonInput] = useState('Round temporarily paused by administration for scheduled review');

  // Broadcast Notifications Console States
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState(null);
  const [testAlertSent, setTestAlertSent] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cupid_global_broadcasts') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const updateCountdown = () => {
      const rs = getRoundState();
      const phaseStart = new Date(rs.phaseStartedAt || rs.roundStartDate || Date.now()).getTime();
      const now = Date.now();
      const elapsedSecs = Math.max(0, Math.floor((now - phaseStart) / 1000));
      
      let phaseDurationSecs = 24 * 3600; // Phase 1: 24h
      if (rs.customDurationHours) {
        phaseDurationSecs = rs.customDurationHours * 3600;
      } else if (rs.currentPhase === ROUND_PHASES.ELITE_MATCHING || rs.currentPhase === 'live_matching') {
        phaseDurationSecs = 16 * 3600; // Phase 2: 16h
      } else if (rs.currentPhase === ROUND_PHASES.PREMIUM_MATCHING) {
        phaseDurationSecs = 8 * 3600;  // Phase 3: 8h
      } else if (rs.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT || rs.currentPhase === ROUND_PHASES.COMPLETED) {
        phaseDurationSecs = 0;
      }
      const remainingSecs = Math.max(0, phaseDurationSecs - elapsedSecs);
      
      const hrs = Math.floor(remainingSecs / 3600);
      const mins = Math.floor((remainingSecs % 3600) / 60);
      const secs = remainingSecs % 60;

      setPhaseCountdown({
        hours: String(hrs).padStart(2, '0'),
        mins: String(mins).padStart(2, '0'),
        secs: String(secs).padStart(2, '0'),
        totalSecs: remainingSecs
      });

      if (remainingSecs === 0 && rs.currentPhase !== ROUND_PHASES.COMPLETED && !rs.isPaused) {
        checkAndRotateRoundAutomated();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [roundState]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }

    const handleSync = () => {
      if (isAuthenticated) {
        loadAdminData();
      }
    };
    window.addEventListener('cupid_round_state_changed', handleSync);
    window.addEventListener('cupid_data_changed', handleSync);
    return () => {
      window.removeEventListener('cupid_round_state_changed', handleSync);
      window.removeEventListener('cupid_data_changed', handleSync);
    };
  }, [isAuthenticated, activeState]);

  useEffect(() => {
    setCollegesList(getCollegesByState(selectedCollegeState));
  }, [selectedCollegeState]);

  const loadAdminData = async () => {
    let allUsers = getUsers();

    if (isSupabaseConfigured()) {
      try {
        const { data: remoteProfiles, error } = await supabase
          .from('profiles')
          .select('*');
        if (!error && remoteProfiles && remoteProfiles.length > 0) {
          allUsers = remoteProfiles.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            gender: p.gender,
            state: p.state,
            university: p.university,
            branch: p.branch,
            yearOfStudy: p.year_of_study,
            hometown: p.hometown,
            avatar: p.avatar_url,
            bio: p.bio,
            plan: p.plan,
            status: p.status,
            matches: p.matches || [],
            likes: [],
            dislikes: [],
            refundEligible: p.refund_eligible,
            refundAmount: p.refund_amount,
            upiId: p.upi_id
          }));
          saveUsers(allUsers);
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err.message);
      }
    }

    const mockIds = new Set(['girl_priya', 'girl_sophia', 'girl_ananya', 'girl_riya', 'girl_isha', 'girl_meera', 'boy_rohan', 'boy_aditya', 'boy_kabir', 'boy_henry', 'boy_arjun']);
    allUsers = allUsers.filter(u => 
      u && 
      !mockIds.has(u.id) && 
      !u.id?.startsWith('girl_') && 
      !u.id?.startsWith('boy_') && 
      !u.id?.startsWith('mock_') && 
      !u.isMock
    );

    setUsers(allUsers);
    const currentRound = getRoundState();
    setRoundState(currentRound);
    setStateSchedules(getAllStateSchedules());
    setStatesList(getStatesList());
    
    const subs = getPaymentSubmissions();
    setPaymentSubmissions(subs);

    const refunds = getRefundQueue();
    setRefundQueue(refunds);
    setEnabledStates(getEnabledStates());

    const matchCount = allUsers.reduce((acc, curr) => acc + (curr.matches?.length || 0), 0) / 2;
    const pendingRefundsCount = refunds.filter(r => r.status === 'pending').length;
    const refundCount = pendingRefundsCount || allUsers.filter(u => u.status === 'refund_requested' || u.refundEligible).length;
    const waitlistedCount = allUsers.filter(u => u.status === 'waitlisted').length;
    const activeCount = allUsers.filter(u => u.status === 'active').length;
    const pendingPayCount = subs.filter(s => s.status === 'pending').length;

    const userRevenue = allUsers.reduce((sum, u) => {
      if (u.plan === 'elite') return sum + 449;
      if (u.plan === 'premium') return sum + 250;
      if (u.plan === 'basic') return sum + 100;
      return sum;
    }, 0);
    const approvedPayRevenue = subs
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const totalRev = userRevenue + approvedPayRevenue;

    setStats({
      totalUsers: allUsers.length,
      totalMatches: Math.floor(matchCount),
      newSignups: allUsers.length,
      revenue: totalRev,
      active: activeCount,
      waitlisted: waitlistedCount,
      refunds: refundCount,
      pendingPayments: pendingPayCount
    });

    if (selectedUser) {
      const refreshed = allUsers.find(u => u.id === selectedUser.id);
      setSelectedUser(refreshed || null);
    }
  };

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (cleanEmail === 'cupid.livepro@gmail.com' && cleanPass === 'cUpid.livepro#@3210') {
      setAdminAuthenticated(true);
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid admin credentials. Please enter correct email and password.');
    }
  };

  const handleLogout = () => {
    setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setLoginEmail('');
    setLoginPassword('');
    if (onOpenLanding) onOpenLanding();
  };

  const handleActiveStateChange = (newState) => {
    if (!newState) return;
    setActiveState(newState);
    const current = getRoundState();
    const updated = { 
      ...current, 
      activeState: newState,
      roundStartDate: new Date().toISOString(),
      phaseStartedAt: new Date().toISOString()
    };
    saveRoundState(updated);
    setRoundState(updated);
    setLiveStateSelect(newState);
    if (onStateChange) onStateChange(newState);
    loadAdminData();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    alert(`🎉 Live Round Successfully Switched to ${newState}!\n\nThis round is now instantly LIVE across all users' mobile devices and synced with Supabase.`);
  };

  // State Active/Inactive Toggle Handler (User Requirement: 10-Day schedule strictly preserved)
  const handleToggleState = (stateName) => {
    const currentlyEnabled = isStateEnabled(stateName);
    const updatedMap = toggleStateEnabled(stateName, !currentlyEnabled);
    setEnabledStates({ ...updatedMap });
    setStateSchedules(getAllStateSchedules());
    loadAdminData();
  };

  // Reject Invalid Payment Entry (User Requirement: Auto-approved by default, Admin can reject fake payments)
  const handleRejectPaymentEntry = (submission) => {
    if (!submission) return;
    rejectPaymentSubmission(submission.userId, rejectReason);
    setPaymentSubmissions(getPaymentSubmissions());
    setRejectModalEntry(null);
    loadAdminData();
    alert(`Entry for ${submission.userName || 'user'} has been rejected. Their round participation was revoked and an alert was sent.`);
  };

  // Process User Refund with UPI Details (User Requirement: Dedicated refund queue with UPI IDs)
  const handleProcessRefundConfirm = () => {
    if (!refundModalUser) return;
    processRefund(refundModalUser.userId, { 
      transactionRef: refundTransactionRef || `UPI-TXN-${Date.now().toString().slice(-6)}`,
      notes: refundNotes 
    });
    setRefundQueue(getRefundQueue());
    setRefundModalUser(null);
    setRefundTransactionRef('');
    setRefundNotes('');
    loadAdminData();
    alert(`✅ Refund of ₹${refundModalUser.amount} for ${refundModalUser.name} to UPI ${refundModalUser.upiId} has been marked as completed!`);
  };

  const handleRejectRefundClick = (refundItem) => {
    if (confirm(`Decline refund request for ${refundItem.name}?`)) {
      rejectRefund(refundItem.userId, 'Did not meet refund criteria');
      setRefundQueue(getRefundQueue());
      loadAdminData();
    }
  };

  const handleCopyUpi = (upiId) => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(upiId);
    setTimeout(() => setCopiedUpi(null), 2500);
  };

  // States Management Actions
  const handleCreateState = (e) => {
    e.preventDefault();
    if (!newStateName.trim()) return;
    const success = addState(newStateName);
    if (success) {
      setNewStateName('');
      setStatesList(getStatesList());
      setStateSchedules(getAllStateSchedules());
    }
  };

  const handleSaveStateEdit = (oldName) => {
    if (!editingState?.newName?.trim()) return;
    updateState(oldName, editingState.newName);
    setEditingState(null);
    setStatesList(getStatesList());
    setStateSchedules(getAllStateSchedules());
    loadAdminData();
  };

  const handleDeleteStateClick = (stateName) => {
    if (confirm(`Are you sure you want to delete state "${stateName}"?`)) {
      deleteState(stateName);
      setStatesList(getStatesList());
      setStateSchedules(getAllStateSchedules());
      loadAdminData();
    }
  };

  // Colleges Management Actions
  const handleCreateCollege = (e) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;
    const success = addCollege(selectedCollegeState, newCollegeName);
    if (success) {
      setNewCollegeName('');
      setCollegesList(getCollegesByState(selectedCollegeState));
    }
  };

  const handleSaveCollegeEdit = (oldName) => {
    if (!editingCollege?.newName?.trim()) return;
    updateCollege(selectedCollegeState, oldName, editingCollege.newName);
    setEditingCollege(null);
    setCollegesList(getCollegesByState(selectedCollegeState));
  };

  const handleDeleteCollegeClick = (collegeName) => {
    deleteCollege(selectedCollegeState, collegeName);
    setCollegesList(getCollegesByState(selectedCollegeState));
  };

  // Schedule Modification Actions
  const handleSaveCustomDate = (e) => {
    e.preventDefault();
    if (!customRoundDate) return;
    updateStateScheduleDate(scheduleStateSelect, customRoundDate, customRoundNum);
    setStateSchedules(getAllStateSchedules());
    // Also immediately activate this state as live active round across Supabase & all mobile phones
    handleActiveStateChange(scheduleStateSelect);
  };

  // Phase transition & Next round
  const handleAdvancePhase = () => {
    const updated = advanceRoundPhase();
    setRoundState(updated);
    loadAdminData();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleStartNextRound = () => {
    const updated = forceRotateToNextState();
    setRoundState(updated);
    if (onStateChange && updated.activeState) {
      onStateChange(updated.activeState);
    }
    loadAdminData();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
  };

  const handleRunMatchEngine = () => {
    const res = runAlgorithmicMatchEngine(activeState);
    loadAdminData();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    alert(`3-Tier Compatibility Matching Engine Executed for ${res.stateName}!\n\n• Elite Matches (₹449): ${res.eliteMatches}\n• Premium Matches (₹250): ${res.premiumMatches}\n• Basic Settlement Matches (₹100): ${res.basicMatches}\n\nTotal Matched Pairs Created: ${res.totalMatchedPairs}`);
  };

  // Payment approval / rejection
  const handleApprovePayment = (submission) => {
    updatePaymentStatus(submission.userId, 'approved');
    const allUsers = getUsers();
    const idx = allUsers.findIndex(u => u.id === submission.userId);
    if (idx !== -1) {
      allUsers[idx].status = 'active';
      allUsers[idx].paymentVerified = true;
      allUsers[idx].paymentVerifiedAt = new Date().toISOString();
      saveUsers(allUsers);
    }
    setPaymentSubmissions(getPaymentSubmissions());
    loadAdminData();
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
  };

  const handleRejectPayment = (submission) => {
    updatePaymentStatus(submission.userId, 'rejected');
    setPaymentSubmissions(getPaymentSubmissions());
  };

  const handleApproveRefund = (uId) => {
    const allUsers = getUsers();
    const fresh = allUsers.find(u => u.id === uId);
    if (fresh) {
      fresh.status = 'refunded';
      fresh.refundEligible = false;
      fresh.refundRequested = false;
      fresh.refundProcessedAt = new Date().toISOString();
      fresh.refundTxnId = `UPI_REF_${Math.floor(100000 + Math.random() * 900000)}`;
      fresh.matches = [];
      saveUsers(allUsers);
      loadAdminData();
    }
  };

  const handleDeleteUser = (uId) => {
    if (confirm("Are you sure you want to delete this user profile?")) {
      const allUsers = getUsers();
      const updated = allUsers.filter(u => u.id !== uId);
      saveUsers(updated);
      setSelectedUser(null);
      loadAdminData();
    }
  };

  // Derived Matched Pairs list
  const getMatchedPairsList = () => {
    const matchedPairs = [];
    const visited = new Set();
    users.forEach(u => {
      if (Array.isArray(u.matches) && u.matches.length > 0) {
        u.matches.forEach(mId => {
          const pairKey = [u.id, mId].sort().join('_');
          if (!visited.has(pairKey)) {
            visited.add(pairKey);
            const partner = users.find(other => other.id === mId);
            if (partner) {
              matchedPairs.push({
                userA: u,
                userB: partner,
                score: u.matchScore || partner.matchScore || 94,
                state: u.state || partner.state || 'Delhi NCR'
              });
            }
          }
        });
      }
    });
    return matchedPairs;
  };

  // Manual Matchmaker Actions
  const handleToggleTargetCandidate = (candidateId) => {
    setMatchmakerSelectedTargets(prev => 
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleAssignManualMatches = () => {
    if (!matchmakerUserA) {
      alert('Please select the primary user first.');
      return;
    }
    if (matchmakerSelectedTargets.length === 0) {
      alert('Please select at least 1 candidate profile to match with.');
      return;
    }

    const success = assignManualMatch(matchmakerUserA, matchmakerSelectedTargets, Number(matchmakerScore) || 95);
    if (success) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      loadAdminData();
      setMatchmakerActionFeedback({
        type: 'success',
        message: `💖 Confirmed ${matchmakerSelectedTargets.length} mutual match(es)! Both profiles are instantly linked and direct chat is unlocked.`
      });
      setMatchmakerSelectedTargets([]);
      setTimeout(() => setMatchmakerActionFeedback(null), 6000);
    }
  };

  const handleRecommendToFeed = () => {
    if (!matchmakerUserA) {
      alert('Please select the primary user first.');
      return;
    }
    if (matchmakerSelectedTargets.length === 0) {
      alert('Please select at least 1 candidate profile to recommend.');
      return;
    }

    const success = recommendCandidatesToUser(matchmakerUserA, matchmakerSelectedTargets, Number(matchmakerScore) || 95);
    if (success) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      loadAdminData();
      setMatchmakerActionFeedback({
        type: 'success',
        message: `🎯 Sent ${matchmakerSelectedTargets.length} recommended candidate(s) to user's Explore feed! They will see them at the top of their dashboard to review and like.`
      });
      setMatchmakerSelectedTargets([]);
      setTimeout(() => setMatchmakerActionFeedback(null), 6000);
    }
  };

  const handleUnmatchClick = (userAId, userBId) => {
    if (confirm('Are you sure you want to unmatch these two users? Their chat connection will be closed.')) {
      unmatchUser(userAId, userBId);
      loadAdminData();
    }
  };

  // Round Timing & Alteration Actions
  const handleExtendCurrentTimer = (hours) => {
    const updated = alterRoundTiming({ extendHours: hours });
    setRoundState(updated);
    loadAdminData();
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    alert(`⏱️ Phase timer successfully extended by +${hours} hours! Synced live across website & mobile apps.`);
  };

  const handleSwitchPhaseDirect = (newPhase) => {
    const updated = alterRoundTiming({ newPhase });
    setRoundState(updated);
    loadAdminData();
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    alert(`⚡ Round phase switched to "${PHASE_LABELS[newPhase]?.title || newPhase}"! All devices updated.`);
  };

  const handleConfirmPauseRound = () => {
    const updated = pauseOrCancelActiveRound(pauseReasonInput);
    setRoundState(updated);
    setShowPauseModal(false);
    loadAdminData();
    alert(`⏸️ Active round for ${roundState.activeState} has been PAUSED.`);
  };

  const handleResumeActiveRoundClick = () => {
    const updated = resumeActiveRound();
    setRoundState(updated);
    loadAdminData();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    alert(`▶️ Active round for ${roundState.activeState} has been RESUMED!`);
  };

  const handleSkipActiveRoundClick = () => {
    if (confirm(`Are you sure you want to SKIP Round #${roundState.roundNumber} for ${roundState.activeState}? A snapshot will be saved to Round Logs and the round will immediately rotate to the next scheduled state.`)) {
      const updated = skipActiveRound(`Skipped manually by Admin on ${new Date().toLocaleString()}`);
      setRoundState(updated);
      setRoundLogs(getRoundLogs());
      loadAdminData();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      alert(`⏭️ Round skipped! Next state is now live.`);
    }
  };

  const handleManualArchiveClick = () => {
    const log = archiveCurrentRound('manual_archive', `Manual admin snapshot saved on ${new Date().toLocaleString()}`);
    const freshLogs = getRoundLogs();
    setRoundLogs(freshLogs);
    setSelectedLogId(log.id);
    setActiveNav('logs');
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    alert(`📸 Round snapshot archived! Available in Round Logs tab.`);
  };

  const handleDeleteLogClick = (logId) => {
    if (confirm('Are you sure you want to delete this round log archive?')) {
      const fresh = deleteRoundLog(logId);
      setRoundLogs(fresh);
      if (selectedLogId === logId) {
        setSelectedLogId(fresh[0]?.id || null);
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesQuery = !searchQuery.trim() || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.university?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState = filterState === 'All' || u.state === filterState;
    const matchesPlan = filterPlan === 'All' || u.plan === filterPlan;
    const matchesGender = filterGender === 'All' || u.gender === filterGender;
    const matchesStatus = filterStatus === 'All' || u.status === filterStatus;

    return matchesQuery && matchesState && matchesPlan && matchesGender && matchesStatus;
  });

  const refundEligibleUsers = users.filter(u => 
    u.status === 'refund_requested' || 
    u.refundEligible === true || 
    u.status === 'refunded'
  );

  const matchedPairs = getMatchedPairsList();
  const phaseStep = PHASE_LABELS[roundState.currentPhase]?.step || 1;

  // Dynamic Metrics for Donut Chart and Recent Activity
  const verifiedUsersCount = users.filter(u => u.status === 'active' || u.paymentVerified).length;
  const pendingPaymentsCount = paymentSubmissions.filter(s => s.status === 'pending').length;
  const unverifiedUsersCount = Math.max(0, users.length - verifiedUsersCount - pendingPaymentsCount);
  const totalForDonut = users.length || 1;
  const verifiedPct = Math.round((verifiedUsersCount / totalForDonut) * 100);
  const pendingPct = Math.round((pendingPaymentsCount / totalForDonut) * 100);
  const unverifiedPct = Math.max(0, 100 - verifiedPct - pendingPct);

  const recentActivities = [
    ...users.slice(-3).reverse().map(u => ({
      title: `${u.name} registered (${u.state || activeState})`,
      time: 'New Signup',
      avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
    })),
    ...paymentSubmissions.slice(-2).reverse().map(p => ({
      title: `Payment ${p.status}: ₹${p.amount} (${p.userName})`,
      time: p.submittedAt ? new Date(p.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
      icon: CreditCard,
      iconBg: p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#FFF0F5] text-[#FF2E79]'
    }))
  ].slice(0, 5);

  const activeRoundEntriesCount = users.filter(u => u.state === (roundState.activeState || activeState)).length;

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ADMIN LOGIN VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] w-full flex items-center justify-center p-4 bg-[#FFF5F8]">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 space-y-6 border border-[#FFE1EB] shadow-xl rounded-3xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-[#FF2E79]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Console</h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter admin credentials to access state, college, round, payment verification, and refund management.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#FF2E79]"
                  placeholder="cupid.livepro@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#FF2E79]"
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-rose-200 cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login to Admin Panel</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Sidebar navigation items list
  const navItems = [
    { id: 'dashboard', label: 'Live Operations', icon: LayoutDashboard },
    { id: 'rounds', label: 'Round Controls & Timers', icon: Flame },
    { id: 'matches', label: 'Manual Matchmaker & Pairs', icon: Heart, badge: stats.totalMatches },
    { id: 'logs', label: 'Round Logs & Archives', icon: FileText, badge: roundLogs.length || null, badgeColor: 'bg-purple-100 text-purple-700' },
    { id: 'verifications', label: 'Payment Verifications', icon: ShieldCheck, badge: paymentSubmissions.filter(s => s.status === 'pending').length || null, badgeColor: 'bg-rose-500 text-white' },
    { id: 'refunds', label: 'Refund Queue', icon: DollarSign, badge: refundQueue.filter(r => r.status === 'pending').length || null, badgeColor: 'bg-amber-500 text-white' },
    { id: 'users', label: 'Users Directory', icon: Users, badge: stats.totalUsers },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics & Revenue', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Flags', icon: Flag },
    { id: 'settings', label: 'States & Colleges', icon: Settings },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MAIN ADMIN DASHBOARD VIEW (MATCHING IMAGE 2 EXACTLY)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#FFF5F8] flex flex-col md:flex-row text-slate-800 font-sans select-none">
      
      {/* MOBILE TOP HEADER BAR */}
      <div className="md:hidden bg-white border-b border-[#FFE1EB] px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <CupidLogo size="sm" textColor="dark" />
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-rose-50 text-[#FF2E79] border border-rose-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* LEFT SIDEBAR PANEL (Matching Image 2) */}
      <aside className={`
        fixed md:sticky top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#FFE1EB] p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Logo & Subtitle */}
          <div className="flex items-center justify-between">
            <div>
              <CupidLogo size="md" textColor="dark" />
              <p className="text-[11px] font-bold text-slate-400 mt-0.5 tracking-wide">Admin Panel</p>
            </div>
            <button 
              className="md:hidden text-slate-400 hover:text-slate-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#FFEBF2] text-[#FF2E79] shadow-xs'
                      : 'text-slate-600 hover:bg-rose-50/50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF2E79]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="text-center">
            <p className="font-cursive text-sm text-[#FF2E79] font-bold">Good People Brighter Stories</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-xs font-bold text-slate-600 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl overflow-x-hidden">
        
        {/* TOP HEADER BAR (Search + Admin User Profile) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users, matches, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 sm:h-10 pl-10 pr-4 rounded-full bg-white border border-[#FFE1EB] text-xs text-slate-700 focus:outline-none focus:border-[#FF2E79] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Quick Section Chips for Mobile Navigation */}
            <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'dashboard', label: 'Overview' },
                { id: 'rounds', label: 'Rounds' },
                { id: 'matches', label: 'Matches' },
                { id: 'logs', label: 'Logs' },
                { id: 'verifications', label: `Verifications ${stats.pendingPayments ? `(${stats.pendingPayments})` : ''}` },
                { id: 'refunds', label: 'Refunds' },
                { id: 'users', label: 'Users' },
                { id: 'notifications', label: 'Notifications' },
                { id: 'settings', label: 'Settings' }
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setActiveNav(chip.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-colors ${
                    activeNav === chip.id ? 'bg-[#FF2E79] text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveNav('verifications')}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#FFE1EB] flex items-center justify-center relative text-slate-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Notifications / Pending Verifications"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {stats.pendingPayments > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF2E79] absolute top-1.5 right-1.5 ring-2 ring-white" />
                )}
              </button>

              <div className="flex items-center gap-2 bg-white border border-[#FFE1EB] px-2.5 py-1 rounded-full shadow-2xs">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                  alt="Admin Profile"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-2 ring-[#FF2E79]/30"
                />
                <span className="text-xs font-black text-slate-800">Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 1: MAIN DASHBOARD OVERVIEW (IMAGE 2 EXACT MATCH)
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Dashboard Welcome Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>Welcome back, Admin</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Here's what's happening on Cupid today.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-cursive text-sm text-[#FF2E79] font-bold hidden md:inline">Good People Brighter Stories</span>
                <div className="bg-white border border-[#FFE1EB] px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-[#FF2E79]" />
                  <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                LIVE ROUND OPERATIONS & DYNAMIC TIMER BANNER (SaaS Command Center)
               ═══════════════════════════════════════════════════════════════ */}
            {(() => {
              const currentRoundNum = roundState.roundNumber || 1;
              const currentActiveState = roundState.activeState || activeState || 'Delhi NCR';
              const isPaused = !!roundState.isPaused;
              const currentPhase = roundState.currentPhase || 'entries_submission';
              const phaseInfo = PHASE_LABELS[currentPhase] || { title: 'Entries & Auto-Approval', duration: '24h' };
              
              // Next Round Schedule Info
              const upcomingStates = stateSchedules.filter(s => s.state.toLowerCase() !== currentActiveState.toLowerCase());
              const nextStateObj = upcomingStates[0] || stateSchedules[1] || { state: 'Maharashtra', nextRoundDate: 'In 2 Days' };
              
              // Dynamic Active State Live Entries Calculation (User requested: no hardcoded/dummy values, fully linked to active round state)
              const liveStateEntries = users.filter(u => {
                const uSt = (u.state || u.hometown || '').toLowerCase();
                const actSt = currentActiveState.toLowerCase();
                return uSt.includes(actSt) || actSt.includes(uSt);
              });
              const liveStateMaleCount = liveStateEntries.filter(u => (u.gender || '').toLowerCase() === 'male').length;
              const liveStateFemaleCount = liveStateEntries.filter(u => (u.gender || '').toLowerCase() === 'female').length;
              const liveStateEliteCount = liveStateEntries.filter(u => u.plan === 'elite').length;
              const liveStatePremiumCount = liveStateEntries.filter(u => u.plan === 'premium').length;
              const liveStateBasicCount = liveStateEntries.filter(u => !u.plan || u.plan === 'basic').length;
              const liveStateVerifiedCount = liveStateEntries.filter(u => u.paymentVerified || u.autoApproved || u.status === 'active').length;
              const activeMatchesSlice = matchedPairs.filter(p => {
                const pState = (p.state || p.userA?.state || p.userB?.state || '').toLowerCase();
                const actSt = currentActiveState.toLowerCase();
                return pState.includes(actSt) || actSt.includes(pState);
              }).slice(0, 3);

              return (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#FFE1EB] shadow-xs space-y-5 text-slate-800">
                  {/* Top Bar: Round Header & Quick Operational Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#FFE1EB] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          isPaused 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
                          {isPaused ? 'PAUSED' : 'LIVE ROUND NOW'}
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <span>Cupid Round #{currentRoundNum}</span>
                          <span className="text-[#FF2E79]">•</span>
                          <span className="text-[#FF2E79] font-black">{currentActiveState}</span>
                        </h2>
                        <span className="text-xs text-slate-500 font-semibold">
                          ({phaseInfo.title})
                        </span>
                      </div>
                      {isPaused && roundState.pauseReason && (
                        <p className="text-xs text-amber-700 font-medium">
                          ⚠️ Pause Reason: {roundState.pauseReason}
                        </p>
                      )}
                    </div>

                    {/* Operational Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPaused ? (
                        <button
                          type="button"
                          onClick={handleResumeActiveRoundClick}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume Round</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPauseModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause / Hold</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSkipActiveRoundClick}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-purple-600" />
                        <span>Skip Round</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleManualArchiveClick}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Archive Snapshot</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveNav('rounds')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Alter Timings</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle Grid: Dynamic Timer & Next Round Pipeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dynamic Live Phase Countdown Timer */}
                    <div className="md:col-span-2 bg-[#FFF9FA] rounded-2xl p-4 sm:p-5 border border-[#FFE1EB] space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF2E79]">Dynamic Phase Countdown</span>
                          <h4 className="text-xs font-bold text-slate-800">{phaseInfo.title} Window</h4>
                        </div>
                        {/* Quick Extend Timer Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-bold mr-1">Extend:</span>
                          {[1, 2, 6, 12, 24].map((hrs) => (
                            <button
                              key={hrs}
                              type="button"
                              onClick={() => handleExtendCurrentTimer(hrs)}
                              className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#FF2E79] hover:text-white text-slate-700 text-[11px] font-black border border-pink-200 transition-colors shadow-2xs cursor-pointer"
                            >
                              +{hrs}h
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Digital Ticking Clock Display in Cupid Light Aesthetic */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-white border-2 border-pink-100 px-3.5 py-2 rounded-2xl text-center min-w-[56px] shadow-2xs">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{phaseCountdown.hours}</span>
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Hours</span>
                          </div>
                          <span className="text-2xl font-black text-[#FF2E79] animate-pulse">:</span>
                          <div className="bg-white border-2 border-pink-100 px-3.5 py-2 rounded-2xl text-center min-w-[56px] shadow-2xs">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{phaseCountdown.mins}</span>
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mins</span>
                          </div>
                          <span className="text-2xl font-black text-[#FF2E79] animate-pulse">:</span>
                          <div className="bg-white border-2 border-pink-200 px-3.5 py-2 rounded-2xl text-center min-w-[56px] shadow-2xs">
                            <span className="text-2xl sm:text-3xl font-black text-[#FF2E79] tracking-tight">{phaseCountdown.secs}</span>
                            <span className="block text-[9px] font-black text-[#FF2E79] uppercase tracking-wider">Secs</span>
                          </div>
                        </div>

                        <div className="flex-1 hidden sm:block pl-3 border-l border-pink-100 text-xs text-slate-600 space-y-1">
                          <p className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-[#FF2E79]" />
                            <span>Started: {new Date(roundState.phaseStartedAt || roundState.roundStartDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            When timer reaches zero, round transitions automatically to the next phase across website & mobile app.
                          </p>
                        </div>
                      </div>

                      {/* Direct Phase Switch Fast Pills */}
                      <div className="pt-2.5 border-t border-pink-100 flex items-center justify-between text-xs flex-wrap gap-2">
                        <span className="text-slate-500 text-[11px] font-bold">Direct Phase Jump:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.ENTRIES_COLLECTION)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                              currentPhase === ROUND_PHASES.ENTRIES_COLLECTION || currentPhase === 'entries_submission' 
                                ? 'bg-[#FF2E79] text-white shadow-xs border border-[#FF2E79]' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-pink-300'
                            }`}
                          >
                            1. Entries (Day 1)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.ELITE_MATCHING)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                              currentPhase === ROUND_PHASES.ELITE_MATCHING || currentPhase === 'live_matching' 
                                ? 'bg-purple-600 text-white shadow-xs border border-purple-600' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
                            }`}
                          >
                            2. Elite (16h)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.PREMIUM_MATCHING)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                              currentPhase === ROUND_PHASES.PREMIUM_MATCHING 
                                ? 'bg-amber-600 text-white shadow-xs border border-amber-600' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            3. Premium (8h)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.BASIC_SETTLEMENT)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                              currentPhase === ROUND_PHASES.BASIC_SETTLEMENT 
                                ? 'bg-emerald-600 text-white shadow-xs border border-emerald-600' 
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            4. Settlement
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Next Round Rotation Card */}
                    <div className="bg-[#FFF9FA] rounded-2xl p-4 sm:p-5 border border-[#FFE1EB] space-y-3 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          Next Round in Pipeline
                        </span>
                        <h4 className="text-base font-black text-slate-900 mt-2 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#FF2E79]" />
                          <span>{nextStateObj.state}</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Scheduled: <strong className="text-emerald-700 font-extrabold">{nextStateObj.nextRoundDate}</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-pink-100 text-[11px] text-slate-500 space-y-1">
                        <p className="font-bold text-slate-800">10-Day Rotation Spacing</p>
                        <p>States rotate in order. You can toggle states ON/OFF in Round Controls.</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartNextRound}
                        className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Rotate State Now</span>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Grid: Dynamic Active State Live Entries Breakdown & Live Matched Pairs Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                    {/* Dynamic Active State Live Entries Card */}
                    <div className="bg-[#FFF9FA] rounded-2xl p-4 sm:p-5 border border-[#FFE1EB] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#FF2E79] flex items-center justify-center font-black text-xs uppercase">
                            {currentActiveState.split(' ').map(w => w[0]).join('').slice(0, 3)}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{currentActiveState} Live Entries</h4>
                            <p className="text-[10px] text-slate-500">Current round entry stats & plan tiers</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-pink-50 text-[#FF2E79] font-black text-xs border border-pink-200">
                          {liveStateEntries.length} Total Registered
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="bg-white p-2.5 rounded-xl border border-pink-100 shadow-2xs">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Males</span>
                          <span className="text-base font-black text-blue-600">{liveStateMaleCount}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-pink-100 shadow-2xs">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Females</span>
                          <span className="text-base font-black text-pink-600">{liveStateFemaleCount}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-pink-100 shadow-2xs">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Elite (₹449)</span>
                          <span className="text-base font-black text-purple-700">{liveStateEliteCount}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-pink-100 shadow-2xs">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Premium (₹250)</span>
                          <span className="text-base font-black text-amber-700">{liveStatePremiumCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-pink-100">
                        <span>Auto-Approved / Verified: <strong className="text-emerald-700">{liveStateVerifiedCount}</strong></span>
                        <button
                          type="button"
                          onClick={() => setActiveNav('verifications')}
                          className="text-[#FF2E79] font-bold hover:underline cursor-pointer"
                        >
                          Review Screenshots →
                        </button>
                      </div>
                    </div>

                    {/* Live Matches Preview Card */}
                    <div className="bg-[#FFF9FA] rounded-2xl p-4 sm:p-5 border border-[#FFE1EB] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#FF2E79] flex items-center justify-center font-black text-xs">
                            <Heart className="w-4 h-4 fill-current" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">Live Matched Pairs ({matchedPairs.length})</h4>
                            <p className="text-[10px] text-slate-500">Mutual matches formed this round</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveNav('matches')}
                          className="text-xs font-bold text-[#FF2E79] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Matchmaker</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {activeMatchesSlice.length === 0 ? (
                        <div className="p-4 rounded-xl bg-white border border-pink-100 text-center text-xs text-slate-500 space-y-2">
                          <p>No mutual matches generated yet.</p>
                          <button
                            type="button"
                            onClick={() => setActiveNav('matches')}
                            className="px-3 py-1 rounded-lg bg-[#FF2E79] text-white text-[11px] font-black cursor-pointer shadow-xs"
                          >
                            + Assign Manual Match
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeMatchesSlice.map((pair, pIdx) => (
                            <div key={pIdx} className="p-2.5 rounded-xl bg-white border border-pink-100 shadow-2xs flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <img src={pair.userA.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-[#FF2E79]" />
                                <span className="font-bold text-slate-900 text-[11px]">{pair.userA.name}</span>
                              </div>
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 text-[#FF2E79] text-[10px] font-black border border-pink-200">
                                <Heart className="w-3 h-3 fill-current text-[#FF2E79]" />
                                <span>{pair.score || 95}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-[11px]">{pair.userB.name}</span>
                                <img src={pair.userB.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-purple-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-pink-100">
                        <span>Can assign 1 or multiple matches manually</span>
                        <button
                          type="button"
                          onClick={() => setActiveNav('matches')}
                          className="font-bold text-purple-700 hover:underline cursor-pointer"
                        >
                          Manual Matchmaker & Unmatch →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Row 1: Top 4 Summary Metric Cards (2x2 grid on mobile, 4-col on desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              
              {/* Card 1: Total Users */}
              <div className="bg-white p-3 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs flex items-center justify-between">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-pink-100/60 text-[#FF2E79] flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium pt-0.5">Total Users</p>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">{stats.totalUsers.toLocaleString()}</h3>
                  <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="w-12 h-8 sm:w-20 sm:h-12 text-[#FF2E79] shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M0 30 Q25 35 50 15 T100 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 2: Total Matches */}
              <div className="bg-white p-3 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs flex items-center justify-between">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-pink-100/60 text-[#FF2E79] flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 fill-current" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium pt-0.5">Total Matches</p>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">{stats.totalMatches.toLocaleString()}</h3>
                  <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="w-12 h-8 sm:w-20 sm:h-12 text-[#FF2E79] shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M0 25 Q30 30 60 10 T100 15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 3: New Signups */}
              <div className="bg-white p-3 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs flex items-center justify-between">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-pink-100/60 text-[#FF2E79] flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium pt-0.5">New Signups</p>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">{stats.newSignups}</h3>
                  <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="w-12 h-8 sm:w-20 sm:h-12 text-[#FF2E79] shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M0 35 Q30 20 60 25 T100 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 4: Revenue */}
              <div className="bg-white p-3 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs flex items-center justify-between">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-pink-100/60 text-[#FF2E79] flex items-center justify-center font-bold text-xs sm:text-sm">
                    ₹
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium pt-0.5">Revenue</p>
                  <h3 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">₹{stats.revenue.toLocaleString()}</h3>
                  <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                </div>
                {/* Sparkline SVG */}
                <div className="w-12 h-8 sm:w-20 sm:h-12 text-[#FF2E79] shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M0 30 Q25 25 50 10 T100 2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

            </div>

            {/* Row 2: Charts & Recent Activity (Image 2 exact middle section) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* User Growth Line Chart (2 Cols) */}
              <div className="lg:col-span-2 bg-white p-3.5 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">User Growth</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400">Registered candidates trajectory</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-600">
                    Live Active Data
                  </div>
                </div>

                {/* Smooth Area Line Chart SVG */}
                <div className="w-full h-44 sm:h-60 pt-2 sm:pt-4">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF2E79" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#FF2E79" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="4 4" />
                    <line x1="0" y1="165" x2="500" y2="165" stroke="#f1f5f9" strokeDasharray="4 4" />

                    {/* Gradient fill path */}
                    <path
                      d="M0,140 Q100,120 200,80 T400,50 T500,20 L500,165 L0,165 Z"
                      fill="url(#growthGrad)"
                    />
                    {/* Line path */}
                    <path
                      d="M0,140 Q100,120 200,80 T400,50 T500,20"
                      fill="none"
                      stroke="#FF2E79"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-slate-400 pt-1.5 sm:pt-2">
                    <span>Round Startup</span>
                    <span>Plan Entries</span>
                    <span>Verified</span>
                    <span>Matching</span>
                    <span>Live Today</span>
                  </div>
                </div>
              </div>

              {/* User Distribution & Activity Timeline (1 Col) */}
              <div className="space-y-4 sm:space-y-6">
                
                {/* User Distribution Donut Chart */}
                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">User Distribution</h3>
                      <p className="text-[10px] sm:text-xs text-slate-400">By verification status</p>
                    </div>
                    <button type="button" onClick={loadAdminData} className="text-slate-400 hover:text-slate-600">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-around pt-1">
                    {/* Donut SVG */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#ffe4e6"
                          strokeWidth="3.8"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#FF2E79"
                          strokeWidth="3.8"
                          strokeDasharray={`${verifiedPct}, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{stats.totalUsers.toLocaleString()}</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold">Users</span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF2E79]" />
                        <span className="text-slate-600">Verified</span>
                        <span className="text-slate-900 font-black ml-auto">{verifiedPct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-300" />
                        <span className="text-slate-600">Pending</span>
                        <span className="text-slate-900 font-black ml-auto">{pendingPct}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
                        <span className="text-slate-600">Unverified</span>
                        <span className="text-slate-900 font-black ml-auto">{unverifiedPct}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">Recent Activity</h3>
                    <button onClick={() => setActiveNav('users')} className="text-xs font-extrabold text-[#FF2E79] hover:underline">
                      View all →
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {recentActivities.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {item.avatar ? (
                          <img src={item.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="text-xs flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Row 3: Recent Users Table + Live Rounds & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Recent Users Table (2 Cols) */}
              <div className="lg:col-span-2 bg-white p-3.5 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Recent Users</h3>
                  <button onClick={() => setActiveNav('users')} className="text-xs font-extrabold text-[#FF2E79] hover:underline">
                    View all →
                  </button>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2.5">User</th>
                        <th className="pb-2.5">Details</th>
                        <th className="pb-2.5">Status</th>
                        <th className="pb-2.5">Joined</th>
                        <th className="pb-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.slice(0, 5).map((u, idx) => (
                        <tr key={u.id || idx} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-2">
                              <img src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0" />
                              <span className="font-bold text-slate-900">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-slate-500 font-medium">
                            {u.university || 'University'} • {u.state || activeState}
                          </td>
                          <td className="py-2.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {u.status || 'Active'}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 font-medium">Recent</td>
                          <td className="py-2.5 text-right">
                            <button onClick={() => setActiveNav('users')} className="text-slate-400 hover:text-slate-600 p-1">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Rounds Card & Quick Actions (1 Col) */}
              <div className="space-y-4 sm:space-y-6">
                
                {/* Live Rounds Card */}
                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">Live Rounds</h3>
                    <button onClick={() => setActiveNav('rounds')} className="text-xs font-extrabold text-[#FF2E79] hover:underline">
                      View all →
                    </button>
                  </div>

                  {/* Active Round Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 relative space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs sm:text-sm">Cupid Round #{roundState.roundNumber || 1}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Active</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#FF2E79]" /> Phase: {PHASE_LABELS[roundState.currentPhase]?.title}</p>
                      <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#FF2E79]" /> {activeRoundEntriesCount} entries ({roundState.activeState || activeState})</p>
                    </div>

                    <button
                      onClick={() => setActiveNav('rounds')}
                      className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white text-[11px] sm:text-xs font-extrabold shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>View Entries</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Upcoming State Round Schedule */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">State Rotation Schedule</p>
                      <p className="text-[10px] text-slate-400">10-Day Rotation active</p>
                    </div>
                    <button onClick={() => setActiveNav('rounds')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer">
                      Schedule
                    </button>
                  </div>
                </div>

                {/* Quick Actions (2x2 grid on mobile) */}
                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs space-y-2.5 sm:space-y-3">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#FF2E79]" />
                    <span>Quick Actions</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 text-xs font-bold text-slate-700">
                    <button onClick={() => setActiveNav('users')} className="p-2.5 rounded-xl border border-slate-200 hover:border-[#FF2E79] hover:bg-rose-50/40 flex items-center justify-between transition-colors cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <UserPlus className="w-3.5 h-3.5 text-[#FF2E79] shrink-0" />
                        <span className="truncate">Add User</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button onClick={() => setActiveNav('notifications')} className="p-2.5 rounded-xl border border-slate-200 hover:border-[#FF2E79] hover:bg-rose-50/40 flex items-center justify-between transition-colors cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <Send className="w-3.5 h-3.5 text-[#FF2E79] shrink-0" />
                        <span className="truncate">Notification</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button onClick={() => setActiveNav('rounds')} className="p-2.5 rounded-xl border border-slate-200 hover:border-[#FF2E79] hover:bg-rose-50/40 flex items-center justify-between transition-colors cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <Flame className="w-3.5 h-3.5 text-[#FF2E79] shrink-0" />
                        <span className="truncate">Live Round</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 2: VERIFICATIONS / PAYMENTS QUEUE (Auto-Approved by default)
           ═══════════════════════════════════════════════════════════════════════ */}
        {(activeNav === 'verifications' || activeNav === 'payments') && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <span>Payment Verifications</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  All male user entries are <strong>Auto-Approved</strong> by default so they enter the round immediately. You can review payment proofs and manually reject fraudulent entries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSubmissions(getPaymentSubmissions())}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#FFE1EB] hover:bg-rose-50 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FF2E79]" />
                <span>Refresh Submissions</span>
              </button>
            </div>

            {/* Auto-Approval Notice Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                <strong>Auto-Approve Enabled:</strong> During Day 1 (First 24h), user payments are automatically verified so they never face onboarding delays. If any payment screenshot or UPI reference is invalid, click <strong>"Reject Entry & Revoke"</strong> below.
              </p>
            </div>

            {paymentSubmissions.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-[#FFE1EB] text-center text-slate-400 text-xs font-semibold">
                No payment submissions recorded yet.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {[...paymentSubmissions].reverse().map((sub, i) => (
                  <div
                    key={sub.userId + i}
                    className={`bg-white p-5 rounded-2xl space-y-3 border-2 transition-all ${
                      sub.status === 'approved' ? 'border-emerald-200 shadow-xs' :
                      sub.status === 'rejected' ? 'border-rose-200 bg-rose-50/20' :
                      'border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        sub.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.status === 'approved' && <Check className="w-3 h-3 stroke-[3]" />}
                        {sub.status === 'approved' ? 'Auto-Approved (Active)' : sub.status === 'rejected' ? 'Rejected / Revoked' : 'Pending Verification'}
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-600 uppercase">{sub.plan} Plan • ₹{sub.amount}</span>
                    </div>

                    <div className="text-xs space-y-0.5 text-slate-700">
                      <p className="font-black text-slate-900 text-sm">{sub.userName}</p>
                      <p className="text-slate-500">{sub.userEmail} {sub.userPhone ? `| ${sub.userPhone}` : ''}</p>
                      <p className="text-slate-500">State: <strong className="text-slate-800">{sub.userState}</strong></p>
                      {sub.upiId && (
                        <p className="text-slate-800 font-bold mt-1">UPI ID: <span className="font-mono text-[#FF2E79] font-extrabold">{sub.upiId}</span></p>
                      )}
                      {sub.utr && (
                        <p className="text-slate-800 font-bold">Ref/UTR: <span className="font-mono text-slate-700 font-extrabold">{sub.utr}</span></p>
                      )}
                      {sub.rejectionReason && (
                        <p className="text-rose-600 font-bold text-[11px] bg-rose-50 p-1.5 rounded-lg border border-rose-100 mt-1">
                          Reason: {sub.rejectionReason}
                        </p>
                      )}
                    </div>

                    {sub.screenshotBase64 ? (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Payment Screenshot:</p>
                        <div className="relative group">
                          <img
                            src={sub.screenshotBase64}
                            alt="Payment Proof"
                            className="w-full max-h-48 object-contain rounded-xl border border-slate-200 cursor-pointer bg-slate-50"
                            onClick={() => setPreviewScreenshot(sub.screenshotBase64)}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewScreenshot(sub.screenshotBase64)}
                            className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Zoom</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100 rounded-xl p-3 text-center text-xs text-slate-400">No screenshot uploaded</div>
                    )}

                    <div className="flex gap-2 pt-1">
                      {sub.status !== 'rejected' ? (
                        <button
                          type="button"
                          onClick={() => setRejectModalEntry(sub)}
                          className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Reject Entry & Revoke Participation</span>
                        </button>
                      ) : (
                        <div className="w-full py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold text-center">
                          Entry Revoked
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW: DEDICATED REFUND QUEUE ('refunds') - With UPI IDs & 1-Click Copy
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'refunds' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-amber-500" />
                  <span>Refund Management Queue</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Users eligible for 100% money-back refund (unmatched paid entries or users who selected 0 candidates) with their UPI IDs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefundQueue(getRefundQueue())}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#FFE1EB] hover:bg-rose-50 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FF2E79]" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Metric Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">Pending Refunds</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900">{refundQueue.filter(r => r.status === 'pending').length}</p>
                <span className="text-[10px] text-slate-400 font-semibold">Awaiting UPI payout</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Pending Amount</span>
                <p className="text-xl sm:text-2xl font-black text-[#FF2E79]">
                  ₹{refundQueue.filter(r => r.status === 'pending').reduce((sum, r) => sum + (Number(r.amount) || 0), 0)}
                </p>
                <span className="text-[10px] text-slate-400 font-semibold">100% guarantee total</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Completed Refunds</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-700">{refundQueue.filter(r => r.status === 'processed').length}</p>
                <span className="text-[10px] text-slate-400 font-semibold">Paid to user UPIs</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Total Eligible Entries</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900">{refundQueue.length}</p>
                <span className="text-[10px] text-slate-400 font-semibold">Across all state rounds</span>
              </div>
            </div>

            {/* Refunds Table / List */}
            {refundQueue.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-[#FFE1EB] text-center text-slate-400 text-xs font-semibold space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-black text-slate-700">No Pending Refunds</p>
                <p>All eligible users have been settled or formed mutual round matches!</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#FFE1EB] p-4 sm:p-5 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3">State / College</th>
                        <th className="pb-3">Plan Paid</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">UPI ID (1-Click Copy)</th>
                        <th className="pb-3">Reason</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {refundQueue.map((item, idx) => (
                        <tr key={item.userId + idx} className="hover:bg-pink-50/30 transition-colors">
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-2.5">
                              <img src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" />
                              <div>
                                <p className="font-extrabold text-slate-900">{item.name}</p>
                                <p className="text-[10px] text-slate-400">{item.email} {item.phone ? `• ${item.phone}` : ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 font-semibold">
                            {item.state} <span className="block text-[10px] text-slate-400 font-normal">{item.university}</span>
                          </td>
                          <td className="py-3">
                            <span className="uppercase text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {item.plan}
                            </span>
                          </td>
                          <td className="py-3 font-black text-[#FF2E79] text-sm">
                            ₹{item.amount}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                {item.upiId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyUpi(item.upiId)}
                                className="p-1 rounded-lg hover:bg-pink-100 text-[#FF2E79] cursor-pointer transition-colors"
                                title="Copy UPI ID"
                              >
                                {copiedUpi === item.upiId ? (
                                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-slate-500 text-[11px] max-w-[150px] truncate" title={item.reason}>
                            {item.reason}
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              item.status === 'processed' ? 'bg-emerald-100 text-emerald-800' :
                              item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {item.status === 'processed' ? 'Processed' : item.status === 'rejected' ? 'Rejected' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {item.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setRefundModalUser(item)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-1 shadow-xs cursor-pointer transition-all active:scale-95"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Paid</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectRefundClick(item)}
                                  className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 cursor-pointer"
                                  title="Decline Refund"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : item.status === 'processed' ? (
                              <span className="text-[10px] font-bold text-emerald-700">
                                Ref: {item.transactionRef || 'Settled'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-500">Declined</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 3: USER DIRECTORY ('users')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Search, filter, and inspect registered candidates.
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white p-4 rounded-2xl border border-[#FFE1EB] flex flex-wrap items-center gap-3">
              <div className="w-full sm:w-48">
                <CustomSelect
                  value={filterState}
                  onChange={setFilterState}
                  options={['All', ...statesList]}
                />
              </div>

              <div className="w-full sm:w-36">
                <CustomSelect
                  value={filterPlan}
                  onChange={setFilterPlan}
                  options={['All', 'elite', 'premium', 'basic']}
                />
              </div>

              <div className="w-full sm:w-36">
                <CustomSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={['All', 'active', 'waitlisted', 'refund_requested', 'refunded']}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#FFE1EB] p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">College / State</th>
                      <th className="pb-3">Plan</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2.5">
                            <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">
                          {u.university} ({u.state || 'Delhi NCR'})
                        </td>
                        <td className="py-3">
                          <span className="uppercase text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {u.plan}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {u.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              title="Inspect Full A-Z Profile & Choices"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Inspect A-Z</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 4: LIVE ROUNDS & SCHEDULE CONTROL ('rounds')
           ═══════════════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 4: LIVE ROUNDS & STATE AUTOMATION CONTROL ('rounds')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'rounds' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Flame className="w-6 h-6 text-[#FF2E79]" />
                  <span>Live Rounds & State Toggles</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Automated 2-Day (48h) round lifecycle, 10-day state rotation schedules, and per-state ON/OFF toggles.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRunMatchEngine}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>Run Match Engine</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdvancePhase}
                  className="px-3.5 py-2 bg-[#FF2E79] hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Advance Phase</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartNextRound}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rotate State</span>
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                ROUND TIMING & LIFECYCLE ALTERATION SUITE
               ═══════════════════════════════════════════════════════════════ */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#FFE1EB] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#FF2E79]" />
                    <span>Round Timing & Lifecycle Alteration Controls</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Alter round timings, extend countdown timers, pause, resume, or skip active rounds. Changes sync live with mobile app & web.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {roundState.isPaused ? (
                    <button
                      type="button"
                      onClick={handleResumeActiveRoundClick}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Active Round</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPauseModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause / Cancel Round</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSkipActiveRoundClick}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <SkipForward className="w-3.5 h-3.5 text-purple-300" />
                    <span>Skip Round</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleManualArchiveClick}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Save Snapshot to Logs</span>
                  </button>
                </div>
              </div>

              {/* Grid: Quick Extension & Timing Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Panel A: Dynamic Countdown & Fast Extension */}
                <div className="p-4 rounded-2xl bg-[#FFF9FA] border border-[#FFE1EB] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#FF2E79]">Active Round Timer</span>
                      <h4 className="text-xs font-bold text-slate-800">
                        {roundState.activeState} • Round #{roundState.roundNumber || 1}
                      </h4>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-pink-50 text-[#FF2E79] border border-pink-200 font-mono text-xs font-black flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-[#FF2E79] animate-spin-slow" />
                      <span>{phaseCountdown.hours}:{phaseCountdown.mins}:{phaseCountdown.secs}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1.5 block">Extend Active Phase Timer (Add Hours):</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[1, 2, 6, 12, 24].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => handleExtendCurrentTimer(hrs)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FF2E79] hover:text-white text-slate-700 text-xs font-black border border-pink-200 transition-colors shadow-2xs cursor-pointer"
                        >
                          +{hrs} Hour{hrs > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Adding hours extends the current phase countdown instantly without resetting participants or matches.
                  </p>
                </div>

                {/* Panel B: Switch Phase Directly */}
                <div className="p-4 rounded-2xl bg-[#FFF9FA] border border-[#FFE1EB] space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF2E79]">Phase Controller</span>
                    <h4 className="text-xs font-bold text-slate-800">Direct Phase Jump</h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.ENTRIES_COLLECTION)}
                      className={`p-2.5 rounded-xl text-center text-xs font-black border transition-all cursor-pointer ${
                        roundState.currentPhase === ROUND_PHASES.ENTRIES_COLLECTION || roundState.currentPhase === 'entries_submission'
                          ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
                          : 'bg-white text-slate-700 border-pink-200 hover:border-[#FF2E79]'
                      }`}
                    >
                      <span className="block text-[10px] opacity-75 uppercase">Phase 1</span>
                      <span>Entries (24h)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.ELITE_MATCHING)}
                      className={`p-2.5 rounded-xl text-center text-xs font-black border transition-all cursor-pointer ${
                        roundState.currentPhase === ROUND_PHASES.ELITE_MATCHING || roundState.currentPhase === 'live_matching'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-slate-700 border-pink-200 hover:border-purple-600'
                      }`}
                    >
                      <span className="block text-[10px] opacity-75 uppercase">Phase 2</span>
                      <span>Elite (16h)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.PREMIUM_MATCHING)}
                      className={`p-2.5 rounded-xl text-center text-xs font-black border transition-all cursor-pointer ${
                        roundState.currentPhase === ROUND_PHASES.PREMIUM_MATCHING
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-pink-200 hover:border-amber-600'
                      }`}
                    >
                      <span className="block text-[10px] opacity-75 uppercase">Phase 3</span>
                      <span>Premium (8h)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchPhaseDirect(ROUND_PHASES.BASIC_SETTLEMENT)}
                      className={`p-2.5 rounded-xl text-center text-xs font-black border transition-all cursor-pointer ${
                        roundState.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-pink-200 hover:border-emerald-600'
                      }`}
                    >
                      <span className="block text-[10px] opacity-75 uppercase">Phase 4</span>
                      <span>Settlement</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Switching phase instantly updates live UI for all users logged in on web & mobile app.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. 2-DAY (48-HOUR) PIPELINED ENGINE LIFECYCLE CARD */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#FFE1EB] shadow-xs space-y-5 text-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#FFE1EB] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-50 text-[#FF2E79] border border-pink-200 text-[10px] font-black uppercase tracking-wider">
                      48-Hour Round Engine
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      Current State: <strong className="text-[#FF2E79] font-black">{roundState.activeState}</strong>
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      (Round #{roundState.roundNumber || 1})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Phase: <strong className="text-slate-900 font-bold">{PHASE_LABELS[roundState.currentPhase]?.title || roundState.currentPhase}</strong> • {PHASE_LABELS[roundState.currentPhase]?.duration || '24h Duration'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentSpeed = localStorage.getItem('cupid_demo_rotation_speed') || 'normal';
                      const newSpeed = currentSpeed === 'fast' ? 'normal' : 'fast';
                      localStorage.setItem('cupid_demo_rotation_speed', newSpeed);
                      alert(newSpeed === 'fast' ? '⚡ Fast Demo Mode Enabled! Rounds advance every 1 minute.' : 'Standard 24h/Day Schedule Enabled.');
                      loadAdminData();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border shadow-xs cursor-pointer ${
                      localStorage.getItem('cupid_demo_rotation_speed') === 'fast'
                        ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{localStorage.getItem('cupid_demo_rotation_speed') === 'fast' ? 'Fast Demo (1 Min/Phase)' : 'Normal 48h Schedule'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Step Lifecycle Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                
                {/* Step 1: Day 1 (0-24h) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  (roundState.currentPhase === ROUND_PHASES.ENTRIES_COLLECTION || roundState.currentPhase === 'entries_submission' || roundState.currentPhase === 'registration')
                    ? 'bg-[#FFF5F8] border-2 border-[#FF2E79] shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF2E79] bg-pink-100/70 px-2 py-0.5 rounded-md">
                      24 Hours
                    </span>
                    <span className="text-xs font-bold text-slate-400">Phase 1</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Entries Collection</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Users submit entries with auto-approval. Candidate profiles are locked on user dashboards until entries close.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-extrabold text-emerald-600">
                      {(roundState.currentPhase === ROUND_PHASES.ENTRIES_COLLECTION || roundState.currentPhase === 'entries_submission' || roundState.currentPhase === 'registration') ? '● Active Now' : 'Completed / Standby'}
                    </span>
                  </div>
                </div>

                {/* Step 2: Elite Matching (16h) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  (roundState.currentPhase === ROUND_PHASES.ELITE_MATCHING || roundState.currentPhase === 'live_matching')
                    ? 'bg-purple-50/80 border-2 border-purple-400 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      16 Hours
                    </span>
                    <span className="text-xs font-bold text-slate-400">Phase 2</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Elite Spotlight (₹449)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Top 5 Elite males sent to females (pick up to 2). Males get notified and decide. Unmatched claim ₹449 refund.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-extrabold text-purple-700">
                      {(roundState.currentPhase === ROUND_PHASES.ELITE_MATCHING || roundState.currentPhase === 'live_matching') ? '● Active' : 'Standby'}
                    </span>
                  </div>
                </div>

                {/* Step 3: Premium Matching (8h) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  (roundState.currentPhase === ROUND_PHASES.PREMIUM_MATCHING)
                    ? 'bg-amber-50/80 border-2 border-amber-400 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      8 Hours
                    </span>
                    <span className="text-xs font-bold text-slate-400">Phase 3</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Premium Window (₹250)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Top 4-7 remaining females sent to Premium males. 8h timer to match or claim 100% refund.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-extrabold text-amber-700">
                      {(roundState.currentPhase === ROUND_PHASES.PREMIUM_MATCHING) ? '● Active' : 'Standby'}
                    </span>
                  </div>
                </div>

                {/* Step 4: Basic Settlement */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  (roundState.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT || roundState.currentPhase === ROUND_PHASES.COMPLETED)
                    ? 'bg-emerald-50/80 border-2 border-emerald-400 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Settlement
                    </span>
                    <span className="text-xs font-bold text-slate-400">Phase 4</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-1">Basic Allocation & Closure</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Remaining pairs matched algorithmically. Unmatched basic notified to upgrade next round. Snapshot archived.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-extrabold text-emerald-700">
                      {(roundState.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT || roundState.currentPhase === ROUND_PHASES.COMPLETED) ? '● Complete' : 'Standby'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Multi-State Concurrent Pipelining Banner */}
              {(() => {
                const pipelined = getPipelinedRoundStatus();
                return (
                  <div className="p-3.5 rounded-2xl bg-[#FFF9FA] border border-[#FFE1EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">Multi-State Concurrent Pipeline Active</p>
                        <p className="text-[11px] text-slate-500">
                          While <strong className="text-slate-800">{pipelined.activeState}</strong> is in Day 2 matching, <strong className="text-slate-800">{pipelined.pipelinedState}</strong> simultaneously opens Day 1 entries {pipelined.pipelinedStateEnabled ? '(Enabled)' : '(Paused by Toggle)'}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        pipelined.pipelinedStateEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {pipelined.pipelinedState}: {pipelined.pipelinedStateEnabled ? 'Pipelined Active' : 'Toggled Off'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 2. STATE ON / OFF TOGGLES GRID (STRICT 10-DAY SCHEDULE PRESERVATION) */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#FFE1EB] shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Power className="w-5 h-5 text-[#FF2E79]" />
                    <span>State Active / Paused Toggles (10-Day Rotation Preservation)</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Toggle individual state rounds ON or OFF. Turning off a state (e.g., Maharashtra or UP) skips that state on its day. 
                    <strong>Other states (e.g. Delhi NCR) NEVER accelerate or come early</strong>; each state strictly preserves its 10-day cycle.
                  </p>
                </div>
                <div className="bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl text-[11px] font-black text-[#FF2E79] shrink-0">
                  Fixed 10-Day Spacing Guaranteed
                </div>
              </div>

              {/* State Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {stateSchedules.map((schedule, idx) => {
                  const isEnabled = isStateEnabled(schedule.state);
                  const isLiveCurrent = schedule.state.toLowerCase() === (roundState.activeState || '').toLowerCase();

                  return (
                    <div
                      key={schedule.state + idx}
                      className={`p-4 rounded-2xl border-2 transition-all relative ${
                        isLiveCurrent
                          ? 'border-emerald-400 bg-emerald-50/20 shadow-xs'
                          : isEnabled
                          ? 'border-slate-200 bg-white hover:border-pink-300'
                          : 'border-slate-200 bg-slate-50/70 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${isLiveCurrent ? 'text-emerald-600' : isEnabled ? 'text-[#FF2E79]' : 'text-slate-400'}`} />
                          <span className="font-black text-slate-900 text-sm">{schedule.state}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Cycle Day {((idx) % 10) + 1}/10
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 mb-3">
                        <p className="flex items-center justify-between">
                          <span className="text-slate-400">Scheduled Date:</span>
                          <strong className="text-slate-800">{schedule.nextRoundDate}</strong>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-slate-400">Cycle Status:</span>
                          <span className={`font-extrabold ${
                            !isEnabled ? 'text-amber-600' : isLiveCurrent ? 'text-emerald-600' : 'text-slate-700'
                          }`}>
                            {!isEnabled ? 'Paused (Day Skipped)' : schedule.status}
                          </span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          !isEnabled ? 'bg-slate-200 text-slate-600' : isLiveCurrent ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isEnabled ? (isLiveCurrent ? '● Live Now' : 'Active') : '○ Disabled'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleState(schedule.state)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isEnabled
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isEnabled ? (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              <span>Round ON</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-500" />
                              <span>Round OFF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. INSTANT LIVE ROUND STATE SWITCHER & SCHEDULE OVERRIDE */}
            <div className="bg-white text-slate-800 rounded-3xl p-5 sm:p-6 border border-[#FFE1EB] shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="w-4 h-4 text-[#FF2E79]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Force Switch Live State (Broadcasts to all mobile devices):
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                      {roundState.activeState} LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Switching the active state updates all registered candidates across the platform immediately and syncs with Supabase.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <div className="w-full sm:w-52">
                    <CustomSelect
                      value={liveStateSelect}
                      onChange={setLiveStateSelect}
                      options={statesList}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleActiveStateChange(liveStateSelect)}
                    className="px-4 py-2 bg-gradient-to-r from-[#FF2E79] to-rose-600 hover:from-rose-500 hover:to-pink-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Switch Live State</span>
                  </button>
                </div>
              </div>

              {/* Schedule Override Form */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manual Date Override (Optional):</span>
                </div>
                <form onSubmit={handleSaveCustomDate} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-48">
                    <CustomSelect
                      value={scheduleStateSelect}
                      onChange={setScheduleStateSelect}
                      options={statesList}
                    />
                  </div>
                  <input
                    type="date"
                    required
                    className="h-10 px-3 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 w-full sm:w-auto"
                    value={customRoundDate}
                    onChange={(e) => setCustomRoundDate(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold w-full sm:w-auto cursor-pointer"
                  >
                    Save Override Date
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW: MATCHES & MANUAL MATCHMAKER ('matches')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'matches' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Heart className="w-6 h-6 text-[#FF2E79] fill-current" />
                  <span>Manual Matchmaker & Platform Pairs</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Super Admin matchmaking override: assign single or multiple candidate profiles to any user, customize compatibility scores, and manage live matches.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3.5 py-1.5 rounded-full bg-[#FFF0F5] text-[#FF2E79] font-black text-xs border border-pink-200">
                  {matchedPairs.length} Active Matched Pairs
                </span>
                <button
                  type="button"
                  onClick={handleRunMatchEngine}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Run Algorithmic Engine
                </button>
              </div>
            </div>

            {/* 1. SUPER ADMIN MANUAL MATCHMAKER WIDGET */}
            {(() => {
              // Calculate compatibility helper
              const calculateAdminCompatibility = (primary, cand) => {
                if (!primary || !cand) return { score: 85, tags: ['Potential Match'] };
                let score = 72;
                const tags = [];

                if (primary.university && cand.university && primary.university.toLowerCase() === cand.university.toLowerCase()) {
                  score += 13;
                  tags.push('Same College');
                }

                if (primary.state && cand.state && primary.state.toLowerCase() === cand.state.toLowerCase()) {
                  score += 9;
                  tags.push('Same City');
                }

                if (primary.gender && cand.gender && primary.gender.toLowerCase() !== cand.gender.toLowerCase()) {
                  score += 4;
                }

                if (cand.plan === 'elite') {
                  score += 5;
                  tags.push('Elite');
                } else if (cand.plan === 'premium') {
                  score += 3;
                }

                if (cand.status === 'active' || cand.verified) {
                  tags.push('Verified');
                }

                return { score: Math.min(99, Math.max(70, score)), tags };
              };

              // Filter User A (Primary candidate)
              const primaryUserPool = users.filter(u => {
                if (!u) return false;
                if (matchmakerUserAFilter === 'elite' && u.plan !== 'elite' && u.plan !== 'premium') return false;
                if (matchmakerUserAFilter === 'male' && (u.gender || '').toLowerCase() !== 'male') return false;
                if (matchmakerUserAFilter === 'female' && (u.gender || '').toLowerCase() !== 'female') return false;
                if (matchmakerUserASearch.trim()) {
                  const q = matchmakerUserASearch.toLowerCase();
                  return (u.name || '').toLowerCase().includes(q) || (u.university || '').toLowerCase().includes(q);
                }
                return true;
              }).sort((a, b) => {
                if (a.plan === 'elite' && b.plan !== 'elite') return -1;
                if (b.plan === 'elite' && a.plan !== 'elite') return 1;
                return (a.name || '').localeCompare(b.name || '');
              });

              // Current selected User A
              const selectedUserAObj = users.find(u => u.id === matchmakerUserA);

              // Auto-rank and filter candidate pool (Step 2)
              const candidatePool = users.filter(u => {
                if (!u) return false;
                if (matchmakerUserA && u.id === matchmakerUserA) return false;
                
                // Case-insensitive gender filter
                if (matchmakerGenderFilter.toLowerCase() !== 'all' && (u.gender || '').toLowerCase() !== matchmakerGenderFilter.toLowerCase()) {
                  return false;
                }

                // Case-insensitive state filter
                if (matchmakerStateFilter.toLowerCase() !== 'all' && (u.state || '').toLowerCase() !== matchmakerStateFilter.toLowerCase()) {
                  return false;
                }

                if (matchmakerSearchQuery.trim()) {
                  const q = matchmakerSearchQuery.toLowerCase();
                  return (u.name || '').toLowerCase().includes(q) || (u.university || '').toLowerCase().includes(q);
                }
                return true;
              }).map(cand => {
                const compat = calculateAdminCompatibility(selectedUserAObj, cand);
                const isAlreadyMatched = selectedUserAObj?.matches?.includes(cand.id);
                return {
                  ...cand,
                  compatScore: compat.score,
                  compatTags: compat.tags,
                  isAlreadyMatched
                };
              }).sort((a, b) => {
                // Highest compatibility first, then Elite
                if (b.compatScore !== a.compatScore) return b.compatScore - a.compatScore;
                if (a.plan === 'elite' && b.plan !== 'elite') return -1;
                if (b.plan === 'elite' && a.plan !== 'elite') return 1;
                return 0;
              });

              return (
                <div className="bg-gradient-to-br from-white via-rose-50/20 to-pink-50/30 rounded-3xl p-5 sm:p-6 border-2 border-pink-200 shadow-sm space-y-6">
                  
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#FF2E79] flex items-center justify-center">
                        <Sparkles className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Super Admin Manual Matchmaker & Recommendation Studio</h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Select a primary profile (Elite/Male/Female), auto-rank compatible partners by preference, and either direct match or send to Explore feed.
                        </p>
                      </div>
                    </div>
                    {matchmakerSelectedTargets.length > 0 && (
                      <span className="px-3.5 py-1 rounded-full bg-[#FF2E79] text-white text-xs font-black shadow-xs animate-pulse">
                        {matchmakerSelectedTargets.length} Candidate(s) Picked
                      </span>
                    )}
                  </div>

                  {/* Feedback Banner */}
                  {matchmakerActionFeedback && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{matchmakerActionFeedback.message}</span>
                      </div>
                      <button onClick={() => setMatchmakerActionFeedback(null)} className="text-emerald-500 hover:text-emerald-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* 2-Column Matchmaker Studio */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* ═══════════════════════════════════════════════════════════
                        COLUMN 1: SELECT PRIMARY CANDIDATE (5 COLS)
                       ═══════════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-5 space-y-3.5 p-4 rounded-2xl bg-white border border-[#FFE1EB] shadow-2xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#FF2E79] bg-pink-50 px-2 py-0.5 rounded-md">
                            Step 1: Primary User
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {selectedUserAObj ? selectedUserAObj.name : 'Choose Candidate A'}
                          </span>
                        </div>

                        {/* User A Quick Filters */}
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: 'elite', label: '👑 Elite First' },
                            { id: 'all', label: 'All' },
                            { id: 'male', label: '👨 Males' },
                            { id: 'female', label: '👩 Females' }
                          ].map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setMatchmakerUserAFilter(f.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer ${
                                matchmakerUserAFilter === f.id
                                  ? 'bg-[#FF2E79] text-white shadow-2xs'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>

                        {/* Search Input for User A */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter user by name, campus..."
                            value={matchmakerUserASearch}
                            onChange={(e) => setMatchmakerUserASearch(e.target.value)}
                            className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#FF2E79] bg-slate-50/50"
                          />
                        </div>

                        {/* Selectable Primary User Cards List */}
                        <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                          {primaryUserPool.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No users match this filter.</p>
                          ) : (
                            primaryUserPool.map(u => {
                              const isSelected = matchmakerUserA === u.id;
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => {
                                    setMatchmakerUserA(u.id);
                                    setMatchmakerSelectedTargets([]);
                                    // Auto switch candidate pool gender to opposite gender!
                                    if ((u.gender || '').toLowerCase() === 'male') {
                                      setMatchmakerGenderFilter('female');
                                    } else if ((u.gender || '').toLowerCase() === 'female') {
                                      setMatchmakerGenderFilter('male');
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                    isSelected
                                      ? 'bg-rose-50 border-[#FF2E79] ring-2 ring-[#FF2E79]/20 shadow-xs'
                                      : 'bg-white border-slate-100 hover:border-pink-200 hover:bg-slate-50/70'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                      alt=""
                                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-slate-900 truncate">{u.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold capitalize">({u.gender || 'N/A'})</span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 truncate">
                                        {u.university || 'Campus'} • {u.state || 'Delhi NCR'}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase ${
                                      u.plan === 'elite' ? 'bg-purple-100 text-purple-700' :
                                      u.plan === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {u.plan || 'basic'}
                                    </span>
                                    {isSelected && (
                                      <span className="w-5 h-5 rounded-full bg-[#FF2E79] text-white flex items-center justify-center">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Active Selected Card Preview Banner */}
                        {selectedUserAObj && (
                          <div className="p-3 rounded-xl bg-gradient-to-r from-pink-50/80 to-rose-50/60 border border-pink-200 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                              <span>Selected Candidate A:</span>
                              <span className="text-[#FF2E79]">{selectedUserAObj.matches?.length || 0} Existing Matches</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <img src={selectedUserAObj.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[#FF2E79]" />
                              <div className="min-w-0 text-xs">
                                <span className="font-black text-slate-900 truncate block">{selectedUserAObj.name} ({selectedUserAObj.gender})</span>
                                <span className="text-[10px] text-slate-500 truncate block">{selectedUserAObj.university} • {selectedUserAObj.state}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Compatibility Score Slider */}
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700">Custom Match Score:</span>
                            <span className="font-black text-[#FF2E79]">{matchmakerScore}%</span>
                          </div>
                          <input
                            type="range"
                            min="70"
                            max="99"
                            value={matchmakerScore}
                            onChange={(e) => setMatchmakerScore(e.target.value)}
                            className="w-full accent-[#FF2E79] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════════
                        COLUMN 2: SMART RANKED CANDIDATE POOL (7 COLS)
                       ═══════════════════════════════════════════════════════════ */}
                    <div className="lg:col-span-7 space-y-3.5 p-4 rounded-2xl bg-white border border-[#FFE1EB] shadow-2xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                              Step 2: Candidate Pool
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              Ranked by Compatibility ({candidatePool.length} Found)
                            </span>
                          </div>

                          {/* Quick Multi-Select Shortcuts */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (candidatePool.length > 0) {
                                  setMatchmakerSelectedTargets([candidatePool[0].id]);
                                }
                              }}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-pink-50 text-[#FF2E79] hover:bg-pink-100 border border-pink-200 transition-colors cursor-pointer"
                            >
                              ⚡ Pick #1 Match
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const top3 = candidatePool.slice(0, 3).map(c => c.id);
                                setMatchmakerSelectedTargets(top3);
                              }}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                            >
                              ✨ Pick Top 3
                            </button>
                            {matchmakerSelectedTargets.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setMatchmakerSelectedTargets([])}
                                className="text-[10px] font-bold text-rose-500 hover:underline px-1"
                              >
                                Clear ({matchmakerSelectedTargets.length})
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-5 relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search candidate, campus..."
                              value={matchmakerSearchQuery}
                              onChange={(e) => setMatchmakerSearchQuery(e.target.value)}
                              className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#FF2E79] bg-slate-50/50"
                            />
                          </div>

                          {/* Gender Filter Buttons */}
                          <div className="sm:col-span-4 flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-0.5 text-[11px] font-bold">
                            {['all', 'female', 'male'].map(g => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setMatchmakerGenderFilter(g)}
                                className={`flex-1 py-0.5 rounded-lg capitalize transition-colors ${
                                  matchmakerGenderFilter.toLowerCase() === g.toLowerCase()
                                    ? 'bg-white text-[#FF2E79] shadow-2xs font-black' 
                                    : 'text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>

                          {/* State Filter */}
                          <select
                            value={matchmakerStateFilter}
                            onChange={(e) => setMatchmakerStateFilter(e.target.value)}
                            className="sm:col-span-3 h-8 px-2.5 rounded-xl border border-slate-200 text-[11px] font-medium text-slate-700 bg-white focus:outline-none focus:border-[#FF2E79]"
                          >
                            <option value="all">All States</option>
                            <option value="delhi ncr">Delhi NCR</option>
                            <option value="maharashtra">Maharashtra</option>
                            <option value="karnataka">Karnataka</option>
                            <option value="uttar pradesh">Uttar Pradesh</option>
                          </select>
                        </div>

                        {/* Candidates Multi-Select Scrollable List */}
                        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 no-scrollbar">
                          {candidatePool.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-1">
                              <p>No candidates match your current gender/state filters.</p>
                              <p className="text-[11px] text-slate-400">Try switching Gender to "All" or State to "All States".</p>
                            </div>
                          ) : (
                            candidatePool.map(candidate => {
                              const isSelected = matchmakerSelectedTargets.includes(candidate.id);
                              return (
                                <div
                                  key={candidate.id}
                                  onClick={() => handleToggleTargetCandidate(candidate.id)}
                                  className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                    isSelected
                                      ? 'bg-rose-50/80 border-[#FF2E79] shadow-xs'
                                      : 'bg-white border-slate-100 hover:border-pink-200 hover:bg-slate-50/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="text-[#FF2E79] shrink-0">
                                      {isSelected ? (
                                        <CheckSquare className="w-5 h-5 fill-rose-100" />
                                      ) : (
                                        <Square className="w-5 h-5 text-slate-300" />
                                      )}
                                    </div>

                                    <img
                                      src={candidate.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                      alt=""
                                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                    />

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-black text-slate-900 truncate">{candidate.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold capitalize">({candidate.gender || 'N/A'})</span>
                                        {candidate.isAlreadyMatched && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-700">
                                            Matched
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-[10px] text-slate-500 truncate">
                                        {candidate.university || 'College'} • {candidate.state || 'Delhi NCR'}
                                      </p>

                                      {/* Smart Recommendation Tags */}
                                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          🔥 {candidate.compatScore}% Match
                                        </span>
                                        {candidate.compatTags.map((tag, tIdx) => (
                                          <span key={tIdx} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase ${
                                      candidate.plan === 'elite' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                      candidate.plan === 'premium' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {candidate.plan || 'basic'}
                                    </span>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 rounded-full bg-[#FF2E79] text-white text-[9.5px] font-black">
                                        Picked
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ═══════════════════════════════════════════════════════════
                      DUAL DISPATCH ACTION CONTROLS (BOTTOM BAR)
                     ═══════════════════════════════════════════════════════════ */}
                  <div className="p-4 rounded-2xl bg-white border border-[#FFE1EB] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        {matchmakerSelectedTargets.length === 0
                          ? 'Select candidate(s) above to assign or push to dashboard'
                          : `${matchmakerSelectedTargets.length} Profile(s) Selected for ${selectedUserAObj?.name || 'Primary User'}`}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Choose whether to directly unlock mutual match & chat now, or send as top recommendations to the user's phone dashboard.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      {/* ACTION 1: SEND AS RECOMMENDATION TO FEED */}
                      <button
                        type="button"
                        onClick={handleRecommendToFeed}
                        disabled={!matchmakerUserA || matchmakerSelectedTargets.length === 0}
                        className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          !matchmakerUserA || matchmakerSelectedTargets.length === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-indigo-100 active:scale-98'
                        }`}
                        title="Pushes profiles directly into user's Explore feed so they can view and like on their phone"
                      >
                        <Zap className="w-4 h-4 fill-current text-amber-300" />
                        <span>Send to User Dashboard ({matchmakerSelectedTargets.length})</span>
                      </button>

                      {/* ACTION 2: DIRECT MUTUAL MATCH */}
                      <button
                        type="button"
                        onClick={handleAssignManualMatches}
                        disabled={!matchmakerUserA || matchmakerSelectedTargets.length === 0}
                        className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          !matchmakerUserA || matchmakerSelectedTargets.length === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-[#FF2E79] to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-pink-200 active:scale-98'
                        }`}
                        title="Immediately forms mutual match and unlocks chat in both users' profiles"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                        <span>Direct Confirm Mutual Match</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* 2. ACTIVE PLATFORM MATCHES & UNMATCH CONTROLS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Active Platform Matches</h3>
                  <p className="text-xs text-slate-500 font-medium">Mutual matches created by algorithm or admin. You can inspect chats or unmatch any pair.</p>
                </div>
                <span className="text-xs font-extrabold text-slate-500">
                  Showing {matchedPairs.length} mutual connections
                </span>
              </div>

              {matchedPairs.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-[#FFE1EB] text-center text-slate-400 text-xs font-semibold space-y-3">
                  <p>No active matched pairs created yet.</p>
                  <p className="text-slate-400">Use the Super Admin Manual Matchmaker above to assign mutual matches!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matchedPairs.map((pair, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-3 hover:shadow-xs transition-shadow">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#FF2E79]" />
                          <span>{pair.state}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-black border border-emerald-200">
                          {pair.score || 95}% Match
                        </span>
                      </div>

                      {/* Two Candidate Cards */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={pair.userA.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#FF2E79] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{pair.userA.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{pair.userA.plan || 'basic'}</p>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-[#FF2E79] shrink-0">
                          <Heart className="w-4 h-4 fill-current" />
                        </div>

                        <div className="flex items-center gap-2 text-right min-w-0">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{pair.userB.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{pair.userB.plan || 'basic'}</p>
                          </div>
                          <img src={pair.userB.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-purple-400 shrink-0" />
                        </div>
                      </div>

                      {/* Footer: Unmatch Button */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold">Mutual Connection Active</span>
                        <button
                          type="button"
                          onClick={() => handleUnmatchClick(pair.userA.id, pair.userB.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-black transition-colors cursor-pointer"
                        >
                          Unmatch Pair
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW: ROUND LOGS & HISTORICAL ARCHIVES ('logs')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'logs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <span>Round Logs & Historical Archives</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Permanent records for every round: who entered, who was matched, and who was refunded with their UPI details.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleManualArchiveClick}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Capture Current Snapshot Now</span>
                </button>
              </div>
            </div>

            {(() => {
              const activeLog = roundLogs.find(l => l.id === selectedLogId) || roundLogs[0];

              if (!activeLog) {
                return (
                  <div className="bg-white p-12 rounded-3xl border border-[#FFE1EB] text-center space-y-3">
                    <p className="text-slate-400 text-xs font-bold">No round archives generated yet.</p>
                    <button
                      type="button"
                      onClick={handleManualArchiveClick}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                    >
                      Archive Current Active Round
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  {/* Round Archives Selector Bar */}
                  <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#FFE1EB] shadow-2xs flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Archived Rounds:</span>
                      {roundLogs.map(log => (
                        <button
                          key={log.id}
                          type="button"
                          onClick={() => setSelectedLogId(log.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                            (activeLog.id === log.id)
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {log.state} • Round #{log.roundNumber} ({new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLogClick(activeLog.id)}
                      className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Log</span>
                    </button>
                  </div>

                  {/* Summary Metric Cards for Selected Round Archive */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-bold uppercase">Participants</span>
                        <Users className="w-4 h-4 text-[#FF2E79]" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">{activeLog.totalParticipants || activeLog.participants?.length || 0}</h3>
                      <p className="text-[10px] text-slate-400">Entered {activeLog.state}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-bold uppercase">Matches Formed</span>
                        <Heart className="w-4 h-4 text-purple-600 fill-current" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">{activeLog.matchedPairs?.length || 0} Pairs</h3>
                      <p className="text-[10px] text-slate-400">Mutual connections</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-bold uppercase">Refund Records</span>
                        <DollarSign className="w-4 h-4 text-amber-500" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">{activeLog.refundEntries?.length || 0} Users</h3>
                      <p className="text-[10px] text-slate-400">Guaranteed UPI payouts</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[10px] font-bold uppercase">Round Status</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <h3 className="text-base font-black text-emerald-600 capitalize">{activeLog.status || 'Archived'}</h3>
                      <p className="text-[10px] text-slate-400">{new Date(activeLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  {/* Sub-Tabs: Participants | Matches | Refund Entries */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#FFE1EB] shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLogActiveSubTab('participants')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                            logActiveSubTab === 'participants' ? 'bg-[#FF2E79] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          👥 Participants ({activeLog.participants?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogActiveSubTab('matches')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                            logActiveSubTab === 'matches' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          💖 Matched Pairs ({activeLog.matchedPairs?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogActiveSubTab('refunds')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer ${
                            logActiveSubTab === 'refunds' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          💸 Refund Log ({activeLog.refundEntries?.length || 0})
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 italic">
                        {activeLog.notes || 'Archived round summary'}
                      </span>
                    </div>

                    {/* Sub-Tab 1: Participants Entered */}
                    {logActiveSubTab === 'participants' && (
                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs min-w-[650px]">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                              <th className="pb-2.5">Candidate</th>
                              <th className="pb-2.5">Gender</th>
                              <th className="pb-2.5">College & State</th>
                              <th className="pb-2.5">Tier / Plan</th>
                              <th className="pb-2.5">UPI ID</th>
                              <th className="pb-2.5">Payment</th>
                              <th className="pb-2.5 text-right">Match Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(activeLog.participants || []).map((p, pIdx) => (
                              <tr key={p.id || pIdx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 pr-2">
                                  <div className="flex items-center gap-2">
                                    <img src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt="" className="w-7 h-7 rounded-full object-cover" />
                                    <span className="font-bold text-slate-900">{p.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 text-slate-600 font-medium capitalize">{p.gender || 'N/A'}</td>
                                <td className="py-2.5 text-slate-500">{p.college || p.university || 'University'} • {p.state || activeLog.state}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-50 text-purple-700">
                                    {p.plan || 'basic'}
                                  </span>
                                </td>
                                <td className="py-2.5 font-mono text-[11px] text-slate-600">{p.upiId || '—'}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                    Verified
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-bold">
                                  {p.matched ? (
                                    <span className="text-emerald-600">✓ Matched</span>
                                  ) : (
                                    <span className="text-amber-600">Refund Queue</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Sub-Tab 2: Matched Pairs */}
                    {logActiveSubTab === 'matches' && (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(activeLog.matchedPairs || []).map((m, mIdx) => (
                          <div key={mIdx} className="p-3.5 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span>Match #{mIdx + 1}</span>
                              <span className="text-[#FF2E79] font-black">{m.score || 95}% Compatibility</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <img src={m.userA?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt="" className="w-8 h-8 rounded-full object-cover border border-[#FF2E79]" />
                                <div>
                                  <p className="text-xs font-black text-slate-900">{m.userA?.name || 'Candidate A'}</p>
                                  <p className="text-[10px] text-slate-400 uppercase">{m.userA?.plan || 'basic'}</p>
                                </div>
                              </div>
                              <Heart className="w-4 h-4 fill-[#FF2E79] text-[#FF2E79]" />
                              <div className="flex items-center gap-2 text-right">
                                <div>
                                  <p className="text-xs font-black text-slate-900">{m.userB?.name || 'Candidate B'}</p>
                                  <p className="text-[10px] text-slate-400 uppercase">{m.userB?.plan || 'basic'}</p>
                                </div>
                                <img src={m.userB?.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80'} alt="" className="w-8 h-8 rounded-full object-cover border border-purple-400" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sub-Tab 3: Refund Entries with UPI */}
                    {logActiveSubTab === 'refunds' && (
                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs min-w-[650px]">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                              <th className="pb-2.5">Candidate</th>
                              <th className="pb-2.5">Registered UPI ID</th>
                              <th className="pb-2.5">Refund Amount</th>
                              <th className="pb-2.5">Plan Tier</th>
                              <th className="pb-2.5">Reason</th>
                              <th className="pb-2.5 text-right">Payout Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(activeLog.refundEntries || []).map((r, rIdx) => (
                              <tr key={r.id || rIdx} className="hover:bg-amber-50/20">
                                <td className="py-2.5 pr-2 font-bold text-slate-900">{r.userName || 'Candidate'}</td>
                                <td className="py-2.5 font-mono text-[11px] text-slate-700">
                                  <div className="flex items-center gap-1.5">
                                    <span>{r.upiId || 'not-provided@upi'}</span>
                                    {r.upiId && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(r.upiId);
                                          alert(`📋 Copied UPI ID: ${r.upiId}`);
                                        }}
                                        className="text-slate-400 hover:text-[#FF2E79] p-0.5"
                                        title="Copy UPI ID"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 font-black text-slate-900">₹{r.amount || 449}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-50 text-amber-800">
                                    {r.plan || 'elite'}
                                  </span>
                                </td>
                                <td className="py-2.5 text-slate-500 text-[11px]">
                                  {r.refundReason || 'No mutual match found within 48h guarantee'}
                                </td>
                                <td className="py-2.5 text-right">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                    {r.status || 'Refunded'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW: REPORTS & REFUND REQUESTS ('reports')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Refund Requests</h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage refund requests (for unmatched ₹449/₹250 users) and user flags.
              </p>
            </div>

            {refundEligibleUsers.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-[#FFE1EB] text-center text-slate-400 text-xs font-semibold">
                No active refund requests or reported profiles at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {refundEligibleUsers.map(u => (
                  <div key={u.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-sm text-slate-900">{u.name}</p>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                            {u.status === 'refunded' ? 'Refund Processed' : 'Refund Requested'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{u.email} • {u.state} • Plan: <strong className="uppercase">{u.plan}</strong></p>
                        {u.upiId && <p className="text-xs font-bold text-[#FF2E79]">UPI Address: {u.upiId}</p>}
                      </div>
                    </div>

                    {u.status !== 'refunded' && (
                      <button
                        onClick={() => handleApproveRefund(u.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-sm"
                      >
                        Approve Refund ₹{u.plan === 'elite' ? 449 : u.plan === 'premium' ? 250 : 100}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW: ANALYTICS ('analytics')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Analytics & Revenue Breakdown</h1>
              <p className="text-xs text-slate-500 font-medium">Real-time revenue, plan adoption, and regional distribution.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">VIP Elite Plan (₹449)</span>
                <h3 className="text-2xl font-black text-[#FF2E79]">
                  {users.filter(u => u.plan === 'elite').length} Users
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Revenue: ₹{(users.filter(u => u.plan === 'elite').length * 449).toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Premium Plan (₹250)</span>
                <h3 className="text-2xl font-black text-purple-600">
                  {users.filter(u => u.plan === 'premium').length} Users
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Revenue: ₹{(users.filter(u => u.plan === 'premium').length * 250).toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Basic Plan (₹100)</span>
                <h3 className="text-2xl font-black text-blue-600">
                  {users.filter(u => u.plan === 'basic').length} Users
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Revenue: ₹{(users.filter(u => u.plan === 'basic').length * 100).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] space-y-4">
              <h3 className="text-base font-black text-slate-900">State-by-State Entry Breakdown</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {statesList.map(st => {
                  const stateUsersCount = users.filter(u => u.state === st).length;
                  const isActive = st === (roundState.activeState || activeState);
                  return (
                    <div key={st} className={`p-3.5 rounded-xl border ${isActive ? 'border-[#FF2E79] bg-rose-50/40' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{st}</span>
                        {isActive && <span className="px-2 py-0.5 rounded-full bg-[#FF2E79] text-white text-[9px] font-black uppercase">Active</span>}
                      </div>
                      <p className="text-sm font-black text-slate-800 mt-1">{stateUsersCount} Candidate Entries</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW: NOTIFICATIONS BROADCAST ('notifications')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'notifications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Bell className="w-6 h-6 text-[#FF2E79]" />
                  <span>Broadcast Notifications Console</span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Dispatch live status bar alerts & cloud push notifications to all users' phones in real time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Push Engine Active</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-pink-50 text-[#FF2E79] border border-pink-200">
                  <span>Supabase Realtime</span>
                </span>
              </div>
            </div>

            {/* Delivery Feedback Banner */}
            {broadcastFeedback && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fade-in ${
                broadcastFeedback.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{broadcastFeedback.message}</span>
                </div>
                <button 
                  onClick={() => setBroadcastFeedback(null)} 
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Broadcast Creator Card */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Create System Announcement</h3>
                    <p className="text-[11px] text-slate-500">Will appear in users' phone scroll-down notification shade & in-app</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#FF2E79] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    Live Broadcast
                  </span>
                </div>

                {/* Quick Templates */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">Quick Presets:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { title: 'Match Round is LIVE Today! 🔥', msg: 'Round #1 is active in Delhi NCR! Check your top compatible candidate profiles now.' },
                      { title: '⏰ 2 Hours Left to Form Mutual Matches!', msg: 'Voting window closes soon. Like your candidates before time runs out!' },
                      { title: '🎉 New Matches Dispatched!', msg: 'Your mutual matches for this round have been published. Check your chats now!' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const form = document.getElementById('admin-broadcast-form');
                          if (form) {
                            form.title.value = preset.title;
                            form.msg.value = preset.msg;
                          }
                        }}
                        className="px-2.5 py-1 text-[10.5px] font-semibold bg-rose-50/60 hover:bg-rose-100 text-slate-700 rounded-lg border border-rose-100 transition-colors cursor-pointer text-left"
                      >
                        {preset.title.split('!')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <form id="admin-broadcast-form" onSubmit={async (e) => {
                  e.preventDefault();
                  const title = e.target.title.value.trim();
                  const msg = e.target.msg.value.trim();
                  if (!title || !msg) return;

                  setIsBroadcasting(true);
                  setBroadcastFeedback(null);

                  try {
                    const item = await broadcastNotification({ title, message: msg });
                    
                    // Refresh recent broadcasts list
                    try {
                      const updated = JSON.parse(localStorage.getItem('cupid_global_broadcasts') || '[]');
                      setRecentBroadcasts(updated);
                    } catch (err) {}

                    setBroadcastFeedback({
                      type: 'success',
                      message: `Broadcast successfully pushed! Dispatched to Supabase Realtime channel + Cloud Database + All connected user phones.`
                    });

                    e.target.reset();
                  } catch (err) {
                    setBroadcastFeedback({
                      type: 'error',
                      message: `Broadcast dispatch encountered an issue: ${err.message}`
                    });
                  } finally {
                    setIsBroadcasting(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Notification Title</label>
                    <input 
                      name="title" 
                      type="text" 
                      required 
                      placeholder="e.g. Delhi NCR Round is LIVE Today! 🔥" 
                      className="w-full h-10 px-3 border border-slate-200 focus:border-[#FF2E79] focus:ring-1 focus:ring-[#FF2E79] rounded-xl text-xs outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Message Content</label>
                    <textarea 
                      name="msg" 
                      required 
                      rows="3" 
                      placeholder="Enter detailed message to appear in user's phone notification center..." 
                      className="w-full p-3 border border-slate-200 focus:border-[#FF2E79] focus:ring-1 focus:ring-[#FF2E79] rounded-xl text-xs outline-none transition-all" 
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const form = document.getElementById('admin-broadcast-form');
                        const testTitle = form?.title.value.trim() || 'Test Alert: Cupid Rounds';
                        const testMsg = form?.msg.value.trim() || 'This is a test notification to verify your phone status bar alerts.';

                        if (getDeviceNotificationStatus() !== 'granted') {
                          await requestNotificationPermissionUserGesture();
                        }
                        
                        sendDeviceNotification(testTitle, testMsg);
                        setTestAlertSent(true);
                        setTimeout(() => setTestAlertSent(false), 4000);
                      }}
                      className="w-full sm:w-auto px-4 h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#FF2E79]" />
                      <span>{testAlertSent ? '✓ Sent to Your Phone' : 'Test on My Device First'}</span>
                    </button>

                    <button 
                      type="submit" 
                      disabled={isBroadcasting}
                      className="flex-1 w-full h-11 bg-[#FF2E79] hover:bg-rose-600 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      {isBroadcasting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Broadcasting to All Phones...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Broadcast to All Users & Connected Phones</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Status & History Card */}
              <div className="lg:col-span-5 space-y-4">
                {/* Real-time Diagnostics Card */}
                <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Push Delivery Diagnostics
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <span className="text-slate-600 font-medium">OS Status Bar Alerts</span>
                      <span className="font-extrabold text-emerald-600">Active (ServiceWorker)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <span className="text-slate-600 font-medium">Supabase Realtime Channel</span>
                      <span className="font-extrabold text-emerald-600">cupid_global_alerts</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <span className="text-slate-600 font-medium">Cloud Database Sync</span>
                      <span className="font-extrabold text-emerald-600">public.notifications</span>
                    </div>
                  </div>
                </div>

                {/* Recent Broadcasts */}
                <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Recent Broadcast History
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {recentBroadcasts.length} Sent
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                    {recentBroadcasts.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No broadcasts sent yet.</p>
                    ) : (
                      recentBroadcasts.map((b, i) => (
                        <div key={b.id || i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white transition-all space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black text-slate-800 truncate">{b.title}</span>
                            <span className="text-[9.5px] text-slate-400 font-medium shrink-0">
                              {b.timestamp ? new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">{b.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW: CONTENT MANAGEMENT ('content')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'content' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Content & State/College Manager</h1>
              <p className="text-xs text-slate-500 font-medium">Manage active states, colleges, and platform banners.</p>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setActiveNav('settings')} className="px-5 py-3 bg-[#FF2E79] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer">
                Manage Custom States & Colleges
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 5: SETTINGS (STATES & COLLEGES CRUD)
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
              <p className="text-xs text-slate-500 font-medium">Manage participating states and college lists.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* States CRUD */}
              <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] space-y-4">
                <h3 className="text-base font-black text-slate-900">Participating States</h3>
                
                <form onSubmit={handleCreateState} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New State Name"
                    className="flex-1 h-9 px-3 border rounded-xl text-xs"
                    value={newStateName}
                    onChange={(e) => setNewStateName(e.target.value)}
                  />
                  <button type="submit" className="px-3 bg-[#FF2E79] text-white text-xs font-bold rounded-xl">Add</button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                  {statesList.map(s => (
                    <div key={s} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs font-bold">
                      <span>{s}</span>
                      <button onClick={() => handleDeleteStateClick(s)} className="text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colleges CRUD */}
              <div className="bg-white p-5 rounded-2xl border border-[#FFE1EB] space-y-4">
                <h3 className="text-base font-black text-slate-900">Colleges Management</h3>

                <div className="w-full">
                  <CustomSelect
                    value={selectedCollegeState}
                    onChange={setSelectedCollegeState}
                    options={statesList}
                  />
                </div>

                <form onSubmit={handleCreateCollege} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New College Name"
                    className="flex-1 h-9 px-3 border rounded-xl text-xs"
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                  />
                  <button type="submit" className="px-3 bg-[#FF2E79] text-white text-xs font-bold rounded-xl">Add</button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                  {collegesList.map(c => (
                    <div key={c} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs font-bold">
                      <span>{c}</span>
                      <button onClick={() => handleDeleteCollegeClick(c)} className="text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FULL A-Z USER INSPECTION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[9990] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-5 sm:p-7 relative shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Close Modal */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* User Header */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <img
                src={selectedUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-[#FF2E79] shadow-md shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900">{selectedUser.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FF2E79] text-white">
                    {selectedUser.plan || 'basic'} Plan
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {selectedUser.status || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">{selectedUser.email} {selectedUser.phone ? `• ${selectedUser.phone}` : ''}</p>
                <p className="text-xs font-bold text-slate-700">{selectedUser.university} ({selectedUser.state || 'Delhi NCR'}) • {selectedUser.branch || 'CSE'}</p>
              </div>
            </div>

            {/* Payment & Verification Log */}
            <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 space-y-2">
              <h3 className="text-xs font-black uppercase text-[#FF2E79] tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Payment & Verification Status (A-Z)</span>
              </h3>
              {(() => {
                const pSub = paymentSubmissions.find(s => s.userId === selectedUser.id);
                return (
                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong>Payment Status:</strong> {pSub ? pSub.status.toUpperCase() : (selectedUser.paymentVerified ? 'VERIFIED' : 'NO SUBMISSION RECORDED')}</p>
                    {pSub?.utr && <p><strong>UTR Ref ID:</strong> <span className="font-mono text-[#FF2E79] font-bold">{pSub.utr}</span></p>}
                    {selectedUser.upiId && <p><strong>UPI Address for Refund:</strong> <span className="font-bold text-[#FF2E79]">{selectedUser.upiId}</span></p>}
                    {pSub?.screenshotBase64 && (
                      <div className="pt-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Uploaded Screenshot Proof:</p>
                        <img
                          src={pSub.screenshotBase64}
                          alt="Proof"
                          className="w-32 h-32 object-cover rounded-xl border border-slate-300 cursor-pointer hover:opacity-90"
                          onClick={() => setPreviewScreenshot(pSub.screenshotBase64)}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Interactivity & Choice Log: Liked, Rejected, Matched */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Candidate Interactivity & Match Choices (A-Z)</h3>
              
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                {/* Liked Profiles */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                    <Heart className="w-3.5 h-3.5 fill-[#FF2E79] text-[#FF2E79]" />
                    <span>Liked ({((selectedUser.likes || selectedUser.likedProfiles || []).length)})</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {(selectedUser.likes || selectedUser.likedProfiles || []).map(id => {
                      const candidate = users.find(u => u.id === id);
                      return (
                        <div key={id} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <img src={candidate?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span className="truncate">{candidate?.name || id}</span>
                        </div>
                      );
                    })}
                    {(!selectedUser.likes && !selectedUser.likedProfiles?.length) && <p className="text-[10px] text-slate-400 font-medium">No likes recorded</p>}
                  </div>
                </div>

                {/* Rejected / Declined Profiles */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                    <X className="w-3.5 h-3.5 text-red-500" />
                    <span>Rejected ({((selectedUser.dislikes || selectedUser.declinedMatches || []).length)})</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {(selectedUser.dislikes || selectedUser.declinedMatches || []).map(id => {
                      const candidate = users.find(u => u.id === id);
                      return (
                        <div key={id} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <img src={candidate?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span className="truncate">{candidate?.name || id}</span>
                        </div>
                      );
                    })}
                    {(!selectedUser.dislikes && !selectedUser.declinedMatches?.length) && <p className="text-[10px] text-slate-400 font-medium">No rejects recorded</p>}
                  </div>
                </div>

                {/* Matched Pairs */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-[#FF2E79]">
                    <Award className="w-3.5 h-3.5" />
                    <span>Matched ({(selectedUser.matches || []).length})</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {(selectedUser.matches || []).map(id => {
                      const candidate = users.find(u => u.id === id);
                      return (
                        <div key={id} className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF2E79]">
                          <img src={candidate?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span className="truncate">{candidate?.name || id}</span>
                        </div>
                      );
                    })}
                    {(!selectedUser.matches || selectedUser.matches.length === 0) && <p className="text-[10px] text-slate-400 font-medium">No matches active</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Questionnaire & Preferences Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700">
              <h3 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">Questionnaire Answers & Preferences</h3>
              <p><strong>Bio:</strong> {selectedUser.bio || 'Not filled'}</p>
              <p><strong>Qualities:</strong> {(selectedUser.qualities || []).join(', ') || 'Ambitious, Caring, Humorous'}</p>
              <p><strong>Non-Negotiables:</strong> {(selectedUser.nonNegotiables || []).join(', ') || 'Non-Smoker, College Student'}</p>
              <p><strong>Dating Vibe & Personality:</strong> {selectedUser.datingVibe || 'Romantic'} • {selectedUser.personalityType || 'Ambivert'}</p>
              <p><strong>Lifestyle:</strong> {selectedUser.drinkingSmoking || 'Social drinker'}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-[#FF2E79] hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND CONFIRMATION MODAL */}
      {refundModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#FFE1EB] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Process 100% Refund</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Instant UPI Payout Settlement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalUser(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FFF5F8] p-4 rounded-2xl border border-[#FFE1EB] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Candidate:</span>
                <span className="font-black text-slate-900">{refundModalUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Plan / State:</span>
                <span className="font-semibold text-slate-700 uppercase text-[11px]">{refundModalUser.plan} • {refundModalUser.state}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Refund Amount:</span>
                <span className="font-black text-[#FF2E79] text-base">₹{refundModalUser.amount}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#FFE1EB]/60">
                <span className="text-slate-500 font-bold">Recipient UPI ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {refundModalUser.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyUpi(refundModalUser.upiId)}
                    className="p-1 hover:bg-pink-100 text-[#FF2E79] rounded cursor-pointer"
                    title="Copy UPI"
                  >
                    {copiedUpi === refundModalUser.upiId ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  UPI Transaction UTR / Ref ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-TXN-492810398"
                  value={refundTransactionRef}
                  onChange={(e) => setRefundTransactionRef(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#FF2E79]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GPay business"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#FF2E79]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefundConfirm}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirm Refund Sent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT ENTRY MODAL */}
      {rejectModalEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reject Payment Entry</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Revoke participation for invalid payment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalEntry(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-1.5 text-xs">
              <p className="font-black text-slate-900 text-sm">{rejectModalEntry.userName}</p>
              <p className="text-slate-500">{rejectModalEntry.userEmail} • Plan: <strong className="text-slate-800 uppercase">{rejectModalEntry.plan} (₹{rejectModalEntry.amount})</strong></p>
              {rejectModalEntry.upiId && (
                <p className="text-slate-700 font-bold">UPI ID: <span className="font-mono text-[#FF2E79]">{rejectModalEntry.upiId}</span></p>
              )}
              {rejectModalEntry.utr && (
                <p className="text-slate-700 font-bold">UTR: <span className="font-mono">{rejectModalEntry.utr}</span></p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Rejection Reason
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="Payment screenshot or UPI transaction mismatch">Payment screenshot or UPI mismatch</option>
                <option value="Invalid UTR / Reference number provided">Invalid UTR / Reference number</option>
                <option value="Duplicate transaction reference submitted">Duplicate transaction reference</option>
                <option value="Unclear or unreadable screenshot proof">Unclear or unreadable screenshot proof</option>
                <option value="Wrong payment amount transferred">Wrong payment amount transferred</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              Rejecting this entry immediately disables the user from the matching phase and marks their payment as invalid.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalEntry(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRejectPaymentEntry(rejectModalEntry)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 cursor-pointer transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE / CANCEL ACTIVE ROUND MODAL */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Pause / Hold Active Round</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pausing <strong>{roundState.activeState} Round #{roundState.roundNumber || 1}</strong> freezes the countdown timer and displays a pause banner across the website and mobile app.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Pause Reason (Shown to candidates & team):
              </label>
              <input
                type="text"
                placeholder="e.g. Extending submission window due to high candidate demand..."
                value={pauseReasonInput}
                onChange={(e) => setPauseReasonInput(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#FF2E79]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPauseRound}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-200 cursor-pointer transition-all active:scale-95"
              >
                <Pause className="w-4 h-4" />
                <span>Confirm Pause</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR SCREENSHOT PREVIEW */}
      {previewScreenshot && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewScreenshot(null)}
        >
          <img
            src={previewScreenshot}
            alt="Payment Proof Fullscreen"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-white/30"
            onClick={() => setPreviewScreenshot(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
}
