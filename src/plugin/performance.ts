// Performance monitoring utility
export class Performance {
    private measurements = new Map<string, number>();
    private stats = new Map<string, { count: number; totalTime: number }>();
  
    start(label: string): void {
      this.measurements.set(label, window.performance.now());
    }
  
    end(label: string): void {
      const measurement = this.measurements.get(label);
      if (measurement) {
        const duration = window.performance.now() - measurement;
        console.log(`Performance [${label}]: ${duration}ms`);

        // Update stats
        if (!this.stats.has(label)) {
          this.stats.set(label, { count: 0, totalTime: 0 });
        }
        const stat = this.stats.get(label)!;
        stat.count += 1;
        stat.totalTime += duration;
      }
    }
  
    clear(): void {
      this.measurements.clear();
      this.stats.clear();
    }
  
    getStats(label: string) {
      return this.stats.get(label) || { count: 0, totalTime: 0 };
    }
  }
  
  export const performance = new Performance();