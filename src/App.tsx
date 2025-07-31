import React, { useState } from 'react';
import { GridExample } from './components/GridExample';
import './App.css';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<string>('admin');

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
        </div>
      </header>

      <main className="app-main">
        <GridExample key={userRole} />
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