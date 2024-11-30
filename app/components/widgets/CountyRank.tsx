'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { MetricType, setSelectedCounty } from '@/lib/features/filters/filterSlice';
import { motion, AnimatePresence } from 'framer-motion';

export default function CountyRank() {
    const dispatch = useDispatch();
    const counties = useSelector((state: RootState) => state.filters.rankedCounties);
    const selectedMetric = useSelector((state: RootState) => state.filters.selectedMetric);

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
                        className='bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => dispatch(setSelectedCounty(county.name))}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.div className='flex justify-between items-center' layout>
                            <div className='flex items-center gap-3'>
                                <motion.div
                                    className='text-gray-600 rounded-full w-8 h-8 flex items-center justify-center  font-semibold '
                                    layoutId={`rank-${county.rank}`}
                                >
                                    #{county.rank}
                                </motion.div>
                                <div>
                                    <motion.h3 className='font-semibold' layoutId={`name-${county.name}`}>
                                        {county.name}
                                    </motion.h3>
                                    <motion.p className='text-gray-600 text-sm' layoutId={`value-${county.name}`}>
                                        {selectedMetric === MetricType.Cost
                                            ? `$${county.value.toLocaleString()}`
                                            : county.value.toLocaleString()}
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
