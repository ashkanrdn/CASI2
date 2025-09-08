import Papa from 'papaparse';
import type { Feature } from 'geojson';
import type { CsvRow } from '@/app/types/shared';
import type { DataSourceType } from '@/lib/features/filters/filterSlice';
import { loadDataSource } from './dataService';

/**
 * Result interface for preloaded data
 */
export interface PreloadedData {
    csvData: Record<DataSourceType, CsvRow[]>;
    geojsonData: Feature[];
    loadingProgress: Record<DataSourceType | 'geojson', boolean>;
    errors: Record<DataSourceType | 'geojson', string | null>;
    metrics?: LoadingMetrics & {
        totalLoadTime: number;
        geojsonLoadTime: number;
        totalDataSize: number;
    };
}

/**
 * Data source loading status interface
 */
export interface DataSourceStatus {
    source: DataSourceType | 'geojson';
    status: 'idle' | 'loading' | 'success' | 'error';
    data?: CsvRow[] | Feature[];
    error?: string;
}

/**
 * Performance metrics for data loading
 */
interface LoadingMetrics {
    sourceTimings: Record<DataSourceType, number>;
    memoryUsage: {
        before: number;
        after: number;
        peak: number;
    };
    dataSize: Record<DataSourceType, number>;
}

/**
 * Get current memory usage in MB
 */
function getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memInfo = (performance as any).memory;
        return Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
}

/**
 * Optimized CSV parsing with streaming and chunking for large datasets
 */
function parseCSVOptimized(csvText: string, dataSource: DataSourceType): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const chunkSize = 10000; // Process 10k rows at a time
        const results: CsvRow[] = [];
        let processedRows = 0;
        
        Papa.parse<CsvRow>(csvText, {
            header: true,
            dynamicTyping: true,
            step: (result) => {
                // Filter and process each row as it's parsed (streaming)
                if (result.data && typeof result.data === 'object') {
                    const row = result.data;
                    // Validate row has required fields
                    const yearValue = dataSource === 'demographic' ? row.Years : row.Year;
                    if (typeof yearValue === 'number' && !isNaN(yearValue)) {
                        results.push(row);
                    }
                }
                
                processedRows++;
                
                // Log progress for large datasets
                if (processedRows % chunkSize === 0) {
                    console.log(`📊 [DataPreloader] Processed ${processedRows} rows for ${dataSource}`);
                }
            },
            complete: () => {
                const duration = Date.now() - startTime;
                console.log(`✅ [DataPreloader] CSV parsing completed for ${dataSource}: ${results.length} valid rows in ${duration}ms`);
                resolve(results);
            },
            error: (error: Error) => {
                console.error(`❌ [DataPreloader] CSV parsing failed for ${dataSource}:`, error);
                reject(error);
            },
        });
    });
}

/**
 * Preload all CSV data sources in parallel with performance optimizations
 */
