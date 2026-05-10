import Link from 'next/link';
import { ShieldCheck, Lock, Map, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-primary text-sm font-bold mb-8 animate-fade-in">
            <ShieldCheck className="w-4 h-4" />
            Empowering Democracy with Encryption
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight mb-6">
            Your Voice, <span className="text-primary italic">Secured.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Report election irregularities with end-to-end encryption. VigilantVote ensures your grievance is heard without compromising your privacy.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/login" 
              className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              Submit a Complaint
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl blue-gradient flex items-center justify-center text-white">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">AES-256 Encryption</h3>
            <p className="text-muted">Complaints are encrypted on your device before they ever hit our servers. Only authorized admins can decrypt them.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl blue-gradient flex items-center justify-center text-white">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Digital Tamper Seal</h3>
            <p className="text-muted">Every entry is cryptographically signed. Any manual tampering with the database is instantly flagged.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl blue-gradient flex items-center justify-center text-white">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Heatmap of Dissent</h3>
            <p className="text-muted">Real-time visualization of complaint hotspots allows for rapid deployment of election integrity observers.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
