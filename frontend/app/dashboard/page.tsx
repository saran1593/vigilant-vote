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
  Plus,
  ShieldCheck,
  X
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
      const encryptedContent = encryptData(form.content);

      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('encryptedContent', encryptedContent);
      formData.append('location', JSON.stringify({
        district: form.district,
        boothNumber: form.boothNumber,
        lat: 12.9716 + (Math.random() - 0.5) * 0.1, 
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
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'investigating': return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div 
      className="relative min-h-[calc(100vh-64px)] w-full py-10 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-blue-950/90 backdrop-blur-[3px]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 pb-6 border-b border-white/15">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              My Complaints
            </h1>
            <p className="text-slate-300 text-sm mt-1">View and track your submitted election grievances.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg text-sm"
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> File New Complaint</>}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/20 p-8 rounded-2xl mb-10 shadow-xl">
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Submit New Complaint
            </h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-white/15 bg-slate-950/70 text-white focus:ring-2 focus:ring-blue-400/40 outline-none text-sm"
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                  >
                    <option className="bg-slate-900 text-white">Booth Capturing</option>
                    <option className="bg-slate-900 text-white">Voter Intimidation</option>
                    <option className="bg-slate-900 text-white">Malfunctioning EVM</option>
                    <option className="bg-slate-900 text-white">Illegal Campaigning</option>
                    <option className="bg-slate-900 text-white">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">District</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none text-sm"
                      placeholder="e.g. Kanyakumari"
                      value={form.district}
                      onChange={(e) => setForm({...form, district: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Booth Number</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none text-sm"
                      placeholder="e.g. 101"
                      value={form.boothNumber}
                      onChange={(e) => setForm({...form, boothNumber: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Evidence (Optional)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={(e) => setEvidence(e.target.files?.[0] || null)}
                    />
                    <div className="border border-dashed border-white/20 p-6 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-950/40 hover:border-blue-400 transition-all">
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
                      <span className="text-xs text-slate-300">{evidence ? evidence.name : 'Upload photo or document'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex flex-col">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                  <textarea 
                    className="w-full h-full min-h-[160px] p-4 rounded-xl border border-white/15 bg-slate-950/70 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-400/40 outline-none resize-none text-sm"
                    placeholder="Describe what happened..."
                    value={form.content}
                    onChange={(e) => setForm({...form, content: e.target.value})}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all border border-white/10 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Complaint</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {fetching ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-400" /></div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 backdrop-blur-xl border border-white/15 rounded-[2.5rem] shadow-2xl">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white">No complaints filed</h3>
            <p className="text-slate-300 text-sm mt-1">You haven't filed any grievances yet. Click above to start.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {complaints.map((c: any) => (
              <div 
                key={c.complaintId} 
                className="bg-slate-900/60 backdrop-blur-xl border border-white/15 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 hover:border-white/30 hover:bg-slate-900/80 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">{c.category}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" /> District {c.location.district}, Booth {c.location.boothNumber}</span>
                      <span>•</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border backdrop-blur-md ${
                    c.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    c.status === 'investigating' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-slate-800/60 text-slate-300 border-white/15'
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
    </div>
  );
}

