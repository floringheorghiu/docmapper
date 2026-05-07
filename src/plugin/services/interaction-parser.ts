import { 
  InteractionTrigger, 
  ActionType, 
  InteractionMetadata, 
  ActionMetadata,
  ScreenContext 
} from '../../types/documentation';
import type { BaseNode, SceneNode } from '../../types/figma';

export class InteractionParser {
  extractTextContent(node: BaseNode): string | undefined {
    const textValues: string[] = [];
    this.collectTextContent(node, textValues);

    const textContent = textValues
      .map(value => value.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return textContent ? this.truncateText(textContent, 60) : undefined;
  }

  private truncateText(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
  }

  private collectTextContent(node: BaseNode, textValues: string[]): void {
    if ('type' in node && node.type === 'TEXT' && 'characters' in node) {
      textValues.push(String(node.characters));
      return;
    }

    if ('children' in node) {
      for (const child of node.children as readonly BaseNode[]) {
        this.collectTextContent(child, textValues);
      }
    }
  }

  // Async migration: Await findParentFrame and getNodePath for Figma Community compatibility
  async getScreenContext(node: BaseNode): Promise<ScreenContext> {
    let parentFrame = null;
    let nodePath: string[] = [];
    try {
      parentFrame = await this.findParentFrame(node);
    } catch (err) {
      console.error('[getScreenContext] Error in findParentFrame:', node.id, err);
    }
    try {
      nodePath = await this.getNodePath(node);
    } catch (err) {
      console.error('[getScreenContext] Error in getNodePath:', node.id, err);
    }
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
      console.warn('[parseTrigger] Missing trigger type, skipping reaction');
      return { type: 'click', metadata: {} };
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

  parseActions(reaction: any): Array<{ type: ActionType; metadata: ActionMetadata }> {
    const actions = Array.isArray(reaction?.actions)
      ? reaction.actions
      : reaction?.action
        ? [reaction.action]
        : [];

    if (actions.length === 0) {
      return [{ type: 'none', metadata: {} }];
    }

    return actions.map((action: any) => this.parseAction(action));
  }

  parseAction(action: any): { type: ActionType; metadata: ActionMetadata } {
    if (!action?.type) {
      console.warn('[parseAction] Missing action type, marking as none');
      return { type: 'none', metadata: {} };
    }

    const actionType = this.normalizeActionType(action);
    const metadata: ActionMetadata = {};

    if (action.transition) {
      metadata.animation = {
        type: action.transition.type || 'INSTANT',
        duration: action.transition.duration || 0,
        easing: action.transition.easing?.type || 'EASE_OUT'
      };
    }

    if (action.destinationId) metadata.destinationId = action.destinationId;
    if (action.navigation) metadata.navigation = action.navigation;
    if (action.url) metadata.url = action.url;
    if (typeof action.openInNewTab === 'boolean') metadata.openInNewTab = action.openInNewTab;
    if ('variableId' in action) metadata.variableId = action.variableId;
    if ('variableCollectionId' in action) metadata.variableCollectionId = action.variableCollectionId;
    if ('variableModeId' in action) metadata.variableModeId = action.variableModeId;
    if (Array.isArray(action.conditionalBlocks)) metadata.conditionalBlocks = action.conditionalBlocks.length;
    if (action.mediaAction) metadata.mediaAction = action.mediaAction;

    if ((actionType === 'open-overlay' || actionType === 'overlay') && action.overlaySettings) {
      metadata.overlay = action.overlaySettings.name;
    }

    if ((actionType === 'state-change' || actionType === 'change-to') && action.states) {
      metadata.state = {
        from: action.states.current,
        to: action.states.target
      };
    }

    return { type: actionType, metadata };
  }

  // Async migration: Use async traversal for Figma Community compatibility
  private async findParentFrame(node: BaseNode): Promise<SceneNode | null> {
    let current: BaseNode | null = node;
    try {
      while (current && 'parent' in current) {
        if (this.isMainFrame(current)) {
          return current as SceneNode;
        }
        current = current.parent;
      }
    } catch (err) {
      console.error('[findParentFrame] Error in async traversal:', node.id, err);
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

  // Async migration: Use async traversal for Figma Community compatibility
  private async getNodePath(node: BaseNode): Promise<string[]> {
    const path: string[] = [];
    let current: BaseNode | null = node;
    try {
      while (current && 'parent' in current) {
        if (this.isMainFrame(current)) break;
        path.unshift(current.name);
        current = current.parent;
      }
    } catch (err) {
      console.error('[getNodePath] Error in async traversal:', node.id, err);
    }
    return path;
  }

  private normalizeTriggerType(type: string): InteractionTrigger {
    const triggerMap: Record<string, InteractionTrigger> = {
      'ON_CLICK': 'click',
      'ON_PRESS': 'click',
      'TOUCH_DOWN': 'click',
      'MOUSE_ENTER': 'hover',
      'MOUSE_LEAVE': 'hover',
      'WHILE_HOVER': 'hover',
      'AFTER_TIMEOUT': 'timeout',
      'ON_DRAG': 'drag',
      'KEY_DOWN': 'key',
      'ON_KEY_DOWN': 'key',
      'SCROLL': 'scroll',
      'SWIPE': 'swipe',
    };

    const normalizedType = triggerMap[type.toUpperCase()];
    if (!normalizedType) {
      console.warn(`Unknown trigger type: ${type}, defaulting to 'click'`);
      return 'click';
    }

    return normalizedType;
  }

  private normalizeActionType(action: any): ActionType {
    const rawType = String(action.type || '').toUpperCase();

    if (rawType === 'NODE') {
      const navigation = String(action.navigation || '').toUpperCase();
      const navigationMap: Record<string, ActionType> = {
        'NAVIGATE': 'navigate',
        'CHANGE_TO': 'change-to',
        'SCROLL_TO': 'scroll-to',
        'OVERLAY': 'open-overlay',
        'SWAP': 'swap-overlay'
      };
      return navigationMap[navigation] ?? 'navigate';
    }

    const actionMap: Record<string, ActionType> = {
      'NONE': 'none',
      'BACK': 'back',
      'CLOSE': 'close-overlay',
      'URL': 'open-link',
      'OPEN_URL': 'open-link',
      'SET_VARIABLE': 'set-variable',
      'SET_VARIABLE_MODE': 'set-variable-mode',
      'CONDITIONAL': 'conditional',
      'UPDATE_MEDIA_RUNTIME': 'animation',
      'NAVIGATE': 'navigate',
      'SMART_ANIMATE': 'smart-animate',
      'OVERLAY': 'open-overlay',
      'SWAP': 'swap-overlay',
      'STATE_CHANGE': 'change-to'
    };

    const normalizedType = actionMap[rawType];
    if (!normalizedType) {
      console.warn(`Unknown action type: ${action.type}, defaulting to 'none'`);
      return 'none';
    }

    return normalizedType;
  }
}