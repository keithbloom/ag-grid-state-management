import React, { useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';

// Import ag-Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { useSimplifiedGridManager } from '../hooks/useSimplifiedGridManager';
import { ModeSelector } from './ModeSelector';

export const FixedGridExample: React.FC = () => {
  const gridManager = useSimplifiedGridManager([], 'editing');

  // Setup modes and column configurations - ONLY ONCE
  useEffect(() => {
    console.log('Setting up modes and columns...');
    
    // Register all modes
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

    // Register ALL column configurations
    const columnConfigs = [
      {
        field: 'name',
        headerName: 'Product Name',
        modes: ['editing', 'readonly', 'advanced', 'inventory'],
        width: 200,
        minWidth: 150
      },
      {
        field: 'price',
        headerName: 'Price',
        modes: ['editing', 'readonly', 'advanced'],
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(2)}` : '',
        width: 120,
        minWidth: 100,
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
        minWidth: 100
      },
      {
        field: 'sku',
        headerName: 'SKU',
        modes: ['advanced', 'inventory'],
        editable: true,
        width: 120
      },
      {
        field: 'discountCode',
        headerName: 'Discount Code',
        modes: ['editing', 'advanced'],
        width: 150,
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
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(2)}` : ''
      },
      {
        field: 'tax',
        headerName: 'Tax',
        modes: ['editing', 'advanced'],
        editable: false,
        width: 100,
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(2)}` : ''
      },
      {
        field: 'discount',
        headerName: 'Discount',
        modes: ['editing', 'advanced'],
        editable: false,
        width: 120,
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(2)}` : ''
      },
      {
        field: 'grandTotal',
        headerName: 'Total',
        modes: ['editing', 'readonly', 'advanced'],
        editable: false,
        width: 120,
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(2)}` : ''
      },
      {
        field: 'margin',
        headerName: 'Margin %',
        modes: ['advanced'],
        editable: false,
        width: 120,
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)}%` : ''
      },
      {
        field: 'supplier',
        headerName: 'Supplier',
        modes: ['advanced', 'inventory'],
        editable: false,
        width: 150
      },
      // Inventory-specific columns
      {
        field: 'currentStock',
        headerName: 'Current Stock',
        modes: ['inventory'],
        editable: false,
        width: 140,
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
        width: 140
      },
      {
        field: 'status',
        headerName: 'Status',
        modes: ['inventory'],
        editable: false,
        width: 150,
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
        width: 150
      }
    ];

    columnConfigs.forEach(config => gridManager.registerColumnConfig(config));

  }, []); // Empty dependency array - only run once

  // Register ALL handlers - ONLY ONCE
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
        
        // Advanced mode includes margin calculation
        if (gridManager.currentMode === 'advanced') {
          const cost = rowData.cost || newPrice * 0.6; // Assume 40% margin if cost unknown
          const margin = ((newPrice - cost) / newPrice) * 100;
          
          return {
            total,
            tax: total * 0.08,
            grandTotal: total * 1.08,
            margin: Math.round(margin * 100) / 100
          };
        }
        
        // Basic calculation for editing mode
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

    // SKU handler - only active in advanced mode
    gridManager.registerColumnHandler({
      columnId: 'sku',
      modes: ['advanced', 'inventory'],
      handler: async (rowData: any, newSku: string) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (gridManager.currentMode === 'inventory') {
          // Inventory mode - stock data
          const stockData = {
            currentStock: Math.floor(Math.random() * 100) + 10,
            lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            supplier: ['Supplier A', 'Supplier B', 'Supplier C'][Math.floor(Math.random() * 3)]
          };
          
          const status = stockData.currentStock < (rowData.reorderLevel || 20) ? 'Low Stock' : 'In Stock';
          
          return {
            ...stockData,
            status
          };
        } else {
          // Advanced mode - product data
          return {
            cost: Math.random() * 50 + 20,
            supplier: ['Supplier A', 'Supplier B', 'Supplier C'][Math.floor(Math.random() * 3)],
            category: 'Electronics'
          };
        }
      }
    });

    // Discount handler - different behavior per mode
    gridManager.registerColumnHandler({
      columnId: 'discountCode',
      modes: ['editing', 'advanced'],
      handler: async (rowData: any, discountCode: string) => {
        if (!discountCode) return { discount: 0 };
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Advanced mode has more sophisticated discount logic
        if (gridManager.currentMode === 'advanced') {
          const baseDiscount = rowData.total * 0.1; // 10% base
          const volumeBonus = rowData.quantity > 5 ? rowData.total * 0.05 : 0; // 5% volume bonus
          const discount = baseDiscount + volumeBonus;
          
          return {
            discount,
            grandTotal: (rowData.total || 0) + (rowData.tax || 0) - discount
          };
        }
        
        // Simple discount for editing mode
        const discount = rowData.total * 0.05; // 5% simple discount
        return {
          discount,
          grandTotal: (rowData.total || 0) + (rowData.tax || 0) - discount
        };
      }
    });

    // Reorder level handler - inventory mode specific
    gridManager.registerColumnHandler({
      columnId: 'reorderLevel',
      modes: ['inventory'],
      handler: async (rowData: any, newLevel: number) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const currentStock = rowData.currentStock || 0;
        let status = currentStock < newLevel ? 'Low Stock' : 'In Stock';
        let updates: any = { status };
        
        // In inventory mode, trigger automatic reorder if critically low
        if (currentStock < newLevel * 0.5) {
          console.log(`Auto-reordering ${rowData.sku}: ${newLevel * 2} units`);
          
          updates = {
            status: 'Reorder Triggered',
            lastReorderDate: new Date().toISOString().split('T')[0],
            pendingOrder: newLevel * 2
          };
        }
        
        return updates;
      }
    });

    return () => {
      gridManager.unregisterColumnHandler('price');
      gridManager.unregisterColumnHandler('quantity');
      gridManager.unregisterColumnHandler('sku');
      gridManager.unregisterColumnHandler('discountCode');
      gridManager.unregisterColumnHandler('reorderLevel');
    };
  }, []); // Empty dependency array - only run once

  // Set initial data - ONLY ONCE
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
  }, []); // Empty dependency array - only run once

  // Stabilize all ag-Grid props
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false
  }), []);

  // Memoize column definitions
  const columnDefs = useMemo(() => {
    const baseDefs = gridManager.getColumnDefsForMode();
    
    return baseDefs.map(colDef => ({
      ...colDef,
      cellRenderer: ['price', 'quantity', 'total', 'sku', 'reorderLevel'].includes(colDef.field) 
        ? (params: any) => {
            const isLoading = gridManager.loading.has(params.data?.id);
            return isLoading ? '⏳ Calculating...' : params.value;
          }
        : colDef.cellRenderer
    }));
  }, [gridManager.currentMode, gridManager.availableModes, gridManager.loading]);

  // Stabilize the cell value changed handler
  const onCellValueChanged = useCallback((params: any) => {
    gridManager.onCellValueChanged(params);
  }, [gridManager.onCellValueChanged]);

  return (
    <div className="grid-example">
      <div className="controls">
        <ModeSelector
          currentMode={gridManager.currentMode}
          availableModes={gridManager.availableModes}
          onModeChange={gridManager.setMode}
          className="mode-selector"
        />
      </div>

      {/* Error display */}
      {Array.from(gridManager.errors.entries()).map(([rowId, error]) => (
        <div key={rowId} className="error-message">
          ❌ Error in row {rowId}: {error}
        </div>
      ))}
      
      {/* Current mode info */}
      <div className="mode-info">
        <div><strong>Current Mode:</strong> {gridManager.currentMode}</div>
        <div><strong>Active Columns:</strong> {columnDefs.map(col => col.field).join(', ')}</div>
        <div><strong>Active Handlers:</strong> {Array.from(gridManager.getActiveHandlers().keys()).join(', ')}</div>
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
        />
      </div>
    </div>
  );
};