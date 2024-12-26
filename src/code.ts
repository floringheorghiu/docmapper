// Add proper type definitions
type PluginMessage = {
  type: 'analyze-selection';
  // Add other message types as needed
};

import { debug } from './plugin/utils/debug';
import { eventTracker } from './plugin/eventTracker';
import { performance } from './plugin/performance';
import { memoryTracker } from './plugin/memoryTracker';

figma.showUI(__html__, {
  width: 400,
  height: 600
});

// Add initial debug log
debug.log('Plugin', 'Plugin initialized');

// Add proper type to onmessage
figma.ui.onmessage = async (msg: PluginMessage) => {
  debug.log('Plugin', 'Message received', msg);
  performance.start('message-handling');

  try {
    eventTracker.track('message-received', msg);
    
    // Track memory before processing
    memoryTracker.track('before-processing');

    switch (msg.type) {
      case 'analyze-selection':
        debug.log('Selection', 'Starting analysis');
        await handleSelection();
        debug.log('Selection', 'Analysis complete');
        break;
    }

    // Track memory after processing
    memoryTracker.track('after-processing');
    performance.end('message-handling');
    
    // Show performance stats
    const stats = performance.getStats('message-handling');
    debug.log('Performance', 'Message handling stats', stats);

  } catch (error) {
    debug.error('Plugin', error instanceof Error ? error : new Error(String(error)));
  }
};

async function handleSelection() {
  performance.start('selection-analysis');
  memoryTracker.track('before-selection');

  try {
    const nodes = figma.currentPage.selection;
    if (nodes.length === 0) {
      throw new Error('No nodes selected');
    }

    debug.log('Selection', `Processing ${nodes.length} nodes`);

    for (const node of nodes) {
      performance.start(`process-node-${node.id}`);
      await processNode(node);
      performance.end(`process-node-${node.id}`);
    }

    memoryTracker.track('after-selection');
    performance.end('selection-analysis');

    const stats = performance.getStats('selection-analysis');
    debug.log('Performance', 'Analysis complete', stats);

  } catch (error) {
    debug.error('Selection', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

async function processNode(node: SceneNode): Promise<void> {
  try {
    debug.log('Node', `Processing ${node.name} (${node.type})`);
    
    // Add your core plugin logic here
    // For example:
    // - Analyze node properties
    // - Extract text content
    // - Process document structure
    
  } catch (error) {
    debug.error('Node', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

function analyzeOperation(): void {
  try {
    const leaks = memoryTracker.getLeaks();
    console.table(leaks);

    const history = eventTracker.getEventHistory();
    console.table(history);

    const stats = performance.getStats('operation-name');
    console.log('Performance:', stats);
  } catch (error) {
    debug.error('Analysis', error instanceof Error ? error : new Error(String(error)));
  }
} 