export interface CasiData {
    type: 'Adult prisoners' | 'Juvenile prisoners';
    year: number;
    county: string;
    gender: 'Male' | 'Female';
    race: 'White' | 'Latinx' | 'Black' | 'Other';
    crimeType: 'Violent' | 'Property' | 'Drug' | 'PublicOrder';
    count: number;
    population: number;
    costPerYear: number;
}
