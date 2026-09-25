import React, { useState } from 'react';
import { 
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import CupidLogo from './CupidLogo';

export default function InteractiveTourGuide({ user = {}, userId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const isEliteMale = user.gender === 'male' && user.plan === 'elite';
  const isPremiumMale = user.gender === 'male' && user.plan === 'premium';
  const isBasicMale = user.gender === 'male' && user.plan === 'basic';

  // ---------------------------------------------------------------------------
  // DYNAMIC TIER-SPECIFIC STEP DEFINITIONS (HUMAN & CUPID BRANDED)
  // ---------------------------------------------------------------------------
  const getTourSteps = () => {
    // 1. ELITE TIER MALE (₹450 VIP)
    if (isEliteMale) {
      return [
        {
          id: 'elite_spotlight',
          target: 'card_stack',
          dialogPosition: 'bottom',
          badgeText: 'VIP Elite Plan',
          title: 'Priority Candidate Spotlight',
          subtitle: 'Spotlight Feature',
          description: 'As an Elite member, your profile is spotlighted to active female candidates across your region. Candidates who like your profile show up with top priority on your feed.',
          actionText: 'Next: How Matching Works →'
        },
        {
          id: 'elite_swiping',
          target: 'card_stack',
          dialogPosition: 'bottom',
          badgeText: 'Mutual Match & Instant Chat',
          title: 'Browse & Like Profiles',
          subtitle: 'Match Selection',
          description: 'Swipe right on profiles you like. When both of you show interest, a direct chat unlocks right away so you can connect.',
          actionText: 'Next: Timer & Refund Protection →'
        },
        {
          id: 'elite_timer_refund',
          target: 'top_timer',
          dialogPosition: 'bottom',
          badgeText: '100% Refund Protection',
          title: 'Full Guarantee Protection',
          subtitle: 'Zero Risk Guarantee',
          description: 'A 16-hour timer runs in the top header. If no mutual match is formed during your round, your payment is 100% eligible for an automatic refund.',
          actionText: 'Next: Refund Desk →'
        },
        {
          id: 'elite_profile_refund_tab',
          target: 'profile_tab',
          dialogPosition: 'top',
          badgeText: 'UPI Refund Desk',
          title: 'Profile & Refund Settings',
          subtitle: 'Account Desk',
          description: 'You can check your round status or request an instant UPI refund anytime directly from your Profile tab.',
          actionText: 'Next: App Navigation →'
        },
        {
          id: 'elite_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          badgeText: 'Navigation & Chat',
          title: 'Campus Radar & Direct Messaging',
          subtitle: 'App Overview',
          description: 'Use the bottom bar to switch between your Home Feed, Campus Radar Map for nearby students, Direct Messages, and Profile settings.',
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
          badgeText: 'Premium Membership',
          title: 'Active Candidate Window',
          subtitle: 'Available Candidates',
          description: 'Your Premium browsing window lets you explore active student candidates in your region and pick your preferred match directly.',
          actionText: 'Next: Browse & Choose →'
        },
        {
          id: 'premium_swipe',
          target: 'card_stack',
          dialogPosition: 'bottom',
          badgeText: 'Direct Selection',
          title: 'Pick Your Preferred Match',
          subtitle: 'Match Selection',
          description: 'Swipe through available student profiles and select your preferred partner to unlock direct connection details.',
          actionText: 'Next: Refund Guarantee →'
        },
        {
          id: 'premium_refund',
          target: 'top_timer',
          dialogPosition: 'bottom',
          badgeText: '100% Money-Back',
          title: 'Full Refund Guarantee',
          subtitle: 'Zero Risk',
          description: 'If no suitable match is formed during your active round, your ₹250 fee is 100% refundable anytime via your Profile tab.',
          actionText: 'Next: App Navigation →'
        },
        {
          id: 'premium_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          badgeText: 'App Overview',
          title: 'Campus Radar & Direct Chat',
          subtitle: 'Navigation',
          description: 'Use the bottom bar to view nearby students on Campus Radar, chat with your matches, and manage your account.',
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
          badgeText: 'Basic Plan',
          title: 'Automated Mutual Matching',
          subtitle: 'Smart Allocation',
          description: 'Our matching algorithm calculates mutual compatibility based on your college, branch, age, and mutual preferences after round entries close.',
          actionText: 'Next: Direct Chat →'
        },
        {
          id: 'basic_settle',
          target: 'top_timer',
          dialogPosition: 'bottom',
          badgeText: 'Direct Messaging',
          title: 'Round Settle & Direct Messaging',
          subtitle: 'Round End',
          description: 'Once matches are settled, your match will unlock under the Chats tab for direct messaging and contact details.',
          actionText: 'Next: App Navigation →'
        },
        {
          id: 'basic_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          badgeText: 'App Overview',
          title: 'Campus Radar & Profile',
          subtitle: 'Navigation',
          description: 'Easily navigate between your Home Feed, Campus Radar Map, Direct Messages, and Profile settings from the bottom bar.',
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
        badgeText: '100% Free Campus Access',
        title: 'Priority Candidate Spotlight',
        subtitle: 'Free Campus Entry',
        description: 'Welcome to Cupid Rounds! Entry is completely free for female members. Browse spotlighted candidates from Bennett University, IIT Delhi, and campuses across your region.',
        actionText: 'Next: Selection Limit →'
      },
      {
        id: 'female_limit',
        target: 'card_stack',
        dialogPosition: 'bottom',
        badgeText: 'Up to 2 Matches per Round',
        title: 'Select Up to 2 Matches',
        subtitle: 'Match Selection',
        description: 'You can select up to 2 matches per live round. When you like a candidate and there is mutual interest, your direct chat opens right away.',
        actionText: 'Next: Flexible Options →'
      },
      {
        id: 'female_skip',
        target: 'card_stack',
        dialogPosition: 'bottom',
        badgeText: 'Flexible Candidate Options',
        title: 'Explore Additional Profiles',
        subtitle: 'Flexible Options',
        description: 'Feel free to skip candidates if you want to see more student profiles. Additional candidate options become available as round phases progress.',
        actionText: 'Next: App Navigation →'
      },
      {
        id: 'female_navbar',
        target: 'navbar',
        dialogPosition: 'top',
        badgeText: 'Realtime Direct Chat',
        title: 'Simple App Navigation',
        subtitle: 'App Overview',
        description: 'Use the bottom navigation bar to easily switch between your Home Feed, Campus Radar, Direct Messages, and Profile settings.',
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
      
      {/* Top Header Row: Cupid Brand Badge & Skip Guide */}
      <div className="flex items-center justify-between pt-1 px-1 z-20">
        <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
          <CupidLogo size="xs" showText={false} />
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
        <div className="absolute top-[135px] inset-x-4 h-[350px] rounded-[28px] border-2 border-[#FF2E79] ring-8 ring-[#FF2E79]/20 animate-pulse pointer-events-none z-10" />
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
            ⬆ 4 Navigation Tabs
          </span>
        </div>
      )}

      {/* Target D: Bottom-Right Profile Tab Icon Spotlight */}
      {stepData.target === 'profile_tab' && (
        <div className="absolute bottom-[20px] right-[24px] w-14 h-14 rounded-full border-2 border-emerald-400 ring-8 ring-emerald-500/30 animate-bounce pointer-events-none z-10 flex items-center justify-center">
          <span className="text-[9px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-lg">
            ⬆ Profile & Refund
          </span>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* DYNAMIC FLOATING BUBBLE DIALOG CARD WITH CUPID LOGO & HUMAN COPY      */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={`bg-white rounded-[26px] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,45,85,0.25)] border border-pink-100 animate-slide-up space-y-3 relative z-30 ${
          stepData.dialogPosition === 'top' ? 'mt-4' : 'mb-3'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100/80 flex items-center justify-center shrink-0 shadow-xs">
              <CupidLogo size="xs" showText={false} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#FF2E79] uppercase tracking-wider block">
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
