'use client';

import React from 'react';
import { ContentSection } from '@/lib/json-content-manager';

interface JsonContentRendererProps {
  section: ContentSection;
  className?: string;
}

interface SectionRendererProps {
  sections: Record<string, ContentSection>;
  sectionKey: string;
  className?: string;
}

export function JsonContentRenderer({ section, className = '' }: JsonContentRendererProps) {
  const renderContent = () => {
    switch (section.type) {
      case 'html':
        return (
          <div 
            className={className}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        );
      
      case 'markdown':
        // For markdown, we could integrate with a markdown parser here
        // For now, treating as text
        return (
          <div className={className}>
            {section.content.split('\n').map((line, index) => (
              <p key={index} className="mb-4">{line}</p>
            ))}
          </div>
        );
      
      case 'text':
      default:
        return (
          <div className={className}>
            {section.content.split('\n').map((line, index) => (
              <p key={index} className="text-lg text-gray-700 leading-relaxed mb-6">
                {line}
              </p>
            ))}
          </div>
        );
    }
  };

  return (
    <div>
      {section.title && (
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>
      )}
      {renderContent()}
    </div>
  );
}

export function SectionRenderer({ sections, sectionKey, className = '' }: SectionRendererProps) {
  const section = sections[sectionKey];
  
  if (!section) {
    return <div className="text-red-500">Section '{sectionKey}' not found</div>;
  }

  return <JsonContentRenderer section={section} className={className} />;
}

// Helper component for rendering multiple sections
export function MultiSectionRenderer({ 
  sections, 
  sectionKeys, 
  className = '' 
}: { 
  sections: Record<string, ContentSection>; 
  sectionKeys: string[]; 
  className?: string; 
}) {
  return (
    <div className={className}>
      {sectionKeys.map((key) => (
        <section key={key} className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionRenderer sections={sections} sectionKey={key} />
          </div>
        </section>
      ))}
    </div>
  );
} 