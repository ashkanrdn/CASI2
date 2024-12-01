import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import Map from 'react-map-gl';
import * as d3 from 'd3';
import type { MapViewState } from '@deck.gl/core';
import type { PickingInfo } from '@deck.gl/core';
import type { Feature } from 'geojson';
import type { CsvRow } from '@/app/types/shared';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import { setSelectedMetric, setRankedCounties, MetricType } from '@/lib/features/filters/filterSlice';
import { FlyToInterpolator } from '@deck.gl/core';
import type { ViewStateChangeParameters } from '@deck.gl/core';
import { BarDatum, ResponsiveBar } from '@nivo/bar';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const MAP_BOX_TOKEN = 'pk.eyJ1IjoiYXJhZG5pYSIsImEiOiJjanlhZDdienQwNGN0M212MHp3Z21mMXhvIn0.lPiKb_x0vr1H62G_jHgf7w';

interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number;
    transitionInterpolator?: FlyToInterpolator;
}

const INITIAL_VIEW_STATE: ViewState = {
    longitude: -122.41669,
    latitude: 37.7853,
    zoom: 13,
    pitch: 0,
    bearing: 0,
};

const INITIAL_COORDINATES = {
    longitude: -122.41669,
    latitude: 37.7853,
};

const RANDOM_OFFSET_RANGE = 0.5; // Degree offset for random points

