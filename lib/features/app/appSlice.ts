import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Feature } from 'geojson';
import type { CsvRow } from '@/app/types/shared';
import type { DataSourceType } from '@/lib/features/filters/filterSlice';
import { preloadAllDataSources, type PreloadedData, type DataSourceStatus } from '@/lib/services/dataPreloader';
import { initializeMemoryMonitoring as startMemoryMonitoring, cleanupMemoryMonitoring, globalMemoryMonitor, type MemoryInfo } from '@/lib/utils/memoryMonitor';

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
    dataSourceStatuses: Record<DataSourceType | 'geojson' | 'content', DataSourceLoadingStatus>;
    
    // Progressive loading status
    contentReady: boolean;
    mapDataReady: boolean;
    
    // GeoJSON data stored at app level since multiple components need it
    geojsonData: Feature[];
    
    // Global error message
    globalError: string | null;
    
    // Preload start and completion timestamps
    preloadStartTime: number | null;
    preloadEndTime: number | null;
    
    // Memory monitoring data
    memoryMonitoring: {
        isEnabled: boolean;
        currentMemory: MemoryInfo | null;
        peakMemory: MemoryInfo | null;
        lastUpdated: number | null;
    };
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
        content: { status: 'idle' },
    },
    contentReady: false,
    mapDataReady: false,
    geojsonData: [],
    globalError: null,
    preloadStartTime: null,
    preloadEndTime: null,
    memoryMonitoring: {
        isEnabled: false,
        currentMemory: null,
        peakMemory: null,
        lastUpdated: null,
    },
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
 * Async thunk for preloading content only (for immediate page access)
 */
export const preloadContentOnly = createAsyncThunk(
    'app/preloadContentOnly',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            console.log('⚡ [AppSlice] Starting content-only preload...');
            
            // Import the content-only preloader
            const { preloadContentOnly } = await import('@/lib/services/dataPreloader');
            
            // Update content status to loading
            dispatch(updateDataSourceStatus({
                source: 'content',
                status: { status: 'loading' }
            }));
            
            const result = await preloadContentOnly();
            
            // Update content status based on result
            dispatch(updateDataSourceStatus({
                source: 'content',
                status: {
                    status: result.error ? 'error' : 'success',
                    error: result.error || undefined,
                    loadedCount: result.contentData.length,
                }
            }));
            
            // Update content readiness
            dispatch(setContentReady(result.contentReady));
            
            return result;
        } catch (error) {
            console.error('❌ [AppSlice] Content preload failed:', error);
            dispatch(updateDataSourceStatus({
                source: 'content',
                status: { status: 'error', error: `Content loading failed: ${error}` }
            }));
            return rejectWithValue(`Failed to preload content: ${error}`);
        }
    }
);

/**
 * Async thunk for preloading map data in background
 */
