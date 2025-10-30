'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { 
    DollarSign, 
    GraduationCap, 
    Briefcase, 
    Users,
    Home,
    Building,
    Flag,
    TrendingUp,
    Info
} from 'lucide-react';
import type { RootState, AppDispatch } from '@/lib/store';
import { fetchDataForSource, calculateStateWideAverage, getCountyDemographicData } from '@/lib/features/filters/filterSlice';

interface DemographicMetric {
    id: string;
    title: string;
    variable: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    formatType: 'percentage' | 'currency' | 'number';
}

// NEW CONSTANT: Maps census variables to display information
const DEMOGRAPHIC_METRICS: DemographicMetric[] = [
    {
        id: 'poverty',
        title: 'Poverty Rate',
        variable: 'Percent of population in poverty',
        description: 'Population below poverty line',
        icon: DollarSign,
        formatType: 'percentage',
    },
    {
        id: 'education',
        title: 'Education Level',
        variable: 'Percent of adults with high school diploma or less',
        description: 'Adults with HS education or less',
        icon: GraduationCap,
        formatType: 'percentage',
    },
    {
        id: 'employment',
        title: 'Unemployment',
        variable: 'Unemployment rate',
        description: 'Unemployment rate',
        icon: Briefcase,
        formatType: 'percentage',
    },
    {
        id: 'income',
        title: 'Household Income',
        variable: 'Median household income',
        description: 'Median household income',
        icon: TrendingUp,
        formatType: 'currency',
    },
    {
        id: 'homeownership',
        title: 'Home Ownership',
        variable: 'Percent owner-occupied homes',
        description: 'Owner-occupied homes',
        icon: Home,
        formatType: 'percentage',
    },
    {
        id: 'homevalue',
        title: 'Home Values',
        variable: 'Media home value',
        description: 'Median home value',
        icon: Building,
        formatType: 'currency',
    },
    {
        id: 'citizenship',
        title: 'Citizenship',
        variable: 'Citizens as percent of age 18+ population',
        description: 'Citizens 18+ years old',
        icon: Flag,
        formatType: 'percentage',
    },
    {
        id: 'population',
        title: 'Adult Population',
        variable: 'Total population age 18-older',
        description: 'Total adult population',
        icon: Users,
        formatType: 'number',
    },
];

// NEW FUNCTION: Format values based on type
const formatValue = (value: number, formatType: 'percentage' | 'currency' | 'number'): string => {
    if (isNaN(value) || value === undefined || value === null) return 'N/A';
    
    switch (formatType) {
        case 'percentage':
            return `${(value * 100).toFixed(1)}%`;
        case 'currency':
            return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        case 'number':
            return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
        default:
            return value.toString();
    }
};

export default function MetricsCards() {
    const dispatch = useDispatch<AppDispatch>();
    const { 
        csvDataSources, 
        dataSourcesStatus, 
        activeFilters 
    } = useSelector((state: RootState) => state.filters);
    const selectedCounty = useSelector((state: RootState) => state.map.selectedCounty);
    
    const demographicData = csvDataSources.demographic || [];
    const isLoading = dataSourcesStatus.demographic === 'loading';
    const currentYear = activeFilters.year;

    // Auto-load demographic data on component mount
    useEffect(() => {
        if (dataSourcesStatus.demographic === 'idle') {
            dispatch(fetchDataForSource('demographic'));
        }
    }, [dispatch, dataSourcesStatus.demographic]);

    // Get data for selected county or calculate state averages
    const getMetricData = () => {
        if (selectedCounty && demographicData.length > 0) {
            // Get county-specific data
            const countyData = getCountyDemographicData(demographicData, selectedCounty, currentYear);
            return countyData;
        } else if (demographicData.length > 0) {
            // Calculate state-wide averages
            const averages: Record<string, number> = {};
            DEMOGRAPHIC_METRICS.forEach(metric => {
                const average = calculateStateWideAverage(demographicData, metric.variable, currentYear);
                averages[metric.variable] = average;
            });
            return averages;
        }
        return {};
    };

    const metricData = getMetricData();
    const displayTitle = selectedCounty ? `${selectedCounty} County Metrics` : 'California Statewide Averages';

    // Handle metric card clicks (for future functionality)
    const handleMetricClick = (metric: DemographicMetric) => {
        // Future functionality: Could navigate to detailed view or show more info
    };

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading demographic data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-6">
                <motion.h2 
                    className="text-2xl font-bold text-gray-800"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {displayTitle}
                </motion.h2>
                
                {/* Info Icon with Popover */}
                <div className="relative group">
                    <Button
                        variant='ghost'
                        size='sm'
                        className='h-4 w-4 p-0 hover:bg-gray-100'
                    >
                        <Info className='h-3 w-3 text-gray-500' />
                    </Button>
                    
                    {/* Info Popover */}
                    <div className='absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-sm p-3 rounded shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 border'>
                        <p className='mb-2 text-gray-700'>
                            Demographic and economic indicators for {currentYear}. {selectedCounty ? 'County-specific data.' : 'Statewide averages across all counties.'}
                        </p>
                        <Link 
                            href="/data" 
                            className='text-blue-600 hover:text-blue-800 font-medium underline pointer-events-auto'
                        >
                            View Data Information →
                        </Link>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-4 items-center">
                {DEMOGRAPHIC_METRICS.map((metric, index) => {
                    const IconComponent = metric.icon;
                    const value = metricData[metric.variable] || 0;
                    const formattedValue = formatValue(value, metric.formatType);
                    
                    return (
                        <motion.div
                            key={metric.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                                duration: 0.5, 
                                delay: index * 0.1,
                                type: 'spring',
                                stiffness: 300,
                                damping: 30
                            }}
                            className="w-full max-w-72"
                        >
                            <Card 
                                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                                onClick={() => handleMetricClick(metric)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <IconComponent className="h-8 w-8 text-blue-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <motion.div layoutId={`title-${metric.id}`}>
                                        <CardTitle className="text-lg mb-1">
                                            {metric.title}
                                        </CardTitle>
                                    </motion.div>
                                    
                                    <motion.div
                                        layoutId={`value-${metric.id}`}
                                        className="text-3xl font-bold text-gray-900 mb-2"
                                    >
                                        {formattedValue}
                                    </motion.div>
                                    
                                    <motion.p
                                        layoutId={`description-${metric.id}`}
                                        className="text-sm text-gray-600"
                                    >
                                        {metric.description}
                                    </motion.p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
