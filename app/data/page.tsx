'use client';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

import { getAllContentSections, parseDataMetrics } from '@/lib/content';

interface ContentSection {
  title: string;
  subtitle?: string;
  order: number;
  visible: boolean;
  section: string;
  content: string;
  frontmatter: Record<string, any>;
}

export default function DataPage() {
    const [contentSections, setContentSections] = useState<ContentSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const sections = await getAllContentSections();
                setContentSections(sections);
                setLoading(false);
            } catch (err) {
                console.error('Error loading content:', err);
                setError('Failed to load content');
                setLoading(false);
            }
        };

        loadContent();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    const dataImportanceSection = contentSections.find(s => s.section === 'data-importance');
    const dataMetricsSection = contentSections.find(s => s.section === 'data-metrics');

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">


                {/* Importance of Data */}
                {dataImportanceSection && (
                    <section className="py-16 bg-white">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-[#0E2C49] mb-4">{dataImportanceSection.title}</h2>
                                <div className="w-24 h-1 bg-[#1CBECA] mx-auto"></div>
                            </div>

                            <div className="prose prose-lg max-w-none">
                                <div className="bg-[#AFEEEE]/20 p-8 rounded-lg mb-8">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                                        }}
                                    >
                                        {dataImportanceSection.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Data Metrics Cards */}
                {dataMetricsSection && (
                    <section className="bg-gray-50 py-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{dataMetricsSection.title}</h2>
                                <div className="w-24 h-1 bg-[#1CBECA] mx-auto"></div>

                                {dataMetricsSection.subtitle && (
                                    <p className="text-lg mt-2 text-gray-600">{dataMetricsSection.subtitle}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                                {parseDataMetrics(dataMetricsSection.content).map((metric, index) => (
                                    <DataMetricCard 
                                        key={index}
                                        title={metric.title} 
                                        content={metric.content} 
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function DataMetricCard({ title, content }: { title: string; content: string }) {
    return (
        <Card className="h-full">
            <CardHeader className="bg-[#174A7C] text-white">
                <CardTitle className="text-lg text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1">
                <div className="prose prose-sm max-w-none text-gray-700 text-sm">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ children }) => <p className="mb-6 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="text-[#174A7C] font-semibold">{children}</strong>
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    );
} 