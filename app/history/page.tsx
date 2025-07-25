'use client';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from "@/app/components/ui/card"
import { BarChart3 } from "lucide-react"
import { getAllContentSections } from '@/lib/content';
import { Button } from '@/app/components/ui/button';

interface ContentSection {
  title: string;
  subtitle?: string;
  order: number;
  visible: boolean;
  section: string;
  content: string;
  frontmatter: Record<string, any>;
}

export default function HistoryPage() {
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

    const historySection = contentSections.find(s => s.section === 'history');
    const juvenileSection = contentSections.find(s => s.section === 'juvenile');

    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                {/* California Sentencing History */}
                {historySection && (
                    <section className="py-16">
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{historySection.title}</h2>
                                <div className="w-24 h-1 bg-[#1CBECA] mx-auto"></div>

                            </div>

                            <div className="max-w-4xl mx-auto">
                                <div className="prose prose-lg mb-8">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: () => null,
                                            p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                                            a: ({ href, children }) => (
                                                <a 
                                                    href={href} 
                                                    className="text-[#174A7C] hover:text-[#1CBECA] underline transition-colors"
                                                    target={href?.startsWith('http') ? '_blank' : undefined}
                                                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                >
                                                    {children}
                                                </a>
                                            )
                                        }}
                                    >
                                        {historySection.content}
                                    </ReactMarkdown>
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
                )}

                {/* Juvenile Justice History */}
                {juvenileSection && (
                    <section className="bg-gray-50 py-16">
                        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">{juvenileSection.title}</h2>
                            <div className="w-24 h-1 bg-[#1CBECA] mx-auto"></div>

                            </div>

                            <div className="max-w-4xl mx-auto">
                                <div className="prose prose-lg mb-8">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: () => null,
                                            p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                                            a: ({ href, children }) => (
                                                <a 
                                                    href={href} 
                                                    className="text-[#174A7C] hover:text-[#1CBECA] underline transition-colors"
                                                    target={href?.startsWith('http') ? '_blank' : undefined}
                                                    rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                >
                                                    {children}
                                                </a>
                                            )
                                        }}
                                    >
                                        {juvenileSection.content}
                                    </ReactMarkdown>
                                </div>

                                <Card className="h-80 flex items-center justify-center bg-white">
                                    <div className="text-center">
                                        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium">Youth Incarceration Trends</p>
                                        <p className="text-gray-400 text-sm">1858 - 2023</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
} 