import { useReducer, Dispatch, Reducer } from 'react';

// A function to handle side effects
type SideEffectHandler<State, Action> = (
  state: State,
  action: Action,
  dispatch: Dispatch<Action>
) => void;

/**
 * A custom hook that combines a reducer with a side effect handler.
 * @param reducer The reducer function.
 * @param initialState The initial state.
 * @param sideEffectHandler A function to execute side effects after a state change.
 * @returns A state and a dispatch function.
 */
export const useReducerWithSideEffects = <State, Action>(
  reducer: Reducer<State, Action>,
  initialState: State,
  sideEffectHandler: SideEffectHandler<State, Action>
): [State, Dispatch<Action>] => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Create a new dispatch function that triggers the side effect handler
  const dispatchWithSideEffects = (action: Action) => {
    // First, dispatch the action to update the state
    dispatch(action);

    // Then, call the side effect handler with the new state and the action
    // Note: The `state` here is the one from the useReducer closure, which will
    // be updated on the next render. The side effect handler can use it
    // if it needs the "previous" state, or you can pass the result of the
    // reducer if you compute it manually before dispatching. For simplicity,
    // we will rely on the next render's state.
    sideEffectHandler(state, action, dispatch);
  };

  return [state, dispatchWithSideEffects];
};

// state.ts

export interface IRow {
    id: number;
    make: string;
    model: string;
    price: number;
  }
  
  // Add isLoading and error to the state
  export interface AppState {
    rowData: IRow[];
    isLoading: boolean;
    error: string | null;
  }
  
  // Add actions for the fetch lifecycle
  export type AppAction =
    | { type: 'FETCH_ROWS' }
    | { type: 'FETCH_ROWS_SUCCESS'; payload: IRow[] }
    | { type: 'FETCH_ROWS_FAILURE'; payload: string }
    | { type: 'UPDATE_CELL'; payload: { id: number; field: string; value: any } };

// reducer.ts

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'FETCH_ROWS':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'FETCH_ROWS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        rowData: action.payload,
      };

    case 'FETCH_ROWS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ... other cases like UPDATE_CELL
    case 'UPDATE_CELL':
       // ...
       return state;

    default:
      return state;
  }
};

// sideEffects.ts
// Mock function to fetch data
const fetchRowsFromApi = async (): Promise<IRow[]> => {
  console.log('Fetching data from API...');
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
  
  // To test the error case, uncomment the line below
  // if (Math.random() > 0.5) throw new Error("Network request failed!");
  
  return [
    { id: 1, make: 'Tesla', model: 'Model Y', price: 64000 },
    { id: 2, make: 'Rivian', model: 'R1T', price: 73000 },
    { id: 3, make: 'Lucid', model: 'Air', price: 87000 },
  ];
};

// The side effect handler is now an async function
export const handleSideEffects = async (
  state: AppState,
  action: AppAction,
  dispatch: Dispatch<AppAction>
) => {
  switch (action.type) {
    case 'FETCH_ROWS':
      try {
        const rows = await fetchRowsFromApi();
        // On success, dispatch the SUCCESS action with the data
        dispatch({ type: 'FETCH_ROWS_SUCCESS', payload: rows });
      } catch (e) {
        // On failure, dispatch the FAILURE action with the error message
        dispatch({ type: 'FETCH_ROWS_FAILURE', payload: (e as Error).message });
      }
      break;
    
    // ... other cases like UPDATE_CELL
    case 'UPDATE_CELL':
      // ...
      break;
  }
};

// MyGridComponent.tsx
import React, { useMemo, useEffect } from 'react'; // Import useEffect
import { AgGridReact } from 'ag-grid-react';
// ... other imports


// Initial state now includes loading/error fields
const initialState: AppState = {
  rowData: [],
  isLoading: true, // Start in a loading state
  error: null,
};

export const MyGridComponent = () => {
  const [state, dispatch] = useReducerWithSideEffects(
    appReducer,
    initialState,
    handleSideEffects
  );

  // Trigger the data fetch when the component mounts
  useEffect(() => {
    dispatch({ type: 'FETCH_ROWS' });
  }, []); // Empty dependency array means this runs once on mount


  // Show a loading indicator
  if (state.isLoading) {
    return <div style={{ padding: '20px' }}>Loading grid data... ⏳</div>;
  }

  // Show an error message
  if (state.error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {state.error} ❌</div>;
  }

  // Render the grid when data is available
  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: 600 }}>
      <AgGridReact
        rowData={state.rowData}
        // ... other props
      />
    </div>
  );
};