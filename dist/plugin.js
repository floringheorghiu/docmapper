var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function() {
  "use strict";
  function sendToUI(message) {
    figma.ui.postMessage(message);
  }
  function setupMessageHandlers(controller2) {
    figma.ui.onmessage = async (message) => {
      try {
        switch (message.type) {
          case "generate-docs":
            await controller2.generateDocumentation(message.options.scope);
            break;
          case "cancel-generation":
            controller2.cancelGeneration();
            break;
          case "open-url":
            await figma.openExternal(message.url);
            break;
          default:
            console.error("Unknown message type:", message.type);
        }
      } catch (error) {
        sendToUI({
          type: "generation-error",
          error: error instanceof Error ? error.message : "An unknown error occurred",
          canResume: false
        });
      }
    };
  }
  const CONFIG = {
    FRAME_WIDTH: 600,
    FRAME_HEIGHT: 400,
    PADDING: 20,
    SPACING: 16
  };
  function normalizeTriggerFromInternal(type) {
    var _a;
    const map = {
      "click": "On tap",
      "hover": "On hover",
      "timeout": "After delay",
      "drag": "On drag",
      "key": "On key press",
      "scroll": "On scroll",
      "swipe": "On swipe"
    };
    return (_a = map[type]) != null ? _a : type;
  }
  function normalizeActionFromInternal(type) {
    var _a;
    const map = {
      "navigate": "Navigate",
      "overlay": "Show overlay",
      "animation": "Animate",
      "state-change": "Change state",
      "component-swap": "Swap component",
      "smart-animate": "Animate to"
    };
    return (_a = map[type]) != null ? _a : type;
  }
  class VisualizationService {
    async createDocumentationNodes(chunks) {
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });
        let docPage = figma.root.children.find((p) => p.name === "Documentation");
        if (docPage) {
          for (const child of [...docPage.children]) {
            child.remove();
          }
        } else {
          docPage = figma.createPage();
          docPage.name = "Documentation";
        }
        const frame = this.createMainFrame();
        let screenGroups = [];
        try {
          screenGroups = await this.groupInteractionsByScreen(chunks);
        } catch (err) {
          console.error("[createDocumentationNodes] Error in groupInteractionsByScreen:", err);
          screenGroups = [];
        }
        await this.createTitle(frame, screenGroups);
        await this.createScreenSections(frame, screenGroups);
        docPage.appendChild(frame);
        await figma.setCurrentPageAsync(docPage);
        figma.viewport.scrollAndZoomIntoView([frame]);
      } catch (error) {
        console.error("Error creating documentation:", error);
        throw error;
      }
    }
    createMainFrame() {
      const frame = figma.createFrame();
      frame.name = "Documentation";
      frame.resize(CONFIG.FRAME_WIDTH, CONFIG.FRAME_HEIGHT);
      frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      frame.cornerRadius = 8;
      frame.layoutMode = "VERTICAL";
      frame.paddingLeft = CONFIG.PADDING;
      frame.paddingRight = CONFIG.PADDING;
      frame.paddingTop = CONFIG.PADDING;
      frame.paddingBottom = CONFIG.PADDING;
      frame.itemSpacing = CONFIG.SPACING;
      frame.primaryAxisSizingMode = "AUTO";
      frame.counterAxisSizingMode = "FIXED";
      return frame;
    }
    createTitle(frame, screenGroups) {
      const totalInteractions = screenGroups.reduce((sum, group) => sum + group.totalInteractions, 0);
      const titleText = this.createText(
        `Screen Interactions (${totalInteractions} total)`,
        16,
        true
      );
      frame.appendChild(titleText);
      const divider = this.createDivider(frame.width - 2 * CONFIG.PADDING);
      frame.appendChild(divider);
    }
    async createScreenSections(frame, screenGroups) {
      for (let i = 0; i < screenGroups.length; i++) {
        const screen = screenGroups[i];
        const screenSection = figma.createFrame();
        screenSection.layoutMode = "VERTICAL";
        screenSection.itemSpacing = 12;
        screenSection.paddingLeft = 12;
        screenSection.paddingRight = 12;
        screenSection.paddingTop = 16;
        screenSection.paddingBottom = 16;
        screenSection.cornerRadius = 4;
        screenSection.primaryAxisSizingMode = "AUTO";
        screenSection.counterAxisSizingMode = "AUTO";
        screenSection.fills = i % 2 === 1 ? [{ type: "SOLID", color: { r: 0.97, g: 0.97, b: 0.97 } }] : [];
        const headerSection = figma.createFrame();
        headerSection.layoutMode = "HORIZONTAL";
        headerSection.itemSpacing = 8;
        headerSection.fills = [];
        headerSection.primaryAxisSizingMode = "AUTO";
        headerSection.counterAxisSizingMode = "AUTO";
        const screenName = this.createText(screen.screenName, 14, true);
        const interactionCount = this.createText(
          `(${screen.totalInteractions} interaction${screen.totalInteractions === 1 ? "" : "s"})`,
          14,
          false
        );
        interactionCount.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
        headerSection.appendChild(screenName);
        headerSection.appendChild(interactionCount);
        screenSection.appendChild(headerSection);
        const elementGroups = this.groupInteractionsByElement(screen.interactions);
        for (const [elementName, interactions] of elementGroups) {
          const elementSection = await this.createElementSection(elementName, interactions);
          screenSection.appendChild(elementSection);
        }
        frame.appendChild(screenSection);
        screenSection.layoutSizingHorizontal = "FILL";
        if (i < screenGroups.length - 1) {
          const divider = this.createDivider(frame.width - 2 * CONFIG.PADDING);
          frame.appendChild(divider);
        }
      }
    }
    async createElementSection(elementName, interactions) {
      const section = figma.createFrame();
      section.layoutMode = "VERTICAL";
      section.itemSpacing = 8;
      section.fills = [];
      section.paddingLeft = 24;
      section.primaryAxisSizingMode = "AUTO";
      section.counterAxisSizingMode = "AUTO";
      const elementHeader = this.createText(
        `${elementName} (${interactions.length} interaction${interactions.length === 1 ? "" : "s"})`,
        12,
        true,
        true
      );
      elementHeader.fills = [{ type: "SOLID", color: { r: 0, g: 0.4, b: 1 } }];
      section.appendChild(elementHeader);
      for (const interaction of interactions) {
        let descText = "";
        try {
          descText = await this.formatInteraction(interaction);
        } catch (err) {
          console.error("[createElementSection] Error in formatInteraction:", interaction, err);
          descText = "[Error formatting interaction]";
        }
        const row = figma.createFrame();
        row.layoutMode = "HORIZONTAL";
        row.itemSpacing = 6;
        row.fills = [];
        row.counterAxisAlignItems = "CENTER";
        row.primaryAxisSizingMode = "AUTO";
        row.counterAxisSizingMode = "AUTO";
        const dot = figma.createRectangle();
        dot.resize(8, 8);
        dot.cornerRadius = 4;
        dot.fills = [{ type: "SOLID", color: this.getTriggerColor(interaction.trigger) }];
        row.appendChild(dot);
        const description = this.createText(descText, 11, false);
        description.fills = [{ type: "SOLID", color: { r: 0.35, g: 0.35, b: 0.35 } }];
        row.appendChild(description);
        section.appendChild(row);
      }
      return section;
    }
    async formatInteraction(interaction) {
      var _a;
      const trigger = this.normalizeTrigger(interaction.trigger);
      let action = interaction.destination;
      if (!action) {
        if (interaction.destinationId) {
          try {
            const destNode = await figma.getNodeByIdAsync(interaction.destinationId);
            action = (destNode == null ? void 0 : destNode.name) || this.normalizeAction(interaction.action);
          } catch (err) {
            console.error("[formatInteraction] Error fetching destination node:", interaction.destinationId, err);
            action = this.normalizeAction(interaction.action);
          }
        } else {
          action = this.normalizeAction(interaction.action);
        }
      }
      let description = `${trigger} → ${action}`;
      if (((_a = interaction.metadata) == null ? void 0 : _a.delay) && interaction.metadata.delay > 0) {
        description += ` (after ${interaction.metadata.delay}ms)`;
      }
      return description;
    }
    createText(content, size, isBold = false, isLink = false) {
      const text = figma.createText();
      text.fontName = { family: "Inter", style: isBold ? "Bold" : "Regular" };
      text.fontSize = size;
      text.characters = content;
      if (isLink) {
        text.textDecoration = "UNDERLINE";
      }
      return text;
    }
    createDivider(width) {
      const divider = figma.createFrame();
      divider.resize(width, 1);
      divider.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
      return divider;
    }
    getTriggerColor(trigger) {
      var _a;
      const colorMap = {
        "click": { r: 0.18, g: 0.44, b: 1 },
        "hover": { r: 0.18, g: 0.75, b: 0.3 },
        "timeout": { r: 1, g: 0.5, b: 0.1 },
        "key": { r: 0.5, g: 0.2, b: 0.9 },
        "scroll": { r: 0.9, g: 0.2, b: 0.5 },
        "drag": { r: 0.3, g: 0.3, b: 0.9 },
        "swipe": { r: 0.3, g: 0.3, b: 0.9 }
      };
      return (_a = colorMap[trigger]) != null ? _a : { r: 0.6, g: 0.6, b: 0.6 };
    }
    async groupInteractionsByScreen(chunks) {
      var _a, _b;
      const screenMap = /* @__PURE__ */ new Map();
      for (const chunk of chunks) {
        let parentFrame = null;
        try {
          parentFrame = await this.findParentFrame(chunk.nodeId);
        } catch (err) {
          console.error("[groupInteractionsByScreen] Error in findParentFrame:", chunk.nodeId, err);
        }
        if (!parentFrame) continue;
        const screenId = parentFrame.id;
        if (!screenMap.has(screenId)) {
          screenMap.set(screenId, {
            screenId,
            screenName: parentFrame.name,
            interactions: [],
            totalInteractions: 0
          });
        }
        const screenGroup = screenMap.get(screenId);
        for (const interaction of chunk.interactions) {
          let parentPath = [];
          try {
            parentPath = await this.getNodePath(chunk.nodeId);
          } catch (err) {
            console.error("[groupInteractionsByScreen] Error in getNodePath:", chunk.nodeId, err);
          }
          screenGroup.interactions.push({
            elementName: chunk.name,
            nodeName: chunk.name,
            nodeId: chunk.nodeId,
            trigger: interaction.trigger,
            action: interaction.action,
            destination: (_a = interaction.actionMetadata) == null ? void 0 : _a.destination,
            destinationId: (_b = interaction.actionMetadata) == null ? void 0 : _b.destinationId,
            metadata: interaction.metadata,
            screen: {
              screenId: parentFrame.id,
              screenName: parentFrame.name,
              elementId: chunk.nodeId,
              elementName: chunk.name,
              parentPath
            }
          });
        }
        screenGroup.totalInteractions = screenGroup.interactions.length;
      }
      return Array.from(screenMap.values()).sort((a, b) => a.screenName.localeCompare(b.screenName));
    }
    groupInteractionsByElement(interactions) {
      const elementMap = /* @__PURE__ */ new Map();
      interactions.forEach((interaction) => {
        const key = interaction.elementName;
        if (!elementMap.has(key)) {
          elementMap.set(key, []);
        }
        elementMap.get(key).push(interaction);
      });
      return new Map([...elementMap.entries()].sort());
    }
    async findParentFrame(nodeId) {
      try {
        const node = await figma.getNodeByIdAsync(nodeId);
        if (!node) return null;
        let current = node;
        while (current && "parent" in current) {
          if (this.isMainFrame(current)) return current;
          current = current.parent;
        }
        return null;
      } catch (err) {
        console.error("[findParentFrame] Error fetching node:", nodeId, err);
        return null;
      }
    }
    isMainFrame(node) {
      var _a;
      if (!("type" in node)) return false;
      const sceneNode = node;
      return sceneNode.type === "FRAME" && ((_a = sceneNode.parent) == null ? void 0 : _a.type) === "PAGE" && !this.isComponentOrTemplate(sceneNode.name);
    }
    isComponentOrTemplate(name) {
      const lowerName = name.toLowerCase();
      return lowerName.includes("component") || lowerName.includes("template") || lowerName.includes("master");
    }
    async getNodePath(nodeId) {
      const path = [];
      try {
        let current = await figma.getNodeByIdAsync(nodeId);
        while (current && "parent" in current) {
          if (this.isMainFrame(current)) break;
          path.unshift(current.name);
          current = current.parent;
        }
      } catch (err) {
        console.error("[getNodePath] Error fetching node:", nodeId, err);
      }
      return path;
    }
    normalizeTrigger(trigger) {
      return normalizeTriggerFromInternal(trigger);
    }
    normalizeAction(action) {
      return normalizeActionFromInternal(action);
    }
  }
  const _BatchProcessor = class _BatchProcessor {
    constructor(controller2) {
      this.controller = controller2;
    }
    async processNodesInBatches(nodes, totalNodes) {
      const startTime = Date.now();
      let processedCount = 0;
      for (let i = 0; i < nodes.length; i += _BatchProcessor.BATCH_SIZE) {
        if (Date.now() - startTime > _BatchProcessor.MAX_PROCESSING_TIME) {
          throw new Error("Processing timeout reached");
        }
        const batch = nodes.slice(i, i + _BatchProcessor.BATCH_SIZE);
        await this.processBatch(batch);
        processedCount += batch.length;
        this.updateProgress(processedCount, totalNodes);
        await new Promise((resolve) => setTimeout(resolve, _BatchProcessor.PROCESS_DELAY));
      }
    }
    async processBatch(nodes) {
      return Promise.all(nodes.map((node) => this.processNode(node)));
    }
    async processNode(node) {
      if (!("reactions" in node) || !node.reactions.length) {
        return null;
      }
      return this.controller.processNode(node);
    }
    updateProgress(processed, total) {
      const progress = Math.min(100, Math.round(processed / total * 100));
      sendToUI({
        type: "generation-progress",
        progress,
        pageId: figma.currentPage.id,
        processedNodes: processed
      });
    }
  };
  __publicField(_BatchProcessor, "BATCH_SIZE", 50);
  __publicField(_BatchProcessor, "PROCESS_DELAY", 100);
  __publicField(_BatchProcessor, "MAX_PROCESSING_TIME", 5e4);
  let BatchProcessor = _BatchProcessor;
  class TraversalService {
    async findInteractiveNodes(scope) {
      if (scope === "selection") {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
          throw new Error("No elements selected. Please select a frame or element to analyze.");
        }
        return this.findInteractiveNodesInSelection(selection);
      }
      return this.findInteractiveNodesInPage(figma.currentPage);
    }
    async findInteractiveNodesInSelection(selection) {
      const interactiveNodes = [];
      for (const node of selection) {
        if (this.hasValidInteractions(node)) {
          interactiveNodes.push(node);
        }
        if ("findAll" in node) {
          const childNodes = node.findAll((child) => this.hasValidInteractions(child));
          interactiveNodes.push(...childNodes);
        }
      }
      return interactiveNodes;
    }
    async findInteractiveNodesInPage(page) {
      return page.findAll((node) => this.hasValidInteractions(node));
    }
    hasValidInteractions(node) {
      if (!("reactions" in node)) {
        return false;
      }
      return Array.isArray(node.reactions) && node.reactions.some((reaction) => {
        return reaction && reaction.trigger && reaction.trigger.type && reaction.action && reaction.action.type;
      });
    }
    isVisible(node) {
      let current = node;
      while (current && "parent" in current) {
        if ("visible" in current && !current.visible) {
          return false;
        }
        current = current.parent;
      }
      return true;
    }
    async countTotalNodes(scope) {
      const nodes = await this.findInteractiveNodes(scope);
      return nodes.length;
    }
  }
  class InteractionParser {
    // Async migration: Await findParentFrame and getNodePath for Figma Community compatibility
    async getScreenContext(node) {
      let parentFrame = null;
      let nodePath = [];
      try {
        parentFrame = await this.findParentFrame(node);
      } catch (err) {
        console.error("[getScreenContext] Error in findParentFrame:", node.id, err);
      }
      try {
        nodePath = await this.getNodePath(node);
      } catch (err) {
        console.error("[getScreenContext] Error in getNodePath:", node.id, err);
      }
      return {
        screenId: (parentFrame == null ? void 0 : parentFrame.id) || node.id,
        screenName: (parentFrame == null ? void 0 : parentFrame.name) || "Unknown Screen",
        elementId: node.id,
        elementName: node.name,
        parentPath: nodePath
      };
    }
    parseTrigger(reaction) {
      var _a;
      if (!((_a = reaction == null ? void 0 : reaction.trigger) == null ? void 0 : _a.type)) {
        console.warn("[parseTrigger] Missing trigger type, skipping reaction");
        return { type: "click", metadata: {} };
      }
      const triggerType = this.normalizeTriggerType(reaction.trigger.type);
      const metadata = {};
      if (reaction.trigger.delay) {
        metadata.delay = reaction.trigger.delay;
      }
      if (reaction.trigger.key) {
        metadata.keyboard = {
          key: reaction.trigger.key,
          ctrl: Boolean(reaction.trigger.ctrl),
          shift: Boolean(reaction.trigger.shift),
          alt: Boolean(reaction.trigger.alt)
        };
      }
      if (reaction.trigger.gesture) {
        metadata.gesture = {
          direction: reaction.trigger.gesture.direction,
          distance: reaction.trigger.gesture.distance
        };
      }
      return { type: triggerType, metadata };
    }
    parseAction(reaction) {
      var _a, _b;
      if (!((_a = reaction == null ? void 0 : reaction.action) == null ? void 0 : _a.type)) {
        console.warn("[parseAction] Missing action type, skipping reaction");
        return { type: "navigate", metadata: {} };
      }
      const actionType = this.normalizeActionType(reaction.action.type);
      const metadata = {};
      if (reaction.action.transition) {
        metadata.animation = {
          type: reaction.action.transition.type || "INSTANT",
          duration: reaction.action.transition.duration || 0,
          easing: ((_b = reaction.action.transition.easing) == null ? void 0 : _b.type) || "EASE_OUT"
        };
      }
      if (reaction.action.destinationId) {
        metadata.destinationId = reaction.action.destinationId;
      }
      if (actionType === "overlay" && reaction.action.overlaySettings) {
        metadata.overlay = reaction.action.overlaySettings.name;
      }
      if (actionType === "state-change" && reaction.action.states) {
        metadata.state = {
          from: reaction.action.states.current,
          to: reaction.action.states.target
        };
      }
      return { type: actionType, metadata };
    }
    // Async migration: Use async traversal for Figma Community compatibility
    async findParentFrame(node) {
      let current = node;
      try {
        while (current && "parent" in current) {
          if (this.isMainFrame(current)) {
            return current;
          }
          current = current.parent;
        }
      } catch (err) {
        console.error("[findParentFrame] Error in async traversal:", node.id, err);
      }
      return null;
    }
    isMainFrame(node) {
      var _a;
      if (!("type" in node)) return false;
      const sceneNode = node;
      return sceneNode.type === "FRAME" && ((_a = sceneNode.parent) == null ? void 0 : _a.type) === "PAGE" && !this.isComponentOrTemplate(sceneNode.name);
    }
    isComponentOrTemplate(name) {
      const lowerName = name.toLowerCase();
      return lowerName.includes("component") || lowerName.includes("template") || lowerName.includes("master");
    }
    // Async migration: Use async traversal for Figma Community compatibility
    async getNodePath(node) {
      const path = [];
      let current = node;
      try {
        while (current && "parent" in current) {
          if (this.isMainFrame(current)) break;
          path.unshift(current.name);
          current = current.parent;
        }
      } catch (err) {
        console.error("[getNodePath] Error in async traversal:", node.id, err);
      }
      return path;
    }
    normalizeTriggerType(type) {
      const triggerMap = {
        "ON_CLICK": "click",
        "ON_PRESS": "click",
        "TOUCH_DOWN": "click",
        "MOUSE_ENTER": "hover",
        "MOUSE_LEAVE": "hover",
        "WHILE_HOVER": "hover",
        "AFTER_TIMEOUT": "timeout",
        "ON_DRAG": "drag",
        "KEY_DOWN": "key",
        "ON_KEY_DOWN": "key",
        "SCROLL": "scroll",
        "SWIPE": "swipe"
      };
      const normalizedType = triggerMap[type.toUpperCase()];
      if (!normalizedType) {
        console.warn(`Unknown trigger type: ${type}, defaulting to 'click'`);
        return "click";
      }
      return normalizedType;
    }
    normalizeActionType(type) {
      const actionMap = {
        "NAVIGATE": "navigate",
        "SMART_ANIMATE": "smart-animate",
        "OVERLAY": "overlay",
        "SWAP": "component-swap",
        "STATE_CHANGE": "state-change",
        "OPEN_URL": "navigate"
      };
      const normalizedType = actionMap[type.toUpperCase()];
      if (!normalizedType) {
        console.warn(`Unknown action type: ${type}, defaulting to 'navigate'`);
        return "navigate";
      }
      return normalizedType;
    }
  }
  class PluginController {
    constructor() {
      __publicField(this, "isGenerating");
      __publicField(this, "shouldCancel");
      __publicField(this, "startTime");
      __publicField(this, "processedNodes");
      __publicField(this, "visualizationService");
      __publicField(this, "batchProcessor");
      __publicField(this, "traversalService");
      __publicField(this, "interactionParser");
      __publicField(this, "documentationChunks");
      this.isGenerating = false;
      this.shouldCancel = false;
      this.startTime = 0;
      this.processedNodes = 0;
      this.visualizationService = new VisualizationService();
      this.batchProcessor = new BatchProcessor(this);
      this.traversalService = new TraversalService();
      this.interactionParser = new InteractionParser();
      this.documentationChunks = [];
    }
    async generateDocumentation(scope) {
      if (this.isGenerating) {
        throw new Error("Documentation generation already in progress");
      }
      this.startProcess();
      try {
        const totalNodes = await this.traversalService.countTotalNodes(scope);
        if (totalNodes === 0) {
          throw new Error(scope === "selection" ? "No interactive elements found in the current selection." : "No interactive elements found in the current page.");
        }
        const nodes = await this.traversalService.findInteractiveNodes(scope);
        await this.batchProcessor.processNodesInBatches(nodes, totalNodes);
        await this.visualizationService.createDocumentationNodes(this.documentationChunks);
        this.sendCompletionStatus(1, totalNodes);
      } catch (error) {
        if (error instanceof Error) {
          this.handleError(error);
        } else {
          this.handleError(new Error("An unknown error occurred"));
        }
      } finally {
        this.cleanup();
      }
    }
    async processNode(node) {
      try {
        const screenContext = await this.interactionParser.getScreenContext(node);
        const interactions = node.reactions.map((reaction) => ({
          trigger: this.interactionParser.parseTrigger(reaction),
          action: this.interactionParser.parseAction(reaction)
        }));
        const chunk = {
          pageId: figma.currentPage.id,
          nodeId: node.id,
          name: node.name,
          type: node.type,
          screen: screenContext,
          interactions: interactions.map((interaction) => ({
            trigger: interaction.trigger.type,
            action: interaction.action.type,
            metadata: interaction.trigger.metadata,
            actionMetadata: interaction.action.metadata,
            screen: screenContext
          })),
          timestamp: Date.now(),
          version: 1
        };
        this.documentationChunks.push(chunk);
        sendToUI({
          type: "chunk-loaded",
          chunk
        });
        return chunk;
      } catch (error) {
        console.error("Error processing node:", error);
        return null;
      }
    }
    startProcess() {
      this.isGenerating = true;
      this.shouldCancel = false;
      this.startTime = Date.now();
      this.processedNodes = 0;
      this.documentationChunks = [];
    }
    handleError(error) {
      sendToUI({
        type: "generation-error",
        error: error.message,
        canResume: false
      });
    }
    sendCompletionStatus(totalPages, totalNodes) {
      sendToUI({
        type: "generation-complete",
        stats: {
          totalPages,
          totalNodes,
          processedNodes: this.processedNodes
        },
        chunks: this.documentationChunks
      });
    }
    cleanup() {
      this.isGenerating = false;
      this.shouldCancel = false;
      this.processedNodes = 0;
      this.documentationChunks = [];
    }
    cancelGeneration() {
      this.shouldCancel = true;
    }
  }
  figma.showUI(__html__, { width: 320, height: 480, themeColors: true });
  const controller = new PluginController();
  setupMessageHandlers(controller);
})();
