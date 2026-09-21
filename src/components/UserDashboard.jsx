import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, createMatch } from '../utils/storage';
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
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SwipeableDeck from './SwipeableDeck';
import FullProfileModal from './FullProfileModal';
import CampusRadarMap from './CampusRadarMap';
import ChatView from './ChatView';
import ProfileView from './ProfileView';
import PermissionModal from './PermissionModal';
import InteractiveTourGuide from './InteractiveTourGuide';
import { getRoundState, ROUND_PHASES, joinRound } from '../utils/roundManager';

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

    let stateCandidates = allUsers.filter(u => 
      !excludedIds.includes(u.id) && 
      u.state === (user.state || roundState.activeState) &&
      u.status === 'active'
    );

    if (user.interestedIn && user.interestedIn !== 'Everyone') {
      stateCandidates = stateCandidates.filter(u => u.gender === user.interestedIn);
    } else {
      stateCandidates = stateCandidates.filter(u => u.gender !== user.gender);
    }

    if (isFemale) {
      if (roundState.currentPhase === ROUND_PHASES.ELITE_WINDOW) {
        const eliteMales = stateCandidates.filter(u => u.plan === 'elite');
        const otherMales = stateCandidates.filter(u => u.plan !== 'elite');
        stateCandidates = [...eliteMales, ...otherMales];
      }
    } else if (isEliteMale) {
      const femalesWhoLikedMe = stateCandidates.filter(f => f.likes && f.likes.includes(user.id));
      const otherFemales = stateCandidates.filter(f => !f.likes || !f.likes.includes(user.id));
      stateCandidates = [...femalesWhoLikedMe, ...otherFemales];
    } else if (isPremiumMale) {
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
        origin: { y: 0.6 }
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
    <div className="flex-1 flex flex-col h-full relative justify-between select-none overflow-hidden pb-20 bg-[#F8FAFC]">
      
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
      {/* TAB 1: EXPLORE / HOME FEED                                       */}
      {/* ----------------------------------------------------------------- */}
      {currentTab === 'explore' && (
        <div className="flex-1 flex flex-col px-4 pt-3 pb-2 h-full overflow-hidden z-10">
          
          {/* Header Row */}
          <div className="flex items-center justify-between select-none mb-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => setCurrentTab('profile')}
                className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-slate-200 shrink-0"
              >
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex flex-col">
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                  {user.name.split(' ')[0]}
                </h1>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-0.5">
                  <MapPin className="w-3 h-3 text-[#FF2E79]" />
                  <span>{user.state || 'Delhi NCR'}</span>
                  <span>|</span>
                  <span>{user.university ? user.university.split(' ')[0] : 'University'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentTab('radar')}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200 transition-colors"
                title="Search"
              >
                <Search className="w-4 h-4 text-slate-700" />
              </button>
              <button 
                onClick={() => setCurrentTab('chat')}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                <span className="w-2 h-2 bg-[#FF2E79] rounded-full absolute top-1.5 right-1.5" />
              </button>
            </div>
          </div>

          {/* Minimal Filter Switcher */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="bg-white rounded-xl p-1 border border-slate-200/80 shadow-2xs flex items-center gap-1 flex-1">
              <button
                onClick={() => setActiveFilter('nearby')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                  activeFilter === 'nearby'
                    ? 'bg-[#FF2E79] text-white font-extrabold shadow-xs'
                    : 'text-slate-600 font-semibold hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Nearby</span>
              </button>

              <button
                onClick={() => setActiveFilter('forYou')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs transition-all cursor-pointer ${
                  activeFilter === 'forYou'
                    ? 'bg-[#FF2E79] text-white font-extrabold shadow-xs'
                    : 'text-slate-600 font-semibold hover:bg-slate-50'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>For You</span>
              </button>

              <button
                onClick={() => setCurrentTab('radar')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer shrink-0"
              >
                <Users className="w-3.5 h-3.5 text-slate-700" />
                <span>Live Round</span>
              </button>
            </div>
          </div>

          {/* Limit Reached Banner */}
          {isFemaleLimitReached ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
              <div className="w-12 h-12 bg-rose-50 text-[#FF2E79] rounded-xl flex items-center justify-center mb-3">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 font-display">2/2 Matches Selected</h3>
              <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                You have reached your match capacity for Round {roundState.roundNumber}. Chat directly with your matches in the Chat tab.
              </p>
              <button
                type="button"
                onClick={() => setCurrentTab('chat')}
                className="mt-4 px-6 py-2.5 bg-[#FF2E79] text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer"
              >
                Open Chats ({user.matches?.length})
              </button>
            </div>
          ) : (
            <div className="flex-1 relative overflow-visible" style={{ minHeight: 0 }}>
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

      {/* Round 2 Re-Entry Modal */}
      {showReEntryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-[340px] shadow-xl border border-slate-200 space-y-4">
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">
                Join Round {(roundState.roundNumber || 1) + 1}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Re-enter the next round for {user.state}.
              </p>
            </div>

            {!isFemale && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Plan:
                </span>
                {[
                  { id: 'elite', name: 'Elite (₹450)', desc: '16h Spotlight + Refund Guarantee' },
                  { id: 'premium', name: 'Premium (₹250)', desc: '8h Browsing + Refund Guarantee' },
                  { id: 'basic', name: 'Basic (₹100)', desc: 'Auto Preference Match' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setReEntryPlan(p.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                      reEntryPlan === p.id
                        ? 'border-[#FF2E79] bg-rose-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{p.desc}</div>
                    </div>
                    {reEntryPlan === p.id && <Check className="w-4 h-4 text-[#FF2E79]" />}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReEntryModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
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
                className="flex-1 py-2.5 rounded-xl bg-[#FF2E79] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Confirm Re-entry
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
          onReplayTour={() => setShowTour(true)}
        />
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-3 left-4 right-4 z-40 bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-md flex items-center justify-around max-w-md mx-auto select-none">
        
        <button 
          onClick={() => setCurrentTab('explore')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            currentTab === 'explore' 
              ? 'bg-[#FF2E79] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Home"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button 
          onClick={() => setCurrentTab('radar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            currentTab === 'radar' 
              ? 'bg-[#FF2E79] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Discover"
        >
          <Compass className="w-4 h-4" />
          <span>Discover</span>
        </button>
        
        <button 
          onClick={() => setCurrentTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer relative ${
            currentTab === 'chat' 
              ? 'bg-[#FF2E79] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Chats"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chats</span>
        </button>
        
        <button 
          onClick={() => setCurrentTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            currentTab === 'profile' 
              ? 'bg-[#FF2E79] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Profile"
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </div>

      {/* MUTUAL MATCH MODAL */}
      {selectedMatch && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-[310px] w-full text-center relative border border-slate-200 shadow-xl">
            <button 
              onClick={() => setSelectedMatch(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 bg-rose-50 text-[#FF2E79] rounded-xl flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-[#FF2E79]" />
            </div>

            <h3 className="text-base font-black text-slate-900">It's a Match</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              You and <strong className="text-slate-800">{selectedMatch.name}</strong> liked each other.
            </p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={user.avatar} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="" />
              <div className="w-7 h-7 rounded-full bg-rose-50 text-[#FF2E79] flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </div>
              <img src={selectedMatch.avatar} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="" />
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  setSelectedMatch(null);
                  setCurrentTab('chat');
                }}
                className="w-full py-2.5 rounded-xl bg-[#FF2E79] text-white font-extrabold text-xs shadow-xs hover:bg-rose-600 cursor-pointer"
              >
                Send Message
              </button>
              <button 
                onClick={() => setSelectedMatch(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
