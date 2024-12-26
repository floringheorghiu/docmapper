import { InteractionDetector } from './interaction-detector';

export class NodeTraversal {
  private detector: InteractionDetector;

  constructor() {
    this.detector = new InteractionDetector();
  }

  /**
   * Safely traverses the current page or selection to find interactive nodes
   */
  async findInteractiveNodes(scope: 'current' | 'selection'): Promise<SceneNode[]> {
    try {
      const nodes = scope === 'selection' 
        ? figma.currentPage.selection
        : [figma.currentPage];

      return this.traverseNodes(nodes);
    } catch (error) {
      console.error('Error finding interactive nodes:', error);
      return [];
    }
  }

  private traverseNodes(nodes: readonly BaseNode[]): SceneNode[] {
    const interactiveNodes: SceneNode[] = [];

    const processNode = (node: BaseNode) => {
      if (this.detector.hasInteractions(node)) {
        interactiveNodes.push(node as SceneNode);
      }

      if ('children' in node) {
        (node as ChildrenMixin).children.forEach(processNode);
      }
    };

    nodes.forEach(processNode);
    return interactiveNodes;
  }
}