// Debug utility with different levels and areas
export class DebugManager {
  private static instance: DebugManager | null = null;
  private isEnabled: boolean = true;
  private startTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  log(area: string, message: string, data?: unknown): void {
    if (!this.isEnabled) return;
    console.log(`[${area}] ${message}`, data ?? '');
  }

  error(area: string, error: Error | string): void {
    if (error instanceof Error) {
      console.error(`[${area}] ❌ Error:`, error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error(`[${area}] ❌ Error:`, error);
    }
  }

  time(label: string): void {
    this.startTimes.set(label, Date.now());
  }

  timeEnd(label: string): void {
    const startTime = this.startTimes.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`[Timer] ${label}: ${duration}ms`);
      this.startTimes.delete(label);
    } else {
      console.warn(`[Timer] No start time found for: ${label}`);
    }
  }

  enable(): void {
    this.isEnabled = true;
    this.log('Debug', 'Debugging enabled');
  }

  disable(): void {
    this.log('Debug', 'Debugging disabled');
    this.isEnabled = false;
  }

  clear(): void {
    this.startTimes.clear();
    console.clear();
  }
}

export const debug = DebugManager.getInstance(); 