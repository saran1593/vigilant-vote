'use client';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { encryptData } from '@/utils/crypto';
import { 
  FileText, 
  MapPin, 
  Camera, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus
} from 'lucide-react';

export default function VoterDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({
    category: 'Booth Capturing',
    content: '',
    district: '',
    boothNumber: '',
  });
  const [evidence, setEvidence] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await apiRequest('/complaints/my');
      setComplaints(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Encrypt Content
      const encryptedContent = encryptData(form.content);

      // 2. Prepare FormData (for file upload)
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('encryptedContent', encryptedContent);
      formData.append('location', JSON.stringify({
        district: form.district,
        boothNumber: form.boothNumber,
        lat: 12.9716 + (Math.random() - 0.5) * 0.1, // Mock coordinates for heatmap
        lng: 77.5946 + (Math.random() - 0.5) * 0.1
      }));
      if (evidence) formData.append('evidence', evidence);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      
      setForm({ category: 'Booth Capturing', content: '', district: '', boothNumber: '' });
      setEvidence(null);
      setShowForm(false);
      fetchComplaints();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'investigating': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Grievances</h1>
          <p className="text-muted mt-2">Track the status of your reported election irregularities.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20"
        >
          {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> File New Complaint</>}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-8 rounded-3xl mb-12 animate-in slide-in-from-top duration-500">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Grievance Category</label>
                <select 
                  className="w-full p-4 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none"
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  <option>Booth Capturing</option>
                  <option>Voter Intimidation</option>
                  <option>Malfunctioning EVM</option>
                  <option>Illegal Campaigning</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">District</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="e.g. North Shore"
                    value={form.district}
                    onChange={(e) => setForm({...form, district: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Booth #</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-xl border border-border bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="e.g. 101"
                    value={form.boothNumber}
                    onChange={(e) => setForm({...form, boothNumber: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Evidence (Image/PDF)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => setEvidence(e.target.files?.[0] || null)}
                  />
                  <div className="border-2 border-dashed border-border group-hover:border-primary transition-all p-8 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                    <Camera className="w-8 h-8 text-muted group-hover:text-primary" />
                    <span className="text-sm font-medium">{evidence ? evidence.name : 'Click to upload evidence'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 flex flex-col">
              <div className="flex-1">
                <label className="block text-sm font-bold mb-2">Detailed Description (Encrypted)</label>
                <textarea 
                  className="w-full h-full min-h-[200px] p-6 rounded-2xl border border-border bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  placeholder="Describe the incident in detail..."
                  value={form.content}
                  onChange={(e) => setForm({...form, content: e.target.value})}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 blue-gradient text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:opacity-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Encrypted Grievance</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {fetching ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl">
          <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold">No complaints yet</h3>
          <p className="text-muted">You haven't filed any grievances yet. Click above to start.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {complaints.map((c: any) => (
            <div key={c.complaintId} className="glass-card p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{c.category}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted mt-0.5">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> District {c.location.district}, Booth {c.location.boothNumber}</span>
                    <span>•</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 border ${
                  c.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                  c.status === 'investigating' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-slate-50 text-slate-700 border-slate-100'
                }`}>
                  {getStatusIcon(c.status)}
                  <span className="capitalize">{c.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
