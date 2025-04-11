'use client'

import React from 'react'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts'
import { Button } from '@/components/ui/layout/button'
import { ChartMode } from './types'
import { formatCurrency } from '@/lib/utils/format'
import { BarChartIcon, TrendingUp, LineChart as LineChartIcon } from 'lucide-react'

interface WinTrendChartProps {
    data: Array<{
        date: string;
        hands: number;
        wins: number;
        profit: number;
        winRate: number;
    }>;
    className?: string;
}

export const WinTrendChart = ({ data, className = '' }: WinTrendChartProps) => {
    const [chartMode, setChartMode] = useState<ChartMode>('winRate');

    // Get the right domain for Y axis based on mode
    const getYDomain = () => {
        if (chartMode === 'winRate') {
            return [0, Math.max(0.8, Math.max(...data.map(item => item.winRate)) * 1.1)];
        } else if (chartMode === 'hands') {
            return [0, Math.max(100, Math.max(...data.map(item => item.hands)) * 1.1)];
        } else {
            const maxProfit = Math.max(...data.map(item => item.profit));
            const minProfit = Math.min(...data.map(item => item.profit));
            const absMax = Math.max(Math.abs(maxProfit), Math.abs(minProfit));
            return [-absMax * 1.1, absMax * 1.1];
        }
    };

    // Format tooltip values based on chart mode
    const formatTooltipValue = (value: number, name: string) => {
        if (name === 'winRate') return [`${(value * 100).toFixed(1)}%`, 'Win Rate'];
        if (name === 'profit') return [formatCurrency(value), 'Profit'];
        if (name === 'wins') return [value, 'Wins'];
        if (name === 'hands') return [value, 'Hands'];
        return [value, name];
    };

    // Calculate moving average for win rate
    const movingAverage = <T extends Record<string, string | number>, K extends keyof T>(
        data: T[],
        key: K & string,
        window: number
    ): (T & Record<string, number>)[] => {
        return data.map((item, index) => {
            const start = Math.max(0, index - window + 1);
            const values = data.slice(start, index + 1).map(d => Number(d[key]));
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            return { ...item, [`${key}MA`]: avg };
        });
    };

    const dataWithMA = movingAverage(data, 'winRate', 3);

    // Determine which chart type to use based on mode
    const renderChart = () => {
        if (chartMode === 'winRate') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={dataWithMA}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                            dataKey="date"
                            stroke="#888"
                            tick={{ fill: '#bbb' }}
                            tickLine={{ stroke: '#888' }}
                        />
                        <YAxis
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            domain={getYDomain()}
                            stroke="#888"
                            tick={{ fill: '#bbb' }}
                            tickLine={{ stroke: '#888' }}
                        />
                        <Tooltip
                            formatter={formatTooltipValue}
                            contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <ReferenceLine y={0.5} stroke="#888" strokeDasharray="3 3" />
                        <ReferenceLine y={0.45} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <Line
                            type="monotone"
                            dataKey="winRate"
                            stroke="#8b5cf6"
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            activeDot={{ r: 6, fill: '#a78bfa' }}
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="winRateMA"
                            stroke="#22c55e"
                            dot={false}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="3-day MA"
                        />
                    </LineChart>
                </ResponsiveContainer>
            );
        } else if (chartMode === 'profit') {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                            dataKey="date"
                            stroke="#888"
                            tick={{ fill: '#bbb' }}
                            tickLine={{ stroke: '#888' }}
                        />
                        <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            domain={getYDomain()}
                            stroke="#888"
                            tick={{ fill: '#bbb' }}
                            tickLine={{ stroke: '#888' }}
                        />
                        <Tooltip
                            formatter={formatTooltipValue}
                            contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#16a34a"
                            fillOpacity={1}
                            fill="url(#profitGradient)"
                            activeDot={{ r: 6, fill: '#4ade80' }}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );
        } else {
            return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis
                            dataKey="date"
                            stroke="#888"
                            tick={{ fill: '#bbb' }}
                            tickLine={{ stroke: '#888' }}
                        />
                        <YAxis
                            domain={getYDomain()}
                            stroke="#888"
                            tick={{ fill: '#bbb' }}
                            tickLine={{ stroke: '#888' }}
                        />
                        <Tooltip
                            formatter={formatTooltipValue}
                            contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar
                            dataKey="hands"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                            name="Hands Played"
                        />
                        <Bar
                            dataKey="wins"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                            name="Hands Won"
                        />
                    </BarChart>
                </ResponsiveContainer>
            );
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`space-y-4 ${className}`}
        >
            <div className="flex justify-end space-x-1">
                <Button
                    variant="outline"
                    size="sm"
                    className={`px-2 py-1 h-8 border-gray-700 ${chartMode === 'winRate' ? 'bg-violet-900/40' : 'bg-gray-800'}`}
                    onClick={() => setChartMode('winRate')}
                >
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs">Win Rate</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={`px-2 py-1 h-8 border-gray-700 ${chartMode === 'profit' ? 'bg-emerald-900/40' : 'bg-gray-800'}`}
                    onClick={() => setChartMode('profit')}
                >
                    <LineChartIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs">Profit</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className={`px-2 py-1 h-8 border-gray-700 ${chartMode === 'hands' ? 'bg-blue-900/40' : 'bg-gray-800'}`}
                    onClick={() => setChartMode('hands')}
                >
                    <BarChartIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs">Hands</span>
                </Button>
            </div>

            <div className="h-[300px] bg-gray-900/30 rounded-lg p-4">
                {renderChart()}
            </div>
        </motion.div>
    );
};

export default WinTrendChart;