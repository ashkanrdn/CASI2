'use client';
import { Skeleton } from '@/app/components/ui/skeleton';

export function HomePageSkeleton() {
    return (
        <div className="w-full h-full overflow-auto">
            <div className="min-h-screen bg-gray-50">
                <section className="bg-gradient-to-br from-[#AFEEEE] to-[#99CCFF] py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <Skeleton className="mx-auto h-10 w-3/4 md:h-12 md:w-2/3" />
                            <Skeleton className="mx-auto mt-4 h-5 w-5/6 md:w-1/2" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-lg p-4">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="mt-4 h-8 w-1/3" />
                                    <Skeleton className="mt-2 h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                        <div className="text-center">
                            <Skeleton className="mx-auto h-10 w-56" />
                        </div>
                    </div>
                </section>

                <section className="py-16 bg-gray-50">
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

                <section className="py-16 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <Skeleton className="mx-auto h-8 w-80" />
                            <Skeleton className="mx-auto mt-2 h-5 w-72" />
                            <Skeleton className="mx-auto mt-3 h-1 w-24 rounded" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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


