'use client';
import { Skeleton } from '@/app/components/ui/skeleton';

export function MapPageSkeleton() {
    return (
        <div className='w-full h-full'>
            <Skeleton className='h-full w-full rounded-lg' />
        </div>
    );
}


