import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ArrowDown, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  Wallet,
  BookOpen,
  HeartPulse,
  FolderLock,
  ListTodo,
  UserPlus,
  LogIn,
  LogOut,
  Info,
  Upload,
  Building2,
  QrCode,
  CreditCard,
  PieChart,
  Sparkles,
  Eye,
  ShieldCheck,
  Droplet,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileCheck,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Download,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface FlowVisualizerProps {
  onClose?: () => void;
}

export const FlowVisualizer: React.FC<FlowVisualizerProps> = ({ onClose }) => {
  const { 
    activeScreen, 
    setActiveScreen, 
    bankStatements, 
    upiStatements, 
    creditCardStatements,
    transactions,
    notes,
    healthMetric,
    documents,
    tasks,
    setIsBankReviewOpen, 
    setIsUpiReviewOpen, 
    setIsCreditCardReviewOpen,
    currentUser, 
    setAuthMode,
    setViewMode,
    moneyActiveView,
    setMoneyActiveView,
    processAllStatements,
    isProcessing,
    statementsProcessed,
    normalizedDataset,
    downloadNormalizedCsv,
    uiTheme,
    setIsThemeModalOpen
  } = useApp();

  const [isDiagramMenuOpen, setIsDiagramMenuOpen] = useState(false);

  const getMoneySubModuleName = (view: 'hub' | 'statements' | 'ledger' | 'analytics') => {
    switch (view) {
      case 'statements':
        return 'Statement Upload & Review';
      case 'ledger':
        return 'Transactions Ledger';
      case 'analytics':
        return 'Spend Analytics';
      default:
        return 'Money Management';
    }
  };

  const handleNavigate = (screen: any) => {
    setActiveScreen(screen);
    setViewMode('mobile');
    if (onClose) onClose();
  };

  const handleOpenMoneySubModule = (subView: 'hub' | 'statements' | 'ledger' | 'analytics') => {
    setMoneyActiveView(subView);
    handleNavigate('money');
  };

  // Calculations for live metrics
  const totalStatementsCount = bankStatements.length + upiStatements.length;
  const totalBankCredits = bankStatements.reduce((sum, s) => sum + s.totalCredit, 0);
  const totalBankDebits = bankStatements.reduce((sum, s) => sum + s.totalDebit, 0);
  const totalUpiSpent = upiStatements.reduce((sum, s) => sum + s.totalSpent, 0);
  const waterPercent = Math.round((healthMetric.waterMl / healthMetric.waterGoalMl) * 100);

  return (
    <div className="w-full bg-slate-950 text-slate-100 p-4 md:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-x-auto select-none">
      
      {/* 1. HEADER BAR WITH REAL-TIME ARCHITECTURE STATUS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 mb-6 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              MYLIFE Architecture Flow Diagram
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Current Project Status: Live Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Live interactive system architecture flowchart mapped to your current application state. Click any node or trigger to drill directly into sub-modules, review drawers, or execute statement processing.
          </p>
          
          {/* Real-time Project Status Indicators */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Dynamic Sub-Module Top-Bar
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Primary Card Icon Triggers
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Single "Process the statement" Action
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Reconciliation Free-Space Hub
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Bank & UPI Drawers (▼)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live theme badge */}
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-xs font-medium text-amber-300 transition-colors cursor-pointer"
            title="Open Eye Comfort & Theme Settings"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="capitalize">{uiTheme} Mode</span>
          </button>

          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close Diagram"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Diagram Canvas */}
      <div className="min-w-[1040px] flex flex-col items-center gap-9 py-2">
        
        {/* ROW 1: AUTHENTICATION NODES */}
        <div className="flex items-center justify-center gap-5">
          {/* Sign Up */}
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              handleNavigate('home');
            }}
            className="w-44 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-amber-400/80 hover:bg-slate-850 transition-all text-center group shadow-md cursor-pointer"
          >
            <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:text-amber-400 transition-colors">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-200">Sign Up</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Registration Screen</div>
          </button>

          {/* Sign In (Active Session) */}
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              handleNavigate('home');
            }}
            className="w-48 p-3.5 rounded-2xl border border-amber-400/60 bg-slate-900 shadow-lg shadow-amber-500/5 text-center group cursor-pointer"
          >
            <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <LogIn className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-amber-300">
              {currentUser ? `Active: ${currentUser.name}` : 'Sign In'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Credential Auth Session</div>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => {
              setAuthMode('signed_out');
              handleNavigate('home');
            }}
            className="w-44 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-red-400/60 hover:bg-slate-850 transition-all text-center group shadow-md cursor-pointer"
          >
            <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-slate-200">Sign Out</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Session Terminate</div>
          </button>
        </div>

        {/* Arrow to Home */}
        <div className="flex flex-col items-center text-amber-400/80 -my-2">
          <div className="w-0.5 h-6 bg-amber-400/40" />
          <ArrowDown className="w-4 h-4 text-amber-400" />
        </div>

        {/* ROW 2: HOME DASHBOARD NODE (2x2 Grid + Bottom Action P&T) */}
        <div 
          onClick={() => handleNavigate('home')}
          className={`w-80 p-5 rounded-3xl border cursor-pointer transition-all shadow-xl text-center group ${
            activeScreen === 'home' 
              ? 'border-amber-400 bg-slate-900 shadow-amber-400/10 ring-1 ring-amber-400' 
              : 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Home Dashboard
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
              Core Hub
            </span>
          </div>

          {/* Internal 2x2 Grid + Full width Bottom card matching current UI */}
          <div className="grid grid-cols-2 gap-2 mb-2.5 text-left">
            <div className="p-2.5 rounded-xl bg-slate-800/90 border border-amber-500/30 text-xs">
              <div className="font-bold text-amber-300">MM</div>
              <div className="text-[10px] text-slate-300">Money Mgmt</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{totalStatementsCount} Files</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/90 border border-sky-500/30 text-xs">
              <div className="font-bold text-sky-300">KB</div>
              <div className="text-[10px] text-slate-300">Knowledge Base</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{notes.length} Notes</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/90 border border-emerald-500/30 text-xs">
              <div className="font-bold text-emerald-300">HM</div>
              <div className="text-[10px] text-slate-300">Health Mgmt</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{waterPercent}% Water</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/90 border border-purple-500/30 text-xs">
              <div className="font-bold text-purple-300">DM</div>
              <div className="text-[10px] text-slate-300">Document Vault</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{documents.length} IDs</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center justify-between">
            <span>Action P&T (Planning & Tracking)</span>
            <span className="text-[10px] font-mono text-rose-400">{tasks.length} tasks</span>
          </div>
        </div>

        {/* Tree branching connector to the 5 core modules */}
        <div className="w-full max-w-5xl flex flex-col items-center -my-2">
          <div className="w-0.5 h-6 bg-slate-700" />
          <div className="w-[88%] h-0.5 bg-slate-700 relative">
            <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-slate-600" />
            <div className="absolute -top-1 left-[25%] w-2 h-2 rounded-full bg-slate-600" />
            <div className="absolute -top-1 left-[50%] w-2 h-2 rounded-full bg-slate-600" />
            <div className="absolute -top-1 left-[75%] w-2 h-2 rounded-full bg-slate-600" />
            <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-slate-600" />
          </div>
        </div>

        {/* ROW 3: 5 MODULE NODES + EXPANDED REAL-TIME MM SUB-MODULE LIFECYCLE */}
        <div className="w-full flex items-start justify-center gap-6">
          
          {/* LEFT SIDE REVIEW LISTS (BANK & UPI) CONNECTED TO STATEMENT REVIEW */}
          <div className="flex flex-col gap-3.5 w-60 shrink-0">
            {/* List of uploaded BANK statements node */}
            <div className="p-3.5 rounded-2xl border border-amber-400/60 bg-slate-900 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bank Statements List (▼)</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/15 px-1.5 py-0.2 rounded">
                  {bankStatements.length} PDFs
                </span>
              </div>
              <div className="space-y-1.5">
                {bankStatements.map((stmt, idx) => (
                  <div 
                    key={stmt.id} 
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-200"
                  >
                    <span>{idx + 1}. {stmt.bankName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{stmt.accountNumberMasked}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleOpenMoneySubModule('statements');
                  setIsBankReviewOpen(true);
                }}
                className="mt-2.5 w-full py-1.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 rounded-lg transition-colors text-center cursor-pointer"
              >
                Open Bank Review Drawer →
              </button>
            </div>

            {/* List of uploaded UPI statements node */}
            <div className="p-3.5 rounded-2xl border border-amber-400/60 bg-slate-900 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>UPI Statements List (▼)</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/15 px-1.5 py-0.2 rounded">
                  {upiStatements.length} CSVs
                </span>
              </div>
              <div className="space-y-1.5">
                {upiStatements.map((stmt, idx) => (
                  <div 
                    key={stmt.id} 
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-200"
                  >
                    <span>{idx + 1}. {stmt.upiApp}</span>
                    <span className="text-[10px] font-mono text-slate-400">{stmt.upiId}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleOpenMoneySubModule('statements');
                  setIsUpiReviewOpen(true);
                }}
                className="mt-2.5 w-full py-1.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 rounded-lg transition-colors text-center cursor-pointer"
              >
                Open UPI Review Drawer →
              </button>
            </div>

            {/* List of uploaded Credit Card statements node */}
            <div className="p-3.5 rounded-2xl border border-purple-400/60 bg-slate-900 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Credit Card Statements List (▼)</span>
                </span>
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-400/15 px-1.5 py-0.2 rounded">
                  {creditCardStatements.length} Cards
                </span>
              </div>
              <div className="space-y-1.5">
                {creditCardStatements.map((stmt, idx) => (
                  <div 
                    key={stmt.id} 
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-[11px] font-medium text-slate-200"
                  >
                    <span>{idx + 1}. {stmt.cardName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{stmt.cardNumberMasked}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleOpenMoneySubModule('statements');
                  setIsCreditCardReviewOpen(true);
                }}
                className="mt-2.5 w-full py-1.5 text-[10px] font-bold bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 rounded-lg transition-colors text-center cursor-pointer"
              >
                Open Cards Review Drawer →
              </button>
            </div>

            {/* Live Architecture Specification Box */}
            <div className="p-3.5 rounded-2xl border border-dashed border-amber-400/40 bg-amber-400/5 text-[10px] text-amber-200/90 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">Current Status & Architecture Specifications:</span>
              </div>
              <div className="space-y-1.5">
                <p>
                  <strong className="text-amber-300">1. Dynamic Top-Bar Sub-Module Routing:</strong> The phone app bar dynamically displays the active sub-module title (<span className="text-amber-300 font-semibold">Statement Upload & Review</span>, <span className="text-sky-300 font-semibold">Transactions Ledger</span>, <span className="text-emerald-300 font-semibold">Spend Analytics</span>) with an interactive dropdown switcher and contextual hierarchy back button.
                </p>
                <p>
                  <strong className="text-amber-300">2. Consolidated Primary Icon Triggers:</strong> All 3 modules trigger drill-downs directly from their top card icons (<span className="font-mono text-amber-300 font-bold">[ ↑ ]</span> Upload, <span className="font-mono text-sky-300 font-bold">[ 💳 ]</span> CreditCard, <span className="font-mono text-emerald-300 font-bold">[ 📊 ]</span> PieChart).
                </p>
                <p>
                  <strong className="text-amber-300">3. Single-Button Processing Action:</strong> Consolidated into a single high-visibility button <span className="text-amber-300 font-semibold">"Process the statement"</span> with live feedback state.
                </p>
                <p>
                  <strong className="text-amber-300">4. Free Space Optimization:</strong> Repurposed unused statement canvas into a live 3-metric financial summary card (<span className="text-emerald-300">Inflow</span>, <span className="text-slate-200">Outflow</span>, <span className="text-amber-300">Net Surplus</span>) and reconciliation status indicator.
                </p>
                <p>
                  <strong className="text-amber-300">5. Multi-Entity Review Drawers:</strong> Dedicated modal drawers for Bank Statements (▼), UPI Statements (▼), and Credit Card Statements (▼).
                </p>
                <p>
                  <strong className="text-amber-300">6. Statement Processing:</strong>
                  <br />• Multi-entity statement processing across Banks, UPI apps, and Credit Cards with automatic reconciliation into Unified Transactions.
                </p>
              </div>
            </div>
          </div>

          {/* Connection arrow from Statement Upload & Review to Review drawers */}
          <div className="flex flex-col items-center justify-center pt-28">
            <div className="flex items-center gap-1 text-amber-400">
              <span className="text-[10px] font-mono text-amber-400/90 font-bold">Press ▼</span>
              <div className="w-6 h-0.5 bg-amber-400/60" />
            </div>
          </div>

          {/* 1. MONEY MANAGEMENT (MM) SUITE NODE WITH 3 SUB-MODULE PIPELINE */}
          <div 
            className={`w-84 p-4 rounded-3xl border transition-all shadow-xl space-y-3.5 ${
              activeScreen === 'money'
                ? 'border-amber-400 bg-slate-900 shadow-amber-400/10 ring-1 ring-amber-400'
                : 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400 hover:bg-slate-850'
            }`}
          >
            {/* Suite Header with Direct Link */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button 
                type="button"
                onClick={() => handleOpenMoneySubModule('hub')}
                className="text-left flex items-center gap-1.5 group cursor-pointer"
                title="Open Money Management Hub"
              >
                <Wallet className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  Money Management (MM)
                </span>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
              </button>
              <span className="text-[10px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/30">
                SUR · TL · SA
              </span>
            </div>

            {/* LIVE DYNAMIC TOP-BAR & SUB-MODULE SWITCHER (NEW APP FEATURE) */}
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-amber-400/30 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                  Phone Top-Bar Dynamic Route:
                </span>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  Active in App
                </span>
              </div>

              {/* Dynamic App Bar Visual Mock */}
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-mono text-slate-400">
                    {moneyActiveView !== 'hub' ? 'MM Hub' : 'Home'}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="font-bold text-amber-300 text-[11px] truncate max-w-[140px]">
                    {getMoneySubModuleName(moneyActiveView)}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              </div>

              {/* Direct Sub-Module Switcher Chips inside Diagram */}
              <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setMoneyActiveView('hub')}
                  className={`py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer text-center ${
                    moneyActiveView === 'hub'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Overview Hub"
                >
                  Hub
                </button>
                <button
                  type="button"
                  onClick={() => setMoneyActiveView('statements')}
                  className={`py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer text-center ${
                    moneyActiveView === 'statements'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Statement Upload & Review"
                >
                  SUR
                </button>
                <button
                  type="button"
                  onClick={() => setMoneyActiveView('ledger')}
                  className={`py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer text-center ${
                    moneyActiveView === 'ledger'
                      ? 'bg-sky-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Transactions Ledger"
                >
                  TL
                </button>
                <button
                  type="button"
                  onClick={() => setMoneyActiveView('analytics')}
                  className={`py-1 text-[10px] font-mono rounded-lg transition-colors cursor-pointer text-center ${
                    moneyActiveView === 'analytics'
                      ? 'bg-emerald-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Spend Analytics"
                >
                  SA
                </button>
              </div>
            </div>

            {/* SUB-MODULE 1: Statement Upload & Review (SUR) */}
            <div className="p-3 rounded-2xl bg-slate-800/90 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenMoneySubModule('statements')}
                    className="w-6 h-6 rounded-lg bg-amber-400/20 hover:bg-amber-400/40 border border-amber-400/40 flex items-center justify-center text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
                    title="Click [↑] Upload Icon Trigger"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-100">
                    1. Statement Upload & Review
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-400/15 px-1.5 py-0.2 rounded border border-amber-400/30">
                  SUR
                </span>
              </div>

              {/* [↑] Primary Upload Icon Action */}
              <button
                type="button"
                onClick={() => handleOpenMoneySubModule('statements')}
                className="w-full py-1.5 px-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-[11px] font-semibold flex items-center justify-between transition-all shadow-sm group cursor-pointer"
                title="Click [↑] Upload Icon to Open Statement Upload Center"
              >
                <div className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Primary [ ↑ ] Icon Trigger</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 underline">Open Screen →</span>
              </button>

              {/* Multi-Entity Review List Dropdowns */}
              <div className="grid grid-cols-3 gap-1 pt-0.5">
                <button 
                  type="button"
                  onClick={() => {
                    handleOpenMoneySubModule('statements');
                    setIsBankReviewOpen(true);
                  }}
                  className="py-1 px-1 rounded-lg bg-slate-900 hover:bg-slate-750 text-[9px] text-slate-200 border border-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                  title="Review Bank Statements Drawer"
                >
                  <span className="truncate">Bank List</span>
                  <span className="text-amber-400 font-bold text-[8px]">▼</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    handleOpenMoneySubModule('statements');
                    setIsUpiReviewOpen(true);
                  }}
                  className="py-1 px-1 rounded-lg bg-slate-900 hover:bg-slate-750 text-[9px] text-slate-200 border border-slate-700 flex items-center justify-between cursor-pointer transition-colors"
                  title="Review UPI Statements Drawer"
                >
                  <span className="truncate">UPI List</span>
                  <span className="text-amber-400 font-bold text-[8px]">▼</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    handleOpenMoneySubModule('statements');
                    setIsCreditCardReviewOpen(true);
                  }}
                  className="py-1 px-1 rounded-lg bg-slate-900 hover:bg-slate-750 text-[9px] text-purple-300 border border-purple-500/40 flex items-center justify-between cursor-pointer transition-colors"
                  title="Review Credit Card Statements Drawer"
                >
                  <span className="truncate">Card List</span>
                  <span className="text-purple-400 font-bold text-[8px]">▼</span>
                </button>
              </div>

              {/* FREE SPACE OPTIMIZATION: 3-METRIC SUMMARY CARD */}
              <div className="p-2 rounded-xl bg-slate-950/70 border border-amber-500/20 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Free Space Reconcile Hub:
                  </span>
                  <span className="text-slate-300">
                    {totalStatementsCount} Ready
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center font-mono">
                  <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[8px] text-slate-400">Inflow</div>
                    <div className="text-[10px] font-bold text-emerald-400">
                      +₹{(totalBankCredits/1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[8px] text-slate-400">Outflow</div>
                    <div className="text-[10px] font-bold text-slate-200">
                      -₹{((totalBankDebits + totalUpiSpent)/1000).toFixed(0)}k
                    </div>
                  </div>
                  <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-[8px] text-slate-400">Surplus</div>
                    <div className="text-[10px] font-bold text-amber-300">
                      ₹{((totalBankCredits - (totalBankDebits + totalUpiSpent))/1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
              </div>

              {/* Single Button: Process the statement */}
              <button
                type="button"
                onClick={() => {
                  handleOpenMoneySubModule('statements');
                  processAllStatements();
                }}
                disabled={isProcessing}
                className="w-full py-2 px-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer disabled:opacity-50"
                title="Single Button: Process the statement"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>
                  {isProcessing 
                    ? 'Processing the statement...' 
                    : statementsProcessed 
                      ? 'Process the statement again' 
                      : 'Process the statement'}
                </span>
              </button>
            </div>

            {/* PIPELINE CONNECTOR ARROW */}
            <div className="flex items-center justify-center gap-2 py-0.5 text-amber-400/80">
              <span className="text-[9px] font-mono italic">Reconciles parsed statements into Ledger</span>
              <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
            </div>

            {/* SUB-MODULE 2: Transactions Ledger (TL) */}
            <div
              className="w-full p-3 rounded-2xl bg-slate-800/90 border border-sky-500/30 text-left transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenMoneySubModule('ledger')}
                    className="w-6 h-6 rounded-lg bg-sky-400/20 hover:bg-sky-400/40 border border-sky-400/40 flex items-center justify-center text-sky-400 hover:text-sky-300 transition-all cursor-pointer"
                    title="Click [ 💳 ] CreditCard Icon Trigger"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-sky-300">
                    2. Transactions Ledger
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-sky-300 bg-sky-400/15 px-1.5 py-0.2 rounded border border-sky-400/30">
                  TL
                </span>
              </div>

              {/* [💳] Primary Icon Action */}
              <button
                type="button"
                onClick={() => handleOpenMoneySubModule('ledger')}
                className="w-full py-1.5 px-2 rounded-xl bg-sky-400/20 hover:bg-sky-400/30 border border-sky-400/40 text-sky-300 text-[11px] font-semibold flex items-center justify-between transition-all shadow-sm group cursor-pointer"
                title="Click CreditCard Icon to Open Transactions Ledger"
              >
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Primary [ 💳 ] Icon Trigger</span>
                </div>
                <span className="text-[10px] font-mono text-sky-400 underline">Open Screen →</span>
              </button>

              <div className="text-[10px] text-slate-300 flex items-center justify-between font-mono pt-1 border-t border-slate-700/60">
                <span>{transactions.length} Reconciled records</span>
                <span className="text-[9px] text-sky-300 bg-sky-400/10 px-1.5 py-0.5 rounded">All · Bank · UPI</span>
              </div>

              {transactions[0] && (
                <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono truncate">
                  Latest: <span className="text-slate-200">{transactions[0].description}</span>
                </div>
              )}
            </div>

            {/* PIPELINE CONNECTOR ARROW */}
            <div className="flex items-center justify-center gap-2 py-0.5 text-emerald-400/80">
              <span className="text-[9px] font-mono italic">Aggregates Ledger into Spend Analytics</span>
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            {/* SUB-MODULE 3: Spend Analytics (SA) */}
            <div
              className="w-full p-3 rounded-2xl bg-slate-800/90 border border-emerald-500/30 text-left transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenMoneySubModule('analytics')}
                    className="w-6 h-6 rounded-lg bg-emerald-400/20 hover:bg-emerald-400/40 border border-emerald-400/40 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                    title="Click [ 📊 ] PieChart Icon Trigger"
                  >
                    <PieChart className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-emerald-300">
                    3. Spend Analytics
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-400/15 px-1.5 py-0.2 rounded border border-emerald-400/30">
                  SA
                </span>
              </div>

              {/* [📊] Primary Icon Action */}
              <button
                type="button"
                onClick={() => handleOpenMoneySubModule('analytics')}
                className="w-full py-1.5 px-2 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold flex items-center justify-between transition-all shadow-sm group cursor-pointer"
                title="Click PieChart Icon to Open Spend Analytics"
              >
                <div className="flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Primary [ 📊 ] Icon Trigger</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 underline">Open Screen →</span>
              </button>

              <div className="text-[10px] text-slate-300 flex items-center justify-between font-mono pt-1 border-t border-slate-700/60">
                <span>Net Surplus:</span>
                <span className="text-emerald-400 font-bold">
                  ₹{(totalBankCredits - (totalBankDebits + totalUpiSpent)).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-400">
                <div className="p-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                  +₹{(totalBankCredits/1000).toFixed(0)}k Inflow
                </div>
                <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  -₹{((totalBankDebits + totalUpiSpent)/1000).toFixed(0)}k Outflow
                </div>
              </div>
            </div>

          </div>

          {/* 2. KNOWLEDGE BASE (KB) NODE */}
          <div 
            onClick={() => handleNavigate('knowledge')}
            className={`w-48 p-4 rounded-3xl border cursor-pointer transition-all shadow-xl group space-y-2 ${
              activeScreen === 'knowledge'
                ? 'border-sky-400 bg-slate-900 shadow-sky-400/10 ring-1 ring-sky-400'
                : 'border-slate-800 bg-slate-900/90 hover:border-sky-400/60 hover:bg-slate-850'
            }`}
          >
            <div className="w-9 h-9 rounded-2xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                Knowledge Base
              </div>
              <div className="text-[10px] text-sky-400 font-medium">Ideas, Notes & Wiki</div>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              {notes.length} Curated notes with search, categories (Finance, Tech) & pinned tags.
            </div>
            <div className="pt-2 border-t border-slate-800 text-[9px] font-mono text-sky-300 flex items-center gap-1">
              <span>Status:</span>
              <span className="font-bold">2 Pinned Notes Active</span>
            </div>
          </div>

          {/* 3. HEALTH MANAGEMENT (HM) NODE */}
          <div 
            onClick={() => handleNavigate('health')}
            className={`w-48 p-4 rounded-3xl border cursor-pointer transition-all shadow-xl group space-y-2 ${
              activeScreen === 'health'
                ? 'border-emerald-400 bg-slate-900 shadow-emerald-400/10 ring-1 ring-emerald-400'
                : 'border-slate-800 bg-slate-900/90 hover:border-emerald-400/60 hover:bg-slate-850'
            }`}
          >
            <div className="w-9 h-9 rounded-2xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                Health Management
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">Hydration & Vitals</div>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Water tracker ({healthMetric.waterMl}ml), step counter ({healthMetric.steps.toLocaleString()}), and vitals logs.
            </div>
            <div className="pt-2 border-t border-slate-800 text-[9px] font-mono text-emerald-300 flex items-center gap-1">
              <Droplet className="w-3 h-3 text-emerald-400" />
              <span>Hydration:</span>
              <span className="font-bold">{waterPercent}% Goal Reached</span>
            </div>
          </div>

          {/* 4. DOCUMENT VAULT (DM) NODE */}
          <div 
            onClick={() => handleNavigate('documents')}
            className={`w-48 p-4 rounded-3xl border cursor-pointer transition-all shadow-xl group space-y-2 ${
              activeScreen === 'documents'
                ? 'border-purple-400 bg-slate-900 shadow-purple-400/10 ring-1 ring-purple-400'
                : 'border-slate-800 bg-slate-900/90 hover:border-purple-400/60 hover:bg-slate-850'
            }`}
          >
            <div className="w-9 h-9 rounded-2xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <FolderLock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                Document Vault
              </div>
              <div className="text-[10px] text-purple-400 font-medium">Identity & Policies</div>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              {documents.length} Verified IDs: Aadhaar, PAN, DL, and Health Insurance policy with encryption.
            </div>
            <div className="pt-2 border-t border-slate-800 text-[9px] font-mono text-purple-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Security:</span>
              <span className="font-bold">256-bit Encrypted</span>
            </div>
          </div>

          {/* 5. ACTION P&T NODE */}
          <div 
            onClick={() => handleNavigate('action_pt')}
            className={`w-48 p-4 rounded-3xl border cursor-pointer transition-all shadow-xl group space-y-2 ${
              activeScreen === 'action_pt'
                ? 'border-rose-400 bg-slate-900 shadow-rose-400/10 ring-1 ring-rose-400'
                : 'border-slate-800 bg-slate-900/90 hover:border-rose-400/60 hover:bg-slate-850'
            }`}
          >
            <div className="w-9 h-9 rounded-2xl bg-rose-400/15 border border-rose-400/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                Action P&T
              </div>
              <div className="text-[10px] text-rose-400 font-medium">Planning & Tracking</div>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              High-priority sprint checklists, status toggles, and milestone tracking roadmap.
            </div>
            <div className="pt-2 border-t border-slate-800 text-[9px] font-mono text-rose-300 flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-rose-400" />
              <span>Sprint:</span>
              <span className="font-bold">{tasks.filter(t => t.status === 'in_progress').length} In Progress</span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. FOOTER STATUS BAR WITH ACCESSIBILITY MODE & RETURN ACTION */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-semibold text-slate-200">Current System Architecture Verified:</span>
          </div>
          <span>
            {statementsProcessed ? 'Statements Reconciled' : 'Ready for Processing'} · {transactions.length} Ledger Records · 5 Eye Comfort Themes Available
          </span>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setViewMode('mobile');
            if (onClose) onClose();
          }}
          className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Return to Mobile Simulator</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
