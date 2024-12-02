import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { CsvRow } from '@/app/types/shared';
import Papa from 'papaparse';

export interface Filter {
    id: string;
    label: string;
    isActive: boolean;
}

export type FilterCategory = 'gender' | 'age' | 'crime' | 'race';

export enum MetricType {
    Arrests = 'Arrests',
    Imprisonments = 'Imprisonments',
    Population = 'Population18-69',
    Cost = 'CostPerInmate',
}

export interface FilterState {
    filters: Record<FilterCategory, Filter[]>;
    activeFilters: {
        gender: string[];
        age: string[];
        crime: string[];
        race: string[];
        year: number;
    };
    csvData: CsvRow[];
    filteredData: CsvRow[];
    yearRange: [number, number];
    selectedMetric: MetricType;
    rankedCounties: { name: string; value: number; rank: number }[];
    selectedCounty: string;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const INITIAL_FILTERS: Record<FilterCategory, Filter[]> = {
    gender: [
        { id: 'Female', label: 'Female', isActive: false },
        { id: 'Male', label: 'Male', isActive: false },
    ],
    age: [
        { id: 'Adult prisoners', label: 'Adults', isActive: false },
        { id: 'Juvenile prisoners', label: 'Juvenile', isActive: false },
    ],
    crime: [
        { id: 'Violent', label: 'Violent', isActive: false },
        { id: 'Property', label: 'Property', isActive: false },
        { id: 'Drug', label: 'Drug', isActive: false },
        { id: 'PublicOrder', label: 'Public Order', isActive: false },
        { id: 'Other', label: 'Other', isActive: false },
    ],
    race: [
        { id: 'Black', label: 'Black', isActive: false },
        { id: 'Hispanic', label: 'Hispanic', isActive: false },
        { id: 'White', label: 'White', isActive: false },
        { id: 'Asian/other', label: 'Asian/Other', isActive: false },
    ],
};

const initialState: FilterState = {
    filters: INITIAL_FILTERS,
    activeFilters: {
        gender: [],
        age: [],
        crime: [],
        race: [],
        year: 2017,
    },
    csvData: [],
    filteredData: [],
    yearRange: [2017, 2023],
    selectedMetric: MetricType.Arrests,
    rankedCounties: [],
    selectedCounty: '',
    status: 'idle',
    error: null,
};

// Helper function to apply filters
const applyFilters = (
    data: CsvRow[],
    activeFilters: FilterState['activeFilters']
): CsvRow[] => {
    let filtered = data;

    // Apply all active filters
    Object.entries(activeFilters).forEach(([key, activeIds]) => {
        if (key !== 'year' && Array.isArray(activeIds) && activeIds.length > 0) {
            filtered = filtered.filter(row => {
                switch (key as FilterCategory) {
                    case 'gender':
                        return activeIds.includes(row.Sex);
                    case 'age':
                        return activeIds.includes(row.Status);
                    case 'crime':
                        return activeIds.includes(row.OffenseCat);
                    case 'race':
                        return activeIds.includes(row.Race);
                    default:
                        return true;
                }
            });
        }
    });

    // Apply year filter
    filtered = filtered.filter(row => row.Year === activeFilters.year);

    return filtered;
};

// Create async thunk for fetching CSV data
export const fetchCsvData = createAsyncThunk(
    'filters/fetchCsvData',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/casidata.csv');
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
            return rejectWithValue('Failed to fetch CSV data');
        }
    }
);

export const filterSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {

        setRankedCounties: (state, action: PayloadAction<{ name: string; value: number; rank: number }[]>) => {
            state.rankedCounties = action.payload;
        },
        setSelectedCounty: (state, action: PayloadAction<string>) => {
            state.selectedCounty = action.payload;
        },
        setCsvData: (state, action: PayloadAction<CsvRow[]>) => {
            state.csvData = action.payload;
            state.filteredData = applyFilters(action.payload, state.activeFilters);

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
                state.filteredData = applyFilters(state.csvData, state.activeFilters);
            }
        },
        setYear: (state, action: PayloadAction<number>) => {
            state.activeFilters.year = action.payload;
            // Update filtered data using helper function
            state.filteredData = applyFilters(state.csvData, state.activeFilters);
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
            state.filteredData = applyFilters(state.csvData, state.activeFilters);
        },
        setSelectedMetric: (state, action: PayloadAction<MetricType>) => {
            state.selectedMetric = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCsvData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCsvData.fulfilled, (state, action: PayloadAction<CsvRow[]>) => {
                state.status = 'succeeded';
                state.csvData = action.payload;
                state.filteredData = applyFilters(action.payload, state.activeFilters);
                state.error = null;

                // Get min and max years from the data if needed
                const years = action.payload.map(row => row.Year);
                const uniqueYears = Array.from(new Set(years)).sort();
                if (uniqueYears.length >= 2) {
                    state.yearRange = [uniqueYears[0], uniqueYears[uniqueYears.length - 1]];
                }
            })
            .addCase(fetchCsvData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string || 'Failed to fetch data';
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
} = filterSlice.actions;

export default filterSlice.reducer;
