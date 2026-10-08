import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CreditCard, 
  FileText, 
  Trash2, 
  Info,
  Download
} from 'lucide-react';

interface CreditCardStatementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreditCardStatementsDrawer: React.FC<CreditCardStatementsDrawerProps> = ({ isOpen, onClose }) => {
  const { creditCardStatements, deleteCreditCardStatement, reclassifyStatement, downloadSingleStatementCsv } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header: Review Credit Card Statements */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Review Credit Card Statements
              </h3>
              <p className="text-[10px] text-slate-400">
                {creditCardStatements.length} credit card statements classified & ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Review guidance reminder */}
        <div className="px-4 py-2 bg-purple-400/5 border-b border-purple-400/10 flex items-center gap-2 text-[10px] text-purple-300">
          <Info className="w-3.5 h-3.5 shrink-0 text-purple-400" />
          <span>Review your classified credit card statements before batch processing into unified expenses.</span>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {creditCardStatements.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs font-medium">No credit card statements uploaded yet.</p>
              <p className="text-slate-500 text-[10px]">Use the single Upload section on the main screen to upload credit card statements.</p>
            </div>
          ) : (
            creditCardStatements.map((statement, idx) => (
              <div 
                key={statement.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col gap-2 relative group"
              >
                {/* Row Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-100">
                      {statement.cardName}
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 border border-purple-400/20 px-1.5 py-0.5 rounded">
                      {statement.cardNumberMasked}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Download Isolated Statement CSV */}
                    <button
                      type="button"
                      onClick={() => downloadSingleStatementCsv(statement.id)}
                      className="w-7 h-7 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Download separate statement CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      statement.status === 'processed'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {statement.status === 'processed' ? 'Reconciled' : 'Ready'}
                    </span>
                    <button
                      onClick={() => deleteCreditCardStatement(statement.id)}
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                      title={`Remove ${statement.cardName} statement`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Period</span>
                    <span className="text-slate-300">{statement.period}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px]">Transactions</span>
                    <span className="text-slate-300">{statement.transactionsCount} txs</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Total Spends</span>
                    <span className="font-bold text-rose-400">-₹{statement.totalSpends.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Payments</span>
                    <span className="font-bold text-emerald-400">+₹{statement.totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px]">Credit Limit</span>
                    <span className="font-bold text-purple-300">₹{(statement.creditLimit / 1000).toFixed(0)}k</span>
                  </div>
                </div>

                {/* File Details & Quick Re-classify */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-900">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">{statement.fileName}</span>
                    <span className="text-slate-600 font-mono">({statement.fileSize})</span>
                  </div>

                  {/* Re-classify dropdown/buttons if misclassified */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-500">Move:</span>
                    <button
                      type="button"
                      onClick={() => reclassifyStatement(statement.id, 'credit_card', 'bank')}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-amber-300 border border-slate-800 hover:border-amber-400/40 cursor-pointer"
                      title="Move statement to Bank Review List"
                    >
                      Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => reclassifyStatement(statement.id, 'credit_card', 'upi')}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-sky-300 border border-slate-800 hover:border-sky-400/40 cursor-pointer"
                      title="Move statement to UPI Review List"
                    >
                      UPI
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {creditCardStatements.length} Card statement{creditCardStatements.length === 1 ? '' : 's'} reviewed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-purple-500 text-slate-950 font-bold text-xs hover:bg-purple-400 transition-colors cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>

      </div>
    </div>
  );
};
