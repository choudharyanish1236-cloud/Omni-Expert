
import React, { useState, useMemo } from 'react';
import { BotIcon } from './Icons';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Secure hashing utility
  const hashPassword = async (pwd: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Password strength calculation
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length > 7) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-slate-700';
    if (strength <= 2) return 'bg-rose-500';
    if (strength === 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Operational credentials required. Please complete all fields.');
      return;
    }

    setIsProcessing(true);
    try {
      const hashed = await hashPassword(password);
      const users = JSON.parse(localStorage.getItem('omni_users') || '{}');

      if (isLogin) {
        const storedValue = users[username];
        const storedHash = typeof storedValue === 'object' ? storedValue.hash : storedValue;
        
        if (storedHash === hashed || storedHash === password) {
          const userData = typeof storedValue === 'object' ? storedValue : { hash: storedValue };
          onLogin({ 
            username, 
            id: username,
            email: userData.email,
            profilePicture: userData.profilePicture
          });
        } else {
          setError('Authorization failed. Invalid username or signature.');
        }
      } else {
        if (users[username]) {
          setError('Identifier already allocated. Choose another username.');
        } else {
          users[username] = { hash: hashed, email: '', profilePicture: '' };
          localStorage.setItem('omni_users', JSON.stringify(users));
          onLogin({ username, id: username });
        }
      }
    } catch (err) {
      setError('Cryptographic subsystem error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020617] p-4 font-inter">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl shadow-[0_0_50px_-12px_rgba(37,99,235,0.15)] backdrop-blur-xl p-8">
        <div className="flex flex-col items-center mb-10">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-5 shadow-2xl shadow-blue-500/20 ring-1 ring-white/10">
            <BotIcon />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
            {isLogin ? 'Node Access' : 'Create Identity'}
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
            OmniExpert Security Protocol v3.5
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-600 outline-none"
              placeholder="operator_alpha"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Key</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-600 outline-none pr-12"
                placeholder="••••••••"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88L14.12 14.12"/><path d="M2 2L22 22"/><path d="M10.37 10.37a4 4 0 0 0 5.26 5.26"/><path d="M22 12a10 10 0 0 0-16.12-7.88"/><path d="M15 15.63l-.33-.33A10 10 0 0 1 2 12a10 10 0 0 1 3.51-3.51"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            
            {!isLogin && password && (
              <div className="flex gap-1 mt-2 px-1">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${step <= strength ? getStrengthColor() : 'bg-slate-800'}`} 
                  />
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold rounded-xl animate-in fade-in zoom-in duration-200 uppercase tracking-tighter">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all relative overflow-hidden group ${
              isProcessing 
                ? 'bg-slate-800 text-slate-500 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            <span className={isProcessing ? 'opacity-0' : 'opacity-100'}>
              {isLogin ? 'Establish Link' : 'Register Operator'}
            </span>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setPassword('');
            }}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Missing Identity? Sign Up" : 'Authorized Personnel? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
