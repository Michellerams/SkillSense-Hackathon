
import React from 'react';

interface SpinnerProps {
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ className = 'w-8 h-8' }) => (
  <div className={`${className} animate-spin rounded-full border-4 border-t-amber-500 border-gray-200`} role="status">
    <span className="sr-only">Loading...</span>
  </div>
);
