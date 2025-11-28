'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui';

interface DashboardHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
    isActive?: boolean;
  };
  children?: ReactNode;
}

export function DashboardHeader({ title, action, children }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {action && (
        <Button onClick={action.onClick}>
          {action.isActive ? 'Cancel' : action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
