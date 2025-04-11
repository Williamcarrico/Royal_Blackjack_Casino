'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
    };

    return (
        <div className="flex flex-col gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.winPercentage}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.handsWon} wins / {stats.handsPlayed} hands
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            ${stats.netProfit}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Avg bet: ${stats.averageBetSize}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Game Statistics</h3>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Hands Played</span>
                        <span className="font-medium">{stats.handsPlayed}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Wins</span>
                        <span className="font-medium text-emerald-500">{stats.handsWon}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Losses</span>
                        <span className="font-medium text-red-500">{stats.handsLost}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Pushes</span>
                        <span className="font-medium">{stats.pushes}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Blackjacks</span>
                        <span className="font-medium text-amber-500">{stats.blackjacks}</span>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance</h3>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Current Streak</span>
                        <Badge variant={stats.currentStreak > 0 ? "success" : "destructive"}>
                            {stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Longest Win Streak</span>
                        <span className="font-medium">{stats.longestWinStreak}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Biggest Win</span>
                        <span className="font-medium text-emerald-500">${stats.biggestWin}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm">Biggest Loss</span>
                        <span className="font-medium text-red-500">${stats.biggestLoss}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;