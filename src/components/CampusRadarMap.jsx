import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Heart, 
  Compass, 
  X, 
  ArrowUpRight,
  Plus,
  Minus,
  LocateFixed,
  Globe,
  ChevronDown
} from 'lucide-react';
import { getStatesList } from '../utils/storage';

// College location mapping for Delhi NCR & major hubs
const COLLEGE_LOCATIONS = {
  'bennett university': { x: 48, y: 56, label: 'BENNETT UNIVERSITY', area: 'Tech Zone II' },
  'bennett': { x: 48, y: 56, label: 'BENNETT UNIVERSITY', area: 'Tech Zone II' },
  'knowledge park iii': { x: 40, y: 45, label: 'KNOWLEDGE PARK III', area: 'Sharda Hub' },
  'sharda university': { x: 40, y: 45, label: 'KNOWLEDGE PARK III', area: 'Sharda Hub' },
  'galgotias university': { x: 76, y: 66, label: 'GALGOTIAS CAMPUS', area: 'Knowledge Park II' },
  'galgotias': { x: 76, y: 66, label: 'GALGOTIAS CAMPUS', area: 'Knowledge Park II' },
  'amity university': { x: 62, y: 32, label: 'AMITY CAMPUS', area: 'Noida Expressway' },
  'amity': { x: 62, y: 32, label: 'AMITY CAMPUS', area: 'Noida Expressway' },
  'iit delhi': { x: 84, y: 44, label: 'IIT DELHI', area: 'Hauz Khas' },
  'iit': { x: 84, y: 44, label: 'IIT DELHI', area: 'Hauz Khas' },
  'delhi university (du)': { x: 78, y: 24, label: 'DELHI UNIVERSITY', area: 'GTB Nagar' },
  'delhi university': { x: 78, y: 24, label: 'DELHI UNIVERSITY', area: 'GTB Nagar' },
  'du': { x: 78, y: 24, label: 'DELHI UNIVERSITY', area: 'GTB Nagar' },
  'dtu': { x: 20, y: 28, label: 'DTU CAMPUS', area: 'Rohini Hub' },
  'delhi technological university': { x: 20, y: 28, label: 'DTU CAMPUS', area: 'Rohini Hub' },
  'jiit noida': { x: 68, y: 54, label: 'JIIT NOIDA', area: 'Sector 62' },
  'jiit': { x: 68, y: 54, label: 'JIIT NOIDA', area: 'Sector 62' },
  'nsut': { x: 26, y: 58, label: 'NSUT DWARKA', area: 'Dwarka Sector 3' },
  'iiit delhi': { x: 72, y: 48, label: 'IIIT DELHI', area: 'Okhla Phase III' },
  'ashoka university': { x: 18, y: 16, label: 'ASHOKA CAMPUS', area: 'Sonipat Hub' }
};

// Default landmark pins for map background
const DEFAULT_LANDMARKS = [
  { name: 'DTU CAMPUS', x: 20, y: 28 },
  { name: 'AMITY CAMPUS', x: 62, y: 32 },
  { name: 'DELHI UNIVERSITY', x: 78, y: 24 },
  { name: 'IIT DELHI', x: 84, y: 44 },
  { name: 'KNOWLEDGE PARK III', x: 40, y: 45 },
  { name: 'JIIT NOIDA', x: 68, y: 54 },
  { name: 'BENNETT UNIVERSITY', x: 48, y: 56 },
  { name: 'GALGOTIAS CAMPUS', x: 76, y: 66 }
];

