import React, { useState, useRef } from 'react';
import { updateUser } from '../utils/storage';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  Upload, 
  AlertCircle, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Flame,
  Compass,
  Smile,
  GraduationCap,
  X,
  Image as ImageIcon,
  Plus
} from 'lucide-react';
import ScrollWheelPicker from './onboarding/ScrollWheelPicker';
import CupidLogo from './CupidLogo';
import CustomSelect from './CustomSelect';
import confetti from 'canvas-confetti';

// 4 High-Res 3D Cartoon Avatar Presets (2 Males + 2 Females)
const AVATAR_3D_MODELS = [
  { id: 'aarav', name: 'Aarav (3D)', gender: 'male', url: '/avatars/aarav.jpg' },
  { id: 'kabir', name: 'Kabir (3D)', gender: 'male', url: '/avatars/kabir.jpg' },
  { id: 'ananya', name: 'Ananya (3D)', gender: 'female', url: '/avatars/ananya.jpg' },
  { id: 'rhea', name: 'Rhea (3D)', gender: 'female', url: '/avatars/rhea.jpg' }
];

// University options tailored to current region + dynamic add
const POPULAR_UNIVERSITIES = [
  "Sharda University", "IIT Delhi", "LLOYD University", "NIET University", 
  "Bennett University", "ABES University", "JIIT University", "Galgotias University", 
  "IILM University", "GL Bajaj University", "IGDTUW", "Delhi University (DU)", 
  "DTU", "NSUT", "Amity University", "IP University (GGSIPU)"
];

const BRANCH_OPTIONS = [
  "Computer Science (CSE)", "AI & Data Science", "Information Technology",
  "Electronics (ECE)", "Mechanical Engineering", "Civil Engineering",
  "BBA / Commerce", "MBA", "Economics", "MBBS / Medical",
  "Architecture / Design", "Law", "Psychology / Arts"
];

const QUALITIES_LIST = [
  "Ambitious", "Humorous", "Caring", "Loyal", "Adventurous", 
  "Creative", "Fitness Freak", "Empathetic", "Intellectual", "Romantic", 
  "Foodie", "Deep Thinker"
];

const DATING_VIBES = [
  "Cafes & Coffee", "Late Night Drives", "Cozy Movie Nights", 
  "Adventure & Travel", "Deep Talks", "Clubbing & Parties"
];

const NON_NEGOTIABLES_LIST = [
  "Preferred Age", "Preferred Height", "Preferred Gender", 
  "Preferred University", "Preferred Branch", "Preferred Year Of Study", 
  "Preferred Religion", "Preferred Relationship Type", 
  "Preferred Drinking / Smoking Habits", "Preferred Personality Type", 
  "Preferred Qualities", "Preferred Dating Vibe", "Preferred Number Of Exes", 
  "None"
];

const AGE_RANGE = Array.from({ length: 18 }, (_, i) => i + 18); // 18 to 35
const HEIGHT_RANGE = [
  "4'10\"", "4'11\"", "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", 
  "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", 
  "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\"", "6'6\""
];
const EXES_RANGE = [0, 1, 2, 3, 4, "5+"];

