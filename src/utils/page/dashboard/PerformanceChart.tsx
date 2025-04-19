'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Chart type alias
type ChartType = 'line' | 'bar' | 'pie' | 'area';

// Define tooltip types
interface TooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
}

interface TooltipPayload {
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: PerformanceDataPoint;
}

// Format tooltip values
const formatValue = (value: number, name: string, series: ChartSeries[]) => {
    // Look up the series by name to see if it has special formatting needs
    const seriesInfo = series.find(s => s.name === name);

    if (!seriesInfo) return value;

    // You could add more formatting options based on series key
    if (seriesInfo.key === 'winRate' || seriesInfo.key === 'percentage') {
        return `${value}%`;
    } else if (seriesInfo.key === 'balance' || seriesInfo.key === 'earnings') {
        return `$${value.toFixed(2)}`;
    }

    return value;
};

// Custom tooltip component moved outside
const CustomTooltip = ({ active, payload, label, series }: TooltipProps & { series: ChartSeries[] }) => {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="p-2 text-sm border rounded-md shadow-md bg-background/95 backdrop-blur-sm border-border">
            <p className="mb-1 font-medium">{label}</p>
            {payload.map((entry) => (
                <div key={`tooltip-${entry.name}-${entry.dataKey}`} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full tooltip-color-indicator"
                        data-color={entry.color}
                    />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-medium">{formatValue(entry.value, entry.name, series)}</span>
                </div>
            ))}
        </div>
    );
};

// EmptyState component moved outside of parent component
const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-12 h-12 mb-3 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
        </svg>
        <p className="text-muted-foreground">{message}</p>
    </div>
);

// Data types
export interface PerformanceDataPoint {
    name: string;
    value: number;
    date?: string;
    [key: string]: string | number | boolean | undefined; // More specific type for additional properties
}

export interface ChartSeries {
    name: string;
    key: string;
    color: string;
}

export interface PerformanceChartProps {
    title: string;
    description?: string;
    data: PerformanceDataPoint[];
    series?: ChartSeries[];
    chartTypes?: ChartType[];
    defaultChartType?: ChartType;
    xAxisKey?: string;
    yAxisLabel?: string;
    xAxisLabel?: string;
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    animate?: boolean;
    className?: string;
    height?: number;
    colorScale?: string[];
    emptyStateMessage?: string;
    footer?: React.ReactNode;
}

const DefaultColors = [
    '#0ea5e9', // sky-500
    '#22c55e', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#f97316'  // orange-500
];

