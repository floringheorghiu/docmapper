import { DocumentationChunk } from '../../types/documentation';
import { InteractionData, ScreenInteractions } from '../../types/interaction-types';

const STYLES = {
  colors: {
    text: { r: 0, g: 0, b: 0 },
    textSecondary: { r: 0.29, g: 0.29, b: 0.29 },
    accent: { r: 0.6, g: 0.64, b: 0.27 },
    link: { r: 0, g: 0.35, b: 1 },
    border: { r: 0.44, g: 0.44, b: 0.44 },
    divider: { r: 0.91, g: 0.91, b: 0.91 }
  },
  spacing: {
    container: 32,
    section: 32,
    content: 16,
    element: 8
  },
  typography: {
    title: { size: 24, weight: 600 },
    subtitle: { size: 11, weight: 600 },
    heading: { size: 14, weight: 700 },
    screenName: { size: 12, weight: 700 },
    details: { size: 12, weight: 400 }
  }
};

export class VisualizationService {
  async createDocumentationNodes(chunks: DocumentationChunk[]) {
    try {
      const docPage = figma.createPage();
      docPage.name = `Documentation - ${new Date().toLocaleString()}`;
      
      const mainFrame = this.createMainFrame();
      await this.createDocumentationContent(mainFrame, chunks);
      
      docPage.appendChild(mainFrame);
      figma.currentPage = docPage;
      figma.viewport.scrollAndZoomIntoView([mainFrame]);
    } catch (error) {
      console.error('Error creating documentation:', error);
      throw error;
    }
  }

  private createMainFrame(): FrameNode {
    const frame = figma.createFrame();
    frame.name = 'Documentation Container';
    frame.resize(800, 1000);
    frame.layoutMode = 'VERTICAL';
    frame.itemSpacing = STYLES.spacing.section;
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.strokes = [{ type: 'SOLID', color: STYLES.colors.border }];
    frame.strokeWeight = 2;
    frame.strokeAlign = 'INSIDE';
    frame.cornerRadius = 8;
    
    frame.paddingTop = STYLES.spacing.container;
    frame.paddingRight = STYLES.spacing.container;
    frame.paddingBottom = STYLES.spacing.container;
    frame.paddingLeft = STYLES.spacing.container;

    return frame;
  }

  private async createDocumentationContent(frame: FrameNode, chunks: DocumentationChunk[]): Promise<void> {
    const header = await this.createHeader();
    frame.appendChild(header);

    const screenGroups = this.groupInteractionsByScreen(chunks);
    await this.createScreenSections(frame, screenGroups);
  }

  private async createHeader(): Promise<FrameNode> {
    const header = figma.createFrame();
    header.layoutMode = 'VERTICAL';
    header.itemSpacing = STYLES.spacing.element;
    header.fills = [];
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'FIXED';

    const title = await this.createText(
      "Interactions",
      STYLES.typography.title,
      STYLES.colors.text
    );

    const subtitle = await this.createText(
      "Prototype Documentation",
      STYLES.typography.subtitle,
      STYLES.colors.textSecondary
    );

    header.appendChild(title);
    header.appendChild(subtitle);

    return header;
  }

  private async createScreenSections(frame: FrameNode, screenGroups: ScreenInteractions[]): Promise<void> {
    for (let i = 0; i < screenGroups.length; i++) {
      const screen = screenGroups[i];
      const section = await this.createScreenSection(screen);
      frame.appendChild(section);

      if (i < screenGroups.length - 1) {
        frame.appendChild(this.createDivider());
      }
    }
  }

  private async createScreenSection(screen: ScreenInteractions): Promise<FrameNode> {
    const section = figma.createFrame();
    section.name = `Screen Section - ${screen.screenName}`;
    section.layoutMode = 'VERTICAL';
    section.itemSpacing = STYLES.spacing.content;
    section.fills = [];
    section.primaryAxisSizingMode = 'AUTO';
    section.counterAxisSizingMode = 'FIXED';

    const header = await this.createScreenHeader(screen);
    section.appendChild(header);

    const interactions = await this.createInteractionsList(screen.interactions);
    section.appendChild(interactions);

    return section;
  }

  private async createScreenHeader(screen: ScreenInteractions): Promise<FrameNode> {
    const header = figma.createFrame();
    header.layoutMode = 'HORIZONTAL';
    header.itemSpacing = STYLES.spacing.element;
    header.fills = [];
    header.primaryAxisSizingMode = 'AUTO';
    header.counterAxisSizingMode = 'AUTO';
    header.counterAxisAlignItems = 'CENTER';

    const title = await this.createText(
      `On ${screen.screenName} (${screen.totalInteractions} interaction${screen.totalInteractions === 1 ? '' : 's'})`,
      STYLES.typography.heading,
      STYLES.colors.text
    );

    const link = await this.createText(
      "See frame",
      { ...STYLES.typography.details, isLink: true },
      STYLES.colors.link
    );

    header.appendChild(title);
    header.appendChild(link);

    return header;
  }

