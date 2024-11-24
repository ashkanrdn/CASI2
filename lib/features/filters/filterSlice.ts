import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CsvRow } from '@/app/types/shared';

export interface Filter {
    id: string;
    label: string;
    isActive: boolean;
}

export type FilterCategory = 'gender' | 'age' | 'crime' | 'race';

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
};

export const filterSlice = createSlice({
    name: 'filters',
    initialState,
    reducers: {
        setCsvData: (state, action: PayloadAction<CsvRow[]>) => {
            state.csvData = action.payload;
            state.filteredData = action.payload;
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

                // Update filtered data
                let filtered = state.csvData;

                // Apply all active filters
                Object.entries(state.activeFilters).forEach(([key, activeIds]) => {
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
                filtered = filtered.filter(row => row.Year === state.activeFilters.year);

                state.filteredData = filtered;
            }
        },
        setYear: (state, action: PayloadAction<number>) => {
            state.activeFilters.year = action.payload;

            // Update filtered data with new year
            let filtered = state.csvData.filter(row => row.Year === action.payload);

            // Apply existing filters
            Object.entries(state.activeFilters).forEach(([key, activeIds]) => {
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

            state.filteredData = filtered;
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

            // Update filtered data
            let filtered = state.csvData;

            // Apply remaining filters
            Object.entries(state.activeFilters).forEach(([key, activeIds]) => {
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
            filtered = filtered.filter(row => row.Year === state.activeFilters.year);

            state.filteredData = filtered;
        },
    },
});

export const {
    setCsvData,
    toggleFilter,
    setYear,
    removeFilter,
} = filterSlice.actions;

export default filterSlice.reducer;
