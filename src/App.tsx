import React, { useState } from 'react';
import { GridExample } from './components/GridExample';
import { FixedGridExample } from './components/FixedGridExample';
import { SimpleGridTest } from './components/SimpleGridTest';
import './App.css';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('admin');
  const [gridType, setGridType] = useState<'simple' | 'fixed' | 'original'>('fixed');

  return (
    <div className="App">
      <header className="app-header">
        <h1>ag-Grid State Management System</h1>
        <p>Extensible React state management for ag-Grid with mode-based configurations</p>
        
        <div className="user-controls">
          <label htmlFor="role-select">User Role:</label>
          <select 
            id="role-select"
            value={userRole} 
            onChange={(e) => setUserRole(e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          
          <label style={{ marginLeft: '20px' }}>Grid Type:</label>
          <select 
            value={gridType} 
            onChange={(e) => setGridType(e.target.value as any)}
            style={{ marginLeft: '10px' }}
          >
            <option value="simple">Simple Test Grid</option>
            <option value="fixed">Fixed Grid Example</option>
            <option value="original">Original Grid Example</option>
          </select>
        </div>
      </header>

      <main className="app-main">
        {gridType === 'simple' && <SimpleGridTest />}
        {gridType === 'fixed' && <FixedGridExample />}
        {gridType === 'original' && <GridExample />}
      </main>

      <footer className="app-footer">
        <p>
          <strong>Features:</strong> Mode-based columns • Async handlers • Loading states • Error handling • Role permissions
        </p>
      </footer>
    </div>
  );
};

export default App;