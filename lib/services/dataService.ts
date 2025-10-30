import type { DataSourceType } from '../features/filters/filterSlice';
import { fetchFromGoogleSheets } from './sheetsService';
import type { CsvRow } from '@/app/types/shared';

// Types for the configuration file
interface DataSourceConfig {
    displayName: string;
    description: string;
    sheetName: 'arrest' | 'jail' | 'county_prison' | 'demographic';
    range: string;
    type: 'sheets';
}

interface ContentConfig {
    displayName: string;
    url: string;
    localFallback: string;
    type: 'markdown';
}

interface DataSourcesConfig {
    version: string;
    lastUpdated: string;
    dataSources: Record<DataSourceType, DataSourceConfig>;
    content: Record<string, ContentConfig>;
    settings: {
        retryAttempts: number;
        retryDelay: number;
        cacheTimeout: number;
    };
}

// Cache for configuration and data
let configCache: DataSourcesConfig | null = null;
const dataCache = new Map<string, { data: CsvRow[] | string; timestamp: number }>();

/**
 * Load and cache the data sources configuration
 */
async function loadConfig(): Promise<DataSourcesConfig> {
    if (configCache) {
        return configCache;
    }

    try {
        const response = await fetch('/data-sources.json');
        if (!response.ok) {
            throw new Error(`Failed to load configuration: ${response.statusText}`);
        }

        configCache = await response.json();
        return configCache!;
    } catch (error) {
        console.error('Error loading data sources configuration:', error);
        throw new Error('Failed to load data sources configuration');
    }
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheKey: string, cacheTimeout: number): boolean {
    const cached = dataCache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    return (now - cached.timestamp) < cacheTimeout;
}

/**
 * Load a data source from Google Sheets
 */
export async function loadDataSource(sourceType: DataSourceType): Promise<CsvRow[]> {
    console.log(`🚀 [DataService] Starting to load data source: ${sourceType}`);
    const config = await loadConfig();
    const sourceConfig = config.dataSources[sourceType];

    if (!sourceConfig) {
        console.error(`❌ [DataService] Unknown data source type: ${sourceType}`);
        throw new Error(`Unknown data source type: ${sourceType}`);
    }

    const cacheKey = `datasource_${sourceType}`;

    // Check cache first
    if (isCacheValid(cacheKey, config.settings.cacheTimeout)) {
        console.log(`💾 [DataService] Using cached data for ${sourceType}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data as CsvRow[];
    }

    console.log(`📥 [DataService] Cache miss for ${sourceType}, fetching from Google Sheets`);

    // Fetch from Google Sheets
    console.log(`☁️ [DataService] Fetching from Google Sheets: ${sourceConfig.displayName}`);
    const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID;
    if (!spreadsheetId) {
        throw new Error('❌ NEXT_PUBLIC_SPREADSHEET_ID is not defined in environment variables.');
    }

    const data = await fetchFromGoogleSheets(
        spreadsheetId,
        sourceConfig.sheetName,
        sourceConfig.range,
        {
            retryAttempts: config.settings.retryAttempts,
            retryDelay: config.settings.retryDelay
        }
    );

    console.log(`✅ [DataService] Successfully loaded ${data.length} rows from Google Sheets for ${sourceType}`);

    // Cache the result
    dataCache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
    });
    console.log(`💾 [DataService] Cached ${sourceType} data (${data.length} rows)`);

    return data;
}

/**
 * Load content (markdown file) by name
 */
export async function loadContent(contentName: string): Promise<string> {
    console.log(`📄 [DataService] Starting to load content: ${contentName}`);
    const config = await loadConfig();
    const contentConfig = config.content[contentName];

    if (!contentConfig) {
        console.error(`❌ [DataService] Unknown content: ${contentName}`);
        throw new Error(`Unknown content: ${contentName}`);
    }

    const cacheKey = `content_${contentName}`;

    // Check cache first
    if (isCacheValid(cacheKey, config.settings.cacheTimeout)) {
        console.log(`💾 [DataService] Using cached content for ${contentName}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data as string;
    }

    console.log(`📥 [DataService] Cache miss for ${contentName}, fetching fresh content`);

    try {
        const response = await fetch(contentConfig.localFallback);
         if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        const data = await response.text();

        // Cache the result
        dataCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });

        console.log(`💾 [DataService] Cached ${contentName} content (${data.length} chars)`);
        return data;
    } catch (error) {
        console.error(`❌ [DataService] Failed to load content ${contentName}:`, error);
        throw new Error(`Failed to load ${contentConfig.displayName}: ${error}`);
    }
}

/**
 * Get available data sources
 */
export async function getAvailableDataSources(): Promise<Record<string, DataSourceConfig>> {
    const config = await loadConfig();
    return config.dataSources;
}

/**
 * Get available content
 */
export async function getAvailableContent(): Promise<Record<string, ContentConfig>> {
    const config = await loadConfig();
    return config.content;
}

/**
 * Clear cache for a specific item or all items
 */
export function clearCache(key?: string): void {
    if (key) {
        dataCache.delete(key);
    } else {
        dataCache.clear();
        configCache = null;
    }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
    configLoaded: boolean;
    cachedItems: number;
    cacheKeys: string[];
} {
    return {
        configLoaded: configCache !== null,
        cachedItems: dataCache.size,
        cacheKeys: Array.from(dataCache.keys())
    };
}
