'use client';
import { Button } from '@/app/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { JsonContentManager, PageContent } from '@/lib/json-content-manager';
import { SectionRenderer, MultiSectionRenderer } from '@/app/components/JsonContentRenderer';
import { DataPointsRenderer } from '@/app/components/MarkdownRenderer';
import { useState, useEffect } from 'react';

export default function DynamicHomePage() {
    const [content, setContent] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadContent = async () => {
            try {
                // In a real app, this would be a server-side function or API call
                const contentManager = new JsonContentManager();
                const pageContent = contentManager.loadContent('homepage.json');
                setContent(pageContent);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load content');
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-4">Error Loading Content</div>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">No content available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                {/* Hero Section with Key Stats - Keep as is */}
                <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">California Prison Statistics</h2>
                            <p className="text-xl text-blue-100">Current incarceration data and costs</p>
                        </div>

                        {/* Stats cards remain the same */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Your existing stats cards here */}
                        </div>

                        <div className="text-center mt-12">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link href="/map">
                                    <Button size="lg" className="text-lg px-8 py-3 bg-white text-blue-700 hover:bg-gray-100 font-semibold">
                                        Explore the Map
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                            <p className="text-blue-100 mt-3 text-sm">
                                Interactive county-by-county data for all 58 California counties
                            </p>
                        </div>
                    </div>
                </section>

                {/* Dynamic Content Sections */}
                
                {/* Introduction Section */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <SectionRenderer 
                            sections={content.sections} 
                            sectionKey="intro"
                        />
                    </div>
                </section>

                {/* How to Use CASI */}
                <section className="bg-gray-50 py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <SectionRenderer 
                            sections={content.sections} 
                            sectionKey="howToUse"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <SectionRenderer 
                                    sections={content.sections} 
                                    sectionKey="exploreData"
                                />
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <SectionRenderer 
                                    sections={content.sections} 
                                    sectionKey="takeAction"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 border-blue-200 p-6 rounded-lg">
                            <SectionRenderer 
                                sections={content.sections} 
                                sectionKey="whoIsFor"
                            />
                        </div>
                    </div>
                </section>

                {/* History Sections */}
                <MultiSectionRenderer 
                    sections={content.sections}
                    sectionKeys={['history', 'juvenileJustice']}
                />

                {/* Data Importance */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <SectionRenderer 
                            sections={content.sections} 
                            sectionKey="dataImportance"
                        />
                    </div>
                </section>

                {/* Data Points - Custom rendering for cards */}
                <section className="bg-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Data Metrics</h2>
                            <p className="text-lg text-gray-600">Explore these important indicators across California counties</p>
                        </div>
                        
                        <DataPointsRenderer content={content.sections.dataPoints.content} />
                    </div>
                </section>

                {/* Content Info */}
                <section className="bg-blue-100 py-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-sm text-blue-800">
                            Content Version: {content.metadata.version} | 
                            Last Updated: {new Date(content.metadata.lastUpdated || '').toLocaleDateString()}
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
} 