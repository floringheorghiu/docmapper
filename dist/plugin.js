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
            await controller2.generateDocumentation(message.options.scope, message.options.reportPlacement);
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
    FRAME_NAME: "Documentation",
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
      "none": "None",
      "navigate": "Navigate to",
      "change-to": "Change to",
      "back": "Back",
      "scroll-to": "Scroll to",
      "open-link": "Open link",
      "set-variable": "Set variable",
      "set-variable-mode": "Set variable mode",
      "conditional": "Conditional",
      "open-overlay": "Open overlay",
      "swap-overlay": "Swap overlay",
      "close-overlay": "Close overlay",
      "overlay": "Show overlay",
      "animation": "Animate",
      "state-change": "Change state",
      "component-swap": "Swap component",
      "smart-animate": "Animate to"
    };
    return (_a = map[type]) != null ? _a : type;
  }
  const _VisualizationService = class _VisualizationService {
    async createDocumentationNodes(chunks, placement = "new-page") {
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });
        const targetPage = placement === "current-page" ? figma.currentPage : this.getOrCreateDocumentationPage();
        const inSituPosition = placement === "current-page" ? this.getInSituPosition(targetPage) : void 0;
        this.clearPreviousReport(targetPage, placement);
        const frame = this.createMainFrame();
        frame.setPluginData(_VisualizationService.REPORT_PLUGIN_DATA_KEY, "true");
        if (inSituPosition) {
          frame.x = inSituPosition.x;
          frame.y = inSituPosition.y;
        }
        let screenGroups = [];
        try {
          screenGroups = await this.groupInteractionsByScreen(chunks);
        } catch (err) {
          console.error("[createDocumentationNodes] Error in groupInteractionsByScreen:", err);
          screenGroups = [];
        }
        await this.createScreenSections(frame, screenGroups);
        targetPage.appendChild(frame);
        await figma.setCurrentPageAsync(targetPage);
        figma.viewport.scrollAndZoomIntoView([frame]);
      } catch (error) {
        console.error("Error creating documentation:", error);
        throw error;
      }
    }
    getOrCreateDocumentationPage() {
      const docPage = figma.root.children.find((p) => p.name === CONFIG.FRAME_NAME);
      if (docPage) return docPage;
      const page = figma.createPage();
      page.name = CONFIG.FRAME_NAME;
      return page;
    }
    clearPreviousReport(page, placement) {
      if (placement !== "new-page") return;
      for (const child of [...page.children]) {
        child.remove();
      }
    }
    getInSituPosition(page) {
      const children = page.children.filter(
        (child) => child.getPluginData(_VisualizationService.REPORT_PLUGIN_DATA_KEY) !== "true"
      );
      if (children.length === 0) {
        return { x: 0, y: 0 };
      }
      const maxX = Math.max(...children.map((child) => child.x + child.width));
      const minY = Math.min(...children.map((child) => child.y));
      return { x: maxX + 200, y: minY };
    }
    createMainFrame() {
      const frame = figma.createFrame();
      frame.name = "Documentation";
      frame.resize(CONFIG.FRAME_WIDTH, CONFIG.FRAME_HEIGHT);
      frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      frame.cornerRadius = 8;
      frame.layoutMode = "HORIZONTAL";
      frame.paddingLeft = CONFIG.PADDING;
      frame.paddingRight = CONFIG.PADDING;
      frame.paddingTop = CONFIG.PADDING;
      frame.paddingBottom = CONFIG.PADDING;
      frame.itemSpacing = CONFIG.SPACING;
      frame.primaryAxisSizingMode = "AUTO";
      frame.counterAxisSizingMode = "AUTO";
      return frame;
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
      }
    }
    async createElementSection(elementName, interactions) {
      var _a;
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
        true
      );
      const isLinked = await this.tryLinkTextToNode(elementHeader, (_a = interactions[0]) == null ? void 0 : _a.nodeId);
      this.applyLinkStyle(elementHeader, isLinked);
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
        this.applyLinkStyle(description, false);
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
      if (interaction.action === "open-link" && interaction.url) {
        action = interaction.url;
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
      text.textDecoration = isLink ? "UNDERLINE" : "NONE";
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
      var _a, _b, _c;
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
            textContent: chunk.textContent,
            nodeId: chunk.nodeId,
            trigger: interaction.trigger,
            action: interaction.action,
            destination: (_a = interaction.actionMetadata) == null ? void 0 : _a.destination,
            destinationId: (_b = interaction.actionMetadata) == null ? void 0 : _b.destinationId,
            url: (_c = interaction.actionMetadata) == null ? void 0 : _c.url,
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
        const key = this.formatElementName(interaction);
        if (!elementMap.has(key)) {
          elementMap.set(key, []);
        }
        elementMap.get(key).push(interaction);
      });
      return new Map([...elementMap.entries()].sort());
    }
    formatElementName(interaction) {
      return interaction.textContent ? `${interaction.elementName} — “${interaction.textContent}”` : interaction.elementName;
    }
    applyLinkStyle(text, isLinked) {
      text.fills = [{ type: "SOLID", color: isLinked ? { r: 0, g: 0.4, b: 1 } : { r: 0, g: 0, b: 0 } }];
      text.textDecoration = isLinked ? "UNDERLINE" : "NONE";
    }
    async tryLinkTextToNode(text, nodeId) {
      if (!nodeId) return false;
      const targetIds = [nodeId];
      const parentFrame = await this.findParentFrame(nodeId);
      if ((parentFrame == null ? void 0 : parentFrame.id) && parentFrame.id !== nodeId) {
        targetIds.push(parentFrame.id);
      }
      for (const targetId of targetIds) {
        try {
          const target = await figma.getNodeByIdAsync(targetId);
          if (!target || target.removed) continue;
          text.setRangeHyperlink(0, text.characters.length, {
            type: "NODE",
            value: targetId
          });
          text.textDecoration = "UNDERLINE";
          return true;
        } catch (error) {
          console.warn("[tryLinkTextToNode] Could not create node hyperlink:", targetId, error);
        }
      }
      text.textDecoration = "NONE";
      return false;
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
  };
  __publicField(_VisualizationService, "REPORT_PLUGIN_DATA_KEY", "docmapper-report");
  let VisualizationService = _VisualizationService;
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
    extractTextContent(node) {
      const textValues = [];
      this.collectTextContent(node, textValues);
      const textContent = textValues.map((value) => value.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
      return textContent ? this.truncateText(textContent, 60) : void 0;
    }
    truncateText(value, maxLength) {
      return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
    }
    collectTextContent(node, textValues) {
      if ("type" in node && node.type === "TEXT" && "characters" in node) {
        textValues.push(String(node.characters));
        return;
      }
      if ("children" in node) {
        for (const child of node.children) {
          this.collectTextContent(child, textValues);
        }
      }
    }
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
    parseActions(reaction) {
      const actions = Array.isArray(reaction == null ? void 0 : reaction.actions) ? reaction.actions : (reaction == null ? void 0 : reaction.action) ? [reaction.action] : [];
      if (actions.length === 0) {
        return [{ type: "none", metadata: {} }];
      }
      return actions.map((action) => this.parseAction(action));
    }
    parseAction(action) {
      var _a;
      if (!(action == null ? void 0 : action.type)) {
        console.warn("[parseAction] Missing action type, marking as none");
        return { type: "none", metadata: {} };
      }
      const actionType = this.normalizeActionType(action);
      const metadata = {};
      if (action.transition) {
        metadata.animation = {
          type: action.transition.type || "INSTANT",
          duration: action.transition.duration || 0,
          easing: ((_a = action.transition.easing) == null ? void 0 : _a.type) || "EASE_OUT"
        };
      }
      if (action.destinationId) metadata.destinationId = action.destinationId;
      if (action.navigation) metadata.navigation = action.navigation;
      if (action.url) metadata.url = action.url;
      if (typeof action.openInNewTab === "boolean") metadata.openInNewTab = action.openInNewTab;
      if ("variableId" in action) metadata.variableId = action.variableId;
      if ("variableCollectionId" in action) metadata.variableCollectionId = action.variableCollectionId;
      if ("variableModeId" in action) metadata.variableModeId = action.variableModeId;
      if (Array.isArray(action.conditionalBlocks)) metadata.conditionalBlocks = action.conditionalBlocks.length;
      if (action.mediaAction) metadata.mediaAction = action.mediaAction;
      if ((actionType === "open-overlay" || actionType === "overlay") && action.overlaySettings) {
        metadata.overlay = action.overlaySettings.name;
      }
      if ((actionType === "state-change" || actionType === "change-to") && action.states) {
        metadata.state = {
          from: action.states.current,
          to: action.states.target
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
    normalizeActionType(action) {
      var _a;
      const rawType = String(action.type || "").toUpperCase();
      if (rawType === "NODE") {
        const navigation = String(action.navigation || "").toUpperCase();
        const navigationMap = {
          "NAVIGATE": "navigate",
          "CHANGE_TO": "change-to",
          "SCROLL_TO": "scroll-to",
          "OVERLAY": "open-overlay",
          "SWAP": "swap-overlay"
        };
        return (_a = navigationMap[navigation]) != null ? _a : "navigate";
      }
      const actionMap = {
        "NONE": "none",
        "BACK": "back",
        "CLOSE": "close-overlay",
        "URL": "open-link",
        "OPEN_URL": "open-link",
        "SET_VARIABLE": "set-variable",
        "SET_VARIABLE_MODE": "set-variable-mode",
        "CONDITIONAL": "conditional",
        "UPDATE_MEDIA_RUNTIME": "animation",
        "NAVIGATE": "navigate",
        "SMART_ANIMATE": "smart-animate",
        "OVERLAY": "open-overlay",
        "SWAP": "swap-overlay",
        "STATE_CHANGE": "change-to"
      };
      const normalizedType = actionMap[rawType];
      if (!normalizedType) {
        console.warn(`Unknown action type: ${action.type}, defaulting to 'none'`);
        return "none";
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
    async generateDocumentation(scope, reportPlacement = "new-page") {
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
        const report = await this.createCanvasReport(reportPlacement);
        this.sendCompletionStatus(1, totalNodes, report);
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
        const textContent = this.interactionParser.extractTextContent(node);
        const interactions = node.reactions.flatMap((reaction) => {
          const trigger = this.interactionParser.parseTrigger(reaction);
          return this.interactionParser.parseActions(reaction).map((action) => ({ trigger, action }));
        });
        const chunk = {
          pageId: figma.currentPage.id,
          nodeId: node.id,
          name: node.name,
          type: node.type,
          textContent,
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
    async createCanvasReport(reportPlacement) {
      if (reportPlacement === "none") {
        return { created: false, placement: reportPlacement };
      }
      try {
        await this.visualizationService.createDocumentationNodes(this.documentationChunks, reportPlacement);
        return { created: true, placement: reportPlacement };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown canvas report error";
        if (reportPlacement === "new-page") {
          try {
            await this.visualizationService.createDocumentationNodes(this.documentationChunks, "current-page");
            const fallbackMessage = `Could not create a new Documentation page, so the report was created on the current page instead. Reason: ${message}`;
            figma.notify(fallbackMessage, { timeout: 7e3 });
            sendToUI({
              type: "generation-warning",
              message: fallbackMessage
            });
            return { created: true, placement: "current-page", error: message };
          } catch (fallbackError) {
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "Unknown fallback report error";
            sendToUI({
              type: "generation-warning",
              message: `Interactions extracted, but the canvas report could not be created: ${fallbackMessage}`
            });
            return { created: false, placement: reportPlacement, error: fallbackMessage };
          }
        }
        sendToUI({
          type: "generation-warning",
          message: `Interactions extracted, but the canvas report could not be created: ${message}`
        });
        return { created: false, placement: reportPlacement, error: message };
      }
    }
    sendCompletionStatus(totalPages, totalNodes, report) {
      sendToUI({
        type: "generation-complete",
        stats: {
          totalPages,
          totalNodes,
          processedNodes: this.processedNodes
        },
        chunks: this.documentationChunks,
        report
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
