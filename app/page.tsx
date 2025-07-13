'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Users, DollarSign, TrendingDown, Scale } from "lucide-react"
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

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                {/* Hero Section with Key Stats */}
                {heroSection && (
                    <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl font-bold mb-4">{heroSection.title}</h2>
                                {heroSection.subtitle && (
                                    <p className="text-xl text-blue-100">{heroSection.subtitle}</p>
                                )}
                            </div>

                            {/* Key Statistics Cards */}
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
                                            <DollarSign className="h-8 w-8 text-blue-200" />
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
                                            <TrendingDown className="h-8 w-8 text-blue-200" />
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
                                            <Scale className="h-8 w-8 text-blue-200" />
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
                )}

                {/* About Section */}
                {aboutSection && (
                    <section className="py-16">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{aboutSection.title}</h2>
                                <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
                            </div>

                            <div className="prose prose-lg max-w-none">
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: () => null, // Hide h1 since we use the title from frontmatter
                                        p: ({ children }) => <p className="text-lg text-gray-700 leading-relaxed mb-6">{children}</p>
                                    }}
                                >
                                    {aboutSection.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}