'use client';

import * as React from 'react';
import { X, Download } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import {
    fetchDataForSource,
    Filter,
    FilterCategory,
    removeFilter,
    setYear,
    toggleFilter,
    setSelectedDataSource,
    DataSourceType,
} from '@/lib/features/filters/filterSlice';
import Papa from 'papaparse';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Slider } from '@/app/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

// Define valid filter IDs per data source and category
const VALID_FILTERS_PER_SOURCE: Record<DataSourceType, Partial<Record<FilterCategory, string[]>>> = {
    young_adult: {
        crime: ['Violent', 'Property', 'Drug', 'Other', 'Misdemeanors', 'StatusOffense', 'PublicOrder'],
        // Gender, Age, Race assumed valid
    },
    jail: {
        crime: ['Felony', 'Misdemeanors'],
        sentencing: ['Unsentenced', 'Sentenced'],
        // Gender (Sex column) assumed valid
        race: [], // Explicitly disable race filters for jail
        age: [], // Explicitly disable age filters for jail
    },
    county_prison: {
        // Explicitly disable all standard filter categories
        gender: [],
        age: [],
        crime: [],
        race: [],
        sentencing: [],
    },
    // demographic: {
    //     // Gender, Race, Age assumed valid
    //     // Explicitly disable crime and sentencing for demographic
    //     crime: [],
    //     sentencing: [],
    // },
};

const formatDataSourceLabel = (source: DataSourceType) => {
    switch (source) {
        case 'young_adult':
            return 'Arrests (Youth & Adult)';
        case 'jail':
            return 'Jail Population';
        case 'county_prison':
            return 'County Prison Stats';
        // case 'demographic':
        //     return 'Demographics';
        default:
            return source;
    }
};

