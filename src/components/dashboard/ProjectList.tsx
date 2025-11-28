'use client';

import { ProjectCard } from './ProjectCard';
import type { ProjectWithRelations } from '@/services';

interface ProjectListProps {
  projects: ProjectWithRelations[];
  viewType: 'client' | 'freelancer';
  emptyMessage?: string;
}

export function ProjectList({ projects, viewType, emptyMessage = 'No projects yet.' }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          viewType={viewType}
        />
      ))}
    </div>
  );
}
