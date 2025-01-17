'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import {
    fetchCsvData,
    Filter,
    FilterCategory,
    removeFilter,
    setYear,
    toggleFilter,
} from '@/lib/features/filters/filterSlice';

import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Slider } from '@/app/components/ui/slider';

export default function FiltersSidebar() {
    const dispatch = useDispatch<AppDispatch>();
    const { filters, activeFilters, csvData, filteredData, status, error } = useSelector(
        (state: RootState) => state.filters
    );

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchCsvData());
        }
    }, [status, dispatch]);

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

    const FilterGroup = ({ title, category }: { title: string; category: FilterCategory }) => (
        <div className='mb-4 p-2'>
            <h3 className='font-semibold mb-2'>{title}</h3>
            <div className='flex flex-wrap gap-2'>
                {filters[category].map((filter: Filter) => (
                    <Button
                        key={filter.id}
                        variant={filter.isActive ? 'default' : 'outline'}
                        className='h-8 text-xs'
                        onClick={() => handleToggleFilter(category, filter.id)}
                    >
                        {filter.label}
                    </Button>
                ))}
            </div>
        </div>
    );

    return (
        <div className='h-full overflow-y-auto p-2'>
            <FilterGroup title='Gender' category='gender' />
            <Separator className='my-4' />
            <FilterGroup title='Age' category='age' />
            <Separator className='my-4' />
            <FilterGroup title='Crime Type' category='crime' />
            <Separator className='my-4' />
            <FilterGroup title='Race/Ethnicity' category='race' />
            <Separator className='my-4' />

            <div className='mb-4'>
                <h3 className='font-semibold mb-2'>Year</h3>
                <div className='space-y-4'>
                    <Slider
                        value={[activeFilters.year]}
                        min={2017}
                        max={2025}
                        step={1}
                        onValueChange={([value]) => handleYearChange(value)}
                        className='w-full'
                    />
                    <div className='flex justify-between text-sm text-gray-600'>
                        <span>2017</span>
                        <span className='font-medium text-black'>{activeFilters.year}</span>
                        <span>2025</span>
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

            <div className='mt-4 sticky bottom-0 text-sm text-gray-600'>
                Showing {filteredData.length} out of {csvData.length} records
            </div>
        </div>
    );
}
