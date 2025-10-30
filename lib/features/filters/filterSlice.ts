import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { CsvRow } from '@/app/types/shared'; // Import the updated type
import { loadDataSource } from '@/lib/services/dataService';

// Define supported data sources
export type DataSourceType = 'arrest' | 'jail' | 'county_prison' | 'demographic'; // Updated sources


export interface Filter {
    id: string;
    label: string;
    isActive: boolean;
}

export type FilterCategory = 'gender' | 'age' | 'crime' | 'race' | 'sentencing';

export enum MetricType {
    Arrests = 'Arrests',
    Imprisonments = 'Imprisonments',
    Population = 'Population18-69',
    Cost = 'CostPerInmate',
}

// Define available metrics for each data source
// Using simple strings for metrics now, map component will handle display names
export const DataSourceMetrics: Record<DataSourceType, string[]> = {
    arrest: [ 'Total_Arrests'], // New arrest data metrics
    jail: ['ADPtotal', 'Felony', 'Misd', 'Postdisp', 'Predisp'], // Removed rate metrics, keeping only count-based metrics
    county_prison: ['Imprisonments', 'Total_Cost'], // Renamed Cost metric
    demographic: ['Percent of population in poverty', 'Percent of adults with high school diploma or less', 'Unemployment rate', 'Median household income'], // Demographic metrics
};

export interface FilterState {
    filters: Record<FilterCategory, Filter[]>;
    activeFilters: {
        gender: string[];
        age: string[];
        crime: string[];
        race: string[];
        sentencing: string[]; // Add sentencing status filter
        year: number;
    };
    // Multi-source data storage
    csvDataSources: Record<DataSourceType, CsvRow[]>;
    dataSourcesStatus: Record<DataSourceType, 'idle' | 'loading' | 'succeeded' | 'failed'>;
    dataSourcesErrors: Record<DataSourceType, string | null>;
    // Current working data derived from selected source
    filteredData: CsvRow[];
    yearRange: [number, number];
    selectedMetric: string; // Use string for flexibility
    rankedCounties: { name: string; value: number; rank: number }[];
    selectedCounty: string;
    selectedDataSource: DataSourceType; // Add selected data source
    isPerCapita: boolean; // Add per capita toggle state
    selectedCounties: string[]; // Add selected counties for filtering
}

const INITIAL_FILTERS: Record<FilterCategory, Filter[]> = {
    gender: [
        { id: 'Female', label: 'Female', isActive: false },
        { id: 'Male', label: 'Male', isActive: false },
    ],
    age: [
        { id: 'Adult', label: 'Adult', isActive: false },
        { id: 'Juvenile', label: 'Juvenile', isActive: false },
    ],
    crime: [
        { id: 'Violent', label: 'Violent', isActive: false },
        { id: 'Property', label: 'Property', isActive: false },
        { id: 'Drug', label: 'Drug', isActive: false },
        { id: 'Publicorder', label: 'Public Order', isActive: false },
        { id: 'Status', label: 'Status', isActive: false },
        { id: 'Misdemeanor', label: 'Misdemeanor', isActive: false },
    ],
    race: [
        { id: 'Black', label: 'Black', isActive: false },
        { id: 'Hispanic', label: 'Hispanic', isActive: false },
        { id: 'White', label: 'White', isActive: false },
        { id: 'Asianother', label: 'Asian/Other', isActive: false },
    ],
    sentencing: [
        { id: 'Unsentenced', label: 'Unsentenced', isActive: false },
        { id: 'Sentenced', label: 'Sentenced', isActive: false },
    ],
};

