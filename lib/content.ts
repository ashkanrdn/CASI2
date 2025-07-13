interface ContentSection {
  title: string;
  subtitle?: string;
  order: number;
  visible: boolean;
  section: string;
  content: string;
  frontmatter: Record<string, any>;
}

interface ParsedContent {
  frontmatter: Record<string, any>;
  content: string;
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(markdownContent: string): ParsedContent {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdownContent.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {},
      content: markdownContent
    };
  }

  const frontmatterText = match[1];
  const content = match[2];
  
  // Simple YAML parser for basic key-value pairs
  const frontmatter: Record<string, any> = {};
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value: any = line.substring(colonIndex + 1).trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse boolean values
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      
      // Parse numbers
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }
      
      frontmatter[key] = value;
    }
  });

  return { frontmatter, content };
}

/**
 * Fetch and parse a single content file
 */
export async function getContentSection(filename: string): Promise<ContentSection | null> {
  try {
    // Check if we should use external source
    const externalContentUrl = process.env.NEXT_PUBLIC_EXTERNAL_CONTENT_URL;
    
    let url: string;
    if (externalContentUrl) {
      // External source (e.g., GitHub raw URL)
      url = `${externalContentUrl}/${filename}`;
    } else {
      // Local content
      url = `/content/${filename}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      // Fallback to local content if external fails
      if (externalContentUrl) {
        const fallbackResponse = await fetch(`/content/${filename}`);
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to fetch content: ${filename}`);
        }
        const markdownContent = await fallbackResponse.text();
        return parseContentSection(markdownContent, filename);
      }
      throw new Error(`Failed to fetch content: ${filename}`);
    }

    const markdownContent = await response.text();
    return parseContentSection(markdownContent, filename);
  } catch (error) {
    console.error(`Error loading content section ${filename}:`, error);
    return null;
  }
}

/**
 * Parse markdown content into ContentSection
 */
function parseContentSection(markdownContent: string, filename: string): ContentSection {
  const { frontmatter, content } = parseFrontmatter(markdownContent);
  
  return {
    title: frontmatter.title || '',
    subtitle: frontmatter.subtitle,
    order: frontmatter.order || 0,
    visible: frontmatter.visible !== false,
    section: frontmatter.section || filename.replace('.md', ''),
    content: content.trim(),
    frontmatter
  };
}

/**
 * Get all content sections and sort by order
 */
export async function getAllContentSections(): Promise<ContentSection[]> {
  const filenames = [
    'hero.md',
    'about.md',
    'how-to-use.md',
    'history.md',
    'juvenile.md',
    'data-importance.md',
    'data-metrics.md'
  ];

  const sections = await Promise.all(
    filenames.map(filename => getContentSection(filename))
  );

  return sections
    .filter((section): section is ContentSection => section !== null && section.visible)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get a specific content section by section name
 */
export async function getContentBySection(sectionName: string): Promise<ContentSection | null> {
  const filename = `${sectionName}.md`;
  return getContentSection(filename);
}

/**
 * Content cache for performance
 */
const contentCache = new Map<string, { content: ContentSection; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached content or fetch fresh
 */
export async function getCachedContentSection(filename: string): Promise<ContentSection | null> {
  const cached = contentCache.get(filename);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.content;
  }
  
  const content = await getContentSection(filename);
  if (content) {
    contentCache.set(filename, { content, timestamp: now });
  }
  
  return content;
}

/**
 * Parse markdown content into individual metric cards
 */
export function parseDataMetrics(markdownContent: string): Array<{title: string, content: string}> {
  // Remove frontmatter and main title
  const contentWithoutFrontmatter = markdownContent.replace(/^---[\s\S]*?---\n/, '');
  const contentWithoutMainTitle = contentWithoutFrontmatter.replace(/^#.*\n/, '');
  
  // Split by ## headers
  const sections = contentWithoutMainTitle.split(/^## /m).filter(section => section.trim());
  
  return sections.map(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    
    return { title, content };
  });
}