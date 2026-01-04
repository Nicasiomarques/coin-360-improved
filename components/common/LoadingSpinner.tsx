import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "h-5 w-5 border-2 border-indigo-500" }) => {
  return (
    <div className={`animate-spin rounded-full border-t-transparent ${className}`}></div>
  );
};
