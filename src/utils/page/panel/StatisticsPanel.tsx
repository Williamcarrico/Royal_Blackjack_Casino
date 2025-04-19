'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    Sigma,
    Award,
    BarChart3,
    PieChart,
    ClipboardList,
    Trophy,
    ClockIcon,
    Coins,
    CircleDollarSign,
    ArrowUp,
    ArrowDown,
    Repeat
} from 'lucide-react';

const StatisticsPanel = () => {
    // This would typically come from a store or props
    const stats = {
        handsPlayed: 24,
        handsWon: 13,
        handsLost: 10,
        pushes: 1,
        blackjacks: 2,
        winPercentage: 54.2,
        netProfit: 245,
        biggestWin: 150,
        biggestLoss: 100,
        currentStreak: 3,
        longestWinStreak: 4,
        averageBetSize: 25,
        // Additional stats
        hoursPlayed: 1.2,
        totalBets: 720,
        lastTenHands: [
            { result: 'win', amount: 25 },
            { result: 'win', amount: 15 },
            { result: 'loss', amount: -30 },
            { result: 'win', amount: 40 },
            { result: 'push', amount: 0 },
            { result: 'win', amount: 20 },
            { result: 'loss', amount: -25 },
            { result: 'loss', amount: -25 },
            { result: 'win', amount: 25 },
            { result: 'win', amount: 25 },
        ]
    };

    // Calculate win/loss ratio
    const winLossRatio = stats.handsLost > 0 ? (stats.handsWon / stats.handsLost).toFixed(2) : stats.handsWon.toFixed(2);

    // Calculate recent performance (last 10 hands)
    const recentWins = stats.lastTenHands.filter(hand => hand.result === 'win').length;
    const recentPerformance = (recentWins / stats.lastTenHands.length) * 100;

    // Get background color based on hand result
    const getResultBackgroundColor = (result: string) => {
        if (result === 'win') return 'bg-emerald-600';
        if (result === 'loss') return 'bg-red-600';
        return 'bg-amber-600';
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        }
    };

    return (
        <motion.div
            className="flex flex-col gap-6 py-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Summary Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                <Card className="overflow-hidden border shadow-lg bg-gradient-to-br from-amber-900/40 to-black/40 border-amber-800/40">
                    <CardContent className="relative p-4">
                        <div className="absolute right-2 top-2 text-amber-400/30">
                            <Trophy className="w-12 h-12" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-sm text-amber-400/80">Win Rate</span>
                            <div className="text-3xl font-bold text-amber-100">{stats.winPercentage}%</div>
                            <span className="text-xs text-amber-300/70">
                                {stats.handsWon} of {stats.handsPlayed} hands
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border shadow-lg bg-gradient-to-br from-emerald-900/40 to-black/40 border-emerald-800/40">
                    <CardContent className="relative p-4">
                        <div className="absolute right-2 top-2 text-emerald-400/30">
                            <Coins className="w-12 h-12" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-1">
                            <span className="text-sm text-emerald-400/80">Net Profit</span>
                            <div className="text-3xl font-bold text-emerald-300">${stats.netProfit}</div>
                            <span className="text-xs text-emerald-300/70">
                                Avg. bet: ${stats.averageBetSize}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Win-loss visualization */}
            <motion.div variants={itemVariants} className="mb-2">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-medium text-amber-300">Session Results</h3>
                </div>

                <div className="relative h-8 overflow-hidden border rounded-lg bg-black/30 border-amber-900/40">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-emerald-600/70"
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.handsWon / stats.handsPlayed) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    ></motion.div>

                    <motion.div
                        className="absolute top-0 left-0 h-full bg-red-600/70"
                        style={{ left: `${(stats.handsWon / stats.handsPlayed) * 100}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.handsLost / stats.handsPlayed) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    ></motion.div>

                    <motion.div
                        className="absolute top-0 left-0 h-full bg-amber-500/70"
                        style={{
                            left: `${((stats.handsWon + stats.handsLost) / stats.handsPlayed) * 100}%`
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.pushes / stats.handsPlayed) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
                    ></motion.div>

                    <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                        <div className="flex items-center gap-1 text-white">
                            <span>{stats.handsWon}</span>
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1 text-white">
                            <TrendingDown className="w-3 h-3 text-red-400" />
                            <span>{stats.handsLost}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between px-1 mt-1 text-xs text-amber-400/70">
                    <span>Wins</span>
                    <span>Pushes: {stats.pushes}</span>
                    <span>Losses</span>
                </div>
            </motion.div>

            <Separator className="bg-amber-900/30" />

            {/* Game Statistics */}
            <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Sigma className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-medium text-amber-300">Game Statistics</h3>
                </div>

                <div className="p-4 space-y-3 border rounded-xl border-amber-900/40 bg-black/30 backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-amber-400/70">Hands Played</span>
                            <div className="flex items-center">
                                <ClipboardList className="w-4 h-4 mr-2 text-amber-400" />
                                <span className="font-medium text-amber-100">{stats.handsPlayed}</span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs text-amber-400/70">Win/Loss Ratio</span>
                            <div className="flex items-center">
                                <PieChart className="w-4 h-4 mr-2 text-amber-400" />
                                <span className="font-medium text-amber-100">{winLossRatio}</span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs text-amber-400/70">Blackjacks</span>
                            <div className="flex items-center">
                                <Award className="w-4 h-4 mr-2 text-amber-400" />
                                <span className="font-medium text-amber-100">{stats.blackjacks}</span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs text-amber-400/70">Hours Played</span>
                            <div className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-2 text-amber-400" />
                                <span className="font-medium text-amber-100">{stats.hoursPlayed}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <Separator className="bg-amber-900/30" />

            {/* Performance Stats */}
            <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-medium text-amber-300">Performance Metrics</h3>
                </div>

                <div className="p-4 space-y-3 border rounded-xl border-amber-900/40 bg-black/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Repeat className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-amber-100">Current Streak</span>
                        </div>
                        <Badge className={stats.currentStreak > 0 ?
                            "bg-emerald-700/70 text-white" :
                            "bg-red-700/70 text-white"}>
                            {stats.currentStreak > 0 ?
                                <ArrowUp className="w-3 h-3 mr-1" /> :
                                <ArrowDown className="w-3 h-3 mr-1" />}
                            {Math.abs(stats.currentStreak)}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-amber-100">Longest Win Streak</span>
                        </div>
                        <span className="font-medium text-amber-100">{stats.longestWinStreak}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-amber-100">Biggest Win</span>
                        </div>
                        <span className="font-medium text-emerald-400">${stats.biggestWin}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CircleDollarSign className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-amber-100">Biggest Loss</span>
                        </div>
                        <span className="font-medium text-red-400">${stats.biggestLoss}</span>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-amber-400/70">Recent Performance (Last 10 hands)</span>
                            <span className="text-xs font-medium text-amber-300">{recentPerformance.toFixed(0)}% Win Rate</span>
                        </div>
                        <div className="flex h-2 gap-1">
                            {stats.lastTenHands.map((hand, index) => (
                                <motion.div
                                    key={`hand-${hand.result}-${hand.amount}-${index}`}
                                    className={`flex-1 h-full rounded-sm ${getResultBackgroundColor(hand.result)}`}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ delay: index * 0.05, duration: 0.2 }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default StatisticsPanel;