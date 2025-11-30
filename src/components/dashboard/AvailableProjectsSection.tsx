'use client';

import { useState } from 'react';
import { useAvailableProjects } from '@/hooks';
import { AvailableProjectCard } from './AvailableProjectCard';
import { applicationService } from '@/services';

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

export function AvailableProjectsSection() {
  const { projects, loading, refetch } = useAvailableProjects();
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const handleApply = async (projectId: string) => {
    try {
      setApplying(projectId);
      setMessage(null);
      await applicationService.createApplication({ project_id: projectId });
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading available projects...</p>;
  }

  if (projects.length === 0) {
    return <p className="text-gray-500">No available projects at the moment.</p>;
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      {projects.map((project) => (
        <AvailableProjectCard 
          key={project.id} 
          project={project} 
          onApply={handleApply}
          isApplying={applying === project.id}
        />
      ))}
    </div>
  );
}
