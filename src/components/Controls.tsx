import React from 'react';
import { Scope, DocumentationChunk, ReportPlacement } from '../types/documentation';
import { downloadMermaid, downloadMarkdown } from '../utils/export';

interface ControlsProps {
  scope: Scope;
  reportPlacement: ReportPlacement;
  onScopeChange: (scope: Scope) => void;
  onReportPlacementChange: (placement: ReportPlacement) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  chunks: DocumentationChunk[];
}

export function Controls({ scope, reportPlacement, onScopeChange, onReportPlacementChange, onGenerate, isGenerating, chunks }: ControlsProps) {
  const hasResults = chunks.length > 0;

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

      <div className="mb-4">
        <label className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 block">
          Canvas report
        </label>
        <select
          value={reportPlacement}
          onChange={(event) => onReportPlacementChange(event.target.value as ReportPlacement)}
          disabled={isGenerating}
          className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 disabled:opacity-50"
        >
          <option value="new-page">New Documentation page</option>
          <option value="current-page">Current page / in situ</option>
          <option value="none">Skip canvas report</option>
        </select>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? 'Generating…' : 'Generate Documentation'}
      </button>

      {hasResults && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => downloadMermaid(chunks)}
            className="flex-1 py-1.5 px-3 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium transition-colors"
          >
            Export Mermaid
          </button>
          <button
            onClick={() => downloadMarkdown(chunks)}
            className="flex-1 py-1.5 px-3 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium transition-colors"
          >
            Export Markdown
          </button>
        </div>
      )}
    </div>
  );
}
