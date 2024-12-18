import { configureStore } from "@reduxjs/toolkit";
import filterReducer from './features/filters/filterSlice';
import mapReducer from './features/map/mapSlice';

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    map: mapReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



