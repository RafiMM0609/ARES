'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService, userService } from '@/services';
import { Button, FormInput, ErrorMessage } from '@/components/ui';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Log in to your ARES account</p>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

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
