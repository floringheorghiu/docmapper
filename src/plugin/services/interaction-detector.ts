import type { BaseNode, SceneNode } from '../../types/figma';
import type { Interaction, InteractionTrigger, ActionType } from '../../types/documentation';
import type { FigmaReaction, FigmaAction } from '../../types/interactions';

/**
 * Handles detection and parsing of Figma interactions
 */
export class InteractionDetector {
  /**
   * Checks if a node has valid interactions
   */
  hasInteractions(node: BaseNode): boolean {
    return 'reactions' in node && Array.isArray((node as any).reactions) && (node as any).reactions.length > 0;
  }

  /**
   * Gets all interactions for a given node
   */
  async getInteractions(node: BaseNode): Promise<Interaction[]> {
    if (!this.hasInteractions(node)) {
      return [];
    }

    const sceneNode = node as SceneNode & { reactions: FigmaReaction[] };
    return this.parseReactions(sceneNode);
  }

  /**
   * Parses raw Figma reactions into formatted interactions
   */
  private async parseReactions(node: SceneNode & { reactions: FigmaReaction[] }): Promise<Interaction[]> {
    const parsedReactions = [];
    
    for (const reaction of node.reactions) {
      try {
        let destinationName;
        if (reaction.action.destinationId) {
          const destinationNode = await figma.getNodeByIdAsync(reaction.action.destinationId);
          destinationName = destinationNode?.name;
        }

        parsedReactions.push({
          trigger: this.normalizeTrigger(reaction.trigger.type) as InteractionTrigger,
          action: this.mapActionType(reaction.action.type) as ActionType,
          metadata: {
            delay: reaction.trigger.delay || 0,
            duration: reaction.action.duration,
            preventDefault: reaction.trigger.preventDefault
          },
          actionMetadata: {
            destinationId: reaction.action.destinationId,
            destination: destinationName,
            overlay: reaction.action.overlay?.name
          },
          description: await this.formatDescription(reaction.trigger.type, reaction.action, reaction.trigger.delay)
        });
      } catch (error) {
        console.error('Error parsing reaction:', error);
      }
    }
    
    return parsedReactions;
  }

  /**
   * Formats the interaction description with emojis
   */
  private async formatDescription(
    triggerType: string,
    action: FigmaAction,
    delay?: number
  ): Promise<string> {
    try {
      const triggerEmoji = this.getTriggerEmoji(triggerType);
      const normalizedAction = await this.normalizeAction(action);
      
      let description = `${triggerEmoji} ${this.normalizeTrigger(triggerType)} → ${normalizedAction}`;
      
      if (delay) {
        description += ` ⏱️ (${delay}ms)`;
      }
      
      return description;
    } catch (error) {
      console.error('Error formatting description:', error);
      return 'Unknown interaction';
    }
  }

  /**
   * Normalizes the action type and adds destination if available
   */
  private async normalizeAction(action: FigmaAction): Promise<string> {
    try {
      const actionText = this.getActionText(action.type);
      
      if (action.destinationId) {
        const destinationNode = await figma.getNodeByIdAsync(action.destinationId);
        if (destinationNode) {
          return `${actionText} → 🎯 ${destinationNode.name}`;
        }
      }
      
      return actionText;
    } catch (error) {
      console.error('Error in normalizeAction:', error);
      return 'Unknown action';
    }
  }

  /**
   * Gets emoji and text for action type
   */
  private getActionText(type: string): string {
    const actionMap: Record<string, string> = {
      'NAVIGATE': '🔄 Navigate',
      'SMART_ANIMATE': '✨ Smart animate',
      'OVERLAY': '📑 Show overlay',
      'SWAP': '🔄 Swap',
      'STATE_CHANGE': '���� Change state',
      'OPEN_URL': '🔗 Open URL'
    };
    return actionMap[type] || type;
  }

  /**
   * Normalizes trigger type text
   */
  private normalizeTrigger(triggerType: string): InteractionTrigger {
    const triggerMap: Record<string, InteractionTrigger> = {
      'ON_CLICK': 'click',
      'MOUSE_ENTER': 'hover',
      'MOUSE_LEAVE': 'hover',
      'MOUSE_DOWN': 'click',
      'MOUSE_UP': 'click',
      'KEY_DOWN': 'key',
      'AFTER_TIMEOUT': 'timeout',
      'ON_DRAG': 'drag',
      'DRAG_ENTER': 'drag',
      'DRAG_LEAVE': 'drag',
      'DROP': 'click'
    };
    return triggerMap[triggerType] || 'click';
  }

  /**
   * Gets emoji for trigger type
   */
  private getTriggerEmoji(triggerType: string): string {
    const emojiMap: Record<string, string> = {
      'ON_CLICK': '️',
      'MOUSE_ENTER': '👆',
      'MOUSE_LEAVE': '👆',
      'AFTER_TIMEOUT': '⏲️',
      'ON_DRAG': '✋',
      'KEY_DOWN': '⌨️',
      'SCROLL': '📜',
      'SWIPE': '👆'
    };
    return emojiMap[triggerType] || '❓';
  }

  private mapActionType(type: string): ActionType {
    const map: Record<string, ActionType> = {
      'NAVIGATE': 'navigate',
      'OVERLAY': 'overlay',
      'SMART_ANIMATE': 'smart-animate',
      'SWAP': 'component-swap',
      'STATE_CHANGE': 'state-change'
    };
    return map[type] || 'navigate';
  }
}