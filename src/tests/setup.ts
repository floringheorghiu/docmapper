import type { PluginAPI } from '@figma/plugin-typings';

export {};

const mockFigma = {
  createFrame: () => ({
    name: 'Test Frame',
    resize: () => {},
    appendChild: () => {},
    layoutMode: 'NONE',
    fills: [],
    cornerRadius: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    itemSpacing: 0
  }),
  createText: () => ({
    characters: '',
    fontSize: 12,
    fontName: { family: 'Inter', style: 'Regular' }
  }),
  loadFontAsync: async () => {},
  currentPage: {
    appendChild: () => {},
    findChild: () => null,
    selection: []
  },
  getNodeById: (id: string) => ({ name: `Node ${id}` }),
  viewport: {
    scrollAndZoomIntoView: () => {}
  },
  ui: {
    postMessage: () => {}
  }
} as unknown as PluginAPI;

(globalThis as any).figma = mockFigma;