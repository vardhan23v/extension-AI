import React from 'react';
import { Loader } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin mb-4">
        <Loader className="w-8 h-8 text-purple-main" />
      </div>
      <p className="text-gray-300 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
