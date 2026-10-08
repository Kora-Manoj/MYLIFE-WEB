import React, { useState, useEffect } from 'react';
import { PendingStatementReview } from '../../types';
import { formatToDisplayDate } from '../../utils/statementProcessor';
import { 
  X, 
  Building2, 
  QrCode, 
  CreditCard, 
  FileText, 
  Check, 
  Sparkles, 
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Upload,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface StatementReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItems: PendingStatementReview[];
  onConfirm: (confirmedItems: PendingStatementReview[], processImmediately: boolean) => void;
  onUploadAnother?: () => void;
}

export const StatementReviewModal: React.FC<StatementReviewModalProps> = ({
  isOpen,
  onClose,
  pendingItems,
  onConfirm,
  onUploadAnother
}) => {
  const [items, setItems] = useState<PendingStatementReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (pendingItems && pendingItems.length > 0) {
      setItems([...pendingItems]);
      // Default to first valid item so user immediately sees real data instead of getting blocked by an error file
      const firstValidIdx = pendingItems.findIndex(i => i.isValidStatement);
      setCurrentIndex(firstValidIdx !== -1 ? firstValidIdx : 0);
    }
  }, [pendingItems]);

  if (!isOpen || items.length === 0) return null;

  const validItems = items.filter(i => i.isValidStatement);
  const invalidItems = items.filter(i => !i.isValidStatement);
  const hasMixedFiles = invalidItems.length > 0 && validItems.length > 0;
  const currentItem = items[currentIndex] || items[0];

  const excludeItem = (indexToExclude: number, processRemainingImmediately = false) => {
    const newItems = items.filter((_, idx) => idx !== indexToExclude);
    if (newItems.length === 0) {
      onClose();
      return;
    }
    const remainingValid = newItems.filter(i => i.isValidStatement);
    if (processRemainingImmediately && remainingValid.length > 0) {
      onConfirm(remainingValid, true);
      onClose();
      return;
    }
    setItems(newItems);
    // Switch to first valid item or clamp index
    const firstValid = newItems.findIndex(i => i.isValidStatement);
    if (firstValid !== -1) {
      setCurrentIndex(firstValid);
    } else {
      setCurrentIndex(Math.min(currentIndex, newItems.length - 1));
    }
  };

  const excludeAllInvalidAndProceed = (processImmediately = true) => {
    const validOnly = items.filter(i => i.isValidStatement);
    if (validOnly.length > 0) {
      if (processImmediately) {
        onConfirm(validOnly, true);
        onClose();
      } else {
        setItems(validOnly);
        setCurrentIndex(0);
      }
    } else {
      onClose();
    }
  };

  const handleCategoryChange = (newCategory: 'bank' | 'upi' | 'credit_card') => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== currentIndex) return item;

      let newEntityName = item.entityName;
      let newMask = item.accountOrIdMasked;

      // Smart default adjustments when category changes
      if (newCategory === 'bank') {
        if (!newEntityName.includes('Bank')) {
          newEntityName = `${item.entityName} Bank`;
        }
        if (!newMask.startsWith('••••')) {
          newMask = `•••• ${Math.floor(1000 + Math.random() * 9000)}`;
        }
      } else if (newCategory === 'upi') {
        if (newEntityName.includes('Bank')) {
          newEntityName = newEntityName.replace(/Bank.*/, 'UPI');
        } else if (!newEntityName.includes('UPI') && !newEntityName.includes('Pay')) {
          newEntityName = `${item.entityName} UPI`;
        }
        if (!newMask.includes('@')) {
          newMask = `user@${newEntityName.toLowerCase().replace(/[^a-z]/g, '') || 'okhdfcbank'}`;
        }
      } else {
        if (!newEntityName.includes('Card')) {
          newEntityName = `${item.entityName.replace(/Bank.*/, '')} Credit Card`;
        }
        if (!newMask.startsWith('••••')) {
          newMask = `•••• ${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }

      return {
        ...item,
        category: newCategory,
        entityName: newEntityName,
        accountOrIdMasked: newMask
      };
    }));
  };

  const handleEntityNameChange = (val: string) => {
    setItems(prev => prev.map((item, idx) => 
      idx === currentIndex ? { ...item, entityName: val } : item
    ));
  };

  const handleMaskChange = (val: string) => {
    setItems(prev => prev.map((item, idx) => 
      idx === currentIndex ? { ...item, accountOrIdMasked: val } : item
    ));
  };

  const handleConfirmSingleOrAll = (processImmediately: boolean) => {
    // Filter strictly to valid statements only
    const validOnly = items.filter(item => item.isValidStatement);
    if (validOnly.length > 0) {
      onConfirm(validOnly, processImmediately);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              !currentItem.isValidStatement 
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400' 
                : 'bg-amber-400/15 border border-amber-400/40 text-amber-400'
            }`}>
              {!currentItem.isValidStatement ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>
                  {!currentItem.isValidStatement 
                    ? 'Unrecognized Statement File' 
                    : 'Review Statement Classification'}
                </span>
                {items.length > 1 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {currentIndex + 1} of {items.length}
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">
                {!currentItem.isValidStatement
                  ? 'This file does not appear to be a valid financial statement.'
                  : 'Classified by backend. Review detected statement details before processing.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Cancel & Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Approval Banner to Exclude Problematic File & Proceed with Remaining */}
        {hasMixedFiles && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-300 block">
                  Issue detected in {invalidItems.length} of {items.length} statement files ({invalidItems[0].fileName})
                </span>
                <span className="text-[11px] text-slate-300">
                  Exclude problematic file and proceed with the remaining {validItems.length} valid statement{validItems.length !== 1 ? 's' : ''}?
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => excludeAllInvalidAndProceed(false)}
                className="w-full sm:w-auto px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer border border-slate-700"
                title="Exclude invalid file and review remaining"
              >
                <span>Review ({validItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => excludeAllInvalidAndProceed(true)}
                className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                title="Exclude invalid file and process remaining into ledger immediately"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Exclude & Process ({validItems.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Multi-item carousel tabs if more than 1 file uploaded */}
        {items.length > 1 && (
          <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    idx === currentIndex 
                      ? item.isValidStatement
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                        : 'bg-rose-500 text-white font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="max-w-[100px] truncate">{item.fileName}</span>
                  {!item.isValidStatement && (
                    <span className="text-[9px] px-1 py-0.2 bg-rose-950/60 rounded text-rose-300 font-mono">Issue</span>
                  )}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        excludeItem(idx);
                      }}
                      className="p-0.5 hover:bg-black/30 rounded text-slate-400 hover:text-rose-300 transition-colors ml-0.5"
                      title={`Exclude "${item.fileName}" from this batch`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white cursor-pointer"
                title="Previous statement"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentIndex === items.length - 1}
                onClick={() => setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white cursor-pointer"
                title="Next statement"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {/* File Meta Pill */}
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
            !currentItem.isValidStatement
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div className="flex items-center gap-2 truncate">
              <FileText className={`w-4 h-4 shrink-0 ${!currentItem.isValidStatement ? 'text-rose-400' : 'text-amber-400'}`} />
              <div className="truncate">
                <span className="font-semibold text-slate-200 block truncate">{currentItem.fileName}</span>
                <span className="text-[10px] text-slate-500 font-mono">{currentItem.fileSize} · {currentItem.uploadDate}</span>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
              !currentItem.isValidStatement
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            }`}>
              {!currentItem.isValidStatement ? '✗ Not a Statement' : '✓ Auto-Classified'}
            </span>
          </div>

          {/* CASE A: UNRECOGNIZED / UNRELATED FILE WARNING */}
          {!currentItem.isValidStatement ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-300">
                      File Rejected: Financial Data Not Found
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {currentItem.validationError || 'This file does not appear to contain banking or transaction records.'}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-rose-300/80 pt-1 border-t border-rose-500/20">
                  ⚠️ <strong>No made-up numbers:</strong> Our system will not fabricate transactions or fake balances for unrelated files to ensure your real ledger remains 100% accurate.
                </div>
              </div>

              {/* Exclude and Proceed option with user approval */}
              {validItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Proceed with {validItems.length} Valid Statement{validItems.length !== 1 ? 's' : ''}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">
                      {validItems.length} of {items.length} Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Exclude "{currentItem.fileName}" and continue processing your remaining valid statements into the unified ledger without terminating.
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => excludeItem(currentIndex)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Exclude This File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmSingleOrAll(true)}
                      className="flex-1 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Process {validItems.length} Valid Files</span>
                    </button>
                  </div>
                </div>
              )}

              {/* What the system expects */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
                  Accepted Statement Types:
                </span>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Bank Statements / Passbooks</strong> (SBI, HDFC, ICICI, Axis, Kotak, etc.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span><strong>UPI Exports</strong> (PhonePe, Google Pay, Paytm, CRED)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span><strong>Credit Card Statements</strong> (HDFC, SBI Card, ICICI, etc.)</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                  Supported formats: <strong>CSV, PDF, XLSX, TXT</strong>. Ensure your CSV/TXT file includes Date, Description, and Debit/Credit columns.
                </div>
              </div>

            </div>
          ) : (
            /* CASE B: VALID STATEMENT REVIEW WITH REAL ACCURATE VALUES */
            <>
              {/* 1. CLASSIFICATION SELECTION */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <span>Classified Category</span>
                    <span className="text-[9px] font-normal text-amber-400/90">(Tap to reclassify if needed)</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Bank Statement */}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('bank')}
                    className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      currentItem.category === 'bank'
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        currentItem.category === 'bank' ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-900 text-slate-400'
                      }`}>
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      {currentItem.category === 'bank' && (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-100">Bank Statement</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">SBI, HDFC, ICICI</span>
                    </div>
                  </button>

                  {/* UPI Statement */}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('upi')}
                    className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      currentItem.category === 'upi'
                        ? 'bg-sky-400/15 border-sky-400 text-sky-300 shadow-md ring-1 ring-sky-400/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        currentItem.category === 'upi' ? 'bg-sky-400/20 text-sky-300' : 'bg-slate-900 text-slate-400'
                      }`}>
                        <QrCode className="w-3.5 h-3.5" />
                      </div>
                      {currentItem.category === 'upi' && (
                        <span className="w-4 h-4 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-100">UPI Statement</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">PhonePe, GPay, Paytm</span>
                    </div>
                  </button>

                  {/* Credit Card */}
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('credit_card')}
                    className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      currentItem.category === 'credit_card'
                        ? 'bg-purple-400/15 border-purple-400 text-purple-300 shadow-md ring-1 ring-purple-400/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        currentItem.category === 'credit_card' ? 'bg-purple-400/20 text-purple-300' : 'bg-slate-900 text-slate-400'
                      }`}>
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      {currentItem.category === 'credit_card' && (
                        <span className="w-4 h-4 rounded-full bg-purple-400 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-slate-100">Credit Card</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">HDFC, SBI Card</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. ENTITY & ACCOUNT DETAILS */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                      {currentItem.category === 'bank' ? 'Bank / Institution Name' : currentItem.category === 'upi' ? 'UPI Provider' : 'Credit Card Name'}
                    </label>
                    <input
                      type="text"
                      value={currentItem.entityName}
                      onChange={(e) => handleEntityNameChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                      {currentItem.category === 'bank' ? 'Masked Account No.' : currentItem.category === 'upi' ? 'UPI ID / VPA' : 'Masked Card No.'}
                    </label>
                    <input
                      type="text"
                      value={currentItem.accountOrIdMasked}
                      onChange={(e) => handleMaskChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-slate-200 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Period: {currentItem.period}</span>
                  </span>
                  <span className="text-amber-400/90 font-semibold">
                    {currentItem.transactionsCount} txs parsed
                  </span>
                </div>
              </div>

              {/* 3. FINANCIAL TOTALS SUMMARY (REAL NUMBERS ONLY) */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400/80 block flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Total Inflow (Credit)</span>
                  </span>
                  <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                    +₹{currentItem.totalCredit.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25">
                  <span className="text-[9px] uppercase tracking-wider text-rose-400/80 block flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>Total Outflow (Debit)</span>
                  </span>
                  <span className="text-sm font-bold text-rose-400 block mt-0.5">
                    -₹{currentItem.totalDebit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 4. EXTRACTED TRANSACTIONS PREVIEW */}
              {currentItem.previewRows && currentItem.previewRows.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-slate-300">
                      Parsed Statement Rows ({currentItem.previewRows.length})
                    </span>
                    <span className="text-slate-500 font-mono">Real File Data</span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden divide-y divide-slate-800/60 max-h-36 overflow-y-auto scrollbar-thin">
                    {currentItem.previewRows.map((row, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-[11px] gap-2 hover:bg-slate-900/50">
                        <div className="truncate flex-1">
                          <div className="text-slate-200 font-medium truncate">{row.description}</div>
                          <div className="text-[9px] text-slate-500 font-mono flex items-center gap-2">
                            <span>{formatToDisplayDate(row.date)}</span>
                            {row.category && <span>· {row.category}</span>}
                          </div>
                        </div>
                        <span className={`font-mono font-bold shrink-0 ${
                          row.type === 'credit' ? 'text-emerald-400' : 'text-slate-200'
                        }`}>
                          {row.type === 'credit' ? '+' : '-'}₹{row.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Statement format verified ({currentItem.entityName}). Full line item reconciliation occurs upon processing.</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer text-center"
            >
              {validItems.length > 0 ? 'Cancel All' : 'Dismiss'}
            </button>
            {!currentItem.isValidStatement && validItems.length > 0 && (
              <button
                type="button"
                onClick={() => excludeItem(currentIndex)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Exclude This File</span>
              </button>
            )}
          </div>

          {validItems.length === 0 ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onUploadAnother) onUploadAnother();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Valid Statement</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleConfirmSingleOrAll(false)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-100 transition-all cursor-pointer text-center"
                title="Add valid statements to review list for later processing"
              >
                Add Valid to Review ({validItems.length})
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSingleOrAll(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                title="Process all valid statements immediately into ledger"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Confirm & Process ({validItems.length})</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
