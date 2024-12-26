import { PluginController } from '../controller';
import { sendToUI } from '../messaging';

export class BatchProcessor {
  private static readonly BATCH_SIZE = 50;
  private static readonly PROCESS_DELAY = 100;
  private static readonly MAX_PROCESSING_TIME = 50000;

  constructor(private controller: PluginController) {}

  async processNodesInBatches(nodes: SceneNode[], totalNodes: number) {
    const startTime = Date.now();
    let processedCount = 0;

    for (let i = 0; i < nodes.length; i += BatchProcessor.BATCH_SIZE) {
      // Check timeout
      if (Date.now() - startTime > BatchProcessor.MAX_PROCESSING_TIME) {
        throw new Error('Processing timeout reached');
      }

      const batch = nodes.slice(i, i + BatchProcessor.BATCH_SIZE);
      
      // Process batch
      await this.processBatch(batch);
      
      // Update progress
      processedCount += batch.length;
      this.updateProgress(processedCount, totalNodes);
      
      // Yield control
      await new Promise(resolve => setTimeout(resolve, BatchProcessor.PROCESS_DELAY));
    }
  }

  private async processBatch(nodes: SceneNode[]) {
    return Promise.all(nodes.map(node => this.processNode(node)));
  }

  private async processNode(node: SceneNode) {
    if (!('reactions' in node) || !node.reactions.length) {
      return null;
    }

    return this.controller.processNode(node);
  }

  private updateProgress(processed: number, total: number) {
    const progress = Math.min(100, Math.round((processed / total) * 100));
    sendToUI({
      type: 'generation-progress',
      progress,
      pageId: figma.currentPage.id,
      processedNodes: processed
    });
  }
}