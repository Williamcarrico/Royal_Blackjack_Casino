/**
 * Color Utilities for Animation Compatibility
 *
 * These functions help convert OKLCH/OKLAB colors to animation-compatible formats
 * such as hex or rgb for use with Framer Motion animations.
 */

// Approximate conversion of OKLCH and OKLAB to RGB/HEX
// Note: These are approximations for animation purposes

type ColorMap = {
    [key: string]: string;
};

// Common OKLCH color mappings to hex
export const oklchToHex: ColorMap = {
    // Light theme colors
    'oklch(0.962 0.059 95.617)': '#f8f0e3', // Approximation for animation
    'oklch(0.85 0.1 85)': '#e9c46a', // Gold
    'oklch(0.55 0.15 145)': '#2a9d8f', // Casino green
    'oklch(0.55 0.2 300)': '#8b5cf6', // Purple
    'oklch(0.577 0.245 27.325)': '#ef4444', // Destructive

    // Dark theme colors
    'oklch(0.75 0.15 85)': '#d4a24b', // Darker gold
    'oklch(0.4 0.15 145)': '#1e7268', // Darker casino green
    'oklch(0.65 0.24 27.325)': '#dc2626', // Darker destructive
};

// Common OKLAB color mappings to rgba
export const oklabToRgba: ColorMap = {
    'oklab(0.769 0.0640531 0.176752 / 0.2)': 'rgba(196, 170, 159, 0.2)',
};

/**
 * Converts an OKLCH or OKLAB color string to an animation-compatible format
 * @param colorString The OKLCH or OKLAB color string
 * @returns A hex, rgb, or rgba color string that can be animated
 */
export function getAnimatableColor(colorString: string): string {
    if (colorString.startsWith('oklch')) {
        return oklchToHex[colorString] ||
            // Fallback if not in the map
            '#888888';
    }

    if (colorString.startsWith('oklab')) {
        return oklabToRgba[colorString] ||
            // Fallback if not in the map
            'rgba(128, 128, 128, 0.5)';
    }

    // Return the original if it's not OKLCH or OKLAB
    return colorString;
}

/**
 * Hook to use for converting colors in animations
 * Usage example:
 *
 * const bgColor = useAnimatableColor('oklch(0.962 0.059 95.617)');
 * <motion.div animate={{ backgroundColor: bgColor }} />
 */
export function useAnimatableColor(colorString: string): string {
    return getAnimatableColor(colorString);
}