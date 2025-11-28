'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  colorClass?: string;
}

export function StatCard({ title, value, colorClass = 'text-blue-600' }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}