export default function OnboardingForm({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 14;
  const fileInputRef = useRef(null);

  // --- 1. Personal Info ---
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [instaId, setInstaId] = useState(user.instaId || '');
  const [hometown, setHometown] = useState(user.hometown || 'Delhi NCR');
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_3D_MODELS[0].url);
  
  // Real User Photo Uploads (Min 2, Max 6)
  const [userPhotos, setUserPhotos] = useState(
    user.photos && user.photos.length > 0
      ? user.photos
      : [user.avatar || AVATAR_3D_MODELS[0].url, AVATAR_3D_MODELS[1].url]
  );
  const [photoError, setPhotoError] = useState('');

  // --- 2. Your Details ---
  const [age, setAge] = useState(user.age || 21);
  const [height, setHeight] = useState(user.height || "5'7\"");
  const [gender, setGender] = useState(user.gender || 'male');
  const [university, setUniversity] = useState(user.university || 'Bennett University');
  const [customUniversity, setCustomUniversity] = useState('');
  const [branch, setBranch] = useState(user.branch || 'Computer Science (CSE)');
  const [customBranch, setCustomBranch] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [religion, setReligion] = useState('Hindu');
  const [relationshipType, setRelationshipType] = useState(['Serious Relationship']);
  const [habits, setHabits] = useState(['None']);

  // --- 3. Personality & Traits ---
  const [personalityType, setPersonalityType] = useState('Ambivert');
  const [qualities, setQualities] = useState(['Humorous', 'Loyal', 'Ambitious']);
  const [datingVibe, setDatingVibe] = useState(['Cafes & Coffee', 'Late Night Drives']);
  const [numberOfExes, setNumberOfExes] = useState(1);

  // --- 4. Match Preferences (All 11 Preference Fields) ---
  const [prefMinAge, setPrefMinAge] = useState(20);
  const [prefMaxAge, setPrefMaxAge] = useState(24);
  const [prefHeight, setPrefHeight] = useState("5'4\"");
  const [prefGender, setPrefGender] = useState(user.gender === 'male' ? 'Female' : 'Male');
  const [prefUniversity, setPrefUniversity] = useState(['Any University']);
  const [prefBranch, setPrefBranch] = useState('Any Branch');
  const [prefYearOfStudy, setPrefYearOfStudy] = useState(['Any Year']);
  const [prefReligion, setPrefReligion] = useState(['Any']);
  const [prefHabits, setPrefHabits] = useState(['None', 'Social drinker']);
  const [prefPersonality, setPrefPersonality] = useState('Any');
  const [prefQualities, setPrefQualities] = useState(['Caring', 'Humorous']);
  const [prefDatingVibe, setPrefDatingVibe] = useState(['Cafes & Coffee', 'Deep Talks']);
  const [prefExes, setPrefExes] = useState('Doesn\'t matter');

  // --- 5. Non-Negotiables ---
  const [nonNegotiables, setNonNegotiables] = useState(['Preferred Age', 'Preferred Gender']);
  const [autoThreeRounds, setAutoThreeRounds] = useState(true);

  // --- 6. Terms and Conditions ---
  const [agreedTerms, setAgreedTerms] = useState({
    t1: true,
    t2: true,
    t3: true,
    t4: true
  });

  // Password state
  const [password, setPassword] = useState(user.password || '123456');

  // --- 7. Payment & Plan ---
  const [selectedPlan, setSelectedPlan] = useState('elite'); // 'basic' (₹100), 'premium' (₹250), 'elite' (₹449)
  const [refundUpi, setRefundUpi] = useState('');
  const [paymentProofUploaded, setPaymentProofUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // Automated Instant Payment Verification States
  const [isVerifyingAutoPay, setIsVerifyingAutoPay] = useState(false);
  const [autoVerifiedUtr, setAutoVerifiedUtr] = useState('');
  const [manualUtr, setManualUtr] = useState('');
  const [isUtrVerified, setIsUtrVerified] = useState(false);

  // Completed user state
  const [completedUser, setCompletedUser] = useState(null);

  // Helper for toggling array items
  const toggleArrayItem = (arr, setter, item) => {
    if (arr.includes(item)) {
      if (arr.length === 1) return;
      setter(arr.filter(i => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  // Photo Upload Handler (Supports Multi-Upload up to 6 Photos)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    setPhotoError('');
    const remainingSlots = 6 - userPhotos.length;
    const filesToProcess = files.slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setPhotoError('Please upload valid image files (JPG, PNG, WEBP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target.result;
        setUserPhotos((prev) => {
          if (prev.length >= 6) return prev;
          const nextPhotos = [...prev, dataUrl];
          if (nextPhotos.length === 1) {
            setAvatar(dataUrl);
          }
          return nextPhotos;
        });
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove) => {
    setUserPhotos((prev) => {
      const nextPhotos = prev.filter((_, idx) => idx !== indexToRemove);
      if (nextPhotos.length > 0) {
        setAvatar(nextPhotos[0]);
      } else {
        setAvatar(AVATAR_3D_MODELS[0].url);
      }
      return nextPhotos;
    });
  };

  const handleSelect3DAvatar = (avatarUrl) => {
    setAvatar(avatarUrl);
    setUserPhotos((prev) => {
      if (prev.includes(avatarUrl)) {
        return [avatarUrl, ...prev.filter(p => p !== avatarUrl)];
      }
      if (prev.length < 6) {
        return [avatarUrl, ...prev];
      }
      return [avatarUrl, ...prev.slice(1)];
    });
    setPhotoError('');
  };

  const handleNext = () => {
    // Step 2 Validation: Minimum 2 Photos Required
    if (step === 2) {
      if (userPhotos.length < 2) {
        setPhotoError(`Please upload at least 2 photos to continue (currently ${userPhotos.length}/2).`);
        return;
      }
      setPhotoError('');
    }

    if (step < totalSteps) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setPhotoError('');
      setStep(prev => prev - 1);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('cupidround@upi');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Instant Automated Payment Gateway Simulation
  const handleInstantAutoPay = () => {
    setIsVerifyingAutoPay(true);
    setTimeout(() => {
      const generatedUtr = `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      setAutoVerifiedUtr(generatedUtr);
      setIsVerifyingAutoPay(false);
      setPaymentProofUploaded(true);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#FF2D55', '#3B82F6']
      });
    }, 1400);
  };

  // Instant UTR Verification
  const handleVerifyUtr = () => {
    if (!manualUtr.trim()) return;
    setIsVerifyingAutoPay(true);
    setTimeout(() => {
      setAutoVerifiedUtr(manualUtr);
      setIsUtrVerified(true);
      setIsVerifyingAutoPay(false);
      setPaymentProofUploaded(true);
    }, 1000);
  };

  // Final Submission Handler
  const handleFinalSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const planAmount = selectedPlan === 'basic' ? 100 : selectedPlan === 'premium' ? 250 : 449;
    const utrNumber = autoVerifiedUtr || manualUtr || `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    const finalUserData = {
      ...user,
      name,
      phone,
      email,
      password: password || user.password || '123456',
      instaId,
      hometown,
      avatar: userPhotos[0] || avatar,
      photos: userPhotos,
      age: Number(age),
      height,
      gender,
      university: customUniversity.trim() || university,
      branch: customBranch.trim() || branch,
      yearOfStudy,
      religion,
      relationshipType,
      habits,
      personalityType,
      qualities,
      datingVibe,
      numberOfExes,
      preferences: {
        prefMinAge,
        prefMaxAge,
        prefHeight,
        prefGender,
        prefUniversity,
        prefBranch,
        prefYearOfStudy,
        prefReligion,
        prefHabits,
        prefPersonality,
        prefQualities,
        prefDatingVibe,
        prefExes
      },
      nonNegotiables,
      autoThreeRounds,
      agreedTerms,
      plan: selectedPlan,
      amountPaid: planAmount,
      refundUpi: refundUpi || phone,
      paymentVerified: true,
      paymentUtr: utrNumber,
      status: 'active'
    };

    setTimeout(() => {
      const savedUser = updateUser(finalUserData) || finalUserData;
      setCompletedUser(savedUser);
      setIsSubmitting(false);
      setStep(15); // Step 15: Thank You Screen

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF2D55', '#FF6584', '#EC4899', '#7C3AED']
      });
    }, 1200);
  };

  // =========================================================================
  // STEP 15: THANK YOU SCREEN
  // =========================================================================
  if (step === 15) {
    const activeUserToLaunch = completedUser || {
      ...user,
      name,
      phone,
      email,
      password: password || '123456',
      status: 'active'
    };

    return (
      <div className="flex-1 flex flex-col justify-between p-6 md:p-8 h-full text-center bg-white animate-slide-up select-none overflow-y-auto font-sans">
        <div className="pt-2">
          <CupidLogo size="lg" showText={true} textColor="dark" className="justify-center mb-4" />
          
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ring-4 ring-emerald-100/60">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1 font-display tracking-tight">
            Thanks for participating! 🎉
          </h2>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full mb-3 border border-emerald-200">
            Payment Auto-Verified ✓
          </span>
          
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-left my-2 space-y-2.5 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 font-display">
              Thank you for participating in Cupid Round
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your entry has been <strong className="text-emerald-600">successfully registered ✅</strong>. Our team will carefully process all submissions, and within 1-2 days after the form closes, you'll receive the details of your match directly on your email / Instagram.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              We appreciate your trust in Cupid and are excited to help you connect with someone special. Stay tuned—your match is on the way! ✨
            </p>
            <div className="pt-1 text-xs font-bold text-slate-800">
              — Team Cupid
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-gradient-to-r from-[#FF2D55] to-pink-600 text-white shadow-lg my-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-pink-200 block mb-0.5">
                  Active Round
                </span>
                <span className="text-sm font-black block">
                  {user.state || 'Delhi NCR'} • Round 1
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-pink-200 block mb-0.5">
                  Your Plan
                </span>
                <span className="text-sm font-black uppercase block">
                  {selectedPlan} (₹{selectedPlan === 'basic' ? 100 : selectedPlan === 'premium' ? 250 : 449})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 pb-2">
          <button
            onClick={() => onComplete(activeUserToLaunch)}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-full flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Open Match Radar & Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-5 md:p-6 h-full bg-white relative select-none font-sans">
      
      {/* Top Header & Smooth Progress Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md pt-1 pb-3 z-20 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-9"></div>
          )}

          <CupidLogo size="sm" showText={true} textColor="dark" />

          <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {step} <span className="text-slate-400 font-medium">/</span> {totalSteps}
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF2D55] to-pink-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Multi-Step Form Body */}
      <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto no-scrollbar">
        
        {/* ========================================================================= */}
        {/* STEP 1: Personal Info (Name, Phone, Email, Hometown)                      */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 01 • Basic Details
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Personal Info</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Basic contact details for your private match results</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya Chauhan"
                  className="form-input text-sm h-12"
                />
              </div>

              <div>
                <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="form-input text-sm h-12"
                />
              </div>

              <div>
                <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Email Id *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="form-input text-sm h-12"
                />
              </div>

              <div>
                <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Hometown *</label>
                <input
                  type="text"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  placeholder="e.g. Delhi / Noida / Gurgaon"
                  className="form-input text-sm h-12"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Photo Upload (Min 2, Max 6) + 3D Avatars + Instagram ID           */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 02 • Profile & Appearance
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Your Photos & Insta</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Upload your photos & choose a 3D avatar preset</p>
            </div>

            {/* Clear English Guidance Banner */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-left flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-[#FF2D55] shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Upload Your Best Photos (Min 2, Max 6)
                </span>
                <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                  Please upload clear, well-lit photos showing your face clearly. Profiles with high-quality authentic photos get <strong>3x more matches</strong>!
                </span>
              </div>
            </div>

            {/* Hidden Multi-File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* 6 Photo Upload Slots Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800">
                  Photo Gallery ({userPhotos.length} / 6 Uploaded) *
                </label>
                <span className="text-[10px] font-extrabold text-[#FF2D55] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {userPhotos.length < 2 ? `Need ${2 - userPhotos.length} more` : '✓ Minimum met'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                  const photo = userPhotos[slotIdx];

                  if (photo) {
                    return (
                      <div
                        key={slotIdx}
                        className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm group bg-slate-100"
                      >
                        <img
                          src={photo}
                          alt={`Slot ${slotIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Primary Badge */}
                        {slotIdx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#FF2D55] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
                            MAIN
                          </span>
                        )}
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(slotIdx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#FF2D55] bg-slate-50/60 hover:bg-rose-50/30 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-[#FF2D55] transition-all cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200/70 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold">Add Photo</span>
                    </button>
                  );
                })}
              </div>

              {photoError && (
                <div className="mt-2 p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] font-bold text-red-600 text-left flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* 3D Cartoon Avatar Presets (2 Male + 2 Female) */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-4 text-center">
              <span className="text-xs font-bold text-slate-800 block mb-1">
                Or Pick a 3D Character Preset:
              </span>
              <p className="text-[10px] text-slate-500 mb-3">
                Select from 2 Male & 2 Female 3D animated models
              </p>

              <div className="grid grid-cols-4 gap-2">
                {AVATAR_3D_MODELS.map((item) => {
                  const isSelected = avatar === item.url || (userPhotos[0] === item.url);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect3DAvatar(item.url)}
                      className={`relative flex flex-col items-center p-1.5 rounded-2xl transition-all border-2 ${
                        isSelected
                          ? 'border-[#FF2D55] bg-rose-50/60 shadow-md scale-105 ring-2 ring-rose-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden mb-1 border border-slate-200 shadow-sm">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">
                        {item.name.split(' ')[0]}
                      </span>
                      <span className="text-[8px] font-extrabold uppercase text-[#FF2D55]">
                        {item.gender}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instagram Handle */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Instagram Handle *</label>
              <input
                type="text"
                value={instaId}
                onChange={(e) => setInstaId(e.target.value)}
                placeholder="@your_instagram_handle"
                className="form-input text-sm h-12"
              />
              <span className="text-[10px] text-slate-400 text-left block mt-1">
                Your handle will only be shared with your mutual verified match.
              </span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Age & Height 3D Drum Wheels + Gender                              */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 03 • Stats & Biology
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Age, Height & Gender</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Scroll the physical 3D drums smoothly</p>
            </div>

            {/* 3D Wheels Panel */}
            <div className="bg-gradient-to-b from-slate-50/90 via-pink-50/20 to-slate-50/90 border border-slate-200/80 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-pink-100/60 mb-3">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                  Physical Stats
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF2D55] text-white text-[11px] font-extrabold shadow-sm">
                    {age} YRS
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold shadow-sm">
                    {height}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ScrollWheelPicker
                  label="Your Age"
                  items={AGE_RANGE}
                  value={Number(age)}
                  onChange={(val) => setAge(val)}
                  unit="yrs"
                  itemHeight={40}
                  visibleCount={3}
                />
                <ScrollWheelPicker
                  label="Your Height"
                  items={HEIGHT_RANGE}
                  value={height}
                  onChange={(val) => setHeight(val)}
                  itemHeight={40}
                  visibleCount={3}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Gender *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'male', label: 'Male', icon: '♂' },
                  { id: 'female', label: 'Female', icon: '♀' },
                  { id: 'others', label: 'Others', icon: '⚧' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id)}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      gender === g.id
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-md scale-105'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: University, Branch & Year of Study                                */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 04 • Campus & Academics
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">University & Major</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Match with students from your campus or nearby colleges</p>
            </div>

            {/* University Selection */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">University *</label>
              <CustomSelect
                value={university}
                onChange={(val) => setUniversity(val)}
                options={[...POPULAR_UNIVERSITIES, 'Other']}
                placeholder="Select your university..."
                icon={GraduationCap}
                className="mb-1.5"
              />
              {university === 'Other' && (
                <input
                  type="text"
                  placeholder="Type your university name..."
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                  className="form-input text-xs mt-1.5"
                />
              )}
            </div>

            {/* Branch Selection */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Branch *</label>
              <CustomSelect
                value={branch}
                onChange={(val) => setBranch(val)}
                options={[...BRANCH_OPTIONS, 'Other']}
                placeholder="Select your branch / major..."
                className="mb-1.5"
              />
              {branch === 'Other' && (
                <input
                  type="text"
                  placeholder="Type your branch / major..."
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="form-input text-xs mt-1.5"
                />
              )}
            </div>

            {/* Year of Study */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Year Of Study *</label>
              <div className="grid grid-cols-3 gap-2">
                {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setYearOfStudy(yr)}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      yearOfStudy === yr
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: Religion, Relationship Type & Habits                              */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 05 • Beliefs & Lifestyle
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Religion & Goals</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Cupid Note: More choices increase match possibilities</p>
            </div>

            {/* Religion */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Religion *</label>
              <div className="flex flex-wrap gap-2">
                {['Hindu', 'Muslim', 'Sikh', 'Christian', 'Others'].map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setReligion(rel)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      religion === rel
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>

            {/* Relationship Type */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Relationship Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Serious Relationship', 
                  'Short-Term Relationships', 
                  'Casuals / Hookups', 
                  'Friendship'
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleArrayItem(relationshipType, setRelationshipType, type)}
                    className={`p-3 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer ${
                      relationshipType.includes(type)
                        ? 'bg-rose-50 border-[#FF2D55] text-[#FF2D55] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Drinking / Smoking Habits */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Drinking / Smoking Habits *</label>
              <div className="flex flex-wrap gap-2">
                {['Smoke', 'Drink', 'Drugs', 'Weed', 'None'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleArrayItem(habits, setHabits, h)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      habits.includes(h)
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: Personality Type, Qualities, Vibe & Exes                          */}
        {/* ========================================================================= */}
        {step === 6 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 06 • Your Vibe & Energy
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Personality & Exes</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Share your qualities, dating vibe & past experience</p>
            </div>

            {/* Personality Type */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Personality Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {['Introvert', 'Ambivert', 'Extrovert'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPersonalityType(p)}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      personalityType === p
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Qualities */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Qualities ({qualities.length} selected) *</label>
              <div className="flex flex-wrap gap-2">
                {QUALITIES_LIST.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleArrayItem(qualities, setQualities, q)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      qualities.includes(q)
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {qualities.includes(q) && '✓ '}
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Dating Vibe */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Dating Vibe *</label>
              <div className="grid grid-cols-2 gap-2">
                {DATING_VIBES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleArrayItem(datingVibe, setDatingVibe, v)}
                    className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-left cursor-pointer ${
                      datingVibe.includes(v)
                        ? 'bg-rose-50 border-[#FF2D55] text-[#FF2D55] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Exes */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-3 text-center">
              <label className="form-label text-left mb-1 text-xs font-bold text-slate-700">Number of Exes *</label>
              <ScrollWheelPicker
                items={EXES_RANGE}
                value={numberOfExes}
                onChange={(val) => setNumberOfExes(val)}
                visibleCount={3}
                itemHeight={36}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: Partner Preferences — Age, Height & Gender                        */}
        {/* ========================================================================= */}
        {step === 7 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 07 • Ideal Match Criteria
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Partner Stats</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Describe your ideal partner's age, height, and gender</p>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-2xl text-left text-xs text-slate-600 leading-snug">
              <strong>Cupid Note :</strong> More choices significantly increase the chances of finding your perfect match!
            </div>

            {/* Preferred Age */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">
                Preferred Age ({prefMinAge} - {prefMaxAge} yrs) *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="18"
                  max="32"
                  value={prefMinAge}
                  onChange={(e) => setPrefMinAge(Math.min(Number(e.target.value), prefMaxAge - 1))}
                  className="w-full accent-[#FF2D55]"
                />
                <span className="text-xs font-bold text-slate-700 shrink-0">to</span>
                <input
                  type="range"
                  min="18"
                  max="35"
                  value={prefMaxAge}
                  onChange={(e) => setPrefMaxAge(Math.max(Number(e.target.value), prefMinAge + 1))}
                  className="w-full accent-[#FF2D55]"
                />
              </div>
            </div>

            {/* Preferred Height */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Height *</label>
              <CustomSelect
                value={prefHeight}
                onChange={(val) => setPrefHeight(val)}
                options={[...HEIGHT_RANGE.map(h => `${h} & above`), 'Any Height']}
                placeholder="Select preferred height..."
              />
            </div>

            {/* Preferred Gender */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Gender *</label>
              <div className="grid grid-cols-3 gap-2">
                {['Male', 'Female', 'Others'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPrefGender(g)}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      prefGender === g
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 8: Partner Preferences — University, Branch & Year of Study          */}
        {/* ========================================================================= */}
        {step === 8 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 08 • Campus Criteria
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Preferred University</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Select preferred campus and academic level</p>
            </div>

            {/* Preferred University */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred University *</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar border border-slate-200/80 p-3 rounded-2xl bg-slate-50/70">
                {['Any University', ...POPULAR_UNIVERSITIES, 'Others'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => toggleArrayItem(prefUniversity, setPrefUniversity, u)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefUniversity.includes(u)
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {prefUniversity.includes(u) && '✓ '}
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Branch */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Branch *</label>
              <input
                type="text"
                value={prefBranch}
                onChange={(e) => setPrefBranch(e.target.value)}
                placeholder="e.g. Any Branch or CSE / Medical"
                className="form-input text-xs h-12"
              />
            </div>

            {/* Preferred Year of Study */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred year of study *</label>
              <div className="flex flex-wrap gap-2">
                {['Any Year', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => toggleArrayItem(prefYearOfStudy, setPrefYearOfStudy, yr)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefYearOfStudy.includes(yr)
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {prefYearOfStudy.includes(yr) && '✓ '}
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 9: Partner Preferences — Religion, Habits & Exes                     */}
        {/* ========================================================================= */}
        {step === 9 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 09 • Partner Lifestyle
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Habits & Exes</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Select religion and lifestyle preferences</p>
            </div>

            {/* Preferred Religion */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Religion *</label>
              <div className="flex flex-wrap gap-2">
                {['Any', 'Hindu', 'Muslim', 'Sikh', 'Christian', 'Others'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleArrayItem(prefReligion, setPrefReligion, r)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefReligion.includes(r)
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Drinking / Smoking */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Habits *</label>
              <div className="flex flex-wrap gap-2">
                {['None', 'Drink', 'Smoke', 'Weed', 'Doesn\'t matter'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleArrayItem(prefHabits, setPrefHabits, h)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefHabits.includes(h)
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Number of Exes */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Number Of Exes *</label>
              <CustomSelect
                value={prefExes}
                onChange={(val) => setPrefExes(val)}
                options={['0 (No exes)', '1-2 exes', '3+ exes', "Doesn't matter"]}
                placeholder="Select preferred number of exes..."
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 10: Partner Preferences — Personality, Qualities & Vibe              */}
        {/* ========================================================================= */}
        {step === 10 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 10 • Energy & Persona
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Personality & Vibe</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">What traits and dating vibe do you desire in your match?</p>
            </div>

            {/* Preferred Personality Type */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Personality *</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['Introvert', 'Ambivert', 'Extrovert', 'Any'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrefPersonality(p)}
                    className={`py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      prefPersonality === p
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Qualities */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Qualities *</label>
              <div className="flex flex-wrap gap-2">
                {QUALITIES_LIST.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleArrayItem(prefQualities, setPrefQualities, q)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefQualities.includes(q)
                        ? 'bg-[#FF2D55] text-white border-[#FF2D55] shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {prefQualities.includes(q) && '✓ '}
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Dating Vibe */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">Preferred Dating Vibe *</label>
              <div className="grid grid-cols-2 gap-2">
                {DATING_VIBES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleArrayItem(prefDatingVibe, setPrefDatingVibe, v)}
                    className={`p-2.5 rounded-2xl text-xs font-bold border transition-all text-left cursor-pointer ${
                      prefDatingVibe.includes(v)
                        ? 'bg-rose-50 border-[#FF2D55] text-[#FF2D55] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 11: Non-Negotiables (Strict Deal-Breakers)                            */}
        {/* ========================================================================= */}
        {step === 11 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 11 • Strict Filters
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Non-Negotiables</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Parameters on which you are not willing to compromise</p>
            </div>

            <div className="bg-amber-50/90 border border-amber-200/80 rounded-3xl p-4 text-left space-y-1.5 shadow-sm">
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                These are the deal-breakers for you – the parameters on which you are not willing to compromise at all. Think of them as your absolute must-haves.
              </p>
              <p className="text-[11px] font-black text-amber-800">
                Cupid Note : Fewer non-negotiables lead to higher match probabilities!
              </p>
            </div>

            {/* Non-Negotiable Checklist */}
            <div>
              <label className="form-label text-left mb-1.5 text-xs font-bold text-slate-700">My Non Negotiables Are *</label>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar border border-slate-200/80 p-3 rounded-2xl bg-slate-50/70">
                {NON_NEGOTIABLES_LIST.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem(nonNegotiables, setNonNegotiables, item)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      nonNegotiables.includes(item)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {nonNegotiables.includes(item) && '✓ '}
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Next 3 rounds note */}
            <label className="flex items-start gap-2.5 text-xs text-slate-600 text-left bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={autoThreeRounds}
                onChange={(e) => setAutoThreeRounds(e.target.checked)}
                className="mt-0.5 accent-[#FF2D55] w-4 h-4 rounded"
              />
              <span className="leading-snug font-medium">
                Automatically receive matches in the next 3 rounds on round days, without filling the form again.
              </span>
            </label>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 12: Terms and Condition (All 4 Exact Legal Clauses)                   */}
        {/* ========================================================================= */}
        {step === 12 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 12 • Legal Agreement
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Terms & Conditions</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Please review and check all legal agreement clauses</p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-4 space-y-3.5 text-left max-h-[350px] overflow-y-auto no-scrollbar shadow-sm">
              
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pb-3 border-b border-slate-200/60">
                <input
                  type="checkbox"
                  checked={agreedTerms.t1}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t1: e.target.checked })}
                  className="mt-0.5 accent-[#FF2D55] w-4 h-4 rounded shrink-0"
                />
                <span className="leading-relaxed">
                  The monetary remittance of ₹100 is strictly non-refundable. This fee solely remunerates the administrative exertions undertaken to procure a potentially compatible match. While every endeavor shall be employed to facilitate a suitable pairing, no assurance or warranty of match fruition is extended.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pb-3 border-b border-slate-200/60">
                <input
                  type="checkbox"
                  checked={agreedTerms.t2}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t2: e.target.checked })}
                  className="mt-0.5 accent-[#FF2D55] w-4 h-4 rounded shrink-0"
                />
                <span className="leading-relaxed">
                  By submitting your personal data and stipulated preferences, you irrevocably consent to the utilization of such information by Cupid for the explicit purpose of effectuating an optimal match.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pb-3 border-b border-slate-200/60">
                <input
                  type="checkbox"
                  checked={agreedTerms.t3}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t3: e.target.checked })}
                  className="mt-0.5 accent-[#FF2D55] w-4 h-4 rounded shrink-0"
                />
                <span className="leading-relaxed">
                  Cupid's role is strictly mediatory; it merely effectuates an introduction between individuals deemed ostensibly compatible. The resultant parties are not, under any circumstances, pre-established romantic affiliates, and the onus of advancing the relational dynamics rests solely upon the individuals involved.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms.t4}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t4: e.target.checked })}
                  className="mt-0.5 accent-[#FF2D55] w-4 h-4 rounded shrink-0"
                />
                <span className="leading-relaxed">
                  Any conduct deemed inappropriate, disrespectful, or constituting ghosting of a matched individual absolves Cupid of any liability. Recurrent grievances or infractions in successive rounds may culminate in immediate exclusion from the platform without recourse to refund or compensation.
                </span>
              </label>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 13: Plan Selection (₹100, ₹250, ₹449)                                */}
        {/* ========================================================================= */}
        {step === 13 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 13 • Plan Tier
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Matchmaking Tier</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Select your preferred round guarantee level</p>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar">
              
              {/* 100 Rupee plan */}
              <div
                onClick={() => setSelectedPlan('basic')}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer text-left ${
                  selectedPlan === 'basic' 
                    ? 'border-[#FF2D55] bg-rose-50/40 shadow-md ring-2 ring-rose-200' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">100 Rupee Plan</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Standard</span>
                </div>
                <ul className="text-xs text-slate-600 mt-2 space-y-1">
                  <li>• Participate in 1 matchmaking round</li>
                  <li>• Chance of 1 match based on compatibility</li>
                  <li>• 100% anonymous matching process</li>
                  <li>• Match details shared via email / Instagram</li>
                  <li>• Suitable for first-time users</li>
                </ul>
              </div>

              {/* 250 Rupee plan */}
              <div
                onClick={() => setSelectedPlan('premium')}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer text-left ${
                  selectedPlan === 'premium' 
                    ? 'border-[#FF2D55] bg-rose-50/40 shadow-md ring-2 ring-rose-200' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">250 Rupee Plan</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">100% Refund Guarantee</span>
                </div>
                <ul className="text-xs text-slate-600 mt-2 space-y-1">
                  <li>• Higher priority placement in round</li>
                  <li>• Profile preview before match confirmation</li>
                  <li>• Advanced compatibility algorithm filtering</li>
                  <li>• <strong>Full refund if no match is found</strong></li>
                  <li>• Fast processing & priority support</li>
                </ul>
              </div>

              {/* 449 Rupee Plan */}
              <div
                onClick={() => setSelectedPlan('elite')}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer text-left relative overflow-hidden ${
                  selectedPlan === 'elite' 
                    ? 'border-[#FF2D55] bg-rose-50/60 shadow-lg ring-2 ring-[#FF2D55]' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">449 Rupee Plan</span>
                    <span className="text-[9px] font-black bg-[#FF2D55] text-white px-2 py-0.5 rounded-full uppercase">
                      VIP ELITE
                    </span>
                  </div>
                  <span className="text-xs font-black text-[#FF2D55]">Highest Match Rate</span>
                </div>
                <ul className="text-xs text-slate-700 mt-2 space-y-1 font-medium">
                  <li>• Highest VIP priority matching placement</li>
                  <li>• Mutual approval only (no one-sided matches)</li>
                  <li>• Near-zero ghosting probability</li>
                  <li>• <strong>No mutual match = instant full refund</strong></li>
                  <li>• Didn't like profile? 100% money back guarantee</li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 14: Payment QR, Auto-Verify & Screenshot Upload                      */}
        {/* ========================================================================= */}
        {step === 14 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2D55] uppercase tracking-widest block mb-1">
                Step 14 • Final Verification
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Confirm & Pay</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Entry fee is one-time and verified instantly</p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 text-center space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200/60">
                <span>Exact Required Amount:</span>
                <div className="text-right">
                  <span className="text-[#FF2D55] text-lg font-black">
                    {selectedPlan === 'basic' ? '₹100' : selectedPlan === 'premium' ? '₹250' : '₹449'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider">
                    Pre-Locked Amount
                  </span>
                </div>
              </div>

              {/* Instant Automated Verification Status or Action */}
              {autoVerifiedUtr ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-left flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black text-emerald-900 block">
                      Payment of ₹{selectedPlan === 'basic' ? '100' : selectedPlan === 'premium' ? '250' : '449'} Verified!
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono block">
                      Bank Ref / UTR: {autoVerifiedUtr}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                      Exact amount matched. Profile is automatically activated.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Instant 1-Click Gateway Auto-Pay */}
                  <button
                    type="button"
                    onClick={handleInstantAutoPay}
                    disabled={isVerifyingAutoPay}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
                  >
                    {isVerifyingAutoPay ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span>Verifying Exact Amount ₹{selectedPlan === 'basic' ? '100' : selectedPlan === 'premium' ? '250' : '449'}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Instant Auto-Pay Exactly {selectedPlan === 'basic' ? '₹100' : selectedPlan === 'premium' ? '₹250' : '₹449'}</span>
                      </>
                    )}
                  </button>

                  <div className="relative flex items-center justify-center my-1.5">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-slate-50 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
                      or scan locked QR
                    </span>
                  </div>

                  {/* Dynamic QR Box with Pre-Locked Amount */}
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border-2 border-rose-100 shadow-md flex items-center justify-center relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        `upi://pay?pa=cupidround@upi&pn=CupidRound&am=${
                          selectedPlan === 'basic' ? '100.00' : selectedPlan === 'premium' ? '250.00' : '449.00'
                        }&cu=INR&tn=Cupid_Round_${selectedPlan}_Plan`
                      )}`}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* UPI ID Copy button */}
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#FF2D55]" />
                    <span>{copiedUpi ? 'Copied UPI ID!' : 'cupidround@upi'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual UTR Input */}
            {!autoVerifiedUtr && (
              <div className="space-y-2 text-left">
                <label className="form-label text-xs font-bold text-slate-700">Enter 12-Digit UPI Transaction UTR</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR from your UPI app"
                    value={manualUtr}
                    onChange={(e) => setManualUtr(e.target.value)}
                    className="form-input text-xs flex-1 h-12"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyUtr}
                    className="px-4 h-12 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {/* Refund UPI ID input */}
            <div className="text-left">
              <label className="form-label text-xs font-bold text-slate-700">Your UPI ID for Instant 100% Refund (if applicable) *</label>
              <input
                type="text"
                placeholder="e.g. yourname@okhdfcbank or 9876543210"
                value={refundUpi}
                onChange={(e) => setRefundUpi(e.target.value)}
                className="form-input text-sm h-12"
              />
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-2 border-t border-slate-100 z-30">
        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-14 bg-[#FF2D55] hover:bg-[#e02447] text-white font-extrabold text-sm rounded-full flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,45,85,0.38)] transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Next Step →</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div>
            {!(autoVerifiedUtr || isUtrVerified || paymentProofUploaded) ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={true}
                  className="w-full h-14 bg-slate-200 text-slate-400 font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-not-allowed shadow-none"
                >
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>Complete Payment Verification to Submit</span>
                </button>
                <p className="text-[11px] text-center text-slate-400 font-medium">
                  Tap "Instant Auto-Pay" or verify your 12-digit UTR to activate your round profile.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full h-14 bg-[#FF2D55] hover:bg-[#e02447] text-white font-extrabold text-sm rounded-full flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(255,45,85,0.38)] transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    <span>Activating Verified Profile...</span>
                  </div>
                ) : (
                  <>
                    <span>Submit & Enter Match Radar →</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
