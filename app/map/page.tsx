'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Progress } from '@/app/components/ui/progress';

export default function MapPage() {
    const [progress, setProgress] = useState(13);

    useEffect(() => {
        const timer = setTimeout(() => setProgress(100), 10);
        return () => clearTimeout(timer);
    }, []);

    const MapStory = useMemo(
        () =>
            dynamic(() => import('@/app/components/widgets/MapStory'), {
                ssr: false,
                loading: () => (
                    <div className='flex flex-col justify-center items-center w-full h-full'>
                        <p className='text-sm m-4 text-gray-500'>Loading map...</p>
                        <Progress value={progress} className='w-[60%]' />
                    </div>
                ),
            }),
        []
    );

    return (
        <div className='space-y-4  h-[100%] w-[100%] '>
            <div className='flex h-[100%] w-[100%]'>
                {/* <div className='w-[40%] h-full  bg-white'>
                    <DataStory />

                </div> */}
                <div className='w-full h-full relative'>
                    <MapStory />
                </div>
            </div>
        </div>
    );
} 