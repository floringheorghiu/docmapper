import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { ProgressBar } from './components/ProgressBar';
import { DocumentationList } from './components/DocumentationList';
import { Version } from './components/Version';
import type { Scope } from './types/documentation';

export default function App() {
  const [scope, setScope] = useState<Scope>('current');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
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
        case 'generation-complete':
          setIsGenerating(false);
          setProgress(100);
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
        url: 'https://github.com/floringheorghiu/sb1-wrshpc'
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
        />

        {isGenerating && (
          <ProgressBar 
            progress={progress} 
            memoryWarning={memoryWarning}
          />
        )}

        <DocumentationList items={[]} />
        
        <Version />
      </div>
    </div>
  );
}