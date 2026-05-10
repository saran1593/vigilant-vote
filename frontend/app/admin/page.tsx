'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { decryptData } from '@/utils/crypto';
import { 
  ShieldAlert, 
  Map as MapIcon, 
  List, 
  Search, 
  ShieldCheck, 
  AlertTriangle,
  ExternalLink,
  Loader2,
  ChevronRight
} from 'lucide-react';
import PasswordModal from '../../components/PasswordModal';

const Heatmap = dynamic(() => import('../../components/Heatmap'), { ssr: false });

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [decryptedText, setDecryptedText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'decrypt' | 'viewEvidence' | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!['admin', 'superadmin'].includes(userData.role)) {
      window.location.href = '/login';
      return;
    }
    setUser(userData);
    fetchData();
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Administrative Hub</h1>
          <p className="text-muted mt-1">Election Integrity Command Center - {user?.role?.toUpperCase()}</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border border-border shadow-sm">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-foreground'}`}
          >
            <List className="w-4 h-4" /> Complaints
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'map' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-foreground'}`}
          >
            <MapIcon className="w-4 h-4" /> Heatmap
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted" />
              <input 
                placeholder="Search district, booth..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {complaints.map((c) => (
                <div 
                  key={c.complaintId}
                  onClick={() => { setSelectedComplaint(c); setDecryptedText(''); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedComplaint?.complaintId === c.complaintId ? 'bg-white border-primary ring-1 ring-primary shadow-md' : 'bg-white border-border hover:border-muted'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{c.category}</span>
                    {c.isCompromised && <ShieldAlert className="w-4 h-4 text-destructive animate-pulse" />}
                  </div>
                  <h4 className="font-bold text-sm mb-1">Booth {c.location.boothNumber}</h4>
                  <p className="text-xs text-muted mb-3">{c.location.district}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      c.status === 'resolved' ? 'bg-green-50 text-green-700' :
                      c.status === 'investigating' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-50 text-slate-700'
                    }`}>{c.status}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="lg:col-span-2">
            {selectedComplaint ? (
              <div className="glass-card p-8 rounded-3xl animate-in fade-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start mb-8 pb-8 border-b">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-extrabold">{selectedComplaint.category}</h2>
                      {selectedComplaint.isCompromised ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20 uppercase tracking-tighter">
                          <AlertTriangle className="w-3.5 h-3.5" /> Data Compromised
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100 uppercase tracking-tighter">
                          <ShieldCheck className="w-3.5 h-3.5" /> Seal Intact
                        </div>
                      )}
                    </div>
                    <p className="text-muted flex items-center gap-1.5">
                      District {selectedComplaint.location.district} • Booth {selectedComplaint.location.boothNumber} • {new Date(selectedComplaint.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(selectedComplaint.complaintId, 'investigating')} className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-slate-50 transition-all">Mark Investigating</button>
                    <button onClick={() => updateStatus(selectedComplaint.complaintId, 'resolved')} className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-green-200">Mark Resolved</button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h5 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Encrypted Content Payload</h5>
                    <div className="p-6 bg-white border border-primary/20 rounded-2xl shadow-inner-sm mb-5" >
                      The complaint has been encrypted using AES algorithm. Use your <span className="font-bold">Private Key</span> to decrypt the complaint.
                    </div>
                    {decryptedText ? (
                      <div className="p-6 bg-white border border-primary/20 rounded-2xl shadow-inner-sm">
                        <h6 className="text-xs font-bold text-primary mb-2 uppercase">Decrypted Grievance:</h6>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{decryptedText}</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleAction('decrypt')}
                        className="w-full py-4 blue-gradient text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                      >
                        <ShieldCheck className="w-5 h-5" /> Decrypt & Verify Digital Seal
                      </button>
                    )}
                  </div>

                  {selectedComplaint.evidenceUrl && (
                    <div>
                      <h5 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Evidence Attachment</h5>
                      <button 
                        onClick={() => handleAction('viewEvidence')}
                        className="w-1/2 inline-flex items-center gap-3 p-4 rounded-2xl border border-border hover:border-primary hover:bg-secondary transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border">
                          <ExternalLink className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span className="block text-sm font-bold">View Evidence File</span>
                          <span className="text-[10px] text-muted uppercase">Public Integrity Storage</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-40">
                <ShieldAlert className="w-20 h-20 mb-4 text-muted" />
                <h3 className="text-2xl font-bold italic">Select a grievance to audit</h3>
                <p className="max-w-xs text-sm mt-2">All administrative actions are logged for audit transparency.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="h-[70vh] rounded-3xl overflow-hidden border border-border shadow-xl">
          <Heatmap data={complaints} />
        </div>
      )}

      <PasswordModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setPendingAction(null); }} 
        onVerify={onVerifySuccess} 
        email={user?.email}
      />
    </div>
  );
}
