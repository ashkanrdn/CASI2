import type { DataSourceType } from '../features/filters/filterSlice';

// Types for the configuration file
interface DataSourceConfig {
    displayName: string;
    description: string;
    url: string;
    localFallback: string;
    type: 'csv' | 'markdown';
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
    dataSources: Record<DataSourceType | 'demographic', DataSourceConfig>;
    content: Record<string, ContentConfig>;
    settings: {
        retryAttempts: number;
        retryDelay: number;
        cacheTimeout: number;
        fallbackEnabled: boolean;
    };
}

// Cache for configuration and data
let configCache: DataSourcesConfig | null = null;
const dataCache = new Map<string, { data: string; timestamp: number }>();

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
 * Fetch data with retry logic and fallback support
 */
async function fetchWithFallback(
    primaryUrl: string, 
    fallbackUrl: string, 
    retryAttempts: number = 2,
    retryDelay: number = 1000,
    resourceName: string = 'resource'
): Promise<{ data: string; source: 'google-drive' | 'local' }> {
    console.log(`🔍 [DataService] Loading ${resourceName}...`);
    console.log(`🔗 [DataService] Primary URL: ${primaryUrl}`);
    console.log(`🏠 [DataService] Fallback URL: ${fallbackUrl}`);
    
    // Helper function to attempt fetch with retries
    const attemptFetch = async (url: string, attempts: number): Promise<string> => {
        for (let i = 0; i <= attempts; i++) {
            try {
                console.log(`📡 [DataService] Attempting fetch from ${url} (attempt ${i + 1}/${attempts + 1})`);
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.text();
                    console.log(`✅ [DataService] Successfully fetched ${data.length} characters from ${url}`);
                    return data;
                }
                
                console.warn(`⚠️ [DataService] HTTP ${response.status}: ${response.statusText} from ${url}`);
                
                // If it's the last attempt, throw the error
                if (i === attempts) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Wait before retrying
                if (i < attempts) {
                    console.log(`⏳ [DataService] Waiting ${retryDelay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } catch (error) {
                console.warn(`❌ [DataService] Fetch error from ${url}:`, error);
                
                // If it's the last attempt, throw the error
                if (i === attempts) {
                    throw error;
                }
                
                // Wait before retrying
                if (i < attempts) {
                    console.log(`⏳ [DataService] Waiting ${retryDelay}ms before retry after error...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }
        
        throw new Error('All fetch attempts failed');
    };

    try {
        // First try the primary URL (Google Drive) through our proxy
        console.log(`☁️ [DataService] Trying Google Drive for ${resourceName}...`);
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(primaryUrl)}`;
        console.log(`🔗 [DataService] Using proxy URL: ${proxyUrl}`);
        const data = await attemptFetch(proxyUrl, retryAttempts);
        console.log(`🎉 [DataService] Successfully loaded ${resourceName} from Google Drive via proxy`);
        return { data, source: 'google-drive' };
    } catch (primaryError) {
        console.warn(`🚫 [DataService] Google Drive failed for ${resourceName}:`, primaryError);
        
        try {
            // Fallback to local URL
            console.log(`🏠 [DataService] Falling back to local file for ${resourceName}...`);
            const data = await attemptFetch(fallbackUrl, 0); // No retries for fallback
            console.log(`🎉 [DataService] Successfully loaded ${resourceName} from local fallback`);
            return { data, source: 'local' };
        } catch (fallbackError) {
            console.error(`💥 [DataService] Both Google Drive and local fallback failed for ${resourceName}`);
            console.error(`Primary error:`, primaryError);
            console.error(`Fallback error:`, fallbackError);
            throw new Error(`Both primary and fallback URLs failed for ${resourceName}. Primary: ${primaryError}. Fallback: ${fallbackError}`);
        }
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
 * Load a data source (CSV file) by type
 */
export async function loadDataSource(sourceType: DataSourceType): Promise<string> {
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
        console.log(`🎯 [DataService] Using cached data for ${sourceType}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data;
    }

    console.log(`📥 [DataService] Cache miss for ${sourceType}, fetching fresh data`);

    try {
        const result = await fetchWithFallback(
            sourceConfig.url,
            sourceConfig.localFallback,
            config.settings.retryAttempts,
            config.settings.retryDelay,
            `${sourceConfig.displayName} (${sourceType})`
        );

        // Cache the result
        dataCache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now()
        });

        console.log(`💾 [DataService] Cached ${sourceType} data (${result.data.length} chars) from ${result.source}`);
        return result.data;
    } catch (error) {
        console.error(`💥 [DataService] Failed to load data source ${sourceType}:`, error);
        throw new Error(`Failed to load ${sourceConfig.displayName}: ${error}`);
    }
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
        console.log(`🎯 [DataService] Using cached content for ${contentName}`);
        const cached = dataCache.get(cacheKey);
        return cached!.data;
    }

    console.log(`📥 [DataService] Cache miss for ${contentName}, fetching fresh content`);

    try {
        const result = await fetchWithFallback(
            contentConfig.url,
            contentConfig.localFallback,
            config.settings.retryAttempts,
            config.settings.retryDelay,
            `${contentConfig.displayName} (${contentName})`
        );

        // Cache the result
        dataCache.set(cacheKey, {
            data: result.data,
            timestamp: Date.now()
        });

        console.log(`💾 [DataService] Cached ${contentName} content (${result.data.length} chars) from ${result.source}`);
        return result.data;
    } catch (error) {
        console.error(`💥 [DataService] Failed to load content ${contentName}:`, error);
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