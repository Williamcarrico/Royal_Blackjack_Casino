/**
 * UI-related constants for the blackjack game application
 */

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION = {
    CARD_DEAL: 300,
    CARD_FLIP: 250,
    CHIP_MOVE: 400,
    MESSAGE_FADE: 500,
    DEALER_PAUSE: 800,
    RESULT_DISPLAY: 1000,
    BUTTON_HOVER: 150
};

/**
 * Animation speed multipliers
 */
export const ANIMATION_SPEED = {
    SLOW: 1.5,
    NORMAL: 1.0,
    FAST: 0.6,
    VERY_FAST: 0.3
};

/**
 * Z-index values for stacking elements
 */
export const Z_INDEX = {
    BACKGROUND: 0,
    TABLE: 1,
    CARD: 10,
    ACTIVE_CARD: 11,
    CHIP: 20,
    UI_ELEMENT: 30,
    MODAL: 100,
    TOOLTIP: 200
};

/**
 * Card dimensions (in pixels)
 */
export const CARD_DIMENSIONS = {
    WIDTH: 140,
    HEIGHT: 190,
    BORDER_RADIUS: 10
};

/**
 * Chip dimensions (in pixels)
 */
export const CHIP_DIMENSIONS = {
    DIAMETER: 60,
    STACK_OFFSET: 4
};

/**
 * Standard breakpoints for responsive design
 */
export const BREAKPOINTS = {
    XS: 480,
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536
};

/**
 * Color palette for the game UI
 */
export const COLORS = {
    // Primary palette
    PRIMARY: {
        DEFAULT: '#4f46e5',
        LIGHT: '#818cf8',
        DARK: '#3730a3'
    },

    // Secondary palette
    SECONDARY: {
        DEFAULT: '#0ea5e9',
        LIGHT: '#7dd3fc',
        DARK: '#0369a1'
    },

    // Accent colors
    ACCENT: {
        DEFAULT: '#f97316',
        LIGHT: '#fdba74',
        DARK: '#c2410c'
    },

    // Table colors
    TABLE: {
        GREEN: '#076324',
        BLUE: '#1a5f7a',
        PURPLE: '#4a2462',
        RED: '#6e1423'
    },

    // Semantic colors
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',

    // Neutral colors
    NEUTRAL: {
        BLACK: '#0f172a',
        DARK_GRAY: '#1e293b',
        GRAY: '#64748b',
        LIGHT_GRAY: '#cbd5e1',
        WHITE: '#f8fafc'
    },

    // Card colors
    CARD: {
        RED: '#dc2626',
        BLACK: '#171717',
        BACK: '#1e40af'
    },

    // Chip colors
    CHIP: {
        WHITE: '#f8fafc',
        RED: '#ef4444',
        BLUE: '#3b82f6',
        GREEN: '#10b981',
        BLACK: '#171717',
        PURPLE: '#7c3aed'
    }
};

/**
 * Chip values and their corresponding colors
 */
export const CHIP_VALUES: Array<{ value: number, color: string }> = [
    { value: 1, color: COLORS.CHIP.WHITE },
    { value: 5, color: COLORS.CHIP.RED },
    { value: 25, color: COLORS.CHIP.GREEN },
    { value: 100, color: COLORS.CHIP.BLUE },
    { value: 500, color: COLORS.CHIP.PURPLE },
    { value: 1000, color: COLORS.CHIP.BLACK }
];

/**
 * Default betting increments
 */
export const DEFAULT_BETTING_INCREMENTS = [1, 5, 25, 100, 500];

/**
 * Icon sizes (in pixels)
 */
export const ICON_SIZES = {
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32,
    XLARGE: 48
};

/**
 * Font sizes (in pixels or rem)
 */
export const FONT_SIZES = {
    XS: '0.75rem',
    SM: '0.875rem',
    BASE: '1rem',
    LG: '1.125rem',
    XL: '1.25rem',
    XXL: '1.5rem',
    XXXL: '1.875rem',
    XXXXL: '2.25rem'
};

/**
 * Spacing values (in pixels or rem)
 */
export const SPACING = {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    XXL: '4rem'
};

/**
 * Border radius values (in pixels or rem)
 */
export const BORDER_RADIUS = {
    SM: '0.25rem',
    MD: '0.5rem',
    LG: '0.75rem',
    XL: '1rem',
    ROUNDED: '9999px'
};

/**
 * Shadow values
 */
export const SHADOWS = {
    SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    CARD: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
};

/**
 * Transition durations (in milliseconds)
 */
export const TRANSITIONS = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
};

/**
 * Toast/notification settings
 */
export const TOAST = {
    DURATION: 5000,
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 8000
};