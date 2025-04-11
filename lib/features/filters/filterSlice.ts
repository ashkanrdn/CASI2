import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { CsvRow } from '@/app/types/shared'; // Import the updated type
import Papa from 'papaparse';

// Define supported data sources
export type DataSourceType = 'young_adult' | 'jail' | 'county_prison' //|'demographic'; // Updated sources


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
    young_adult: ['Count'], // Represents arrests for the combined file
    jail: ['Jail_ADP'], // Average Daily Population
    county_prison: ['Imprisonments', 'Total_Cost'], // Renamed Cost metric
    //demographic: ['Population_age_10_17', 'Poverty_rate_age_12_17'], // Add demographic metrics
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
    csvData: CsvRow[];
    filteredData: CsvRow[];
    yearRange: [number, number];
    selectedMetric: string; // Use string for flexibility
    rankedCounties: { name: string; value: number; rank: number }[];
    selectedCounty: string;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    selectedDataSource: DataSourceType; // Add selected data source
    isPerCapita: boolean; // Add per capita toggle state
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
        { id: 'PublicOrder', label: 'Public Order', isActive: false },
        { id: 'StatusOffense', label: 'Status Offense', isActive: false },
        { id: 'Misdemeanors', label: 'Misdemeanors', isActive: false },
        { id: 'Felony', label: 'Felony', isActive: false },
        { id: 'Other', label: 'Other', isActive: false },
    ],
    race: [
        { id: 'Black', label: 'Black', isActive: false },
        { id: 'Latinx', label: 'Latinx', isActive: false },
        { id: 'White', label: 'White', isActive: false },
        { id: 'Asian/other', label: 'Asian/Other', isActive: false },
    ],
    // Add sentencing status filters (relevant for jail.csv)
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
        year: 2017, // Default year
    },
    csvData: [],
    filteredData: [],
    yearRange: [2017, 2023], // Default range, will be updated
    selectedMetric: DataSourceMetrics['young_adult'][0], // Default metric for 'young_adult' source
    rankedCounties: [],
    selectedCounty: '',
    status: 'idle',
    error: null,
    selectedDataSource: 'young_adult', // Default to the combined source
    isPerCapita: false, // Default to false
};

// Helper function to get the correct column name based on data source
const getColumnName = (category: FilterCategory, source: DataSourceType): keyof CsvRow | null => {
    switch (category) {
        case 'gender':
            return (source === 'jail' ? 'Sex' : 'Gender') as keyof CsvRow;
        case 'age':
            return 'Age' as keyof CsvRow;
        case 'crime':
            return 'Offense_Category' as keyof CsvRow;
        case 'race':
            return 'Race' as keyof CsvRow;
        case 'sentencing':
            return source === 'jail' ? 'Sentencing status' as keyof CsvRow : null;
        default:
            return null;
    }
};

// Helper function to apply filters
const applyFilters = (
    data: CsvRow[],
    activeFilters: FilterState['activeFilters'],
    dataSource: DataSourceType // Pass the current data source
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
    filtered = filtered.filter(row => row.Year === activeFilters.year);

    return filtered;
};

