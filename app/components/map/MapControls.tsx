import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { setSelectedMetric, togglePerCapita, DataSourceMetrics } from '@/lib/features/filters/filterSlice';
import { formatMetricLabel } from '@/app/lib/utils/formatUtils';
import type { RootState, AppDispatch } from '@/lib/store';

interface MapControlsProps {
    processing: boolean;
}

export function MapControls({ processing }: MapControlsProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedMetric, selectedDataSource, isPerCapita } = useSelector((state: RootState) => state.filters);
    const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

    const availableMetrics = DataSourceMetrics[selectedDataSource] || [];

    return (
        <div className='absolute top-4 left-4 z-10 p-2 max-w-[calc(100%-2rem)]'>
            <div className='flex flex-wrap items-center gap-4'>
                {/* Metric Buttons */}
                <div className='flex flex-wrap gap-2'>
                    {/* Always show first 2 metrics */}
                    {availableMetrics.slice(0, 2).map((metric, index) => (
                        <motion.div
                            key={metric}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 400,
                                damping: 25
                            }}
                        >
                            <Button
                                onClick={() => dispatch(setSelectedMetric(metric))}
                                className={`h-8 text-xs ${selectedMetric === metric ? 'text-white' : ''}`}
                                variant={selectedMetric === metric ? 'default' : 'outline'}
                                disabled={processing}
                            >
                                {formatMetricLabel(metric)}
                            </Button>
                        </motion.div>
                    ))}

                    {/* Additional metrics with expand/collapse animation */}
                    <AnimatePresence>
                        {isMetricsExpanded && availableMetrics.slice(2).map((metric, index) => (
                            <motion.div
                                key={metric}
                                initial={{
                                    opacity: 0,
                                    scale: 0.8,
                                    x: -20
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: 0
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    x: -20
                                }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25
                                }}
                            >
                                <Button
                                    onClick={() => dispatch(setSelectedMetric(metric))}
                                    className={`h-8 text-xs ${selectedMetric === metric ? 'text-white' : ''}`}
                                    variant={selectedMetric === metric ? 'default' : 'outline'}
                                    disabled={processing}
                                >
                                    {formatMetricLabel(metric)}
                                </Button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Expand/Collapse button */}
                    {availableMetrics.length > 2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.3,
                                delay: 0.2,
                                type: "spring",
                                stiffness: 400,
                                damping: 25
                            }}
                            className="relative group"
                        >
                            <Button
                                onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 transition-all duration-200 hover:scale-105"
                                disabled={processing}
                            >
                                <motion.div
                                    animate={{
                                        rotate: isMetricsExpanded ? 180 : 0
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20
                                    }}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </motion.div>
                            </Button>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                {isMetricsExpanded ? 'Collapse Metrics' : 'Expand Metrics'}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Per Capita Toggle Switch */}
                <motion.div
                    className='flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-2 rounded'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.4,
                        delay: 0.3,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                    }}
                >
                    <Switch
                        id='per-capita-toggle'
                        checked={isPerCapita}
                        onCheckedChange={() => dispatch(togglePerCapita())}
                        disabled={processing}
                    />
                    <Label htmlFor='per-capita-toggle' className='text-xs font-medium'>
                        Per Capita
                    </Label>
                </motion.div>
            </div>
        </div>
    );
} 