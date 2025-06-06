import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatMetricLabel, formatMetricValue } from '@/app/lib/utils/formatUtils';

interface MapLegendProps {
    selectedMetric: string;
    isPerCapita: boolean;
    colorScale: {
        domain(): [number, number];
        (value: number): string;
    };
}

export function MapLegend({ selectedMetric, isPerCapita, colorScale }: MapLegendProps) {
    const maxValue = colorScale.domain()[1];

    return (
        <AnimatePresence mode='wait'>
            <motion.div
                key={`legend-${selectedMetric}-${isPerCapita}`}
                className='absolute w-48 bottom-8 left-8 bg-white/10 backdrop-blur-sm p-4 rounded z-10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 50,
                }}
            >
                <motion.h4
                    className='text-sm font-bold mb-2 break-words'
                    layoutId={`legend-title-${selectedMetric}`}
                >
                    {formatMetricLabel(selectedMetric)}
                    {isPerCapita && <span className='font-normal text-xs'> (Per Capita)</span>}
                </motion.h4>
                
                {/* Color Gradient Bar */}
                <motion.div
                    className='w-full h-4 relative'
                    layoutId={`legend-gradient-${selectedMetric}`}
                    style={{
                        background:
                            maxValue > 0
                                ? `linear-gradient(to right, ${colorScale(0)}, ${colorScale(maxValue)})`
                                : '#ccc',
                    }}
                />
                
                {/* Min and Max Labels */}
                <motion.div
                    className='flex justify-between text-xs mt-1'
                    layoutId={`legend-labels-${selectedMetric}`}
                >
                    <span>0</span>
                    <span>
                        {formatMetricValue(maxValue, selectedMetric, isPerCapita)}
                    </span>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
} 