/// <reference types="@figma/plugin-typings" />

declare global {
  const figma: PluginAPI;
  const __html__: string;
}

// Re-export commonly used Figma types
export type {
  BaseNode,
  SceneNode,
  PageNode,
  FrameNode,
  TextNode,
  ChildrenMixin
} from '@figma/plugin-typings';

// Ensure this is treated as a module
export {};