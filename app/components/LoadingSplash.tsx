'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { DataSourceType } from '@/lib/features/filters/filterSlice';
import { Progress } from '@/app/components/ui/progress';
import { CheckIcon, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Data source display configurations
 */
const DATA_SOURCE_CONFIG: Record<DataSourceType | 'geojson', { name: string; description: string }> = {
    arrest: {
        name: 'Arrest Data',
        description: 'California county-level arrest statistics',
    },
    jail: {
        name: 'Jail Population',
        description: 'Local jail population and booking data',
    },
    county_prison: {
        name: 'Prison Data',
        description: 'County prison population and costs',
    },
    demographic: {
        name: 'Demographics',
        description: 'Population and socioeconomic indicators',
    },
    geojson: {
        name: 'Geographic Data',
        description: 'California county boundary maps',
    },
};

/**
 * Individual data source loading status component
 */
function DataSourceStatus({ 
    source, 
    config, 
    status 
}: { 
    source: DataSourceType | 'geojson';
    config: { name: string; description: string };
    status: { status: 'idle' | 'loading' | 'success' | 'error'; error?: string; loadedCount?: number };
}) {
    const getStatusIcon = () => {
        switch (status.status) {
            case 'loading':
                return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
            case 'success':
                return <CheckIcon className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
        }
    };

    const getStatusColor = () => {
        switch (status.status) {
            case 'loading':
                return 'text-blue-600';
            case 'success':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <motion.div 
            className="flex items-center space-x-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex-shrink-0">
                {getStatusIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${getStatusColor()}`}>
                        {config.name}
                    </h4>
                    {status.loadedCount && (
                        <span className="text-xs text-gray-500">
                            {status.loadedCount.toLocaleString()} records
                        </span>
                    )}
                </div>
                
                <p className="text-xs text-gray-600 mt-1">
                    {config.description}
                </p>
                
                {status.error && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                        Error: {status.error}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

/**
 * Loading splash screen component
 */
export default function LoadingSplash() {
    const { appStatus, dataSourceStatuses, preloadStartTime, preloadEndTime } = useSelector((state: RootState) => state.app);

    // Don't show loading splash if app is ready or idle
    if (appStatus === 'ready' || appStatus === 'idle') {
        return null;
    }

    // Calculate overall progress
    const totalSources = Object.keys(dataSourceStatuses).length;
    const completedSources = Object.values(dataSourceStatuses).filter(
        status => status.status === 'success' || status.status === 'error'
    ).length;
    const successfulSources = Object.values(dataSourceStatuses).filter(
        status => status.status === 'success'
    ).length;
    const progressPercentage = Math.round((completedSources / totalSources) * 100);

    // Calculate loading time
    const loadingTime = preloadStartTime ? Date.now() - preloadStartTime : 0;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-white to-gray-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="h-screen flex items-center justify-center p-6">
                    <div className="max-w-md w-full space-y-6">
                        {/* Header */}
                        <motion.div 
                            className="text-center"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Loading CASI
                            </h1>
                            <p className="text-gray-600">
                                Preparing California criminal justice data...
                            </p>
                        </motion.div>

                        {/* Overall Progress */}
                        <motion.div
                            className="space-y-3"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Overall Progress</span>
                                <span>{successfulSources}/{totalSources} datasets loaded</span>
                            </div>
                            <Progress value={progressPercentage} className="h-3" />
                            <div className="text-center">
                                <span className="text-2xl font-bold text-blue-600">{progressPercentage}%</span>
                            </div>
                        </motion.div>

                        {/* Individual Data Sources */}
                        <motion.div 
                            className="space-y-2"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Data Sources</h3>
                            {Object.entries(dataSourceStatuses).map(([source, status]) => (
                                <DataSourceStatus
                                    key={source}
                                    source={source as DataSourceType | 'geojson'}
                                    config={DATA_SOURCE_CONFIG[source as DataSourceType | 'geojson']}
                                    status={status}
                                />
                            ))}
                        </motion.div>

                        {/* Loading Time and Error State */}
                        <motion.div
                            className="text-center space-y-2"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                        >
                            {loadingTime > 0 && (
                                <p className="text-xs text-gray-500">
                                    Loading time: {Math.round(loadingTime / 1000)}s
                                </p>
                            )}
                            
                            {appStatus === 'error' && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        <p className="text-sm text-red-700 font-medium">
                                            Some data failed to load
                                        </p>
                                    </div>
                                    <p className="text-xs text-red-600 mt-1">
                                        The app will continue with available data. Some features may be limited.
                                    </p>
                                </div>
                            )}
                        </motion.div>

                        {/* Footer */}
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 1 }}
                        >
                            <p className="text-xs text-gray-400">
                                California Sentencing Institute
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}