'use client';

import { type ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux';
import { store } from '@/lib/store';
import { preloadContentOnly, preloadMapDataInBackground, type AppState } from '@/lib/features/app/appSlice';
import { fetchDataForSource } from '@/lib/features/filters/filterSlice';
import { loadAllContentSections } from '@/lib/features/content/contentSlice';
import type { RootState, AppDispatch } from '@/lib/store';
import LoadingSplash from '@/app/components/LoadingSplash';
import BackgroundLoadingIndicator from '@/app/components/BackgroundLoadingIndicator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './styles/globals.css';

interface Props {
    readonly children: ReactNode;
}

/**
 * Progressive data preloader component that runs inside Redux Provider context
 * First loads content for immediate page access, then loads map data in background
 */
function DataPreloader() {
    const dispatch = useDispatch<AppDispatch>();
    const { appStatus, contentReady, mapDataReady } = useSelector((state: RootState) => state.app);
    
    useEffect(() => {
        // Only start preload if app is in idle state
        if (appStatus === 'idle') {
            console.log('⚡ [Layout] Starting progressive data loading...');
            
            // Step 1: Load content first for immediate page access
            dispatch(preloadContentOnly())
                .unwrap()
                .then((contentResult) => {
                    console.log('📄 [Layout] Content loaded, distributing to content slice...');
                    
                    // Distribute content data to content slice
                    if (contentResult.contentData.length > 0) {
                        dispatch(loadAllContentSections.fulfilled(
                            contentResult.contentData,
                            '', // requestId
                            undefined, // original args
                        ));
                    }
                    
                    // Step 2: Start background map data loading
                    console.log('🗺️  [Layout] Starting background map data loading...');
                    dispatch(preloadMapDataInBackground())
                        .unwrap()
                        .then((mapResult) => {
                            console.log('✅ [Layout] Map data loaded, distributing CSV data to filter slice...');
                            
                            // Distribute CSV data to filter slice
                            Object.entries(mapResult.csvData).forEach(([dataSource, csvData]) => {
                                if (csvData.length > 0) {
                                    // Create a fulfilled action to store the data in the filter slice
                                    dispatch(fetchDataForSource.fulfilled(
                                        { dataSource: dataSource as any, data: csvData },
                                        '', // requestId - not used in the fulfilled case
                                        dataSource as any, // original args
                                    ));
                                }
                            });
                        })
                        .catch((error) => {
                            console.warn('⚠️  [Layout] Background map data loading failed (pages still functional):', error);
                        });
                })
                .catch((error) => {
                    console.error('❌ [Layout] Critical: Content loading failed (pages may be empty):', error);
                });
        }
    }, [dispatch, appStatus]);
    
    return null; // This component only handles logic, no UI
}

/**
 * App content component that safely uses Redux hooks inside Provider context
 */
function AppContent({ children }: Props) {
    const pathname = usePathname();
    const { mapDataReady } = useSelector((state: RootState) => state.app);
    
    return (
        <>
            <DataPreloader />
            <LoadingSplash />
            <BackgroundLoadingIndicator />
            <html lang='en'>
                <body>
                    <div className='h-screen flex flex-col'>
                        {/* Navigation Header */}
                        <header className='bg-gray-600 text-white p-4'>
                            <nav className='flex justify-between items-center'>
                                {/* Left side - Logo */}
                                <div className='hidden md:flex items-center'>
                                    <Link href="/" className='text-2xl font-bold hover:text-gray-200 transition-colors'>
                                        CASI
                                    </Link>
                                </div>

                                {/* Center - Navigation Links */}
                                <div className='flex items-center space-x-8 mx-auto md:mx-0'>
                                    <Link 
                                        href="/" 
                                        className={`transition-colors ${
                                            pathname === '/' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        About CASI
                                    </Link>
                                    <Link 
                                        href="/history" 
                                        className={`transition-colors ${
                                            pathname === '/history' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        History
                                    </Link>
                                    <Link 
                                        href="/map" 
                                        className={`transition-colors flex items-center space-x-1 ${
                                            pathname === '/map' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        <span>Map</span>
                                        {!mapDataReady && (
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Map data loading..."></div>
                                        )}
                                    </Link>
                                    <Link 
                                        href="/data" 
                                        className={`transition-colors ${
                                            pathname === '/data' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        Data
                                    </Link>
                                </div>

                                {/* Right side - Placeholder */}
                                <div className='hidden md:flex items-center'>
                                    <div className='w-16 h-8'></div>
                                </div>
                            </nav>
                        </header>

                        {/* Main content */}
                        <main className='flex-1 overflow-hidden'>{children}</main>
                    </div>
                </body>
            </html>
        </>
    );
}

export default function RootLayout({ children }: Props) {
    return (
        <Provider store={store}>
            <AppContent>{children}</AppContent>
        </Provider>
    );
}
