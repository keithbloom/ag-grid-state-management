// src/types/grid.ts
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

// New: Parser interface
export interface ColumnParser {
  columnId: string;
  parser: (rawValue: any, rowData: GridRowData) => any;
  modes?: string[]; // Specific modes where this parser is active
}

// New: Validator interface
export interface ColumnValidator {
  columnId: string;
  validator: (value: any, rowData: GridRowData) => string | null; // null = valid, string = error message
  modes?: string[]; // Specific modes where this validator is active
}

// New: Validation result
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  parsedValue?: any;
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
  // New: Default parser/validator names
  defaultParser?: string;
  defaultValidator?: string;
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
  // New: Cell-level validation errors
  cellErrors: Map<string, string>; // "rowId-columnId" -> error message
  currentMode: string;
  availableModes: ModeConfig[];
}

export type GridAction = 
  | { type: 'SET_DATA'; payload: GridRowData[] }
  | { type: 'UPDATE_ROW'; payload: { id: string; updates: Partial<GridRowData> } }
  | { type: 'SET_LOADING'; payload: { id: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { id: string; error?: string } }
  | { type: 'SET_CELL_ERROR'; payload: { rowId: string; columnId: string; error?: string } }
  | { type: 'BATCH_UPDATE'; payload: { updates: Array<{ id: string; data: Partial<GridRowData> }> } }
  | { type: 'SET_MODE'; payload: string }
  | { type: 'REGISTER_MODE'; payload: ModeConfig }
  | { type: 'SET_AVAILABLE_MODES'; payload: ModeConfig[] };

// New: Default parsers and validators
export interface DefaultParsersValidators {
  parsers: Record<string, (value: any, rowData: GridRowData) => any>;
  validators: Record<string, (value: any, rowData: GridRowData) => string | null>;
}