import type { DocumentationChunk } from '../types/documentation';

// ─── Internal trigger/action → display label ─────────────────────────────────

function triggerLabel(type: string): string {
  const map: Record<string, string> = {
    'click': 'On tap',
    'hover': 'On hover',
    'timeout': 'After delay',
    'drag': 'On drag',
    'key': 'On key press',
    'scroll': 'On scroll',
    'swipe': 'On swipe',
  };
  return map[type] ?? type;
}

function actionLabel(type: string): string {
  const map: Record<string, string> = {
    'navigate': 'Navigate',
    'overlay': 'Show overlay',
    'animation': 'Animate',
    'state-change': 'Change state',
    'component-swap': 'Swap component',
    'smart-animate': 'Animate to',
  };
  return map[type] ?? type;
}

// ─── Group chunks by screen ───────────────────────────────────────────────────

interface ExportInteraction {
  trigger: string;
  action: string;
  destination?: string;
  delay?: number;
}

interface ExportElement {
  elementName: string;
  path: string[];
  interactions: ExportInteraction[];
}

interface ExportScreen {
  screenName: string;
  elements: ExportElement[];
}

interface ExportFormat {
  generatedAt: string;
  totalInteractions: number;
  screens: ExportScreen[];
}

function groupByScreen(chunks: DocumentationChunk[]): ExportScreen[] {
  const screenMap = new Map<string, ExportScreen>();

  for (const chunk of chunks) {
    const screenName = chunk.screen?.screenName ?? 'Unknown Screen';
    const screenId = chunk.screen?.screenId ?? screenName;

    if (!screenMap.has(screenId)) {
      screenMap.set(screenId, { screenName, elements: [] });
    }

    const screen = screenMap.get(screenId)!;
    screen.elements.push({
      elementName: chunk.name,
      path: chunk.screen?.parentPath ?? [],
      interactions: chunk.interactions.map(i => ({
        trigger: triggerLabel(i.trigger),
        action: i.actionMetadata?.destination
          ? `${actionLabel(i.action)} → ${i.actionMetadata.destination}`
          : actionLabel(i.action),
        destination: i.actionMetadata?.destination,
        delay: i.metadata?.delay && i.metadata.delay > 0 ? i.metadata.delay : undefined,
      })),
    });
  }

  return Array.from(screenMap.values()).sort((a, b) => a.screenName.localeCompare(b.screenName));
}

// ─── JSON export ──────────────────────────────────────────────────────────────

export function chunksToExportFormat(chunks: DocumentationChunk[]): ExportFormat {
  const screens = groupByScreen(chunks);
  const totalInteractions = screens.reduce(
    (sum, s) => sum + s.elements.reduce((eSum, e) => eSum + e.interactions.length, 0),
    0
  );
  return {
    generatedAt: new Date().toISOString(),
    totalInteractions,
    screens,
  };
}

export function downloadJSON(chunks: DocumentationChunk[]): void {
  const data = chunksToExportFormat(chunks);
  const json = JSON.stringify(data, null, 2);
  triggerDownload(json, `docmapper-${Date.now()}.json`, 'application/json');
}

// ─── Markdown export ──────────────────────────────────────────────────────────

export function chunksToMarkdown(chunks: DocumentationChunk[]): string {
  const screens = groupByScreen(chunks);
  const lines: string[] = [
    '# Interaction Documentation',
    `_Generated: ${new Date().toLocaleString()}_`,
    '',
  ];

  for (const screen of screens) {
    lines.push(`## ${screen.screenName}`, '');
    for (const element of screen.elements) {
      lines.push(`### ${element.elementName}`);
      if (element.path.length > 0) {
        lines.push(`_Path: ${element.path.join(' › ')}_`);
      }
      for (const interaction of element.interactions) {
        let line = `- **${interaction.trigger}** → ${interaction.action}`;
        if (interaction.delay) {
          line += ` _(after ${interaction.delay}ms)_`;
        }
        lines.push(line);
      }
      lines.push('');
    }
    lines.push('---', '');
  }

  return lines.join('\n');
}

export function downloadMarkdown(chunks: DocumentationChunk[]): void {
  const md = chunksToMarkdown(chunks);
  triggerDownload(md, `docmapper-${Date.now()}.md`, 'text/markdown');
}

// ─── Mermaid export ───────────────────────────────────────────────────────────

export function chunksToMermaid(chunks: DocumentationChunk[]): string {
  // Build nodeId → name lookup from all processed chunks
  const nodeNames = new Map<string, string>();
  for (const chunk of chunks) {
    nodeNames.set(chunk.nodeId, chunk.name);
  }

  const safeId = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_');

  const nodes = new Set<string>();
  const edges: string[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const sourceScreen = chunk.screen?.screenName ?? chunk.name;
    nodes.add(sourceScreen);

    for (const interaction of chunk.interactions) {
      const destNodeId = interaction.actionMetadata?.destinationId;
      if (!destNodeId) continue;

      const destName = nodeNames.get(destNodeId) ?? destNodeId;
      nodes.add(destName);

      const trigger = triggerLabel(interaction.trigger);
      const elementNote = chunk.name !== sourceScreen ? ` [${chunk.name}]` : '';
      const delay = interaction.metadata?.delay && interaction.metadata.delay > 0
        ? ` after ${interaction.metadata.delay}ms`
        : '';
      const label = `${trigger}${elementNote}${delay}`;

      // Deduplicate identical edges
      const edgeKey = `${sourceScreen}→${destName}:${label}`;
      if (seen.has(edgeKey)) continue;
      seen.add(edgeKey);

      edges.push(`    ${safeId(sourceScreen)} -->|"${label}"| ${safeId(destName)}`);
    }
  }

  const nodeDefs = Array.from(nodes)
    .map(n => `    ${safeId(n)}["${n}"]`)
    .join('\n');

  return ['```mermaid', 'flowchart TD', nodeDefs, ...edges, '```'].join('\n');
}

export function downloadMermaid(chunks: DocumentationChunk[]): void {
  const md = chunksToMermaid(chunks);
  triggerDownload(md, `docmapper-${Date.now()}.md`, 'text/markdown');
}

// ─── Shared download helper ───────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
