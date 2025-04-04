import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/utils';

interface GameStatsProps {
    stats?: {
        handsPlayed: number;
        handsWon: number;
        handsLost: number;
        handsPushed: number;
        blackjacks: number;
        netProfit: number;
        winRate?: number;
    };
    className?: string;
}

const GameStats: React.FC<GameStatsProps> = ({ stats, className }) => {
    if (!stats) return null;

    const winRate = stats.winRate ??
        (stats.handsPlayed > 0
            ? ((stats.handsWon / stats.handsPlayed) * 100).toFixed(1)
            : '0.0');

    return (
        <Card className={cn("p-4 border rounded-lg bg-black/30 backdrop-blur-sm border-slate-700", className)}>
            <motion.div className="flex items-center mb-3">
                <BarChart className="w-5 h-5 mr-2 text-indigo-400" />
                <motion.h3 className="text-lg font-semibold text-white">Game Stats</motion.h3>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-300">Hands:</span>
                        <span className="font-medium text-white">{stats.handsPlayed}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-300">Wins:</span>
                        <span className="font-medium text-green-400">{stats.handsWon}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-300">Losses:</span>
                        <span className="font-medium text-red-400">{stats.handsLost}</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-300">Pushes:</span>
                        <span className="font-medium text-white">{stats.handsPushed}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-300">Blackjacks:</span>
                        <span className="font-medium text-amber-400">{stats.blackjacks}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-300">Win Rate:</span>
                        <span className="font-medium text-indigo-400">{winRate}%</span>
                    </div>
                </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-700">
                <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-300">
                        <DollarSign className="w-4 h-4 mr-1 text-amber-400" />
                        Net Profit:
                    </span>
                    <motion.span
                        className={`font-semibold text-lg ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 0.3 }}
                    >
                        ${stats.netProfit >= 0 ? '+' : ''}{stats.netProfit}
                    </motion.span>
                </div>
            </div>
        </Card>
    );
};

export default GameStats;