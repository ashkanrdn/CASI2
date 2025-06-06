'use client';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ArrowRight, MapPin, BarChart3, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Users, DollarSign, TrendingDown, Search, FileText, Scale } from "lucide-react"

export default function HomePage() {
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

                {/* Introduction Section */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">About CASI</h2>
                            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
                        </div>

                        <div className="prose prose-lg max-w-none">
                            <p className="text-lg text-gray-700 leading-relaxed mb-6">
                                The California Sentencing Institute (CASI) is a powerful tool for understanding how incarceration impacts
                                communities across California. Developed by the Center on Juvenile and Criminal Justice (CJCJ), CASI
                                offers interactive maps and data visualizations that allow users to examine crime and incarceration trends
                                in all 58 California counties.
                            </p>

                            <p className="text-lg text-gray-700 leading-relaxed mb-6">
                                By making this data available to the public, CASI helps advocates, community leaders, policymakers, and
                                researchers push for equity-focused justice policies that reduce reliance on incarceration and promote
                                long-term community safety.
                            </p>

                            <p className="text-lg text-gray-700 leading-relaxed">
                                Since 1985, CJCJ has produced leading research to promote more effective approaches to criminal and
                                juvenile justice policies in California. CASI, launched in 2009, continues that mission by offering
                                county-by-county insights that can be used to understand sentencing patterns, promote equity, and drive
                                change at the local and state levels.
                            </p>
                        </div>
                    </div>
                </section>

                {/* How to Use CASI */}
                <section className="bg-gray-50 py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Use CASI</h2>
                            <p className="text-lg text-gray-600">
                                A tool to understand how incarceration and justice policies affect communities across California
                            </p>
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
                                    <ul className="space-y-2 text-gray-700">
                                        <li>• Use the interactive map to select one of California's 58 counties</li>
                                        <li>• View incarceration rates, crime data, and demographic breakdowns over time</li>
                                        <li>• Compare your county with others to understand disparities and trends</li>
                                        <li>• Add layers to your research, such as poverty and education rates</li>
                                        <li>• Access downloadable data for your own analysis or presentations</li>
                                    </ul>
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
                                    <ul className="space-y-2 text-gray-700">
                                        <li>• Use CASI's data in meetings with elected officials, school boards, or community coalitions</li>
                                        <li>• Support campaigns for alternatives to incarceration using real, local data</li>
                                        <li>• Share findings on social media or in public forums to raise awareness and inspire change</li>
                                    </ul>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-blue-800 font-medium">
                                            • Community organizers looking to highlight racial or geographic disparities
                                        </p>
                                        <p className="text-blue-800 font-medium">
                                            • Legal professionals and participatory defense teams preparing for court or advocacy
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-blue-800 font-medium">
                                            • Journalists and researchers uncovering systemic patterns
                                        </p>
                                        <p className="text-blue-800 font-medium">
                                            • Students and educators exploring justice issues in California
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* California Sentencing History */}
                <section className="py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">California Sentencing History</h2>
                            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            <div className="prose prose-lg">
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    In July 1852, California opened its first land-based adult correctional institution, San Quentin State
                                    Prison, housing 68 inmates. Throughout the late 1800s and early 1900s California experienced low
                                    incarceration rates, and by 1940 state prisons housed only 8,180 inmates.
                                </p>

                                <p className="text-gray-700 leading-relaxed mb-4">
                                    In 1977, the Determinate Sentencing Law (DSL) passed in California, eliminating rehabilitation as a goal
                                    of sentencing in favor of more punitive practices that emphasized incarceration. Consequently,
                                    incarceration rates soared resulting in overcrowding and a deterioration of conditions within the
                                    state's prisons and jails.
                                </p>

                                <p className="text-gray-700 leading-relaxed">
                                    In May 2011, pursuant to the Plata litigation the United States Supreme Court mandated that California
                                    reduce its prison population by more than 30,000 inmates due to unconstitutional prison conditions. In
                                    response, Governor Brown passed Assembly Bill 109 (AB 109), which realigned responsibility for adult
                                    non-serious, non-violent, non-sex offenders to the county level. AB 109 was implemented on October 1,
                                    2011.
                                </p>
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
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Juvenile Justice in California</h2>
                            <div className="w-24 h-1 bg-green-600 mx-auto"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                            <Card className="h-80 flex items-center justify-center bg-white">
                                <div className="text-center">
                                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">Youth Incarceration Trends</p>
                                    <p className="text-gray-400 text-sm">1858 - 2023</p>
                                </div>
                            </Card>

                            <div className="prose prose-lg">
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    In 1858, California opened its first juvenile justice facility, the San Francisco Industrial School, to
                                    care for orphaned, abused, neglected, and delinquent children. In 1903, California became one of the
                                    first states to establish a separate court system for youthful offenders.
                                </p>

                                <p className="text-gray-700 leading-relaxed mb-4">
                                    In the 1990s, youth crime rates began to plummet. However, counties continued to heavily rely on
                                    state-run institutional care and the state facilities became overcrowded—peaking at 150% of design
                                    capacity.
                                </p>

                                <p className="text-gray-700 leading-relaxed">
                                    DJJ closed officially on June 30th, 2023, making California the first state to close a carceral system.
                                    Monitoring for juvenile justice sentencing and detainment practices are now being tracked at a county
                                    level.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Importance of Data */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">The Importance of Data</h2>
                            <div className="w-24 h-1 bg-purple-600 mx-auto"></div>
                        </div>

                        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                            <CardContent className="p-8">
                                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                                    Data-driven research is crucial to analyzing criminal and juvenile justice policy. In California,
                                    statewide appointed governmental bodies compile and maintain data that are regularly relied upon by
                                    local government, the legislature, state and federal agencies, and other criminal justice stakeholders.
                                </p>

                                <p className="text-lg text-gray-700 leading-relaxed">
                                    Improved data collection and accessibility is essential to California as it continues to pursue justice
                                    reform. Currently counties do not uniformly collect data on their local justice systems, and statewide
                                    agencies do not provide full access to their redacted data files.
                                </p>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Poverty Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        The rates of each county's adult residents age 18-64 living in households with incomes below poverty
                                        guidelines (five year average). This comparison provides additional socio-economic information that
                                        can be utilized as an indicator of crime and arrest policies.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Arrest Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Adult felony arrests are shown per 100,000 adults age 18-69. The rate of felony arrests shows the
                                        volume of each county's criminal justice population.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Reported Crime Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Part I crimes (aggravated assault, forcible rape, murder, robbery, arson, burglary, larceny-theft,
                                        motor vehicle theft) reported to police are shown for each county per 100,000 adults age 18-69.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Un-sentenced Inmates</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Un-sentenced jail inmates are shown as a percentage of each county's average daily jail population as
                                        of Dec. 31. The percentage may be due to inability to post bail, public safety or flight risk, or slow
                                        criminal justice processing.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Prisoners Held Locally</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Jail populations are shown as a percent of each county's total incarcerated population (state prison +
                                        county jail) as of Dec. 31. Indicates each counties' varying use of local as opposed to state
                                        incarceration options.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Jail Populations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Jail populations as of Dec. 31 are shown per 100,000 adults age 18-69. This rate demonstrates the
                                        prevalence of local incarceration practices within the county.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">New Felony Admissions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        New felony admissions to state prison for the calendar year are shown per 1,000 adult felony arrests.
                                        This demonstrates the counties' most recent and continuing incarceration trends.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Total Incarceration Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        Total adult incarcerated populations (state prison + county jail) as of Dec. 31 are displayed per
                                        1,000 adult felony arrests. Counties vary in their use of incarceration to manage their criminal
                                        justice populations.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Imprisonment Costs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>
                                        State incarceration costs are based on the Legislative Analyst's estimated annual cost to incarcerate
                                        one prisoner and are displayed as dollar amounts per adult felony arrest for each county.
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
