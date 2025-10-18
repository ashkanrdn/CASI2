'use client';
import { Skeleton } from '@/app/components/ui/skeleton';

export function HistoryPageSkeleton() {
    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
                <section className="py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <Skeleton className="mx-auto h-8 w-72" />
                            <Skeleton className="mx-auto mt-3 h-1 w-24 rounded" />
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="mt-3 h-5 w-11/12" />
                                <Skeleton className="mt-3 h-5 w-10/12" />
                                <Skeleton className="mt-3 h-5 w-2/3" />
                            </div>
                            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                                <Skeleton className="h-40 w-3/4" />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 py-16">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <Skeleton className="mx-auto h-8 w-80" />
                            <Skeleton className="mx-auto mt-3 h-1 w-24 rounded" />
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="mt-3 h-5 w-11/12" />
                                <Skeleton className="mt-3 h-5 w-10/12" />
                                <Skeleton className="mt-3 h-5 w-2/3" />
                            </div>
                            <div className="h-80 flex items-center justify-center bg-white rounded-lg">
                                <Skeleton className="h-40 w-3/4" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}


