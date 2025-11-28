'use client';

import { ReactNode } from 'react';

interface DashboardSectionProps {
  title: string;
  children: ReactNode;
}

export function DashboardSection({ title, children }: DashboardSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
