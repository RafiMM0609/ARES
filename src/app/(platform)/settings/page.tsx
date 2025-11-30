'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile, useWallet } from '@/hooks';
import { 
  LoadingSpinner, 
  ErrorMessage, 
  SuccessMessage, 
  Button,
  FormInput,
  FormSelect,
  FormTextarea
} from '@/components/ui';
import { WalletConnect } from '@/components/wallet';
import type { Database } from '@/lib/database.types';

type UserUpdate = Database['public']['Tables']['users']['Update'];

const userTypeOptions = [
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'client', label: 'Client' },
  { value: 'both', label: 'Both (Client & Freelancer)' },
];

function getUserTypeHelperText(userType: string | undefined): string {
  switch (userType) {
    case 'both':
      return 'You can post jobs and work as a freelancer. Use the role switcher in the navigation bar to switch between dashboards.';
    case 'client':
      return 'You can post jobs and hire freelancers.';
    default:
      return 'You can browse and apply for jobs.';
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const { profile, loading, error, updateProfile, saving, saveError, saveSuccess } = useProfile();
  const { isConnected, address } = useWallet();
  const [formData, setFormData] = useState<Partial<UserUpdate>>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        user_type: profile.user_type || 'freelancer',
        bio: profile.bio || '',
        country: profile.country || '',
        timezone: profile.timezone || '',
        wallet_address: profile.wallet_address || '',
      });
    }
  }, [profile]);

  // Update wallet address when connected
  useEffect(() => {
    if (isConnected && address && address !== formData.wallet_address) {
      setFormData(prev => ({ ...prev, wallet_address: address }));
    }
  }, [isConnected, address, formData.wallet_address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile(formData);
      
      // If user type changed, redirect
      if (formData.user_type !== profile?.user_type) {
        setTimeout(() => {
          const redirectPath = formData.user_type === 'freelancer' ? '/freelancer' : '/client';
          router.push(redirectPath);
        }, 1500);
      }
    } catch (error) {
      // Error is handled by the useProfile hook's saveError state
      console.error('Profile update failed:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      {(error || saveError) && <ErrorMessage message={error || saveError} />}
      {saveSuccess && <SuccessMessage message={saveSuccess} />}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Account Information */}
        <SettingsSection title="Account Information">
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={profile?.email || ''}
            disabled
            className="bg-gray-50 text-gray-500 cursor-not-allowed"
            helperText="Email cannot be changed"
          />

          <FormInput
            id="full_name"
            label="Full Name"
            type="text"
            value={formData.full_name || ''}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
        </SettingsSection>

        {/* User Role */}
        <SettingsSection title="Your Role">
          <FormSelect
            id="user_type"
            label="I am a"
            options={userTypeOptions}
            value={formData.user_type}
            onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'client' | 'freelancer' | 'both' })}
            helperText={getUserTypeHelperText(formData.user_type)}
          />
        </SettingsSection>

        {/* Profile Details */}
        <SettingsSection title="Profile Details">
          <FormTextarea
            id="bio"
            label="Bio"
            rows={4}
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
          />

          <div className="grid md:grid-cols-2 gap-4">
            <FormInput
              id="country"
              label="Country"
              type="text"
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="e.g., Indonesia"
            />

            <FormInput
              id="timezone"
              label="Timezone"
              type="text"
              value={formData.timezone || ''}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="e.g., Asia/Jakarta"
            />
          </div>
        </SettingsSection>

        {/* Wallet & Payment Information */}
        <SettingsSection title="Wallet & Payment (QI Network)">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">QI Network Integration</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Connect your wallet to receive payments on the QI Network (QIE). 
                    Your wallet address will be automatically saved when connected.
                  </p>
                </div>
              </div>
            </div>

            <WalletConnect />

            <FormInput
              id="wallet_address"
              label="Wallet Address"
              type="text"
              value={formData.wallet_address || ''}
              onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
              placeholder="0x..."
              helperText={isConnected ? "Connected via wallet" : "Enter manually or connect your wallet above"}
            />
          </div>
        </SettingsSection>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" loading={saving} className="flex-1">
            Save Changes
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => router.back()} 
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="border-b border-gray-200 pb-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}
