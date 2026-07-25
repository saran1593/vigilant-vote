'use client';
import Link from 'next/link';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <nav className="border-b border-blue-200/80 bg-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-primary tracking-tight">VigilantVote</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <UserIcon className="w-4 h-4" />
                  <span>{user.email}</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-primary text-[10px] uppercase">
                    {user.role}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm font-medium text-destructive hover:opacity-80 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
