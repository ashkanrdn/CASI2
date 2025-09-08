import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Feature } from 'geojson';
import type { CsvRow } from '@/app/types/shared';
import type { DataSourceType } from '@/lib/features/filters/filterSlice';
import { preloadAllDataSources, type PreloadedData, type DataSourceStatus } from '@/lib/services/dataPreloader';

/**
 * Global app status states
 */
export type AppStatus = 'idle' | 'preloading' | 'ready' | 'error';

/**
 * Individual data source loading status
 */
export interface DataSourceLoadingStatus {
    status: 'idle' | 'loading' | 'success' | 'error';
    error?: string;
    loadedCount?: number;
}

/**
 * Global app state interface
 */
export interface AppState {
    // Overall app loading status
    appStatus: AppStatus;
    
    // Individual data source statuses for progress tracking
    dataSourceStatuses: Record<DataSourceType | 'geojson', DataSourceLoadingStatus>;
    
    // GeoJSON data stored at app level since multiple components need it
    geojsonData: Feature[];
    
    // Global error message
    globalError: string | null;
    
    // Preload start and completion timestamps
    preloadStartTime: number | null;
    preloadEndTime: number | null;
}

/**
 * Initial state
 */
const initialState: AppState = {
    appStatus: 'idle',
    dataSourceStatuses: {
        arrest: { status: 'idle' },
        jail: { status: 'idle' },
        county_prison: { status: 'idle' },
        demographic: { status: 'idle' },
        geojson: { status: 'idle' },
    },
    geojsonData: [],
    globalError: null,
    preloadStartTime: null,
    preloadEndTime: null,
};

/**
 * Async thunk for preloading all data sources
 */
export const preloadAllAppData = createAsyncThunk(
    'app/preloadAllAppData',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            console.log('🚀 [AppSlice] Starting app data preload...');
            
            // Preload all data with progress updates
            const preloadedData = await preloadAllDataSources();
            
            // The data will be stored in their respective slices through separate actions
            // This thunk primarily manages the overall app status
            
            return preloadedData;
        } catch (error) {
            console.error('❌ [AppSlice] App data preload failed:', error);
            return rejectWithValue(`Failed to preload app data: ${error}`);
        }
    }
);

/**
 * Async thunk for preloading with detailed progress updates
 */
export const preloadAllAppDataWithProgress = createAsyncThunk(
    'app/preloadAllAppDataWithProgress',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            console.log('🚀 [AppSlice] Starting app data preload with progress...');
            
            // Import the preloader with progress function
            const { preloadAllDataSourcesWithProgress } = await import('@/lib/services/dataPreloader');
            
            // Preload with progress callbacks
            const preloadedData = await preloadAllDataSourcesWithProgress((status: DataSourceStatus) => {
                // Dispatch progress updates
                dispatch(updateDataSourceStatus({
                    source: status.source,
                    status: {
                        status: status.status,
                        error: status.error,
                        loadedCount: Array.isArray(status.data) ? status.data.length : undefined,
                    }
                }));
            });
            
            return preloadedData;
        } catch (error) {
            console.error('❌ [AppSlice] App data preload with progress failed:', error);
            return rejectWithValue(`Failed to preload app data: ${error}`);
        }
    }
);

/**
 * App slice
 */
