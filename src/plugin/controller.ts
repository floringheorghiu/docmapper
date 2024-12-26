import { DocumentationChunk } from '../types/documentation';
import { sendToUI } from './messaging';
import { VisualizationService } from './services/visualization';
import { BatchProcessor } from './services/batch-processor';
import { TraversalService } from './services/traversal';
import { InteractionParser } from './services/interaction-parser';
import type { SceneNode } from '../types/figma';

export class PluginController {
  private isGenerating: boolean;
  private shouldCancel: boolean;
  private startTime: number;
  private processedNodes: number;
  private visualizationService: VisualizationService;
  private batchProcessor: BatchProcessor;
  private traversalService: TraversalService;
  private interactionParser: InteractionParser;
  private documentationChunks: DocumentationChunk[];

  constructor() {
    this.isGenerating = false;
    this.shouldCancel = false;
    this.startTime = 0;
    this.processedNodes = 0;
    this.visualizationService = new VisualizationService();
    this.batchProcessor = new BatchProcessor(this);
    this.traversalService = new TraversalService();
    this.interactionParser = new InteractionParser();
    this.documentationChunks = [];
  }

  async generateDocumentation(scope: 'current' | 'selection') {
    if (this.isGenerating) {
      throw new Error('Documentation generation already in progress');
    }

    this.startProcess();

    try {
      const totalNodes = await this.traversalService.countTotalNodes(scope);
      if (totalNodes === 0) {
        throw new Error(scope === 'selection' 
          ? 'No interactive elements found in the current selection.' 
          : 'No interactive elements found in the current page.');
      }

      const nodes = await this.traversalService.findInteractiveNodes(scope);
      await this.batchProcessor.processNodesInBatches(nodes, totalNodes);
      await this.visualizationService.createDocumentationNodes(this.documentationChunks);
      
      this.sendCompletionStatus(1, totalNodes);
    } catch (error) {
      if (error instanceof Error) {
        this.handleError(error);
      } else {
        this.handleError(new Error('An unknown error occurred'));
      }
    } finally {
      this.cleanup();
    }
  }

  async processNode(node: SceneNode & { reactions: any[] }) {
    try {
      const screenContext = this.interactionParser.getScreenContext(node);
      const interactions = node.reactions.map((reaction: any) => ({
        trigger: this.interactionParser.parseTrigger(reaction),
        action: this.interactionParser.parseAction(reaction)
      }));

      const chunk: DocumentationChunk = {
        pageId: figma.currentPage.id,
        nodeId: node.id,
        name: node.name,
        type: node.type,
        screen: screenContext,
        interactions: interactions.map((interaction: any) => ({
          trigger: interaction.trigger.type,
          action: interaction.action.type,
          metadata: interaction.trigger.metadata,
          actionMetadata: interaction.action.metadata,
          screen: screenContext
        })),
        timestamp: Date.now(),
        version: 1
      };

      this.documentationChunks.push(chunk);
      sendToUI({
        type: 'chunk-loaded',
        chunk
      });
      return chunk;
    } catch (error) {
      console.error('Error processing node:', error);
      return null;
    }
  }

  private startProcess() {
    this.isGenerating = true;
    this.shouldCancel = false;
    this.startTime = Date.now();
    this.processedNodes = 0;
    this.documentationChunks = [];
  }

  private handleError(error: Error) {
    sendToUI({
      type: 'generation-error',
      error: error.message,
      canResume: false
    });
  }

  private sendCompletionStatus(totalPages: number, totalNodes: number) {
    sendToUI({
      type: 'generation-complete',
      stats: {
        totalPages,
        totalNodes,
        processedNodes: this.processedNodes
      }
    });
  }

  private cleanup() {
    this.isGenerating = false;
    this.shouldCancel = false;
    this.processedNodes = 0;
    this.documentationChunks = [];
  }

  cancelGeneration() {
    this.shouldCancel = true;
  }
}