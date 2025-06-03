'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Users, DollarSign, TrendingDown, Search, FileText, Scale } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom components for markdown rendering
const markdownComponents = {
  // Custom heading components
  h1: ({ children }: any) => (
    <h1 className="text-3xl font-bold text-gray-900 mb-4">{children}</h1>
  ),
  
  h2: ({ children }: any) => (
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">{children}</h2>
      <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
    </div>
  ),
  
  h3: ({ children }: any) => (
    <h3 className="text-2xl font-bold text-gray-900 mb-3">{children}</h3>
  ),

  // Custom paragraph component
  p: ({ children }: any) => (
    <p className="text-lg text-gray-700 leading-relaxed mb-6">{children}</p>
  ),

  // Custom list components
  ul: ({ children }: any) => (
    <ul className="space-y-2 text-gray-700 mb-6">{children}</ul>
  ),
  
  li: ({ children }: any) => (
    <li className="flex items-start">
      <span className="text-blue-600 mr-2">•</span>
      <span>{children}</span>
    </li>
  ),

  // Custom strong (bold) component
  strong: ({ children }: any) => (
    <strong className="font-semibold text-blue-600">{children}</strong>
  ),

  // Custom blockquote component  
  blockquote: ({ children }: any) => (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="text-blue-800">{children}</div>
    </div>
  ),

  // Custom code block component
  code: ({ children, className }: any) => {
    const isInline = !className;
    if (isInline) {
      return <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{children}</code>;
    }
    return (
      <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto mb-6">
        <code>{children}</code>
      </pre>
    );
  },

  // Custom horizontal rule
  hr: () => (
    <div className="my-12">
      <div className="w-full h-px bg-gray-300"></div>
    </div>
  ),
};

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Special component for rendering data points section
export function DataPointsRenderer({ content }: { content: string }) {
  // Parse data points from markdown
  const parseDataPoints = (markdownContent: string) => {
    const lines = markdownContent.split('\n');
    const dataPoints: Array<{ title: string; description: string }> = [];
    
    let currentTitle = '';
    let currentDescription: string[] = [];
    
    for (const line of lines) {
      const titleMatch = line.match(/^\*\*(.+?)\*\*$/);
      
      if (titleMatch) {
        // Save previous data point if exists
        if (currentTitle && currentDescription.length > 0) {
          dataPoints.push({
            title: currentTitle,
            description: currentDescription.join(' ').trim()
          });
        }
        
        // Start new data point
        currentTitle = titleMatch[1];
        currentDescription = [];
      } else if (line.trim() && !line.startsWith('**') && currentTitle) {
        currentDescription.push(line.trim());
      }
    }
    
    // Don't forget the last data point
    if (currentTitle && currentDescription.length > 0) {
      dataPoints.push({
        title: currentTitle,
        description: currentDescription.join(' ').trim()
      });
    }
    
    return dataPoints;
  };

  const dataPoints = parseDataPoints(content);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {dataPoints.map((dataPoint, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">{dataPoint.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {dataPoint.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 