type EventData = Record<string, unknown>;

class EventTracker {
  private events: Array<{ name: string; data?: EventData }> = [];

  track(eventName: string, data?: EventData): void {
    this.events.push({ name: eventName, data });
    console.log(`Event: ${eventName}`, data);
  }

  getEventHistory() {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

export const eventTracker = new EventTracker();