'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TableFelt from './TableFelt';
import BettingControls from '../../betting/BettingControls';
import ActionPanel, { GameActionState } from '../actions/ActionPanel';
import { GameAction } from '../actions/ActionButton';
import { ChipValue } from '../../betting/Chip';
import Hand, { CardData } from '../hand/Hand';
import MessageDisplay from '../status/MessageDisplay';
import HandOutcome, { OutcomeType } from '../hand/HandOutcome';

// Define type aliases for repeated union types
type GamePhase = 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
type HandResult = 'win' | 'lose' | 'push' | 'blackjack';
type DealerResult = 'win' | 'lose' | 'push';

export interface PlayerData {
    id: string;
    name: string;
    balance: number;
    hands: {
        id: string;
        cards: CardData[];
        bet: number;
        betChips: Array<{ value: ChipValue; count: number }>;
        isActive?: boolean;
        result?: HandResult;
        insurance?: number;
    }[];
}

export interface DealerData {
    cards: CardData[];
    isActive?: boolean;
    result?: DealerResult;
}

export interface BlackjackTableProps {
    players: PlayerData[];
    dealer: DealerData;
    currentPlayerId?: string;
    activeHandId?: string;
    gamePhase: GamePhase;
    minBet: number;
    maxBet: number;
    availableActions: Partial<GameActionState>;
    recommendedAction?: GameAction;
    message?: string;
    className?: string;
    darkMode?: boolean;
    onPlaceBet?: (playerId: string, bet: number) => void;
    onClearBet?: (playerId: string) => void;
    onAction?: (action: GameAction, playerId: string, handId: string) => void;
    onDealCards?: () => void;
    hideControls?: boolean;
    enableChips?: boolean;
    showBettingControls?: boolean;
}

// Integrated DealerPosition component (previously imported)
const DealerPosition: React.FC<{
    cards: CardData[];
    isActive?: boolean;
    gamePhase: GamePhase;
    result?: DealerResult;
}> = ({ cards, isActive = false, gamePhase, result }) => {
    // Automatically hide the hole card during certain game phases
    const shouldHideHoleCard = ['dealing', 'player-turn'].includes(gamePhase);

    // Calculate if the score is soft (contains an ace counted as 11)
    const calculateHandValues = (cards: CardData[]): number[] => {
        let values = [0];
        let aceCount = 0;

        cards.forEach(card => {
            if (card.rank === 'A') {
                aceCount++;
                values = values.map(v => v + 1);
            } else if (['K', 'Q', 'J'].includes(card.rank)) {
                values = values.map(v => v + 10);
            } else {
                values = values.map(v => v + parseInt(card.rank, 10));
            }
        });

        const results: number[] = [];

        for (const value of values) {
            results.push(value);

            for (let i = 0; i < aceCount; i++) {
                if (value + 10 <= 21) {
                    results.push(value + 10);
                }
            }
        }

        // Fix for Set iteration
        return Array.from(new Set(results)).sort((a, b) => a - b);
    };

    const getBestValue = (values: number[]): number => {
        const nonBustValues = values.filter(v => v <= 21);
        return nonBustValues.length > 0 ? Math.max(...nonBustValues) : Math.min(...values);
    };

    const handValues = calculateHandValues(cards);
    const score = getBestValue(handValues);
    const isSoft = cards.some(card => card.rank === 'A') && score <= 21 && handValues.length > 1;
    const isBlackjack = score === 21 && cards.length === 2;

    // Animation for dealer's turn
    const dealerActiveVariants = {
        inactive: { scale: 1 },
        active: {
            scale: 1.05,
            transition: { duration: 0.3 }
        }
    };

    // Format outcome for display
    const formatOutcome = (result?: DealerResult): OutcomeType => {
        if (!result) return null;
        if (result === 'win') return 'win';
        if (result === 'lose') return 'lose';
        if (result === 'push') return 'push';
        return null;
    };

    return (
        <div className="relative dealer-position">
            <motion.div
                variants={dealerActiveVariants}
                initial="inactive"
                animate={isActive ? "active" : "inactive"}
                className="relative"
            >
                <Hand
                    cards={cards}
                    isDealer={true}
                    isActive={isActive}
                    isWinner={result === 'win' || (isBlackjack && !shouldHideHoleCard)}
                    isLoser={result === 'lose'}
                    isPush={result === 'push'}
                    showValue={true}
                    hideSecondCard={shouldHideHoleCard}
                    animate={gamePhase === 'dealing'}
                    handType="dealer"
                    className={cn("dealer-hand", isBlackjack && !shouldHideHoleCard && "dealer-blackjack")}
                />
            </motion.div>

            {/* Show dealer status during dealer's turn */}
            {isActive && gamePhase === 'dealer-turn' && (
                <div className="absolute mb-1 transform -translate-x-1/2 -translate-y-full -top-2 left-1/2">
                    <div className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse">
                        Dealer&apos;s turn {!shouldHideHoleCard && `(${isSoft ? 'Soft' : 'Hard'} ${score})`}
                    </div>
                </div>
            )}

            {/* Show outcome at the end of the game */}
            {result && ['payout', 'game-over'].includes(gamePhase) && (
                <div className="absolute mb-1 transform -translate-x-1/2 -translate-y-full -top-2 left-1/2">
                    <HandOutcome
                        outcome={formatOutcome(result)}
                        size="sm"
                        animated={true}
                        delay={0.5}
                    />
                </div>
            )}
        </div>
    );
};

