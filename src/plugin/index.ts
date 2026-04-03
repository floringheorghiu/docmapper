import { PluginController } from './controller';
import { setupMessageHandlers } from './messaging';

figma.showUI(__html__, { width: 320, height: 480, themeColors: true });
const controller = new PluginController();
setupMessageHandlers(controller);
