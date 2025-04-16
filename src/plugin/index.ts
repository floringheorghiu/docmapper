import { CONFIG } from '../constants';
import { NodeTraversal } from './services/node-traversal';
import { InteractionDetector } from './services/interaction-detector';
import type { BaseNode, SceneNode, FrameNode } from '../types/figma';

figma.showUI(__html__, {
  width: 320,
  height: 480,
  themeColors: true
});

const nodeTraversal = new NodeTraversal();
const interactionDetector = new InteractionDetector();
let documentationFrame: FrameNode | null = null;

figma.ui.onmessage = async (msg: { type: string; url?: string; options?: { scope: 'current' | 'selection' } }) => {
  if (msg.type === 'generate-docs') {
    try {
      figma.ui.postMessage({ 
        type: 'generation-progress',
        progress: 0,
        pageId: figma.currentPage.id,
        processedNodes: 0
      });

      const interactiveNodes = await nodeTraversal.findInteractiveNodes(msg.options?.scope || 'current');
      console.log('Found interactive nodes:', interactiveNodes.length);


      documentationFrame = figma.currentPage.findChild(
        (node: BaseNode) => node.type === 'FRAME' && node.name === CONFIG.FRAME_NAME
      ) as FrameNode;

      if (!documentationFrame) {
        documentationFrame = figma.createFrame();
        documentationFrame.name = CONFIG.FRAME_NAME;
        documentationFrame.resize(CONFIG.FRAME_WIDTH, CONFIG.FRAME_HEIGHT);
        documentationFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        documentationFrame.cornerRadius = 8;

        documentationFrame.layoutMode = 'VERTICAL';
        documentationFrame.paddingLeft = CONFIG.PADDING;
        documentationFrame.paddingRight = CONFIG.PADDING;
        documentationFrame.paddingTop = CONFIG.PADDING;
        documentationFrame.paddingBottom = CONFIG.PADDING;
        documentationFrame.itemSpacing = CONFIG.SPACING;

        const viewport = figma.viewport.center;
        documentationFrame.x = viewport.x - documentationFrame.width / 2;
        documentationFrame.y = viewport.y - documentationFrame.height / 2;

        figma.currentPage.appendChild(documentationFrame);
      }

      const titleText = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      titleText.fontName = { family: "Inter", style: "Regular" };
      titleText.fontSize = CONFIG.TEXT_SIZE;
      titleText.characters = "Interactions";
      documentationFrame.appendChild(titleText);

      for (const node of interactiveNodes) {
        console.log('[Plugin] Processing interactive node:', node.id, node.name);

        const interactions = await interactionDetector.getInteractions(node);
        console.log('[Plugin] Interactions for node', node.id, node.name, ':', interactions);
        if (interactions.length > 0) {
          const nodeText = figma.createText();
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
          nodeText.fontName = { family: "Inter", style: "Regular" };
          nodeText.fontSize = CONFIG.TEXT_SIZE;
          nodeText.characters = `${node.name} (${interactions.length} interaction${interactions.length > 1 ? 's' : ''})`;
          documentationFrame.appendChild(nodeText);
          console.log('[Plugin] Added node summary text for:', node.id, node.name);


          for (const interaction of interactions) {
            console.log('[Plugin] Adding interaction detail:', interaction);

            const detailText = figma.createText();
            detailText.fontName = { family: "Inter", style: "Regular" };
            detailText.fontSize = CONFIG.TEXT_SIZE - 2;
            detailText.characters = `• ${interactionDetector.getInteractionDescription(interaction)}`;
            documentationFrame.appendChild(detailText);
            console.log('[Plugin] Added interaction detail text for:', node.id, node.name);

          }
        }
      }

      if (interactiveNodes.length === 0) {
        console.log('[Plugin] No interactive nodes found.');

        const noInteractionsText = figma.createText();
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        noInteractionsText.fontName = { family: "Inter", style: "Regular" };
        noInteractionsText.fontSize = CONFIG.TEXT_SIZE;
        noInteractionsText.characters = "No interactions found";
        documentationFrame.appendChild(noInteractionsText);
        console.log('[Plugin] Added no interactions found text.');

      }

      figma.viewport.scrollAndZoomIntoView([documentationFrame]);
      console.log('[Plugin] Focused viewport on documentation frame.');
      
      figma.ui.postMessage({ 
        type: 'generation-complete',
        stats: {
          totalPages: 1,
          totalNodes: interactiveNodes.length,
          processedNodes: interactiveNodes.length
        }
      });
    } catch (error) {
      console.error('Error creating documentation:', error);
      figma.ui.postMessage({
        type: 'generation-error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        canResume: false
      });
    }
  } else if (msg.type === 'open-url' && msg.url) {
    try {
      await figma.openExternal(msg.url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }
};