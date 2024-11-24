









import { CasiData } from '@/lib/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MapState {
    rawData: CasiData[];
    filteredData: CasiData[];
    filters: {
        gender: string[];
        age: string[];
        crime: string[];
        race: string[];
        year: number;
    };
}

const initialState: MapState = {
    rawData: [],
    filteredData: [],
    filters: {
        gender: [],
        age: [],
        crime: [],
        race: [],
        year: 2023
    }
};

const mapDataSlice = createSlice({
    name: 'mapData',
    initialState,
    reducers: {
        setRawData: (state, action: PayloadAction<CasiData[]>) => {
            state.rawData = action.payload;
            state.filteredData = filterCasiData(action.payload, state.filters);
        },
        updateFilters: (state, action: PayloadAction<Partial<CasiState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
            state.filteredData = filterCasiData(state.rawData, state.filters);
        },
        setYear: (state, action: PayloadAction<number>) => {
            state.filters.year = action.payload;
            state.filteredData = filterCasiData(state.rawData, state.filters);
        },
        toggleFilter: (state, action: PayloadAction<{ type: keyof CasiState['filters']; value: string }>) => {
            const { type, value } = action.payload;
            if (type === 'year') return; // year is handled separately

            const filterArray = state.filters[type];
            const index = filterArray.indexOf(value);

            if (index === -1) {
                filterArray.push(value);
            } else {
                filterArray.splice(index, 1);
            }

            state.filteredData = filterCasiData(state.rawData, state.filters);
        }
    }
});

export const { setRawData, updateFilters, setYear, toggleFilter } = casiDataSlice.actions;
export default casiDataSlice.reducer;
