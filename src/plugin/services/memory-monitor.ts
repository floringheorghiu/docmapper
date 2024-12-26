import { sendToUI } from '../messaging';

export interface MemoryReport {
  average: number;
  peak: number;
  samples: number;
  currentUsage: number;
}

export class MemoryMonitor {
  private static readonly WARNING_THRESHOLD = 0.8;
  private static readonly CRITICAL_THRESHOLD = 0.9;
  private static readonly CHECK_INTERVAL = 5000;
  
  private memoryUsage: number[] = [];
  private monitoringInterval?: ReturnType<typeof setInterval>;
  private isWarningIssued = false;
  private isCriticalIssued = false;

  startMonitoring(): void {
    this.reset();
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, MemoryMonitor.CHECK_INTERVAL);
  }

  stopMonitoring(): MemoryReport {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    return this.generateReport();
  }

  private reset(): void {
    this.memoryUsage = [];
    this.isWarningIssued = false;
    this.isCriticalIssued = false;
  }

  private checkMemoryUsage(): void {
    const currentUsage = this.getCurrentMemoryUsage();
    this.memoryUsage.push(currentUsage);

    if (currentUsage >= MemoryMonitor.CRITICAL_THRESHOLD && !this.isCriticalIssued) {
      this.handleCriticalMemory(currentUsage);
    } else if (currentUsage >= MemoryMonitor.WARNING_THRESHOLD && !this.isWarningIssued) {
      this.handleWarningMemory(currentUsage);
    }
  }

  private getCurrentMemoryUsage(): number {
    const objectCount = figma.root.children.reduce((count: number, page: any) => {
      return count + this.countNodes(page);
    }, 0);
    
    const estimatedMemoryUsage = objectCount * 1024;
    const availableMemory = 1024 * 1024 * 1024;
    
    return estimatedMemoryUsage / availableMemory;
  }

  private countNodes(node: any): number {
    let count = 1;
    if ('children' in node) {
      count += node.children.reduce((sum: number, child: any) => sum + this.countNodes(child), 0);
    }
    return count;
  }

  private handleWarningMemory(usage: number): void {
    this.isWarningIssued = true;
    sendToUI({
      type: 'memory-warning',
      message: 'Memory usage is high',
      usage: Math.round(usage * 100),
      level: 'warning'
    });
  }

  private handleCriticalMemory(usage: number): void {
    this.isCriticalIssued = true;
    sendToUI({
      type: 'memory-warning',
      message: 'Critical memory usage detected',
      usage: Math.round(usage * 100),
      level: 'critical'
    });
  }

  private generateReport(): MemoryReport {
    const currentUsage = this.getCurrentMemoryUsage();
    return {
      average: this.memoryUsage.reduce((a, b) => a + b, 0) / this.memoryUsage.length,
      peak: Math.max(...this.memoryUsage),
      samples: this.memoryUsage.length,
      currentUsage
    };
  }
}