export default function CampusRadarMap({ 
  user, 
  candidates = [], 
  matchedUsers = [], 
  onSelectCandidate, 
  onLikeCandidate 
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState('all'); // 'all', '2', '5', '10'
  const [activeRegion, setActiveRegion] = useState(user?.state || 'Delhi NCR');
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef(null);

  // User campus position
  const userCollegeKey = (user?.university || 'Bennett University').toLowerCase();
  const userCollegeCoords = COLLEGE_LOCATIONS[userCollegeKey] || { x: 48, y: 56 };
  const userCampusX = userCollegeCoords.x;
  const userCampusY = userCollegeCoords.y;

  // Deduplicated candidate list
  const allMapUsers = [...candidates, ...matchedUsers].filter(
    (u, index, self) => index === self.findIndex((t) => t.id === u.id)
  );

  // Calculate coordinates & exact distance in km relative to user campus
  const candidateWithCoords = allMapUsers.map((c, idx) => {
    const key = (c.university || '').toLowerCase();
    let baseCoords = null;
    
    for (let colKey in COLLEGE_LOCATIONS) {
      if (key.includes(colKey) || colKey.includes(key)) {
        baseCoords = COLLEGE_LOCATIONS[colKey];
        break;
      }
    }

    if (!baseCoords) {
      const angles = [35, 120, 210, 300, 75, 160, 240, 330];
      const radius = 16 + ((idx * 7) % 22);
      const angleRad = (angles[idx % angles.length] * Math.PI) / 180;
      baseCoords = {
        x: Math.max(15, Math.min(85, Math.round(userCampusX + radius * Math.cos(angleRad)))),
        y: Math.max(15, Math.min(85, Math.round(userCampusY + radius * Math.sin(angleRad)))),
        label: c.university?.toUpperCase() || 'CAMPUS'
      };
    } else {
      const offsetX = (idx % 2 === 0 ? 1 : -1) * (Math.floor(idx / 2) * 3);
      const offsetY = (idx % 3 === 0 ? 2 : -2) * (Math.floor(idx / 3) * 3);
      baseCoords = {
        ...baseCoords,
        x: Math.max(12, Math.min(88, baseCoords.x + offsetX)),
        y: Math.max(12, Math.min(88, baseCoords.y + offsetY))
      };
    }

    // Exact Euclidean distance on map scaled to real-world km
    const dx = baseCoords.x - userCampusX;
    const dy = baseCoords.y - userCampusY;
    const mapDistUnits = Math.sqrt(dx * dx + dy * dy);
    const realKm = c.distanceKm !== undefined ? Number(c.distanceKm) : Number(Math.max(0.6, (mapDistUnits * 0.18)).toFixed(1));

    return {
      ...c,
      posX: baseCoords.x,
      posY: baseCoords.y,
      collegeLabel: baseCoords.label,
      calculatedDistanceKm: realKm
    };
  });

  // Filter candidates strictly by active region & distance filter
  const geofencedUsers = candidateWithCoords.filter((c) => {
    if (c.state && c.state.toLowerCase() !== activeRegion.toLowerCase()) {
      return false;
    }

    const dist = c.calculatedDistanceKm;
    if (distanceFilter === '2' && dist > 2.5) return false;
    if (distanceFilter === '5' && dist > 5.5) return false;
    if (distanceFilter === '10' && dist > 10.5) return false;

    return true;
  });

  // Zoom Controls
  const handleZoomIn = () => setZoom(prev => Math.min(2.5, Number((prev + 0.35).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.6, Number((prev - 0.35).toFixed(2))));
  const handleResetPosition = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse / Touch Drag Pan
  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-btn')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(-150, Math.min(150, e.clientX - dragStartRef.current.x));
    const newY = Math.max(-150, Math.min(150, e.clientY - dragStartRef.current.y));
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('.interactive-btn')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      const newX = Math.max(-150, Math.min(150, e.touches[0].clientX - dragStartRef.current.x));
      const newY = Math.max(-150, Math.min(150, e.touches[0].clientY - dragStartRef.current.y));
      setPan({ x: newX, y: newY });
    } else if (e.touches.length === 2 && initialPinchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = dist - initialPinchDistRef.current;
      if (Math.abs(diff) > 10) {
        if (diff > 0) handleZoomIn();
        else handleZoomOut();
        initialPinchDistRef.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistRef.current = null;
  };

  const statesList = typeof getStatesList === 'function' ? getStatesList() : ['Delhi NCR', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Punjab', 'Rajasthan', 'Gujarat'];

  return (
    <div className="flex-1 flex flex-col h-full relative select-none overflow-hidden bg-gradient-to-b from-[#FFF5F8] via-[#FFEBF2] to-[#FFF0F5]">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & STATE SELECTOR (Exact Match to Screenshot)    */}
      {/* ------------------------------------------------------------- */}
      <div className="px-4 pt-3 pb-2 z-20 space-y-3 pointer-events-auto">
        
        {/* Title Bar & State Dropdown */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">
                Campus <span className="text-[#FF2E79]">Radar</span>
              </h1>
              <div className="w-7 h-7 rounded-full bg-pink-100/90 text-[#FF2E79] flex items-center justify-center shadow-xs">
                <Compass className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Discover people around your campus
            </p>
          </div>

          {/* Region State Selector Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setShowStateDropdown(!showStateDropdown)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-pink-200/80 text-[#FF2E79] shadow-xs hover:bg-white transition-all cursor-pointer text-xs font-black"
            >
              <Globe className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{activeRegion}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStateDropdown && (
              <div className="absolute right-0 top-10 z-50 w-48 bg-white/98 backdrop-blur-xl rounded-2xl border border-pink-100 shadow-xl py-2 max-h-56 overflow-y-auto">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-3 py-1 block">
                  Select Region
                </span>
                {statesList.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setActiveRegion(st);
                      setShowStateDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      activeRegion === st ? 'bg-pink-50 text-[#FF2E79]' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. DISTANCE FILTER PILL CAROUSEL (Exact Match to Screenshot) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-white/70 backdrop-blur-md p-1.5 rounded-full border border-pink-100/70 shadow-xs">
          {[
            { id: 'all', label: `📍 All ${activeRegion.split(' ')[0]} Campuses` },
            { id: '2', label: '< 2 km' },
            { id: '5', label: '< 5 km' },
            { id: '10', label: '< 10 km' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDistanceFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                distanceFilter === f.id
                  ? 'bg-[#FF2E79] text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 hover:bg-white/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* FLOATING ZOOM & CENTER CONTROLS (Right Side)                  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute right-4 top-36 z-30 flex flex-col gap-2.5 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="interactive-btn w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-md border border-white hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

        <button
          onClick={handleZoomOut}
          className="interactive-btn w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-md border border-white hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

        <button
          onClick={handleResetPosition}
          className="interactive-btn w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-[#FF2E79] flex items-center justify-center shadow-md border border-white hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="Recenter On Me"
        >
          <LocateFixed className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE RADAR CANVAS: RADAR MAP WITH VECTOR COUNTER-SCALING */}
      {/* ------------------------------------------------------------- */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        
        {/* TRANSFORM LAYER: GOOGLE MAPS STYLE BACKGROUND MAP ZOOM */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.25s ease-out'
          }}
        >
          {/* 1. Soft Pink Vector Map Roads & Regions Illustration */}
          <svg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Road Networks */}
            <path d="M 0,20 Q 40,30 100,15" fill="none" stroke="#FFA3C4" strokeWidth="1.2" strokeDasharray="3 2" />
            <path d="M 15,0 Q 25,50 35,100" fill="none" stroke="#FFA3C4" strokeWidth="1.2" strokeDasharray="4 2" />
            <path d="M 65,0 Q 55,60 85,100" fill="none" stroke="#FF85AD" strokeWidth="1.5" />
            <path d="M 0,75 Q 50,65 100,80" fill="none" stroke="#FF85AD" strokeWidth="1.5" />
            <path d="M 30,30 C 50,10 70,50 90,70" fill="none" stroke="#FFD0E0" strokeWidth="3" />

            {/* Concentric Radar Distance Rings (Matching Screenshot) */}
            <circle cx={userCampusX} cy={userCampusY} r="16" fill="none" stroke="#FF2E79" strokeOpacity="0.22" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx={userCampusX} cy={userCampusY} r="32" fill="none" stroke="#FF2E79" strokeOpacity="0.18" strokeWidth="1.2" strokeDasharray="4 4" />
            <circle cx={userCampusX} cy={userCampusY} r="46" fill="none" stroke="#FF2E79" strokeOpacity="0.12" strokeWidth="1.2" strokeDasharray="5 5" />
            <circle cx={userCampusX} cy={userCampusY} r="60" fill="none" stroke="#FF2E79" strokeOpacity="0.08" strokeWidth="1.2" strokeDasharray="6 6" />

            {/* Radar Beam Sweep Gradient (Rotating 360 Scan) */}
            <g transform={`translate(${userCampusX}, ${userCampusY})`}>
              <circle r="46" fill="url(#radar_sweep_grad)" opacity="0.15" className="animate-spin-slow origin-center" />
            </g>
            <defs>
              <radialGradient id="radar_sweep_grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF2E79" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#FF6596" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#FF2E79" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>

          {/* 2. DEFAULT COLLEGE LANDMARK PINS WITH GOOGLE-MAPS VECTOR COUNTER-SCALING */}
          <div className="absolute inset-0 pointer-events-none">
            {DEFAULT_LANDMARKS.map((lm, idx) => (
              <div
                key={idx}
                className="absolute flex items-center gap-1.5 opacity-85 transition-transform"
                style={{ 
                  left: `${lm.x}%`, 
                  top: `${lm.y}%`,
                  transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF2E79] ring-4 ring-pink-200/60 shadow-sm shrink-0"></div>
                <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-800 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-pink-100 shadow-xs whitespace-nowrap">
                  {lm.name}
                </span>
              </div>
            ))}
          </div>

          {/* 3. CENTER USER AVATAR PIN WITH VECTOR COUNTER-SCALING */}
          <div 
            className="absolute z-20 flex flex-col items-center pointer-events-none transition-transform"
            style={{ 
              left: `${userCampusX}%`, 
              top: `${userCampusY}%`,
              transform: `translate(-50%, -50%) scale(${1 / zoom})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Glowing Pulse Rings */}
            <div className="absolute w-28 h-28 -top-7 -left-7 rounded-full bg-[#FF2E79]/20 radar-ping pointer-events-none"></div>
            <div className="absolute w-16 h-16 -top-1 -left-1 rounded-full bg-[#FF2E79]/30 animate-pulse pointer-events-none"></div>

            {/* Profile Avatar Badge */}
            <div className="relative w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF2E79] to-rose-400 shadow-xl z-10 border-2 border-white">
              <img src={user.avatar} alt="You" className="w-full h-full object-cover rounded-full" />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>

            {/* Dark You Pill Label */}
            <div className="mt-1 px-3 py-1 rounded-full bg-slate-950 text-white text-[10.5px] font-black tracking-wide flex items-center gap-1 shadow-lg border border-white/20 whitespace-nowrap z-10">
              <MapPin className="w-3 h-3 text-[#FF2E79] fill-current" />
              <span>You • {user.university?.split(' ')[0] || 'Bennett'} &gt;</span>
            </div>
          </div>

          {/* 4. CANDIDATE PROFILE AVATARS ON RADAR MAP WITH VECTOR COUNTER-SCALING */}
          {geofencedUsers.map((candidate) => {
            const isSelected = selectedUser?.id === candidate.id;

            return (
              <div
                key={candidate.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(candidate);
                }}
                className={`interactive-btn absolute cursor-pointer transition-all duration-200 ${
                  isSelected ? 'z-40' : 'z-30'
                }`}
                style={{ 
                  left: `${candidate.posX}%`, 
                  top: `${candidate.posY}%`,
                  transform: `translate(-50%, -50%) scale(${isSelected ? 1.15 / zoom : 1 / zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <div className="flex flex-col items-center">
                  {/* Candidate DP Avatar Circle */}
                  <div className={`relative w-12 h-12 rounded-full p-[2px] shadow-lg transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-tr from-slate-900 to-rose-600 ring-4 ring-rose-400/60' 
                      : 'bg-gradient-to-tr from-[#FF2E79] to-rose-300 border-2 border-white hover:ring-3 hover:ring-pink-300'
                  }`}>
                    <img 
                      src={candidate.avatar} 
                      alt={candidate.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
                  </div>

                  {/* Candidate Name, Distance & Match Label */}
                  <div className={`mt-1 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-md shadow-md border transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-white'
                      : 'bg-white/95 text-slate-900 border-pink-100 hover:bg-white'
                  }`}>
                    <span className="text-[10px] font-black truncate max-w-[75px]">
                      {candidate.name.split(' ')[0]}
                    </span>
                    <span className="text-[8.5px] font-semibold text-slate-400">
                      {candidate.calculatedDistanceKm}km
                    </span>
                    <span className="text-[8.5px] font-black text-[#FF2E79] bg-rose-50 px-1 py-0.2 rounded">
                      {candidate.matchScore || 94}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. SELECTED CANDIDATE PROFILE PREVIEW BOTTOM CARD             */}
      {/* ------------------------------------------------------------- */}
      {selectedUser && (
        <div className="absolute bottom-20 inset-x-4 bg-white/98 backdrop-blur-2xl p-4 rounded-[28px] border border-pink-100 shadow-2xl z-40 animate-slide-up pointer-events-auto select-none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-[#FF2E79] shrink-0">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-sm text-slate-900 font-display">
                    {selectedUser.name}, {selectedUser.age || 21}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  🎓 {selectedUser.university || 'Campus Student'} • 📍 {selectedUser.calculatedDistanceKm || 1.8} km away
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9.5px] font-black text-[#FF2E79] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {selectedUser.matchScore || 95}% Match
                  </span>
                  <span className="text-[9.5px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {selectedUser.branch?.split(' ')[0] || 'Student'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedUser(null)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onSelectCandidate(selectedUser);
                setSelectedUser(null);
              }}
              className="flex-1 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>View Full Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onLikeCandidate(selectedUser);
                setSelectedUser(null);
              }}
              className="flex-1 h-10 rounded-full bg-[#FF2E79] hover:bg-[#E02447] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/25 transition-all cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>Confirm Match</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
