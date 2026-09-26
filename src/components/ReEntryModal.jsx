import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  QrCode, 
  Upload, 
  CreditCard, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  Edit3,
  Heart,
  User,
  GraduationCap,
  MapPin,
  Sparkles
} from 'lucide-react';
import { savePaymentSubmission } from '../utils/storage';
import { joinRound } from '../utils/roundManager';

export default function ReEntryModal({ user, roundState, onClose, onEditQuestionnaire, onCompleteReEntry }) {
  const isFemale = (user?.gender || '').toLowerCase() === 'female';
  const [step, setStep] = useState(isFemale ? 3 : 1); // For female direct to details check (step 3), for male plan selection (step 1)
  const [selectedPlan, setSelectedPlan] = useState('elite');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const planPrices = {
    elite: 449,
    premium: 250,
    basic: 100
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!screenshotBase64 && !utrNumber.trim()) {
      setError('Please upload payment screenshot or enter UTR Number.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    // Save payment submission to admin queue
    savePaymentSubmission({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '',
      userState: user.state || roundState.activeState,
      plan: selectedPlan,
      amount: planPrices[selectedPlan] || 100,
      utr: utrNumber.trim(),
      screenshotBase64: screenshotBase64,
      status: 'pending',
      submittedAt: new Date().toISOString()
    });

    setIsSubmitting(false);
    setStep(3); // Advance to profile details check
  };

  const handleFinalize = (shouldEditProfile) => {
    const activePlan = isFemale ? 'free' : selectedPlan;
    const updatedUser = joinRound(user.id, activePlan);

    if (shouldEditProfile) {
      onEditQuestionnaire();
    } else {
      onCompleteReEntry(updatedUser);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="bg-white max-w-md w-full rounded-3xl p-5 sm:p-6 relative shadow-2xl border border-rose-100 animate-slide-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="w-12 h-12 bg-pink-50 text-[#FF2E79] rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-rose-100">
            {isFemale ? <Heart className="w-6 h-6 fill-[#FF2E79]" /> : <RefreshCw className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
            Re-Enter Round #{roundState?.stateRoundMap?.[roundState?.activeState || user?.state] || roundState?.roundNumber || 1}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Active for <strong className="text-[#FF2E79]">{roundState?.activeState || user?.state}</strong>
          </p>
        </div>

        {/* MALE USER STEP 1: SELECT PLAN */}
        {!isFemale && step === 1 && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-700">Select your participation plan for this live round:</p>

            <div className="space-y-2.5">
              {[
                { id: 'elite', title: 'VIP Elite Plan', price: 449, badge: 'Recommended', desc: '16h Spotlight Window + Priority Mutual Match + Refund Protection' },
                { id: 'premium', title: 'Premium Plan', price: 250, badge: 'Popular', desc: '8h Matching Window + Suitable Profiles + Refund Guarantee' },
                { id: 'basic', title: 'Basic Plan', price: 100, badge: 'Standard', desc: '24h Registration + Auto Compatibility Allocation' }
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedPlan === p.id 
                      ? 'border-[#FF2E79] bg-rose-50/50 shadow-xs' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{p.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#FF2E79] text-white">
                        {p.badge}
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#FF2E79]">₹{p.price}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full h-12 bg-[#FF2E79] hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
            >
              <span>Proceed to Payment (₹{planPrices[selectedPlan]})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MALE USER STEP 2: UPI PAYMENT PROOF */}
        {!isFemale && step === 2 && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl text-center space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-pink-300 tracking-wider">Scan QR to Pay via GPay / PhonePe / Paytm</span>
              <div className="bg-white p-3 rounded-xl max-w-[160px] mx-auto shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=cupid.livepro@upi%26pn=CupidRounds%26am=${planPrices[selectedPlan]}%26cu=INR`}
                  alt="UPI QR Code"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <p className="text-xs font-mono font-bold text-slate-300">UPI ID: <span className="text-pink-300">cupid.livepro@upi</span></p>
              <p className="text-[11px] font-bold text-[#FF2E79]">Amount: ₹{planPrices[selectedPlan]}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Upload Payment Screenshot *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-rose-100 file:text-[#FF2E79] hover:file:bg-rose-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">UPI Reference / UTR Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 426189102931"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#FF2E79]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 h-11 bg-slate-100 text-slate-600 font-bold text-xs rounded-full cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 h-11 bg-[#FF2E79] hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md cursor-pointer transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment Proof'}
              </button>
            </div>
          </form>
        )}

        {/* PROFILE DETAILS CHECK & FINAL CONFIRMATION (Both Female & Male Step 3) */}
        {step === 3 && (
          <div className="space-y-4">
            {isFemale ? (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-center space-y-1">
                <span className="px-2.5 py-0.5 bg-[#FF2E79] text-white text-[9.5px] font-black uppercase rounded-full tracking-wider">
                  100% Free VIP Female Entry
                </span>
                <p className="text-xs font-bold text-slate-800 pt-1">
                  Round entry is completely free for female members!
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center space-y-1">
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[9.5px] font-black uppercase rounded-full tracking-wider">
                  Payment Submitted
                </span>
                <p className="text-xs font-bold text-emerald-900">
                  Your plan payment proof has been recorded.
                </p>
              </div>
            )}

            {/* User Profile Summary Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Current Questionnaire Details</span>
                <span className="text-xs font-extrabold text-slate-900">{user?.name} ({user?.age})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700 pt-0.5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">University</span>
                  <span className="truncate block font-bold text-slate-900">{user?.university || 'Bennett University'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Branch</span>
                  <span className="truncate block font-bold text-slate-900">{user?.branch?.split(' ')?.[0] || 'Design'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">Hometown</span>
                  <span className="truncate block font-bold text-slate-900">{user?.hometown || user?.state || 'Delhi'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold">State Round</span>
                  <span className="truncate block font-bold text-slate-900">{user?.state || 'Delhi NCR'}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium text-center">
              Would you like to make any changes to your form details before entering this live round?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleFinalize(true)}
                className="w-full py-3 bg-[#FF2E79] hover:bg-rose-600 text-white font-extrabold text-xs rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <Edit3 className="w-4 h-4" />
                <span>Update Form Details & Enter Round</span>
              </button>

              <button
                type="button"
                onClick={() => handleFinalize(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-full flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
              >
                <span>Confirm Details & Enter Round Now</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
