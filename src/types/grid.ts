export interface GridRowData {
    id: string;
    [key: string]: any;
  }
  
  export interface AsyncColumnHandler {
    columnId: string;
    handler: (rowData: GridRowData, newValue: any) => Promise<Partial<GridRowData>>;
    dependencies?: string[]; // Other columns that should trigger this handler
    modes?: string[]; // Specific modes where this handler is active (undefined = all modes)
  }
  
  export interface ColumnConfig {
    field: string;
    headerName: string;
    editable?: boolean;
    hide?: boolean;
    cellRenderer?: (params: any) => any;
    valueFormatter?: (params: any) => any;
    sortable?: boolean;
    filter?: boolean;
    modes?: string[]; // Modes where this column should be visible
    modeSpecificProps?: Record<string, Partial<ColumnConfig>>; // Mode-specific overrides
  }
  
  export interface ModeConfig {
    id: string;
    name: string;
    columns: string[]; // Column fields active in this mode
    defaultColumnProps?: Partial<ColumnConfig>; // Default props for columns in this mode
  }
  
  export interface GridState {
    data: GridRowData[];
    loading: Set<string>; // row IDs currently being processed
    errors: Map<string, string>; // row ID -> error message
    currentMode: string;
    availableModes: ModeConfig[];
  }
  
  export type GridAction = 
    | { type: 'SET_DATA'; payload: GridRowData[] }
    | { type: 'UPDATE_ROW'; payload: { id: string; updates: Partial<GridRowData> } }
    | { type: 'SET_LOADING'; payload: { id: string; loading: boolean } }
    | { type: 'SET_ERROR'; payload: { id: string; error?: string } }
    | { type: 'BATCH_UPDATE'; payload: { updates: Array<{ id: string; data: Partial<GridRowData> }> } }
    | { type: 'SET_MODE'; payload: string }
    | { type: 'REGISTER_MODE'; payload: ModeConfig }
    | { type: 'SET_AVAILABLE_MODES'; payload: ModeConfig[] };