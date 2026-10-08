import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Wallet, 
  BookOpen, 
  HeartPulse, 
  FolderLock, 
  ListTodo, 
  Wifi, 
  Battery, 
  Signal, 
  ChevronLeft, 
  ChevronDown, 
  Eye, 
  Upload, 
  CreditCard, 
  PieChart,
  Settings,
  Sparkles,
  QrCode
} from 'lucide-react';
import { ScreenType } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface PhoneFrameProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ 
  children, 
  title = 'MYLIFE', 
  showBack = false 
}) => {
  const { 
    currentUser,
    activeScreen, 
    setActiveScreen, 
    goBack, 
    viewMode, 
    bankStatements, 
    upiStatements,
    transactions,
    tasks,
    uiTheme,
    textScale,
    setIsThemeModalOpen,
    setIsMobileTestOpen,
    moneyActiveView,
    setMoneyActiveView
  } = useApp();

  const [isMmMenuOpen, setIsMmMenuOpen] = useState(false);

  const getMoneySubModuleName = (view: string) => {
    switch (view) {
      case 'statements': return 'Statement Upload & Review';
      case 'ledger': return 'Transactions Ledger';
      case 'analytics': return 'Spend Analytics';
      default: return 'Money Management';
    }
  };

  const handleBack = () => {
    if (activeScreen === 'money' && moneyActiveView !== 'hub') {
      setMoneyActiveView('hub');
    } else {
      goBack();
    }
  };

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const totalStatementsCount = bankStatements.length + upiStatements.length;

  const getThemeClass = () => {
    switch (uiTheme) {
      case 'sepia': return 'theme-sepia bg-[#181410] text-[#fef3c7] border-[#382d24]';
      case 'sage': return 'theme-sage bg-[#091310] text-[#ecfdf5] border-[#1b3329]';
      case 'light': return 'theme-light bg-[#f8fafc] text-[#0f172a] border-slate-300';
      case 'high_contrast': return 'theme-high_contrast bg-black text-white border-yellow-400 ring-2 ring-yellow-400';
      default: return 'theme-dark bg-slate-950 text-slate-100 border-slate-800';
    }
  };

  return (
    <div className={`flex justify-center items-center py-0 md:py-6 w-full min-h-[100dvh] md:min-h-0 ${textScale === 'large' ? 'text-[106%]' : ''}`}>
      {/* Phone container shell: Fullscreen on mobile devices, sleek device frame on desktop preview */}
      <div className={`relative w-full md:max-w-[420px] h-[100dvh] md:h-[844px] rounded-none md:rounded-[46px] border-0 md:border-[8px] shadow-none md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col overflow-hidden ring-0 md:ring-1 ring-slate-700/50 transition-colors duration-300 ${getThemeClass()}`}>
        
        {/* Dynamic Island / Speaker cutout (Shown on desktop phone preview) */}
        <div className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 items-center justify-center gap-2 border border-slate-800/80">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-950/60" />
        </div>

        {/* Top Status Bar (Shown on desktop phone preview; real mobile OS provides its own status bar) */}
        <div className="hidden md:flex pt-3.5 px-6 pb-2 items-center justify-between text-xs font-semibold text-slate-300 z-40 bg-slate-950/90 select-none">
          <span className="font-mono text-[13px] tracking-tight text-slate-200">{currentTime}</span>
          <div className="flex items-center gap-2 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono">98%</span>
              <Battery className="w-4 h-4 fill-slate-300 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Top App Bar inside Phone */}
        <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 sticky top-0 z-30 select-none safe-top">
          <div className="flex items-center gap-1.5 min-w-0">
            {showBack && activeScreen !== 'home' ? (
              <button
                type="button"
                onClick={handleBack}
                className="p-1 -ml-1 text-slate-300 hover:text-amber-400 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1 shrink-0"
                title={activeScreen === 'money' && moneyActiveView !== 'hub' ? "Back to MM Modules" : "Back to Home Page"}
              >
                <ChevronLeft className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[75px]">
                  {activeScreen === 'money' && moneyActiveView !== 'hub' ? 'MM Hub' : 'MYLIFE'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-400 text-xs shadow-sm">
                  M
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-amber-400 leading-none tracking-wide">
                    MYLIFE
                  </span>
                  <span className="text-[10px] text-slate-400 leading-none font-medium mt-0.5 truncate max-w-[120px]">
                    {currentUser?.name || 'Manoj Kumar'}
                  </span>
                </div>
              </div>
            )}

            {/* Sub-module title area */}
            {activeScreen === 'money' ? (
              <div className="relative pl-1.5 border-l border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMmMenuOpen(!isMmMenuOpen)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-200 hover:text-amber-300 transition-colors group focus:outline-none cursor-pointer"
                  title="Click to switch Money Management sub-modules"
                >
                  <span className="truncate max-w-[175px] sm:max-w-[210px]">
                    {getMoneySubModuleName(moneyActiveView)}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform ${isMmMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu for MM Sub-Modules */}
                {isMmMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" 
                      onClick={() => setIsMmMenuOpen(false)} 
                    />
                    <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-1.5 z-50 text-xs flex flex-col gap-1 backdrop-blur-md animate-in fade-in duration-150">
                      <div className="px-2.5 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        Money Modules
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setMoneyActiveView('hub');
                          setIsMmMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                          moneyActiveView === 'hub' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5 text-amber-400" />
                          <span>MM Hub Overview</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoneyActiveView('statements');
                          setIsMmMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                          moneyActiveView === 'statements' ? 'bg-amber-400/20 text-amber-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Statements Upload & Review</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{totalStatementsCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoneyActiveView('ledger');
                          setIsMmMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                          moneyActiveView === 'ledger' ? 'bg-sky-400/20 text-sky-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                          <span>Adaptive Ledger</span>
                        </div>
                        <span className="text-[10px] font-mono text-sky-400">{transactions.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMoneyActiveView('analytics');
                          setIsMmMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                          moneyActiveView === 'analytics' ? 'bg-emerald-400/20 text-emerald-300 font-bold' : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <PieChart className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Spend Analytics</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {/* Right side: Actions, PWA Install, Total Transactions in Ledger, or Settings on Home */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Install PWA Button on mobile */}
            <PWAInstallButton variant="compact" />

            {/* Test on Mobile Phone Scanner Button */}
            <button
              type="button"
              onClick={() => setIsMobileTestOpen(true)}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/30 text-amber-400 hover:text-amber-300 transition-colors shadow-sm cursor-pointer"
              title="Test MYLIFE on physical mobile phone (QR code scanner)"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            {activeScreen === 'action_pt' && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {pendingTasksCount} Tasks
              </span>
            )}

            {/* In Transaction Ledger: Total Transactions */}
            {activeScreen === 'money' && moneyActiveView === 'ledger' ? (
              <div 
                className="px-2 py-1 rounded-xl bg-sky-400/15 border border-sky-400/35 text-sky-300 flex items-center gap-1 shadow-sm text-xs font-semibold shrink-0 font-mono"
                title={`Total transactions in present ledger: ${transactions.length}`}
              >
                <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                <span>{transactions.length} Txns</span>
              </div>
            ) : activeScreen === 'home' ? (
              /* On Home screen: Settings button */
              <button
                type="button"
                onClick={() => setIsThemeModalOpen(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/50 text-slate-200 hover:text-amber-300 transition-all flex items-center gap-1.5 shadow-sm text-xs font-semibold shrink-0 cursor-pointer"
                title="Settings (Theme & Appearance)"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Settings</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Main Content Area (Scrollable with full height spread capability) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 text-slate-200 scrollbar-thin scrollbar-thumb-slate-800 flex flex-col">
          {children}
        </div>

        {/* Bottom Home Indicator Line */}
        <div className="pb-3 pt-2 bg-slate-950 flex justify-center z-40 border-t border-slate-900 safe-bottom">
          <div className="w-32 h-1 bg-slate-700/80 rounded-full" />
        </div>

      </div>
    </div>
  );
};
