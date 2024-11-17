import { describe, it, expect } from 'vitest';
import { InteractionDetector } from '../plugin/services/interaction-detector';

describe('InteractionDetector', () => {
  const detector = new InteractionDetector();

  it('should normalize trigger types correctly', () => {
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

    const interactions = detector.getInteractions(node);
    expect(interactions[0].trigger).toBe('On tap');
  });

  it('should handle invalid nodes gracefully', () => {
    const invalidNode = {
      id: '2',
      name: 'Invalid Node',
      type: 'FRAME'
    };

    const interactions = detector.getInteractions(invalidNode);
    expect(interactions).toHaveLength(0);
  });
});