const PerformanceChart = ({
    title,
    description,
    data,
    series = [{ name: 'Value', key: 'value', color: '#0ea5e9' }],
    chartTypes = ['line', 'bar', 'area', 'pie'],
    defaultChartType = 'line',
    xAxisKey = 'name',
    yAxisLabel,
    xAxisLabel,
    showLegend = true,
    showGrid = true,
    showTooltip = true,
    animate = true,
    className = '',
    height = 300,
    colorScale = DefaultColors,
    emptyStateMessage = 'No data available',
    footer
}: PerformanceChartProps) => {
    const [chartType, setChartType] = useState<ChartType>(defaultChartType);

    // Check if data is available
    const hasData = data && data.length > 0;

    // For the pie chart we need to transform data to handle multiple series
    const pieData = useMemo(() => {
        if (series.length === 1) {
            return data;
        } else {
            // If we have multiple series, take the first data point and extract series values
            const firstDataPoint = data[0];
            if (!firstDataPoint) return [];

            return series.map(s => ({
                name: s.name,
                value: firstDataPoint[s.key] || 0
            }));
        }
    }, [data, series]);

    // Render bar chart
    const renderBarChart = () => (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.2} />}
                <XAxis
                    dataKey={xAxisKey}
                    label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                    tick={{ fontSize: 12 }}
                />
                {showTooltip && <Tooltip content={<CustomTooltip series={series} />} />}
                {showLegend && <Legend />}
                {series.map((s, i) => (
                    <Bar
                        key={`bar-${s.key}`}
                        dataKey={s.key}
                        name={s.name}
                        fill={s.color || colorScale[i % colorScale.length]}
                        animationDuration={animate ? 1500 : 0}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );

    // Render line chart
    const renderLineChart = () => (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.2} />}
                <XAxis
                    dataKey={xAxisKey}
                    label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                    tick={{ fontSize: 12 }}
                />
                {showTooltip && <Tooltip content={<CustomTooltip series={series} />} />}
                {showLegend && <Legend />}
                {series.map((s, i) => (
                    <Line
                        key={`line-${s.key}`}
                        type="monotone"
                        dataKey={s.key}
                        name={s.name}
                        stroke={s.color || colorScale[i % colorScale.length]}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                        dot={{ strokeWidth: 2 }}
                        animationDuration={animate ? 1500 : 0}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );

    // Render area chart
    const renderAreaChart = () => (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.2} />}
                <XAxis
                    dataKey={xAxisKey}
                    label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                    tick={{ fontSize: 12 }}
                />
                {showTooltip && <Tooltip content={<CustomTooltip series={series} />} />}
                {showLegend && <Legend />}
                {series.map((s, i) => (
                    <Area
                        key={`area-${s.key}`}
                        type="monotone"
                        dataKey={s.key}
                        name={s.name}
                        stroke={s.color || colorScale[i % colorScale.length]}
                        fill={s.color || colorScale[i % colorScale.length]}
                        fillOpacity={0.2}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                        animationDuration={animate ? 1500 : 0}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );

    // Render pie chart
    const renderPieChart = () => (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={height / 3}
                    innerRadius={height / 6}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    animationDuration={animate ? 1500 : 0}
                >
                    {pieData.map((entry, index) => {
                        const seriesItem = series.find(s => s.name === entry.name);
                        const color = seriesItem?.color ?? colorScale[index % colorScale.length];
                        return <Cell key={`cell-${entry.name}`} fill={color} />;
                    })}
                </Pie>
                {showTooltip && <Tooltip content={<CustomTooltip series={series} />} />}
                {showLegend && <Legend />}
            </PieChart>
        </ResponsiveContainer>
    );

    // Render selected chart type
    const renderChart = () => {
        if (!hasData) {
            return <EmptyState message={emptyStateMessage} />;
        }

        switch (chartType) {
            case 'bar':
                return renderBarChart();
            case 'line':
                return renderLineChart();
            case 'area':
                return renderAreaChart();
            case 'pie':
                return renderPieChart();
            default:
                return <EmptyState message={emptyStateMessage} />;
        }
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        {description && <CardDescription>{description}</CardDescription>}
                    </div>

                    {chartTypes.length > 1 && (
                        <Tabs
                            defaultValue={defaultChartType}
                            value={chartType}
                            onValueChange={(value) => setChartType(value as ChartType)}
                            className="w-auto mt-2 sm:mt-0"
                        >
                            <TabsList className="grid h-8 grid-cols-4">
                                {chartTypes.includes('line') && (
                                    <TabsTrigger value="line" className="px-2 py-1 text-xs">
                                        Line
                                    </TabsTrigger>
                                )}
                                {chartTypes.includes('bar') && (
                                    <TabsTrigger value="bar" className="px-2 py-1 text-xs">
                                        Bar
                                    </TabsTrigger>
                                )}
                                {chartTypes.includes('area') && (
                                    <TabsTrigger value="area" className="px-2 py-1 text-xs">
                                        Area
                                    </TabsTrigger>
                                )}
                                {chartTypes.includes('pie') && (
                                    <TabsTrigger value="pie" className="px-2 py-1 text-xs">
                                        Pie
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </Tabs>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-2">
                {renderChart()}
            </CardContent>

            {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
    );
};

export default PerformanceChart;