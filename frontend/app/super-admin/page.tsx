'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { decryptData } from '@/utils/crypto';
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
  UserPlus,
  Trash2,
  Mail,
  Lock,
  Plus
} from 'lucide-react';
import PasswordModal from '../../components/PasswordModal';

const Heatmap = dynamic(() => import('../../components/Heatmap'), { ssr: false });

export default function SuperAdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [decryptedText, setDecryptedText] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [pendingAction, setPendingAction] = useState<'decrypt' | 'viewEvidence' | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'superadmin') {
      window.location.href = '/login';
      return;
    }
    setUser(userData);
    fetchData();
    fetchAdmins();
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

  const fetchAdmins = async () => {
    try {
      const data = await apiRequest('/admin/admins');
      setAdmins(data);
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
    if (pendingAction === 'decrypt') {
      handleDecrypt(selectedComplaint?.encryptedContent);
    } else if (pendingAction === 'viewEvidence') {
      window.open(`http://localhost:5000${selectedComplaint.evidenceUrl}`, '_blank');
    }
    setPendingAction(null);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/admin/complaints/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchData();
      setSelectedComplaint(null);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleManageAdmin = async (action: 'add' | 'remove', emailToManage?: string) => {
    const targetEmail = emailToManage || adminEmail;
    try {
      await apiRequest('/admin/manage-admins', {
        method: 'POST',
        body: JSON.stringify({ 
          email: targetEmail, 
          action, 
          password: action === 'add' ? adminPassword : null 
        })
      });
      alert(`User role updated successfully`);
      setAdminEmail('');
      setAdminPassword('');
      setIsAddingAdmin(false);
      fetchAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-[calc(100vh-64px)] flex justify-center items-center bg-slate-950">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
    </div>
  );

  return (
    <div 
      className="relative min-h-[calc(100vh-64px)] w-full py-10 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-blue-950/90 backdrop-blur-[3px]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-6 border-b border-white/15">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Super Admin Panel
            </h1>
            <p className="text-slate-300 text-sm mt-1">Manage administrators and audit election complaints</p>
          </div>

          <div className="flex bg-slate-950/70 p-1 rounded-xl border border-white/15">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" /> Complaints
            </button>
            <button 
              onClick={() => setActiveTab('map')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <MapIcon className="w-4 h-4" /> Heatmap
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Settings className="w-4 h-4" /> Manage Admins
            </button>
          </div>
        </div>

        {activeTab === 'list' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <input 
                  placeholder="Search district, booth..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {complaints.map((c) => (
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
                    <h4 className="font-bold text-sm text-white mb-1">Booth {c.location.boothNumber}</h4>
                    <p className="text-xs text-slate-300 mb-3">{c.location.district}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        c.status === 'investigating' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-800 text-slate-300 border border-white/10'
                      }`}>{c.status}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedComplaint ? (
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/20 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl animate-in fade-in slide-in-from-right duration-300">
                  <div className="flex flex-wrap justify-between items-start mb-8 pb-8 border-b border-white/15 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
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
                      </div>
                      <p className="text-slate-300 text-xs flex items-center gap-1.5">
                        District {selectedComplaint.location.district} • Booth {selectedComplaint.location.boothNumber} • {new Date(selectedComplaint.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selectedComplaint.status !== "investigating" && <button onClick={() => updateStatus(selectedComplaint.complaintId, 'investigating')} className="px-4 py-2.5 rounded-xl border border-white/20 bg-slate-950/50 text-xs font-bold hover:bg-white/10 transition-all">Mark Investigating</button>}
                      {selectedComplaint.status !== "resolved" && <button onClick={() => updateStatus(selectedComplaint.complaintId, 'resolved')} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-emerald-600/30">Mark Resolved</button>}
                    </div>
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
                            <span className="text-[10px] text-slate-400 uppercase">Public Integrity Storage</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-60 bg-slate-900/40 backdrop-blur-xl border border-white/15 rounded-[2.5rem]">
                  <ShieldAlert className="w-16 h-16 mb-4 text-slate-400" />
                  <h3 className="text-xl font-bold text-white italic">Select a grievance to audit</h3>
                  <p className="max-w-xs text-xs text-slate-300 mt-2">All administrative decryption actions are logged for security transparency.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[70vh] rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl">
            <Heatmap data={complaints} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-end mb-8 pb-4 border-b border-white/15">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Admin Management</h2>
                <p className="text-slate-300 text-sm mt-1">Control access privileges for the election monitoring team.</p>
              </div>
              <button 
                onClick={() => setIsAddingAdmin(true)}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-blue-500/30 border border-white/20 text-sm"
              >
                <Plus className="w-5 h-5" /> Add New Admin
              </button>
            </div>

            <div className="grid gap-4">
              {admins.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 backdrop-blur-xl border border-white/15 rounded-[2.5rem]">
                  <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="font-bold text-white">No auxiliary admins found.</p>
                </div>
              ) : (
                admins.map((adm) => (
                  <div key={adm._id} className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl flex items-center justify-between border border-white/15 hover:border-blue-400/40 transition-all group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">{adm.email}</h4>
                        <p className="text-xs text-slate-400">Role: <span className="text-blue-300 font-bold">{adm.role.toUpperCase()}</span> • Added {new Date(adm.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { if (confirm('Revoke access?')) handleManageAdmin('remove', adm.email) }}
                      className="p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Admin Modal */}
            {isAddingAdmin && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-slate-900/90 border border-white/20 w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 text-white">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">New Administrator</h3>
                    <button onClick={() => setIsAddingAdmin(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Admin Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                          type="email" 
                          placeholder="admin@example.com"
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none text-sm font-medium"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Access Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                          type="password" 
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none text-sm font-medium"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setIsAddingAdmin(false)}
                        className="flex-1 py-3.5 border border-white/15 rounded-2xl font-bold hover:bg-white/10 transition-all text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleManageAdmin('add')}
                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:opacity-90 transition-all text-sm border border-white/20"
                      >
                        Grant Access
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