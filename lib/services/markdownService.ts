import { fetchFromGoogleSheets } from './sheetsService';
import { CsvRow } from '@/app/types/shared';

interface MarkdownRow {
  filename: string;
  content: string;
}

// Cache for entire markdown sheet
let markdownCache: MarkdownRow[] | null = null;
let markdownCacheTimestamp: number = 0;
const CACHE_TTL = 300000; // 5 minutes (same as data sources)

/**
 * Load markdown content from Google Sheets "markdown" tab
 * @param filename - The markdown filename (e.g., 'hero.md', 'about.md')
 * @returns Promise<string> - The markdown content including frontmatter
 */
export async function loadMarkdownFromSheets(filename: string): Promise<string> {
  console.log(`🚀 [MarkdownService] Loading markdown file: ${filename}`);

  const spreadsheetId = process.env.NEXT_PUBLIC_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('❌ NEXT_PUBLIC_SPREADSHEET_ID is not defined in environment variables.');
  }

  // Check if cache is valid
  const now = Date.now();
  const isCacheValid = markdownCache !== null && (now - markdownCacheTimestamp) < CACHE_TTL;

  if (!isCacheValid) {
    console.log(`📥 [MarkdownService] Cache miss, fetching markdown sheet from Google Sheets`);

    try {
      // Fetch the entire "markdown" sheet
      const rawData = await fetchFromGoogleSheets(
        spreadsheetId,
        'markdown',
        'A:B', // Two columns: filename, content
        {
          retryAttempts: 2,
          retryDelay: 1000
        }
      );

      console.log(`✅ [MarkdownService] Successfully fetched ${rawData.length} markdown files from Google Sheets`);

      // Transform to MarkdownRow format
      markdownCache = rawData.map((row: CsvRow) => ({
        filename: String(row.filename || ''),
        content: String(row.content || '')
      }));

      markdownCacheTimestamp = now;
      console.log(`💾 [MarkdownService] Cached ${markdownCache.length} markdown files`);

    } catch (error) {
      console.error(`❌ [MarkdownService] Failed to fetch markdown sheet:`, error);
      throw new Error(`Failed to load markdown sheet from Google Sheets: ${error}`);
    }
  } else {
    console.log(`💾 [MarkdownService] Using cached markdown data`);
  }

  // Find the matching filename in cached data
  const markdownFile = markdownCache!.find(row => row.filename === filename);

  if (!markdownFile) {
    console.error(`❌ [MarkdownService] Markdown file not found: ${filename}`);
    console.log(`📋 [MarkdownService] Available files: ${markdownCache!.map(r => r.filename).join(', ')}`);
    throw new Error(`Markdown file not found in Google Sheets: ${filename}`);
  }

  console.log(`✅ [MarkdownService] Successfully loaded ${filename} (${markdownFile.content.length} characters)`);

  return markdownFile.content;
}

/**
 * Clear the markdown cache (useful for testing or forcing refresh)
 */
export function clearMarkdownCache(): void {
  console.log(`🗑️ [MarkdownService] Clearing markdown cache`);
  markdownCache = null;
  markdownCacheTimestamp = 0;
}

/**
 * Get cache statistics for debugging
 */
export function getMarkdownCacheStats(): {
  cached: boolean;
  fileCount: number;
  age: number;
  files: string[];
} {
  return {
    cached: markdownCache !== null,
    fileCount: markdownCache?.length || 0,
    age: markdownCache ? Date.now() - markdownCacheTimestamp : 0,
    files: markdownCache?.map(r => r.filename) || []
  };
}
