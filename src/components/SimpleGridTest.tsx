import React, { useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

export const SimpleGridTest: React.FC = () => {
  const [data, setData] = useState([
    { id: '1', name: 'Product A', price: 100 },
    { id: '2', name: 'Product B', price: 200 },
    { id: '3', name: 'Product C', price: 300 }
  ]);

  const columnDefs = useMemo(() => [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'price', headerName: 'Price', width: 150, editable: true }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true
  }), []);

  const onCellValueChanged = useCallback((params: any) => {
    console.log('Cell value changed:', params);
    // Simple update without complex state management
    setData(prevData => 
      prevData.map(row => 
        row.id === params.data.id 
          ? { ...row, [params.colDef.field]: params.newValue }
          : row
      )
    );
  }, []);

  return (
    <div style={{ height: 400, width: '100%' }}>
      <h3>Simple Grid Test</h3>
      <div className="ag-theme-quartz" style={{ height: 300, width: '100%' }}>
        <AgGridReact
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellValueChanged={onCellValueChanged}
        />
      </div>
    </div>
  );
};