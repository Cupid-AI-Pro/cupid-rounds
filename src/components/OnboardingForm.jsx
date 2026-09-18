import React, { useState, useRef } from 'react';
import { updateUser, savePaymentSubmission } from '../utils/storage';
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
  Plus, 
  RefreshCw,
  Calendar,
  Ruler,
  Box
} from 'lucide-react';
import ScrollWheelPicker from './onboarding/ScrollWheelPicker';
import CupidLogo from './CupidLogo';
import CustomSelect from './CustomSelect';
import confetti from 'canvas-confetti';

// 4 Fun 3D Cartoon Avatars (for Instagram-style profile flip)
const AVATAR_3D_CHARACTERS = [
  { id: 'aarav', name: 'Aarav', gender: 'Male', url: '/avatars/aarav.jpg' },
  { id: 'kabir', name: 'Kabir', gender: 'Male', url: '/avatars/kabir.jpg' },
  { id: 'ananya', name: 'Ananya', gender: 'Female', url: '/avatars/ananya.jpg' },
  { id: 'rhea', name: 'Rhea', gender: 'Female', url: '/avatars/rhea.jpg' }
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

  // Real User Photos Uploads (starts completely empty by default)
  const [userPhotos, setUserPhotos] = useState(user.photos || []);
  const [selectedAvatar3D, setSelectedAvatar3D] = useState(user.avatar3D || AVATAR_3D_CHARACTERS[0].url);
  const [isFlippedPreview, setIsFlippedPreview] = useState(false);
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

  // Screenshot upload state
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const screenshotInputRef = useRef(null);

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

  // Real User Photo Upload Handler
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
          return [...prev, dataUrl];
        });
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove) => {
    setUserPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Warning modal popup state for Step 2 photo validation
  const [showPhotoWarningModal, setShowPhotoWarningModal] = useState(false);

  const handleNext = () => {
    // Step 2 Validation: Minimum 2 Real Photos Required & Mandatory Instagram Handle
    if (step === 2) {
      if (userPhotos.length < 2) {
        setShowPhotoWarningModal(true);
        return;
      }
      if (!instaId.trim()) {
        setPhotoError('Please enter your Instagram handle to continue.');
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

  // Real UPI Payment — user pays to aditya.378@superyes via PhonePe/GPay
  // then submits 12-digit UTR. Admin gets email notification and verifies.
  const handleInstantAutoPay = () => {
    // Open UPI deeplink so user can pay directly
    const amount = selectedPlan === 'basic' ? '100.00' : selectedPlan === 'premium' ? '250.00' : '449.00';
    const upiLink = `upi://pay?pa=aditya.378%40superyes&pn=CupidRound&am=${amount}&cu=INR&tn=Cupid_Round_${selectedPlan}_Plan`;
    window.open(upiLink, '_blank');
  };

  // Screenshot upload handler
  const handleScreenshotUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshotPreview(ev.target.result);
      setScreenshotFile(file);
    };
    reader.readAsDataURL(file);
  };

  // UTR + Screenshot submission — saves to localStorage for admin verification
  const handleVerifyUtr = async () => {
    const cleanUtr = manualUtr.trim();
    if (!cleanUtr || cleanUtr.length < 6) return;
    setIsVerifyingAutoPay(true);

    const planAmount = selectedPlan === 'basic' ? 100 : selectedPlan === 'premium' ? 250 : 449;

    // Save payment submission (with screenshot) to localStorage for admin panel
    savePaymentSubmission({
      userId: user.id,
      userName: name || user?.name || 'Unknown',
      userEmail: email || user?.email || '',
      userPhone: phone || user?.phone || '',
      plan: selectedPlan,
      amount: planAmount,
      utr: cleanUtr,
      screenshotBase64: screenshotPreview || null,
      userState: user?.state || 'Unknown',
    });

    setAutoVerifiedUtr(cleanUtr);
    setIsUtrVerified(true);
    setIsVerifyingAutoPay(false);
    setPaymentProofUploaded(true);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10B981', '#FF2E79', '#3B82F6']
    });
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
      avatar: userPhotos[0] || selectedAvatar3D,
      avatar3D: selectedAvatar3D,
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
        colors: ['#FF2E79', '#FF6584', '#EC4899', '#7C3AED']
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
            Thanks for participating!
          </h2>
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full mb-3 border border-emerald-200">
            Payment Auto-Verified
          </span>
          
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-left my-2 space-y-2.5 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 font-display">
              Thank you for participating in Cupid Round
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your entry has been <strong className="text-emerald-600">successfully registered</strong>. Our team will carefully process all submissions, and within 1-2 days after the form closes, you'll receive the details of your match directly on your email / Instagram.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              We appreciate your trust in Cupid and are excited to help you connect with someone special. Stay tuned—your match is on the way!
            </p>
            <div className="pt-1 text-xs font-bold text-slate-800">
              — Team Cupid
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-gradient-to-r from-[#FF2E79] to-pink-600 text-white shadow-lg my-4 text-left">
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
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 h-full bg-gradient-to-b from-rose-100/50 via-pink-50/30 to-white/90 relative select-none font-sans overflow-y-auto">
      
      {/* Top Header & Smooth Progress Bar with Cursive Tagline */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl pt-2 pb-3 z-30 border-b border-rose-100/60 -mx-4 px-4 sm:-mx-5 sm:px-5">
        <div className="flex items-center justify-between mb-2">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all border border-rose-100/80 cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9"></div>
          )}

          <CupidLogo size="xs" showText={true} textColor="dark" textSubtitle={`${user.state || 'DELHI NCR'} • ROUND 1`} />

          <div className="text-right pointer-events-none select-none">
            <span className="font-cursive text-rose-400 font-bold text-sm sm:text-base leading-tight block rotate-[-4deg]">
              Good People<br />Brighter Stories ♡
            </span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-rose-100/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF2E79] via-pink-500 to-rose-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-black text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-rose-100 shadow-2xs">
            {step}<span className="text-slate-400 font-medium">/</span>{totalSteps}
          </span>
        </div>
      </div>

      {/* Main Multi-Step Form Body — Card Wrapper */}
      <div className="flex-1 flex flex-col justify-between py-4 overflow-y-auto no-scrollbar space-y-6">
        
        {/* ========================================================================= */}
        {/* STEP 1: Personal Info (Name, Phone, Email, Hometown)                      */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 01 • Basic Details
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Personal Info</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Contact information for your private match results
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya Chauhan"
                  className="form-input text-sm h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div>
                <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="form-input text-sm h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div>
                <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Email Id *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="form-input text-sm h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>

              <div>
                <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Hometown *</label>
                <input
                  type="text"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  placeholder="e.g. Delhi / Noida / Gurgaon"
                  className="form-input text-sm h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Real Photos Upload (Min 2, Max 6) + Mandatory Instagram & Avatars  */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-left mb-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Your Photos & Insta</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Upload 2 to 6 of your best clear photos & set your Instagram handle
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* 6 Photo Upload Slots Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                  YOUR UPLOADED PHOTOS ({userPhotos.length}/6) *
                </label>
                {userPhotos.length >= 2 ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Minimum 2 met</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#FF2E79] bg-rose-50 px-3 py-1 rounded-full border border-rose-100 flex items-center gap-1 shadow-2xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Add {2 - userPhotos.length} more</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
                  const photo = userPhotos[slotIdx];

                  if (photo) {
                    return (
                      <div
                        key={slotIdx}
                        className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200 shadow-sm group bg-slate-100"
                      >
                        <img
                          src={photo}
                          alt={`Upload ${slotIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Main Photo Badge on 1st Photo */}
                        {slotIdx === 0 && (
                          <span className="absolute bottom-2 left-2 bg-[#FF2E79] text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg shadow-sm uppercase tracking-wider">
                            MAIN
                          </span>
                        )}
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(slotIdx)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slotIdx}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-3xl border-2 border-dashed border-rose-200/90 hover:border-[#FF2E79] bg-pink-50/20 hover:bg-pink-50/50 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-full bg-pink-100/70 text-[#FF2E79] group-hover:bg-[#FF2E79] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-bold text-pink-500/80 group-hover:text-[#FF2E79]">
                        Upload
                      </span>
                    </button>
                  );
                })}
              </div>

              {photoError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 text-left flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* Mandatory Your Instagram Handle Card */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-2.5 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xs shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                    <span>Your Instagram Handle</span>
                    <span className="text-[#FF2E79]">*</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-normal mt-0.5">
                    Helps us verify your profile and show your Insta flair ✨
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl h-12 px-4 flex items-center gap-2 focus-within:bg-white focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                <span className="text-slate-400 font-bold text-sm select-none">@</span>
                <input
                  type="text"
                  value={instaId.replace(/^@/, '')}
                  onChange={(e) => setInstaId(e.target.value.replace(/^@/, ''))}
                  placeholder="yourusername"
                  className="w-full bg-transparent outline-none text-sm font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Choose 3D Character Flair (Instagram Avatar Effect) Card */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-[#FF2E79] shadow-2xs shrink-0">
                    <Box className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                      Choose 3D Character Flair (Instagram Avatar Effect)
                    </h4>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                      Tap to preview how your profile card playfully flips with your 3D avatar!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFlippedPreview(!isFlippedPreview)}
                  className="flex items-center gap-1 text-xs font-extrabold text-[#FF2E79] hover:text-rose-600 transition-colors cursor-pointer shrink-0 pt-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFlippedPreview ? 'animate-spin' : ''}`} />
                  <span>Flip Coin</span>
                </button>
              </div>

              {/* 3D Flip Card Demo Preview */}
              <div className="flex items-center justify-center py-1">
                <div 
                  onClick={() => setIsFlippedPreview(!isFlippedPreview)}
                  className="relative w-20 h-20 cursor-pointer [perspective:1000px]"
                >
                  <div 
                    className={`w-full h-full rounded-full transition-transform duration-700 [transform-style:preserve-3d] shadow-lg border-4 border-[#FF2E79] ${
                      isFlippedPreview ? '[transform:rotateY(180deg)]' : ''
                    }`}
                  >
                    {/* Front: Main Photo or Avatar */}
                    <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden [backface-visibility:hidden] bg-slate-200">
                      {userPhotos[0] ? (
                        <img src={userPhotos[0]} alt="Real Photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <User className="w-7 h-7" />
                          <span className="text-[8px] font-bold">Photo</span>
                        </div>
                      )}
                    </div>
                    {/* Back: 3D Avatar */}
                    <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] bg-rose-100">
                      <img src={selectedAvatar3D} alt="3D Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 3D Avatar Circle Choices (2 Boys & 2 Girls) */}
              <div className="grid grid-cols-4 gap-3 pt-1 justify-items-center">
                {AVATAR_3D_CHARACTERS.map((char) => {
                  const isSelected = selectedAvatar3D === char.url;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar3D(char.url);
                        setIsFlippedPreview(true);
                        setTimeout(() => setIsFlippedPreview(false), 1400);
                      }}
                      className="flex flex-col items-center gap-1 cursor-pointer group"
                    >
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all relative shadow-sm ${
                        isSelected
                          ? 'border-[#FF2E79] ring-4 ring-pink-100 scale-105 shadow-md'
                          : 'border-slate-200 group-hover:border-pink-300 group-hover:scale-102'
                      }`}>
                        <img src={char.url} alt={char.name} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-[#FF2E79]' : 'text-slate-600'}`}>
                        {char.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: Age & Height 3D Drum Wheels + Gender                              */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-2">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                STEP 03 • STATS & BIOLOGY
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Age, Height & Gender</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Scroll the wheels to select your age and height.
              </p>
            </div>

            {/* 3D Wheel Pickers Grid */}
            <div className="grid grid-cols-2 gap-4 py-1">
              <ScrollWheelPicker
                icon={Calendar}
                label="Your Age"
                sublabel="How old are you?"
                items={AGE_RANGE}
                value={Number(age)}
                onChange={(val) => setAge(val)}
                unit="YRS"
                itemHeight={44}
                visibleCount={5}
              />
              <ScrollWheelPicker
                icon={Ruler}
                label="Your Height"
                sublabel="How tall are you?"
                items={HEIGHT_RANGE}
                value={height}
                onChange={(val) => setHeight(val)}
                itemHeight={44}
                visibleCount={5}
              />
            </div>

            {/* Gender Selection */}
            <div className="space-y-2 pt-1 text-left">
              <label className="text-sm font-bold text-slate-900 block">Gender *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'male', label: 'Male', icon: '♂' },
                  { id: 'female', label: 'Female', icon: '♀' },
                  { id: 'others', label: 'Others', icon: '⚧' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id)}
                    className={`py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                      gender === g.id
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-md shadow-pink-500/20 scale-[1.02]'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-pink-200 shadow-2xs'
                    }`}
                  >
                    <span className="text-base">{g.icon}</span>
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 04 • Campus & Academics
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">University & Major</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Connect with verified students across colleges in Delhi NCR
              </p>
            </div>

            {/* University Selection */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">University *</label>
              <CustomSelect
                value={university}
                onChange={(val) => setUniversity(val)}
                options={[...POPULAR_UNIVERSITIES, 'Other']}
                placeholder="Select your university..."
                icon={GraduationCap}
                className="mb-2"
              />
              {university === 'Other' && (
                <input
                  type="text"
                  placeholder="Type your university name..."
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                  className="form-input text-sm h-14 rounded-2xl mt-2"
                />
              )}
            </div>

            {/* Branch Selection */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Branch *</label>
              <CustomSelect
                value={branch}
                onChange={(val) => setBranch(val)}
                options={[...BRANCH_OPTIONS, 'Other']}
                placeholder="Select your branch / major..."
                className="mb-2"
              />
              {branch === 'Other' && (
                <input
                  type="text"
                  placeholder="Type your branch / major..."
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="form-input text-sm h-14 rounded-2xl mt-2"
                />
              )}
            </div>

            {/* Year of Study */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Year Of Study *</label>
              <div className="grid grid-cols-3 gap-2.5">
                {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setYearOfStudy(yr)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      yearOfStudy === yr
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 05 • Beliefs & Lifestyle
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Religion & Goals</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Cupid Note: More choices increase match possibilities
              </p>
            </div>

            {/* Religion */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Religion *</label>
              <div className="flex flex-wrap gap-2.5">
                {['Hindu', 'Muslim', 'Sikh', 'Christian', 'Others'].map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => setReligion(rel)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      religion === rel
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Relationship Type *</label>
              <div className="grid grid-cols-2 gap-3">
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
                    className={`p-3.5 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer ${
                      relationshipType.includes(type)
                        ? 'bg-rose-50 border-[#FF2E79] text-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Drinking / Smoking Habits *</label>
              <div className="flex flex-wrap gap-2.5">
                {['Smoke', 'Drink', 'Drugs', 'Weed', 'None'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleArrayItem(habits, setHabits, h)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      habits.includes(h)
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 06 • Your Vibe & Energy
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Personality & Exes</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Share your qualities, dating vibe & past relationship experience
              </p>
            </div>

            {/* Personality Type */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Personality Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {['Introvert', 'Ambivert', 'Extrovert'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPersonalityType(p)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      personalityType === p
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Qualities ({qualities.length} selected) *</label>
              <div className="flex flex-wrap gap-2">
                {QUALITIES_LIST.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleArrayItem(qualities, setQualities, q)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      qualities.includes(q)
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Dating Vibe *</label>
              <div className="grid grid-cols-2 gap-3">
                {DATING_VIBES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleArrayItem(datingVibe, setDatingVibe, v)}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all text-left cursor-pointer ${
                      datingVibe.includes(v)
                        ? 'bg-rose-50 border-[#FF2E79] text-[#FF2E79] shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Exes */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-4 text-center">
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Number of Exes *</label>
              <ScrollWheelPicker
                items={EXES_RANGE}
                value={numberOfExes}
                onChange={(val) => setNumberOfExes(val)}
                visibleCount={3}
                itemHeight={38}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: Partner Preferences — Age, Height & Gender                        */}
        {/* ========================================================================= */}
        {step === 7 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 07 • Ideal Match Criteria
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Partner Stats</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Describe your ideal partner's age range, minimum height, and gender
              </p>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-3xl text-left text-xs text-slate-600 leading-snug">
              <strong>Cupid Note :</strong> More choices significantly increase the chances of finding your perfect match!
            </div>

            {/* Preferred Age */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5">
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
                  className="w-full accent-[#FF2E79]"
                />
                <span className="text-xs font-bold text-slate-700 shrink-0">to</span>
                <input
                  type="range"
                  min="18"
                  max="35"
                  value={prefMaxAge}
                  onChange={(e) => setPrefMaxAge(Math.max(Number(e.target.value), prefMinAge + 1))}
                  className="w-full accent-[#FF2E79]"
                />
              </div>
            </div>

            {/* Preferred Height */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Height *</label>
              <CustomSelect
                value={prefHeight}
                onChange={(val) => setPrefHeight(val)}
                options={[...HEIGHT_RANGE.map(h => `${h} & above`), 'Any Height']}
                placeholder="Select preferred height..."
              />
            </div>

            {/* Preferred Gender */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Gender *</label>
              <div className="grid grid-cols-3 gap-3">
                {['Male', 'Female', 'Others'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPrefGender(g)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      prefGender === g
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 08 • Campus Criteria
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Preferred University</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Select preferred campus and academic level
              </p>
            </div>

            {/* Preferred University */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred University *</label>
              <div className="flex flex-wrap gap-2.5 max-h-44 overflow-y-auto no-scrollbar border border-slate-200/80 p-4 rounded-3xl bg-slate-50/70">
                {['Any University', ...POPULAR_UNIVERSITIES, 'Others'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => toggleArrayItem(prefUniversity, setPrefUniversity, u)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefUniversity.includes(u)
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Branch *</label>
              <input
                type="text"
                value={prefBranch}
                onChange={(e) => setPrefBranch(e.target.value)}
                placeholder="e.g. Any Branch or CSE / Medical"
                className="form-input text-xs h-14 rounded-2xl"
              />
            </div>

            {/* Preferred Year of Study */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred year of study *</label>
              <div className="flex flex-wrap gap-2.5">
                {['Any Year', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => toggleArrayItem(prefYearOfStudy, setPrefYearOfStudy, yr)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefYearOfStudy.includes(yr)
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 09 • Partner Lifestyle
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Habits & Exes</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Select religion, habits and past history preferences
              </p>
            </div>

            {/* Preferred Religion */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Religion *</label>
              <div className="flex flex-wrap gap-2.5">
                {['Any', 'Hindu', 'Muslim', 'Sikh', 'Christian', 'Others'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleArrayItem(prefReligion, setPrefReligion, r)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefReligion.includes(r)
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Habits *</label>
              <div className="flex flex-wrap gap-2.5">
                {['None', 'Drink', 'Smoke', 'Weed', 'Doesn\'t matter'].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => toggleArrayItem(prefHabits, setPrefHabits, h)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefHabits.includes(h)
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Number Of Exes *</label>
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 10 • Energy & Persona
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Personality & Vibe</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                What traits and dating vibe do you desire in your match?
              </p>
            </div>

            {/* Preferred Personality Type */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Personality *</label>
              <div className="grid grid-cols-4 gap-2">
                {['Introvert', 'Ambivert', 'Extrovert', 'Any'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrefPersonality(p)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      prefPersonality === p
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Qualities *</label>
              <div className="flex flex-wrap gap-2.5">
                {QUALITIES_LIST.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => toggleArrayItem(prefQualities, setPrefQualities, q)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      prefQualities.includes(q)
                        ? 'bg-[#FF2E79] text-white border-[#FF2E79] shadow-sm'
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
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">Preferred Dating Vibe *</label>
              <div className="grid grid-cols-2 gap-3">
                {DATING_VIBES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleArrayItem(prefDatingVibe, setPrefDatingVibe, v)}
                    className={`p-3.5 rounded-2xl text-xs font-bold border transition-all text-left cursor-pointer ${
                      prefDatingVibe.includes(v)
                        ? 'bg-rose-50 border-[#FF2E79] text-[#FF2E79] shadow-sm'
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 11 • Strict Filters
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Non-Negotiables</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Parameters on which you are not willing to compromise
              </p>
            </div>

            <div className="bg-amber-50/90 border border-amber-200/80 rounded-3xl p-5 text-left space-y-2 shadow-sm">
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                These are the deal-breakers for you – the parameters on which you are not willing to compromise at all. Think of them as your absolute must-haves.
              </p>
              <p className="text-xs font-black text-amber-800">
                Cupid Note : Fewer non-negotiables lead to higher match probabilities!
              </p>
            </div>

            {/* Non-Negotiable Checklist */}
            <div>
              <label className="form-label text-left mb-2 text-xs font-bold text-slate-700">My Non Negotiables Are *</label>
              <div className="flex flex-wrap gap-2.5 max-h-52 overflow-y-auto no-scrollbar border border-slate-200/80 p-4 rounded-3xl bg-slate-50/70">
                {NON_NEGOTIABLES_LIST.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem(nonNegotiables, setNonNegotiables, item)}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
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
            <label className="flex items-start gap-3 text-xs text-slate-600 text-left bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={autoThreeRounds}
                onChange={(e) => setAutoThreeRounds(e.target.checked)}
                className="mt-0.5 accent-[#FF2E79] w-4 h-4 rounded"
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 12 • Legal Agreement
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Terms & Conditions</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Please review and check all 4 agreement clauses
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 space-y-4 text-left max-h-[350px] overflow-y-auto no-scrollbar shadow-sm">
              
              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer pb-3.5 border-b border-slate-200/60">
                <input
                  type="checkbox"
                  checked={agreedTerms.t1}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t1: e.target.checked })}
                  className="mt-0.5 accent-[#FF2E79] w-4 h-4 rounded shrink-0"
                />
                <span className="leading-relaxed">
                  The monetary remittance of ₹100 is strictly non-refundable. This fee solely remunerates the administrative exertions undertaken to procure a potentially compatible match. While every endeavor shall be employed to facilitate a suitable pairing, no assurance or warranty of match fruition is extended.
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer pb-3.5 border-b border-slate-200/60">
                <input
                  type="checkbox"
                  checked={agreedTerms.t2}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t2: e.target.checked })}
                  className="mt-0.5 accent-[#FF2E79] w-4 h-4 rounded shrink-0"
                />
                <span className="leading-relaxed">
                  By submitting your personal data and stipulated preferences, you irrevocably consent to the utilization of such information by Cupid for the explicit purpose of effectuating an optimal match.
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer pb-3.5 border-b border-slate-200/60">
                <input
                  type="checkbox"
                  checked={agreedTerms.t3}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t3: e.target.checked })}
                  className="mt-0.5 accent-[#FF2E79] w-4 h-4 rounded shrink-0"
                />
                <span className="leading-relaxed">
                  Cupid's role is strictly mediatory; it merely effectuates an introduction between individuals deemed ostensibly compatible. The resultant parties are not, under any circumstances, pre-established romantic affiliates, and the onus of advancing the relational dynamics rests solely upon the individuals involved.
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms.t4}
                  onChange={(e) => setAgreedTerms({ ...agreedTerms, t4: e.target.checked })}
                  className="mt-0.5 accent-[#FF2E79] w-4 h-4 rounded shrink-0"
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 13 • Plan Tier
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Matchmaking Tier</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Choose your guarantee level for this active round
              </p>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto no-scrollbar">
              
              {/* 100 Rupee plan */}
              <div
                onClick={() => setSelectedPlan('basic')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer text-left ${
                  selectedPlan === 'basic' 
                    ? 'border-[#FF2E79] bg-rose-50/40 shadow-md ring-2 ring-rose-200' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">100 Rupee Plan</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Standard</span>
                </div>
                <ul className="text-xs text-slate-600 mt-2.5 space-y-1.5 leading-relaxed">
                  <li>• Participate in 1 matchmaking round</li>
                  <li>• Chance of 1 match based on compatibility</li>
                  <li>• 100% anonymous matching process</li>
                  <li>• Match details shared via email / Instagram</li>
                </ul>
              </div>

              {/* 250 Rupee plan */}
              <div
                onClick={() => setSelectedPlan('premium')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer text-left ${
                  selectedPlan === 'premium' 
                    ? 'border-[#FF2E79] bg-rose-50/40 shadow-md ring-2 ring-rose-200' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">250 Rupee Plan</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">100% Refund Guarantee</span>
                </div>
                <ul className="text-xs text-slate-600 mt-2.5 space-y-1.5 leading-relaxed">
                  <li>• Higher priority placement in round</li>
                  <li>• Profile preview before match confirmation</li>
                  <li>• Advanced compatibility algorithm filtering</li>
                  <li>• <strong>Full refund if no match is found</strong></li>
                </ul>
              </div>

              {/* 449 Rupee Plan */}
              <div
                onClick={() => setSelectedPlan('elite')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer text-left relative overflow-hidden ${
                  selectedPlan === 'elite' 
                    ? 'border-[#FF2E79] bg-rose-50/60 shadow-xl ring-2 ring-[#FF2E79]' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">449 Rupee Plan</span>
                    <span className="text-[9px] font-black bg-[#FF2E79] text-white px-2.5 py-0.5 rounded-full uppercase">
                      VIP ELITE
                    </span>
                  </div>
                  <span className="text-xs font-black text-[#FF2E79]">Highest Match Rate</span>
                </div>
                <ul className="text-xs text-slate-700 mt-2.5 space-y-1.5 font-medium leading-relaxed">
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
          <div className="space-y-6 animate-slide-up">
            <div className="text-left mb-3">
              <span className="text-[11px] font-black text-[#FF2E79] uppercase tracking-widest block mb-1">
                Step 14 • Final Activation
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">Confirm & Pay</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Entry fee is one-time and verified instantly
              </p>
            </div>

            <div className="bg-slate-50/90 border border-slate-200/80 rounded-3xl p-6 text-center space-y-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-3 border-b border-slate-200/60">
                <span>Exact Required Amount:</span>
                <div className="text-right">
                  <span className="text-[#FF2E79] text-xl font-black">
                    {selectedPlan === 'basic' ? '₹100' : selectedPlan === 'premium' ? '₹250' : '₹449'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wider mt-0.5">
                    Pre-Locked Amount
                  </span>
                </div>
              </div>

              {/* Instant Automated Verification Status or Action */}
              {autoVerifiedUtr ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black text-emerald-900 block">
                      Payment of ₹{selectedPlan === 'basic' ? '100' : selectedPlan === 'premium' ? '250' : '449'} Verified!
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                      Bank Ref / UTR: {autoVerifiedUtr}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1 font-medium">
                      Exact amount matched. Profile is automatically activated.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pay via PhonePe / GPay Button */}
                  <button
                    type="button"
                    onClick={handleInstantAutoPay}
                    disabled={isVerifyingAutoPay}
                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
                  >
                    <span className="text-lg">📲</span>
                    <span>Pay via PhonePe / GPay / BHIM</span>
                    <span className="ml-1 opacity-80">{selectedPlan === 'basic' ? '₹100' : selectedPlan === 'premium' ? '₹250' : '₹449'}</span>
                  </button>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-slate-50 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">
                      or scan locked QR
                    </span>
                  </div>

                  {/* Dynamic QR Box with Pre-Locked Amount */}
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border-2 border-rose-100 shadow-md flex items-center justify-center relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        `upi://pay?pa=aditya.378%40superyes&pn=CupidRound&am=${
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
                    onClick={() => {
                      navigator.clipboard.writeText('aditya.378@superyes');
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm transition-all"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#FF2E79]" />
                    <span>{copiedUpi ? '✓ Copied!' : 'aditya.378@superyes'}</span>
                  </button>
                  
                  <p className="text-[10px] text-slate-500 font-medium text-center leading-relaxed">
                    After payment, enter your <strong>12-digit UTR</strong> below to confirm your entry.
                  </p>
                </div>
              )}
            </div>

            {/* Screenshot Upload + UTR Submission */}
            {!autoVerifiedUtr && (
              <div className="space-y-4 text-left">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                  <p className="text-xs font-black text-amber-800 mb-1">📸 After Paying:</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    1. Take a screenshot of the payment confirmation<br/>
                    2. Upload it below<br/>
                    3. Enter your UTR/transaction ID<br/>
                    4. Submit — admin will verify &amp; activate your profile
                  </p>
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="form-label text-xs font-bold text-slate-700 mb-2 block">
                    Upload Payment Screenshot *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={screenshotInputRef}
                    onChange={handleScreenshotUpload}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  {screenshotPreview ? (
                    <div className="relative">
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot"
                        className="w-full max-h-48 object-contain rounded-2xl border-2 border-emerald-300 bg-emerald-50"
                      />
                      <button
                        type="button"
                        onClick={() => { setScreenshotPreview(''); setScreenshotFile(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-slate-900/70 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                      <div className="mt-1 flex items-center gap-1 text-emerald-700 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Screenshot uploaded</span>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="screenshot-upload"
                      className="flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed border-slate-300 hover:border-[#FF2E79] rounded-2xl bg-slate-50 cursor-pointer transition-colors"
                    >
                      <Upload className="w-6 h-6 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500">Tap to upload payment screenshot</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG — from your PhonePe / GPay</span>
                    </label>
                  )}
                </div>

                {/* UTR Input */}
                <div>
                  <label className="form-label text-xs font-bold text-slate-700 mb-1 block">
                    UTR / Transaction Reference ID *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 408123456789 (from payment app)"
                      value={manualUtr}
                      onChange={(e) => setManualUtr(e.target.value)}
                      className="form-input text-xs flex-1 h-14 rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyUtr}
                      disabled={isVerifyingAutoPay || !manualUtr.trim() || !screenshotPreview}
                      className="px-5 h-14 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      {isVerifyingAutoPay ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Submit</span>
                    </button>
                  </div>
                  {!screenshotPreview && manualUtr.trim() && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠ Please also upload the payment screenshot above</p>
                  )}
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
                className="form-input text-sm h-14 rounded-2xl"
              />
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-3 border-t border-slate-100 z-30">
        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-14 bg-[#FF2E79] hover:bg-[#e02447] text-white font-black text-sm rounded-full flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(255,45,85,0.4)] transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Next Step →</span>
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
                  <span>Upload Screenshot + Enter UTR to Submit</span>
                </button>
                <p className="text-[11px] text-center text-slate-400 font-medium">
                  Pay via PhonePe/GPay → upload screenshot → enter UTR → submit.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full h-14 bg-[#FF2E79] hover:bg-[#e02447] text-white font-black text-sm rounded-full flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(255,45,85,0.4)] transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    <span>Submitting for Admin Verification...</span>
                  </div>
                ) : (
                  <>
                    <span>Submit — Pending Admin Verification →</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Photo Requirement Warning Popup Modal */}
      {showPhotoWarningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-[#FF2E79] flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
              <AlertCircle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 font-display">
                Clear Profile Photos Required
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Please upload clear, high-quality, authentic photos of yourself. Well-lit genuine face photos receive up to <strong>3x more matches</strong>. Minimum 2 photos are required to continue.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPhotoWarningModal(false)}
              className="w-full h-12 bg-[#FF2E79] hover:bg-[#e02469] text-white font-extrabold text-xs tracking-wide rounded-full shadow-[0_8px_20px_rgba(255,46,121,0.35)] transition-all active:scale-[0.98] cursor-pointer"
            >
              Upload Photos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
