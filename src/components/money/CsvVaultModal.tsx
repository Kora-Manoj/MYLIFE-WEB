import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatToDisplayDate } from '../../utils/statementProcessor';
import { 
  X, 
  Database, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  FileSpreadsheet,
  Building2,
  QrCode,
  CreditCard,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Check,
  Search,
  Filter
} from 'lucide-react';

interface CsvVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
  initialTab?: 'separate' | 'category' | 'sync_audit';
}

export const CsvVaultModal: React.FC<CsvVaultModalProps> = ({ 
  isOpen, 
  onClose, 
  onSyncComplete,
  initialTab = 'separate' 
}) => {
  const { 
    csvVaultItems, 
    downloadSingleStatementCsv, 
    syncStatementCsvs,
    getCategoryDraftCsv,
    downloadCategoryDraftCsv,
    downloadConsolidatedAllTransactionsCsv,
    crossSourceMatches,
    normalizedDataset,
    showReducedRepeats,
    setShowReducedRepeats
  } = useApp();

  const [activeTab, setActiveTab] = useState<'separate' | 'category' | 'sync_audit'>(initialTab);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => 
    csvVaultItems.map(item => item.statementId)
  );

  // Category Draft preview state
  const [previewCategory, setPreviewCategory] = useState<'bank' | 'upi' | 'credit_card' | null>(null);

  if (!isOpen) return null;

  const toggleSelect = (statementId: string) => {
    setSelectedIds(prev => 
      prev.includes(statementId) 
        ? prev.filter(id => id !== statementId)
        : [...prev, statementId]
    );
  };

  const selectAll = () => {
    setSelectedIds(csvVaultItems.map(item => item.statementId));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleSyncSelected = () => {
    syncStatementCsvs(selectedIds);
    if (onSyncComplete) onSyncComplete();
    onClose();
  };

  const totalSelectedRecords = csvVaultItems
    .filter(item => selectedIds.includes(item.statementId))
    .reduce((sum, item) => sum + item.recordsCount, 0);

  // Category drafts data
  const bankDraft = getCategoryDraftCsv('bank');
  const upiDraft = getCategoryDraftCsv('upi');
  const cardDraft = getCategoryDraftCsv('credit_card');

  const totalAllTxs = normalizedDataset.length;
  const reducedRepeatsCount = normalizedDataset.filter(r => r.isRepeatReduced).length;
  const netUniqueTxs = totalAllTxs - reducedRepeatsCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>3-Tier CSV Pipeline &amp; Sync Matrix</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-400/15 text-sky-300 border border-sky-400/25">
                  {csvVaultItems.length} Sources Saved
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Separate CSVs &rarr; Category Draft CSVs &rarr; Consolidated All Transactions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Tier Pipeline Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('separate')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'separate'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1. Separate CSVs ({csvVaultItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('category')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'category'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Category Drafts (3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync_audit')}
            className={`py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'sync_audit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Sync &amp; Repeats ({crossSourceMatches.length})</span>
          </button>
        </div>

        {/* TAB 1: SEPARATE STATEMENT CSVS */}
        {activeTab === 'separate' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Protection Explainer Bar */}
            <div className="px-4 py-2 bg-sky-400/5 border-b border-sky-400/15 flex items-start gap-2 text-[10px] text-sky-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
              <span>
                <strong>Separate CSV per Statement:</strong> We keep an isolated CSV for every uploaded Bank, UPI, and Credit Card statement. No risk of accidental loss or layout confusion.
              </span>
            </div>

            {/* Selection Toolbar */}
            <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] text-slate-400 hover:text-slate-300 font-medium cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedIds.length} of {csvVaultItems.length} selected ({totalSelectedRecords} txns)
              </span>
            </div>

            {/* Items List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
              {csvVaultItems.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-slate-400">
                  <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No separate CSVs saved yet</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Process or upload your bank, UPI, or credit card statements to automatically generate and save separate CSV files.
                  </p>
                </div>
              ) : (
                csvVaultItems.map((item) => {
                  const isSelected = selectedIds.includes(item.statementId);

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-slate-950/90 border-sky-400/40 shadow-sm' 
                          : 'bg-slate-950/50 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div 
                          onClick={() => toggleSelect(item.statementId)}
                          className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                        >
                          <button
                            type="button"
                            className="text-sky-400 focus:outline-none"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-sky-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>

                          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                            {item.category === 'bank' ? (
                              <Building2 className="w-3.5 h-3.5 text-amber-400" />
                            ) : item.category === 'upi' ? (
                              <QrCode className="w-3.5 h-3.5 text-sky-400" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                            )}
                          </div>

                          <div className="truncate min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                              <span>{item.entityName}</span>
                              <span className="text-[9px] font-mono text-slate-400 font-normal">
                                ({item.category.toUpperCase()})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate font-mono">
                              {item.fileName} · {item.recordsCount} txns
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Download Single CSV button */}
                          <button
                            type="button"
                            onClick={() => downloadSingleStatementCsv(item.statementId)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 hover:text-sky-200 transition-colors cursor-pointer"
                            title={`Download separate CSV: ${item.fileName}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                            item.isSynced 
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                              : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                          }`}>
                            {item.isSynced ? 'Synced' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Metrics Bar */}
                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-emerald-400">
                          Inflow: +₹{item.totalCredit.toLocaleString()}
                        </span>
                        <span className="text-rose-400">
                          Outflow: -₹{item.totalDebit.toLocaleString()}
                        </span>
                        <span className="text-slate-500">
                          Saved: {item.savedAt}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSyncSelected}
                disabled={selectedIds.length === 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync {selectedIds.length} CSVs to Ledger</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY DRAFT CSVS */}
        {activeTab === 'category' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 bg-amber-400/5 border-b border-amber-400/15 flex items-start gap-2 text-[10px] text-amber-300">
              <Layers className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Category Draft CSVs:</strong> After extracting all statements, we draft a single CSV for each category (Bank, UPI, Credit Cards) ordered strictly by Date and Time.
              </span>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
              {/* Bank Category Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-amber-400/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        Draft Bank Category CSV
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        {bankDraft.fileName} · {bankDraft.recordsCount} transactions
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCategoryDraftCsv('bank')}
                    disabled={bankDraft.recordsCount === 0}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Total Credit:</span>
                    <span className="text-emerald-400 font-bold">+₹{bankDraft.totalCredit.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Total Debit:</span>
                    <span className="text-rose-400 font-bold">-₹{bankDraft.totalDebit.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Sort Order:</span>
                    <span className="text-amber-300">Date &amp; Time (Desc)</span>
                  </div>
                </div>
              </div>

              {/* UPI Category Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-sky-400/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        Draft UPI Category CSV
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        {upiDraft.fileName} · {upiDraft.recordsCount} transactions
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCategoryDraftCsv('upi')}
                    disabled={upiDraft.recordsCount === 0}
                    className="px-3 py-1.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Total Received:</span>
                    <span className="text-emerald-400 font-bold">+₹{upiDraft.totalCredit.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Total Spent:</span>
                    <span className="text-rose-400 font-bold">-₹{upiDraft.totalDebit.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Columns:</span>
                    <span className="text-sky-300">UTR, Payee, Purpose</span>
                  </div>
                </div>
              </div>

              {/* Credit Card Category Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 hover:border-purple-400/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        Draft Credit Cards Category CSV
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        {cardDraft.fileName} · {cardDraft.recordsCount} transactions
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCategoryDraftCsv('credit_card')}
                    disabled={cardDraft.recordsCount === 0}
                    className="px-3 py-1.5 rounded-xl bg-purple-400 hover:bg-purple-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Payments:</span>
                    <span className="text-emerald-400 font-bold">+₹{cardDraft.totalCredit.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Spends:</span>
                    <span className="text-rose-400 font-bold">-₹{cardDraft.totalDebit.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span className="text-slate-500 block">Merchant:</span>
                    <span className="text-purple-300">Clean Narration</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Ready to reconcile into single consolidated CSV?
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('sync_audit')}
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Proceed to Step 3 (Sync &amp; Deduplication)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CONSOLIDATED ALL TRANSACTIONS & SYNC DEBUG MATRIX */}
        {activeTab === 'sync_audit' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-start justify-between gap-2 text-[10px] text-emerald-300">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  <strong>Sync &amp; Repeat Reduction Matrix:</strong> Cross-references Bank debits with UPI transactions and CC bill settlements to eliminate double counting. Full transparency to debug extraction mistakes!
                </span>
              </div>
              <button
                type="button"
                onClick={downloadConsolidatedAllTransactionsCsv}
                disabled={totalAllTxs === 0}
                className="px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download All Txs CSV</span>
              </button>
            </div>

            {/* Deduplication Summary Stats */}
            <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Gross Extracted:</span>
                <span className="font-bold text-slate-200 text-sm">{totalAllTxs} txns</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30">
                <span className="text-[10px] text-amber-300 block font-mono">Repeats Reduced:</span>
                <span className="font-bold text-amber-400 text-sm">-{reducedRepeatsCount} txns</span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 block font-mono">Net Consolidated:</span>
                <span className="font-bold text-emerald-400 text-sm">{netUniqueTxs} unique</span>
              </div>
            </div>

            {/* Repeat Reduction List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Cross-Source Overlap Audit Log ({crossSourceMatches.length} Matches)
                </span>
                <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReducedRepeats}
                    onChange={(e) => setShowReducedRepeats(e.target.checked)}
                    className="rounded border-slate-700 text-amber-400 focus:ring-0"
                  />
                  <span>Show Reduced Repeats in Ledger</span>
                </label>
              </div>

              {crossSourceMatches.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1.5">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Zero Overlapping Repeats Detected</p>
                  <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                    All transactions across your bank, UPI, and credit card statements are distinct. No duplicate payments or double counts were detected.
                  </p>
                </div>
              ) : (
                crossSourceMatches.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-amber-400/30 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-amber-300">
                          {m.matchType === 'bank_upi_overlap' 
                            ? 'Bank <-> UPI Payment Overlap' 
                            : m.matchType === 'bank_cc_settlement'
                              ? 'Credit Card Bill Settlement'
                              : 'Exact Duplicate Detected'}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400">
                        ₹{m.amount.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      {m.reason}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                      <span>Primary: <strong className="text-slate-200">{m.primarySourceName}</strong></span>
                      <span>Companion: <strong className="text-slate-200">{m.companionSourceName}</strong></span>
                      <span>Date: <strong className="text-slate-200">{formatToDisplayDate(m.date)}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={downloadConsolidatedAllTransactionsCsv}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Consolidated All Txs CSV</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
