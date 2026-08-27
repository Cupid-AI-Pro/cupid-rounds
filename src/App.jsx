import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import OnboardingForm from './components/OnboardingForm';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import CinematicLoadingScreen from './components/CinematicLoadingScreen';
import { initializeStorage, getCurrentUser, getActiveState, logout, setCurrentUser } from './utils/storage';
import { Sparkles, Phone, ShieldCheck, Film } from 'lucide-react';

export default function App() {
  const [currentUser, setLocalCurrentUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false); // Used for mobile viewport switching
  const [activeState, setActiveState] = useState('Delhi NCR');
  const [showLoginInPhone, setShowLoginInPhone] = useState(false); // Controls starting screen in phone
  const [isPlayingIntro, setIsPlayingIntro] = useState(false); // Video intro overlay state

  useEffect(() => {
    // Seed and initialize localStorage
    initializeStorage();
    
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      setLocalCurrentUser(user);
    }
    
    // Check current active matchmaking round state
    const state = getActiveState();
    setActiveState(state);
  }, []);

  const handleLoginSuccess = (user) => {
    setLocalCurrentUser(user);
    setShowLoginInPhone(true);
  };

  const handleLogout = () => {
    logout();
    setLocalCurrentUser(null);
    setShowLoginInPhone(false);
  };

  const handleOnboardingComplete = (updatedUser) => {
    setLocalCurrentUser(updatedUser);
  };

  const handleUpdateUser = (updatedUser) => {
    setLocalCurrentUser(updatedUser);
  };

  const handleStateChange = (newState) => {
    setActiveState(newState);
  };

  const handlePlayIntroVideo = () => {
    setIsPlayingIntro(true);
    setIsAdminMode(false);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col">
      
      {/* Decorative background grid and ambient glows */}
      <div className="grid-lines"></div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full bg-pink-300/10 blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-violet-300/10 blur-3xl"></div>
      </div>

      {/* Header bar */}
      <Navbar 
        currentUser={currentUser} 
        isAdminMode={isAdminMode} 
        setIsAdminMode={setIsAdminMode} 
        onLogout={handleLogout}
        activeState={activeState}
        onPlayIntroVideo={handlePlayIntroVideo}
      />

      {/* Main Sandbox Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:px-8 grid lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* LEFT/CENTER PANEL: Simulated Smartphone (60% width on large screens) */}
        <div className={`lg:col-span-7 flex flex-col items-center justify-center ${
          isAdminMode ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="text-center mb-4 hidden lg:block">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 border border-pink-200 text-[10px] font-extrabold text-rose-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
              <span>Interactive Smartphone Simulation</span>
            </span>
            <p className="text-xs text-slate-400">Interact with the phone below. Updates sync instantly with the Admin Panel.</p>
          </div>

          {/* Smartphone Container */}
          <div className="phone-mockup">
            {/* Notch */}
            <div className="phone-notch"></div>
            
            {/* Status bar */}
            <div className="phone-header-overlay">
              <span>9:41</span>
              <div className="flex items-center gap-1.5 text-slate-900">
                {/* Cellular Signal Icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 20h.01" />
                  <path d="M7 20v-4" />
                  <path d="M12 20v-8" />
                  <path d="M17 20V8" />
                  <path d="M22 20V4" />
                </svg>
                {/* Wifi Icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                </svg>
                {/* Battery Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
                  <line x1="22" y1="11" x2="22" y2="13" />
                </svg>
              </div>
            </div>

            {/* Screen Content Wrapper */}
            <div className="phone-screen">
              {isPlayingIntro ? (
                <CinematicLoadingScreen 
                  onComplete={() => setIsPlayingIntro(false)} 
                  activeState={activeState} 
                  duration={3800} 
                />
              ) : !currentUser ? (
                <AuthPage 
                  onLoginSuccess={handleLoginSuccess} 
                  activeState={activeState}
                  showLoginInPhone={showLoginInPhone}
                  setShowLoginInPhone={setShowLoginInPhone}
                />
              ) : currentUser.status === 'onboarding' ? (
                <OnboardingForm 
                  user={currentUser} 
                  onComplete={handleOnboardingComplete}
                />
              ) : (
                <UserDashboard 
                  user={currentUser} 
                  onUpdateUser={handleUpdateUser}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Admin Dashboard Console (40% width on large screens) */}
        <div className={`lg:col-span-5 ${
          isAdminMode ? 'block' : 'hidden lg:block'
        }`}>
          <div className="text-center mb-4 lg:hidden">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </span>
          </div>

          <AdminDashboard 
            activeState={activeState} 
            onStateChange={handleStateChange}
          />
        </div>

      </main>
      
      {/* Mobile-only View Switcher Bar */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex justify-center">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 p-1.5 rounded-full shadow-xl flex gap-1">
          <button
            onClick={() => setIsAdminMode(false)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              !isAdminMode 
                ? 'bg-rose-500 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Mobile App</span>
          </button>
          <button
            onClick={() => setIsAdminMode(true)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
              isAdminMode 
                ? 'bg-rose-500 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Console</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}
