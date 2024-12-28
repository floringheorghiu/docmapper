import type { BaseNode, SceneNode } from '../../types/figma';
import type { Scope } from '../../types/documentation';
import { InteractionDetector } from './interaction-detector';

export class TraversalService {
  private detector: InteractionDetector;

  constructor() {
    this.detector = new InteractionDetector();
  }

  async findInteractiveNodes(scope: Scope): Promise<SceneNode[]> {
    if (scope === 'selection') {
      const selection = figma.currentPage.selection;
      if (selection.length === 0) {
        throw new Error('No elements selected');
      }
      return this.findInteractiveNodesInSelection(selection);
    }
    return this.findInteractiveNodesInPage(figma.currentPage);
  }

  private async findInteractiveNodesInSelection(selection: readonly SceneNode[]): Promise<SceneNode[]> {
    const interactiveNodes: SceneNode[] = [];
    
    for (const node of selection) {
      console.log('Checking node:', node.name);
      
      if (this.detector.hasInteractions(node)) {
        console.log('Found interactions in:', node.name);
        const interactions = await this.detector.getInteractions(node);
        if (interactions.length > 0) {
          interactiveNodes.push(node);
        }
      }
      
      if ('findAll' in node) {
        const childNodes = node.findAll((child: BaseNode) => {
          const hasInteraction = this.detector.hasInteractions(child);
          if (hasInteraction) {
            console.log('Found child with interactions:', (child as SceneNode).name);
          }
          return hasInteraction;
        });
        
        for (const childNode of childNodes) {
          const interactions = await this.detector.getInteractions(childNode);
          if (interactions.length > 0) {
            interactiveNodes.push(childNode as SceneNode);
          }
        }
      }
    }
    
    console.log('Total interactive nodes found:', interactiveNodes.length);
    return interactiveNodes;
  }

  private async findInteractiveNodesInPage(page: PageNode): Promise<SceneNode[]> {
    const nodes = page.findAll((node: BaseNode) => this.detector.hasInteractions(node)) as SceneNode[];
    const interactiveNodes: SceneNode[] = [];
    
    for (const node of nodes) {
      const interactions = await this.detector.getInteractions(node);
      if (interactions.length > 0) {
        interactiveNodes.push(node);
      }
    }
    
    return interactiveNodes;
  }

  async countTotalNodes(scope: Scope): Promise<number> {
    const nodes = await this.findInteractiveNodes(scope);
    return nodes.length;
  }
}