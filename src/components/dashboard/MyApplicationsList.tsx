'use client';

import { useState } from 'react';
import { Button, StatusBadge } from '@/components/ui';
import { applicationService } from '@/services';
import type { ApplicationWithRelations } from '@/services';

interface MyApplicationsListProps {
  applications: ApplicationWithRelations[];
  onRefetch: () => void;
}

export function MyApplicationsList({ applications, onRefetch }: MyApplicationsListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleWithdraw = async (applicationId: string) => {
    try {
      setProcessingId(applicationId);
      await applicationService.updateApplication(applicationId, { status: 'withdrawn' });
      onRefetch();
    } catch (error) {
      console.error('Failed to withdraw application:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (applications.length === 0) {
    return <p className="text-gray-500">You haven&apos;t applied to any projects yet.</p>;
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
              <h4 className="font-semibold text-gray-900 text-lg">
                {app.project?.title}
              </h4>
              
              {app.project?.description && (
                <p className="text-gray-600 text-sm mt-1">{app.project.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                {app.project?.budget_amount && (
                  <span>
                    Budget: ${app.project.budget_amount} {app.project.budget_currency}
                  </span>
                )}
                {app.project?.deadline && (
                  <span>
                    Deadline: {new Date(app.project.deadline).toLocaleDateString()}
                  </span>
                )}
                {app.proposed_rate && (
                  <span>
                    Your Proposed Rate: ${app.proposed_rate}
                  </span>
                )}
              </div>

              {app.project?.client && (
                <div className="mt-3 flex items-center gap-2">
                  {app.project.client.avatar_url ? (
                    <img
                      src={app.project.client.avatar_url}
                      alt={app.project.client.full_name || 'Client'}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-semibold">
                        {app.project.client.full_name?.charAt(0) || 'C'}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-600">
                    {app.project.client.full_name || 'Client'}
                  </span>
                </div>
              )}

              {app.cover_letter && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Your Cover Letter:</p>
                  <p className="text-sm text-gray-600 mt-1">{app.cover_letter}</p>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <span>Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                <StatusBadge status={app.status} />
              </div>
            </div>

            {app.status === 'pending' && (
              <div className="ml-4">
                <Button
                  onClick={() => handleWithdraw(app.id)}
                  disabled={processingId === app.id}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                >
                  {processingId === app.id ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
