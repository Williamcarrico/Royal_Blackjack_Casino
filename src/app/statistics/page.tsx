'use client';

import React from 'react';
import { useStatistics } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Statistics Page
 *
 * Displays game statistics using the Facade pattern implementation
 * to access organized statistics data from our centralized store.
 */
export default function StatisticsPage() {
    // Using our Facade pattern to access different categories of statistics
    const {
        useBasicStats,
        useSpecialHandStats,
        useBettingStats,
        useStreakStats,
        usePerformanceMetrics,
        useSessionStats,
    } = useStatistics();

    // Get the statistics data using our hooks
    const basicStats = useBasicStats();
    const specialHandStats = useSpecialHandStats();
    const bettingStats = useBettingStats();
    const streakStats = useStreakStats();
    const performanceMetrics = usePerformanceMetrics();
    const sessionStats = useSessionStats();

    return (
        <main className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Blackjack Statistics</h1>

            <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="special">Special Hands</TabsTrigger>
                    <TabsTrigger value="betting">Betting</TabsTrigger>
                    <TabsTrigger value="streaks">Streaks</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="session">Session</TabsTrigger>
                </TabsList>

                {/* Basic Stats Tab */}
                <TabsContent value="basic">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            title="Hands Played"
                            value={basicStats.handsPlayed}
                        />
                        <StatCard
                            title="Hands Won"
                            value={basicStats.handsWon}
                            subtitle={`Win Rate: ${(basicStats.winRate * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Hands Lost"
                            value={basicStats.handsLost}
                            subtitle={`Loss Rate: ${((basicStats.handsLost / basicStats.handsPlayed) * 100 || 0).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Hands Pushed"
                            value={basicStats.handsPushed}
                            subtitle={`Push Rate: ${((basicStats.handsPushed / basicStats.handsPlayed) * 100 || 0).toFixed(1)}%`}
                        />
                    </div>
                </TabsContent>

                {/* Special Hands Tab */}
                <TabsContent value="special">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            title="Blackjacks"
                            value={specialHandStats.blackjacks}
                            subtitle={`Rate: ${(specialHandStats.blackjackRate * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Busts"
                            value={specialHandStats.busts}
                            subtitle={`Rate: ${(specialHandStats.bustRate * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Surrenders"
                            value={specialHandStats.surrenders}
                        />
                        <StatCard
                            title="Double Wins"
                            value={specialHandStats.doubleWins}
                            subtitle={`Success Rate: ${(specialHandStats.doubleWins / (specialHandStats.doubleWins + specialHandStats.doubleLosses) * 100 || 0).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Split Wins"
                            value={specialHandStats.splitWins}
                            subtitle={`Success Rate: ${(specialHandStats.splitWins / (specialHandStats.splitWins + specialHandStats.splitLosses) * 100 || 0).toFixed(1)}%`}
                        />
                    </div>
                </TabsContent>

                {/* Betting Stats Tab */}
                <TabsContent value="betting">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            title="Total Wagered"
                            value={`$${bettingStats.totalWagered.toFixed(2)}`}
                        />
                        <StatCard
                            title="Net Profit"
                            value={`$${bettingStats.netProfit.toFixed(2)}`}
                            subtitle={`ROI: ${bettingStats.roi.toFixed(2)}%`}
                            className={bettingStats.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}
                        />
                        <StatCard
                            title="Average Bet"
                            value={`$${bettingStats.averageBet.toFixed(2)}`}
                        />
                        <StatCard
                            title="Biggest Win"
                            value={`$${bettingStats.biggestWin.toFixed(2)}`}
                            className="bg-green-50"
                        />
                        <StatCard
                            title="Biggest Loss"
                            value={`$${Math.abs(bettingStats.biggestLoss).toFixed(2)}`}
                            className="bg-red-50"
                        />
                    </div>
                </TabsContent>

                {/* Streaks Tab */}
                <TabsContent value="streaks">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatCard
                            title="Current Win Streak"
                            value={streakStats.currentWinStreak}
                        />
                        <StatCard
                            title="Current Lose Streak"
                            value={streakStats.currentLoseStreak}
                        />
                        <StatCard
                            title="Longest Win Streak"
                            value={streakStats.longestWinStreak}
                        />
                        <StatCard
                            title="Longest Lose Streak"
                            value={streakStats.longestLoseStreak}
                        />
                    </div>
                </TabsContent>

                {/* Performance Metrics Tab */}
                <TabsContent value="performance">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            title="Decision Accuracy"
                            value={`${(performanceMetrics.decisionAccuracy * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Bet Sizing"
                            value={`${(performanceMetrics.betSizing * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Consistency"
                            value={`${(performanceMetrics.consistencyScore * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Risk Management"
                            value={`${(performanceMetrics.riskManagement * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Advantage Play"
                            value={`${(performanceMetrics.advantagePlayScore * 100).toFixed(1)}%`}
                        />
                        <StatCard
                            title="Overall Score"
                            value={`${(performanceMetrics.overallScore * 100).toFixed(1)}%`}
                            className="md:col-span-2 lg:col-span-3 bg-blue-50"
                        />
                    </div>
                </TabsContent>

                {/* Session Stats Tab */}
                <TabsContent value="session">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Session</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sessionStats.currentSession ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <p><span className="font-bold">Start Time:</span> {new Date(sessionStats.currentSession.startTime).toLocaleString()}</p>
                                        <p><span className="font-bold">Initial Balance:</span> ${sessionStats.currentSession.initialBalance.toFixed(2)}</p>
                                        <p><span className="font-bold">Hands Played:</span> {sessionStats.currentSession.handsPlayed}</p>
                                        <p><span className="font-bold">Total Wagered:</span> ${sessionStats.currentSession.totalWagered.toFixed(2)}</p>
                                        <p><span className="font-bold">Net Profit:</span> ${sessionStats.currentSession.netProfit.toFixed(2)}</p>
                                        <p><span className="font-bold">Win Rate:</span> {(sessionStats.currentSession.winRate * 100).toFixed(1)}%</p>
                                    </div>
                                ) : (
                                    <p>No active session</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Previous Sessions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sessionStats.sessions.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Date</th>
                                                    <th className="px-4 py-2 text-right">Duration</th>
                                                    <th className="px-4 py-2 text-right">Hands</th>
                                                    <th className="px-4 py-2 text-right">Wagered</th>
                                                    <th className="px-4 py-2 text-right">Profit</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sessionStats.sessions.map((session) => {
                                                    // Calculate duration if session has an end time
                                                    const duration = session.endTime
                                                        ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)
                                                        : 0;

                                                    return (
                                                        <tr key={session.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2">{new Date(session.startTime).toLocaleDateString()}</td>
                                                            <td className="px-4 py-2 text-right">{duration} min</td>
                                                            <td className="px-4 py-2 text-right">{session.handsPlayed}</td>
                                                            <td className="px-4 py-2 text-right">${session.totalWagered.toFixed(2)}</td>
                                                            <td className={`px-4 py-2 text-right ${session.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                ${session.netProfit.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p>No previous sessions</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    );
}

// Utility component for displaying statistics
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    className?: string;
}

function StatCard({ title, value, subtitle, className = '' }: StatCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}