
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind text color class e.g. text-blue-500
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-primary', className = '' }) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'w-5 h-5 border-2';
      break;
    case 'lg':
      sizeClasses = 'w-16 h-16 border-4';
      break;
    case 'md':
    default:
      sizeClasses = 'w-8 h-8 border-4';
      break;
  }

  return (
    <div
      className={`inline-block ${sizeClasses} ${color} border-solid border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
