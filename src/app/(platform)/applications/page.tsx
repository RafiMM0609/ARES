'use client';

import { useState, useEffect } from 'react';
import { useApplications, useDashboardData } from '@/hooks';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { 
  DashboardHeader, 
  DashboardSection, 
  ApplicantList,
  MyApplicationsList,
  ApplicationFilter
} from '@/components/dashboard';
import { userService } from '@/services';

export default function ApplicationsPage() {
  const [userType, setUserType] = useState<'client' | 'freelancer' | 'both' | null>(null);
  const [viewType, setViewType] = useState<'client' | 'freelancer'>('client');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);

  const { data: dashboardData, loading: dashboardLoading } = useDashboardData();
  
  const { applications, loading: applicationsLoading, error, refetch } = useApplications({
    projectId: selectedProjectId || undefined,
    status: selectedStatus || undefined,
    viewType,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { profile } = await userService.getProfile();
      const type = profile.user_type as 'client' | 'freelancer' | 'both';
      setUserType(type);
      // Default view based on user type
      if (type === 'freelancer') {
        setViewType('freelancer');
      } else {
        setViewType('client');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [selectedProjectId, selectedStatus, viewType, refetch]);

  if (profileLoading || dashboardLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const projects = dashboardData?.projects || [];
  const isClient = viewType === 'client';

  return (
    <div className="space-y-8">
      <DashboardHeader
        title={isClient ? 'Project Applicants' : 'My Applications'}
      />

      {/* View Toggle for users with both roles */}
      {userType === 'both' && (
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setViewType('client')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'client'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Project Applicants (Client View)
          </button>
          <button
            onClick={() => setViewType('freelancer')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'freelancer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            My Applications (Freelancer View)
          </button>
        </div>
      )}

      {/* Filters */}
      <ApplicationFilter
        projects={projects}
        selectedProjectId={selectedProjectId}
        selectedStatus={selectedStatus}
        onProjectChange={setSelectedProjectId}
        onStatusChange={setSelectedStatus}
      />

      {/* Applications List */}
      <DashboardSection title={isClient ? 'Applicants for Your Projects' : 'Projects You Applied To'}>
        {applicationsLoading ? (
          <p className="text-gray-500">Loading applications...</p>
        ) : isClient ? (
          <ApplicantList applications={applications} onRefetch={refetch} />
        ) : (
          <MyApplicationsList applications={applications} onRefetch={refetch} />
        )}
      </DashboardSection>
    </div>
  );
}
