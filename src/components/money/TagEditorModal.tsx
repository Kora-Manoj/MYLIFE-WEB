import React, { useState } from 'react';
import { Transaction } from '../../types';
import { X, Tag, Check, Sparkles, ArrowRightLeft, User } from 'lucide-react';
import { formatToDisplayDate } from '../../utils/statementProcessor';

interface TagEditorModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveDetails: (id: string, updates: { tag: string; senderName: string; receiverName: string }) => void;
}

const PRESET_TAGS = [
  { name: 'Food', emoji: '🍔', desc: 'Dining, delivery, cafes & snacks' },
  { name: 'Travel', emoji: '✈️', desc: 'Flights, cabs, fuel, metro & trains' },
  { name: 'Health', emoji: '💊', desc: 'Doctor, pharmacy, lab tests & dental' },
  { name: 'Shopping', emoji: '🛍️', desc: 'Retail, apparel, electronics & gadgets' },
  { name: 'Groceries', emoji: '🥦', desc: 'Supermarkets, vegetables & daily essentials' },
  { name: 'Bills', emoji: '⚡', desc: 'Electricity, mobile recharge, gas & wifi' },
  { name: 'Investments', emoji: '📈', desc: 'Mutual funds, SIPs, stocks & gold' },
  { name: 'Salary', emoji: '💼', desc: 'Payroll, consulting & professional income' },
  { name: 'Rent', emoji: '🏠', desc: 'House rent, society maintenance & flat' },
  { name: 'Entertainment', emoji: '🎬', desc: 'Movies, streaming, games & events' },
  { name: 'Education', emoji: '📚', desc: 'Courses, books, tuition & fees' },
  { name: 'Personal', emoji: '👤', desc: 'Personal care, gifts & family expenses' },
  { name: 'Transfer', emoji: '🔄', desc: 'Self-transfer, friends & family payments' }
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSaveDetails
}) => {
  if (!isOpen || !transaction) return null;

  const [currentTag, setCurrentTag] = useState(transaction.tag || 'General');
  const [customTag, setCustomTag] = useState('');
  const [senderName, setSenderName] = useState(transaction.senderName || (transaction.type === 'credit' ? 'External Payer' : transaction.sourceName));
  const [receiverName, setReceiverName] = useState(transaction.receiverName || (transaction.type === 'credit' ? transaction.sourceName : 'Merchant / Recipient'));

  const handleSelectPreset = (tagName: string) => {
    setCurrentTag(tagName);
  };

  const handleSave = () => {
    const finalTag = customTag.trim() ? customTag.trim() : currentTag;
    onSaveDetails(transaction.id, {
      tag: finalTag,
      senderName,
      receiverName
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Adapt Transaction Ledger (From ➔ To) &amp; Tag
              </h3>
              <p className="text-[10px] text-slate-400">
                Customize sender, receiver, and purpose tag for accurate financial traversal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction summary banner */}
        <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="truncate pr-2">
            <div className="font-semibold text-slate-200 truncate">{transaction.description}</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span className="font-mono">{formatToDisplayDate(transaction.date)}</span>
              <span>·</span>
              <span className="text-amber-300 font-medium">{transaction.sourceName}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`font-mono font-bold text-sm ${transaction.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'}`}>
              {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
            </span>
            <div className="text-[10px] uppercase font-bold text-slate-400">{transaction.type}</div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800 text-xs">
          
          {/* 1. Adapt From & To Flow */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Adapt Transaction Flow (From ➔ To)</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-amber-400" />
                  <span>From (Sender / Origin)</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Sender name..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-400" />
                  <span>To (Receiver / Destination)</span>
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Receiver / Merchant..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* 2. Preset Tags Grid */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Select Purpose Tag
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_TAGS.map(preset => {
                const isSelected = currentTag.toLowerCase() === preset.name.toLowerCase() && !customTag.trim();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      handleSelectPreset(preset.name);
                      setCustomTag('');
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="text-sm shrink-0">{preset.emoji}</span>
                    <span className="text-xs truncate">{preset.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Tag Input */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Or Custom Purpose Tag</span>
            </label>
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="e.g. Dental Treatment, Client Dinner, Gym..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/50"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Ledger Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
