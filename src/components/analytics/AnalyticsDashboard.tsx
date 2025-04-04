'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import useAnalyticsStore, {
    useWinRate,
    usePerformanceMetrics,
    useSessionMetrics,
    useStrategyHeatMap
} from '@/hooks/analytics/useAnalyticsStore'
import {
    WinRateData,
    PerformanceMetricsType,
    SessionMetrics,
    HeatMapEntry,
    Session,
    AggregatedHeatMapData
} from '@/hooks/analytics/useGameAnalytics'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/layout/button'
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'
import {
    SkillMetric,
} from '../analytics/types'

// Skill Metric Card
const SkillMetricCard = ({
    skillMetric
}: {
    skillMetric: SkillMetric
}) => {
    // Get badge and progress color based on skill level
    const getBadgeClass = (level: string) => {
        switch (level) {
            case 'expert': return 'bg-violet-500 text-white'
            case 'advanced': return 'bg-blue-500 text-white'
            case 'intermediate': return 'bg-amber-500 text-white'
            case 'beginner': return 'bg-slate-400 text-white'
            default: return 'bg-slate-300 text-slate-800'
        }
    }

    const getProgressColor = (level: string) => {
        switch (level) {
            case 'expert': return 'bg-violet-500'
            case 'advanced': return 'bg-blue-500'
            case 'intermediate': return 'bg-amber-500'
            case 'beginner': return 'bg-slate-400'
            default: return 'bg-slate-300'
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-300">{skillMetric.category}</span>
                <Badge className={getBadgeClass(skillMetric.level)}>
                    {skillMetric.level.charAt(0).toUpperCase() + skillMetric.level.slice(1)}
                </Badge>
            </div>
            <Progress
                value={skillMetric.score}
                max={100}
                className={`h-2 ${getProgressColor(skillMetric.level)}`}
            />
        </div>
    )
}

// Win Rate Chart - Utilizing WinRateData interface
const WinRateChart = ({
    handsWon,
    handsLost,
    handsPushed,
    blackjacks }: Omit<WinRateData, 'winRate' | 'weeklyTrend'>) => {
    const data = [
        { name: 'Wins', value: handsWon - blackjacks },
        { name: 'Blackjacks', value: blackjacks },
        { name: 'Losses', value: handsLost },
        { name: 'Pushes', value: handsPushed }
    ]

    const COLORS = ['#22c55e', '#8b5cf6', '#ef4444', '#f59e0b']

    return (
        <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} hands`, '']} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

// Sessions Chart
const SessionsChart = ({
    analytics
}: {
    analytics: {
        sessions: Session[]
    }
}) => {
    const sessionsData = analytics.sessions.slice(-7).map((session: Session) => ({
        id: session.id.substring(0, 5),
        duration: Math.round((session.duration || 0) / 60), // in minutes
        profit: session.netProfit,
        handsPlayed: session.handsPlayed
    })).reverse();

    return (
        <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sessionsData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="id" />
                    <YAxis />
                    <Tooltip
                        formatter={(value, name) => {
                            if (name === 'profit') return [formatCurrency(value as number), 'Profit']
                            if (name === 'handsPlayed') return [value, 'Hands']
                            if (name === 'duration') return [value, 'Minutes']
                            return [value, name]
                        }}
                    />
                    <Legend />
                    <Bar dataKey="profit" fill="#8884d8" />
                    <Bar dataKey="handsPlayed" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// Heat Map Visualization (Simplified) - Fixed to use the correct type
const StrategyHeatMap = ({
    heatMapData
}: {
    heatMapData: HeatMapEntry[]
}) => {
    // Transform HeatMapEntry to match component's expected format
    const mappedHeatMapData = heatMapData.map(entry => ({
        playerValue: entry.playerValue,
        dealerValue: entry.dealerCard, // Mapping dealerCard to dealerValue
        action: entry.action,
        result: entry.result,
        count: entry.count
    }));

    // Transform and aggregate heat map data
    const aggregatedData = mappedHeatMapData.reduce<Record<string, AggregatedHeatMapData>>((acc, entry) => {
        const key = `${entry.playerValue}-${entry.action}`

        if (!acc[key]) {
            acc[key] = {
                playerValue: entry.playerValue,
                action: entry.action,
                wins: 0,
                losses: 0,
                total: 0,
                winRate: 0
            }
        }

        if (entry.result === 'win' || entry.result === 'blackjack') {
            acc[key].wins += entry.count
        } else if (entry.result === 'loss') {
            acc[key].losses += entry.count
        }

        acc[key].total += entry.count

        return acc
    }, {})

    const chartData = Object.values(aggregatedData)
        .map(item => ({
            playerValue: item.playerValue,
            action: item.action,
            wins: item.wins,
            losses: item.losses,
            total: item.total,
            winRate: item.total > 0 ? (item.wins / item.total) : 0
        }))
        .filter(item => item.total >= 3) // Only show items with enough data
        .sort((a, b) => a.playerValue - b.playerValue)
        .slice(0, 10) // Limit to 10 for better visualization

    return (
        <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="playerValue" label={{ value: 'Hand Value', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Win Rate', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                        formatter={(value, name) => {
                            if (name === 'winRate') return [`${(Number(value) * 100).toFixed(1)}%`, 'Win Rate']
                            return [value, name]
                        }}
                    />
                    <Legend />
                    <Bar name="Hit" dataKey="winRate" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// Extract Dashboard Stats into a separate component
const DashboardStats = ({
    winRateData,
    performanceData,
    analytics
}: {
    winRateData: WinRateData;
    performanceData: PerformanceMetricsType;
    analytics: {
        handsPlayed: number;
        blackjackRate: number;
        blackjacks: number;
        averageBet: number;
    }
}) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-gray-200">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-amber-400">
                    {(winRateData.winRate * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-400">
                    {winRateData.handsPlayed} hands played
                </p>
                {winRateData.weeklyTrend !== undefined && (
                    <div className="flex items-center mt-1 text-xs">
                        <span className={winRateData.weeklyTrend > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {winRateData.weeklyTrend > 0 ? '↑' : '↓'} {Math.abs(winRateData.weeklyTrend).toFixed(1)}%
                        </span>
                        <span className="ml-1 text-gray-500">This week</span>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-gray-200">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-3xl font-bold ${performanceData.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(performanceData.totalProfit)}
                </div>
                <p className="text-sm text-gray-400">
                    Avg Bet: {formatCurrency(analytics.averageBet)}
                </p>
                {performanceData.recentTrend !== undefined && (
                    <div className="flex items-center mt-1 text-xs">
                        <span className={performanceData.recentTrend > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {performanceData.recentTrend > 0 ? '↑' : '↓'} {formatCurrency(Math.abs(performanceData.recentTrend))}
                        </span>
                        <span className="ml-1 text-gray-500">Recent</span>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-gray-200">Blackjack Rate</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-violet-400">
                    {(analytics.blackjackRate * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-400">
                    {analytics.blackjacks} blackjacks
                </p>
            </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-gray-200">Longest Streak</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-blue-400">
                    {performanceData.streaks.longestWinStreak}
                </div>
                <p className="text-sm text-gray-400">
                    Current: {performanceData.streaks.currentWinStreak > 0
                        ? `${performanceData.streaks.currentWinStreak} wins`
                        : `${Math.abs(performanceData.streaks.currentLoseStreak)} losses`}
                </p>
                {performanceData.bankrollStatus && (
                    <div className="flex items-center mt-1 text-xs">
                        <span className={getBankrollStatusClass(performanceData.bankrollStatus.status)}>
                            {getBankrollStatusText(performanceData.bankrollStatus.status)}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
);

// Add these helper functions near the DashboardStats component
const getBankrollStatusClass = (status: string): string => {
    if (status === 'increasing') return 'text-emerald-400';
    if (status === 'stable') return 'text-amber-400';
    return 'text-red-400';
};

const getBankrollStatusText = (status: string): string => {
    if (status === 'increasing') return '↑ Growing';
    if (status === 'stable') return '→ Stable';
    return '↓ Declining';
};

// Extract Overview Tab content
const OverviewTabContent = ({
    winRateData,
    analytics
}: {
    winRateData: WinRateData;
    analytics: {
        handsPlayed: number;
        handsWon: number;
        handsLost: number;
        handsPushed: number;
        totalWagered: number;
        totalWon: number;
        netProfit: number;
        blackjacks: number;
        busts: number;
        doublesWon: number;
        splitsWon: number;
    }
}) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white">Win Distribution</CardTitle>
                <CardDescription className="text-gray-400">
                    Breakdown of game outcomes
                </CardDescription>
            </CardHeader>
            <CardContent>
                <WinRateChart
                    handsWon={winRateData.handsWon}
                    handsLost={winRateData.handsLost}
                    handsPushed={winRateData.handsPushed}
                    blackjacks={winRateData.blackjacks}
                    handsPlayed={winRateData.handsPlayed}
                />
            </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
                <CardTitle className="text-white">Performance Summary</CardTitle>
                <CardDescription className="text-gray-400">
                    Key metrics from your gameplay
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Hands</span>
                        <span className="font-medium text-white">{analytics.handsPlayed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Win / Loss / Push</span>
                        <span className="font-medium text-white">
                            {analytics.handsWon} / {analytics.handsLost} / {analytics.handsPushed}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Wagered</span>
                        <span className="font-medium text-white">{formatCurrency(analytics.totalWagered)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Won</span>
                        <span className="font-medium text-white">{formatCurrency(analytics.totalWon)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">ROI</span>
                        <span className={`font-medium ${analytics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(analytics.totalWagered > 0
                                ? (analytics.netProfit / analytics.totalWagered) * 100
                                : 0).toFixed(1)}%
                        </span>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-700">
                    <h4 className="mb-2 text-sm font-medium text-gray-300">Special Hands</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-gray-700/50">
                            <div className="font-medium text-violet-400">{analytics.blackjacks}</div>
                            <div className="text-gray-400">Blackjacks</div>
                        </div>
                        <div className="p-2 rounded bg-gray-700/50">
                            <div className="font-medium text-red-400">{analytics.busts}</div>
                            <div className="text-gray-400">Busts</div>
                        </div>
                        <div className="p-2 rounded bg-gray-700/50">
                            <div className="font-medium text-amber-400">{analytics.doublesWon}</div>
                            <div className="text-gray-400">Doubles Won</div>
                        </div>
                        <div className="p-2 rounded bg-gray-700/50">
                            <div className="font-medium text-blue-400">{analytics.splitsWon}</div>
                            <div className="text-gray-400">Splits Won</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);

// Extract Actions Row
const ActionsRow = () => (
    <div className="flex justify-end space-x-2">
        <Button
            variant="outline"
            className="text-white border-gray-700 hover:bg-gray-700"
            onClick={() => useAnalyticsStore.getState().resetStatistics()}
        >
            Reset Statistics
        </Button>
        <Button
            variant="outline"
            className="text-white border-gray-700 hover:bg-gray-700"
            onClick={() => {
                const data = useAnalyticsStore.getState().exportAnalytics()
                const dataStr = JSON.stringify(data, null, 2)
                const blob = new Blob([dataStr], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `blackjack-analytics-${new Date().toISOString().split('T')[0]}.json`
                a.click()
            }}
        >
            Export Data
        </Button>
    </div>
);

// Inside the component where the nested ternary is used
const getSuccessRateClass = (rate: number): string => {
    if (rate > 0.55) return "h-2 bg-emerald-500";
    if (rate > 0.45) return "h-2 bg-amber-500";
    return "h-2 bg-red-500";
};

// Main Analytics Dashboard Component
export default function AnalyticsDashboard() {
    const [activeTab, setActiveTab] = useState('overview')

    // Get analytics data from store
    const analytics = useAnalyticsStore.getState()

    // Use typed interfaces for our analytics data
    const winRateData: WinRateData = useWinRate()
    const performanceData = usePerformanceMetrics()
    const currentSession: SessionMetrics = useSessionMetrics()
    const heatMapData: HeatMapEntry[] = useStrategyHeatMap()

    // Motion animation variants
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } }
    }

    // Create a sessions data object for the SessionsChart
    const sessionsData = {
        sessions: analytics.sessions.map(session => ({
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration ?? 0,
            handsPlayed: session.handsPlayed,
            netProfit: session.netProfit,
            averageBet: session.totalWagered / (session.handsPlayed || 1)
        }))
    };

    return (
        <div className="container px-4 py-8 mx-auto space-y-6">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="space-y-2"
            >
                <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
                <p className="text-gray-400">
                    Track your blackjack performance and improve your strategy
                </p>
            </motion.div>

            {/* Dashboard Stats Overview */}
            <DashboardStats
                winRateData={winRateData}
                performanceData={performanceData}
                analytics={analytics}
            />

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="pt-4">
                <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="strategy">Strategy</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="pt-4">
                    <OverviewTabContent winRateData={winRateData} analytics={analytics} />
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="sessions" className="pt-4">
                    <div className="grid grid-cols-1 gap-6">
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Session History</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Performance across your last 7 sessions
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SessionsChart analytics={sessionsData} />
                            </CardContent>
                        </Card>

                        {currentSession && (
                            <Card className="bg-gray-800 border-gray-700">
                                <CardHeader>
                                    <CardTitle className="text-white">Current Session</CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Started {currentSession.session?.startTime.toLocaleTimeString()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                        <div className="p-3 rounded bg-gray-700/50">
                                            <div className="text-xs text-gray-400">Hands</div>
                                            <div className="text-xl font-medium text-white">
                                                {currentSession.session?.handsPlayed ?? 0}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded bg-gray-700/50">
                                            <div className="text-xs text-gray-400">Duration</div>
                                            <div className="text-xl font-medium text-white">
                                                {Math.floor((currentSession.metrics?.duration ?? 0) / 60)}m
                                            </div>
                                        </div>
                                        <div className="p-3 rounded bg-gray-700/50">
                                            <div className="text-xs text-gray-400">Avg Bet</div>
                                            <div className="text-xl font-medium text-white">
                                                {formatCurrency(currentSession.metrics?.averageBet ?? 0)}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded bg-gray-700/50">
                                            <div className="text-xs text-gray-400">Net Profit</div>
                                            <div className={`text-xl font-medium ${(currentSession.session?.netProfit ?? 0) >= 0
                                                ? 'text-emerald-400'
                                                : 'text-red-400'}`}>
                                                {formatCurrency(currentSession.session?.netProfit ?? 0)}
                                            </div>
                                        </div>
                                    </div>

                                    {currentSession.metrics && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium text-gray-300">Performance Rate</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Hands per Hour</span>
                                                        <span className="font-medium text-white">
                                                            {Math.round(currentSession.metrics.handsPerHour)}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={Math.min(Math.round(currentSession.metrics.handsPerHour), 400)}
                                                        max={400}
                                                        className="h-2 bg-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Profit per Hour</span>
                                                        <span className={`font-medium ${currentSession.metrics.profitPerHour >= 0
                                                            ? 'text-emerald-400'
                                                            : 'text-red-400'}`}>
                                                            {formatCurrency(currentSession.metrics.profitPerHour)}
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={Math.min(Math.abs(currentSession.metrics.profitPerHour), 1000)}
                                                        max={1000}
                                                        className={currentSession.metrics.profitPerHour >= 0
                                                            ? "h-2 bg-emerald-500"
                                                            : "h-2 bg-red-500"
                                                        }
                                                    />
                                                </div>
                                                {currentSession.metrics.winRate !== undefined && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-400">Win Rate</span>
                                                            <span className="font-medium text-white">
                                                                {(currentSession.metrics.winRate * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={currentSession.metrics.winRate * 100}
                                                            max={100}
                                                            className="h-2 bg-amber-500"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Strategy Tab */}
                <TabsContent value="strategy" className="pt-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Strategy Effectiveness</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Win rate by hand value and action
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StrategyHeatMap heatMapData={heatMapData} />
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Action Analysis</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Success rate by play decision
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(analytics.performanceMetrics.actionSuccess).map(([action, data]) => {
                                    const typedData = data as { success: number; count: number; optimal?: number }
                                    if (!typedData || typedData.count === 0) return null

                                    const successRate = typedData.count > 0 ? typedData.success / typedData.count : 0
                                    const optimalRate = typedData.optimal !== undefined && typedData.count > 0
                                        ? typedData.optimal / typedData.count
                                        : undefined;

                                    return (
                                        <div key={`action-${action}`} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-300 capitalize">{action}</span>
                                                <span className="font-medium text-white">
                                                    {(successRate * 100).toFixed(1)}% ({typedData.count} plays)
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Progress
                                                    value={successRate * 100}
                                                    max={100}
                                                    className={getSuccessRateClass(successRate)}
                                                />
                                                {optimalRate !== undefined && (
                                                    <div className="w-16 text-xs text-gray-400">
                                                        {(optimalRate * 100).toFixed(0)}% optimal
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}

                                <div className="p-3 mt-4 rounded bg-gray-700/40">
                                    <h4 className="font-medium text-gray-200">Strategy Tips</h4>
                                    <ul className="mt-2 ml-5 text-sm text-gray-300 list-disc">
                                        <li>Stand when your hand is 17 or higher</li>
                                        <li>Always split Aces and 8s</li>
                                        <li>Double down on 11 against any dealer card</li>
                                        <li>Never take insurance unless counting cards</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="pt-4">
                    <div className="grid grid-cols-1 gap-6">
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white">Skill Assessment</CardTitle>
                                <CardDescription className="text-gray-400">
                                    Your blackjack skill metrics
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {performanceData.skillMetrics.map((metric: SkillMetric) => (
                                    <SkillMetricCard
                                        key={`skill-${metric.category}`}
                                        skillMetric={metric}
                                    />
                                ))}

                                <div className="p-4 mt-2 text-center border border-gray-700 rounded">
                                    <h4 className="text-lg font-medium text-white">
                                        {performanceData.playerLevel.charAt(0).toUpperCase() + performanceData.playerLevel.slice(1)} Player
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Expected Value: {(performanceData.expectedValue * 100).toFixed(2)}%
                                    </p>
                                    <Button
                                        className="mt-3 bg-amber-600 hover:bg-amber-700"
                                        onClick={() => setActiveTab('strategy')}
                                    >
                                        Improve Strategy
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Actions Row */}
            <ActionsRow />
        </div>
    )
}