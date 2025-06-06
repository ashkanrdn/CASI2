'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import FilterSidebar from '../components/widgets/FilterSidebar';
import BarChartWidget from '../components/widgets/BarChartWidget';
import { Button } from '@/app/components/ui/button';
import { SlidersHorizontal, BarChartHorizontal, X, Home } from 'lucide-react';

interface Props {
    readonly children: ReactNode;
}

export default function MapLayout({ children }: Props) {
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    const closeSidebars = () => {
        setIsLeftSidebarOpen(false);
        setIsRightSidebarOpen(false);
    };

    return (
        <div className='h-full flex flex-col'>
            {/* Backdrop Overlay (Mobile) */}
            {(isLeftSidebarOpen || isRightSidebarOpen) && (
                <div
                    className='fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden'
                    onClick={closeSidebars}
                    aria-hidden='true'
                />
            )}

            {/* Main content area with sidebars */}
            <div className='flex flex-1 overflow-hidden relative'>
                {/* Mobile toggle buttons - only show when sidebars are closed */}
                <div className='md:hidden'>
                    {/* Left sidebar toggle */}
                    {!isLeftSidebarOpen && (
                        <Button
                            variant='default'
                            size='icon'
                            className='fixed top-4 left-4 z-50 bg-blue-600 hover:bg-blue-700 '
                            onClick={() => setIsLeftSidebarOpen(true)}
                        >
                            <SlidersHorizontal className='h-5 w-5' />
                        </Button>
                    )}
                    
                    {/* Right sidebar toggle */}
                    {!isRightSidebarOpen && (
                        <Button
                            variant='default'
                            size='icon'
                            className='fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 '
                            onClick={() => setIsRightSidebarOpen(true)}
                        >
                            <BarChartHorizontal className='h-5 w-5' />
                        </Button>
                    )}
                </div>

                {/* Left sidebar */}
                <aside
                    className={`
                        fixed inset-y-0 left-0 z-40 w-72 bg-gray-100 overflow-auto transform transition-transform duration-300 ease-in-out
                        ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        md:relative md:translate-x-0 md:inset-auto md:z-auto md:block
                    `}
                >
                    {/* Close button (Mobile only inside sidebar) */}
                    <Button
                        variant='ghost'
                        size='icon'
                        className='absolute top-2 right-2 md:hidden'
                        onClick={() => setIsLeftSidebarOpen(false)}
                    >
                        <X className='h-5 w-5' />
                    </Button>
                    <FilterSidebar />
                </aside>

                {/* Main content */}
                <main className='flex-1 overflow-hidden'>{children}</main>

                {/* Right sidebar */}
                <aside
                    className={`
                        fixed inset-y-0 right-0 z-40 w-72 bg-gray-100 overflow-auto pt-2 flex flex-col transform transition-transform duration-300 ease-in-out
                        ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                        md:relative md:translate-x-0 md:inset-auto md:z-auto md:block
                    `}
                >
                    {/* Close button (Mobile only inside sidebar) */}
                    <Button
                        variant='ghost'
                        size='icon'
                        className='absolute top-2 left-2 md:hidden'
                        onClick={() => setIsRightSidebarOpen(false)}
                    >
                        <X className='h-5 w-5' />
                    </Button>
                    <div className='flex-1 overflow-auto pb-4 pt-8 md:pt-0'>
                        <BarChartWidget />
                    </div>
                </aside>
            </div>
        </div>
    );
} 