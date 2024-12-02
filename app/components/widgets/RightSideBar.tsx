import React, { useState } from 'react';
import CountyRank from './CountyRank';
import BarChartWidget from './BarChartWidget';
import { Button } from '@/app/components/ui/button';

export default function RightSideBar() {
    const [renderBarChart, setRenderBarChart] = useState(false);

    return (
        <div className='flex flex-1 flex-col'>
            <div className='flex justify-start '>
                <Button variant={'default'} className='h-8 text-xs' onClick={() => setRenderBarChart(!renderBarChart)}>
                    {renderBarChart ? 'Show Cards' : 'Show Chart'}
                </Button>
            </div>
            <div className='flex-1 overflow-auto px-4 pb-4'>{renderBarChart ? <BarChartWidget /> : <CountyRank />}</div>
        </div>
    );
}
