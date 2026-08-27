import React, { useState, useEffect } from 'react';
import { LogOut, User, ShieldAlert, Film, Download } from 'lucide-react';
import CupidLogo from './CupidLogo';
import DownloadApkModal from './DownloadApkModal';

export default function Navbar({ currentUser, isAdminMode, setIsAdminMode, onLogout, activeState, onPlayIntroVideo }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    // Open comprehensive direct APK download modal
    setShowApkModal(true);
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-4 md:px-8">
      {/* Direct APK Download Modal */}
      <DownloadApkModal isOpen={showApkModal} onClose={() => setShowApkModal(false)} />

      <div className="mx-auto max-w-7xl glass-panel px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={onPlayIntroVideo} 
          className="flex items-center gap-2 cursor-pointer select-none group" 
          title="Click to replay intro screen"
        >
          <CupidLogo size="md" showText={true} textColor="dark" textSubtitle="Matchmaking Rounds" />
        </div>

        {/* Middle Info: Active Round Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-4 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#FF2D55] animate-pulse"></span>
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
            Active Round: {activeState}
          </span>
        </div>

        {/* Actions & Profiles */}
        <div className="flex items-center gap-3">
          {/* Download APK Button */}
          <button
            onClick={handleInstallApp}
            className="px-3.5 py-2 text-xs font-bold rounded-full bg-gradient-to-r from-[#FF2D55] via-pink-500 to-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-rose-500/25 hover:brightness-105 transition-all active:scale-95 cursor-pointer"
            title="Direct Download Android APK"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK</span>
          </button>
          {/* Replay Intro Screen Button */}
          {onPlayIntroVideo && (
            <button
              onClick={onPlayIntroVideo}
              className="px-3.5 py-2 text-xs font-bold rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              title="Preview Intro Loading Screen"
            >
              <span>Intro Screen</span>
            </button>
          )}

          {/* Quick Admin Toggle for Demonstration */}
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`btn px-3.5 py-2 text-xs flex items-center gap-1.5 ${
              isAdminMode 
                ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
            title="Toggle between User and Admin panels for testing"
          >
            {isAdminMode ? (
              <>
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Switch to User View</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Switch to Admin</span>
              </>
            )}
          </button>

          {currentUser && !isAdminMode && (
            <div className="flex items-center gap-3">
              {/* User Avatar with Ring */}
              <div className="avatar-ring w-9 h-9">
                <img
                  src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* User Plan Badge */}
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                <span className={`text-[10px] font-extrabold uppercase mt-0.5 tracking-wider px-1.5 py-0.5 rounded ${
                  currentUser.plan === 'elite' 
                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                    : currentUser.plan === 'premium'
                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {currentUser.plan}
                </span>
              </div>
            </div>
          )}

          {/* Logout Action */}
          {currentUser && (
            <button
              onClick={onLogout}
              className="p-2.5 rounded-full hover:bg-rose-50 text-slate-500 hover:text-rose-500 transition-colors border border-transparent hover:border-rose-100"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Mobile-only Active Round Banner */}
      <div className="sm:hidden mt-2 flex justify-center">
        <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 px-4 py-1 rounded-full">
          <span className="active-dot"></span>
          <span className="text-[10px] font-semibold text-rose-600 uppercase">
            Active Round: {activeState}
          </span>
        </div>
      </div>
    </header>
  );
}
