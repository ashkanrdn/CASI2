'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import type { CsvRow } from '@/app/types/shared';
import { useDispatch } from 'react-redux';
import { setCsvData } from '@/lib/features/filters/filterSlice';
export default function MapComponent() {
    const dispatch = useDispatch();

    const MapStory = useMemo(
        () =>
            dynamic(() => import('@/app/components/widgets/MapStory'), {
                ssr: false,
                loading: () => <p>A map is loading</p>,
            }),
        []
    );

    const loadCSV = async () => {
        try {
            const response = await fetch('/casidata.csv');
            const csvText = await response.text();
            Papa.parse<CsvRow>(csvText, {
                header: true,
                dynamicTyping: true,
                complete: (results: any) => {
                    dispatch(setCsvData(results.data));
                },
                error: (error: Error) => {
                    console.error('Error parsing CSV:', error);
                },
            });
        } catch (error) {
            console.error('Error loading CSV:', error);
        }
    };

    useEffect(() => {
        loadCSV();
    }, []);

    return (
        <div className='space-y-4  h-[100%] w-[100%] '>
            <div className='bg-white-700 py-1  z-0   h-[100%] w-[100%] relative'>
                <MapStory />
            </div>
        </div>
    );
}
