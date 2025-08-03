// src/hooks/useEnhancedGridStateManager.ts - FIXED INFINITE LOOP
import { useReducer, useRef, useCallback } from 'react';
import { 
  GridRowData, 
  AsyncColumnHandler, 
  ColumnConfig, 
  ModeConfig, 
  GridState, 
  GridAction,
  ColumnParser,
  ColumnValidator,
  ValidationResult
} from '../types/grid';
import { defaultParsersValidators } from '../utils/defaultParsersValidators';

// Enhanced reducer with cell-level errors
const gridReducer = (state: GridState, action: GridAction): GridState => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        loading: new Set<string>(),
        errors: new Map<string, string>(),
        cellErrors: new Map<string, string>()
      };

    case 'UPDATE_ROW':
      return {
        ...state,
        data: state.data.map(row => 
          row.id === action.payload.id 
            ? { ...row, ...action.payload.updates }
            : row
        )
      };

    case 'SET_LOADING':
      const newLoading = new Set(state.loading);
      if (action.payload.loading) {
        newLoading.add(action.payload.id);
      } else {
        newLoading.delete(action.payload.id);
      }
      return { ...state, loading: newLoading };

    case 'SET_ERROR':
      const newErrors = new Map(state.errors);
      if (action.payload.error) {
        newErrors.set(action.payload.id, action.payload.error);
      } else {
        newErrors.delete(action.payload.id);
      }
      return { ...state, errors: newErrors };

    case 'SET_CELL_ERROR':
      const cellKey = `${action.payload.rowId}-${action.payload.columnId}`;
      const newCellErrors = new Map(state.cellErrors);
      if (action.payload.error) {
        newCellErrors.set(cellKey, action.payload.error);
      } else {
        newCellErrors.delete(cellKey);
      }
      return { ...state, cellErrors: newCellErrors };

    case 'BATCH_UPDATE':
      const updatedData = [...state.data];
      action.payload.updates.forEach(({ id, data }) => {
        const index = updatedData.findIndex(row => row.id === id);
        if (index >= 0) {
          updatedData[index] = { ...updatedData[index], ...data };
        }
      });
      return { ...state, data: updatedData };

    case 'SET_MODE':
      return {
        ...state,
        currentMode: action.payload,
        loading: new Set<string>(),
        errors: new Map<string, string>(),
        cellErrors: new Map<string, string>()
      };

    case 'REGISTER_MODE':
      const existingModes = state.availableModes.filter(mode => mode.id !== action.payload.id);
      return {
        ...state,
        availableModes: [...existingModes, action.payload]
      };

    default:
      return state;
  }
};

