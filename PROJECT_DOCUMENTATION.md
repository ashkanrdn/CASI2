# Project Documentation: CASI Data Visualization

## Overview

This project is a web application built with Next.js, TypeScript, and Redux Toolkit to visualize California county-level data related to criminal justice. It uses Deck.gl and Mapbox GL JS to display an interactive choropleth map, allowing users to explore data across different metrics, years, data sources, and demographic filters.

## Core Technologies

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **State Management**: Redux Toolkit
-   **Mapping**: Deck.gl, react-map-gl, Mapbox GL JS
-   **Data Parsing**: PapaParse
-   **Charting/Visualization**: d3 (for color scales)
-   **UI Components**: Custom components + Shadcn UI (`@/app/components/ui/`)
-   **Styling**: Tailwind CSS

## Project Structure

```
.
├── app/                    # Next.js App Router directory
│   ├── api/                # API routes (currently empty)
│   ├── components/         # App-specific React components
│   │   ├── ui/             # UI primitive components (likely Shadcn)
│   │   └── widgets/        # Larger, feature-specific components (MapStory, DataStory)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application page component
│   ├── styles/             # Global styles (if any)
│   ├── types/              # App-specific types (shared.ts, external libs)
│   └── StoreProvider.tsx   # Redux store provider component
├── components/             # Shared components (currently empty)
├── lib/                    # Core logic, state management, utilities
│   ├── features/           # Redux slice definitions
│   │   ├── filters/        # Filter slice logic (filterSlice.ts)
│   │   └── map/            # Map interaction slice logic (mapSlice.ts)
│   ├── utils/              # Utility functions (directory)
│   ├── api.ts              # API related utilities (currently minimal)
│   ├── hooks.ts            # Custom React hooks (likely for Redux)
│   ├── store.ts            # Redux store configuration
│   ├── types.ts            # Core type definitions used across lib
│   └── utils.ts            # Utility functions (file)
├── public/                 # Static assets
│   ├── cleaned/            # Processed CSV data files (young_adult.csv, jail.csv, county_prison.csv)
│   └── california-counties.geojson # GeoJSON for CA county boundaries
├── node_modules/
├── package.json
├── tsconfig.json
└── ... (config files)
```

## Data Handling and State Management

### Data Sources

The application visualizes data from pre-processed CSV files located in `/public/cleaned/`:

1.  `young_adult.csv`: Contains arrest data (potentially combined juvenile/adult).
2.  `jail.csv`: Contains jail population data (ADP - Average Daily Population), including sentencing status.
3.  `county_prison.csv`: Contains county-level imprisonment numbers and associated costs.

A GeoJSON file (`/public/california-counties.geojson`) provides the geographical boundaries for the map visualization.

Static population data for per capita calculations is hardcoded within the `MapStory.tsx` component (`COUNTY_POPULATION`).

### State Management (Redux Toolkit)

Redux Toolkit (`@reduxjs/toolkit`) is used for managing the application state. The store is configured in `lib/store.ts` and comprises two main slices defined in `lib/features/`:

1.  **`filterSlice` (`lib/features/filters/filterSlice.ts`)**:

    -   **Purpose**: Manages all aspects related to data filtering, selection, and the raw/filtered data itself.
    -   **State**:
        -   `selectedDataSource`: The currently active data source (`young_adult`, `jail`, `county_prison`).
        -   `csvData`: The raw data parsed from the selected source's CSV file.
        -   `filters`: Defines available filter options for categories (`gender`, `age`, `crime`, `race`, `sentencing`).
        -   `activeFilters`: Tracks the currently selected filter options for each category and the selected `year`.
        -   `filteredData`: The subset of `csvData` after applying `activeFilters`.
        -   `yearRange`: The min/max years available in the current `csvData`.
        -   `selectedMetric`: The metric chosen for visualization (e.g., 'Count', 'Jail_ADP', 'Imprisonments'). Metrics available depend on `selectedDataSource`.
        -   `isPerCapita`: Boolean flag to toggle per capita calculations.
        -   `rankedCounties`: List of counties ranked by the `selectedMetric` and `isPerCapita` setting.
        -   `selectedCounty`: The county currently selected by the user (e.g., by clicking on the map).
        -   `status`, `error`: For tracking the async data fetching state.
    -   **Async Thunks**:
        -   `fetchDataForSource`: Fetches and parses the relevant CSV file using `fetch` and `PapaParse` when the `selectedDataSource` changes.
    -   **Reducers**: Handle actions for setting/toggling filters, year, metric, data source, per capita flag, selected county, and updating ranked lists. Contains internal logic (`applyFilters`) to recalculate `filteredData` whenever relevant state changes.

2.  **`mapSlice` (`lib/features/map/mapSlice.ts`)**:
    -   **Purpose**: Manages state specifically related to the map's visual representation and interaction, often derived from `filterSlice` state.
    -   **State**:
        -   `selectedCounty`: (Potentially duplicates `filterSlice.selectedCounty` - needs review) The county selected on the map.
        -   `colorScaleValues`: An array of numerical values representing the thresholds/domain of the current map color scale. Used for the map legend.
        -   `barChartData`: Data formatted for a potential bar chart component, derived from the currently processed map data.
    -   **Reducers**: Simple setters to update its state properties.

