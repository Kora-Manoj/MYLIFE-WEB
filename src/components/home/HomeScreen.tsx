import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Wallet, 
  BookOpen, 
  HeartPulse, 
  FolderLock, 
  ListTodo, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Droplet,
  CheckCircle2,
  Sparkles,
  Layers,
  FileCheck,
  Settings,
  ChevronRight,
  Palette,
  Smartphone,
  QrCode
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { 
    setActiveScreen, 
    bankStatements, 
    upiStatements, 
    notes, 
    healthMetric, 
    documents, 
    tasks,
    setIsBankReviewOpen,
    setIsUpiReviewOpen,
    setIsThemeModalOpen,
    setIsMobileTestOpen,
    uiTheme
  } = useApp();

  const totalStatements = bankStatements.length + upiStatements.length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const waterPercent = Math.round((healthMetric.waterMl / healthMetric.waterGoalMl) * 100);

  return (
    <div className="h-full flex-1 flex flex-col justify-between gap-3 select-none">
      
      {/* 2x2 GRID FOR CORE MODULES (MM, KB, HM, DM) WITH COMFORTABLE ART & COLORS */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        
        {/* 1. MM: Money Management */}
        <button
          onClick={() => setActiveScreen('money')}
          className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900/95 to-slate-950 border border-amber-500/30 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/10 transition-all text-left flex flex-col justify-between group relative overflow-hidden"
        >
          {/* Decorative Financial Wave & Vault Drawing */}
          <div className="absolute right-0 bottom-0 w-32 h-24 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
            <svg viewBox="0 0 120 70" className="w-full h-full text-amber-400 stroke-current fill-none">
              <path d="M 0 55 Q 30 35, 60 45 T 120 18" strokeWidth="2.5" />
              <path d="M 0 55 Q 30 35, 60 45 T 120 18 L 120 70 L 0 70 Z" fill="currentColor" fillOpacity="0.12" />
              <circle cx="60" cy="45" r="3.5" fill="currentColor" />
              <circle cx="120" cy="18" r="3.5" fill="currentColor" />
              {/* Vault pillar accents */}
              <line x1="88" y1="36" x2="88" y2="60" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="104" y1="28" x2="104" y2="60" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30">
                MM
              </span>
            </div>

            <div className="mt-2.5">
              <div className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                Money
              </div>
              <div className="text-xs font-semibold text-amber-400/90 -mt-0.5">
                Management
              </div>
            </div>

            <div className="mt-1 text-[11px] text-slate-400 leading-tight">
              Cashflow & Passbooks
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">{totalStatements} Statements</span>
              <span className="text-[10px] font-mono text-amber-300 font-semibold">₹1.01L</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveScreen('money');
                  setIsBankReviewOpen(true);
                }}
                className="flex-1 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[10px] font-bold border border-amber-400/30 text-center cursor-pointer transition-colors"
              >
                Bank ▼
              </span>
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveScreen('money');
                  setIsUpiReviewOpen(true);
                }}
                className="flex-1 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-[10px] font-bold border border-amber-400/30 text-center cursor-pointer transition-colors"
              >
                UPI ▼
              </span>
            </div>
          </div>
        </button>

        {/* 2. KB: Knowledge Base */}
        <button
          onClick={() => setActiveScreen('knowledge')}
          className="p-4 rounded-3xl bg-gradient-to-br from-sky-500/15 via-slate-900/95 to-slate-950 border border-sky-500/30 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition-all text-left flex flex-col justify-between group relative overflow-hidden"
        >
          {/* Decorative Knowledge Graph & Codex Drawing */}
          <div className="absolute right-0 bottom-0 w-32 h-24 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
            <svg viewBox="0 0 100 80" className="w-full h-full text-sky-400 stroke-current fill-none">
              <line x1="20" y1="20" x2="65" y2="28" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="65" y1="28" x2="45" y2="65" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="20" y1="20" x2="45" y2="65" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="65" y1="28" x2="90" y2="50" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="20" cy="20" r="4.5" fill="currentColor" fillOpacity="0.4" />
              <circle cx="65" cy="28" r="5.5" fill="currentColor" fillOpacity="0.5" />
              <circle cx="45" cy="65" r="4.5" fill="currentColor" fillOpacity="0.4" />
              <circle cx="90" cy="50" r="3.5" fill="currentColor" fillOpacity="0.3" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-sky-400/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-md group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold text-sky-300 px-2 py-0.5 rounded-full bg-sky-400/15 border border-sky-400/30">
                KB
              </span>
            </div>

            <div className="mt-2.5">
              <div className="text-base font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                Knowledge
              </div>
              <div className="text-xs font-semibold text-sky-400/90 -mt-0.5">
                Base & Wiki
              </div>
            </div>

            <div className="mt-1 text-[11px] text-slate-400 leading-tight">
              Ideas, Notes & Guides
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-sky-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">{notes.length} Curated Notes</span>
              <span className="text-[10px] font-mono text-sky-300">2 Pinned</span>
            </div>
            
            <div className="flex items-center gap-1 text-[10px] text-sky-300/90 font-mono overflow-hidden">
              <span className="px-1.5 py-0.5 rounded bg-sky-400/10 border border-sky-400/20">Finance</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-400/10 border border-sky-400/20">Tech</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-400/10 border border-sky-400/20">Wiki</span>
            </div>
          </div>
        </button>

        {/* 3. HM: Health Management */}
        <button
          onClick={() => setActiveScreen('health')}
          className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-slate-900/95 to-slate-950 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 transition-all text-left flex flex-col justify-between group relative overflow-hidden"
        >
          {/* Decorative Cardiogram Wave & Health Flora Drawing */}
          <div className="absolute right-0 bottom-1 w-32 h-20 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
            <svg viewBox="0 0 110 50" className="w-full h-full text-emerald-400 stroke-current fill-none">
              <path d="M 0 25 L 30 25 L 38 8 L 48 42 L 56 16 L 64 30 L 70 25 L 110 25" strokeWidth="2.2" />
              <circle cx="48" cy="42" r="3" fill="currentColor" fillOpacity="0.3" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md group-hover:scale-105 transition-transform">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-400/15 border border-emerald-400/30">
                HM
              </span>
            </div>

            <div className="mt-2.5">
              <div className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                Health
              </div>
              <div className="text-xs font-semibold text-emerald-400/90 -mt-0.5">
                Management
              </div>
            </div>

            <div className="mt-1 text-[11px] text-slate-400 leading-tight">
              Hydration & Vitals
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-emerald-500/20 space-y-1.5">
            <div className="text-[11px] text-slate-300 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Droplet className="w-3 h-3 text-emerald-400" />
                <span>{waterPercent}% Water</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-300">{healthMetric.steps.toLocaleString()} steps</span>
            </div>

            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, waterPercent)}%` }} />
            </div>
          </div>
        </button>

        {/* 4. DM: Document Management */}
        <button
          onClick={() => setActiveScreen('documents')}
          className="p-4 rounded-3xl bg-gradient-to-br from-purple-500/15 via-slate-900/95 to-slate-950 border border-purple-500/30 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/10 transition-all text-left flex flex-col justify-between group relative overflow-hidden"
        >
          {/* Decorative Security Crest & Document Seal Drawing */}
          <div className="absolute right-1 bottom-0 w-28 h-24 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
            <svg viewBox="0 0 70 70" className="w-full h-full text-purple-400 stroke-current fill-none">
              <path d="M 35 6 L 58 17 L 58 40 Q 58 56, 35 64 Q 12 56, 12 40 L 12 17 Z" strokeWidth="2.2" />
              <path d="M 26 35 L 32 41 L 46 27" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-2xl bg-purple-400/20 border border-purple-400/40 flex items-center justify-center text-purple-400 shadow-md group-hover:scale-105 transition-transform">
                <FolderLock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-mono font-bold text-purple-300 px-2 py-0.5 rounded-full bg-purple-400/15 border border-purple-400/30">
                DM
              </span>
            </div>

            <div className="mt-2.5">
              <div className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                Document
              </div>
              <div className="text-xs font-semibold text-purple-400/90 -mt-0.5">
                Vault
              </div>
            </div>

            <div className="mt-1 text-[11px] text-slate-400 leading-tight">
              Identity & Certs
            </div>
          </div>

          <div className="relative z-10 pt-2 border-t border-purple-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">{documents.length} Verified IDs</span>
              <span className="text-[10px] font-mono text-purple-300 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <span>Encrypted</span>
              </span>
            </div>
            
            <div className="text-[10px] text-purple-300/80 font-mono truncate">
              Aadhaar · PAN · Insurance · DL
            </div>
          </div>
        </button>

      </div>

      {/* 5. ACTION P&T (FULL-WIDTH BOTTOM CARD SPREADING ACROSS SCREEN) */}
      <button
        onClick={() => setActiveScreen('action_pt')}
        className="w-full p-4 rounded-3xl bg-gradient-to-r from-rose-500/15 via-slate-900/95 to-slate-950 border border-rose-500/30 hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/10 transition-all text-left group relative overflow-hidden flex items-center justify-between shadow-md shrink-0"
      >
        {/* Decorative Sprint Roadmap Drawing */}
        <div className="absolute right-12 bottom-0 w-44 h-16 opacity-20 group-hover:opacity-35 transition-opacity pointer-events-none">
          <svg viewBox="0 0 140 45" className="w-full h-full text-rose-400 stroke-current fill-none">
            <path d="M 0 35 C 35 12, 70 42, 105 22 L 140 12" strokeWidth="2.5" strokeDasharray="4 4" />
            <circle cx="105" cy="22" r="3.5" fill="currentColor" />
            <circle cx="140" cy="12" r="3.5" fill="currentColor" />
          </svg>
        </div>

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-rose-400/20 border border-rose-400/40 flex items-center justify-center text-rose-400 shadow-md group-hover:scale-105 transition-transform shrink-0">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                Action P&T
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-400/15 px-2 py-0.5 rounded-full border border-rose-400/30">
                Planning & Tracking
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{pendingTasks} sprint tasks active</span>
              <span>·</span>
              <span className="text-rose-300 font-mono text-[11px]">1 Completed</span>
            </div>
          </div>
        </div>

        <div className="w-8 h-8 rounded-xl bg-slate-900 border border-rose-400/30 flex items-center justify-center text-rose-400 group-hover:bg-rose-400 group-hover:text-slate-950 transition-colors shrink-0 relative z-10 shadow-sm">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* 6. TEST ON MOBILE / SCAN QR CODE CARD */}
      <button
        type="button"
        onClick={() => setIsMobileTestOpen(true)}
        className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 hover:from-amber-500/25 border border-amber-500/35 hover:border-amber-400 transition-all text-left flex items-center justify-between group shadow-md shrink-0 cursor-pointer"
        title="Open QR code and instructions to test MYLIFE on your physical phone"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                Test on Your Mobile First
              </span>
              <span className="text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">
                PWA Ready
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5">
              <span>Scan QR code or open mobile link</span>
              <span className="text-amber-400 font-medium">· Installable</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-400/30 text-amber-400 font-bold text-[11px] group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors shrink-0">
          <QrCode className="w-3.5 h-3.5" />
          <span>Scan QR</span>
        </div>
      </button>

      {/* 7. SETTINGS: THEME & VISUAL PREFERENCES ON HOME SCREEN */}
      <button
        type="button"
        onClick={() => setIsThemeModalOpen(true)}
        className="w-full p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-400/40 transition-all text-left flex items-center justify-between group shadow-sm shrink-0 cursor-pointer"
        title="Open Settings to customize UI Theme & Appearance"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                Settings
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 capitalize font-semibold flex items-center gap-1">
                <Palette className="w-3 h-3 text-amber-400" />
                <span>
                  {uiTheme === 'dark' ? 'OLED Dark' : uiTheme === 'sepia' ? 'Warm Amber' : uiTheme === 'sage' ? 'Nordic Sage' : uiTheme === 'light' ? 'Daylight Soft' : 'High Contrast'}
                </span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Visual themes, eye comfort & accessibility
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>Theme</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

    </div>
  );
};
