'use client';

import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import './styles/globals.css';

interface Props {
    readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
    return (
        <Provider store={store}>
            <html lang='en'>
                <body>
                    <div className='h-screen flex flex-col'>
                        {/* Header */}
                        <header className='bg-gray-600 text-white p-4 flex justify-center items-center'>
                            <h1 className='text-2xl font-bold'>CASI CJCJ</h1>
                        </header>

                        {/* Main content */}
                        <main className='flex-1 overflow-hidden'>{children}</main>

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
