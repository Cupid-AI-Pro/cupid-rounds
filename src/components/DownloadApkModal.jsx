import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  Download,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  GitBranch
} from 'lucide-react';

export default function DownloadApkModal({ isOpen, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  // APK hosted on Vercel's public folder — works even with private GitHub repo
  const APK_DIRECT_URL = "https://cupid-round.vercel.app/downloads/cupid-rounds.apk";
  const GITHUB_ACTIONS_URL = "https://github.com/Cupid-AI-Pro/cupid-rounds/actions";

  const handleDirectDownload = () => {
    setDownloading(true);
    // Create an anchor and trigger download
    const a = document.createElement('a');
    a.href = APK_DIRECT_URL;
    a.download = 'CupidRounds.apk';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-t-[32px] sm:rounded-[32px] max-w-[440px] w-full p-6 shadow-2xl border border-pink-100 relative animate-slide-up space-y-5">
        
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
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#FF2D55] to-pink-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/30">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900">
            Download Cupid App
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Android APK — Direct Install. No Play Store needed.
          </p>
        </div>

        {/* ── PRIMARY DIRECT DOWNLOAD BUTTON ── */}
        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={downloading}
          className={`w-full py-4 px-5 rounded-2xl flex items-center justify-center gap-3 font-extrabold text-sm transition-all active:scale-[0.98] cursor-pointer shadow-lg ${
            downloaded
              ? 'bg-emerald-500 shadow-emerald-500/30 text-white'
              : 'bg-gradient-to-r from-[#FF2D55] via-pink-500 to-rose-500 shadow-rose-500/30 text-white hover:brightness-105'
          }`}
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Download Started! Check your Downloads folder.</span>
            </>
          ) : downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              <span>Starting download...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Download APK (Direct)</span>
            </>
          )}
        </button>

        {/* ── NOTICE: If APK is not built yet ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-amber-800">First time? APK needs to be built once.</p>
              <p className="text-[11px] text-amber-700 font-medium mt-1 leading-relaxed">
                If download fails, the APK build hasn't run yet. Go to GitHub Actions, run the <strong>"Build Android APK"</strong> workflow — it takes ~5 min and the download will work automatically after that.
              </p>
            </div>
          </div>
          <a
            href={GITHUB_ACTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full py-2.5 px-4 bg-white border border-amber-300 hover:bg-amber-50 rounded-xl text-xs font-extrabold text-slate-800 transition-colors cursor-pointer"
          >
            <GitBranch className="w-4 h-4 text-slate-700" />
            <span>GitHub Actions → Run APK Build</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
          </a>
        </div>

        {/* ── INSTALL INSTRUCTIONS (English only, clean) ── */}
        <div className="border-t border-slate-100 pt-4 space-y-2.5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            How to install APK on Android (30 seconds):
          </p>
          <div className="space-y-2">
            {[
              { n: 1, text: <>Tap <strong>"Download APK (Direct)"</strong> above — file will save to your Downloads folder.</> },
              { n: 2, text: <>Open your <strong>Files / Downloads app</strong> and tap <strong>"CupidRounds.apk"</strong>.</> },
              { n: 3, text: <>If prompted, tap <strong>"Install from Unknown Sources"</strong> and allow it once.</> },
              { n: 4, text: <>Tap <strong>Install</strong> — Cupid will appear on your home screen! 🎉</> },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#FF2D55] to-pink-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  {n}
                </span>
                <span className="text-[11px] text-slate-600 font-medium leading-relaxed">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>100% Safe • No Play Store needed • Free Forever</span>
        </div>

      </div>
    </div>
  );
}
