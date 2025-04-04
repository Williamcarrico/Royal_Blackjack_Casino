'use client';

import React, { useState, useEffect } from 'react';
import useGameStore from '@/store/gameStore';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle, CheckCircle, InfoIcon } from 'lucide-react';
import { GameStore } from '@/types/storeTypes';

// Extended GameStore interface with additional properties used in this component
interface ExtendedGameStore extends GameStore {
    gamePhase: string;
    activePlayerHandId: string | null;
    dealerHandId: string | null;
    entities: {
        hands: Record<string, {
            cards: string[];
            value: number;
            isSoft: boolean;
            status: string;
        }>;
        cards: Record<string, {
            suit: string;
            rank: string;
            value: number;
        }>;
    };
    trueCount: number;
    hit: () => void;
    stand: () => void;
    doubleDown: () => void;
    split: () => void;
    surrender: () => void;
}

interface AutoStrategyPlayerProps {
    className?: string;
}

// Map of action types to display text & icons
const actionDisplay = {
    hit: { text: 'Hit', color: 'text-blue-400' },
    stand: { text: 'Stand', color: 'text-green-400' },
    double: { text: 'Double', color: 'text-purple-400' },
    split: { text: 'Split', color: 'text-amber-400' },
    surrender: { text: 'Surrender', color: 'text-red-400' }
};

