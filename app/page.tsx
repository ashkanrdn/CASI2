'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Users, DollarSign, Building, Scale, Search, TrendingUp, MessageSquare } from "lucide-react"
import { getAllContentSections } from '@/lib/content';

interface ContentSection {
  title: string;
  subtitle?: string;
  order: number;
  visible: boolean;
  section: string;
  content: string;
  frontmatter: Record<string, any>;
}

export default function HomePage() {
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

    const heroSection = contentSections.find(s => s.section === 'hero');
    const aboutSection = contentSections.find(s => s.section === 'about');
    const howToUseSection = contentSections.find(s => s.section === 'how-to-use');

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-[#AFEEEE] to-[#99CCFF] py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-[#0E2C49] mb-4">{heroSection?.title || 'California Sentencing Institute'}</h1>
                            <p className="text-xl text-[#174A7C] max-w-3xl mx-auto">
                                {heroSection?.subtitle || 'Interactive data visualizations and county-by-county insights to promote equity-focused, data-informed justice policies across California’s 58 counties.'}
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
                <section id="about" className="py-16 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-[#0E2C49] mb-4">About CASI</h2>
                            <div className="w-24 h-1 bg-[#1CBECA] mx-auto"></div>
                        </div>

                        <div className="prose prose-lg max-w-none">
                            <div className="bg-[#AFEEEE]/20 p-8 rounded-lg mb-8">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {aboutSection?.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How to Use CASI Section */}
                <section id="how-to-use" className="py-16 bg-gray-50">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-[#0E2C49] mb-4">{howToUseSection?.title || 'How to Use CASI'}</h2>
                            <div className="w-24 h-1 bg-[#1CBECA] mx-auto mb-6"></div>
                            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                                {howToUseSection?.subtitle || 'CASI is a tool to understand how incarceration and justice policies affect communities across California.'}
                            </p>
                        </div>
                        <div className="space-y-8 mb-12">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-[#99CCFF]/30">
                                    <CardTitle className="flex items-center text-[#0E2C49]">
                                        <Search className="h-6 w-6 mr-3 text-[#174A7C]" />
                                        Explore Your County & Understand the Data
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4 text-gray-700">
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>Use the interactive map to select one of California's 58 counties</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>View incarceration rates, crime data, and demographic breakdowns over time</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>Compare your county with others to understand disparities and trends</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>Add layers to your research, such as poverty and education rates</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>Access downloadable data for your own analysis or presentations</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-[#AFEEEE]/30">
                                    <CardTitle className="flex items-center text-[#0E2C49]">
                                        <TrendingUp className="h-6 w-6 mr-3 text-[#174A7C]" />
                                        Turn Insight into Action
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-4 text-gray-700">
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>Use CASI's data in meetings with elected officials, school boards, or community coalitions</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>Support campaigns for alternatives to incarceration using real, local data</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-2 h-2 bg-[#1CBECA] rounded-full mt-2 mr-4 flex-shrink-0"></div>
                                            <p>Share findings on social media or in public forums to raise awareness and inspire change</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="border-0 shadow-lg bg-blue-50">
                            <CardHeader className="bg-[#99CCFF]/30">
                                <CardTitle className="flex items-center text-[#0E2C49]">
                                    <Users className="h-6 w-6 mr-3 text-[#174A7C]" />
                                    Who Is CASI For?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({children}) => <p className="text-gray-700 font-medium">{children}</p> }}>
                                    {howToUseSection?.content.split('## Who Is CASI For?')[1] || ''}
                                </ReactMarkdown>
                            </CardContent>
                        </Card>
                    </div>
                </section>






            </div>
        </div>
    );
}