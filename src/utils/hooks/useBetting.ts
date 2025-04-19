'use client';

/**
 * Hook for managing betting functionality in Blackjack
 */
import { useCallback, useMemo, useState, useEffect } from 'react';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import createBetSlice from '../../store/slices/betSlice';
import {
    Bet,
    SideBet,
    TableLimits,
    BettingStrategyType
} from '../../types/betTypes';
import type { ChipValue } from '@types/uiTypes';
import {
    getBettingStrategy,
    getAvailableStrategies
} from '../../domains/betting/bettingStrategies';

// Bet slice store
const useBetStore = create(createBetSlice);

// Define store types
interface BetStore {
    bets: Bet[];
    currentBet: number | null;
    minBet: number;
    maxBet: number;
    tableLimits: TableLimits | null;
    bettingStrategy: { type: BettingStrategyType } | null;
    progressiveBetting: boolean;
    placeBet: (playerId: string, amount: number) => Bet;
    placeSideBet: (playerId: string, handId: string, type: string, amount: number) => SideBet;
    updateBet: (type: string, value: number) => void;
    removeBet: (betId: string) => void;
    clearBets: () => void;
    settleBet: (betId: string, result: string) => number;
    calculateNextBet: () => number;
}

/**
 * Hook for managing betting operations
 */