  private async createInteractionsList(interactions: InteractionData[]): Promise<FrameNode> {
    const list = figma.createFrame();
    list.layoutMode = 'VERTICAL';
    list.itemSpacing = STYLES.spacing.content;
    list.fills = [];
    list.primaryAxisSizingMode = 'AUTO';
    list.counterAxisSizingMode = 'AUTO';
    list.paddingLeft = 24;

    const elementGroups = this.groupInteractionsByElement(interactions);
    
    for (const [elementName, elementInteractions] of elementGroups) {
      const elementSection = await this.createElementSection(elementName, elementInteractions);
      list.appendChild(elementSection);
    }

    return list;
  }

  private async createElementSection(elementName: string, interactions: InteractionData[]): Promise<FrameNode> {
    const section = figma.createFrame();
    section.layoutMode = 'VERTICAL';
    section.itemSpacing = STYLES.spacing.element;
    section.fills = [];
    section.primaryAxisSizingMode = 'AUTO';
    section.counterAxisSizingMode = 'AUTO';

    const name = await this.createText(
      elementName,
      STYLES.typography.screenName,
      STYLES.colors.accent
    );
    section.appendChild(name);

    for (const interaction of interactions) {
      const details = await this.createText(
        this.formatInteraction(interaction),
        STYLES.typography.details,
        STYLES.colors.text
      );
      section.appendChild(details);
    }

    return section;
  }

  private createDivider(): FrameNode {
    const divider = figma.createFrame();
    divider.name = "Divider";
    divider.resize(800 - (STYLES.spacing.container * 2), 1);
    divider.fills = [{ type: 'SOLID', color: STYLES.colors.divider }];
    return divider;
  }

  private async createText(
    content: string,
    style: { size: number; weight: number; isLink?: boolean },
    color: { r: number; g: number; b: number }
  ): Promise<TextNode> {
    const text = figma.createText();
    
    await figma.loadFontAsync({ 
      family: "Inter",
      style: style.weight >= 600 ? "Bold" : "Regular"
    });

    text.fontName = { 
      family: "Inter",
      style: style.weight >= 600 ? "Bold" : "Regular"
    };
    
    text.characters = content;
    text.fontSize = style.size;
    text.fills = [{ type: 'SOLID', color }];
    
    if (style.isLink) {
      text.textDecoration = 'UNDERLINE';
    }

    return text;
  }

  private formatInteraction(interaction: InteractionData): string {
    const trigger = this.normalizeTrigger(interaction.trigger);
    const action = interaction.destination || this.normalizeAction(interaction.action);
    let description = `${trigger} → ${action}`;
    
    if (interaction.metadata?.delay) {
      description += ` (after ${interaction.metadata.delay}ms)`;
    }
    
    if (interaction.metadata?.duration) {
      description += ` (${interaction.metadata.duration}ms)`;
    }
    
    return description;
  }

  private normalizeTrigger(trigger: string): string {
    const triggers: Record<string, string> = {
      'ON_CLICK': 'On tap',
      'MOUSE_ENTER': 'On hover',
      'MOUSE_LEAVE': 'On hover end',
      'AFTER_TIMEOUT': 'After delay',
      'ON_DRAG': 'On drag',
      'WHILE_PRESSING': 'While pressing',
      'KEY_DOWN': 'On key press'
    };
    return triggers[trigger] || trigger;
  }

  private normalizeAction(action: string): string {
    const actions: Record<string, string> = {
      'NAVIGATE': 'Navigate to',
      'SMART_ANIMATE': 'Smart animate to',
      'OVERLAY': 'Show overlay',
      'SWAP': 'Swap with',
      'BACK': 'Go back',
      'CLOSE': 'Close overlay'
    };
    return actions[action] || action;
  }

  private groupInteractionsByScreen(chunks: DocumentationChunk[]): ScreenInteractions[] {
    const screenMap = new Map<string, ScreenInteractions>();

    chunks.forEach(chunk => {
      chunk.interactions.forEach(interaction => {
        const screenId = interaction.screen?.screenId || 'unknown';
        const screenName = interaction.screen?.screenName || 'Unknown Screen';

        if (!screenMap.has(screenId)) {
          screenMap.set(screenId, {
            screenId,
            screenName,
            interactions: [],
            totalInteractions: 0
          });
        }

        const screenGroup = screenMap.get(screenId)!;
        screenGroup.interactions.push({
          elementName: chunk.name,
          nodeName: chunk.name,
          trigger: interaction.trigger,
          action: interaction.action,
          destination: interaction.actionMetadata?.destination,
          metadata: interaction.metadata,
          screen: interaction.screen!
        });
        screenGroup.totalInteractions++;
      });
    });

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

  getInteractionDescription(interaction: { trigger: { type: string }; action: { type: string; navigation: string } }): string {
    if (interaction.trigger.type === 'ON_CLICK' && interaction.action.type === 'NAVIGATE') {
      return `On tap → ${interaction.action.navigation}`;
    }
    return 'Unknown interaction';
  }
}