### Data Flow

1.  The main page (`app/page.tsx`) dynamically loads the `MapStory` component.
2.  `MapStory` mounts and triggers the `fetchDataForSource` thunk (in `filterSlice`) to load the default data source (`young_adult.csv`). It also fetches the base GeoJSON for county boundaries.
3.  `filterSlice` fetches, parses, and stores the CSV data (`csvData`), calculates the initial `filteredData`, and updates the Redux store.
4.  `MapStory` subscribes to the Redux store using `useSelector` to get `filteredData`, `selectedMetric`, `isPerCapita`, etc.
5.  The `enhanceGeoJsonWithData` function within `MapStory` processes the `filteredData`:
    -   Aggregates data per county based on the `selectedMetric`.
    -   Performs per capita calculations if `isPerCapita` is true (using hardcoded population data).
    -   Handles special calculations (e.g., total cost) for specific data sources.
    -   Merges the results into the properties of the GeoJSON features.
6.  A color scale (`d3.scaleQuantile`) is generated based on the processed data values.
7.  `DeckGL` renders the `GeoJsonLayer` using the enhanced GeoJSON features and the color scale for the choropleth effect.
8.  `MapStory` dispatches actions to update `mapSlice` (`colorScaleValues`, `barChartData`) and `filterSlice` (`rankedCounties`).
9.  User interactions (changing data source, toggling filters/year/metric/per capita, clicking counties) dispatch actions to `filterSlice`.
10. `filterSlice` updates its state (potentially re-fetching data) and recalculates `filteredData`.
11. `MapStory` receives the updated state from Redux, re-runs `enhanceGeoJsonWithData`, recalculates the color scale, and re-renders the map. Map-related state (`mapSlice`) is updated accordingly.

## Main Functions and Components

-   **`app/page.tsx`**:
    -   Entry point for the map visualization UI.
    -   Dynamically loads `MapStory` to enable client-side rendering for map interactions.
-   **`app/components/widgets/MapStory.tsx`**:
    -   The core component responsible for rendering the interactive map.
    -   Uses `DeckGL` and `react-map-gl`.
    -   Fetches GeoJSON data.
    -   Connects to the Redux store (`useSelector`, `useDispatch`) to get filtered data and dispatch actions.
    -   Contains the crucial `enhanceGeoJsonWithData` function for processing data and merging it with GeoJSON features.
    -   Calculates color scales using `d3`.
    -   Handles map interactions (hover, click, zoom).
    -   Renders UI controls (metric selection, per capita switch).
-   **`lib/features/filters/filterSlice.ts`**:
    -   Defines the state structure and logic for data filtering and selection.
    -   Includes the `fetchDataForSource` async thunk for data loading.
    -   Contains the `applyFilters` helper function to generate `filteredData`.
-   **`lib/features/map/mapSlice.ts`**:
    -   Manages map-specific UI state derived from the main data processing.
-   **`lib/store.ts`**:
    -   Configures the Redux store, combining the slices and adding middleware (like `redux-logger`).
-   **`enhanceGeoJsonWithData` (in `MapStory.tsx`)**:
    -   A key processing function that aggregates `filteredData` by county based on selected metric/source/per capita settings and joins it with the GeoJSON shapes.
-   **`applyFilters` (in `filterSlice.ts`)**:
    -   A key helper function within the filter slice that applies the currently active filters and year selection to the raw `csvData`.

## Component Interaction

-   `page.tsx` renders `MapStory.tsx`.
-   `MapStory.tsx` interacts heavily with the Redux store (`filterSlice` and `mapSlice`) both for reading state (`useSelector`) and dispatching actions (`useDispatch`) based on user input or internal calculations.
-   Changes in `filterSlice` (e.g., new `filteredData`) trigger re-renders and data re-processing within `MapStory.tsx`.
-   `MapStory.tsx` updates `mapSlice` state (e.g., `colorScaleValues`) based on its internal calculations, which could potentially be used by other components (like a legend or chart) if they were present and subscribed to `mapSlice`.
-   UI elements within `MapStory.tsx` (buttons, switches) dispatch actions to `filterSlice` to modify the filtering criteria.

## Future Development / Considerations

-   **`DataStory` Component**: The commented-out `DataStory` component in `page.tsx` suggests planned functionality, possibly detailed views or narratives related to the selected data/county.
-   **API Routes**: The `app/api/` directory is empty. Data fetching currently relies on static CSVs in `/public`. Future development might involve fetching data from a live API.
-   **Error Handling**: Robust error handling for data fetching and processing should be reviewed.
-   **Performance**: For larger datasets, the client-side processing in `enhanceGeoJsonWithData` might become a bottleneck. Consider optimizations or server-side processing.
-   **Code Duplication**: Review potential state duplication (e.g., `selectedCounty` in both slices).
-   **Hardcoded Data**: `COUNTY_POPULATION` is hardcoded. This should ideally come from a data source or configuration.
-   **Testing**: Add unit and integration tests for Redux slices and component logic.
