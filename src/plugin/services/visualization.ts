import { DocumentationChunk } from '../../types/documentation';
import { InteractionData, ScreenInteractions } from '../../types/interaction-types';
import { CONFIG } from '../../constants';
import { normalizeTriggerFromInternal, normalizeActionFromInternal } from './normalization';

export class VisualizationService {
  async createDocumentationNodes(chunks: DocumentationChunk[]) {
    try {
      // Pre-load both fonts once — no per-call loadFontAsync needed after this
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
      await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

      // Reuse existing Documentation page if present, otherwise create one
      let docPage = figma.root.children.find(p => p.name === 'Documentation') as PageNode | undefined;
      if (docPage) {
        for (const child of [...docPage.children]) {
          child.remove();
        }
      } else {
        docPage = figma.createPage();
        docPage.name = 'Documentation';
      }

      // Create main container frame
      const frame = this.createMainFrame();

      // Group and sort interactions by screen
      let screenGroups: ScreenInteractions[] = [];
      try {
        screenGroups = await this.groupInteractionsByScreen(chunks);
      } catch (err) {
        console.error('[createDocumentationNodes] Error in groupInteractionsByScreen:', err);
        screenGroups = [];
      }

      await this.createTitle(frame, screenGroups);
      await this.createScreenSections(frame, screenGroups);

      docPage.appendChild(frame);
      await figma.setCurrentPageAsync(docPage);
      figma.viewport.scrollAndZoomIntoView([frame]);

    } catch (error) {
      console.error('Error creating documentation:', error);
      throw error;
    }
  }

  private createMainFrame(): FrameNode {
    const frame = figma.createFrame();
    frame.name = 'Documentation';
    frame.resize(CONFIG.FRAME_WIDTH, CONFIG.FRAME_HEIGHT);
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.cornerRadius = 8;
    frame.layoutMode = 'VERTICAL';
    frame.paddingLeft = CONFIG.PADDING;
    frame.paddingRight = CONFIG.PADDING;
    frame.paddingTop = CONFIG.PADDING;
    frame.paddingBottom = CONFIG.PADDING;
    frame.itemSpacing = CONFIG.SPACING;
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    return frame;
  }

  private createTitle(frame: FrameNode, screenGroups: ScreenInteractions[]): void {
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

  private async createScreenSections(frame: FrameNode, screenGroups: ScreenInteractions[]): Promise<void> {
    for (let i = 0; i < screenGroups.length; i++) {
      const screen = screenGroups[i];

      const screenSection = figma.createFrame();
      screenSection.layoutMode = 'VERTICAL';
      screenSection.itemSpacing = 12;
      screenSection.paddingLeft = 12;
      screenSection.paddingRight = 12;
      screenSection.paddingTop = 16;
      screenSection.paddingBottom = 16;
      screenSection.cornerRadius = 4;
      screenSection.primaryAxisSizingMode = 'AUTO';
      screenSection.counterAxisSizingMode = 'AUTO';

      // Alternating subtle background: odd sections get a very light gray
      screenSection.fills = i % 2 === 1
        ? [{ type: 'SOLID', color: { r: 0.97, g: 0.97, b: 0.97 } }]
        : [];

      // Screen header row
      const headerSection = figma.createFrame();
      headerSection.layoutMode = 'HORIZONTAL';
      headerSection.itemSpacing = 8;
      headerSection.fills = [];
      headerSection.primaryAxisSizingMode = 'AUTO';
      headerSection.counterAxisSizingMode = 'AUTO';

      const screenName = this.createText(screen.screenName, 14, true);
      const interactionCount = this.createText(
        `(${screen.totalInteractions} interaction${screen.totalInteractions === 1 ? '' : 's'})`,
        14,
        false
      );
      interactionCount.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];

      headerSection.appendChild(screenName);
      headerSection.appendChild(interactionCount);
      screenSection.appendChild(headerSection);

      // Elements nested within this screen
      const elementGroups = this.groupInteractionsByElement(screen.interactions);
      for (const [elementName, interactions] of elementGroups) {
        const elementSection = await this.createElementSection(elementName, interactions);
        screenSection.appendChild(elementSection);
      }

      frame.appendChild(screenSection);
      // FILL must be set AFTER appendChild
      screenSection.layoutSizingHorizontal = 'FILL';

      // Divider between screens
      if (i < screenGroups.length - 1) {
        const divider = this.createDivider(frame.width - 2 * CONFIG.PADDING);
        frame.appendChild(divider);
      }
    }
  }

  private async createElementSection(elementName: string, interactions: InteractionData[]): Promise<FrameNode> {
    const section = figma.createFrame();
    section.layoutMode = 'VERTICAL';
    section.itemSpacing = 8;
    section.fills = [];
    section.paddingLeft = 24;
    section.primaryAxisSizingMode = 'AUTO';
    section.counterAxisSizingMode = 'AUTO';

    const elementHeader = this.createText(
      `${elementName} (${interactions.length} interaction${interactions.length === 1 ? '' : 's'})`,
      12,
      true,
      true
    );
    elementHeader.fills = [{ type: 'SOLID', color: { r: 0, g: 0.4, b: 1 } }];
    section.appendChild(elementHeader);

    for (const interaction of interactions) {
      let descText = '';
      try {
        descText = await this.formatInteraction(interaction);
      } catch (err) {
        console.error('[createElementSection] Error in formatInteraction:', interaction, err);
        descText = '[Error formatting interaction]';
      }

      // Horizontal row: colored dot + description text
      const row = figma.createFrame();
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 6;
      row.fills = [];
      row.counterAxisAlignItems = 'CENTER';
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';

      const dot = figma.createRectangle();
      dot.resize(8, 8);
      dot.cornerRadius = 4;
      dot.fills = [{ type: 'SOLID', color: this.getTriggerColor(interaction.trigger) }];
      row.appendChild(dot);

      const description = this.createText(descText, 11, false);
      description.fills = [{ type: 'SOLID', color: { r: 0.35, g: 0.35, b: 0.35 } }];
      row.appendChild(description);

      section.appendChild(row);
    }

    return section;
  }

