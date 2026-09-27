import React, { useState, useEffect } from 'react';
import { 
  getUsers, 
  saveUsers, 
  getActiveState, 
  setActiveState, 
  createMatch, 
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
  deleteCollege
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
  ROUND_PHASES, 
  PHASE_LABELS 
} from '../utils/roundManager';
import { PLANS_INFO } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
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
  ShieldAlert
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
      if (u.matches && u.matches.length > 0) {
        u.matches.forEach(mId => {
          const pairKey = [u.id, mId].sort().join('_');
          if (!visited.has(pairKey)) {
            visited.add(pairKey);
            const partner = users.find(other => other.id === mId);
            if (partner) {
              matchedPairs.push({
                userA: u,
                userB: partner,
                state: u.state || partner.state || 'Delhi NCR'
              });
            }
          }
        });
      }
    });
    return matchedPairs;
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

  // Sidebar navigation items list (Image 2 exact menu + Refund Queue & State Controls)
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rounds', label: 'Rounds & State Toggles', icon: Flame },
    { id: 'verifications', label: 'Payment Verifications', icon: ShieldCheck, badge: paymentSubmissions.filter(s => s.status === 'pending').length || null, badgeColor: 'bg-rose-500 text-white' },
    { id: 'refunds', label: 'Refund Queue', icon: DollarSign, badge: refundQueue.filter(r => r.status === 'pending').length || null, badgeColor: 'bg-amber-500 text-white' },
    { id: 'users', label: 'Users', icon: Users, badge: stats.totalUsers },
    { id: 'matches', label: 'Matches', icon: Heart, badge: stats.totalMatches },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
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
                { id: 'verifications', label: `Verifications ${stats.pendingPayments ? `(${stats.pendingPayments})` : ''}` },
                { id: 'users', label: 'Users' },
                { id: 'rounds', label: 'Rounds' },
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

            {/* 1. 2-DAY (48-HOUR) PIPELINED ENGINE LIFECYCLE CARD */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FF2E79]/20 text-[#FF2E79] border border-[#FF2E79]/30 text-[10px] font-black uppercase tracking-wider">
                      48-Hour Round Engine
                    </span>
                    <span className="text-sm font-black text-white">
                      Current State: <strong className="text-emerald-400">{roundState.activeState}</strong>
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      (Round #{roundState.roundNumber || 1})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Phase: <strong className="text-white">{PHASE_LABELS[roundState.currentPhase]?.title || roundState.currentPhase}</strong> • {PHASE_LABELS[roundState.currentPhase]?.duration || '24h Duration'}
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
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{localStorage.getItem('cupid_demo_rotation_speed') === 'fast' ? 'Fast Demo (1 Min/Phase)' : 'Normal 48h Schedule'}</span>
                  </button>
                </div>
              </div>

              {/* 3 Step 48-Hour Lifecycle Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                
                {/* Step 1: Day 1 (0-24h) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  (roundState.currentPhase === 'entries_submission' || roundState.currentPhase === 'registration')
                    ? 'bg-[#FF2E79]/10 border-[#FF2E79] shadow-lg shadow-[#FF2E79]/10 ring-1 ring-[#FF2E79]'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md">
                      Day 1 (0 - 24 Hours)
                    </span>
                    <span className="text-xs font-bold text-slate-300">Phase 1</span>
                  </div>
                  <h4 className="text-sm font-black text-white mb-1">Entries & Auto-Approval</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Users submit profiles and payment proofs. Male payments are <strong>Auto-Approved</strong> by default. Admin reviews screenshots to manually revoke fraudulent entries.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-extrabold text-emerald-400">
                      {(roundState.currentPhase === 'entries_submission' || roundState.currentPhase === 'registration') ? '● Active Now' : 'Completed / Standby'}
                    </span>
                  </div>
                </div>

                {/* Step 2: Day 2 (24-48h) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  (roundState.currentPhase === 'live_matching' || roundState.currentPhase === 'browsing_matching')
                    ? 'bg-purple-500/15 border-purple-500 shadow-lg shadow-purple-500/10 ring-1 ring-purple-400'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">
                      Day 2 (24 - 48 Hours)
                    </span>
                    <span className="text-xs font-bold text-slate-300">Phase 2</span>
                  </div>
                  <h4 className="text-sm font-black text-white mb-1">Live Browsing & Matching</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Candidates browse and like. <strong>16-Hour Timer</strong> for Elite, <strong>8-Hour Timer</strong> for Premium users, followed by Basic settlement.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-extrabold text-purple-400">
                      {(roundState.currentPhase === 'live_matching' || roundState.currentPhase === 'browsing_matching') ? '● Matching Live' : 'Pending Day 1'}
                    </span>
                  </div>
                </div>

                {/* Step 3: Hour 48 Settlement */}
                <div className="p-4 rounded-2xl border bg-slate-800/60 border-slate-700/80 text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                      Hour 48.00 Settlement
                    </span>
                    <span className="text-xs font-bold text-slate-300">Settlement</span>
                  </div>
                  <h4 className="text-sm font-black text-white mb-1">Mutual Matches & Refunds</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Matches are finalized instantly. Unmatched users & users who selected 0 candidates are routed to the <strong>Refund Queue</strong> with their UPI IDs for payout.
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Refund Guarantee:</span>
                    <button
                      type="button"
                      onClick={() => setActiveNav('refunds')}
                      className="font-extrabold text-amber-400 hover:underline cursor-pointer"
                    >
                      View Refund Queue →
                    </button>
                  </div>
                </div>

              </div>

              {/* Multi-State Concurrent Pipelining Banner */}
              {(() => {
                const pipelined = getPipelinedRoundStatus();
                return (
                  <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      </div>
                      <div>
                        <p className="font-extrabold text-white">Multi-State Concurrent Pipeline Active</p>
                        <p className="text-[11px] text-slate-400">
                          While <strong>{pipelined.activeState}</strong> is in Day 2 matching, <strong>{pipelined.pipelinedState}</strong> simultaneously opens Day 1 entries {pipelined.pipelinedStateEnabled ? '(Enabled)' : '(Paused by Toggle)'}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        pipelined.pipelinedStateEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
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
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MapPin className="w-4 h-4 text-[#FF2E79]" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Force Switch Live State (Broadcasts to all mobile devices):
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                      {roundState.activeState} LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
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
            VIEW: MATCHES ('matches')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'matches' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Active Platform Matches</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Inspect algorithmic matches created by the 3-tier matching engine across rounds.
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-[#FFF0F5] text-[#FF2E79] font-black text-xs border border-pink-200">
                {matchedPairs.length} Total Pairs
              </span>
            </div>

            {matchedPairs.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-[#FFE1EB] text-center text-slate-400 text-xs font-semibold space-y-3">
                <p>No active matched pairs created yet.</p>
                <button
                  onClick={handleRunMatchEngine}
                  className="px-4 py-2 bg-[#FF2E79] text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Run 3-Tier Match Engine Now
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchedPairs.map((pair, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-[#FFE1EB] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>{pair.state}</span>
                      <span className="text-emerald-600 font-black">Mutual Match</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img src={pair.userA.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-[#FF2E79]" />
                        <div>
                          <p className="text-xs font-black text-slate-900">{pair.userA.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{pair.userA.plan || 'basic'}</p>
                        </div>
                      </div>

                      <Heart className="w-4 h-4 fill-[#FF2E79] text-[#FF2E79] shrink-0" />

                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <p className="text-xs font-black text-slate-900">{pair.userB.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">{pair.userB.plan || 'basic'}</p>
                        </div>
                        <img src={pair.userB.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-pink-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Broadcast Notifications Console</h1>
              <p className="text-xs text-slate-500 font-medium">Send real-time in-app alerts to users in the platform.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#FFE1EB] max-w-xl space-y-4">
              <h3 className="text-sm font-black text-slate-900">Create System Announcement</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const title = e.target.title.value;
                const msg = e.target.msg.value;
                if (!title || !msg) return;
                
                import('../services/notificationManager').then(({ broadcastNotification }) => {
                  broadcastNotification({
                    title: title,
                    message: msg
                  });
                });

                const allUsers = getUsers();
                alert(`Broadcast notification successfully dispatched to all ${allUsers.length} users' phones!`);
                e.target.reset();
              }} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notification Title</label>
                  <input name="title" type="text" required placeholder="e.g. Round 2 Live Today!" className="w-full h-10 px-3 border rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Message Content</label>
                  <textarea name="msg" required rows="3" placeholder="Enter message to broadcast to all users..." className="w-full p-3 border rounded-xl text-xs" />
                </div>
                <button type="submit" className="w-full h-11 bg-[#FF2E79] hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Broadcast to All Users</span>
                </button>
              </form>
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
                className="px-5 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-full cursor-pointer"
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
