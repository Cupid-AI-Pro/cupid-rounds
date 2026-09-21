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
  Eye
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

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 12648,
    totalMatches: 3482,
    newSignups: 892,
    revenue: 124980,
    active: 0,
    waitlisted: 0,
    refunds: 0,
    pendingPayments: 0
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

    const matchCount = allUsers.reduce((acc, curr) => acc + (curr.matches?.length || 0), 0) / 2;
    const refundCount = allUsers.filter(u => u.status === 'refund_requested' || u.refundEligible).length;
    const waitlistedCount = allUsers.filter(u => u.status === 'waitlisted').length;
    const activeCount = allUsers.filter(u => u.status === 'active').length;
    const pendingPayCount = subs.filter(s => s.status === 'pending').length;

    setStats({
      totalUsers: Math.max(12648, allUsers.length),
      totalMatches: Math.max(3482, Math.floor(matchCount)),
      newSignups: 892,
      revenue: 124980,
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

  // Sidebar navigation items list (Image 2 exact menu)
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, badge: stats.totalUsers },
    { id: 'verifications', label: 'Verifications', icon: ShieldCheck, badge: stats.pendingPayments > 0 ? stats.pendingPayments : null, badgeColor: 'bg-rose-500 text-white' },
    { id: 'matches', label: 'Matches', icon: Heart, badge: stats.totalMatches },
    { id: 'rounds', label: 'Live Rounds', icon: Flame },
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
            <p className="font-cursive text-sm text-[#FF2E79] font-bold">Good People Brighter Stories ♡</p>
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
                  <span className="inline-block animate-bounce">👋</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  Here's what's happening on Cupid today.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-cursive text-sm text-[#FF2E79] font-bold hidden md:inline">Good People Brighter Stories ♡</span>
                <div className="bg-white border border-[#FFE1EB] px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-[#FF2E79]" />
                  <span>Sep 21, 2026</span>
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
                    <span>↑ 12%</span>
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
                    <span>↑ 18%</span>
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
                    <span>↑ 6%</span>
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
                  <h3 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">₹1,24,980</h3>
                  <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>↑ 22%</span>
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
                    <p className="text-[10px] sm:text-xs text-slate-400">New users over the last 30 days</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-slate-600">
                    Last 30 days ∨
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
                    <span>Aug 22</span>
                    <span>Aug 29</span>
                    <span>Sep 5</span>
                    <span>Sep 12</span>
                    <span>Sep 19</span>
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
                          strokeDasharray="68, 100"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">12.6K</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold">Users</span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF2E79]" />
                        <span className="text-slate-600">Verified</span>
                        <span className="text-slate-900 font-black ml-auto">68%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-300" />
                        <span className="text-slate-600">Pending</span>
                        <span className="text-slate-900 font-black ml-auto">18%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-200" />
                        <span className="text-slate-600">Unverified</span>
                        <span className="text-slate-900 font-black ml-auto">14%</span>
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
                    {[
                      { title: 'Ananya G. signed up', time: '2 minutes ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
                      { title: 'New match created', time: '8 minutes ago', icon: Heart, iconBg: 'bg-rose-50 text-[#FF2E79]' },
                      { title: 'User reported', time: '15 minutes ago', icon: Flag, iconBg: 'bg-red-50 text-red-600' },
                      { title: 'Rohan K. verified', time: '22 minutes ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
                      { title: 'Payment received ₹249 from Priya S.', time: '28 minutes ago', icon: CreditCard, iconBg: 'bg-emerald-50 text-emerald-600' },
                    ].map((item, idx) => (
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
                      {[
                        { name: 'Sophia M.', age: 22, uni: 'Bennett University', status: 'Verified', statusColor: 'bg-emerald-100 text-emerald-800', time: '2 mins ago', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
                        { name: 'Ananya G.', age: 24, uni: 'Bennett University', status: 'Verified', statusColor: 'bg-emerald-100 text-emerald-800', time: '12 mins ago', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
                        { name: 'Priya S.', age: 21, uni: 'NIET', status: 'Pending', statusColor: 'bg-amber-100 text-amber-800', time: '28 mins ago', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
                        { name: 'Rohit A.', age: 23, uni: 'DTU', status: 'Verified', statusColor: 'bg-emerald-100 text-emerald-800', time: '1 hour ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
                        { name: 'Karan M.', age: 22, uni: 'SRM', status: 'Unverified', statusColor: 'bg-rose-100 text-rose-800', time: '2 hours ago', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
                      ].map((u, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center gap-2">
                              <img src={u.avatar} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0" />
                              <span className="font-bold text-slate-900">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-slate-500 font-medium">
                            {u.age} • {u.uni}
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${u.statusColor}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400 font-medium">{u.time}</td>
                          <td className="py-2.5 text-right">
                            <button className="text-slate-400 hover:text-slate-600 p-1">
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
                      <span className="font-black text-slate-900 text-xs sm:text-sm">Cupid Round #1</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Active</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#FF2E79]" /> Ends in 2 days</p>
                      <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#FF2E79]" /> 842 entries</p>
                    </div>

                    <button
                      onClick={() => setActiveNav('rounds')}
                      className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#FF2E79] hover:bg-rose-600 text-white text-[11px] sm:text-xs font-extrabold shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>View Entries</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Upcoming Round */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Valentine Special</p>
                      <p className="text-[10px] text-slate-400">Starts Feb 10, 2026</p>
                    </div>
                    <button onClick={() => setActiveNav('settings')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer">
                      Schedule
                    </button>
                  </div>
                </div>

                {/* Quick Actions (2x2 grid on mobile) */}
                <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#FFE1EB] shadow-xs space-y-2.5 sm:space-y-3">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                    <span className="text-[#FF2E79]">⚡</span> Quick Actions
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

                    <button onClick={() => setActiveNav('reports')} className="p-2.5 rounded-xl border border-slate-200 hover:border-[#FF2E79] hover:bg-rose-50/40 flex items-center justify-between transition-colors cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <BarChart3 className="w-3.5 h-3.5 text-[#FF2E79] shrink-0" />
                        <span className="truncate">View Reports</span>
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
            VIEW 2: VERIFICATIONS / PAYMENTS QUEUE
           ═══════════════════════════════════════════════════════════════════════ */}
        {(activeNav === 'verifications' || activeNav === 'payments') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Verifications</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Review payment screenshots to activate user accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSubmissions(getPaymentSubmissions())}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#FFE1EB] hover:bg-rose-50 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#FF2E79]" />
                <span>Refresh Queue</span>
              </button>
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
                    className={`bg-white p-5 rounded-2xl space-y-3 border-2 ${
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
                      {sub.utr && (
                        <p className="text-slate-800 font-bold mt-1">Ref ID: <span className="font-mono text-[#FF2E79] font-extrabold">{sub.utr}</span></p>
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
                  </div>
                ))}
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
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete User"
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
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 4: LIVE ROUNDS & SCHEDULE CONTROL ('rounds')
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeNav === 'rounds' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Round Control</h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage 10-day state rotation schedules and advance active phases.
              </p>
            </div>

            {/* PHASE TIMELINE CONTROLLER */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Clock className="w-4 h-4 text-[#FF2E79]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Current Phase: <strong className="text-white font-extrabold">{PHASE_LABELS[roundState.currentPhase]?.title}</strong>
                  </span>
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    {PHASE_LABELS[roundState.currentPhase]?.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {roundState.currentPhase !== ROUND_PHASES.COMPLETED ? (
                    <button
                      type="button"
                      onClick={handleAdvancePhase}
                      className="px-4 py-2 bg-[#FF2E79] hover:bg-rose-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Advance Phase</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartNextRound}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Start Round {(roundState.roundNumber || 1) + 1}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* State Schedule Modification */}
              <form onSubmit={handleSaveCustomDate} className="pt-2 flex flex-col sm:flex-row items-center gap-3">
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
                  className="h-10 px-4 rounded-xl bg-[#FF2E79] text-white text-xs font-bold w-full sm:w-auto"
                >
                  Override Date
                </button>
              </form>
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
