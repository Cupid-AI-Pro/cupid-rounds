import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, createMatch, getCurrentUser } from '../utils/storage';
import { 
  Heart, 
  X, 
  MessageSquare, 
  MessageCircle,
  MapPin, 
  ChevronLeft, 
  ArrowUpRight, 
  Search, 
  Bell,
  Compass, 
  User, 
  Home,
  Users,
  Sparkles, 
  LogOut, 
  CheckCircle, 
  Check,
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
    <div className="flex-1 flex flex-col h-full relative justify-between select-none overflow-hidden pb-20 bg-gradient-to-b from-[#FFF0F4] via-[#FFEBEF] to-[#FFF5F8]">
      
      {/* Background Organic Fluid Wave Patterns & Floating 3D Soft Pink Heart (Matching Reference Image) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Soft pink glowing aura blurs */}
        <div className="absolute -top-12 -left-12 w-72 h-72 bg-rose-200/45 rounded-full blur-3xl" />
        <div className="absolute top-[18%] -right-16 w-80 h-80 bg-pink-300/35 rounded-full blur-3xl" />
        <div className="absolute bottom-[-40px] left-[10%] w-96 h-96 bg-rose-200/35 rounded-full blur-3xl" />

        {/* Curved Fluid Organic Ribbon Waves */}
        <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 390 844" fill="none">
          <path d="M-60 140 C80 90, 240 200, 450 110" stroke="#FF2E79" strokeWidth="1.8" strokeOpacity="0.25" />
          <path d="M-20 340 C110 290, 290 440, 430 350" stroke="#FF6584" strokeWidth="2.2" strokeOpacity="0.22" />
          <path d="M-40 690 C140 630, 230 790, 440 710" stroke="#FF2E79" strokeWidth="2.5" strokeOpacity="0.2" />
        </svg>

        {/* Top Right Floating Soft Pink 3D Heart */}
        <div className="absolute top-14 right-20 animate-float opacity-75 z-0">
          <Heart className="w-12 h-12 fill-rose-300/70 text-rose-300/90 drop-shadow-md transform rotate-12" />
        </div>
      </div>

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
        <div className="flex-1 flex flex-col px-4 pt-2 pb-2 h-full overflow-hidden z-10">
          
          {/* Top Header Row (Exact Match to Reference Image) */}
          <div className="flex items-center justify-between select-none mb-3">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setCurrentTab('profile')}
                className="w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF2E79] via-pink-400 to-rose-300 shadow-md ring-2 ring-pink-100/60 cursor-pointer hover:scale-105 transition-transform shrink-0"
              >
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-full bg-white" />
              </div>

              <div className="flex flex-col">
                <h1 className="text-lg font-black text-slate-900 leading-tight flex items-center">
                  <span className="font-cursive text-[#FF2E79] text-2xl font-normal tracking-wide mr-1.5">Hello,</span>
                  <span>{user.name.split(' ')[0]}</span>
                </h1>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-extrabold mt-0.5">
                  <MapPin className="w-3 h-3 text-[#FF2E79]" />
                  <span>{user.university ? user.university.split(' ')[0] : 'NIET'}</span>
                </div>
              </div>
            </div>

            {/* Right Action Icons & Cursive Tagline */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentTab('radar')}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(255,182,193,0.35)] border border-white hover:bg-slate-50 transition-all active:scale-95"
                  title="Search / Campus Radar"
                >
                  <Search className="w-4.5 h-4.5 text-slate-800 stroke-[2.2]" />
                </button>
                <button 
                  onClick={() => setCurrentTab('chat')}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-[0_4px_14px_rgba(255,182,193,0.35)] border border-white hover:bg-slate-50 transition-all active:scale-95 relative"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5 text-slate-800 stroke-[2.2]" />
                  <span className="w-2.5 h-2.5 bg-[#FF2E79] rounded-full absolute top-1.5 right-1.5 border border-white" />
                </button>
              </div>
              <span className="font-cursive text-pink-400 text-xs rotate-[-2deg] tracking-wide select-none pointer-events-none mt-1">
                Good People Brighter Stories ♡
              </span>
            </div>
          </div>

          {/* Stories Horizontal Scroll Row (Matching Reference Image) */}
          <div className="mb-3 select-none">
            <div className="flex gap-3 items-center overflow-x-auto pb-1.5 no-scrollbar">
              {/* Add Story Button */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div 
                  onClick={() => setCurrentTab('radar')}
                  className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center cursor-pointer border-2 border-pink-100/90 shadow-2xs text-[#FF2E79] font-light text-2xl hover:scale-105 transition-transform"
                >
                  +
                </div>
                <span className="text-[11px] font-bold text-slate-700">Add Story</span>
              </div>

              {/* Your Story */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div 
                  onClick={() => setCurrentTab('profile')}
                  className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF2E79] via-pink-400 to-rose-300 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                >
                  <img src={user.avatar} alt="Your Story" className="w-full h-full object-cover rounded-full bg-white" />
                </div>
                <span className="text-[11px] font-bold text-slate-700">Your Story</span>
              </div>

              {/* Candidate Stories */}
              {candidates.map((c) => (
                <div key={c.id} className="flex flex-col items-center gap-1 shrink-0">
                  <div 
                    onClick={() => setExpandedCandidate(c)}
                    className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF2E79] via-pink-400 to-rose-300 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                  >
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover rounded-full bg-white" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">{c.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Segmented Filter Pills Bar (Matching Reference Image) */}
          <div className="flex items-center justify-between gap-2 mb-3 select-none">
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
                <span>R1 • Live</span>
                <span className="w-2 h-2 rounded-full bg-[#FF2E79] animate-ping" />
              </button>
            </div>
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
            /* Swipeable Card Stack Container — overflow-visible pr-3 so stacked cards peeking out on right side are completely visible */
            <div className="flex-1 relative overflow-visible pr-4" style={{ minHeight: 0 }}>
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
      {/* BOTTOM FLOATING NAVIGATION BAR (Exact Match to Reference Image)  */}
      {/* ----------------------------------------------------------------- */}
      <div className="fixed bottom-3 left-4 right-4 z-40 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-2 shadow-[0_15px_40px_rgba(255,46,121,0.18)] flex items-center justify-around max-w-md mx-auto select-none">
        
        {/* Tab 1: Home */}
        <button 
          onClick={() => setCurrentTab('explore')}
          className={`transition-all cursor-pointer ${
            currentTab === 'explore' 
              ? 'bg-[#FFEBEF] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
              : 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 text-slate-700 font-extrabold hover:text-black'
          }`}
          title="Home"
        >
          <Home className={`w-5 h-5 ${currentTab === 'explore' ? 'fill-[#FF2E79] text-[#FF2E79]' : 'stroke-[2.2]'}`} />
          <span className="text-[11px]">Home</span>
        </button>

        {/* Tab 2: Discover */}
        <button 
          onClick={() => setCurrentTab('radar')}
          className={`transition-all cursor-pointer ${
            currentTab === 'radar' 
              ? 'bg-[#FFEBEF] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
              : 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 text-slate-700 font-extrabold hover:text-black'
          }`}
          title="Discover"
        >
          <Compass className={`w-5 h-5 ${currentTab === 'radar' ? 'text-[#FF2E79]' : 'stroke-[2.2]'}`} />
          <span className="text-[11px]">Discover</span>
        </button>
        
        {/* Tab 3: Chats */}
        <button 
          onClick={() => setCurrentTab('chat')}
          className={`transition-all cursor-pointer relative ${
            currentTab === 'chat' 
              ? 'bg-[#FFEBEF] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
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
        
        {/* Tab 4: Profile */}
        <button 
          onClick={() => setCurrentTab('profile')}
          className={`transition-all cursor-pointer ${
            currentTab === 'profile' 
              ? 'bg-[#FFEBEF] text-[#FF2E79] rounded-[22px] px-5 py-2 flex flex-col items-center justify-center gap-0.5 shadow-2xs font-black' 
              : 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 text-slate-700 font-extrabold hover:text-black'
          }`}
          title="Profile"
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'text-[#FF2E79]' : 'stroke-[2.2]'}`} />
          <span className="text-[11px]">Profile</span>
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
