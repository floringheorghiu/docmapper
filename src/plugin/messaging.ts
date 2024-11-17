import type { PluginToUIMessage, UIToPluginMessage } from '../types/messages';
import { PluginController } from './controller';

export function sendToUI(message: PluginToUIMessage) {
  figma.ui.postMessage(message);
}

export function setupMessageHandlers(controller: PluginController) {
  figma.ui.onmessage = async (message: UIToPluginMessage) => {
    try {
      switch (message.type) {
        case 'generate-docs':
          await controller.generateDocumentation(message.options.scope);
          break;

        case 'cancel-generation':
          controller.cancelGeneration();
          break;

        case 'open-url':
          await figma.openExternal(message.url);
          break;

        default:
          console.error('Unknown message type:', (message as { type: string }).type);
      }
    } catch (error) {
      sendToUI({
        type: 'generation-error',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        canResume: false
      });
    }
  };
}