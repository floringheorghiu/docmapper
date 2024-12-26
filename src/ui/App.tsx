import React, { useEffect } from 'react';
import { debug } from '../utils/debug';
import { eventTracker } from '../plugin/eventTracker';
import { performance } from '../plugin/performance';
import { memoryTracker } from '../plugin/memoryTracker';

// Simple message types
type PluginMessage = {
  type: string;
  items?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  message?: string;
};

const App: React.FC = () => {
  useEffect(() => {
    debug.log('UI', 'Initializing');
    
    const handleMessage = (event: MessageEvent<{ pluginMessage: PluginMessage }>) => {
      const msg = event.data.pluginMessage;
      eventTracker.track('ui-message-received', msg);

      try {
        handlePluginMessage(msg);
      } catch (error) {
        debug.error('UI', error instanceof Error ? error : new Error(String(error)));
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      debug.log('UI', 'Cleaning up');
      eventTracker.clear();
    };
  }, []);

  const handlePluginMessage = (msg: PluginMessage): void => {
    performance.start('handle-plugin-message');
    
    try {
      switch (msg.type) {
        case 'selection-update':
          msg.items && updateUI(msg.items);
          break;
        case 'error':
          msg.message && showError(msg.message);
          break;
      }
    } finally {
      performance.end('handle-plugin-message');
    }
  };

  const updateUI = (items: Array<{ id: string; name: string; type: string }>) => {
    debug.log('UI', 'Updating with items', items);
    // Add your UI update logic here
  };

  const showError = (message: string) => {
    debug.error('UI', new Error(message));
    // Add your error display logic here
  };

  const handleAnalyzeClick = () => {
    debug.log('UI', 'Analyze button clicked');
    eventTracker.track('analyze-button-click');
    
    performance.start('analyze-request');
    memoryTracker.track('before-analyze');

    try {
      parent.postMessage({ 
        pluginMessage: { type: 'analyze-selection' }
      }, '*');
    } catch (error) {
      debug.error('UI', error instanceof Error ? error : new Error(String(error)));
    } finally {
      performance.end('analyze-request');
      memoryTracker.track('after-analyze');
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={handleAnalyzeClick}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        type="button"
      >
        Analyze Selection
      </button>
    </div>
  );
};

export default App; 