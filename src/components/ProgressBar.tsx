import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  memoryWarning?: {
    message: string;
    usage: number;
    level: 'warning' | 'critical';
  };
}

export function ProgressBar({ progress, memoryWarning }: ProgressBarProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 dark:text-gray-400">
          Generating documentation...
        </span>
        <span className="text-gray-600 dark:text-gray-400">{progress}%</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {memoryWarning && (
        <div className={`mt-2 flex items-center gap-2 text-sm ${
          memoryWarning.level === 'critical' ? 'text-red-500' : 'text-yellow-500'
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span>{memoryWarning.message} ({memoryWarning.usage}%)</span>
        </div>
      )}
    </div>
  );
}