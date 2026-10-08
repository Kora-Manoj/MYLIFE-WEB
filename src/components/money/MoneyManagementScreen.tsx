import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PendingStatementReview, Transaction } from '../../types';
import { 
  extractTextFromUploadedFile, 
  PasswordRequiredError,
  isPasswordError 
} from '../../utils/fileExtractor';
import { 
  compareTimes,
  isPaytmPlaceholder,
  cleanDeduplicatedText,
  formatToDisplayDate,
  classifyTransactionReference,
  detectPaymentChannel 
} from '../../utils/statementProcessor';
import { BankStatementsDrawer } from './BankStatementsDrawer';
import { UpiStatementsDrawer } from './UpiStatementsDrawer';
import { CreditCardStatementsDrawer } from './CreditCardStatementsDrawer';
import { StatementReviewModal } from './StatementReviewModal';
import { PasswordPromptModal } from './PasswordPromptModal';
import { CsvVaultModal } from './CsvVaultModal';
import { TagEditorModal } from './TagEditorModal';
import { 
  Building2, 
  QrCode, 
  Upload, 
  ChevronDown, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  PieChart, 
  CreditCard, 
  FileText, 
  Search, 
  Sparkles, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  Download,
  FileCheck,
  Trash2,
  Loader2,
  Database,
  Zap,
  Cpu,
  RefreshCw,
  Lock,
  Layers,
  Filter,
  X,
  Tag,
  Clock,
  User,
  SlidersHorizontal,
  ArrowUpDown,
  FileSpreadsheet,
  Calendar,
  Hash
} from 'lucide-react';

