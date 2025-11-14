import React from 'react';
import { AppMode } from '@types';
import '../styles/Chat.css';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const modeConfig = {
  [AppMode.BUDDY]: {
    label: 'Buddy Mode',
    icon: '💬',
    description: 'Ask any question',
    color: '#10a37f',
  },
  [AppMode.AI_TOOL_ASSISTANT]: {
    label: 'AI Tool Assistant',
    icon: '🔧',
    description: 'Find the right AI tool',
    color: '#0084ff',
  },
  [AppMode.DEEP_RESEARCH]: {
    label: 'Deep Research',
    icon: '🔍',
    description: 'AI-powered research',
    color: '#9333ea',
  },
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
}) => {
  return (
    <div className="mode-selector">
      {Object.entries(modeConfig).map(([mode, config]) => {
        const isActive = currentMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode as AppMode)}
            className={`mode-button ${isActive ? 'active' : ''}`}
            style={{
              '--mode-color': config.color,
            } as React.CSSProperties}
          >
            <span className="mode-icon">{config.icon}</span>
            <div className="mode-info">
              <span className="mode-label">{config.label}</span>
              <span className="mode-description">{config.description}</span>
            </div>
            {isActive && <div className="mode-indicator" />}
          </button>
        );
      })}
    </div>
  );
};
