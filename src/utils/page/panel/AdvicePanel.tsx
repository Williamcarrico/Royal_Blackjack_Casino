'use client';

import * as React from 'react';
import type { UIGamePhase } from '@/components/game/BlackjackGameTable';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BellRing, ChevronDown, ChevronUp, Clock, ExternalLink, Eye, EyeOff, LightbulbIcon, PieChart, Settings2, ThumbsUp } from 'lucide-react';
import { CardData } from '../game/hand/Hand';
import { getUIPhaseMessage } from '@/utils/phase-mapping';
import { cn } from '@/lib/utils';
export type GameAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance' | 'none';
export type AdviceMode = 'basic' | 'advanced' | 'counting' | 'perfect';
export type CardTypeCount = Record<string, number>;

export interface AdviceDetails {
    action: GameAction;
    confidence: number;
    explanation: string;
    countFactor?: boolean;
    mathematicalEdge?: number;
    alternativeActions?: Array<{
        action: GameAction;
        edge: number;
    }>;
}

export interface AdvicePanelProps {
    playerCards?: CardData[];
    dealerUpcard?: CardData | null;
    playerScore?: number;
    dealerScore?: number;
    canSplit?: boolean;
    canDouble?: boolean;
    canSurrender?: boolean;
    isInsuranceAvailable?: boolean;
    gamePhase?: UIGamePhase;
    remainingCards?: CardTypeCount;
    trueCount?: number;
    hintMode?: AdviceMode;
    useRealTimeAdvice?: boolean;
    showConfidence?: boolean;
    showExplanation?: boolean;
    showMathDetails?: boolean;
    showAlternatives?: boolean;
    className?: string;
    compact?: boolean;
    animated?: boolean;
    condensed?: boolean;
    onActionClick?: (action: GameAction) => void;
    showSettings?: boolean;
}

