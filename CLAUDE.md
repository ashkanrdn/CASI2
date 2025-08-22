# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application for visualizing California county-level criminal justice data using interactive maps and charts. The application uses Redux Toolkit for state management, Deck.gl for mapping, and TypeScript throughout.

## Development Commands

### Core Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server

### Notes on Testing and Linting
This project does not currently have configured lint, typecheck, or test scripts. Before making significant changes, verify the build works with `npm run build`.

## Architecture Overview

### State Management (Redux Toolkit)
The application uses Redux with two main slices:

**Filter Slice** (`lib/features/filters/filterSlice.ts`):
- Manages data source selection (arrest, jail, county_prison)
- Handles CSV data fetching and parsing with PapaParse
- Controls filtering by gender, age, race, crime type, sentencing status
- Manages year selection, metric selection, and per capita calculations
- Contains `applyFilters` function that processes raw CSV data
- Uses `fetchDataForSource` async thunk for loading data with Google Drive fallback

**Map Slice** (`lib/features/map/mapSlice.ts`):
- Manages map visualization state
- Stores color scale values for legends
- Handles bar chart data formatting

### Data Flow
1. CSV files in `/public/cleaned/` contain the core datasets:
   - `combined_arrest_df.csv` - Arrest data
   - `combined_jail_df.csv` - Jail population data  
   - `county_prison.csv` - Prison data
   - `demographic.csv` - Demographic data
2. `fetchDataForSource` async thunk loads and parses CSV data via `dataService.ts`
3. `applyFilters` processes raw data based on active filters
4. `enhanceGeoJsonWithData` (via Web Worker) aggregates filtered data by county
5. D3 color scales generate choropleth visualization
6. DeckGL renders the interactive map

### Key Components

**MapStory.tsx** (`app/components/widgets/MapStory.tsx`):
- Core mapping component using DeckGL and react-map-gl
- Uses Web Worker (`dataProcessor.worker.ts`) for data processing to prevent UI blocking
- Handles map interactions and county selection
- Manages color scale calculation with D3
- Includes hover tooltips, metric selection, and per capita toggle

**Layout.tsx** (`app/layout.tsx`):
- Provides Redux Provider wrapper
- Implements responsive navigation
- Routes: /, /history, /map, /data

### Data Processing Architecture
- **Web Worker Integration**: Data aggregation is performed in a Web Worker to prevent blocking the main thread
- **Async Data Loading**: Uses `dataService.ts` for loading with Google Drive integration and local fallback
- **Multi-source Support**: Handles three different data sources (arrest, jail, county_prison) with different schemas
- **Per Capita Calculations**: Uses hardcoded `COUNTY_POPULATION` constant for population-based metrics

### UI Framework
- Tailwind CSS for styling with custom theme extensions
- Shadcn UI components in `app/components/ui/`
- Custom widgets in `app/components/widgets/`
- Framer Motion for animations and transitions
- Mobile-responsive design

### Important Implementation Details
- App Router structure with client-side components marked with 'use client'
- Redux store configured with redux-logger middleware
- TypeScript with custom type definitions for external libraries
- Mapbox GL integration for base map tiles
- D3.js for color scaling and data visualization
- Multi-source data architecture with cached data switching
- Geographic data from `/public/california-counties.geojson`

## Working with Data
- Data is fetched client-side from static CSV files or Google Drive
- PapaParse handles CSV parsing with dynamic typing
- Per capita calculations use hardcoded population data from 2025
- Color scales use D3's scaleSequential for choropleth mapping
- Data filtering supports multiple dimensions: gender, age, race, crime type, year
- Web Worker processes data aggregation to maintain UI responsiveness