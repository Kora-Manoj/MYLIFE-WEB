import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Trash2, 
  Info,
  QrCode,
  FileText,
  Download
} from 'lucide-react';

interface UpiStatementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpiStatementsDrawer: React.FC<UpiStatementsDrawerProps> = ({ isOpen, onClose }) => {
  const { upiStatements, deleteUpiStatement, reclassifyStatement, downloadSingleStatementCsv } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header: Review UPI Statements */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Review UPI Statements
              </h3>
              <p className="text-[10px] text-slate-400">
                {upiStatements.length} UPI statements classified & ready
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
        <div className="px-4 py-2 bg-amber-400/5 border-b border-amber-400/10 flex items-center gap-2 text-[10px] text-amber-300">
          <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Review your classified UPI statements (PhonePe, GPay, Paytm) before batch processing.</span>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {upiStatements.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                <QrCode className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs font-medium">No UPI statements uploaded yet.</p>
              <p className="text-slate-500 text-[10px]">Use the single Upload section on the main screen to upload UPI statements.</p>
            </div>
          ) : (
            upiStatements.map((statement, idx) => (
              <div 
                key={statement.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/40 transition-all flex flex-col gap-2 relative group"
              >
                {/* Row Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      {statement.upiApp}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({statement.upiId})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Download Isolated Statement CSV */}
                    <button
                      type="button"
                      onClick={() => downloadSingleStatementCsv(statement.id)}
                      className="w-7 h-7 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Download separate statement CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      statement.status === 'processed' 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                    }`}>
                      {statement.status === 'processed' ? 'Reconciled' : 'Ready'}
                    </span>
                    <button
                      onClick={() => deleteUpiStatement(statement.id)}
                      className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                      title={`Remove ${statement.upiApp} statement`}
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

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Total Spent</span>
                    <span className="text-rose-400 font-bold">-₹{statement.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px]">Total Received</span>
                    <span className="text-emerald-400 font-bold">+₹{statement.totalReceived.toLocaleString()}</span>
                  </div>
                </div>

                {/* File Details & Quick Re-classify */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-900">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{statement.fileName}</span>
                    <span className="text-slate-600">({statement.fileSize})</span>
                  </div>

                  {/* Re-classify dropdown/buttons if misclassified */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-slate-500">Move:</span>
                    <button
                      type="button"
                      onClick={() => reclassifyStatement(statement.id, 'upi', 'bank')}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-amber-300 border border-slate-800 hover:border-amber-400/40 cursor-pointer"
                      title="Move statement to Bank Review List"
                    >
                      Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => reclassifyStatement(statement.id, 'upi', 'credit_card')}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-purple-300 border border-slate-800 hover:border-purple-400/40 cursor-pointer"
                      title="Move statement to Credit Card Review List"
                    >
                      Cards
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
            {upiStatements.length} UPI statement{upiStatements.length === 1 ? '' : 's'} reviewed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>

      </div>
    </div>
  );
};
