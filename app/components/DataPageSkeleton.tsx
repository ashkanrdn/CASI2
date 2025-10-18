'use client';
import { Skeleton } from '@/app/components/ui/skeleton';

export function DataPageSkeleton() {
    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                <section className="py-16 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <Skeleton className="mx-auto h-8 w-64" />
                            <Skeleton className="mx-auto mt-3 h-1 w-24 rounded" />
                        </div>
                        <div className="bg-[#AFEEEE]/20 p-8 rounded-lg mb-8">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="mt-3 h-5 w-11/12" />
                            <Skeleton className="mt-3 h-5 w-10/12" />
                            <Skeleton className="mt-3 h-5 w-2/3" />
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <Skeleton className="mx-auto h-8 w-72" />
                            <Skeleton className="mx-auto mt-3 h-1 w-24 rounded" />
                            <Skeleton className="mx-auto mt-2 h-5 w-80" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="rounded-lg border bg-white p-6 shadow">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="mt-3 h-4 w-10/12" />
                                    <Skeleton className="mt-3 h-4 w-9/12" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}


