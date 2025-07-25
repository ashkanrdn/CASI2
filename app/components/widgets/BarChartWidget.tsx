import { BarDatum, ResponsiveBar } from '@nivo/bar';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { MetricType } from '@/lib/features/filters/filterSlice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import CountyRank from './CountyRank';
import MetricsCards from './MetricsCards';

export default function BarChartWidget() {
    const selectedMetric = useSelector((state: RootState) => state.filters.selectedMetric);
    const temp = useSelector((state: RootState) => state.map.barChartData);
    const validBarChartData = [...temp]
        .filter((d): d is { county: string; value: number } => d && typeof d.value === 'number' && isFinite(d.value))
        .sort((a, b) => a.value - b.value);
    const colorScaleValues = useSelector((state: RootState) => state.map.colorScaleValues);

    const colorScale = d3
        .scaleSequential<string>()
        .domain([0, d3.max(colorScaleValues as number[]) || 0])
        .interpolator(d3.interpolateBlues);

    const validValues = validBarChartData.map((d) => d.value);
    const maxValue = validValues.length > 0 ? Math.max(...validValues) : 0;

    return (
        <div className='flex flex-col h-full p-2'>
            <Tabs defaultValue='barchart' className='flex flex-col h-full'>
                <TabsList className='grid w-full grid-cols-3 mb-4 gap-4 flex-shrink-0'>
                    <TabsTrigger value='barchart'>Chart</TabsTrigger>
                    <TabsTrigger value='ranking'>Ranking</TabsTrigger>
                    <TabsTrigger value='metrics'>Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value='barchart' className='flex-1 min-h-0'>
                    <div className='h-full flex flex-col'>
                        <motion.div 
                            className='flex-1 overflow-y-auto min-h-0' 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className='w-full min-h-fit' style={{ height: `${Math.max(validBarChartData.length * 35, 400)}px` }}>
                                <ResponsiveBar
                                    data={validBarChartData}
                                    keys={['value']}
                                    indexBy='county'
                                    margin={{ top: 10, right: 20, bottom: 0, left: 90 }}
                                    layout='horizontal'
                                    valueScale={{ type: 'linear' }}
                                    colors={({ data }) => {
                                        const value = (data as { value: number }).value;
                                        return colorScale(value);
                                    }}
                                    borderRadius={4}
                                    padding={0.5}
                                    labelSkipWidth={40}
                                    labelSkipHeight={12}
                                    enableLabel={false}
                                    axisLeft={{
                                        tickSize: 5,
                                        tickPadding: 5,
                                        truncateTickAt: 10,
                                    }}
                                    axisBottom={null}
                                    tooltip={(props: { data: BarDatum; value: number }) => (
                                        <motion.div
                                            className='bg-white p-2 shadow-lg rounded-md border border-gray-200'
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <strong className='text-sm'>{props.data.county}</strong>
                                            <br />
                                            <span className='text-sm text-gray-600'>
                                                {selectedMetric === MetricType.Cost
                                                    ? `$${Number(props.value).toLocaleString()}`
                                                    : Number(props.value).toLocaleString()}
                                            </span>
                                        </motion.div>
                                    )}
                                    theme={{
                                        axis: {
                                            ticks: {
                                                text: {
                                                    fontSize: 12,
                                                },
                                            },
                                        },
                                    }}
                                    animate={true}
                                />
                            </div>
                        </motion.div>

                        <motion.div 
                            className='h-28 w-full mt-1 flex-shrink-0' 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ResponsiveBar
                                data={[{ id: 'axis', value: maxValue }]}
                                keys={['value']}
                                indexBy='id'
                                margin={{ top: 0, right: 20, bottom: 90, left: 90 }}
                                layout='horizontal'
                                valueScale={{ type: 'linear' }}
                                enableLabel={false}
                                enableGridY={false}
                                axisLeft={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 12,
                                    tickRotation: 90,
                                    tickValues: 5,
                                    format: (value: number) =>
                                        selectedMetric === MetricType.Cost
                                            ? `$${Number(value).toLocaleString()}`
                                            : Number(value).toLocaleString(),
                                }}
                                colors='transparent'
                                borderRadius={0}
                                padding={0}
                                isInteractive={false}
                                animate={true}
                                theme={{
                                    axis: {
                                        ticks: {
                                            text: {
                                                fontSize: 12,
                                            },
                                        },
                                    },
                                }}
                            />
                        </motion.div>
                    </div>
                </TabsContent>

                <TabsContent value='ranking' className='flex-1 min-h-0'>
                    <div className='h-full overflow-auto'>
                        <CountyRank />
                    </div>
                </TabsContent>

                <TabsContent value='metrics' className='flex-1 min-h-0'>
                    <div className='h-full overflow-auto'>
                        <MetricsCards />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
