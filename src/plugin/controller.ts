import { DocumentationChunk, ReportPlacement } from '../types/documentation';
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

  async generateDocumentation(scope: 'current' | 'selection', reportPlacement: ReportPlacement = 'new-page') {
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

      const report = await this.createCanvasReport(reportPlacement);
      this.sendCompletionStatus(1, totalNodes, report);
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
      const screenContext = await this.interactionParser.getScreenContext(node);
      const textContent = this.interactionParser.extractTextContent(node);
      const interactions = node.reactions.flatMap((reaction: any) => {
        const trigger = this.interactionParser.parseTrigger(reaction);
        return this.interactionParser.parseActions(reaction).map(action => ({ trigger, action }));
      });

      const chunk: DocumentationChunk = {
        pageId: figma.currentPage.id,
        nodeId: node.id,
        name: node.name,
        type: node.type,
        textContent,
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

  private async createCanvasReport(reportPlacement: ReportPlacement) {
    if (reportPlacement === 'none') {
      return { created: false, placement: reportPlacement };
    }

    try {
      await this.visualizationService.createDocumentationNodes(this.documentationChunks, reportPlacement);
      return { created: true, placement: reportPlacement };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown canvas report error';

      if (reportPlacement === 'new-page') {
        try {
          await this.visualizationService.createDocumentationNodes(this.documentationChunks, 'current-page');
          const fallbackMessage = `Could not create a new Documentation page, so the report was created on the current page instead. Reason: ${message}`;
          figma.notify(fallbackMessage, { timeout: 7000 });
          sendToUI({
            type: 'generation-warning',
            message: fallbackMessage
          });
          return { created: true, placement: 'current-page' as const, error: message };
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback report error';
          sendToUI({
            type: 'generation-warning',
            message: `Interactions extracted, but the canvas report could not be created: ${fallbackMessage}`
          });
          return { created: false, placement: reportPlacement, error: fallbackMessage };
        }
      }

      sendToUI({
        type: 'generation-warning',
        message: `Interactions extracted, but the canvas report could not be created: ${message}`
      });
      return { created: false, placement: reportPlacement, error: message };
    }
  }

  private sendCompletionStatus(totalPages: number, totalNodes: number, report: Awaited<ReturnType<PluginController['createCanvasReport']>>) {
    sendToUI({
      type: 'generation-complete',
      stats: {
        totalPages,
        totalNodes,
        processedNodes: this.processedNodes
      },
      chunks: this.documentationChunks,
      report
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