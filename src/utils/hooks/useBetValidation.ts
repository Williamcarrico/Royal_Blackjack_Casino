'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ValidationError } from '@/types/utilTypes';
import type { BetSlice } from '@/types/storeTypes';

interface UseBetValidationProps {
    minBet?: number;
    maxBet?: number;
    balance?: number;
}

/**
 * Hook for validating bets with custom or default constraints
 *
 * @param props - Configuration options for bet validation
 * @returns Object with validation functions
 */
export function useBetValidation(props?: UseBetValidationProps) {
    // Get global validation methods from store as fallback
    const storeCanPlace = useGameStore((state: BetSlice) => state.canPlace);
    const storeValidate = useGameStore((state: BetSlice) => state.validate);

    // Extract props with defaults
    const {
        minBet: customMinBet,
        maxBet: customMaxBet,
        balance: customBalance
    } = props || {};

    /**
     * Check if a bet amount can be placed based on constraints
     *
     * @param amount - The bet amount to check
     * @returns Whether the bet can be placed
     */
    const canPlaceBet = useCallback((amount: number): boolean => {
        // If using custom constraints, validate locally
        if (customMinBet !== undefined || customMaxBet !== undefined || customBalance !== undefined) {
            const minBet = customMinBet ?? 5; // Default min bet
            const maxBet = customMaxBet ?? 10000; // Default max bet

            // Check bet limits
            if (amount < minBet || amount > maxBet) {
                return false;
            }

            // Check balance if provided
            if (customBalance !== undefined && amount > customBalance) {
                return false;
            }

            return true;
        }

        // Otherwise use store validation
        return storeCanPlace(amount);
    }, [customMinBet, customMaxBet, customBalance, storeCanPlace]);

    /**
     * Validate bet amount and return detailed error information
     *
     * @param amount - The bet amount to validate
     * @returns Validation error or null if valid
     */
    const validateBet = useCallback((amount: number): ValidationError | null => {
        // If using custom constraints, validate locally
        if (customMinBet !== undefined || customMaxBet !== undefined || customBalance !== undefined) {
            const minBet = customMinBet ?? 5; // Default min bet
            const maxBet = customMaxBet ?? 10000; // Default max bet

            // Check minimum bet
            if (amount < minBet) {
                return {
                    field: 'amount',
                    message: `Bet must be at least $${minBet}`,
                    code: 'MIN_BET'
                };
            }

            // Check maximum bet
            if (amount > maxBet) {
                return {
                    field: 'amount',
                    message: `Bet cannot exceed $${maxBet}`,
                    code: 'MAX_BET'
                };
            }

            // Check balance if provided
            if (customBalance !== undefined && amount > customBalance) {
                return {
                    field: 'amount',
                    message: 'Insufficient balance',
                    code: 'INSUFFICIENT_BALANCE'
                };
            }

            return null;
        }

        // Otherwise use store validation
        return storeValidate(amount);
    }, [customMinBet, customMaxBet, customBalance, storeValidate]);

    return {
        canPlaceBet,
        validateBet
    };
}

export default useBetValidation;