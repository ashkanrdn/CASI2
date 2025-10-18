'use client';

import * as React from 'react';
import { X, Download, Check, CheckIcon, Info } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import {
    Filter,
    FilterCategory,
    removeFilter,
    setYear,
    toggleFilter,
    setSelectedDataSource,
    DataSourceType,
    resetFilters,
    setSelectedCounties,
} from '@/lib/features/filters/filterSlice';
import Papa from 'papaparse';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Slider } from '@/app/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from '@/app/components/ui/select';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import LoadingProgress from './LoadingProgress';
import ErrorNotification from './ErrorNotification';

// California county names
const COUNTY_NAMES = [
    'Alameda',
    'Alpine',
    'Amador',
    'Butte',
    'Calaveras',
    'Colusa',
    'Contra Costa',
    'Del Norte',
    'El Dorado',
    'Fresno',
    'Glenn',
    'Humboldt',
    'Imperial',
    'Inyo',
    'Kern',
    'Kings',
    'Lake',
    'Lassen',
    'Los Angeles',
    'Madera',
    'Marin',
    'Mariposa',
    'Mendocino',
    'Merced',
    'Modoc',
    'Mono',
    'Monterey',
    'Napa',
    'Nevada',
    'Orange',
    'Placer',
    'Plumas',
    'Riverside',
    'Sacramento',
    'San Benito',
    'San Bernardino',
    'San Diego',
    'San Francisco',
    'San Joaquin',
    'San Luis Obispo',
    'San Mateo',
    'Santa Barbara',
    'Santa Clara',
    'Santa Cruz',
    'Shasta',
    'Sierra',
    'Siskiyou',
    'Solano',
    'Sonoma',
    'Stanislaus',
    'Sutter',
    'Tehama',
    'Trinity',
    'Tulare',
    'Tuolumne',
    'Ventura',
    'Yolo',
    'Yuba',
];

// Define valid filter IDs per data source and category
const VALID_FILTERS_PER_SOURCE: Record<DataSourceType, Partial<Record<FilterCategory, string[]>>> = {
    arrest: {
        gender: ['Female', 'Male'],
        race: ['Black', 'Hispanic', 'White', 'Asianother'],
        crime: ['Violent', 'Property', 'Drug', 'Publicorder', 'Status', 'Misdemeanor'],
        age: ['Adult', 'Juvenile'], // Arrest data has Age column
        sentencing: [], // Not available
    },
    jail: {
        gender: ['Female', 'Male'], // Jail has Gender column
        age: ['Adult', 'Juvenile'], // Jail has Age column

    },
    county_prison: {
        // Explicitly disable all standard filter categories
        gender: [],
        age: [],
        crime: [],
        race: [],
        sentencing: [],
    },
    demographic: {
        // Demographic data doesn't use standard filter categories
        gender: [],
        age: [],
        crime: [],
        race: [],
        sentencing: [],
    },
};

const formatDataSourceLabel = (source: DataSourceType) => {
    switch (source) {
        case 'arrest':
            return 'Arrests';
        case 'jail':
            return 'Jail Population';
        case 'county_prison':
            return 'Prison Population';
        case 'demographic':
            return 'Demographics';
        default:
            return source;
    }
};

