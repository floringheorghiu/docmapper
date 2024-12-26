import type { BaseNode, SceneNode } from '../types/figma';

type TraverseFilter = (node: SceneNode) => boolean;

export function traverse(
  node: BaseNode,
  filter: TraverseFilter
): SceneNode[] {
  const nodes: SceneNode[] = [];

  function walk(current: BaseNode) {
    if ('children' in current) {
      for (const child of current.children) {
        if ('type' in child && child.type !== 'PAGE') {
          if (filter(child as SceneNode)) {
            nodes.push(child as SceneNode);
          }
        }
        walk(child);
      }
    }
  }

  walk(node);
  return nodes;
}