async function preloadAllCSVSources(): Promise<{
    csvData: Record<DataSourceType, CsvRow[]>;
    errors: Record<DataSourceType, string | null>;
    metrics: LoadingMetrics;
}> {
    const dataSources: DataSourceType[] = ['arrest', 'jail', 'county_prison', 'demographic'];
    const csvData: Record<DataSourceType, CsvRow[]> = {
        arrest: [],
        jail: [],
        county_prison: [],
        demographic: [],
    };
    const errors: Record<DataSourceType, string | null> = {
        arrest: null,
        jail: null,
        county_prison: null,
        demographic: null,
    };
    
    // Performance tracking
    const metrics: LoadingMetrics = {
        sourceTimings: { arrest: 0, jail: 0, county_prison: 0, demographic: 0 },
        memoryUsage: {
            before: getMemoryUsage(),
            after: 0,
            peak: 0,
        },
        dataSize: { arrest: 0, jail: 0, county_prison: 0, demographic: 0 },
    };

    // Create promises for all data sources with optimizations
    const loadingPromises = dataSources.map(async (dataSource) => {
        const sourceStartTime = Date.now();
        
        try {
            // Monitor peak memory usage
            const beforeMemory = getMemoryUsage();
            metrics.memoryUsage.peak = Math.max(metrics.memoryUsage.peak, beforeMemory);
            
            // Load CSV text using existing data service
            const csvText = await loadDataSource(dataSource);
            metrics.dataSize[dataSource] = csvText.length;
            
            console.log(`📁 [DataPreloader] Loaded ${dataSource} CSV: ${(csvText.length / 1024 / 1024).toFixed(2)} MB`);
            
            // Use optimized streaming parser
            const parsedData = await parseCSVOptimized(csvText, dataSource);
            
            // Track memory after parsing
            const afterMemory = getMemoryUsage();
            metrics.memoryUsage.peak = Math.max(metrics.memoryUsage.peak, afterMemory);
            
            csvData[dataSource] = parsedData;
            metrics.sourceTimings[dataSource] = Date.now() - sourceStartTime;
            
            console.log(`✅ [DataPreloader] Successfully loaded ${dataSource}: ${parsedData.length} rows in ${metrics.sourceTimings[dataSource]}ms`);
        } catch (error) {
            metrics.sourceTimings[dataSource] = Date.now() - sourceStartTime;
            const errorMessage = `Failed to load ${dataSource} data: ${error}`;
            errors[dataSource] = errorMessage;
            console.error(`❌ [DataPreloader] ${errorMessage} (took ${metrics.sourceTimings[dataSource]}ms)`);
        }
    });

    // Wait for all CSV sources to complete (or fail)
    await Promise.allSettled(loadingPromises);
    
    metrics.memoryUsage.after = getMemoryUsage();

    return { csvData, errors, metrics };
}

/**
 * Preload GeoJSON data for California counties
 */
async function preloadGeoJSONData(): Promise<{
    geojsonData: Feature[];
    error: string | null;
}> {
    try {
        console.log('🗺️  [DataPreloader] Loading GeoJSON data...');
        const response = await fetch('/california-counties.geojson');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.features || !Array.isArray(data.features)) {
            throw new Error('Invalid GeoJSON format: missing features array');
        }

        console.log(`✅ [DataPreloader] Successfully loaded GeoJSON: ${data.features.length} features`);
        return { geojsonData: data.features, error: null };
    } catch (error) {
        const errorMessage = `Failed to load GeoJSON data: ${error}`;
        console.error(`❌ [DataPreloader] ${errorMessage}`);
        return { geojsonData: [], error: errorMessage };
    }
}

/**
 * Main preloader function that loads all data sources and GeoJSON in parallel
 */
