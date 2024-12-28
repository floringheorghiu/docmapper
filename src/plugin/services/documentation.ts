import { TraversalService } from './traversal';
import type { DocumentationChunk, Interaction, InteractionTrigger, Scope } from '../../types/documentation';
import { InteractionDetector } from './interaction-detector';

export class DocumentationService {
  private readonly BATCH_SIZE = 50;
  private readonly traversalService: TraversalService;
  private readonly detector: InteractionDetector;

  constructor() {
    this.traversalService = new TraversalService();
    this.detector = new InteractionDetector();
  }

  async generateDocumentation(scope: Scope): Promise<void> {
    try {
      const nodes = await this.traversalService.findInteractiveNodes(scope);
      let processedNodes = 0;

      while (processedNodes < nodes.length) {
        const batch = nodes.slice(processedNodes, processedNodes + this.BATCH_SIZE);
        
        for (const node of batch) {
          if ('reactions' in node) {
            // Get interactions using the detector
            const interactions = await this.detector.getInteractions(node);
            
            const chunk: DocumentationChunk = {
              pageId: figma.currentPage.id,
              nodeId: node.id,
              name: node.name,
              type: node.type,
              interactions: interactions,
              timestamp: Date.now(),
              version: 1
            };

            figma.ui.postMessage({
              type: 'documentation-chunk',
              data: chunk
            });
          }
        }

        processedNodes += batch.length;
        
        // Update progress
        figma.ui.postMessage({
          type: 'generation-progress',
          progress: Math.round((processedNodes / nodes.length) * 100)
        });

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      figma.ui.postMessage({ type: 'generation-complete' });
    } catch (error) {
      figma.ui.postMessage({
        type: 'generation-error',
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  }

  private formatInteractions(reactions: any[]): Interaction[] {
    return reactions.map(reaction => ({
      trigger: this.normalizeTrigger(reaction.trigger.type),
      action: this.mapActionType(reaction.action.type),
      actionMetadata: {
        destinationId: reaction.action.destinationId,
        destination: reaction.action.destination
      }
    }));
  }

  private normalizeTrigger(triggerType: string): InteractionTrigger {
    const triggerMap: Record<string, InteractionTrigger> = {
      'ON_CLICK': 'click',
      'ON_HOVER': 'hover',
      'AFTER_TIMEOUT': 'timeout',
      'MOUSE_LEAVE': 'hover',
      'MOUSE_DOWN': 'click',
      'MOUSE_UP': 'click',
      'KEY_DOWN': 'key',
      'ON_DRAG': 'drag',
      'DRAG_ENTER': 'drag',
      'DRAG_LEAVE': 'drag',
      'DROP': 'click'
    };
    return triggerMap[triggerType] || 'click';
  }

  private mapActionType(type: string): Interaction['action'] {
    // Map Figma action types to your ActionType
    const map: Record<string, Interaction['action']> = {
      'NAVIGATE': 'navigate',
      'OVERLAY': 'overlay',
      'SWAP': 'component-swap',
      // Add other mappings as needed
    };
    return map[type] || 'navigate';
  }

  private mapTriggerType(triggerType: string): string {
    const triggerMap: Record<string, string> = {
      'ON_CLICK': 'Click',
      'MOUSE_ENTER': 'Hover',
      'MOUSE_LEAVE': 'Mouse leave',
      'MOUSE_DOWN': 'Mouse down',
      'MOUSE_UP': 'Mouse up',
      'KEY_DOWN': 'Key press',
      'AFTER_TIMEOUT': 'After delay',
      'ON_DRAG': 'Drag',
      'DRAG_ENTER': 'Drag enter',
      'DRAG_LEAVE': 'Drag leave',
      'DROP': 'Drop'
    };
    return triggerMap[triggerType] || 'Unknown trigger';
  }
} 