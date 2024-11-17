/// <reference types="@figma/plugin-typings" />

declare global {
  const figma: PluginAPI;
  const __html__: string;
}

// Re-export commonly used types
export type BaseNode = DefaultFrameMixinStub;
export type SceneNode = FrameNode | ComponentNode | InstanceNode | RectangleNode | TextNode;
export type PageNode = PageNode;
export type FrameNode = FrameNode;
export type TextNode = TextNode;
export type ChildrenMixin = ChildrenMixin;

// Ensure this is treated as a module
export {};