export function useBetting(initialTableLimits?: TableLimits) {
    const {
        bets,
        currentBet,
        minBet,
        maxBet,
        tableLimits,
        bettingStrategy,
        progressiveBetting,
        placeBet,
        placeSideBet,
        updateBet,
        removeBet,
        clearBets,
        settleBet,
        calculateNextBet
    } = useBetStore() as BetStore;

    const [activeChips, setActiveChips] = useState<ChipValue[]>([]);
    const [selectedStrategy, setSelectedStrategy] = useState<BettingStrategyType | null>(
        bettingStrategy?.type || null
    );

    // Sync local strategy state with store strategy
    useEffect(() => {
        if (bettingStrategy && bettingStrategy.type !== selectedStrategy) {
            setSelectedStrategy(bettingStrategy.type);
        }
    }, [bettingStrategy, selectedStrategy]);

    /**
     * Generate a unique bet ID
     */
    const generateBetId = useCallback((): string => {
        return uuidv4();
    }, []);

    /**
     * Available chip values based on table limits
     */
    const availableChips = useMemo((): ChipValue[] => {
        const limits = tableLimits || initialTableLimits || { minimumBet: 5, maximumBet: 500 };

        // Standard chip values
        const allChips: ChipValue[] = [1, 5, 10, 20, 25, 50, 100, 500, 1000];

        // Filter chips based on table limits
        return allChips.filter(chip => chip <= limits.maximumBet);
    }, [tableLimits, initialTableLimits]);

    /**
     * Set custom table limits
     */
    const setTableLimits = useCallback((limits: TableLimits): void => {
        // Use updateBet to update table limits in store with the provided limits
        updateBet('table-limits', limits.minimumBet);
    }, [updateBet]);

    /**
     * Add chips to the current bet
     */
    const addChips = useCallback((value: ChipValue, count: number = 1): void => {
        setActiveChips(prev => {
            const newChips = [...prev];

            for (let i = 0; i < count; i++) {
                newChips.push(value);
            }

            return newChips;
        });
    }, []);

    /**
     * Remove chips from the current bet
     */
    const removeChips = useCallback((value: ChipValue, count: number = 1): void => {
        setActiveChips(prev => {
            const newChips = [...prev];
            let removed = 0;

            // Remove 'count' instances of the chip value
            for (let i = newChips.length - 1; i >= 0 && removed < count; i--) {
                if (newChips[i] === value) {
                    newChips.splice(i, 1);
                    removed++;
                }
            }

            return newChips;
        });
    }, []);

    /**
     * Clear all active chips
     */
    const clearChips = useCallback((): void => {
        setActiveChips([]);
    }, []);

    /**
     * Calculate the total value of active chips
     */
    const activeBetAmount = useMemo((): number => {
        return activeChips.reduce((sum, chip) => sum + chip, 0);
    }, [activeChips]);

    /**
     * Check if the current bet is valid
     */
    const isValidBet = useMemo((): boolean => {
        const limits = tableLimits || initialTableLimits || { minimumBet: 5, maximumBet: 500 };

        return activeBetAmount >= limits.minimumBet && activeBetAmount <= limits.maximumBet;
    }, [activeBetAmount, tableLimits, initialTableLimits]);

    /**
     * Place a bet with the current active chips
     */
    const placeActiveBet = useCallback((playerId: string): Bet | null => {
        if (!isValidBet) {
            return null;
        }

        // Place the bet
        const bet = placeBet(playerId, activeBetAmount);

        // Clear active chips after placing bet
        clearChips();

        return bet;
    }, [isValidBet, activeBetAmount, placeBet, clearChips]);

    /**
     * Place a side bet
     */
    const placeActiveSideBet = useCallback((
        playerId: string,
        handId: string,
        type: string
    ): SideBet | null => {
        if (!isValidBet) {
            return null;
        }

        // Place the side bet
        const sideBet = placeSideBet(playerId, handId, type, activeBetAmount) as SideBet;

        // Clear active chips after placing bet
        clearChips();

        return sideBet;
    }, [isValidBet, activeBetAmount, placeSideBet, clearChips]);

    /**
     * Remove a specific bet by ID
     */
    const removeActiveBet = useCallback((betId: string): void => {
        removeBet(betId);
    }, [removeBet]);

    /**
     * Clear all bets for the current session
     */
    const clearAllBets = useCallback((): void => {
        clearBets();
        clearChips();
    }, [clearBets, clearChips]);

    /**
     * Set a specific bet amount (useful for buttons like "Bet Max")
     */
    const setBetAmount = useCallback((amount: number): void => {
        const limits = tableLimits || initialTableLimits || { minimumBet: 5, maximumBet: 500 };

        // Ensure amount is within limits
        const validAmount = Math.max(limits.minimumBet, Math.min(amount, limits.maximumBet));

        // Clear current chips
        clearChips();

        // Calculate optimal chip distribution for this amount
        const sortedChips = [...availableChips].sort((a, b) => b - a);
        let remaining = validAmount;

        // Greedy algorithm to represent amount with fewest chips
        for (const chipValue of sortedChips) {
            while (remaining >= chipValue) {
                addChips(chipValue);
                remaining -= chipValue;
            }
        }
    }, [tableLimits, initialTableLimits, clearChips, availableChips, addChips]);

    /**
     * Double the current bet
     */
    const doubleBet = useCallback((): void => {
        setBetAmount(activeBetAmount * 2);
    }, [activeBetAmount, setBetAmount]);

    /**
     * Halve the current bet
     */
    const halveBet = useCallback((): void => {
        setBetAmount(Math.floor(activeBetAmount / 2));
    }, [activeBetAmount, setBetAmount]);

    /**
     * Set bet to table minimum
     */
    const betMin = useCallback((): void => {
        const limits = tableLimits || initialTableLimits || { minimumBet: 5, maximumBet: 500 };
        setBetAmount(limits.minimumBet);
    }, [tableLimits, initialTableLimits, setBetAmount]);

    /**
     * Set bet to table maximum
     */
    const betMax = useCallback((): void => {
        const limits = tableLimits || initialTableLimits || { minimumBet: 5, maximumBet: 500 };
        setBetAmount(limits.maximumBet);
    }, [tableLimits, initialTableLimits, setBetAmount]);

    /**
     * Set the current betting strategy
     */
    const setStrategy = useCallback((strategyType: BettingStrategyType | null): void => {
        setSelectedStrategy(strategyType);

        // Update the store with the new strategy
        if (strategyType) {
            // Use updateBet as a way to update the betting strategy in the store
            updateBet('strategy', 1); // Using 1 to indicate strategy is active
        } else {
            // Clear strategy
            updateBet('strategy', 0);
        }
    }, [updateBet]);

    /**
     * Enable progressive betting
     */
    const enableProgressiveBetting = useCallback((enabled: boolean): void => {
        // Use updateBet as a way to update the progressive betting settings in the store
        updateBet('progressive', enabled ? 1 : 0);
    }, [updateBet]);

    /**
     * Get the next recommended bet based on betting strategy
     */
    const getNextBet = useCallback((): number => {
        return calculateNextBet();
    }, [calculateNextBet]);

    /**
     * Get the current strategy recommendation based on selectedStrategy
     */
    const getCurrentStrategyRecommendation = useCallback((): string | null => {
        if (!selectedStrategy) return null;

        const strategy = getBettingStrategy(selectedStrategy);
        return strategy ? `${strategy.type} - ${strategy.description}` : null;
    }, [selectedStrategy]);

    /**
     * Settle a bet and return the payout
     */
    const settle = useCallback((betId: string, result: string): number => {
        return settleBet(betId, result);
    }, [settleBet]);

    /**
     * Get all available betting strategies
     */
    const availableStrategies = useMemo(() => {
        return getAvailableStrategies();
    }, []);

    /**
     * Calculate win/loss statistics for current betting session
     */
    const getBettingStats = useMemo(() => {
        const totalBets = bets.length;
        const wins = bets.filter((bet: Bet) => bet.status === 'won').length;
        const losses = bets.filter((bet: Bet) => bet.status === 'lost').length;
        const pushes = bets.filter((bet: Bet) => bet.status === 'push').length;
        const winRate = totalBets > 0 ? wins / totalBets : 0;

        const totalWagered = bets.reduce((sum: number, bet: Bet) => sum + bet.amount, 0);
        const totalWon = bets.reduce((sum: number, bet: Bet) => {
            if (bet.status === 'won' && bet.payout) {
                return sum + bet.payout;
            }
            return sum;
        }, 0);

        const netProfit = totalWon - totalWagered;

        return {
            totalBets,
            wins,
            losses,
            pushes,
            winRate,
            totalWagered,
            totalWon,
            netProfit
        };
    }, [bets]);

    return {
        // State
        bets,
        currentBet: currentBet || activeBetAmount,
        activeChips,
        availableChips,
        tableLimits: tableLimits || initialTableLimits,
        minBet,
        maxBet,
        bettingStrategy: bettingStrategy || null,
        progressiveBetting,
        isValidBet,
        selectedStrategy,

        // Actions
        addChips,
        removeChips,
        clearChips,
        setBetAmount,
        placeActiveBet,
        placeActiveSideBet,
        removeActiveBet,
        clearAllBets,
        doubleBet,
        halveBet,
        betMin,
        betMax,
        setTableLimits,
        setStrategy,
        enableProgressiveBetting,
        getNextBet,
        settle,
        generateBetId,
        getCurrentStrategyRecommendation,

        // Information
        availableStrategies,
        getBettingStats
    };
}

export default useBetting;