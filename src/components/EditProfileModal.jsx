import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  GraduationCap, 
  User, 
  Heart, 
  Compass, 
  Smile, 
  ShieldCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import CustomSelect from './CustomSelect';

const UNIVERSITIES = [
  "Bennett University", "Delhi University (DU)", "Sharda University", 
  "Galgotias University", "Amity University", "IIT Delhi", "DTU", "NSUT", "IP University"
];

const BRANCHES = [
  "Computer Science (CSE)", "AI & Data Science", "Information Technology",
  "BBA / Commerce", "MBA", "Economics & Finance", "Architecture / Design", "Law", "Medical / MBBS"
];

const QUALITIES_LIST = [
  "Ambitious", "Humorous", "Loyal", "Creative", "Fitness Freak", 
  "Foodie", "Deep Thinker", "Empathetic", "Adventurous"
];

const DATING_VIBES = [
  "Specialty Coffee", "Late Drives", "Cozy Movie Nights", "Deep Talks", "Exploring Street Food", "Live Music"
];

export default function EditProfileModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState(user.age || 21);
  const [height, setHeight] = useState(user.height || "5'8\"");
  const [university, setUniversity] = useState(user.university || 'Bennett University');
  const [branch, setBranch] = useState(user.branch || 'Computer Science (CSE)');
  const [yearOfStudy, setYearOfStudy] = useState(user.yearOfStudy || '3rd Year');
  const [hometown, setHometown] = useState(user.hometown || user.state || 'Delhi NCR');
  const [religion, setReligion] = useState(user.religion || 'Hindu');
  const [habits, setHabits] = useState(user.habits || 'Non-Smoker, Social Drinker');
  const [personalityType, setPersonalityType] = useState(user.personalityType || 'Ambivert');
  const [relationshipType, setRelationshipType] = useState(user.relationshipType || 'Long-term Relationship');
  const [bio, setBio] = useState(user.bio || '');
  const [qualities, setQualities] = useState(user.qualities || ['Humorous', 'Loyal', 'Ambitious']);
  const [datingVibe, setDatingVibe] = useState(user.datingVibe || ['Specialty Coffee', 'Late Drives']);

  const toggleQuality = (q) => {
    if (qualities.includes(q)) {
      setQualities(qualities.filter(item => item !== q));
    } else {
      if (qualities.length < 5) setQualities([...qualities, q]);
    }
  };

  const toggleVibe = (v) => {
    if (datingVibe.includes(v)) {
      setDatingVibe(datingVibe.filter(item => item !== v));
    } else {
      if (datingVibe.length < 4) setDatingVibe([...datingVibe, v]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      name,
      age: Number(age),
      height,
      university,
      branch,
      yearOfStudy,
      hometown,
      religion,
      habits,
      personalityType,
      relationshipType,
      bio,
      qualities,
      datingVibe
    };
    onSave(updatedUser);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-slide-up select-none overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-white/95 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-base text-slate-900 font-display">Edit Profile & Preferences</h3>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 pb-28">
        
        {/* Basic Info */}
        <div className="bg-slate-50 p-4.5 rounded-[24px] border border-slate-100 space-y-3">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Basic Information
          </span>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF2D55]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF2D55]"
                  min="18"
                  max="35"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Height</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF2D55]"
                  placeholder={`5'10"`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Education & Campus */}
        <div className="bg-slate-50 p-4.5 rounded-[24px] border border-slate-100 space-y-3">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Campus & Education
          </span>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">University / College</label>
              <CustomSelect
                value={university}
                onChange={(val) => setUniversity(val)}
                options={UNIVERSITIES}
                placeholder="Select university..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Degree / Branch</label>
              <CustomSelect
                value={branch}
                onChange={(val) => setBranch(val)}
                options={BRANCHES}
                placeholder="Select branch..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Year Of Study</label>
                <CustomSelect
                  value={yearOfStudy}
                  onChange={(val) => setYearOfStudy(val)}
                  options={["1st Year", "2nd Year", "3rd Year", "Final Year", "Postgraduate"]}
                  placeholder="Select year..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Hometown</label>
                <input
                  type="text"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#FF2D55] focus:ring-3 focus:ring-[#FF2D55]/15"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dating Intent & Bio */}
        <div className="bg-slate-50 p-4.5 rounded-[24px] border border-slate-100 space-y-3">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Dating Preferences & Bio
          </span>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Looking For</label>
              <CustomSelect
                value={relationshipType}
                onChange={(val) => setRelationshipType(val)}
                options={["Long-term Relationship", "Serious Dating", "Casual Dating", "Friendship First"]}
                placeholder="Select relationship type..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">About Me (Bio)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell potential matches about your passions..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#FF2D55] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Qualities Picker */}
        <div className="bg-slate-50 p-4.5 rounded-[24px] border border-slate-100 space-y-2.5">
          <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Top Qualities (Select up to 5)
          </span>

          <div className="flex flex-wrap gap-2">
            {QUALITIES_LIST.map(q => {
              const active = qualities.includes(q);
              return (
                <button
                  type="button"
                  key={q}
                  onClick={() => toggleQuality(q)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#FF2D55] text-white shadow-xs' 
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:border-rose-300'
                  }`}
                >
                  {q} {active ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Floating Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full h-12 rounded-full bg-[#FF2D55] hover:bg-[#E02447] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 fill-white text-[#FF2D55]" />
            <span>Save & Update Preferences</span>
          </button>
        </div>

      </form>
    </div>
  );
}
