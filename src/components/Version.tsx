import React from 'react';
import { VERSION, LAST_STABLE } from '../constants';

export function Version() {
  return (
    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
      <span>Version {VERSION}</span>
      {VERSION !== LAST_STABLE && (
        <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
          Beta
        </span>
      )}
    </div>
  );
}