export async function preloadAllDataSources(): Promise<PreloadedData> {
    console.log('🚀 [DataPreloader] Starting parallel data preload...');
    const startTime = Date.now();

    // Load CSV data and GeoJSON in parallel
    const [csvResult, geojsonResult] = await Promise.allSettled([
        preloadAllCSVSources(),
        preloadGeoJSONData()
    ]);

    // Process CSV results
    const csvData: Record<DataSourceType, CsvRow[]> = {
        arrest: [],
        jail: [],
        county_prison: [],
        demographic: [],
    };
    const csvErrors: Record<DataSourceType, string | null> = {
        arrest: null,
        jail: null,
        county_prison: null,
        demographic: null,
    };
    
    let csvMetrics: LoadingMetrics | undefined;

    if (csvResult.status === 'fulfilled') {
        Object.assign(csvData, csvResult.value.csvData);
        Object.assign(csvErrors, csvResult.value.errors);
        csvMetrics = csvResult.value.metrics;
    } else {
        console.error('❌ [DataPreloader] CSV loading failed:', csvResult.reason);
        // Set all CSV errors
        Object.keys(csvErrors).forEach(key => {
            csvErrors[key as DataSourceType] = `CSV loading failed: ${csvResult.reason}`;
        });
    }

    // Process GeoJSON results
    let geojsonData: Feature[] = [];
    let geojsonError: string | null = null;
    let geojsonLoadTime = 0;

    const geojsonStartTime = Date.now();
    if (geojsonResult.status === 'fulfilled') {
        geojsonData = geojsonResult.value.geojsonData;
        geojsonError = geojsonResult.value.error;
        geojsonLoadTime = Date.now() - geojsonStartTime;
    } else {
        geojsonError = `GeoJSON loading failed: ${geojsonResult.reason}`;
        geojsonLoadTime = Date.now() - geojsonStartTime;
        console.error('❌ [DataPreloader] GeoJSON loading failed:', geojsonResult.reason);
    }

    // Calculate loading progress
    const loadingProgress: Record<DataSourceType | 'geojson', boolean> = {
        arrest: csvData.arrest.length > 0,
        jail: csvData.jail.length > 0,
        county_prison: csvData.county_prison.length > 0,
        demographic: csvData.demographic.length > 0,
        geojson: geojsonData.length > 0,
    };

    // Combine all errors
    const errors: Record<DataSourceType | 'geojson', string | null> = {
        ...csvErrors,
        geojson: geojsonError,
    };

    const endTime = Date.now();
    const totalLoadTime = endTime - startTime;

    // Calculate total data size and create complete metrics
    const totalDataSize = csvMetrics 
        ? Object.values(csvMetrics.dataSize).reduce((sum, size) => sum + size, 0) + 
          JSON.stringify(geojsonData).length
        : 0;

    const metrics = csvMetrics ? {
        ...csvMetrics,
        totalLoadTime,
        geojsonLoadTime,
        totalDataSize,
    } : undefined;

    // Log enhanced summary with performance metrics
    const successCount = Object.values(loadingProgress).filter(Boolean).length;
    const totalCount = Object.keys(loadingProgress).length;
    
    console.log(`🏁 [DataPreloader] Completed in ${totalLoadTime}ms`);
    console.log(`📊 [DataPreloader] Success: ${successCount}/${totalCount} sources loaded`);
    
    if (metrics) {
        console.log(`💾 [DataPreloader] Total data size: ${(totalDataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🧠 [DataPreloader] Memory usage: ${metrics.memoryUsage.before}MB → ${metrics.memoryUsage.after}MB (peak: ${metrics.memoryUsage.peak}MB)`);
        console.log(`⏱️  [DataPreloader] Source timings:`, Object.entries(metrics.sourceTimings).map(([source, time]) => `${source}: ${time}ms`).join(', '));
    }
    
    if (successCount < totalCount) {
        console.warn('⚠️  [DataPreloader] Some data sources failed to load:', errors);
    }

    return {
        csvData,
        geojsonData,
        loadingProgress,
        errors,
        metrics,
    };
}

/**
 * Preload data with progress callback for UI updates
 */
export async function preloadAllDataSourcesWithProgress(
    onProgress?: (status: DataSourceStatus) => void
): Promise<PreloadedData> {
    const dataSources: (DataSourceType | 'geojson')[] = ['arrest', 'jail', 'county_prison', 'demographic', 'geojson'];
    
    // Notify start of each source
    dataSources.forEach(source => {
        onProgress?.({
            source,
            status: 'loading'
        });
    });

    const result = await preloadAllDataSources();

    // Notify completion of each source
    dataSources.forEach(source => {
        const hasData = source === 'geojson' 
            ? result.geojsonData.length > 0
            : result.csvData[source as DataSourceType].length > 0;
        
        const error = result.errors[source];

        onProgress?.({
            source,
            status: error ? 'error' : (hasData ? 'success' : 'error'),
            data: source === 'geojson' ? result.geojsonData : result.csvData[source as DataSourceType],
            error,
        });
    });

    return result;
}