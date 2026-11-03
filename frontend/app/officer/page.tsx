'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { decryptData } from '@/utils/crypto';
import PasswordModal from '../../components/PasswordModal';
import { ShieldCheck, MapPin, Loader2, Camera, Send, ClipboardCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function OfficerDashboard() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decryptedText, setDecryptedText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'officer') {
      window.location.href = '/login';
      return;
    }
    setUser(userData);
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await apiRequest('/officer/assignments');
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectComplaint = (c: any) => {
    setSelected(c);
    setDecryptedText('');
    setNotes('');
    setPhoto(null);
  };

  const onVerifySuccess = () => {
  try {
    setDecryptedText(decryptData(selected.encryptedContent) || 'Could not decrypt.');
  } catch {
    setDecryptedText('Decryption failed.');
  }
  apiRequest(`/officer/assignments/${selected.complaintId}/log`, { method: 'POST' }).catch(() => {});
};
  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('notes', notes);
      if (photo) formData.append('photo', photo);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/officer/assignments/${selected.complaintId}/report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to submit report');

      setSelected(null);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex justify-center items-center bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  const canReport = selected && selected.status === 'investigating';

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] w-full py-10 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-fixed text-white"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-blue-950/90 backdrop-blur-[3px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-10 pb-6 border-b border-white/15">
          <h1 className="text-3xl font-bold tracking-tight">Field Officer Dashboard</h1>
          <p className="text-slate-300 text-sm mt-1">Visit the site, verify the complaint, and submit your report.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Assignment list */}
          <div className="lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {assignments.length === 0 && (
              <div className="p-8 text-center bg-slate-900/50 border border-white/15 rounded-2xl text-slate-300 text-sm">
                No complaints assigned to you yet.
              </div>
            )}
            {assignments.map((c) => (
              <div
                key={c.complaintId}
                onClick={() => selectComplaint(c)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selected?.complaintId === c.complaintId
                    ? 'bg-slate-900/90 border-blue-400 ring-1 ring-blue-400/50'
                    : 'bg-slate-900/50 border-white/10 hover:border-white/25'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">{c.category}</span>
                <h4 className="font-bold text-sm mt-1">Booth {c.location.boothNumber}</h4>
                <p className="text-xs text-slate-300 mb-3">{c.location.district}</p>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-800 text-slate-300 border border-white/10">
                  {c.status}
                </span>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl space-y-8">
                <div>
                  <h2 className="text-2xl font-extrabold">{selected.category}</h2>
                  <p className="text-slate-300 text-xs flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {selected.location.district} • Booth {selected.location.boothNumber}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Complaint Details</h5>
                  {decryptedText ? (
                    <div className="p-6 bg-slate-950/80 border border-emerald-400/40 rounded-2xl">
                      <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">{decryptedText}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5" /> Decrypt Complaint
                    </button>
                  )}
                </div>

                {canReport ? (
                  <form onSubmit={submitReport} className="space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Field Report</h5>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                      placeholder="What did you observe at the site?"
                      className="w-full min-h-[140px] p-4 rounded-xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 text-sm outline-none resize-none"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                      />
                      <div className="border border-dashed border-white/20 p-5 rounded-xl flex items-center justify-center gap-3 bg-slate-950/40">
                        <Camera className="w-5 h-5 text-slate-400" />
                        <span className="text-xs text-slate-300">{photo ? photo.name : 'Attach a site photo (optional)'}</span>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Field Report</>}
                    </button>
                  </form>
                ) : (
                  <div className="p-5 bg-slate-950/60 border border-white/15 rounded-2xl flex items-start gap-3">
                    <ClipboardCheck className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">
                        {selected.status === 'reviewing' ? 'Report submitted. Awaiting admin verdict.' : `Status: ${selected.status}`}
                      </p>
                      {selected.fieldReport?.notes && (
                        <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap">{selected.fieldReport.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[50vh] flex items-center justify-center text-center opacity-60 bg-slate-900/40 border border-white/15 rounded-[2.5rem]">
                <p className="text-slate-300">Select an assigned complaint</p>
              </div>
            )}
          </div>
        </div>

        <PasswordModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onVerify={onVerifySuccess}
          email={user?.email}
        />
      </div>
    </div>
  );
}