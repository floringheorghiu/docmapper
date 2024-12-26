import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  MousePointer, 
  Clock, 
  Hand, 
  ArrowRight,
  Keyboard,
  ScrollText,
  Move,
  Navigation,
  Layers,
  Play,
  ToggleLeft,
  Replace,
  Wand2
} from 'lucide-react';
import type { DocumentationItem, Interaction, ActionType, InteractionTrigger } from '../types/documentation';

const getTriggerIcon = (trigger: InteractionTrigger) => {
  switch (trigger) {
    case 'click':
      return <MousePointer className="w-4 h-4 text-blue-500" />;
    case 'hover':
      return <Hand className="w-4 h-4 text-green-500" />;
    case 'timeout':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'key':
      return <Keyboard className="w-4 h-4 text-purple-500" />;
    case 'scroll':
      return <ScrollText className="w-4 h-4 text-pink-500" />;
    case 'drag':
    case 'swipe':
      return <Move className="w-4 h-4 text-indigo-500" />;
    default:
      return null;
  }
};

const getActionIcon = (action: ActionType) => {
  switch (action) {
    case 'navigate':
      return <Navigation className="w-4 h-4 text-blue-500" />;
    case 'overlay':
      return <Layers className="w-4 h-4 text-purple-500" />;
    case 'animation':
      return <Play className="w-4 h-4 text-green-500" />;
    case 'state-change':
      return <ToggleLeft className="w-4 h-4 text-orange-500" />;
    case 'component-swap':
      return <Replace className="w-4 h-4 text-pink-500" />;
    case 'smart-animate':
      return <Wand2 className="w-4 h-4 text-indigo-500" />;
    default:
      return null;
  }
};

const InteractionDetail = ({ interaction }: { interaction: Interaction }) => {
  const [showMetadata, setShowMetadata] = useState(false);

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2 mb-1">
        {getTriggerIcon(interaction.trigger)}
        <ArrowRight className="w-3 h-3 text-gray-400" />
        {getActionIcon(interaction.action)}
        <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {interaction.description || `${interaction.trigger} → ${interaction.action}`}
        </code>
        {(interaction.metadata || interaction.actionMetadata) && (
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showMetadata ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {showMetadata && (
        <div className="ml-6 mt-2 text-xs">
          {interaction.metadata && (
            <div className="mb-2">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trigger Details:
              </div>
              <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {JSON.stringify(interaction.metadata, null, 2)}
              </pre>
            </div>
          )}
          {interaction.actionMetadata && (
            <div>
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action Details:
              </div>
              <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {JSON.stringify(interaction.actionMetadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export function DocumentationItem({ 
  name, 
  type, 
  interactions,
  path,
  constraints,
  isComponent,
  componentProperties
}: DocumentationItem) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 
                   dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? 
            <ChevronDown className="w-4 h-4 text-gray-500" /> : 
            <ChevronRight className="w-4 h-4 text-gray-500" />
          }
          <span className="font-medium text-gray-900 dark:text-white">{name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">({type})</span>
          {isComponent && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 
                           dark:text-purple-200 px-2 py-0.5 rounded">
              Component
            </span>
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
          {path && (
            <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Path: {path.join(' → ')}
            </div>
          )}
          
          {constraints && (
            <div className="mb-3 text-xs">
              <span className="text-gray-500 dark:text-gray-400">Constraints: </span>
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                {constraints.horizontal} / {constraints.vertical}
              </code>
            </div>
          )}

          <div className="space-y-4">
            {interactions.map((interaction, index) => (
              <InteractionDetail key={index} interaction={interaction} />
            ))}
          </div>

          {componentProperties && Object.keys(componentProperties).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Component Properties:
              </div>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                {JSON.stringify(componentProperties, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}