'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { fetchDataForSource, DataSourceType } from '@/lib/features/filters/filterSlice';

/**
 * DataPreloader Component
 *
 * Initiates data fetching for all data sources when the app loads.
 * This component is rendered at the top level of the app (in layout.tsx)
 * to ensure data starts loading immediately, before users navigate to
 * specific pages.
 *
 * Fetches all 4 data sources in parallel:
 * - arrest
 * - jail
 * - county_prison
 * - demographic
 */
export default function DataPreloader() {
    const dispatch = useDispatch<AppDispatch>();
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!hasInitialized) {
            const allSources: DataSourceType[] = ['arrest', 'jail', 'county_prison', 'demographic'];

            console.log('🚀 [DataPreloader] Starting to pre-fetch all data sources...');

            // Dispatch fetches for all sources in parallel
            allSources.forEach(source => {
                dispatch(fetchDataForSource(source));
            });

            setHasInitialized(true);
        }
    }, [hasInitialized, dispatch]);

    // This component doesn't render anything visible
    return null;
}
