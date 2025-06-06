import { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as d3 from 'd3';
import type { RootState, AppDispatch } from '@/lib/store';
import { setBarChartData, setColorScaleValues } from '@/lib/features/map/mapSlice';
import { setRankedCounties } from '@/lib/features/filters/filterSlice';
import type { EnhancedFeature } from '@/app/lib/utils/geometryUtils';

export function useMapCalculations(enhancedGeojson: EnhancedFeature[]) {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedMetric, isPerCapita } = useSelector((state: RootState) => state.filters);

    /**
     * Calculate D3 color scale for map features
     */
    const { colorScale, colorValues } = useMemo(() => {
        const values = enhancedGeojson
            .map((f) => f.properties[selectedMetric])
            .filter((val): val is number => typeof val === 'number' && !isNaN(val));

        const scale = d3
            .scaleSequential<string>()
            .domain([0, d3.max(values.filter((v) => isFinite(v))) || 0])
            .interpolator(d3.interpolateOranges);

        return { colorScale: scale, colorValues: values };
    }, [enhancedGeojson, selectedMetric]);

    /**
     * Calculate ranked counties based on selected metric
     */
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

    /**
     * Calculate bar chart data for visualization
     */
    const barChartData = useMemo(() => {
        return enhancedGeojson
            .map((feature) => ({
                county: feature.properties.name,
                value:
                    isPerCapita && feature.properties.perCapitaValue !== undefined
                        ? feature.properties.perCapitaValue
                        : feature.properties.rawValue,
            }))
            .sort((a, b) => b.value - a.value);
    }, [enhancedGeojson, selectedMetric, isPerCapita]);

    // Dispatch calculated values to Redux store
    useEffect(() => {
        dispatch(setColorScaleValues(colorValues));
    }, [colorValues, dispatch]);

    useEffect(() => {
        dispatch(setRankedCounties(rankedCounties));
    }, [rankedCounties, dispatch]);

    useEffect(() => {
        dispatch(setBarChartData(barChartData));
    }, [barChartData, dispatch]);

    return {
        colorScale,
        colorValues,
        rankedCounties,
        barChartData,
    };
} 