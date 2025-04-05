import React, { useEffect, useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import Map from 'react-map-gl';
import * as d3 from 'd3';
import type { PickingInfo } from '@deck.gl/core';
import type { Feature } from 'geojson';
import type { CsvRow } from '@/app/types/shared';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/lib/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    setSelectedMetric,
    setRankedCounties,
    DataSourceMetrics,
    DataSourceType,
    togglePerCapita,
} from '@/lib/features/filters/filterSlice';
import { FlyToInterpolator } from '@deck.gl/core';
import type { ViewStateChangeParameters } from '@deck.gl/core';

import { setBarChartData, setColorScaleValues } from '@/lib/features/map/mapSlice';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';

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
    zoom: 7,
    pitch: 0,
    bearing: 0,
};

const INITIAL_COORDINATES = {
    longitude: -122.41669,
    latitude: 37.7853,
};

interface EnhancedFeature extends Feature {
    properties: {
        name: string;
        [metricKey: string]: any;
        rawValue: number;
        perCapitaValue?: number;
        rowCount: number;
        totalCostValue?: number;
        avgCostPerPrisonerValue?: number;
    };
}

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

// Mock data structure for descriptions
const dataDescriptions = {
    county_prison: {
        name: 'County Prison Data',
        description:
            'This dataset contains information about imprisonments and associated costs aggregated at the county level.',
        metrics: {
            Imprisonments: 'Total number of imprisonments recorded for the county.',
            Cost_per_prisoner: 'Average cost per prisoner for the county.',
            Total_Cost: 'Calculated total cost based on imprisonments and cost per prisoner.',
        },
    },
    jdp_data: {
        // Placeholder for another data source
        name: 'Juvenile Detention Profile Data',
        description: 'Information regarding juvenile detention profiles across counties.',
        metrics: {
            MetricA: 'Description for Metric A in JDP data.',
            MetricB: 'Description for Metric B in JDP data.',
        },
    },
    // Add other data sources as needed
};

