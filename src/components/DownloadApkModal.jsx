import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  Download,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  PackageCheck
} from 'lucide-react';

export default function DownloadApkModal({ isOpen, onClose, onLaunchApp }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  // Direct APK download URL from GitHub Release
  const APK_DOWNLOAD_URL = "https://github.com/Cupid-AI-Pro/cupid-rounds/releases/download/v1.0.0/app-debug.apk";

  const handleDownloadApk = () => {
    setDownloading(true);
    const a = document.createElement('a');
    a.href = APK_DOWNLOAD_URL;
    a.download = 'CupidRounds.apk';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-t-[32px] sm:rounded-[32px] max-w-[420px] w-full p-6 shadow-2xl border border-pink-100 relative animate-slide-up space-y-5">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pt-1 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF2D55] to-rose-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/30">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-serif font-black text-slate-900">
            Download Android APK
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real Android Application (.apk) • Direct Install
          </p>
        </div>

        {/* Primary Direct APK Download CTA */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadApk}
            disabled={downloading}
            className={`w-full py-4 px-5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.98] cursor-pointer ${
              downloaded 
                ? 'bg-emerald-500 shadow-emerald-500/30 text-white' 
                : 'bg-gradient-to-r from-[#FF2D55] via-rose-500 to-pink-500 text-white shadow-rose-500/30 hover:brightness-105'
            }`}
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Starting APK Download...</span>
              </>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>APK Downloading! Check Downloads</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Download CupidRounds.apk</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLaunchApp) onLaunchApp();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#FF2D55]" />
            <span>Open Web Version Instead</span>
          </button>
        </div>

        {/* Install Guide */}
        <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2.5 border border-slate-100">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            How to install APK (3 simple steps):
          </p>
          <div className="space-y-2 text-xs text-slate-600 font-medium">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-rose-100 text-[#FF2D55] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
              <span>Tap <strong>"Download CupidRounds.apk"</strong> button above.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-rose-100 text-[#FF2D55] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
              <span>Open your phone's <strong>Downloads</strong> folder and tap the file.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-rose-100 text-[#FF2D55] font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
              <span>Tap <strong>Install</strong> when prompted — enjoy the app! 🎉</span>
            </div>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>100% Safe • Official Android Package • Verified</span>
        </div>

      </div>
    </div>
  );
}
