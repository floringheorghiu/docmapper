import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { ProgressBar } from './components/ProgressBar';
import { DocumentationList } from './components/DocumentationList';
import { Version } from './components/Version';
import type { Scope, ReportPlacement, DocumentationItem, DocumentationChunk } from './types/documentation';

function chunkToItem(chunk: DocumentationChunk): DocumentationItem {
  return {
    id: chunk.nodeId,
    name: chunk.name,
    type: chunk.type,
    textContent: chunk.textContent,
    interactions: chunk.interactions,
    path: chunk.screen?.parentPath,
    screen: chunk.screen,
  };
}

export default function App() {
  const [scope, setScope] = useState<Scope>('selection');
  const [reportPlacement, setReportPlacement] = useState<ReportPlacement>('current-page');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [items, setItems] = useState<DocumentationItem[]>([]);
  const [chunks, setChunks] = useState<DocumentationChunk[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
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
          if (message.report && !message.report.created && message.report.error) {
            setStatusMessage(`Exports are ready, but the canvas report was not created: ${message.report.error}`);
          }
          break;
        case 'generation-error':
          setIsGenerating(false);
          setStatusMessage(message.error);
          break;
        case 'generation-warning':
          setStatusMessage(message.message);
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
    setStatusMessage(undefined);
    setIsGenerating(true);
    parent.postMessage({
      pluginMessage: {
        type: 'generate-docs',
        options: { scope, reportPlacement }
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
          reportPlacement={reportPlacement}
          onScopeChange={setScope}
          onReportPlacementChange={setReportPlacement}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          chunks={chunks}
        />

        {statusMessage && (
          <div className="mx-4 mt-3 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-100 text-sm p-3">
            {statusMessage}
          </div>
        )}

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