const initialState: FilterState = {
    filters: INITIAL_FILTERS,
    activeFilters: {
        gender: [],
        age: [],
        crime: [],
        race: [],
        sentencing: [], // Initialize sentencing filters
        year: 2023, // Default year
    },
    // Initialize multi-source data storage
    csvDataSources: {
        arrest: [],
        jail: [],
        county_prison: [],
        demographic: [],
    },
    dataSourcesStatus: {
        arrest: 'idle',
        jail: 'idle', 
        county_prison: 'idle',
        demographic: 'idle',
    },
    dataSourcesErrors: {
        arrest: null,
        jail: null,
        county_prison: null,
        demographic: null,
    },
    // Current working data
    filteredData: [],
    yearRange: [2017, 2023], // Default range, will be updated
    selectedMetric: DataSourceMetrics['arrest'][0], // Default metric for 'arrest' source
    rankedCounties: [],
    selectedCounty: '',
    selectedDataSource: 'arrest', // Default to the arrest source
    isPerCapita: true, // Default to true 
    selectedCounties: [], // Initialize selected counties as empty array
};

// Helper function to get the correct column name based on data source
const getColumnName = (category: FilterCategory, source: DataSourceType): keyof CsvRow | null => {
    switch (category) {
        case 'gender':
            return 'Gender' as keyof CsvRow; // Both sources use 'Gender'
        case 'age':
            return 'Age' as keyof CsvRow; // Both sources have 'Age'
        case 'crime':
            return 'Offense_category' as keyof CsvRow; // Arrest data uses 'Offense_category'
        case 'race':
            return source === 'arrest' ? 'Race' as keyof CsvRow : null; // Only arrest data has Race
        case 'sentencing':
            return null; // No sentencing data in either source based on column headers
        default:
            return null;
    }
};

// Helper function to get current source data
const getCurrentSourceData = (state: FilterState): CsvRow[] => {
    return state.csvDataSources[state.selectedDataSource];
};

// Helper function to apply filters
const applyFilters = (
    data: CsvRow[],
    activeFilters: FilterState['activeFilters'],
    dataSource: DataSourceType, // Pass the current data source
    selectedCounties: string[] = [] // Add selectedCounties parameter with default empty array
): CsvRow[] => {
    let filtered = data;

    // Apply all active filters
    Object.entries(activeFilters).forEach(([key, activeIds]) => {
        if (key !== 'year' && Array.isArray(activeIds) && activeIds.length > 0) {
            const category = key as FilterCategory;
            const columnName = getColumnName(category, dataSource); // Get the correct column name

            if (columnName) { // Only filter if the column is relevant for the source
                filtered = filtered.filter(row => {
                    const rowValue = row[columnName];
                    // Handle cases where the column might be missing or value is null/undefined
                    return rowValue != null && activeIds.includes(String(rowValue));
                });
            }
        }
    });

    // Apply year filter
    filtered = filtered.filter(row => {
        return row.Year === activeFilters.year;
    });

    // Apply county filter if selectedCounties is not empty
    if (selectedCounties.length > 0) {
        filtered = filtered.filter(row => selectedCounties.includes(row.County));
    }

    return filtered;
};

