import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getUsers, saveUsers, setCurrentUser, updateUser } from '../utils/storage';
import { STATES_LIST } from '../data/mockData';
import { 
  Heart, 
  Sparkles, 
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
  Check
} from 'lucide-react';
import CinematicLoadingScreen from './CinematicLoadingScreen';
import CupidLogo from './CupidLogo';
import CustomSelect from './CustomSelect';

export default function AuthPage({ onLoginSuccess, activeState, showLoginInPhone, setShowLoginInPhone }) {
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');
  
  // Intro Splash screen state
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

  // Cupid-Themed Unlock Trigger with Arrow & Shockwave
  const triggerCupidUnlock = () => {
    setIsUnlocking(true);
    setDragX(maxDrag);
    setIsLogin(false); // Open registration form on Get Started swipe

    setTimeout(() => {
      setShowLoginInPhone(true);
      setIsUnlocking(false);
      setDragX(0);
    }, 700);
  };

  // Handle standard registration (Guaranteed forward navigation)
  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    
    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();

    if (!cleanName || !cleanEmail) {
      setError('Please fill in your name and email address.');
      return;
    }

    const isStateActive = regState.toLowerCase() === activeState.toLowerCase();
    const users = getUsers();
    const existingIndex = users.findIndex(u => 
      u.id === `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}` || 
      (u.email && u.email.toLowerCase() === cleanEmail.toLowerCase())
    );

    let userToProceed;

    if (existingIndex !== -1) {
      // If user already exists in storage, update with newly entered details and proceed
      users[existingIndex] = {
        ...users[existingIndex],
        name: cleanName || users[existingIndex].name,
        password: regPassword || users[existingIndex].password || '123456',
        gender: regGender || users[existingIndex].gender,
        state: regState || users[existingIndex].state,
        status: isStateActive ? 'onboarding' : 'waitlisted'
      };
      userToProceed = users[existingIndex];
      saveUsers(users);
    } else {
      // Create new user profile
      const newUser = {
        id: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
        name: cleanName,
        email: cleanEmail,
        password: regPassword || '123456',
        gender: regGender,
        state: regState,
        plan: 'elite',
        bio: '',
        occupation: '',
        income: '',
        avatar: regGender === 'male' 
          ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' 
          : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        interests: [],
        contact: '',
        likedProfiles: [],
        receivedLikes: [],
        matches: [],
        declinedMatches: [],
        suggestedMatches: [],
        status: isStateActive ? 'onboarding' : 'waitlisted'
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
  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = loginEmail.trim();

    if (!cleanInput) {
      setError('Please enter your email or User ID.');
      return;
    }

    const users = getUsers();
    const matchedUser = users.find(u => 
      (u.email && u.email.toLowerCase() === cleanInput.toLowerCase()) || 
      (u.id && u.id.toLowerCase() === cleanInput.toLowerCase()) ||
      (u.name && u.name.toLowerCase() === cleanInput.toLowerCase())
    );
    
    if (matchedUser) {
      // Validate password if set
      if (matchedUser.password && loginPassword && matchedUser.password !== loginPassword) {
        setError('Incorrect password. Please check and try again.');
        return;
      }

      if (matchedUser.status === 'waitlisted') {
        setWaitlistStateName(matchedUser.state);
        setIsWaitlisted(true);
        return;
      }
      setCurrentUser(matchedUser);
      onLoginSuccess(matchedUser);
    } else {
      setError('Account not found. Please create a new profile.');
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
            <div className="absolute w-24 h-24 rounded-full bg-[#FF2D55]/30 animate-cupid-ripple"></div>
            <div className="absolute w-24 h-24 rounded-full bg-[#FF2D55]/20 animate-cupid-ripple-delayed"></div>
            <div className="absolute top-1/2 left-0 w-full animate-cupid-arrow">
              <div className="flex items-center gap-2">
                <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#FF2D55] to-[#FF2D55] rounded-full shadow-[0_0_12px_#FF2D55]"></div>
                <div className="p-2 bg-[#FF2D55] text-white rounded-full shadow-[0_0_20px_#FF2D55]">
                  <Heart className="w-6 h-6 fill-white text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Header Row */}
        <div className="pt-2 text-left">
          <div className="flex items-center justify-between mb-3">
            <CupidLogo size="sm" showText={true} textColor="dark" textSubtitle={`${activeState} • Round 1`} />
            <button
              onClick={() => setShowSplash(true)}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
            >
              Replay Intro
            </button>
          </div>

          <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Your Perfect<br />
            Match is Just a<br />
            <span className="inline-flex items-center gap-2 mt-1">
              <span>Tap</span>
              <span className="bg-[#FF2D55] text-white px-3 py-0.5 rounded-[6px] text-[32px] font-black -rotate-2 shadow-sm">
                Away
              </span>
            </span>
          </h1>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* PHOTO COLLAGE — exactly matching reference image cluster layout  */}
        {/* 6 circles: top-left photo, top-right ?, mid-left photo,          */}
        {/* mid-center photo, mid-right photo, bottom-left ?, bottom-right ? */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative w-full flex-1 flex items-center justify-center">
          {/* Fluid white organic blob behind circles */}
          <div
            className="absolute"
            style={{
              width: 280,
              height: 280,
              background: 'rgba(255,255,255,0.55)',
              borderRadius: '62% 38% 46% 54% / 60% 44% 56% 40%',
              filter: 'blur(2px)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          {/* Outer container — fixed 290×280 for precise positioning */}
          <div className="relative" style={{ width: 290, height: 280 }}>

            {/* TOP-LEFT: Photo — pops 1st */}
            <div className="absolute" style={{ width: 102, height: 102, top: 0, left: 10 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-1">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* MID-LEFT: Photo — pops 2nd */}
            <div className="absolute" style={{ width: 96, height: 96, top: 94, left: 0 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-2">
                <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* CENTER: Photo — pops 3rd (largest, focal) */}
            <div className="absolute" style={{ width: 112, height: 112, top: 84, left: '50%', marginLeft: -56 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-2xl pop-circle-3">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* MID-RIGHT: Photo — pops 4th */}
            <div className="absolute" style={{ width: 96, height: 96, top: 94, right: 4 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-4">
                <img src="https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* BOTTOM-RIGHT: Photo — pops 5th */}
            <div className="absolute" style={{ width: 96, height: 96, bottom: 4, right: 20 }}>
              <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl pop-circle-5">
                <img src="https://images.unsplash.com/photo-1509783236416-c9ad59bae472?w=400&auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* TOP-RIGHT: ? — emerges at 1.2s from center, then naughty shake */}
            <div className="absolute" style={{ width: 96, height: 96, top: 8, right: 14 }}>
              <div className="w-full h-full rounded-full bg-white shadow-lg flex items-center justify-center border-[3px] border-white qmark-right">
                <span className="font-black text-[40px] text-slate-900 leading-none select-none">?</span>
              </div>
            </div>

            {/* BOTTOM-LEFT: ? — emerges at 1.5s from center, then naughty shake */}
            <div className="absolute" style={{ width: 92, height: 92, bottom: 2, left: 28 }}>
              <div className="w-full h-full rounded-full bg-white shadow-lg flex items-center justify-center border-[3px] border-white qmark-left">
                <span className="font-black text-[40px] text-slate-900 leading-none select-none">?</span>
              </div>
            </div>

          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* SWIPE-TO-UNLOCK TRACK (Not a click button)                        */}
        {/* ---------------------------------------------------------------- */}
        <div>
          {/* Swipe track container */}
          <div
            className="relative w-full h-[60px] bg-[#FF2D55] rounded-full overflow-hidden shadow-[0_10px_25px_-5px_rgba(255,45,85,0.45)]"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ userSelect: 'none' }}
          >
            {/* Sliding fill overlay — shows progress */}
            <div
              className="absolute inset-0 rounded-full bg-[#e02447] transition-none"
              style={{
                width: `${Math.min(100, (dragX / maxDrag) * 100 + 20)}%`,
                opacity: 0.4,
              }}
            />

            {/* Draggable heart thumb */}
            <div
              className="absolute top-[6px] left-[6px] w-[48px] h-[48px] bg-white rounded-full flex items-center justify-center shadow-md z-10 cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${dragX}px)`,
                transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <Heart className="w-5 h-5 fill-[#FF2D55] text-[#FF2D55]" />
            </div>

            {/* Label text — fades as you swipe */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ opacity: Math.max(0, 1 - dragX / (maxDrag * 0.5)) }}
            >
              <span className="font-bold text-[15px] tracking-wide text-white pl-12">
                Get Started  »»
              </span>
            </div>

            {/* "Release!" text appears near end of swipe */}
            {dragX > maxDrag * 0.6 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-black text-[14px] text-white tracking-wider animate-pulse">
                  Release! ♥
                </span>
              </div>
            )}
          </div>

          {/* Sign In link */}
          <div className="text-center mt-3 select-none">
            <button
              onClick={() => { setShowLoginInPhone(true); setIsLogin(true); }}
              className="text-xs font-semibold text-slate-500 hover:text-[#FF2D55] transition-colors cursor-pointer"
            >
              Already registered? <span className="text-[#FF2D55] font-bold underline ml-0.5">Sign In</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // LOGIN / REGISTER / WAITLIST FORM VIEW (High Contrast Ultra-Legible Card)
  return (
    <div className="flex-1 flex flex-col p-4 h-full justify-between animate-slide-up relative z-10 select-none overflow-y-auto">
      
      {/* Top Header Row with Centered Logo & Absolute Left Back Button */}
      <div className="relative flex items-center justify-center pb-2.5 border-b border-slate-100 mb-3 min-h-[36px]">
        <button 
          onClick={() => { setShowLoginInPhone(false); setError(''); }}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <CupidLogo size="xs" showText={true} textColor="dark" textSubtitle={`${activeState} • Round 1`} />
      </div>

      {isWaitlisted ? (
        /* Waitlisted Display */
        <div className="text-center py-6 flex-1 flex flex-col justify-center items-center bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="w-14 h-14 bg-pink-100 text-[#FF2D55] rounded-full flex items-center justify-center mb-4 shadow-sm">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1 font-display">Round is Inactive</h2>
          <p className="text-xs text-slate-500 mb-6 px-2 leading-relaxed font-medium">
            The active round today is for <strong className="text-[#FF2D55]">{activeState}</strong>. 
            Since you are from <strong className="text-slate-800">{waitlistStateName}</strong>, you've been placed on our priority waitlist.
          </p>
          
          <div className="bg-pink-50/80 border border-pink-100 rounded-xl p-3 mb-6 w-full text-left">
            <span className="text-[9px] font-extrabold text-[#FF2D55] uppercase tracking-wider block mb-0.5">Status</span>
            <span className="text-xs font-semibold text-slate-700">Waitlist registered. We will alert you on round start!</span>
          </div>
          
          <button 
            onClick={() => { setIsWaitlisted(false); setIsLogin(true); }}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full cursor-pointer transition-colors"
          >
            Go Back
          </button>
        </div>
      ) : (
        /* Main Card Container */
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_16px_40px_-10px_rgba(255,45,85,0.12)]">
            
            {/* Interactive Segmented Pill Tabs */}
            <div className="bg-slate-100/80 p-1 rounded-full flex gap-1 mb-4 border border-slate-200/60">
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition-all text-center cursor-pointer ${
                  !isLogin 
                    ? 'bg-[#FF2D55] text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Create Profile
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 rounded-full text-xs font-extrabold transition-all text-center cursor-pointer ${
                  isLogin 
                    ? 'bg-[#FF2D55] text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
            </div>

            {error && (
              <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-600 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isLogin ? (
              /* LOGIN form */
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="form-label text-left mb-1">Email or User ID</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      className="form-input form-input-icon pl-11"
                      placeholder="e.g. rahul_verma@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label text-left mb-1">Password / Security PIN</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="form-input form-input-icon-both pl-11 pr-11"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full h-12 bg-[#FF2D55] hover:bg-[#e02447] text-white font-extrabold text-xs tracking-wide rounded-full flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,45,85,0.35)] transition-transform active:scale-[0.98] cursor-pointer mt-2"
                >
                  <span>Access Match Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* REGISTER form */
              <form onSubmit={handleRegister} className="space-y-2.5">
                
                {/* Full Name */}
                <div>
                  <label className="form-label text-left mb-1">Your Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      className="form-input form-input-icon pl-11"
                      placeholder="e.g. Aditya Chauhan"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="form-label text-left mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      className="form-input form-input-icon pl-11"
                      placeholder="yourname@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Create Password */}
                <div>
                  <label className="form-label text-left mb-1">Create Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="form-input form-input-icon-both pl-11 pr-11"
                      placeholder="Create a secure password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Tactile Gender Selector Cards */}
                <div>
                  <label className="form-label text-left mb-1">Gender *</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'male', label: 'Male', icon: '♂' },
                      { id: 'female', label: 'Female', icon: '♀' },
                      { id: 'others', label: 'Other', icon: '⚧' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setRegGender(g.id)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                          regGender === g.id
                            ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{g.icon}</span>
                        <span>{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* State Round Selector */}
                <div>
                  <label className="form-label text-left mb-1">Active State Round *</label>
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

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full h-12 bg-[#FF2D55] hover:bg-[#e02447] text-white font-extrabold text-xs tracking-wide rounded-full flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,45,85,0.35)] transition-transform active:scale-[0.98] cursor-pointer mt-3"
                >
                  <span>Continue to Round Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
