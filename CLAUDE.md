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
- Manages data source selection (young_adult, jail, county_prison)
- Handles CSV data fetching and parsing with PapaParse
- Controls filtering by gender, age, race, crime type, sentencing status
- Manages year selection, metric selection, and per capita calculations
- Contains `applyFilters` function that processes raw CSV data

**Map Slice** (`lib/features/map/mapSlice.ts`):
- Manages map visualization state
- Stores color scale values for legends
- Handles bar chart data formatting

### Data Flow
1. CSV files in `/public/cleaned/` contain the core datasets
2. `fetchDataForSource` async thunk loads and parses CSV data
3. `applyFilters` processes raw data based on active filters
4. `enhanceGeoJsonWithData` (in MapStory.tsx) aggregates filtered data by county
5. D3 color scales generate choropleth visualization
6. DeckGL renders the interactive map

### Key Components

**MapStory.tsx** (`app/components/widgets/MapStory.tsx`):
- Core mapping component using DeckGL and react-map-gl
- Contains `enhanceGeoJsonWithData` function for data aggregation
- Handles map interactions and county selection
- Manages color scale calculation with D3

**Layout.tsx** (`app/layout.tsx`):
- Provides Redux Provider wrapper
- Implements responsive navigation with mobile sidebar management
- Routes: /, /history, /map, /data

### Data Sources
- `/public/cleaned/combined_arrest_df.csv` - Arrest data
- `/public/cleaned/combined_jail_df.csv` - Jail population data  
- `/public/cleaned/county_prison.csv` - Prison data
- `/public/california-counties.geojson` - County boundaries
- Hardcoded population data in `COUNTY_POPULATION` constant

### UI Framework
- Tailwind CSS for styling with custom theme extensions
- Shadcn UI components in `app/components/ui/`
- Custom widgets in `app/components/widgets/`
- Mobile-responsive design with sidebar overlays

## Working with Data
- Data is fetched client-side from static CSV files
- PapaParse handles CSV parsing
- Per capita calculations use hardcoded population data
- Color scales use D3's scaleQuantile for choropleth mapping

## Important Implementation Details
- App Router structure with client-side components marked with 'use client'
- Redux store configured with redux-logger middleware
- TypeScript with custom type definitions for external libraries
- Mobile responsiveness handled through Tailwind classes and React state