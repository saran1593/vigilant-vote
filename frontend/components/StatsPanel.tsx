'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { Loader2 } from 'lucide-react';

const STATUS_ORDER = ['pending', 'investigating', 'reviewing', 'resolved', 'rejected'];

function Bars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/15 rounded-2xl p-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">{title}</h3>
      {rows.length === 0 && <p className="text-xs text-slate-400">No data yet.</p>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-200 capitalize">{r.label}</span>
              <span className="font-bold text-white">{r.count}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800">
              <div className="h-2.5 rounded-full bg-blue-500" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/15 rounded-2xl p-6">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-3xl font-extrabold mt-2">{value}</p>
    </div>
  );
}

export default function StatsPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/admin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (!stats) return <p className="text-slate-300 text-center py-20">Could not load statistics.</p>;

  const statusMap: Record<string, number> = {};
  stats.byStatus.forEach((s: any) => (statusMap[s._id] = s.count));
  const verdictMap: Record<string, number> = {};
  stats.verdicts.forEach((v: any) => (verdictMap[v._id] = v.count));
  const decided = (verdictMap.genuine || 0) + (verdictMap.false || 0);
  const falseRate = decided ? Math.round(((verdictMap.false || 0) / decided) * 100) : 0;
  const open = (statusMap.pending || 0) + (statusMap.investigating || 0) + (statusMap.reviewing || 0);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Total complaints" value={stats.total} />
        <Card label="Last 7 days" value={stats.last7} />
        <Card label="Open cases" value={open} />
        <Card label="False report rate" value={decided ? `${falseRate}%` : '-'} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card label="Genuine verdicts" value={verdictMap.genuine || 0} />
        <Card label="False verdicts" value={verdictMap.false || 0} />
        <Card label="Avg. time to verdict" value={stats.avgResolutionHours != null ? `${stats.avgResolutionHours} h` : '-'} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Bars title="By status" rows={STATUS_ORDER.map((s) => ({ label: s, count: statusMap[s] || 0 }))} />
        <Bars title="By category" rows={stats.byCategory.map((c: any) => ({ label: c._id, count: c.count }))} />
        <Bars title="Top districts" rows={stats.byDistrict.map((d: any) => ({ label: d._id, count: d.count }))} />
      </div>
    </div>
  );
}