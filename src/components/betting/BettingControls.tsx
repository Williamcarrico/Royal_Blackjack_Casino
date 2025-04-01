'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Chip, { ChipValue, CHIP_COLORS } from './Chip';
import { Button } from '@/components/ui/button';

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
    disabled?: boolean;
    autoConfirm?: boolean;
    confirmEnabled?: boolean;
    className?: string;
    vertical?: boolean;
    compact?: boolean;
}

const DEFAULT_CHIP_VALUES: ChipValue[] = [1, 5, 25, 100, 500];

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
    disabled = false,
    autoConfirm = false,
    confirmEnabled = true,
    className = '',
    vertical = false,
    compact = false,
}) => {
    const [selectedChip, setSelectedChip] = useState<ChipValue | null>(null);
    const [pendingBet, setPendingBet] = useState<number>(currentBet);
    const [lastUsedChips, setLastUsedChips] = useState<ChipValue[]>([]);

    // Update the pending bet when the current bet changes
    useEffect(() => {
        setPendingBet(currentBet);
    }, [currentBet]);

    // Sort available chips by value
    const sortedChips = [...availableChips].sort((a, b) => a - b);

    // Check if a chip is available
    const isChipAvailable = (value: ChipValue) => {
        return !disabledChips.includes(value) &&
            availableChips.includes(value) &&
            value <= balance &&
            pendingBet + value <= maxBet;
    };

    // Check if chip can be selected
    const canSelectChip = (value: ChipValue) => {
        return !disabled && isChipAvailable(value);
    };

    // Handle chip selection
    const handleChipSelect = (value: ChipValue) => {
        console.log('Chip selection attempt:', { value, canSelect: canSelectChip(value), disabled, balance, maxBet });

        if (!canSelectChip(value)) {
            console.log('Cannot select chip:', {
                isDisabled: disabled,
                isInDisabledList: disabledChips.includes(value),
                isNotAvailable: !availableChips.includes(value),
                isGreaterThanBalance: value > balance,
                wouldExceedMaxBet: pendingBet + value > maxBet
            });
            return;
        }

        setSelectedChip(value);
        console.log('Chip selected:', value);

        if (autoConfirm) {
            addChipToBet(value);
        }
    };

    // Add selected chip to bet
    const addChipToBet = (value: ChipValue) => {
        console.log('Adding chip to bet:', { value, pendingBet, newBet: pendingBet + value });

        if (!isChipAvailable(value)) {
            console.log('Chip not available for bet');
            return;
        }

        const newBet = pendingBet + value;
        setPendingBet(newBet);

        // Track the last used chip for visualization
        setLastUsedChips(prev => {
            const updated = [...prev, value];
            // Keep only the last 3 chips used
            return updated.slice(-3);
        });

        if (autoConfirm) {
            console.log('Auto confirming bet:', newBet);
            onPlaceBet?.(newBet);
        }
    };

    // Handle bet confirmation
    const handleConfirmBet = () => {
        if (pendingBet < minBet || pendingBet > maxBet || disabled) return;

        onPlaceBet?.(pendingBet);
        setSelectedChip(null);
    };

    // Handle clearing the bet
    const handleClearBet = () => {
        setPendingBet(0);
        setLastUsedChips([]);
        onClearBet?.();
    };

    // Handle max bet
    const handleMaxBet = () => {
        const newBet = Math.min(balance, maxBet);
        setPendingBet(newBet);

        // Find highest value chip to represent max bet
        const highestChip = sortedChips[sortedChips.length - 1] || 500;
        setLastUsedChips([highestChip]);

        if (autoConfirm) {
            onPlaceBet?.(newBet);
        } else {
            onMaxBet?.();
        }
    };

    // Handle double bet
    const handleDoubleBet = () => {
        const newBet = Math.min(currentBet * 2, balance, maxBet);
        setPendingBet(newBet);

        // Duplicate the last used chips to represent doubling
        setLastUsedChips(prev => {
            const doubled = [...prev, ...prev];
            return doubled.slice(-3); // Keep only the last 3
        });

        if (autoConfirm) {
            onPlaceBet?.(newBet);
        } else {
            onDoubleBet?.();
        }
    };

    // Check if doubling is available
    const canDouble = currentBet > 0 && currentBet * 2 <= balance && currentBet * 2 <= maxBet && !disabled;

    // Generate the appropriate classes for the container
    const containerClasses = cn(
        'flex items-center justify-center gap-2 p-2 rounded-lg',
        vertical ? 'flex-col' : 'flex-row',
        compact ? 'scale-90' : '',
        className
    );

    // Get color for button variant based on last used chip
    const getBetButtonStyle = () => {
        if (lastUsedChips.length === 0 || pendingBet < minBet) return {};

        // Use the last chip's color for the button
        const lastChip = lastUsedChips[lastUsedChips.length - 1];
        // Ensure lastChip is a valid ChipValue by providing a fallback
        const chipColor = lastChip !== undefined ? CHIP_COLORS[lastChip] : CHIP_COLORS[1];

        return {
            background: chipColor.bg.replace('bg-', ''),
            borderColor: chipColor.border.replace('border-', ''),
            color: chipColor.text.replace('text-', '')
        };
    };

    return (
        <div className="space-y-4">
            {/* Chip selection */}
            <div className={containerClasses}>
                <AnimatePresence mode="wait">
                    {sortedChips.map((value) => (
                        <motion.div
                            key={`chip-${value}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative"
                        >
                            <Chip
                                value={value}
                                selected={selectedChip === value}
                                disabled={!canSelectChip(value)}
                                interactive
                                onClick={() => handleChipSelect(value)}
                                size={compact ? 'sm' : 'md'}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Visual chip stack indicator for pending bet */}
            {pendingBet > 0 && lastUsedChips.length > 0 && (
                <div className="flex justify-center mt-1 -mb-2">
                    {lastUsedChips.map((chip, index) => (
                        <div
                            key={`used-chip-${chip}-${index}`}
                            className={cn(
                                "w-4 h-4 rounded-full border",
                                CHIP_COLORS[chip].bg,
                                CHIP_COLORS[chip].border,
                                "transform -translate-y-1",
                                index > 0 && "-ml-1"
                            )}
                            style={{
                                zIndex: index,
                                transform: `translateX(${index * 2}px)`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Betting actions */}
            <div className={cn(
                'flex items-center gap-2',
                vertical ? 'flex-col w-full' : 'flex-row justify-center'
            )}>
                <Button
                    variant="outline"
                    size={compact ? 'sm' : 'default'}
                    disabled={pendingBet === 0 || disabled}
                    onClick={handleClearBet}
                    className={cn(
                        'min-w-20',
                        pendingBet === 0 && 'opacity-50'
                    )}
                >
                    Clear
                </Button>

                {!autoConfirm && (
                    <>
                        <Button
                            variant="outline"
                            size={compact ? 'sm' : 'default'}
                            disabled={!canDouble}
                            onClick={handleDoubleBet}
                            className="min-w-20"
                        >
                            Double
                        </Button>

                        <Button
                            variant="outline"
                            size={compact ? 'sm' : 'default'}
                            disabled={balance === 0 || disabled || balance < minBet}
                            onClick={handleMaxBet}
                            className="min-w-20"
                        >
                            Max Bet
                        </Button>

                        {confirmEnabled && (
                            <Button
                                variant="default"
                                size={compact ? 'sm' : 'default'}
                                disabled={pendingBet < minBet || disabled}
                                onClick={handleConfirmBet}
                                className={cn(
                                    'bg-primary hover:bg-primary/90 text-primary-foreground min-w-20',
                                    pendingBet < minBet && 'opacity-50'
                                )}
                                style={pendingBet >= minBet ? {
                                    background: `var(--${getBetButtonStyle().background}, var(--primary))`,
                                    color: `var(--${getBetButtonStyle().color}, var(--primary-foreground))`,
                                    borderColor: `var(--${getBetButtonStyle().borderColor}, transparent)`
                                } : undefined}
                            >
                                Bet {pendingBet > 0 && `$${pendingBet}`}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Bet limits indicator */}
            <div className="text-xs text-center text-muted-foreground">
                <span>Min: ${minBet}</span>
                <span className="mx-2">|</span>
                <span>Max: ${maxBet}</span>
            </div>
        </div>
    );
};

export default BettingControls;