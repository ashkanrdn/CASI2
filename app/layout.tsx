'use client';

import { useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import './styles/globals.css';
import FilterSidebar from './components/widgets/FilterSidebar';
import CountyRank from './components/widgets/CountyRank';

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
                            <h1 className='text-2xl font-bold'>Header</h1>
                        </header>

                        {/* Main content area with sidebars */}
                        <div className='flex flex-1 overflow-hidden'>
                            {/* Left sidebar */}
                            <aside className='w-64 bg-gray-100 overflow-auto'>
                                <FilterSidebar />
                            </aside>

                            {/* Main content */}
                            <main className='flex-1 overflow-hidden'>{children}</main>

                            {/* Right sidebar */}
                            <aside className='w-64 bg-gray-100 overflow-hidden pt-2 flex flex-col'>
                                <div className='flex-1 overflow-auto px-4 pb-4'>
                                    <CountyRank />
                                </div>
                            </aside>
                        </div>

                        {/* Footer */}
                        <footer className='bg-gray-800 text-white p-4'>
                            <p>Footer Content</p>
                        </footer>
                    </div>
                </body>
            </html>
        </Provider>
    );
}
