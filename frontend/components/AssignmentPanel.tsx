'use client';
import { useState } from 'react';
import { apiRequest } from '@/utils/api';
import { UserCheck, ClipboardList, Gavel, Loader2, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { openProtectedFile } from '@/utils/files';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE.replace(/\/api$/, '');

interface Props {
  complaint: any;
  officers: any[];
  onUpdated: () => void;
}

export default function AssignmentPanel({ complaint, officers, onUpdated }: Props) {
  const [officerId, setOfficerId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const closed = ['resolved', 'rejected'].includes(complaint.status);
  const verdictGiven = complaint.verdict?.result;
  const report = complaint.fieldReport;
  const reportSubmitted = !!report?.submittedAt;

  const assign = async () => {
    if (!officerId) return alert('Select an officer first');
    setBusy(true);
    try {
      await apiRequest(`/admin/complaints/${complaint.complaintId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ officerId })
      });
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const giveVerdict = async (result: 'genuine' | 'false') => {
    const msg = result === 'false'
      ? 'Mark as FALSE report? The voter will receive a strike.'
      : 'Mark as GENUINE and resolve this complaint?';
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/complaints/${complaint.complaintId}/verdict`, {
        method: 'PATCH',
        body: JSON.stringify({ result, note })
      });
      onUpdated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assignment */}
      <div>
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Field Officer
        </h5>
        <p className="text-sm text-slate-200 mb-3">
          {complaint.assignedOfficer
            ? <>Assigned to <span className="font-bold text-blue-300">{complaint.assignedOfficer.email}</span> ({complaint.assignedOfficer.district})</>
            : 'Not assigned yet'}
        </p>
        {!closed && !reportSubmitted && (
          <div className="flex gap-3">
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              className="flex-1 p-3 rounded-xl border border-white/15 bg-slate-950/70 text-white text-sm outline-none"
            >
              <option value="">Select officer...</option>
              {officers.map((o) => (
                <option key={o._id} value={o._id} className="bg-slate-900">
                  {o.email} — {o.district}
                </option>
              ))}
            </select>
            <button
              onClick={assign}
              disabled={busy}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {complaint.assignedOfficer ? 'Reassign' : 'Assign'}
            </button>
          </div>
        )}
      </div>

      {/* Field report */}
      {reportSubmitted && (
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Field Report
          </h5>
          <div className="p-5 bg-slate-950/70 border border-amber-400/30 rounded-2xl space-y-3">
            <p className="text-slate-100 text-sm whitespace-pre-wrap">{report.notes}</p>
            <p className="text-[11px] text-slate-400">
              Submitted {new Date(report.submittedAt).toLocaleString()}
            </p>
            {report.photoUrl && (
              <button
  type="button"
  onClick={() => openProtectedFile(report.photoUrl)}
  className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white"
>
  <ExternalLink className="w-4 h-4" /> View site photo
</button>
            )}
          </div>
        </div>
      )}

      {/* Verdict */}
      <div>
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Gavel className="w-4 h-4" /> Verdict
        </h5>
        {verdictGiven ? (
          <div className={`p-5 rounded-2xl border ${
            verdictGiven === 'genuine'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}>
            <p className={`text-sm font-bold uppercase ${verdictGiven === 'genuine' ? 'text-emerald-300' : 'text-rose-300'}`}>
              {verdictGiven === 'genuine' ? 'Genuine complaint' : 'False report'}
            </p>
            {complaint.verdict?.note && <p className="text-sm text-slate-200 mt-2">{complaint.verdict.note}</p>}
          </div>
        ) : closed ? (
          <p className="text-sm text-slate-400">This complaint was closed without a verdict.</p>
        ) : !reportSubmitted ? (
          <p className="text-sm text-slate-400">A verdict is available after the officer submits a field report.</p>
        ) : (
          <div className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Verdict note (optional)"
              className="w-full min-h-[80px] p-3 rounded-xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 text-sm outline-none resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => giveVerdict('genuine')}
                disabled={busy}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Genuine
              </button>
              <button
                onClick={() => giveVerdict('false')}
                disabled={busy}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} False Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}