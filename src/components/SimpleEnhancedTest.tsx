// src/components/SimpleEnhancedTest.tsx - Simple test to verify no infinite loop
import React, { useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { useEnhancedGridStateManager } from '../hooks/useEnhancedGridStateManager';

export const SimpleEnhancedTest: React.FC = () => {
  const gridManager = useEnhancedGridStateManager([], 'editing');

  // Setup - only runs once
  useEffect(() => {
    console.log('🔧 Setting up modes and configs...');
    
    // Register mode
    gridManager.registerMode({
      id: 'editing',
      name: 'Editing Mode',
      columns: ['name', 'price'],
      defaultColumnProps: { editable: true, sortable: true }
    });

    // Register columns
    gridManager.registerColumnConfig({
      field: 'name',
      headerName: 'Product Name',
      width: 200,
      editable: true,
      defaultParser: 'string',
      defaultValidator: 'required'
    });

    gridManager.registerColumnConfig({
      field: 'price',
      headerName: 'Price',
      width: 120,
      editable: true,
      defaultParser: 'currency',
      defaultValidator: 'price'
    });

    // Register a simple async handler for price
    gridManager.registerColumnHandler({
      columnId: 'price',
      handler: async (rowData: any, newPrice: number) => {
        console.log('💰 Price handler triggered!', { rowData, newPrice });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple calculation
        const tax = newPrice * 0.1;
        const total = newPrice + tax;
        
        console.log('💰 Price handler completing with:', { tax, total });
        return { tax, total };
      }
    });

    // Set data
    gridManager.setData([
      { id: '1', name: 'Test Product', price: 99.99, tax: 10.00, total: 109.99 }
    ]);

    console.log('✅ Setup complete, data length:', gridManager.data?.length || 0);
  }, []); // Empty dependency array

  // Column definitions
  const columnDefs = useMemo(() => {
    console.log('🔄 Recalculating columns for mode:', gridManager.currentMode);
    const defs = gridManager.getColumnDefsForMode();
    console.log('🔄 Got column defs:', defs.map(d => ({ field: d.field, editable: d.editable })));
    return defs;
  }, [gridManager.currentMode, gridManager.availableModes]);

  // Cell value changed handler
  const onCellValueChanged = useCallback((params: any) => {
    console.log('📝 Cell changed:', params.colDef.field, 'new value:', params.newValue);
    console.log('📊 Current data before change:', gridManager.data);
    gridManager.onCellValueChanged(params);
  }, []);

  // Log renders
  console.log('🎨 Rendering SimpleEnhancedTest - Mode:', gridManager.currentMode, 'Columns:', columnDefs.length, 'Data:', gridManager.data?.length || 0);

  return (
    <div style={{ height: 400, width: '100%' }}>
      <h3>Simple Enhanced Test - Async Handler Debug</h3>
      <div style={{ marginBottom: '10px', fontSize: '14px' }}>
        <strong>Debug Info:</strong>
        <div>Mode: {gridManager.currentMode}</div>
        <div>Columns: {columnDefs.length}</div>
        <div>Data Rows: {gridManager.data?.length || 0}</div>
        <div>Loading: {gridManager.loading?.size || 0}</div>
        <div>Errors: {gridManager.errors?.size || 0}</div>
        <div>Cell Errors: {gridManager.cellErrors?.size || 0}</div>
      </div>

      <p><strong>Instructions:</strong> Edit the price field to test async handlers. Check console for debug logs.</p>
      
      <div className="ag-theme-quartz" style={{ height: 250, width: '100%' }}>
        <AgGridReact
          rowData={gridManager.data}
          columnDefs={columnDefs}
          onCellValueChanged={onCellValueChanged}
          defaultColDef={{
            resizable: true,
            sortable: true
          }}
        />
      </div>

      {/* Show current data */}
      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        <strong>Current Data:</strong>
        <pre style={{ fontSize: '11px', background: '#f5f5f5', padding: '5px' }}>
          {JSON.stringify(gridManager.data, null, 2)}
        </pre>
      </div>
    </div>
  );
};