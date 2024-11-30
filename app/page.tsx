'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

export default function MapComponent() {
    const MapStory = useMemo(
        () =>
            dynamic(() => import('@/app/components/widgets/MapStory'), {
                ssr: false,
                loading: () => <p>A map is loading</p>,
            }),
        []
    );

    return (
        <div className='space-y-4  h-[100%] w-[100%] '>
            <div className='bg-white-700 py-1  z-0   h-[100%] w-[100%] relative'>
                <MapStory />
            </div>
        </div>
    );
}
