import React, { useState } from 'react';
import { EnhancedGridExample } from './components/EnhancedGridExample';
import { SimpleEnhancedTest } from './components/SimpleEnhancedTest';
import './App.css';

const App: React.FC = () => {
  const [gridType, setGridType] = useState<'simple' | 'fixed' | 'original' | 'enhanced' | 'test'>('test');

  return (
    <div className="App">
      <header className="app-header">
        <h1>ag-Grid State Management System</h1>
        <p>Extensible React state management for ag-Grid with mode-based configurations, parsers & validators</p>
        
        <div className="user-controls">
          <label style={{ marginLeft: '20px' }}>Grid Type:</label>
          <select 
            value={gridType} 
            onChange={(e) => setGridType(e.target.value as any)}
            style={{ marginLeft: '10px' }}
          >
            <option value="test">🧪 Simple Enhanced Test (Fixed)</option>
            <option value="enhanced">🚀 Enhanced Grid (with Parsers & Validators)</option>
          </select>
        </div>
      </header>

      <main className="app-main">
        {gridType === 'enhanced' && <EnhancedGridExample />}
        {gridType === 'test' && <SimpleEnhancedTest />}
      </main>

      <footer className="app-footer">
        <p>
          <strong>Features:</strong> Mode-based columns • Async handlers • Loading states • Error handling • 
          Role permissions • <strong>Input parsers • Field validators • Tooltip error display</strong>
        </p>
        {(gridType === 'enhanced' || gridType === 'test') && (
          <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
            💡 <strong>Try the Enhanced Grid:</strong> Enter invalid data (negative prices, empty required fields, 
            invalid SKU formats) to see real-time validation with tooltip error messages!
          </div>
        )}
      </footer>
    </div>
  );
};

export default App;