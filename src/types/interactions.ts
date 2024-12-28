export type InteractionTrigger = 
  | 'Click'
  | 'Hover'
  | 'Mouse leave'
  | 'Mouse down'
  | 'Mouse up'
  | 'Key press'
  | 'After delay'
  | 'Drag'
  | 'Drag enter'
  | 'Drag leave'
  | 'Drop';

export interface FigmaAction {
  type: string;
  destinationId?: string;
  duration?: number;
  overlay?: { name: string };
}

export interface FigmaReaction {
  trigger: {
    type: InteractionTrigger;
    delay?: number;
    preventDefault?: boolean;
  };
  action: FigmaAction;
}

export interface Interaction {
  trigger: InteractionTrigger;
  action: string;
  metadata?: {
    delay?: number;
    duration?: number;
    preventDefault?: boolean;
  };
  actionMetadata?: {
    destinationId?: string;
    destination?: string;
    overlay?: string;
  };
  description?: string;
} 