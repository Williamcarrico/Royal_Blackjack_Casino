/**
 * BettingControls Component
 *
 * Provides the UI for placing, clearing, doubling and confirming bets in a blackjack game.
 * Handles chip selection, validation, and betting actions with proper constraints.
 *
 * @component
 */
'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Chip, { ChipValue } from './Chip';

// Define default chip values if not exported from Chip component
const DEFAULT_CHIP_VALUES: ChipValue[] = [1, 5, 25, 100, 500, 1000];

export interface BettingControlsProps {
    balance: number;
    minBet?: number;
    maxBet?: number;
    disabledChips?: ChipValue[];
    availableChips?: ChipValue[];
    currentBet?: number;
    onPlaceBet?: (bet: number) => void;
    onClearBet?: () => void;
    onMaxBet?: () => void;
    onDoubleBet?: () => void;
    onDealCards?: () => void;
    disabled?: boolean;
    autoConfirm?: boolean;
    confirmEnabled?: boolean;
    className?: string;
    vertical?: boolean;
    compact?: boolean;
}

/**
 * BettingControls component provides a UI for placing and managing bets
 * It displays chips for selection and buttons for bet operations
 * Handles validation against balance, min and max bet constraints
 */
const BettingControls: React.FC<BettingControlsProps> = ({
    balance,
    minBet = 5,
    maxBet = 10000,
    disabledChips = [],
    availableChips = DEFAULT_CHIP_VALUES,
    currentBet = 0,
    onPlaceBet,
    onClearBet,
    onMaxBet,
    onDoubleBet,
    onDealCards,
    disabled = false,
    autoConfirm = true,
    confirmEnabled = true,
    className = '',
    vertical = false,
    compact = false,
}) => {
    // Local state
    const [selectedChip, setSelectedChip] = useState<ChipValue | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showErrorMessage, setShowErrorMessage] = useState(false);

    // Reset error message after a timeout
    useEffect(() => {
        if (errorMessage) {
            setShowErrorMessage(true);
            const timer = setTimeout(() => {
                setShowErrorMessage(false);
                setTimeout(() => setErrorMessage(null), 300); // Clear after animation completes
            }, 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [errorMessage]);

    /**
     * Determines if a chip value is available based on configured chips
     *
     * @param {ChipValue} value - The chip value to check
     * @returns {boolean} Whether the chip is available for selection
     */
    const isChipAvailable = useCallback((value: ChipValue): boolean => {
        return availableChips.includes(value);
    }, [availableChips]);

    /**
     * Determines if a chip can be selected based on availability and balance
     *
     * @param {ChipValue} value - The chip value to check
     * @returns {boolean} Whether the chip can be selected
     */
    const canSelectChip = useCallback((value: ChipValue): boolean => {
        // Chip is unavailable or explicitly disabled
        if (!isChipAvailable(value) || disabledChips.includes(value)) return false;

        // Not enough balance for this chip
        if (value > balance) return false;

        // Current bet + chip exceeds max bet
        if (currentBet + value > maxBet) return false;

        return true;
    }, [isChipAvailable, disabledChips, balance, currentBet, maxBet]);

    /**
     * Adds a chip to the current bet with validation
     *
     * @param {ChipValue} value - The chip value to add to the bet
     */
    const addChipToBet = useCallback((value: ChipValue): void => {
        // Calculate the new bet amount
        const newBet = currentBet + value;

        // Validate against constraints
        if (newBet > maxBet) {
            setErrorMessage(`Cannot exceed maximum bet of $${maxBet}`);
            return;
        }

        if (value > balance) {
            setErrorMessage(`Not enough balance for a $${value} chip`);
            return;
        }

        // Place the bet through the callback
        onPlaceBet?.(newBet);

        // Clear selected chip after placing bet
        setSelectedChip(null);
    }, [currentBet, maxBet, balance, onPlaceBet]);

    /**
     * Handles chip selection and updates the selected chip state
     *
     * @param {ChipValue} value - The chip value being selected
     */
    const handleChipSelect = useCallback((value: ChipValue): void => {
        if (disabled) return;

        if (canSelectChip(value)) {
            setSelectedChip(value);

            // If auto confirm is enabled, immediately add the chip to bet
            if (autoConfirm && onPlaceBet) {
                // Calculate the new bet amount
                const newBet = value;
                onPlaceBet(newBet);
            }
        } else {
            // Set an appropriate error message based on the constraint violation
            let errorMsg = `Cannot select $${value} chip`;

            if (value > balance) {
                errorMsg = `Not enough balance for a $${value} chip`;
            } else if (currentBet + value > maxBet) {
                errorMsg = `Adding $${value} would exceed max bet of $${maxBet}`;
            }

            setErrorMessage(errorMsg);
        }
    }, [disabled, canSelectChip, autoConfirm, onPlaceBet, balance, currentBet, maxBet]);

    /**
     * Handles confirmation of bet
     * Validates minimum bet requirement before confirming
     */
    const handleConfirmBet = useCallback((): void => {
        if (currentBet < minBet) {
            setErrorMessage(`Minimum bet is $${minBet}`);
            return;
        }

        // If there's a selected chip, add it first
        if (selectedChip !== null) {
            addChipToBet(selectedChip);
        }
    }, [currentBet, minBet, selectedChip, addChipToBet]);

    /**
     * Handles clearing of the current bet
     */
    const handleClearBet = useCallback((): void => {
        setSelectedChip(null);
        onClearBet?.();
    }, [onClearBet]);

    /**
     * Handles setting maximum bet based on balance and max bet limit
     */
    const handleMaxBet = useCallback((): void => {
        // Set bet to the lesser of balance or max bet
        const maxPossibleBet = Math.min(balance, maxBet);

        if (maxPossibleBet < minBet) {
            setErrorMessage(`Not enough balance for minimum bet of $${minBet}`);
            return;
        }

        // Call onMaxBet if available, otherwise call onPlaceBet with maxPossibleBet
        if (onMaxBet) {
            onMaxBet();
        } else if (onPlaceBet) {
            onPlaceBet(maxPossibleBet);
        }
    }, [balance, maxBet, minBet, onMaxBet, onPlaceBet]);

    /**
     * Handles doubling the current bet with validation
     */
    const handleDoubleBet = useCallback((): void => {
        // Calculate doubled bet
        const doubledBet = currentBet * 2;

        // Validate against constraints
        if (doubledBet > maxBet) {
            setErrorMessage(`Doubling would exceed maximum bet of $${maxBet}`);
            return;
        }

        if (doubledBet > balance) {
            setErrorMessage(`Not enough balance to double bet`);
            return;
        }
        // Double the bet through callback or fallback to place bet
        if (onDoubleBet) {
            onDoubleBet();
        } else if (onPlaceBet) {
            onPlaceBet(doubledBet);
        }
    }, [currentBet, maxBet, balance, onDoubleBet, onPlaceBet]);

    /**
     * Gets appropriate styling for bet confirmation button
     *
     * @returns {string} Classes for the bet button
     */
    const getBetButtonStyle = useCallback((): string => {
        if (currentBet < minBet) {
            return 'bg-gray-600 hover:bg-gray-500 cursor-not-allowed opacity-50';
        }
        return 'bg-green-600 hover:bg-green-500';
    }, [currentBet, minBet]);

    return (
        <div className={cn(
            'relative flex gap-4 rounded-lg p-4 bg-black/30 backdrop-blur-md',
            vertical ? 'flex-col items-center' : 'flex-row items-center justify-between',
            className
        )}>
            {/* Available chips with improved spacing */}
            <div className={cn(
                'flex flex-wrap gap-3', // Increased gap for better spacing
                vertical ? 'justify-center' : 'justify-center flex-grow', // Always center chips
                'mx-auto' // Center horizontally
            )}>
                {availableChips.toSorted((a: ChipValue, b: ChipValue) => a - b).map((value: ChipValue) => (
                    <Chip
                        key={`chip-${value}`}
                        value={value}
                        size={compact ? 'sm' : 'md'}
                        selected={selectedChip === value}
                        disabled={!canSelectChip(value) || disabled}
                        onClick={() => handleChipSelect(value)}
                        className="transition-transform cursor-pointer hover:scale-110"
                        aria-label={`$${value} chip${!canSelectChip(value) ? ' (not available)' : ''}`}
                    />
                ))}
            </div>

            {/* Betting actions with better alignment */}
            <div className={cn(
                'flex gap-3', // Increased gap for better spacing
                vertical ? 'justify-center w-full' : 'flex-shrink-0 justify-end',
                'flex-wrap' // Allow wrapping on small screens
            )}>
                {/* Clear button */}
                <button
                    type="button"
                    disabled={currentBet === 0 || disabled}
                    onClick={handleClearBet}
                    className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors', // Increased padding
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                        currentBet === 0 || disabled
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-red-600 hover:bg-red-500'
                    )}
                    aria-label="Clear bet"
                >
                    Clear
                </button>

                {/* Double button - only show if there's a current bet */}
                {currentBet > 0 && (
                    <button
                        type="button"
                        disabled={currentBet * 2 > balance || currentBet * 2 > maxBet || disabled}
                        onClick={handleDoubleBet}
                        className={cn(
                            'px-4 py-2 rounded-md text-sm font-medium transition-colors', // Increased padding
                            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                            currentBet * 2 > balance || currentBet * 2 > maxBet || disabled
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : 'bg-yellow-600 hover:bg-yellow-500'
                        )}
                        aria-label="Double bet"
                    >
                        Double
                    </button>
                )}

                {/* Max bet button */}
                <button
                    type="button"
                    disabled={balance < minBet || disabled}
                    onClick={handleMaxBet}
                    className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-colors', // Increased padding
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                        balance < minBet || disabled
                            ? 'bg-gray-600 cursor-not-allowed opacity-50'
                            : 'bg-blue-600 hover:bg-blue-500'
                    )}
                    aria-label="Max bet"
                >
                    Max
                </button>

                {/* Deal button - show when there's a bet and onDealCards is available */}
                {currentBet >= minBet && onDealCards && (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={onDealCards}
                        className={cn(
                            'px-4 py-2 rounded-md text-sm font-medium transition-colors', // Increased padding
                            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                            'bg-green-600 hover:bg-green-500 font-bold', // Added font-bold for emphasis
                            disabled && 'bg-gray-600 cursor-not-allowed opacity-50'
                        )}
                        aria-label="Deal cards"
                    >
                        Deal
                    </button>
                )}

                {/* Bet confirmation button (if enabled and not auto-confirm) */}
                {confirmEnabled && !autoConfirm && selectedChip !== null && (
                    <button
                        type="button"
                        disabled={currentBet < minBet || disabled}
                        onClick={handleConfirmBet}
                        className={cn(
                            'px-4 py-2 rounded-md text-sm font-medium transition-colors', // Increased padding
                            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                            getBetButtonStyle()
                        )}
                        aria-label="Confirm bet"
                    >
                        Bet
                    </button>
                )}
            </div>

            {/* Current bet display with improved visibility */}
            <div className="absolute top-0 px-4 py-1.5 text-sm font-bold text-white transform -translate-x-1/2 -translate-y-1/2 rounded-full left-1/2 bg-black/70 border border-amber-600/30">
                Bet: ${currentBet.toLocaleString()} | Balance: ${balance.toLocaleString()}
            </div>

            {/* Error message display */}
            <AnimatePresence>
                {showErrorMessage && errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-0 px-3 py-1 mt-1 text-sm text-white transform -translate-x-1/2 translate-y-full bg-red-600 rounded-md left-1/2"
                    >
                        {errorMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BettingControls;