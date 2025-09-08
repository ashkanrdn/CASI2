'use client';

import { type ReactNode, useEffect } from 'react';
import { Provider } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux';
import { store } from '@/lib/store';
import { preloadAllAppDataWithProgress, type AppState } from '@/lib/features/app/appSlice';
import { fetchDataForSource } from '@/lib/features/filters/filterSlice';
import type { RootState, AppDispatch } from '@/lib/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './styles/globals.css';

interface Props {
    readonly children: ReactNode;
}

/**
 * Data preloader component that runs inside Redux Provider context
 * Handles app-level data preloading and CSV data distribution to filter slice
 */
function DataPreloader() {
    const dispatch = useDispatch<AppDispatch>();
    const { appStatus, geojsonData } = useSelector((state: RootState) => state.app);
    
    useEffect(() => {
        // Only start preload if app is in idle state
        if (appStatus === 'idle') {
            console.log('🚀 [Layout] Starting app data preload...');
            
            // Dispatch the preload action with progress tracking
            dispatch(preloadAllAppDataWithProgress())
                .unwrap()
                .then((preloadedData) => {
                    console.log('✅ [Layout] Preload completed, distributing CSV data to filter slice...');
                    
                    // Distribute CSV data to filter slice by dispatching individual fetchDataForSource actions
                    // This ensures the filter slice gets the data in the format it expects
                    Object.entries(preloadedData.csvData).forEach(([dataSource, csvData]) => {
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
                    console.error('❌ [Layout] Preload failed:', error);
                });
        }
    }, [dispatch, appStatus]);
    
    return null; // This component only handles logic, no UI
}

export default function RootLayout({ children }: Props) {
    const pathname = usePathname();
    
    return (
        <Provider store={store}>
            <DataPreloader />
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
                                        className={`transition-colors ${
                                            pathname === '/map' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        Map
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
        </Provider>
    );
}
