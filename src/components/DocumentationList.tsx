import React from 'react';
import { DocumentationItem as DocItem } from './DocumentationItem';
import type { DocumentationItem } from '../types/documentation';

interface DocumentationListProps {
  items: DocumentationItem[];
}

export function DocumentationList({ items }: DocumentationListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {items.map((item, index) => (
        <DocItem key={index} {...item} />
      ))}
    </div>
  );
}