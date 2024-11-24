'use client';

import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';

import './styles/globals.css';

import FilterSidebar from './components/widgets/FilterSidebar';

interface Props {
    readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
    return (
        <Provider store={store}>
            <html lang='en'>
                <body>
                    <div className='min-h-screen flex flex-col'>
                        {/* Header */}
                        <header className='bg-gray-600 text-white p-4'>
                            <h1 className='text-2xl font-bold'>Header</h1>
                        </header>

                        {/* Main content area with sidebars */}
                        <div className='flex flex-1'>
                            {/* Left sidebar */}
                            <aside className='w-64 bg-gray-100 p-4'>
                                <FilterSidebar />
                            </aside>

                            {/* Main content */}
                            <main className='flex-1 p-4'>{children}</main>

                            {/* Right sidebar */}
                            <aside className='w-64 bg-gray-100 p-4'>
                                <h2 className='font-semibold mb-4'>Right Sidebar</h2>
                                <div className='space-y-4'>
                                    <div>Widget 1</div>
                                    <div>Widget 2</div>
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
