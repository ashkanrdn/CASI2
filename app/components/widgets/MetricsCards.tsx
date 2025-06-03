'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
    DollarSign, 
    Globe, 
    GraduationCap, 
    Briefcase, 
    Vote, 
    Users,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';

interface Metric {
    id: string;
    title: string;
    value: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'neutral';
    trendColor: string;
}

// Updated metrics with Lucide icons
const MOCK_METRICS: Metric[] = [
    {
        id: 'poverty',
        title: 'Poverty Rate',
        value: '12.3%',
        description: 'Individuals below poverty line',
        icon: DollarSign,
        trend: 'down',
        trendColor: 'text-green-600',
    },
    {
        id: 'immigration',
        title: 'Immigration',
        value: '8.7%',
        description: 'Noncitizen population',
        icon: Globe,
        trend: 'up',
        trendColor: 'text-blue-600',
    },
    {
        id: 'education',
        title: 'Education',
        value: '34.2%',
        description: 'Adults with HS diploma or less',
        icon: GraduationCap,
        trend: 'down',
        trendColor: 'text-green-600',
    },
    {
        id: 'employment',
        title: 'Employment',
        value: '4.1%',
        description: 'Unemployment rate',
        icon: Briefcase,
        trend: 'neutral',
        trendColor: 'text-gray-600',
    },
    {
        id: 'politics',
        title: 'Politics',
        value: '52.8%',
        description: 'Voted red in recent elections',
        icon: Vote,
        trend: 'up',
        trendColor: 'text-red-600',
    },
    {
        id: 'population',
        title: 'Population',
        value: '1.2M',
        description: 'Total population',
        icon: Users,
        trend: 'up',
        trendColor: 'text-blue-600',
    },
];

const getTrendIcon = (trend?: string) => {
    switch (trend) {
        case 'up':
            return TrendingUp;
        case 'down':
            return TrendingDown;
        default:
            return Minus;
    }
};

const getTrendLabel = (trend?: string) => {
    switch (trend) {
        case 'up':
            return 'Increasing';
        case 'down':
            return 'Decreasing';
        default:
            return 'Stable';
    }
};

export default function MetricsCards() {
    return (
        <div className="p-4">
            <motion.h2 
                className="text-2xl font-bold text-gray-800 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                County Metrics Overview
            </motion.h2>
            
            <div className="flex flex-col gap-4 items-center">
                {MOCK_METRICS.map((metric, index) => {
                    const IconComponent = metric.icon;
                    const TrendIcon = getTrendIcon(metric.trend);
                    
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
                            whileHover={{ 
                                scale: 1.02,
                                transition: { duration: 0.2 }
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full max-w-72"
                        >
                            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
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
                                        {metric.value}
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
