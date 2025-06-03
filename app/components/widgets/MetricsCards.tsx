'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Metric {
    id: string;
    title: string;
    value: string;
    description: string;
    icon: string;
    trend?: 'up' | 'down' | 'neutral';
    color: string;
}

// Mock data for the metrics
const MOCK_METRICS: Metric[] = [
    {
        id: 'poverty',
        title: 'Poverty Rate',
        value: '12.3%',
        description: 'Individuals below poverty line',
        icon: '💰',
        trend: 'down',
        color: 'bg-red-50 border-red-200',
    },
    {
        id: 'immigration',
        title: 'Immigration',
        value: '8.7%',
        description: 'Noncitizen population',
        icon: '🌍',
        trend: 'up',
        color: 'bg-blue-50 border-blue-200',
    },
    {
        id: 'education',
        title: 'Education',
        value: '34.2%',
        description: 'Adults with HS diploma or less',
        icon: '🎓',
        trend: 'down',
        color: 'bg-green-50 border-green-200',
    },
    {
        id: 'employment',
        title: 'Employment',
        value: '4.1%',
        description: 'Unemployment rate',
        icon: '💼',
        trend: 'neutral',
        color: 'bg-yellow-50 border-yellow-200',
    },
    {
        id: 'politics',
        title: 'Politics',
        value: '52.8%',
        description: 'Voted red in recent elections',
        icon: '🗳️',
        trend: 'up',
        color: 'bg-purple-50 border-purple-200',
    },
    {
        id: 'population',
        title: 'Population',
        value: '1.2M',
        description: 'Total population',
        icon: '👥',
        trend: 'up',
        color: 'bg-indigo-50 border-indigo-200',
    },
];

const getTrendIcon = (trend?: string) => {
    switch (trend) {
        case 'up':
            return '↗️';
        case 'down':
            return '↘️';
        default:
            return '→';
    }
};

const getTrendColor = (trend?: string) => {
    switch (trend) {
        case 'up':
            return 'text-green-600';
        case 'down':
            return 'text-red-600';
        default:
            return 'text-gray-600';
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
                {MOCK_METRICS.map((metric, index) => (
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
                        className={`${metric.color} rounded-lg border-2 p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 w-full max-w-72`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-3xl">{metric.icon}</div>
                            <div className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                                {getTrendIcon(metric.trend)}
                            </div>
                        </div>
                        
                        <motion.div
                            layoutId={`title-${metric.id}`}
                        >
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                {metric.title}
                            </h3>
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
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
