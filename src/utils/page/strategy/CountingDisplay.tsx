'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Minus, RotateCcw, Info } from 'lucide-react';
import { CardData } from '../game/hand/Hand';

// Custom tooltip interface and component
interface CustomTooltipProps {
    active?: boolean;
    payload?: {
        payload: {
            time: number;
            count: number;
            trueCount: number;
        }
    }[];
    formatTrueCount: (count: number) => number;
}

const CustomTooltip = ({ active, payload, formatTrueCount }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;

    const data = payload[0]!.payload;
    const time = new Date(data.time).toLocaleTimeString();

    return (
        <div className="p-2 text-sm border rounded-md shadow-md bg-background/95 backdrop-blur-sm border-border">
            <p className="text-xs text-muted-foreground">{time}</p>
            <p className="font-medium">Running Count: {data.count}</p>
            <p className="font-medium">True Count: {formatTrueCount(data.trueCount)}</p>
        </div>
    );
};

export type CountingSystem = 'hi-lo' | 'ko' | 'omega-ii' | 'zen' | 'halves';

export interface CardCountValues {
    '2': number;
    '3': number;
    '4': number;
    '5': number;
    '6': number;
    '7': number;
    '8': number;
    '9': number;
    '10': number;
    'J': number;
    'Q': number;
    'K': number;
    'A': number;
}

export interface CountingDisplayProps {
    playedCards?: CardData[];
    deckCount?: number;
    autoCount?: boolean;
    showChart?: boolean;
    showCardValues?: boolean;
    showRecommendation?: boolean;
    showDeckEstimation?: boolean;
    className?: string;
    compact?: boolean;
    title?: string;
    description?: string;
    animated?: boolean;
    footer?: React.ReactNode;
    onRunningCountChange?: (count: number, trueCount: number) => void;
}

// Card count values for different systems
const countSystems: Record<CountingSystem, CardCountValues> = {
    'hi-lo': {
        '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
        '7': 0, '8': 0, '9': 0,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
    },
    'ko': {
        '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1,
        '8': 0, '9': 0,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
    },
    'omega-ii': {
        '2': 1, '3': 1, '4': 2, '5': 2, '6': 2,
        '7': 1, '8': 0, '9': -1,
        '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': 0
    },
    'zen': {
        '2': 1, '3': 1, '4': 2, '5': 2, '6': 2,
        '7': 1, '8': 0, '9': 0,
        '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': -1
    },
    'halves': {
        '2': 0.5, '3': 1, '4': 1, '5': 1.5, '6': 1,
        '7': 0.5, '8': 0, '9': -0.5,
        '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
    }
};

// System descriptions
const systemDescriptions: Record<CountingSystem, string> = {
    'hi-lo': 'High-Low is the most common counting system. 2-6 are +1, 7-9 are 0, and 10-A are -1.',
    'ko': 'Knock-Out (KO) is similar to Hi-Lo but counts 7 as +1, making it easier to learn.',
    'omega-ii': 'Omega II is a more complex system with higher card weights, providing greater accuracy.',
    'zen': 'Zen Count combines features of Hi-Lo and Omega II for balanced precision and usability.',
    'halves': 'Halves Count uses fractional values for greater precision but is more difficult to track.'
};

