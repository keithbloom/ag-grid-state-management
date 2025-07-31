import React, { useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { useGridStateManager } from '../hooks/useGridStateManager';
import { useInventoryModeHandlers } from '../hooks/useInventoryModeHandlers';
import { ModeSelector } from './ModeSelector';

export const GridExample: React.FC = () => {
  const gridManager = useGridStateManager([], 'editing');

  // Add inventory-specific handlers
  useInventoryModeHandlers(gridManager);

  // Setup modes and column configurations
  useEffect(() => {
    // Register different modes
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

    // Register column configurations
    const columnConfigs = [
      {
        field: 'name',
        headerName: 'Product Name',
        modes: ['editing', 'readonly', 'advanced', 'inventory']
      },
      {
        field: 'price',
        headerName: 'Price',
        modes: ['editing', 'readonly', 'advanced'],
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : '',
        modeSpecificProps: {
          'readonly': { editable: false },
          'advanced': { headerName: 'Unit Price ($)' }
        }
      },
      {
        field: 'quantity',
        headerName: 'Quantity',
        modes: ['editing', 'readonly', 'advanced']
      },
      {
        field: 'sku',
        headerName: 'SKU',
        modes: ['advanced', 'inventory'],
        editable: true
      },
      {
        field: 'discountCode',
        headerName: 'Discount Code',
        modes: ['editing', 'advanced'],
        modeSpecificProps: {
          'advanced': { headerName: 'Promo Code' }
        }
      },
      {
        field: 'total',
        headerName: 'Subtotal',
        modes: ['editing', 'readonly', 'advanced'],
        editable: false,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : ''
      },
      {
        field: 'tax',
        headerName: 'Tax',
        modes: ['editing', 'advanced'],
        editable: false,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : ''
      },
      {
        field: 'discount',
        headerName: 'Discount',
        modes: ['editing', 'advanced'],
        editable: false,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : ''
      },
      {
        field: 'grandTotal',
        headerName: 'Total',
        modes: ['editing', 'readonly', 'advanced'],
        editable: false,
        valueFormatter: (params: any) => params.value ? `$${params.value.toFixed(2)}` : ''
      },
      {
        field: 'margin',
        headerName: 'Margin %',
        modes: ['advanced'],
        editable: false,
        valueFormatter: (params: any) => params.value ? `${params.value.toFixed(1)}%` : ''
      },
      {
        field: 'supplier',
        headerName: 'Supplier',
        modes: ['advanced', 'inventory'],
        editable: false
      }
    ];

    columnConfigs.forEach(config => gridManager.registerColumnConfig(config));

  }, [gridManager]);

  // Register handlers with mode-specific behavior
  useEffect(() => {
    // Price handler - behaves differently in different modes
    gridManager.registerColumnHandler({
      columnId: 'price',
      modes: ['editing', 'advanced'], // Not active in readonly mode
      handler: async (rowData, newPrice) => {
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
      },
      dependencies: ['total', 'tax']
    });

    // Quantity handler
    gridManager.registerColumnHandler({
      columnId: 'quantity',
      modes: ['editing', 'advanced'],
      handler: async (rowData, newQuantity) => {
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
      modes: ['advanced'],
      handler: async (rowData, newSku) => {
        // Simulate API call for product details
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock API response
        const productData = {
          cost: Math.random() * 50 + 20,
          supplier: ['Supplier A', 'Supplier B', 'Supplier C'][Math.floor(Math.random() * 3)],
          category: 'Electronics'
        };
        
        return productData;
      }
    });

    // Discount handler - different behavior per mode
    gridManager.registerColumnHandler({
      columnId: 'discountCode',
      modes: ['editing', 'advanced'],
      handler: async (rowData, discountCode) => {
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

    return () => {
      gridManager.unregisterColumnHandler('price');
      gridManager.unregisterColumnHandler('quantity');
      gridManager.unregisterColumnHandler('sku');
      gridManager.unregisterColumnHandler('discountCode');
    };
  }, [gridManager]);

  // Example data
  useEffect(() => {
    gridManager.setData([
      { 
        id: '1', 
        name: 'Laptop Pro', 
        price: 1299.99, 
        quantity: 2, 
        sku: 'LTP001',
        cost: 800 
      },
      { 
        id: '2', 
        name: 'Wireless Mouse', 
        price: 49.99, 
        quantity: 1, 
        sku: 'WMS002',
        cost: 25 
      },
      { 
        id: '3', 
        name: 'USB-C Hub', 
        price: 79.99, 
        quantity: 6, 
        sku: 'UCH003',
        cost: 35 
      }
    ]);
  }, [gridManager]);

  // Loading cell renderer
  const loadingCellRenderer = (params: any) => {
    const isLoading = gridManager.loading.has(params.data.id);
    return isLoading ? '⏳ Calculating...' : params.value;
  };

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
        <div><strong>Active Columns:</strong> {gridManager.getColumnDefsForMode().map(col => col.field).join(', ')}</div>
        <div><strong>Active Handlers:</strong> {Array.from(gridManager.getActiveHandlers().keys()).join(', ')}</div>
      </div>
      
      {/* ag-Grid */}
      <div className="ag-theme-alpine grid-container">
        <AgGridReact
          rowData={gridManager.data}
          columnDefs={gridManager.getColumnDefsForMode().map(colDef => ({
            ...colDef,
            cellRenderer: ['price', 'quantity', 'total'].includes(colDef.field) 
              ? loadingCellRenderer 
              : colDef.cellRenderer
          }))}
          onCellValueChanged={gridManager.onCellValueChanged}
          defaultColDef={{
            flex: 1,
            minWidth: 100,
            resizable: true
          }}
          animateRows={true}
          enableCellChangeFlash={true}
        />
      </div>
    </div>
  );
};