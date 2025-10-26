'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authService } from '@/services';

export default function Navbar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold">
              ARES
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link 
                href="/client" 
                className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
              >
                Client
              </Link>
              <Link 
                href="/freelancer" 
                className="hover:bg-blue-700 px-3 py-2 rounded transition-colors"
              >
                Freelancer
              </Link>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </nav>
  );
}
