'use client';

import { useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import './styles/globals.css';
import FilterSidebar from './components/widgets/FilterSidebar';
import CountyRank from './components/widgets/CountyRank';
import BarChartWidget from './components/widgets/BarChartWidget';
import RightSideBar from './components/widgets/RightSideBar';

interface Props {
    readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
    return (
        <Provider store={store}>
            <html lang='en'>
                <body className='overflow-hidden'>
                    <div className='h-screen flex flex-col'>
                        {/* Header */}
                        <header className='bg-gray-600 text-white p-4'>
                            <h1 className='text-2xl font-bold'>CASI CJCJ</h1>
                        </header>

                        {/* Main content area with sidebars */}
                        <div className='flex flex-1 overflow-hidden'>
                            {/* Left sidebar */}
                            <aside className='w-72 bg-gray-100 overflow-auto'>
                                <FilterSidebar />
                            </aside>

                            {/* Main content */}
                            <main className='flex-1 overflow-hidden'>{children}</main>

                            {/* Right sidebar */}
                            <aside className='w-72 bg-gray-100 overflow-hidden pt-2 flex flex-col'>
                                <div className='flex-1 overflow-auto pb-4'>
                                    {/* <CountyRank />
                                     */}
                                    <BarChartWidget />
                                    {/* <RightSideBar /> */}
                                </div>
                            </aside>
                        </div>

                        {/* Footer */}
                        <footer className='bg-gray-800 text-white p-4'>
                            <div className=' mx-auto px-4'>
                                <div className='flex flex-col md:flex-row justify-between items-center gap-4 '>
                                    <div className='text-left'>
                                        <h3 className='text-xl font-bold mb-2'>Data Story</h3>
                                        <p className='text-gray-400'>Visualizing data in meaningful ways</p>
                                    </div>

                                    <div className='flex gap-6'>
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

                                    <div className='border-t border-neutral-800 pt-4 mt-4'>
                                        <p className='text-center text-sm text-gray-400'>
                                            © {new Date().getFullYear()} Data Story. All rights reserved.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </body>
            </html>
        </Provider>
    );
}
