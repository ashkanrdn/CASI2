'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { selectLoadingStats, selectDataSourcesStatus, DataSourceType } from '@/lib/features/filters/filterSlice';
import { RootState } from '@/lib/store';

// Map data source types to display names
const formatDataSourceLabel = (source: DataSourceType): string => {
    switch (source) {
        case 'arrest':
            return 'Arrests';
        case 'jail':
            return 'Jail';
        case 'county_prison':
            return 'Prison';
        case 'demographic':
            return 'Demographics';
        default:
            return source;
    }
};

export default function LoadingProgress() {
    const loadingStats = useSelector(selectLoadingStats);
    const dataSourcesStatus = useSelector(selectDataSourcesStatus);

    const allSources: DataSourceType[] = ['arrest', 'jail', 'county_prison', 'demographic'];

    // Don't show if all data is loaded or all are idle
    if (loadingStats.succeeded === loadingStats.total || loadingStats.idle === loadingStats.total) {
        return null;
    }

    const completed = loadingStats.succeeded + loadingStats.failed;
    const total = loadingStats.total;
    const progressPercent = (completed / total) * 100;

    return (
        <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
            <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
                    <span className='text-sm font-medium text-blue-900'>
                        Loading datasets: {completed}/{total} complete
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className='w-full bg-blue-100 rounded-full h-2 mb-3'>
                <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Individual source status */}
            <div className='flex flex-wrap gap-2'>
                {allSources.map((source) => {
                    const status = dataSourcesStatus[source];
                    const label = formatDataSourceLabel(source);

                    return (
                        <div
                            key={source}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                status === 'succeeded'
                                    ? 'bg-green-100 text-green-800'
                                    : status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : status === 'loading'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {status === 'succeeded' && <CheckCircle className='h-3 w-3' />}
                            {status === 'failed' && <XCircle className='h-3 w-3' />}
                            {status === 'loading' && <Loader2 className='h-3 w-3 animate-spin' />}
                            <span>{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
