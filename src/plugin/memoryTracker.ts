import { debug } from '../utils/debug';

interface MemorySnapshot {
  timestamp: number;
  usage: number;
  operation: string;
}

export class MemoryTracker {
  private snapshots: MemorySnapshot[] = [];

  track(operation: string): void {
    // Fix: performance.memory is not available in Figma's environment
    // Instead, we'll use a different memory measurement approach
    const memoryUsage = this.estimateMemoryUsage();
    
    debug.log('Memory', `Usage for ${operation}:`, memoryUsage);
    
    this.snapshots.push({
      timestamp: Date.now(),
      usage: memoryUsage,
      operation
    });
  }

  private estimateMemoryUsage(): number {
    try {
      // Estimate memory based on node count
      const nodeCount = figma.root.children.reduce((count, page) => {
        return count + this.countNodes(page);
      }, 0);
      
      return nodeCount * 1024; // Rough estimate: 1KB per node
    } catch (error) {
      debug.error('Memory', error as Error);
      return 0;
    }
  }

  private countNodes(node: BaseNode): number {
    let count = 1;
    if ('children' in node) {
      count += (node.children || []).reduce((sum, child) => 
        sum + this.countNodes(child), 0
      );
    }
    return count;
  }

  getLeaks(): MemorySnapshot[] {
    return this.snapshots.filter((snapshot, index) => {
      if (index === 0) return false;
      const previousUsage = this.snapshots[index - 1].usage;
      return snapshot.usage > previousUsage * 1.5;
    });
  }

  clear(): void {
    this.snapshots = [];
    debug.log('Memory', 'Tracker cleared');
  }
}

export const memoryTracker = new MemoryTracker(); 