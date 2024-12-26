import { describe, it, expect } from 'vitest';
import { TraversalService } from '../plugin/services/traversal';

describe('TraversalService', () => {
  const service = new TraversalService();

  it('should validate interactive nodes correctly', () => {
    const node = {
      id: '1',
      name: 'Test Node',
      type: 'FRAME',
      reactions: [{
        trigger: { type: 'ON_CLICK' },
        action: { type: 'NAVIGATE' }
      }],
      visible: true
    };

    const isValid = service['hasValidInteractions'](node);
    expect(isValid).toBe(true);
  });

  it('should handle empty nodes gracefully', () => {
    const node = {
      id: '2',
      name: 'Empty Node',
      type: 'FRAME',
      reactions: [],
      visible: true
    };

    const isValid = service['hasValidInteractions'](node);
    expect(isValid).toBe(false);
  });
});