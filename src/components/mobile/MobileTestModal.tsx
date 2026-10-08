import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Smartphone, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Download, 
  QrCode, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileTestModal: React.FC<MobileTestModalProps> = ({ isOpen, onClose }) => {
  const { setViewMode } = useApp();
  const [copied, setCopied] = useState(false);
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>('android');
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // The public shared application URL that anyone (including unauthenticated mobile phones) can load directly
    const publicAppUrl = 'https://ais-pre-e6uzoa6gs5ptwlkjoauc2u-37514497188.asia-southeast1.run.app';
    
    if (typeof window !== 'undefined') {
      try {
        const href = window.location.href;
        // If loaded directly from a public run.app domain or non-aistudio domain, use it;
        // If inside an aistudio iframe or parent container, default to the public pre URL.
        if (href.includes('aistudio.google.com') || href.includes('ais-dev-')) {
          setAppUrl(publicAppUrl);
        } else if (href.startsWith('http')) {
          setAppUrl(href);
        } else {
          setAppUrl(publicAppUrl);
        }
      } catch {
        setAppUrl(publicAppUrl);
      }
    } else {
      setAppUrl(publicAppUrl);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(appUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSwitchToMobileMode = () => {
    setViewMode('mobile');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-100 tracking-tight">
                  Test MYLIFE on Mobile
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/30">
                  v1.0 Mobile OS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan with your phone camera or copy link to open directly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* QR Code Section */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="p-3 bg-white rounded-2xl shadow-md shrink-0 flex items-center justify-center">
              <QRCodeSVG 
                value={appUrl || 'https://ais-pre-e6uzoa6gs5ptwlkjoauc2u-37514497188.asia-southeast1.run.app'} 
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <QrCode className="w-3.5 h-3.5" />
                <span>Instant Phone Scanner</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100">
                Point your smartphone camera here
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open the Camera app on iPhone or Android, aim at the QR code, and tap the yellow banner to launch MYLIFE immediately.
              </p>
            </div>
          </div>

          {/* Direct Link & Copy Action */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Mobile Testing Link</span>
              <span className="text-[11px] text-amber-400 font-mono">Live Deployment</span>
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-slate-950 rounded-xl border border-slate-800">
              <input 
                type="text" 
                readOnly 
                value={appUrl} 
                className="w-full bg-transparent px-2.5 py-1 text-xs font-mono text-slate-300 focus:outline-none select-all truncate" 
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Installation & Mobile Experience Guide */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Install as Native App on Mobile
              </span>
              <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPlatformTab('android')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    platformTab === 'android' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setPlatformTab('ios')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    platformTab === 'ios' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  iPhone (iOS)
                </button>
              </div>
            </div>

            {platformTab === 'android' ? (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    Open the link in <strong>Chrome</strong> on your Android phone.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    Tap the <strong>"Install MYLIFE"</strong> banner at the top, or tap the <strong>⋮ (Menu)</strong> and select <strong>"Install app"</strong> / <strong>"Add to Home Screen"</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    Tap <strong>Install</strong>. MYLIFE is now on your phone's home screen and app drawer with standalone offline capabilities!
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    Open the link in <strong>Safari</strong> on your iPhone.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    Tap the <strong>Share button</strong> <Share2 className="inline w-3.5 h-3.5 text-amber-400 mx-0.5" /> at the bottom bar of Safari.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong> in the top right. MYLIFE will open full screen without Safari toolbars!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick checklist of mobile modules */}
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2">
              Tested & Ready in this Mobile Build
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Adaptive Ledger & UPI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Passbooks & Bank Cards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Native Touch Navigation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Eye Comfort Dark/Sepia</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSwitchToMobileMode}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Switch to Mobile View Here</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
