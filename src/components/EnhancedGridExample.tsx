// src/components/EnhancedGridExample.tsx - FIXED INFINITE LOOP
import React, { useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';

// Import ag-Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { useEnhancedGridStateManager } from '../hooks/useEnhancedGridStateManager';
import { ModeSelector } from './ModeSelector';
import { DebugGridInfo } from './DebugGridInfo';
import { createRangeValidator, createLengthValidator } from '../utils/defaultParsersValidators';

export const EnhancedGridExample: React.FC = () => {
  const gridManager = useEnhancedGridStateManager([], 'editing');

  // Setup modes and column configurations - NO DEPENDENCIES
  useEffect(() => {
    console.log('Setting up modes and columns...');
    
    // Register all modes FIRST
    gridManager.registerMode({
      id: 'editing',
      name: 'Editing Mode',
      columns: ['name', 'price', 'quantity', 'total', 'tax', 'grandTotal'],
      defaultColumnProps: { editable: true, sortable: true }
    });

    gridManager.registerMode({
      id: 'readonly',
      name: 'Read-Only Mode',
      columns: ['name', 'price', 'quantity', 'total', 'grandTotal'],
      defaultColumnProps: { editable: false, sortable: true }
    });

    gridManager.registerMode({
      id: 'advanced',
      name: 'Advanced Mode',
      columns: ['name', 'sku', 'price', 'quantity', 'discountCode', 'total', 'tax', 'discount', 'grandTotal', 'margin', 'supplier'],
      defaultColumnProps: { editable: true, sortable: true }
    });

    gridManager.registerMode({
      id: 'inventory',
      name: 'Inventory Management',
      columns: ['sku', 'name', 'currentStock', 'reorderLevel', 'supplier', 'lastRestocked', 'status'],
      defaultColumnProps: { 
        editable: true,
        sortable: true 
      }
    });

    // Register column configurations with parsers and validators
    const columnConfigs = [
      {
        field: 'name',
        headerName: 'Product Name',
        modes: ['editing', 'readonly', 'advanced', 'inventory'],
        width: 200,
        minWidth: 150,
        editable: true,
        defaultParser: 'string',
        defaultValidator: 'required'
      },
      {
        field: 'price',
        headerName: 'Price',
        modes: ['editing', 'readonly', 'advanced'],
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : '',
        width: 120,
        minWidth: 100,
        editable: true,
        defaultParser: 'currency',
        defaultValidator: 'price',
        modeSpecificProps: {
          'readonly': { editable: false },
          'advanced': { headerName: 'Unit Price ($)' }
        }
      },
      {
        field: 'quantity',
        headerName: 'Quantity',
        modes: ['editing', 'readonly', 'advanced'],
        width: 120,
        minWidth: 100,
        editable: true,
        defaultParser: 'integer',
        defaultValidator: 'quantity',
        modeSpecificProps: {
          'readonly': { editable: false }
        }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        modes: ['advanced', 'inventory'],
        editable: true,
        width: 120,
        defaultParser: 'sku',
        defaultValidator: 'sku'
      },
      {
        field: 'discountCode',
        headerName: 'Discount Code',
        modes: ['editing', 'advanced'],
        width: 150,
        editable: true,
        defaultParser: 'string',
        modeSpecificProps: {
          'advanced': { headerName: 'Promo Code' }
        }
      },
      {
        field: 'total',
        headerName: 'Subtotal',
        modes: ['editing', 'readonly', 'advanced'],
        editable: false,
        width: 120,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : '',
        defaultValidator: 'nonNegativeNumber'
      },
      {
        field: 'tax',
        headerName: 'Tax',
        modes: ['editing', 'advanced'],
        editable: false,
        width: 100,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : '',
        defaultValidator: 'nonNegativeNumber'
      },
      {
        field: 'discount',
        headerName: 'Discount',
        modes: ['editing', 'advanced'],
        editable: false,
        width: 120,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : '',
        defaultValidator: 'nonNegativeNumber'
      },
      {
        field: 'grandTotal',
        headerName: 'Total',
        modes: ['editing', 'readonly', 'advanced'],
        editable: false,
        width: 120,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : '',
        defaultValidator: 'nonNegativeNumber'
      },
      {
        field: 'margin',
        headerName: 'Margin %',
        modes: ['advanced'],
        editable: false,
        width: 120,
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)}%` : '',
        defaultParser: 'percentage',
        defaultValidator: 'percentage'
      },
      {
        field: 'supplier',
        headerName: 'Supplier',
        modes: ['advanced', 'inventory'],
        editable: false,
        width: 150,
        defaultParser: 'string'
      },
      // Inventory-specific columns
      {
        field: 'currentStock',
        headerName: 'Current Stock',
        modes: ['inventory'],
        editable: false,
        width: 140,
        defaultParser: 'integer',
        defaultValidator: 'stockLevel',
        cellClass: (params: any) => {
          const value = params.value || 0;
          const reorderLevel = params.data.reorderLevel || 20;
          return value < reorderLevel ? 'ag-cell-low-stock' : 'ag-cell-in-stock';
        }
      },
      {
        field: 'reorderLevel',
        headerName: 'Reorder Level',
        modes: ['inventory'],
        editable: true,
        width: 140,
        defaultParser: 'integer',
        defaultValidator: 'reorderLevel'
      },
      {
        field: 'status',
        headerName: 'Status',
        modes: ['inventory'],
        editable: false,
        width: 150,
        defaultParser: 'string',
        cellClass: (params: any) => {
          const status = params.value || 'Unknown';
          return `ag-cell-status-${status.toLowerCase().replace(' ', '-')}`;
        }
      },
      {
        field: 'lastRestocked',
        headerName: 'Last Restocked',
        modes: ['inventory'],
        editable: false,
        width: 150,
        defaultParser: 'date'
      }
    ];

    columnConfigs.forEach(config => gridManager.registerColumnConfig(config));

  }, []); // NO DEPENDENCIES - only run once

  // Register custom parsers and validators - NO DEPENDENCIES
  useEffect(() => {
    console.log('Setting up custom parsers and validators...');

    // Custom parser for discount codes - normalize format
    gridManager.registerColumnParser({
      columnId: 'discountCode',
      modes: ['editing', 'advanced'],
      parser: (value: any) => {
        if (!value) return '';
        // Convert to uppercase and remove spaces
        return String(value).toUpperCase().replace(/\s/g, '');
      }
    });

    // Custom validator for discount codes
    gridManager.registerColumnValidator({
      columnId: 'discountCode',
      modes: ['editing', 'advanced'],
      validator: (value: any, rowData: any) => {
        if (!value) return null; // Optional field
        
        const code = String(value);
        if (code.length < 3) {
          return 'Discount code must be at least 3 characters';
        }
        if (code.length > 20) {
          return 'Discount code cannot exceed 20 characters';
        }
        if (!/^[A-Z0-9]+$/.test(code)) {
          return 'Discount code can only contain uppercase letters and numbers';
        }
        
        // Business logic: Check if it's a valid code format
        const validFormats = ['SAVE', 'DISC', 'PROMO', 'DEAL'];
        const hasValidPrefix = validFormats.some(prefix => code.startsWith(prefix));
        if (!hasValidPrefix) {
          return 'Discount code must start with SAVE, DISC, PROMO, or DEAL';
        }
        
        return null;
      }
    });

    // Custom validator for price with context-aware validation
    gridManager.registerColumnValidator({
      columnId: 'price',
      modes: ['editing', 'advanced'],
      validator: (value: any, rowData: any) => {
        if (value === null || value === undefined) {
          return 'Price is required';
        }
        if (typeof value !== 'number' || isNaN(value)) {
          return 'Must be a valid price';
        }
        if (value <= 0) {
          return 'Price must be greater than zero';
        }
        if (value > 50000) {
          return 'Price seems unreasonably high (max $50,000)';
        }
        
        return null;
      }
    });

    return () => {
      gridManager.unregisterColumnParser('discountCode');
      gridManager.unregisterColumnValidator('discountCode');
      gridManager.unregisterColumnValidator('price');
    };
  }, []); // NO DEPENDENCIES - only run once

  // Register ALL handlers - NO DEPENDENCIES
  useEffect(() => {
    console.log('Setting up handlers...');
    
    // Price handler with mode-specific logic
    gridManager.registerColumnHandler({
      columnId: 'price',
      modes: ['editing', 'advanced'],
      handler: async (rowData: any, newPrice: number) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const quantity = rowData.quantity || 1;
        const total = newPrice * quantity;
        
        // Basic calculation for all modes
        return {
          total,
          tax: total * 0.08,
          grandTotal: total * 1.08
        };
      }
    });

    // Quantity handler
    gridManager.registerColumnHandler({
      columnId: 'quantity',
      modes: ['editing', 'advanced'],
      handler: async (rowData: any, newQuantity: number) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const price = rowData.price || 0;
        const total = price * newQuantity;
        const tax = total * 0.08;
        
        return {
          total,
          tax,
          grandTotal: total + tax
        };
      }
    });

    return () => {
      gridManager.unregisterColumnHandler('price');
      gridManager.unregisterColumnHandler('quantity');
    };
  }, []); // NO DEPENDENCIES - only run once

  // Set initial data - NO DEPENDENCIES
  useEffect(() => {
    console.log('Setting initial data...');
    gridManager.setData([
      { 
        id: '1', 
        name: 'Laptop Pro', 
        price: 1299.99, 
        quantity: 2, 
        sku: 'LTP001',
        cost: 800,
        reorderLevel: 15,
        currentStock: 25
      },
      { 
        id: '2', 
        name: 'Wireless Mouse', 
        price: 49.99, 
        quantity: 1, 
        sku: 'WMS002',
        cost: 25,
        reorderLevel: 50,
        currentStock: 12
      },
      { 
        id: '3', 
        name: 'USB-C Hub', 
        price: 79.99, 
        quantity: 6, 
        sku: 'UCH003',
        cost: 35,
        reorderLevel: 20,
        currentStock: 45
      }
    ]);
  }, []); // NO DEPENDENCIES - only run once

  // Stabilize all ag-Grid props
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false,
    tooltipShowDelay: 100,
    tooltipHideDelay: 2000
  }), []);

  // Memoize column definitions - depend on currentMode and availableModes from state
  const columnDefs = useMemo(() => {
    console.log('Recalculating column defs for mode:', gridManager.currentMode);
    const baseDefs = gridManager.getColumnDefsForMode();
    
    console.log('Base column defs:', baseDefs.map(col => ({ field: col.field, editable: col.editable })));
    
    return baseDefs.map(colDef => ({
      ...colDef,
      cellRenderer: ['price', 'quantity', 'total', 'sku', 'reorderLevel'].includes(colDef.field) 
        ? (params: any) => {
            const isLoading = gridManager.loading.has(params.data?.id);
            return isLoading ? '⏳ Calculating...' : params.value;
          }
        : colDef.cellRenderer
    }));
  }, [gridManager.currentMode, gridManager.availableModes]); // ONLY depend on state values

  // Stabilize the cell value changed handler
  const onCellValueChanged = useCallback((params: any) => {
    console.log('Cell value changed in component:', params.colDef.field, params.newValue);
    gridManager.onCellValueChanged(params);
  }, []); // NO DEPENDENCIES - gridManager.onCellValueChanged is stable

  return (
    <div className="grid-example">
      <div className="controls">
        <ModeSelector
          currentMode={gridManager.currentMode}
          availableModes={gridManager.availableModes}
          onModeChange={gridManager.setMode}
          className="mode-selector"
        />
        
        {/* Debug info */}
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <strong>Debug:</strong> Mode: {gridManager.currentMode} | 
          Columns: {columnDefs.length} | 
          Editable Columns: {columnDefs.filter(col => col.editable).map(col => col.field).join(', ')}
        </div>
      </div>

      {/* Error display */}
      {Array.from(gridManager.errors.entries()).map(([rowId, error]) => (
        <div key={rowId} className="error-message">
          ❌ Error in row {rowId}: {error}
        </div>
      ))}

      {/* Cell validation errors summary */}
      {gridManager.cellErrors.size > 0 && (
        <div className="validation-errors">
          <h4>⚠️ Validation Errors:</h4>
          <ul>
            {Array.from(gridManager.cellErrors.entries()).map(([cellKey, error]) => {
              const [rowId, columnId] = cellKey.split('-');
              const rowData = gridManager.data.find(row => row.id === rowId);
              const itemName = rowData?.name || `Row ${rowId}`;
              return (
                <li key={cellKey}>
                  <strong>{itemName}</strong> - {columnId}: {error}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      
      {/* Current mode info */}
      <div className="mode-info">
        <div><strong>Current Mode:</strong> {gridManager.currentMode}</div>
        <div><strong>Active Columns:</strong> {columnDefs.map(col => col.field).join(', ')}</div>
        <div><strong>Editable Columns:</strong> {columnDefs.filter(col => col.editable).map(col => col.field).join(', ')}</div>
        <div><strong>Active Handlers:</strong> {Array.from(gridManager.getActiveHandlers().keys()).join(', ')}</div>
        <div><strong>Validation Errors:</strong> {gridManager.cellErrors.size}</div>
      </div>
      
      {/* ag-Grid */}
      <div className="ag-theme-quartz grid-container">
        <AgGridReact
          rowData={gridManager.data}
          columnDefs={columnDefs}
          onCellValueChanged={onCellValueChanged}
          defaultColDef={defaultColDef}
          animateRows={true}
          enableCellChangeFlash={true}
          suppressMenuHide={true}
          rowHeight={40}
          headerHeight={40}
          suppressAutoSize={false}
          suppressColumnVirtualisation={true}
          tooltipShowDelay={100}
          tooltipHideDelay={2000}
          // Force re-render when mode changes
          key={`grid-${gridManager.currentMode}`}
        />
      </div>
      
      {/* Debug component */}
      <DebugGridInfo gridManager={gridManager} columnDefs={columnDefs} />
    </div>
  );
};