import { CsvRow } from '@/app/types/shared';

interface GoogleSheetsResponse {
  range: string;
  majorDimension: string;
  values: string[][];
}

interface FetchOptions {
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Fetches data from Google Sheets API v4 and transforms it to CsvRow[]
 * @param spreadsheetId - The Google Sheets spreadsheet ID
 * @param sheetName - The name of the sheet tab (e.g., 'arrest')
 * @param range - The cell range (e.g., 'A:Z' or 'A1:Z1000')
 * @param options - Retry and delay options
 * @returns Promise<CsvRow[]> - Array of row objects
 */
export async function fetchFromGoogleSheets(
  spreadsheetId: string,
  sheetName: string,
  range: string,
  options: FetchOptions = {}
): Promise<CsvRow[]> {
  const { retryAttempts = 2, retryDelay = 1000 } = options;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

  if (!apiKey) {
    throw new Error('❌ Google Sheets API key not found in environment variables');
  }

  const fullRange = `${sheetName}!${range}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${fullRange}?key=${apiKey}`;

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Handle rate limiting
        if (response.status === 429) {
          console.warn(`⚠️ [SheetsService] Rate limited (429). Retrying with backoff...`);
          if (attempt < retryAttempts) {
            const backoffDelay = retryDelay * Math.pow(2, attempt);
            await sleep(backoffDelay);
            continue;
          }
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: GoogleSheetsResponse = await response.json();

      // Validate response structure
      if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
        throw new Error('Invalid response: No data values found');
      }

      // Transform to CsvRow[]
      const csvRows = transformToCsvRows(data.values, sheetName);

      // Basic validation
      validateData(csvRows, sheetName);

      return csvRows;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ [SheetsService] Attempt ${attempt + 1} failed:`, error);

      if (attempt < retryAttempts) {
        const backoffDelay = retryDelay * Math.pow(2, attempt);
        await sleep(backoffDelay);
      }
    }
  }

  // All retries failed
  throw new Error(`Failed to fetch from Google Sheets after ${retryAttempts + 1} attempts: ${lastError?.message}`);
}

/**
 * Transforms Google Sheets API response (2D array) to CsvRow[] format
 */
function transformToCsvRows(values: string[][], sheetName: string): CsvRow[] {
  if (values.length < 2) {
    throw new Error(`Invalid data: Sheet "${sheetName}" has no data rows`);
  }

  const headers = values[0];
  const dataRows = values.slice(1);

  const csvRows: CsvRow[] = dataRows
    .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined)) // Filter empty rows
    .map((row) => {
      const csvRow: any = {};

      headers.forEach((header, colIndex) => {
        const value = row[colIndex];

        // Handle missing values
        if (value === undefined || value === null || value === '') {
          csvRow[header] = null;
          return;
        }

        // Auto-convert numbers
        const numValue = Number(value);
        if (!isNaN(numValue) && value.trim() !== '') {
          csvRow[header] = numValue;
        } else {
          csvRow[header] = value;
        }
      });

      return csvRow;
    });

  return csvRows;
}

/**
 * Basic validation to ensure required columns exist
 */
function validateData(data: CsvRow[], sheetName: string): void {
  if (data.length === 0) {
    throw new Error(`No valid data rows found in sheet "${sheetName}"`);
  }

  // Skip validation for non-data sheets (markdown has filename/content columns)
  const skipValidation = ['markdown'];
  if (skipValidation.includes(sheetName)) {
    return;
  }

  const firstRow = data[0];
  const requiredColumns = ['County', 'Year'];

  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    console.warn(`⚠️ [SheetsService] Missing expected columns in ${sheetName}: ${missingColumns.join(', ')}`);
  }
}

/**
 * Helper function to sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetches all data sources in parallel
 */
export async function fetchAllDataSources(
  spreadsheetId: string,
  sources: { sheetName: string; range: string }[]
): Promise<Record<string, CsvRow[]>> {
  const promises = sources.map(async ({ sheetName, range }) => {
    const data = await fetchFromGoogleSheets(spreadsheetId, sheetName, range);
    return { sheetName, data };
  });

  const results = await Promise.all(promises);

  const dataMap: Record<string, CsvRow[]> = {};
  results.forEach(({ sheetName, data }) => {
    dataMap[sheetName] = data;
  });

  return dataMap;
}
