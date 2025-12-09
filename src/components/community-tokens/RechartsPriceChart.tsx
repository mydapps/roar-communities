import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface PriceDataPoint {
    time: Date;
    price: number;
    volume: number;
}

interface RechartsPriceChartProps {
    data: PriceDataPoint[];
    className?: string;
    height?: number;
    showGrid?: boolean;
    showAxes?: boolean;
    showTooltip?: boolean;
}

const RechartsPriceChart: React.FC<RechartsPriceChartProps> = ({
    data,
    className,
    height = 300,
    showGrid = false,
    showAxes = false,
    showTooltip = true
}) => {
    // Calculate min/max for domain with some padding
    const { minPrice, maxPrice, isPositive } = useMemo(() => {
        if (!data || data.length === 0) return { minPrice: 0, maxPrice: 0, isPositive: true };

        const prices = data.map(d => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const padding = (max - min) * 0.1;

        const firstPrice = data[0].price;
        const lastPrice = data[data.length - 1].price;

        return {
            minPrice: min - padding,
            maxPrice: max + padding,
            isPositive: lastPrice >= firstPrice
        };
    }, [data]);

    const color = isPositive ? '#22c55e' : '#ef4444'; // green-500 : red-500

    if (!data || data.length === 0) {
        return (
            <div className={`flex items-center justify-center text-muted-foreground ${className}`} style={{ height }}>
                No price data available
            </div>
        );
    }

    return (
        <div className={className} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    {showAxes && (
                        <XAxis
                            dataKey="time"
                            tickFormatter={(time) => format(new Date(time), 'HH:mm')}
                            hide={!showAxes}
                        />
                    )}
                    <YAxis
                        domain={[minPrice, maxPrice]}
                        hide={!showAxes}
                    />

                    {showTooltip && (
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <Card className="p-2 border-none shadow-lg bg-background/90 backdrop-blur-sm">
                                            <p className="text-sm font-bold">
                                                ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(label), 'MMM d, h:mm a')}
                                            </p>
                                        </Card>
                                    );
                                }
                                return null;
                            }}
                        />
                    )}

                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RechartsPriceChart;
