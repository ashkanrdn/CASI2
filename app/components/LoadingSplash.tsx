'use client';

import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


/**
 * Simple loading splash screen with basic spinner
 */
export default function LoadingSplash() {
    const { contentReady } = useSelector((state: RootState) => state.app);

    // Hide loading splash if content is ready
    if (contentReady) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 bg-white flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}