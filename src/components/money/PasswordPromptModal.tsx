import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  X, 
  AlertCircle, 
  KeyRound, 
  HelpCircle, 
  FileText, 
  ShieldAlert 
} from 'lucide-react';

interface PasswordPromptModalProps {
  isOpen: boolean;
  fileName: string;
  fileSize?: string;
  isIncorrect?: boolean;
  remainingCount?: number;
  onUnlock: (password: string) => Promise<void> | void;
  onCancel: () => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  fileName,
  fileSize,
  isIncorrect = false,
  remainingCount = 0,
  onUnlock,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, fileName]);

  useEffect(() => {
    if (isIncorrect) {
      setPassword('');
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isIncorrect]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    try {
      setIsSubmitting(true);
      await onUnlock(password.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Password-Protected Statement</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                Encrypted bank or credit card document
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* File indicator card */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {fileName}
                </div>
                {fileSize && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    {fileSize}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 shrink-0 font-bold">
              LOCKED PDF
            </span>
          </div>

          {/* Incorrect Password Alert */}
          {isIncorrect && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs animate-in shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Incorrect password</span>
                <span className="text-[11px] text-rose-300/90 leading-tight">
                  The password you entered could not decrypt this document. Please check the common formats below and try again.
                </span>
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Enter Statement Password</span>
              <button
                type="button"
                onClick={() => setShowHints(!showHints)}
                className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showHints ? 'Hide Hints' : 'Password Hints'}</span>
              </button>
            </label>

            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. DDMMYYYY, PAN, or name+DOB"
                autoFocus
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bank Password Cheat Sheet / Hints */}
          {showHints && (
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-[11px] space-y-1.5">
              <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider block">
                Common Bank Password Formats:
              </span>
              <ul className="space-y-1 text-slate-400 text-[10px] leading-tight">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong className="text-slate-200">SBI:</strong> 5-digit DOB (DDMM) + last 5 digits of mobile, OR 11-digit account number</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong className="text-slate-200">HDFC Bank:</strong> Customer ID (NetBanking) OR Date of Birth (DDMMYYYY)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong className="text-slate-200">ICICI Bank:</strong> First 4 lowercase letters of name + DOB (DDMM)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong className="text-slate-200">Axis Bank / Kotak:</strong> CRN number OR DOB (DDMMYYYY) OR uppercase name + last 4 digits</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">·</span>
                  <span><strong className="text-slate-200">Credit Cards:</strong> First 4 letters of name (UPPERCASE) + DOB (DDMM) OR PAN</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              {remainingCount > 0 ? `Skip & Proceed (${remainingCount} More)` : 'Skip File'}
            </button>
            <button
              type="submit"
              disabled={!password.trim() || isSubmitting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span>Decrypting...</span>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock & Decrypt</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
