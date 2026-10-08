import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'pill';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running in standalone / installed mode, suppress button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        await install();
      } finally {
        setInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not installable and not iOS (e.g. desktop browser that doesn't support beforeinstallprompt yet),
  // we still can show a helpful "Install App" pill explaining how to install or add shortcut
  const canShow = isInstallable || isIOS;

  return (
    <>
      {canShow ? (
        variant === 'full' ? (
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installing}
            className={`w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer ${className}`}
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Install MYLIFE App</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-all cursor-pointer shadow-sm ${className}`}
            title="Install MYLIFE as a Mobile Application"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )
      ) : null}

      {/* iOS Safari Step-by-Step Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300">Install MYLIFE on iPhone / iPad</h3>
                  <p className="text-[10px] text-slate-400">Save directly to your home screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="w-6 h-6 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Tap the Share button</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    Tap <Share2 className="w-3.5 h-3.5 text-sky-400 inline" /> at the bottom of Safari toolbar.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="w-6 h-6 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Add to Home Screen</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    Scroll down and select <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" /> <span className="font-semibold text-slate-200">"Add to Home Screen"</span>.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="w-6 h-6 rounded-lg bg-emerald-400/15 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-100">Launch from Home Screen</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tap <span className="font-semibold text-amber-300">Add</span>. MYLIFE opens as a standalone full-screen mobile app!
                  </p>
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
