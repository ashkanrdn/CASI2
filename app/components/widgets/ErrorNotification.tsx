'use client';

import * as React from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, X } from 'lucide-react';
import { selectFailedSources, DataSourceType } from '@/lib/features/filters/filterSlice';
import { RootState } from '@/lib/store';
import { useState } from 'react';

// Map data source types to display names
const formatDataSourceLabel = (source: DataSourceType): string => {
    switch (source) {
        case 'arrest':
            return 'Arrests';
        case 'jail':
            return 'Jail Population';
        case 'county_prison':
            return 'Prison Population';
        case 'demographic':
            return 'Demographics';
        default:
            return source;
    }
};

export default function ErrorNotification() {
    const failedSources = useSelector(selectFailedSources);
    const [dismissed, setDismissed] = useState(false);

    // Don't show if no failed sources or if dismissed
    if (failedSources.length === 0 || dismissed) {
        return null;
    }

    return (
        <div className='mb-4 p-3 bg-red-50 rounded-lg border border-red-200'>
            <div className='flex items-start justify-between'>
                <div className='flex items-start gap-2 flex-1'>
                    <AlertCircle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
                    <div className='flex-1'>
                        <h4 className='text-sm font-medium text-red-900 mb-1'>
                            Failed to load {failedSources.length === 1 ? 'dataset' : 'datasets'}
                        </h4>
                        <div className='space-y-1'>
                            {failedSources.map(({ source, error }) => (
                                <div key={source} className='text-xs text-red-800'>
                                    <span className='font-medium'>{formatDataSourceLabel(source)}:</span>{' '}
                                    {error || 'Unknown error'}
                                </div>
                            ))}
                        </div>
                        <p className='text-xs text-red-700 mt-2'>
                            You can continue using successfully loaded datasets. Try refreshing the page to retry.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className='text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors'
                    aria-label='Dismiss error'
                >
                    <X className='h-4 w-4' />
                </button>
            </div>
        </div>
    );
}
