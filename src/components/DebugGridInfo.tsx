// src/components/DebugGridInfo.tsx
import React from 'react';

interface DebugGridInfoProps {
  gridManager: any;
  columnDefs: any[];
}

export const DebugGridInfo: React.FC<DebugGridInfoProps> = ({ gridManager, columnDefs }) => {
  const [showDebug, setShowDebug] = React.useState(false);

  if (!showDebug) {
    return (
      <button 
        onClick={() => setShowDebug(true)}
        style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          padding: '5px 10px',
          fontSize: '12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Show Debug Info
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>Grid Debug Info</strong>
        <button onClick={() => setShowDebug(false)} style={{ cursor: 'pointer' }}>✕</button>
      </div>
      
      <div><strong>Current Mode:</strong> {gridManager.currentMode}</div>
      <div><strong>Available Modes:</strong> {gridManager.availableModes.map((m: any) => m.id).join(', ')}</div>
      <div><strong>Data Rows:</strong> {gridManager.data.length}</div>
      <div><strong>Column Defs:</strong> {columnDefs.length}</div>
      <div><strong>Loading:</strong> {gridManager.loading.size}</div>
      <div><strong>Errors:</strong> {gridManager.errors.size}</div>
      <div><strong>Cell Errors:</strong> {gridManager.cellErrors.size}</div>
      
      <hr style={{ margin: '10px 0' }} />
      
      <div><strong>Active Columns:</strong></div>
      <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
        {columnDefs.map((col: any) => (
          <li key={col.field}>
            <strong>{col.field}</strong>: 
            editable={String(col.editable)}, 
            width={col.width}
            {col.modes && `, modes=[${col.modes.join(',')}]`}
          </li>
        ))}
      </ul>

      <hr style={{ margin: '10px 0' }} />
      
      <div><strong>Mode Config:</strong></div>
      {gridManager.availableModes.find((m: any) => m.id === gridManager.currentMode) && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '5px', borderRadius: '3px' }}>
          <div>Name: {gridManager.availableModes.find((m: any) => m.id === gridManager.currentMode)?.name}</div>
          <div>Columns: {gridManager.availableModes.find((m: any) => m.id === gridManager.currentMode)?.columns?.join(', ')}</div>
          <div>Default Props: {JSON.stringify(gridManager.availableModes.find((m: any) => m.id === gridManager.currentMode)?.defaultColumnProps || {})}</div>
        </div>
      )}

      {gridManager.cellErrors.size > 0 && (
        <>
          <hr style={{ margin: '10px 0' }} />
          <div><strong>Cell Errors:</strong></div>
          <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
            {Array.from(gridManager.cellErrors.entries()).map(([key, error]: [string, string]) => (
              <li key={key} style={{ color: 'red' }}>
                {key}: {error}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};