export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        /**
         * Update individual data source loading status
         */
        updateDataSourceStatus: (
            state,
            action: PayloadAction<{
                source: DataSourceType | 'geojson';
                status: DataSourceLoadingStatus;
            }>
        ) => {
            const { source, status } = action.payload;
            state.dataSourceStatuses[source] = status;
            
            // Update overall app status based on individual statuses
            const statuses = Object.values(state.dataSourceStatuses);
            const allLoading = statuses.every(s => s.status === 'loading' || s.status === 'idle');
            const anyError = statuses.some(s => s.status === 'error');
            const allSuccess = statuses.every(s => s.status === 'success');
            
            if (anyError) {
                state.appStatus = 'error';
            } else if (allSuccess) {
                state.appStatus = 'ready';
            } else if (allLoading) {
                state.appStatus = 'preloading';
            }
        },
        
        /**
         * Set GeoJSON data at app level
         */
        setGeoJsonData: (state, action: PayloadAction<Feature[]>) => {
            state.geojsonData = action.payload;
        },
        
        /**
         * Clear global error
         */
        clearGlobalError: (state) => {
            state.globalError = null;
        },
        
        /**
         * Reset app to initial state
         */
        resetApp: () => initialState,
        
        /**
         * Set preload timing
         */
        setPreloadTiming: (state, action: PayloadAction<{ start?: number; end?: number }>) => {
            if (action.payload.start !== undefined) {
                state.preloadStartTime = action.payload.start;
            }
            if (action.payload.end !== undefined) {
                state.preloadEndTime = action.payload.end;
                
                // Log performance metrics
                if (state.preloadStartTime) {
                    const duration = action.payload.end - state.preloadStartTime;
                    console.log(`⏱️  [AppSlice] Total preload time: ${duration}ms`);
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle preload start
            .addCase(preloadAllAppData.pending, (state) => {
                state.appStatus = 'preloading';
                state.globalError = null;
                state.preloadStartTime = Date.now();
                
                // Set all data sources to loading
                Object.keys(state.dataSourceStatuses).forEach((key) => {
                    state.dataSourceStatuses[key as DataSourceType | 'geojson'].status = 'loading';
                });
            })
            .addCase(preloadAllAppDataWithProgress.pending, (state) => {
                state.appStatus = 'preloading';
                state.globalError = null;
                state.preloadStartTime = Date.now();
                
                // Set all data sources to loading
                Object.keys(state.dataSourceStatuses).forEach((key) => {
                    state.dataSourceStatuses[key as DataSourceType | 'geojson'].status = 'loading';
                });
            })
            
            // Handle preload success
            .addCase(preloadAllAppData.fulfilled, (state, action: PayloadAction<PreloadedData>) => {
                const { geojsonData, loadingProgress, errors } = action.payload;
                
                // Store GeoJSON data at app level
                state.geojsonData = geojsonData;
                
                // Update individual data source statuses
                Object.entries(loadingProgress).forEach(([source, success]) => {
                    const sourceKey = source as DataSourceType | 'geojson';
                    const error = errors[sourceKey];
                    
                    state.dataSourceStatuses[sourceKey] = {
                        status: error ? 'error' : (success ? 'success' : 'error'),
                        error: error || undefined,
                        loadedCount: sourceKey === 'geojson' 
                            ? geojsonData.length 
                            : action.payload.csvData[sourceKey as DataSourceType]?.length,
                    };
                });
                
                // Determine overall app status
                const hasErrors = Object.values(errors).some(error => error !== null);
                const hasSuccesses = Object.values(loadingProgress).some(success => success);
                
                if (hasSuccesses) {
                    state.appStatus = hasErrors ? 'error' : 'ready';
                } else {
                    state.appStatus = 'error';
                    state.globalError = 'Failed to load any data sources';
                }
                
                state.preloadEndTime = Date.now();
            })
            .addCase(preloadAllAppDataWithProgress.fulfilled, (state, action: PayloadAction<PreloadedData>) => {
                // Same handling as regular preload
                const { geojsonData, loadingProgress, errors } = action.payload;
                
                state.geojsonData = geojsonData;
                
                Object.entries(loadingProgress).forEach(([source, success]) => {
                    const sourceKey = source as DataSourceType | 'geojson';
                    const error = errors[sourceKey];
                    
                    state.dataSourceStatuses[sourceKey] = {
                        status: error ? 'error' : (success ? 'success' : 'error'),
                        error: error || undefined,
                        loadedCount: sourceKey === 'geojson' 
                            ? geojsonData.length 
                            : action.payload.csvData[sourceKey as DataSourceType]?.length,
                    };
                });
                
                const hasErrors = Object.values(errors).some(error => error !== null);
                const hasSuccesses = Object.values(loadingProgress).some(success => success);
                
                if (hasSuccesses) {
                    state.appStatus = hasErrors ? 'error' : 'ready';
                } else {
                    state.appStatus = 'error';
                    state.globalError = 'Failed to load any data sources';
                }
                
                state.preloadEndTime = Date.now();
            })
            
            // Handle preload failure
            .addCase(preloadAllAppData.rejected, (state, action) => {
                state.appStatus = 'error';
                state.globalError = action.payload as string || 'Unknown error occurred during preload';
                state.preloadEndTime = Date.now();
                
                // Set all data sources to error
                Object.keys(state.dataSourceStatuses).forEach((key) => {
                    state.dataSourceStatuses[key as DataSourceType | 'geojson'] = {
                        status: 'error',
                        error: 'Preload failed',
                    };
                });
            })
            .addCase(preloadAllAppDataWithProgress.rejected, (state, action) => {
                state.appStatus = 'error';
                state.globalError = action.payload as string || 'Unknown error occurred during preload';
                state.preloadEndTime = Date.now();
                
                Object.keys(state.dataSourceStatuses).forEach((key) => {
                    state.dataSourceStatuses[key as DataSourceType | 'geojson'] = {
                        status: 'error',
                        error: 'Preload failed',
                    };
                });
            });
    },
});

export const {
    updateDataSourceStatus,
    setGeoJsonData,
    clearGlobalError,
    resetApp,
    setPreloadTiming,
} = appSlice.actions;

export default appSlice.reducer;