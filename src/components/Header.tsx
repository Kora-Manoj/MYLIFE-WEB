import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  GitFork, 
  Smartphone, 
  Monitor, 
  LogOut, 
  LogIn, 
  User as UserIcon,
  RotateCcw,
  Eye,
  Sparkles
} from 'lucide-react';
import { PWAInstallButton } from './pwa/PWAInstallButton';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    signOut, 
    setAuthMode, 
    activeScreen, 
    setActiveScreen, 
    viewMode, 
    setViewMode,
    resetAllData,
    setIsThemeModalOpen,
    uiTheme,
    setIsMobileTestOpen
  } = useApp();

  const getThemeDisplayName = () => {
    switch (uiTheme) {
      case 'sepia': return 'Warm Sepia';
      case 'sage': return 'Nordic Sage';
      case 'light': return 'Daylight Soft';
      case 'high_contrast': return 'High Contrast';
      default: return 'OLED Dark';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Single text element Brand Zone adhering to Top Bar Contract */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setActiveScreen('home')}
            className="flex items-center gap-2 text-base font-extrabold tracking-tight text-amber-400 hover:text-amber-300 transition-colors"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-400 text-xs">
              M
            </div>
            <span>MYLIFE</span>
          </button>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">v1.0 Mobile OS</span>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveScreen('home')}
            className={`transition-colors hover:text-slate-200 ${
              activeScreen === 'home' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveScreen('money')}
            className={`transition-colors hover:text-slate-200 ${
              activeScreen === 'money' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Money (MM)
          </button>
          <button
            onClick={() => setActiveScreen('knowledge')}
            className={`transition-colors hover:text-slate-200 ${
              activeScreen === 'knowledge' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Knowledge (KB)
          </button>
          <button
            onClick={() => setActiveScreen('health')}
            className={`transition-colors hover:text-slate-200 ${
              activeScreen === 'health' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Health (HM)
          </button>
          <button
            onClick={() => setActiveScreen('documents')}
            className={`transition-colors hover:text-slate-200 ${
              activeScreen === 'documents' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Docs (DM)
          </button>
          <button
            onClick={() => setActiveScreen('action_pt')}
            className={`transition-colors hover:text-slate-200 ${
              activeScreen === 'action_pt' ? 'text-amber-400 font-semibold' : ''
            }`}
          >
            Action P&T
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Test on Mobile Phone / QR Code Action */}
          <button
            onClick={() => setIsMobileTestOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-sm shadow-amber-400/20 active:scale-95 cursor-pointer"
            title="Scan QR Code to open MYLIFE on your smartphone"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test on Mobile</span>
            <span className="inline sm:hidden">Mobile</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Interactive Flow Diagram button */}
          <button
            onClick={() => setViewMode('diagram')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
              viewMode === 'diagram'
                ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                : 'bg-slate-900 border-slate-700/60 text-slate-300 hover:border-amber-400/30'
            }`}
            title="Inspect Draw.io Architecture Flowchart"
          >
            <GitFork className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Flow Diagram</span>
          </button>

          {/* View switcher: Mobile Phone vs Desktop view */}
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mobile Phone View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Desktop Canvas View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Eye Comfort & Appearance Settings Button */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 font-medium"
            title="Eye Comfort & UI Themes"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Theme: {getThemeDisplayName()}</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={resetAllData}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-md hover:bg-slate-800"
            title="Reset Sample Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile / Auth Action */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono leading-tight">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthMode('signin')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
