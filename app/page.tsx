'use client';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSelector } from 'react-redux';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Users, DollarSign, Building, Scale, Search, TrendingUp, MessageSquare } from "lucide-react"
import type { RootState } from '@/lib/store';
import { MarkdownSectionCards } from '@/app/components/MarkdownSectionCards';

export default function HomePage() {
    // Get content from Redux store
    const { contentSections, status, error } = useSelector((state: RootState) => state.content);
    const { contentReady } = useSelector((state: RootState) => state.app);
    
    // Convert content sections record to array for processing
    const contentSectionsArray = Object.values(contentSections);
    const loading = status === 'loading' || !contentReady;

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

    const heroSection = contentSectionsArray.find(s => s.section === 'hero');
    const aboutSection = contentSectionsArray.find(s => s.section === 'about');
    const howToUseSection = contentSectionsArray.find(s => s.section === 'how-to-use');

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-[#AFEEEE] to-[#99CCFF] py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-[#0E2C49] mb-4">{heroSection?.title || 'California Sentencing Institute'}</h1>
                            <p className="text-xl text-[#174A7C] max-w-3xl mx-auto">
                                {heroSection?.subtitle }
                            </p>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-[#0E2C49] text-sm font-medium">
                                        <Users className="h-5 w-5 mr-2 text-[#174A7C]" />
                                        Current Prison Population
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#174A7C]">95,000+</div>
                                    <p className="text-xs text-gray-600 mt-1">Statewide incarcerated individuals</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-[#0E2C49] text-sm font-medium">
                                        <DollarSign className="h-5 w-5 mr-2 text-[#174A7C]" />
                                        Annual Cost Per Person
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#174A7C]">$106,000</div>
                                    <p className="text-xs text-gray-600 mt-1">Cost to incarcerate per year</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-[#0E2C49] text-sm font-medium">
                                        <Building className="h-5 w-5 mr-2 text-[#174A7C]" />
                                        Local Jail Population
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#174A7C]">65,000+</div>
                                    <p className="text-xs text-gray-600 mt-1">County jail populations</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-[#0E2C49] text-sm font-medium">
                                        <BarChart3 className="h-5 w-5 mr-2 text-[#174A7C]" />
                                        Juvenile Halls Population
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#174A7C]">800+</div>
                                    <p className="text-xs text-gray-600 mt-1">Youth in juvenile facilities</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="text-center">
                            <Link href="/map">
                                <Button className="bg-[#174A7C] hover:bg-[#0E2C49] text-white px-8 py-3 text-lg">
                                    Explore County Data
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* About CASI Section */}
                <section id="about" className="py-16 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-[#0E2C49] mb-4">About CASI</h2>
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
                                    {aboutSection?.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How to Use CASI Section */}
                <section id="how-to-use" className="py-16 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-[#0E2C49] mb-4">
                                {howToUseSection?.title || 'How to Use CASI'}
                            </h2>
                            <div className="w-24 h-1 bg-[#1CBECA] mx-auto mb-4"></div>
                            <p className="text-lg text-[#174A7C]">
                                {howToUseSection?.subtitle }
                            </p>
                        </div>

                        <MarkdownSectionCards markdown={howToUseSection?.content || ''} />
                    </div>
                </section>

            </div>
        </div>
    );
}