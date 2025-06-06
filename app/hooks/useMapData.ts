import { useState, useEffect, useRef } from 'react';
import type { Feature } from 'geojson';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import type { EnhancedFeature } from '@/app/lib/utils/geometryUtils';

export function useMapData() {
    const {
        filteredData,
        selectedMetric,
        selectedDataSource,
        isPerCapita,
    } = useSelector((state: RootState) => state.filters);

    // State for storing the fetched GeoJSON data for California counties.
    const [geojsonData, setGeojsonData] = useState<Feature[]>([]);
    
    // --- Worker Related State ---
    const workerRef = useRef<Worker | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [enhancedGeojson, setEnhancedGeojson] = useState<EnhancedFeature[]>([]);
    const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../components/workers/dataProcessor.worker.ts', import.meta.url),
            { type: 'module' }
        );

        // Listener for messages from the worker
        workerRef.current.onmessage = (event: MessageEvent<EnhancedFeature[] | { error: string }>) => {
            if ('error' in event.data) {
                console.error('Error message from worker:', event.data.error);
            } else {
                setEnhancedGeojson(event.data);
            }
            setProcessing(false);
            setShowLoading(false);

            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        };

        // Listener for worker errors
        workerRef.current.onerror = (error) => {
            console.error('Worker error:', error);
            setProcessing(false);
            setShowLoading(false);

            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        };

        // Cleanup function
        return () => {
            workerRef.current?.terminate();
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        };
    }, []);

    // Fetch GeoJSON data
    useEffect(() => {
        const fetchGeoJsonData = async () => {
            try {
                const response = await fetch('/california-counties.geojson');
                const data = await response.json();
                if (data.features) {
                    setGeojsonData(data.features);
                }
            } catch (error) {
                console.error('Error loading GeoJSON data:', error);
            }
        };

        fetchGeoJsonData();
    }, []);

    // Trigger Worker Calculation
    useEffect(() => {
        if (!workerRef.current || geojsonData.length === 0) {
            return;
        }

        setProcessing(true);
        setShowLoading(false);

        if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current);
        }

        // Show loading indicator after 500ms delay
        loadingTimerRef.current = setTimeout(() => {
            if (processing) {
                setShowLoading(true);
            }
            loadingTimerRef.current = null;
        }, 500);

        // Send data to worker
        workerRef.current.postMessage({
            geojsonFeatures: geojsonData,
            filteredData,
            selectedMetric,
            dataSource: selectedDataSource,
            isPerCapita,
        });
    }, [geojsonData, filteredData, selectedMetric, selectedDataSource, isPerCapita]);

    return {
        geojsonData,
        enhancedGeojson,
        processing,
        showLoading,
    };
} 