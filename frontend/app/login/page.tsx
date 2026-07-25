'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFingerprint } from '@/utils/fingerprint';
import { apiRequest } from '@/utils/api';
import { Shield, Mail, Lock, Loader2, ArrowRight, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
    <div 
      className="relative min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-4 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-blue-950/75 to-slate-900/85 backdrop-blur-[3px]" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 sm:p-10 text-white">
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg mb-4 border border-white/20">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-center text-white">
            {loginMode === 'voter' ? 'Voter Login' : 'Admin Login'}
          </h2>
          <p className="text-slate-300 text-center text-xs mt-1">
            {loginMode === 'admin' 
              ? 'Authorized administrative personnel' 
              : step === 1 
                ? 'Enter your email to receive a 6-digit OTP' 
                : `Enter the code sent to ${email}`}
          </p>
        </div>

        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/10 mb-6">
          <button 
            type="button"
            onClick={() => { setLoginMode('voter'); setStep(1); setError(''); }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              loginMode === 'voter' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Voter
          </button>
          <button 
            type="button"
            onClick={() => { setLoginMode('admin'); setError(''); }}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              loginMode === 'admin' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Official
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs p-3.5 rounded-xl mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/15 focus:ring-2 focus:ring-blue-400/40 outline-none bg-slate-950/60 text-white placeholder:text-slate-400 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {loginMode === 'admin' ? (
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/15 focus:ring-2 focus:ring-blue-400/40 outline-none bg-slate-950/60 text-white placeholder:text-slate-400 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            ) : step === 1 ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/10">
                <input
                  type="checkbox"
                  id="fp-bind"
                  checked={bindFingerprint}
                  onChange={(e) => setBindFingerprint(e.target.checked)}
                  className="w-4 h-4 text-blue-500 rounded border-white/30 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="fp-bind" className="text-xs text-slate-300 cursor-pointer select-none">
                  <span className="font-semibold block text-white">Bind session to this device</span>
                  Prevents unauthorized login from other browsers
                </label>
              </div>
            ) : (
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="6-Digit OTP"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/15 focus:ring-2 focus:ring-blue-400/40 outline-none bg-slate-950/60 text-white placeholder:text-slate-500 text-center text-xl font-bold tracking-[0.4em]"
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
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{loginMode === 'admin' ? 'Login' : step === 1 ? 'Send OTP' : 'Verify & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {loginMode === 'voter' && step === 2 && (
          <button 
            type="button"
            onClick={() => { setStep(1); setOtp(''); setError(''); }}
            className="w-full mt-4 text-xs text-blue-300 hover:text-white font-medium transition-colors text-center block"
          >
            Change email address
          </button>
        )}
      </div>
    </div>
  );
}

