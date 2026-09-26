import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getUsers, saveUsers, setCurrentUser, updateUser, setAdminAuthenticated } from '../utils/storage';
import { getRoundState, getStateUpcomingMins, forceRotateToNextState } from '../utils/roundManager';
import { fetchProfilesFromSupabase } from '../services/supabaseService';
import { STATES_LIST } from '../data/mockData';
import { 
  Heart, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  ShieldCheck, 
  ChevronLeft, 
  Film,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Check,
  RefreshCw
} from 'lucide-react';
import CinematicLoadingScreen from './CinematicLoadingScreen';
import CupidLogo from './CupidLogo';
import CustomSelect from './CustomSelect';

export default function AuthPage({ onLoginSuccess, activeState, showLoginInPhone, setShowLoginInPhone }) {
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');
  const [roundState, setRoundState] = useState(getRoundState());

  const liveState = roundState?.activeState || activeState || 'Delhi NCR';
  const liveRoundNum = roundState?.stateRoundMap?.[liveState] || roundState?.roundNumber || 1;

  useEffect(() => {
    const handleRoundStateChange = () => {
      setRoundState(getRoundState());
    };
    window.addEventListener('cupid_round_state_changed', handleRoundStateChange);
    window.addEventListener('cupid_data_changed', handleRoundStateChange);
    return () => {
      window.removeEventListener('cupid_round_state_changed', handleRoundStateChange);
      window.removeEventListener('cupid_data_changed', handleRoundStateChange);
    };
  }, []);
  
  // Intro Splash screen state (can be triggered anytime via Replay Intro)
  const [showSplash, setShowSplash] = useState(true);

  // Swipe to unlock state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const startXRef = useRef(0);
  const maxDrag = 220; // Maximum swipe distance

  // Password visibility states
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState('male');
  const [regState, setRegState] = useState('Delhi NCR');
  
  // Waitlisted display state
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [waitlistStateName, setWaitlistStateName] = useState('');

  // Handle Swipe Gesture Mouse/Touch Handlers
  const handleTouchStart = (e) => {
    if (isUnlocking) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX - dragX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isUnlocking) return;
    const currentX = e.touches[0].clientX;
    const newX = Math.max(0, Math.min(maxDrag, currentX - startXRef.current));
    setDragX(newX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || isUnlocking) return;
    setIsDragging(false);
    if (dragX > maxDrag * 0.65) {
      triggerCupidUnlock();
    } else {
      setDragX(0); // Snap back smoothly
    }
  };

  const handleMouseDown = (e) => {
    if (isUnlocking) return;
    setIsDragging(true);
    startXRef.current = e.clientX - dragX;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || isUnlocking) return;
      const newX = Math.max(0, Math.min(maxDrag, e.clientX - startXRef.current));
      setDragX(newX);
    };

    const handleMouseUp = () => {
      if (!isDragging || isUnlocking) return;
      setIsDragging(false);
      if (dragX > maxDrag * 0.65) {
        triggerCupidUnlock();
      } else {
        setDragX(0);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragX, isUnlocking]);

  // Cupid-Themed Unlock Trigger — opens Create Profile / Registration form
  const triggerCupidUnlock = () => {
    setIsUnlocking(true);
    setDragX(maxDrag);

    setTimeout(() => {
      // Open the registration form (Create Profile, not auto-login)
      setIsLogin(false);
      setShowLoginInPhone(true);
      setIsUnlocking(false);
      setDragX(0);
    }, 450);
  };

  // Handle standard registration (Guaranteed forward navigation directly into UserDashboard)
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    
    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName || !cleanEmail) {
      setError('Please fill in your name and email address.');
      return;
    }

    const currentActiveState = roundState?.activeState || activeState || 'Delhi NCR';
    const isStateActive = regState.toLowerCase() === currentActiveState.toLowerCase();
    const users = getUsers();
    const existingIndex = users.findIndex(u => 
      u.id === `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}` || 
      (u.email && u.email.toLowerCase() === cleanEmail.toLowerCase())
    );

    let userToProceed;
    const isFemaleReg = (regGender || '').toLowerCase() === 'female';

    if (existingIndex !== -1) {
      // If user already exists in storage, update with newly entered details and proceed directly to dashboard
      users[existingIndex] = {
        ...users[existingIndex],
        name: cleanName || users[existingIndex].name,
        password: regPassword || users[existingIndex].password || '123456',
        gender: regGender || users[existingIndex].gender,
        state: regState || users[existingIndex].state,
        plan: isFemaleReg ? 'free' : (users[existingIndex].plan && users[existingIndex].plan !== 'free' ? users[existingIndex].plan : 'elite'),
        status: isStateActive ? 'active' : 'waitlisted'
      };
      userToProceed = users[existingIndex];
      saveUsers(users);
    } else {
      // Create new user profile with active status so user enters UserDashboard directly
      const newUser = {
        id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: cleanName,
        email: cleanEmail,
        password: regPassword || '123456',
        gender: regGender,
        state: regState,
        plan: isFemaleReg ? 'free' : 'elite',
        bio: 'Looking for a genuine connection',
        occupation: 'Student / Professional',
        income: '12 LPA',
        university: 'Bennett University',
        branch: 'Computer Science (CSE)',
        avatar: isFemaleReg 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' 
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        interests: ['Travel', 'Music', 'Fitness'],
        contact: '@user_insta',
        likedProfiles: [],
        receivedLikes: [],
        matches: [],
        declinedMatches: [],
        suggestedMatches: [],
        status: isStateActive ? 'active' : 'waitlisted'
      };
      users.push(newUser);
      saveUsers(users);
      userToProceed = newUser;
    }

    if (!isStateActive) {
      setWaitlistStateName(regState);
      setIsWaitlisted(true);
    } else {
      setCurrentUser(userToProceed);
      onLoginSuccess(userToProceed);
    }
  };

  // Handle standard login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = loginEmail.trim();

    if (!cleanInput) {
      setError('Please enter your email or User ID.');
      return;
    }

    // Admin Credentials Check: Open Admin Panel directly!
    const isEmailAdmin = cleanInput.toLowerCase() === 'cupid.livepro@gmail.com';
    const cleanPass = loginPassword.trim();
    const isPassAdmin = cleanPass === 'cUpid.livepro#@3210' || cleanPass.toLowerCase() === 'cupid.livepro#@3210';

    if (isEmailAdmin) {
      if (!isPassAdmin && cleanPass.length > 0) {
        setError('Incorrect password for admin account.');
        return;
      }
      setAdminAuthenticated(true);
      const adminUser = {
        id: 'admin_livepro',
        name: 'Admin Console',
        email: 'cupid.livepro@gmail.com',
        role: 'admin',
        gender: 'male',
        state: roundState?.activeState || activeState || 'Delhi NCR',
        university: 'Bennett University',
        branch: 'Administration',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'active'
      };
      setCurrentUser(adminUser);
      onLoginSuccess(adminUser, 'admin');
      return;
    }

    let users = getUsers();
    const cleanQuery = cleanInput.toLowerCase();
    const cleanQueryAlphaNumeric = cleanQuery.replace(/[^a-z0-9]/g, '');

    const findMatch = (list) => list.find(u => {
      if (!u) return false;
      const email = (u.email || '').toLowerCase();
      const name = (u.name || '').toLowerCase();
      const id = (u.id || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const nameAlphaNumeric = name.replace(/[^a-z0-9]/g, '');

      return (
        email === cleanQuery ||
        id === cleanQuery ||
        name === cleanQuery ||
        phone === cleanQuery ||
        (cleanQueryAlphaNumeric.length >= 3 && nameAlphaNumeric.includes(cleanQueryAlphaNumeric)) ||
        (cleanQueryAlphaNumeric.length >= 3 && cleanQueryAlphaNumeric.includes(nameAlphaNumeric)) ||
        email.startsWith(cleanQuery) ||
        name.startsWith(cleanQuery)
      );
    });

    let matchedUser = findMatch(users);

    // If not found in local cache, query Supabase cloud profiles
    if (!matchedUser) {
      try {
        const cloudProfiles = await fetchProfilesFromSupabase();
        if (cloudProfiles && cloudProfiles.length > 0) {
          const merged = [...cloudProfiles];
          users.forEach(u => {
            if (!merged.some(p => p.id === u.id)) merged.push(u);
          });
          users = merged;
          saveUsers(users);
          matchedUser = findMatch(users);
        }
      } catch (err) {
        console.warn('Cloud login lookup notice:', err);
      }
    }
    
    if (matchedUser) {
      // Validate password if set and provided
      if (matchedUser.password && loginPassword && loginPassword.trim() !== '' && matchedUser.password.toLowerCase() !== loginPassword.trim().toLowerCase()) {
        setError('Incorrect password. Please check and try again.');
        return;
      }

      if (matchedUser.status === 'waitlisted') {
        setWaitlistStateName(matchedUser.state || roundState?.activeState || activeState);
        setIsWaitlisted(true);
        return;
      }

      // Ensure signing in activates account so user lands directly in UserDashboard!
      matchedUser.status = 'active';
      saveUsers(users);
      setCurrentUser(matchedUser);
      onLoginSuccess(matchedUser);
    } else {
      // If account is not found, automatically initialize user profile with smart gender detection
      const isEmail = cleanInput.includes('@');
      const cleanName = isEmail 
        ? cleanInput.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : cleanInput.replace(/\b\w/g, l => l.toUpperCase());

      const isLikelyFemale = /^(sneha|ananya|sophia|rhea|priya|pooja|neha|kavya|simran|ritu|aarti|divya|aastha|muskan|ishita|tanya|isha|khushi|aditi|shreya|riya|sakshi|megha|shruti|radhika|divya|swati|tanvi|diksha|kajal|twinkle|payal|sonam|deepika|aanya)/i.test(cleanQuery);
      const userGender = isLikelyFemale ? 'female' : 'male';

      const newUser = {
        id: `user_${cleanInput.replace(/[^a-zA-Z0-9]/g, '') || Date.now()}`,
        name: cleanName || 'User',
        email: isEmail ? cleanInput : `${cleanInput.toLowerCase()}@cupid.com`,
        password: loginPassword || '123456',
        gender: userGender,
        state: roundState?.activeState || activeState || 'Delhi NCR',
        plan: userGender === 'female' ? 'free' : 'elite',
        bio: 'Looking for a genuine connection on Cupid',
        occupation: 'Student / Professional',
        income: '12 LPA',
        university: 'Bennett University',
        branch: 'Computer Science (CSE)',
        avatar: userGender === 'female'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        interests: ['Travel', 'Music', 'Fitness'],
        contact: '@user_insta',
        likedProfiles: [],
        receivedLikes: [],
        matches: [],
        declinedMatches: [],
        suggestedMatches: [],
        status: 'active'
      };

      users.push(newUser);
      saveUsers(users);
      setCurrentUser(newUser);
      onLoginSuccess(newUser);
    }
  };

  // 1. INTRO / CINEMATIC VIDEO LOADING SCREEN ON LOAD
  if (showSplash) {
    return (
      <CinematicLoadingScreen
        onComplete={() => setShowSplash(false)}
        activeState={activeState}
        duration={3800}
      />
    );
  }

  if (!showLoginInPhone) {
    return (
      <div className="flex-1 flex flex-col justify-between p-5 h-full relative select-none overflow-hidden bg-transparent">
        

        {/* Cupid's Arrow & Shockwave Overlay on Swipe */}
        {isUnlocking && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-[#FF2E79]/30 animate-cupid-ripple"></div>
            <div className="absolute w-24 h-24 rounded-full bg-[#FF2E79]/20 animate-cupid-ripple-delayed"></div>
            <div className="absolute top-1/2 left-0 w-full animate-cupid-arrow">
              <div className="flex items-center gap-2">
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#FF2E79] to-[#FF2E79] rounded-full shadow-[0_0_12px_#FF2E79]"></div>
                <div className="p-2 bg-[#FF2E79] text-white rounded-full shadow-[0_0_20px_#FF2E79]">
                  <Heart className="w-6 h-6 fill-white text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Header Row */}
        <div className="pt-1 text-left">
          <div className="flex items-center justify-between mb-2">
            <CupidLogo size="sm" showText={true} textColor="dark" textSubtitle={`${liveState} • ROUND ${liveRoundNum}`} />
            <button
              onClick={() => setShowSplash(true)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
            >
              Replay Intro
            </button>
          </div>

          <h1 className="text-[34px] font-black tracking-tight text-slate-900 leading-[1.14]">
            Your Perfect<br />
            Match is Just a<br />
            <span className="inline-flex items-center gap-2 mt-1">
              <span>Tap</span>
              <span className="bg-[#FF2E79] text-white px-3 py-0.5 rounded-[7px] text-[31px] font-black -rotate-2 shadow-sm">
                Away
              </span>
            </span>
          </h1>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* PHOTO COLLAGE — matching reference image cluster layout          */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative w-full flex-1 flex items-center justify-center my-2">
          {/* Fluid white organic blob behind circles */}
          <div
            className="absolute"
            style={{
              width: 280,
              height: 280,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%',
              boxShadow: '0 16px 40px -10px rgba(255, 46, 121, 0.1)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Outer container — fixed 290×280 for precise positioning */}
          <div className="relative" style={{ width: 290, height: 280 }}>

            {/* TOP-LEFT: Photo — blonde woman in red blazer */}
            <div className="absolute" style={{ width: 102, height: 102, top: 0, left: 10 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-1">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* MID-LEFT: Photo — woman in dark beret */}
            <div className="absolute" style={{ width: 96, height: 96, top: 94, left: 0 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-2">
                <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* CENTER: Photo — brunette in red knit sweater */}
            <div className="absolute" style={{ width: 112, height: 112, top: 84, left: '50%', marginLeft: -56 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-2xl pop-circle-3">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* MID-RIGHT: Photo — woman with red heart balloons */}
            <div className="absolute" style={{ width: 96, height: 96, top: 94, right: 4 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-4">
                <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* BOTTOM-RIGHT: Photo — woman in scarf with red rose */}
            <div className="absolute" style={{ width: 96, height: 96, bottom: 4, right: 20 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-5">
                <img src="https://images.unsplash.com/photo-1509783236416-c9ad59bae472?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* TOP-RIGHT: White Question Mark Bubble ? */}
            <div className="absolute" style={{ width: 96, height: 96, top: 8, right: 14 }}>
              <div className="w-full h-full rounded-full bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex items-center justify-center border-[3px] border-white qmark-right">
                <span className="font-black text-[38px] text-slate-900 leading-none select-none">?</span>
              </div>
            </div>

            {/* BOTTOM-LEFT: White Question Mark Bubble ? */}
            <div className="absolute" style={{ width: 92, height: 92, bottom: 2, left: 28 }}>
              <div className="w-full h-full rounded-full bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex items-center justify-center border-[3px] border-white qmark-left">
                <span className="font-black text-[38px] text-slate-900 leading-none select-none">?</span>
              </div>
            </div>

          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* GET STARTED BUTTON / SWIPE-TO-UNLOCK TRACK                       */}
        {/* ---------------------------------------------------------------- */}
        <div>
          {/* Swipe / Click track container */}
          <div
            onClick={triggerCupidUnlock}
            className="relative w-full h-[58px] bg-[#FF2E79] rounded-full overflow-hidden shadow-[0_10px_25px_-5px_rgba(255,46,121,0.45)] cursor-pointer"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ userSelect: 'none' }}
          >
            {/* Sliding fill overlay — shows progress */}
            <div
              className="absolute inset-0 rounded-full bg-[#e02469] transition-none pointer-events-none"
              style={{
                width: `${Math.min(100, (dragX / maxDrag) * 100 + 20)}%`,
                opacity: 0.35,
              }}
            />

            {/* Draggable heart thumb (White circle with pink heart) */}
            <div
              className="absolute top-[5px] left-[5px] w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center shadow-md z-10 cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${dragX}px)`,
                transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <Heart className="w-5 h-5 fill-[#FF2E79] text-[#FF2E79]" />
            </div>

            {/* Label text: Get Started    >>> */}
            <div
              className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none"
              style={{ opacity: Math.max(0, 1 - dragX / (maxDrag * 0.5)) }}
            >
              <span className="font-bold text-[15px] tracking-wide text-white pl-12">
                Get Started
              </span>
              <span className="text-white/90 font-bold text-sm tracking-widest">
                &gt;&gt;&gt;
              </span>
            </div>

            {/* "Release!" text appears near end of swipe */}
            {dragX > maxDrag * 0.6 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-black text-[14px] text-white tracking-wider animate-pulse">
                  Release to Start
                </span>
              </div>
            )}
          </div>

          {/* Sign In link */}
          <div className="text-center mt-3 select-none">
            <button
              onClick={() => { setShowLoginInPhone(true); setIsLogin(true); }}
              className="text-xs font-semibold text-slate-500 hover:text-[#FF2E79] transition-colors cursor-pointer"
            >
              Already registered? <span className="text-[#FF2E79] font-bold underline ml-0.5">Sign In</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // LOGIN / REGISTER / WAITLIST FORM VIEW (Exact Copy of Reference UI Screenshot - Squish-Proof Layout)
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-5 h-full overflow-y-auto no-scrollbar bg-gradient-to-b from-[#FFF0F5] via-[#FFF8FA] to-white relative z-10 select-none">
      
      {/* Top Header Row with Back Button, Centered Logo & Right Cursive Tagline */}
      <div className="shrink-0 relative w-full flex items-center justify-between pt-1 pb-3 mb-2 min-h-[56px]">
        {/* Floating Back Arrow */}
        <button 
          onClick={() => { setShowLoginInPhone(false); setError(''); }}
          className="shrink-0 w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all border border-pink-100/80 cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Logo */}
        <div className="shrink-0 flex flex-col items-center justify-center text-center">
          <CupidLogo size="sm" showText={true} textColor="dark" textSubtitle={`${liveState} • ROUND ${liveRoundNum}`} />
        </div>

        {/* Decorative Top-Right Cursive Handwriting */}
        <div className="shrink-0 text-right pointer-events-none select-none">
          <span className="font-cursive text-[#E085A3] font-medium text-[14px] sm:text-[16px] leading-tight block rotate-[-4deg]">
            Good People<br />Brighter Stories
          </span>
        </div>
      </div>

      {isWaitlisted ? (
        /* Waitlisted Display */
        <div className="shrink-0 text-center py-6 flex-1 flex flex-col justify-center items-center bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-[#FF2E79] rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-[#FF2E79] bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              State Round Pre-Registration
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2 font-display">
              Round Live for {activeState}
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 px-2 leading-relaxed font-medium">
              The live round active right now is for <strong className="text-[#FF2E79]">{activeState}</strong>. Your state round for <strong className="text-slate-800">{waitlistStateName}</strong> starts in <strong className="text-[#FF2E79]">~{getStateUpcomingMins(waitlistStateName)} minutes</strong>!
            </p>
          </div>
          
          <div className="bg-pink-50/80 border border-pink-100 rounded-2xl p-3.5 w-full text-left space-y-1">
            <span className="text-[9px] font-extrabold text-[#FF2E79] uppercase tracking-wider block">Automatic Notification Scheduled</span>
            <span className="text-xs font-semibold text-slate-700 block">
              10-Min Pre-Alert & Live Push Notification set for your phone!
            </span>
          </div>

          <div className="w-full space-y-2 pt-2">
            <button 
              onClick={() => { setIsWaitlisted(false); setIsLogin(true); }}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full cursor-pointer transition-colors shadow-md"
            >
              Sign In to Existing Account
            </button>
            <button 
              onClick={() => { setIsWaitlisted(false); setIsLogin(false); }}
              className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full cursor-pointer transition-colors"
            >
              Change Selected State
            </button>
          </div>
        </div>
      ) : (
        /* Main Card Container */
        <div className="shrink-0 flex-1 flex flex-col justify-between my-auto w-full max-w-md mx-auto">
          <div className="shrink-0 bg-white rounded-[28px] p-5 sm:p-6 border border-slate-100/90 shadow-[0_16px_40px_rgba(255,46,121,0.06)]">
            
            {/* Segmented Pill Tabs */}
            <div className="shrink-0 bg-[#F6F6FA] p-1 rounded-[22px] flex gap-1 mb-4 border border-slate-100/70">
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`shrink-0 flex-1 py-3 rounded-[18px] text-xs sm:text-sm font-extrabold transition-all text-center cursor-pointer ${
                  !isLogin 
                    ? 'bg-[#FF2E79] text-white shadow-[0_4px_12px_rgba(255,46,121,0.3)]' 
                    : 'text-[#64748B] hover:text-slate-800 font-bold'
                }`}
              >
                Create Profile
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`shrink-0 flex-1 py-3 rounded-[18px] text-xs sm:text-sm font-extrabold transition-all text-center cursor-pointer ${
                  isLogin 
                    ? 'bg-[#FF2E79] text-white shadow-[0_4px_12px_rgba(255,46,121,0.3)]' 
                    : 'text-[#64748B] hover:text-slate-800 font-bold'
                }`}
              >
                Sign In
              </button>
            </div>

            {error && (
              <div className="shrink-0 mb-3.5 bg-rose-50 border border-rose-200 text-rose-600 px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isLogin ? (
              /* LOGIN form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 text-left mb-1.5 block">Email Address or User ID *</label>
                  <div className="shrink-0 relative flex items-center bg-[#F8F9FD] border border-slate-200/80 rounded-2xl h-13 min-h-[52px] px-4 focus-within:bg-white focus-within:border-[#FF2E79] focus-within:ring-3 focus-within:ring-[#FF2E79]/12 transition-all group">
                    <Mail className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#FF2E79] shrink-0 mr-3 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                      placeholder="e.g. rahul_verma@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 text-left mb-1.5 block">Password *</label>
                  <div className="shrink-0 relative flex items-center bg-[#F8F9FD] border border-slate-200/80 rounded-2xl h-13 min-h-[52px] px-4 focus-within:bg-white focus-within:border-[#FF2E79] focus-within:ring-3 focus-within:ring-[#FF2E79]/12 transition-all group">
                    <Lock className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#FF2E79] shrink-0 mr-3 transition-colors pointer-events-none" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none pr-8"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Standard Height Hot Pink Pill Submit Button */}
                <button 
                  type="submit" 
                  className="shrink-0 w-full h-13 min-h-[52px] bg-[#FF2E79] hover:bg-[#e02469] text-white font-extrabold text-xs sm:text-sm tracking-wide rounded-full flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,46,121,0.35)] transition-all active:scale-[0.98] cursor-pointer mt-5 mb-1"
                >
                  <span>Access Match Dashboard</span>
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>
              </form>
            ) : (
              /* REGISTER form */
              <form onSubmit={handleRegister} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-800 text-left mb-1.5 block">Your Full Name *</label>
                  <div className="shrink-0 relative flex items-center bg-[#F8F9FD] border border-slate-200/80 rounded-2xl h-13 min-h-[52px] px-4 focus-within:bg-white focus-within:border-[#FF2E79] focus-within:ring-3 focus-within:ring-[#FF2E79]/12 transition-all group">
                    <User className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#FF2E79] shrink-0 mr-3 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                      placeholder="e.g. Rahul Sharma"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-xs font-bold text-slate-800 text-left mb-1.5 block">Email Address *</label>
                  <div className="shrink-0 relative flex items-center bg-[#F8F9FD] border border-slate-200/80 rounded-2xl h-13 min-h-[52px] px-4 focus-within:bg-white focus-within:border-[#FF2E79] focus-within:ring-3 focus-within:ring-[#FF2E79]/12 transition-all group">
                    <Mail className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#FF2E79] shrink-0 mr-3 transition-colors pointer-events-none" />
                    <input
                      type="email"
                      className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
                      placeholder="yourname@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Create Password */}
                <div>
                  <label className="text-xs font-bold text-slate-800 text-left mb-1.5 block">Create Password *</label>
                  <div className="shrink-0 relative flex items-center bg-[#F8F9FD] border border-slate-200/80 rounded-2xl h-13 min-h-[52px] px-4 focus-within:bg-white focus-within:border-[#FF2E79] focus-within:ring-3 focus-within:ring-[#FF2E79]/12 transition-all group">
                    <Lock className="w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#FF2E79] shrink-0 mr-3 transition-colors pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="w-full bg-transparent border-none text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none pr-8"
                      placeholder="Create a secure password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Tactile Gender Selector Cards */}
                <div>
                  <label className="text-xs font-bold text-slate-800 text-left mb-1.5 block">Gender *</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'male', label: 'Male' },
                      { id: 'female', label: 'Female' },
                      { id: 'others', label: 'Other' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setRegGender(g.id)}
                        className={`shrink-0 h-12 min-h-[48px] rounded-2xl text-xs sm:text-sm font-extrabold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                          regGender === g.id
                            ? 'bg-[#FFF0F5] text-[#FF2E79] border border-[#FF2E79] shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm font-bold">{g.icon}</span>
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Warning Notice for Gender Lock */}
                  <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-left flex items-start gap-2 shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-amber-800 leading-snug">
                      <strong className="font-extrabold text-amber-900">Warning:</strong> Gender selection is permanent and locked after registration for safety &amp; verified matchmaking.
                    </p>
                  </div>
                </div>

                {/* State Round Selector */}
                <div className="shrink-0">
                  <label className="text-xs font-bold text-slate-800 text-left mb-1.5 block">Active State Round *</label>
                  <CustomSelect
                    value={regState}
                    onChange={(val) => setRegState(val)}
                    options={STATES_LIST}
                    activeMatchValue={activeState}
                    activeBadgeText="Live Round"
                    icon={MapPin}
                    placeholder="Select active state..."
                  />
                </div>

                {/* Standard Height Hot Pink Pill Submit Button (Matches reference image) */}
                <button 
                  type="submit" 
                  className="shrink-0 w-full h-13 min-h-[52px] bg-[#FF2E79] hover:bg-[#e02469] text-white font-extrabold text-xs sm:text-sm tracking-wide rounded-full flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,46,121,0.35)] transition-all active:scale-[0.98] cursor-pointer mt-5 mb-1"
                >
                  <span>Continue to Round Setup</span>
                  <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>
              </form>
            )}
          </div>

          {/* Footer Text */}
          <div className="shrink-0 pt-4 pb-1 text-center space-y-1">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase block">
              SAFETY  •  PRIVACY  •  REAL CONNECTIONS
            </span>
            <button
              type="button"
              onClick={() => onLoginSuccess(null, 'admin')}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-700 underline cursor-pointer"
            >
              Admin Console Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
