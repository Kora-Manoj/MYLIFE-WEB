import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogIn, UserPlus, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { authMode, setAuthMode, signIn, signUp } = useApp();
  const [email, setEmail] = useState('koramanojkumar15720@gmail.com');
  const [name, setName] = useState('Manoj Kumar');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    if (authMode === 'signup') {
      if (!name) {
        setError('Please provide your full name.');
        return;
      }
      signUp(name, email);
    } else {
      signIn(email, name);
    }
  };

  const handleDemoSignIn = () => {
    signIn('koramanojkumar15720@gmail.com', 'Manoj Kumar');
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-200 my-auto">
      {/* Brand & Badge */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-400 text-xl shadow-lg mb-3">
          M
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          {authMode === 'signup' ? 'Create Your Account' : authMode === 'signed_out' ? 'You Have Signed Out' : 'Welcome to MYLIFE'}
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          {authMode === 'signup'
            ? 'Unified system for Money, Knowledge, Health, Documents & Action Planning.'
            : authMode === 'signed_out'
            ? 'Sign back in to access your personal dashboard and statements.'
            : 'Access your integrated life management system.'}
        </p>
      </div>

      {/* Mode Switch Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setAuthMode('signin');
            setError('');
          }}
          className={`py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            authMode !== 'signup'
              ? 'bg-slate-800 text-amber-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('signup');
            setError('');
          }}
          className={`py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            authMode === 'signup'
              ? 'bg-slate-800 text-amber-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Sign Up</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === 'signup' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Manoj Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-2 mt-2"
        >
          <span>{authMode === 'signup' ? 'Create Account' : 'Sign In to MYLIFE'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Login Option */}
      <div className="mt-6 pt-5 border-t border-slate-800 text-center">
        <button
          type="button"
          onClick={handleDemoSignIn}
          className="w-full py-2 px-3 rounded-lg border border-slate-700 hover:border-amber-400/50 bg-slate-950/60 text-xs font-medium text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Demo Sign In (Manoj Kumar)</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <span>Draw.io Auth Flow</span>
        <span aria-hidden="true">·</span>
        <span>Secure Local Session</span>
      </div>
    </div>
  );
};
