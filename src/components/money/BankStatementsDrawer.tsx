import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BankAccountType } from '../../types';
import { 
  X, 
  Building2, 
  Trash2, 
  Info,
  Calendar,
  CheckCircle2,
  ArrowRightLeft,
  FileText,
  Download,
  BookOpen,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';

interface BankStatementsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCOUNT_TYPE_CONFIG: Record<BankAccountType, { label: string; desc: string; badge: string }> = {
  savings: { label: 'Savings Account', desc: 'Everyday personal savings & transactions', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  current: { label: 'Current Account', desc: 'Business, traders & high daily volume', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  salary: { label: 'Salary Account', desc: 'Corporate salary with zero minimum balance', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  fd: { label: 'Fixed Deposit (FD)', desc: 'Term lump sum deposit for higher interest', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  rd: { label: 'Recurring Deposit (RD)', desc: 'Regular monthly periodic savings', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  nre: { label: 'NRI Account (NRE)', desc: 'Non-Resident External repatriable account', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  nro: { label: 'NRI Account (NRO)', desc: 'Non-Resident Ordinary domestic income', badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30' },
  fcnr: { label: 'NRI Account (FCNR)', desc: 'Foreign Currency term deposit account', badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30' }
};

export const BankStatementsDrawer: React.FC<BankStatementsDrawerProps> = ({ isOpen, onClose }) => {
  const { bankStatements, deleteBankStatement, updateBankAccountType, reclassifyStatement, downloadSingleStatementCsv } = useApp();
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Bank Accounts &amp; Statements Portfolio
              </h3>
              <p className="text-[10px] text-slate-400">
                {bankStatements.length} account statement{bankStatements.length === 1 ? '' : 's'} managed across banks (SBI, HDFC, ICICI, SIB...)
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

        {/* Guide Toggle Banner (Part 1 & Part 2 Bank Account Rules) */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setShowGuide(prev => !prev)}
            className="w-full flex items-center justify-between text-xs text-amber-300 font-semibold cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Guide: Bank Account Types &amp; Multi-Bank Limits</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
          </button>

          {showGuide && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-2.5 animate-in fade-in">
              <div>
                <strong className="text-amber-400 block mb-0.5">Part 1: Types of Bank Accounts Available</strong>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">Savings:</strong> Everyday personal savings with modest interest.</li>
                  <li><strong className="text-slate-200">Current:</strong> Business/trader accounts with high daily volume, no interest.</li>
                  <li><strong className="text-slate-200">Salary:</strong> Corporate zero-minimum-balance payroll accounts.</li>
                  <li><strong className="text-slate-200">FD &amp; RD:</strong> Term deposits &amp; recurring monthly savings.</li>
                  <li><strong className="text-slate-200">NRI Accounts:</strong> NRE, NRO, and FCNR foreign &amp; domestic funds.</li>
                </ul>
              </div>

              <div>
                <strong className="text-amber-400 block mb-0.5">Part 2: Multiple Accounts Across Banks</strong>
                <p className="text-slate-400">
                  RBI imposes <strong className="text-slate-200">no limit</strong> on total accounts across different banks (SBI, HDFC, ICICI, SIB). Within the same bank, you can hold multiple FDs, RDs, or a Savings + Current account combination.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
          {bankStatements.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs font-medium">No bank accounts / statements added yet.</p>
              <p className="text-slate-500 text-[10px]">Upload your bank statement files in the Statement Upload Center.</p>
            </div>
          ) : (
            bankStatements.map((statement, idx) => {
              const currentAccType = statement.accountType || 'savings';
              const config = ACCOUNT_TYPE_CONFIG[currentAccType] || ACCOUNT_TYPE_CONFIG.savings;

              return (
                <div 
                  key={statement.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/40 transition-all space-y-3 group shadow-md"
                >
                  {/* Row Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-xl bg-slate-800 text-amber-300 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-sm font-bold text-slate-100 truncate block">
                          {statement.bankName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          A/c: {statement.accountNumberMasked}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadSingleStatementCsv(statement.id)}
                        className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors cursor-pointer"
                        title="Download separate statement CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBankStatement(statement.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title={`Remove ${statement.bankName} account`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Account Type Selector Dropdown */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Account Classification Type:
                      </label>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>

                    <select
                      value={currentAccType}
                      onChange={(e) => updateBankAccountType(statement.id, e.target.value as BankAccountType)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
                    >
                      <option value="savings">Savings Account (Personal Everyday)</option>
                      <option value="current">Current Account (Business &amp; Traders)</option>
                      <option value="salary">Salary Account (Corporate Payroll)</option>
                      <option value="fd">Fixed Deposit (FD) Account</option>
                      <option value="rd">Recurring Deposit (RD) Account</option>
                      <option value="nre">NRI Account - NRE (Repatriable)</option>
                      <option value="nro">NRI Account - NRO (Domestic Income)</option>
                      <option value="fcnr">NRI Account - FCNR (Foreign Currency)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 italic">
                      {config.desc}
                    </p>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
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
                      <span className="text-slate-500 block text-[9px]">Total Credit Inflow</span>
                      <span className="text-emerald-400 font-bold">+₹{statement.totalCredit.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[9px]">Total Debit Outflow</span>
                      <span className="text-rose-400 font-bold">-₹{statement.totalDebit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* File & Re-classify */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                      <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{statement.fileName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-500">Move:</span>
                      <button
                        type="button"
                        onClick={() => reclassifyStatement(statement.id, 'bank', 'upi')}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-amber-300 border border-slate-800 cursor-pointer"
                      >
                        UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => reclassifyStatement(statement.id, 'bank', 'credit_card')}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[9px] text-purple-300 border border-slate-800 cursor-pointer"
                      >
                        Cards
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400">
            {bankStatements.length} Bank Account{bankStatements.length === 1 ? '' : 's'} managed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Done Portfolio
          </button>
        </div>

      </div>
    </div>
  );
};
