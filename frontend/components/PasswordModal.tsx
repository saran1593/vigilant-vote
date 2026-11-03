'use client';
import { useState } from 'react';
import { ShieldCheck, Lock, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/utils/api';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  email: string;
}

export default function PasswordModal({ isOpen, onClose, onVerify, email }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRequest('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      onVerify();
      onClose();
      setPassword('');
      setShow(false);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShow(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm p-8 rounded-3xl shadow-2xl bg-slate-900 border border-white/20 text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
            <Lock className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold mb-2 text-white">Re-authentication Required</h3>
        <p className="text-sm text-slate-300 mb-6">
          Please enter your official password to decrypt this sensitive grievance.
        </p>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Your Password"
              autoComplete="current-password"
              className="w-full p-4 pr-12 rounded-xl border border-white/20 bg-slate-950 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              title={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Verify & Decrypt</>}
          </button>
        </form>
      </div>
    </div>
  );
}