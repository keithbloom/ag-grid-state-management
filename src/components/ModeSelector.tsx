import React from 'react';
import { ModeConfig } from '../types/grid';

interface ModeSelectorProps {
  currentMode: string;
  availableModes: ModeConfig[];
  onModeChange: (modeId: string) => void;
  className?: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  availableModes,
  onModeChange,
  className = ''
}) => {
  return (
    <div className={`mode-selector ${className}`}>
      <label htmlFor="mode-select" className="mode-label">
        Current Mode:
      </label>
      <select 
        id="mode-select"
        value={currentMode} 
        onChange={(e) => onModeChange(e.target.value)}
        className="mode-dropdown"
      >
        {availableModes.map(mode => (
          <option key={mode.id} value={mode.id}>
            {mode.name}
          </option>
        ))}
      </select>
      
      <div className="mode-info">
        <small>
          Active columns: {availableModes
            .find(mode => mode.id === currentMode)?.columns
            .join(', ') || 'None'}
        </small>
      </div>
    </div>
  );
};