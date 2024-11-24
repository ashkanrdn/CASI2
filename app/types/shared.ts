export interface CsvRow {
    Status: 'Adult prisoners' | 'Juvenile prisoners';
    Year: number;
    County: string;
    Sex: 'Male' | 'Female' | 'Other';
    Race: 'White' | 'Latinx' | 'Black' | 'Other';
    OffenseCat: string;
    Imprisonments: number;
    Arrests: number;
    'Population18-69': number;
    'CostPerInmate': string;
} 
