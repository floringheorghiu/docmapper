import { describe, it, expect } from 'vitest';
import { VisualizationService } from '../plugin/services/visualization';

describe('VisualizationService', () => {
  const service = new VisualizationService();

  it('should format interaction descriptions correctly', () => {
    const interaction = {
      trigger: { type: 'ON_CLICK' },
      action: { type: 'NAVIGATE', navigation: 'Screen 2' }
    };

    const description = service['getInteractionDescription'](interaction);
    expect(description).toBe('On tap → Screen 2');
  });
});