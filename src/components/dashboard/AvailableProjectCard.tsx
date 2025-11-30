'use client';

import { Button } from '@/components/ui';
import type { ProjectWithRelations } from '@/services';

interface AvailableProjectCardProps {
  project: ProjectWithRelations;
  onApply?: (projectId: string) => void;
  isApplying?: boolean;
}

export function AvailableProjectCard({ project, onApply, isApplying }: AvailableProjectCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
      <p className="text-gray-600 text-sm mt-1">{project.description}</p>
      <div className="mt-2 flex gap-4 text-sm text-gray-500">
        <span>Budget: ${project.budget_amount} {project.budget_currency}</span>
        {project.deadline && (
          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
        )}
      </div>
      <Button 
        className="mt-3 text-sm"
        onClick={() => onApply?.(project.id)}
        disabled={isApplying}
      >
        {isApplying ? 'Applying...' : 'Apply'}
      </Button>
    </div>
  );
}
