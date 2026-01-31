'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type {
  ImageRecord,
  SearchQuery,
  SyncConfig,
  ScanProgress,
  SyncProgress,
} from '../types';

// Application state interface
export interface AppState {
  images: {
    items: Map<number, ImageRecord>;
    selectedFolder: string | null;
    viewMode: 'grid' | 'detail';
    selectedImageId: number | null;
  };
  search: {
    query: SearchQuery;
    results: number[];
    isSearching: boolean;
  };
  ai: {
    isProcessing: boolean;
    queueSize: number;
    processedCount: number;
    modelLoaded: boolean;
  };
  sync: {
    isAuthenticated: boolean;
    isSyncing: boolean;
    progress: SyncProgress;
  };
  settings: {
    thumbnailCachePath: string;
    aiModel: 'clip' | 'mobilenet';
    syncConfig: SyncConfig;
  };
  scanning: {
    isScanning: boolean;
    progress: ScanProgress;
  };
}

// Action types
export type AppAction =
  | { type: 'SET_SELECTED_FOLDER'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'detail' }
  | { type: 'SET_SELECTED_IMAGE'; payload: number | null }
  | { type: 'ADD_IMAGES'; payload: ImageRecord[] }
  | { type: 'UPDATE_IMAGE'; payload: ImageRecord }
  | { type: 'REMOVE_IMAGE'; payload: number }
  | { type: 'CLEAR_IMAGES' }
  | { type: 'SET_SEARCH_QUERY'; payload: SearchQuery }
  | { type: 'SET_SEARCH_RESULTS'; payload: number[] }
  | { type: 'SET_IS_SEARCHING'; payload: boolean }
  | { type: 'SET_AI_PROCESSING'; payload: boolean }
  | { type: 'SET_AI_QUEUE_SIZE'; payload: number }
  | { type: 'SET_AI_PROCESSED_COUNT'; payload: number }
  | { type: 'SET_AI_MODEL_LOADED'; payload: boolean }
  | { type: 'SET_SYNC_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_SYNC_SYNCING'; payload: boolean }
  | { type: 'SET_SYNC_PROGRESS'; payload: SyncProgress }
  | { type: 'SET_THUMBNAIL_CACHE_PATH'; payload: string }
  | { type: 'SET_AI_MODEL'; payload: 'clip' | 'mobilenet' }
  | { type: 'SET_SYNC_CONFIG'; payload: SyncConfig }
  | { type: 'SET_IS_SCANNING'; payload: boolean }
  | { type: 'SET_SCAN_PROGRESS'; payload: ScanProgress };

// Initial state
const initialState: AppState = {
  images: {
    items: new Map(),
    selectedFolder: null,
    viewMode: 'grid',
    selectedImageId: null,
  },
  search: {
    query: {},
    results: [],
    isSearching: false,
  },
  ai: {
    isProcessing: false,
    queueSize: 0,
    processedCount: 0,
    modelLoaded: false,
  },
  sync: {
    isAuthenticated: false,
    isSyncing: false,
    progress: {
      current: 0,
      total: 0,
      currentFile: '',
    },
  },
  settings: {
    thumbnailCachePath: '',
    aiModel: 'mobilenet',
    syncConfig: {
      enabled: false,
      autoSync: false,
      syncInterval: 60,
      uploadQuality: 'high',
      excludePatterns: [],
    },
  },
  scanning: {
    isScanning: false,
    progress: {
      count: 0,
      currentFile: '',
    },
  },
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SELECTED_FOLDER':
      return {
        ...state,
        images: { ...state.images, selectedFolder: action.payload },
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        images: { ...state.images, viewMode: action.payload },
      };

    case 'SET_SELECTED_IMAGE':
      return {
        ...state,
        images: { ...state.images, selectedImageId: action.payload },
      };

    case 'ADD_IMAGES': {
      const newItems = new Map(state.images.items);
      action.payload.forEach((image) => {
        newItems.set(image.id, image);
      });
      return {
        ...state,
        images: { ...state.images, items: newItems },
      };
    }

    case 'UPDATE_IMAGE': {
      const newItems = new Map(state.images.items);
      newItems.set(action.payload.id, action.payload);
      return {
        ...state,
        images: { ...state.images, items: newItems },
      };
    }

    case 'REMOVE_IMAGE': {
      const newItems = new Map(state.images.items);
      newItems.delete(action.payload);
      return {
        ...state,
        images: { ...state.images, items: newItems },
      };
    }

    case 'CLEAR_IMAGES':
      return {
        ...state,
        images: { ...state.images, items: new Map() },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        search: { ...state.search, query: action.payload },
      };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        search: { ...state.search, results: action.payload },
      };

    case 'SET_IS_SEARCHING':
      return {
        ...state,
        search: { ...state.search, isSearching: action.payload },
      };

    case 'SET_AI_PROCESSING':
      return {
        ...state,
        ai: { ...state.ai, isProcessing: action.payload },
      };

    case 'SET_AI_QUEUE_SIZE':
      return {
        ...state,
        ai: { ...state.ai, queueSize: action.payload },
      };

    case 'SET_AI_PROCESSED_COUNT':
      return {
        ...state,
        ai: { ...state.ai, processedCount: action.payload },
      };

    case 'SET_AI_MODEL_LOADED':
      return {
        ...state,
        ai: { ...state.ai, modelLoaded: action.payload },
      };

    case 'SET_SYNC_AUTHENTICATED':
      return {
        ...state,
        sync: { ...state.sync, isAuthenticated: action.payload },
      };

    case 'SET_SYNC_SYNCING':
      return {
        ...state,
        sync: { ...state.sync, isSyncing: action.payload },
      };

    case 'SET_SYNC_PROGRESS':
      return {
        ...state,
        sync: { ...state.sync, progress: action.payload },
      };

    case 'SET_THUMBNAIL_CACHE_PATH':
      return {
        ...state,
        settings: { ...state.settings, thumbnailCachePath: action.payload },
      };

    case 'SET_AI_MODEL':
      return {
        ...state,
        settings: { ...state.settings, aiModel: action.payload },
      };

    case 'SET_SYNC_CONFIG':
      return {
        ...state,
        settings: { ...state.settings, syncConfig: action.payload },
      };

    case 'SET_IS_SCANNING':
      return {
        ...state,
        scanning: { ...state.scanning, isScanning: action.payload },
      };

    case 'SET_SCAN_PROGRESS':
      return {
        ...state,
        scanning: { ...state.scanning, progress: action.payload },
      };

    default:
      return state;
  }
}

// Context
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(
  undefined
);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

// Custom hooks
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}

// Convenience hook to get both state and dispatch
export function useApp() {
  return {
    state: useAppState(),
    dispatch: useAppDispatch(),
  };
}
