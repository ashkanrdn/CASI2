import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
    longitude: -122.41669,
    latitude: 37.7853,
    zoom: 7,
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

/**
 * Merges filtered CSV data with GeoJSON features for California counties.
 * Calculates aggregated values, per capita values (if applicable), and
 * special metrics like Total Cost and Average Cost per Prisoner for specific data sources.
 *
 * @param geojsonFeatures Array of base GeoJSON features for counties.
 * @param filteredData Array of filtered data rows based on user selections.
 * @param selectedMetric The metric currently selected by the user.
 * @param dataSource The data source currently selected by the user.
 * @param isPerCapita Flag indicating if data should be displayed per capita.
 * @returns An array of EnhancedFeature objects, ready for rendering on the map.
 */
function enhanceGeoJsonWithData(
    geojsonFeatures: Feature[],
    filteredData: CsvRow[],
    selectedMetric: string,
    dataSource: DataSourceType,
    isPerCapita: boolean
): EnhancedFeature[] {
    // Accumulator for county-level data aggregation.
    const countyData: Record<
        string,
        {
            value: number; // Accumulated value for the selected metric (excluding Total_Cost initially)
            rowCount: number; // Number of data rows contributing to the county's data
            totalCost?: number; // Sum of (Imprisonments * Cost_per_prisoner) for the county
            costSum?: number; // Sum of Cost_per_prisoner for calculating the average later
            costCount?: number; // Count of rows with Cost_per_prisoner for calculating the average later
        }
    > = {};

    // Pre-calculate total cost and average cost components if the data source is 'county_prison'.
    const totalCostPerCounty: Record<string, number> = {};
    const costDataPerCounty: Record<string, { sum: number; count: number }> = {};

    if (dataSource === 'county_prison') {
        filteredData.forEach((row) => {
            const county = row.County;
            const cost = Number(row.Cost_per_prisoner) || 0;
            const imprisonments = Number(row.Imprisonments) || 0;
            const rowTotalCost = cost * imprisonments;

            // Calculate total cost per county
            if (!totalCostPerCounty[county]) {
                totalCostPerCounty[county] = 0;
            }
            totalCostPerCounty[county] += rowTotalCost;

            // Calculate sum and count for average cost per prisoner
            if (!costDataPerCounty[county]) {
                costDataPerCounty[county] = { sum: 0, count: 0 };
            }
            // Only include cost if it's a valid number > 0 for average calculation
            if (cost > 0) {
                costDataPerCounty[county].sum += cost;
                costDataPerCounty[county].count += 1;
            }
        });
    }

    // Aggregate data per county based on the selected metric.
    filteredData.forEach((row) => {
        const county = row.County;

        // Skip direct aggregation if the selected metric is Total_Cost for county_prison data,
        // as it's pre-calculated. Just increment row count.
        if (dataSource === 'county_prison' && selectedMetric === 'Total_Cost') {
            if (!countyData[county]) {
                countyData[county] = { value: 0, rowCount: 1 }; // Initialize with rowCount 1
            } else {
                countyData[county].rowCount += 1; // Increment row count
            }
            // Assign pre-calculated values
            countyData[county].totalCost = totalCostPerCounty[county] || 0;
            countyData[county].costSum = costDataPerCounty[county]?.sum || 0;
            countyData[county].costCount = costDataPerCounty[county]?.count || 0;
            return; // Skip further aggregation for this row
        }

        // Get the value for the selected metric from the current row.
        const metricValueForAggregation = Number(row[selectedMetric]) || 0;

        // Initialize or update the county's data in the accumulator.
        if (!countyData[county]) {
            countyData[county] = {
                value: metricValueForAggregation,
                rowCount: 1,
                // Assign pre-calculated cost values if applicable
                totalCost: dataSource === 'county_prison' ? totalCostPerCounty[county] || 0 : undefined,
                costSum: dataSource === 'county_prison' ? costDataPerCounty[county]?.sum || 0 : undefined,
                costCount: dataSource === 'county_prison' ? costDataPerCounty[county]?.count || 0 : undefined,
            };
        } else {
            // Add the current row's metric value to the accumulated value.
            countyData[county].value += metricValueForAggregation;
            // Increment the row count for the county.
            countyData[county].rowCount += 1;
            // Ensure cost values are assigned if they haven't been already (e.g., if initialized above)
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

    // Map over the GeoJSON features and enhance them with the aggregated data.
    return geojsonFeatures.map((feature) => {
        const countyName = feature.properties?.name as keyof typeof COUNTY_POPULATION;
        // If the county name is missing or not in our population data, return a default structure.
        if (!countyName || !COUNTY_POPULATION.hasOwnProperty(countyName)) {
            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    name: feature.properties?.name || 'Unknown', // Ensure name is present
                    [selectedMetric]: 0,
                    rawValue: 0,
                    perCapitaValue: 0,
                    rowCount: 0,
                    totalCostValue: 0,
                    avgCostPerPrisonerValue: 0,
                },
            } as EnhancedFeature;
        }

        // Retrieve population and aggregated data for the county.
        const population = COUNTY_POPULATION[countyName] || 0;
        let data = countyData[countyName] || { value: 0, rowCount: 0, totalCost: 0, costSum: 0, costCount: 0 };

        // Determine the raw value based on the selected metric.
        let rawValue = 0;
        if (dataSource === 'county_prison' && selectedMetric === 'Total_Cost') {
            rawValue = data.totalCost ?? 0; // Use pre-calculated total cost
        } else {
            rawValue = data.value; // Use the aggregated sum for other metrics
        }

        // Calculate per capita value if requested and population is available.
        let perCapitaValue: number | undefined = undefined;
        if (isPerCapita && population > 0) {
            perCapitaValue = rawValue / population;
        }

        // Determine the value to display on the map (either raw or per capita).
        const displayValue = isPerCapita && perCapitaValue !== undefined ? perCapitaValue : rawValue;

        // Retrieve or calculate specific values for county_prison data.
        const calculatedTotalCost = dataSource === 'county_prison' ? data.totalCost ?? 0 : undefined;
        const costSum = data.costSum ?? 0;
        const costCount = data.costCount ?? 0;
        const avgCostPerPrisoner = dataSource === 'county_prison' && costCount > 0 ? costSum / costCount : undefined;

        // Return the enhanced feature with all calculated properties.
        return {
            ...feature,
            properties: {
                ...feature.properties,
                name: countyName, // Ensure name property is explicitly set
                [selectedMetric]: displayValue, // The value used for coloring the map
                rawValue: rawValue, // The original aggregated value
                perCapitaValue: perCapitaValue, // The per capita value, if calculated
                rowCount: data.rowCount, // The number of records aggregated
                totalCostValue: calculatedTotalCost, // Total cost for tooltip
                avgCostPerPrisonerValue: avgCostPerPrisoner, // Avg cost/prisoner for tooltip
            },
        } as EnhancedFeature;
    });
}

/**
 * Main component for displaying the interactive map story.
 * It fetches GeoJSON data, merges it with filtered data from Redux state,
 * renders the map using DeckGL and Mapbox, and handles user interactions
 * like hovering, selecting metrics, and toggling per capita view.
 */
export default function MapStory() {
    const dispatch = useDispatch<AppDispatch>();
    // Selectors to get relevant data and settings from the Redux store.
    const { filteredData, selectedMetric, selectedDataSource, isPerCapita } = useSelector(
        (state: RootState) => state.filters
    );
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

    /**
     * Memoized calculation to enhance GeoJSON features with aggregated data.
     * This recalculates only when the underlying GeoJSON data, filtered data,
     * selected metric, data source, or per capita flag changes.
     */
    const enhancedGeojson = useMemo(
        () => enhanceGeoJsonWithData(geojsonData, filteredData, selectedMetric, selectedDataSource, isPerCapita),
        [geojsonData, filteredData, selectedMetric, selectedDataSource, isPerCapita]
    );

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
                .interpolator(d3.interpolateOranges)
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
        new GeoJsonLayer<EnhancedFeature>({
            id: 'counties',
            data: enhancedGeojson, // Use the data enhanced with metric values.
            stroked: true, // Draw county borders.
            filled: true, // Fill counties with color.
            lineWidthMinPixels: 1, // Ensure borders are visible.
            // Function to determine the fill color based on the feature's metric value and the color scale.
            getFillColor: (feature: EnhancedFeature) => {
                const value = feature.properties[selectedMetric];
                const colorString = colorScale(value); // Get color from the scale
                const rgb = d3.rgb(colorString); // Convert to RGB
                return [rgb.r, rgb.g, rgb.b, 200]; // Return as [R, G, B, Alpha] array
            },
            getLineColor: [255, 255, 255], // White borders.
            getLineWidth: 1,
            pickable: true, // Allow features to be hovered/clicked.
            autoHighlight: true, // Automatically highlight hovered feature.
            highlightColor: [255, 255, 255, 50], // Semi-transparent white highlight.
            // Callback function when a feature is hovered.
            onHover: (info: PickingInfo<EnhancedFeature>) => {
                if (info.object) {
                    // If hovering over a feature, update hoverInfo state for tooltip display.
                    setHoverInfo({
                        x: info.x,
                        y: info.y,
                        object: info.object, // The enhanced feature data
                    });
                } else {
                    // If not hovering over a feature, clear hoverInfo.
                    setHoverInfo(null);
                }
            },
            // Triggers update of the layer when these props change.
            updateTriggers: {
                getFillColor: [selectedMetric, enhancedGeojson, isPerCapita], // Recolor when metric, data, or perCapita changes
            },
        }),
    ];

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
        setViewState(applyViewStateConstraints(newViewState));
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
            {/* Top Controls: Metric selection buttons and Per Capita toggle */}
            <div className='absolute top-4 left-4 z-10 p-2 max-w-[calc(100%-2rem)]'>
                <div className='flex flex-wrap items-center gap-4'>
                    {/* Metric Buttons */}
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
                    {/* Per Capita Toggle Switch */}
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
                {hoverInfo &&
                    hoverInfo.object && ( // Ensure hoverInfo and object exist
                        <div
                            className='absolute z-10 pointer-events-none bg-white p-2 rounded shadow-lg text-xs' // Added text-xs for smaller font
                            style={{
                                left: hoverInfo.x + 10, // Position slightly offset from cursor
                                top: hoverInfo.y + 10,
                                maxWidth: '250px', // Limit tooltip width
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
                                      Number(hoverInfo.object.properties[selectedMetric] ?? 0).toLocaleString(
                                          undefined,
                                          {
                                              maximumSignificantDigits: 4,
                                          }
                                      )
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
                                        ? `$${Number(hoverInfo.object.properties.rawValue ?? 0).toLocaleString(
                                              undefined,
                                              {
                                                  maximumFractionDigits: 0,
                                              }
                                          )}`
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
                                COUNTY_POPULATION[
                                    hoverInfo.object.properties.name as keyof typeof COUNTY_POPULATION
                                ] && (
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
                                    Number of Records:{' '}
                                    {Number(hoverInfo.object.properties.rowCount ?? 0).toLocaleString()}
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

                {/* Data Description Box */}
                <div className='absolute w-64 bottom-8 right-8 bg-white/10 backdrop-blur-sm p-4 rounded z-10 text-xs hidden md:block'>
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

/**
 * Helper function to format metric names (e.g., 'Total_Cost')
 * into more readable labels (e.g., 'Total Cost').
 * @param metric The raw metric string.
 * @returns A formatted string label.
 */
function formatMetricLabel(metric: string) {
    // Handle specific cases like 'Total_Cost'
    if (metric === 'Total_Cost') return 'Total Cost';
    // General formatting: replace underscores with spaces, add space before capitals, capitalize first letter.
    return metric
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters (for camelCase or PascalCase)
        .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
        .trim(); // Remove leading/trailing spaces
}
