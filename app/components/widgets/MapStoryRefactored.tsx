import React, { useState, useEffect, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import Map from 'react-map-gl';
import * as d3 from 'd3';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyToInterpolator } from '@deck.gl/core';
import type { PickingInfo, ViewStateChangeParameters } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { RootState } from '@/lib/store';
import { useMapData } from '@/app/hooks/useMapData';
import { useMapCalculations } from '@/app/hooks/useMapCalculations';
import { getCountyCoordinates, type EnhancedFeature } from '@/app/lib/utils/geometryUtils';
import { 
    MAP_BOX_TOKEN, 
    MAP_BOUNDS, 
    MIN_ZOOM, 
    INITIAL_VIEW_STATE,
    DATA_DESCRIPTIONS,
    type ViewState 
} from '@/app/lib/constants/mapConstants';
import { formatMetricLabel } from '@/app/lib/utils/formatUtils';

import { MapControls } from '@/app/components/map/MapControls';
import { MapTooltip } from '@/app/components/map/MapTooltip';
import { MapLegend } from '@/app/components/map/MapLegend';
import { Progress } from '@/app/components/ui/progress';

/**
 * Refactored MapStory component with extracted logic and sub-components
 */
export default function MapStoryRefactored() {
    // Redux state
    const { selectedMetric, selectedDataSource, isPerCapita, selectedCounties = [] } = useSelector(
        (state: RootState) => state.filters
    );
    const selectedCounty = useSelector((state: RootState) => state.map.selectedCounty);

    // Custom hooks for data and calculations
    const { enhancedGeojson, processing, showLoading } = useMapData();
    const { colorScale } = useMapCalculations(enhancedGeojson);

    // Local UI state
    const [hoverInfo, setHoverInfo] = useState<{
        x: number;
        y: number;
        object?: EnhancedFeature;
    } | null>(null);
    const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);

    // Handle county selection (fly to county)
    useEffect(() => {
        if (selectedCounty && enhancedGeojson.length > 0) {
            const polygonCentroid = getCountyCoordinates(selectedCounty, enhancedGeojson);
            setViewState((prevState) => ({
                ...prevState,
                longitude: polygonCentroid.longitude,
                latitude: polygonCentroid.latitude,
                zoom: 10,
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator(),
            }));
        }
    }, [selectedCounty, enhancedGeojson]);

    // Apply view state constraints
    const applyViewStateConstraints = useCallback((viewState: ViewState): ViewState => {
        return {
            ...viewState,
            longitude: Math.min(MAP_BOUNDS[1][0], Math.max(MAP_BOUNDS[0][0], viewState.longitude)),
            latitude: Math.min(MAP_BOUNDS[1][1], Math.max(MAP_BOUNDS[0][1], viewState.latitude)),
            zoom: Math.max(MIN_ZOOM, viewState.zoom),
        };
    }, []);

    // Handle view state changes
    const handleViewStateChange = (params: ViewStateChangeParameters) => {
        const newViewState: ViewState = {
            longitude: params.viewState.longitude,
            latitude: params.viewState.latitude,
            zoom: params.viewState.zoom,
            pitch: params.viewState.pitch || 0,
            bearing: params.viewState.bearing || 0,
            ...(params.viewState.transitionDuration
                ? {
                      transitionDuration: params.viewState.transitionDuration,
                      transitionInterpolator: new FlyToInterpolator(),
                  }
                : {}),
        };
        setViewState(applyViewStateConstraints(newViewState));
    };

    // DeckGL layers
    const layers = [
        new GeoJsonLayer({
            id: 'counties',
            data: enhancedGeojson,
            stroked: true,
            filled: true,
            lineWidthMinPixels: 1,
            getFillColor: (feature) => {
                const value = feature.properties[selectedMetric];
                if (
                    selectedCounties &&
                    selectedCounties.length > 0 &&
                    !selectedCounties.includes(feature.properties.name)
                ) {
                    return [200, 200, 200, 150];
                }
                const colorString = colorScale(value);
                const rgb = d3.rgb(colorString);
                return [rgb.r, rgb.g, rgb.b, 200];
            },
            getLineColor: (feature) => {
                if (
                    selectedCounties &&
                    selectedCounties.length > 0 &&
                    !selectedCounties.includes(feature.properties.name)
                ) {
                    return [180, 180, 180];
                }
                return [255, 255, 255];
            },
            getLineWidth: 1,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 50],
            transitions: {
                getFillColor: {
                    duration: 400,
                    easing: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
                },
                getLineColor: {
                    duration: 400,
                    easing: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
                },
            },
            onHover: (info: PickingInfo) => {
                if (info.object) {
                    setHoverInfo({
                        x: info.x,
                        y: info.y,
                        object: info.object as EnhancedFeature,
                    });
                } else {
                    setHoverInfo(null);
                }
            },
            updateTriggers: {
                getFillColor: [selectedMetric, enhancedGeojson, isPerCapita, selectedCounties],
                getLineColor: [selectedCounties],
            },
        }),
    ];

    // Get current data source info for description
    const currentDataSourceInfo = DATA_DESCRIPTIONS[selectedDataSource as keyof typeof DATA_DESCRIPTIONS] || {
        name: 'Unknown Data',
        description: 'No description available.',
        metrics: {},
    };
    const currentMetricInfo =
        currentDataSourceInfo.metrics[selectedMetric as keyof typeof currentDataSourceInfo.metrics] ||
        'No metric description available.';

    return (
        <div className='relative w-full h-full overflow-hidden'>
            {/* Loading Overlay */}
            {processing && showLoading && (
                <div className='absolute inset-0 bg-black/30 flex items-center justify-center z-50'>
                    <div className='bg-white/90 p-4 rounded-lg shadow-lg text-center'>
                        <div className='mb-2 text-lg font-semibold'>Processing Data...</div>
                        <Progress value={100} className='w-[60%]' />
                    </div>
                </div>
            )}

            {/* Map Controls */}
            <MapControls processing={processing} />

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
                        attributionControl={false}
                    />
                </DeckGL>

                {/* Tooltip */}
                <MapTooltip
                    hoverInfo={hoverInfo}
                    selectedMetric={selectedMetric}
                    selectedDataSource={selectedDataSource}
                    isPerCapita={isPerCapita}
                />

                {/* Legend */}
                <MapLegend
                    selectedMetric={selectedMetric}
                    isPerCapita={isPerCapita}
                    colorScale={colorScale}
                />

                {/* Data Description Box */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={`description-${selectedDataSource}-${selectedMetric}`}
                        className='absolute w-64 bottom-8 right-8 bg-white/10 backdrop-blur-sm p-4 rounded z-10 text-xs hidden md:block'
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 50,
                        }}
                    >
                        <motion.h4
                            className='text-sm font-bold mb-1 break-words'
                            layoutId={`description-title-${currentDataSourceInfo.name}`}
                        >
                            {currentDataSourceInfo.name}
                        </motion.h4>
                        <motion.p className='mb-2' layoutId={`description-text-${currentDataSourceInfo.name}`}>
                            {currentDataSourceInfo.description}
                        </motion.p>
                        <motion.p layoutId={`description-metric-${selectedMetric}`}>
                            <span className='font-semibold'>{formatMetricLabel(selectedMetric)}:</span>{' '}
                            {currentMetricInfo}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
} 