export default function FiltersSidebar() {
    const dispatch = useDispatch<AppDispatch>();
    const { filters, activeFilters, csvData, filteredData, status, error, selectedDataSource, yearRange } = useSelector(
        (state: RootState) => state.filters
    );

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchDataForSource(selectedDataSource));
        }
    }, [status, dispatch, selectedDataSource]);

    if (status === 'loading') {
        return <div className='p-4'>Loading data...</div>;
    }

    if (status === 'failed') {
        return <div className='p-4 text-red-500'>Error: {error}</div>;
    }

    const activeFiltersList = Object.entries(filters).flatMap(([category, categoryFilters]) =>
        (categoryFilters as Filter[]).filter((filter: Filter) => filter.isActive)
    );

    const handleToggleFilter = (category: FilterCategory, filterId: string) => {
        dispatch(toggleFilter({ category, filterId }));
    };

    const handleRemoveFilter = (filterId: string) => {
        dispatch(removeFilter(filterId));
    };

    const handleYearChange = (value: number) => {
        dispatch(setYear(value));
    };

    const handleDataSourceChange = (value: string) => {
        dispatch(setSelectedDataSource(value as DataSourceType));
    };

    // Download Handler
    const handleDownloadCsv = () => {
        if (!filteredData || filteredData.length === 0) {
            console.log('No data to download.');
            // Optionally, provide user feedback (e.g., disable button, show alert)
            return;
        }

        const csv = Papa.unparse(filteredData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        // Create a dynamic filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.setAttribute('download', `filtered_data_${selectedDataSource}_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const FilterGroup = ({ title, category }: { title: string; category: FilterCategory }) => {
        // Existing check for sentencing group visibility (still useful)
        if (category === 'sentencing' && selectedDataSource !== 'jail') {
            return null;
        }

        // Hide Age group unless relevant source is selected
        if (category === 'age' && selectedDataSource !== 'young_adult') {
            return null; // Optionally hide instead of just disabling buttons
        }

        return (
            <div className='mb-4 p-2'>
                <h3 className='font-semibold mb-2'>{title}</h3>
                <div className='flex flex-wrap gap-2'>
                    {filters[category].map((filter: Filter) => {
                        // Get the valid filter IDs for the current category and source, if defined
                        const validFilterIds = VALID_FILTERS_PER_SOURCE[selectedDataSource]?.[category];

                        let isDisabled = false;
                        // Check against the defined valid list for the category, if it exists
                        if (validFilterIds !== undefined) {
                            // If a list is defined (even if empty), the filter ID must be in it to be enabled
                            isDisabled = !validFilterIds.includes(filter.id);
                        }
                        // Note: Specific overrides removed as the map now handles all cases explicitly.
                        // If validFilterIds is undefined (category not listed for the source in the map),
                        // it implies the category *is* valid, so isDisabled remains false.

                        return (
                            <Button
                                key={filter.id}
                                variant={filter.isActive ? 'default' : 'outline'}
                                className={`h-8 text-xs ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => !isDisabled && handleToggleFilter(category, filter.id)} // Prevent click if disabled
                                disabled={isDisabled}
                            >
                                {filter.label}
                            </Button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className='h-full overflow-y-auto p-2'>
            <div className='mb-4 p-2'>
                <h3 className='font-semibold mb-2'>Data Source</h3>
                <Select value={selectedDataSource} onValueChange={handleDataSourceChange}>
                    <SelectTrigger>
                        <SelectValue placeholder='Select data source' />
                    </SelectTrigger>
                    <SelectContent>
                        {(['young_adult', 'jail', 'county_prison'] as DataSourceType[]).map((source) => (
                            <SelectItem key={source} value={source}>
                                {formatDataSourceLabel(source)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Separator className='my-4' />

            <FilterGroup title='Gender' category='gender' />
            <Separator className='my-4' />
            {selectedDataSource === 'young_adult' && (
                <>
                    <FilterGroup title='Age' category='age' />
                    <Separator className='my-4' />
                </>
            )}
            <FilterGroup title='Crime Type' category='crime' />
            <Separator className='my-4' />
            <FilterGroup title='Race/Ethnicity' category='race' />
            <Separator className='my-4' />
            {selectedDataSource === 'jail' && (
                <>
                    <FilterGroup title='Sentencing Status' category='sentencing' />
                    <Separator className='my-4' />
                </>
            )}

            <div className='mb-4'>
                <h3 className='font-semibold mb-2'>Year</h3>
                <div className='space-y-4'>
                    <Slider
                        value={[activeFilters.year]}
                        min={yearRange[0]}
                        max={yearRange[1]}
                        step={1}
                        onValueChange={([value]) => handleYearChange(value)}
                        className='w-full'
                        disabled={yearRange[0] === yearRange[1]}
                    />
                    <div className='flex justify-between text-sm text-gray-600'>
                        <span>{yearRange[0]}</span>
                        <span className='font-medium text-black'>{activeFilters.year}</span>
                        <span>{yearRange[1]}</span>
                    </div>
                </div>
            </div>

            <Separator className='my-4' />

            <div>
                <h3 className='font-semibold mb-2'>APPLIED FILTERS</h3>
                <div className='flex flex-wrap gap-2'>
                    {activeFiltersList.map((filter) => (
                        <Badge key={filter.id} variant='secondary' className='flex items-center gap-1 text-xs'>
                            {filter.label}
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-4 w-4 p-0 hover:bg-transparent'
                                onClick={() => handleRemoveFilter(filter.id)}
                            >
                                <X className='h-3 w-3' />
                            </Button>
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Add Download Button Here */}
            <div className='mt-4'>
                <Button onClick={handleDownloadCsv} disabled={filteredData.length === 0} className='w-full'>
                    <Download className=' h-4 w-4' /> Download Data
                </Button>
            </div>

            <div className='mt-4 sticky bottom-0 text-sm text-gray-600'>
                Showing {filteredData.length} out of {csvData.length} records
            </div>
        </div>
    );
}
