import React from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2,
  ArrowDownToLine,
  Layers
} from 'lucide-react';
import CupidLogo from './CupidLogo';

export default function DownloadApkModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Direct APK download URLs
  const apkDirectDownloadUrl = "https://github.com/Cupid-AI-Pro/cupid-rounds/releases/download/v1.0.0/app-debug.apk";
  const repoReleasesUrl = "https://github.com/Cupid-AI-Pro/cupid-rounds/releases";

  const handleDownloadClick = () => {
    // Open direct APK download
    window.open(apkDirectDownloadUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-[32px] max-w-[360px] w-full p-6 shadow-2xl border border-pink-100 relative text-center animate-slide-up space-y-4">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="pt-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF2D55] to-pink-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/30">
            <Smartphone className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-black text-slate-900 font-display">
            Download Cupid App
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Install the native Android APK directly on your phone
          </p>
        </div>

        {/* APK Details Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Version:</span>
            <span className="font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              v1.0.0 (Official)
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Compatibility:</span>
            <span className="font-extrabold text-slate-800">Android 8.0 & Above</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Security:</span>
            <span className="font-extrabold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified & Safe
            </span>
          </div>
        </div>

        {/* Primary Action: Direct APK Download Link */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadClick}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#FF2D55] via-pink-500 to-rose-500 hover:brightness-105 text-white font-extrabold text-xs tracking-wide rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-transform active:scale-[0.98] cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
            <span>Direct Download Cupid.apk (Android)</span>
          </button>

          <a
            href={repoReleasesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All GitHub Releases</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        {/* 3-Step Simple Installation Guide */}
        <div className="pt-2 border-t border-slate-100 text-left space-y-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            How to Install:
          </span>
          <div className="text-[11px] text-slate-600 space-y-1 font-medium leading-relaxed">
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-pink-50 text-[#FF2D55] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Tap <strong>"Direct Download"</strong> button above.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-pink-50 text-[#FF2D55] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Open the downloaded <strong>.apk</strong> file.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-pink-50 text-[#FF2D55] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Tap <strong>"Install"</strong> (Allow unknown sources if prompted) & enjoy!</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
