import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import OnboardingForm from './components/OnboardingForm';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import CinematicLoadingScreen from './components/CinematicLoadingScreen';
import { initializeStorage, getCurrentUser, getActiveState, logout, setCurrentUser } from './utils/storage';
import { Sparkles, Phone, ShieldCheck, ArrowLeft, Globe } from 'lucide-react';

export default function App() {
  const [currentUser, setLocalCurrentUser] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('step') || params.get('reset')) {
      return {
        id: 'test_onboarding_user',
        name: 'Test User',
        email: 'test@cupid.com',
        gender: 'male',
        status: 'onboarding'
      };
    }
    return getCurrentUser();
  });

  const [activeState, setActiveState] = useState('Delhi NCR');
  const [showLoginInPhone, setShowLoginInPhone] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  
  // Default to landing page for web visitors, but open matchmaking app directly for APK, PWA or saved users!
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('step') || params.get('reset')) return 'app';
    if (params.get('view') === 'admin') return 'admin';
    if (params.get('view') === 'app') return 'app';
    if (params.get('view') === 'landing') return 'landing';

    // 1. Native Android APK detection (Capacitor / Android WebView)
    const isCapacitorNative = Boolean(
      (typeof window !== 'undefined' && window.Capacitor) ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:' ||
      /wv|Capacitor/i.test(window.navigator.userAgent)
    );

    // 2. Standalone / Installed WebAPK detection
    const isInstalledApp = Boolean(
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      params.get('source') === 'pwa'
    );

    if (isCapacitorNative || isInstalledApp) {
      return 'app'; // Directly open app for APK / PWA users
    }

    const savedUser = getCurrentUser();
    if (savedUser) return 'app';

    // Default for web visitors is LANDING PAGE
    return 'landing';
  });

  useEffect(() => {
    initializeStorage();
    
    const user = getCurrentUser();
    if (user) {
      setLocalCurrentUser(user);
    }
    
    const state = getActiveState();
    setActiveState(state);
  }, []);

  const handleLoginSuccess = (user, targetView = 'app') => {
    setLocalCurrentUser(user);
    setShowLoginInPhone(true);
    setCurrentView(targetView || 'app');
  };

  const handleLogout = () => {
    logout();
    setLocalCurrentUser(null);
    setShowLoginInPhone(false);
    setCurrentView('landing');
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
  };

  // 1. LANDING PAGE VIEW (Default for web visitors)
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onLaunchApp={() => setCurrentView('app')}
        onOpenAdmin={() => setCurrentView('admin')}
        activeState={activeState}
      />
    );
  }

  // 2. ADMIN DASHBOARD VIEW
  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Landing Page</span>
            </button>

            <button
              onClick={() => setCurrentView('app')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF2E79] hover:bg-rose-600 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Open User App</span>
            </button>
          </div>

          <AdminDashboard 
            activeState={activeState} 
            onStateChange={handleStateChange}
          />
        </div>
      </div>
    );
  }

  // 3. USER APP VIEW: Fullscreen Pink Pastel Experience on Mobile, Sleek Mobile Frame on Desktop
  return (
    <div className="min-h-screen w-full bg-[#FFEBF2] md:bg-slate-100 flex flex-col justify-center items-center select-none overflow-x-hidden relative">
      
      {/* Top Navigation bar (Desktop only) */}
      <div className="hidden md:flex w-full max-w-md items-center justify-between py-2 px-4 text-xs font-bold text-slate-500 z-20">
        <button 
          onClick={() => setCurrentView('landing')} 
          className="flex items-center gap-1.5 hover:text-[#FF2E79] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Landing Website</span>
        </button>

        <button 
          onClick={() => setCurrentView('admin')} 
          className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Admin Console</span>
        </button>
      </div>

      {/* Main App Canvas Container:
          - On Mobile: 100% full screen height, borderless, pink pastel background
          - On Desktop (md:): Clean centered 420px phone frame mockup */}
      <div className="w-full max-w-md h-[100dvh] md:h-[844px] md:max-h-[92vh] md:rounded-[44px] overflow-hidden flex flex-col relative z-10 bg-gradient-to-b from-[#FFEBF2] via-[#FFF5F8] to-white md:border-[6px] md:border-white shadow-none md:shadow-2xl">
        
        {/* Dynamic Island (Desktop only) */}
        <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-50 pointer-events-none"></div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col overflow-y-auto relative bg-transparent">
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
              onCancel={handleLogout}
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
  );
}
