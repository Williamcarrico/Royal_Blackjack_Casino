/**
 * PlayerPosition Component
 *
 * Renders a player's position on the blackjack table, including their hands,
 * betting circles, and player information.
 *
 * @component
 */
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

/**
 * PlayerPosition displays a player's area on the blackjack table
 * It includes hands, betting circles, and player info such as name and balance
 */
const PlayerPosition = ({
    player,
    isCurrentPlayer = false,
    gamePhase,
    activeHandId,
    className = '',
    onBetChange,
    enableChips = true,
}: PlayerPositionProps) => {
    /**
     * Maps the bet amount to chip representations of different denominations
     *
     * @param {number} bet - The total bet amount to convert to chips
     * @returns {Array<{value: ChipValue; count: number}>} Array of chip values and counts
     */
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

    /**
     * Handles bet removal when betting circle is clicked
     */
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
                'flex flex-col items-center gap-2',
                'p-3 rounded-lg',
                playerHighlight,
                isCurrentPlayer ? 'bg-black/30' : 'bg-black/15',
                isCurrentPlayer && 'scale-105',
                className
            )}
            animate={isCurrentPlayer ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Player's hands with proper spacing */}
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
                            {/* Betting circle with corrected positioning */}
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
                                    className="z-30"
                                />
                            </div>

                            {/* Hand display with improved spacing */}
                            <div className="mt-1 z-20">
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
                            </div>

                            {/* Insurance indicator with proper z-index */}
                            {hand.insurance && hand.insurance > 0 && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-0.5 rounded-full z-40">
                                    Insurance: ${hand.insurance}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Player info - enhanced with background for better visibility */}
            <div className="px-3 py-1 mt-3 text-center rounded-md bg-black/40 z-10">
                <div className="font-medium text-white">{player.name || 'Player'}</div>
                <div className="text-sm text-amber-300">
                    ${(typeof player.balance === 'number' ? player.balance : 0).toLocaleString()}
                </div>
            </div>
        </motion.div>
    );
};

export default PlayerPosition;