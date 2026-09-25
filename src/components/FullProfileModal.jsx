import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Heart, 
  X, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  BadgeCheck,
  CheckCircle2,
  Calendar,
  BookOpen,
  Ruler,
  Compass,
  Smile,
  Coffee,
  HeartHandshake,
  Wine,
  Users,
  ShieldCheck,
  Zap,
  Globe,
  Quote,
  MessageCircle,
  UserCheck
} from 'lucide-react';

export default function FullProfileModal({ candidate, onClose, onLike, onDecline, onOpenChat }) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!candidate) return null;

  // Refined values
  const height = candidate.height || (candidate.gender === 'male' ? "5'10\"" : "5'4\"");
  const yearOfStudy = candidate.yearOfStudy || "3rd Year";
  const hometown = candidate.university || candidate.hometown || candidate.state || "Brooklyn, NY";
  const religion = candidate.religion || "Hindu";
  const relationshipType = candidate.relationshipType 
    ? (Array.isArray(candidate.relationshipType) ? candidate.relationshipType[0] : candidate.relationshipType)
    : "Long-term Relationship";
  const habits = candidate.habits 
    ? (Array.isArray(candidate.habits) ? candidate.habits.join(', ') : candidate.habits)
    : "Social Drinker, Non-Smoker";
  const personalityType = candidate.personalityType || "Ambivert";
  
  // Tags matching Screen 3: Photography, Surfing, 18+ (or candidate's interests)
  const tags = candidate.interests?.length 
    ? candidate.interests.slice(0, 3) 
    : ["Photography", "Surfing", "18+"];

  const photos = candidate.photos || [
    candidate.avatar,
    candidate.gender === 'female' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    candidate.gender === 'female'
      ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80'
  ];

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-slide-up select-none bg-[#FDF8FA] overflow-hidden">
      
      {/* ----------------------------------------------------------------- */}
      {/* SCREEN 3 TOP BAR: Back button, Name, Avatar ring                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center text-slate-800 transition-all active:scale-95 border border-slate-200/80 shadow-xs cursor-pointer"
          title="Back"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.4]" />
        </button>

        <h3 className="font-extrabold text-[17px] text-slate-900 font-display tracking-tight">
          {candidate.name}
        </h3>

        <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FF2E79] to-[#FFA1B5] shadow-xs">
          <div className="w-full h-full rounded-full overflow-hidden p-[1px] bg-white">
            <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover rounded-full" />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* SCROLLABLE CANVAS                                                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-32 space-y-4">
        
        {/* 1. HERO PHOTO CARD (Screen 3 Reference Style) */}
        <div className="relative w-full h-[430px] rounded-[28px] overflow-hidden shadow-md border border-white bg-slate-950">
          <img 
            src={photos[activePhotoIndex]} 
            alt={candidate.name} 
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Photo Tap Zones */}
          <div className="absolute inset-0 flex z-20">
            <div 
              className="w-1/2 h-full cursor-pointer"
              onClick={() => setActivePhotoIndex(prev => Math.max(0, prev - 1))}
            />
            <div 
              className="w-1/2 h-full cursor-pointer"
              onClick={() => setActivePhotoIndex(prev => Math.min(photos.length - 1, prev + 1))}
            />
          </div>

          {/* Top Carousel Dots: ● ○ ○ ○ */}
          <div className="absolute top-4 left-4 flex gap-1.5 z-20 pointer-events-none items-center">
            {photos.map((_, idx) => (
              <div 
                key={idx}
                className={`rounded-full transition-all duration-300 ${
                  activePhotoIndex === idx ? 'w-5 h-1.5 bg-white shadow-xs' : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Location Tag Top Right: 📍 Brooklyn, NY */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <span className="bg-black/45 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span>{candidate.university?.includes(',') ? candidate.university : `${candidate.university?.split(' ')[0] || 'Campus'}, ${candidate.state?.split(' ')[0] || 'NCR'}`}</span>
            </span>
          </div>

          {/* Bottom Gradient & Details */}
          <div className="absolute inset-x-0 bottom-0 pt-28 pb-5 px-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-20">
            {/* Active status */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              <span className="text-[11px] font-bold text-white tracking-wider">Active</span>
            </div>

            {/* Name */}
            <h1 className="text-[28px] font-black tracking-tight text-white leading-tight mb-2.5">
              {candidate.name}
            </h1>

            {/* Tag pills matching Screen 3 (Photography, Surfing, 18+) */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span key={idx} className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white border border-white/25">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>


        {/* 2. ABOUT ME / BIO (EDITORIAL QUOTE CARD) */}
        {candidate.bio && (
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#FF2E79]" />
                <span>About Me</span>
              </span>
              <span className="text-[10px] font-bold text-[#FF2E79] bg-rose-50 px-2.5 py-0.5 rounded-full">
                Bio
              </span>
            </div>
            <p className="text-[14.5px] font-medium text-slate-800 leading-relaxed italic">
              "{candidate.bio}"
            </p>
          </div>
        )}

        {/* 3. EDUCATION & CAMPUS (SPACIOUS LUXURY ROWS) */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#FF2E79]" />
              <span>Campus & Education</span>
            </span>
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
              Verified Student ✓
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">University / College</span>
                <p className="text-sm font-bold text-slate-900">{candidate.university || 'Bennett University'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-600 border border-slate-100">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Degree / Major</span>
                <p className="text-sm font-bold text-slate-900">{candidate.branch || candidate.occupation || 'Computer Science'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-600 border border-slate-100">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Academic Year</span>
                <p className="text-sm font-bold text-slate-900">{yearOfStudy}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Hometown</span>
                <p className="text-sm font-bold text-slate-900 truncate">{hometown}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LIFESTYLE & PERSONALITY (SPACIOUS FULL CARDS) */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <span>Personal Details</span>
            </span>
            <span className="text-[10.5px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/50">
              {personalityType}
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Height</span>
                <p className="text-sm font-bold text-slate-900">{height}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Faith / Culture</span>
                <p className="text-sm font-bold text-slate-900">{religion}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Social Habits</span>
              <p className="text-sm font-bold text-slate-900">{habits}</p>
            </div>
          </div>
        </div>

        {/* 5. CONNECTION PREFERENCES & QUALITIES */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#FF2E79]" />
              <span>Dating Intent & Vibe</span>
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Looking For</span>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 text-[#FF2E79] text-xs font-bold border border-rose-200">
                <Heart className="w-4 h-4 fill-[#FF2E79]" />
                <span>{relationshipType}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Preferred Dating Vibe</span>
              <div className="flex flex-wrap gap-2">
                {datingVibes.map((vibe, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/60">
                    {vibe}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">Core Qualities</span>
              <div className="flex flex-wrap gap-2">
                {qualities.map((q, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* LUXURY FLOATING ACTION BAR: Pass + Like + Confirm Match            */}
      {/* ----------------------------------------------------------------- */}
      {/* ----------------------------------------------------------------- */}
      {/* SCREEN 3 ACTION BAR: ✕ + ♥ + 💬 Message                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-2xl px-5 pt-3.5 pb-5 rounded-t-[32px] border-t border-slate-100 shadow-[0_-12px_40px_rgba(0,0,0,0.06)] z-30">
        <div className="text-left mb-3">
          <span className="text-[13px] font-bold text-slate-800">
            Potential Match For You!
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Pass Button ✕ */}
          <button
            onClick={() => { 
              onDecline(candidate); 
              onClose(); 
            }}
            className="w-12 h-12 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200/60"
            title="Pass"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Like Button ♥ */}
          <button
            onClick={() => { 
              onLike(candidate); 
              onClose(); 
            }}
            className="w-12 h-12 rounded-full bg-white border border-pink-100 hover:border-pink-200 text-[#FF2E79] flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            title="Like Profile"
          >
            <Heart className="w-5 h-5 fill-[#FF2E79]" />
          </button>

          {/* Message CTA (Black Pill Button) */}
          <button
            onClick={() => { 
              if (onOpenChat) {
                onOpenChat(candidate);
              } else {
                onLike(candidate);
                onClose();
              }
            }}
            className="flex-1 h-12 rounded-full bg-black hover:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            title="Message"
          >
            <MessageCircle className="w-4 h-4 fill-white text-white" />
            <span>Message</span>
          </button>
        </div>
      </div>

    </div>
  );
}
