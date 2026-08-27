import React, { useState, useEffect } from 'react';
import { 
  getUsers, 
  saveUsers, 
  getActiveState, 
  setActiveState, 
  createMatch, 
  suggestMatch, 
  updateUser,
  clearAllData
} from '../utils/storage';
import { 
  getRoundState, 
  saveRoundState, 
  advanceRoundPhase, 
  startNextRoundForState, 
  getAllStateSchedules, 
  ROUND_PHASES, 
  PHASE_LABELS 
} from '../utils/roundManager';
import { STATES_LIST, PLANS_INFO } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { 
  ShieldCheck, 
  Users, 
  Heart, 
  Hourglass, 
  DollarSign, 
  Send, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Award, 
  Trash2,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CupidLogo from './CupidLogo';
import CustomSelect from './CustomSelect';

export default function AdminDashboard({ activeState, onStateChange }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roundState, setRoundState] = useState(getRoundState());
  const [stateSchedules, setStateSchedules] = useState(getAllStateSchedules());
  
  // Filters
  const [filterState, setFilterState] = useState('All');
  const [filterPlan, setFilterPlan] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Active Admin Sub-Tab
  const [adminTab, setAdminTab] = useState('pipeline'); // 'pipeline' | 'refunds' | 'directory' | 'schedule'

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    waitlisted: 0,
    matches: 0,
    refunds: 0,
    eliteCount: 0,
    premiumCount: 0,
    basicCount: 0
  });

  useEffect(() => {
    loadAdminData();
  }, [activeState]);

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
            matches: [],
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
    
    // Calculate stats
    const matchCount = allUsers.reduce((acc, curr) => acc + (curr.matches?.length || 0), 0) / 2;
    const refundCount = allUsers.filter(u => u.status === 'refund_requested' || u.refundEligible).length;
    const waitlistedCount = allUsers.filter(u => u.status === 'waitlisted').length;
    const activeCount = allUsers.filter(u => u.status === 'active').length;
    const eliteCount = allUsers.filter(u => u.plan === 'elite' && u.state === activeState).length;
    const premiumCount = allUsers.filter(u => u.plan === 'premium' && u.state === activeState).length;
    const basicCount = allUsers.filter(u => u.plan === 'basic' && u.state === activeState).length;

    setStats({
      total: allUsers.length,
      active: activeCount,
      waitlisted: waitlistedCount,
      matches: Math.floor(matchCount),
      refunds: refundCount,
      eliteCount,
      premiumCount,
      basicCount
    });

    if (selectedUser) {
      const refreshed = allUsers.find(u => u.id === selectedUser.id);
      setSelectedUser(refreshed || null);
    }
  };

  // Change active state round
  const handleActiveStateChange = (newState) => {
    setActiveState(newState);
    const current = getRoundState();
    const updated = { ...current, activeState: newState };
    saveRoundState(updated);
    setRoundState(updated);
    onStateChange(newState);
    loadAdminData();
  };

  // Advance Phase button handler
  const handleAdvancePhase = () => {
    const updated = advanceRoundPhase();
    setRoundState(updated);
    loadAdminData();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  // Start Next Round (Round 2, 3, etc.)
  const handleStartNextRound = () => {
    if (confirm(`Start Next Round (Round ${(roundState.roundNumber || 1) + 1}) for ${activeState}?`)) {
      const updated = startNextRoundForState(activeState);
      setRoundState(updated);
      loadAdminData();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  };

  // Manual Matching for Basic Users
  const handleManualMatch = (targetUser) => {
    if (!selectedUser || !targetUser) return;
    
    const success = createMatch(selectedUser.id, targetUser.id);
    if (success) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      loadAdminData();
    }
  };

  // Refund Actions
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

  // Delete account helper
  const handleDeleteUser = (uId) => {
    if (confirm("Are you sure you want to delete this account?")) {
      const allUsers = getUsers();
      const updated = allUsers.filter(u => u.id !== uId);
      saveUsers(updated);
      setSelectedUser(null);
      loadAdminData();
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const stateMatches = filterState === 'All' || u.state === filterState;
    const planMatches = filterPlan === 'All' || u.plan === filterPlan;
    const genderMatches = filterGender === 'All' || u.gender === filterGender;
    const statusMatches = filterStatus === 'All' || u.status === filterStatus;
    return stateMatches && planMatches && genderMatches && statusMatches;
  });

  const refundEligibleUsers = users.filter(u => 
    u.status === 'refund_requested' || 
    u.refundEligible === true || 
    u.status === 'refunded'
  );

  const phaseStep = PHASE_LABELS[roundState.currentPhase]?.step || 1;

  return (
    <div className="mx-auto max-w-7xl px-2 py-4 md:px-4 relative z-10 space-y-6 select-none">
      
      {/* HEADER SECTION: Active Round Selector & Live Controls */}
      <div className="glass-panel p-5 space-y-4 border border-white/80 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CupidLogo size="md" textColor="dark" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-display">
                  Admin Matchmaker Control
                </h1>
                <span className="bg-[#FF2D55] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Round {roundState.roundNumber || 1}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                10-Day Cyclic Round Scheduling, Waterfall Matchmaking & Refund Engine
              </p>
            </div>
          </div>

          {/* State Selector */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-600 shrink-0">Active State:</span>
            <div className="w-48">
              <CustomSelect
                value={activeState}
                onChange={handleActiveStateChange}
                options={STATES_LIST}
                activeMatchValue={activeState}
                activeBadgeText="Active"
              />
            </div>
          </div>
        </div>

        {/* ROUND PHASE STEPPER & TIMELINE CONTROLLER */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF2D55] animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Current Phase: <strong className="text-white font-extrabold">{PHASE_LABELS[roundState.currentPhase]?.title}</strong>
              </span>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {PHASE_LABELS[roundState.currentPhase]?.duration}
              </span>
            </div>

            {/* Fast-forward Simulator Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {roundState.currentPhase !== ROUND_PHASES.COMPLETED ? (
                <button
                  type="button"
                  onClick={handleAdvancePhase}
                  className="px-4 py-1.5 bg-[#FF2D55] hover:bg-[#e02447] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/40 cursor-pointer active:scale-95"
                  title="Advance to next phase of matchmaking"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Advance Phase</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartNextRound}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/40 cursor-pointer active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start Round {(roundState.roundNumber || 1) + 1}</span>
                </button>
              )}
            </div>
          </div>

          {/* Visual Phase Pipeline Progress */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] pt-1">
            {[
              { id: ROUND_PHASES.REGISTRATION, label: '1. Registration (24h)', icon: Users },
              { id: ROUND_PHASES.ELITE_WINDOW, label: '2. Elite Spotlight (16h)', icon: Sparkles },
              { id: ROUND_PHASES.PREMIUM_WINDOW, label: '3. Premium Browsing (8h)', icon: Heart },
              { id: ROUND_PHASES.BASIC_SETTLEMENT, label: '4. Basic Allocation', icon: Award },
              { id: ROUND_PHASES.COMPLETED, label: '5. Round Complete', icon: CheckCircle2 }
            ].map((p, idx) => {
              const isCurrent = roundState.currentPhase === p.id;
              const isPassed = phaseStep > idx + 1;
              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-[#FF2D55] border-[#FF2D55] text-white font-black shadow-md'
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-slate-600 bg-slate-100' },
          { label: 'Elite (₹450)', value: stats.eliteCount, icon: Sparkles, color: 'text-amber-500 bg-amber-50' },
          { label: 'Premium (₹250)', value: stats.premiumCount, icon: Heart, color: 'text-rose-500 bg-rose-50' },
          { label: 'Basic (₹100)', value: stats.basicCount, icon: Award, color: 'text-blue-500 bg-blue-50' },
          { label: 'Refund Claims', value: stats.refunds, icon: DollarSign, color: 'text-red-500 bg-red-50' },
        ].map((s, idx) => (
          <div key={idx} className="glass-panel p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">{s.label}</span>
              <span className="text-lg font-black text-slate-900 leading-none">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION TABS FOR ADMIN MODULES */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'pipeline', label: 'Matchmaking Pipeline', icon: Sparkles },
          { id: 'refunds', label: `Refund Manager (${refundEligibleUsers.length})`, icon: DollarSign },
          { id: 'schedule', label: '10-Day Rotation Schedule', icon: Calendar },
          { id: 'directory', label: `Users Directory (${filteredUsers.length})`, icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              adminTab === tab.id
                ? 'bg-[#FF2D55] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-pink-50/60 border border-slate-200/80'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: MATCHMAKING PIPELINE OVERVIEW */}
      {adminTab === 'pipeline' && (
        <div className="grid md:grid-cols-3 gap-4">
          
          {/* Elite Tier Card */}
          <div className="glass-panel p-4.5 space-y-3 border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Elite Tier (₹450)</span>
              </span>
              <span className="text-xs font-bold text-slate-400">16h Priority Window</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Male profile is spotlighted on all female dashboards first. Females choose up to 2 matches. If male gets no match, 100% refund is guaranteed.
            </p>
            <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Active Elite Males:</span>
              <span className="text-[#FF2D55] font-black text-sm">{stats.eliteCount}</span>
            </div>
          </div>

          {/* Premium Tier Card */}
          <div className="glass-panel p-4.5 space-y-3 border-rose-200/80 bg-gradient-to-b from-rose-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                <Heart className="w-3 h-3 text-[#FF2D55]" />
                <span>Premium Tier (₹250)</span>
              </span>
              <span className="text-xs font-bold text-slate-400">8h Browsing Window</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Males browse and choose from all remaining available females (with open slots). If no match is confirmed, 100% refund is guaranteed.
            </p>
            <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Active Premium Males:</span>
              <span className="text-[#FF2D55] font-black text-sm">{stats.premiumCount}</span>
            </div>
          </div>

          {/* Basic Tier Card */}
          <div className="glass-panel p-4.5 space-y-3 border-blue-200/80 bg-gradient-to-b from-blue-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                <Award className="w-3 h-3 text-blue-600" />
                <span>Basic Tier (₹100)</span>
              </span>
              <span className="text-xs font-bold text-slate-400">Non-Refundable</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Auto-matched at round end based on mutual preferences and available female capacity. Fixed entry fee.
            </p>
            <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Active Basic Males:</span>
              <span className="text-[#FF2D55] font-black text-sm">{stats.basicCount}</span>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: REFUND MANAGER */}
      {adminTab === 'refunds' && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Refund Claims & Protection Desk</h3>
              <p className="text-xs text-slate-500">
                100% Money-Back Guarantee for Elite (₹450) and Premium (₹250) users with zero mutual matches.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-extrabold">
              {refundEligibleUsers.length} Eligible Case(s)
            </span>
          </div>

          {refundEligibleUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <p className="text-xs font-semibold">No pending refund claims. All eligible matches found or settled!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-extrabold">
                    <th className="pb-2">User</th>
                    <th className="pb-2">Plan Tier</th>
                    <th className="pb-2">State</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">UPI / Contact</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundEligibleUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3 font-bold text-slate-800">{u.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          u.plan === 'elite' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{u.state}</td>
                      <td className="py-3 font-extrabold text-[#FF2D55]">
                        ₹{u.plan === 'elite' ? 450 : 250}
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {u.contact || u.email || 'UPI_Auto_Ref'}
                      </td>
                      <td className="py-3">
                        {u.status === 'refunded' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Refunded ({u.refundTxnId || 'PAID'})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Pending Claim</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {u.status !== 'refunded' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveRefund(u.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-[11px] cursor-pointer transition-all shadow-xs"
                          >
                            Approve ₹{u.plan === 'elite' ? 450 : 250}
                          </button>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[10px]">Settled</span>
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

      {/* TAB 3: 10-DAY ROTATION SCHEDULE */}
      {adminTab === 'schedule' && (
        <div className="glass-panel p-5 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">10-Day Cyclic State Schedule</h3>
            <p className="text-xs text-slate-500">
              Each state hosts an active round once every 10 days for 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {stateSchedules.map((item) => (
              <div
                key={item.state}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.isToday
                    ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-lg shadow-rose-500/20'
                    : 'bg-white border-slate-200/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    item.isToday ? 'text-rose-100' : 'text-slate-400'
                  }`}>
                    {item.isToday ? '🟢 LIVE TODAY' : `In ${item.daysLeft} Day(s)`}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm truncate">{item.state}</h4>
                <p className={`text-xs mt-1 font-semibold ${
                  item.isToday ? 'text-white' : 'text-slate-500'
                }`}>
                  Round {item.roundNumber} • {item.nextRoundDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USERS DIRECTORY */}
      {adminTab === 'directory' && (
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Registered Users Directory</h3>
              <p className="text-[11px] text-slate-500">Live profiles registered across all state rounds</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all local demo data to start with 0 fresh users?")) {
                  clearAllData();
                  loadAdminData();
                }
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-[#FF2D55] text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              🧹 Clear Local Demo Data
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">State Filter</label>
              <select className="form-input text-xs" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
                <option value="All">All States</option>
                {STATES_LIST.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Plan Filter</label>
              <select className="form-input text-xs" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
                <option value="All">All Plans</option>
                <option value="elite">Elite (₹450)</option>
                <option value="premium">Premium (₹250)</option>
                <option value="basic">Basic (₹100)</option>
                <option value="free">Female (Free)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Gender</label>
              <select className="form-input text-xs" value={filterGender} onChange={(e) => setFilterGender(e.target.value)}>
                <option value="All">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Status</label>
              <select className="form-input text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-extrabold">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Gender</th>
                  <th className="pb-2">State</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Matches</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-800">{u.name}</td>
                    <td className="py-2.5 capitalize text-slate-600">{u.gender}</td>
                    <td className="py-2.5 text-slate-600">{u.state}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                        {u.plan || 'Free'}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-[#FF2D55]">
                      {u.matches?.length || 0} match(es)
                    </td>
                    <td className="py-2.5 capitalize text-slate-600">
                      {u.status}
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
