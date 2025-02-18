declare module '@nivo/bar' {
    export interface BarDatum {
        [key: string]: string | number;
        value: number;
    }

    export interface BarProps {
        data: BarDatum[];
        keys: string[];
        indexBy: string;
        margin?: { top: number; right: number; bottom: number; left: number };
        layout?: 'horizontal' | 'vertical';
        valueScale?: { type: string };
        colors?: string | { scheme: string } | ((props: { data: BarDatum }) => string);
        borderRadius?: number;
        padding?: number;
        labelSkipWidth?: number;
        labelSkipHeight?: number;
        axisLeft?: {
            tickSize?: number;
            tickPadding?: number;
            tickRotation?: number;
            truncateTickAt?: number;
        } | null;
        axisBottom?: {
            tickSize?: number;
            tickPadding?: number;
            tickRotation?: number;
            format?: (value: number) => string;
            tickValues?: number | number[];
        } | null;
        tooltip?: (props: { data: BarDatum; value: number }) => React.ReactNode;
        theme?: {
            axis?: {
                ticks?: {
                    text?: {
                        fontSize?: number;
                    };
                };
            };
        };
        enableLabel?: boolean;
        label?: string | ((datum: any) => string);
        labelTextColor?: string | object;
        height?: number;
        enableGridY?: boolean;
        isInteractive?: boolean;
        animate?: boolean;
        renderBar?: () => null | React.ReactNode;
    }

    export const ResponsiveBar: React.FC<BarProps>;
} 