// NEW FUNCTION: Parse string values to numbers (handles currency and comma formatting)
const parseStringToNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return NaN;

    // Remove currency symbols, commas, quotes, and whitespace, then parse
    const cleaned = value.replace(/[$,"'\s]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : parsed;
};

// NEW FUNCTION: Calculate statewide average for demographic metrics
export const calculateStateWideAverage = (data: CsvRow[], variable: string, year: number): number => {
    const filteredData = data.filter(row => {
        const variableMatch = String(row.Variable).trim() === variable;
        const yearMatch = Number(row.Year) === year;
        const parsedValue = parseStringToNumber(row.Value);
        const hasValidValue = !isNaN(parsedValue) && parsedValue !== null;

        return variableMatch && yearMatch && hasValidValue;
    });

    if (filteredData.length === 0) {
        return 0;
    }

    const sum = filteredData.reduce((acc, row) => acc + parseStringToNumber(row.Value), 0);
    const average = sum / filteredData.length;

    return average;
};

// NEW FUNCTION: Get demographic data for a specific county
export const getCountyDemographicData = (data: CsvRow[], county: string, year: number): Record<string, number> => {
    const countyData = data.filter(row => {
        const countyMatch = String(row.County).trim() === county;
        const yearMatch = Number(row.Year) === year;
        const parsedValue = parseStringToNumber(row.Value);
        const hasValidValue = !isNaN(parsedValue) && parsedValue !== null;

        return countyMatch && yearMatch && hasValidValue;
    });

    const result = countyData.reduce((acc, row) => {
        if (row.Variable) {
            acc[String(row.Variable).trim()] = parseStringToNumber(row.Value);
        }
        return acc;
    }, {} as Record<string, number>);

    return result;
};

// Create async thunk for fetching CSV data based on source
export const fetchDataForSource = createAsyncThunk(
    'filters/fetchDataForSource',
    async (dataSource: DataSourceType, { rejectWithValue }) => {
        try {
            // Load data from Google Sheets or CSV fallback (already parsed as CsvRow[])
            const data = await loadDataSource(dataSource);

            // Return both data and source type so reducer knows where to store it
            return { dataSource, data };
        } catch (error: any) {
            console.error(`❌ [Redux] Failed to fetch ${dataSource}:`, error);
            return rejectWithValue(error.message || `Failed to fetch ${dataSource} data`);
        }
    }
);

export const filterSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        resetFilters: (state) => {
            // Iterate over all keys in activeFilters
            Object.keys(state.activeFilters).forEach(key => {
                // Skip the 'year' key
                if (key === 'year') return;

                const category = key as FilterCategory;

                // Check if the category exists in the main filters state
                if (state.filters[category]) {
                    // Set all filters in this category to inactive
                    state.filters[category].forEach(filter => {
                        filter.isActive = false;
                    });
                    // Clear the active filters list for this category
                    state.activeFilters[category] = [];
                }
            });
            // Clear selected counties
            state.selectedCounties = [];
            // Re-apply filters after resetting (which should now just be the year filter)
            const currentSourceData = getCurrentSourceData(state);
            state.filteredData = applyFilters(currentSourceData, state.activeFilters, state.selectedDataSource, state.selectedCounties);
        },
        setRankedCounties: (state, action: PayloadAction<{ name: string; value: number; rank: number }[]>) => {
            state.rankedCounties = action.payload;
        },
        setSelectedCounty: (state, action: PayloadAction<string>) => {
            state.selectedCounty = action.payload;
        },
        setCsvData: (state, action: PayloadAction<CsvRow[]>) => {
            // Store data in the current selected source slot
            state.csvDataSources[state.selectedDataSource] = action.payload;
            state.filteredData = applyFilters(action.payload, state.activeFilters, state.selectedDataSource, state.selectedCounties);
        },
        toggleFilter: (state, action: PayloadAction<{ category: FilterCategory; filterId: string }>) => {
            const { category, filterId } = action.payload;
            const filter = state.filters[category].find(f => f.id === filterId);

            if (filter) {
                filter.isActive = !filter.isActive;

                // Update activeFilters array for the category
                state.activeFilters[category] = state.filters[category]
                    .filter(f => f.isActive)
                    .map(f => f.id);

                // Update filtered data using helper function
                const currentSourceData = getCurrentSourceData(state);
                state.filteredData = applyFilters(currentSourceData, state.activeFilters, state.selectedDataSource, state.selectedCounties);
            }
        },
        setYear: (state, action: PayloadAction<number>) => {
            state.activeFilters.year = action.payload;
            // Update filtered data using helper function
            const currentSourceData = getCurrentSourceData(state);
            state.filteredData = applyFilters(currentSourceData, state.activeFilters, state.selectedDataSource, state.selectedCounties);
        },
        removeFilter: (state, action: PayloadAction<string>) => {
            const filterId = action.payload;

            // Find and deactivate the filter
            Object.values(state.filters).forEach(categoryFilters => {
                const filter = categoryFilters.find(f => f.id === filterId);
                if (filter) {
                    filter.isActive = false;
                }
            });

            // Update activeFilters
            Object.keys(state.activeFilters).forEach(key => {
                if (key !== 'year') {
                    const category = key as FilterCategory;
                    state.activeFilters[category] = state.filters[category]
                        .filter(f => f.isActive)
                        .map(f => f.id);
                }
            });

            // Update filtered data using helper function
            const currentSourceData = getCurrentSourceData(state);
            state.filteredData = applyFilters(currentSourceData, state.activeFilters, state.selectedDataSource, state.selectedCounties);
        },
        setSelectedMetric: (state, action: PayloadAction<string>) => {
            state.selectedMetric = action.payload;
        },
        setSelectedDataSource: (state, action: PayloadAction<DataSourceType>) => {
            if (state.selectedDataSource !== action.payload) {
                state.selectedDataSource = action.payload;
                // Reset filters or adjust based on the new source if necessary
                // Example: Reset sentencing filter if switching away from 'jail'
                if (action.payload !== 'jail') {
                    state.filters.sentencing.forEach(f => f.isActive = false);
                    state.activeFilters.sentencing = [];
                }
                // Reset other filters potentially? For now, keep them active if possible.

                // Set default metric for the new source
                state.selectedMetric = DataSourceMetrics[action.payload][0];
                // Reset Age filter if switching to a source without it (e.g., jail)
                if (action.payload !== 'arrest') {
                    state.filters.age.forEach(f => f.isActive = false);
                    state.activeFilters.age = [];
                }

                // Reset selected counties when changing data source
                state.selectedCounties = [];

                // Use cached data from the new source (no more fetching!)
                const newSourceData = state.csvDataSources[action.payload];
                state.filteredData = applyFilters(newSourceData, state.activeFilters, action.payload, state.selectedCounties);
                
                // Reset UI state for new source
                state.rankedCounties = [];
                state.selectedCounty = '';
                
                // Update year range if we have data for this source
                if (newSourceData.length > 0) {
                    const years = newSourceData.map(row => row.Year);
                    const uniqueYears = Array.from(new Set(years)).filter(y => y != null).sort((a, b) => a - b);
                    if (uniqueYears.length >= 2) {
                        state.yearRange = [uniqueYears[0], uniqueYears[uniqueYears.length - 1]];
                    } else if (uniqueYears.length === 1) {
                        state.yearRange = [uniqueYears[0], uniqueYears[0]];
                    }
                    // Ensure the current selected year is within the new range
                    state.activeFilters.year = Math.max(state.yearRange[0], Math.min(state.yearRange[1], state.activeFilters.year));
                    // Re-apply filters with potentially adjusted year
                    state.filteredData = applyFilters(newSourceData, state.activeFilters, action.payload, state.selectedCounties);
                }
            }
        },
        // Add reducer for toggling per capita mode
        togglePerCapita: (state) => {
            state.isPerCapita = !state.isPerCapita;
            // Note: We don't need to refilter data here.
            // The per capita calculation happens during visualization processing.
        },
        setSelectedCounties: (state, action: PayloadAction<string[]>) => {
            state.selectedCounties = action.payload;
            // Update filtered data using helper function
            const currentSourceData = getCurrentSourceData(state);
            state.filteredData = applyFilters(currentSourceData, state.activeFilters, state.selectedDataSource, state.selectedCounties);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDataForSource.pending, (state, action) => {
                const dataSource = action.meta.arg;
                state.dataSourcesStatus[dataSource] = 'loading';
                state.dataSourcesErrors[dataSource] = null; // Clear previous errors
            })
            .addCase(fetchDataForSource.fulfilled, (state, action: PayloadAction<{ dataSource: DataSourceType; data: CsvRow[] }>) => {
                const { dataSource, data } = action.payload;
                state.dataSourcesStatus[dataSource] = 'succeeded';

                // Ensure data has Year column, filter out rows without it or with invalid values
                const validData = data.filter(row => {
                    if (!row) return false;
                    return typeof row.Year === 'number' && !isNaN(row.Year);
                });

                // Store data in the specific source slot
                state.csvDataSources[dataSource] = validData;
                state.dataSourcesErrors[dataSource] = null;

                // If this is the currently selected source, update filtered data and year range
                if (dataSource === state.selectedDataSource) {
                    state.filteredData = applyFilters(validData, state.activeFilters, dataSource, state.selectedCounties);

                    // Get min and max years from the data if needed
                    const years = validData.map(row => row.Year);
                    const uniqueYears = Array.from(new Set(years)).filter(y => y != null).sort((a, b) => a - b);
                    if (uniqueYears.length >= 2) {
                        state.yearRange = [uniqueYears[0], uniqueYears[uniqueYears.length - 1]];
                    } else if (uniqueYears.length === 1) {
                        state.yearRange = [uniqueYears[0], uniqueYears[0]];
                    } else {
                        state.yearRange = initialState.yearRange;
                    }
                    // Ensure the current selected year is within the new range
                    state.activeFilters.year = Math.max(state.yearRange[0], Math.min(state.yearRange[1], state.activeFilters.year));
                    // Re-apply filters with potentially adjusted year
                    state.filteredData = applyFilters(validData, state.activeFilters, dataSource, state.selectedCounties);
                }
            })
            .addCase(fetchDataForSource.rejected, (state, action) => {
                const dataSource = action.meta.arg;
                state.dataSourcesStatus[dataSource] = 'failed';
                state.dataSourcesErrors[dataSource] = action.payload as string || `Failed to fetch ${dataSource} data`;
                state.csvDataSources[dataSource] = []; // Clear data on failure
                
                // If this was the currently selected source, clear filtered data
                if (dataSource === state.selectedDataSource) {
                    state.filteredData = [];
                }
            });
    },
});

