import Papa from 'papaparse';
import type { Feature } from 'geojson';
import type { CsvRow } from '@/app/types/shared';
import type { DataSourceType } from '@/lib/features/filters/filterSlice';
import type { ContentSection } from '@/lib/features/content/contentSlice';
import { loadDataSource } from './dataService';
import { getAllContentSections } from '@/lib/content';

/**
 * Result interface for preloaded data
 */
export interface PreloadedData {
    // Content data
    contentData: ContentSection[];
    contentReady: boolean;
    
    // Map data
    csvData: Record<DataSourceType, CsvRow[]>;
    geojsonData: Feature[];
    mapDataReady: boolean;
    
    // Loading progress
    loadingProgress: Record<DataSourceType | 'geojson' | 'content', boolean>;
    errors: Record<DataSourceType | 'geojson' | 'content', string | null>;
    
    // Performance metrics
    metrics?: LoadingMetrics & {
        totalLoadTime: number;
        geojsonLoadTime: number;
        contentLoadTime: number;
        totalDataSize: number;
    };
}

/**
 * Data source loading status interface
 */
export interface DataSourceStatus {
    source: DataSourceType | 'geojson' | 'content';
    status: 'idle' | 'loading' | 'success' | 'error';
    data?: CsvRow[] | Feature[] | ContentSection[];
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
 * Preload content data (markdown files)
 */
async function preloadContentData(): Promise<{
    contentData: ContentSection[];
    error: string | null;
}> {
    try {
        console.log('📄 [DataPreloader] Loading content data...');
        const startTime = Date.now();
        
        const contentSections = await getAllContentSections();
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ [DataPreloader] Successfully loaded content: ${contentSections.length} sections in ${loadTime}ms`);
        
        return { contentData: contentSections, error: null };
    } catch (error) {
        const errorMessage = `Failed to load content data: ${error}`;
        console.error(`❌ [DataPreloader] ${errorMessage}`);
        return { contentData: [], error: errorMessage };
    }
}

/**
 * Preload content data only (for immediate content page access)
 */
export async function preloadContentOnly(): Promise<{
    contentData: ContentSection[];
    contentReady: boolean;
    error: string | null;
}> {
    console.log('⚡ [DataPreloader] Starting content-only preload...');
    const startTime = Date.now();
    
    const result = await preloadContentData();
    
    const duration = Date.now() - startTime;
    const contentReady = result.contentData.length > 0;
    
    if (contentReady) {
        console.log(`🏁 [DataPreloader] Content ready in ${duration}ms - pages can be shown immediately`);
    } else {
        console.warn('⚠️  [DataPreloader] Content loading failed - pages may be empty');
    }
    
    return {
        contentData: result.contentData,
        contentReady,
        error: result.error,
    };
}

/**
 * Preload map data only (CSV + GeoJSON) in background
 */
export async function preloadMapDataOnly(): Promise<{
    csvData: Record<DataSourceType, CsvRow[]>;
    geojsonData: Feature[];
    mapDataReady: boolean;
    errors: Record<DataSourceType | 'geojson', string | null>;
    metrics?: LoadingMetrics & { totalLoadTime: number; geojsonLoadTime: number; };
}> {
    console.log('🗺️  [DataPreloader] Starting background map data preload...');
    const startTime = Date.now();
    
    // Load CSV data and GeoJSON in parallel
    const [csvResult, geojsonResult] = await Promise.allSettled([
        preloadAllCSVSources(),
        preloadGeoJSONData()
    ]);
    
    // Process results (same logic as main preloader)
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
        Object.keys(csvErrors).forEach(key => {
            csvErrors[key as DataSourceType] = `CSV loading failed: ${csvResult.reason}`;
        });
    }

    let geojsonData: Feature[] = [];
    let geojsonError: string | null = null;
    const geojsonStartTime = Date.now();
    
    if (geojsonResult.status === 'fulfilled') {
        geojsonData = geojsonResult.value.geojsonData;
        geojsonError = geojsonResult.value.error;
    } else {
        geojsonError = `GeoJSON loading failed: ${geojsonResult.reason}`;
        console.error('❌ [DataPreloader] GeoJSON loading failed:', geojsonResult.reason);
    }
    
    const geojsonLoadTime = Date.now() - geojsonStartTime;
    const totalLoadTime = Date.now() - startTime;
    
    const errors: Record<DataSourceType | 'geojson', string | null> = {
        ...csvErrors,
        geojson: geojsonError,
    };
    
    const mapDataReady = geojsonData.length > 0 && Object.values(csvData).some(data => data.length > 0);
    
    const metrics = csvMetrics ? {
        ...csvMetrics,
        totalLoadTime,
        geojsonLoadTime,
    } : undefined;
    
    if (mapDataReady) {
        console.log(`🏁 [DataPreloader] Map data ready in ${totalLoadTime}ms - map functionality enabled`);
    } else {
        console.warn('⚠️  [DataPreloader] Map data loading failed - map functionality limited');
    }
    
    return {
        csvData,
        geojsonData,
        mapDataReady,
        errors,
        metrics,
    };
}

/**
 * Main preloader function that loads all data sources and GeoJSON in parallel
 */
export async function preloadAllDataSources(): Promise<PreloadedData> {
    console.log('🚀 [DataPreloader] Starting parallel data preload...');
    const startTime = Date.now();

    // Load all data types in parallel: content, CSV, and GeoJSON
    const [contentResult, csvResult, geojsonResult] = await Promise.allSettled([
        preloadContentData(),
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

    // Process content results
    let contentData: ContentSection[] = [];
    let contentError: string | null = null;
    let contentLoadTime = 0;

    const contentStartTime = Date.now();
    if (contentResult.status === 'fulfilled') {
        contentData = contentResult.value.contentData;
        contentError = contentResult.value.error;
        contentLoadTime = Date.now() - contentStartTime;
    } else {
        contentError = `Content loading failed: ${contentResult.reason}`;
        contentLoadTime = Date.now() - contentStartTime;
        console.error('❌ [DataPreloader] Content loading failed:', contentResult.reason);
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
    const loadingProgress: Record<DataSourceType | 'geojson' | 'content', boolean> = {
        arrest: csvData.arrest.length > 0,
        jail: csvData.jail.length > 0,
        county_prison: csvData.county_prison.length > 0,
        demographic: csvData.demographic.length > 0,
        geojson: geojsonData.length > 0,
        content: contentData.length > 0,
    };

    // Combine all errors
    const errors: Record<DataSourceType | 'geojson' | 'content', string | null> = {
        ...csvErrors,
        geojson: geojsonError,
        content: contentError,
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
        contentLoadTime,
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
        // Content data
        contentData,
        contentReady: contentData.length > 0,
        
        // Map data
        csvData,
        geojsonData,
        mapDataReady: geojsonData.length > 0 && Object.values(csvData).some(data => data.length > 0),
        
        // Loading progress
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
    const dataSources: (DataSourceType | 'geojson' | 'content')[] = ['arrest', 'jail', 'county_prison', 'demographic', 'geojson', 'content'];
    
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
        let hasData: boolean;
        let data: CsvRow[] | Feature[] | ContentSection[];
        
        if (source === 'geojson') {
            hasData = result.geojsonData.length > 0;
            data = result.geojsonData;
        } else if (source === 'content') {
            hasData = result.contentData.length > 0;
            data = result.contentData;
        } else {
            hasData = result.csvData[source as DataSourceType].length > 0;
            data = result.csvData[source as DataSourceType];
        }
        
        const error = result.errors[source];

        onProgress?.({
            source,
            status: error ? 'error' : (hasData ? 'success' : 'error'),
            data,
            error: error || undefined,
        });
    });

    return result;
}