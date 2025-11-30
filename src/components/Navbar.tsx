'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authService, userService } from '@/services';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'client' | 'freelancer' | 'both' | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { profile } = await userService.getProfile();
      setUserType(profile.user_type || 'freelancer');
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

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
              {(userType === 'client' || userType === 'both') && (
                <Link 
                  href="/client" 
                  className={`hover:bg-blue-700 px-3 py-2 rounded transition-colors ${
                    pathname === '/client' ? 'bg-blue-700' : ''
                  }`}
                >
                  Client Dashboard
                </Link>
              )}
              {(userType === 'freelancer' || userType === 'both') && (
                <Link 
                  href="/freelancer" 
                  className={`hover:bg-blue-700 px-3 py-2 rounded transition-colors ${
                    pathname === '/freelancer' ? 'bg-blue-700' : ''
                  }`}
                >
                  Freelancer Dashboard
                </Link>
              )}
              <Link 
                href="/applications" 
                className={`hover:bg-blue-700 px-3 py-2 rounded transition-colors ${
                  pathname === '/applications' ? 'bg-blue-700' : ''
                }`}
              >
                Applications
              </Link>
              <Link 
                href="/settings" 
                className={`hover:bg-blue-700 px-3 py-2 rounded transition-colors ${
                  pathname === '/settings' ? 'bg-blue-700' : ''
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {userType && (
              <span className="text-sm bg-blue-700 px-3 py-1 rounded">
                {userType === 'both' ? 'Client & Freelancer' : userType === 'client' ? 'Client' : 'Freelancer'}
              </span>
            )}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
