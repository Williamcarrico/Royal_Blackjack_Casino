'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import Hand from '../hand/Hand';
import BettingCircle from '../../betting/BettingCircle';
import { ChipValue } from '../../betting/Chip';
import { PlayerData } from './BlackjackTable';

export interface PlayerPositionProps {
    player: PlayerData;
    isCurrentPlayer?: boolean;
    gamePhase: 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
    activeHandId?: string;
    className?: string;
    onBetChange?: (amount: number) => void;
    enableChips?: boolean;
}

const PlayerPosition = ({
    player,
    isCurrentPlayer = false,
    gamePhase,
    activeHandId,
    className = '',
    onBetChange,
    enableChips = true,
}: PlayerPositionProps) => {
    // Map bet amount to chip representations
    const mapBetToChips = (bet: number): Array<{ value: ChipValue; count: number }> => {
        if (bet === 0) return [];

        // Available chip values
        const chipValues: ChipValue[] = [1000, 500, 100, 25, 5, 1];
        let remainingBet = bet;
        const chips: Array<{ value: ChipValue; count: number }> = [];

        // Distribute bet amount among chips
        for (const value of chipValues) {
            if (remainingBet >= value) {
                const count = Math.floor(remainingBet / value);
                chips.push({ value, count });
                remainingBet -= count * value;
            }
        }

        return chips;
    };

    // Handle betting circle click for bet removal
    const handleBetRemove = () => {
        onBetChange?.(0);
    };

    // Show bet animations based on game phase
    const showPayoutAnimation = gamePhase === 'payout';

    // Disabled state for betting
    const bettingDisabled = gamePhase !== 'betting' || !isCurrentPlayer;

    // Calculate styles for active player
    const playerHighlight = isCurrentPlayer
        ? 'ring-2 ring-primary ring-offset-1 ring-offset-black'
        : '';

    return (
        <motion.div
            className={cn(
                'flex flex-col items-center gap-1',
                'p-2 rounded-lg',
                playerHighlight,
                isCurrentPlayer ? 'bg-black/20' : 'bg-black/10',
                className
            )}
            animate={isCurrentPlayer ? { scale: 1.03 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Player's hands */}
            <div className="flex flex-wrap justify-center gap-4">
                {(player.hands || []).map((hand) => {
                    // Check if this hand is active
                    const isActiveHand = isCurrentPlayer && hand.id === activeHandId;

                    // Determine hand outcome
                    const isWinner = hand.result === 'win' || hand.result === 'blackjack';
                    const isLoser = hand.result === 'lose';
                    const isPush = hand.result === 'push';

                    return (
                        <div key={hand.id} className="relative">
                            {/* Betting circle */}
                            <div className="mb-3">
                                <BettingCircle
                                    betAmount={hand.bet}
                                    placedChips={enableChips ? (hand.betChips || mapBetToChips(hand.bet)) : []}
                                    active={isActiveHand}
                                    disabled={bettingDisabled}
                                    winner={isWinner}
                                    loser={isLoser}
                                    push={isPush}
                                    allowRemoval={gamePhase === 'betting' && isCurrentPlayer}
                                    onBetRemoved={handleBetRemove}
                                    showPayoutAnimation={showPayoutAnimation}
                                    payoutMultiplier={hand.result === 'blackjack' ? 1.5 : 1}
                                />
                            </div>

                            {/* Hand display */}
                            <Hand
                                cards={hand.cards}
                                handId={hand.id}
                                isActive={isActiveHand}
                                isWinner={isWinner}
                                isLoser={isLoser}
                                isPush={isPush}
                                showValue={true}
                                animate={gamePhase === 'dealing'}
                                compact={player.hands && player.hands.length > 1}
                            />

                            {/* Insurance indicator */}
                            {hand.insurance && hand.insurance > 0 && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-0.5 rounded-full">
                                    Insurance: ${hand.insurance}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Player info */}
            <div className="mt-2 text-center">
                <div className="font-medium text-white">{player.name}</div>
                <div className="text-sm text-white/80">
                    ${(player.balance ?? 0).toLocaleString()}
                </div>
            </div>
        </motion.div>
    );
};

export default PlayerPosition;