import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import Map from 'react-map-gl';
import type { MapViewState } from '@deck.gl/core';
import type { Feature } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';
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

export default function MapStory() {
    const [geojsonData, setGeojsonData] = useState<Feature[]>([]);

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
            id: 'GeoJsonLayer',
            data: geojsonData,
            ...GEOJSON_LAYER_SETTINGS,
            lineWidthUnits: 'pixels' as const,
        }),
    ];

    return (
        <div className='flex h-screen'>
            <div className='w-1/4 p-4 border-r'>
                <FiltersSidebar />
            </div>
            <div className='w-3/4'>
                <DeckGL layers={layers} initialViewState={INITIAL_VIEW_STATE} controller={true}>
                    <Map
                        mapboxAccessToken={MAP_BOX_TOKEN}
                        initialViewState={INITIAL_VIEW_STATE}
                        mapStyle='mapbox://styles/mapbox/streets-v9'
                    />
                </DeckGL>
            </div>
        </div>
    );
}
