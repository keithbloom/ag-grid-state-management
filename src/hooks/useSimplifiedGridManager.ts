import { useState, useCallback, useMemo, useRef } from 'react';
import { GridRowData, AsyncColumnHandler, ColumnConfig, ModeConfig } from '../types/grid';

export const useSimplifiedGridManager = (
  initialData: GridRowData[] = [],
  defaultMode: string = 'editing'
) => {
  // Simple state - no complex reducer
  const [data, setData] = useState<GridRowData[]>(initialData);
  const [currentMode, setCurrentMode] = useState(defaultMode);
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [availableModes, setAvailableModes] = useState<ModeConfig[]>([]);

  // Refs for handlers and configs - these don't cause re-renders
  const handlersRef = useRef<Map<string, AsyncColumnHandler>>(new Map());
  const columnConfigsRef = useRef<Map<string, ColumnConfig>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());

  // Simple, stable functions
  const registerMode = useCallback((modeConfig: ModeConfig) => {
    setAvailableModes(prev => {
      const filtered = prev.filter(mode => mode.id !== modeConfig.id);
      return [...filtered, modeConfig];
    });
  }, []);

  const registerColumnHandler = useCallback((handler: AsyncColumnHandler) => {
    handlersRef.current.set(handler.columnId, handler);
  }, []);

  const unregisterColumnHandler = useCallback((columnId: string) => {
    handlersRef.current.delete(columnId);
  }, []);

  const registerColumnConfig = useCallback((config: ColumnConfig) => {
    columnConfigsRef.current.set(config.field, config);
  }, []);

  const setMode = useCallback((modeId: string) => {
    setCurrentMode(modeId);
    setLoading(new Set()); // Clear loading
    setErrors(new Map());  // Clear errors
  }, []);

  const updateData = useCallback((newData: GridRowData[]) => {
    setData(newData);
  }, []);

  // Process async updates - simplified
  const processAsyncUpdate = useCallback(async (
    rowId: string,
    columnId: string,
    newValue: any
  ) => {
    const processingKey = `${rowId}-${columnId}`;
    
    if (processingRef.current.has(processingKey)) {
      return;
    }

    const handler = handlersRef.current.get(columnId);
    if (!handler || (handler.modes && !handler.modes.includes(currentMode))) {
      return;
    }

    try {
      processingRef.current.add(processingKey);
      
      setLoading(prev => new Set([...prev, rowId]));
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(rowId);
        return newErrors;
      });

      setData(currentData => {
        const currentRow = currentData.find(row => row.id === rowId);
        if (!currentRow) return currentData;

        // Execute handler and update
        handler.handler(currentRow, newValue).then(updates => {
          setData(prevData => 
            prevData.map(row => 
              row.id === rowId ? { ...row, ...updates } : row
            )
          );
          
          setLoading(prev => {
            const newLoading = new Set(prev);
            newLoading.delete(rowId);
            return newLoading;
          });
        }).catch(error => {
          setErrors(prev => new Map(prev).set(rowId, error.message || 'Unknown error'));
          setLoading(prev => {
            const newLoading = new Set(prev);
            newLoading.delete(rowId);
            return newLoading;
          });
        }).finally(() => {
          processingRef.current.delete(processingKey);
        });

        return currentData;
      });

    } catch (error) {
      processingRef.current.delete(processingKey);
      setLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(rowId);
        return newLoading;
      });
    }
  }, [currentMode]);

  // Cell value changed handler - stable reference
  const onCellValueChanged = useCallback((params: any) => {
    const { data: rowData, colDef, newValue, oldValue } = params;
    
    if (newValue === oldValue) return;

    // Update immediately
    setData(prevData => 
      prevData.map(row => 
        row.id === rowData.id 
          ? { ...row, [colDef.field]: newValue }
          : row
      )
    );

    // Process async if handler exists
    if (handlersRef.current.has(colDef.field)) {
      processAsyncUpdate(rowData.id, colDef.field, newValue);
    }
  }, [processAsyncUpdate]);

  // Get column definitions - memoized properly
  const getColumnDefsForMode = useCallback(() => {
    const currentModeConfig = availableModes.find(mode => mode.id === currentMode);
    const activeColumns = currentModeConfig?.columns || [];
    
    return Array.from(columnConfigsRef.current.values())
      .filter(config => {
        const modeMatch = !config.modes || config.modes.includes(currentMode);
        const inActiveColumns = activeColumns.length === 0 || activeColumns.includes(config.field);
        return modeMatch && inActiveColumns;
      })
      .map(config => {
        const modeOverrides = config.modeSpecificProps?.[currentMode] || {};
        const modeDefaults = currentModeConfig?.defaultColumnProps || {};
        
        return {
          ...modeDefaults,
          ...config,
          ...modeOverrides
        };
      });
  }, [currentMode, availableModes]);

  const getActiveHandlers = useCallback(() => {
    const activeHandlers = new Map<string, AsyncColumnHandler>();
    handlersRef.current.forEach((handler, columnId) => {
      if (!handler.modes || handler.modes.includes(currentMode)) {
        activeHandlers.set(columnId, handler);
      }
    });
    return activeHandlers;
  }, [currentMode]);

  // Return stable object - memoized
  return useMemo(() => ({
    data,
    loading,
    errors,
    currentMode,
    availableModes,
    setData: updateData,
    setMode,
    registerMode,
    registerColumnHandler,
    unregisterColumnHandler,
    registerColumnConfig,
    getColumnDefsForMode,
    getActiveHandlers,
    onCellValueChanged,
    triggerAsyncUpdate: processAsyncUpdate
  }), [
    data,
    loading,
    errors,
    currentMode,
    availableModes,
    updateData,
    setMode,
    registerMode,
    registerColumnHandler,
    unregisterColumnHandler,
    registerColumnConfig,
    getColumnDefsForMode,
    getActiveHandlers,
    onCellValueChanged,
    processAsyncUpdate
  ]);
};