'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip'
import { HeatMapEntry, AggregatedHeatMapData } from './types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Info } from 'lucide-react'

interface AdvancedStrategyHeatMapProps {
    heatMapData: HeatMapEntry[];
    className?: string;
}

// Define type for player values
type PlayerValue = {
    display: string;
    value: number;
    isSoft?: boolean;
    isPair?: boolean;
};

// Add type alias for hand types
type HandType = 'hard' | 'soft' | 'pair';

const dealerCards = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'A'];
const playerValues = [
    { display: 'Hard 8', value: 8 },
    { display: 'Hard 9', value: 9 },
    { display: 'Hard 10', value: 10 },
    { display: 'Hard 11', value: 11 },
    { display: 'Hard 12', value: 12 },
    { display: 'Hard 13', value: 13 },
    { display: 'Hard 14', value: 14 },
    { display: 'Hard 15', value: 15 },
    { display: 'Hard 16', value: 16 },
    { display: 'Hard 17', value: 17 },
    { display: 'Soft 13', value: 13, isSoft: true },
    { display: 'Soft 14', value: 14, isSoft: true },
    { display: 'Soft 15', value: 15, isSoft: true },
    { display: 'Soft 16', value: 16, isSoft: true },
    { display: 'Soft 17', value: 17, isSoft: true },
    { display: 'Soft 18', value: 18, isSoft: true },
    { display: 'Soft 19', value: 19, isSoft: true },
    { display: 'Soft 20', value: 20, isSoft: true },
    { display: 'Pair 2s', value: 2, isPair: true },
    { display: 'Pair 3s', value: 3, isPair: true },
    { display: 'Pair 4s', value: 4, isPair: true },
    { display: 'Pair 5s', value: 5, isPair: true },
    { display: 'Pair 6s', value: 6, isPair: true },
    { display: 'Pair 7s', value: 7, isPair: true },
    { display: 'Pair 8s', value: 8, isPair: true },
    { display: 'Pair 9s', value: 9, isPair: true },
    { display: 'Pair 10s', value: 10, isPair: true },
    { display: 'Pair As', value: 11, isPair: true },
];

// Basic strategy chart (simplified for demonstration)
const basicStrategyActions: Record<string, Record<number | string, string>> = {
    'hard': {
        8: 'H,H,H,H,H,H,H,H,H,H',
        9: 'H,D,D,D,D,H,H,H,H,H',
        10: 'D,D,D,D,D,D,D,D,H,H',
        11: 'D,D,D,D,D,D,D,D,D,D',
        12: 'H,H,S,S,S,H,H,H,H,H',
        13: 'S,S,S,S,S,H,H,H,H,H',
        14: 'S,S,S,S,S,H,H,H,H,H',
        15: 'S,S,S,S,S,H,H,H,H,H',
        16: 'S,S,S,S,S,H,H,H,H,H',
        17: 'S,S,S,S,S,S,S,S,S,S',
    },
    'soft': {
        13: 'H,H,H,H,D,H,H,H,H,H',
        14: 'H,H,H,H,D,H,H,H,H,H',
        15: 'H,H,H,D,D,H,H,H,H,H',
        16: 'H,H,H,D,D,H,H,H,H,H',
        17: 'H,D,D,D,D,H,H,H,H,H',
        18: 'S,S,S,S,S,S,S,H,H,H',
        19: 'S,S,S,S,S,S,S,S,S,S',
        20: 'S,S,S,S,S,S,S,S,S,S',
    },
    'pair': {
        2: 'P,P,P,P,P,P,H,H,H,H',
        3: 'P,P,P,P,P,P,H,H,H,H',
        4: 'H,H,H,P,P,H,H,H,H,H',
        5: 'D,D,D,D,D,D,D,D,H,H',
        6: 'P,P,P,P,P,H,H,H,H,H',
        7: 'P,P,P,P,P,P,H,H,H,H',
        8: 'P,P,P,P,P,P,P,P,P,P',
        9: 'P,P,P,P,P,S,P,P,S,S',
        10: 'S,S,S,S,S,S,S,S,S,S',
        11: 'P,P,P,P,P,P,P,P,P,P',
    }
};