const AdvicePanel = ({
    playerCards = [],
    dealerUpcard = null,
    playerScore = 0,
    dealerScore = 0,
    canSplit = false,
    canDouble = false,
    canSurrender = false,
    isInsuranceAvailable = false,
    gamePhase = 'betting',
    remainingCards = {},
    trueCount = 0,
    hintMode = 'basic',
    useRealTimeAdvice = true,
    showConfidence = true,
    showExplanation = true,
    showMathDetails = false,
    showAlternatives = false,
    className = '',
    compact = false,
    animated = true,
    condensed = false,
    onActionClick,
    showSettings = true,
}: AdvicePanelProps) => {
    const [localMode, setLocalMode] = useState<AdviceMode>(hintMode);
    const [showAdviceDetails, setShowAdviceDetails] = useState<boolean>(!compact);
    const [tabValue, setTabValue] = useState<string>('advice');

    // Update local mode when prop changes
    useEffect(() => {
        setLocalMode(hintMode);
    }, [hintMode]);

    // Determine if we have enough cards to give advice
    const canGiveAdvice = playerCards.length > 0 && dealerUpcard && (gamePhase === 'player-turn' || gamePhase === 'dealer-turn');

    // Determine if current hand has a pair
    const hasPair = playerCards.length === 2 && playerCards[0] && playerCards[1] && playerCards[0].rank === playerCards[1].rank;

    // Determine if current hand is soft (contains an Ace counted as 11)
    const hasSoftHand = playerCards.some(card => card.rank === 'A') && playerScore <= 21;

    // Calculate if the deck is rich in high cards (useful for card counting advice)
    const isHighCardRich = (): boolean => {
        if (!remainingCards || Object.keys(remainingCards).length === 0) return false;

        const highCards = ['10', 'J', 'Q', 'K', 'A'];

        const highCardCount = highCards.reduce((sum, card) => sum + (remainingCards[card] ?? 0), 0);

        // Calculate ratio of high to low cards
        const totalCards = Object.values(remainingCards).reduce((a, b) => a + b, 0);
        const highCardRatio = highCardCount / totalCards;

        return highCardRatio > 0.38; // Threshold indicating richness in high cards
    };

    // Helper function to get dealer card value
    const getDealerValue = (): number => {
        if (!dealerUpcard) return 0;

        if (dealerUpcard.rank === 'A') return 11;
        if (dealerUpcard.rank === 'K' || dealerUpcard.rank === 'Q' || dealerUpcard.rank === 'J') return 10;
        return parseInt(dealerUpcard.rank);
    };

    // Phase-specific advice
    const getPhaseAdvice = (): AdviceDetails | null => {
        if (gamePhase === 'betting') {
            return {
                action: 'none',
                confidence: 60,
                explanation: 'Place your bet according to your betting strategy.',
                countFactor: localMode === 'counting',
                mathematicalEdge: localMode === 'counting' && trueCount > 2 ? 0.01 * trueCount : -0.005
            };
        }

        if (gamePhase === 'dealing') {
            return {
                action: 'none',
                confidence: 70,
                explanation: 'Waiting for cards to be dealt...'
            };
        }

        if (gamePhase === 'payout') {
            return {
                action: 'none',
                confidence: 70,
                explanation: 'Hand complete. Prepare for next round.'
            };
        }

        return null;
    };

    // Insurance decision
    const getInsuranceAdvice = (): AdviceDetails | null => {
        if (!isInsuranceAvailable) return null;

        // Enhanced counting advice using remainingCards
        if (localMode === 'counting' && remainingCards?.['A']) {
            const totalCards = Object.values(remainingCards).reduce((a, b) => a + b, 0);
            const aceRatio = remainingCards['A'] / totalCards;
            const adjustedCount = trueCount + (aceRatio > 0.077 ? 1 : 0); // Adjust count if aces are abundant

            if (adjustedCount > 3) {
                return {
                    action: 'insurance',
                    confidence: 80,
                    explanation: 'Take insurance with favorable deck composition',
                    countFactor: true,
                    mathematicalEdge: ((adjustedCount * 2.5) - 6) / 100
                };
            }
        }

        // Otherwise don't take insurance
        return {
            action: 'none',
            confidence: 90,
            explanation: 'Never take insurance - house edge is too high',
            mathematicalEdge: -0.07
        };
    };

    // Dealer turn decision
    const getDealerTurnAdvice = (): AdviceDetails | null => {
        if (gamePhase !== 'dealer-turn' || dealerScore <= 0) return null;

        // If dealer has 17+, they will stand
        if (dealerScore >= 17) {
            if (playerScore > dealerScore) {
                return {
                    action: 'none',
                    confidence: 95,
                    explanation: `Dealer will stand with ${dealerScore}. You'll win with ${playerScore}.`,
                    mathematicalEdge: 1.0
                };
            } else if (playerScore === dealerScore) {
                return {
                    action: 'none',
                    confidence: 95,
                    explanation: `Push with dealer. Both have ${playerScore}.`,
                    mathematicalEdge: 0
                };
            } else {
                return {
                    action: 'none',
                    confidence: 95,
                    explanation: `Dealer will stand with ${dealerScore}. You'll lose with ${playerScore}.`,
                    mathematicalEdge: -1.0
                };
            }
        }

        // Dealer must hit until 17+
        let bustProbability = 0;

        if (Object.keys(remainingCards).length > 0) {
            const totalCards = Object.values(remainingCards).reduce((a, b) => a + b, 0);
            const bustingCards = Object.entries(remainingCards)
                .filter(([card]) => {
                    let cardValue;
                    if (card === 'A') {
                        cardValue = 11;
                    } else if (['K', 'Q', 'J', '10'].includes(card)) {
                        cardValue = 10;
                    } else {
                        cardValue = parseInt(card);
                    }
                    return (dealerScore + cardValue) > 21;
                })
                .reduce((sum, [, count]) => sum + count, 0);

            bustProbability = bustingCards / totalCards;
        }

        if (bustProbability > 0.5) {
            return {
                action: 'none',
                confidence: Math.round(bustProbability * 100),
                explanation: `Dealer has ${dealerScore} and is likely to bust.`,
                mathematicalEdge: bustProbability - 0.1
            };
        }

        return {
            action: 'none',
            confidence: Math.round((1 - bustProbability) * 100),
            explanation: `Dealer has ${dealerScore} and will likely improve.`,
            mathematicalEdge: (bustProbability * 0.8) - 0.4
        };
    };

    // Surrender decision
    const getSurrenderAdvice = (dealerValue: number): AdviceDetails | null => {
        if (!canSurrender || playerCards.length !== 2) return null;

        // 16 vs 9, 10, A
        if (playerScore === 16 && (dealerValue === 9 || dealerValue === 10 || dealerValue === 11)) {
            // Modify advice based on deck composition for counting strategy
            if (localMode === 'counting' && isHighCardRich() && dealerValue === 9) {
                return {
                    action: 'hit',
                    confidence: 60,
                    explanation: 'High cards remaining - try to hit instead of surrender',
                    countFactor: true,
                    mathematicalEdge: -0.01
                };
            }

            return {
                action: 'surrender',
                confidence: 85,
                explanation: 'Surrender 16 against dealer 9, 10, or Ace',
                mathematicalEdge: 0.02
            };
        }

        // 15 vs 10
        if (playerScore === 15 && dealerValue === 10) {
            return {
                action: 'surrender',
                confidence: 75,
                explanation: 'Surrender 15 against dealer 10',
                mathematicalEdge: 0.01,
                alternativeActions: [
                    { action: 'hit', edge: -0.01 }
                ]
            };
        }

        return null;
    };

    // Split decision
    const getSplitAdvice = (dealerValue: number): AdviceDetails | null => {
        if (!canSplit || !hasPair) return null;

        // Always split Aces and 8s
        if (playerCards[0]?.rank === 'A') {
            return {
                action: 'split',
                confidence: 100,
                explanation: 'Always split Aces',
                mathematicalEdge: 0.55
            };
        }

        if (playerCards[0]?.rank === '8') {
            return {
                action: 'split',
                confidence: 95,
                explanation: 'Always split 8s - avoid the 16',
                mathematicalEdge: 0.25,
            };
        }

        // Never split 10s, 5s, 4s
        if (['10', 'J', 'Q', 'K'].includes(playerCards[0]?.rank ?? '')) {
            return {
                action: 'stand',
                confidence: 100,
                explanation: 'Never split 10s - 20 is a strong hand',
                mathematicalEdge: 0.15,
                alternativeActions: [
                    { action: 'split', edge: -0.45 }
                ]
            };
        }

        if (playerCards[0]?.rank === '5') {
            return canDouble ? {
                action: 'double',
                confidence: 90,
                explanation: 'Double with 10 - better than splitting 5s',
                mathematicalEdge: 0.22
            } : {
                action: 'hit',
                confidence: 90,
                explanation: 'Hit with 10 - never split 5s',
                mathematicalEdge: 0.1
            };
        }

        if (playerCards[0]?.rank === '4' && ![5, 6].includes(dealerValue)) {
            return {
                action: 'hit',
                confidence: 85,
                explanation: 'Hit with pair of 4s unless dealer shows 5-6',
                mathematicalEdge: 0.08
            };
        }

        // Split 2s, 3s, 7s against dealer 2-7
        if (['2', '3', '7'].includes(playerCards[0]?.rank ?? '') && dealerValue >= 2 && dealerValue <= 7) {
            return {
                action: 'split',
                confidence: 80,
                explanation: `Split ${playerCards[0]?.rank}s against dealer ${dealerValue}`,
                mathematicalEdge: 0.12
            };
        }

        // Split 6s against dealer 2-6
        if (playerCards[0]?.rank === '6' && dealerValue >= 2 && dealerValue <= 6) {
            return {
                action: 'split',
                confidence: 85,
                explanation: 'Split 6s against dealer 2-6',
                mathematicalEdge: 0.15
            };
        }

        // Split 9s against all except 7, 10, A
        if (playerCards[0]?.rank === '9' && dealerValue !== 7 && dealerValue !== 10 && dealerValue !== 11) {
            return {
                action: 'split',
                confidence: 80,
                explanation: 'Split 9s except against 7, 10, or Ace',
                mathematicalEdge: 0.18
            };
        }

        return null;
    };

    // Soft hand decision
    const getSoftHandAdvice = (dealerValue: number): AdviceDetails | null => {
        if (!hasSoftHand) return null;

        // Soft 13-15 vs 4-6: Double if possible, otherwise hit
        if (playerScore >= 13 && playerScore <= 15 && dealerValue >= 4 && dealerValue <= 6) {
            return canDouble ? {
                action: 'double',
                confidence: 70,
                explanation: `Double soft ${playerScore} against dealer ${dealerValue}`,
                mathematicalEdge: 0.14
            } : {
                action: 'hit',
                confidence: 75,
                explanation: `Hit soft ${playerScore} (would double if allowed)`,
                mathematicalEdge: 0.08
            };
        }

        // Soft 16-18 vs 4-6: Double if possible, otherwise hit
        if (playerScore >= 16 && playerScore <= 18 && dealerValue >= 4 && dealerValue <= 6) {
            return canDouble ? {
                action: 'double',
                confidence: 85,
                explanation: `Double soft ${playerScore} against dealer ${dealerValue}`,
                mathematicalEdge: 0.2
            } : {
                action: 'hit',
                confidence: 70,
                explanation: `Hit soft ${playerScore} (would double if allowed)`,
                mathematicalEdge: 0.1
            };
        }

        // Soft 17 or less: Hit
        if (playerScore <= 17) {
            return {
                action: 'hit',
                confidence: 85,
                explanation: `Always hit soft ${playerScore}`,
                mathematicalEdge: 0.05
            };
        }

        // Soft 18: Stand against 2, 7, 8, otherwise hit
        if (playerScore === 18) {
            if (dealerValue === 2 || dealerValue === 7 || dealerValue === 8) {
                return {
                    action: 'stand',
                    confidence: 60,
                    explanation: 'Stand with soft 18 against dealer 2, 7, 8',
                    mathematicalEdge: 0.02,
                    alternativeActions: [
                        { action: 'hit', edge: 0.01 }
                    ]
                };
            } else if (dealerValue >= 9) {
                return {
                    action: 'hit',
                    confidence: 60,
                    explanation: 'Hit soft 18 against dealer 9, 10, Ace',
                    mathematicalEdge: 0.01
                };
            }
        }

        // Soft 19+: Stand
        if (playerScore >= 19) {
            return {
                action: 'stand',
                confidence: 95,
                explanation: `Stand with soft ${playerScore}`,
                mathematicalEdge: 0.22
            };
        }

        return null;
    };

    // Create a standard advice object to reduce repetition
    const createAdvice = (
        action: GameAction,
        confidence: number,
        explanation: string,
        mathematicalEdge: number,
        countFactor: boolean = false,
        alternativeActions?: Array<{ action: GameAction; edge: number }>
    ): AdviceDetails => ({
        action,
        confidence,
        explanation,
        mathematicalEdge,
        countFactor,
        ...(alternativeActions && { alternativeActions })
    });

    // Low score (8 or less) advice
    const getLowScoreAdvice = (playerScore: number): AdviceDetails => {
        return createAdvice(
            'hit',
            100,
            `Always hit ${playerScore} or less`,
            -0.15
        );
    };

    // Score 9 advice
    const getScore9Advice = (dealerValue: number): AdviceDetails => {
        if (dealerValue >= 3 && dealerValue <= 6) {
            return canDouble
                ? createAdvice('double', 80, 'Double 9 against dealer 3-6', 0.1)
                : createAdvice('hit', 80, 'Hit 9 (would double if allowed)', 0.05);
        }
        return createAdvice('hit', 80, `Hit 9 against dealer ${dealerValue}`, -0.1);
    };

    // Score 10 advice
    const getScore10Advice = (dealerValue: number): AdviceDetails => {
        if (dealerValue >= 2 && dealerValue <= 9) {
            return canDouble
                ? createAdvice('double', 95, 'Double 10 against dealer 2-9', 0.25)
                : createAdvice('hit', 90, 'Hit 10 (would double if allowed)', 0.12);
        }
        return createAdvice('hit', 85, `Hit 10 against dealer ${dealerValue}`, 0.05);
    };

    // Score 11 advice
    const getScore11Advice = (dealerValue: number): AdviceDetails => {
        // Special case for counting strategy
        if (localMode === 'counting' && dealerValue === 10 && trueCount < 1) {
            return createAdvice(
                'hit',
                70,
                'Hit against dealer 10 with low count',
                0.05,
                true
            );
        }

        if (dealerValue >= 2 && dealerValue <= 10) {
            return canDouble
                ? createAdvice('double', 100, 'Double 11 against dealer 2-10', 0.3)
                : createAdvice('hit', 95, 'Hit 11 (would double if allowed)', 0.15);
        }

        return createAdvice('hit', 90, `Hit 11 against dealer Ace`, 0.1);
    };

    // Score 12 advice
    const getScore12Advice = (dealerValue: number): AdviceDetails => {
        if (dealerValue >= 4 && dealerValue <= 6) {
            // Count dependent strategy
            if (localMode === 'counting' && dealerValue === 4 && trueCount < 0) {
                return createAdvice(
                    'hit',
                    60,
                    'Hit 12 against 4 with negative count',
                    0.02,
                    true
                );
            }
            return createAdvice('stand', 70, 'Stand with 12 against dealer 4-6', 0.04);
        }

        // Count dependent strategy
        if (localMode === 'counting' && dealerValue === 2 && trueCount > 3) {
            return createAdvice(
                'stand',
                60,
                'Stand with 12 against 2 with high count',
                0.03,
                true
            );
        }

        return createAdvice('hit', 75, 'Hit 12 against dealer 2-3, 7-A', -0.02);
    };

    // Score 13-16 advice
    const getScore13to16Advice = (playerScore: number, dealerValue: number): AdviceDetails => {
        if (dealerValue >= 2 && dealerValue <= 6) {
            // Count dependent strategy
            if (localMode === 'counting' && playerScore === 16 && dealerValue === 10 && trueCount > 0) {
                return createAdvice(
                    'stand',
                    60,
                    'Stand with 16 against 10 with positive count',
                    -0.01,
                    true
                );
            }
            return createAdvice(
                'stand',
                85,
                `Stand with ${playerScore} against dealer ${dealerValue}`,
                0.01
            );
        }

        return createAdvice(
            'hit',
            80,
            `Hit ${playerScore} against dealer ${dealerValue}`,
            -0.15
        );
    };

    // Score 17+ advice
    const getHighScoreAdvice = (playerScore: number): AdviceDetails => {
        return createAdvice(
            'stand',
            100,
            `Always stand with ${playerScore}`,
            playerScore >= 19 ? 0.35 : 0.2
        );
    };

    // Hard hand decision with reduced complexity
    const getHardHandAdvice = (dealerValue: number): AdviceDetails | null => {
        // Use early returns based on player score ranges
        if (playerScore <= 8) {
            return getLowScoreAdvice(playerScore);
        }

        if (playerScore === 9) {
            return getScore9Advice(dealerValue);
        }

        if (playerScore === 10) {
            return getScore10Advice(dealerValue);
        }

        if (playerScore === 11) {
            return getScore11Advice(dealerValue);
        }

        if (playerScore === 12) {
            return getScore12Advice(dealerValue);
        }

        if (playerScore >= 13 && playerScore <= 16) {
            return getScore13to16Advice(playerScore, dealerValue);
        }

        if (playerScore >= 17) {
            return getHighScoreAdvice(playerScore);
        }

        return null;
    };

    // Calculate advice based on current game state
    const calculateAdvice = (): AdviceDetails => {
        // Check for phase-specific advice
        const phaseAdvice = getPhaseAdvice();
        if (phaseAdvice) return phaseAdvice;

        // No advice possible without player cards and dealer upcard
        if (!canGiveAdvice) {
            return {
                action: 'none',
                confidence: 0,
                explanation: 'Waiting for cards to be dealt...'
            };
        }

        // Get dealer upcard value
        const dealerValue = getDealerValue();

        // Check for insurance
        if (isInsuranceAvailable) {
            const insuranceAdvice = getInsuranceAdvice();
            if (insuranceAdvice) return insuranceAdvice;
        }

        // Check for dealer turn advice
        const dealerTurnAdvice = getDealerTurnAdvice();
        if (dealerTurnAdvice) return dealerTurnAdvice;

        // Check for surrender
        const surrenderAdvice = getSurrenderAdvice(dealerValue);
        if (surrenderAdvice) return surrenderAdvice;

        // Check for split
        const splitAdvice = getSplitAdvice(dealerValue);
        if (splitAdvice) return splitAdvice;

        // Check for soft hand
        const softHandAdvice = getSoftHandAdvice(dealerValue);
        if (softHandAdvice) return softHandAdvice;

        // Check for hard hand
        const hardHandAdvice = getHardHandAdvice(dealerValue);
        if (hardHandAdvice) return hardHandAdvice;

        // Default fallback
        return {
            action: 'stand',
            confidence: 50,
            explanation: 'Uncertain situation - standing is safer',
            mathematicalEdge: 0
        };
    };

    // Get advice based on current state
    const advice: AdviceDetails = useRealTimeAdvice ? calculateAdvice() : {
        action: 'none',
        confidence: 0,
        explanation: 'Real-time advice disabled'
    };

    // Get action badge color
    const getActionBadgeColor = (action: GameAction) => {
        switch (action) {
            case 'hit': return 'bg-blue-500 hover:bg-blue-600';
            case 'stand': return 'bg-green-500 hover:bg-green-600';
            case 'double': return 'bg-purple-500 hover:bg-purple-600';
            case 'split': return 'bg-amber-500 hover:bg-amber-600';
            case 'surrender': return 'bg-red-500 hover:bg-red-600';
            case 'insurance': return 'bg-indigo-500 hover:bg-indigo-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    // Get action display text
    const getActionDisplayText = (action: GameAction) => {
        switch (action) {
            case 'hit': return 'Hit';
            case 'stand': return 'Stand';
            case 'double': return 'Double Down';
            case 'split': return 'Split';
            case 'surrender': return 'Surrender';
            case 'insurance': return 'Take Insurance';
            default: return 'Wait';
        }
    };

    // Get action icon
    const getActionIcon = (action: GameAction) => {
        switch (action) {
            case 'hit': return <ChevronUp className="w-4 h-4 mr-1" />;
            case 'stand': return <ChevronDown className="w-4 h-4 mr-1" />;
            case 'double': return <span className="mr-1 font-bold">2x</span>;
            case 'split': return <span className="mr-1 font-bold">▌▐</span>;
            case 'surrender': return <span className="mr-1 font-bold">½</span>;
            case 'insurance': return <span className="mr-1 font-bold">$</span>;
            default: return null;
        }
    };

    // Format percentage for display
    const formatPercentage = (value: number) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 15 }
        }
    };

    const CardComponent = animated ? motion.div : 'div';
    const ItemComponent = animated ? motion.div : 'div';

    // Helper function to return the strategy type display text
    const getStrategyTypeDisplay = (): string => {
        if (localMode === 'basic') return 'basic strategy';
        if (localMode === 'counting') return 'card counting';
        return 'perfect play';
    };

    // Get CSS class for edge value display
    const getEdgeValueClass = (edge: number): string => {
        if (edge > 0) return "text-green-500";
        if (edge < 0) return "text-red-500";
        return "";
    };

    // Render advice tab content
    const renderAdviceTab = () => {
        return (
            <>
                {/* Main Advice */}
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                    {!canGiveAdvice ? (
                        <div className="flex flex-col items-center justify-center py-2">
                            <LightbulbIcon className="w-8 h-8 mb-2 text-yellow-500 opacity-50" />
                            <p className="text-sm text-center text-muted-foreground">
                                Advice will appear here when cards are dealt.
                            </p>
                        </div>
                    ) : (
                        <div
                            className="flex flex-col"
                            {...(animated && {
                                as: ItemComponent,
                                variants: itemVariants
                            })}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Badge
                                    className={cn(
                                        "text-sm px-3 py-1 cursor-pointer",
                                        getActionBadgeColor(advice.action)
                                    )}
                                    onClick={() => onActionClick?.(advice.action)}
                                >
                                    {getActionIcon(advice.action)}
                                    {getActionDisplayText(advice.action)}
                                </Badge>

                                {showConfidence && advice.confidence > 0 && (
                                    <div className="flex items-center">
                                        <ThumbsUp className="w-3 h-3 mr-1 text-muted-foreground" />
                                        <span className="text-xs font-medium">{advice.confidence}% confidence</span>
                                    </div>
                                )}
                            </div>

                            {showExplanation && (
                                <p className="mb-2 text-sm">
                                    {advice.explanation}
                                    {advice.countFactor && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                            Count-dependent
                                        </Badge>
                                    )}
                                </p>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium">You: </span>
                                    <span>{playerScore}</span>
                                    {hasSoftHand && <span> (soft)</span>}
                                    {hasPair && <span> (pair)</span>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium">Dealer: </span>
                                    <span>{dealerUpcard?.rank || '?'}</span>
                                    {dealerScore > 0 && <span> ({dealerScore})</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Math Details - Only shown when expanded and enabled */}
                {renderMathDetails()}

                {/* Toggle Button */}
                {!compact && !showMathDetails && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={() => setShowAdviceDetails(!showAdviceDetails)}
                    >
                        {(() => {
                            const buttonIcon = showAdviceDetails ?
                                <EyeOff className="w-3 h-3 mr-1" /> :
                                <Eye className="w-3 h-3 mr-1" />;
                            const buttonText = showAdviceDetails ? 'Hide details' : 'Show details';

                            return (
                                <>
                                    {buttonIcon}
                                    {buttonText}
                                </>
                            );
                        })()}
                    </Button>
                )}
            </>
        );
    };

    // Render math details section
    const renderMathDetails = () => {
        if (!showAdviceDetails || !showMathDetails || advice.mathematicalEdge === undefined) {
            return null;
        }

        return (
            <div className="mt-3">
                <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0 py-0 mb-1 text-xs font-normal text-muted-foreground"
                    onClick={() => setShowAdviceDetails(!showAdviceDetails)}
                >
                    {(() => {
                        const buttonIcon = showAdviceDetails ?
                            <EyeOff className="w-3 h-3 mr-1" /> :
                            <Eye className="w-3 h-3 mr-1" />;
                        const buttonText = showAdviceDetails ? 'Hide details' : 'Show details';

                        return (
                            <>
                                {buttonIcon}
                                {buttonText}
                            </>
                        );
                    })()}
                </Button>

                <div className="p-2 text-xs rounded bg-black/5 dark:bg-white/5">
                    <div className="flex justify-between mb-1">
                        <span>Player edge:</span>
                        <span className={cn("font-medium", getEdgeValueClass(advice.mathematicalEdge))}>
                            {(() => {
                                const prefix = advice.mathematicalEdge > 0 ? '+' : '';
                                return `${prefix}${formatPercentage(advice.mathematicalEdge)}`;
                            })()}
                        </span>
                    </div>

                    {renderAlternativeActions()}
                </div>
            </div>
        );
    };

    // Render alternative actions section
    const renderAlternativeActions = () => {
        if (!showAlternatives || !advice.alternativeActions || advice.alternativeActions.length === 0) {
            return null;
        }

        return (
            <div className="pt-2 mt-2 border-t border-border/50">
                <p className="mb-1 text-muted-foreground">Alternative actions:</p>
                {advice.alternativeActions.map((alt) => (
                    <div key={`${alt.action}-${alt.edge}`} className="flex justify-between">
                        <Badge
                            variant="outline"
                            className="text-xs font-normal bg-transparent cursor-pointer"
                            onClick={() => onActionClick?.(alt.action)}
                        >
                            {getActionDisplayText(alt.action)}
                        </Badge>
                        <span className={cn("font-medium", getEdgeValueClass(alt.edge))}>
                            {(() => {
                                const prefix = alt.edge > 0 ? '+' : '';
                                return `${prefix}${formatPercentage(alt.edge)}`;
                            })()}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    // Render settings tab content
    const renderSettingsTab = () => {
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="adviceMode" className="text-sm">Advice Mode</Label>
                        <Tabs
                            value={localMode}
                            onValueChange={(value) => {
                                if (value === 'basic' || value === 'counting' || value === 'perfect') {
                                    setLocalMode(value);
                                }
                            }}
                            className="w-auto"
                        >
                            <TabsList className="h-7">
                                <TabsTrigger value="basic" className="px-2 py-0.5 text-xs">Basic</TabsTrigger>
                                <TabsTrigger value="counting" className="px-2 py-0.5 text-xs">Counting</TabsTrigger>
                                <TabsTrigger value="perfect" className="px-2 py-0.5 text-xs">Perfect</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {localMode === 'basic' && 'Basic strategy for beginners'}
                        {localMode === 'counting' && 'Includes count-dependent plays'}
                        {localMode === 'perfect' && 'Optimal play with composition-based strategy'}
                    </p>
                </div>

                <div className="space-y-3">
                    {renderSettingSwitch("realTimeAdvice", "Real-time Advice", useRealTimeAdvice)}
                    {renderSettingSwitch("showConfidence", "Show Confidence", showConfidence)}
                    {renderSettingSwitch("showMathDetails", "Math Details", showMathDetails)}
                    {renderSettingSwitch("showAlternatives", "Show Alternatives", showAlternatives)}
                </div>

                <div className="pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => window.open('https://www.blackjackapprenticeship.com/blackjack-strategy-charts/', '_blank')}
                    >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Full Strategy Charts
                    </Button>
                </div>
            </div>
        );
    };

    // Render a settings switch row
    const renderSettingSwitch = (id: string, label: string, checked: boolean) => {
        return (
            <div className="flex items-center justify-between">
                <Label htmlFor={id} className="text-sm">{label}</Label>
                <Switch
                    id={id}
                    checked={checked}
                    onCheckedChange={() => { }}
                />
            </div>
        );
    };

    // Render deck composition tab content
    const renderDeckTab = () => {
        return (
            <div className="space-y-4">
                <div>
                    <h3 className="mb-2 text-sm font-medium">Remaining Cards</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries(remainingCards).map(([card, count]) => (
                            <div key={card} className="flex items-center justify-between p-2 text-xs rounded bg-black/5 dark:bg-white/5">
                                <span>{card}</span>
                                <Badge variant="secondary">{count}</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {localMode === 'counting' && (
                    <div className="p-2 space-y-2 rounded bg-black/5 dark:bg-white/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs">True Count:</span>
                            <Badge variant={trueCount > 0 ? "secondary" : "destructive"}>{trueCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs">High/Low Ratio:</span>
                            <Badge variant={isHighCardRich() ? "secondary" : "default"}>
                                {isHighCardRich() ? 'High Card Rich' : 'Balanced'}
                            </Badge>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Helper function to render tab content based on tabValue with reduced complexity
    const renderTabContent = () => {
        if (tabValue === 'advice') {
            return renderAdviceTab();
        }

        if (tabValue === 'settings') {
            return renderSettingsTab();
        }

        // Default to deck tab
        return renderDeckTab();
    };

    // Compact design for small displays or widgets
    if (condensed) {
        return (
            <div className={cn("bg-background/80 backdrop-blur-sm border rounded-md p-2 flex items-center", className)}>
                {advice.action !== 'none' && (
                    <>
                        <Badge
                            className={cn("mr-2 cursor-pointer", getActionBadgeColor(advice.action))}
                            onClick={() => onActionClick?.(advice.action)}
                        >
                            {getActionIcon(advice.action)}
                            {getActionDisplayText(advice.action)}
                        </Badge>
                        <p className="text-xs">{advice.explanation}</p>
                    </>
                )}
                {advice.action === 'none' && (
                    <p className="text-xs text-muted-foreground">Waiting for cards...</p>
                )}
            </div>
        );
    }

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
                        <CardTitle className={compact ? 'text-base' : 'text-lg'}>Strategy Advice</CardTitle>
                        {!compact && <CardDescription>Get optimal play suggestions</CardDescription>}
                    </div>

                    {showSettings && (
                        <Tabs
                            value={tabValue}
                            onValueChange={setTabValue}
                            className="w-auto mt-2 sm:mt-0"
                        >
                            <TabsList className="h-8">
                                <TabsTrigger value="advice" className="px-2 py-1 text-xs">Advice</TabsTrigger>
                                <TabsTrigger value="settings" className="px-2 py-1 text-xs">
                                    <Settings2 className="w-3 h-3 mr-1" />
                                    Settings
                                </TabsTrigger>
                                {localMode === 'counting' && (
                                    <TabsTrigger value="deck" className="px-2 py-1 text-xs">
                                        <PieChart className="w-3 h-3 mr-1" />
                                        Deck
                                    </TabsTrigger>
                                )}
                            </TabsList>
                        </Tabs>
                    )}
                </div>
            </CardHeader>

            <CardContent className={compact ? 'px-3 pb-3 space-y-3' : 'px-4 pb-4'}>
                {renderTabContent()}
            </CardContent>

            {!compact && (
                <CardFooter className="flex items-center justify-between px-4 py-3 text-xs border-t bg-black/5 dark:bg-white/5 text-muted-foreground">
                    <div className="flex items-center">
                        <BellRing className="w-3 h-3 mr-2" />
                        <span>Advice based on {getStrategyTypeDisplay()}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-2" />
                        <span>{getUIPhaseMessage(gamePhase)}</span>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
};

export default AdvicePanel;