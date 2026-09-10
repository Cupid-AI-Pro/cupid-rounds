import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, createMatch, getCurrentUser } from '../utils/storage';
import { 
  Heart, 
  X, 
  MessageSquare, 
  MapPin, 
  ChevronLeft, 
  ArrowUpRight, 
  Search, 
  Compass, 
  User, 
  Sparkles, 
  LogOut, 
  CheckCircle, 
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SwipeableDeck from './SwipeableDeck';
import FullProfileModal from './FullProfileModal';
import CampusRadarMap from './CampusRadarMap';
import ChatView from './ChatView';
import ProfileView from './ProfileView';
import PermissionModal from './PermissionModal';
import InteractiveTourGuide from './InteractiveTourGuide';
import { getRoundState, ROUND_PHASES, PHASE_LABELS, joinRound } from '../utils/roundManager';

export default function UserDashboard({ user, onUpdateUser, onLogout }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [activeFilter, setActiveFilter] = useState('forYou'); // 'nearby' | 'forYou'
  const [currentTab, setCurrentTab] = useState('explore'); // 'explore' | 'radar' | 'chat' | 'profile'
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem(`tour_shown_${user.id}`);
  });

  const roundState = getRoundState();
  const isFemale = user.gender === 'female';
  const isEliteMale = user.gender === 'male' && user.plan === 'elite';
  const isPremiumMale = user.gender === 'male' && user.plan === 'premium';
  const isBasicMale = user.gender === 'male' && user.plan === 'basic';
  const femaleMatchesCount = user.matches?.length || 0;
  const isFemaleLimitReached = isFemale && femaleMatchesCount >= (roundState.femaleMaxMatches || 2);

  const [showReEntryModal, setShowReEntryModal] = useState(false);
  const [reEntryPlan, setReEntryPlan] = useState('elite');

  useEffect(() => {
    loadCandidates();
    const hasPrompted = localStorage.getItem(`perm_prompted_${user.id}`);
    if (!hasPrompted) {
      setShowPermissionPrompt(true);
    }
  }, [user.gender, user.interestedIn, user.university, activeFilter, roundState.currentPhase]);

  const loadCandidates = () => {
    const allUsers = getUsers();
    const userLikes = user.likes || [];
    const userDislikes = user.dislikes || [];
    const userMatches = user.matches || [];
    const excludedIds = [user.id, ...userLikes, ...userDislikes, ...userMatches];

    // Filter by same state and active round status
    let stateCandidates = allUsers.filter(u => 
      !excludedIds.includes(u.id) && 
      u.state === (user.state || roundState.activeState) &&
      u.status === 'active'
    );

    // Opposite gender
    if (user.interestedIn && user.interestedIn !== 'Everyone') {
      stateCandidates = stateCandidates.filter(u => u.gender === user.interestedIn);
    } else {
      stateCandidates = stateCandidates.filter(u => u.gender !== user.gender);
    }

    // WATERFALL RULES BY TIER & PHASE:
    if (isFemale) {
      // If round is in Elite Window, prioritize Elite male profiles
      if (roundState.currentPhase === ROUND_PHASES.ELITE_WINDOW) {
        const eliteMales = stateCandidates.filter(u => u.plan === 'elite');
        const otherMales = stateCandidates.filter(u => u.plan !== 'elite');
        stateCandidates = [...eliteMales, ...otherMales];
      }
    } else if (isEliteMale) {
      // Prioritize females who already liked this Elite male
      const femalesWhoLikedMe = stateCandidates.filter(f => f.likes && f.likes.includes(user.id));
      const otherFemales = stateCandidates.filter(f => !f.likes || !f.likes.includes(user.id));
      stateCandidates = [...femalesWhoLikedMe, ...otherFemales];
    } else if (isPremiumMale) {
      // Premium males see females who still have vacant match slots (< 2 matches)
      stateCandidates = stateCandidates.filter(f => !f.matches || f.matches.length < 2);
    }

    if (activeFilter === 'nearby') {
      stateCandidates = stateCandidates.sort((a, b) => (a.distanceKm || 2) - (b.distanceKm || 2));
    } else {
      stateCandidates = stateCandidates.sort((a, b) => (b.matchScore || 80) - (a.matchScore || 80));
    }

    setCandidates(stateCandidates);
  };

  const handleLike = (candidate) => {
    const updatedLikes = [...(user.likes || []), candidate.id];
    let isMutualMatch = false;
    let updatedMatches = [...(user.matches || [])];

    if (candidate.likes && candidate.likes.includes(user.id)) {
      isMutualMatch = true;
      updatedMatches.push(candidate.id);
      createMatch(user.id, candidate.id);
      
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF2E79', '#FF6B8B', '#A855F7', '#FFD166']
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
    setCandidates(prev => prev.filter(c => c.id !== candidate.id));
  };

  const handleDecline = (candidate) => {
    const updatedDislikes = [...(user.dislikes || []), candidate.id];
    const updatedUser = { ...user, dislikes: updatedDislikes };
    updateUser(updatedUser);
    onUpdateUser(updatedUser);
    setCandidates(prev => prev.filter(c => c.id !== candidate.id));
  };

  const handlePermissionsComplete = () => {
    setShowPermissionPrompt(false);
    localStorage.setItem(`perm_prompted_${user.id}`, 'true');
  };

  const handleRequestRefund = () => {
    const updated = {
      ...user,
      refundRequested: true,
      refundReason: 'No matches in active round'
    };
    updateUser(updated);
    onUpdateUser(updated);
  };

  const getMatchedUsers = () => {
    const allUsers = getUsers();
    return allUsers.filter(u => user.matches?.includes(u.id));
  };

  const matchedUsers = getMatchedUsers();

  return (
    <div className="flex-1 flex flex-col h-full relative justify-between select-none overflow-hidden pb-[74px]">
      
      {/* Interactive First-Time User Guided Tour (Bubble Tooltips) */}
      {showTour && (
        <InteractiveTourGuide
          user={user}
          userId={user.id}
          onComplete={() => setShowTour(false)}
        />
      )}

      {/* Location & Notification Permission Modal */}
      {showPermissionPrompt && (
        <PermissionModal onComplete={handlePermissionsComplete} />
      )}

      {/* Full Expanded Profile Modal */}
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
      {/* TAB 1: EXPLORE / HOME FEED (Swipeable Card Stack)                 */}
      {/* ----------------------------------------------------------------- */}
      {currentTab === 'explore' && (
        <div className="flex-1 flex flex-col px-4 pt-1 pb-1 h-full overflow-hidden">
          
          {/* iOS Status Bar */}
          <div className="w-full flex items-center justify-between px-1 pt-1 pb-2 text-slate-900 select-none text-[13px] font-bold">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-slate-900">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M2 17h3v4H2v-4zm5-4h3v8H7v-8zm5-4h3v12h-3V9zm5-4h3v16h-3V5z" />
              </svg>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.5 0 6.67 1.45 8.98 3.79L12 19.18 3.02 11.29C5.33 8.95 8.5 7.5 12 7.5z" />
              </svg>
              <div className="w-5 h-2.5 rounded-[3px] border border-slate-900 p-[1px] flex items-center">
                <div className="w-full h-full bg-slate-900 rounded-[1px]"></div>
              </div>
            </div>
          </div>

          {/* Top Header Row (Matching Reference) */}
          <div className="flex items-center justify-between select-none mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-200/60">
                <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-extrabold text-slate-900 leading-tight">Hello, {user.name.split(' ')[0]}</span>
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{user.university ? user.university.split(' ')[0] : 'New work'}</span>
                </span>
              </div>
            </div>

            {/* Circular Search Button */}
            <button 
              onClick={() => setCurrentTab('radar')}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center cursor-pointer shadow-sm hover:bg-slate-50 transition-colors border border-slate-100"
              title="Search / Campus Radar"
            >
              <Search className="w-4.5 h-4.5 text-slate-800 stroke-[2.2]" />
            </button>
          </div>

          {/* Stories Row with Pink Gradient Rings (Matching Reference) */}
          <div className="mb-3 select-none">
            <div className="flex gap-2.5 items-center overflow-x-auto pb-1 no-scrollbar">
              {/* + Story / Radar Button */}
              <div 
                onClick={() => setCurrentTab('radar')}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center cursor-pointer shrink-0 shadow-sm border border-slate-200/80 hover:scale-105 transition-transform"
                title="Campus Radar Map"
              >
                <span className="text-2xl font-light text-slate-700 leading-none">+</span>
              </div>
              {candidates.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => setExpandedCandidate(c)}
                  className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#FF2E79] to-[#FFA1B5] cursor-pointer shrink-0 hover:scale-105 transition-transform shadow-xs"
                  title={`View ${c.name}'s Profile`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden p-[1.5px] bg-white">
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby / For You Toggle Pills (Matching Reference) */}
          <div className="flex items-center justify-between gap-2.5 mb-2.5 select-none">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('nearby')}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'nearby'
                    ? 'bg-[#FF2E79] text-white shadow-md shadow-pink-300/40'
                    : 'bg-white/85 backdrop-blur-md text-slate-600 border border-slate-200/60 hover:bg-white shadow-xs'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Nearby</span>
              </button>
              <button
                onClick={() => setActiveFilter('forYou')}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'forYou'
                    ? 'bg-[#FF2E79] text-white shadow-md shadow-pink-300/40'
                    : 'bg-white/85 backdrop-blur-md text-slate-600 border border-slate-200/60 hover:bg-white shadow-xs'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>For You</span>
              </button>
            </div>

            {/* Round Phase Badge */}
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-white/90 border border-pink-100 text-[#FF2E79] shadow-xs">
              R{roundState.roundNumber || 1} • {roundState.currentPhase === ROUND_PHASES.ELITE_WINDOW ? 'Elite 16h' : roundState.currentPhase === ROUND_PHASES.PREMIUM_WINDOW ? 'Premium 8h' : roundState.currentPhase === ROUND_PHASES.BASIC_SETTLEMENT ? 'Settle' : 'Live'}
            </span>
          </div>

          {/* Dynamic Tier Context Banner */}
          {isFemale && roundState.currentPhase === ROUND_PHASES.ELITE_WINDOW && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Elite Spotlight (16h Window)</span>
              </span>
              <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded-full font-black text-amber-800">
                {femaleMatchesCount}/2 Matches Chosen
              </span>
            </div>
          )}

          {isEliteMale && user.likes && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between text-[11px] font-bold text-rose-900">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#FF2E79] fill-current" />
                <span>Elite Spotlight Active</span>
              </span>
              <span className="text-[10px] text-rose-600 font-semibold">100% Refund Protected</span>
            </div>
          )}

          {/* Female Maximum Matches Limit Reached Banner */}
          {isFemaleLimitReached ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-md rounded-[28px] border border-white text-center shadow-sm">
              <div className="w-14 h-14 bg-pink-50 text-[#FF2E79] rounded-full flex items-center justify-center mb-3">
                <Heart className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 font-display">2/2 Matches Selected!</h3>
              <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                You have selected your maximum 2 matches for Round {roundState.roundNumber}. Chat with them directly in the Chat tab!
              </p>
              <button
                type="button"
                onClick={() => setCurrentTab('chat')}
                className="mt-4 px-6 py-2.5 bg-[#FF2E79] text-white rounded-full text-xs font-extrabold shadow-md shadow-rose-300 cursor-pointer"
              >
                Open Chats ({user.matches?.length})
              </button>
            </div>
          ) : (
            /* Swipeable Card Stack Container */
            <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
              <SwipeableDeck
                candidates={candidates}
                user={user}
                onLike={handleLike}
                onDecline={handleDecline}
                onOpenDetail={(c) => setExpandedCandidate(c)}
              />
            </div>
          )}

        </div>
      )}

      {/* Round 2 / Next Round Re-Entry Modal */}
      {showReEntryModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-5 w-full max-w-[340px] shadow-2xl border border-pink-100 animate-slide-up space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 text-[#FF2E79] rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-display">
                Join Round {(roundState.roundNumber || 1) + 1}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your profile and re-enter the next live round for {user.state}.
              </p>
            </div>

            {/* Plan selection for male users */}
            {!isFemale && (
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Select Your Plan:
                </span>
                {[
                  { id: 'elite', name: 'Elite (₹450)', desc: '16h Spotlight + Refund Protected' },
                  { id: 'premium', name: 'Premium (₹250)', desc: '8h Browsing + Refund Protected' },
                  { id: 'basic', name: 'Basic (₹100)', desc: 'Auto Match on Preferences' }
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
                  const updated = joinRound(user.id, reEntryPlan);
                  if (updated) {
                    onUpdateUser(updated);
                    setShowReEntryModal(false);
                    confetti({ particleCount: 70, spread: 60 });
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#FF2E79] hover:bg-[#e02447] text-white text-xs font-black cursor-pointer shadow-md shadow-rose-300"
              >
                Confirm & Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 2: CAMPUS RADAR MAP (`🧭` Compass Tab)                          */}
      {/* ----------------------------------------------------------------- */}
      {currentTab === 'radar' && (
        <CampusRadarMap
          user={user}
          candidates={candidates}
          matchedUsers={matchedUsers}
          onSelectCandidate={(c) => setExpandedCandidate(c)}
          onLikeCandidate={handleLike}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 3: CHAT & MESSAGES (`💬` Messages Tab)                         */}
      {/* ----------------------------------------------------------------- */}
      {currentTab === 'chat' && (
        <ChatView
          user={user}
          matchedUsers={matchedUsers}
          onOpenMatchProfile={(m) => setExpandedCandidate(m)}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 4: USER PROFILE & SETTINGS (`👤` Profile Tab)                  */}
      {/* ----------------------------------------------------------------- */}
      {currentTab === 'profile' && (
        <ProfileView
          user={user}
          onLogout={onLogout}
          onRequestRefund={handleRequestRefund}
          onOpenPermissions={() => setShowPermissionPrompt(true)}
          onUpdateUser={onUpdateUser}
          onReplayTour={() => setShowTour(true)}
        />
      )}

      {/* ----------------------------------------------------------------- */}
      {/* BOTTOM FLOATING NAVIGATION BAR (Light Pill with Black Active Tab)  */}
      {/* ----------------------------------------------------------------- */}
      <div className="phone-navbar select-none">
        
        {/* Tab 1: Home / Explore */}
        <button 
          onClick={() => setCurrentTab('explore')}
          className={`w-12 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            currentTab === 'explore' 
              ? 'bg-black text-white shadow-sm' 
              : 'text-slate-700 hover:text-black'
          }`}
          title="Explore Cards Stack"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </button>

        {/* Tab 2: Campus Radar Map (Compass) */}
        <button 
          onClick={() => setCurrentTab('radar')}
          className={`w-12 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            currentTab === 'radar' 
              ? 'bg-black text-white shadow-sm' 
              : 'text-slate-700 hover:text-black'
          }`}
          title="Campus Map"
        >
          <Compass className="w-5 h-5" />
        </button>
        
        {/* Tab 3: Direct Messages & Matches */}
        <button 
          onClick={() => setCurrentTab('chat')}
          className={`w-12 h-11 rounded-full flex items-center justify-center transition-all relative cursor-pointer ${
            currentTab === 'chat' 
              ? 'bg-black text-white shadow-sm' 
              : 'text-slate-700 hover:text-black'
          }`}
          title="Messages & Matches"
        >
          <MessageSquare className="w-5 h-5" />
          {matchedUsers.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF2E79] border-2 border-white rounded-full"></span>
          )}
        </button>
        
        {/* Tab 4: Profile & Settings */}
        <button 
          onClick={() => setCurrentTab('profile')}
          className={`w-12 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            currentTab === 'profile' 
              ? 'bg-black text-white shadow-sm' 
              : 'text-slate-700 hover:text-black'
          }`}
          title="My Profile"
        >
          <User className="w-5 h-5" />
        </button>
      </div>

      {/* ----------------- MUTUAL MATCH REVEAL MODAL ----------------- */}
      {selectedMatch && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-5 max-w-[310px] w-full text-center relative animate-float">
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

    </div>
  );
}
