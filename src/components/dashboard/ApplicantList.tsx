'use client';

import { useState } from 'react';
import { Button, StatusBadge } from '@/components/ui';
import { applicationService } from '@/services';
import type { ApplicationWithRelations } from '@/services';

interface ApplicantListProps {
  applications: ApplicationWithRelations[];
  onRefetch: () => void;
}

export function ApplicantList({ applications, onRefetch }: ApplicantListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (applicationId: string) => {
    try {
      setProcessingId(applicationId);
      await applicationService.updateApplication(applicationId, { status: 'accepted' });
      onRefetch();
    } catch (error) {
      console.error('Failed to accept application:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      setProcessingId(applicationId);
      await applicationService.updateApplication(applicationId, { status: 'rejected' });
      onRefetch();
    } catch (error) {
      console.error('Failed to reject application:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (applications.length === 0) {
    return <p className="text-gray-500">No applications yet.</p>;
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {app.freelancer?.avatar_url ? (
                  <img
                    src={app.freelancer.avatar_url}
                    alt={app.freelancer.full_name || 'Freelancer'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {app.freelancer?.full_name?.charAt(0) || 'F'}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {app.freelancer?.full_name || 'Anonymous Freelancer'}
                  </h4>
                  <p className="text-sm text-gray-500">{app.freelancer?.email}</p>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Project:</span> {app.project?.title}
                </p>
                {app.proposed_rate && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Proposed Rate:</span> ${app.proposed_rate}
                  </p>
                )}
                {app.cover_letter && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Cover Letter:</p>
                    <p className="text-sm text-gray-600 mt-1">{app.cover_letter}</p>
                  </div>
                )}
                {app.freelancer?.bio && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Bio:</p>
                    <p className="text-sm text-gray-600 mt-1">{app.freelancer.bio}</p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                <StatusBadge status={app.status} />
              </div>
            </div>

            {app.status === 'pending' && (
              <div className="flex gap-2 ml-4">
                <Button
                  onClick={() => handleAccept(app.id)}
                  disabled={processingId === app.id}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  {processingId === app.id ? 'Processing...' : 'Accept'}
                </Button>
                <Button
                  onClick={() => handleReject(app.id)}
                  disabled={processingId === app.id}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  {processingId === app.id ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
