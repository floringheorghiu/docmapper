import { 
  Interaction, 
  ScreenContext, 
  InteractionTrigger, 
  ActionType 
} from '../../types/documentation';
import type { BaseNode, SceneNode } from '../../types/figma';

interface FigmaReaction {
  trigger: {
    type: string;
    delay?: number;
    preventDefault?: boolean;
  };
  action: {
    type: string;
    destinationId?: string;
    navigation?: string;
    duration?: number;
    overlay?: {
      name: string;
    };
  };
}

export class InteractionDetector {
  hasInteractions(node: BaseNode): boolean {
    return this.isInteractiveNode(node) && this.hasValidReactions(node as SceneNode);
  }

  getInteractions(node: BaseNode): Interaction[] {
    if (!this.hasInteractions(node)) {
      return [];
    }

    const screenContext = this.getScreenContext(node);
    const sceneNode = node as SceneNode & { reactions: FigmaReaction[] };
    const reactions = this.parseReactions(sceneNode);

    return reactions.map(reaction => ({
      ...reaction,
      screen: screenContext
    }));
  }

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

  getInteractionDescription(interaction: Interaction): string {
    const trigger = this.normalizeTrigger(interaction.trigger);
    const action = this.normalizeAction(interaction.action);
    let description = `${trigger} → ${action}`;

    if (interaction.metadata?.delay) {
      description += ` (after ${interaction.metadata.delay}ms)`;
    }

    if (interaction.actionMetadata?.destination) {
      description += ` to ${interaction.actionMetadata.destination}`;
    }

    return description;
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

  private isInteractiveNode(node: BaseNode): boolean {
    return 'reactions' in node && 'visible' in node;
  }

  private hasValidReactions(node: SceneNode & { reactions?: FigmaReaction[] }): boolean {
    return Array.isArray(node.reactions) && node.reactions.length > 0;
  }

  private parseReactions(node: SceneNode & { reactions: FigmaReaction[] }): Interaction[] {
    return node.reactions
      .filter((reaction: FigmaReaction) => this.isValidReaction(reaction))
      .map((reaction: FigmaReaction) => ({
        trigger: this.normalizeTrigger(reaction.trigger.type) as InteractionTrigger,
        action: this.normalizeAction(reaction.action.type) as ActionType,
        metadata: {
          delay: reaction.trigger.delay || 0,
          duration: reaction.action.duration,
          preventDefault: reaction.trigger.preventDefault
        },
        actionMetadata: {
          destinationId: reaction.action.destinationId,
          destination: reaction.action.destinationId ? 
            figma.getNodeById(reaction.action.destinationId)?.name : 
            undefined,
          overlay: reaction.action.overlay?.name
        }
      }));
  }

  private isValidReaction(reaction: FigmaReaction): boolean {
    return Boolean(
      reaction &&
      reaction.trigger &&
      reaction.trigger.type &&
      reaction.action &&
      reaction.action.type
    );
  }

  private normalizeTrigger(triggerType: string): string {
    const triggerMap: Record<string, string> = {
      'ON_CLICK': 'On tap',
      'MOUSE_ENTER': 'On hover',
      'MOUSE_LEAVE': 'On hover end',
      'AFTER_TIMEOUT': 'After delay',
      'ON_DRAG': 'On drag',
      'KEY_DOWN': 'On key press',
      'SCROLL': 'On scroll',
      'SWIPE': 'On swipe'
    };
    return triggerMap[triggerType.toUpperCase()] || triggerType;
  }

  private normalizeAction(actionType: string): string {
    const actionMap: Record<string, string> = {
      'NAVIGATE': 'Navigate',
      'SMART_ANIMATE': 'Smart animate',
      'OVERLAY': 'Show overlay',
      'SWAP': 'Swap component',
      'STATE_CHANGE': 'Change state',
      'OPEN_URL': 'Open URL'
    };
    return actionMap[actionType.toUpperCase()] || actionType;
  }
}