export const {
    setRankedCounties,
    setSelectedCounty,
    setCsvData,
    toggleFilter,
    setYear,
    removeFilter,
    setSelectedMetric,
    setSelectedDataSource,
    togglePerCapita, // Export the new action
    resetFilters, // Export the new reset action
    setSelectedCounties, // Export the new setSelectedCounties action
} = filterSlice.actions;

// Selectors for aggregate loading states
export const selectDataSourcesStatus = (state: { filters: FilterState }) => state.filters.dataSourcesStatus;
export const selectDataSourcesErrors = (state: { filters: FilterState }) => state.filters.dataSourcesErrors;

export const selectLoadingStats = (state: { filters: FilterState }) => {
    const statuses = state.filters.dataSourcesStatus;
    const allSources: DataSourceType[] = ['arrest', 'jail', 'county_prison', 'demographic'];

    return {
        total: allSources.length,
        loading: allSources.filter(s => statuses[s] === 'loading').length,
        succeeded: allSources.filter(s => statuses[s] === 'succeeded').length,
        failed: allSources.filter(s => statuses[s] === 'failed').length,
        idle: allSources.filter(s => statuses[s] === 'idle').length,
    };
};

export const selectFailedSources = (state: { filters: FilterState }) => {
    const statuses = state.filters.dataSourcesStatus;
    const errors = state.filters.dataSourcesErrors;
    const allSources: DataSourceType[] = ['arrest', 'jail', 'county_prison', 'demographic'];

    return allSources
        .filter(source => statuses[source] === 'failed')
        .map(source => ({
            source,
            error: errors[source],
        }));
};

export const selectIsAllDataLoaded = (state: { filters: FilterState }) => {
    const statuses = state.filters.dataSourcesStatus;
    const allSources: DataSourceType[] = ['arrest', 'jail', 'county_prison', 'demographic'];

    return allSources.every(source => statuses[source] === 'succeeded');
};

export default filterSlice.reducer;