  private async formatInteraction(interaction: InteractionData): Promise<string> {
    const trigger = this.normalizeTrigger(interaction.trigger);
    let action: string | undefined = interaction.destination;

    if (!action) {
      if (interaction.destinationId) {
        try {
          const destNode = await figma.getNodeByIdAsync(interaction.destinationId);
          action = destNode?.name || this.normalizeAction(interaction.action);
        } catch (err) {
          console.error('[formatInteraction] Error fetching destination node:', interaction.destinationId, err);
          action = this.normalizeAction(interaction.action);
        }
      } else {
        action = this.normalizeAction(interaction.action);
      }
    }

    let description = `${trigger} → ${action}`;

    if (interaction.metadata?.delay && interaction.metadata.delay > 0) {
      description += ` (after ${interaction.metadata.delay}ms)`;
    }

    return description;
  }

  private createText(
    content: string,
    size: number,
    isBold: boolean = false,
    isLink: boolean = false
  ): TextNode {
    const text = figma.createText();
    text.fontName = { family: 'Inter', style: isBold ? 'Bold' : 'Regular' };
    text.fontSize = size;
    text.characters = content;
    if (isLink) {
      text.textDecoration = 'UNDERLINE';
    }
    return text;
  }

  private createDivider(width: number): FrameNode {
    const divider = figma.createFrame();
    divider.resize(width, 1);
    divider.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    return divider;
  }

  private getTriggerColor(trigger: string): { r: number; g: number; b: number } {
    const colorMap: Record<string, { r: number; g: number; b: number }> = {
      'click': { r: 0.18, g: 0.44, b: 1 },
      'hover': { r: 0.18, g: 0.75, b: 0.3 },
      'timeout': { r: 1, g: 0.5, b: 0.1 },
      'key': { r: 0.5, g: 0.2, b: 0.9 },
      'scroll': { r: 0.9, g: 0.2, b: 0.5 },
      'drag': { r: 0.3, g: 0.3, b: 0.9 },
      'swipe': { r: 0.3, g: 0.3, b: 0.9 },
    };
    return colorMap[trigger] ?? { r: 0.6, g: 0.6, b: 0.6 };
  }

  private async groupInteractionsByScreen(chunks: DocumentationChunk[]): Promise<ScreenInteractions[]> {
    const screenMap = new Map<string, ScreenInteractions>();

    for (const chunk of chunks) {
      let parentFrame = null;
      try {
        parentFrame = await this.findParentFrame(chunk.nodeId);
      } catch (err) {
        console.error('[groupInteractionsByScreen] Error in findParentFrame:', chunk.nodeId, err);
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

      const screenGroup = screenMap.get(screenId)!;
      for (const interaction of chunk.interactions) {
        let parentPath: string[] = [];
        try {
          parentPath = await this.getNodePath(chunk.nodeId);
        } catch (err) {
          console.error('[groupInteractionsByScreen] Error in getNodePath:', chunk.nodeId, err);
        }
        screenGroup.interactions.push({
          elementName: chunk.name,
          nodeName: chunk.name,
          nodeId: chunk.nodeId,
          trigger: interaction.trigger,
          action: interaction.action,
          destination: interaction.actionMetadata?.destination,
          destinationId: interaction.actionMetadata?.destinationId,
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

    return Array.from(screenMap.values())
      .sort((a, b) => a.screenName.localeCompare(b.screenName));
  }

  private groupInteractionsByElement(interactions: InteractionData[]): Map<string, InteractionData[]> {
    const elementMap = new Map<string, InteractionData[]>();
    interactions.forEach(interaction => {
      const key = interaction.elementName;
      if (!elementMap.has(key)) {
        elementMap.set(key, []);
      }
      elementMap.get(key)!.push(interaction);
    });
    return new Map([...elementMap.entries()].sort());
  }

  private async findParentFrame(nodeId: string): Promise<SceneNode | null> {
    try {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) return null;
      let current: BaseNode | null = node;
      while (current && 'parent' in current) {
        if (this.isMainFrame(current)) return current as SceneNode;
        current = current.parent;
      }
      return null;
    } catch (err) {
      console.error('[findParentFrame] Error fetching node:', nodeId, err);
      return null;
    }
  }

  private isMainFrame(node: BaseNode): boolean {
    if (!('type' in node)) return false;
    const sceneNode = node as SceneNode;
    return sceneNode.type === 'FRAME' &&
      sceneNode.parent?.type === 'PAGE' &&
      !this.isComponentOrTemplate(sceneNode.name);
  }

  private isComponentOrTemplate(name: string): boolean {
    const lowerName = name.toLowerCase();
    return lowerName.includes('component') ||
      lowerName.includes('template') ||
      lowerName.includes('master');
  }

  private async getNodePath(nodeId: string): Promise<string[]> {
    const path: string[] = [];
    try {
      let current = await figma.getNodeByIdAsync(nodeId);
      while (current && 'parent' in current) {
        if (this.isMainFrame(current)) break;
        path.unshift(current.name);
        current = current.parent;
      }
    } catch (err) {
      console.error('[getNodePath] Error fetching node:', nodeId, err);
    }
    return path;
  }

  private normalizeTrigger(trigger: string): string {
    return normalizeTriggerFromInternal(trigger);
  }

  private normalizeAction(action: string): string {
    return normalizeActionFromInternal(action);
  }
}
