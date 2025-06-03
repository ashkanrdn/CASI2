'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import './styles/globals.css';
import FilterSidebar from './components/widgets/FilterSidebar';
import BarChartWidget from './components/widgets/BarChartWidget';
import { Button } from '@/app/components/ui/button';
import { SlidersHorizontal, BarChartHorizontal, X, Menu } from 'lucide-react';

interface Props {
    readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    const closeSidebars = () => {
        setIsLeftSidebarOpen(false);
        setIsRightSidebarOpen(false);
    };

    return (
        <Provider store={store}>
            <html lang='en'>
                <body className='overflow-hidden'>
                    <div className='h-screen flex flex-col'>
                        {/* Header */}
                        <header className='bg-gray-600 text-white p-4 flex justify-between items-center'>
                            {/* Left Sidebar Toggle (Mobile) */}
                            <Button
                                variant='ghost'
                                size='icon'
                                className='md:hidden text-white'
                                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                            >
                                <SlidersHorizontal className='h-6 w-6' />
                            </Button>

                            <h1 className='text-2xl font-bold'>CASI CJCJ</h1>

                            {/* Right Sidebar Toggle (Mobile) */}
                            <Button
                                variant='ghost'
                                size='icon'
                                className='md:hidden text-white'
                                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                            >
                                <BarChartHorizontal className='h-6 w-6' />
                            </Button>
                        </header>

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
                                    {/* <CountyRank />
                                     */}
                                    <BarChartWidget />
                                    {/* <RightSideBar /> */}
                                </div>
                            </aside>
                        </div>

                        {/* Footer */}
                        <footer className='bg-gray-800 text-white p-4 hidden md:block'>
                            <div className='mx-auto px-4'>
                                <div className='flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left'>
                                    <div className='mb-4 md:mb-0'>
                                        <h3 className='text-xl font-bold'>Data Story</h3>
                                        {/* <p className='text-gray-400'>Visualizing data in meaningful ways</p> */}
                                    </div>

                                    <div className='flex flex-wrap justify-center gap-4 md:gap-6 mb-4 md:mb-0'>
                                        <a href='#' className='text-gray-400 hover:text-white transition-colors'>
                                            About
                                        </a>
                                        <a href='#' className='text-gray-400 hover:text-white transition-colors'>
                                            Contact
                                        </a>
                                        <a href='#' className='text-gray-400 hover:text-white transition-colors'>
                                            Privacy
                                        </a>
                                    </div>

                                    <p className='text-sm text-gray-400'>
                                        © {new Date().getFullYear()} Data Story. All rights reserved.
                                    </p>
                                </div>
                            </div>
                        </footer>
                    </div>
                </body>
            </html>
        </Provider>
    );
}
