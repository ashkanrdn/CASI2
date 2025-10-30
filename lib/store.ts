import { configureStore } from "@reduxjs/toolkit";
import filterReducer from './features/filters/filterSlice';
import mapReducer from './features/map/mapSlice';
import logger from 'redux-logger';

const defaultMiddlewareConfig = {
  serializableCheck: {
    ignoredPaths: ['pdf.data'],
  }
};

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    map: mapReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware(defaultMiddlewareConfig);
    // Only add redux-logger in development mode
    if (process.env.NODE_ENV === 'development') {
      return middleware.concat(logger);
    }
    return middleware;
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



