import Link from 'next/link';
import { ShieldCheck, Lock, Map, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <section
        className="relative pt-20 pb-32 px-4 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/home.jpg')" }}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
        <div className="relative max-w-7xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-bold mb-8 animate-fade-in border border-white/20">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Empowering Democracy with Encryption
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-md">
            Your Voice, <span className="text-blue-400 italic">Secured.</span>
          </h1>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
            Report election irregularities with confidence. Your complaint is encrypted in your browser before it is sent, and your identity is kept confidential from the staff who handle it.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-primary/30"
            >
              Submit a Complaint
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-blue-100 border-y">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
          <div className="space-y-4 bg-white p-4 shadow-lg rounded-xl">
            <div className="w-12 h-12 rounded-xl blue-gradient flex items-center justify-center text-white">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">AES-256 Encryption</h3>
            <p className="text-muted">
              Complaints are encrypted in your browser before they are sent to our servers, so the database only ever stores ciphertext. Access is restricted by role.
            </p>
          </div>
          <div className="space-y-4 bg-white p-4 shadow-lg rounded-xl">
            <div className="w-12 h-12 rounded-xl blue-gradient flex items-center justify-center text-white">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Digital Tamper Seal</h3>
            <p className="text-muted">
              Every complaint carries a SHA-256 checksum. If stored data is changed, it is flagged as compromised when an official opens it.
            </p>
          </div>
          <div className="space-y-4 bg-white p-4 shadow-lg rounded-xl">
            <div className="w-12 h-12 rounded-xl blue-gradient flex items-center justify-center text-white">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Heatmap of Hotspots</h3>
            <p className="text-muted">
              Complaints are grouped by district and booth, so repeated problem areas stand out and field officers can be sent where they are needed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}