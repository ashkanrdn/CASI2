# CASI2 - California Criminal Justice Data Platform

A Next.js application for visualizing and analyzing California criminal justice data, including arrest, jail, county prison, and demographic data.

## Features

- **Interactive Map Visualization**: Explore criminal justice data by county
- **Multiple Data Sources**: Arrest, Jail, County Prison, and Demographic data
- **Advanced Filtering**: Filter by gender, race, age, and other demographic factors
- **Google Sheets Integration**: Real-time data from Google Sheets API with CSV fallback
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Google Cloud Project with Sheets API enabled
- Google Sheets API key (restricted to Sheets API only)
- Google Spreadsheet with data sources configured

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Google Sheets API Configuration
# Get API key from: https://console.cloud.google.com/apis/credentials
# Enable Google Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com

# Your Google Sheets API key (restrict to Sheets API only)
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key_here

# Your spreadsheet ID (from the URL: docs.google.com/spreadsheets/d/{ID}/edit)
NEXT_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id_here
```

### 3. Get Your Google Sheets API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Sheets API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Google Sheets API"
   - Click **Enable**
4. Create credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy the API key
5. Restrict the API key (recommended):
   - Click the API key to edit
   - Under **API restrictions**, select **Restrict key**
   - Check **Google Sheets API**
   - Under **Application restrictions** (optional), add your domain

### 4. Get Your Spreadsheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Copy the ID between `/d/` and `/edit`

### 5. Configure Your Google Sheet

Your Google Sheet must have these tabs:
- **arrest**: County-level arrest data
- **jail**: Jail population data
- **county_prison**: Prison data
- **demographic**: Census/demographic data

Each tab should have:
- Row 1: Column headers (County, Year, etc.)
- Row 2+: Data rows

**Important**: Make sure your spreadsheet is publicly viewable:
- Click **Share** ? **Anyone with the link can view**

### 6. Run Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Data Flow

```
Browser
  ?
Google Sheets API v4 (native fetch)
  ?
sheetsService.ts (transform to CsvRow[])
  ?
dataService.ts (caching + fallback)
  ?
Redux Store
  ?
React Components
```

### Primary Data Source

The app fetches data directly from Google Sheets API:
- **Primary**: Google Sheets API (real-time, no CSV parsing needed)
- **Fallback**: Local CSV files (if API fails or offline)

### Caching

- Data is cached for **5 minutes** to reduce API calls
- Cache is cleared automatically after timeout
- Cache keys: `datasource_{sourceType}` (e.g., `datasource_arrest`)

## Data Sources Configuration

The app expects `public/data-sources.json` with the following structure:

```json
{
  "version": "2.0",
  "lastUpdated": "2025-10-29T00:00:00Z",
  "dataSources": {
    "arrest": {
      "displayName": "Arrest Data",
      "description": "California county-level arrest data",
      "sheetName": "arrest",
      "range": "A:Z",
      "localFallback": "/cleaned/combined_arrest_df.csv",
      "type": "sheets"
    }
  },
  "settings": {
    "retryAttempts": 2,
    "retryDelay": 1000,
    "cacheTimeout": 300000,
    "fallbackEnabled": true
  }
}
```

## Troubleshooting

### "Failed to fetch from Google Sheets"

**Possible causes:**
- `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` not set or incorrect
- Google Sheets API not enabled in Cloud Console
- Spreadsheet is not publicly viewable
- Invalid spreadsheet ID

**Solutions:**
1. Check `.env.local` file exists and has correct values
2. Verify API key works: `curl "https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/arrest!A1:Z10?key={API_KEY}"`
3. Make spreadsheet public: Share ? Anyone with link can view
4. Check browser console for detailed error messages

### "Rate limit exceeded (429)"

**Cause**: Google Sheets API free tier has a limit of 300 requests/minute.

**Solutions:**
- The app automatically retries with exponential backoff
- Data is cached for 5 minutes to reduce API calls
- If persistent, consider upgrading your Google Cloud quota

### Map Not Rendering

**Possible causes:**
- Data not loaded
- Browser console errors
- Missing environment variables

**Solutions:**
1. Check browser console for errors (F12 ? Console)
2. Verify data loaded: Open Redux DevTools and check `filters.csvDataSources`
3. Check that all 4 data sources attempted to load
4. Try refreshing the page

### Fallback to CSV Not Working

**Possible causes:**
- CSV files missing from `public/cleaned/` directory
- Incorrect `localFallback` paths in `data-sources.json`

**Solutions:**
1. Verify CSV files exist in `public/cleaned/`
2. Check `data-sources.json` has correct `localFallback` paths
3. Ensure CSV files are accessible (not in `.gitignore`)

## Project Structure

```
CASI2/
??? app/
?   ??? api/              # API routes (proxy route deprecated)
?   ??? components/       # React components
?   ??? map/             # Map visualization page
?   ??? page.tsx         # Main page
??? lib/
?   ??? services/
?   ?   ??? sheetsService.ts    # Google Sheets API integration
?   ?   ??? dataService.ts      # Data loading with caching
?   ??? features/        # Redux slices
?   ??? store.ts         # Redux store configuration
??? public/
?   ??? data-sources.json    # Configuration file
?   ??? cleaned/            # CSV fallback files
??? .env.local           # Environment variables (create this)
```

## Key Technologies

- **Next.js 14+**: React framework with App Router
- **Redux Toolkit**: State management
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **Google Sheets API v4**: Data source
- **PapaParse**: CSV parsing (fallback only)

## Performance

- **Initial Load**: ~3-5 seconds for all 4 data sources
- **Cached Load**: < 100ms (data cached for 5 minutes)
- **Fallback Load**: ~1-2 seconds (local CSV files)

## Development

### Run Tests

```bash
npm run test
# or
pnpm test
```

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
# or
pnpm type-check
```

## Architecture Decisions

### Why Google Sheets API?

- **No CSV parsing needed**: API returns JSON directly
- **No proxy route needed**: Direct client-side API access
- **Easier updates**: Edit sheets directly, no CSV re-upload
- **Version control**: Google Sheets tracks edit history
- **Multi-user editing**: Multiple people can update data

### Why Keep CSV Fallback?

- **Resilience**: Works offline or if API fails
- **Development**: Test without API setup
- **Backup**: Safety net for production issues

### Why Client-Side Fetching?

- **Simpler architecture**: No additional API routes needed
- **Better caching**: Browser cache + Redux cache
- **Reduced server load**: API calls from browser

## Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make changes and test thoroughly
3. Commit atomic changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feat/your-feature`
5. Create a pull request

## Documentation

- [Google Sheets Implementation Guide](./GOOGLE_SHEETS_IMPLEMENTATION.md)
- [Project Documentation](./PROJECT_DOCUMENTATION.md)
- [Implementation Details](./IMPLEMENTATION.md)

## License

[Add your license here]

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review browser console for errors
3. Check Redux DevTools for state issues
4. Open an issue on GitHub

---

**Last Updated**: 2025-10-29
**Version**: 2.0
