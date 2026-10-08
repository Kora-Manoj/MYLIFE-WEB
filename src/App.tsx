import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { PhoneFrame } from './components/phone/PhoneFrame';
import { FlowVisualizer } from './components/FlowVisualizerModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { HomeScreen } from './components/home/HomeScreen';
import { MoneyManagementScreen } from './components/money/MoneyManagementScreen';
import { KnowledgeBaseScreen } from './components/knowledge/KnowledgeBaseScreen';
import { HealthManagementScreen } from './components/health/HealthManagementScreen';
import { DocumentManagementScreen } from './components/documents/DocumentManagementScreen';
import { ActionPTScreen } from './components/action/ActionPTScreen';
import { ThemeSettingsModal } from './components/ThemeSettingsModal';
import { MobileTestModal } from './components/mobile/MobileTestModal';
import { 
  GitFork, 
  Smartphone, 
  Monitor, 
  Wallet, 
  BookOpen, 
  HeartPulse, 
  FolderLock, 
  ListTodo,
  Home as HomeIcon,
  Sparkles
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    activeScreen, 
    setActiveScreen, 
    viewMode, 
    setViewMode,
    bankStatements,
    upiStatements,
    setIsBankReviewOpen,
    setIsUpiReviewOpen,
    uiTheme,
    moneyActiveView,
    isMobileTestOpen,
    setIsMobileTestOpen
  } = useApp();

  const getScreenTitle = () => {
    switch (activeScreen) {
      case 'home': return currentUser?.name || 'Manoj Kumar';
      case 'money': {
        switch (moneyActiveView) {
          case 'statements': return 'Statement Upload & Review';
          case 'ledger': return 'Transactions Ledger';
          case 'analytics': return 'Spend Analytics';
          default: return 'Money Management';
        }
      }
      case 'knowledge': return 'Knowledge Base';
      case 'health': return 'Health Management';
      case 'documents': return 'Document Vault';
      case 'action_pt': return 'Action P&T';
      default: return 'MYLIFE';
    }
  };

  const renderActiveScreen = () => {
    if (!currentUser) {
      return <AuthScreen />;
    }

    switch (activeScreen) {
      case 'home':
        return <HomeScreen />;
      case 'money':
        return <MoneyManagementScreen />;
      case 'knowledge':
        return <KnowledgeBaseScreen />;
      case 'health':
        return <HealthManagementScreen />;
      case 'documents':
        return <DocumentManagementScreen />;
      case 'action_pt':
        return <ActionPTScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const getRootThemeClasses = () => {
    switch (uiTheme) {
      case 'sepia':
        return 'theme-sepia bg-[#181410] text-[#fef3c7] selection:bg-amber-600 selection:text-white';
      case 'sage':
        return 'theme-sage bg-[#091310] text-[#ecfdf5] selection:bg-emerald-600 selection:text-white';
      case 'light':
        return 'theme-light bg-[#f8fafc] text-[#0f172a] selection:bg-amber-400 selection:text-slate-900';
      case 'high_contrast':
        return 'theme-high_contrast bg-black text-white selection:bg-yellow-400 selection:text-black';
      default:
        return 'theme-dark bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${getRootThemeClasses()}`}>
      {/* Top Header: On mobile device when in mobile mode, rendered cleanly; visible on desktop or when diagram/desktop view selected */}
      <div className={viewMode === 'mobile' ? 'hidden md:block w-full' : 'w-full'}>
        <Header />
      </div>

      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-0 md:p-6 w-full max-w-7xl mx-auto">
        
        {/* VIEW 1: INTERACTIVE DRAW.IO FLOW DIAGRAM */}
        {viewMode === 'diagram' && (
          <div className="w-full p-2 sm:p-0">
            <FlowVisualizer onClose={() => setViewMode('mobile')} />
          </div>
        )}

        {/* VIEW 2: MOBILE PHONE EXPERIENCE (Full-screen native feel on mobile, sleek device frame on desktop) */}
        {viewMode === 'mobile' && (
          <div className="w-full flex flex-col items-center">
            <PhoneFrame title={getScreenTitle()} showBack={activeScreen !== 'home'}>
              {renderActiveScreen()}
            </PhoneFrame>
          </div>
        )}

        {/* VIEW 3: DESKTOP RESPONSIVE CANVAS */}
        {viewMode === 'desktop' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-2 sm:p-0">
            
            {/* Desktop Left Navigation Sidebar */}
            <aside className="lg:col-span-3 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1">
                  MYLIFE Modules
                </div>

                <button
                  onClick={() => setActiveScreen('home')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeScreen === 'home'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>Home Page</span>
                </button>

                <button
                  onClick={() => setActiveScreen('money')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeScreen === 'money'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4" />
                    <span>Money Management (MM)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/40">
                    {bankStatements.length + upiStatements.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveScreen('knowledge')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeScreen === 'knowledge'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Knowledge Base (KB)</span>
                </button>

                <button
                  onClick={() => setActiveScreen('health')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeScreen === 'health'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <HeartPulse className="w-4 h-4" />
                  <span>Health Management (HM)</span>
                </button>

                <button
                  onClick={() => setActiveScreen('documents')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeScreen === 'documents'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FolderLock className="w-4 h-4" />
                  <span>Document Vault (DM)</span>
                </button>

                <button
                  onClick={() => setActiveScreen('action_pt')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeScreen === 'action_pt'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Action P&T</span>
                </button>
              </div>

              {/* Draw.io Quick Links Box */}
              <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/20 space-y-2 text-xs">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Draw.io Architecture</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Directly review uploaded Bank & UPI statements before processing.
                </p>
                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setActiveScreen('money');
                      setIsBankReviewOpen(true);
                    }}
                    className="w-full text-left py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800"
                  >
                    ▼ Review Bank Statements ({bankStatements.length})
                  </button>
                  <button
                    onClick={() => {
                      setActiveScreen('money');
                      setIsUpiReviewOpen(true);
                    }}
                    className="w-full text-left py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800"
                  >
                    ▼ Review UPI Statements ({upiStatements.length})
                  </button>
                </div>
              </div>
            </aside>

            {/* Desktop Main Content Canvas */}
            <section className="lg:col-span-9 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">{getScreenTitle()}</h2>
                  <p className="text-xs text-slate-400">Interactive MYLIFE V:1 Workspace</p>
                </div>
                <button
                  onClick={() => setViewMode('diagram')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs text-amber-400 border border-slate-700 transition-colors"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>View Flow Diagram</span>
                </button>
              </div>

              {renderActiveScreen()}
            </section>

          </div>
        )}

        {/* Eye Comfort & Theme Modal for all types of eyes */}
        <ThemeSettingsModal />

        {/* Mobile Test & QR Code Scanner Modal */}
        <MobileTestModal 
          isOpen={isMobileTestOpen} 
          onClose={() => setIsMobileTestOpen(false)} 
        />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
