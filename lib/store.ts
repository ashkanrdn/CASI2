import { configureStore } from "@reduxjs/toolkit";
import logger from 'redux-logger';
import filterReducer from './features/filters/filterSlice';

export const store = configureStore({
  reducer: {
    filters: filterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



