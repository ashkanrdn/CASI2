'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Simple background loading indicator for map data
 */
export default function BackgroundLoadingIndicator() {
    const { contentReady, mapDataReady } = useSelector((state: RootState) => state.app);
    
    // Don't show indicator if content isn't ready yet (full splash is shown)
    // or if map data is already ready
    if (!contentReady || mapDataReady) {
        return null;
    }
    
    return (
        <AnimatePresence>
            <motion.div
                className="fixed top-20 right-4 z-40 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm p-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center space-x-2">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    <p className="text-xs text-gray-600">Loading map data...</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}