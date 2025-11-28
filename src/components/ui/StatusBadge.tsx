'use client';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
  // Project statuses
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  open: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-800',
  assigned: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  
  // Invoice statuses
  paid: 'bg-green-100 text-green-800',
  sent: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  
  // Payment statuses
  processing: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span className={`${sizeClass} rounded-full font-medium ${colorClass}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}