const actionLabels: Record<string, string> = {
    'H': 'Hit',
    'S': 'Stand',
    'D': 'Double',
    'P': 'Split',
    'SU': 'Surrender'
};

const actionColors: Record<string, string> = {
    'H': 'bg-red-600',
    'S': 'bg-green-600',
    'D': 'bg-amber-600',
    'P': 'bg-blue-600',
    'SU': 'bg-purple-600'
};

// Replace the nested ternary with a function that uses if/else
const getPlayerValueFilter = (type: HandType): (pv: PlayerValue) => boolean => {
    if (type === 'hard') {
        return (pv: PlayerValue) => !pv.isSoft && !pv.isPair;
    } else if (type === 'soft') {
        return (pv: PlayerValue) => !!pv.isSoft;
    } else {
        return (pv: PlayerValue) => !!pv.isPair;
    }
};

// Add a helper function to get the display text based on hand type
const getHandTypeDisplay = (type: HandType): string => {
    if (type === 'hard') return 'Hard Total';
    if (type === 'soft') return 'Soft Hand';
    return 'Pairs';
};

export const AdvancedStrategyHeatMap = ({ heatMapData, className = '' }: AdvancedStrategyHeatMapProps) => {
    const [handType, setHandType] = useState<HandType>('hard');
    const [showOptimal, setShowOptimal] = useState(false);

    // Process and aggregate heat map data
    const aggregatedData = useMemo(() => {
        const playerValueFilter = getPlayerValueFilter(handType);

        const filteredPlayerValues = playerValues.filter(playerValueFilter);

        // Create a grid of player values and dealer cards
        const grid: Record<string, Record<string | number, AggregatedHeatMapData | null>> = {};

        filteredPlayerValues.forEach(playerValue => {
            grid[playerValue.display] = {};

            dealerCards.forEach(dealerCard => {
                grid[playerValue.display]![dealerCard] = null;
            });
        });

        // Fill in the grid with data from heatMapData
        heatMapData.forEach(entry => {
            const playerValue = playerValues.find(pv =>
                pv.value === entry.playerValue &&
                ((handType === 'soft' && pv.isSoft) ||
                    (handType === 'pair' && pv.isPair) ||
                    (handType === 'hard' && !pv.isSoft && !pv.isPair))
            );

            if (!playerValue) return;

            if (!grid[playerValue.display]?.[entry.dealerCard]) {
                grid[playerValue.display]![entry.dealerCard] = {
                    playerValue: entry.playerValue,
                    action: entry.action,
                    wins: 0,
                    losses: 0,
                    total: 0,
                    winRate: 0
                };
            }

            const cell = grid[playerValue.display]?.[entry.dealerCard];
            if (!cell) return;

            if (entry.result === 'win' || entry.result === 'blackjack') {
                cell.wins += entry.count;
            } else if (entry.result === 'loss') {
                cell.losses += entry.count;
            }

            cell.total += entry.count;
            cell.winRate = cell.total > 0 ? cell.wins / cell.total : 0;
        });

        return grid;
    }, [heatMapData, handType]);

    // Get the optimal action for a player value and dealer card
    const getOptimalAction = (playerValue: string, dealerCard: number | string): string | null => {
        const pValue = playerValues.find(pv => pv.display === playerValue);
        if (!pValue) return null;

        const dealerIndex = dealerCards.findIndex(dc => dc === dealerCard);

        if (dealerIndex === -1) return null;

        const handTypeKey = pValue.isSoft ? 'soft' : pValue.isPair ? 'pair' : 'hard';

        // Add a safe check for the presence of the value in basicStrategyActions
        const handTypeData = basicStrategyActions[handTypeKey] || {};
        const actionsString = handTypeData[pValue.value as keyof typeof handTypeData];

        if (!actionsString) return null;

        const actions = actionsString.split(',');
        return actions[dealerIndex] || null;
    };

    // Get cell background color based on win rate
    const getCellColor = (winRate: number, isMisplay: boolean) => {
        if (isMisplay) {
            return 'bg-red-900/50';
        }

        if (winRate === 0) return 'bg-gray-700';
        if (winRate < 0.4) return 'bg-red-700/70';
        if (winRate < 0.45) return 'bg-red-600/70';
        if (winRate < 0.5) return 'bg-amber-700/70';
        if (winRate < 0.55) return 'bg-amber-600/70';
        if (winRate < 0.6) return 'bg-green-700/70';
        return 'bg-green-600/70';
    };

    // Cell animation variants
    const cellVariants = {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
    };

    // Extract the nested ternary for empty cell content
    const renderEmptyCellContent = (showOptimal: boolean, optimalAction: string | null) => {
        if (showOptimal && optimalAction) {
            return <span className="text-xs text-gray-500">{optimalAction}</span>;
        }
        return <span className="text-xs text-gray-500">-</span>;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                    <Select value={handType} onValueChange={(value: HandType) => setHandType(value)}>
                        <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
                            <SelectValue placeholder="Hand Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="hard" className="text-gray-200">Hard Hands</SelectItem>
                            <SelectItem value="soft" className="text-gray-200">Soft Hands</SelectItem>
                            <SelectItem value="pair" className="text-gray-200">Pairs</SelectItem>
                        </SelectContent>
                    </Select>

                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                        <input
                            type="checkbox"
                            checked={showOptimal}
                            onChange={() => setShowOptimal(!showOptimal)}
                            className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
                        />
                        <span>Show optimal play</span>
                    </label>
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center text-sm text-gray-400">
                                <Info className="w-4 h-4 mr-1" />
                                <span>Strategy Legend</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs p-3 text-gray-200 bg-gray-800 border-gray-700">
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(actionLabels).map(([key, label]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${actionColors[key]}`}></div>
                                        <span>{label} ({key})</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                Red cells indicate deviations from optimal strategy
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-sm font-medium text-left text-gray-400 border-b border-gray-700">
                                {getHandTypeDisplay(handType)}
                            </th>
                            {dealerCards.map((card) => (
                                <th key={`dealer-${card}`} className="p-2 text-sm font-medium text-center text-gray-400 border-b border-gray-700">
                                    {card}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(aggregatedData).map((playerValue, rowIndex) => (
                            <tr key={playerValue} className={rowIndex % 2 === 0 ? 'bg-gray-800/30' : ''}>
                                <td className="p-2 text-sm font-medium text-gray-300 border-r border-gray-700">
                                    {playerValue}
                                </td>
                                {dealerCards.map((dealerCard) => {
                                    const cell = aggregatedData[playerValue]?.[dealerCard];
                                    const optimalAction = getOptimalAction(playerValue, dealerCard);
                                    const currentAction = cell?.action || '';
                                    const isMisplay = !!(showOptimal && optimalAction &&
                                        currentAction && currentAction !== optimalAction.toLowerCase());

                                    return (
                                        <td key={`${playerValue}-${dealerCard}`} className="relative p-0 border border-gray-700/50">
                                            {cell && cell.total > 0 ? (
                                                <motion.div
                                                    variants={cellVariants}
                                                    initial="initial"
                                                    animate="animate"
                                                    className={`w-full h-full flex flex-col items-center justify-center p-2 ${getCellColor(cell.winRate, Boolean(isMisplay))}`}
                                                >
                                                    <span className="text-sm font-medium text-white">
                                                        {(cell.winRate * 100).toFixed(0)}%
                                                    </span>
                                                    <span className="text-xs text-gray-300">
                                                        {cell.action ? cell.action.toUpperCase() : ''}
                                                        {showOptimal && optimalAction && optimalAction !== cell.action.toUpperCase() &&
                                                            ` → ${optimalAction}`}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {cell.total} hands
                                                    </span>
                                                </motion.div>
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full p-2 bg-gray-800/50">
                                                    {renderEmptyCellContent(showOptimal, optimalAction)}
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdvancedStrategyHeatMap;