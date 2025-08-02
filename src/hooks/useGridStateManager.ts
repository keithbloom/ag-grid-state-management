import { useReducer, useRef, useCallback } from 'react';
import { 
  GridRowData, 
  AsyncColumnHandler, 
  ColumnConfig, 
  ModeConfig, 
  GridState, 
  GridAction 
} from '../types/grid';

// Reducer for state management
const gridReducer = (state: GridState, action: GridAction): GridState => {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        loading: new Set<string>(),
        errors: new Map<string, string>()
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
        errors: new Map<string, string>()
      };

    case 'REGISTER_MODE':
      const existingModes = state.availableModes.filter(mode => mode.id !== action.payload.id);
      return {
        ...state,
        availableModes: [...existingModes, action.payload]
      };

    case 'SET_AVAILABLE_MODES':
      return {
        ...state,
        availableModes: action.payload
      };

    default:
      return state;
  }
};

// Hook for managing grid state and async operations
export const useGridStateManager = (
  initialData: GridRowData[] = [],
  defaultMode: string = 'default'
) => {
  const [state, dispatch] = useReducer(gridReducer, {
    data: initialData,
    loading: new Set<string>(),
    errors: new Map<string, string>(),
    currentMode: defaultMode,
    availableModes: []
  });

  // Refs to store handlers and configs
  const handlersRef = useRef<Map<string, AsyncColumnHandler>>(new Map());
  const columnConfigsRef = useRef<Map<string, ColumnConfig>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());

  // Create stable API object once
  const apiRef = useRef<any>(null);
  
  if (!apiRef.current) {
    apiRef.current = {
      // Registration methods
      registerColumnHandler: (handler: AsyncColumnHandler) => {
        handlersRef.current.set(handler.columnId, handler);
      },

      unregisterColumnHandler: (columnId: string) => {
        handlersRef.current.delete(columnId);
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

      batchUpdateRows: (updates: Array<{ id: string; data: Partial<GridRowData> }>) => {
        dispatch({ type: 'BATCH_UPDATE', payload: { updates } });
      },

      getActiveHandlers: () => {
        const activeHandlers = new Map<string, AsyncColumnHandler>();
        handlersRef.current.forEach((handler, columnId) => {
          if (!handler.modes || handler.modes.includes(state.currentMode)) {
            activeHandlers.set(columnId, handler);
          }
        });
        return activeHandlers;
      },

      getColumnDefsForMode: () => {
        const currentModeConfig = state.availableModes.find(mode => mode.id === state.currentMode);
        const activeColumns = currentModeConfig?.columns || [];
        
        return Array.from(columnConfigsRef.current.values())
          .filter(config => {
            const modeMatch = !config.modes || config.modes.includes(state.currentMode);
            const inActiveColumns = activeColumns.length === 0 || activeColumns.includes(config.field);
            return modeMatch && inActiveColumns;
          })
          .map(config => {
            const modeOverrides = config.modeSpecificProps?.[state.currentMode] || {};
            const modeDefaults = currentModeConfig?.defaultColumnProps || {};
            
            return {
              ...modeDefaults,
              ...config,
              ...modeOverrides
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
          if (!handler.modes || handler.modes.includes(state.currentMode)) {
            activeHandlers.set(handlerColumnId, handler);
          }
        });

        const handler = activeHandlers.get(columnId);
        if (!handler) return;

        try {
          processingRef.current.add(processingKey);
          dispatch({ type: 'SET_LOADING', payload: { id: rowId, loading: true } });
          dispatch({ type: 'SET_ERROR', payload: { id: rowId } });

          const currentRow = state.data.find(row => row.id === rowId);
          if (!currentRow) return;

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

        dispatch({ 
          type: 'UPDATE_ROW', 
          payload: { 
            id: data.id, 
            updates: { [colDef.field]: newValue } 
          } 
        });

        const handler = handlersRef.current.get(colDef.field);
        if (handler && (!handler.modes || handler.modes.includes(state.currentMode))) {
          apiRef.current.processAsyncUpdate(data.id, colDef.field, newValue);
        }
      }
    };
  }

  // Update the current mode in the API methods that need it
  apiRef.current.currentMode = state.currentMode;

  // Return the stable API object with current state
  return {
    ...apiRef.current,
    data: state.data,
    loading: state.loading,
    errors: state.errors,
    currentMode: state.currentMode,
    availableModes: state.availableModes,
    triggerAsyncUpdate: apiRef.current.processAsyncUpdate
  };
};