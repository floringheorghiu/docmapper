import type { Scope, DocumentationChunk } from './documentation';

export interface GenerationProgress {
  type: 'generation-progress';
  progress: number;
  pageId: string;
  processedNodes: number;
}

export interface GenerationStats {
  totalPages: number;
  totalNodes: number;
  processedNodes: number;
}

export interface MemoryWarning {
  type: 'memory-warning';
  message: string;
  usage: number;
  level: 'warning' | 'critical';
}

export type PluginToUIMessage = 
  | GenerationProgress
  | { type: 'generation-complete'; stats: GenerationStats }
  | { type: 'generation-error'; error: string; canResume: boolean; pageId?: string }
  | { type: 'chunk-loaded'; chunk: DocumentationChunk }
  | MemoryWarning;

export type UIToPluginMessage =
  | { type: 'generate-docs'; options: { scope: Scope } }
  | { type: 'cancel-generation' }
  | { type: 'open-url'; url: string };