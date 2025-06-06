// Map configuration constants
export const MAP_BOX_TOKEN = 'pk.eyJ1IjoiYXJhZG5pYSIsImEiOiJjanlhZDdienQwNGN0M212MHp3Z21mMXhvIn0.lPiKb_x0vr1H62G_jHgf7w';

/**
 * Define the geographic boundaries for map constraint (Roughly California).
 * [ [minLongitude, minLatitude], [maxLongitude, maxLatitude] ]
 */
export const MAP_BOUNDS: [[number, number], [number, number]] = [
    [-117.595944, 33.386416], // Southwest corner
    [-120.999866, 42.183974], // Northeast corner
];

/**
 * Minimum zoom level allowed. Prevents zooming out too far.
 */
export const MIN_ZOOM = 5;

/**
 * Default coordinates used when county coordinates cannot be determined.
 */
export const INITIAL_COORDINATES = {
    longitude: -122.41669,
    latitude: 37.7853,
};

/**
 * Interface defining the structure for the map's view state.
 */
export interface ViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number;
    transitionInterpolator?: any;
}

/**
 * Initial view state configuration for the DeckGL map.
 */
export const INITIAL_VIEW_STATE: ViewState = {
    longitude: -122.41669,
    latitude: 37.7853,
    zoom: 7,
    pitch: 0,
    bearing: 0,
};

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
export const DATA_DESCRIPTIONS = {
    arrest: {
        name: 'Arrest Data',
        description:
            'This dataset contains information about arrests across California counties, broken down by demographics and offense types.',
        metrics: {
            Arrest_rate: 'Rate of arrests per population for the selected filters and county.',
            Total_Arrests: 'Total number of arrests recorded for the selected filters and county.',
        },
    },
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
    jail: {
        name: 'Jail Data',
        description: 'Information regarding jail population and rates across counties.',
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
} as const; 