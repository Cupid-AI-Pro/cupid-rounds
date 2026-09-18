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
  const [currentUser, setLocalCurrentUser] = useState(null);
  const [activeState, setActiveState] = useState('Delhi NCR');
  const [showLoginInPhone, setShowLoginInPhone] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  
  // Default to landing page for web visitors, but open matchmaking app directly for APK, PWA or saved users!
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
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

  const handleLoginSuccess = (user) => {
    setLocalCurrentUser(user);
    setShowLoginInPhone(true);
    setCurrentView('app');
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

  // 3. USER APP VIEW: 100% Edge-to-Edge Fullscreen Native Experience (No Simulated Frame, No Outer Margins)
  return (
    <div className="w-full h-[100dvh] min-h-[100dvh] bg-white flex flex-col relative overflow-hidden select-none">
      
      {/* Back to Landing Page floating button (Only on Desktop hover) */}
      <div className="hidden lg:block fixed top-3 left-3 z-50 opacity-30 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit App to Website</span>
        </button>
      </div>

      {/* 100% Fullscreen Native Content Container */}
      <div className="flex-1 flex flex-col overflow-y-auto relative bg-white w-full h-full">
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
  );
}