// Integrated PlayerPosition component (previously imported)
const PlayerPosition: React.FC<{
    player: PlayerData;
    isCurrentPlayer: boolean;
    gamePhase: GamePhase;
    activeHandId?: string;
    onBetChange?: (amount: number) => void;
    enableChips?: boolean;
}> = ({
    player,
    isCurrentPlayer,
    gamePhase,
    activeHandId,
    onBetChange,
    enableChips = true
}) => {
        // Animation variants
        const spotVariants = {
            initial: { opacity: 0, y: 20 },
            animate: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5 }
            },
            exit: {
                opacity: 0,
                y: 20,
                transition: { duration: 0.3 }
            }
        };

        return (
            <motion.div
                key={player.id}
                variants={spotVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                    "player-position relative flex flex-col items-center",
                    isCurrentPlayer && "current-player"
                )}
            >
                {/* Player hands container */}
                <div className="flex space-x-2 player-hands">
                    {player.hands.map((hand) => {
                        const isActiveHand = isCurrentPlayer && hand.id === activeHandId;

                        return (
                            <div key={hand.id} className="relative player-hand">
                                {/* Hand component */}
                                <Hand
                                    cards={hand.cards}
                                    handId={hand.id}
                                    isActive={isActiveHand}
                                    isWinner={hand.result === 'win' || hand.result === 'blackjack'}
                                    isLoser={hand.result === 'lose'}
                                    isPush={hand.result === 'push'}
                                    showValue={true}
                                    animate={gamePhase === 'dealing'}
                                    handType="player"
                                />

                                {/* Bet display */}
                                {hand.bet > 0 && (
                                    <div className="absolute bottom-0 z-10 transform -translate-x-1/2 translate-y-3 left-1/2">
                                        <div className="relative flex items-center justify-center">
                                            {/* Bet chips stack */}
                                            <div className="relative chips-stack">
                                                {hand.betChips?.map((chipStack, idx) => {
                                                    // Extract chip color logic to avoid nested ternaries
                                                    let chipColorClass = '';
                                                    if (chipStack.value === 1) {
                                                        chipColorClass = 'from-gray-400 to-gray-600';
                                                    } else if (chipStack.value === 5) {
                                                        chipColorClass = 'from-red-400 to-red-600';
                                                    } else if (chipStack.value === 25) {
                                                        chipColorClass = 'from-green-400 to-green-600';
                                                    } else if (chipStack.value === 100) {
                                                        chipColorClass = 'from-blue-400 to-blue-600';
                                                    } else if (chipStack.value === 500) {
                                                        chipColorClass = 'from-purple-400 to-purple-600';
                                                    } else {
                                                        chipColorClass = 'from-amber-400 to-amber-600';
                                                    }

                                                    return (
                                                        <div
                                                            key={`${chipStack.value}-${idx}`}
                                                            className={`absolute chip-image chip-stack-item-${idx} ${idx % 2 === 0 ? 'chip-stack-even' : 'chip-stack-odd'}`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br shadow-md flex items-center justify-center text-white font-bold text-xs ${chipColorClass}`}>
                                                                ${chipStack.value}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Bet amount label */}
                                            <div className="px-2 py-1 mt-2 text-xs font-medium text-white rounded-full bet-label bg-black/60">
                                                ${hand.bet}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Hand outcome */}
                                {hand.result && ['payout', 'game-over'].includes(gamePhase) && (
                                    <div className="absolute top-0 transform -translate-x-1/2 -translate-y-4 left-1/2">
                                        <HandOutcome
                                            outcome={hand.result}
                                            amount={hand.bet}
                                            size="sm"
                                        />
                                    </div>
                                )}

                                {/* Active hand indicator */}
                                {isActiveHand && gamePhase === 'player-turn' && (
                                    <div className="absolute transform -translate-x-1/2 -translate-y-full -top-2 left-1/2">
                                        <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse">
                                            Your turn
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Player info */}
                <div className="mt-12 text-center player-info">
                    <div className="mb-1 text-sm font-medium text-white player-name">
                        {player.name}
                    </div>
                    <div className="player-balance text-xs bg-black/40 text-amber-300 px-2 py-0.5 rounded-full">
                        ${player.balance.toLocaleString()}
                    </div>
                </div>
            </motion.div>
        );
    };

const BlackjackTable = ({
    players = [],
    dealer,
    currentPlayerId,
    activeHandId,
    gamePhase,
    minBet,
    maxBet,
    availableActions,
    recommendedAction,
    message,
    className = '',
    darkMode = true,
    onPlaceBet,
    onClearBet,
    onAction,
    onDealCards,
    hideControls = false,
    enableChips = true,
    showBettingControls = true,
}: BlackjackTableProps) => {
    const [showMessage, setShowMessage] = useState(!!message);

    // Update message visibility when message changes
    useEffect(() => {
        if (message) {
            setShowMessage(true);
            const timer = setTimeout(() => {
                setShowMessage(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
        return undefined; // Explicitly return undefined for the falsy path
    }, [message]);

    // Find current player
    const currentPlayer = players?.find(player => player.id === currentPlayerId);

    // Find active hand of current player
    const activeHand = currentPlayer?.hands.find(hand => hand.id === activeHandId);

    // Handle action callback
    const handleAction = (action: GameAction) => {
        if (gamePhase === 'betting' && action === 'deal') {
            onDealCards?.();
            return;
        }

        if (currentPlayerId && activeHandId) {
            onAction?.(action, currentPlayerId, activeHandId);
        }
    };

    // Handle bet placement
    const handlePlaceBet = (bet: number) => {
        if (currentPlayerId) {
            onPlaceBet?.(currentPlayerId, bet);
        }
    };

    // Handle clearing bet
    const handleClearBet = () => {
        if (currentPlayerId) {
            onClearBet?.(currentPlayerId);
        }
    };

    // Determine if we should show betting controls
    const shouldShowBettingControls = showBettingControls && gamePhase === 'betting' && currentPlayer;

    // Determine if we should show action controls
    const shouldShowActionControls = !hideControls && ['player-turn', 'dealer-turn', 'payout'].includes(gamePhase);

    // Table layout variants
    const tableVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { duration: 0.5 }
        },
        exit: { opacity: 0 }
    };

    return (
        <motion.div
            className={cn(
                'relative w-full max-w-6xl mx-auto overflow-hidden',
                'rounded-3xl shadow-2xl',
                darkMode ? 'bg-green-900' : 'bg-green-700',
                className
            )}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={tableVariants}
        >
            {/* Table felt background */}
            <TableFelt darkMode={darkMode}>
                {/* Dealer position - with proper z-index for layering */}
                <div className="absolute z-20 transform -translate-x-1/2 top-24 left-1/2">
                    <DealerPosition
                        cards={dealer.cards}
                        isActive={dealer.isActive}
                        gamePhase={gamePhase}
                        result={dealer.result}
                    />
                </div>

                {/* Player positions - increased z-index for proper layer stacking */}
                <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center gap-8 px-4 pb-36 md:pb-28">
                    {(players || []).map((player) => (
                        <PlayerPosition
                            key={player.id}
                            player={player}
                            isCurrentPlayer={player.id === currentPlayerId}
                            gamePhase={gamePhase}
                            activeHandId={activeHandId}
                            onBetChange={onPlaceBet ? (amount) => onPlaceBet(player.id, amount) : undefined}
                            enableChips={enableChips}
                        />
                    ))}
                </div>

                {/* Message display - highest z-index to appear above all elements */}
                <AnimatePresence>
                    {showMessage && message && (
                        <div className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                            <MessageDisplay message={message} />
                        </div>
                    )}
                </AnimatePresence>
            </TableFelt>

            {/* Controls area - improved z-index for controls layer */}
            <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-4 p-4 pt-16 bg-gradient-to-t from-black/50 to-transparent">
                {/* Betting controls */}
                {shouldShowBettingControls && currentPlayer && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="betting-controls"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="w-full max-w-lg"
                        >
                            <BettingControls
                                balance={currentPlayer.balance}
                                minBet={minBet}
                                maxBet={maxBet}
                                currentBet={currentPlayer?.hands?.[0]?.bet ?? 0}
                                onPlaceBet={handlePlaceBet}
                                onClearBet={handleClearBet}
                                autoConfirm={false}
                                availableChips={[1, 5, 25, 100, 500, 1000]}
                            />
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Action controls */}
                {shouldShowActionControls && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="action-controls"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="w-full max-w-lg"
                        >
                            <ActionPanel
                                availableActions={availableActions}
                                recommendedAction={recommendedAction}
                                onAction={handleAction}
                                player={currentPlayerId}
                                handId={activeHandId}
                                animateEntry={true}
                                activeHandData={activeHand}
                            />
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
};

export default BlackjackTable;