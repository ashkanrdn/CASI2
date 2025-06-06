import type { Feature } from 'geojson';
import { INITIAL_COORDINATES } from '@/app/lib/constants/mapConstants';

export interface EnhancedFeature extends Feature {
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

/**
 * Calculates the approximate centroid coordinates for a given county polygon/multipolygon.
 * This is used to center the map view when a county is selected.
 * @param countyName The name of the county.
 * @param enhancedGeojson Array of enhanced GeoJSON features
 * @returns An object containing the longitude and latitude of the centroid, or initial coordinates if not found.
 */
export function getCountyCoordinates(
    countyName: string,
    enhancedGeojson: EnhancedFeature[]
): { longitude: number; latitude: number } {
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
} 