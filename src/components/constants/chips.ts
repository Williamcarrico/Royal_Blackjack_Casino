/**
 * Chip-related constants for the blackjack game
 */
import type { ChipValue, ChipSize } from '@types/uiTypes';

/**
 * Default available chip values for betting
 */
export const DEFAULT_CHIP_VALUES: ChipValue[] = [1, 5, 25, 100, 500, 1000];

/**
 * Standard chip colors and styling properties for each chip value
 */
export const CHIP_COLORS: Record<ChipValue, { bg: string; border: string; text: string; dot: string }> = {
    1: {
        bg: 'bg-white',
        border: 'border-gray-300',
        text: 'text-gray-900',
        dot: 'bg-gray-200'
    },
    5: {
        bg: 'bg-red-600',
        border: 'border-red-800',
        text: 'text-white',
        dot: 'bg-red-500'
    },
    10: {
        bg: 'bg-blue-600',
        border: 'border-blue-800',
        text: 'text-white',
        dot: 'bg-blue-500'
    },
    20: {
        bg: 'bg-yellow-500',
        border: 'border-yellow-700',
        text: 'text-white',
        dot: 'bg-yellow-400'
    },
    25: {
        bg: 'bg-green-600',
        border: 'border-green-800',
        text: 'text-white',
        dot: 'bg-green-500'
    },
    50: {
        bg: 'bg-orange-500',
        border: 'border-orange-700',
        text: 'text-white',
        dot: 'bg-orange-400'
    },
    100: {
        bg: 'bg-black',
        border: 'border-gray-800',
        text: 'text-white',
        dot: 'bg-gray-700'
    },
    500: {
        bg: 'bg-purple-600',
        border: 'border-purple-800',
        text: 'text-white',
        dot: 'bg-purple-500'
    },
    1000: {
        bg: 'bg-amber-500',
        border: 'border-amber-700',
        text: 'text-white',
        dot: 'bg-amber-400'
    },
    5000: {
        bg: 'bg-pink-600',
        border: 'border-pink-800',
        text: 'text-white',
        dot: 'bg-pink-500'
    },
    10000: {
        bg: 'bg-gradient-to-br from-emerald-500 to-blue-500',
        border: 'border-teal-800',
        text: 'text-white',
        dot: 'bg-teal-400'
    }
};

/**
 * Size classes for chip rendering at different sizes
 */
export const CHIP_SIZE_CLASSES: Record<ChipSize, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
};

/**
 * Badge size classes for the chip count indicator
 */
export const CHIP_BADGE_SIZE_CLASSES: Record<ChipSize, string> = {
    sm: 'w-4 h-4 text-[8px]',
    md: 'w-5 h-5 text-[10px]',
    lg: 'w-6 h-6 text-xs'
};

/**
 * Text size classes for the chip value
 */
export const CHIP_VALUE_TEXT_SIZE_CLASSES: Record<ChipSize, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
};

/**
 * Get the appropriate color classes for a chip based on its value
 *
 * @param value - The chip value
 * @returns Color classes object for the chip
 */
export const getChipColorByValue = (value: ChipValue): { bg: string; border: string; text: string; dot: string } => {
    return CHIP_COLORS[value] || CHIP_COLORS[1];
};