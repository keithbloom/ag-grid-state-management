// Base action interface
interface BaseAction<T extends string, P = any> {
    type: T;
    payload: P;
  }
  
  // Extended action interface with metadata for async middleware
  interface AsyncAction<T extends string, P = any, M = any> extends BaseAction<T, P> {
    meta: M;
  }
  
  // Extract all possible actions from action creators object
  type ActionsFromCreators<T extends Record<string, (...args: any[]) => any>> = {
    [K in keyof T]: ReturnType<T[K]>
  }[keyof T];
  
  // Type guard to check if action is async
  function isAsyncAction(
    action: BaseAction<any, any> | AsyncAction<any, any, any>
  ): action is AsyncAction<any, any, any> {
    return 'meta' in action;
  }
  
  // Helper function to create action creators with type safety
  function createActionCreators<T extends Record<string, (...args: any[]) => any>>(
    creators: T
  ): T {
    return creators;
  }
  
  // Example action creators using the functional approach
  const actionCreators = createActionCreators({
    // Synchronous actions
    setUser: (payload: { id: string; name: string; email: string }) => 
      ({ type: 'SET_USER' as const, payload }),
    
    clearUser: () => 
      ({ type: 'CLEAR_USER' as const, payload: undefined as void }),
    
    updateName: (payload: string) => 
      ({ type: 'UPDATE_NAME' as const, payload }),
    
    setLoading: (payload: boolean) => 
      ({ type: 'SET_LOADING' as const, payload }),
    
    setError: (payload: string | null) => 
      ({ type: 'SET_ERROR' as const, payload }),
    
    // Asynchronous actions with custom metadata
    fetchUser: (payload: { id: string }) => ({
      type: 'FETCH_USER' as const,
      payload,
      meta: { 
        async: true as const,
        endpoint: '/api/user' as const,
        method: 'GET' as const
      }
    }),
    
    saveUser: (payload: { id: string; name: string; email: string }) => ({
      type: 'SAVE_USER' as const,
      payload,
      meta: { 
        async: true as const,
        endpoint: '/api/user' as const,
        method: 'POST' as const,
        optimistic: true as const
      }
    }),
    
    deleteUser: (payload: { id: string }) => ({
      type: 'DELETE_USER' as const,
      payload,
      meta: { 
        async: true as const,
        thunk: true as const
      }
    }),
    
    refreshData: () => ({
      type: 'REFRESH_DATA' as const,
      payload: undefined as void,
      meta: { 
        async: true as const,
        saga: true as const
      }
    }),
    
    uploadFile: (payload: { file: File; path: string }) => ({
      type: 'UPLOAD_FILE' as const,
      payload,
      meta: { 
        async: true as const,
        promise: true as const
      }
    }),
    
    fetchUserList: (payload: { page: number; limit: number }) => ({
      type: 'FETCH_USER_LIST' as const,
      payload,
      meta: {
        async: true as const,
        endpoint: '/api/users' as const,
        method: 'GET' as const,
        cache: true as const,
        cacheKey: 'user-list' as const
      }
    }),
    
    submitForm: (payload: { formData: Record<string, any> }) => ({
      type: 'SUBMIT_FORM' as const,
      payload,
      meta: { 
        async: true as const,
        endpoint: '/api/submit' as const,
        method: 'POST' as const,
        successMessage: 'Form submitted successfully!' as const,
        errorMessage: 'Failed to submit form' as const
      }
    }),
  }) as const;
  
  // Generate the union type of all possible actions
  type AppAction = ActionsFromCreators<typeof actionCreators>;
  
  // Separate sync and async actions using conditional types
  type SyncActions = AppAction extends infer U 
    ? U extends { meta: any } 
      ? never 
      : U 
    : never;
  
  type AsyncActions = AppAction extends infer U 
    ? U extends { meta: any } 
      ? U 
      : never 
    : never;
  
  // Define your state type
  interface AppState {
    user: { id: string; name: string; email: string } | null;
    userList: Array<{ id: string; name: string; email: string }>;
    loading: boolean;
    error: string | null;
  }
  
  // Create your reducer - handles only synchronous actions
  function appReducer(state: AppState, action: SyncActions): AppState {
    switch (action.type) {
      case 'SET_USER':
        return {
          ...state,
          user: action.payload,
          error: null
        };
      
      case 'CLEAR_USER':
        return {
          ...state,
          user: null
        };
      
      case 'UPDATE_NAME':
        return {
          ...state,
          user: state.user ? { ...state.user, name: action.payload } : null
        };
      
      case 'SET_LOADING':
        return {
          ...state,
          loading: action.payload
        };
      
      case 'SET_ERROR':
        return {
          ...state,
          error: action.payload
        };
      
      default:
        return state;
    }
  }
  
  // Async middleware type
  type AsyncMiddleware = (
    action: AsyncActions,
    dispatch: (action: SyncActions) => void,
    getState: () => AppState
  ) => Promise<void> | void;
  
  // Async middleware implementation with proper type narrowing
  const asyncMiddleware: AsyncMiddleware = async (action, dispatch, getState) => {
    if (isAsyncAction(action)) {
      dispatch(actionCreators.setLoading(true));
      dispatch(actionCreators.setError(null));
      
      try {
        // Use type assertions based on the discriminated union
        switch (action.type) {
          case 'FETCH_USER': {
            const fetchAction = action as Extract<AsyncActions, { type: 'FETCH_USER' }>;
            const response = await fetch(`${fetchAction.meta.endpoint}/${fetchAction.payload.id}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            const user = await response.json();
            dispatch(actionCreators.setUser(user));
            break;
          }
          
          case 'SAVE_USER': {
//            const saveAction = action as Extract<AsyncActions, { type: 'SAVE_USER' }>;
            if (action.meta.optimistic) {
              dispatch(actionCreators.setUser(action.payload));
            }
            
            const response = await fetch(saveAction.meta.endpoint, {
              method: saveAction.meta.method,
              body: JSON.stringify(saveAction.payload),
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
              if (saveAction.meta.optimistic) {
                // Revert optimistic update on failure
                const currentState = getState();
                // You might want to restore previous state here
              }
              throw new Error('Failed to save user');
            }
            break;
          }
          
          case 'DELETE_USER': {
            const deleteAction = action as Extract<AsyncActions, { type: 'DELETE_USER' }>;
            const response = await fetch(`/api/user/${deleteAction.payload.id}`, { 
              method: 'DELETE' 
            });
            if (!response.ok) throw new Error('Failed to delete user');
            dispatch(actionCreators.clearUser());
            break;
          }
          
          case 'REFRESH_DATA': {
            const refreshAction = action as Extract<AsyncActions, { type: 'REFRESH_DATA' }>;
            console.log('Saga action dispatched:', refreshAction);
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
          
          case 'UPLOAD_FILE': {
            const uploadAction = action as Extract<AsyncActions, { type: 'UPLOAD_FILE' }>;
            const formData = new FormData();
            formData.append('file', uploadAction.payload.file);
            const response = await fetch(`/api/upload/${uploadAction.payload.path}`, {
              method: 'POST',
              body: formData
            });
            if (!response.ok) throw new Error('Failed to upload file');
            break;
          }
          
          case 'FETCH_USER_LIST': {
            const fetchListAction = action as Extract<AsyncActions, { type: 'FETCH_USER_LIST' }>;
            const { page, limit } = fetchListAction.payload;
            const response = await fetch(
              `${fetchListAction.meta.endpoint}?page=${page}&limit=${limit}`
            );
            if (!response.ok) throw new Error('Failed to fetch user list');
            const users = await response.json();
            console.log('Fetched users:', users);
            break;
          }
          
          case 'SUBMIT_FORM': {
            const submitAction = action as Extract<AsyncActions, { type: 'SUBMIT_FORM' }>;
            const response = await fetch(submitAction.meta.endpoint, {
              method: submitAction.meta.method,
              body: JSON.stringify(submitAction.payload.formData),
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
              throw new Error(submitAction.meta.errorMessage);
            }
            
            console.log(submitAction.meta.successMessage);
            break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        dispatch(actionCreators.setError(errorMessage));
        console.error('Async action failed:', error);
      } finally {
        dispatch(actionCreators.setLoading(false));
      }
    }
  };
  
  // Enhanced dispatch function that handles both sync and async actions
  type EnhancedDispatch = {
    (action: SyncActions): void;
    (action: AsyncActions): void;
  };
  
  // Usage in component
  /*
  import { useReducer, useCallback } from 'react';
  
  function MyComponent() {
    const [state, baseDispatch] = useReducer(appReducer, {
      user: null,
      userList: [],
      loading: false,
      error: null
    });
  
    // Enhanced dispatch that handles async actions through middleware
    const dispatch: EnhancedDispatch = useCallback((action: SyncActions | AsyncActions) => {
      if (isAsyncAction(action)) {
        asyncMiddleware(action as AsyncActions, baseDispatch, () => state);
      } else {
        baseDispatch(action as SyncActions);
      }
    }, [state]);
  
    const handleSetUser = () => {
      dispatch(actionCreators.setUser({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      }));
    };
  
    const handleFetchUser = () => {
      dispatch(actionCreators.fetchUser({ id: '1' }));
    };
  
    const handleSaveUser = () => {
      dispatch(actionCreators.saveUser({
        id: '1',
        name: 'Jane Doe',
        email: 'jane@example.com'
      }));
    };
  
    const handleDeleteUser = () => {
      dispatch(actionCreators.deleteUser({ id: '1' }));
    };
  
    const handleUploadFile = (file: File) => {
      dispatch(actionCreators.uploadFile({ file, path: 'documents' }));
    };
  
    const handleRefreshData = () => {
      dispatch(actionCreators.refreshData());
    };
  
    const handleFetchUserList = () => {
      dispatch(actionCreators.fetchUserList({ page: 1, limit: 10 }));
    };
  
    const handleSubmitForm = (formData: Record<string, any>) => {
      dispatch(actionCreators.submitForm({ formData }));
    };
  
    return (
      <div>
        {state.loading && <div>Loading...</div>}
        {state.error && <div>Error: {state.error}</div>}
        {state.user && (
          <div>
            <h2>{state.user.name}</h2>
            <p>{state.user.email}</p>
          </div>
        )}
        <button onClick={handleFetchUser}>Fetch User</button>
        <button onClick={handleSaveUser}>Save User</button>
        <button onClick={handleDeleteUser}>Delete User</button>
        <button onClick={handleRefreshData}>Refresh Data</button>
      </div>
    );
  }
  */
  
  export {
    isAsyncAction,
    createActionCreators,
    type BaseAction,
    type AsyncAction,
    type ActionsFromCreators,
    type AsyncMiddleware,
    type EnhancedDispatch,
    type AppAction,
    type SyncActions,
    type AsyncActions,
    actionCreators,
    appReducer,
    asyncMiddleware
  };