import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import Map from 'react-map-gl';
import * as d3 from 'd3';
import type { PickingInfo } from '@deck.gl/core';
import type { Feature } from 'geojson';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    setSelectedMetric,
    setRankedCounties,
    DataSourceMetrics,
    DataSourceType,
    togglePerCapita,
} from '@/lib/features/filters/filterSlice';
import { FlyToInterpolator } from '@deck.gl/core';
import type { ViewStateChangeParameters } from '@deck.gl/core';

import { setBarChartData, setColorScaleValues, setSelectedCounty } from '@/lib/features/map/mapSlice';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

// Mapbox access token for using Mapbox services.
const MAP_BOX_TOKEN = 'pk.eyJ1IjoiYXJhZG5pYSIsImEiOiJjanlhZDdienQwNGN0M212MHp3Z21mMXhvIn0.lPiKb_x0vr1H62G_jHgf7w';

/**
 * Define the geographic boundaries for map constraint (Roughly North/South America).
 * [ [minLongitude, minLatitude], [maxLongitude, maxLatitude] ]
 */
const MAP_BOUNDS: [[number, number], [number, number]] = [
    [-117.595944, 33.386416], // Southwest corner
    [-120.999866, 42.183974], // Northeast corner
];

/**
 * Minimum zoom level allowed. Prevents zooming out too far.
 */
const MIN_ZOOM = 5;

/**
 * Interface defining the structure for the map's view state.
 */
interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number;
    transitionInterpolator?: FlyToInterpolator;
}

/**
 * Initial view state configuration for the DeckGL map.
 */
const INITIAL_VIEW_STATE: ViewState = {
    longitude: -118.41669,
    latitude: 36.7860,
    zoom: 5.5,
    pitch: 0,
    bearing: 0,
};

/**
 * Default coordinates used when county coordinates cannot be determined.
 */
const INITIAL_COORDINATES = {
    longitude: -122.41669,
    latitude: 37.7853,
};

/**
 * Extends the standard GeoJSON Feature to include calculated properties
 * based on the selected metric and data source.
 */
interface EnhancedFeature extends Feature {
    properties: {
        name: string;
        [metricKey: string]: any; // Allows indexing by selectedMetric string
        rawValue: number; // Original aggregated value from the data
        perCapitaValue?: number; // Value calculated per capita if applicable
        rowCount: number; // Number of data rows contributing to the aggregation
        totalCostValue?: number; // Specifically calculated total cost for county_prison data
        avgCostPerPrisonerValue?: number; // Specifically calculated average cost per prisoner
    };
}


// TODO: need to hook this to demographic data so it updates with the year selected from filter slice 
/**
 * Static population data for California counties.
 * Used for per capita calculations. from 2025
 */
export const COUNTY_POPULATION = {
    Alameda: 1649060,
    Alpine: 1099,
    Amador: 42026,
    Butte: 208334,
    Calaveras: 46505,
    Colusa: 22074,
    'Contra Costa': 1172607,
    'Del Norte': 27009,
    'El Dorado': 192823,
    Fresno: 1024125,
    Glenn: 28304,
    Humboldt: 132380,
    Imperial: 181724,
    Inyo: 18485,
    Kern: 922529,
    Kings: 154913,
    Lake: 67764,
    Lassen: 28340,
    'Los Angeles': 9757179,
    Madera: 165432,
    Marin: 256400,
    Mariposa: 17048,
    Mendocino: 89175,
    Merced: 296774,
    Modoc: 8491,
    Mono: 12991,
    Monterey: 436251,
    Napa: 132727,
    Nevada: 102195,
    Orange: 3170435,
    Placer: 433822,
    Plumas: 18834,
    Riverside: 2529933,
    Sacramento: 1611231,
    'San Benito': 69159,
    'San Bernardino': 2214281,
    'San Diego': 3298799,
    'San Francisco': 827526,
    'San Joaquin': 816108,
    'San Luis Obispo': 281843,
    'San Mateo': 742893,
    'Santa Barbara': 444500,
    'Santa Clara': 1926325,
    'Santa Cruz': 262406,
    Shasta: 181121,
    Sierra: 3113,
    Siskiyou: 42498,
    Solano: 455101,
    Sonoma: 485375,
    Stanislaus: 556972,
    Sutter: 98545,
    Tehama: 64451,
    Trinity: 15642,
    Tulare: 483546,
    Tuolumne: 53893,
    Ventura: 835427,
    Yolo: 225251,
    Yuba: 87469,
};

