'use client';
import { useState } from 'react';
import { ShieldCheck, Lock, X, Loader2 } from 'lucide-react';
import { apiRequest } from '@/utils/api';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  email: string;
}

export default function PasswordModal({ isOpen, onClose, onVerify, email }: PasswordModalProps) {
  const [password, setPassword] = useState('');
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
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-sm p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="w-12 h-12 rounded-xl blue-gradient flex items-center justify-center text-white">
            <Lock className="w-6 h-6" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <h3 className="text-xl font-bold mb-2">Re-authentication Required</h3>
        <p className="text-sm text-muted mb-6">Please enter your official password to decrypt this sensitive grievance.</p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              placeholder="Your Password"
              className="w-full p-4 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 blue-gradient text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Verify & Decrypt</>}
          </button>
        </form>
      </div>
    </div>
  );
}
