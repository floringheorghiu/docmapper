import React from 'react';
import { Github, Link } from 'lucide-react';

interface HeaderProps {
  onWebsiteClick: () => void;
  onGithubClick: () => void;
}

export function Header({ onWebsiteClick, onGithubClick }: HeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h1 className="text-base font-semibold text-gray-900 dark:text-white">
        Figma Fridays Tools
      </h1>
      <div className="flex items-center gap-2">
        <button
          onClick={onWebsiteClick}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Visit website"
        >
          <Link className="w-5 h-5" />
        </button>
        <button
          onClick={onGithubClick}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          title="View source"
        >
          <Github className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}