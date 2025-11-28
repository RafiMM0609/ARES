'use client';

import { useAvailableProjects } from '@/hooks';
import { AvailableProjectCard } from './AvailableProjectCard';

export function AvailableProjectsSection() {
  const { projects, loading } = useAvailableProjects();

  if (loading) {
    return <p className="text-gray-500">Loading available projects...</p>;
  }

  if (projects.length === 0) {
    return <p className="text-gray-500">No available projects at the moment.</p>;
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <AvailableProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
