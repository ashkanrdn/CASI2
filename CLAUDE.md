# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build production version
npm run build

# Start production server
npm start

# TypeScript type checking (manual)
npx tsc --noEmit
```

## Tech Stack & Architecture

This is a **Next.js 14+ App Router** application with TypeScript that visualizes California criminal justice data through interactive maps and dashboards.

**Core Technologies:**
- **Frontend**: Next.js (App Router), React 18, TypeScript
- **State Management**: Redux Toolkit with redux-logger
- **Mapping**: Deck.gl, react-map-gl, Mapbox GL JS
- **Data Processing**: PapaParse for CSV parsing, Web Workers for heavy calculations
- **UI**: Tailwind CSS, Radix UI components, custom component system
- **Animation**: Framer Motion for smooth transitions

## Key Architecture Patterns

### Redux State Management
The app uses two main Redux slices:

1. **`filterSlice`** (`lib/features/filters/filterSlice.ts`):
   - Manages CSV data loading via `fetchDataForSource` async thunk
   - Handles filtering by demographics (gender, age, crime, race, sentencing), year, and counties
   - Supports 3 data sources: `arrest`, `jail`, `county_prison`
   - Applies filters via `applyFilters` helper function
   - Tracks `selectedMetric`, `isPerCapita`, `rankedCounties`

2. **`mapSlice`** (`lib/features/map/mapSlice.ts`):
   - Manages map-specific UI state (color scales, bar chart data)
   - Derived from filter slice data

### Data Processing Architecture
- **Web Worker**: Heavy data processing happens in `app/components/workers/dataProcessor.worker.ts`
- **CSV Data**: Static files in `/public/cleaned/` (combined_arrest_df.csv, combined_jail_df.csv, county_prison.csv)
- **GeoJSON**: California counties from `/public/california-counties.geojson`
- **Population Data**: Hardcoded in `COUNTY_POPULATION` constant in MapStory.tsx

### Component Structure
- **`app/page.tsx`**: Main entry point, dynamically loads MapStory
- **`app/components/widgets/MapStory.tsx`**: Core map component (~1000 lines)
  - Manages Deck.gl layers and Mapbox integration
  - Handles user interactions (hover, click, metric selection)
  - Coordinates with web worker for data processing
  - Implements smooth animations with Framer Motion
- **`app/components/ui/`**: Radix UI-based component library
- **`app/layout.tsx`**: Root layout with responsive sidebar management

### Data Flow Pattern
1. User selects data source → `fetchDataForSource` thunk loads CSV
2. Filters applied → `applyFilters` creates `filteredData`
3. MapStory sends data to web worker → processes enhanced GeoJSON
4. Worker returns processed features → map renders with D3 color scales
5. User interactions update Redux state → triggers re-processing

## Key Files to Understand

- **`lib/features/filters/filterSlice.ts`**: Core business logic for data filtering
- **`app/components/widgets/MapStory.tsx`**: Main visualization component
- **`app/components/workers/dataProcessor.worker.ts`**: Heavy computation offloading
- **`lib/store.ts`**: Redux store configuration
- **`app/types/shared.ts`**: Core TypeScript interfaces (CsvRow with flexible schema)
- **`lib/content.ts`**: Content management system for markdown files with frontmatter parsing

## Data Source Configuration

Each data source has specific metrics defined in `DataSourceMetrics`:
```typescript
arrest: ['Arrest_rate', 'Total_Arrests']
jail: ['ADPtotal', 'Felony', 'Misd', 'Postdisp', 'Predisp']
county_prison: ['Imprisonments', 'Total_Cost']
```

## Performance Considerations

- **Web Workers**: Use for data-heavy operations to avoid blocking UI
- **Memoization**: Heavy use of `useMemo` and `useCallback` in MapStory
- **Animation Delays**: Loading indicators appear after 500ms delay
- **Color Transitions**: Smooth map color changes with 400ms duration

## Mobile Responsiveness

- Sidebar management in `app/layout.tsx` with mobile overlays
- Expandable metric buttons in MapStory with AnimatePresence
- Hidden description box on mobile (`hidden md:block`)

## Content Management System

The app includes a flexible content management system for markdown files:
- **Content Location**: Static files in `/public/content/` or external URL via `NEXT_PUBLIC_EXTERNAL_CONTENT_URL`
- **Frontmatter Support**: YAML frontmatter parsing for metadata (title, order, visibility)
- **Dynamic Loading**: Content fetched at runtime with 5-minute cache
- **External Sources**: Supports GitHub raw URLs, Google Drive, or custom endpoints

## Environment Configuration

- **External Content**: Set `NEXT_PUBLIC_EXTERNAL_CONTENT_URL` to load content from external sources
- **TypeScript Paths**: Uses `@/*` alias for root-level imports
- **Tailwind**: Custom CSS variables for theming in `globals.css`

## Development Notes

- **Mapbox Token**: Uses hardcoded token in MapStory (consider environment variable)
- **Population Data**: Hardcoded `COUNTY_POPULATION` should ideally come from data source
- **Error Handling**: Limited error boundaries - consider adding more robust error handling
- **Testing**: No test suite present - consider adding unit tests for Redux slices
- **Type Safety**: Flexible CsvRow interface accommodates varied CSV schemas across data sources