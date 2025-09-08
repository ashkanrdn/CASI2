import { configureStore } from "@reduxjs/toolkit";
import filterReducer from './features/filters/filterSlice';
import mapReducer from './features/map/mapSlice';
import appReducer from './features/app/appSlice';
import logger from 'redux-logger';

const defaultMiddlewareConfig = {
  serializableCheck: {
    ignoredPaths: ['pdf.data', 'app.geojsonData'],
  }
};
export const store = configureStore({
  reducer: {
    app: appReducer,
    filters: filterReducer,
    map: mapReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(defaultMiddlewareConfig).concat(logger)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



