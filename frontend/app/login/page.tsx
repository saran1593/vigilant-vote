'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFingerprint } from '@/utils/fingerprint';
import { apiRequest } from '@/utils/api';
import { Shield, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [bindFingerprint, setBindFingerprint] = useState(true);
  const router = useRouter();

  const [loginMode, setLoginMode] = useState<'voter' | 'admin'>('voter');
  const [password, setPassword] = useState('');

  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (loginMode === 'admin') {
        
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'superadmin') router.push('/super-admin');
        else router.push('/admin');
      } else if (step === 1) {
        
        await apiRequest('/auth/request-otp', {
          method: 'POST',
          body: JSON.stringify({ 
            email, 
            fingerprint: bindFingerprint ? fingerprint : null 
          }),
        });
        setStep(2);
      } else {
        
        const data = await apiRequest('/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, otp, fingerprint }),
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-3xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl blue-gradient flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button 
            onClick={() => { setLoginMode('voter'); setStep(1); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === 'voter' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
          >
            Voter Login
          </button>
          <button 
            onClick={() => setLoginMode('admin')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === 'admin' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
          >
            Official Login
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">
          {loginMode === 'voter' ? 'Voter Portal' : 'Administrative Access'}
        </h2>
        <p className="text-muted text-center mb-8 text-sm">
          {loginMode === 'admin' ? 'Authorized personnel only.' : step === 1 ? 'Verify your identity via Email OTP.' : 'Enter the code sent to your email.'}
        </p>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl mb-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {loginMode === 'admin' ? (
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
                <input
                  type="password"
                  placeholder="Official Password"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            ) : step === 1 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-border/50">
                <input
                  type="checkbox"
                  id="fp-bind"
                  checked={bindFingerprint}
                  onChange={(e) => setBindFingerprint(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="fp-bind" className="text-xs text-muted leading-tight">
                  <span className="font-semibold block text-foreground mb-0.5">Secure Session Locking</span>
                  Bind OTP to this specific device
                </label>
              </div>
            ) : (
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
                <input
                  type="text"
                  placeholder="6-Digit OTP"
                  maxLength={6}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 text-center text-2xl font-bold tracking-[0.5em]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {loginMode === 'admin' ? 'Authenticate' : step === 1 ? 'Send OTP' : 'Verify & Continue'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {loginMode === 'voter' && step === 2 && (
          <button 
            onClick={() => setStep(1)}
            className="w-full mt-4 text-sm text-primary font-medium hover:underline"
          >
            Change Email
          </button>
        )}
      </div>
    </div>
  );
}
