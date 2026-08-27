import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  GraduationCap, 
  Coins, 
  LogOut, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Bell, 
  Navigation, 
  ChevronRight,
  Award,
  Edit3,
  Lock,
  HeartHandshake,
  BookOpen,
  Info
} from 'lucide-react';
import EditProfileModal from './EditProfileModal';

export default function ProfileView({ user, onLogout, onRequestRefund, onOpenPermissions, onUpdateUser, onReplayTour }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLockNotice, setShowLockNotice] = useState(false);

  const planName = user.plan === 'basic' ? 'Basic (₹100)' : user.plan === 'premium' ? 'Premium (₹250)' : 'VIP Elite (₹449)';

  // Round participation check:
  // If user is currently in an active matchmaking round (e.g. status: 'active'), preferences are locked mid-round.
  const isRoundActive = user.status === 'active' && !user.roundCompleted;

  const handleEditClick = () => {
    if (isRoundActive) {
      setShowLockNotice(true);
    } else {
      setShowEditModal(true);
    }
  };

  const handleSaveProfile = (updatedData) => {
    if (onUpdateUser) {
      onUpdateUser(updatedData);
    }
  };

  const fallbackAvatar = user.gender === 'female'
    ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';

  const avatarUrl = user.avatar || fallbackAvatar;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative select-none p-4 overflow-y-auto no-scrollbar space-y-3.5 animate-slide-up pb-28">
      
      {/* ------------------------------------------------------------- */}
      {/* PROFILE HEADER CARD                                           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm text-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 inset-x-0 h-14 bg-gradient-to-r from-[#FF2D55] via-pink-500 to-rose-400"></div>

        <div className="relative pt-3">
          <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-white shadow-md mb-2 bg-slate-100">
            <img 
              src={avatarUrl} 
              alt={user.name || 'User'} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackAvatar;
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h3 className="font-extrabold text-base text-slate-900 font-display">{user.name || 'User'}, {user.age || 22}</h3>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#FF2D55]" />
            <span>{user.university || 'Bennett University'}</span>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{user.hometown || user.state || 'Delhi NCR'}</span>
          </div>

          {/* Key Metric Chips */}
          <div className="flex justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold">
              {user.height || "5'8\""}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold capitalize">
              {user.gender || 'Male'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[#FF2D55] text-[10px] font-extrabold">
              {user.personalityType || 'Ambivert'}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EDIT QUESTIONNAIRE & PREFERENCES MODULE                       */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Match Questionnaire & Preferences
            </span>
            <h4 className="text-xs font-bold text-slate-900 mt-0.5">Your Match Profile Data</h4>
          </div>

          {isRoundActive ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Locked for Round 1</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              Editable
            </span>
          )}
        </div>

        {/* Lock Notice Modal / Inline Banner */}
        {showLockNotice && isRoundActive && (
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1 animate-slide-up">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Preferences Locked during Live Round</span>
            </div>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Matchmaking Round 1 is currently in progress. To guarantee algorithmic fairness, questionnaire details cannot be modified during a live round. You can edit them before entering Round 2.
            </p>
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => setShowLockNotice(false)}
                className="text-[10px] font-extrabold text-amber-900 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Action Button to Edit or View */}
        <button
          onClick={handleEditClick}
          className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isRoundActive 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
              : 'bg-[#FF2D55] hover:bg-[#E02447] text-white shadow-md shadow-rose-500/20'
          }`}
        >
          {isRoundActive ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>View Locked Preferences</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details & Match Preferences</span>
            </>
          )}
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PLAN TIER STATUS CARD                                         */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 rounded-2xl p-4 text-white shadow-md shadow-rose-200">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-100">Active Membership</span>
          </div>
          <span className="text-xs font-black uppercase text-amber-300 bg-black/20 px-2 py-0.5 rounded-full">
            {user.plan || 'elite'}
          </span>
        </div>

        <h4 className="text-base font-black font-display">{planName}</h4>
        <p className="text-[10.5px] text-pink-100 font-medium mt-0.5 leading-relaxed">
          Highest priority candidate matching & guaranteed full refund protection if no mutual match is found.
        </p>

        {/* Refund Status */}
        {user.status === 'refund_requested' ? (
          <div className="mt-3 pt-2.5 border-t border-white/20 text-[10px] font-bold text-amber-200 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            <span>Refund request submitted to Admin. Verification in progress...</span>
          </div>
        ) : (
          <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between">
            <span className="text-[10px] text-pink-100 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Full Refund Guarantee</span>
            </span>
            <button
              onClick={onRequestRefund}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-[10px] font-extrabold transition-all cursor-pointer"
            >
              Claim Refund
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PERMISSIONS & SERVICES                                        */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          Services & Privacy
        </span>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Campus Radar Location</span>
              <span className="text-[10px] text-slate-400 block">Active • Real-time distance matching</span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-rose-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Push Notifications</span>
              <span className="text-[10px] text-slate-400 block">Enabled for matches & round alerts</span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        </div>

        <div 
          onClick={onReplayTour}
          className="flex items-center justify-between py-1.5 border-t border-slate-100 cursor-pointer hover:bg-pink-50/50 rounded-xl px-1 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF2D55]" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Interactive App Guide</span>
              <span className="text-[10px] text-slate-400 block">Replay button tooltips & workflow walkthrough</span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-[#FF2D55] bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
            Replay 💡
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LOGOUT ACTION                                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-full flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Profile</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EDIT PROFILE MODAL                                            */}
      {/* ------------------------------------------------------------- */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}

    </div>
  );
}
