var p = Object.defineProperty;
var h = (i, e, t) => e in i ? p(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var l = (i, e, t) => h(i, typeof e != "symbol" ? e + "" : e, t);
const a = {
  FRAME_WIDTH: 600,
  FRAME_HEIGHT: 400,
  FRAME_NAME: "Documentation",
  TEXT_SIZE: 14,
  PADDING: 20,
  SPACING: 16
};
class d {
  constructor() {
    l(this, "triggerMap", {
      ON_CLICK: "On tap",
      ON_DRAG: "On drag",
      MOUSE_ENTER: "On hover",
      MOUSE_LEAVE: "On hover end",
      ON_HOVER: "On hover",
      WHILE_HOVER: "While hovering",
      KEY_DOWN: "On key press",
      AFTER_TIMEOUT: "After delay",
      TOUCH_DOWN: "On touch",
      TOUCH_UP: "On touch end",
      WHILE_PRESSING: "While pressing",
      ON_HOVER: "On hover"
    });
    l(this, "actionMap", {
      NAVIGATE: "Navigate to",
      BACK: "Go back",
      SCROLL_TO: "Scroll to",
      URL: "Open link",
      OVERLAY: "Open overlay",
      SWAP_OVERLAY: "Swap overlay",
      CLOSE_OVERLAY: "Close overlay",
      SET_VARIABLE: "Set variable",
      SET_VARIABLE_MODE: "Set variable mode",
      CHECK_IF_ELSE: "Check if/else",
      CHANGE_TO: "Change to",
      NODE: "Navigate to"
    });
  }
  hasInteractions(e) {
    if (!this.isInteractiveNode(e))
      return !1;
    const t = e;
    return this.hasValidReactions(t);
  }
  getInteractions(e) {
    if (!this.hasInteractions(e))
      return [];
    const t = e;
    return this.parseReactions(t);
  }
  getInteractionDescription(e) {
    const t = this.normalizeTrigger(e.trigger.type), n = this.normalizeAction(e.action.type, e);
    return `${t} → ${n}`;
  }
  normalizeTrigger(e) {
    return this.triggerMap[e] || e;
  }
  normalizeAction(e, t) {
    if (t.action.destinationId) {
      const n = figma.getNodeById(t.action.destinationId);
      return n ? n.name : "Unknown destination";
    }
    return t.action.navigation ? t.action.navigation : this.actionMap[e] || e;
  }
  findParentScreen(e) {
    let t = e;
    for (; t && "parent" in t; ) {
      if (this.isScreenNode(t))
        return t;
      t = t.parent;
    }
    return null;
  }
  isScreenNode(e) {
    var n;
    if (!("type" in e)) return !1;
    const t = e;
    return t.type === "FRAME" && ((n = t.parent) == null ? void 0 : n.type) === "PAGE" && !t.name.toLowerCase().includes("component") && !t.name.toLowerCase().includes("template");
  }
  isInteractiveNode(e) {
    return "reactions" in e && "visible" in e;
  }
  hasValidReactions(e) {
    const t = e.reactions;
    return Array.isArray(t) && t.length > 0;
  }
  parseReactions(e) {
    const t = this.findParentScreen(e);
    return e.reactions.filter((n) => this.isValidReaction(n)).map((n) => ({
      nodeId: e.id,
      nodeName: e.name,
      screenId: (t == null ? void 0 : t.id) || null,
      screenName: (t == null ? void 0 : t.name) || null,
      trigger: {
        type: n.trigger.type,
        delay: n.trigger.delay || 0
      },
      action: {
        type: n.action.type,
        destinationId: n.action.destinationId,
        navigation: n.action.navigation
      }
    }));
  }
  isValidReaction(e) {
    return e && e.trigger && e.trigger.type && e.action && e.action.type;
  }
}
class m {
  constructor() {
    l(this, "detector");
    this.detector = new d();
  }
  /**
   * Safely traverses the current page or selection to find interactive nodes
   */
  async findInteractiveNodes(e) {
    try {
      const t = e === "selection" ? figma.currentPage.selection : [figma.currentPage];
      return this.traverseNodes(t);
    } catch (t) {
      return console.error("Error finding interactive nodes:", t), [];
    }
  }
  traverseNodes(e) {
    const t = [], n = (o) => {
      this.detector.hasInteractions(o) && t.push(o), "children" in o && o.children.forEach(n);
    };
    return e.forEach(n), t;
  }
}
figma.showUI(__html__, {
  width: 320,
  height: 480,
  themeColors: !0
});
const E = new m(), g = new d();
let r = null;
figma.ui.onmessage = async (i) => {
  if (i.type === "generate-docs")
    try {
      figma.ui.postMessage({
        type: "generation-progress",
        progress: 0,
        pageId: figma.currentPage.id,
        processedNodes: 0
      });
      const e = await E.findInteractiveNodes(i.options.scope);
      if (console.log("Found interactive nodes:", e.length), r = figma.currentPage.findChild(
        (n) => n.type === "FRAME" && n.name === a.FRAME_NAME
      ), !r) {
        r = figma.createFrame(), r.name = a.FRAME_NAME, r.resize(a.FRAME_WIDTH, a.FRAME_HEIGHT), r.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }], r.cornerRadius = 8, r.layoutMode = "VERTICAL", r.paddingLeft = a.PADDING, r.paddingRight = a.PADDING, r.paddingTop = a.PADDING, r.paddingBottom = a.PADDING, r.itemSpacing = a.SPACING;
        const n = figma.viewport.center;
        r.x = n.x - r.width / 2, r.y = n.y - r.height / 2, figma.currentPage.appendChild(r);
      }
      const t = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Regular" }), t.fontName = { family: "Inter", style: "Regular" }, t.fontSize = a.TEXT_SIZE, t.characters = "Interactions", r.appendChild(t);
      for (const n of e) {
        const o = g.getInteractions(n);
        if (o.length > 0) {
          const s = figma.createText();
          await figma.loadFontAsync({ family: "Inter", style: "Regular" }), s.fontName = { family: "Inter", style: "Regular" }, s.fontSize = a.TEXT_SIZE, s.characters = `${n.name} (${o.length} interaction${o.length > 1 ? "s" : ""})`, r.appendChild(s);
          for (const f of o) {
            const c = figma.createText();
            c.fontName = { family: "Inter", style: "Regular" }, c.fontSize = a.TEXT_SIZE - 2, c.characters = `• ${g.getInteractionDescription(f)}`, r.appendChild(c);
          }
        }
      }
      if (e.length === 0) {
        const n = figma.createText();
        await figma.loadFontAsync({ family: "Inter", style: "Regular" }), n.fontName = { family: "Inter", style: "Regular" }, n.fontSize = a.TEXT_SIZE, n.characters = "No interactions found", r.appendChild(n);
      }
      figma.viewport.scrollAndZoomIntoView([r]), figma.ui.postMessage({
        type: "generation-complete",
        stats: {
          totalPages: 1,
          totalNodes: e.length,
          processedNodes: e.length
        }
      });
    } catch (e) {
      console.error("Error creating documentation:", e), figma.ui.postMessage({
        type: "generation-error",
        error: e.message,
        canResume: !1
      });
    }
  else if (i.type === "open-url")
    try {
      await figma.openExternal(i.url);
    } catch (e) {
      console.error("Failed to open URL:", e);
    }
};
