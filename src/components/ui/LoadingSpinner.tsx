'use client';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center items-center min-h-96">
      <div className="text-xl">{message}</div>
    </div>
  );
}
