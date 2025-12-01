'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services';
import { Button, FormInput, FormSelect, ErrorMessage } from '@/components/ui';
import { WalletLogin } from '@/components/wallet';

const userTypeOptions = [
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'client', label: 'Client' },
  { value: 'both', label: 'Both' },
];

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    user_type: 'freelancer' as 'client' | 'freelancer' | 'both',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupMethod, setSignupMethod] = useState<'email' | 'wallet'>('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.signup({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        user_type: formData.user_type,
      });
      
      // Redirect based on user type
      // For 'both' users, default to client dashboard
      const redirectPath = formData.user_type === 'freelancer' ? '/freelancer' : '/client';
      
      // Use window.location.href for full page navigation to ensure
      // cookies are properly included in the request to protected routes
      window.location.href = redirectPath;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSuccess = (isNewUser: boolean) => {
    // Redirect will be handled by WalletLogin component
    console.log(isNewUser ? 'New user created via wallet' : 'Existing user logged in via wallet');
  };

  const handleWalletError = (walletError: string) => {
    setError(walletError);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join ARES</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        {/* Signup Method Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setSignupMethod('email')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              signupMethod === 'email'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Email Signup
          </button>
          <button
            type="button"
            onClick={() => setSignupMethod('wallet')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              signupMethod === 'wallet'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Wallet SSO
          </button>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {signupMethod === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              id="full_name"
              label="Full Name"
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />

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

            <FormInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
            />

            <FormSelect
              id="user_type"
              label="I am a"
              options={userTypeOptions}
              value={formData.user_type}
              onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'client' | 'freelancer' | 'both' })}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <FormSelect
              id="wallet_user_type"
              label="I am a"
              options={userTypeOptions}
              value={formData.user_type}
              onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'client' | 'freelancer' | 'both' })}
            />
            
            <WalletLogin
              userType={formData.user_type}
              onSuccess={handleWalletSuccess}
              onError={handleWalletError}
            />
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
