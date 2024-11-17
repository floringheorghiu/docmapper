import React from 'react';
import { Scope } from '../types/documentation';

interface ControlsProps {
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function Controls({ scope, onScopeChange, onGenerate, isGenerating }: ControlsProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Scope
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="scope"
              checked={scope === 'current'}
              onChange={() => onScopeChange('current')}
              className="text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Page
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="scope"
              checked={scope === 'selection'}
              onChange={() => onScopeChange('selection')}
              className="text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Current Selection
            </span>
          </label>
        </div>
      </div>
      
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Generate Documentation
      </button>
    </div>
  );
}