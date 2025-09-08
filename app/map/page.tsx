'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Progress } from '@/app/components/ui/progress';
import { AlertCircle, MapIcon } from 'lucide-react';
import type { RootState } from '@/lib/store';

export default function MapPage() {
    const [progress, setProgress] = useState(13);
    
    // Get map data readiness and status for progressive loading
    const { mapDataReady, dataSourceStatuses, globalError, contentReady } = useSelector((state: RootState) => state.app);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 10);
        return () => clearTimeout(timer);
    }, []);

    const MapStory = useMemo(
        () =>
            dynamic(() => import('@/app/components/widgets/MapStory'), {
                ssr: false,
                loading: () => (
                    <div className='flex flex-col justify-center items-center w-full h-full'>
                        <p className='text-sm m-4 text-gray-500'>Loading map...</p>
                        <Progress value={progress} className='w-[60%]' />
                    </div>
                ),
            }),
        []
    );

    // Show loading state if content isn't ready yet (initial app loading)
    if (!contentReady) {
        return (
            <div className='h-full w-full flex items-center justify-center bg-gray-50'>
                <div className='text-center space-y-4 max-w-md'>
                    <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full'>
                        <MapIcon className='w-8 h-8 text-blue-600' />
                    </div>
                    <h2 className='text-xl font-semibold text-gray-900'>
                        Initializing Application
                    </h2>
                    <p className='text-gray-600'>
                        Loading application data...
                    </p>
                    <Progress value={progress} className='w-full' />
                </div>
            </div>
        );
    }

    // Show loading state while map data is being prepared in background
    if (!mapDataReady) {
        return (
            <div className='h-full w-full flex items-center justify-center bg-gray-50'>
                <div className='text-center space-y-4 max-w-md'>
                    <div className='inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full'>
                        <MapIcon className='w-8 h-8 text-blue-600 animate-pulse' />
                    </div>
                    <h2 className='text-xl font-semibold text-gray-900'>
                        Preparing Map Data
                    </h2>
                    <p className='text-gray-600'>
                        Loading California criminal justice datasets in the background...
                    </p>
                    <Progress value={progress} className='w-full' />
                    <p className='text-sm text-gray-500'>
                        This may take a moment. You can browse other pages while we prepare the map.
                    </p>
                </div>
            </div>
        );
    }

    // Check for map data errors (if data loading completed but failed)
    const mapSources = ['arrest', 'jail', 'county_prison', 'demographic', 'geojson'];
    const mapStatuses = mapSources.map(source => dataSourceStatuses[source as keyof typeof dataSourceStatuses]).filter(Boolean);
    const successfulMapSources = mapStatuses.filter(s => s.status === 'success').length;
    const totalMapSources = mapSources.length;
    const hasMapDataErrors = mapStatuses.some(s => s.status === 'error');
    const allMapSourcesCompleted = mapStatuses.length > 0 && mapStatuses.every(s => s.status === 'success' || s.status === 'error');

    // Show error state if map data loading completed with errors
    if (contentReady && allMapSourcesCompleted && hasMapDataErrors) {
        
        // If we have some successful data sources, show partial functionality warning
        if (successfulMapSources > 0) {
            return (
                <div className='space-y-4 h-[100%] w-[100%]'>
                    {/* Warning banner */}
                    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-4 mt-4'>
                        <div className='flex items-start space-x-3'>
                            <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                            <div>
                                <h3 className='text-sm font-medium text-yellow-800'>
                                    Partial Data Available
                                </h3>
                                <p className='text-sm text-yellow-700 mt-1'>
                                    {successfulMapSources} of {totalMapSources} map datasets loaded successfully. 
                                    Some features may be limited.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Show map with available data */}
                    <div className='flex h-[calc(100%-6rem)] w-[100%]'>
                        <div className='w-full h-full relative'>
                            <MapStory />
                        </div>
                    </div>
                </div>
            );
        }
        
        // If no data loaded, show full error state
        return (
            <div className='h-full w-full flex items-center justify-center bg-gray-50'>
                <div className='text-center space-y-4 max-w-md'>
                    <div className='inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full'>
                        <AlertCircle className='w-8 h-8 text-red-600' />
                    </div>
                    <h2 className='text-xl font-semibold text-gray-900'>
                        Unable to Load Data
                    </h2>
                    <p className='text-gray-600'>
                        {globalError || 'Failed to load required datasets for the map.'}
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Data is ready - show the full map interface
    return (
        <div className='space-y-4 h-[100%] w-[100%]'>
            <div className='flex h-[100%] w-[100%]'>
                <div className='w-full h-full relative'>
                    <MapStory />
                </div>
            </div>
        </div>
    );
} 