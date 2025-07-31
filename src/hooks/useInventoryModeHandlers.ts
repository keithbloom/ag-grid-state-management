import { useEffect } from 'react';
import { useGridStateManager } from './useGridStateManager';

export const useInventoryModeHandlers = (
  gridManager: ReturnType<typeof useGridStateManager>
) => {
  useEffect(() => {
    // Register inventory management mode
    gridManager.registerMode({
      id: 'inventory',
      name: 'Inventory Management',
      columns: ['sku', 'name', 'currentStock', 'reorderLevel', 'supplier', 'lastRestocked', 'status'],
      defaultColumnProps: { 
        editable: true,
        sortable: true 
      }
    });

    // Stock check handler - only active in inventory mode
    gridManager.registerColumnHandler({
      columnId: 'sku',
      modes: ['inventory', 'advanced'],
      handler: async (rowData, newSku) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock inventory API response
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
      },
      dependencies: ['status'] // Status might trigger alerts
    });

    // Reorder level handler - inventory mode specific behavior
    gridManager.registerColumnHandler({
      columnId: 'reorderLevel',
      modes: ['inventory'],
      handler: async (rowData, newLevel) => {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const currentStock = rowData.currentStock || 0;
        let status = currentStock < newLevel ? 'Low Stock' : 'In Stock';
        let updates: any = { status };
        
        // In inventory mode, trigger automatic reorder if critically low
        if (currentStock < newLevel * 0.5) {
          // Simulate auto-reorder API call
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

    // Register inventory-specific column configs
    gridManager.registerColumnConfig({
      field: 'currentStock',
      headerName: 'Current Stock',
      modes: ['inventory'],
      editable: false,
      cellRenderer: (params: any) => {
        const value = params.value || 0;
        const reorderLevel = params.data.reorderLevel || 20;
        const color = value < reorderLevel ? '#ff4444' : '#44aa44';
        return `<span style="color: ${color}; font-weight: bold;">${value}</span>`;
      }
    });

    gridManager.registerColumnConfig({
      field: 'reorderLevel',
      headerName: 'Reorder Level',
      modes: ['inventory'],
      editable: true
    });

    gridManager.registerColumnConfig({
      field: 'status',
      headerName: 'Status',
      modes: ['inventory'],
      editable: false,
      cellRenderer: (params: any) => {
        const status = params.value || 'Unknown';
        const colors = {
          'In Stock': '#44aa44',
          'Low Stock': '#ff8800',
          'Reorder Triggered': '#ff4444',
          'Unknown': '#888888'
        };
        const color = colors[status as keyof typeof colors] || '#888888';
        return `<span style="color: ${color}; font-weight: bold;">● ${status}</span>`;
      }
    });

    gridManager.registerColumnConfig({
      field: 'lastRestocked',
      headerName: 'Last Restocked',
      modes: ['inventory'],
      editable: false
    });

    return () => {
      gridManager.unregisterColumnHandler('sku');
      gridManager.unregisterColumnHandler('reorderLevel');
    };
  }, [gridManager]);
};