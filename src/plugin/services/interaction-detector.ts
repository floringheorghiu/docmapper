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
    console.log('[InteractionDetector] Checking if node has interactions:', node.id, node.name);

    return this.isInteractiveNode(node) && this.hasValidReactions(node as SceneNode);
  }

  // Async migration: Await parseReactions for Figma Community compatibility
  async getInteractions(node: BaseNode): Promise<Interaction[]> {
    console.log('[InteractionDetector] getInteractions called for node:', node.id, node.name);

    if (!this.hasInteractions(node)) {
      console.log('[InteractionDetector] Node has no interactions:', node.id, node.name);
      return [];
    }

    let screenContext: ScreenContext = {
      screenId: node.id,
      screenName: 'Unknown Screen',
      elementId: node.id,
      elementName: node.name,
      parentPath: []
    };
    try {
      console.log('[InteractionDetector] Getting screen context for node:', node.id, node.name);
      screenContext = await this.getScreenContext(node);
      console.log('[InteractionDetector] Screen context:', screenContext);
    } catch (err) {
      console.error('[getInteractions] Error in getScreenContext:', err);
    }
    const sceneNode = node as SceneNode & { reactions: FigmaReaction[] };
    let reactions: Interaction[] = [];
    try {
      console.log('[InteractionDetector] Parsing reactions for node:', node.id, node.name);
      reactions = await this.parseReactions(sceneNode);
      console.log('[InteractionDetector] Parsed reactions:', reactions);
    } catch (err) {
      console.error('[getInteractions] Error in parseReactions:', err);
      reactions = [];
    }

    const mapped = reactions.map(reaction => ({
      ...reaction,
      screen: screenContext
    }));
    console.log('[InteractionDetector] Returning mapped interactions:', mapped);
    return mapped;
  }

  // Async migration: Await findParentFrame and getNodePath for Figma Community compatibility
  async getScreenContext(node: BaseNode): Promise<ScreenContext> {
    console.log('[InteractionDetector] getScreenContext called for node:', node.id, node.name);

    let parentFrame = null;
    let nodePath: string[] = [];
    try {
      console.log('[InteractionDetector] Finding parent frame for node:', node.id, node.name);
      parentFrame = await this.findParentFrame(node);
      console.log('[InteractionDetector] Parent frame:', parentFrame);
    } catch (err) {
      console.error('[getScreenContext] Error in findParentFrame:', node.id, err);
    }
    try {
      console.log('[InteractionDetector] Getting node path for node:', node.id, node.name);
      nodePath = await this.getNodePath(node);
      console.log('[InteractionDetector] Node path:', nodePath);
    } catch (err) {
      console.error('[getScreenContext] Error in getNodePath:', node.id, err);
    }
    const context = {
      screenId: parentFrame?.id || node.id,
      screenName: parentFrame?.name || 'Unknown Screen',
      elementId: node.id,
      elementName: node.name,
      parentPath: nodePath
    };
    console.log('[InteractionDetector] Returning screen context:', context);
    return context;
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

  // Async migration: Use figma.getNodeByIdAsync for Figma Community compatibility
  private async parseReactions(node: SceneNode & { reactions: FigmaReaction[] }): Promise<Interaction[]> {
    const results: Interaction[] = [];
    for (const reaction of node.reactions.filter((r: FigmaReaction) => this.isValidReaction(r))) {
      let destinationName: string | undefined = undefined;
      if (reaction.action.destinationId) {
        try {
          console.log('[parseReactions] Fetching destination node by ID async:', reaction.action.destinationId);
          const destNode = await figma.getNodeByIdAsync(reaction.action.destinationId);
          destinationName = destNode?.name;
        } catch (err) {
          console.error('[parseReactions] Error fetching destination node:', reaction.action.destinationId, err);
        }
      }
      results.push({
        trigger: this.normalizeTrigger(reaction.trigger.type) as InteractionTrigger,
        action: this.normalizeAction(reaction.action.type) as ActionType,
        metadata: {
          delay: reaction.trigger.delay || 0,
          duration: reaction.action.duration,
          preventDefault: reaction.trigger.preventDefault
        },
        actionMetadata: {
          destinationId: reaction.action.destinationId,
          destination: destinationName,
          overlay: reaction.action.overlay?.name
        }
      });
    }
    return results;
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