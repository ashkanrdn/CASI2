import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import Map from 'react-map-gl';
import * as d3 from 'd3';
import type { MapViewState } from '@deck.gl/core';
import type { PickingInfo } from '@deck.gl/core';
import type { Feature, FeatureCollection } from 'geojson';
import type { CsvRow } from '@/app/types/shared';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import FiltersSidebar from './FilterSidebar';

const MAP_BOX_TOKEN = 'pk.eyJ1IjoiYXJhZG5pYSIsImEiOiJjanlhZDdienQwNGN0M212MHp3Z21mMXhvIn0.lPiKb_x0vr1H62G_jHgf7w';

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: -122.41669,
    latitude: 37.7853,
    zoom: 13,
    pitch: 0,
    bearing: 0,
};

const GEOJSON_LAYER_SETTINGS = {
    getFillColor: [255, 0, 0, 200] as [number, number, number, number],
    getLineColor: [255, 255, 255] as [number, number, number],
    getLineWidth: 2,
    lineWidthUnits: 'pixels',
    stroked: true,
    filled: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100] as [number, number, number, number],
};

interface EnhancedFeature extends Feature {
    properties: {
        name: string;
        totalArrests: number;
        rowCount: number;
        [key: string]: any;
    };
}

function enhanceGeoJsonWithData(geojsonFeatures: Feature[], filteredData: CsvRow[]): EnhancedFeature[] {
    // Create a regular object instead of using Map
    const countyData: Record<string, { totalArrests: number; rowCount: number }> = {};

    filteredData.forEach((row) => {
        const county = row.County;
        const arrests = Number(row.Arrests) || 0;

        if (!countyData[county]) {
            countyData[county] = {
                totalArrests: arrests,
                rowCount: 1,
            };
        } else {
            countyData[county] = {
                totalArrests: countyData[county].totalArrests + arrests,
                rowCount: countyData[county].rowCount + 1,
            };
        }
    });

    // Enhance GeoJSON features with the aggregated data
    return geojsonFeatures.map((feature) => {
        const countyName = feature.properties?.name;
        const data = countyData[countyName] || {
            totalArrests: 0,
            rowCount: 0,
        };

        return {
            ...feature,
            properties: {
                ...feature.properties,
                ...data,
            },
        } as EnhancedFeature;
    });
}

export default function MapStory() {
    const filteredData = useSelector((state: RootState) => state.filters.filteredData);
    const [geojsonData, setGeojsonData] = useState<Feature[]>([]);
    const [hoverInfo, setHoverInfo] = useState<{
        x: number;
        y: number;
        object?: EnhancedFeature;
    } | null>(null);

    // Enhance GeoJSON with filtered data
    const enhancedGeojson = useMemo(
        () => enhanceGeoJsonWithData(geojsonData, filteredData),
        [geojsonData, filteredData]
    );

    // Create color scale based on enhanced data
    const colorScale = useMemo(() => {
        const arrests = enhancedGeojson.map((f) => f.properties.totalArrests);
        return d3
            .scaleSequential()
            .domain([0, d3.max(arrests) || 0])
            .interpolator(d3.interpolateOranges);
    }, [enhancedGeojson]);

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

    const layers = [
        new GeoJsonLayer({
            id: 'counties',
            data: enhancedGeojson,
            stroked: true,
            filled: true,
            lineWidthMinPixels: 1,
            getFillColor: (feature: EnhancedFeature) => {
                // Convert the sequential scale output to RGB values
                const colorString = colorScale(feature.properties.totalArrests);
                const rgb = d3.rgb(colorString);
                return [rgb.r, rgb.g, rgb.b, 200];
            },
            getLineColor: [255, 255, 255],
            getLineWidth: 1,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 50],
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
                getFillColor: [colorScale],
            },
        }),
    ];

    return (
        <div className='flex h-[100%]'>
            <div className='w-1/4 p-4 border-r'>
                <FiltersSidebar />
            </div>
            <div className='w-3/4 relative'>
                <DeckGL layers={layers} initialViewState={INITIAL_VIEW_STATE} controller={true}>
                    <Map mapboxAccessToken={MAP_BOX_TOKEN} mapStyle='mapbox://styles/mapbox/light-v10' />
                </DeckGL>

                {/* Tooltip */}
                {hoverInfo && (
                    <div
                        className='absolute z-10 pointer-events-none bg-white p-2 rounded shadow-lg'
                        style={{
                            left: hoverInfo.x + 10,
                            top: hoverInfo.y + 10,
                        }}
                    >
                        <h3 className='font-bold'>{hoverInfo.object?.properties.name}</h3>
                        <p>Total Arrests: {hoverInfo.object?.properties.totalArrests.toLocaleString()}</p>
                        <p>Number of Records: {hoverInfo.object?.properties.rowCount}</p>
                    </div>
                )}

                {/* Legend */}
                <div className='absolute bottom-8 right-8 bg-white p-4 rounded shadow-lg z-10'>
                    <h4 className='text-sm font-bold mb-2'>Total Arrests</h4>
                    <div
                        className='w-48 h-4 relative'
                        style={{
                            background: `linear-gradient(to right, ${colorScale(0)}, ${colorScale(
                                colorScale.domain()[1]
                            )})`,
                        }}
                    ></div>
                    <div className='flex justify-between text-xs mt-1'>
                        <span>0</span>
                        <span>{Math.round(colorScale.domain()[1]).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
