# Project Overview

This is a Next.js application that provides a data visualization dashboard for exploring California's criminal justice data. The application is called the "California Sentencing Institute" (CASI).

The main technologies used are:

*   **Frontend:** Next.js, React, TypeScript
*   **State Management:** Redux Toolkit
*   **Data Visualization:** Deck.gl, Mapbox, Nivo
*   **UI:** Shadcn/UI, Radix UI, Tailwind CSS
*   **Data Parsing:** Papaparse

The application allows users to explore various datasets related to California's criminal justice system, including arrest records, jail populations, and prison costs. The data is visualized on an interactive map of California counties, and users can filter the data by various criteria such as gender, age, crime type, race, and year.

# Building and Running

To build and run the project, use the following commands:

*   **Development:** `pnpm dev`
*   **Build:** `pnpm build`
*   **Start:** `pnpm start`

**Note:** This project uses `pnpm` for package management.

# Development Conventions

*   **State Management:** The application uses Redux Toolkit for state management. The Redux store is organized into two slices: `filters` and `map`. The `filters` slice manages all the data filtering logic, while the `map` slice manages the state of the map itself.
*   **Data Fetching:** Data is fetched from CSV files using a custom data service and `createAsyncThunk`. The data is then parsed using `papaparse`.
*   **Data Processing:** Heavy data processing is offloaded to a web worker to keep the UI responsive.
*   **UI Components:** The application uses a combination of custom UI components and components from Shadcn/UI and Radix UI.
*   **Styling:** Styling is done using Tailwind CSS.
*   **Code Structure:** The application follows a standard Next.js project structure. The main application code is located in the `app` directory. Reusable components are located in the `app/components` directory. Redux-related code is located in the `lib` directory.
*   **Mobile Responsiveness:** The application is responsive and has a mobile-friendly layout. It uses `useState` to manage the open/closed state of the sidebars on mobile, and Tailwind CSS classes for transformations and transitions.

# Data Flow

1.  The `MapStory` component mounts and triggers the `fetchDataForSource` thunk in the `filterSlice` to load the default data source.
2.  The `filterSlice` fetches, parses, and stores the CSV data, calculates the initial `filteredData`, and updates the Redux store.
3.  The `MapStory` component subscribes to the Redux store to get the `filteredData`, `selectedMetric`, `isPerCapita`, etc.
4.  The `enhanceGeoJsonWithData` function in the `dataProcessor.worker.ts` web worker processes the `filteredData`, aggregates it by county, performs per capita calculations, and merges the results into the properties of the GeoJSON features.
5.  A color scale is generated based on the processed data values.
6.  `DeckGL` renders the `GeoJsonLayer` using the enhanced GeoJSON features and the color scale.
7.  User interactions dispatch actions to the `filterSlice`.
8.  The `filterSlice` updates its state and recalculates the `filteredData`.
9.  The `MapStory` component receives the updated state from Redux, re-runs the data processing in the web worker, recalculates the color scale, and re-renders the map.