'use client';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, MapPin, BarChart3, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Users, DollarSign, TrendingDown, Search, FileText, Scale } from "lucide-react"
import { useContent } from '@/lib/useContent';
import { SectionRenderer, MultiSectionRenderer } from '@/app/components/JsonContentRenderer';
import { DataPointsRenderer } from '@/app/components/MarkdownRenderer';
import { useEffect } from 'react';

export default function HomePage() {
    const { content, loading, error, refetch } = useContent('homepage');

    useEffect(() => {
        console.log('HomePage state:', { content: !!content, loading, error });
    }, [content, loading, error]);

    if (loading) {
        return (
            <div className="w-full h-full overflow-auto">
                {/* <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading content...</p>
                        <p className="mt-2 text-sm text-gray-500">
                            If this takes too long, check the browser console for errors.
                        </p>
                        <button 
                            onClick={refetch}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div> */}
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full overflow-auto">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="text-red-600 text-xl mb-4">Error Loading Content</div>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-500 mb-4">
                            Make sure the content/homepage.json file exists and is properly formatted.
                        </p>
                        <div className="space-x-2">
                            <button 
                                onClick={refetch}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Retry
                            </button>
                            <a 
                                href="/api/content/homepage" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block"
                            >
                                Test API
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="w-full h-full overflow-auto">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-600 mb-4">No content available</p>
                        <button 
                            onClick={refetch}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                {/* Hero Section with Key Stats */}
                <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">California Prison Statistics</h2>
                            <p className="text-xl text-blue-100">Current incarceration data and costs</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <Card className="bg-white/10 backdrop-blur border-white/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Users className="h-8 w-8 text-blue-200" />
                                        <Badge variant="secondary" className="bg-white/20 text-white">
                                            Live
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white mb-1">127,000</div>
                                    <p className="text-blue-200 text-sm">Current Prison Population</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur border-white/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <DollarSign className="h-8 w-8 text-green-200" />
                                        <Badge variant="secondary" className="bg-white/20 text-white">
                                            Annual
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white mb-1">$106,000</div>
                                    <p className="text-blue-200 text-sm">Cost Per Inmate/Year</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur border-white/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <TrendingDown className="h-8 w-8 text-red-200" />
                                        <Badge variant="secondary" className="bg-white/20 text-white">
                                            Since 2011
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white mb-1">-32%</div>
                                    <p className="text-blue-200 text-sm">Population Reduction</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/10 backdrop-blur border-white/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Scale className="h-8 w-8 text-purple-200" />
                                        <Badge variant="secondary" className="bg-white/20 text-white">
                                            Counties
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white mb-1">58</div>
                                    <p className="text-blue-200 text-sm">California Counties</p>
                                </CardContent>
                            </Card>
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
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <Search className="h-6 w-6 text-blue-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <SectionRenderer 
                                        sections={content.sections} 
                                        sectionKey="exploreData"
                                        className="prose-sm"
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-6 w-6 text-green-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <SectionRenderer 
                                        sections={content.sections} 
                                        sectionKey="takeAction"
                                        className="prose-sm"
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-blue-50 border-blue-200">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <SectionRenderer 
                                    sections={content.sections} 
                                    sectionKey="whoIsFor"
                                    className="prose-sm"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* California Sentencing History */}
                <section className="py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            <div className="prose prose-lg">
                                <SectionRenderer 
                                    sections={content.sections} 
                                    sectionKey="history"
                                />
                            </div>

                            <Card className="h-80 flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Prison Population Trends Chart</p>
                                    <p className="text-gray-400 text-sm">1852 - Present</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Juvenile Justice History */}
                <section className="bg-gray-50 py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            <Card className="h-80 flex items-center justify-center bg-white">
                                <div className="text-center">
                                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Youth Incarceration Trends</p>
                                    <p className="text-gray-400 text-sm">1858 - 2023</p>
                                </div>
                            </Card>

                            <div className="prose prose-lg">
                                <SectionRenderer 
                                    sections={content.sections} 
                                    sectionKey="juvenileJustice"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Importance of Data */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                            <CardContent className="p-8">
                                <SectionRenderer 
                                    sections={content.sections} 
                                    sectionKey="dataImportance"
                                />
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Data Metrics Cards */}
                <section className="bg-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Data Metrics</h2>
                            <p className="text-lg text-gray-600">Explore these important indicators across California counties</p>
                        </div>

                        <DataPointsRenderer content={content.sections.dataPoints?.content || ''} />
                    </div>
                </section>

                {/* Content Version Info */}
                <section className="bg-blue-100 py-4">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-sm text-blue-800">
                            Content Version: {content.metadata.version} | 
                            Last Updated: {content.metadata.lastUpdated 
                                ? new Date(content.metadata.lastUpdated).toLocaleDateString() 
                                : 'Unknown'
                            }
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