function enhanceGeoJsonWithData(
    geojsonFeatures: Feature[],
    filteredData: CsvRow[],
    selectedMetric: string,
    dataSource: DataSourceType,
    isPerCapita: boolean
): EnhancedFeature[] {
    const countyData: Record<
        string,
        {
            value: number;
            rowCount: number;
            totalCost?: number;
            costSum?: number;
            costCount?: number;
        }
    > = {};

    const totalCostPerCounty: Record<string, number> = {};
    const costDataPerCounty: Record<string, { sum: number; count: number }> = {};

    if (dataSource === 'county_prison') {
        filteredData.forEach((row) => {
            const county = row.County;
            const cost = Number(row.Cost_per_prisoner) || 0;
            const imprisonments = Number(row.Imprisonments) || 0;
            const rowTotalCost = cost * imprisonments;

            if (!totalCostPerCounty[county]) {
                totalCostPerCounty[county] = 0;
            }
            totalCostPerCounty[county] += rowTotalCost;

            if (!costDataPerCounty[county]) {
                costDataPerCounty[county] = { sum: 0, count: 0 };
            }
            costDataPerCounty[county].sum += cost;
            costDataPerCounty[county].count += 1;
        });
    }

    filteredData.forEach((row) => {
        const county = row.County;
        if (dataSource === 'county_prison' && selectedMetric === 'Total_Cost') {
            if (!countyData[county]) {
                countyData[county] = { value: 0, rowCount: 1 };
            } else {
                countyData[county].rowCount += 1;
            }
            return;
        }

        const metricValueForAggregation = Number(row[selectedMetric]) || 0;

        if (!countyData[county]) {
            countyData[county] = {
                value: metricValueForAggregation,
                rowCount: 1,
                totalCost: dataSource === 'county_prison' ? totalCostPerCounty[county] || 0 : undefined,
                costSum: dataSource === 'county_prison' ? costDataPerCounty[county]?.sum || 0 : undefined,
                costCount: dataSource === 'county_prison' ? costDataPerCounty[county]?.count || 0 : undefined,
            };
        } else {
            countyData[county].value += metricValueForAggregation;
            countyData[county].rowCount += 1;
            if (dataSource === 'county_prison') {
                if (countyData[county].totalCost === undefined)
                    countyData[county].totalCost = totalCostPerCounty[county] || 0;
                if (countyData[county].costSum === undefined)
                    countyData[county].costSum = costDataPerCounty[county]?.sum || 0;
                if (countyData[county].costCount === undefined)
                    countyData[county].costCount = costDataPerCounty[county]?.count || 0;
            }
        }
    });

    return geojsonFeatures.map((feature) => {
        const countyName = feature.properties?.name as keyof typeof COUNTY_POPULATION;
        if (!countyName || !COUNTY_POPULATION.hasOwnProperty(countyName)) {
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    [selectedMetric]: 0,
                    rawValue: 0,
                    perCapitaValue: 0,
                    rowCount: 0,
                    totalCostValue: 0,
                    avgCostPerPrisonerValue: 0,
                },
            } as EnhancedFeature;
        }

        const population = COUNTY_POPULATION[countyName] || 0;
        let data = countyData[countyName] || { value: 0, rowCount: 0, totalCost: 0, costSum: 0, costCount: 0 };

        let rawValue = 0;
        if (dataSource === 'county_prison' && selectedMetric === 'Total_Cost') {
            rawValue = data.totalCost ?? 0;
        } else {
            rawValue = data.value;
        }

        let perCapitaValue: number | undefined = undefined;

        if (isPerCapita && population > 0) {
            perCapitaValue = rawValue / population;
        }

        const displayValue = isPerCapita && perCapitaValue !== undefined ? perCapitaValue : rawValue;

        const calculatedTotalCost = dataSource === 'county_prison' ? data.totalCost ?? 0 : undefined;
        const costSum = data.costSum ?? 0;
        const costCount = data.costCount ?? 0;
        const avgCostPerPrisoner = dataSource === 'county_prison' && costCount > 0 ? costSum / costCount : undefined;

        return {
            ...feature,
            properties: {
                ...feature.properties,
                [selectedMetric]: displayValue,
                rawValue: rawValue,
                perCapitaValue: perCapitaValue,
                rowCount: data.rowCount,
                totalCostValue: calculatedTotalCost,
                avgCostPerPrisonerValue: avgCostPerPrisoner,
            },
        } as EnhancedFeature;
    });
}

