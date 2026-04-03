import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { ProgressBar } from './components/ProgressBar';
import { DocumentationList } from './components/DocumentationList';
import { Version } from './components/Version';
import type { Scope, DocumentationItem, DocumentationChunk } from './types/documentation';

function chunkToItem(chunk: DocumentationChunk): DocumentationItem {
  return {
    id: chunk.nodeId,
    name: chunk.name,
    type: chunk.type,
    interactions: chunk.interactions,
    path: chunk.screen?.parentPath,
    screen: chunk.screen,
  };
}

export default function App() {
  const [scope, setScope] = useState<Scope>('current');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<DocumentationItem[]>([]);
  const [chunks, setChunks] = useState<DocumentationChunk[]>([]);
  const [memoryWarning, setMemoryWarning] = useState<{
    message: string;
    usage: number;
    level: 'warning' | 'critical';
  } | undefined>();

  useEffect(() => {
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (!message) return;

      switch (message.type) {
        case 'generation-progress':
          setProgress(message.progress);
          break;
        case 'chunk-loaded':
          setItems(prev => [...prev, chunkToItem(message.chunk)]);
          break;
        case 'generation-complete':
          setIsGenerating(false);
          setProgress(100);
          if (message.chunks) {
            setChunks(message.chunks);
          }
          break;
        case 'generation-error':
          setIsGenerating(false);
          break;
        case 'memory-warning':
          setMemoryWarning({
            message: message.message,
            usage: message.usage,
            level: message.level
          });
          break;
      }
    };
  }, []);

  const handleGenerate = () => {
    setProgress(0);
    setItems([]);
    setChunks([]);
    setMemoryWarning(undefined);
    setIsGenerating(true);
    parent.postMessage({
      pluginMessage: {
        type: 'generate-docs',
        options: { scope }
      }
    }, '*');
  };

  const handleWebsiteClick = () => {
    parent.postMessage({
      pluginMessage: {
        type: 'open-url',
        url: 'https://www.figmafridays.com'
      }
    }, '*');
  };

  const handleGithubClick = () => {
    parent.postMessage({
      pluginMessage: {
        type: 'open-url',
        url: 'https://github.com/floringheorghiu/docmapper'
      }
    }, '*');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white dark:bg-gray-900 flex flex-col h-full">
        <Header
          onWebsiteClick={handleWebsiteClick}
          onGithubClick={handleGithubClick}
        />

        <Controls
          scope={scope}
          onScopeChange={setScope}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          chunks={chunks}
        />

        {isGenerating && (
          <ProgressBar
            progress={progress}
            memoryWarning={memoryWarning}
          />
        )}

        <DocumentationList items={items} />

        <Version />
      </div>
    </div>
  );
}
