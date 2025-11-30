'use client';

import { FormSelect } from '@/components/ui';
import type { ProjectWithRelations } from '@/services';

interface ApplicationFilterProps {
  projects: ProjectWithRelations[];
  selectedProjectId: string;
  selectedStatus: string;
  onProjectChange: (projectId: string) => void;
  onStatusChange: (status: string) => void;
}

export function ApplicationFilter({
  projects,
  selectedProjectId,
  selectedStatus,
  onProjectChange,
  onStatusChange,
}: ApplicationFilterProps) {
  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map(p => ({ value: p.id, label: p.title })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="min-w-[200px]">
        <FormSelect
          label="Filter by Project"
          value={selectedProjectId}
          onChange={(e) => onProjectChange(e.target.value)}
          options={projectOptions}
        />
      </div>
      <div className="min-w-[150px]">
        <FormSelect
          label="Filter by Status"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
        />
      </div>
    </div>
  );
}
