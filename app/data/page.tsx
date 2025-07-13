'use client';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Users, Search, FileText } from "lucide-react"
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

    const howToUseSection = contentSections.find(s => s.section === 'how-to-use');
    const dataImportanceSection = contentSections.find(s => s.section === 'data-importance');
    const dataMetricsSection = contentSections.find(s => s.section === 'data-metrics');

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                {/* How to Use CASI */}
                {howToUseSection && (
                    <section className="bg-gray-50 py-16">
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{howToUseSection.title}</h2>
                                {howToUseSection.subtitle && (
                                    <p className="text-lg text-gray-600">{howToUseSection.subtitle}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <Search className="h-6 w-6 text-blue-600" />
                                            <CardTitle>Explore Your County & Understand the Data</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: () => null,
                                                h2: () => null,
                                                p: ({ children }) => <div className="text-gray-700">{children}</div>
                                            }}
                                        >
                                            {howToUseSection.content.split('## Turn Insight into Action')[0].split('## Explore Your County & Understand the Data')[1] || ''}
                                        </ReactMarkdown>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-6 w-6 text-green-600" />
                                            <CardTitle>Turn Insight into Action</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: () => null,
                                                h2: () => null,
                                                p: ({ children }) => <div className="text-gray-700">{children}</div>
                                            }}
                                        >
                                            {howToUseSection.content.split('## Who Is CASI For?')[0].split('## Turn Insight into Action')[1] || ''}
                                        </ReactMarkdown>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-blue-50 border-blue-200">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <Users className="h-6 w-6 text-blue-600" />
                                        <CardTitle className="text-blue-900">Who Is CASI For?</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: () => null,
                                            h2: () => null,
                                            p: ({ children }) => <p className="text-blue-800 font-medium">{children}</p>
                                        }}
                                    >
                                        {howToUseSection.content.split('## Who Is CASI For?')[1] || ''}
                                    </ReactMarkdown>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Importance of Data */}
                {dataImportanceSection && (
                    <section className="py-16">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{dataImportanceSection.title}</h2>
                                <div className="w-24 h-1 bg-purple-600 mx-auto"></div>
                            </div>

                            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                                <CardContent className="p-8">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: () => null,
                                            p: ({ children }) => <p className="text-lg text-gray-700 leading-relaxed mb-4">{children}</p>
                                        }}
                                    >
                                        {dataImportanceSection.content}
                                    </ReactMarkdown>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Data Metrics Cards */}
                {dataMetricsSection && (
                    <section className="bg-gray-50 py-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{dataMetricsSection.title}</h2>
                                {dataMetricsSection.subtitle && (
                                    <p className="text-lg text-gray-600">{dataMetricsSection.subtitle}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                    {content}
                </CardDescription>
            </CardContent>
        </Card>
    );
} 