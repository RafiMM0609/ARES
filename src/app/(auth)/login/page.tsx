'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService, userService } from '@/services';
import { Button, FormInput, ErrorMessage } from '@/components/ui';
import { WalletLogin } from '@/components/wallet';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'wallet'>('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login({
        email: formData.email,
        password: formData.password,
      });
      
      // Get user profile to determine redirect
      const { profile } = await userService.getProfile();
      
      // Redirect based on user type
      // For 'both' users, default to client dashboard
      const redirectPath = profile.user_type === 'freelancer' ? '/freelancer' : '/client';
      
      // Use window.location.href for full page navigation to ensure
      // cookies are properly included in the request to protected routes
      window.location.href = redirectPath;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to log in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSuccess = async (isNewUser: boolean) => {
    // Get user profile to determine redirect
    const { profile } = await userService.getProfile();
    
    // Redirect based on user type
    // For 'both' users, default to client dashboard
    const redirectPath = profile.user_type === 'freelancer' ? '/freelancer' : '/client';
    
    // Use window.location.href for full page navigation to ensure
    // cookies are properly included in the request to protected routes
    window.location.href = redirectPath;
  };

  const handleWalletError = (walletError: string) => {
    setError(walletError);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Log in to your ARES account</p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              loginMethod === 'email'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('wallet')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              loginMethod === 'wallet'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Wallet SSO
          </button>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {loginMethod === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
            />

            <FormInput
              id="password"
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Log In
            </Button>
          </form>
        ) : (
          <WalletLogin
            onSuccess={handleWalletSuccess}
            onError={handleWalletError}
          />
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
