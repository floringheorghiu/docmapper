export interface TriggerData {
  type: string;
  delay?: number;
  preventDefault?: boolean;
  key?: string;
  gesture?: {
    direction: 'up' | 'down' | 'left' | 'right';
    distance: number;
  };
}

export interface ActionData {
  type: string;
  destinationId?: string;
  destination?: string;
  navigation?: string;
  overlay?: string;
  transition?: {
    type: string;
    duration: number;
    easing: string;
  };
}

export interface ScreenContext {
  screenId: string;
  screenName: string;
  elementId: string;
  elementName: string;
  parentPath: string[];
}

export interface InteractionData {
  nodeId?: string;
  nodeName: string;
  elementName: string;
  trigger: string;
  action: string;
  destination?: string;
  destinationId?: string;
  metadata?: {
    delay?: number;
    duration?: number;
    preventDefault?: boolean;
  };
  screen: ScreenContext;
}

export interface ScreenInteractions {
  screenId: string;
  screenName: string;
  interactions: InteractionData[];
  totalInteractions: number;
}