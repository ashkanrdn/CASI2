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
import 'mapbox-gl/dist/mapbox-gl.css';

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

// Add enum for metrics
enum MetricType {
    Arrests = 'Arrests',
    Imprisonments = 'Imprisonments',
    Population = 'Population18-69',
    Cost = 'CostPerInmate',
}

interface EnhancedFeature extends Feature {
    properties: {
        name: string;
        [MetricType.Arrests]: number;
        [MetricType.Imprisonments]: number;
        [MetricType.Population]: number;
        [MetricType.Cost]: string;
        rowCount: number;
        [key: string]: any;
    };
}

function enhanceGeoJsonWithData(
    geojsonFeatures: Feature[],
    filteredData: CsvRow[],
    selectedMetric: MetricType
): EnhancedFeature[] {
    const countyData: Record<string, { value: number; rowCount: number }> = {};

    filteredData.forEach((row) => {
        const county = row.County;
        const value =
            selectedMetric === MetricType.Cost
                ? parseFloat(row[selectedMetric].replace(/[^0-9.-]+/g, ''))
                : Number(row[selectedMetric]) || 0;

        if (!countyData[county]) {
            countyData[county] = {
                value,
                rowCount: 1,
            };
        } else {
            countyData[county] = {
                value: countyData[county].value + value,
                rowCount: countyData[county].rowCount + 1,
            };
        }
    });

    return geojsonFeatures.map((feature) => {
        const countyName = feature.properties?.name;
        const data = countyData[countyName] || {
            value: 0,
            rowCount: 0,
        };

        return {
            ...feature,
            properties: {
                ...feature.properties,
                [selectedMetric]: data.value,
                rowCount: data.rowCount,
            },
        } as EnhancedFeature;
    });
}

export default function MapStory() {
    const filteredData = useSelector((state: RootState) => state.filters.filteredData);
    const [geojsonData, setGeojsonData] = useState<Feature[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<MetricType>(MetricType.Arrests);
    const [hoverInfo, setHoverInfo] = useState<{
        x: number;
        y: number;
        object?: EnhancedFeature;
    } | null>(null);

    // Enhance GeoJSON with filtered data
    const enhancedGeojson = useMemo(
        () => enhanceGeoJsonWithData(geojsonData, filteredData, selectedMetric),
        [geojsonData, filteredData, selectedMetric]
    );

    // Create color scale based on enhanced data
    const colorScale = useMemo(() => {
        // Convert values to numbers and filter out any NaN values
        const values = enhancedGeojson
            .map((f) => {
                const val = f.properties[selectedMetric];
                return typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]+/g, '')) : val;
            })
            .filter((val): val is number => typeof val === 'number' && !isNaN(val));

        return d3
            .scaleSequential<string>()
            .domain([0, d3.max(values) || 0])
            .interpolator(d3.interpolateOranges);
    }, [enhancedGeojson, selectedMetric]);

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
                // Convert the value to a number if it's a string
                const value = feature.properties[selectedMetric];
                const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;

                // Convert the sequential scale output to RGB values
                const colorString = colorScale(numericValue);
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
        <div className='relative w-full h-full'>
            {/* Metric Toggle Buttons */}
            <div className='absolute top-4 left-4 z-10 bg-white p-2 rounded shadow-lg'>
                <div className='flex gap-2'>
                    {Object.values(MetricType).map((metric) => (
                        <button
                            key={metric}
                            onClick={() => setSelectedMetric(metric)}
                            className={`px-3 py-1 rounded ${
                                selectedMetric === metric ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </button>
                    ))}
                </div>
            </div>

            <div className='absolute inset-0'>
                <DeckGL layers={layers} initialViewState={INITIAL_VIEW_STATE} controller={true}>
                    <Map
                        mapboxAccessToken={MAP_BOX_TOKEN}
                        mapStyle='mapbox://styles/mapbox/light-v10'
                        attributionControl={false}
                    />
                </DeckGL>

                {/* Update Tooltip to show selected metric */}
                {hoverInfo && (
                    <div
                        className='absolute z-10 pointer-events-none bg-white p-2 rounded shadow-lg'
                        style={{
                            left: hoverInfo.x + 10,
                            top: hoverInfo.y + 10,
                        }}
                    >
                        <h3 className='font-bold'>{hoverInfo.object?.properties.name}</h3>
                        <p>
                            {selectedMetric}:{' '}
                            {selectedMetric === MetricType.Cost
                                ? `$${hoverInfo.object?.properties[selectedMetric].toLocaleString()}`
                                : hoverInfo.object?.properties[selectedMetric].toLocaleString()}
                        </p>
                        <p>Number of Records: {hoverInfo.object?.properties.rowCount}</p>
                    </div>
                )}

                {/* Update Legend title */}
                <div className='absolute bottom-8 right-8 bg-white p-4 rounded shadow-lg z-10'>
                    <h4 className='text-sm font-bold mb-2'>{selectedMetric.replace(/([A-Z])/g, ' $1').trim()}</h4>
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
                        <span>
                            {selectedMetric === MetricType.Cost
                                ? `$${Math.round(colorScale.domain()[1]).toLocaleString()}`
                                : Math.round(colorScale.domain()[1]).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
