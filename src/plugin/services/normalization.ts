/**
 * Maps raw Figma API trigger enum strings → human-readable display strings.
 * Used by the legacy InteractionDetector path.
 */
export function normalizeTriggerFromFigma(type: string): string {
  const map: Record<string, string> = {
    'ON_CLICK': 'On tap',
    'ON_PRESS': 'On tap',
    'TOUCH_DOWN': 'On touch',
    'MOUSE_ENTER': 'On hover',
    'MOUSE_LEAVE': 'On hover end',
    'WHILE_HOVER': 'While hovering',
    'AFTER_TIMEOUT': 'After delay',
    'ON_DRAG': 'On drag',
    'KEY_DOWN': 'On key press',
    'ON_KEY_DOWN': 'On key press',
    'SCROLL': 'On scroll',
    'SWIPE': 'On swipe',
  };
  return map[type.toUpperCase()] ?? type;
}

/**
 * Maps internal semantic trigger types → human-readable display strings.
 * Used by VisualizationService after the controller pipeline normalizes to
 * internal types ('click', 'timeout', etc.).
 */
export function normalizeTriggerFromInternal(type: string): string {
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

/**
 * Maps raw Figma API action enum strings → human-readable display strings.
 * Used by the legacy InteractionDetector path.
 */
export function normalizeActionFromFigma(type: string): string {
  const map: Record<string, string> = {
    'NAVIGATE': 'Navigate',
    'NODE': 'Navigate to',
    'BACK': 'Go back',
    'CLOSE': 'Close',
    'OPEN_URL': 'Open URL',
    'SWAP': 'Swap component',
    'OVERLAY': 'Show overlay',
    'SMART_ANIMATE': 'Animate to',
    'STATE_CHANGE': 'Change state',
  };
  return map[type.toUpperCase()] ?? type;
}

/**
 * Maps internal semantic action types → human-readable display strings.
 * Used by VisualizationService after the controller pipeline normalizes to
 * internal types ('navigate', 'overlay', etc.).
 */
export function normalizeActionFromInternal(type: string): string {
  const map: Record<string, string> = {
    'none': 'None',
    'navigate': 'Navigate to',
    'change-to': 'Change to',
    'back': 'Back',
    'scroll-to': 'Scroll to',
    'open-link': 'Open link',
    'set-variable': 'Set variable',
    'set-variable-mode': 'Set variable mode',
    'conditional': 'Conditional',
    'open-overlay': 'Open overlay',
    'swap-overlay': 'Swap overlay',
    'close-overlay': 'Close overlay',
    'overlay': 'Show overlay',
    'animation': 'Animate',
    'state-change': 'Change state',
    'component-swap': 'Swap component',
    'smart-animate': 'Animate to',
  };
  return map[type] ?? type;
}