export const preloadMapDataInBackground = createAsyncThunk(
    'app/preloadMapDataInBackground',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            console.log('🗺️  [AppSlice] Starting background map data preload...');
            
            // Import the map-only preloader
            const { preloadMapDataOnly } = await import('@/lib/services/dataPreloader');
            
            // Update all map-related statuses to loading
            const mapSources: (DataSourceType | 'geojson')[] = ['arrest', 'jail', 'county_prison', 'demographic', 'geojson'];
            mapSources.forEach(source => {
                dispatch(updateDataSourceStatus({
                    source,
                    status: { status: 'loading' }
                }));
            });
            
            const result = await preloadMapDataOnly();
            
            // Update individual map source statuses
            mapSources.forEach(source => {
                const error = result.errors[source];
                let loadedCount: number | undefined;
                
                if (source === 'geojson') {
                    loadedCount = result.geojsonData.length;
                } else {
                    loadedCount = result.csvData[source as DataSourceType]?.length;
                }
                
                dispatch(updateDataSourceStatus({
                    source,
                    status: {
                        status: error ? 'error' : (loadedCount && loadedCount > 0 ? 'success' : 'error'),
                        error: error || undefined,
                        loadedCount,
                    }
                }));
            });
            
            // Update map data readiness
            dispatch(setMapDataReady(result.mapDataReady));
            
            // Store GeoJSON data at app level
            dispatch(setGeoJsonData(result.geojsonData));
            
            return result;
        } catch (error) {
            console.error('❌ [AppSlice] Map data preload failed:', error);
            
            // Set all map sources to error
            const mapSources: (DataSourceType | 'geojson')[] = ['arrest', 'jail', 'county_prison', 'demographic', 'geojson'];
            mapSources.forEach(source => {
                dispatch(updateDataSourceStatus({
                    source,
                    status: { status: 'error', error: `Map data loading failed: ${error}` }
                }));
            });
            
            return rejectWithValue(`Failed to preload map data: ${error}`);
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
                source: DataSourceType | 'geojson' | 'content';
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
        
        /**
         * Initialize memory monitoring
         */
        initializeMemoryMonitoring: (state) => {
            state.memoryMonitoring.isEnabled = true;
            state.memoryMonitoring.lastUpdated = Date.now();
            
            // Initialize monitoring in the next tick
            setTimeout(() => {
                startMemoryMonitoring();
            }, 0);
        },
        
        /**
         * Update memory monitoring data
         */
        updateMemoryStatus: (state, action: PayloadAction<MemoryInfo>) => {
            const memInfo = action.payload;
            state.memoryMonitoring.currentMemory = memInfo;
            state.memoryMonitoring.lastUpdated = memInfo.timestamp;
            
            // Update peak memory if this is higher
            if (!state.memoryMonitoring.peakMemory || 
                memInfo.usedJSHeapSize > state.memoryMonitoring.peakMemory.usedJSHeapSize) {
                state.memoryMonitoring.peakMemory = memInfo;
            }
        },
        
        /**
         * Stop memory monitoring
         */
        stopMemoryMonitoring: (state) => {
            state.memoryMonitoring.isEnabled = false;
            
            // Cleanup monitoring
            setTimeout(() => {
                cleanupMemoryMonitoring();
            }, 0);
        },
        
        /**
         * Update content readiness status
         */
        setContentReady: (state, action: PayloadAction<boolean>) => {
            state.contentReady = action.payload;
            
            if (action.payload) {
                console.log('📄 [AppSlice] Content is ready - pages can be displayed');
            }
        },
        
        /**
         * Update map data readiness status
         */
        setMapDataReady: (state, action: PayloadAction<boolean>) => {
            state.mapDataReady = action.payload;
            
            if (action.payload) {
                console.log('🗺️  [AppSlice] Map data is ready - full functionality available');
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
                    state.dataSourceStatuses[key as DataSourceType | 'geojson' | 'content'].status = 'loading';
                });
            })
            .addCase(preloadAllAppDataWithProgress.pending, (state) => {
                state.appStatus = 'preloading';
                state.globalError = null;
                state.preloadStartTime = Date.now();
                
                // Set all data sources to loading
                Object.keys(state.dataSourceStatuses).forEach((key) => {
                    state.dataSourceStatuses[key as DataSourceType | 'geojson' | 'content'].status = 'loading';
                });
            })
            
            // Handle preload success
            .addCase(preloadAllAppData.fulfilled, (state, action: PayloadAction<PreloadedData>) => {
                const { geojsonData, loadingProgress, errors, contentReady, mapDataReady } = action.payload;
                
                // Store GeoJSON data at app level
                state.geojsonData = geojsonData;
                
                // Update progressive loading status
                state.contentReady = contentReady;
                state.mapDataReady = mapDataReady;
                
                // Update individual data source statuses
                Object.entries(loadingProgress).forEach(([source, success]) => {
                    const sourceKey = source as DataSourceType | 'geojson' | 'content';
                    const error = errors[sourceKey];
                    
                    let loadedCount: number | undefined;
                    if (sourceKey === 'geojson') {
                        loadedCount = geojsonData.length;
                    } else if (sourceKey === 'content') {
                        loadedCount = action.payload.contentData?.length;
                    } else {
                        loadedCount = action.payload.csvData[sourceKey as DataSourceType]?.length;
                    }
                    
                    state.dataSourceStatuses[sourceKey] = {
                        status: error ? 'error' : (success ? 'success' : 'error'),
                        error: error || undefined,
                        loadedCount,
                    };
                });
                
                // Determine overall app status based on progressive loading
                const hasErrors = Object.values(errors).some(error => error !== null);
                const hasSuccesses = Object.values(loadingProgress).some(success => success);
                
                if (hasSuccesses) {
                    // App is ready if either content or map data is available
                    state.appStatus = hasErrors ? 'error' : 'ready';
                    
                    // Initialize memory monitoring when app is ready
                    if (!hasErrors) {
                        state.memoryMonitoring.isEnabled = true;
                        state.memoryMonitoring.lastUpdated = Date.now();
                        
                        // Initialize monitoring in the next tick
                        setTimeout(() => {
                            startMemoryMonitoring();
                        }, 0);
                    }
                } else {
                    state.appStatus = 'error';
                    state.globalError = 'Failed to load any data sources';
                }
                
                state.preloadEndTime = Date.now();
            })
            .addCase(preloadAllAppDataWithProgress.fulfilled, (state, action: PayloadAction<PreloadedData>) => {
                // Same handling as regular preload
                const { geojsonData, loadingProgress, errors, contentReady, mapDataReady } = action.payload;
                
                // Store GeoJSON data at app level
                state.geojsonData = geojsonData;
                
                // Update progressive loading status
                state.contentReady = contentReady;
                state.mapDataReady = mapDataReady;
                
                // Update individual data source statuses
                Object.entries(loadingProgress).forEach(([source, success]) => {
                    const sourceKey = source as DataSourceType | 'geojson' | 'content';
                    const error = errors[sourceKey];
                    
                    let loadedCount: number | undefined;
                    if (sourceKey === 'geojson') {
                        loadedCount = geojsonData.length;
                    } else if (sourceKey === 'content') {
                        loadedCount = action.payload.contentData?.length;
                    } else {
                        loadedCount = action.payload.csvData[sourceKey as DataSourceType]?.length;
                    }
                    
                    state.dataSourceStatuses[sourceKey] = {
                        status: error ? 'error' : (success ? 'success' : 'error'),
                        error: error || undefined,
                        loadedCount,
                    };
                });
                
                // Determine overall app status based on progressive loading
                const hasErrors = Object.values(errors).some(error => error !== null);
                const hasSuccesses = Object.values(loadingProgress).some(success => success);
                
                if (hasSuccesses) {
                    // App is ready if either content or map data is available
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
                    state.dataSourceStatuses[key as DataSourceType | 'geojson' | 'content'] = {
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
                    state.dataSourceStatuses[key as DataSourceType | 'geojson' | 'content'] = {
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
    initializeMemoryMonitoring,
    updateMemoryStatus,
    stopMemoryMonitoring,
    setContentReady,
    setMapDataReady,
} = appSlice.actions;

export default appSlice.reducer;