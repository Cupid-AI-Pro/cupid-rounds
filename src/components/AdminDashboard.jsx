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
  advanceRoundPhase, 
  startNextRoundForState, 
  getAllStateSchedules, 
  updateStateScheduleDate,
  ROUND_PHASES, 
  PHASE_LABELS 
} from '../utils/roundManager';
import { PLANS_INFO } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { 
  ShieldCheck, 
  Users, 
  Heart, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Award, 
  Trash2,
  Calendar,
  RefreshCw,
  Clock,
  AlertTriangle,
  Play,
  Building2,
  MapPin,
  Plus,
  Edit3,
  Search,
  LogOut,
  Maximize2,
  Lock,
  Mail,
  Eye,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CupidLogo from './CupidLogo';
import CustomSelect from './CustomSelect';

export default function AdminDashboard({ activeState, onStateChange }) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard Data States
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roundState, setRoundState] = useState(getRoundState());
  const [stateSchedules, setStateSchedules] = useState(getAllStateSchedules());
  
  // Custom States & Colleges Management
  const [statesList, setStatesList] = useState(getStatesList());
  const [editingState, setEditingState] = useState(null); // { oldName, newName }
  const [newStateName, setNewStateName] = useState('');

  const [selectedCollegeState, setSelectedCollegeState] = useState(activeState || 'Delhi NCR');
  const [collegesList, setCollegesList] = useState(getCollegesByState(activeState || 'Delhi NCR'));
  const [editingCollege, setEditingCollege] = useState(null); // { oldName, newName }
  const [newCollegeName, setNewCollegeName] = useState('');

  // Schedule Modification
  const [scheduleStateSelect, setScheduleStateSelect] = useState(activeState || 'Delhi NCR');
  const [customRoundDate, setCustomRoundDate] = useState('');
  const [customRoundNum, setCustomRoundNum] = useState('1');

  // Filters & Tabs
  const [filterState, setFilterState] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Admin Sub-Tab
  const [adminTab, setAdminTab] = useState('payments'); // 'payments' | 'states' | 'colleges' | 'schedule' | 'matched' | 'refunds' | 'directory'

  // Payment Submissions & Lightbox
  const [paymentSubmissions, setPaymentSubmissions] = useState([]);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    waitlisted: 0,
    matches: 0,
    refunds: 0,
    pendingPayments: 0,
    eliteCount: 0,
    premiumCount: 0,
    basicCount: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, activeState]);

  useEffect(() => {
    setCollegesList(getCollegesByState(selectedCollegeState));
  }, [selectedCollegeState]);

  const loadAdminData = async () => {
    let allUsers = getUsers();

    // If Supabase is connected, fetch live registered profiles from database
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

    setUsers(allUsers);
    const currentRound = getRoundState();
    setRoundState(currentRound);
    setStateSchedules(getAllStateSchedules());
    setStatesList(getStatesList());
    
    const subs = getPaymentSubmissions();
    setPaymentSubmissions(subs);

    // Calculate stats
    const matchCount = allUsers.reduce((acc, curr) => acc + (curr.matches?.length || 0), 0) / 2;
    const refundCount = allUsers.filter(u => u.status === 'refund_requested' || u.refundEligible).length;
    const waitlistedCount = allUsers.filter(u => u.status === 'waitlisted').length;
    const activeCount = allUsers.filter(u => u.status === 'active').length;
    const pendingPayCount = subs.filter(s => s.status === 'pending').length;

    const eliteCount = allUsers.filter(u => u.plan === 'elite' && u.state === activeState).length;
    const premiumCount = allUsers.filter(u => u.plan === 'premium' && u.state === activeState).length;
    const basicCount = allUsers.filter(u => u.plan === 'basic' && u.state === activeState).length;

    setStats({
      total: allUsers.length,
      active: activeCount,
      waitlisted: waitlistedCount,
      matches: Math.floor(matchCount),
      refunds: refundCount,
      pendingPayments: pendingPayCount,
      eliteCount,
      premiumCount,
      basicCount
    });

    if (selectedUser) {
      const refreshed = allUsers.find(u => u.id === selectedUser.id);
      setSelectedUser(refreshed || null);
    }
  };

  // Login handler with exact credentials
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
  };

  // State selection change
  const handleActiveStateChange = (newState) => {
    setActiveState(newState);
    const current = getRoundState();
    const updated = { ...current, activeState: newState };
    saveRoundState(updated);
    setRoundState(updated);
    onStateChange(newState);
    loadAdminData();
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
    alert(`Round date for ${scheduleStateSelect} updated to ${customRoundDate}`);
  };

  // Phase transition & Next round
  const handleAdvancePhase = () => {
    const updated = advanceRoundPhase();
    setRoundState(updated);
    loadAdminData();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
  };

  const handleStartNextRound = () => {
    if (confirm(`Start Next Round for ${activeState}?`)) {
      const updated = startNextRoundForState(activeState);
      setRoundState(updated);
      loadAdminData();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    }
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

  // Refund approval
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

  // Delete user
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

  // Filtered users
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ADMIN LOGIN VIEW (GATED BY EXACT CREDENTIALS)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel p-6 sm:p-8 space-y-6 border border-white shadow-xl rounded-3xl bg-white/95">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-[#FF2E79]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight">Admin Console</h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter admin login credentials to access state, college, round, payment screenshot, and refund management.
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
              <label className="form-label">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  className="form-input form-input-icon"
                  placeholder="cupid.livepro@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  className="form-input form-input-icon"
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. MAIN ADMIN DASHBOARD VIEW (AUTHENTICATED)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-7xl px-2 py-4 md:px-4 space-y-6 select-none">
      
      {/* TOP HEADER PANEL */}
      <div className="glass-panel p-4 sm:p-6 space-y-4 border border-white shadow-md bg-white/95">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CupidLogo size="md" textColor="dark" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  Matchmaker Admin Dashboard
                </h1>
                <span className="bg-[#FF2E79] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Round {roundState.roundNumber || 1}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                States, Colleges, Round Dates, Payment Screenshot Verification, Matched Users & Refund Operations
              </p>
            </div>
          </div>

          {/* Active State Selector & Logout */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 shrink-0">Active Round State:</span>
              <div className="w-40 sm:w-48">
                <CustomSelect
                  value={activeState}
                  onChange={handleActiveStateChange}
                  options={statesList}
                  activeMatchValue={activeState}
                  activeBadgeText="Active"
                />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
              title="Logout of Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* PHASE STEPPER & TIMELINE CONTROLLER */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-[#FF2E79]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Current Phase: <strong className="text-white font-extrabold">{PHASE_LABELS[roundState.currentPhase]?.title}</strong>
              </span>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {PHASE_LABELS[roundState.currentPhase]?.duration}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {roundState.currentPhase !== ROUND_PHASES.COMPLETED ? (
                <button
                  type="button"
                  onClick={handleAdvancePhase}
                  className="px-4 py-1.5 bg-[#FF2E79] hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Advance Phase</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartNextRound}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start Round {(roundState.roundNumber || 1) + 1}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-[10px] pt-1">
            {[
              { id: ROUND_PHASES.REGISTRATION, label: '1. Registration (24h)' },
              { id: ROUND_PHASES.ELITE_WINDOW, label: '2. Elite Spotlight (16h)' },
              { id: ROUND_PHASES.PREMIUM_WINDOW, label: '3. Premium Browsing (8h)' },
              { id: ROUND_PHASES.BASIC_SETTLEMENT, label: '4. Basic Allocation' },
              { id: ROUND_PHASES.COMPLETED, label: '5. Round Complete' }
            ].map((p, idx) => {
              const isCurrent = roundState.currentPhase === p.id;
              const isPassed = phaseStep > idx + 1;
              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#FF2E79] border-[#FF2E79] text-white font-black shadow-md'
                      : isPassed
                      ? 'bg-slate-800/80 border-emerald-500/40 text-emerald-400 font-bold'
                      : 'bg-slate-800/40 border-slate-800 text-slate-500 font-semibold'
                  }`}
                >
                  <span className="block truncate">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STATS TILES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-slate-600 bg-slate-100' },
          { label: 'Pending Payments', value: stats.pendingPayments, icon: CheckCircle2, color: 'text-amber-600 bg-amber-50' },
          { label: 'Matched Couples', value: stats.matches, icon: Heart, color: 'text-rose-600 bg-rose-50' },
          { label: 'Elite Users', value: stats.eliteCount, icon: Award, color: 'text-amber-500 bg-amber-50' },
          { label: 'Premium Users', value: stats.premiumCount, icon: Heart, color: 'text-pink-500 bg-pink-50' },
          { label: 'Refund Requests', value: stats.refunds, icon: DollarSign, color: 'text-red-600 bg-red-50' },
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-3.5 flex items-center gap-3 bg-white/95 border-white">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">{s.label}</span>
              <span className="text-base font-black text-slate-900 leading-none">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION TABS FOR ADMIN MODULES */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'payments', label: `Payment Checks (${stats.pendingPayments})`, icon: CheckCircle2 },
          { id: 'states', label: `States (${statesList.length})`, icon: MapPin },
          { id: 'colleges', label: `Colleges (${collegesList.length})`, icon: Building2 },
          { id: 'schedule', label: 'Round Dates', icon: Calendar },
          { id: 'matched', label: `Matched People (${matchedPairs.length})`, icon: Heart },
          { id: 'refunds', label: `Refund Requests (${refundEligibleUsers.length})`, icon: DollarSign },
          { id: 'directory', label: `User Directory (${filteredUsers.length})`, icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              adminTab === tab.id
                ? 'bg-[#FF2E79] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-rose-50/60 border border-slate-200/80'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: PAYMENT SCREENSHOT CHECKS
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Payment Verification Queue</h2>
              <p className="text-xs text-slate-500">Review submitted payment screenshots and UTR numbers to activate accounts.</p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSubmissions(getPaymentSubmissions())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {paymentSubmissions.length === 0 ? (
            <div className="glass-panel p-10 text-center text-slate-400 text-xs font-semibold bg-white/90">
              No payment submissions recorded yet. Submissions with payment screenshots will appear here.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {[...paymentSubmissions].reverse().map((sub, i) => (
                <div
                  key={sub.userId + i}
                  className={`glass-panel p-4 space-y-3 border-2 bg-white/95 ${
                    sub.status === 'approved' ? 'border-emerald-200' :
                    sub.status === 'rejected' ? 'border-red-200' :
                    'border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.status === 'approved' ? 'Approved' : sub.status === 'rejected' ? 'Rejected' : 'Pending Verification'}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase">{sub.plan} Plan • ₹{sub.amount}</span>
                  </div>

                  <div className="text-xs space-y-0.5 text-slate-700">
                    <p className="font-black text-slate-900 text-sm">{sub.userName}</p>
                    <p className="text-slate-500">{sub.userEmail} {sub.userPhone ? `| ${sub.userPhone}` : ''}</p>
                    <p className="text-slate-500">State: <strong className="text-slate-800">{sub.userState}</strong></p>
                    <p className="text-slate-800 font-bold mt-1">UTR: <span className="font-mono text-[#FF2E79] font-extrabold">{sub.utr}</span></p>
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

                  {sub.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleApprovePayment(sub)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Activate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectPayment(sub)}
                        className="flex-1 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {sub.status === 'approved' && (
                    <p className="text-[11px] text-emerald-700 font-bold text-center pt-1">
                      Approved and user account activated
                    </p>
                  )}
                  {sub.status === 'rejected' && (
                    <p className="text-[11px] text-red-600 font-bold text-center pt-1">
                      Rejected
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
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
            <XCircle className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: STATES MANAGEMENT
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'states' && (
        <div className="glass-panel p-5 space-y-6 bg-white/95 border-white">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">States Management</h3>
            <p className="text-xs text-slate-500">Add, rename, or delete states participating in the 10-day cyclic round schedule.</p>
          </div>

          <form onSubmit={handleCreateState} className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <input
              type="text"
              required
              className="form-input text-xs flex-1"
              placeholder="Enter new state name (e.g., Gujarat, West Bengal)"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add State</span>
            </button>
          </form>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {statesList.map((st) => {
              const isActive = st === activeState;
              const isEditing = editingState?.oldName === st;

              return (
                <div
                  key={st}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                    isActive ? 'border-[#FF2E79] bg-rose-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        className="form-input text-xs py-1 h-8"
                        value={editingState.newName}
                        onChange={(e) => setEditingState({ ...editingState, newName: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveStateEdit(st)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-800">{st}</h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FF2E79] text-white text-[9px] font-black uppercase">Active</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => handleActiveStateChange(st)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingState({ oldName: st, newName: st })}
                          className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStateClick(st)}
                          className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: COLLEGES MANAGEMENT
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'colleges' && (
        <div className="glass-panel p-5 space-y-6 bg-white/95 border-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Colleges Directory</h3>
              <p className="text-xs text-slate-500">Manage university and college options for each state in onboarding.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-600 shrink-0">Select State:</span>
              <select
                className="form-input text-xs w-48"
                value={selectedCollegeState}
                onChange={(e) => setSelectedCollegeState(e.target.value)}
              >
                {statesList.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>

          <form onSubmit={handleCreateCollege} className="flex flex-col sm:flex-row gap-2 max-w-lg">
            <input
              type="text"
              required
              className="form-input text-xs flex-1"
              placeholder={`Add new college for ${selectedCollegeState}`}
              value={newCollegeName}
              onChange={(e) => setNewCollegeName(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add College</span>
            </button>
          </form>

          {collegesList.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-semibold">No colleges added for {selectedCollegeState} yet.</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {collegesList.map((col) => {
                const isEditing = editingCollege?.oldName === col;
                return (
                  <div key={col} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          className="form-input text-xs py-1 h-8"
                          value={editingCollege.newName}
                          onChange={(e) => setEditingCollege({ ...editingCollege, newName: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCollegeEdit(col)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate">{col}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingCollege({ oldName: col, newName: col })}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCollegeClick(col)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: ROUND DATE & SCHEDULE MODIFY
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'schedule' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 space-y-4 bg-white/95 border-white">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Modify State Round Date & Timer</h3>
              <p className="text-xs text-slate-500">Pick custom launch dates and round numbers for any state in rotation.</p>
            </div>

            <form onSubmit={handleSaveCustomDate} className="grid sm:grid-cols-3 gap-3 items-end max-w-3xl">
              <div>
                <label className="form-label">Select State</label>
                <select
                  className="form-input text-xs"
                  value={scheduleStateSelect}
                  onChange={(e) => setScheduleStateSelect(e.target.value)}
                >
                  {statesList.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Round Launch Date</label>
                <input
                  type="date"
                  required
                  className="form-input text-xs"
                  value={customRoundDate}
                  onChange={(e) => setCustomRoundDate(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Update Round Date</span>
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel p-5 space-y-4 bg-white/95 border-white">
            <h4 className="text-sm font-extrabold text-slate-900">Full 10-Day Rotation Schedule Overview</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {stateSchedules.map((item) => (
                <div
                  key={item.state}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    item.isToday
                      ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-md'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                      item.isToday ? 'text-rose-100' : 'text-slate-400'
                    }`}>
                      {item.isToday ? 'LIVE TODAY' : `In ${item.daysLeft} Day(s)`}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs truncate">{item.state}</h4>
                  <p className={`text-[11px] mt-1 font-semibold ${
                    item.isToday ? 'text-white' : 'text-slate-500'
                  }`}>
                    Round {item.roundNumber} | {item.nextRoundDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 5: PEOPLE WHO GOT MATCHED
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'matched' && (
        <div className="glass-panel p-5 space-y-4 bg-white/95 border-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">People Who Got Matched</h3>
              <p className="text-xs text-slate-500">Live matched couples with profile details and Instagram contact information.</p>
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-100 text-[#FF2E79] text-xs font-black">
              {matchedPairs.length} Matched Couple(s)
            </span>
          </div>

          {matchedPairs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              No mutual matches confirmed yet in the system.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {matchedPairs.map((pair, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Matched Couple #{idx + 1}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{pair.state}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center">
                    {/* User A */}
                    <div className="space-y-1 text-center sm:text-left">
                      <img
                        src={pair.userA.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={pair.userA.name}
                        className="w-14 h-14 rounded-full object-cover mx-auto sm:mx-0 border-2 border-white shadow-xs"
                      />
                      <p className="font-extrabold text-xs text-slate-900 leading-tight">{pair.userA.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{pair.userA.gender} • {pair.userA.university || 'College'}</p>
                      <p className="text-[10px] font-mono text-[#FF2E79] font-bold truncate">{pair.userA.contact || pair.userA.instagramId || '@user'}</p>
                    </div>

                    {/* User B */}
                    <div className="space-y-1 text-center sm:text-left">
                      <img
                        src={pair.userB.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                        alt={pair.userB.name}
                        className="w-14 h-14 rounded-full object-cover mx-auto sm:mx-0 border-2 border-white shadow-xs"
                      />
                      <p className="font-extrabold text-xs text-slate-900 leading-tight">{pair.userB.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{pair.userB.gender} • {pair.userB.university || 'College'}</p>
                      <p className="text-[10px] font-mono text-[#FF2E79] font-bold truncate">{pair.userB.contact || pair.userB.instagramId || '@user'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 6: PEOPLE WHO ASKED FOR REFUND
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'refunds' && (
        <div className="glass-panel p-5 space-y-4 bg-white/95 border-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">People Who Asked for Refund</h3>
              <p className="text-xs text-slate-500">100% money-back guarantee for Elite (₹450) and Premium (₹250) tier users without mutual matches.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black">
              {refundEligibleUsers.length} Refund Case(s)
            </span>
          </div>

          {refundEligibleUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-semibold">
              No active refund requests found in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-extrabold">
                    <th className="pb-2">User Name</th>
                    <th className="pb-2">Plan</th>
                    <th className="pb-2">State</th>
                    <th className="pb-2">Refund Amount</th>
                    <th className="pb-2">UPI ID / Phone</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundEligibleUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-800">{u.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          u.plan === 'elite' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{u.state}</td>
                      <td className="py-3 font-extrabold text-[#FF2E79]">
                        ₹{u.plan === 'elite' ? 450 : 250}
                      </td>
                      <td className="py-3 text-slate-600 font-mono text-[11px]">
                        {u.upiId || u.phone || u.email || 'UPI_Auto'}
                      </td>
                      <td className="py-3">
                        {u.status === 'refunded' ? (
                          <span className="text-emerald-700 font-bold text-[10px]">Refunded ({u.refundTxnId || 'PAID'})</span>
                        ) : (
                          <span className="text-amber-700 font-bold text-[10px]">Pending Approval</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {u.status !== 'refunded' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveRefund(u.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-[10px] cursor-pointer transition-all shadow-xs"
                          >
                            Approve Refund ₹{u.plan === 'elite' ? 450 : 250}
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold text-[10px]">Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 7: USER DIRECTORY
         ═══════════════════════════════════════════════════════════════════════ */}
      {adminTab === 'directory' && (
        <div className="glass-panel p-5 space-y-4 bg-white/95 border-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Registered Users Directory</h3>
              <p className="text-xs text-slate-500">Live profiles registered across state rounds.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm("Clear local demo data to reset user directory?")) {
                  clearAllData();
                  loadAdminData();
                }
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-[#FF2E79] text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            >
              Clear Local Demo Data
            </button>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="col-span-2 sm:col-span-1">
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="form-input pl-8 text-xs h-9"
                  placeholder="Name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">State</label>
              <select className="form-input text-xs h-9" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                <option value="All">All States</option>
                {statesList.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label">Plan</label>
              <select className="form-input text-xs h-9" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
                <option value="All">All Plans</option>
                <option value="elite">Elite (₹450)</option>
                <option value="premium">Premium (₹250)</option>
                <option value="basic">Basic (₹100)</option>
                <option value="free">Female (Free)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Gender</label>
              <select className="form-input text-xs h-9" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                <option value="All">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select className="form-input text-xs h-9" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="waitlisted">Waitlisted</option>
                <option value="refund_requested">Refund Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-200">
                <tr className="text-slate-400 text-[10px] uppercase font-extrabold">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Gender</th>
                  <th className="pb-2">State</th>
                  <th className="pb-2">College</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Matches</th>
                  <th className="pb-2 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-800">{u.name}</td>
                    <td className="py-2.5 capitalize text-slate-600">{u.gender}</td>
                    <td className="py-2.5 text-slate-600">{u.state}</td>
                    <td className="py-2.5 text-slate-600 truncate max-w-[140px]">{u.university || 'N/A'}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                        {u.plan || 'Free'}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-[#FF2E79]">
                      {u.matches?.length || 0} match(es)
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
