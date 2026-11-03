'use client';
import { useState } from 'react';
import { apiRequest } from '@/utils/api';
import { UserSearch, Loader2, AlertTriangle } from 'lucide-react';

export default function IdentityRevealPanel({ complaintId }: { complaintId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const reveal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/admin/complaints/${complaintId}/reveal-identity`, {
        method: 'POST',
        body: JSON.stringify({ reason, password })
      });
      setResult(data);
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
        <UserSearch className="w-4 h-4" /> Reporter Identity (restricted)
      </h5>

      {result ? (
        <div className="p-5 bg-slate-950/70 border border-rose-400/30 rounded-2xl text-sm space-y-1">
          <p><span className="text-slate-400">Email:</span> <span className="font-bold text-white">{result.email}</span></p>
          <p><span className="text-slate-400">Voter ID ends with:</span> {result.voterIdLast4 || '-'}</p>
          <p><span className="text-slate-400">Registered booth:</span> {result.registeredDistrict || '-'}, {result.registeredBooth || '-'}</p>
          <p><span className="text-slate-400">False reports:</span> {result.falseReports} / 3 {result.isBlocked && <span className="text-rose-300 font-bold">(BLOCKED)</span>}</p>
          <p className="text-[11px] text-slate-500 pt-2">This reveal has been recorded in the audit log.</p>
        </div>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-5 py-3 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 text-xs font-bold hover:bg-rose-500/20"
        >
          Reveal reporter (false report only)
        </button>
      ) : (
        <form onSubmit={reveal} className="space-y-3 p-5 bg-slate-950/60 border border-white/15 rounded-2xl">
          <p className="text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            Allowed only for complaints proven false. This action is permanently logged with your reason.
          </p>
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for revealing identity (min 10 characters)"
            required
            className="w-full min-h-[70px] p-3 rounded-xl border border-white/15 bg-slate-950 text-white placeholder:text-slate-500 text-sm outline-none resize-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            className="w-full p-3 rounded-xl border border-white/15 bg-slate-950 text-white placeholder:text-slate-500 text-sm outline-none"
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-3 rounded-xl border border-white/15 text-xs font-bold hover:bg-white/10">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reveal and log'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}