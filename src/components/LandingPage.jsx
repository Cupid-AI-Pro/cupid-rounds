import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  ShieldCheck, 
  Clock, 
  Download, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Lock,
  BookOpen,
  Coffee,
  Music,
  Compass,
  MessageCircle,
  Sparkles,
  Zap,
  MapPin,
  Radio,
  Users,
  Shield,
  Award
} from 'lucide-react';
import CupidLogo from './CupidLogo';
import DownloadApkModal from './DownloadApkModal';

export default function LandingPage({ onLaunchApp, onOpenAdmin, activeState }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  // Reliable & Balanced Scroll Animation Observer
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.05,
      rootMargin: '100px 0px 0px 0px' // Pre-triggers 100px before scrolling into view so content is never blank!
    });

    const revealElements = document.querySelectorAll('.saas-reveal, .saas-reveal-up, .saas-reveal-left, .saas-reveal-right, .saas-reveal-scale');
    revealElements.forEach((el) => {
      // Check if already in viewport
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) {
        el.classList.add('is-revealed');
      }
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const profiles = [
    {
      id: 1,
      name: "Ananya",
      age: 21,
      city: "Delhi NCR",
      college: "Miranda House, Delhi University",
      headline: "Miranda House • Economics Hons",
      avatar: "/avatars/ananya.jpg",
      bio: "Coffee walks around North Campus, indie acoustic playlists, and deep conversations under the winter sun.",
      icon: Coffee,
      matchScore: "98%",
      interests: "Acoustic • Economics • Cafe Walks"
    },
    {
      id: 2,
      name: "Aarav",
      age: 22,
      city: "Delhi NCR",
      college: "IIT Delhi",
      headline: "IIT Delhi • Computer Science",
      avatar: "/avatars/aarav.jpg",
      bio: "Hackathons, campus cycling, weekend badminton, and specialty espresso. Seeking genuine vibes and meaningful dates.",
      icon: Compass,
      matchScore: "96%",
      interests: "Startups • Badminton • Espresso"
    },
    {
      id: 3,
      name: "Zoya",
      age: 21,
      city: "Gurgaon",
      college: "Ashoka University",
      headline: "Ashoka University • Literature & Film",
      avatar: "/avatars/zoya.jpg",
      bio: "Collecting vinyl records, rooftop poetry readings, art club sessions, and spontaneous mountain road trips.",
      icon: Music,
      matchScore: "97%",
      interests: "Cinema • Vinyl Records • Roadtrips"
    },
    {
      id: 4,
      name: "Kabir",
      age: 23,
      city: "Delhi NCR",
      college: "St. Stephen's College",
      headline: "St. Stephen's • History & Debating",
      avatar: "/avatars/kabir.jpg",
      bio: "Museum hopping, debating geopolitics, campus sunsets, and exploring hidden street food spots across Old Delhi.",
      icon: BookOpen,
      matchScore: "95%",
      interests: "Debating • Museums • Photography"
    },
    {
      id: 5,
      name: "Rhea",
      age: 20,
      city: "Delhi NCR",
      college: "Lady Shri Ram (LSR)",
      headline: "LSR • Journalism & Media",
      avatar: "/avatars/rhea.jpg",
      bio: "Podcast enthusiast, iced matcha latte addict, campus gardens, and loves meeting people with real passions and stories.",
      icon: Heart,
      matchScore: "99%",
      interests: "Media • Podcasts • Live Gigs"
    }
  ];

  const currentProfile = profiles[activeProfileIndex];
  const IconComponent = currentProfile.icon || Heart;
  const LOOP_SIZE = profiles.length;
  
  // 3 copies to guarantee infinite presence on left and right
  const loopedProfiles = [...profiles, ...profiles, ...profiles];

  // Auto-cycle every 4 seconds
  useEffect(() => {
    if (!isAutoCycling) return;
    const interval = setInterval(() => {
      setActiveProfileIndex((prev) => (prev + 1) % profiles.length);
      setIsLiked(false);
      setLikeBurst(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoCycling, profiles.length]);

  const handleSelectProfile = (index) => {
    setIsAutoCycling(false);
    setActiveProfileIndex(index);
    setIsLiked(false);
    setLikeBurst(false);
  };

  const handleNextProfile = () => {
    setIsAutoCycling(false);
    setActiveProfileIndex((prev) => (prev + 1) % profiles.length);
    setIsLiked(false);
    setLikeBurst(false);
  };

  const handlePrevProfile = () => {
    setIsAutoCycling(false);
    setActiveProfileIndex((prev) => (prev - 1 + profiles.length) % profiles.length);
    setIsLiked(false);
    setLikeBurst(false);
  };

  const handleLikeClick = () => {
    setIsLiked(true);
    setLikeBurst(true);
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 40) handleNextProfile();
    else if (diff < -40) handlePrevProfile();
    setTouchStart(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-slate-900 selection:bg-[#FF2D55] selection:text-white overflow-x-hidden font-sans relative">
      
      {/* ═══ SOFT PASTEL BACKGROUND ARTWORK (Subtle, Elegant & Layered) ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        
        {/* Soft Warm Halo */}
        <div className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] md:w-[480px] md:h-[480px] rounded-full bg-gradient-to-tr from-amber-100/60 via-amber-50/40 to-pink-50/20 blur-3xl opacity-70"></div>

        {/* Soft Curving Orbital Vector Lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <ellipse 
            cx="50%" 
            cy="360" 
            rx="560" 
            ry="240" 
            fill="none" 
            stroke="#10B981" 
            strokeWidth="1.2" 
            strokeOpacity="0.22"
            transform="rotate(-8 50% 360)"
          />
          <ellipse 
            cx="50%" 
            cy="360" 
            rx="460" 
            ry="190" 
            fill="none" 
            stroke="#34D399" 
            strokeWidth="1" 
            strokeOpacity="0.16"
            strokeDasharray="4 4"
            transform="rotate(-4 50% 360)"
          />
          <ellipse 
            cx="50%" 
            cy="390" 
            rx="660" 
            ry="290" 
            fill="none" 
            stroke="#FF2D55" 
            strokeWidth="1.2" 
            strokeOpacity="0.14"
            transform="rotate(6 50% 390)"
          />
        </svg>

        {/* Delicate Twinkling Star Elements */}
        <div className="absolute top-[160px] left-[18%] text-amber-400/70 animate-star-shimmer">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>
        </div>
        <div className="absolute top-[280px] right-[16%] text-pink-400/60 animate-star-shimmer" style={{ animationDelay: '1.2s' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>
        </div>
        <div className="absolute top-[380px] left-[12%] text-emerald-400/60 animate-star-shimmer" style={{ animationDelay: '2s' }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>
        </div>

        {/* Soft Accent Dots */}
        <div className="absolute top-[320px] left-[7%] w-3 h-3 rounded-full bg-emerald-400/45"></div>
        <div className="absolute top-[180px] left-[26%] w-2 h-2 rounded-full bg-amber-300/45"></div>
        <div className="absolute top-[150px] right-[24%] w-2 h-2 rounded-full bg-rose-400/35"></div>
        <div className="absolute top-[390px] right-[8%] w-3 h-3 rounded-full bg-emerald-300/35"></div>

        {/* Soft Ambient Top Mist */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-rose-100/30 via-pink-50/15 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* ═══ TOP NAVIGATION ═══ */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF8F5]/90 border-b border-rose-100/80 px-4 sm:px-6 md:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div 
            className="cursor-pointer select-none group" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="flex items-center gap-2">
              <CupidLogo size="sm" showText={true} textColor="dark" />
              <span className="hidden sm:inline text-[9px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 text-[#FF2D55] border border-rose-200 ml-1">
                Rounds
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-[#FF2D55] transition-colors">How It Works</a>
            <a href="#plans" className="hover:text-[#FF2D55] transition-colors">Plans & Pricing</a>
            <a href="#refund" className="hover:text-[#FF2D55] transition-colors">100% Refund Desk</a>
            <a href="#radar" className="hover:text-[#FF2D55] transition-colors">Campus Radar</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-full shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#FF2D55]" />
              <span>Install App</span>
            </button>

            <button
              onClick={onLaunchApp}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-black text-white bg-gradient-to-r from-[#FF2D55] via-rose-500 to-pink-500 rounded-full shadow-lg shadow-rose-500/30 hover:brightness-105 transition-all active:scale-95 cursor-pointer"
            >
              <span>Join Round</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2.5 text-sm font-bold text-slate-700 animate-slide-down">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 hover:bg-rose-50 rounded-xl hover:text-[#FF2D55] transition-colors">How It Works</a>
            <a href="#plans" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 hover:bg-rose-50 rounded-xl hover:text-[#FF2D55] transition-colors">Plans & Pricing</a>
            <a href="#refund" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 hover:bg-rose-50 rounded-xl hover:text-[#FF2D55] transition-colors">100% Refund Desk</a>
            <a href="#radar" onClick={() => setMobileMenuOpen(false)} className="py-2 px-2 hover:bg-rose-50 rounded-xl hover:text-[#FF2D55] transition-colors">Campus Radar</a>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); setDownloadModalOpen(true); }}
                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-white border border-rose-200 text-[#FF2D55] font-extrabold text-xs shadow-sm active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install Mobile App</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onLaunchApp(); }}
                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF2D55] to-rose-500 text-white font-extrabold text-xs shadow-md active:scale-95"
              >
                <span>Launch Web App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 pt-8 sm:pt-12 pb-14 sm:pb-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto overflow-hidden"
      >
        
        {/* Editorial Headline */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 saas-reveal-up">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-slate-900 tracking-tight leading-[1.12]">
            Serious about dating? <br />
            <span className="font-serif italic text-slate-900 font-bold">
              So are we.
            </span>
          </h1>

          <p className="text-xs sm:text-base text-slate-500 max-w-md mx-auto font-medium leading-relaxed px-2">
            Where college students meet with intention, not swipes.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <button
              onClick={onLaunchApp}
              className="px-6 sm:px-7 py-3 sm:py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-transform active:scale-95 cursor-pointer"
            >
              <span>Join Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setDownloadModalOpen(true)}
              className="px-5 sm:px-6 py-3 sm:py-3.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#FF2D55]" />
              <span>Install App</span>
            </button>
          </div>
        </div>

        {/* ═══ 3D COMPOSITION WITH REFINED FLOATING ELEMENTS ═══ */}
        <div className="relative max-w-6xl mx-auto mt-6 sm:mt-10 flex flex-col items-center justify-center min-h-[500px] sm:min-h-[600px] saas-reveal-scale">
          
          {/* 1. Upper Left: Live Campus Radar Beacon Pill */}
          <div className="hidden xl:flex absolute left-[6%] top-[2%] z-30 pointer-events-none items-center gap-2 animate-float-widget-1">
            <div className="relative bg-white/90 backdrop-blur-md border border-emerald-200/80 px-3.5 py-2 rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="absolute w-5 h-5 rounded-full bg-emerald-400/40 animate-radar-ring"></span>
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-wide block">DU Campus Radar</span>
                <span className="text-[8px] text-emerald-600 font-extrabold">142 verified online</span>
              </div>
            </div>
          </div>

          {/* 2. Upper Right: 3D Match Compatibility Pill */}
          <div className="hidden xl:block absolute right-[6%] top-[2%] z-30 pointer-events-none animate-float-widget-2">
            <div className="bg-white/90 backdrop-blur-md border border-rose-200/80 px-3.5 py-2 rounded-2xl shadow-lg shadow-rose-500/10 flex items-center gap-2">
              <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-[#FF2D55] to-rose-400 text-white flex items-center justify-center text-xs shadow-sm">
                ⚡
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] font-black text-slate-900 block">{currentProfile.matchScore} Match Score</span>
                <span className="text-[8px] text-rose-500 font-bold">Mutual Interests Aligned</span>
              </div>
            </div>
          </div>

          {/* 3. Bottom Left Card: Clean Profile Snippet */}
          <div className="hidden lg:block absolute left-[3%] bottom-[6%] z-30 pointer-events-none animate-float-widget-1">
            <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/90 p-4 pt-7 w-[160px] text-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md">
                <img src="/avatars/ananya.jpg" alt="Ananya" className="w-full h-full object-cover" />
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Delhi NCR</p>
              <h4 className="text-xs font-black text-slate-900 mt-0.5">ANANYA</h4>
              <p className="text-[9px] text-slate-500 font-medium">Near <span className="font-bold text-slate-800">1.8 Miles</span></p>
              <button className="mt-2.5 w-full py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#FF2D55] text-[10px] font-extrabold shadow-sm">
                Say Hello
              </button>
            </div>
          </div>

          {/* 4. Bottom Right Card: Frosted Glass Message Preview */}
          <div className="hidden lg:block absolute right-[3%] bottom-[10%] z-30 pointer-events-none animate-float-widget-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/90 p-3.5 flex items-center gap-3 w-[200px]">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-md bg-amber-100">
                <img src="/avatars/aarav.jpg" alt="Aarav" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="h-2 bg-slate-300/80 rounded-full w-full"></div>
                <div className="h-2 bg-slate-300/60 rounded-full w-3/4"></div>
                <div className="h-1.5 bg-slate-300/40 rounded-full w-1/2"></div>
              </div>
            </div>
          </div>

          {/* ── 5. Behind: Centered Continuous Card Track (With Silky Edge Fade Mask) ── */}
          <div className="absolute top-[40px] sm:top-[65px] md:top-[75px] left-0 right-0 z-10 overflow-hidden pointer-events-auto h-[260px] stream-edge-mask">
            
            {/* The sliding rail anchored at screen center (50%) */}
            <div 
              className="absolute top-0 flex items-center transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
              style={{
                left: '50%',
                transform: `translateX(calc(-1 * (${LOOP_SIZE + activeProfileIndex} * (clamp(105px, 20vw, 165px) + clamp(12px, 2vw, 20px)) + (clamp(105px, 20vw, 165px) / 2))))`,
                gap: 'clamp(12px, 2vw, 20px)'
              }}
            >
              {loopedProfiles.map((p, idx) => {
                const originalIndex = idx % LOOP_SIZE;
                const isCenterCopy = idx >= LOOP_SIZE && idx < LOOP_SIZE * 2;
                const isCurrent = originalIndex === activeProfileIndex && isCenterCopy;

                return (
                  <div 
                    key={idx}
                    onClick={() => handleSelectProfile(originalIndex)}
                    className={`relative cursor-pointer shrink-0 transition-all duration-500 rounded-[24px] sm:rounded-[30px] overflow-hidden p-1 bg-white shadow-xl ${
                      isCurrent 
                        ? 'ring-4 ring-[#FF2D55] scale-105 z-10 opacity-100 shadow-rose-500/30' 
                        : 'opacity-40 hover:opacity-85 hover:scale-95 shadow-slate-900/10'
                    }`}
                    style={{
                      width: 'clamp(105px, 20vw, 165px)',
                      aspectRatio: '4/5'
                    }}
                  >
                    <div className="relative w-full h-full rounded-[20px] sm:rounded-[26px] overflow-hidden bg-slate-100">
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent flex flex-col justify-end p-2 sm:p-2.5 text-white">
                        <span className="text-[11px] sm:text-xs font-black leading-tight">{p.name}</span>
                        <span className="text-[8px] sm:text-[9px] text-pink-200 font-medium truncate">{p.city}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Wide Gradient Blur Overlays on Extreme Left and Right (No Sharp Cuts) */}
          <div className="absolute top-[20px] bottom-[80px] left-0 w-24 sm:w-52 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent backdrop-blur-[3px] z-15 pointer-events-none"></div>
          <div className="absolute top-[20px] bottom-[80px] right-0 w-24 sm:w-52 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5]/85 to-transparent backdrop-blur-[3px] z-15 pointer-events-none"></div>

          {/* ── 6. Foreground Center: Photorealistic Large 3D Titanium Phone (Fully Visible & Uncovered) ── */}
          <div className="relative z-20 w-[275px] sm:w-[360px] md:w-[395px] rounded-[44px] sm:rounded-[54px] bg-white p-2.5 sm:p-3.5 border-[8px] sm:border-[11px] border-slate-900 phone-3d-shadow animate-phone-rise mt-2 sm:mt-0 mb-4 sm:mb-8">
            
            {/* Dynamic Island */}
            <div className="w-20 sm:w-28 h-4 sm:h-5 bg-slate-900 rounded-full mx-auto mb-1.5 sm:mb-2 flex items-center justify-between px-2.5 sm:px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D55] animate-pulse"></span>
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-slate-800 border border-slate-700"></div>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-2.5 sm:px-3 text-[9px] sm:text-[11px] font-bold text-slate-800 mb-1.5 sm:mb-2">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-rose-50 text-[#FF2D55] font-black">5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Inside Screen Profile Card */}
            <div 
              key={currentProfile.id}
              className="rounded-[30px] sm:rounded-[38px] overflow-hidden bg-white border border-slate-100 p-3.5 sm:p-5 text-center space-y-2.5 sm:space-y-3.5 animate-profile-zoom relative"
            >
              
              {/* Heart burst celebration particles */}
              {likeBurst && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
                  <span className="text-3xl animate-heart-burst absolute -top-2 left-6">💖</span>
                  <span className="text-2xl animate-heart-burst absolute -top-4 right-8" style={{ animationDelay: '0.1s' }}>✨</span>
                  <span className="text-3xl animate-heart-burst absolute top-8 left-12" style={{ animationDelay: '0.15s' }}>🎉</span>
                </div>
              )}

              {/* Profile Avatar inside Rounded Square */}
              <div 
                className="relative mx-auto overflow-hidden border-2 border-slate-100 shadow-md rounded-2xl sm:rounded-3xl"
                style={{ width: 'clamp(72px, 18vw, 108px)', height: 'clamp(72px, 18vw, 108px)' }}
              >
                <img 
                  src={currentProfile.avatar} 
                  alt={currentProfile.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Character Name & Subtitle */}
              <div>
                <h3 className="text-xl sm:text-3xl font-serif text-slate-900 font-bold">{currentProfile.name}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">{currentProfile.headline}</p>
              </div>

              {/* Decorative Pill Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-700 shadow-sm">
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF2D55]" />
              </div>

              {/* About Me Section */}
              <div className="text-left space-y-0.5 sm:space-y-1 pt-0.5">
                <h4 className="text-xs sm:text-sm font-serif font-bold text-slate-900 text-center">About me</h4>
                <p className="text-[10px] sm:text-xs text-slate-500 font-normal leading-relaxed text-center px-1 line-clamp-3 sm:line-clamp-none">
                  "{currentProfile.bio}"
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  onClick={handleLikeClick}
                  className={`w-full py-2.5 sm:py-3 rounded-2xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isLiked 
                      ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                      : 'bg-gradient-to-r from-[#FF2D55] to-rose-500 text-white shadow-rose-500/30 active:scale-95'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>{isLiked ? 'Matched! 🎉 (Chat Unlocked)' : `Like ${currentProfile.name}`}</span>
                </button>
              </div>

              {/* Next / Prev Controls */}
              <div className="flex items-center justify-between px-1 pt-0.5 text-[9px] sm:text-[11px] font-bold text-slate-400">
                <button onClick={handlePrevProfile} className="hover:text-[#FF2D55] flex items-center gap-0.5 cursor-pointer">
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <span className="text-[9px] sm:text-[10px] text-slate-300 font-bold">{activeProfileIndex + 1} of {profiles.length}</span>
                <button onClick={handleNextProfile} className="hover:text-[#FF2D55] flex items-center gap-0.5 cursor-pointer">
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ═══ SECTION 2: HOW CUPID ROUNDS WORK ═══ */}
      <section id="how-it-works" className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto border-t border-rose-100 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2 saas-reveal-up">
          <span className="text-xs font-black uppercase tracking-widest text-[#FF2D55] bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200">
            How Cupid Rounds Work
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black text-slate-900">
            Engineered for genuine dates.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Time-bound college matchmaking rounds with strict safety and zero ghosting.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm saas-card-lift saas-reveal-up saas-delay-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-base sm:text-lg mb-3 sm:mb-4">
              1
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1 font-display">Round Opens at 8 PM</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Every day at 8:00 PM, state rounds go live (Delhi NCR, Haryana, Punjab, UP). Enroll via your tier or free female entry.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm saas-card-lift saas-reveal-up saas-delay-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-100 text-[#FF2D55] flex items-center justify-center font-black text-base sm:text-lg mb-3 sm:mb-4">
              2
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1 font-display">16h Spotlight Window</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Females review ₹450 Elite profiles first. Mutual likes lock in instant matches before general browsing opens.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm saas-card-lift saas-reveal-up saas-delay-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-base sm:text-lg mb-3 sm:mb-4">
              3
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1 font-display">8h Premium Browsing</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              ₹250 Premium & ₹100 Basic entries browse remaining verified profiles with real-time settlement.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm saas-card-lift saas-reveal-up saas-delay-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-base sm:text-lg mb-3 sm:mb-4">
              4
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 mb-1 font-display">100% Auto-Refund</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              If the 16h round ends without finding a mutual match, 100% of your entry fee is refunded automatically to your source account!
            </p>
          </div>

        </div>

      </section>

      {/* ═══ SECTION 3: PLANS & PRICING ═══ */}
      <section id="plans" className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto border-t border-rose-100 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-2 saas-reveal-up">
          <span className="text-xs font-black uppercase tracking-widest text-[#FF2D55] bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black text-slate-900">
            Choose Your Matchmaking Pass
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Every single paid pass is backed by our strict <strong>100% Money-Back Guarantee</strong>.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          
          {/* Female Pass */}
          <div className="bg-white border-2 border-pink-200 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm saas-card-lift saas-reveal-up saas-delay-1">
            <div>
              <span className="px-3 py-1 rounded-full bg-pink-50 text-pink-600 font-extrabold text-[10px] uppercase tracking-wider">
                For Women
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5 font-display">Female Pass</h3>
              <div className="mt-1.5 mb-5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">₹0</span>
                <span className="text-xs text-slate-400 font-bold ml-1">/ 100% Free</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>16h VIP Spotlight Review window</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Max 2 mutual matches (Zero Creeps)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time encrypted private chat</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onLaunchApp}
              className="mt-6 sm:mt-8 w-full py-3 rounded-2xl bg-pink-50 hover:bg-pink-100 text-[#FF2D55] font-black text-xs transition-colors active:scale-95 cursor-pointer"
            >
              Join Free as Female
            </button>
          </div>

          {/* Basic Entry ₹100 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm saas-card-lift saas-reveal-up saas-delay-2">
            <div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase tracking-wider">
                Algorithm Pool
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5 font-display">Basic Entry</h3>
              <div className="mt-1.5 mb-5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">₹100</span>
                <span className="text-xs text-slate-400 font-bold ml-1">/ round</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Preference algorithm matching pool</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Automated round settlement</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Full refund if unmatched</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onLaunchApp}
              className="mt-6 sm:mt-8 w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-colors active:scale-95 cursor-pointer"
            >
              Get Basic Entry
            </button>
          </div>

          {/* Premium Pass ₹250 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm saas-card-lift saas-reveal-up saas-delay-3">
            <div>
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 font-extrabold text-[10px] uppercase tracking-wider">
                Direct Swipe
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5 font-display">Premium Pass</h3>
              <div className="mt-1.5 mb-5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">₹250</span>
                <span className="text-xs text-slate-400 font-bold ml-1">/ round</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>8h Active Browsing Window</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Full swipe deck of available profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>100% money-back guarantee</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onLaunchApp}
              className="mt-6 sm:mt-8 w-full py-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-black text-xs transition-colors active:scale-95 cursor-pointer"
            >
              Get Premium Pass
            </button>
          </div>

          {/* Elite Pass ₹450 (Featured Scale Zoom) */}
          <div className="bg-gradient-to-b from-rose-50/70 via-white to-white border-2 border-[#FF2D55] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl shadow-rose-500/15 relative transform lg:-translate-y-2 saas-card-lift saas-reveal-scale saas-delay-4">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF2D55] to-rose-500 text-white font-black text-[9px] uppercase tracking-widest shadow-md">
              Most Popular 🔥
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-rose-100 text-[#FF2D55] font-extrabold text-[10px] uppercase tracking-wider">
                16h Priority Spotlight
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5 font-display">Elite Pass</h3>
              <div className="mt-1.5 mb-5">
                <span className="text-3xl sm:text-4xl font-black text-[#FF2D55]">₹450</span>
                <span className="text-xs text-slate-400 font-bold ml-1">/ round</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF2D55] shrink-0" />
                  <span><strong>16h Priority Spotlight</strong> on Female Dashboards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF2D55] shrink-0" />
                  <span>Females review and like you back first</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF2D55] shrink-0" />
                  <span>16h Auto-Refund Timer if unmatched</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onLaunchApp}
              className="mt-6 sm:mt-8 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF2D55] to-rose-500 text-white font-black text-xs shadow-lg shadow-rose-500/30 hover:brightness-105 transition-all active:scale-95 cursor-pointer"
            >
              Get Elite 16h Spotlight
            </button>
          </div>

        </div>

      </section>

      {/* ═══ SECTION 4: 100% REFUND DESK GUARANTEE (Fully Visible Card with Clean Reveal) ═══ */}
      <section id="refund" className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto border-t border-rose-100 relative z-10">
        <div className="bg-gradient-to-tr from-rose-50 via-white to-pink-50 border border-rose-200/90 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 md:p-14 shadow-lg saas-reveal-up">
          
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Risk • 100% Protection</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-slate-900">
                No Match? Instant 100% Refund. Guaranteed.
              </h2>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-medium">
                If the round ends and you do not find a mutual match, your entry fee is automatically credited back to your bank / UPI account. You can also claim an instant refund anytime from your profile desk.
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-4 pt-1 sm:pt-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5 bg-white border border-rose-200/80 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-sm">
                  <Clock className="w-4 h-4 text-[#FF2D55]" />
                  <span>16h Auto-Timer Trigger</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-rose-200/80 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-sm">
                  <RotateCcw className="w-4 h-4 text-emerald-600" />
                  <span>Direct UPI / Source Refund</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-rose-200/80 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-sm">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Safe & Encrypted Settlement</span>
                </div>
              </div>
            </div>

            {/* Right 100% Badge */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#FF2D55] via-rose-500 to-amber-400 p-1 flex items-center justify-center shadow-xl shadow-rose-500/20 saas-card-lift">
                <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-center p-3 sm:p-4">
                  <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF2D55] mb-1" />
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-display">100%</span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Money Back</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ SECTION 5: CAMPUS RADAR SCHEDULE ═══ */}
      <section id="radar" className="py-14 sm:py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto border-t border-rose-100 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2 saas-reveal-up">
          <span className="text-xs font-black uppercase tracking-widest text-[#FF2D55] bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200">
            State-by-State Calendar
          </span>
          <h2 className="text-2xl sm:text-4xl font-serif font-black text-slate-900">
            Live Campus Radar Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Rounds run by state so you always match with verified students in your area.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { state: 'Delhi NCR', status: 'LIVE NOW 🟢', desc: 'DU, IIT, IPU, Ashoka', color: 'border-emerald-300 bg-emerald-50/50' },
            { state: 'Haryana', status: 'Opens Tomorrow 8 PM', desc: 'Amity, Ashoka, MDU', color: 'border-slate-200 bg-white' },
            { state: 'Punjab', status: 'Friday 8 PM', desc: 'Thapar, LPU, Chandigarh Univ', color: 'border-slate-200 bg-white' },
            { state: 'Uttar Pradesh', status: 'Saturday 8 PM', desc: 'Shiv Nadar, Bennett, IITK', color: 'border-slate-200 bg-white' },
          ].map((item, idx) => (
            <div key={item.state} className={`p-4 sm:p-5 rounded-3xl border ${item.color} shadow-sm space-y-1.5 sm:space-y-2 saas-card-lift saas-reveal-up saas-delay-${idx + 1}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm">{item.state}</h4>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{item.status}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SECTION 6: DIRECT APK DOWNLOAD BANNER ═══ */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto relative z-10 text-center">
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-[#FF2D55] text-white rounded-3xl p-6 sm:p-10 md:p-12 space-y-4 sm:space-y-6 max-w-4xl mx-auto shadow-2xl shadow-rose-500/25 saas-reveal-scale">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-white text-[#FF2D55] flex items-center justify-center mx-auto shadow-md">
            <Smartphone className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-serif font-black text-white">
            Install Cupid on Your Android Device
          </h2>
          <p className="text-xs sm:text-sm text-pink-100 max-w-lg mx-auto font-medium px-2">
            Get instant round notifications, campus radar alerts, and real-time match settlement right on your phone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-[#FF2D55] font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Install Cupid App</span>
            </button>
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto px-7 py-3.5 bg-black/20 hover:bg-black/30 text-white font-bold text-xs sm:text-sm rounded-2xl transition-colors active:scale-95 cursor-pointer"
            >
              Open Web App in Browser
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-rose-100 py-10 sm:py-12 px-4 sm:px-6 md:px-12 relative z-10 text-slate-500 text-xs bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <CupidLogo size="xs" showText={true} textColor="dark" />
            <span className="text-[10px] font-bold text-slate-500 ml-1">© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center justify-center gap-6 font-bold text-slate-600">
            <span className="cursor-pointer hover:text-[#FF2D55]" onClick={onOpenAdmin}>Admin Console</span>
            <span className="cursor-pointer hover:text-[#FF2D55]" onClick={onLaunchApp}>Launch App</span>
            <span className="cursor-pointer hover:text-[#FF2D55]" onClick={() => setDownloadModalOpen(true)}>Install App</span>
          </div>
        </div>
      </footer>

      {/* ═══ DOWNLOAD / INSTALL APK MODAL ═══ */}
      <DownloadApkModal 
        isOpen={downloadModalOpen} 
        onClose={() => setDownloadModalOpen(false)} 
      />

    </div>
  );
}
