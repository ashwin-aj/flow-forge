import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { mockFlows, mockExecutions, mockApplications, mockUsers } from '../data/mockData';
import { Flow, FlowExecution, Application, User, Theme } from '../types';

interface AppState {
  flows: Flow[];
  executions: FlowExecution[];
  applications: Application[];
  users: User[];
  currentUser: User;
  theme: Theme;
}

type AppAction = 
  | { type: 'UPDATE_FLOW'; payload: Flow }
  | { type: 'ADD_FLOW'; payload: Flow }
  | { type: 'DELETE_FLOW'; payload: string }
  | { type: 'UPDATE_EXECUTION'; payload: FlowExecution }
  | { type: 'ADD_EXECUTION'; payload: FlowExecution }
  | { type: 'ADD_APPLICATION'; payload: Application }
  | { type: 'UPDATE_APPLICATION'; payload: Application }
  | { type: 'DELETE_APPLICATION'; payload: string }
  | { type: 'TOGGLE_THEME' };

const initialState: AppState = {
  flows: mockFlows,
  executions: mockExecutions,
  applications: mockApplications,
  users: mockUsers,
  currentUser: mockUsers[0],
  theme: 'dark'
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_FLOW':
      return {
        ...state,
        flows: state.flows.map(flow => 
          flow.id === action.payload.id ? action.payload : flow
        )
      };
    case 'ADD_FLOW':
      return {
        ...state,
        flows: [...state.flows, action.payload]
      };
    case 'DELETE_FLOW':
      return {
        ...state,
        flows: state.flows.filter(flow => flow.id !== action.payload)
      };
    case 'UPDATE_EXECUTION':
      return {
        ...state,
        executions: state.executions.map(execution => 
          execution.id === action.payload.id ? action.payload : execution
        )
      };
    case 'ADD_EXECUTION':
      return {
        ...state,
        executions: [...state.executions, action.payload]
      };
    case 'ADD_APPLICATION':
      return {
        ...state,
        applications: [...state.applications, action.payload]
      };
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map(app => 
          app.id === action.payload.id ? action.payload : app
        )
      };
    case 'DELETE_APPLICATION':
      return {
        ...state,
        applications: state.applications.filter(app => app.id !== action.payload)
      };
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'dark' ? 'light' : 'dark'
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}