import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface MarkdownSection {
  id: string;
  title: string;
  content: string;
  order?: number;
  metadata?: Record<string, any>;
}

export interface MarkdownData {
  metadata: Record<string, any>;
  sections: MarkdownSection[];
}

export class MarkdownContentManager {
  private contentDir: string;

  constructor(contentDir: string = 'content') {
    this.contentDir = path.join(process.cwd(), contentDir);
  }

  /**
   * Parse a markdown file with frontmatter and extract sections
   */
  public parseMarkdownFile(filePath: string): MarkdownData {
    const fullPath = path.join(this.contentDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Markdown file not found: ${fullPath}`);
    }

    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const { data: metadata, content } = matter(fileContent);

    // Parse sections based on ## headers
    const sections = this.parseContentIntoSections(content);

    return {
      metadata,
      sections
    };
  }

  /**
   * Parse content into sections based on ## headers
   */
  private parseContentIntoSections(content: string): MarkdownSection[] {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];
    let currentSection: Partial<MarkdownSection> | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check if line is a section header (## Title)
      const headerMatch = line.match(/^##\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentContent.join('\n').trim()
          } as MarkdownSection);
        }

        // Start new section
        const title = headerMatch[1];
        const id = this.generateId(title);
        currentSection = { id, title };
        currentContent = [];
      } else {
        // Add line to current section content
        currentContent.push(line);
      }
    }

    // Don't forget the last section
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: currentContent.join('\n').trim()
      } as MarkdownSection);
    }

    return sections;
  }

  /**
   * Generate a URL-friendly ID from a title
   */
  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  /**
   * Get all markdown files in the content directory
   */
  public getAvailableFiles(): string[] {
    if (!fs.existsSync(this.contentDir)) {
      return [];
    }

    return fs
      .readdirSync(this.contentDir)
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .sort();
  }

  /**
   * Watch for file changes (useful for development)
   */
  public watchForChanges(callback: (filePath: string) => void): void {
    if (fs.existsSync(this.contentDir)) {
      fs.watch(this.contentDir, (eventType, filename) => {
        if (filename && (filename.endsWith('.md') || filename.endsWith('.mdx'))) {
          callback(filename);
        }
      });
    }
  }
} 