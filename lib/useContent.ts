'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageContent } from './json-content-manager';

interface UseContentResult {
  content: PageContent | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useContent(filename: string): UseContentResult {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching content for: ${filename}`);
      const response = await fetch(`/api/content/${filename}`);
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch content`);
      }
      
      const data = await response.json();
      console.log('Content loaded successfully:', data.metadata);
      setContent(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to load content:', err);
    } finally {
      setLoading(false);
    }
  }, [filename]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    refetch: fetchContent
  };
}

// Hook for updating content
export function useUpdateContent() {
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const updateContent = async (filename: string, newContent: PageContent): Promise<boolean> => {
    try {
      setUpdating(true);
      setUpdateError(null);

      const response = await fetch(`/api/content/${filename}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContent),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update content');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setUpdateError(errorMessage);
      console.error('Failed to update content:', err);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateContent,
    updating,
    updateError
  };
} 