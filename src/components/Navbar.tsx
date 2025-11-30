'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authService, userService, walletService } from '@/services';
import { useWallet } from '@/hooks';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'client' | 'freelancer' | 'both' | null>(null);
  const { isConnected, address, balance, isQINetwork, connect } = useWallet();

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
            {/* Wallet Status */}
            {isConnected ? (
              <div className="flex items-center gap-2 bg-blue-700 px-3 py-1 rounded text-sm">
                <div className={`w-2 h-2 rounded-full ${isQINetwork ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="font-mono">{walletService.formatAddress(address || '')}</span>
                {balance && (
                  <span className="text-blue-200">
                    {parseFloat(balance).toFixed(2)} QIE
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={connect}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Connect Wallet
              </button>
            )}
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