// Enhanced hook with parsers and validators - FIXED VERSION
export const useEnhancedGridStateManager = (
  initialData: GridRowData[] = [],
  defaultMode: string = 'default'
) => {
  const [state, dispatch] = useReducer(gridReducer, {
    data: initialData,
    loading: new Set<string>(),
    errors: new Map<string, string>(),
    cellErrors: new Map<string, string>(),
    currentMode: defaultMode,
    availableModes: []
  });

  // Refs to store handlers, parsers, validators, and configs
  const handlersRef = useRef<Map<string, AsyncColumnHandler>>(new Map());
  const parsersRef = useRef<Map<string, ColumnParser>>(new Map());
  const validatorsRef = useRef<Map<string, ColumnValidator>>(new Map());
  const columnConfigsRef = useRef<Map<string, ColumnConfig>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());

  // Create the API object once and reuse it
  const apiRef = useRef<any>(null);

  if (!apiRef.current) {
    apiRef.current = {
      // Registration methods - these are stable and don't change
      registerColumnHandler: (handler: AsyncColumnHandler) => {
        handlersRef.current.set(handler.columnId, handler);
      },

      unregisterColumnHandler: (columnId: string) => {
        handlersRef.current.delete(columnId);
      },

      registerColumnParser: (parser: ColumnParser) => {
        parsersRef.current.set(parser.columnId, parser);
      },

      unregisterColumnParser: (columnId: string) => {
        parsersRef.current.delete(columnId);
      },

      registerColumnValidator: (validator: ColumnValidator) => {
        validatorsRef.current.set(validator.columnId, validator);
      },

      unregisterColumnValidator: (columnId: string) => {
        validatorsRef.current.delete(columnId);
      },

      registerColumnConfig: (config: ColumnConfig) => {
        columnConfigsRef.current.set(config.field, config);
      },

      registerMode: (modeConfig: ModeConfig) => {
        dispatch({ type: 'REGISTER_MODE', payload: modeConfig });
      },

      setMode: (modeId: string) => {
        dispatch({ type: 'SET_MODE', payload: modeId });
      },

      setData: (data: GridRowData[]) => {
        dispatch({ type: 'SET_DATA', payload: data });
      },

      // Parse and validate method
      parseAndValidate: (columnId: string, rawValue: any, rowData: GridRowData): ValidationResult => {
        const columnConfig = columnConfigsRef.current.get(columnId);
        
        // Step 1: Parse the value
        let parsedValue = rawValue;
        
        // Check for custom parser
        const customParser = parsersRef.current.get(columnId);
        if (customParser && (!customParser.modes || customParser.modes.includes(apiRef.current.currentMode))) {
          try {
            parsedValue = customParser.parser(rawValue, rowData);
          } catch (error) {
            return {
              isValid: false,
              error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        } else if (columnConfig?.defaultParser) {
          // Use default parser
          const defaultParser = defaultParsersValidators.parsers[columnConfig.defaultParser];
          if (defaultParser) {
            try {
              parsedValue = defaultParser(rawValue, rowData);
            } catch (error) {
              return {
                isValid: false,
                error: `Parse error: ${error instanceof Error ? error.message : 'Invalid format'}`
              };
            }
          }
        }

        // Step 2: Validate the parsed value
        const customValidator = validatorsRef.current.get(columnId);
        if (customValidator && (!customValidator.modes || customValidator.modes.includes(apiRef.current.currentMode))) {
          const error = customValidator.validator(parsedValue, rowData);
          if (error) {
            return { isValid: false, error, parsedValue };
          }
        } else if (columnConfig?.defaultValidator) {
          // Use default validator
          const defaultValidator = defaultParsersValidators.validators[columnConfig.defaultValidator];
          if (defaultValidator) {
            const error = defaultValidator(parsedValue, rowData);
            if (error) {
              return { isValid: false, error, parsedValue };
            }
          }
        }

        return { isValid: true, parsedValue };
      },

      getActiveHandlers: () => {
        const activeHandlers = new Map<string, AsyncColumnHandler>();
        handlersRef.current.forEach((handler, columnId) => {
          if (!handler.modes || handler.modes.includes(apiRef.current.currentMode)) {
            activeHandlers.set(columnId, handler);
          }
        });
        return activeHandlers;
      },

      getColumnDefsForMode: () => {
        const currentModeConfig = apiRef.current.availableModes.find((mode: ModeConfig) => mode.id === apiRef.current.currentMode);
        const activeColumns = currentModeConfig?.columns || [];
        
        console.log('Getting column defs for mode:', apiRef.current.currentMode, 'activeColumns:', activeColumns);
        
        return Array.from(columnConfigsRef.current.values())
          .filter(config => {
            const modeMatch = !config.modes || config.modes.includes(apiRef.current.currentMode);
            const inActiveColumns = activeColumns.length === 0 || activeColumns.includes(config.field);
            return modeMatch && inActiveColumns;
          })
          .map(config => {
            const modeOverrides = config.modeSpecificProps?.[apiRef.current.currentMode] || {};
            const modeDefaults = currentModeConfig?.defaultColumnProps || {};
            
            return {
              ...modeDefaults,
              ...config,
              ...modeOverrides,
              // Add tooltip for cell errors
              tooltipValueGetter: (params: any) => {
                const cellKey = `${params.data?.id}-${config.field}`;
                return apiRef.current.cellErrors.get(cellKey) || null;
              },
              // Custom cell class for errors
              cellClass: (params: any) => {
                const cellKey = `${params.data?.id}-${config.field}`;
                const hasError = apiRef.current.cellErrors.has(cellKey);
                const originalClass = config.cellClass;
                
                if (hasError) {
                  const baseClass = typeof originalClass === 'function' 
                    ? originalClass(params) 
                    : originalClass || '';
                  return `${baseClass} ag-cell-validation-error`.trim();
                }
                
                return typeof originalClass === 'function' ? originalClass(params) : originalClass;
              }
            };
          });
      },

      processAsyncUpdate: async (
        rowId: string, 
        columnId: string, 
        newValue: any,
        sourceColumnId?: string
      ) => {
        const processingKey = `${rowId}-${columnId}`;
        
        if (processingRef.current.has(processingKey)) {
          return;
        }

        const activeHandlers = new Map<string, AsyncColumnHandler>();
        handlersRef.current.forEach((handler, handlerColumnId) => {
          if (!handler.modes || handler.modes.includes(apiRef.current.currentMode)) {
            activeHandlers.set(handlerColumnId, handler);
          }
        });

        const handler = activeHandlers.get(columnId);
        if (!handler) return;

        try {
          processingRef.current.add(processingKey);
          dispatch({ type: 'SET_LOADING', payload: { id: rowId, loading: true } });
          dispatch({ type: 'SET_ERROR', payload: { id: rowId } });

          // FIX: Use current data from apiRef instead of stale closure
          const currentRow = apiRef.current.data.find((row: GridRowData) => row.id === rowId);
          console.log('Processing async update for row:', rowId, 'found row:', !!currentRow, 'total data length:', apiRef.current.data.length);
          
          if (!currentRow) {
            console.error('Row not found:', rowId, 'available rows:', apiRef.current.data.map((r: GridRowData) => r.id));
            return;
          }

          const updates = await handler.handler(currentRow, newValue);
          
          dispatch({ type: 'UPDATE_ROW', payload: { id: rowId, updates } });

          if (handler.dependencies) {
            const cascadePromises = handler.dependencies
              .filter(depColumnId => depColumnId !== sourceColumnId)
              .map(depColumnId => {
                const depHandler = activeHandlers.get(depColumnId);
                if (depHandler && updates[depColumnId] !== undefined) {
                  return apiRef.current.processAsyncUpdate(rowId, depColumnId, updates[depColumnId], columnId);
                }
                return null;
              })
              .filter(Boolean);

            await Promise.all(cascadePromises);
          }

        } catch (error) {
          console.error('Async update error:', error);
          dispatch({ 
            type: 'SET_ERROR', 
            payload: { 
              id: rowId, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          });
        } finally {
          processingRef.current.delete(processingKey);
          dispatch({ type: 'SET_LOADING', payload: { id: rowId, loading: false } });
        }
      },

      onCellValueChanged: (params: any) => {
        const { data, colDef, newValue, oldValue } = params;
        
        if (newValue === oldValue) return;

        console.log('Cell value changed:', colDef.field, 'from', oldValue, 'to', newValue);

        // Clear previous cell error
        dispatch({ 
          type: 'SET_CELL_ERROR', 
          payload: { 
            rowId: data.id, 
            columnId: colDef.field 
          } 
        });

        // Parse and validate the new value
        const validationResult = apiRef.current.parseAndValidate(colDef.field, newValue, data);
        
        if (!validationResult.isValid) {
          console.log('Validation failed:', validationResult.error);
          // Set cell error
          dispatch({ 
            type: 'SET_CELL_ERROR', 
            payload: { 
              rowId: data.id, 
              columnId: colDef.field, 
              error: validationResult.error 
            } 
          });
          return; // Don't update the value if validation failed
        }

        // Update with parsed value
        const finalValue = validationResult.parsedValue !== undefined ? validationResult.parsedValue : newValue;
        
        dispatch({ 
          type: 'UPDATE_ROW', 
          payload: { 
            id: data.id, 
            updates: { [colDef.field]: finalValue } 
          } 
        });

        // Process async handler if exists
        const handler = handlersRef.current.get(colDef.field);
        if (handler && (!handler.modes || handler.modes.includes(apiRef.current.currentMode))) {
          console.log('Triggering async update for:', colDef.field, 'with value:', finalValue);
          apiRef.current.processAsyncUpdate(data.id, colDef.field, finalValue);
        }
      }
    };
  }

  // Update current state references in the API object
  apiRef.current.currentMode = state.currentMode;
  apiRef.current.data = state.data;
  apiRef.current.loading = state.loading;
  apiRef.current.errors = state.errors;
  apiRef.current.cellErrors = state.cellErrors;
  apiRef.current.availableModes = state.availableModes;

  // Return the stable API object
  return apiRef.current;
};