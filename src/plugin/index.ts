import { CONFIG } from '../constants';
import { NodeTraversal } from './services/node-traversal';
import { InteractionDetector } from './services/interaction-detector';
import type { BaseNode, SceneNode, FrameNode } from '../types/figma';
import type { Scope } from '../types/documentation';

figma.showUI(__html__, {
  width: 320,
  height: 480,
  themeColors: true
});

const nodeTraversal = new NodeTraversal();
const interactionDetector = new InteractionDetector();
let documentationFrame: FrameNode | null = null;

figma.ui.onmessage = async (msg: { type: string; options?: { scope: Scope } }) => {
  if (msg.type === 'generate-docs') {
    try {
      // Initialize UI progress
      figma.ui.postMessage({ 
        type: 'generation-progress',
        progress: 0,
        pageId: figma.currentPage.id,
        processedNodes: 0
      });

      const interactiveNodes = await nodeTraversal.findInteractiveNodes(msg.options?.scope || 'current');
      console.log('Found interactive nodes:', interactiveNodes.length);

      // Create or find documentation frame
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

      // Create title
      const titleText = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      titleText.fontName = { family: "Inter", style: "Regular" };
      titleText.fontSize = CONFIG.TEXT_SIZE;
      titleText.characters = "Interactions";
      documentationFrame.appendChild(titleText);

      // Process nodes
      for (const node of interactiveNodes) {
        try {
          // Get interactions for this node
          const interactions = await interactionDetector.getInteractions(node); // Need await here
          if (interactions.length > 0) {
            const nodeText = figma.createText();
            await figma.loadFontAsync({ family: "Inter", style: "Regular" });
            nodeText.fontName = { family: "Inter", style: "Regular" };
            nodeText.fontSize = CONFIG.TEXT_SIZE;
            nodeText.characters = `${node.name} (${interactions.length} interaction${interactions.length > 1 ? 's' : ''})`;
            documentationFrame.appendChild(nodeText);

            for (const interaction of interactions) {
              const detailText = figma.createText();
              detailText.fontName = { family: "Inter", style: "Regular" };
              detailText.fontSize = CONFIG.TEXT_SIZE - 2;
              
              // Get destination node if exists using getNodeByIdAsync
              if (interaction.actionMetadata?.destinationId) {
                const destinationNode = await figma.getNodeByIdAsync(interaction.actionMetadata.destinationId);
                if (destinationNode) {
                  interaction.actionMetadata.destination = destinationNode.name;
                }
              }
              
              detailText.characters = `• ${interaction.description || 'Unknown interaction'}`;
              documentationFrame.appendChild(detailText);
            }
          }
        } catch (nodeError) {
          console.error(`Error processing node ${node.name}:`, nodeError);
          continue; // Continue with next node even if this one fails
        }
      }

      // Handle no interactions case
      if (interactiveNodes.length === 0) {
        const noInteractionsText = figma.createText();
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        noInteractionsText.fontName = { family: "Inter", style: "Regular" };
        noInteractionsText.fontSize = CONFIG.TEXT_SIZE;
        noInteractionsText.characters = "No interactions found";
        documentationFrame.appendChild(noInteractionsText);
      }

      figma.viewport.scrollAndZoomIntoView([documentationFrame]);

    } catch (error) {
      console.error('Error creating documentation:', error);
      figma.ui.postMessage({
        type: 'generation-error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        canResume: false
      });
    }
  }
};

async function handleNodeSelection(node: SceneNode) {
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    const detector = new InteractionDetector();
    const interactions = await detector.getInteractions(node);
    
    if (interactions.length > 0) {
      const frame = figma.createFrame();
      frame.name = `${node.name} Interactions`;
      frame.x = node.x + node.width + 100;
      frame.y = node.y;
      
      const nodeText = figma.createText();
      nodeText.x = 10;
      nodeText.y = 10;
      nodeText.characters = `${node.name} (${interactions.length} interaction${
        interactions.length > 1 ? 's' : ''
      })`;
      frame.appendChild(nodeText);
      
      let yOffset = 40;
      for (const interaction of interactions) {
        const interactionText = figma.createText();
        interactionText.x = 10;
        interactionText.y = yOffset;
        interactionText.characters = interaction.description || 'Unknown interaction';
        frame.appendChild(interactionText);
        yOffset += 24;
      }
      
      frame.resize(
        Math.max(...frame.children.map(child => child.width)) + 20,
        yOffset + 10
      );
    }
  } catch (error) {
    console.error('Error handling node selection:', error);
    figma.notify('Error analyzing interactions');
  }
}