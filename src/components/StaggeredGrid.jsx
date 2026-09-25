import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import imagesLoaded from 'imagesloaded';
import { 
  Heart, 
  ShieldCheck, 
  MapPin, 
  Coffee, 
  BookOpen, 
  Music, 
  Zap, 
  Award,
  Users
} from 'lucide-react';

// Register GSAP ScrollTrigger plugin safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Utility class name merge helper
const cn = (...classes) => classes.filter(Boolean).join(' ');

export function StaggeredGrid({
  images = [],
  bentoItems = [],
  centerText = "CUPID ROUNDS",
  credits = {
    madeBy: { text: "Verified Campus Matchmaking", href: "#how-it-works" },
    moreDemos: { text: "100% Refund Guarantee", href: "#refund" }
  },
  className = "",
  showFooter = false,
  scroller
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const textRef = useRef(null);
  const upperGridRef = useRef(null);
  const bentoRef = useRef(null);
  const lowerGridRef = useRef(null);

  // Bento Grid State
  const [activeBento, setActiveBento] = useState(0);

  const splitText = (text) => {
    return text.split('').map((char, i) => (
      <span key={i} className="char inline-block font-serif" style={{ willChange: 'transform' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  useEffect(() => {
    const handleLoad = () => {
      if (document.body) {
        document.body.classList.remove('loading');
      }
      setIsLoaded(true);
    };

    const targetImgs = document.querySelectorAll('.grid__item-img');
    if (targetImgs.length > 0) {
      imagesLoaded(targetImgs, { background: true }, handleLoad);
    } else {
      handleLoad();
    }

    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const ctx = gsap.context(() => {
      // 1. Animate Header Text
      if (textRef.current) {
        const chars = textRef.current.querySelectorAll('.char');
        if (chars.length > 0) {
          gsap.timeline({
            scrollTrigger: {
              trigger: textRef.current,
              scroller: scroller || undefined,
              start: 'top bottom-=5%',
              end: 'center center-=15%',
              scrub: 1,
            }
          })
          .from(chars, {
            ease: 'sine.out',
            yPercent: 220,
            autoAlpha: 0,
            stagger: {
              each: 0.04,
              from: 'center'
            }
          });
        }
      }

      // Helper for staggered grid animations
      const animateGridSection = (gridEl) => {
        if (!gridEl) return;
        const items = gridEl.querySelectorAll('.grid__item');
        if (!items || items.length === 0) return;

        const numColumns = window.innerWidth < 640 ? 3 : window.innerWidth < 1024 ? 4 : 6;
        const middleColumnIndex = Math.floor(numColumns / 2);

        const columns = Array.from({ length: numColumns }, () => []);
        items.forEach((item, idx) => {
          const colIndex = idx % numColumns;
          columns[colIndex].push(item);
        });

        columns.forEach((columnItems, columnIndex) => {
          if (!columnItems || columnItems.length === 0) return;
          const delayFactor = Math.abs(columnIndex - middleColumnIndex) * 0.15;
          const innerImgs = columnItems.map(item => item.querySelector('.grid__item-img')).filter(Boolean);

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: gridEl,
              scroller: scroller || undefined,
              start: 'top bottom+=15%',
              end: 'center center',
              scrub: 1.2,
            }
          });

          tl.from(columnItems, {
            yPercent: 160,
            autoAlpha: 0,
            delay: delayFactor,
            ease: 'sine.out',
          });

          if (innerImgs.length > 0) {
            tl.from(innerImgs, {
              transformOrigin: '50% 0%',
              ease: 'sine.out',
            }, 0);
          }
        });
      };

      animateGridSection(upperGridRef.current);
      animateGridSection(lowerGridRef.current);

      // 3. Bento Middle Highlight Animation
      if (bentoRef.current) {
        gsap.timeline({
          scrollTrigger: {
            trigger: bentoRef.current,
            scroller: scroller || undefined,
            start: 'top bottom-=10%',
            end: 'center center',
            scrub: 1,
          }
        })
        .from(bentoRef.current, {
          scale: 0.94,
          autoAlpha: 0,
          y: 35,
          ease: 'power2.out',
        });
      }
    });

    return () => ctx.revert();
  }, [isLoaded, scroller]);

  // Mix of Indian Humans + Cartoon/Illustrated Characters
  const indianAndCartoonImages = [
    '/avatars/ananya.jpg',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    '/avatars/aarav.jpg',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    '/avatars/zoya.jpg',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    '/avatars/kabir.jpg',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    '/avatars/rhea.jpg',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80',
  ];

  const activeImages = images.length > 0 ? images : indianAndCartoonImages;

  // Bento Cards
  const defaultBentoItems = [
    {
      id: 1,
      title: "DU & NCR Radar",
      subtitle: "Verified College Students",
      description: "Live radar showing verified DU, IIT & Ashoka students active nearby.",
      icon: <MapPin className="w-4 h-4 text-emerald-600" />,
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Edu Verified",
      subtitle: "100% Real Profiles",
      description: "College ID verification ensures genuine vibes with zero fake profiles.",
      icon: <ShieldCheck className="w-4 h-4 text-[#FF2E79]" />,
      image: "/avatars/ananya.jpg"
    },
    {
      id: 3,
      title: "Sunday Drop",
      subtitle: "Curated Matches",
      description: "Weekly match drop every Sunday at 8 PM for real weekend dates.",
      icon: <Heart className="w-4 h-4 text-rose-500" />,
      image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "100% Refund",
      subtitle: "Zero Risk Dates",
      description: "Find a mutual match or receive a 100% instant automatic refund.",
      icon: <Heart className="w-4 h-4 text-rose-500" />,
      image: "/avatars/zoya.jpg"
    }
  ];

  const activeBentoItems = bentoItems.length > 0 ? bentoItems : defaultBentoItems;

  const cardLabelsAndIcons = [
    { label: "Coffee Walk", icon: Coffee },
    { label: "Verified DU", icon: ShieldCheck },
    { label: "Campus Radar", icon: MapPin },
    { label: "Indie Gigs", icon: Music },
    { label: "Sunday Drop", icon: Heart },
    { label: "Library Meet", icon: BookOpen },
    { label: "100% Refund", icon: Award },
    { label: "Real Vibe", icon: Heart },
    { label: "Speed Dating", icon: Zap },
    { label: "Campus Friends", icon: Users },
  ];

  const upperCards = activeImages.slice(0, 6);
  const lowerCards = activeImages.slice(6, 12);

  return (
    <div className={cn("relative w-full pt-4 pb-8 my-2 bg-transparent text-slate-900 overflow-visible", className)}>
      
      {/* Background Glow Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <section className="grid place-items-center w-full relative mb-6 px-4 text-center">
        <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-[#FF2E79] bg-rose-50 border border-rose-200/90 px-4 py-1.5 rounded-full mb-2.5 shadow-sm inline-block">
          Explore Campus Life & Matches
        </span>
        <div ref={textRef} className="text font-serif uppercase flex flex-wrap justify-center text-[clamp(2.2rem,6.5vw,5.5rem)] leading-[0.95] text-slate-900 font-black tracking-tight drop-shadow-sm">
          {splitText(centerText)}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mt-1.5">
          Real college students matching with intention across North Campus, Gurgaon & Delhi NCR.
        </p>
      </section>

      {/* 1. Upper Cards Grid */}
      <section className="grid place-items-center w-full relative px-2 sm:px-4 max-w-7xl mx-auto mb-4 sm:mb-6">
        <div ref={upperGridRef} className="w-full grid gap-2.5 sm:gap-3.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
          {upperCards.map((item, i) => {
            const { label, icon: Icon } = cardLabelsAndIcons[i % cardLabelsAndIcons.length];
            return (
              <figure 
                key={`upper-img-${i}`} 
                className="grid__item m-0 relative z-10 [perspective:800px] will-change-[transform,opacity] group cursor-pointer"
              >
                <div className="grid__item-img w-full aspect-[4/5] [backface-visibility:hidden] will-change-transform rounded-2xl overflow-hidden shadow-md border border-rose-100/80 bg-white flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-105 group-hover:shadow-xl group-hover:border-rose-400 group-hover:ring-2 group-hover:ring-rose-400/20">
                  <img src={item} alt={label} className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent opacity-50 group-hover:opacity-85 transition-opacity duration-500 z-0" />
                  <div className="relative z-10 flex flex-col items-center justify-center gap-1 p-2 text-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm border border-rose-200 flex items-center justify-center text-[#FF2E79] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FF2E79] group-hover:text-white">
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="text-center opacity-90 group-hover:opacity-100 transform translate-y-0 transition-all duration-300">
                      <span className="block text-[7px] sm:text-[8px] font-extrabold text-pink-300 uppercase tracking-widest mb-0.5">Explore</span>
                      <span className="block text-[9px] sm:text-xs font-black text-white tracking-tight">{label}</span>
                    </div>
                  </div>
                </div>
              </figure>
            );
          })}
        </div>
      </section>

      {/* 2. Middle Dedicated Bento Container (100% Zero Overlap Guarantee) */}
      <section ref={bentoRef} className="w-full relative px-2 sm:px-4 max-w-7xl mx-auto my-4 sm:my-8 z-30">
        <div className="bento-container w-full h-44 sm:h-52 md:h-56 flex items-center justify-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-xl p-1.5 sm:p-2.5 rounded-2xl border-2 border-rose-200/90 shadow-xl shadow-rose-950/5">
          {activeBentoItems.map((bentoItem, index) => {
            const isActive = activeBento === index;
            return (
              <div
                key={bentoItem.id}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-xl h-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]",
                  isActive
                    ? "bg-slate-900 shadow-xl"
                    : "bg-slate-100 hover:bg-rose-50"
                )}
                style={{ width: isActive ? "64%" : "12%" }}
                onMouseEnter={() => setActiveBento(index)}
                onClick={() => setActiveBento(index)}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl border z-50 pointer-events-none transition-colors duration-700",
                  isActive
                    ? "border-rose-400 shadow-[0_0_12px_rgba(255,46,121,0.35)]"
                    : "border-slate-200 group-hover:border-rose-300"
                )} />

                {/* Active State Content */}
                <div className="relative z-10 w-full h-full flex flex-col p-0">
                  <div className={cn(
                    "absolute inset-0 flex flex-col transition-all duration-500 ease-in-out",
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                  )}>
                    <div className="absolute inset-0 bg-slate-900 overflow-hidden z-0 group/img">
                      {bentoItem.image && (
                        <>
                          <img
                            src={bentoItem.image}
                            alt={bentoItem.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 opacity-90 group-hover/img:scale-105"
                          />
                          <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
                        </>
                      )}
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-2.5 sm:p-3 flex items-end justify-between z-20">
                      <div className="flex flex-col relative z-10 text-left">
                        <span className="text-[8px] sm:text-[9px] font-black text-rose-300 uppercase tracking-widest leading-none mb-0.5">{bentoItem.subtitle}</span>
                        <h3 className="text-xs sm:text-sm font-bold text-white drop-shadow-md leading-tight tracking-tight">{bentoItem.title}</h3>
                      </div>
                      <div className="text-white bg-white/20 backdrop-blur-md p-1.5 rounded-lg border border-white/30 shadow-md">
                        {bentoItem.icon}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inactive State Content */}
                <div className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all duration-500 p-1",
                  isActive ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
                )}>
                  <div className="text-slate-600 group-hover:text-[#FF2E79] transition-colors">
                    {bentoItem.icon}
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors uppercase tracking-widest text-center truncate max-w-full hidden sm:block">
                    {bentoItem.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Lower Cards Grid */}
      <section className="grid place-items-center w-full relative px-2 sm:px-4 max-w-7xl mx-auto mt-4 sm:mt-6">
        <div ref={lowerGridRef} className="w-full grid gap-2.5 sm:gap-3.5 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
          {lowerCards.map((item, i) => {
            const { label, icon: Icon } = cardLabelsAndIcons[(i + 6) % cardLabelsAndIcons.length];
            return (
              <figure 
                key={`lower-img-${i}`} 
                className="grid__item m-0 relative z-10 [perspective:800px] will-change-[transform,opacity] group cursor-pointer"
              >
                <div className="grid__item-img w-full aspect-[4/5] [backface-visibility:hidden] will-change-transform rounded-2xl overflow-hidden shadow-md border border-rose-100/80 bg-white flex items-center justify-center transition-all duration-500 ease-out group-hover:scale-105 group-hover:shadow-xl group-hover:border-rose-400 group-hover:ring-2 group-hover:ring-rose-400/20">
                  <img src={item} alt={label} className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent opacity-50 group-hover:opacity-85 transition-opacity duration-500 z-0" />
                  <div className="relative z-10 flex flex-col items-center justify-center gap-1 p-2 text-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-sm border border-rose-200 flex items-center justify-center text-[#FF2E79] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FF2E79] group-hover:text-white">
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="text-center opacity-90 group-hover:opacity-100 transform translate-y-0 transition-all duration-300">
                      <span className="block text-[7px] sm:text-[8px] font-extrabold text-pink-300 uppercase tracking-widest mb-0.5">Explore</span>
                      <span className="block text-[9px] sm:text-xs font-black text-white tracking-tight">{label}</span>
                    </div>
                  </div>
                </div>
              </figure>
            );
          })}
        </div>
      </section>

      {showFooter && (
        <footer className="frame__footer w-full p-6 flex justify-between items-center relative z-50 text-slate-500 uppercase font-bold text-[10px] sm:text-xs tracking-widest border-t border-rose-100/80 mt-4 max-w-7xl mx-auto">
          <a href={credits.madeBy.href} className="hover:text-[#FF2E79] transition-colors">
            {credits.madeBy.text}
          </a>
          <a href={credits.moreDemos.href} className="hover:text-[#FF2E79] transition-colors">
            {credits.moreDemos.text}
          </a>
        </footer>
      )}
    </div>
  );
}

export default StaggeredGrid;
