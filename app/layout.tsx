'use client';

import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import DataPreloader from '@/app/components/DataPreloader';
import { Open_Sans } from 'next/font/google';
import './styles/globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-open-sans',
  display: 'swap',
});

interface Props {
    readonly children: ReactNode;
}

export default function RootLayout({ children }: Props) {
    const pathname = usePathname();
    
    return (
        <Provider store={store}>
            <DataPreloader />
            <html lang='en' className={openSans.className}>
                <body>
                    <div className='h-screen flex flex-col'>
                        {/* Navigation Header */}
                        <header className='bg-gray-600 text-white p-4'>
                            <nav className='flex justify-between items-center'>
                                {/* Left side - Logo */}
                                <div className='hidden md:flex items-center'>
                                    <Link href="/" className='text-2xl font-bold hover:text-gray-200 transition-colors'>
                                        CASI
                                    </Link>
                                </div>

                                {/* Center - Navigation Links */}
                                <div className='flex items-center space-x-8 mx-auto md:mx-0'>
                                    <Link 
                                        href="/" 
                                        className={`transition-colors ${
                                            pathname === '/' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        About CASI
                                    </Link>
                                    <Link 
                                        href="/history" 
                                        className={`transition-colors ${
                                            pathname === '/history' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        History
                                    </Link>
                                    <Link 
                                        href="/map" 
                                        className={`transition-colors ${
                                            pathname === '/map' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        Map
                                    </Link>
                                    <Link 
                                        href="/data" 
                                        className={`transition-colors ${
                                            pathname === '/data' 
                                                ? 'text-white border-b-2 border-white' 
                                                : 'text-gray-200 hover:text-white'
                                        }`}
                                    >
                                        Data
                                    </Link>
                                </div>

                                {/* Right side - Placeholder */}
                                <div className='hidden md:flex items-center'>
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
