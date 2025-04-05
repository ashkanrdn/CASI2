export interface CsvRow {
    Year: number;
    County: string;
    Age: string; // Add combined Age column (e.g., 'Adult', 'Youth')
    // Common fields (might exist in multiple files)
    Gender?: string; // from adult, youth, demographic
    Sex?: string; // from jail
    Race?: string; // from adult, youth, demographic
    Offense_Category?: string; // from adult, youth, jail
    Count?: number; // from adult, youth
    // Fields specific to certain files (make them optional)
    Index?: number; // from jail
    'Sentencing status'?: string; // from jail
    Jail_ADP?: number; // from jail
    Status?: string; // Often used for 'Adult prisoners'/'Juvenile prisoners', needs mapping if present
    OffenseCat?: string; // Alternative name for Offense_Category? check csv
    Population_age_10_17?: number; // from demographic
    Poverty_rate_age_12_17?: number; // from demographic
    Cost_per_prisoner?: number; // from county_prison
    Imprisonments?: number; // from county_prison
    Population?: number; // from county_prison (adult pop?)
    // Allow any other potential columns
    [key: string]: any;
} 
