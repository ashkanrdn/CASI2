import { fetchFromGoogleSheets } from '../sheetsService';
import { CsvRow } from '@/app/types/shared';

// Mock environment
const mockApiKey = 'test-api-key';
const mockSpreadsheetId = 'test-spreadsheet-id';

describe('Google Sheets Service', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY = mockApiKey;

    // Clear all mocks
    jest.clearAllMocks();

    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchFromGoogleSheets', () => {
    it('should fetch and transform data successfully', async () => {
      // Mock successful API response
      const mockResponse = {
        range: 'test!A1:C3',
        majorDimension: 'ROWS',
        values: [
          ['County', 'Year', 'Total'],
          ['Alameda', '2020', '1000'],
          ['Sacramento', '2021', '1500'],
        ],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as jest.Mock;

      const result = await fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:C');

      // Verify correct number of rows
      expect(result).toHaveLength(2);

      // Verify data transformation
      expect(result[0]).toEqual({
        County: 'Alameda',
        Year: 2020,
        Total: 1000,
      });

      expect(result[1]).toEqual({
        County: 'Sacramento',
        Year: 2021,
        Total: 1500,
      });

      // Verify fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`spreadsheets/${mockSpreadsheetId}/values/test!A:C`),
        expect.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          text: () => Promise.resolve('Forbidden'),
        })
      ) as jest.Mock;

      await expect(
        fetchFromGoogleSheets(mockSpreadsheetId, 'test-sheet', 'A:C', {
          retryAttempts: 0, // No retries for faster test
        })
      ).rejects.toThrow('HTTP 403');
    });

    it('should retry on rate limit (429) with exponential backoff', async () => {
      let callCount = 0;

      global.fetch = jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call returns 429
          return Promise.resolve({
            ok: false,
            status: 429,
            text: () => Promise.resolve('Rate limit exceeded'),
          });
        }
        // Second call succeeds
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              range: 'test!A1:B2',
              majorDimension: 'ROWS',
              values: [
                ['County', 'Year'],
                ['Alameda', '2020'],
              ],
            }),
        });
      }) as jest.Mock;

      const result = await fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:C', {
        retryAttempts: 1,
        retryDelay: 100, // Short delay for tests
      });

      // Verify retry happened
      expect(callCount).toBe(2);

      // Verify result is correct
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        County: 'Alameda',
        Year: 2020,
      });
    });

    it('should throw error after all retries fail', async () => {
      // Mock all attempts failing
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        })
      ) as jest.Mock;

      await expect(
        fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:C', {
          retryAttempts: 1,
          retryDelay: 50,
        })
      ).rejects.toThrow('Failed to fetch from Google Sheets after 2 attempts');

      // Verify all retry attempts were made
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle empty response', async () => {
      // Mock empty response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              range: 'test!A1:C1',
              majorDimension: 'ROWS',
              values: [],
            }),
        })
      ) as jest.Mock;

      await expect(
        fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:C')
      ).rejects.toThrow('Invalid response: No data values found');
    });

    it('should handle missing API key', async () => {
      // Remove API key
      delete process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

      await expect(
        fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:C')
      ).rejects.toThrow('❌ Google Sheets API key not found in environment variables');
    });

    it('should filter out empty rows', async () => {
      // Mock response with empty rows
      const mockResponse = {
        range: 'test!A1:C5',
        majorDimension: 'ROWS',
        values: [
          ['County', 'Year', 'Total'],
          ['Alameda', '2020', '1000'],
          ['', '', ''], // Empty row
          ['Sacramento', '2021', '1500'],
          [null, null, null], // Null row
        ],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as jest.Mock;

      const result = await fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:C');

      // Should only include non-empty rows
      expect(result).toHaveLength(2);
      expect(result[0].County).toBe('Alameda');
      expect(result[1].County).toBe('Sacramento');
    });

    it('should handle missing values in cells', async () => {
      // Mock response with missing values
      const mockResponse = {
        range: 'test!A1:D3',
        majorDimension: 'ROWS',
        values: [
          ['County', 'Year', 'Total', 'Notes'],
          ['Alameda', '2020', '1000'], // Missing 'Notes' value
          ['Sacramento', '2021', '', 'Has notes'], // Empty 'Total' value
        ],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as jest.Mock;

      const result = await fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:D');

      expect(result).toHaveLength(2);

      // First row should have null for missing Notes
      expect(result[0].Notes).toBeNull();

      // Second row should have null for empty Total
      expect(result[1].Total).toBeNull();
      expect(result[1].Notes).toBe('Has notes');
    });

    it('should auto-convert numeric strings to numbers', async () => {
      const mockResponse = {
        range: 'test!A1:D3',
        majorDimension: 'ROWS',
        values: [
          ['County', 'Year', 'Total', 'Rate'],
          ['Alameda', '2020', '1000', '12.5'],
          ['Sacramento', '2021', '1500', '15.7'],
        ],
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
      ) as jest.Mock;

      const result = await fetchFromGoogleSheets(mockSpreadsheetId, 'test', 'A:D');

      // Verify numbers are converted
      expect(typeof result[0].Year).toBe('number');
      expect(result[0].Year).toBe(2020);
      expect(typeof result[0].Total).toBe('number');
      expect(result[0].Total).toBe(1000);
      expect(typeof result[0].Rate).toBe('number');
      expect(result[0].Rate).toBe(12.5);
    });
  });
});
