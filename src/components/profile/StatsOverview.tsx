'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Trophy,
    DollarSign,
    TrendingUp,
    BarChart4,
    Award,
    Clock,
    Sparkles,
    Flame
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine
} from 'recharts'
import { format } from 'date-fns'
import { createDynamicStyle } from "@/utils/tailwind";

// Types
interface Achievement {
    achievement_id: string
    earned_at: string
    achievements: {
        name: string
        description: string
        badge_image_url: string | null
    }
}

interface GameSession {
    id: string
    session_start: string
    session_end?: string
}

interface UserStats {
    achievements: Achievement[]
    recentSessions: GameSession[]
    // Stats overview properties
    totalGames: number
    totalHands: number
    totalWins: number
    totalLosses: number
    totalPushes: number
    totalBlackjacks: number
    winRate: number
    blackjackRate: number
    balance: number
    avgBetSize?: number
    largestWin?: number
    longestStreak?: number
    favoriteAction?: string
    rank?: number
    percentile?: number
}

// Sub-components
const MetricCard = ({
    title,
    value,
    icon,
    trend,
    description,
    colorScheme = 'default'
}: {
    readonly title: string;
    readonly value: string | number;
    readonly icon: React.ReactNode;
    readonly trend?: number;
    readonly description?: string;
    readonly colorScheme?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple';
}) => {
    // Color schemes based on type
    const getColorScheme = () => {
        switch (colorScheme) {
            case 'success': return 'from-emerald-500/20 to-emerald-700/10 border-emerald-800/50 text-emerald-400';
            case 'danger': return 'from-red-500/20 to-red-700/10 border-red-800/50 text-red-400';
            case 'warning': return 'from-amber-500/20 to-amber-700/10 border-amber-800/50 text-amber-400';
            case 'info': return 'from-blue-500/20 to-blue-700/10 border-blue-800/50 text-blue-400';
            case 'purple': return 'from-violet-500/20 to-violet-700/10 border-violet-800/50 text-violet-400';
            default: return 'from-slate-700/50 to-slate-800/50 border-slate-700 text-slate-200';
        }
    };

    // Get trend icon and color
    const getTrendIndicator = () => {
        if (!trend || trend === 0) return null;

        if (trend > 0) {
            return <TrendingUp className="w-4 h-4 ml-1 text-emerald-400" />;
        } else {
            return <TrendingUp className="w-4 h-4 ml-1 text-red-400 rotate-180" />;
        }
    };

    // Animation variants
    const cardVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
        >
            <Card className={`bg-gradient-to-br border ${getColorScheme()} overflow-hidden relative h-full`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/0 to-slate-800/80 z-0"></div>
                <CardHeader className="relative z-10 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium text-slate-200">{title}</CardTitle>
                        <div className="p-1.5 rounded-full bg-slate-800/50">{icon}</div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="flex items-baseline gap-1">
                        <div className="text-2xl font-bold tracking-tight">{value}</div>
                        {trend !== undefined && getTrendIndicator()}
                    </div>
                    {description && (
                        <p className="mt-1 text-xs text-slate-400">{description}</p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

const PerformanceChart = ({ stats }: { readonly stats: UserStats }) => {
    // Generate data for the win/loss chart
    const winLossData = [
        { name: 'Wins', value: stats.totalWins - stats.totalBlackjacks, color: '#22c55e' },
        { name: 'Blackjacks', value: stats.totalBlackjacks, color: '#8b5cf6' },
        { name: 'Losses', value: stats.totalLosses, color: '#ef4444' },
        { name: 'Pushes', value: stats.totalPushes, color: '#f59e0b' }
    ];

    // Create a performance trend chart (dummy data for visualization)
    const trendData = Array.from({ length: 10 }, (_, i) => {
        const randomWinRate = 0.35 + (Math.random() * 0.3); // Random win rate between 35% and 65%
        return {
            day: i + 1,
            winRate: randomWinRate,
            avgWinRate: 0.5 // Industry average as reference
        };
    });

    return (
        <Tabs defaultValue="distribution" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="distribution">Win/Loss Distribution</TabsTrigger>
                <TabsTrigger value="trend">Performance Trend</TabsTrigger>
            </TabsList>

            <TabsContent value="distribution" className="mt-4">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={winLossData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {winLossData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} hands`, '']} />
                            <Legend verticalAlign="bottom" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </TabsContent>

            <TabsContent value="trend" className="mt-4">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis
                                dataKey="day"
                                stroke="#888"
                                tick={{ fill: '#bbb' }}
                                label={{ value: 'Sessions', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis
                                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                                stroke="#888"
                                tick={{ fill: '#bbb' }}
                                domain={[0, 1]}
                            />
                            <Tooltip
                                formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'Win Rate']}
                                contentStyle={{ backgroundColor: '#222', borderColor: '#444' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend />
                            <ReferenceLine y={0.5} stroke="#888" strokeDasharray="3 3" label="Industry Average" />
                            <Area
                                type="monotone"
                                dataKey="winRate"
                                stroke="#8b5cf6"
                                fillOpacity={1}
                                fill="url(#winRateGradient)"
                                activeDot={{ r: 6, fill: '#a78bfa' }}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </TabsContent>
        </Tabs>
    );
};

const RankingSection = ({ stats }: { readonly stats: UserStats }) => {
    // Calculate rank percentile - default to 0 if not available
    const rankPercentile = stats.percentile ?? 0;

    // Determine the player level based on percentile
    const getPlayerLevel = (percentile: number) => {
        if (percentile >= 95) return { level: 'Elite', color: 'text-purple-400' };
        if (percentile >= 80) return { level: 'Expert', color: 'text-blue-400' };
        if (percentile >= 60) return { level: 'Skilled', color: 'text-emerald-400' };
        if (percentile >= 40) return { level: 'Intermediate', color: 'text-amber-400' };
        return { level: 'Novice', color: 'text-slate-400' };
    };

    const playerLevel = getPlayerLevel(rankPercentile);

    return (
        <Card className="border border-slate-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Player Ranking
                </CardTitle>
                <CardDescription>
                    Your standing among all blackjack players
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                        <h4 className="text-lg font-semibold">
                            Rank: <span className="text-amber-400">#{stats.rank ?? '???'}</span>
                        </h4>
                        <span className={`text-lg font-bold ${playerLevel.color}`}>
                            {playerLevel.level} Player
                        </span>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Percentile: {rankPercentile}%</span>
                            <span>Top {100 - rankPercentile}%</span>
                        </div>
                        <Progress value={rankPercentile} className="h-2 bg-slate-700">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                                {...createDynamicStyle({ width: `${rankPercentile}%` })}
                            />
                        </Progress>
                    </div>

                    <div className="pt-2 mt-4 text-sm text-center border-t border-slate-700">
                        <p className="text-slate-400">
                            Keep playing to improve your ranking and unlock new achievements!
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const StatsDetailsGrid = ({ stats }: { readonly stats: UserStats }) => {
    const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
    const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
                title="Win Rate"
                value={formatPercentage(stats.winRate)}
                icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                colorScheme="success"
                description="Percentage of hands won vs. total hands played"
                trend={3.2} // Example trend
            />

            <MetricCard
                title="Blackjack Rate"
                value={formatPercentage(stats.blackjackRate)}
                icon={<Sparkles className="w-4 h-4 text-violet-400" />}
                colorScheme="purple"
                description="Frequency of natural blackjacks"
            />

            <MetricCard
                title="Total Balance"
                value={formatCurrency(stats.balance)}
                icon={<DollarSign className="w-4 h-4 text-amber-400" />}
                colorScheme="warning"
                description="Your current chip balance"
                trend={stats.balance > 0 ? 8.7 : -4.2} // Example trend
            />

            <MetricCard
                title="Games Played"
                value={stats.totalGames}
                icon={<BarChart4 className="w-4 h-4 text-blue-400" />}
                colorScheme="info"
                description="Total number of game sessions"
            />

            <MetricCard
                title="Total Hands"
                value={stats.totalHands}
                icon={<Clock className="w-4 h-4 text-slate-400" />}
                description="Cumulative hands played across all sessions"
            />

            <MetricCard
                title="Largest Win"
                value={formatCurrency(stats.largestWin ?? 0)}
                icon={<Flame className="w-4 h-4 text-red-400" />}
                colorScheme="danger"
                description="Your biggest single-hand victory"
            />
        </div>
    );
};

export function StatsOverview({ stats }: { readonly stats: UserStats }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            {/* Key Metrics Grid */}
            <StatsDetailsGrid stats={stats} />

            {/* Performance Charts and Rankings */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                {/* Charts Section - Takes up more space */}
                <Card className="border border-slate-700 lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart4 className="w-5 h-5 text-blue-400" />
                            Performance Analytics
                        </CardTitle>
                        <CardDescription>
                            Visual breakdown of your gameplay statistics
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PerformanceChart stats={stats} />
                    </CardContent>
                </Card>

                {/* Ranking Section */}
                <div className="lg:col-span-2">
                    <RankingSection stats={stats} />
                </div>
            </div>

            {/* Achievement Highlights */}
            <Card className="border border-slate-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        Recent Achievements
                    </CardTitle>
                    <CardDescription>
                        Your latest blackjack accomplishments
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.achievements && stats.achievements.length > 0 ? (
                        <div className="space-y-4">
                            {stats.achievements.slice(0, 3).map((achievement) => (
                                <div
                                    key={achievement.achievement_id}
                                    className="flex items-center p-3 space-x-3 transition-colors border rounded-lg bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
                                        <Award className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-slate-200">{achievement.achievements.name}</h4>
                                            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                                                {format(new Date(achievement.earned_at), 'MMM d')}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-400">{achievement.achievements.description}</p>
                                    </div>
                                </div>
                            ))}

                            {stats.achievements.length > 3 && (
                                <div className="text-center">
                                    <Badge variant="outline" className="cursor-pointer text-violet-400 border-violet-500/30 hover:bg-violet-500/10">
                                        View All {stats.achievements.length} Achievements
                                    </Badge>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Trophy className="w-12 h-12 mb-3 text-slate-500 opacity-30" />
                            <h3 className="text-lg font-medium text-slate-300">No Achievements Yet</h3>
                            <p className="max-w-md mt-1 text-sm text-slate-400">
                                Keep playing to earn achievements! Win streaks, blackjacks, and consistent play will unlock special badges.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}