import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface MarkdownSection {
  title: string;
  content: string[];
}

interface MarkdownSectionCardsProps {
  markdown: string;
}

export const MarkdownSectionCards: React.FC<MarkdownSectionCardsProps> = ({ markdown }) => {
  const parseSections = (content: string): MarkdownSection[] => {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];
    let currentSection: MarkdownSection | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line is a header (starts with ##)
      if (trimmedLine.startsWith('## ')) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        // Start new section
        currentSection = {
          title: trimmedLine.replace('## ', ''),
          content: []
        };
      } 
      // Check if line is a bullet point or content
      else if (trimmedLine && currentSection) {
        // Remove markdown bullet point symbols and clean up
        const cleanLine = trimmedLine
          .replace(/^[•·*-]\s*/, '') // Remove bullet symbols
          .trim();
        
        if (cleanLine) {
          currentSection.content.push(cleanLine);
        }
      }
    }

    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseSections(markdown);

  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <Card key={index} className="bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="bg-[#174A7C] text-white py-4 px-6">
            <CardTitle className="text-white text-lg font-semibold">
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              {section.content.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start text-gray-700">
                  <span className="text-[#1CBECA] mr-2 mt-1 flex-shrink-0">•</span>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 