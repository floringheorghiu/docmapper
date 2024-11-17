import type { BaseNode, SceneNode } from '../../types/figma';

interface FigmaReaction {
  trigger: {
    type: string;
  };
  action: {
    type: string;
  };
}

export class TraversalService {
  async findInteractiveNodes(scope: 'current' | 'selection'): Promise<SceneNode[]> {
    if (scope === 'selection') {
      const selection = figma.currentPage.selection;
      if (selection.length === 0) {
        throw new Error('No elements selected. Please select a frame or element to analyze.');
      }
      return this.findInteractiveNodesInSelection(selection);
    }
    return this.findInteractiveNodesInPage(figma.currentPage);
  }

  private async findInteractiveNodesInSelection(selection: readonly SceneNode[]): Promise<SceneNode[]> {
    const interactiveNodes: SceneNode[] = [];
    
    for (const node of selection) {
      if (this.hasValidInteractions(node)) {
        interactiveNodes.push(node);
      }
      
      if ('findAll' in node) {
        const childNodes = node.findAll((child: SceneNode) => this.hasValidInteractions(child));
        interactiveNodes.push(...childNodes);
      }
    }
    
    return interactiveNodes;
  }

  private async findInteractiveNodesInPage(page: PageNode): Promise<SceneNode[]> {
    return page.findAll((node: SceneNode) => this.hasValidInteractions(node));
  }

  private hasValidInteractions(node: SceneNode & { reactions?: FigmaReaction[] }): boolean {
    if (!('reactions' in node)) {
      return false;
    }

    return Array.isArray(node.reactions) && node.reactions.some((reaction: FigmaReaction) => {
      return reaction &&
             reaction.trigger &&
             reaction.trigger.type &&
             reaction.action &&
             reaction.action.type;
    });
  }

  private isVisible(node: SceneNode): boolean {
    let current: BaseNode | null = node;
    
    while (current && 'parent' in current) {
      if ('visible' in current && !current.visible) {
        return false;
      }
      current = current.parent;
    }
    
    return true;
  }

  async countTotalNodes(scope: 'current' | 'selection'): Promise<number> {
    const nodes = await this.findInteractiveNodes(scope);
    return nodes.length;
  }
}