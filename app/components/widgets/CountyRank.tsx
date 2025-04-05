'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { MetricType } from '@/lib/features/filters/filterSlice';
import { setSelectedCounty } from '@/lib/features/map/mapSlice';
import { motion, AnimatePresence } from 'motion/react';

// Helper to format Metric string for display (same as in MapStory)
function formatMetricLabel(metric: string) {
    if (metric === 'Total_Cost') return 'Total Cost';
    // Add formatting for other specific metrics if needed
    if (metric === 'Jail_ADP') return 'Avg Daily Population';
    if (metric === 'Count') return 'Arrests'; // Assuming Count means Arrests here

    return metric
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}

export default function CountyRank() {
    const dispatch = useDispatch();
    const counties = useSelector((state: RootState) => state.filters.rankedCounties);
    const selectedMetric = useSelector((state: RootState) => state.filters.selectedMetric);
    const isPerCapita = useSelector((state: RootState) => state.filters.isPerCapita);
    const selectedCounty = useSelector((state: RootState) => state.map.selectedCounty);

    return (
        <div className='space-y-3'>
            <AnimatePresence initial={false}>
                {counties.map((county) => (
                    <motion.div
                        key={county.name}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 50,
                            mass: 1,
                        }}
                        className={`bg-white rounded-lg shadow p-4 mx-2 hover:shadow-md transition-shadow cursor-pointer ${
                            selectedCounty === county.name ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => dispatch(setSelectedCounty(county.name))}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.div className='flex justify-between items-center ' layout>
                            <div className='flex items-center gap-3'>
                                <motion.div
                                    className='text-gray-600 rounded-full w-8 h-8 flex items-center justify-center font-semibold'
                                    layoutId={`rank-${county.rank}`}
                                >
                                    #{county.rank}
                                </motion.div>
                                <div>
                                    <motion.h3 className='font-semibold' layoutId={`name-${county.name}`}>
                                        {county.name}
                                    </motion.h3>
                                    <motion.p className='text-gray-600 text-sm' layoutId={`value-${county.name}`}>
                                        {formatMetricLabel(selectedMetric)}
                                        {isPerCapita ? ' (Per Capita): ' : ': '}
                                        {isPerCapita
                                            ? Number(county.value).toLocaleString(undefined, {
                                                  maximumSignificantDigits: 4,
                                              })
                                            : selectedMetric === 'Total_Cost'
                                            ? `$${Number(county.value).toLocaleString(undefined, {
                                                  maximumFractionDigits: 0,
                                              })}`
                                            : Number(county.value).toLocaleString()}
                                    </motion.p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
