// Base action interface
interface BaseAction<T extends string, P = any> {
  type: T;
  payload: P;
}

// Action creator function type
type ActionCreator<T extends string, P = any> = (
  payload: P
) => BaseAction<T, P>;

// Extract action type from action creator
type ActionFromCreator<T extends ActionCreator<any, any>> = ReturnType<T>;

// Extract all possible actions from action creators object
type ActionsFromCreators<T extends Record<string, ActionCreator<any, any>>> = {
  [K in keyof T]: ActionFromCreator<T[K]>;
}[keyof T];

// Helper to create action creator
function createAction<T extends string>(type: T) {
  return <P = void,>(payload: P): BaseAction<T, P> => ({
    type,
    payload,
  });
}

// Helper to create action creator with no payload
function createSimpleAction<T extends string>(type: T) {
  return (): BaseAction<T, void> => ({
    type,
    payload: undefined,
  });
}

// Type guard helper for narrowing actions in reducer
function isActionOfType<T extends string, P>(
  action: BaseAction<any, any>,
  type: T
): action is BaseAction<T, P> {
  return action.type === type;
}

// Example usage:

// 1. Define your action creators
const actionCreators = {
  setUser: (payload: { id: string; name: string; email: string }) => ({
    type: "SET_USER" as const,
    payload,
  }),
  clearUser: () => ({
    type: "CLEAR_USER" as const,
    payload: undefined as void,
  }),
  updateName: (payload: string) => ({
    type: "UPDATE_NAME" as const,
    payload,
  }),
  setLoading: (payload: boolean) => ({
    type: "SET_LOADING" as const,
    payload,
  }),
  addItem: (payload: { id: string; title: string }) => ({
    type: "ADD_ITEM" as const,
    payload,
  }),
} as const;

// 2. Generate the union type of all possible actions
type AppAction = ActionsFromCreators<typeof actionCreators>;

// 3. Define your state type
interface AppState {
  user: { id: string; name: string; email: string } | null;
  loading: boolean;
  items: Array<{ id: string; title: string }>;
}

// 4. Create your reducer with full type safety
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER":
      // action.payload is automatically narrowed to { id: string; name: string; email: string }
      return {
        ...state,
        user: action.payload,
      };

    case "CLEAR_USER":
      // action.payload is automatically narrowed to void
      return {
        ...state,
        user: null,
      };

    case "UPDATE_NAME":
      // action.payload is automatically narrowed to string
      return {
        ...state,
        user: state.user ? { ...state.user, name: action.payload } : null,
      };

    case "SET_LOADING":
      // action.payload is automatically narrowed to boolean
      return {
        ...state,
        loading: action.payload,
      };

    case "ADD_ITEM":
      // action.payload is automatically narrowed to { id: string; title: string }
      return {
        ...state,
        items: [...state.items, action.payload],
      };

    default:
      // TypeScript will ensure all cases are handled
      return state;
  }
}

// 5. Usage in component
/*
  import { useReducer } from 'react';
  
  function MyComponent() {
    const [state, dispatch] = useReducer(appReducer, {
      user: null,
      loading: false,
      items: []
    });
  
    const handleSetUser = () => {
      // Full type safety - TypeScript knows the expected payload structure
      dispatch(actionCreators.setUser({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      }));
    };
  
    const handleClearUser = () => {
      dispatch(actionCreators.clearUser());
    };
  
    const handleUpdateName = () => {
      dispatch(actionCreators.updateName('Jane Doe'));
    };
  
    const handleSetLoading = () => {
      dispatch(actionCreators.setLoading(true));
    };
  
    const handleAddItem = () => {
      dispatch(actionCreators.addItem({
        id: '1',
        title: 'New Item'
      }));
    };
  
    return (
      // Your JSX here
    );
  }
  */

// Alternative approach: If you prefer a more functional style with better inference
type ActionCreators<T extends Record<string, (...args: any[]) => any>> = T;

function createActionCreators<
  T extends Record<string, ActionCreator<any, any>>
>(creators: T): T {
  return creators;
}

// Example with better type inference:
const betterActionCreators = createActionCreators({
  setUser: (payload: { id: string; name: string; email: string }) => ({
    type: "SET_USER" as const,
    payload,
  }),
  clearUser: () => ({
    type: "CLEAR_USER" as const,
    payload: undefined as void,
  }),
  updateName: (payload: string) => ({ type: "UPDATE_NAME" as const, payload }),
  setLoading: (payload: boolean) => ({ type: "SET_LOADING" as const, payload }),
  addItem: (payload: { id: string; title: string }) => ({
    type: "ADD_ITEM" as const,
    payload,
  }),
});

// Generate action type from the better approach
type BetterAppAction = ActionsFromCreators<typeof betterActionCreators>;

export {
  createAction,
  createSimpleAction,
  isActionOfType,
  createActionCreators,
  type BaseAction,
  type ActionCreator,
  type ActionFromCreator,
  type ActionsFromCreators,
  type AppAction,
  type BetterAppAction,
  actionCreators,
  betterActionCreators,
};
