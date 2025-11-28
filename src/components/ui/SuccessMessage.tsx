'use client';

interface SuccessMessageProps {
  message: string;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  return (
    <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
      {message}
    </div>
  );
}
