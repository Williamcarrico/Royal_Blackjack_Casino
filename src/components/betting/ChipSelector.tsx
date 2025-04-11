'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/utils';

interface ChipSelectorProps {
    selectedValue: number;
    onSelect: (value: number) => void;
    chipValues: number[];
    playerBalance: number;
    chipStyle?: 'classic' | 'modern' | 'luxury';
    className?: string;
}

/**
 * ChipSelector component for selecting chip values in the blackjack game
 * Displays a set of interactive casino chips with different denominations
 */
const ChipSelector: React.FC<ChipSelectorProps> = ({
    selectedValue,
    onSelect,
    chipValues = [5, 10, 25, 50, 100, 500],
    playerBalance = 0,
    chipStyle = 'classic',
    className,
}) => {
    // Get chip colors based on value with enhanced contrast and visibility
    const getChipColor = (value: number): string => {
        switch (value) {
            case 1: return 'bg-white border-gray-300 text-gray-800 shadow-inner shadow-gray-200';
            case 5: return 'bg-red-600 border-red-900 text-white shadow-inner shadow-red-500';
            case 10: return 'bg-blue-600 border-blue-900 text-white shadow-inner shadow-blue-500';
            case 25: return 'bg-green-600 border-green-900 text-white shadow-inner shadow-green-500';
            case 50: return 'bg-orange-500 border-orange-800 text-white shadow-inner shadow-orange-400';
            case 100: return 'bg-purple-600 border-purple-900 text-white shadow-inner shadow-purple-500';
            case 500: return 'bg-black border-gray-800 text-amber-400 shadow-inner shadow-gray-700';
            case 1000: return 'bg-gradient-to-r from-amber-600 to-yellow-500 border-amber-900 text-white shadow-inner shadow-amber-400';
            default: return 'bg-gray-600 border-gray-800 text-white shadow-inner shadow-gray-500';
        }
    };

    // Enhanced chip accent patterns for better visual appearance
    const getChipPattern = (style: string): string => {
        switch (style) {
            case 'modern':
                return 'after:content-[""] after:absolute after:inset-[6px] after:rounded-full after:border-2 after:border-white/30';
            case 'luxury':
                return 'after:content-[""] after:absolute after:inset-[8px] after:rounded-full after:border-[2px] after:border-dashed after:border-white/40 before:content-[""] before:absolute before:inset-[3px] before:rounded-full before:border-[1px] before:border-white/20';
            case 'classic':
            default:
                return 'after:content-[""] after:absolute after:inset-[5px] after:rounded-full after:border-[3px] after:border-white/20';
        }
    };

    // Check if player can afford the chip
    const canAfford = (value: number): boolean => {
        return value <= playerBalance;
    };

    return (
        <div className={cn(
            'flex items-center space-x-2 p-2 rounded-lg bg-black/30', // Added background for better contrast
            className
        )}>
            {chipValues.map((value) => (
                <motion.button
                    key={`chip-${value}`}
                    type="button"
                    onClick={() => canAfford(value) && onSelect(value)}
                    whileHover={{ y: -8, scale: 1.1 }} // Enhanced hover effect
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 0 }}
                    animate={selectedValue === value ? { y: -5, scale: 1.05 } : { y: 0, scale: 1 }} // Animate selected chip
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }} // Springy animation
                    className={cn(
                        'relative w-16 h-16 md:w-18 md:h-18 rounded-full', // Larger chips
                        'flex items-center justify-center',
                        'border-4 shadow-xl cursor-pointer transition-colors', // Enhanced shadow
                        'before:content-[""] before:absolute before:inset-0 before:rounded-full before:shadow-inner',
                        getChipPattern(chipStyle),
                        getChipColor(value),
                        !canAfford(value) && 'opacity-40 cursor-not-allowed filter grayscale',
                        selectedValue === value && 'ring-4 ring-white/60 z-10' // Enhanced selected state
                    )}
                    disabled={!canAfford(value)}
                    aria-label={`${value} chip`}
                    aria-pressed={selectedValue === value}
                    tabIndex={0}
                >
                    <span className="relative text-center font-bold text-base z-10">
                        ${value}
                    </span>

                    {/* Subtle decorative dots around the chip */}
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={`dot-${value}-${i}`}
                            className={cn(
                                'absolute w-2 h-2 rounded-full bg-white/30',
                                'transform -translate-x-1/2 -translate-y-1/2'
                            )}
                            style={{
                                left: `${50 + 40 * Math.cos(i * Math.PI / 4)}%`,
                                top: `${50 + 40 * Math.sin(i * Math.PI / 4)}%`
                            }}
                        />
                    ))}
                </motion.button>
            ))}
        </div>
    );
};

export default ChipSelector;