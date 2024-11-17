import { 
  InteractionTrigger, 
  ActionType, 
  InteractionMetadata, 
  ActionMetadata,
  ScreenContext 
} from '../../types/documentation';
import type { BaseNode, SceneNode } from '../../types/figma';

export class InteractionParser {
  getScreenContext(node: BaseNode): ScreenContext {
    const parentFrame = this.findParentFrame(node);
    const nodePath = this.getNodePath(node);

    return {
      screenId: parentFrame?.id || node.id,
      screenName: parentFrame?.name || 'Unknown Screen',
      elementId: node.id,
      elementName: node.name,
      parentPath: nodePath
    };
  }

  parseTrigger(reaction: any): { type: InteractionTrigger; metadata: InteractionMetadata } {
    if (!reaction?.trigger?.type) {
      throw new Error('Invalid trigger format');
    }

    const triggerType = this.normalizeTriggerType(reaction.trigger.type);
    const metadata: InteractionMetadata = {};

    if (reaction.trigger.delay) {
      metadata.delay = reaction.trigger.delay;
    }

    if (reaction.trigger.key) {
      metadata.keyboard = {
        key: reaction.trigger.key,
        ctrl: Boolean(reaction.trigger.ctrl),
        shift: Boolean(reaction.trigger.shift),
        alt: Boolean(reaction.trigger.alt)
      };
    }

    if (reaction.trigger.gesture) {
      metadata.gesture = {
        direction: reaction.trigger.gesture.direction,
        distance: reaction.trigger.gesture.distance
      };
    }

    return { type: triggerType, metadata };
  }

  parseAction(reaction: any): { type: ActionType; metadata: ActionMetadata } {
    if (!reaction?.action?.type) {
      throw new Error('Invalid action format');
    }

    const actionType = this.normalizeActionType(reaction.action.type);
    const metadata: ActionMetadata = {};

    if (reaction.action.transition) {
      metadata.animation = {
        type: reaction.action.transition.type || 'INSTANT',
        duration: reaction.action.transition.duration || 0,
        easing: reaction.action.transition.easing?.type || 'EASE_OUT'
      };
    }

    if (reaction.action.destination) {
      metadata.destination = reaction.action.destination.name;
    }

    if (actionType === 'overlay' && reaction.action.overlaySettings) {
      metadata.overlay = reaction.action.overlaySettings.name;
    }

    if (actionType === 'state-change' && reaction.action.states) {
      metadata.state = {
        from: reaction.action.states.current,
        to: reaction.action.states.target
      };
    }

    return { type: actionType, metadata };
  }

  private findParentFrame(node: BaseNode): SceneNode | null {
    let current: BaseNode | null = node;
    
    while (current && 'parent' in current) {
      if (this.isMainFrame(current)) {
        return current as SceneNode;
      }
      current = current.parent;
    }
    
    return null;
  }

  private isMainFrame(node: BaseNode): boolean {
    if (!('type' in node)) return false;
    const sceneNode = node as SceneNode;
    
    return sceneNode.type === 'FRAME' && 
           sceneNode.parent?.type === 'PAGE' &&
           !this.isComponentOrTemplate(sceneNode.name);
  }

  private isComponentOrTemplate(name: string): boolean {
    const lowerName = name.toLowerCase();
    return lowerName.includes('component') || 
           lowerName.includes('template') ||
           lowerName.includes('master');
  }

  private getNodePath(node: BaseNode): string[] {
    const path: string[] = [];
    let current: BaseNode | null = node;

    while (current && 'parent' in current) {
      if (this.isMainFrame(current)) break;
      path.unshift(current.name);
      current = current.parent;
    }

    return path;
  }

  private normalizeTriggerType(type: string): InteractionTrigger {
    const triggerMap: Record<string, InteractionTrigger> = {
      'ON_CLICK': 'click',
      'MOUSE_ENTER': 'hover',
      'MOUSE_LEAVE': 'hover',
      'AFTER_TIMEOUT': 'timeout',
      'ON_DRAG': 'drag',
      'KEY_DOWN': 'key',
      'SCROLL': 'scroll',
      'SWIPE': 'swipe'
    };

    const normalizedType = triggerMap[type.toUpperCase()];
    if (!normalizedType) {
      console.warn(`Unknown trigger type: ${type}, defaulting to 'click'`);
      return 'click';
    }

    return normalizedType;
  }

  private normalizeActionType(type: string): ActionType {
    const actionMap: Record<string, ActionType> = {
      'NAVIGATE': 'navigate',
      'SMART_ANIMATE': 'smart-animate',
      'OVERLAY': 'overlay',
      'SWAP': 'component-swap',
      'STATE_CHANGE': 'state-change',
      'OPEN_URL': 'navigate'
    };

    const normalizedType = actionMap[type.toUpperCase()];
    if (!normalizedType) {
      console.warn(`Unknown action type: ${type}, defaulting to 'navigate'`);
      return 'navigate';
    }

    return normalizedType;
  }
}