const CountingDisplay = ({
    playedCards = [],
    deckCount = 6,
    autoCount = true,
    showChart = true,
    showCardValues = true,
    showRecommendation = true,
    showDeckEstimation = true,
    className = '',
    compact = false,
    title = 'Card Counting',
    description = 'Track the running count and true count',
    animated = true,
    footer,
    onRunningCountChange,
}: CountingDisplayProps) => {
    const [countingSystem, setCountingSystem] = useState<CountingSystem>('hi-lo');
    const [runningCount, setRunningCount] = useState<number>(0);
    const [countHistory, setCountHistory] = useState<{ time: number; count: number; trueCount: number }[]>([
        { time: Date.now(), count: 0, trueCount: 0 }
    ]);
    const [manualMode, setManualMode] = useState<boolean>(!autoCount);
    const lastProcessedCardIndex = useRef<number>(-1);

    // Calculate remaining decks approximately
    const cardsPerDeck = 52;
    const totalCards = deckCount * cardsPerDeck;
    const playedCardCount = playedCards.length;
    const remainingDecks = Math.max(1, deckCount - (playedCardCount / cardsPerDeck));

    // Calculate percentage of cards played
    const percentagePlayed = (playedCardCount / totalCards) * 100;

    // Calculate true count (running count divided by remaining decks)
    const trueCount = remainingDecks > 0 ? runningCount / remainingDecks : runningCount;

    // Auto-counting from played cards
    useEffect(() => {
        if (!autoCount || manualMode) return;

        // Reset count when new game starts (when played cards go to zero)
        if (playedCards.length === 0) {
            setRunningCount(0);
            setCountHistory([{ time: Date.now(), count: 0, trueCount: 0 }]);
            lastProcessedCardIndex.current = -1;
            return;
        }

        // Only process new cards that haven't been counted yet
        if (playedCards.length > 0 && lastProcessedCardIndex.current < playedCards.length - 1) {
            // Get the new cards since last update
            const newCards = playedCards.slice(lastProcessedCardIndex.current + 1);

            setRunningCount(prev => {
                let newCount = prev;

                // Process each new card
                newCards.forEach(card => {
                    const cardValue = countSystems[countingSystem][card.rank as keyof CardCountValues] || 0;
                    newCount += cardValue;
                });

                // Update history once after processing all new cards
                const newTrueCount = remainingDecks > 0 ? newCount / remainingDecks : newCount;
                setCountHistory(prev => [...prev, {
                    time: Date.now(),
                    count: newCount,
                    trueCount: newTrueCount
                }]);

                // Notify parent only once
                onRunningCountChange?.(newCount, newTrueCount);

                return newCount;
            });

            // Update the last processed card index
            lastProcessedCardIndex.current = playedCards.length - 1;
        }
    }, [playedCards, countingSystem, autoCount, manualMode, onRunningCountChange, remainingDecks]);

    // Reset count
    const handleReset = () => {
        setRunningCount(0);
        setCountHistory([{ time: Date.now(), count: 0, trueCount: 0 }]);
        onRunningCountChange?.(0, 0);
    };

    // Increment/Decrement count manually
    const handleIncrement = (value: number) => {
        setRunningCount(prev => {
            const newCount = prev + value;

            // Update history (limit history to prevent memory issues)
            const newTrueCount = remainingDecks > 0 ? newCount / remainingDecks : newCount;
            setCountHistory(prev => {
                const newHistory = [...prev, {
                    time: Date.now(),
                    count: newCount,
                    trueCount: newTrueCount
                }];

                // Keep only the last 100 points to avoid performance issues
                if (newHistory.length > 100) {
                    return newHistory.slice(-100);
                }

                return newHistory;
            });

            // Notify parent
            onRunningCountChange?.(newCount, newTrueCount);

            return newCount;
        });
    };

    // Get betting recommendation based on true count
    const getBettingRecommendation = () => {
        if (trueCount <= 0) return { text: 'Minimum bet', color: 'text-gray-500' };
        if (trueCount <= 1) return { text: 'Minimum bet', color: 'text-gray-500' };
        if (trueCount <= 2) return { text: 'Double minimum bet', color: 'text-green-500' };
        if (trueCount <= 3) return { text: 'Double to triple minimum', color: 'text-green-600' };
        if (trueCount <= 4) return { text: 'Triple to quadruple minimum', color: 'text-emerald-500' };
        return { text: 'Maximum bet', color: 'text-emerald-600' };
    };

    // Get count color based on value
    const getCountColor = (count: number) => {
        if (count > 5) return 'text-emerald-500';
        if (count > 3) return 'text-green-500';
        if (count > 0) return 'text-green-400';
        if (count === 0) return 'text-gray-400';
        if (count > -3) return 'text-red-400';
        if (count > -5) return 'text-red-500';
        return 'text-red-600';
    };

    // Format true count for display
    const formatTrueCount = (count: number) => {
        return Number(count.toFixed(1));
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                staggerChildren: 0.05
            }
        }
    };

    // Custom tooltip for the chart
    const CardComponent = animated ? motion.div : 'div';

    return (
        <Card
            className={className}
            {...(animated ? {
                as: CardComponent,
                variants: containerVariants,
                initial: "hidden",
                animate: "visible"
            } : {})}
        >
            <CardHeader className={compact ? 'p-3' : 'p-4'}>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                        <CardTitle className={compact ? 'text-base' : 'text-lg'}>{title}</CardTitle>
                        {!compact && <CardDescription>{description}</CardDescription>}
                    </div>

                    <Tabs
                        value={countingSystem}
                        onValueChange={(value) => setCountingSystem(value as CountingSystem)}
                        className="w-auto mt-2 sm:mt-0"
                    >
                        <TabsList className={cn("h-8", compact ? 'grid grid-cols-2' : 'grid grid-cols-3')}>
                            <TabsTrigger value="hi-lo" className="px-2 py-1 text-xs">Hi-Lo</TabsTrigger>
                            <TabsTrigger value="ko" className="px-2 py-1 text-xs">KO</TabsTrigger>
                            {!compact && <TabsTrigger value="zen" className="px-2 py-1 text-xs">Zen</TabsTrigger>}
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>

            <CardContent className={compact ? 'px-3 pb-3 space-y-3' : 'px-4 pb-4 space-y-4'}>
                {/* Count Display */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5">
                    <div>
                        <p className="text-xs text-muted-foreground">Running Count</p>
                        <p className={cn("text-2xl font-bold", getCountColor(runningCount))}>
                            {runningCount > 0 ? `+${runningCount}` : runningCount}
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">True Count</p>
                        <p className={cn("text-2xl font-bold", getCountColor(trueCount))}>
                            {trueCount > 0 ? `+${formatTrueCount(trueCount)}` : formatTrueCount(trueCount)}
                        </p>
                    </div>
                </div>

                {/* Manual Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIncrement(-1)}
                        className="flex-1"
                    >
                        <Minus className="w-4 h-4 mr-1" /> -1
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="px-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIncrement(1)}
                        className="flex-1"
                    >
                        <Plus className="w-4 h-4 mr-1" /> +1
                    </Button>
                </div>

                {/* Mode Switch */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Counting Mode:</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setManualMode(prev => !prev)}
                        className="px-2 h-7"
                    >
                        {manualMode ? "Manual" : "Auto"}
                    </Button>
                </div>

                {/* Chart */}
                {showChart && countHistory.length > 1 && (
                    <div className="w-full h-32 mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={countHistory.slice(-20)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                                <defs>
                                    <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTrue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" hide={true} />
                                <YAxis />
                                <Tooltip content={<CustomTooltip formatTrueCount={formatTrueCount} />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    fillOpacity={1}
                                    fill="url(#colorRunning)"
                                    name="Running Count"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="trueCount"
                                    stroke="#6366f1"
                                    fillOpacity={1}
                                    fill="url(#colorTrue)"
                                    name="True Count"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Betting Recommendation */}
                {showRecommendation && (
                    <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Recommended Bet:</p>
                            <p className={cn("text-sm font-bold", getBettingRecommendation().color)}>
                                {getBettingRecommendation().text}
                            </p>
                        </div>
                    </div>
                )}

                {/* Deck Estimation */}
                {showDeckEstimation && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Approx. Decks Remaining:</span>
                            <span className="font-medium">{remainingDecks.toFixed(1)}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Cards Played: {playedCardCount}/{totalCards}</span>
                                <span>{percentagePlayed.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-1 overflow-hidden rounded-full bg-muted/30">
                                <motion.div
                                    className="h-full origin-left bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(percentagePlayed, 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Card Values */}
                {showCardValues && (
                    <div className="mt-2">
                        <div className="flex items-center mb-1">
                            <Info className="w-3 h-3 mr-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Card Values ({countingSystem.toUpperCase()})</p>
                        </div>
                        <div className="grid grid-cols-6 gap-1 text-xs text-center">
                            {Object.entries(countSystems[countingSystem]).map(([card, value]) => {
                                const getCardClass = () => {
                                    if (value > 0) return "border-green-500/30 bg-green-500/10";
                                    if (value < 0) return "border-red-500/30 bg-red-500/10";
                                    return "border-gray-500/30 bg-gray-500/10";
                                };

                                return (
                                    <div
                                        key={card}
                                        className={cn(
                                            "rounded border p-1",
                                            getCardClass()
                                        )}
                                    >
                                        <span className="font-medium">{card}</span>
                                        <span className="ml-1">{value > 0 ? `+${value}` : value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* System Description */}
                {!compact && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {systemDescriptions[countingSystem]}
                    </p>
                )}
            </CardContent>

            {footer && (
                <CardFooter className={compact ? 'px-3 pb-3' : 'px-4 pb-4'}>
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
};

export default CountingDisplay;