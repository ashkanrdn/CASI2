import React from 'react';
import type { EnhancedFeature } from '@/app/lib/utils/geometryUtils';
import { COUNTY_POPULATION } from '@/app/lib/constants/mapConstants';
import { formatMetricLabel, formatMetricValue, formatPopulation } from '@/app/lib/utils/formatUtils';

interface MapTooltipProps {
    hoverInfo: {
        x: number;
        y: number;
        object: EnhancedFeature;
    } | null;
    selectedMetric: string;
    selectedDataSource: string;
    isPerCapita: boolean;
}

export function MapTooltip({ hoverInfo, selectedMetric, selectedDataSource, isPerCapita }: MapTooltipProps) {
    if (!hoverInfo?.object) return null;

    const { object } = hoverInfo;
    const properties = object.properties;

    return (
        <div
            className='absolute z-10 pointer-events-none bg-white p-2 rounded shadow-lg text-xs'
            style={{
                left: hoverInfo.x + 10,
                top: hoverInfo.y + 10,
                maxWidth: '250px',
                wordWrap: 'break-word',
            }}
        >
            <h3 className='font-bold text-sm mb-1'>{properties.name}</h3>
            
            {/* Display selected metric value */}
            <p>
                {formatMetricLabel(selectedMetric)}
                {isPerCapita ? ' (Per Capita)' : ''}:{' '}
                {formatMetricValue(
                    properties[selectedMetric] ?? 0,
                    selectedMetric,
                    isPerCapita
                )}
            </p>

            {/* Display raw value if Per Capita is active */}
            {isPerCapita && (
                <p>
                    Raw Value:{' '}
                    {formatMetricValue(properties.rawValue ?? 0, selectedMetric, false)}
                </p>
            )}

            {/* Display Total Cost if applicable and not the primary metric */}
            {selectedDataSource === 'county_prison' &&
                selectedMetric !== 'Total_Cost' &&
                properties.totalCostValue !== undefined && (
                    <p>
                        Total Cost:{' '}
                        {formatMetricValue(properties.totalCostValue ?? 0, 'Total_Cost', false, true)}
                    </p>
                )}

            {/* Display Average Cost/Prisoner if applicable */}
            {selectedDataSource === 'county_prison' &&
                properties.avgCostPerPrisonerValue !== undefined && (
                    <p>
                        Avg Cost/Prisoner:{' '}
                        {formatMetricValue(properties.avgCostPerPrisonerValue ?? 0, 'Cost_per_prisoner', false, true)}
                    </p>
                )}

            {/* Display Population */}
            {properties.name &&
                COUNTY_POPULATION[properties.name as keyof typeof COUNTY_POPULATION] && (
                    <p>
                        Population:{' '}
                        {formatPopulation(
                            COUNTY_POPULATION[properties.name as keyof typeof COUNTY_POPULATION]
                        )}
                    </p>
                )}

            {/* Display number of aggregated records (if not Total_Cost) */}
            {selectedMetric !== 'Total_Cost' && (
                <p>
                    Number of Records: {formatPopulation(properties.rowCount ?? 0)}
                </p>
            )}
        </div>
    );
} 