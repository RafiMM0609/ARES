'use client';

import { StatusBadge } from '@/components/ui';
import type { ProjectWithRelations } from '@/services';

interface ProjectCardProps {
  project: ProjectWithRelations;
  viewType: 'client' | 'freelancer';
}

export function ProjectCard({ project, viewType }: ProjectCardProps) {
  const counterpart = viewType === 'client' ? project.freelancer : project.client;
  const counterpartLabel = viewType === 'client' ? 'Freelancer' : 'Client';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{project.description}</p>
          <div className="mt-2 flex gap-4 text-sm text-gray-500">
            <span>Budget: ${project.budget_amount} {project.budget_currency}</span>
            {counterpart && (
              <span>{counterpartLabel}: {counterpart.full_name}</span>
            )}
          </div>
        </div>
        <StatusBadge status={project.status} size="md" />
      </div>
    </div>
  );
}