export const MoneyManagementScreen: React.FC = () => {
  const { 
    bankStatements, 
    upiStatements, 
    creditCardStatements,
    transactions,
    deleteTransaction,
    updateTransactionTag,
    updateTransactionDetails,
    processAllStatements, 
    clearAllStatements,
    isProcessing, 
    statementsProcessed,
    isBankReviewOpen,
    setIsBankReviewOpen,
    isUpiReviewOpen,
    setIsUpiReviewOpen,
    isCreditCardReviewOpen,
    setIsCreditCardReviewOpen,
    moneyActiveView,
    setMoneyActiveView,
    normalizedDataset,
    downloadNormalizedCsv,
    ingestUserCsv,
    classifyAndAddStatement,
    classifyUploadedFile,
    confirmMultiplePendingStatements,
    csvVaultItems,
    isCsvVaultOpen,
    setIsCsvVaultOpen,
    downloadSingleStatementCsv,
    syncStatementCsvs,
    getCategoryDraftCsv,
    downloadCategoryDraftCsv,
    downloadConsolidatedAllTransactionsCsv,
    crossSourceMatches,
    showReducedRepeats,
    setShowReducedRepeats
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [pendingStatementsToReview, setPendingStatementsToReview] = useState<PendingStatementReview[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Password-Protected File Handling Queue
  interface LockedFileJob {
    file: File;
    remainingFiles: File[];
    isIncorrect: boolean;
    accumulator: PendingStatementReview[];
  }
  const [lockedFileJob, setLockedFileJob] = useState<LockedFileJob | null>(null);

  const activeView = moneyActiveView;
  const setActiveView = setMoneyActiveView;

  // Main Category & Sub-Category Filtering
  const [filterSource, setFilterSource] = useState<'all' | 'bank' | 'upi' | 'credit_card'>('all');
  const [filterSubCategory, setFilterSubCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced Traverse State: Amount, Date, Time, Receiver, Tag, Bank Txn Number, UPI UTR
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [receiverSearch, setReceiverSearch] = useState<string>('');
  const [refUtrSearch, setRefUtrSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [isTraverseDrawerOpen, setIsTraverseDrawerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [csvVaultInitialTab, setCsvVaultInitialTab] = useState<'separate' | 'category' | 'sync_audit'>('separate');

  const handleSelectMainCategory = (category: 'all' | 'bank' | 'upi' | 'credit_card') => {
    setFilterSource(category);
    setFilterSubCategory('all');
  };

  const resetAllFilters = () => {
    setFilterSource('all');
    setFilterSubCategory('all');
    setSearchTerm('');
    setFilterTag('all');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setReceiverSearch('');
    setRefUtrSearch('');
    setSortBy('date_desc');
  };

  const isAnyFilterActive = 
    filterSource !== 'all' || 
    filterSubCategory !== 'all' || 
    searchTerm.trim() !== '' || 
    filterTag !== 'all' || 
    minAmount !== '' || 
    maxAmount !== '' || 
    startDate !== '' || 
    endDate !== '' ||
    receiverSearch !== '' ||
    refUtrSearch !== '' ||
    showReducedRepeats;

  const getNormalizedSourceName = (t: Transaction): string => {
    const raw = (t.sourceName || '').trim();
    if (raw) return raw;
    if (t.sourceType === 'bank') return 'Bank Account';
    if (t.sourceType === 'upi') return 'UPI';
    return 'Credit Card';
  };

  // Calculations
  const totalBankCredits = bankStatements.reduce((sum, s) => sum + s.totalCredit, 0);
  const totalBankDebits = bankStatements.reduce((sum, s) => sum + s.totalDebit, 0);
  const totalUpiSpent = upiStatements.reduce((sum, s) => sum + s.totalSpent, 0);
  const totalCardSpends = creditCardStatements.reduce((sum, s) => sum + s.totalSpends, 0);
  const totalOutflow = totalBankDebits + totalUpiSpent + totalCardSpends;
  const totalStatementsCount = bankStatements.length + upiStatements.length + creditCardStatements.length;

  // Dynamic Sub-Categories grouped by their respective Main Category (Bank, UPI, Credit Card)
  const groupedSubCategories = useMemo(() => {
    const bankCounts: Record<string, number> = {};
    const upiCounts: Record<string, number> = {};
    const cardCounts: Record<string, number> = {};

    transactions.forEach(t => {
      const name = getNormalizedSourceName(t);
      if (t.sourceType === 'bank') {
        bankCounts[name] = (bankCounts[name] || 0) + 1;
      } else if (t.sourceType === 'upi') {
        upiCounts[name] = (upiCounts[name] || 0) + 1;
      } else if (t.sourceType === 'credit_card') {
        cardCounts[name] = (cardCounts[name] || 0) + 1;
      }
    });

    return {
      bank: Object.entries(bankCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      upi: Object.entries(upiCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      credit_card: Object.entries(cardCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    };
  }, [transactions]);

  // Unique Tags list for Tag quick-filter chips
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.tag && t.tag.trim()) set.add(t.tag.trim());
    });
    return Array.from(set).sort();
  }, [transactions]);

  // High-Efficiency Omni-Traverse: Amount, Date, Time, Receiver, Tag, Txn #, UPI UTR
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter(t => {
      const normSource = getNormalizedSourceName(t);
      const matchesMain = filterSource === 'all' || t.sourceType === filterSource;
      const matchesSub = filterSubCategory === 'all' || 
                         normSource.toLowerCase() === filterSubCategory.toLowerCase() ||
                         (t.sourceName && t.sourceName.toLowerCase() === filterSubCategory.toLowerCase());
      
      // Purpose Tag filter
      const matchesTag = filterTag === 'all' || (t.tag || '').toLowerCase() === filterTag.toLowerCase();

      // Payment Channel filter
      const matchesChannel = filterChannel === 'all' || detectPaymentChannel(t.description, t.sourceType).code.toLowerCase() === filterChannel.toLowerCase();

      // Min & Max Amount filter
      const numMin = minAmount ? parseFloat(minAmount) : NaN;
      const numMax = maxAmount ? parseFloat(maxAmount) : NaN;
      const matchesMin = isNaN(numMin) || t.amount >= numMin;
      const matchesMax = isNaN(numMax) || t.amount <= numMax;

      // Date Range filter
      const matchesStart = !startDate || (t.date && t.date >= startDate);
      const matchesEnd = !endDate || (t.date && t.date <= endDate);

      // Receiver Name dedicated filter
      const matchesReceiver = !receiverSearch.trim() || 
        (t.receiverName && t.receiverName.toLowerCase().includes(receiverSearch.toLowerCase().trim()));

      // Bank Txn Number / UPI UTR dedicated filter
      const matchesRefUtr = !refUtrSearch.trim() ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(refUtrSearch.toLowerCase().trim())) ||
        (t.bankTxnNumber && t.bankTxnNumber.toLowerCase().includes(refUtrSearch.toLowerCase().trim())) ||
        (t.upiUtr && t.upiUtr.toLowerCase().includes(refUtrSearch.toLowerCase().trim()));

      // Reduced repeats filter (hide by default, show if showReducedRepeats is checked)
      const matchesRepeats = showReducedRepeats ? true : !t.isRepeatReduced;

      // Omni-Search: instant matching across amount, date, time, receiver, tag, bank txn #, UPI UTR, description
      const matchesOmni = !searchTerm.trim() || (() => {
        const q = searchTerm.toLowerCase().trim();
        const amtStr = t.amount.toString();
        const dateStr = (t.date || '').toLowerCase();
        const timeStr = (t.time || '').toLowerCase();
        const descStr = (t.description || '').toLowerCase();
        const recStr = (t.receiverName || '').toLowerCase();
        const tagStr = (t.tag || '').toLowerCase();
        const catStr = (t.category || '').toLowerCase();
        const refStr = (t.referenceNo || '').toLowerCase();
        const bankTxnStr = (t.bankTxnNumber || '').toLowerCase();
        const upiUtrStr = (t.upiUtr || '').toLowerCase();
        const sourceStr = normSource.toLowerCase();

        return (
          descStr.includes(q) ||
          sourceStr.includes(q) ||
          catStr.includes(q) ||
          tagStr.includes(q) ||
          recStr.includes(q) ||
          refStr.includes(q) ||
          bankTxnStr.includes(q) ||
          upiUtrStr.includes(q) ||
          dateStr.includes(q) ||
          timeStr.includes(q) ||
          amtStr.includes(q)
        );
      })();

      return matchesMain && matchesSub && matchesTag && matchesChannel && matchesMin && matchesMax && 
             matchesStart && matchesEnd && matchesReceiver && matchesRefUtr && matchesRepeats && matchesOmni;
    });

    // Traverse Sorting
    return list.sort((a, b) => {
      if (sortBy === 'date_desc') {
        const dateComp = (b.date || '').localeCompare(a.date || '');
        if (dateComp !== 0) return dateComp;
        return compareTimes(b.time, a.time);
      } else if (sortBy === 'date_asc') {
        const dateComp = (a.date || '').localeCompare(b.date || '');
        if (dateComp !== 0) return dateComp;
        return compareTimes(a.time, b.time);
      } else if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });
  }, [
    transactions,
    filterSource,
    filterSubCategory,
    filterTag,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    receiverSearch,
    refUtrSearch,
    showReducedRepeats,
    searchTerm,
    sortBy
  ]);

  // Category breakdown for analytics
  const categoryTotals: Record<string, number> = {};
  transactions.filter(t => t.type === 'debit').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  /**
   * CONTINUE PROCESSING FILES QUEUE
   * Gracefully handles password exceptions and prompts the user
   */
  const continueProcessingFiles = async (
    filesQueue: File[],
    accumulatedPending: PendingStatementReview[]
  ) => {
    setIsReadingFiles(true);
    const parsedPending = [...accumulatedPending];

    for (let i = 0; i < filesQueue.length; i++) {
      const file = filesQueue[i];
      setUploadFeedback(`Reading & inspecting file ${i + 1} of ${filesQueue.length}: ${file.name}...`);
      // Yield to allow browser repaint
      await new Promise(r => setTimeout(r, 0));

      try {
        const content = await extractTextFromUploadedFile(file, undefined, (progress) => {
          if (progress.totalPages > 1) {
            setUploadFeedback(`Inspecting file ${i + 1} of ${filesQueue.length}: ${file.name} (Page ${progress.currentPage}/${progress.totalPages} · ${progress.percent}%)...`);
          }
        });
        const fileSizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;

        const pending = classifyUploadedFile(file.name, content, fileSizeStr);
        parsedPending.push(pending);
      } catch (err: any) {
        if (err instanceof PasswordRequiredError || err?.name === 'PasswordRequiredError' || isPasswordError(err)) {
          setIsReadingFiles(false);
          setUploadFeedback(null);
          setLockedFileJob({
            file,
            remainingFiles: filesQueue.slice(i + 1),
            isIncorrect: err.isIncorrect || false,
            accumulator: parsedPending
          });
          return;
        }

        console.error('File extraction error:', err);
        parsedPending.push({
          id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
          uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          category: 'bank',
          detectedCategory: 'bank',
          entityName: 'Unrecognized Document',
          accountOrIdMasked: 'N/A',
          period: 'N/A',
          transactionsCount: 0,
          totalCredit: 0,
          totalDebit: 0,
          openingBalance: 0,
          closingBalance: 0,
          isValidStatement: false,
          validationError: `Failed to read "${file.name}". Please ensure it is an uncorrupted CSV, XLSX, or PDF statement.`
        });
      }
    }

    setIsReadingFiles(false);
    setUploadFeedback(null);
    setPendingStatementsToReview(parsedPending);
    setIsReviewModalOpen(true);
  };

  /**
   * ASYNC UNIFIED STATEMENT UPLOAD HANDLER
   * Reads real text/data from CSV, XLSX, XLS, PDF, and TXT files.
   * Prompts password if encrypted, classifies using real contents, and opens StatementReviewModal.
   */
  const handleUnifiedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadFeedback(`Reading and inspecting ${fileList.length} file${fileList.length > 1 ? 's' : ''}...`);
    await continueProcessingFiles(fileList, []);
  };

  /**
   * UNLOCK PASSWORD-PROTECTED STATEMENT HANDLER
   */
  const handleUnlockPasswordFile = async (password: string) => {
    if (!lockedFileJob) return;
    const { file, remainingFiles, accumulator } = lockedFileJob;
    try {
      setUploadFeedback(`Unlocking and inspecting ${file.name}...`);
      await new Promise(r => setTimeout(r, 0));
      const content = await extractTextFromUploadedFile(file, password, (progress) => {
        if (progress.totalPages > 1) {
          setUploadFeedback(`Inspecting ${file.name} (Page ${progress.currentPage}/${progress.totalPages} · ${progress.percent}%)...`);
        }
      });
      const fileSizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const pending = classifyUploadedFile(file.name, content, fileSizeStr);
      const updatedAccumulator = [...accumulator, pending];
      setLockedFileJob(null);

      if (remainingFiles.length > 0) {
        await continueProcessingFiles(remainingFiles, updatedAccumulator);
      } else {
        setPendingStatementsToReview(updatedAccumulator);
        setIsReviewModalOpen(true);
      }
    } catch (err: any) {
      setUploadFeedback(null);
      if (err instanceof PasswordRequiredError || err?.name === 'PasswordRequiredError' || isPasswordError(err)) {
        setLockedFileJob(prev => prev ? { ...prev, isIncorrect: true } : null);
      } else {
        console.error('Password decrypt error:', err);
      }
    }
  };

  const handleCancelPasswordPrompt = () => {
    if (!lockedFileJob) return;
    const { remainingFiles, accumulator } = lockedFileJob;
    setLockedFileJob(null);
    if (remainingFiles.length > 0) {
      continueProcessingFiles(remainingFiles, accumulator);
    } else if (accumulator.length > 0) {
      setPendingStatementsToReview(accumulator);
      setIsReviewModalOpen(true);
    }
  };

  /**
   * CONFIRM PENDING STATEMENTS AFTER USER REVIEW
   */
  const handleConfirmReview = (confirmedItems: PendingStatementReview[], processImmediately: boolean) => {
    confirmMultiplePendingStatements(confirmedItems, processImmediately);
    const count = confirmedItems.length;
    if (processImmediately) {
      setUploadFeedback(`Confirmed & processed ${count} statement${count > 1 ? 's' : ''}. Reconciled into unified ledger.`);
      setActiveView('ledger');
    } else {
      setUploadFeedback(`Added ${count} statement${count > 1 ? 's' : ''} to review list. Click 'Review List' or 'Process the statement' below.`);
      setActiveView('statements');
    }
    setTimeout(() => setUploadFeedback(null), 7000);
  };

  return (
    <div className="h-full flex-1 flex flex-col justify-between gap-3 select-none">
      
      {/* 1. MM OVERVIEW HUB — 3 FULL-SCREEN CARDS MATCHING HOME PAGE UI & DRAWINGS */}
      {activeView === 'hub' && (
        <div className="h-full flex-1 flex flex-col justify-between gap-3">
          
          {/* MODULE 1: Statement Upload & Review */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950 border border-amber-500/30 hover:border-amber-400/80 transition-all flex flex-col justify-between shadow-md relative overflow-hidden flex-1 min-h-[160px]">
            {/* Subtle decorative bank & vault drawing */}
            <div className="absolute right-2 bottom-1 w-28 h-20 opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 60" className="w-full h-full text-amber-400 stroke-current fill-none">
                <rect x="20" y="15" width="60" height="40" rx="6" strokeWidth="2" />
                <line x1="20" y1="28" x2="80" y2="28" strokeWidth="1.5" />
                <circle cx="35" cy="42" r="5" strokeWidth="1.5" />
                <line x1="50" y1="42" x2="70" y2="42" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('statements')}
                  className="w-10 h-10 rounded-2xl bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/40 hover:border-amber-400 flex items-center justify-center text-amber-400 hover:text-amber-300 shadow-md transition-all active:scale-95 group/upload cursor-pointer"
                  title="Click [↑] Upload Icon to Open Statement Upload & Review Center"
                  aria-label="Upload Statements"
                >
                  <Upload className="w-5 h-5 group-hover/upload:scale-110 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('statements')}
                  className="text-left group/title focus:outline-none cursor-pointer"
                  title="Click to Open Statement Upload & Review Center"
                >
                  <h4 className="text-base font-bold text-slate-100 group-hover/title:text-amber-300 transition-colors">
                    Statement Upload & Review
                  </h4>
                  <div className="text-[11px] text-amber-400/90 font-medium">
                    {bankStatements.length} Bank · {upiStatements.length} UPI · {creditCardStatements.length} Cards
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('statements')}
                className="text-xs font-mono font-bold text-amber-300 hover:text-amber-200 px-2.5 py-0.5 rounded-full bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/30 hover:border-amber-400/60 transition-all cursor-pointer"
                title="Statement Upload & Review (SUR)"
              >
                SUR
              </button>
            </div>

            {/* Quick Actions & Draw.io Review Lists: Bank, UPI, Credit Cards */}
            <div className="pt-3 border-t border-amber-500/20 flex flex-col gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBankReviewOpen(true)}
                  className="flex-1 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-semibold border border-amber-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Review Bank Statements"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bank List (▼)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpiReviewOpen(true)}
                  className="flex-1 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-semibold border border-amber-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Review UPI Statements"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>UPI List (▼)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreditCardReviewOpen(true)}
                  className="flex-1 py-1.5 rounded-xl bg-purple-400/20 hover:bg-purple-400/30 text-purple-300 text-xs font-semibold border border-purple-400/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Review Credit Card Statements"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cards (▼)</span>
                </button>
              </div>
            </div>
          </div>

          {/* MODULE 2: Transactions Ledger */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-500/10 via-slate-900/90 to-slate-950 border border-sky-500/30 hover:border-sky-400/80 transition-all flex flex-col justify-between shadow-md relative overflow-hidden flex-1 min-h-[160px]">
            {/* Subtle decorative ledger lines drawing */}
            <div className="absolute right-2 bottom-1 w-28 h-20 opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 60" className="w-full h-full text-sky-400 stroke-current fill-none">
                <rect x="15" y="10" width="70" height="45" rx="4" strokeWidth="2" />
                <line x1="25" y1="22" x2="75" y2="22" strokeWidth="1.5" />
                <line x1="25" y1="32" x2="60" y2="32" strokeWidth="1.5" />
                <line x1="25" y1="42" x2="50" y2="42" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('ledger')}
                  className="w-10 h-10 rounded-2xl bg-sky-400/20 hover:bg-sky-400/35 border border-sky-400/40 hover:border-sky-400 flex items-center justify-center text-sky-400 hover:text-sky-300 shadow-md transition-all active:scale-95 group/ledger cursor-pointer"
                  title="Click to Open Transactions Ledger"
                  aria-label="Transactions Ledger"
                >
                  <CreditCard className="w-5 h-5 group-hover/ledger:scale-110 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('ledger')}
                  className="text-left group/title focus:outline-none cursor-pointer"
                  title="Click to Open Transactions Ledger"
                >
                  <h4 className="text-base font-bold text-slate-100 group-hover/title:text-sky-300 transition-colors">
                    Transactions Ledger
                  </h4>
                  <div className="text-[11px] text-sky-400/90 font-medium">
                    {transactions.length} Reconciled entries across accounts
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('ledger')}
                className="text-xs font-mono font-bold text-sky-300 hover:text-sky-200 px-2.5 py-0.5 rounded-full bg-sky-400/15 hover:bg-sky-400/30 border border-sky-400/30 hover:border-sky-400/60 transition-all cursor-pointer"
                title="Transactions Ledger (TL)"
              >
                TL
              </button>
            </div>

            {/* Preview Summary */}
            <div className="pt-3 border-t border-sky-500/20 flex items-center justify-between relative z-10">
              <div className="text-xs text-slate-300 font-mono">
                Recent: <span className="text-slate-100 font-semibold">{transactions[0]?.description.slice(0, 28)}...</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-sky-300">
                {transactions.length} entries
              </span>
            </div>
          </div>

          {/* MODULE 3: Spend Analytics */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-slate-900/90 to-slate-950 border border-emerald-500/30 hover:border-emerald-400/80 transition-all flex flex-col justify-between shadow-md relative overflow-hidden flex-1 min-h-[160px]">
            {/* Subtle decorative radial chart drawing */}
            <div className="absolute right-2 bottom-1 w-24 h-24 opacity-20 pointer-events-none">
              <svg viewBox="0 0 80 80" className="w-full h-full text-emerald-400 stroke-current fill-none">
                <circle cx="40" cy="40" r="28" strokeWidth="5" strokeDasharray="120 60" />
                <circle cx="40" cy="40" r="16" strokeWidth="4" strokeDasharray="50 50" />
              </svg>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView('analytics')}
                  className="w-10 h-10 rounded-2xl bg-emerald-400/20 hover:bg-emerald-400/35 border border-emerald-400/40 hover:border-emerald-400 flex items-center justify-center text-emerald-400 hover:text-emerald-300 shadow-md transition-all active:scale-95 group/analytics cursor-pointer"
                  title="Click to View Spend Analytics"
                  aria-label="Spend Analytics"
                >
                  <PieChart className="w-5 h-5 group-hover/analytics:scale-110 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('analytics')}
                  className="text-left group/title focus:outline-none cursor-pointer"
                  title="Click to View Spend Analytics"
                >
                  <h4 className="text-base font-bold text-slate-100 group-hover/title:text-emerald-300 transition-colors">
                    Spend Analytics
                  </h4>
                  <div className="text-[11px] text-emerald-400/90 font-medium">
                    +₹{totalBankCredits.toLocaleString()} In · -₹{(totalBankDebits + totalUpiSpent).toLocaleString()} Out
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('analytics')}
                className="text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 px-2.5 py-0.5 rounded-full bg-emerald-400/15 hover:bg-emerald-400/30 border border-emerald-400/30 hover:border-emerald-400/60 transition-all cursor-pointer"
                title="Spend Analytics (SA)"
              >
                SA
              </button>
            </div>

            {/* Breakdown */}
            <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between relative z-10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-semibold font-mono">Net Surplus:</span>
                <span className="text-slate-200 font-mono font-bold">₹{(totalBankCredits - (totalBankDebits + totalUpiSpent)).toLocaleString()}</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-300/80">
                Cashflow Reconciled
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 2. DETAIL VIEWS: FULL-FEATURED DRILL-DOWNS WITH INSTANT RETURN */}
      {activeView !== 'hub' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* VIEW: Statement Upload & Review */}
          {activeView === 'statements' && (
            <div className="flex-1 flex flex-col justify-between gap-3 min-h-[560px]">
              
              <div className="space-y-3">

                {/* 1. SINGLE UNIFIED STATEMENT UPLOAD AREA */}
                {/* 1. SINGLE UNIFIED STATEMENT UPLOAD CENTER */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950 border border-amber-500/40 shadow-lg space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                        {isReadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                          <span>Statement Upload Center</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            Single Upload
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Upload your bank passbook, UPI export, or credit card statement in CSV, PDF, XLSX, or TXT.
                        </p>
                      </div>
                    </div>

                    {totalStatementsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          clearAllStatements();
                          setUploadFeedback('All statements and ledger records removed.');
                          setTimeout(() => setUploadFeedback(null), 3500);
                        }}
                        className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all shrink-0"
                        title="Remove all uploaded statements and reset"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  {/* Hidden File Input for Unified Upload */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUnifiedUpload}
                    accept=".csv,.pdf,.xlsx,.xls,.txt,.tsv"
                    multiple
                    className="hidden"
                  />

                  {/* Unified Click/Drag Zone */}
                  <div 
                    onClick={() => !isReadingFiles && fileInputRef.current?.click()}
                    className={`p-4 rounded-2xl bg-slate-950/80 border border-dashed text-center transition-all group ${
                      isReadingFiles 
                        ? 'border-amber-400/60 bg-slate-900/60 cursor-wait' 
                        : 'border-amber-400/40 hover:border-amber-400 cursor-pointer hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {isReadingFiles ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Upload className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                        {isReadingFiles ? 'Analyzing and reading files...' : 'Click to upload statement file (Single or Multiple)'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Supports CSV, XLSX, XLS, PDF, TXT · Verified & classified with real data extraction
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Upload / Classification Feedback Toast */}
                {uploadFeedback && (
                  <div className="p-3 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-medium flex items-center justify-between animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{uploadFeedback}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setUploadFeedback(null)}
                      className="text-amber-400 hover:text-amber-200 text-xs cursor-pointer ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* 2. Bank Statements Review Card */}
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-400/40 transition-all shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">Bank Statements</h4>
                        <p className="text-[10px] text-slate-400">SBI, HDFC, ICICI, Axis monthly passbooks</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full font-bold">
                      {bankStatements.length} Classified
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBankReviewOpen(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-amber-400/40 hover:border-amber-400 text-xs font-medium text-slate-200 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">
                        {bankStatements.length > 0
                          ? `Reviewed Files (${bankStatements.map(s => s.bankName).join(', ')})`
                          : 'No bank statements yet — click upload above'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold shrink-0">
                      <span>Review List ({bankStatements.length})</span>
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </button>
                </div>

                {/* 3. UPI Statements Review Card */}
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-400/40 transition-all shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">UPI Statements</h4>
                        <p className="text-[10px] text-slate-400">PhonePe, Google Pay, Paytm, CRED exports</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-sky-300 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full font-bold">
                      {upiStatements.length} Classified
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsUpiReviewOpen(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-sky-400/40 hover:border-sky-400 text-xs font-medium text-slate-200 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">
                        {upiStatements.length > 0 
                          ? `Reviewed Files (${upiStatements.map(s => s.upiApp).join(', ')})`
                          : 'No UPI statements yet — click upload above'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sky-400 text-[11px] font-semibold shrink-0">
                      <span>Review List ({upiStatements.length})</span>
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </button>
                </div>

                {/* 4. Credit Card Statements Review Card */}
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-400/40 transition-all shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">Credit Card Statements</h4>
                        <p className="text-[10px] text-slate-400">HDFC, SBI Card, ICICI Amazon Pay monthly billing</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded-full font-bold">
                      {creditCardStatements.length} Classified
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreditCardReviewOpen(true)}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-purple-400/40 hover:border-purple-400 text-xs font-medium text-slate-200 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">
                        {creditCardStatements.length > 0 
                          ? `Reviewed Cards (${creditCardStatements.map(s => s.cardName.split(' ')[0]).join(', ')})`
                          : 'No credit card statements yet — click upload above'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-semibold shrink-0">
                      <span>Review List ({creditCardStatements.length})</span>
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </button>
                </div>


                {/* Reconciliation & Processing Overview Card */}
                <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950 border border-amber-500/30 shadow-md relative overflow-hidden space-y-3">
                  {/* Subtle decorative background art */}
                  <div className="absolute right-2 bottom-0 w-32 h-20 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 60" className="w-full h-full text-amber-400 stroke-current fill-none">
                      <path d="M 10 50 Q 35 20, 60 35 T 100 15" strokeWidth="2" />
                      <circle cx="60" cy="35" r="3" fill="currentColor" />
                      <circle cx="100" cy="15" r="3" fill="currentColor" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-100">Processing Summary</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 font-semibold">
                      {totalStatementsCount} Statement{totalStatementsCount !== 1 ? 's' : ''} Ready
                    </span>
                  </div>

                  {/* 3-Column Reconciliation Metrics */}
                  <div className="grid grid-cols-3 gap-2 relative z-10">
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Inflow</div>
                      <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                        ₹{totalBankCredits.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Outflow</div>
                      <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                        ₹{totalOutflow.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Net Surplus</div>
                      <div className={`text-xs font-bold font-mono mt-0.5 ${
                        totalBankCredits - totalOutflow >= 0 ? 'text-amber-300' : 'text-rose-400'
                      }`}>
                        ₹{(totalBankCredits - totalOutflow).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Status & Reconcile Note */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/20 relative z-10">
                    <span className="text-slate-400">
                      {statementsProcessed 
                        ? '✓ Reconciled into Unified Ledger' 
                        : totalStatementsCount > 0 
                          ? 'Ready to process statements into unified ledger'
                          : 'No statements uploaded yet'}
                    </span>
                    {(statementsProcessed || transactions.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setActiveView('ledger')}
                        className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View Ledger ({transactions.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Separate CSV Vault & Sync Control Card */}
                <div className="p-4 rounded-3xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-400/50 shadow-md transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span>Separate CSV Vault</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-400/15 text-sky-300 border border-sky-400/25">
                            {csvVaultItems.length} Saved {csvVaultItems.length === 1 ? 'CSV' : 'CSVs'}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400">Independent CSV per statement for zero-risk data integrity</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCsvVaultOpen(true)}
                      className="px-2.5 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Manage Vault</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                    <span>
                      {csvVaultItems.length > 0 
                        ? `${csvVaultItems.filter(v => v.isSynced).length} of ${csvVaultItems.length} separate CSVs synced to ledger`
                        : 'No separate CSVs yet. Process statements to generate.'}
                    </span>
                    {csvVaultItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => syncStatementCsvs()}
                        className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Sync to Ledger</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: "Process the statement" & Export */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={processAllStatements}
                  disabled={isProcessing || totalStatementsCount === 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>
                    {isProcessing 
                      ? 'Processing statements...' 
                      : totalStatementsCount === 0
                        ? 'Upload statements to process'
                        : statementsProcessed 
                          ? 'Process statements again' 
                          : 'Process the statement'}
                  </span>
                </button>

                {/* Export Button when statements processed */}
                {(statementsProcessed || transactions.length > 0) && (
                  <button
                    type="button"
                    onClick={downloadNormalizedCsv}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    title="Export transactions into CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Export Unified Ledger (CSV)</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* VIEW: Transactions Ledger */}
          {activeView === 'ledger' && (
            <div className="space-y-3">
              {/* Ledger Header: Total Transactions in Present Ledger */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Transactions Ledger
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-400/15 border border-sky-400/30 text-sky-300 font-mono text-xs font-bold shadow-sm">
                  <span>
                    {filterSource === 'all' && filterSubCategory === 'all' && !searchTerm.trim()
                      ? `${transactions.length} Total ${transactions.length === 1 ? 'Transaction' : 'Transactions'}`
                      : `${filteredTransactions.length} of ${transactions.length} (${
                          filterSubCategory !== 'all'
                            ? filterSubCategory
                            : filterSource === 'credit_card'
                              ? 'Cards'
                              : filterSource.toUpperCase()
                        })`}
                  </span>
                </div>
              </div>

              {/* 3-Tier CSV & Sync Architecture Quick Actions Bar */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider font-mono">
                      3-Tier CSV Pipeline
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvVaultInitialTab('sync_audit');
                      setIsCsvVaultOpen(true);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Sync &amp; Deduplicate Audit ({crossSourceMatches.length} Matches)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
                  {/* Tier 1: Separate CSV Vault */}
                  <button
                    type="button"
                    onClick={() => {
                      setCsvVaultInitialTab('separate');
                      setIsCsvVaultOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                    title="Separate CSV file for every Bank, UPI, Credit Card"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                    <span>1. Separate Vault ({csvVaultItems.length})</span>
                  </button>

                  {/* Tier 2: Category Draft CSVs */}
                  <button
                    type="button"
                    onClick={() => downloadCategoryDraftCsv('bank')}
                    disabled={transactions.filter(t => t.sourceType === 'bank').length === 0}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Draft Single CSV for All Banks (Sorted by Date & Time)"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Draft Bank CSV</span>
                    <Download className="w-3 h-3 ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCategoryDraftCsv('upi')}
                    disabled={transactions.filter(t => t.sourceType === 'upi').length === 0}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-400/10 hover:bg-sky-400/20 border border-sky-400/30 text-sky-300 text-[11px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Draft Single CSV for All UPI (Sorted by Date & Time)"
                  >
                    <QrCode className="w-3.5 h-3.5 text-sky-400" />
                    <span>Draft UPI CSV</span>
                    <Download className="w-3 h-3 ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCategoryDraftCsv('credit_card')}
                    disabled={transactions.filter(t => t.sourceType === 'credit_card').length === 0}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-400/10 hover:bg-purple-400/20 border border-purple-400/30 text-purple-300 text-[11px] font-medium flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Draft Single CSV for All Credit Cards (Sorted by Date & Time)"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                    <span>Draft Cards CSV</span>
                    <Download className="w-3 h-3 ml-0.5" />
                  </button>

                  {/* Tier 3: Consolidated All Transactions CSV */}
                  <button
                    type="button"
                    onClick={downloadConsolidatedAllTransactionsCsv}
                    disabled={transactions.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Download Consolidated Single CSV Category as All Txs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3. All Txs Single CSV</span>
                    <Download className="w-3 h-3 ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Omni-Search & Traverse Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search amount, date, time, receiver, tag, bank ref, UPI UTR..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                {/* Advanced Traverse Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsTraverseDrawerOpen(prev => !prev)}
                  className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    isTraverseDrawerOpen || minAmount || maxAmount || startDate || endDate || receiverSearch || refUtrSearch
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                  title="Advanced Traverse: Filter by amount range, date range, receiver, UTR, sort"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Traverse</span>
                  {(minAmount || maxAmount || startDate || endDate || receiverSearch || refUtrSearch) && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                </button>
                
                {/* Main Category Filter Tabs */}
                <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                  <button
                    onClick={() => handleSelectMainCategory('all')}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                      filterSource === 'all' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    onClick={() => handleSelectMainCategory('bank')}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                      filterSource === 'bank' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Bank ({transactions.filter(t => t.sourceType === 'bank').length})
                  </button>
                  <button
                    onClick={() => handleSelectMainCategory('upi')}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                      filterSource === 'upi' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    UPI ({transactions.filter(t => t.sourceType === 'upi').length})
                  </button>
                  <button
                    onClick={() => handleSelectMainCategory('credit_card')}
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                      filterSource === 'credit_card' ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cards ({transactions.filter(t => t.sourceType === 'credit_card').length})
                  </button>
                </div>

                {transactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAllStatements();
                      setUploadFeedback('Cleared all transactions and statements.');
                      setTimeout(() => setUploadFeedback(null), 3000);
                    }}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Clear all transactions from ledger"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                )}
              </div>

              {/* PURPOSE TAG QUICK-FILTER CHIPS */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold shrink-0 flex items-center gap-1 pl-1">
                  <Tag className="w-3 h-3 text-amber-400" />
                  <span>Purpose Tag:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setFilterTag('all')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
                    filterTag === 'all'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  All Tags
                </button>

                {['Food', 'Travel', 'Health', 'Shopping', 'Groceries', 'Bills', 'Investments', 'Salary', 'Rent', 'Transfer'].map(tg => {
                  const isSelected = filterTag.toLowerCase() === tg.toLowerCase();
                  const count = transactions.filter(t => (t.tag || '').toLowerCase() === tg.toLowerCase()).length;
                  if (count === 0 && !isSelected) return null;
                  return (
                    <button
                      key={tg}
                      type="button"
                      onClick={() => setFilterTag(isSelected ? 'all' : tg)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-1 ring-amber-400/50'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>{tg}</span>
                      <span className={`text-[10px] font-mono px-1 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CHANNEL IDENTIFICATION QUICK-FILTER CHIPS */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold shrink-0 flex items-center gap-1 pl-1">
                  <Zap className="w-3 h-3 text-sky-400" />
                  <span>Payment Channel:</span>
                </span>

                <button
                  type="button"
                  onClick={() => setFilterChannel('all')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 transition-all cursor-pointer ${
                    filterChannel === 'all'
                      ? 'bg-sky-400 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                  }`}
                >
                  All Channels
                </button>

                {[
                  { code: 'UPI', label: 'UPI' },
                  { code: 'NEFT', label: 'NEFT' },
                  { code: 'RTGS', label: 'RTGS' },
                  { code: 'IMPS', label: 'IMPS' },
                  { code: 'NACH', label: 'NACH / ECS' },
                  { code: 'AEPS', label: 'AEPS' },
                  { code: 'APBS', label: 'APBS' },
                  { code: 'BBPS', label: 'BBPS' },
                  { code: 'NETC', label: 'FASTag' },
                  { code: 'CTS', label: 'Cheque (CTS)' },
                  { code: 'CARD', label: 'Card / POS' }
                ].map(ch => {
                  const isSelected = filterChannel.toLowerCase() === ch.code.toLowerCase();
                  const count = transactions.filter(t => detectPaymentChannel(t.description, t.sourceType).code.toLowerCase() === ch.code.toLowerCase()).length;
                  if (count === 0 && !isSelected) return null;
                  return (
                    <button
                      key={ch.code}
                      type="button"
                      onClick={() => setFilterChannel(isSelected ? 'all' : ch.code)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-400 text-slate-950 font-bold shadow-sm ring-1 ring-sky-400/50'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <span>{ch.label}</span>
                      <span className={`text-[10px] font-mono px-1 rounded-full ${isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ADVANCED PRECISION TRAVERSE PANEL (AMOUNT, DATE, TIME, RECEIVER, UTR, SORT) */}
              {isTraverseDrawerOpen && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-400/40 shadow-2xl space-y-4 animate-in fade-in duration-150 text-xs">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-400 shrink-0">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-300 leading-tight">Filter &amp; Traverse Ledger</h4>
                        <p className="text-[11px] text-slate-400">Search by amount range, date interval, beneficiary name, or reference ID</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(minAmount || maxAmount || startDate || endDate || receiverSearch || refUtrSearch || showReducedRepeats || sortBy !== 'date_desc') && (
                        <button
                          type="button"
                          onClick={() => {
                            setMinAmount('');
                            setMaxAmount('');
                            setStartDate('');
                            setEndDate('');
                            setReceiverSearch('');
                            setRefUtrSearch('');
                            setSortBy('date_desc');
                            setShowReducedRepeats(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsTraverseDrawerOpen(false)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Close panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Filter Sections Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* 1. Date Range Section */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Date Interval (From - To)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">From Date</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">To Date</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Amount Range Section */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-amber-400 font-mono font-bold text-xs">₹</span>
                        <span>Amount Range (₹)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">Minimum (₹)</span>
                          <input
                            type="number"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            placeholder="Min ₹"
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">Maximum (₹)</span>
                          <input
                            type="number"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            placeholder="Max ₹"
                            className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Receiver / Payee Name */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Receiver / Beneficiary Name</span>
                      </label>
                      <input
                        type="text"
                        value={receiverSearch}
                        onChange={(e) => setReceiverSearch(e.target.value)}
                        placeholder="Search name (e.g. Swiggy, Kora Vin, Confirmtkt...)"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* 4. Bank Txn No / UPI UTR / RRN */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <label className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reference / UTR / RRN / Cheque</span>
                      </label>
                      <input
                        type="text"
                        value={refUtrSearch}
                        onChange={(e) => setRefUtrSearch(e.target.value)}
                        placeholder="Search ID (e.g. 12-digit RRN, NEFT UTR, IMPS...)"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Bottom Controls: Sort Order & Options */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                        Sort Order:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e: any) => setSortBy(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        <option value="date_desc">Date &amp; Time (Newest First)</option>
                        <option value="date_asc">Date &amp; Time (Oldest First)</option>
                        <option value="amount_desc">Amount (Highest First)</option>
                        <option value="amount_asc">Amount (Lowest First)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showReducedRepeats}
                          onChange={(e) => setShowReducedRepeats(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300">Show Reconciled Repeats</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setIsTraverseDrawerOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
                      >
                        Apply ({filteredTransactions.length})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVE FILTER STATUS BAR WITH INSTANT RESET TO GET ALL TRANSACTIONS */}
              {isAnyFilterActive && (
                <div className="p-2 px-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-300 truncate">
                      Active: <strong className="text-amber-300">
                        {filterSource === 'all' ? 'All Sources' : filterSource === 'bank' ? 'Bank' : filterSource === 'upi' ? 'UPI' : 'Credit Cards'}
                      </strong>
                      {filterSubCategory !== 'all' && (
                        <span> &gt; <strong className="text-amber-300">{filterSubCategory}</strong></span>
                      )}
                      {filterTag !== 'all' && (
                        <span> &gt; Tag: <strong className="text-amber-300">{filterTag}</strong></span>
                      )}
                      {searchTerm.trim() && (
                        <span> matching &ldquo;<strong className="text-slate-100">{searchTerm}</strong>&rdquo;</span>
                      )}
                      {minAmount && <span> &gt; &ge;₹{minAmount}</span>}
                      {maxAmount && <span> &gt; &le;₹{maxAmount}</span>}
                      {startDate && <span> &gt; From {startDate}</span>}
                      {endDate && <span> &gt; To {endDate}</span>}
                      {showReducedRepeats && <span className="text-rose-400 font-semibold"> (Showing Repeats)</span>}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-bold shrink-0">
                      {filteredTransactions.length} of {transactions.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                    title="Clear all filters and show all transactions"
                  >
                    <X className="w-3 h-3" />
                    <span>Show All ({transactions.length})</span>
                  </button>
                </div>
              )}

              {/* SUB-CATEGORY FILTER BAR RESPECTIVE TO SELECTED MAIN CATEGORY */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 animate-in fade-in">
                
                {/* 1. When Filter Source is 'all': Show Main Categories with their respective Sub-Categories */}
                {filterSource === 'all' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-amber-400" />
                        <span>Sub-Categories (Respective to Bank, UPI &amp; Credit Cards)</span>
                      </span>
                      {filterSubCategory !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFilterSubCategory('all')}
                          className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          Reset Sub-Category
                        </button>
                      )}
                    </div>

                    {/* All Sources master pill */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterSource('all');
                          setFilterSubCategory('all');
                        }}
                        className={`px-3 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                          filterSubCategory === 'all'
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                        title="Show all transactions across all banks, UPI, and cards"
                      >
                        <span>All Sources</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          filterSubCategory === 'all' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {transactions.length}
                        </span>
                      </button>

                      {/* Bank Accounts Sub-Category Pills */}
                      {groupedSubCategories.bank.map(sub => (
                        <button
                          key={`b_${sub.name}`}
                          type="button"
                          onClick={() => {
                            setFilterSource('bank');
                            setFilterSubCategory(sub.name);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                            filterSubCategory === sub.name
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-1 ring-amber-400/50'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-400/40'
                          }`}
                          title={`Filter by Bank: ${sub.name} (${sub.count} txs)`}
                        >
                          <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="max-w-[130px] truncate">{sub.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                            {sub.count}
                          </span>
                        </button>
                      ))}

                      {/* UPI Sub-Category Pills */}
                      {groupedSubCategories.upi.map(sub => (
                        <button
                          key={`u_${sub.name}`}
                          type="button"
                          onClick={() => {
                            setFilterSource('upi');
                            setFilterSubCategory(sub.name);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                            filterSubCategory === sub.name
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-1 ring-amber-400/50'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-sky-400/40'
                          }`}
                          title={`Filter by UPI: ${sub.name} (${sub.count} txs)`}
                        >
                          <QrCode className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="max-w-[130px] truncate">{sub.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                            {sub.count}
                          </span>
                        </button>
                      ))}

                      {/* Credit Cards Sub-Category Pills */}
                      {groupedSubCategories.credit_card.map(sub => (
                        <button
                          key={`c_${sub.name}`}
                          type="button"
                          onClick={() => {
                            setFilterSource('credit_card');
                            setFilterSubCategory(sub.name);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                            filterSubCategory === sub.name
                              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-1 ring-amber-400/50'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-400/40'
                          }`}
                          title={`Filter by Card: ${sub.name} (${sub.count} txs)`}
                        >
                          <CreditCard className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="max-w-[130px] truncate">{sub.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                            {sub.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. When Filter Source is 'bank': Main Category = Bank, Sub-Categories = Respective Bank Names */}
                {filterSource === 'bank' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        <span>Main Category: Bank Accounts · Sub-Category: Bank Name</span>
                      </span>
                      {filterSubCategory !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFilterSubCategory('all')}
                          className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          Show All Banks
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                      {/* All Banks Button */}
                      <button
                        type="button"
                        onClick={() => setFilterSubCategory('all')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                          filterSubCategory === 'all'
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                        title="Show all transactions across all bank accounts"
                      >
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>All Banks</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          filterSubCategory === 'all' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {transactions.filter(t => t.sourceType === 'bank').length}
                        </span>
                      </button>

                      {/* Individual Bank Pills */}
                      {groupedSubCategories.bank.map(sub => {
                        const isSelected = filterSubCategory.toLowerCase() === sub.name.toLowerCase();
                        return (
                          <button
                            key={sub.name}
                            type="button"
                            onClick={() => setFilterSubCategory(isSelected ? 'all' : sub.name)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-1 ring-amber-400/50'
                                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-amber-400/40'
                            }`}
                            title={`Filter ledger by ${sub.name} (${sub.count} transactions)`}
                          >
                            <span className="max-w-[140px] truncate">{sub.name}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                              isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {sub.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. When Filter Source is 'upi': Main Category = UPI, Sub-Categories = Respective UPI App Names */}
                {filterSource === 'upi' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-sky-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                        <QrCode className="w-3 h-3" />
                        <span>Main Category: UPI · Sub-Category: UPI App / Provider</span>
                      </span>
                      {filterSubCategory !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFilterSubCategory('all')}
                          className="text-[10px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                        >
                          Show All UPI
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                      {/* All UPI Button */}
                      <button
                        type="button"
                        onClick={() => setFilterSubCategory('all')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                          filterSubCategory === 'all'
                            ? 'bg-sky-400 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                        title="Show all transactions across all UPI apps"
                      >
                        <QrCode className="w-3 h-3 shrink-0" />
                        <span>All UPI</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          filterSubCategory === 'all' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {transactions.filter(t => t.sourceType === 'upi').length}
                        </span>
                      </button>

                      {/* Individual UPI App Pills */}
                      {groupedSubCategories.upi.map(sub => {
                        const isSelected = filterSubCategory.toLowerCase() === sub.name.toLowerCase();
                        return (
                          <button
                            key={sub.name}
                            type="button"
                            onClick={() => setFilterSubCategory(isSelected ? 'all' : sub.name)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-sky-400 text-slate-950 font-bold shadow-sm ring-1 ring-sky-400/50'
                                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-sky-400/40'
                            }`}
                            title={`Filter ledger by ${sub.name} (${sub.count} transactions)`}
                          >
                            <span className="max-w-[140px] truncate">{sub.name}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                              isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {sub.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. When Filter Source is 'credit_card': Main Category = Credit Card, Sub-Categories = Respective Card Names */}
                {filterSource === 'credit_card' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-purple-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" />
                        <span>Main Category: Credit Cards · Sub-Category: Card Name</span>
                      </span>
                      {filterSubCategory !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setFilterSubCategory('all')}
                          className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          Show All Cards
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                      {/* All Cards Button */}
                      <button
                        type="button"
                        onClick={() => setFilterSubCategory('all')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                          filterSubCategory === 'all'
                            ? 'bg-purple-400 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                        title="Show all transactions across all credit cards"
                      >
                        <CreditCard className="w-3 h-3 shrink-0" />
                        <span>All Cards</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          filterSubCategory === 'all' ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {transactions.filter(t => t.sourceType === 'credit_card').length}
                        </span>
                      </button>

                      {/* Individual Credit Card Pills */}
                      {groupedSubCategories.credit_card.map(sub => {
                        const isSelected = filterSubCategory.toLowerCase() === sub.name.toLowerCase();
                        return (
                          <button
                            key={sub.name}
                            type="button"
                            onClick={() => setFilterSubCategory(isSelected ? 'all' : sub.name)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-purple-400 text-slate-950 font-bold shadow-sm ring-1 ring-purple-400/50'
                                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-purple-400/40'
                            }`}
                            title={`Filter ledger by ${sub.name} (${sub.count} transactions)`}
                          >
                            <span className="max-w-[140px] truncate">{sub.name}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                              isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {sub.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Unsynced Separate CSVs Banner if user uploaded new ones */}
              {csvVaultItems.some(v => !v.isSynced) && (
                <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between text-xs text-sky-300">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-[11px]">
                      {csvVaultItems.filter(v => !v.isSynced).length} separate statement CSV ready to sync.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => syncStatementCsvs()}
                    className="px-2.5 py-1 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Now</span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {filteredTransactions.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-300">No transactions in ledger</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      {totalStatementsCount > 0 
                        ? 'Click "Process the statement" on the Statements tab to reconcile your uploaded statements into the ledger.'
                        : 'Upload your statement files in the Statement Upload Center to see real transactions.'}
                    </p>
                  </div>
                ) : (
                  filteredTransactions.map((t, idx) => {
                    const refClass = (t.referenceType && t.referenceLabel)
                      ? { type: t.referenceType, label: t.referenceLabel, value: t.upiUtr || t.bankTxnNumber || t.referenceNo }
                      : classifyTransactionReference(t.description, t.referenceNo, t.sourceType);
                    const cleanDesc = cleanDeduplicatedText(t.description, refClass?.value);
                    const cleanRec = cleanDeduplicatedText(t.receiverName || '', refClass?.value);
                    const displayTitle = cleanDesc || cleanRec || (t.type === 'credit' ? 'Money Received' : 'UPI Payment');
                    const isRecInDesc = cleanRec && displayTitle.toLowerCase().includes(cleanRec.toLowerCase());
                    const isDescInRec = cleanRec && cleanDesc && cleanRec.toLowerCase().includes(cleanDesc.toLowerCase());
                    const showReceiverPill = cleanRec && !isPaytmPlaceholder(cleanRec) && !isRecInDesc && !isDescInRec;

                    return (
                      <div 
                        key={t.id}
                        className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/90 space-y-3 text-xs group transition-all shadow-lg"
                      >
                        {/* ROW 1: Serial # + From Box (Left) & Purpose Tag (Right) */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="w-7 h-7 rounded-xl bg-slate-800/90 border border-slate-700/80 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 shadow-inner"
                              title={`Serial #${idx + 1}`}
                            >
                              <span className="text-[9px] text-slate-500 font-normal mr-0.5">#</span>
                              <span>{idx + 1}</span>
                            </div>

                            {/* From Box (Credit: From Sender | Debit: From Account) */}
                            {(() => {
                              const rawTitleParts = displayTitle.split('/');
                              const extractedName = rawTitleParts.length > 1 ? rawTitleParts[rawTitleParts.length - 1].trim() : displayTitle;

                              const originFrom = t.type === 'credit'
                                ? (t.senderName || (cleanRec && cleanRec !== t.sourceName ? cleanRec : null) || extractedName || 'External Payer')
                                : t.sourceName;

                              return (
                                <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm truncate">
                                  <span className="text-slate-400 font-sans font-medium text-[11px]">From:</span>
                                  <span className="text-amber-300 truncate max-w-[180px]" title={originFrom}>{originFrom}</span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Right Side: Payment Channel Badge + Purpose Tag */}
                          <div className="flex items-center gap-2 shrink-0">
                            {(() => {
                              const channel = detectPaymentChannel(t.description, t.sourceType);
                              return (
                                <span 
                                  className="px-2.5 py-1 rounded-xl bg-sky-950/90 border border-sky-800/80 text-sky-300 font-mono text-[11px] font-bold inline-flex items-center gap-1 shadow-xs"
                                  title={channel.description}
                                >
                                  <span>⚡</span>
                                  <span>{channel.label}</span>
                                </span>
                              );
                            })()}

                            <button
                              type="button"
                              onClick={() => setEditingTransaction(t)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer group/tag shrink-0 shadow-sm"
                              title="Click to edit transaction purpose tag"
                            >
                              <Tag className="w-3.5 h-3.5 text-amber-400 group-hover/tag:scale-110 transition-transform" />
                              <span>{t.tag || 'General'}</span>
                            </button>
                          </div>
                        </div>

                        {/* ROW 2: Reference Number (Left) & Date (Right) */}
                        <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            {refClass && refClass.value ? (
                              <span 
                                className="font-mono px-2 py-0.5 rounded-lg bg-sky-950/80 border border-sky-800/60 text-sky-300 inline-flex items-center gap-1.5 shadow-xs"
                                title={`${refClass.label}: ${refClass.value}`}
                              >
                                <span className="text-sky-400 font-semibold">{refClass.label}:</span>
                                <span>{refClass.value}</span>
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400">{t.sourceName}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-slate-300">
                            <span>{formatToDisplayDate(t.date)}</span>
                            {t.time && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span>{t.time}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ROW 3: To Box (Credit: To Account | Debit: To Merchant) & Amount/Balance/Delete (Right) */}
                        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                          {/* To Box */}
                          {(() => {
                            const rawTitleParts = displayTitle.split('/');
                            const extractedName = rawTitleParts.length > 1 ? rawTitleParts[rawTitleParts.length - 1].trim() : displayTitle;

                            const destinationTo = t.type === 'credit'
                              ? t.sourceName
                              : (t.receiverName || (cleanRec && cleanRec !== t.sourceName ? cleanRec : null) || extractedName || 'Merchant / Payee');

                            return (
                              <div className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm truncate">
                                <span className="text-slate-400 font-sans font-medium text-[11px]">To:</span>
                                <span className="text-emerald-300 truncate max-w-[200px]" title={destinationTo}>{destinationTo}</span>
                              </div>
                            );
                          })()}

                          {/* Amount, Balance & Delete */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className={`font-mono font-bold text-sm sm:text-base ${t.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'}`}>
                                {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                              </span>
                              {t.balance !== undefined && (
                                <div className="text-[10px] text-slate-400 font-mono" title={`Running Statement Balance: ₹${t.balance.toLocaleString('en-IN')}`}>
                                  Bal: ₹{t.balance.toLocaleString('en-IN')}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteTransaction(t.id)}
                              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/30 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                              title="Remove transaction"
                              aria-label="Remove transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW: Spend Analytics */}
          {activeView === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total Income (Credits)</span>
                  <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
                    +₹{totalBankCredits.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total Outflow (Debits)</span>
                  <span className="text-base font-bold font-mono text-rose-400 mt-1 block">
                    -₹{(totalBankDebits + totalUpiSpent).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200">Category Spend Distribution</div>
                <div className="space-y-2.5">
                  {Object.entries(categoryTotals).map(([cat, amount]) => {
                    const totalDebit = totalBankDebits + totalUpiSpent;
                    const percentage = totalDebit > 0 ? Math.round((amount / totalDebit) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>{cat}</span>
                          <span className="font-mono text-slate-200">₹{amount.toLocaleString()} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full" 
                            style={{ width: `${Math.max(4, percentage)}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* DRAWERS FOR STATEMENT REVIEWS MATCHING DRAW.IO SPECIFICATION */}
      <BankStatementsDrawer
        isOpen={isBankReviewOpen}
        onClose={() => setIsBankReviewOpen(false)}
      />

      <UpiStatementsDrawer
        isOpen={isUpiReviewOpen}
        onClose={() => setIsUpiReviewOpen(false)}
      />

      <CreditCardStatementsDrawer
        isOpen={isCreditCardReviewOpen}
        onClose={() => setIsCreditCardReviewOpen(false)}
      />

      {/* MODAL TO REVIEW STATEMENT CLASSIFICATION BEFORE PROCESSING */}
      <StatementReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        pendingItems={pendingStatementsToReview}
        onConfirm={handleConfirmReview}
        onUploadAnother={() => fileInputRef.current?.click()}
      />

      {/* PASSWORD PROMPT MODAL FOR ENCRYPTED STATEMENTS */}
      <PasswordPromptModal
        isOpen={!!lockedFileJob}
        fileName={lockedFileJob?.file.name || ''}
        fileSize={lockedFileJob ? `${Math.max(1, Math.round(lockedFileJob.file.size / 1024))} KB` : undefined}
        isIncorrect={lockedFileJob?.isIncorrect || false}
        remainingCount={lockedFileJob?.remainingFiles.length || 0}
        onUnlock={handleUnlockPasswordFile}
        onCancel={handleCancelPasswordPrompt}
      />

      {/* SEPARATE CSV VAULT & 3-TIER ON-DEMAND SYNC MODAL */}
      <CsvVaultModal
        isOpen={isCsvVaultOpen}
        initialTab={csvVaultInitialTab}
        onClose={() => setIsCsvVaultOpen(false)}
        onSyncComplete={() => {
          setUploadFeedback('Synchronized separate statement CSVs into Ledger.');
          setTimeout(() => setUploadFeedback(null), 4000);
        }}
      />

      {/* TRANSACTION ADAPTIVE DETAILS & TAG EDITOR MODAL */}
      <TagEditorModal
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSaveDetails={(id, updates) => {
          updateTransactionDetails(id, updates);
          setUploadFeedback('Updated transaction details (From, To & Tag)');
          setTimeout(() => setUploadFeedback(null), 3000);
        }}
      />

    </div>
  );
};
