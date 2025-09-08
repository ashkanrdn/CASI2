/**
 * Memory monitoring utilities for tracking application memory usage
 */

export interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    timestamp: number;
    formattedUsed: string;
    formattedTotal: string;
    usagePercentage: number;
}

/**
 * Get current memory information
 */
export function getMemoryInfo(): MemoryInfo | null {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
        return null;
    }

    const memory = (performance as any).memory;
    const timestamp = Date.now();
    
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const totalMB = memory.totalJSHeapSize / 1024 / 1024;
    const usagePercentage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

    return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp,
        formattedUsed: `${usedMB.toFixed(1)} MB`,
        formattedTotal: `${totalMB.toFixed(1)} MB`,
        usagePercentage: Math.round(usagePercentage),
    };
}

/**
 * Memory monitoring class for continuous tracking
 */
export class MemoryMonitor {
    private samples: MemoryInfo[] = [];
    private intervalId: NodeJS.Timeout | null = null;
    private maxSamples: number;
    private sampleInterval: number;

    constructor(maxSamples = 100, sampleIntervalMs = 5000) {
        this.maxSamples = maxSamples;
        this.sampleInterval = sampleIntervalMs;
    }

    /**
     * Start monitoring memory usage
     */
    start(): void {
        if (this.intervalId) {
            console.warn('💾 [MemoryMonitor] Already monitoring memory');
            return;
        }

        console.log('💾 [MemoryMonitor] Starting memory monitoring');
        this.takeSample(); // Take initial sample
        
        this.intervalId = setInterval(() => {
            this.takeSample();
        }, this.sampleInterval);
    }

    /**
     * Stop monitoring memory usage
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('💾 [MemoryMonitor] Stopped memory monitoring');
        }
    }

    /**
     * Take a memory sample
     */
    private takeSample(): void {
        const memInfo = getMemoryInfo();
        if (memInfo) {
            this.samples.push(memInfo);
            
            // Keep only the most recent samples
            if (this.samples.length > this.maxSamples) {
                this.samples = this.samples.slice(-this.maxSamples);
            }

            // Log warning if memory usage is high
            if (memInfo.usagePercentage > 80) {
                console.warn(`⚠️  [MemoryMonitor] High memory usage: ${memInfo.formattedUsed} (${memInfo.usagePercentage}%)`);
            }
        }
    }

    /**
     * Get current memory statistics
     */
    getStats(): {
        current: MemoryInfo | null;
        peak: MemoryInfo | null;
        average: number;
        trend: 'increasing' | 'decreasing' | 'stable';
        samples: number;
    } {
        const current = getMemoryInfo();
        const peak = this.samples.length > 0 
            ? this.samples.reduce((max, sample) => 
                sample.usedJSHeapSize > max.usedJSHeapSize ? sample : max
              )
            : null;
        
        const average = this.samples.length > 0
            ? this.samples.reduce((sum, sample) => sum + sample.usedJSHeapSize, 0) / this.samples.length / 1024 / 1024
            : 0;

        // Calculate trend over last 10 samples
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        if (this.samples.length >= 10) {
            const recent = this.samples.slice(-10);
            const firstHalf = recent.slice(0, 5);
            const secondHalf = recent.slice(-5);
            
            const firstAvg = firstHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / secondHalf.length;
            
            const diff = secondAvg - firstAvg;
            const threshold = 1024 * 1024; // 1MB threshold
            
            if (diff > threshold) {
                trend = 'increasing';
            } else if (diff < -threshold) {
                trend = 'decreasing';
            }
        }

        return {
            current,
            peak,
            average: Math.round(average * 10) / 10,
            trend,
            samples: this.samples.length,
        };
    }

    /**
     * Log current memory statistics
     */
    logStats(): void {
        const stats = this.getStats();
        console.log('💾 [MemoryMonitor] Memory Stats:', {
            current: stats.current?.formattedUsed,
            peak: stats.peak?.formattedUsed,
            average: `${stats.average} MB`,
            trend: stats.trend,
            samples: stats.samples,
        });
    }

    /**
     * Get memory samples for visualization
     */
    getSamples(): MemoryInfo[] {
        return [...this.samples];
    }

    /**
     * Clear all collected samples
     */
    clearSamples(): void {
        this.samples = [];
        console.log('💾 [MemoryMonitor] Cleared memory samples');
    }
}

/**
 * Global memory monitor instance
 */
export const globalMemoryMonitor = new MemoryMonitor();

/**
 * Initialize memory monitoring for the application
 */
export function initializeMemoryMonitoring(): void {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        globalMemoryMonitor.start();
        
        // Expose memory monitor to global scope for debugging
        (window as any).__memoryMonitor = globalMemoryMonitor;
        
        // Log stats periodically in development
        setInterval(() => {
            globalMemoryMonitor.logStats();
        }, 30000); // Every 30 seconds
    }
}

/**
 * Cleanup memory monitoring
 */
export function cleanupMemoryMonitoring(): void {
    globalMemoryMonitor.stop();
    globalMemoryMonitor.clearSamples();
}