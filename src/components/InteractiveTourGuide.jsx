import React, { useState } from 'react';
import { 
  Heart, 
  Sparkles, 
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
  // DYNAMIC TIER-SPECIFIC STEP DEFINITIONS
  // ---------------------------------------------------------------------------
  const getTourSteps = () => {
    // 👑 1. ELITE TIER MALE (₹450 VIP)
    if (isEliteMale) {
      return [
        {
          id: 'elite_spotlight',
          target: 'card_stack',
          dialogPosition: 'bottom', // 'top' | 'bottom'
          icon: Sparkles,
          iconColor: 'text-amber-500 bg-amber-50',
          badgeText: '⭐ VIP Elite Plan (₹450)',
          title: '16-Hour Spotlight Window',
          subtitle: 'Step 1 of 5 • Priority Spotlight',
          description: 'Aapne Elite (₹450) plan liya hai! Jaise hi round entries close hongi, agle 16 ghante ke liye aapki profile sabhi active ladkiyo ke dashboard par spotlight hogi. Jo-jo ladki aapko select karegi, vo sabhi aapke dashboard par priority se show hongi.',
          actionText: 'Next: How Matching Works →'
        },
        {
          id: 'elite_swiping',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Heart,
          iconColor: 'text-[#FF2D55] bg-rose-50',
          badgeText: '💖 Mutual Match & Instant Chat',
          title: 'Swipe & Review Candidates',
          subtitle: 'Step 2 of 5 • Review Girls Who Liked You',
          description: 'Aap un sabhi ladkiyo ki profiles swipe karke scroll kar sakte hain. Agar koi ladki psnd aati hai to Right Swipe (Like) karein — instant mutual match ho jayega aur direct chat khul jayegi!',
          actionText: 'Next: 16h Timer & Refund →'
        },
        {
          id: 'elite_timer_refund',
          target: 'top_timer',
          dialogPosition: 'bottom',
          icon: Clock,
          iconColor: 'text-purple-500 bg-purple-50',
          badgeText: '⏳ 16h Timer + 100% Refund',
          title: '100% Auto-Refund Guarantee',
          subtitle: 'Step 3 of 5 • Zero Risk Protection',
          description: 'Top-right par 16 ghante ka countdown timer chalega. Agar in 16 ghanto me aapko koi ladki psnd nahi aati, ya aap kisi ko select nahi karte, ya koi ladki match nahi hoti, to aap ₹450 ke 100% full refund ke liye automatically eligible ho jayenge.',
          actionText: 'Next: Claim Refund Desk →'
        },
        {
          id: 'elite_profile_refund_tab',
          target: 'profile_tab',
          dialogPosition: 'top',
          icon: ShieldCheck,
          iconColor: 'text-emerald-500 bg-emerald-50',
          badgeText: '🛡️ 1-Click Refund Desk',
          title: 'Profile Tab & UPI Refund',
          subtitle: 'Step 4 of 5 • Refund Submission',
          description: 'Neeche right side par Profile tab (👤) par tap karke aap kabhi bhi "Claim Refund" button se apna UPI refund claim submit kar sakte hain ya auto-process status check kar sakte hain.',
          actionText: 'Next: Radar Map & Chat →'
        },
        {
          id: 'elite_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          icon: MessageSquare,
          iconColor: 'text-rose-500 bg-rose-50',
          badgeText: '🧭 Navigation & Chat',
          title: 'Campus Radar & Direct Chat',
          subtitle: 'Step 5 of 5 • Navigation',
          description: 'Neeche floating navbar me: 🏠 Home Feed, 🧭 Campus Radar Map (nearby campus singles scan), 💬 Direct Realtime Chat (mutual matches ke sath), aur 👤 Profile Management.',
          actionText: 'Got It! Start Matching 🚀'
        }
      ];
    }

    // 💖 2. PREMIUM TIER MALE (₹250)
    if (isPremiumMale) {
      return [
        {
          id: 'premium_window',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Heart,
          iconColor: 'text-[#FF2D55] bg-rose-50',
          badgeText: '💎 Premium Plan (₹250)',
          title: '8-Hour Browsing Window',
          subtitle: 'Step 1 of 4 • Remaining Girls Pool',
          description: 'Aapne Premium (₹250) plan liya hai! Elite phase (16h) ke baad, agle 8 ghante aapka Premium Browsing window open hoga. Isme jitni bhi available ladkiya hain (jinke match slots khali hain), un sabhi ki profiles aapko show hongi.',
          actionText: 'Next: Browse & Choose →'
        },
        {
          id: 'premium_swipe',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Sparkles,
          iconColor: 'text-amber-500 bg-amber-50',
          badgeText: '💖 Direct Selection',
          title: 'Swipe & Pick Your Match',
          subtitle: 'Step 2 of 4 • Select Partner',
          description: 'Aap swipe karke sabhi available girls ko browse kar sakte hain aur apni pasandeeda partner ko select karke mutual match lock kar sakte hain.',
          actionText: 'Next: ₹250 Refund Protection →'
        },
        {
          id: 'premium_refund',
          target: 'top_timer',
          dialogPosition: 'bottom',
          icon: ShieldCheck,
          iconColor: 'text-emerald-500 bg-emerald-50',
          badgeText: '🛡️ 100% Money-Back',
          title: '100% Full Refund Protected',
          subtitle: 'Step 3 of 4 • Zero Risk',
          description: 'Agar is 8 ghante ke window me aapko koi suitable match nahi milta ya aap kisi ko choose nahi karte, to aapka ₹250 ka 100% refund guaranteed hai. Profile tab se "Claim Refund" submit kar sakte hain.',
          actionText: 'Next: Chat & Navigation →'
        },
        {
          id: 'premium_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          icon: MessageSquare,
          iconColor: 'text-purple-500 bg-purple-50',
          badgeText: '🧭 Explore & Chat',
          title: 'Radar Map & Realtime Chat',
          subtitle: 'Step 4 of 4 • Navigation',
          description: 'Neeche floating navbar me: 🏠 Feed, 🧭 Campus Radar Map, 💬 Direct Realtime Chat with locked matches, aur 👤 Membership & Refund Desk.',
          actionText: 'Got It! Start Matching 🚀'
        }
      ];
    }

    // 🎖️ 3. BASIC TIER MALE (₹100)
    if (isBasicMale) {
      return [
        {
          id: 'basic_ai_match',
          target: 'card_stack',
          dialogPosition: 'bottom',
          icon: Award,
          iconColor: 'text-blue-500 bg-blue-50',
          badgeText: '🎖️ Basic Plan (₹100)',
          title: 'AI Mutual Allocation',
          subtitle: 'Step 1 of 3 • Automated Settlement',
          description: 'Aapne Basic plan liya hai! Round entries close hone ke baad, hamara AI preference algorithm aapke college, branch, age aur non-negotiables ke basis par bachi hui available ladkiyo ke sath aapka mutual match calculate karega.',
          actionText: 'Next: Chat & Settlement →'
        },
        {
          id: 'basic_settle',
          target: 'top_timer',
          dialogPosition: 'bottom',
          icon: Clock,
          iconColor: 'text-purple-500 bg-purple-50',
          badgeText: '💬 Direct Chat Unlock',
          title: 'Round Settlement & Chat',
          subtitle: 'Step 2 of 3 • Round End',
          description: 'Round settle hote hi aapka match "💬 Chat" tab me unlock ho jayega jahan direct contact aur chat open hogi. (Note: Basic plan non-refundable hai).',
          actionText: 'Next: Navigation →'
        },
        {
          id: 'basic_navbar',
          target: 'navbar',
          dialogPosition: 'top',
          icon: MessageSquare,
          iconColor: 'text-emerald-500 bg-emerald-50',
          badgeText: '🧭 Navigation',
          title: 'Radar Map & Profile Management',
          subtitle: 'Step 3 of 3 • Navigation',
          description: 'Neeche floating navbar me: 🏠 Feed, 🧭 Campus Radar Map, 💬 Chat, aur 👤 Profile settings.',
          actionText: 'Got It! Let\'s Go 🚀'
        }
      ];
    }

    // 🌸 4. FEMALE USERS (100% FREE ENTRY)
    return [
      {
        id: 'female_free_spotlight',
        target: 'card_stack',
        dialogPosition: 'bottom',
        icon: Sparkles,
        iconColor: 'text-amber-500 bg-amber-50',
        badgeText: '👑 100% Free VIP Access',
        title: 'Elite Spotlight Window (16h)',
        subtitle: 'Step 1 of 4 • Verified Elite Boys',
        description: 'Aapke liye entry 100% FREE hai! Round shuru hote hi pehle 16 ghante aapko verified Elite Tier boys spotlight me dikhenge. Aap unme se apne pasandeeda candidates browse kar sakti hain.',
        actionText: 'Next: 2 Matches Limit →'
      },
      {
        id: 'female_limit',
        target: 'card_stack',
        dialogPosition: 'bottom',
        icon: Heart,
        iconColor: 'text-[#FF2D55] bg-rose-50',
        badgeText: '💖 Max 2 Matches per Round',
        title: 'Select Up to 2 Matches',
        subtitle: 'Step 2 of 4 • Select Partner',
        description: 'Aap ek round me maximum 2 matches choose kar sakti hain. Jaise hi aap kisi Elite boy ko like karengi, use instant alert jayega aur mutual like hote hi direct chat khul jayegi.',
        actionText: 'Next: Skip & Next Phases →'
      },
      {
        id: 'female_skip',
        target: 'card_stack',
        dialogPosition: 'bottom',
        icon: Flame,
        iconColor: 'text-rose-500 bg-rose-50',
        badgeText: '✨ Flexible Options',
        title: 'Skip Option & Next Phases',
        subtitle: 'Step 3 of 4 • More Candidates',
        description: 'Agar aapko Elite boys me koi psnd nahi aata, to aap skip kar sakti hain. Agle phase me aapko Premium aur Basic profiles preferences ke hisaab se dikhenge.',
        actionText: 'Next: Chat & Radar →'
      },
      {
        id: 'female_navbar',
        target: 'navbar',
        dialogPosition: 'top',
        icon: MessageSquare,
        iconColor: 'text-purple-500 bg-purple-50',
        badgeText: '💬 Safe Realtime Chat',
        title: 'Radar Map & Messaging Tabs',
        subtitle: 'Step 4 of 4 • Navigation',
        description: 'Neeche floating navbar me: 🏠 Home Feed, 🧭 Campus Radar Map (campus radius scan), 💬 Direct Realtime Chat with locked matches, aur 👤 Profile settings.',
        actionText: 'Got It! Start Matching 🚀'
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
        colors: ['#FF2D55', '#FF6B8B', '#A855F7', '#FFD166']
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
          <Sparkles className="w-3.5 h-3.5 text-[#FF2D55]" />
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
        <div className="absolute top-[135px] inset-x-4 h-[350px] rounded-[28px] border-2 border-[#FF2D55] ring-8 ring-[#FF2D55]/20 animate-pulse pointer-events-none z-10 flex items-center justify-center">
          <div className="flex items-center gap-4 text-white font-extrabold text-[11px] bg-slate-950/80 px-4 py-2 rounded-full border border-white/20 shadow-xl">
            <span>👈 Swipe Left (Skip)</span>
            <span className="text-[#FF2D55] font-black">•</span>
            <span className="text-[#FF2D55]">👉 Swipe Right (Like)</span>
          </div>
        </div>
      )}

      {/* Target B: Top-Right Round Timer Spotlight */}
      {stepData.target === 'top_timer' && (
        <div className="absolute top-[90px] right-4 w-36 h-9 rounded-full border-2 border-[#FF2D55] ring-6 ring-[#FF2D55]/30 animate-bounce pointer-events-none z-10 flex items-center justify-center">
          <span className="text-[9px] font-black text-white bg-[#FF2D55] px-2 py-0.5 rounded-full shadow-md">
            ⬇ Active Timer
          </span>
        </div>
      )}

      {/* Target C: Bottom Navbar Entire Pill Spotlight */}
      {stepData.target === 'navbar' && (
        <div className="absolute bottom-[16px] left-[18px] right-[18px] h-[64px] rounded-full border-2 border-[#FF2D55] ring-8 ring-[#FF2D55]/30 animate-pulse pointer-events-none z-10 flex items-center justify-center">
          <span className="text-[10px] font-black text-white bg-[#FF2D55] px-3 py-1 rounded-full shadow-lg">
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
              <span className="text-[10px] font-black text-[#FF2D55] uppercase tracking-wider block">
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
                  idx === currentStep ? 'w-5 bg-[#FF2D55]' : 'w-1.5 bg-slate-200'
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
            className="px-5 py-2.5 bg-[#FF2D55] hover:bg-[#e02447] text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-rose-300 transition-transform active:scale-95 cursor-pointer"
          >
            <span>{stepData.actionText}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
