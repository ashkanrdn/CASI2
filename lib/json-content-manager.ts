import fs from 'fs';
import path from 'path';

export interface ContentSection {
  title?: string;
  content: string;
  type?: 'text' | 'html' | 'markdown';
  metadata?: Record<string, any>;
}

export interface PageContent {
  metadata: {
    title: string;
    description?: string;
    lastUpdated?: string;
    version?: string;
  };
  sections: Record<string, ContentSection>;
}

export class JsonContentManager {
  private contentDir: string;

  constructor(contentDir: string = 'content') {
    this.contentDir = path.join(process.cwd(), contentDir);
  }

  /**
   * Load content from a JSON file
   */
  public loadContent(fileName: string): PageContent {
    const filePath = path.join(this.contentDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Content file not found: ${filePath}`);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const content = JSON.parse(fileContent);
      return this.validateContent(content);
    } catch (error) {
      throw new Error(`Failed to parse JSON content: ${error}`);
    }
  }

  /**
   * Save content to a JSON file
   */
  public saveContent(fileName: string, content: PageContent): void {
    const filePath = path.join(this.contentDir, fileName);
    
    // Ensure directory exists
    if (!fs.existsSync(this.contentDir)) {
      fs.mkdirSync(this.contentDir, { recursive: true });
    }

    // Add lastUpdated timestamp
    content.metadata.lastUpdated = new Date().toISOString();

    try {
      const jsonContent = JSON.stringify(content, null, 2);
      fs.writeFileSync(filePath, jsonContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save content: ${error}`);
    }
  }

  /**
   * Get a specific section from content
   */
  public getSection(content: PageContent, sectionKey: string): ContentSection | null {
    return content.sections[sectionKey] || null;
  }

  /**
   * Update a specific section
   */
  public updateSection(
    content: PageContent, 
    sectionKey: string, 
    newSection: ContentSection
  ): PageContent {
    return {
      ...content,
      sections: {
        ...content.sections,
        [sectionKey]: newSection
      }
    };
  }

  /**
   * Get all available content files
   */
  public getAvailableFiles(): string[] {
    if (!fs.existsSync(this.contentDir)) {
      return [];
    }

    return fs
      .readdirSync(this.contentDir)
      .filter(file => file.endsWith('.json'))
      .sort();
  }

  /**
   * Create a backup of current content
   */
  public createBackup(fileName: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${fileName.replace('.json', '')}-backup-${timestamp}.json`;
    const originalPath = path.join(this.contentDir, fileName);
    const backupPath = path.join(this.contentDir, 'backups', backupFileName);

    if (!fs.existsSync(path.dirname(backupPath))) {
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    }

    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, backupPath);
    }

    return backupFileName;
  }

  /**
   * Validate content structure
   */
  private validateContent(content: any): PageContent {
    if (!content || typeof content !== 'object') {
      throw new Error('Content must be an object');
    }

    if (!content.metadata || typeof content.metadata !== 'object') {
      throw new Error('Content must have a metadata object');
    }

    if (!content.metadata.title) {
      throw new Error('Content metadata must have a title');
    }

    if (!content.sections || typeof content.sections !== 'object') {
      throw new Error('Content must have a sections object');
    }

    // Validate each section
    for (const [key, section] of Object.entries(content.sections)) {
      if (!section || typeof section !== 'object') {
        throw new Error(`Section '${key}' must be an object`);
      }

      const sectionObj = section as any;
      if (!sectionObj.content || typeof sectionObj.content !== 'string') {
        throw new Error(`Section '${key}' must have a content string`);
      }
    }

    return content as PageContent;
  }

  /**
   * Watch for file changes (useful for development)
   */
  public watchForChanges(callback: (filePath: string) => void): void {
    if (fs.existsSync(this.contentDir)) {
      fs.watch(this.contentDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.json') && !filename.includes('backup')) {
          callback(filename);
        }
      });
    }
  }

  /**
   * Generate example content structure
   */
  public generateExampleContent(): PageContent {
    return {
      metadata: {
        title: "CASI Homepage Content",
        description: "Content for the California Sentencing Institute homepage",
        version: "1.0.0"
      },
      sections: {
        intro: {
          title: "About CASI",
          content: "The California Sentencing Institute (CASI) is a powerful tool for understanding how incarceration impacts communities across California.",
          type: "text"
        },
        howToUse: {
          title: "How to Use CASI",
          content: "CASI is a tool to understand how incarceration and justice policies affect communities across California.",
          type: "text"
        },
        history: {
          title: "California Sentencing History", 
          content: "In July 1852, California opened its first land-based adult correctional institution, San Quentin State Prison, housing 68 inmates.",
          type: "text"
        },
        juvenileJustice: {
          title: "Juvenile Justice in California",
          content: "In 1858, California opened its first juvenile justice facility, the San Francisco Industrial School.",
          type: "text"
        },
        dataImportance: {
          title: "The Importance of Data",
          content: "Data-driven research is crucial to analyzing criminal and juvenile justice policy.",
          type: "text"
        }
      }
    };
  }
} 