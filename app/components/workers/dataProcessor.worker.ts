import type { Feature } from 'geojson';
// Assuming shared types are correctly located relative to the overall project structure
import type { CsvRow } from '@/app/types/shared';
import type { DataSourceType } from '@/lib/features/filters/filterSlice';

// --- Paste COUNTY_POPULATION constant here ---
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

// --- Define EnhancedFeature interface here ---
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


// --- Paste the enhanceGeoJsonWithData function here ---
function enhanceGeoJsonWithData(
    geojsonFeatures: Feature[],
    filteredData: CsvRow[],
    selectedMetric: string,
    dataSource: DataSourceType,
    isPerCapita: boolean
): EnhancedFeature[] {
    console.log('[Worker] Starting data enhancement...'); // Optional logging
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
    const enhancedFeatures = geojsonFeatures.map((feature) => {
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
    console.log('[Worker] Data enhancement complete.'); // Optional logging
    return enhancedFeatures;
}


// --- Worker Message Handling ---
self.onmessage = (event: MessageEvent<any>) => {
    console.log('[Worker] Message received from main thread:', event.data); // Optional logging
    const { geojsonFeatures, filteredData, selectedMetric, dataSource, isPerCapita } = event.data;

    if (!geojsonFeatures || !filteredData || !selectedMetric || !dataSource === undefined) { // Check dataSource presence
        console.error('[Worker] Invalid data received.');
        self.postMessage({ error: 'Invalid data received by worker' }); // Send error back
        return;
    }

    try {
        // Perform the calculation
        const result = enhanceGeoJsonWithData(geojsonFeatures, filteredData, selectedMetric, dataSource, isPerCapita);

        // Send the result back to the main thread
        console.log('[Worker] Posting result back to main thread.'); // Optional logging
        self.postMessage(result);
    } catch (error) {
        console.error('[Worker] Error during data processing:', error);
        self.postMessage({ error: `Processing failed: ${error instanceof Error ? error.message : String(error)}` }); // Send error back
    }
}; 