/**
 * Static descriptions for different data sources and their metrics.
 * Used to display information in the description box on the map.
 */
const dataDescriptions = {
    arrest: {
        name: 'Arrest Data',
        description:
            'Explore how California counties use arrests as a response to crime, revealing justice system practices and community impacts across demographics and offense types.',
        metrics: {
            Arrest_rate: 'Rate of arrests per population for the selected filters and county.',
            Total_Arrests: 'Total number of arrests recorded for the selected filters and county.',
        },
    },
    county_prison: {
        name: 'County Prison Data',
        description:
            'Examine imprisonment patterns and associated costs to understand how local sentencing practices impact state resources and community safety outcomes.',
        metrics: {
            Imprisonments: 'Total number of imprisonments recorded for the county.',
            Cost_per_prisoner: 'Average cost per prisoner for the county.',
            Total_Cost: 'Calculated total cost based on imprisonments and cost per prisoner.',
        },
    },
    jail: {
        name: 'Jail Data',
        description: 'Understand how counties rely on local incarceration and the extent of pretrial detention in California\'s justice system.',
        metrics: {
            ADPtotrate: 'Average Daily Population total rate per capita for the county.',
            ADPtotal: 'Total Average Daily Population count for the county.',
            Felonyrate: 'Felony-related jail population rate per capita for the county.',
            Misdrate: 'Misdemeanor-related jail population rate per capita for the county.',
            Felony: 'Total count of felony-related jail population for the county.',
            Misd: 'Total count of misdemeanor-related jail population for the county.',
            Postdisp: 'Post-disposition jail population count for the county.',
            Predisp: 'Pre-disposition jail population count for the county.',
        },
    },
    // Add other data sources as needed
};

/**
 * Main component for displaying the interactive map story.
 * It fetches GeoJSON data, merges it with filtered data from Redux state,
 * renders the map using DeckGL and Mapbox, and handles user interactions
 * like hovering, selecting metrics, and toggling per capita view.
 */
