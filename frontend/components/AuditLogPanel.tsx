'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { Loader2 } from 'lucide-react';

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/admin/audit-logs')
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/15 rounded-[2rem] p-6 shadow-2xl">
      <h2 className="text-2xl font-extrabold mb-1">Audit Log</h2>
      <p className="text-slate-300 text-xs mb-6">Latest 200 sensitive actions. Entries cannot be edited or deleted from the app.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 uppercase tracking-wider border-b border-white/15">
              <th className="py-3 pr-4">Time</th>
              <th className="py-3 pr-4">Who</th>
              <th className="py-3 pr-4">Action</th>
              <th className="py-3 pr-4">Complaint</th>
              <th className="py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">No actions logged yet.</td></tr>
            )}
            {logs.map((l) => (
              <tr key={l._id} className="border-b border-white/5">
                <td className="py-3 pr-4 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="py-3 pr-4">{l.actorEmail} <span className="text-slate-500">({l.actorRole})</span></td>
                <td className="py-3 pr-4 font-bold text-blue-300">{l.action}</td>
                <td className="py-3 pr-4 font-mono">{l.complaintId ? l.complaintId.slice(0, 8) : '-'}</td>
                <td className="py-3 text-slate-300">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}