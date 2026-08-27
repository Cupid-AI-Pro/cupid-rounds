import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Heart, 
  Compass, 
  X, 
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Minus,
  LocateFixed,
  BadgeCheck,
  Globe
} from 'lucide-react';

const CAMPUS_LANDMARKS = [
  { name: "Bennett University", area: "Tech Zone II", x: 30, y: 65 },
  { name: "Knowledge Park III", area: "Sharda Hub", x: 44, y: 35 },
  { name: "Galgotias Campus", area: "Knowledge Park II", x: 74, y: 58 },
  { name: "Amity Campus", area: "Noida Expressway", x: 62, y: 22 },
  { name: "IIT Delhi", area: "Hauz Khas", x: 84, y: 28 },
  { name: "Pari Chowk Central", area: "Greater Noida", x: 50, y: 48 },
  { name: "Delhi University North", area: "GTB Nagar", x: 86, y: 15 },
  { name: "DTU Campus", area: "Rohini Hub", x: 20, y: 20 }
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
  
  // Interactive Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef(null);
  const mapContainerRef = useRef(null);

  const activeRegion = user.state || 'Delhi NCR';

  // User campus position
  const userCampusX = user.mapX || 50;
  const userCampusY = user.mapY || 50;

  // Strict Regional Geofencing: Only show candidates from the user's active state/region
  const allMapUsers = [...candidates, ...matchedUsers].filter(
    (u, index, self) => index === self.findIndex((t) => t.id === u.id)
  );

  const geofencedUsers = allMapUsers.filter((u) => {
    // Geofence check: Must belong to same regional state
    if (u.state && u.state.toLowerCase() !== activeRegion.toLowerCase()) {
      return false;
    }

    const dist = u.distanceKm !== undefined ? u.distanceKm : 2.5;
    if (distanceFilter === '2' && dist > 2) return false;
    if (distanceFilter === '5' && dist > 5) return false;
    if (distanceFilter === '10' && dist > 10) return false;

    return true;
  });

  // Zoom handlers
  const handleZoomIn = () => setZoom(prev => Math.min(2.4, Number((prev + 0.3).toFixed(2))));
  const handleZoomOut = () => setZoom(prev => Math.max(0.65, Number((prev - 0.3).toFixed(2))));
  const handleResetPosition = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag to pan
  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-btn')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = Math.max(-120, Math.min(120, e.clientX - dragStartRef.current.x));
    const newY = Math.max(-120, Math.min(120, e.clientY - dragStartRef.current.y));
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  // Touch Pinch to Zoom & Pan
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
      const newX = Math.max(-120, Math.min(120, e.touches[0].clientX - dragStartRef.current.x));
      const newY = Math.max(-120, Math.min(120, e.touches[0].clientY - dragStartRef.current.y));
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

  return (
    <div className="flex-1 flex flex-col h-full relative select-none overflow-hidden bg-[#FFF6F9]">
      
      {/* ------------------------------------------------------------- */}
      {/* FLOATING TOP APP BAR: Status & Geofence (No Search Bar)       */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 z-20 space-y-2 pointer-events-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between bg-white/95 backdrop-blur-xl p-3 px-4 rounded-[26px] border border-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FF2D55] text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xs font-black text-slate-900 tracking-tight">Campus Radar</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]"></span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block">
                {geofencedUsers.length} students in {activeRegion}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-[#FF2D55]">
            <Globe className="w-3 h-3" />
            <span className="text-[10.5px] font-black">{activeRegion}</span>
          </div>
        </div>

        {/* Distance Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white/80 backdrop-blur-md p-1.5 px-2 rounded-full border border-white shadow-xs">
          {[
            { id: 'all', label: 'All Delhi Campuses' },
            { id: '2', label: '< 2 km' },
            { id: '5', label: '< 5 km' },
            { id: '10', label: '< 10 km' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setDistanceFilter(f.id)}
              className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                distanceFilter === f.id
                  ? 'bg-[#FF2D55] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80'
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
      <div className="absolute right-4 top-36 z-30 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="interactive-btn w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-md border border-white hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          onClick={handleZoomOut}
          className="interactive-btn w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-slate-800 flex items-center justify-center shadow-md border border-white hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="Zoom Out (See Wider Region)"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          onClick={handleResetPosition}
          className="interactive-btn w-10 h-10 rounded-full bg-white/95 backdrop-blur-md text-[#FF2D55] flex items-center justify-center shadow-md border border-white hover:bg-white active:scale-95 transition-all cursor-pointer"
          title="Recenter On Me"
        >
          <LocateFixed className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE RADAR CANVAS: GEOFENCED, PINCH & DRAG PAN         */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        
        {/* TRANSFORM LAYER: PAN & ZOOM */}
        <div 
          className="absolute inset-0 w-full h-full transition-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.25s ease-out'
          }}
        >
          {/* 1. Pink Grid Background */}
          <div className="absolute inset-[-50%] w-[200%] h-[200%] map-grid-pattern pointer-events-none"></div>

          {/* 2. Live Moving Ambient Gradient Orbs */}
          <div className="absolute top-[10%] left-[5%] w-80 h-80 rounded-full bg-[#FFB8D4]/40 blur-3xl animate-glow-1 pointer-events-none"></div>
          <div className="absolute bottom-[20%] right-[5%] w-96 h-96 rounded-full bg-[#E9D5FF]/45 blur-3xl animate-glow-2 pointer-events-none"></div>
          <div className="absolute top-[45%] left-[30%] w-72 h-72 rounded-full bg-white/75 blur-2xl pointer-events-none"></div>

          {/* 3. State Boundary Contour Line (Geofence Visual) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Delhi NCR State Geofence Ring */}
            <rect 
              x="5" y="5" width="90" height="90" rx="15" 
              fill="none" 
              stroke="rgba(255, 45, 85, 0.22)" 
              strokeWidth="1.2" 
              strokeDasharray="4 3" 
            />

            {/* River Yamuna Boulevard */}
            <path 
              d="M -10,35 Q 30,25 50,45 T 110,35" 
              fill="none" 
              stroke="#FFDCE8" 
              strokeWidth="6" 
              strokeLinecap="round"
              className="opacity-70"
            />

            {/* Arterial Highways */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="3 2" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="3 2" />
            <line x1="15" y1="10" x2="85" y2="90" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />
            <line x1="85" y1="15" x2="15" y2="85" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" />

            {/* Distance Range Concentric Rings */}
            <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(255,45,85,0.18)" strokeWidth="0.8" strokeDasharray="2 2" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,45,85,0.14)" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,45,85,0.10)" strokeWidth="0.8" strokeDasharray="4 4" />
          </svg>

          {/* 4. Campus Landmarks */}
          <div className="absolute inset-0 pointer-events-none">
            {CAMPUS_LANDMARKS.map((landmark, idx) => (
              <div
                key={idx}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-65"
                style={{ left: `${landmark.x}%`, top: `${landmark.y}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF2D55]/60 mb-0.5"></div>
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-white">
                  {landmark.name}
                </span>
              </div>
            ))}
          </div>

          {/* 5. USER CENTER RADAR PIN */}
          <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center pointer-events-none"
            style={{ left: `${userCampusX}%`, top: `${userCampusY}%` }}
          >
            <div className="absolute w-28 h-28 -top-7 -left-7 rounded-full bg-[#FF2D55]/20 radar-ping pointer-events-none"></div>
            <div className="absolute w-16 h-16 -top-1 -left-1 rounded-full bg-[#FF2D55]/30 animate-pulse pointer-events-none"></div>

            <div className="relative w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF2D55] to-purple-500 shadow-xl z-10 border-2 border-white">
              <img src={user.avatar} alt="You" className="w-full h-full object-cover rounded-full" />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>

            <div className="mt-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-[10px] font-black tracking-wide flex items-center gap-1 shadow-lg border border-white/20 whitespace-nowrap z-10">
              <MapPin className="w-2.5 h-2.5 text-[#FF2D55]" />
              <span>You • {user.university?.split(' ')[0] || 'Bennett'}</span>
            </div>
          </div>

          {/* 6. GEOFENCED CANDIDATE PINS */}
          {geofencedUsers.map((candidate, idx) => {
            const posX = candidate.mapX || (20 + ((idx * 27) % 65));
            const posY = candidate.mapY || (18 + ((idx * 31) % 62));
            const isSelected = selectedUser?.id === candidate.id;

            return (
              <div
                key={candidate.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedUser(candidate);
                }}
                className={`interactive-btn absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                  isSelected ? 'scale-115 z-30' : 'hover:scale-108 z-10'
                }`}
                style={{ left: `${posX}%`, top: `${posY}%` }}
              >
                <div className={`p-1.5 pr-3 rounded-full flex items-center gap-2 backdrop-blur-md shadow-md border transition-all ${
                  isSelected 
                    ? 'bg-slate-900 text-white border-white shadow-xl shadow-slate-900/30' 
                    : 'bg-white/95 text-slate-800 border-white hover:border-rose-200'
                }`}>
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white shrink-0">
                    <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className={`text-[11px] font-extrabold truncate max-w-[70px] ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {candidate.name.split(' ')[0]}
                    </span>
                    <span className={`text-[9px] font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {candidate.distanceKm || 1.8} km
                    </span>
                  </div>

                  <span className="text-[9.5px] font-black text-[#FF2D55] bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100 shrink-0">
                    {candidate.matchScore || 94}%
                  </span>
                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* SELECTED CANDIDATE QUICK PREVIEW BOTTOM SHEET                 */}
      {/* ------------------------------------------------------------- */}
      {selectedUser && (
        <div className="absolute bottom-20 inset-x-4 bg-white/95 backdrop-blur-2xl p-4 rounded-[28px] border border-white shadow-2xl z-30 animate-slide-up pointer-events-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-[#FF2D55]/80 shrink-0">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm text-slate-900 font-display">
                    {selectedUser.name}, {selectedUser.age}
                  </h4>
                  <BadgeCheck className="w-4 h-4 text-[#FF2D55] fill-[#FF2D55]/10" />
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {selectedUser.university || 'Campus Student'} • {selectedUser.distanceKm || 1.8} km
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9.5px] font-black text-[#FF2D55] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
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
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={() => {
                onSelectCandidate(selectedUser);
                setSelectedUser(null);
              }}
              className="flex-1 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>View Profile</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onLikeCandidate(selectedUser);
                setSelectedUser(null);
              }}
              className="flex-1 h-10 rounded-full bg-[#FF2D55] hover:bg-[#E02447] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/25 transition-all cursor-pointer"
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
