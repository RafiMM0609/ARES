'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/services';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<ProfileUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { profile: profileData } = await userService.getProfile();
      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || '',
        user_type: profileData.user_type || 'freelancer',
        bio: profileData.bio || '',
        country: profileData.country || '',
        timezone: profileData.timezone || '',
        wallet_address: profileData.wallet_address || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await userService.updateProfile(formData);
      setSuccess('Profile updated successfully!');
      
      // If user type changed, reload profile and redirect
      if (formData.user_type !== profile?.user_type) {
        await loadProfile();
        setTimeout(() => {
          const redirectPath = formData.user_type === 'freelancer' ? '/freelancer' : '/client';
          router.push(redirectPath);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Account Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* User Role */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Role</h2>
          
          <div>
            <label htmlFor="user_type" className="block text-sm font-medium text-gray-700 mb-1">
              I am a
            </label>
            <select
              id="user_type"
              value={formData.user_type}
              onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'client' | 'freelancer' | 'both' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
              <option value="both">Both (Client & Freelancer)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.user_type === 'both' 
                ? 'You can post jobs and work as a freelancer. Use the role switcher in the navigation bar to switch between dashboards.' 
                : formData.user_type === 'client'
                ? 'You can post jobs and hire freelancers.'
                : 'You can browse and apply for jobs.'}
            </p>
          </div>
        </div>

        {/* Profile Details */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Indonesia"
                />
              </div>

              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <input
                  id="timezone"
                  type="text"
                  value={formData.timezone || ''}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Asia/Jakarta"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
          
          <div>
            <label htmlFor="wallet_address" className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Address
            </label>
            <input
              id="wallet_address"
              type="text"
              value={formData.wallet_address || ''}
              onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Your crypto wallet address for receiving payments
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