export default function MapStory() {
    const dispatch = useDispatch<AppDispatch>();
    const { filteredData, selectedMetric, selectedDataSource, isPerCapita } = useSelector(
        (state: RootState) => state.filters
    );
    const [geojsonData, setGeojsonData] = useState<Feature[]>([]);
    const [hoverInfo, setHoverInfo] = useState<{
        x: number;
        y: number;
        object?: EnhancedFeature;
    } | null>(null);
    const selectedCounty = useSelector((state: RootState) => state.map.selectedCounty);
    const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
    const [colorValues, setColorValues] = useState<number[]>([]);

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

    const enhancedGeojson = useMemo(
        () => enhanceGeoJsonWithData(geojsonData, filteredData, selectedMetric, selectedDataSource, isPerCapita),
        [geojsonData, filteredData, selectedMetric, selectedDataSource, isPerCapita]
    );

    const colorScale = useMemo(() => {
        const values = enhancedGeojson
            .map((f) => {
                const val = f.properties[selectedMetric];
                return val;
            })
            .filter((val): val is number => typeof val === 'number' && !isNaN(val));
        setColorValues(values);
        return d3
            .scaleSequential<string>()
            .domain([0, d3.max(values.filter((v) => isFinite(v))) || 0])
            .interpolator(d3.interpolateOranges);
    }, [enhancedGeojson, selectedMetric]);

    useEffect(() => {
        dispatch(setColorScaleValues(colorValues));
    }, [enhancedGeojson, selectedMetric, colorValues, dispatch]);

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
        dispatch(setRankedCounties(rankedCounties));
    }, [rankedCounties, dispatch]);

    const getCountyCoordinates = (countyName: string) => {
        const county = enhancedGeojson.find((feature) => feature.properties.name === countyName);

        if (!county || !county.geometry) {
            return INITIAL_COORDINATES;
        }

        if (county.geometry.type === 'MultiPolygon') {
            const allCoords = county.geometry.coordinates.flat(2);

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

    useEffect(() => {
        if (selectedCounty) {
            const polygonCentroid = getCountyCoordinates(selectedCounty);
            setViewState((prevState) => ({
                ...prevState,
                longitude: polygonCentroid.longitude,
                latitude: polygonCentroid.latitude,
                zoom: 10,
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator(),
            }));
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
                const value = feature.properties[selectedMetric];
                const colorString = colorScale(value);
                const rgb = d3.rgb(colorString);
                return [rgb.r, rgb.g, rgb.b, 200];
            },
            getLineColor: [255, 255, 255],
            getLineWidth: 1,
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 50],
            onHover: (info: PickingInfo<EnhancedFeature>) => {
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
                getFillColor: [selectedMetric, enhancedGeojson, isPerCapita],
            },
        }),
    ];

    const barChartData = useMemo(() => {
        const data = enhancedGeojson
            .map((feature) => ({
                county: feature.properties.name,
                value:
                    isPerCapita && feature.properties.perCapitaValue !== undefined
                        ? feature.properties.perCapitaValue
                        : feature.properties.rawValue,
            }))
            .sort((a, b) => b.value - a.value);
        return data;
    }, [enhancedGeojson, selectedMetric, isPerCapita]);

    useEffect(() => {
        dispatch(setBarChartData(barChartData));
    }, [barChartData, dispatch]);

    const onViewStateChange = (params: ViewStateChangeParameters) => {
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
    };

    const availableMetrics = DataSourceMetrics[selectedDataSource] || [];

    // Get descriptions based on selected data source and metric
    const currentDataSourceInfo = dataDescriptions[selectedDataSource as keyof typeof dataDescriptions] || {
        name: 'Unknown Data',
        description: 'No description available.',
        metrics: {},
    };
    const currentMetricInfo =
        currentDataSourceInfo.metrics[selectedMetric as keyof typeof currentDataSourceInfo.metrics] ||
        'No metric description available.';

    return (
        <div className='relative w-full h-full overflow-hidden'>
            <div className='absolute top-4 left-4 z-10 p-2 max-w-[calc(100%-2rem)]'>
                <div className='flex flex-wrap items-center gap-4'>
                    <div className='flex flex-wrap gap-2'>
                        {availableMetrics.map((metric) => (
                            <Button
                                key={metric}
                                onClick={() => dispatch(setSelectedMetric(metric))}
                                className={`h-8 text-xs ${selectedMetric === metric ? 'text-white' : ''}`}
                                variant={selectedMetric === metric ? 'default' : 'outline'}
                            >
                                {formatMetricLabel(metric)}
                            </Button>
                        ))}
                    </div>
                    <div className='flex items-center space-x-2 bg-white/50 backdrop-blur-sm p-2 rounded'>
                        <Switch
                            id='per-capita-toggle'
                            checked={isPerCapita}
                            onCheckedChange={() => dispatch(togglePerCapita())}
                        />
                        <Label htmlFor='per-capita-toggle' className='text-xs font-medium'>
                            Per Capita
                        </Label>
                    </div>
                </div>
            </div>

            <div className='absolute inset-0'>
                <DeckGL layers={layers} viewState={viewState} onViewStateChange={onViewStateChange} controller={true}>
                    <Map
                        mapboxAccessToken={MAP_BOX_TOKEN}
                        mapStyle='mapbox://styles/mapbox/light-v11'
                        attributionControl={false}
                    />
                </DeckGL>

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
                            {formatMetricLabel(selectedMetric)}
                            {isPerCapita ? ' (Per Capita)' : ''}:{' '}
                            {isPerCapita
                                ? Number(hoverInfo.object?.properties[selectedMetric] ?? 0).toLocaleString(undefined, {
                                      maximumSignificantDigits: 4,
                                  })
                                : selectedMetric === 'Total_Cost'
                                ? `$${Number(hoverInfo.object?.properties[selectedMetric] ?? 0).toLocaleString(
                                      undefined,
                                      { maximumFractionDigits: 0 }
                                  )}`
                                : Number(hoverInfo.object?.properties[selectedMetric] ?? 0).toLocaleString()}
                        </p>
                        {isPerCapita && (
                            <p>
                                Raw Value:{' '}
                                {selectedMetric === 'Total_Cost'
                                    ? `$${Number(hoverInfo.object?.properties.rawValue ?? 0).toLocaleString(undefined, {
                                          maximumFractionDigits: 0,
                                      })}`
                                    : Number(hoverInfo.object?.properties.rawValue ?? 0).toLocaleString()}
                            </p>
                        )}
                        {selectedDataSource === 'county_prison' &&
                            selectedMetric !== 'Total_Cost' &&
                            hoverInfo.object?.properties.totalCostValue !== undefined && (
                                <p>
                                    Total Cost:{' '}
                                    {`$${Number(hoverInfo.object?.properties.totalCostValue ?? 0).toLocaleString(
                                        undefined,
                                        { maximumFractionDigits: 0 }
                                    )}`}
                                </p>
                            )}
                        {selectedDataSource === 'county_prison' &&
                            hoverInfo.object?.properties.avgCostPerPrisonerValue !== undefined && (
                                <p>
                                    Avg Cost/Prisoner:{' '}
                                    {`$${Number(
                                        hoverInfo.object?.properties.avgCostPerPrisonerValue ?? 0
                                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                </p>
                            )}
                        {/* Display Population */}
                        {hoverInfo.object?.properties.name &&
                            COUNTY_POPULATION[hoverInfo.object?.properties.name as keyof typeof COUNTY_POPULATION] && (
                                <p>
                                    Population:{' '}
                                    {Number(
                                        COUNTY_POPULATION[
                                            hoverInfo.object.properties.name as keyof typeof COUNTY_POPULATION
                                        ]
                                    ).toLocaleString()}
                                </p>
                            )}
                        {/* Display row count (maybe less relevant now?) */}
                        {selectedMetric !== 'Total_Cost' && (
                            <p>
                                Number of Records: {Number(hoverInfo.object?.properties.rowCount ?? 0).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}

                {/* Legend Box */}
                <div className='absolute w-48 bottom-8 left-8 bg-white/10 backdrop-blur-sm p-4 rounded z-10'>
                    <h4 className='text-sm font-bold mb-2 break-words'>
                        {formatMetricLabel(selectedMetric)}
                        {isPerCapita && <span className='font-normal text-xs'> (Per Capita)</span>}
                    </h4>
                    <div
                        className='w-full h-4 relative' // Changed w-48 to w-full
                        style={{
                            background:
                                colorScale.domain()[1] > 0
                                    ? `linear-gradient(to right, ${colorScale(0)}, ${colorScale(
                                          colorScale.domain()[1]
                                      )})`
                                    : '#ccc',
                        }}
                    ></div>
                    <div className='flex justify-between text-xs mt-1'>
                        <span>0</span>
                        <span>
                            {isPerCapita
                                ? Number(colorScale.domain()[1]).toLocaleString(undefined, {
                                      maximumSignificantDigits: 2,
                                  })
                                : selectedMetric === 'Total_Cost'
                                ? `$${Math.round(colorScale.domain()[1]).toLocaleString()}`
                                : Math.round(colorScale.domain()[1]).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Data Description Box */}
                <div className='absolute w-64 bottom-8 right-8 bg-white/10 backdrop-blur-sm p-4 rounded z-10 text-xs'>
                    <h4 className='text-sm font-bold mb-1 break-words'>{currentDataSourceInfo.name}</h4>
                    <p className='mb-2'>{currentDataSourceInfo.description}</p>
                    <p>
                        <span className='font-semibold'>{formatMetricLabel(selectedMetric)}:</span> {currentMetricInfo}
                    </p>
                </div>
            </div>
        </div>
    );
}

function formatMetricLabel(metric: string) {
    if (metric === 'Total_Cost') return 'Total Cost';
    return metric
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
}
