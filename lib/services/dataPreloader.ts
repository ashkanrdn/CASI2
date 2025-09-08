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
 * Preload all CSV data sources in parallel
 */
async function preloadAllCSVSources(): Promise<{
    csvData: Record<DataSourceType, CsvRow[]>;
    errors: Record<DataSourceType, string | null>;
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

    // Create promises for all data sources
    const loadingPromises = dataSources.map(async (dataSource) => {
        try {
            // Load CSV text using existing data service
            const csvText = await loadDataSource(dataSource);

            // Parse CSV data using PapaParse
            const parsedData = await new Promise<CsvRow[]>((resolve, reject) => {
                Papa.parse<CsvRow>(csvText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        // Filter out rows without required fields
                        const validData = results.data.filter(row => {
                            if (!row) return false;
                            const yearValue = dataSource === 'demographic' ? row.Years : row.Year;
                            return typeof yearValue === 'number' && !isNaN(yearValue);
                        });
                        resolve(validData);
                    },
                    error: (error: Error) => {
                        reject(error);
                    },
                });
            });

            csvData[dataSource] = parsedData;
            console.log(`✅ [DataPreloader] Successfully loaded ${dataSource}: ${parsedData.length} rows`);
        } catch (error) {
            const errorMessage = `Failed to load ${dataSource} data: ${error}`;
            errors[dataSource] = errorMessage;
            console.error(`❌ [DataPreloader] ${errorMessage}`);
        }
    });

    // Wait for all CSV sources to complete (or fail)
    await Promise.allSettled(loadingPromises);

    return { csvData, errors };
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

    if (csvResult.status === 'fulfilled') {
        Object.assign(csvData, csvResult.value.csvData);
        Object.assign(csvErrors, csvResult.value.errors);
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

    if (geojsonResult.status === 'fulfilled') {
        geojsonData = geojsonResult.value.geojsonData;
        geojsonError = geojsonResult.value.error;
    } else {
        geojsonError = `GeoJSON loading failed: ${geojsonResult.reason}`;
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
    const duration = endTime - startTime;

    // Log summary
    const successCount = Object.values(loadingProgress).filter(Boolean).length;
    const totalCount = Object.keys(loadingProgress).length;
    
    console.log(`🏁 [DataPreloader] Completed in ${duration}ms`);
    console.log(`📊 [DataPreloader] Success: ${successCount}/${totalCount} sources loaded`);
    
    if (successCount < totalCount) {
        console.warn('⚠️  [DataPreloader] Some data sources failed to load:', errors);
    }

    return {
        csvData,
        geojsonData,
        loadingProgress,
        errors,
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