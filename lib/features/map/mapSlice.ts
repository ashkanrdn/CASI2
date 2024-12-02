import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MapState {
    selectedCounty: string;
    colorScaleValues: number[];
    barChartData: { county: string; value: number }[];
}

const initialState: MapState = {
    selectedCounty: '',
    colorScaleValues: [],
    barChartData: [],
};

export const mapSlice = createSlice({
    name: 'map',
    initialState,
    reducers: {
        setSelectedCounty: (state, action: PayloadAction<string>) => {
            state.selectedCounty = action.payload;
        },
        setColorScaleValues: (state, action: PayloadAction<number[]>) => {
            state.colorScaleValues = action.payload;
        },
        setBarChartData: (state, action: PayloadAction<{ county: string; value: number }[]>) => {
            state.barChartData = action.payload;
        },
    },
});

export const { setSelectedCounty, setColorScaleValues, setBarChartData } = mapSlice.actions;
export default mapSlice.reducer;
