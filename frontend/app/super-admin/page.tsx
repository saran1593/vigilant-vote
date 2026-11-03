'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { decryptData } from '@/utils/crypto';
import { openProtectedFile } from '@/utils/files';
import AssignmentPanel from '../../components/AssignmentPanel';
import AuditLogPanel from '../../components/AuditLogPanel';
import IdentityRevealPanel from '../../components/IdentityRevealPanel';
import StatsPanel from '../../components/StatsPanel';
import PasswordModal from '../../components/PasswordModal';
import {
  ShieldAlert,
  Map as MapIcon,
  List,
  Settings,
  Search,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Loader2,
  ChevronRight,
  Trash2,
  Mail,
  Lock,
  Plus,
  X,
  MapPin,
  UserCog,
  History,
  BarChart3
} from 'lucide-react';

const Heatmap = dynamic(() => import('../../components/Heatmap'), { ssr: false });

const statusClass = (status: string) => {
  switch (status) {
    case 'resolved': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    case 'investigating': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    case 'reviewing': return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
    case 'rejected': return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    default: return 'bg-slate-800 text-slate-300 border border-white/10';
  }
};

export default function SuperAdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [decryptedText, setDecryptedText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [pendingAction, setPendingAction] = useState<'decrypt' | 'viewEvidence' | null>(null);
  const [search, setSearch] = useState('');

  // Add-staff form
  const [newRole, setNewRole] = useState<'admin' | 'officer'>('officer');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'superadmin') {
      window.location.href = '/login';
      return;
    }
    setUser(userData);
    fetchData();
    fetchStaff();
    fetchOfficers();
  }, []);

  const fetchData = async () => {
    try {
      const data = await apiRequest('/admin/complaints');
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const data = await apiRequest('/admin/officers');
      setOfficers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await apiRequest('/admin/admins');
      setStaff(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecrypt = (content: string) => {
    try {
      const decrypted = decryptData(content);
      setDecryptedText(decrypted || 'Invalid encryption key or corrupted data.');
    } catch (err) {
      setDecryptedText('Decryption Failed.');
    }
  };

  const handleAction = (action: 'decrypt' | 'viewEvidence') => {
    setPendingAction(action);
    setIsModalOpen(true);
  };

  const onVerifySuccess = () => {
    const id = selectedComplaint?.complaintId;
    if (pendingAction === 'decrypt') {
      handleDecrypt(selectedComplaint?.encryptedContent);
      apiRequest(`/admin/complaints/${id}/log`, {
        method: 'POST',
        body: JSON.stringify({ action: 'DECRYPT' })
      }).catch(() => {});
    } else if (pendingAction === 'viewEvidence') {
      openProtectedFile(selectedComplaint.evidenceUrl);
    }
    setPendingAction(null);
  };

  const resetForm = () => {
    setNewEmail('');
    setNewPassword('');
    setNewDistrict('');
    setNewRole('officer');
  };

  const addStaff = async () => {
    if (!newEmail.trim() || !newPassword) {
      return alert('Email and password are required');
    }
    if (newRole === 'officer' && !newDistrict.trim()) {
      return alert('District is required for officers');
    }
    setSaving(true);
    try {
      await apiRequest('/admin/manage-admins', {
        method: 'POST',
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          action: 'add',
          password: newPassword,
          role: newRole,
          district: newDistrict.trim()
        })
      });
      alert(newRole === 'officer' ? 'Officer added successfully' : 'Admin added successfully');
      resetForm();
      setIsAddingStaff(false);
      fetchStaff();
      fetchOfficers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const revokeStaff = async (email: string) => {
    if (!confirm(`Revoke access for ${email}?`)) return;
    try {
      await apiRequest('/admin/manage-admins', {
        method: 'POST',
        body: JSON.stringify({ email, action: 'remove' })
      });
      fetchStaff();
      fetchOfficers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = complaints.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.location?.district?.toLowerCase().includes(q) ||
      c.location?.boothNumber?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q)
    );
  });

  if (loading) return (
    <div className="min-h-[calc(100vh-64px)] flex justify-center items-center bg-slate-950">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
    </div>
  );

  const tabClass = (tab: string) =>
    `px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
      activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
    }`;

  const inputClass =
    'w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none text-sm font-medium';

  return (
    <div
      className="relative min-h-[calc(100vh-64px)] w-full py-10 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-blue-950/90 backdrop-blur-[3px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-6 border-b border-white/15">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Super Admin Panel</h1>
            <p className="text-slate-300 text-sm mt-1">Manage staff and audit election complaints</p>
          </div>

          <div className="flex flex-wrap bg-slate-950/70 p-1 rounded-xl border border-white/15">
            <button onClick={() => setActiveTab('list')} className={tabClass('list')}>
              <List className="w-4 h-4" /> Complaints
            </button>
            <button onClick={() => setActiveTab('stats')} className={tabClass('stats')}>
              <BarChart3 className="w-4 h-4" /> Statistics
            </button>
            <button onClick={() => setActiveTab('map')} className={tabClass('map')}>
              <MapIcon className="w-4 h-4" /> Heatmap
            </button>
            <button onClick={() => setActiveTab('settings')} className={tabClass('settings')}>
              <Settings className="w-4 h-4" /> Manage Staff
            </button>
            <button onClick={() => setActiveTab('audit')} className={tabClass('audit')}>
              <History className="w-4 h-4" /> Audit Log
            </button>
          </div>
        </div>

        {activeTab === 'list' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search district, booth, status..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">No complaints found.</p>
                )}
                {filtered.map((c) => (
                  <div
                    key={c.complaintId}
                    onClick={() => { setSelectedComplaint(c); setDecryptedText(''); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedComplaint?.complaintId === c.complaintId
                        ? 'bg-slate-900/90 border-blue-400 ring-1 ring-blue-400/50 shadow-xl'
                        : 'bg-slate-900/50 border-white/10 hover:border-white/25 hover:bg-slate-900/70'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">{c.category}</span>
                      {c.isCompromised && <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />}
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">{c.location.boothNumber}</h4>
                    <p className="text-xs text-slate-300 mb-3">{c.location.district}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${statusClass(c.status)}`}>
                        {c.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedComplaint ? (
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-right duration-300">
                  <div className="mb-8 pb-8 border-b border-white/15">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-2xl font-extrabold text-white">{selectedComplaint.category}</h2>
                      {selectedComplaint.isCompromised ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 uppercase tracking-tighter">
                          <AlertTriangle className="w-3.5 h-3.5" /> Data Compromised
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 uppercase tracking-tighter">
                          <ShieldCheck className="w-3.5 h-3.5" /> Seal Intact
                        </div>
                      )}
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${statusClass(selectedComplaint.status)}`}>
                        {selectedComplaint.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      District {selectedComplaint.location.district} • {selectedComplaint.location.boothNumber} • {new Date(selectedComplaint.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Encrypted Content Payload</h5>
                      <div className="p-5 bg-slate-950/70 border border-blue-400/30 text-slate-300 text-sm rounded-2xl mb-5">
                        The complaint payload is client-encrypted via AES. Click below to verify digital seal and decrypt.
                      </div>
                      {decryptedText ? (
                        <div className="p-6 bg-slate-950/80 border border-emerald-400/40 rounded-2xl shadow-inner">
                          <h6 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">Decrypted Grievance Content:</h6>
                          <p className="text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">{decryptedText}</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAction('decrypt')}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 border border-white/20"
                        >
                          <ShieldCheck className="w-5 h-5" /> Decrypt & Verify Digital Seal
                        </button>
                      )}
                    </div>

                    {selectedComplaint.evidenceUrl && (
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Evidence Attachment</h5>
                        <button
                          onClick={() => handleAction('viewEvidence')}
                          className="w-full sm:w-2/3 inline-flex items-center gap-3 p-4 rounded-2xl border border-white/15 bg-slate-950/60 hover:border-blue-400 hover:bg-slate-950/80 transition-all text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30 text-blue-400">
                            <ExternalLink className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-white">View Evidence File</span>
                            <span className="text-[10px] text-slate-400 uppercase">Submitted by voter</span>
                          </div>
                        </button>
                      </div>
                    )}

                    <AssignmentPanel
                      key={selectedComplaint.complaintId}
                      complaint={selectedComplaint}
                      officers={officers}
                      onUpdated={() => { fetchData(); setSelectedComplaint(null); }}
                    />

                    {selectedComplaint.verdict?.result === 'false' && (
                      <IdentityRevealPanel
                        key={`reveal-${selectedComplaint.complaintId}`}
                        complaintId={selectedComplaint.complaintId}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-60 bg-slate-900/40 backdrop-blur-xl border border-white/15 rounded-[2.5rem]">
                  <ShieldAlert className="w-16 h-16 mb-4 text-slate-400" />
                  <h3 className="text-xl font-bold text-white italic">Select a grievance to audit</h3>
                  <p className="max-w-xs text-xs text-slate-300 mt-2">Assign an officer, review the field report, then give a verdict.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && <StatsPanel />}

        {activeTab === 'map' && (
          <div className="h-[70vh] rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl">
            <Heatmap data={complaints} />
          </div>
        )}

        {activeTab === 'audit' && <AuditLogPanel />}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8 pb-4 border-b border-white/15">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Staff Management</h2>
                <p className="text-slate-300 text-sm mt-1">Add admins and field officers, or revoke their access.</p>
              </div>
              <button
                onClick={() => { resetForm(); setIsAddingStaff(true); }}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-blue-500/30 border border-white/20 text-sm"
              >
                <Plus className="w-5 h-5" /> Add Staff
              </button>
            </div>

            <div className="grid gap-4">
              {staff.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 backdrop-blur-xl border border-white/15 rounded-[2.5rem]">
                  <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="font-bold text-white">No staff added yet.</p>
                </div>
              ) : (
                staff.map((s) => (
                  <div key={s._id} className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl flex items-center justify-between border border-white/15 hover:border-blue-400/40 transition-all group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {s.role === 'officer' ? <UserCog className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">{s.email}</h4>
                        <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2">
                          <span>Role: <span className="text-blue-300 font-bold">{s.role === 'officer' ? 'FIELD OFFICER' : 'ADMIN'}</span></span>
                          {s.role === 'officer' && s.district && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.district}</span>
                          )}
                          <span>• Added {new Date(s.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeStaff(s.email)}
                      className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {isAddingStaff && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-slate-900/90 border border-white/20 w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 text-white">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">New Staff Member</h3>
                    <button onClick={() => setIsAddingStaff(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Role</label>
                      <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-white/15">
                        <button
                          type="button"
                          onClick={() => setNewRole('officer')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newRole === 'officer' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Field Officer
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewRole('admin')}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${newRole === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          Admin
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          placeholder={newRole === 'officer' ? 'officer@example.com' : 'admin@example.com'}
                          className={inputClass}
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {newRole === 'officer' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">District</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="e.g. Kanyakumari"
                            className={inputClass}
                            value={newDistrict}
                            onChange={(e) => setNewDistrict(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Access Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className={inputClass}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setIsAddingStaff(false)}
                        className="flex-1 py-3.5 border border-white/15 rounded-2xl font-bold hover:bg-white/10 transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addStaff}
                        disabled={saving}
                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:opacity-90 transition-all text-sm border border-white/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Grant Access'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <PasswordModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setPendingAction(null); }}
          onVerify={onVerifySuccess}
          email={user?.email}
        />
      </div>
    </div>
  );
}