interface EnhancedFeature extends Feature {
    properties: {
        name: string;
        [MetricType.Arrests]: number;
        [MetricType.Imprisonments]: number;
        [MetricType.Population]: number;
        [MetricType.Cost]: number;
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
        const value = Number(row[selectedMetric]) || 0;

        if (selectedMetric === MetricType.Cost) {
            // For CostPerInmate, just store the constant value
            if (!countyData[county]) {
                countyData[county] = {
                    value,
                    rowCount: 1,
                };
            }
        } else {
            // For other metrics, aggregate the values
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
    const dispatch = useDispatch();
    const filteredData = useSelector((state: RootState) => state.filters.filteredData);
    const selectedMetric = useSelector((state: RootState) => state.filters.selectedMetric);
    const [geojsonData, setGeojsonData] = useState<Feature[]>([]);
    const [hoverInfo, setHoverInfo] = useState<{
        x: number;
        y: number;
        object?: EnhancedFeature;
    } | null>(null);
    const selectedCounty = useSelector((state: RootState) => state.filters.selectedCounty);
    const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
    const [isBarChartExpanded, setIsBarChartExpanded] = useState(true);

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
                return val;
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

    const rankedCounties = useMemo(() => {
        return enhancedGeojson
            .map((feature) => ({
                name: feature.properties.name,
                value: feature.properties[selectedMetric],
                rank: 0,
            }))
            .sort((a, b) => b.value - a.value)
            .map((county, index) => ({
                ...county,
                rank: index + 1,
            }));
    }, [enhancedGeojson, selectedMetric]);

    useEffect(() => {
        console.log(rankedCounties);
        dispatch(setRankedCounties(rankedCounties));
    }, [rankedCounties]);

    // Add function to generate random coordinates
    const getCountyCoordinates = (countyName: string) => {
        const county = enhancedGeojson.find((feature) => feature.properties.name === countyName);

        if (!county || !county.geometry) {
            return INITIAL_COORDINATES;
        }

        // Calculate the centroid of the county's geometry
        if (county.geometry.type === 'MultiPolygon') {
            // Flatten all coordinates into a single array
            const allCoords = county.geometry.coordinates.flat(2);

            // Calculate average of all coordinates
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
        } else if (county.geometry.type === 'Polygon') {
            const allCoords = county.geometry.coordinates.flat(1);

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

        return INITIAL_COORDINATES;
    };

    // Add effect to handle county selection
    useEffect(() => {
        if (selectedCounty) {
            // Generate random coordinates
            const polygonCentroid = getCountyCoordinates(selectedCounty);

            // Update view state with animation
            setViewState({
                ...viewState,
                longitude: polygonCentroid.longitude,
                latitude: polygonCentroid.latitude,
                zoom: 10,
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator(),
            });
        }
    }, [selectedCounty]);

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

                // Convert the sequential scale output to RGB values
                const colorString = colorScale(value);
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

    // Prepare data for bar chart
    const barChartData = useMemo(() => {
        return enhancedGeojson
            .map((feature) => ({
                county: feature.properties.name,
                value: feature.properties[selectedMetric],
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15); // Show top 10 counties
    }, [enhancedGeojson, selectedMetric]);

    return (
        <div className='relative w-full h-full overflow-hidden'>
            <div className='absolute top-4 left-4 z-10 bg-white p-2 rounded shadow-lg max-w-[calc(100%-2rem)]'>
                <div className='flex flex-wrap gap-2'>
                    {Object.values(MetricType).map((metric) => (
                        <button
                            key={metric}
                            onClick={() => dispatch(setSelectedMetric(metric))}
                            className={`px-3 py-1 rounded text-sm ${
                                selectedMetric === metric ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </button>
                    ))}
                </div>
            </div>

            <div className='absolute inset-0'>
                <DeckGL
                    layers={layers}
                    initialViewState={INITIAL_VIEW_STATE}
                    viewState={viewState}
                    onViewStateChange={(params: ViewStateChangeParameters) => {
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
                        setViewState(newViewState);
                    }}
                    controller={true}
                >
                    <Map
                        mapboxAccessToken={MAP_BOX_TOKEN}
                        mapStyle='mapbox://styles/mapbox/light-v10'
                        attributionControl={false}
                    />
                </DeckGL>

                {/* Tooltip - */}
                {hoverInfo && (
                    <div
                        className='absolute z-10 pointer-events-none bg-white p-2 rounded shadow-lg'
                        style={{
                            left: hoverInfo.x + 10,
                            top: hoverInfo.y + 10,
                            maxWidth: 'calc(100% - 20px)',
                            wordWrap: 'break-word',
                        }}
                    >
                        <h3 className='font-bold'>{hoverInfo.object?.properties.name}</h3>
                        <p>
                            {selectedMetric}: {`${hoverInfo.object?.properties[selectedMetric]}`}
                        </p>
                        <p>Number of Records: {hoverInfo.object?.properties.rowCount}</p>
                    </div>
                )}

                {/* Bar Chart */}
                <motion.div
                    className='absolute bottom-40 right-8 bg-white rounded shadow-lg z-10'
                    animate={{
                        height: isBarChartExpanded ? '70%' : '40px',
                        width: isBarChartExpanded ? '300px' : '200px',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <div
                        className='flex items-center justify-between p-2 cursor-pointer'
                        onClick={() => setIsBarChartExpanded(!isBarChartExpanded)}
                    >
                        <h3 className='font-semibold w-48 text-sm'>Chart</h3>
                        <motion.div animate={{ rotate: isBarChartExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                            <ChevronDown className='w-5 h-5' />
                        </motion.div>
                    </div>
                    <motion.div
                        className='relative'
                        animate={{
                            height: isBarChartExpanded ? 'calc(100% - 40px)' : 0,
                            opacity: isBarChartExpanded ? 1 : 0,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ height: '100%', width: '300px' }} className='p-2'>
                            <ResponsiveBar
                                data={barChartData}
                                keys={['value']}
                                indexBy='county'
                                margin={{ top: 10, right: 20, bottom: 90, left: 100 }}
                                layout='horizontal'
                                valueScale={{ type: 'linear' }}
                                colors={({ data }: { data: { value: number } }) => {
                                    // Use the same color scale as the map
                                    const value = data.value;
                                    const colorString = colorScale(value);
                                    return colorString;
                                }}
                                borderRadius={4}
                                padding={0.5}
                                labelSkipWidth={40}
                                labelSkipHeight={12}
                                enableLabel={false}
                                label={(d: { value: number }) =>
                                    selectedMetric === MetricType.Cost
                                        ? `$${Number(d.value).toLocaleString()}`
                                        : Number(d.value).toLocaleString()
                                }
                                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    truncateTickAt: 20,
                                }}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 90,

                                    format: (value: number) =>
                                        selectedMetric === MetricType.Cost
                                            ? `$${Number(value).toLocaleString()}`
                                            : Number(value).toLocaleString(),
                                }}
                                tooltip={(props: { data: BarDatum; value: number }) => (
                                    <div className='bg-white p-2 shadow rounded'>
                                        <strong>{props.data.county}</strong>
                                        <br />
                                        {selectedMetric === MetricType.Cost
                                            ? `$${Number(props.value).toLocaleString()}`
                                            : Number(props.value).toLocaleString()}
                                    </div>
                                )}
                                theme={{
                                    axis: {
                                        ticks: {
                                            text: {
                                                fontSize: 11,
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Legend - moved below bar chart */}
                <div className='absolute bottom-8 right-8 bg-white p-4 rounded shadow-lg z-10'>
                    <h4 className='text-sm font-bold mb-2 break-words'>
                        {selectedMetric.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div
                        className='w-48 max-w-full h-4 relative'
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