const AutoStrategyPlayer: React.FC<AutoStrategyPlayerProps> = ({ className = '' }) => {
    const gameStore = useGameStore() as unknown as ExtendedGameStore;
    const settings = useEnhancedSettingsStore();

    // Auto strategy state
    const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
    const [recommendedAction, setRecommendedAction] = useState<string | null>(null);
    const [reasoning, setReasoning] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(0);
    const [isActive, setIsActive] = useState<boolean>(false);

    // Add property for basic strategy auto-play
    const autoPlayBasicStrategy = settings.showBasicStrategy;

    // Early return check moved after hooks
    const isGameStoreInitialized = gameStore?.gamePhase;

    // Set the recommended action based on game state
    useEffect(() => {
        if (!isGameStoreInitialized || gameStore.gamePhase !== 'playerTurn' || !gameStore.entities) {
            setRecommendedAction(null);
            setReasoning('');
            setIsActive(false);
            return undefined;
        }

        // Make sure entities.hands exists before using it
        if (!gameStore.entities.hands) {
            setRecommendedAction(null);
            setReasoning('');
            setIsActive(false);
            return undefined;
        }

        setIsActive(true);

        // Get player's active hand and dealer's up card
        const playerHand = gameStore.activePlayerHandId && gameStore.entities.hands
            ? gameStore.entities.hands[gameStore.activePlayerHandId]
            : null;

        const dealerHand = gameStore.dealerHandId && gameStore.entities.hands
            ? gameStore.entities.hands[gameStore.dealerHandId]
            : null;

        if (!playerHand || !dealerHand || dealerHand.cards.length === 0) {
            return undefined;
        }

        const dealerUpCardId = dealerHand.cards[0];
        const dealerUpCard = gameStore.entities?.cards && dealerUpCardId
            ? gameStore.entities.cards[dealerUpCardId]
            : null;

        if (!dealerUpCard) {
            return undefined;
        }

        // Get player's hand value
        const playerCards = playerHand.cards.map((id: string) =>
            gameStore.entities.cards && id ? gameStore.entities.cards[id] : null
        ).filter(Boolean);

        const playerValue = playerHand.value;
        const isSoft = playerHand.isSoft;
        const isPair = playerCards.length === 2 &&
            playerCards[0]?.rank === playerCards[1]?.rank;

        // Basic strategy logic
        let action = '';
        let reason = '';

        // For pairs
        if (isPair) {
            const pairRank = playerCards[0]?.rank ?? '';
            const dealerRank = dealerUpCard?.rank ?? '';

            if (['A', 'a'].includes(pairRank)) {
                action = 'split';
                reason = 'Always split Aces';
                setConfidence(1.0);
            } else if (['8', '8'].includes(pairRank)) {
                action = 'split';
                reason = 'Always split 8s';
                setConfidence(0.95);
            } else if (['9', '9'].includes(pairRank)) {
                action = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(dealerRank) ? 'stand' : 'split';
                reason = 'Split 9s against dealer 2-6, 8-9. Stand against 7, T, A';
                setConfidence(0.9);
            } else if (['7', '7'].includes(pairRank)) {
                action = ['8', '9', '10', 'J', 'Q', 'K', 'A'].includes(dealerRank) ? 'hit' : 'split';
                reason = 'Split 7s against dealer 2-7. Hit against 8+';
                setConfidence(0.85);
            } else if (['6', '6'].includes(pairRank)) {
                action = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(dealerRank) ? 'hit' : 'split';
                reason = 'Split 6s against dealer 2-6. Hit against 7+';
                setConfidence(0.85);
            } else if (['5', '5'].includes(pairRank)) {
                action = ['10', 'J', 'Q', 'K', 'A'].includes(dealerRank) ? 'hit' : 'double';
                reason = 'Never split 5s. Double against 2-9, hit against T, A';
                setConfidence(0.9);
            } else if (['4', '4'].includes(pairRank)) {
                action = ['5', '6'].includes(dealerRank) ? 'split' : 'hit';
                reason = 'Split 4s only against dealer 5-6. Otherwise hit';
                setConfidence(0.8);
            } else if (['3', '3'].includes(pairRank) || ['2', '2'].includes(pairRank)) {
                action = ['8', '9', '10', 'J', 'Q', 'K', 'A'].includes(dealerRank) ? 'hit' : 'split';
                reason = `Split ${pairRank}s against dealer 2-7. Hit against 8+`;
                setConfidence(0.85);
            }
        }
        // For soft hands (with Ace)
        else if (isSoft) {
            const dealerRank = dealerUpCard?.rank ?? '';

            if (playerValue >= 19) {
                action = 'stand';
                reason = 'Stand on soft 19 or higher';
                setConfidence(0.95);
            } else if (playerValue === 18) {
                if (['2', '3', '4', '5', '6'].includes(dealerRank)) {
                    action = 'double';
                    reason = 'Double on soft 18 against dealer 2-6';
                    setConfidence(0.85);
                } else if (['7', '8'].includes(dealerRank)) {
                    action = 'stand';
                    reason = 'Stand on soft 18 against dealer 7-8';
                    setConfidence(0.8);
                } else {
                    action = 'hit';
                    reason = 'Hit on soft 18 against dealer 9, T, A';
                    setConfidence(0.8);
                }
            } else if (playerValue === 17) {
                if (['3', '4', '5', '6'].includes(dealerRank)) {
                    action = 'double';
                    reason = 'Double on soft 17 against dealer 3-6';
                    setConfidence(0.8);
                } else {
                    action = 'hit';
                    reason = 'Hit on soft 17 against other dealer cards';
                    setConfidence(0.85);
                }
            } else if (playerValue === 16 || playerValue === 15) {
                if (['4', '5', '6'].includes(dealerRank)) {
                    action = 'double';
                    reason = `Double on soft ${playerValue} against dealer 4-6`;
                    setConfidence(0.8);
                } else {
                    action = 'hit';
                    reason = `Hit on soft ${playerValue} against other dealer cards`;
                    setConfidence(0.85);
                }
            } else if (playerValue === 14 || playerValue === 13) {
                if (['5', '6'].includes(dealerRank)) {
                    action = 'double';
                    reason = `Double on soft ${playerValue} against dealer 5-6`;
                    setConfidence(0.75);
                } else {
                    action = 'hit';
                    reason = `Hit on soft ${playerValue} against other dealer cards`;
                    setConfidence(0.9);
                }
            }
        }
        // For hard totals
        else {
            const dealerRank = dealerUpCard?.rank ?? '';

            if (playerValue >= 17) {
                action = 'stand';
                reason = 'Stand on hard 17 or higher';
                setConfidence(0.95);
            } else if (playerValue === 16) {
                if (['2', '3', '4', '5', '6'].includes(dealerRank)) {
                    action = 'stand';
                    reason = 'Stand on hard 16 against dealer 2-6';
                    setConfidence(0.85);
                } else if (['7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(dealerRank)) {
                    action = 'hit';
                    reason = 'Hit on hard 16 against dealer 7+';
                    setConfidence(0.8);
                }
            } else if (playerValue === 15) {
                if (['2', '3', '4', '5', '6'].includes(dealerRank)) {
                    action = 'stand';
                    reason = 'Stand on hard 15 against dealer 2-6';
                    setConfidence(0.8);
                } else {
                    action = 'hit';
                    reason = 'Hit on hard 15 against dealer 7+';
                    setConfidence(0.85);
                }
            } else if (playerValue === 13 || playerValue === 14) {
                if (['2', '3', '4', '5', '6'].includes(dealerRank)) {
                    action = 'stand';
                    reason = `Stand on hard ${playerValue} against dealer 2-6`;
                    setConfidence(0.85);
                } else {
                    action = 'hit';
                    reason = `Hit on hard ${playerValue} against dealer 7+`;
                    setConfidence(0.85);
                }
            } else if (playerValue === 12) {
                if (['4', '5', '6'].includes(dealerRank)) {
                    action = 'stand';
                    reason = 'Stand on hard 12 against dealer 4-6';
                    setConfidence(0.75);
                } else {
                    action = 'hit';
                    reason = 'Hit on hard 12 against dealer 2-3, 7+';
                    setConfidence(0.8);
                }
            } else if (playerValue === 11) {
                action = 'double';
                reason = 'Always double on hard 11';
                setConfidence(0.95);
            } else if (playerValue === 10) {
                if (['10', 'J', 'Q', 'K', 'A'].includes(dealerRank)) {
                    action = 'hit';
                    reason = 'Hit on hard 10 against dealer T-A';
                    setConfidence(0.8);
                } else {
                    action = 'double';
                    reason = 'Double on hard 10 against dealer 2-9';
                    setConfidence(0.9);
                }
            } else if (playerValue === 9) {
                if (['3', '4', '5', '6'].includes(dealerRank)) {
                    action = 'double';
                    reason = 'Double on hard 9 against dealer 3-6';
                    setConfidence(0.8);
                } else {
                    action = 'hit';
                    reason = 'Hit on hard 9 against dealer 2, 7+';
                    setConfidence(0.85);
                }
            } else {
                action = 'hit';
                reason = 'Always hit on hard 8 or lower';
                setConfidence(0.95);
            }
        }

        // Apply the count adjustment if card counting is enabled
        if (settings.countingSystem !== 'none' && gameStore.trueCount > 1.5) {
            if (playerValue === 16 && dealerUpCard?.rank === '10') {
                action = 'stand';
                reason = 'Stand on 16 vs 10 with high count';
                setConfidence(0.7);
            } else if (playerValue === 15 && dealerUpCard?.rank === '10') {
                action = 'stand';
                reason = 'Stand on 15 vs 10 with high count';
                setConfidence(0.65);
            }
        }

        // Set the recommended action
        setRecommendedAction(action);
        setReasoning(reason);

        // Auto-play if enabled
        if (autoPlayEnabled && autoPlayBasicStrategy && action && gameStore.entities?.hands) {
            const timeout = setTimeout(() => {
                switch (action) {
                    case 'hit':
                        if (gameStore.hit) gameStore.hit();
                        break;
                    case 'stand':
                        if (gameStore.stand) gameStore.stand();
                        break;
                    case 'double':
                        if (gameStore.doubleDown) gameStore.doubleDown();
                        break;
                    case 'split':
                        if (gameStore.split) gameStore.split();
                        break;
                    case 'surrender':
                        if (gameStore.surrender) gameStore.surrender();
                        break;
                }
            }, 800);

            return () => clearTimeout(timeout);
        }

        return undefined;
    }, [gameStore.gamePhase, gameStore.activePlayerHandId, gameStore.dealerHandId, gameStore.entities, gameStore.entities?.hands, gameStore.entities?.cards, gameStore.trueCount, autoPlayEnabled, autoPlayBasicStrategy, settings.countingSystem, isGameStoreInitialized, gameStore.hit, gameStore.stand, gameStore.doubleDown, gameStore.split, gameStore.surrender, gameStore]);

    // Toggle auto-play mode
    const toggleAutoPlay = () => {
        setAutoPlayEnabled(!autoPlayEnabled);
    };

    // If no recommendation is available, show a simple state
    if (!isActive || !recommendedAction) {
        return (
            <div className={`p-4 border rounded-lg bg-black/30 backdrop-blur-sm border-slate-700 ${className}`}>
                <div className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-amber-400" />
                    <h3 className="text-base font-medium">Strategy Advisor</h3>
                </div>
                <div className="flex items-center justify-between mt-3">
                    <p className="text-sm text-gray-300">
                        {getPhaseMessage(gameStore.gamePhase)}
                    </p>
                </div>
            </div>
        );
    }

    // If game store is not initialized, return early
    if (!isGameStoreInitialized) {
        return null;
    }

    return (
        <div className={className}>
            <Card className="border bg-black/30 backdrop-blur-sm border-slate-700">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-amber-400" />
                            <h3 className="text-base font-medium">Strategy Advisor</h3>
                        </div>

                        <div className="flex items-center">
                            <Switch
                                id="auto-play"
                                checked={autoPlayEnabled}
                                onCheckedChange={toggleAutoPlay}
                                aria-label="Auto-play strategy"
                            />
                            <Label htmlFor="auto-play" className="ml-2 text-sm">
                                Auto-play
                            </Label>
                        </div>
                    </div>

                    <div className="p-3 mb-3 border rounded bg-black/20 border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">Recommended action:</span>
                            <Badge
                                variant="outline"
                                className={`${actionDisplay[recommendedAction as keyof typeof actionDisplay]?.color} border-current`}
                            >
                                {actionDisplay[recommendedAction as keyof typeof actionDisplay]?.text || recommendedAction}
                            </Badge>
                        </div>

                        <div className="flex items-center mt-2 text-xs">
                            <InfoIcon className="w-3.5 h-3.5 mr-1 text-blue-400" />
                            <span className="text-gray-300">{reasoning}</span>
                        </div>

                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Confidence:</span>
                                <span className="text-xs text-gray-400">{Math.round(confidence * 100)}%</span>
                            </div>
                            <div
                                className="h-1.5 bg-gray-700 rounded-full overflow-hidden"
                                data-confidence={`${confidence * 100}%`}
                            >
                                {(() => {
                                    let confidenceColor = 'bg-red-500';
                                    if (confidence > 0.85) confidenceColor = 'bg-green-500';
                                    else if (confidence > 0.7) confidenceColor = 'bg-blue-500';
                                    else if (confidence > 0.6) confidenceColor = 'bg-amber-500';

                                    return (
                                        <div
                                            className={`h-full ${confidenceColor} confidence-bar`}
                                        />
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {Object.entries(actionDisplay).map(([action, display]) => {
                            // Extract the conditional class logic into a variable
                            const buttonClassName = action === recommendedAction
                                ? `bg-opacity-90 ${display.color.replace('text-', 'bg-').replace('-400', '-600')}`
                                : 'bg-black/40 border-slate-600';

                            return (
                                <Button
                                    key={action}
                                    variant={action === recommendedAction ? 'default' : 'outline'}
                                    onClick={() => {
                                        // Maps actions to game store functions
                                        switch (action) {
                                            case 'hit':
                                                if (gameStore.hit) gameStore.hit();
                                                break;
                                            case 'stand':
                                                if (gameStore.stand) gameStore.stand();
                                                break;
                                            case 'double':
                                                if (gameStore.doubleDown) gameStore.doubleDown();
                                                break;
                                            case 'split':
                                                if (gameStore.split) gameStore.split();
                                                break;
                                            case 'surrender':
                                                if (gameStore.surrender) gameStore.surrender();
                                                break;
                                        }
                                    }}
                                    className={buttonClassName}
                                >
                                    {action === recommendedAction && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                                    {display.text}
                                </Button>
                            );
                        })}
                    </div>

                    {autoPlayEnabled && autoPlayBasicStrategy && (
                        <div className="flex items-center mt-3 text-xs text-amber-300">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            <span>Auto-play enabled! Strategy will be applied automatically</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

// Helper function to get message based on game phase
const getPhaseMessage = (phase: string): string => {
    switch (phase) {
        case 'betting':
            return 'Place your bet to start the game';
        case 'dealing':
            return 'Dealing cards...';
        case 'dealerTurn':
            return 'Dealer is playing...';
        case 'settlement':
            return 'Round complete!';
        default:
            return 'Waiting for active play';
    }
};

export { AutoStrategyPlayer };