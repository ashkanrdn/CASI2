'use client';

import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import Link from 'next/link';
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
                        {/* Navigation Header */}
                        <header className='bg-gray-600 text-white p-4'>
                            <nav className='flex justify-between items-center'>
                                {/* Left side - Logo */}
                                <div className='flex items-center'>
                                    <Link href="/" className='text-2xl font-bold hover:text-gray-200 transition-colors'>
                                        CASI
                                    </Link>
                                </div>

                                {/* Center - Navigation Links */}
                                <div className='hidden md:flex items-center space-x-8'>
                                    <Link href="/" className='hover:text-gray-200 transition-colors'>
                                        Home
                                    </Link>
                                    <Link href="/map" className='hover:text-gray-200 transition-colors'>
                                        Map
                                    </Link>
                                    {/* <Link href="/contact" className='hover:text-gray-200 transition-colors'>
                                        Contact
                                    </Link>
                                    <Link href="/about" className='hover:text-gray-200 transition-colors'>
                                        About
                                    </Link> */}
                                </div>

                                {/* Right side - Placeholder */}
                                <div className='flex items-center'>
                                    <div className='w-16 h-8'></div>
                                </div>
                            </nav>
                        </header>

                        {/* Main content */}
                        <main className='flex-1 overflow-hidden'>{children}</main>
                    </div>
                </body>
            </html>
        </Provider>
    );
}
