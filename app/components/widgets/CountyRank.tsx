'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { MetricType, setSelectedCounty } from '@/lib/features/filters/filterSlice';

export default function CountyRank() {
    const dispatch = useDispatch();

    const counties = useSelector((state: RootState) => state.filters.rankedCounties);
    const selectedMetric = useSelector((state: RootState) => state.filters.selectedMetric);

    return (
        <div className='space-y-3'>
            {counties.map((county) => (
                <div key={county.name} className='bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow'>
                    <div
                        onClick={() => dispatch(setSelectedCounty(county.name))}
                        className='flex justify-between items-center'
                    >
                        <div className='flex items-center gap-3'>
                            <div className='bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center font-semibold'>
                                #{county.rank}
                            </div>
                            <div>
                                <h3 className='font-semibold'>{county.name}</h3>
                                <p className='text-gray-600 text-sm'>
                                    {selectedMetric === MetricType.Cost
                                        ? `$${county.value.toLocaleString()}`
                                        : county.value.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
