import React, { useState } from 'react';
import { 
  Heart, 
  Compass, 
  MessageSquare, 
  User, 
  ArrowRight, 
  X, 
  Check, 
  Clock, 
  HelpCircle,
  Flame,
  Search,
  Coins,
  ShieldCheck,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function InteractiveTourGuide({ user = {}, userId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const isFemale = user.gender === 'female';
  const isEliteMale = user.gender === 'male' && user.plan === 'elite';
  const isPremiumMale = user.gender === 'male' && user.plan === 'premium';
  const isBasicMale = user.gender === 'male' && user.plan === 'basic';

  // ---------------------------------------------------------------------------
  // DYNAMIC TIER-SPECIFIC STEP DEFINITIONS (ENGLISH ONLY)
  // ---------------------------------------------------------------------------
  const getTourSteps = () => {
    // 1. ELITE TIER MALE (₹450 VIP)
    if (isEliteMale) {
      return [
        {
          id: 'elite_spotlight',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Heart,
          iconColor: 'text-[#FF2E79] bg-rose-50',
          badgeText: 'VIP Elite Plan (₹450)',
          title: '16-Hour Priority Spotlight',
          subtitle: 'Step 1 of 5 • Spotlight Feature',
          description: 'You are on the Elite plan! Once round entries close, your profile is spotlighted to active female candidates for 16 hours. Anyone who selects you will appear on your dashboard with top priority.',
          actionText: 'Next: How Matching Works →'
        },
        {
          id: 'elite_swiping',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Heart,
          iconColor: 'text-[#FF2E79] bg-rose-50',
          badgeText: 'Mutual Match & Instant Chat',
          title: 'Swipe & Review Candidates',
          subtitle: 'Step 2 of 5 • Review Interested Profiles',
          description: 'Browse candidate profiles in your feed. Swipe Right to like any candidate — when there is mutual interest, a direct chat unlocks instantly!',
          actionText: 'Next: 16h Timer & Refund →'
        },
        {
          id: 'elite_timer_refund',
          target: 'top_timer',
          dialogPosition: 'bottom',
          icon: Clock,
          iconColor: 'text-purple-500 bg-purple-50',
          badgeText: '16h Timer + 100% Refund Guarantee',
          title: '100% Refund Protection',
          subtitle: 'Step 3 of 5 • Zero Risk Protection',
          description: 'A 16-hour timer runs in the top right header. If no mutual match is formed during this period, you are automatically eligible for a 100% full refund.',
          actionText: 'Next: Claim Refund Desk →'
        },
        {
          id: 'elite_profile_refund_tab',
          target: 'profile_tab',
          dialogPosition: 'top',
          icon: User,
          iconColor: 'text-emerald-500 bg-emerald-50',
          badgeText: '1-Click Refund Desk',
          title: 'Profile & Refund Desk',
          subtitle: 'Step 4 of 5 • Refund Submission',
          description: 'Tap the Profile tab at the bottom right anytime to track your round status or submit a 1-click refund request directly to your UPI.',
          actionText: 'Next: Radar Map & Chat →'
        },
        {
          id: 'elite_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          icon: MessageSquare,
          iconColor: 'text-rose-500 bg-rose-50',
          badgeText: 'Navigation & Chat',
          title: 'Campus Radar & Direct Chat',
          subtitle: 'Step 5 of 5 • Seamless Navigation',
          description: 'Use the floating navigation bar at the bottom to switch between Home Feed, Campus Radar (nearby students), Direct Chat, and Profile settings.',
          actionText: 'Got It! Start Matching'
        }
      ];
    }

    // 2. PREMIUM TIER MALE (₹250)
    if (isPremiumMale) {
      return [
        {
          id: 'premium_window',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Heart,
          iconColor: 'text-[#FF2E79] bg-rose-50',
          badgeText: 'Premium Plan (₹250)',
          title: '8-Hour Browsing Window',
          subtitle: 'Step 1 of 4 • Available Candidates',
          description: 'Your Premium browsing window unlocks following the Elite phase. Browse available female profiles in your state and pick your match directly.',
          actionText: 'Next: Browse & Choose →'
        },
        {
          id: 'premium_swipe',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Heart,
          iconColor: 'text-emerald-500 bg-emerald-50',
          badgeText: 'Direct Selection',
          title: 'Swipe & Pick Your Match',
          subtitle: 'Step 2 of 4 • Choose Partner',
          description: 'Swipe through available candidate cards and select your preferred match to lock in direct connection details.',
          actionText: 'Next: Refund Protection →'
        },
        {
          id: 'premium_refund',
          target: 'top_timer',
          dialogPosition: 'bottom',
          icon: Clock,
          iconColor: 'text-emerald-500 bg-emerald-50',
          badgeText: '100% Money-Back',
          title: '100% Refund Protection',
          subtitle: 'Step 3 of 4 • Zero Risk',
          description: 'If no suitable match is formed during your round, your payment is 100% guaranteed for refund. Claim anytime via your Profile tab.',
          actionText: 'Next: Chat & Navigation →'
        },
        {
          id: 'premium_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          icon: MessageSquare,
          iconColor: 'text-purple-500 bg-purple-50',
          badgeText: 'Explore & Chat',
          title: 'Campus Radar & Direct Messaging',
          subtitle: 'Step 4 of 4 • Navigation',
          description: 'Use the bottom bar to view Campus Radar, chat with your matches in real time, and manage your account.',
          actionText: 'Got It! Start Matching'
        }
      ];
    }

    // 3. BASIC TIER MALE (₹100)
    if (isBasicMale) {
      return [
        {
          id: 'basic_ai_match',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Heart,
          iconColor: 'text-blue-500 bg-blue-50',
          badgeText: 'Basic Plan (₹100)',
          title: 'Automated Mutual Match',
          subtitle: 'Step 1 of 3 • Smart Allocation',
          description: 'Our system calculates mutual matches based on college, branch, age, and mutual preferences after round entries close.',
          actionText: 'Next: Chat & Settlement →'
        },
        {
          id: 'basic_settle',
          target: 'top_timer',
          dialogPosition: 'bottom',
          icon: Clock,
          iconColor: 'text-purple-500 bg-purple-50',
          badgeText: 'Direct Chat Unlock',
          title: 'Round Settlement & Chat',
          subtitle: 'Step 2 of 3 • Round End',
          description: 'Once matches are settled, your match will unlock under the Chats tab for direct messaging.',
          actionText: 'Next: Navigation →'
        },
        {
          id: 'basic_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          icon: MessageSquare,
          iconColor: 'text-emerald-500 bg-emerald-50',
          badgeText: 'Navigation',
          title: 'Radar Map & Profile Management',
          subtitle: 'Step 3 of 3 • Navigation',
          description: 'Easily navigate through your Feed, Campus Radar Map, Direct Chat, and Profile settings from the bottom bar.',
          actionText: 'Got It! Let\'s Go'
        }
      ];
    }

    // 4. FEMALE USERS (100% FREE ENTRY)
    return [
      {
        id: 'female_free_spotlight',
        target: 'card_stack',
        dialogPosition: 'bottom',
        icon: Heart,
        iconColor: 'text-[#FF2E79] bg-rose-50',
        badgeText: '100% Free Entry',
        title: 'Priority Candidate Spotlight',
        subtitle: 'Step 1 of 4 • Verified Profiles',
        description: 'Entry is 100% free! During the first phase of each live round, browse verified student candidates spotlighted for your state.',
        actionText: 'Next: Selection Limit →'
      },
      {
        id: 'female_limit',
        target: 'card_stack',
        dialogPosition: 'bottom',
        icon: Heart,
        iconColor: 'text-[#FF2E79] bg-rose-50',
        badgeText: 'Up to 2 Matches per Round',
        title: 'Select Up to 2 Matches',
        subtitle: 'Step 2 of 4 • Match Selection',
        description: 'Select up to 2 candidates per live round. Liking a candidate triggers an instant mutual match with direct messaging unlocked.',
        actionText: 'Next: Flexible Phases →'
      },
      {
        id: 'female_skip',
        target: 'card_stack',
        dialogPosition: 'bottom',
        icon: Compass,
        iconColor: 'text-rose-500 bg-rose-50',
        badgeText: 'Flexible Options',
        title: 'Skip & Explore Next Phases',
        subtitle: 'Step 3 of 4 • More Candidates',
        description: 'If you prefer different profiles, simply skip candidates to discover additional student profiles matching your campus preferences.',
        actionText: 'Next: Chat & Radar →'
      },
      {
        id: 'female_navbar',
        target: 'navbar',
        dialogPosition: 'top',
        icon: MessageSquare,
        iconColor: 'text-purple-500 bg-purple-50',
        badgeText: 'Realtime Direct Chat',
        title: 'Radar Map & Messaging',
        subtitle: 'Step 4 of 4 • Navigation',
        description: 'Navigate seamlessly between Home Feed, Campus Radar Map, Direct Chat, and Profile settings from the bottom bar.',
        actionText: 'Got It! Start Matching'
      }
    ];
  };

  const tourSteps = getTourSteps();
  const stepData = tourSteps[currentStep] || tourSteps[0];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF2E79', '#FF6B8B', '#A855F7', '#FFD166']
      });
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (userId) {
      localStorage.setItem(`tour_shown_${userId}`, 'true');
    }
    onComplete();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-3.5 bg-slate-950/80 backdrop-blur-[3px] select-none animate-fade-in overflow-hidden">
      
      {/* Top Header Row: Badge & Skip Tour */}
      <div className="flex items-center justify-between pt-1 px-1 z-20">
        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
          <Heart className="w-3.5 h-3.5 text-[#FF2E79] fill-current" />
          <span className="text-[11px] font-extrabold text-white">
            {stepData.badgeText}
          </span>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="text-xs font-bold text-white/75 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/15 transition-colors cursor-pointer"
        >
          <span>Skip Guide</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* PRECISE VISUAL SPOTLIGHT CUTOUTS MATCHING EXACT UI LOCATIONS           */}
      {/* --------------------------------------------------------------------- */}
      
      {/* Target A: Center Card Stack Spotlight */}
      {stepData.target === 'card_stack' && (
        <div className="absolute top-[135px] inset-x-4 h-[350px] rounded-[28px] border-2 border-[#FF2E79] ring-8 ring-[#FF2E79]/20 animate-pulse pointer-events-none z-10 flex items-center justify-center">
          <div className="flex items-center gap-4 text-white font-extrabold text-[11px] bg-slate-950/80 px-4 py-2 rounded-full border border-white/20 shadow-xl">
            <span>Swipe Left (Skip)</span>
            <span className="text-[#FF2E79] font-black">•</span>
            <span className="text-[#FF2E79]">Swipe Right (Like)</span>
          </div>
        </div>
      )}

      {/* Target B: Top-Right Round Timer Spotlight */}
      {stepData.target === 'top_timer' && (
        <div className="absolute top-[90px] right-4 w-36 h-9 rounded-full border-2 border-[#FF2E79] ring-6 ring-[#FF2E79]/30 animate-bounce pointer-events-none z-10 flex items-center justify-center">
          <span className="text-[9px] font-black text-white bg-[#FF2E79] px-2 py-0.5 rounded-full shadow-md">
            ⬇ Active Timer
          </span>
        </div>
      )}

      {/* Target C: Bottom Navbar Entire Pill Spotlight */}
      {stepData.target === 'navbar' && (
        <div className="absolute bottom-[16px] left-[18px] right-[18px] h-[64px] rounded-full border-2 border-[#FF2E79] ring-8 ring-[#FF2E79]/30 animate-pulse pointer-events-none z-10 flex items-center justify-center">
          <span className="text-[10px] font-black text-white bg-[#FF2E79] px-3 py-1 rounded-full shadow-lg">
            ⬆ 4 Floating Navigation Tabs
          </span>
        </div>
      )}

      {/* Target D: Bottom-Right Profile Tab Icon Spotlight */}
      {stepData.target === 'profile_tab' && (
        <div className="absolute bottom-[20px] right-[24px] w-14 h-14 rounded-full border-2 border-emerald-400 ring-8 ring-emerald-500/30 animate-bounce pointer-events-none z-10 flex items-center justify-center">
          <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-lg">
            ⬆ Refund
          </span>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* DYNAMIC FLOATING BUBBLE DIALOG CARD                                   */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={`bg-white rounded-[26px] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,45,85,0.25)] border border-pink-100 animate-slide-up space-y-3 relative z-30 ${
          stepData.dialogPosition === 'top' ? 'mt-4' : 'mb-3'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${stepData.iconColor}`}>
              <stepData.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#FF2E79] uppercase tracking-wider block">
                {stepData.subtitle}
              </span>
              <h3 className="text-base font-black text-slate-900 font-display leading-tight">
                {stepData.title}
              </h3>
            </div>
          </div>

          {/* Progress Step Dots */}
          <div className="flex gap-1 pt-1 shrink-0">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-5 bg-[#FF2E79]' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed font-semibold">
          {stepData.description}
        </p>

        {/* Action Button Row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 0) setCurrentStep(currentStep - 1);
            }}
            disabled={currentStep === 0}
            className={`text-xs font-bold transition-colors cursor-pointer ${
              currentStep === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 bg-[#FF2E79] hover:bg-[#e02447] text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-rose-300 transition-transform active:scale-95 cursor-pointer"
          >
            <span>{stepData.actionText}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