export default function MapStory() {
    const dispatch = useDispatch<AppDispatch>();
    // Selectors to get relevant data and settings from the Redux store.
    const {
        filteredData,
        selectedMetric,
        selectedDataSource,
        isPerCapita,
        selectedCounties = [],
    } = useSelector((state: RootState) => state.filters);
    const selectedCounty = useSelector((state: RootState) => state.map.selectedCounty);


    // State for storing the fetched GeoJSON data for California counties.
    const [geojsonData, setGeojsonData] = useState<Feature[]>([]);
    // State for storing information about the currently hovered county feature.
    const [hoverInfo, setHoverInfo] = useState<{
        x: number; // Screen x-coordinate for positioning the tooltip
        y: number; // Screen y-coordinate for positioning the tooltip
        object?: EnhancedFeature; // The hovered map feature
    } | null>(null);
    // State for managing the map's viewport (position, zoom, etc.).
    const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
    // State to hold the numerical values used for the color scale (for legend/potential analysis).
    const [colorValues, setColorValues] = useState<number[]>([]);
    // State for expandable metric buttons
    const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

    // --- NEW Worker Related State ---
    const workerRef = useRef<Worker | null>(null);
    const [processing, setProcessing] = useState(false); // Loading state
    const [showLoading, setShowLoading] = useState(false); // Whether to show loading UI
    // State to hold the results from the worker
    const [enhancedGeojson, setEnhancedGeojson] = useState<EnhancedFeature[]>([]);
    const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Effect to Initialize Worker ---
    useEffect(() => {
        // Create the worker instance
        workerRef.current = new Worker(new URL('../workers/dataProcessor.worker.ts', import.meta.url));
        console.log('Worker created');

        // Listener for messages from the worker
        workerRef.current.onmessage = (event: MessageEvent<EnhancedFeature[] | { error: string }>) => {
            if ('error' in event.data) {
                console.error('Error message from worker:', event.data.error);
                // Handle worker error (e.g., show message to user)
            } else {
                console.log('Message received from worker:', event.data.length, 'features');
                setEnhancedGeojson(event.data); // Update state with the computed features
            }
            setProcessing(false); // Calculation finished (or errored)
            setShowLoading(false); // Hide loading indicator

            // Clear any pending timer
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        };

        // Listener for errors occurring in the worker itself
        workerRef.current.onerror = (error) => {
            console.error('Worker error:', error);
            setProcessing(false); // Stop loading indicator on error
            setShowLoading(false); // Hide loading indicator

            // Clear any pending timer
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        };

        // Cleanup function: Terminate the worker when the component unmounts
        return () => {
            console.log('Terminating worker');
            workerRef.current?.terminate();

            // Clear any pending timer
            if (loadingTimerRef.current) {
                clearTimeout(loadingTimerRef.current);
                loadingTimerRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount

    /**
     * Fetches the GeoJSON data for California counties on component mount.
     */
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
    }, []); // Empty dependency array ensures this runs only once on mount.

    // --- Effect to Trigger Worker Calculation ---
    useEffect(() => {
        // Don't proceed if worker isn't ready or we don't have base geojson yet
        if (!workerRef.current || geojsonData.length === 0) {
            return;
        }

        setProcessing(true); // Set loading state
        setShowLoading(false); // Reset loading visibility initially

        // Clear any existing timeout
        if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current);
        }

        // Set a timeout to show loading indicator after 0.5 seconds
        loadingTimerRef.current = setTimeout(() => {
            if (processing) {
                // Only show if still processing
                setShowLoading(true);
            }
            loadingTimerRef.current = null;
        }, 500);

        // Send data needed for calculation to the worker
        workerRef.current.postMessage({
            geojsonFeatures: geojsonData,
            filteredData,
            selectedMetric,
            dataSource: selectedDataSource,
            isPerCapita,
        });
    }, [geojsonData, filteredData, selectedMetric, selectedDataSource, isPerCapita]); // Dependencies that trigger recalculation

    /**
     * Memoized calculation for the D3 color scale used to color the map features.
     * It determines the scale's domain based on the current values in `enhancedGeojson`
     * for the `selectedMetric`. It also updates the `colorValues` state.
     */
    const colorScale = useMemo(() => {
        const values = enhancedGeojson
            .map((f) => {
                // Access the property corresponding to the selectedMetric
                const val = f.properties[selectedMetric];
                return val;
            })
            // Filter out non-numeric or NaN values.
            .filter((val): val is number => typeof val === 'number' && !isNaN(val));
        // Update the separate state holding just the numeric color values.
        setColorValues(values);
        // Create a sequential color scale using D3.
        return (
            d3
                .scaleSequential<string>()
                // Domain is from 0 to the maximum valid value found.
                .domain([0, d3.max(values.filter((v) => isFinite(v))) || 0])
                // Use orange color interpolation.
                .interpolator(d3.interpolateBlues)
        );
    }, [enhancedGeojson, selectedMetric]); // Recalculate when features or metric change.

    /**
     * Effect to dispatch the calculated color scale values to the Redux store.
     * This allows other components (like a legend component) to access these values.
     */
    useEffect(() => {
        dispatch(setColorScaleValues(colorValues));
    }, [enhancedGeojson, selectedMetric, colorValues, dispatch]); // Dispatch when values change.

    /**
     * Memoized calculation to rank counties based on the selected metric's value.
     * Returns a sorted array of counties with their names, values, and ranks.
     */
    const rankedCounties = useMemo(() => {
        return (
            enhancedGeojson
                .map((feature) => ({
                    name: feature.properties.name,
                    value: feature.properties[selectedMetric], // Get the value for the current metric
                    rank: 0, // Placeholder for rank
                }))
                // Sort counties in descending order based on the metric value.
                .sort((a, b) => b.value - a.value)
                // Assign ranks based on the sorted order.
                .map((county, index) => ({
                    ...county,
                    rank: index + 1,
                }))
        );
    }, [enhancedGeojson, selectedMetric]); // Recalculate when features or metric change.

    /**
     * Effect to dispatch the calculated ranked county list to the Redux store.
     */
    useEffect(() => {
        dispatch(setRankedCounties(rankedCounties));
    }, [rankedCounties, dispatch]); // Dispatch when ranks change.

    /**
     * Memoized calculation for data formatted for a potential bar chart component.
     * Sorts counties based on the current display value (raw or per capita).
     */
    const barChartData = useMemo(() => {
        const data = enhancedGeojson
            .map((feature) => ({
                county: feature.properties.name,
                // Use perCapitaValue if available and toggled, otherwise use rawValue.
                value:
                    isPerCapita && feature.properties.perCapitaValue !== undefined
                        ? feature.properties.perCapitaValue
                        : feature.properties.rawValue,
            }))
            // Sort descending by value.
            .sort((a, b) => b.value - a.value);
        return data;
    }, [enhancedGeojson, selectedMetric, isPerCapita]); // Recalculate when data, metric, or perCapita changes.

    /**
     * Effect to dispatch the formatted bar chart data to the Redux store.
     */
    useEffect(() => {
        dispatch(setBarChartData(barChartData));
    }, [barChartData, dispatch]); // Dispatch when bar chart data changes.

    /**
     * Calculates the approximate centroid coordinates for a given county polygon/multipolygon.
     * This is used to center the map view when a county is selected.
     * @param countyName The name of the county.
     * @returns An object containing the longitude and latitude of the centroid, or initial coordinates if not found.
     */
    const getCountyCoordinates = (countyName: string) => {
        // Find the GeoJSON feature corresponding to the county name.
        const county = enhancedGeojson.find((feature) => feature.properties.name === countyName);

        // Return default coordinates if the county or its geometry is not found.
        if (!county || !county.geometry) {
            return INITIAL_COORDINATES;
        }

        // Handle MultiPolygon geometries (multiple separate landmasses).
        if (county.geometry.type === 'MultiPolygon') {
            // Flatten the coordinates array to get a list of all [lng, lat] points.
            const allCoords = county.geometry.coordinates.flat(2) as [number, number][];
            // Calculate the average longitude and latitude.
            const centroid = allCoords.reduce(
                (acc, coord) => {
                    acc.longitude += coord[0];
                    acc.latitude += coord[1];
                    return acc;
                },
                { longitude: 0, latitude: 0 }
            );
            return {
                longitude: centroid.longitude / allCoords.length,
                latitude: centroid.latitude / allCoords.length,
            };
        }
        // Handle simple Polygon geometries.
        else if (county.geometry.type === 'Polygon') {
            // Flatten the coordinates array (usually only one level for Polygon).
            const allCoords = county.geometry.coordinates.flat(1) as [number, number][];
            // Calculate the average longitude and latitude.
            const centroid = allCoords.reduce(
                (acc, coord) => {
                    acc.longitude += coord[0];
                    acc.latitude += coord[1];
                    return acc;
                },
                { longitude: 0, latitude: 0 }
            );
            return {
                longitude: centroid.longitude / allCoords.length,
                latitude: centroid.latitude / allCoords.length,
            };
        }

        // Fallback to default coordinates if geometry type is unsupported.
        return INITIAL_COORDINATES;
    };

    /**
     * Effect to update the map's view state (fly to county) when a county is selected
     * from another component (via Redux `selectedCounty` state).
     */
    useEffect(() => {
        if (selectedCounty) {
            // Calculate the centroid of the selected county.
            const polygonCentroid = getCountyCoordinates(selectedCounty);
            // Update the view state to fly to the calculated coordinates.
            setViewState((prevState) => ({
                ...prevState,
                longitude: polygonCentroid.longitude,
                latitude: polygonCentroid.latitude,
                zoom: 10, // Zoom in closer
                transitionDuration: 1000, // Animation duration
                transitionInterpolator: new FlyToInterpolator(), // Smooth fly-to animation
            }));
        }
    }, [selectedCounty]); // Run when selectedCounty changes.

    /**
     * DeckGL layers configuration. Defines the GeoJsonLayer used to render counties.
     */
    const layers = [
        new GeoJsonLayer({
            id: 'counties',
            data: enhancedGeojson, // Use the state that's updated from the worker
            stroked: true, // Draw county borders.
            filled: true, // Fill counties with color.
            lineWidthMinPixels: 1, // Ensure borders are visible.
            // Function to determine the fill color based on the feature's metric value and the color scale.
            getFillColor: (feature) => {
                const value = feature.properties[selectedMetric];
                // Check if there are selected counties and this county is not among them
                if (
                    selectedCounties &&
                    selectedCounties.length > 0 &&
                    !selectedCounties.includes(feature.properties.name)
                ) {
                    // Return grey color for unselected counties
                    return [200, 200, 200, 150]; // Light grey with some transparency
                }

                // Default coloring based on metric value for selected counties
                const colorString = colorScale(value); // Get color from the scale
                const rgb = d3.rgb(colorString); // Convert to RGB
                return [rgb.r, rgb.g, rgb.b, 200]; // Return as [R, G, B, Alpha] array
            },
            getLineColor: (feature) => {
                // Use lighter border for unselected counties when filtering is active
                if (
                    selectedCounties &&
                    selectedCounties.length > 0 &&
                    !selectedCounties.includes(feature.properties.name)
                ) {
                    return [180, 180, 180]; // Light grey for borders of unselected counties
                }
                return [255, 255, 255]; // White borders for selected or when no filtering
            },
            getLineWidth: 1,
            pickable: true, // Allow features to be hovered/clicked.
            autoHighlight: true, // Automatically highlight hovered feature.
            highlightColor: [255, 255, 255, 50], // Semi-transparent white highlight.
            // Add color transitions - smooth animation when colors change
            transitions: {
                getFillColor: {
                    duration: 400, // Animation duration in milliseconds
                    easing: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2, // ease-in-out-sine for smooth transition
                },
                getLineColor: {
                    duration: 400,
                    easing: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
                },
            },
            // Callback function when a feature is hovered.
            onHover: (info: PickingInfo) => {
                if (info.object) {
                    // If hovering over a feature, update hoverInfo state for tooltip display.
                    setHoverInfo({
                        x: info.x,
                        y: info.y,
                        object: info.object as EnhancedFeature, // The enhanced feature data
                    });
                } else {
                    // If not hovering over a feature, clear hoverInfo.
                    setHoverInfo(null);
                }
            },
            // NEW: Callback function when a feature is clicked to select county
            onClick: (info: PickingInfo) => {
                if (info.object) {
                    const feature = info.object as EnhancedFeature;
                    const countyName = feature.properties.name;
                    console.log('🗺️ [MapStory] County clicked:', countyName);
                    dispatch(setSelectedCounty(countyName));
                } else {
                    // Clear selection if clicking on empty area
                    console.log('🗺️ [MapStory] Empty area clicked, clearing selection');
                    dispatch(setSelectedCounty(''));
                }
            },
            // Triggers update of the layer when these props change.
            updateTriggers: {
                getFillColor: [selectedMetric, enhancedGeojson, isPerCapita, selectedCounties], // Added selectedCounties
                getLineColor: [selectedCounties], // Update line color when selected counties change
            },
        }),
    ];

    /**
     * Callback function to handle changes in the DeckGL view state (e.g., panning, zooming).
     * Updates the local `viewState` after applying constraints.
     * @param params Object containing the new view state information.
     */
    const handleViewStateChange = (params: ViewStateChangeParameters) => {
        const newViewState: ViewState = {
            longitude: params.viewState.longitude,
            latitude: params.viewState.latitude,
            zoom: params.viewState.zoom,
            pitch: params.viewState.pitch || 0,
            bearing: params.viewState.bearing || 0,
            // Preserve transition properties if they exist in the incoming view state.
            ...(params.viewState.transitionDuration
                ? {
                      transitionDuration: params.viewState.transitionDuration,
                      transitionInterpolator: new FlyToInterpolator(),
                  }
                : {}),
        };
        // Apply constraints before setting the state
        setViewState(newViewState);
    };

    /**
     * Applies constraints to the view state, preventing panning outside defined bounds
     * and zooming out too much.
     */
    const applyViewStateConstraints = useCallback((viewState: ViewState): ViewState => {
        return {
            ...viewState,
            longitude: Math.min(MAP_BOUNDS[1][0], Math.max(MAP_BOUNDS[0][0], viewState.longitude)),
            latitude: Math.min(MAP_BOUNDS[1][1], Math.max(MAP_BOUNDS[0][1], viewState.latitude)),
            zoom: Math.max(MIN_ZOOM, viewState.zoom),
        };
    }, []); // No dependencies as MAP_BOUNDS and MIN_ZOOM are constant

    // Determine the available metrics based on the currently selected data source.
    const availableMetrics = DataSourceMetrics[selectedDataSource] || [];

    // Get the descriptive text for the current data source and selected metric.
    const currentDataSourceInfo = dataDescriptions[selectedDataSource as keyof typeof dataDescriptions] || {
        name: 'Unknown Data',
        description: 'No description available.',
        metrics: {},
    };
    const currentMetricInfo =
        currentDataSourceInfo.metrics[selectedMetric as keyof typeof currentDataSourceInfo.metrics] ||
        'No metric description available.';

    // Render the component UI.
    return (
        <div className='relative w-full h-full overflow-hidden'>
            {/* Loading Overlay - Only shown after delay */}
            {processing && showLoading && (
                <div className='absolute inset-0 bg-black/30 flex items-center justify-center z-50'>
                    <div className='bg-white/90 p-4 rounded-lg shadow-lg text-center'>
                        <div className='mb-2 text-lg font-semibold'>Processing Data...</div>
                        <Progress value={100} className='w-[60%]' />
                    </div>
                </div>
            )}

            {/* Top Controls: Metric selection buttons and Per Capita toggle */}
            <div className='absolute top-4 left-4 z-10 p-2 max-w-[calc(100%-2rem)]'>
                <div className='flex flex-wrap items-center gap-4'>
                    {/* Metric Buttons */}
                    <div className='flex flex-wrap gap-2'>
                        {/* Always show first 2 metrics */}
                        {availableMetrics.slice(0, 2).map((metric, index) => (
                            <motion.div
                                key={metric}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ 
                                    duration: 0.3, 
                                    delay: index * 0.1,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25
                                }}
                            >
                                <Button
                                    onClick={() => dispatch(setSelectedMetric(metric))}
                                    className={`h-8 text-xs ${selectedMetric === metric ? 'text-white' : ''}`}
                                    variant={selectedMetric === metric ? 'default' : 'outline'}
                                    disabled={processing}
                                >
                                    {formatMetricLabel(metric)}
                                </Button>
                            </motion.div>
                        ))}
                        
                        {/* Additional metrics with expand/collapse animation */}
                        <AnimatePresence>
                            {isMetricsExpanded && availableMetrics.slice(2).map((metric, index) => (
                                <motion.div
                                    key={metric}
                                    initial={{ 
                                        opacity: 0, 
                                        scale: 0.8,
                                        x: -20
                                    }}
                                    animate={{ 
                                        opacity: 1, 
                                        scale: 1,
                                        x: 0
                                    }}
                                    exit={{ 
                                        opacity: 0, 
                                        scale: 0.8,
                                        x: -20
                                    }}
                                    transition={{ 
                                        duration: 0.3, 
                                        delay: index * 0.05,
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 25
                                    }}
                                >
                                    <Button
                                        onClick={() => dispatch(setSelectedMetric(metric))}
                                        className={`h-8 text-xs ${selectedMetric === metric ? 'text-white' : ''}`}
                                        variant={selectedMetric === metric ? 'default' : 'outline'}
                                        disabled={processing}
                                    >
                                        {formatMetricLabel(metric)}
                                    </Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {/* Expand/Collapse button with rotation animation */}
                        {availableMetrics.length > 2 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ 
                                    duration: 0.3, 
                                    delay: 0.2,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 25
                                }}
                                className="relative group"
                            >
                                <Button
                                    onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 transition-all duration-200 hover:scale-105"
                                    disabled={processing}
                                >
                                    <motion.div
                                        animate={{ 
                                            rotate: isMetricsExpanded ? 180 : 0 
                                        }}
                                        transition={{ 
                                            duration: 0.3,
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20
                                        }}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </motion.div>
                                </Button>
                                {/* Custom Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                    {isMetricsExpanded ? 'Collapse Metrics' : 'Expand Metrics'}
                                    {/* Tooltip arrow */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-900"></div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                    {/* Per Capita Toggle Switch */}
                    <motion.div 
                        className='flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-2 rounded'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                            duration: 0.4, 
                            delay: 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                        }}
                    >
                        <Switch
                            id='per-capita-toggle'
                            checked={isPerCapita}
                            onCheckedChange={() => dispatch(togglePerCapita())}
                            disabled={processing}
                        />
                        <Label htmlFor='per-capita-toggle' className='text-xs font-medium'>
                            Per Capita
                        </Label>
                    </motion.div>
                </div>
            </div>

            {/* Map Container */}
            <div className='absolute inset-0'>
                <DeckGL
                    layers={layers}
                    viewState={viewState}
                    onViewStateChange={handleViewStateChange}
                    controller={true}
                >
                    <Map
                        mapboxAccessToken={MAP_BOX_TOKEN}
                        mapStyle='mapbox://styles/mapbox/light-v11'
                        attributionControl={false} // Hide default Mapbox attribution
                    />
                </DeckGL>

                {/* Tooltip displayed on hover */}
                {hoverInfo && hoverInfo.object && (
                    <div
                        className='absolute z-10 pointer-events-none bg-white p-2 rounded shadow-lg text-xs'
                        style={{
                            left: hoverInfo.x + 10,
                            top: hoverInfo.y + 10,
                            maxWidth: '250px',
                            wordWrap: 'break-word',
                        }}
                    >
                        <h3 className='font-bold text-sm mb-1'>{hoverInfo.object.properties.name}</h3>
                        {/* Display selected metric value (formatted) */}
                        <p>
                            {formatMetricLabel(selectedMetric)}
                            {isPerCapita ? ' (Per Capita)' : ''}:{' '}
                            {isPerCapita
                                ? // Format per capita value with significant digits
                                  Number(hoverInfo.object.properties[selectedMetric] ?? 0).toLocaleString(undefined, {
                                      maximumSignificantDigits: 4,
                                  })
                                : selectedMetric === 'Total_Cost'
                                ? // Format Total Cost as currency
                                  `$${Number(hoverInfo.object.properties[selectedMetric] ?? 0).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 0 }
                                  )}`
                                : // Format other raw values
                                  Number(hoverInfo.object.properties[selectedMetric] ?? 0).toLocaleString()}
                        </p>
                        {/* Display raw value if Per Capita is active */}
                        {isPerCapita && (
                            <p>
                                Raw Value:{' '}
                                {selectedMetric === 'Total_Cost'
                                    ? `$${Number(hoverInfo.object.properties.rawValue ?? 0).toLocaleString(undefined, {
                                          maximumFractionDigits: 0,
                                      })}`
                                    : Number(hoverInfo.object.properties.rawValue ?? 0).toLocaleString()}
                            </p>
                        )}
                        {/* Display Total Cost if applicable and not the primary metric */}
                        {selectedDataSource === 'county_prison' &&
                            selectedMetric !== 'Total_Cost' &&
                            hoverInfo.object.properties.totalCostValue !== undefined && (
                                <p>
                                    Total Cost:{' '}
                                    {`$${Number(hoverInfo.object.properties.totalCostValue ?? 0).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 0 }
                                    )}`}
                                </p>
                            )}
                        {/* Display Average Cost/Prisoner if applicable */}
                        {selectedDataSource === 'county_prison' &&
                            hoverInfo.object.properties.avgCostPerPrisonerValue !== undefined && (
                                <p>
                                    Avg Cost/Prisoner:{' '}
                                    {`$${Number(
                                        hoverInfo.object.properties.avgCostPerPrisonerValue ?? 0
                                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                </p>
                            )}
                        {/* Display Population */}
                        {hoverInfo.object.properties.name &&
                            COUNTY_POPULATION[hoverInfo.object.properties.name as keyof typeof COUNTY_POPULATION] && (
                                <p>
                                    Population:{' '}
                                    {Number(
                                        COUNTY_POPULATION[
                                            hoverInfo.object.properties.name as keyof typeof COUNTY_POPULATION
                                        ]
                                    ).toLocaleString()}
                                </p>
                            )}
                        {/* Display number of aggregated records (if not Total_Cost) */}
                        {selectedMetric !== 'Total_Cost' && (
                            <p>
                                Number of Records: {Number(hoverInfo.object.properties.rowCount ?? 0).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}

                {/* Legend Box with Info Icon */}
                <div className='absolute w-48 bottom-8 left-8 bg-white/10 backdrop-blur-sm p-4 rounded z-10 group'>
                    {/* Info Icon positioned with margin from top-left corner */}
                    <div className='absolute -top-6 -left-1 group'>
                        <Button
                            variant='ghost'
                            size='sm'
                            className='h-4 w-4 p-0 hover:bg-gray-100'
                        >
                            <Info className='h-3 w-3 text-gray-500' />
                        </Button>
                        {/* Info Description Box - appears on hover above the legend */}
                        <div className='absolute bottom-full left-0 mb-2 w-64 bg-white/10 backdrop-blur-sm p-4 rounded z-20 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none'>
                            <h4 className='text-sm font-bold mb-1 break-words'>
                                {currentDataSourceInfo.name}
                            </h4>
                            <p className='mb-2'>
                                {currentDataSourceInfo.description}
                            </p>
                            <p>
                                <span className='font-semibold'>{formatMetricLabel(selectedMetric)}:</span>{' '}
                                {currentMetricInfo}
                            </p>
                        </div>
                    </div>
                    
                    <h4 className='text-sm font-bold mb-2 break-words'>
                        {formatMetricLabel(selectedMetric)}
                        {isPerCapita && <span className='font-normal text-xs'> (Per Capita)</span>}
                    </h4>
                    {/* Color Gradient Bar */}
                    <div
                        className='w-full h-4 relative'
                        style={{
                            background:
                                colorScale.domain()[1] > 0 // Check if max value is > 0 to avoid invalid gradient
                                    ? `linear-gradient(to right, ${colorScale(0)}, ${colorScale(
                                          colorScale.domain()[1] // Max value of the domain
                                      )})`
                                    : '#ccc', // Default grey if max value is 0
                        }}
                    ></div>
                    {/* Min and Max Labels */}
                    <div className='flex justify-between text-xs mt-1'>
                        <span>0</span>
                        <span>
                            {/* Format max value based on metric and per capita */}
                            {isPerCapita
                                ? Number(colorScale.domain()[1]).toLocaleString(undefined, {
                                      maximumSignificantDigits: 2, // Use significant digits for per capita
                                  })
                                : selectedMetric === 'Total_Cost'
                                ? `$${Math.round(colorScale.domain()[1]).toLocaleString()}` // Format as currency
                                : Math.round(colorScale.domain()[1]).toLocaleString()}{' '}
                            {/* Format as integer */}
                        </span>
                    </div>
                </div>


            </div>
        </div>
    );
}

/**
 * Helper function to format metric names (e.g., 'Total_Cost')
 * into more readable labels (e.g., 'Total Cost').
 * @param metric The raw metric string.
 * @returns A formatted string label.
 */
function formatMetricLabel(metric: string) {
    // Handle specific cases for better readability
    switch (metric) {
        case 'Total_Cost':
            return 'Prison Cost';
        case 'Arrest_rate':
            return 'Arrest Rate';
        case 'Total_Arrests':
            return 'Total Arrests';
        case 'ADPtotrate':
            return 'Average Daily Population';
        case 'ADPtotal':
            return 'Average Daily Population Total';
        case 'Felonyrate':
            return 'Felony Rate';
        case 'Misdrate':
            return 'Misdemeanor Rate';
        case 'Felony':
            return 'Felony Count';
        case 'Imprisonments':
            return 'Prison Population';
        case 'Misd':
            return 'Misdemeanor Population';
        case 'Postdisp':
            return 'Sentenced Population';
        case 'Predisp':
            return 'Unsentenced Population';
        default:
            // General formatting: replace underscores with spaces, add space before capitals, capitalize first letter.
            return metric
                .replace(/_/g, ' ') // Replace underscores with spaces
                .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters (for camelCase or PascalCase)
                .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
                .trim(); // Remove leading/trailing spaces
    }
}
