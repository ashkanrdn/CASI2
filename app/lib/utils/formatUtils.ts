/**
 * Helper function to format metric names (e.g., 'Total_Cost')
 * into more readable labels (e.g., 'Total Cost').
 * @param metric The raw metric string.
 * @returns A formatted string label.
 */
export function formatMetricLabel(metric: string): string {
    // Handle specific cases for better readability
    switch (metric) {
        case 'Total_Cost':
            return 'Total Cost';
        case 'Arrest_rate':
            return 'Arrest Rate';
        case 'Total_Arrests':
            return 'Total Arrests';
        case 'ADPtotrate':
            return 'ADP Total Rate';
        case 'ADPtotal':
            return 'ADP Total';
        case 'Felonyrate':
            return 'Felony Rate';
        case 'Misdrate':
            return 'Misdemeanor Rate';
        case 'Felony':
            return 'Felony Count';
        case 'Misd':
            return 'Misdemeanor Count';
        case 'Postdisp':
            return 'Post-Disposition';
        case 'Predisp':
            return 'Pre-Disposition';
        default:
            // General formatting: replace underscores with spaces, add space before capitals, capitalize first letter.
            return metric
                .replace(/_/g, ' ') // Replace underscores with spaces
                .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters (for camelCase or PascalCase)
                .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
                .trim(); // Remove leading/trailing spaces
    }
}

/**
 * Formats a value based on the metric type and per capita setting
 * @param value The numeric value to format
 * @param metric The metric being displayed
 * @param isPerCapita Whether this is a per capita value
 * @param isCurrency Whether to format as currency
 * @returns Formatted string
 */
export function formatMetricValue(
    value: number, 
    metric: string, 
    isPerCapita: boolean = false, 
    isCurrency: boolean = false
): string {
    if (isCurrency || metric === 'Total_Cost') {
        return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    
    if (isPerCapita) {
        return value.toLocaleString(undefined, { maximumSignificantDigits: 4 });
    }
    
    return value.toLocaleString();
}

/**
 * Formats population data for display
 * @param population The population number
 * @returns Formatted population string
 */
export function formatPopulation(population: number): string {
    return population.toLocaleString();
} 