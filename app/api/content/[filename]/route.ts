import { NextRequest, NextResponse } from 'next/server';
import { JsonContentManager } from '@/lib/json-content-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Ensure filename ends with .json
    const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    
    const contentManager = new JsonContentManager();
    const content = contentManager.loadContent(jsonFilename);
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Failed to load content:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Content file not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const body = await request.json();
    
    // Ensure filename ends with .json
    const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    
    const contentManager = new JsonContentManager();
    
    // Create backup before updating
    try {
      contentManager.createBackup(jsonFilename);
    } catch (backupError) {
      console.warn('Failed to create backup:', backupError);
    }
    
    // Save the new content
    contentManager.saveContent(jsonFilename, body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Content updated successfully' 
    });
  } catch (error) {
    console.error('Failed to save content:', error);
    
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
} 