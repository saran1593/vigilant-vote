'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { BadgeCheck, ShieldCheck, Loader2 } from 'lucide-react';

export default function VoterIdGate({ onChange }: { onChange: (verified: boolean) => void }) {
  const [verified, setVerified] = useState(false);
  const [info, setInfo] = useState<any>(null);
  const [epic, setEpic] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/auth/voter-status')
      .then((d) => {
        setVerified(d.verified);
        setInfo(d);
        onChange(d.verified);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const d = await apiRequest('/auth/voter-id', {
        method: 'POST',
        body: JSON.stringify({ epic, name })
      });
      setVerified(true);
      setInfo(d);
      onChange(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  if (verified) {
    return (
      <div className="mb-8 inline-flex flex-wrap items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
        <BadgeCheck className="w-4 h-4" />
        Verified against electoral roll (ID ending {info?.last4})
        {info?.district && <span className="text-emerald-200/80">• Registered booth: {info.district}, {info.booth}</span>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mb-10 bg-slate-900/70 backdrop-blur-xl border border-amber-400/30 p-6 rounded-2xl">
      <h3 className="font-bold flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-amber-300" /> Verify yourself against the electoral roll
      </h3>
      <p className="text-xs text-slate-300 mb-4">
        Enter your voter ID and your name as printed on it. Your ID is stored only as a one-way hash, and you can file complaints only for your registered booth.
      </p>
      {error && <p className="text-xs text-rose-300 mb-3">{error}</p>}
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          value={epic}
          onChange={(e) => setEpic(e.target.value.toUpperCase())}
          maxLength={10}
          placeholder="Voter ID (ABC1234567)"
          required
          className="p-3 rounded-xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 text-sm outline-none tracking-widest"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name on voter ID"
          required
          className="p-3 rounded-xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
        </button>
      </div>
    </form>
  );
}