// Create async thunk for fetching CSV data based on source
export const fetchDataForSource = createAsyncThunk(
    'filters/fetchDataForSource',
    async (dataSource: DataSourceType, { rejectWithValue }) => {
        try {
            const response = await fetch(`/cleaned/${dataSource}.csv`); // Fetch based on dataSource
            const csvText = await response.text();

            return new Promise<CsvRow[]>((resolve, reject) => {
                Papa.parse<CsvRow>(csvText, {
                    header: true,
                    dynamicTyping: true,
                    complete: (results) => {
                        resolve(results.data);
                    },
                    error: (error: Error) => {
                        reject(error);
                    },
                });
            });
        } catch (error) {
            return rejectWithValue(`Failed to fetch ${dataSource}.csv data`);
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
            // Re-apply filters after resetting (which should now just be the year filter)
            state.filteredData = applyFilters(state.csvData, state.activeFilters, state.selectedDataSource);
        },
        setRankedCounties: (state, action: PayloadAction<{ name: string; value: number; rank: number }[]>) => {
            state.rankedCounties = action.payload;
        },
        setSelectedCounty: (state, action: PayloadAction<string>) => {
            state.selectedCounty = action.payload;
        },
        setCsvData: (state, action: PayloadAction<CsvRow[]>) => {
            state.csvData = action.payload;
            state.filteredData = applyFilters(action.payload, state.activeFilters, state.selectedDataSource);

            // // Get min and max years from the data
            // const years = action.payload.map(row => row.Year);

            // const minYear = years[0];
            // const maxYear = years[years.length - 1];


            // state.yearRange = [minYear, maxYear];

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
                state.filteredData = applyFilters(state.csvData, state.activeFilters, state.selectedDataSource);
            }
        },
        setYear: (state, action: PayloadAction<number>) => {
            state.activeFilters.year = action.payload;
            // Update filtered data using helper function
            state.filteredData = applyFilters(state.csvData, state.activeFilters, state.selectedDataSource);
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
            state.filteredData = applyFilters(state.csvData, state.activeFilters, state.selectedDataSource);
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
                if (action.payload !== 'young_adult') {
                    state.filters.age.forEach(f => f.isActive = false);
                    state.activeFilters.age = [];
                }

                // Reset data and status before fetching new data
                state.csvData = [];
                state.filteredData = [];
                state.status = 'idle'; // Trigger fetching in component or dispatch thunk here
                state.error = null;
                // Consider resetting rankedCounties and selectedCounty as well
                state.rankedCounties = [];
                state.selectedCounty = '';
            }
        },
        // Add reducer for toggling per capita mode
        togglePerCapita: (state) => {
            state.isPerCapita = !state.isPerCapita;
            // Note: We don't need to refilter data here.
            // The per capita calculation happens during visualization processing.
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDataForSource.pending, (state) => {
                state.status = 'loading';
                state.error = null; // Clear previous errors
            })
            .addCase(fetchDataForSource.fulfilled, (state, action: PayloadAction<CsvRow[]>) => {
                state.status = 'succeeded';
                // Ensure data has Year, filter out rows without it or with invalid values
                const validData = action.payload.filter(row => row && typeof row.Year === 'number' && !isNaN(row.Year));
                state.csvData = validData;
                // state.filteredData = applyFilters(action.payload, state.activeFilters);
                state.filteredData = applyFilters(validData, state.activeFilters, state.selectedDataSource);
                state.error = null;

                // Get min and max years from the data if needed
                // const years = action.payload.map(row => row.Year);
                const years = validData.map(row => row.Year);
                // const uniqueYears = Array.from(new Set(years)).sort();
                const uniqueYears = Array.from(new Set(years)).filter(y => y != null).sort((a, b) => a - b); // Filter null/undefined and sort
                if (uniqueYears.length >= 2) {
                    state.yearRange = [uniqueYears[0], uniqueYears[uniqueYears.length - 1]];
                } else if (uniqueYears.length === 1) {
                    // If only one year, set range start and end to the same year
                    state.yearRange = [uniqueYears[0], uniqueYears[0]];
                } else {
                    // Fallback if no valid years found
                    state.yearRange = initialState.yearRange;
                }
                // Ensure the current selected year is within the new range
                state.activeFilters.year = Math.max(state.yearRange[0], Math.min(state.yearRange[1], state.activeFilters.year));
                // Re-apply filters with potentially adjusted year
                state.filteredData = applyFilters(validData, state.activeFilters, state.selectedDataSource);

            })
            .addCase(fetchDataForSource.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string || `Failed to fetch ${state.selectedDataSource}.csv data`;
                state.csvData = []; // Clear data on failure
                state.filteredData = [];
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
} = filterSlice.actions;

export default filterSlice.reducer;