export default function FiltersSidebar() {
    const dispatch = useDispatch<AppDispatch>();
    const {
        filters,
        activeFilters,
        csvDataSources,
        dataSourcesStatus,
        dataSourcesErrors,
        filteredData,
        selectedDataSource,
        yearRange,
        selectedCounties = [], // Default to empty array if not defined
    } = useSelector((state: RootState) => state.filters);

    // Get current source's data, status, and error
    const csvData = csvDataSources[selectedDataSource] || [];
    const status = dataSourcesStatus[selectedDataSource] || 'idle';
    const error = dataSourcesErrors[selectedDataSource];

    // Sort county names alphabetically (memoized)
    const sortedCountyNames = React.useMemo(() => [...COUNTY_NAMES].sort(), []);

    // Note: Data fetching is now handled by DataPreloader component in the root layout
    // This ensures data starts loading immediately when the app loads, not just when
    // users navigate to this page

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
        dispatch(resetFilters());
        dispatch(setSelectedDataSource(value as DataSourceType));
    };

    // New handler for county selection
    const handleCountySelectionChange = (countyName: string) => {
        const newSelectedCounties = selectedCounties.includes(countyName)
            ? selectedCounties.filter((name: string) => name !== countyName) // Remove if already selected
            : [...selectedCounties, countyName]; // Add if not selected
        dispatch(setSelectedCounties(newSelectedCounties));
    };

    // Handler to remove a selected county
    const handleRemoveCounty = (countyName: string) => {
        dispatch(setSelectedCounties(selectedCounties.filter((name: string) => name !== countyName)));
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

    const FilterGroup = ({ title, category, showInfo = false, infoText = '' }: { title: string; category: FilterCategory; showInfo?: boolean; infoText?: string }) => {
        // Existing check for sentencing group visibility (still useful)
        if (category === 'sentencing' && selectedDataSource !== 'jail') {
            return null;
        }

        // Hide Age group unless relevant source is selected
        if (category === 'age' && !['arrest', 'jail'].includes(selectedDataSource)) {
            return null; // Optionally hide instead of just disabling buttons
        }

        return (
            <div className='mb-4 p-2'>
                <div className='flex items-center justify-between mb-2'>
                    <h3 className='font-semibold'>{title}</h3>
                    {showInfo && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-4 w-4 p-0 hover:bg-gray-100'
                                >
                                    <Info className='h-3 w-3 text-gray-500' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                align='end' 
                                className='w-64 p-3 text-sm text-gray-700'
                            >
                                {infoText}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
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
                {/* Data Source Dropdown */}
                <h3 className='font-semibold mb-2'>Data Source</h3>
                <Select value={selectedDataSource} onValueChange={handleDataSourceChange}>
                    <SelectTrigger>
                        <SelectValue placeholder='Select data source' />
                    </SelectTrigger>
                    <SelectContent>
                        {(['arrest', 'jail', 'county_prison'] as DataSourceType[]).map((source) => (
                            <SelectItem key={source} value={source}>
                                {formatDataSourceLabel(source)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Loading Progress Indicator */}
            <LoadingProgress />

            {/* Error Notification for Failed Sources */}
            <ErrorNotification />

            {/* Show inline message if selected source is loading or failed */}
            {status === 'loading' && (
                <div className='mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                    <p className='text-sm text-blue-900'>
                        <strong>{formatDataSourceLabel(selectedDataSource)}</strong> data is currently loading...
                    </p>
                </div>
            )}
            {status === 'failed' && (
                <div className='mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
                    <p className='text-sm text-yellow-900'>
                        <strong>{formatDataSourceLabel(selectedDataSource)}</strong> data failed to load. You can try refreshing the page or select a different data source.
                    </p>
                </div>
            )}

            <Separator className='my-4' />

            {/* County Multi-Select Dropdown */}
            <div className='mb-4 p-2'>
                <h3 className='font-semibold mb-2'>Counties</h3>
                <Select
                    value='_' // Use dummy value to prevent auto-closing on select
                    onValueChange={(value) => {
                        if (value !== '_' && value !== 'all') {
                            handleCountySelectionChange(value);
                        } else if (value === 'all') {
                            // Toggle between all counties and none
                            dispatch(
                                setSelectedCounties(
                                    selectedCounties.length === sortedCountyNames.length ? [] : [...sortedCountyNames]
                                )
                            );
                        }
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Select Counties'>
                            {selectedCounties.length > 0
                                ? `${selectedCounties.length} ${
                                      selectedCounties.length === 1 ? 'County' : 'Counties'
                                  } selected`
                                : 'Select Counties'}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <ScrollArea className='h-60 overflow-y-auto'>
                            <SelectGroup>
                                <SelectItem value='all'>
                                    {selectedCounties.length === sortedCountyNames.length
                                        ? 'Deselect All Counties'
                                        : 'Select All Counties'}
                                </SelectItem>
                                <SelectItem value='_' disabled className='border-b mb-2 pb-2'>
                                    <span className='opacity-50'>Select individual counties</span>
                                </SelectItem>
                                {sortedCountyNames.map((countyName) => (
                                    <SelectItem key={countyName} value={countyName}>
                                        <div className='flex items-center gap-2'>
                                            {selectedCounties.includes(countyName) && (
                                                <CheckIcon className='h-4 w-4 mr-2 inline-block flex-shrink-0' />
                                            )}
                                            <span
                                                className={selectedCounties.includes(countyName) ? 'font-medium' : ''}
                                            >
                                                {countyName}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </ScrollArea>
                    </SelectContent>
                </Select>
            </div>
            <Separator className='my-4' />

            {selectedDataSource !== 'county_prison' && (
                <>
                    <FilterGroup title='Gender' category='gender' />
                    <Separator className='my-4' />
                </>
            )}
            {['arrest', 'jail'].includes(selectedDataSource) && (
                <>
                    <FilterGroup 
                        title='Age' 
                        category='age' 
                        showInfo={true}
                        infoText='Adult numbers are from local jail populations, Juvenile numbers are pulled from local juvenile halls.'
                    />
                    <Separator className='my-4' />
                </>
            )}
            {selectedDataSource !== 'jail' && selectedDataSource !== 'county_prison' && (
                <>
                    <FilterGroup title='Crime Type' category='crime' />
                    <Separator className='my-4' />
                </>
            )}
            {selectedDataSource !== 'jail' && selectedDataSource !== 'county_prison' && (
                <>
                    <FilterGroup title='Race/Ethnicity' category='race' />
                    <Separator className='my-4' />
                </>
            )}

            <div className='mb-4 p-2'>
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

                    {/* Show selected counties as badges */}
                    {selectedCounties.map((county: string) => (
                        <Badge key={`county-${county}`} variant='secondary' className='flex items-center gap-1 text-xs'>
                            {county}
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-4 w-4 p-0 hover:bg-transparent'
                                onClick={() => handleRemoveCounty(county)}
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
                {selectedCounties.length > 0 &&
                    ` in ${selectedCounties.length} selected ${selectedCounties.length === 1 ? 'county' : 'counties'}`}
            </div>
        </div>
    );
}
