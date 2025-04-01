/**
 * Format utilities for the blackjack game application
 */

/**
 * Formats a currency value for display
 * @param value The value to format
 * @param currency The currency symbol to use
 * @param minimumFractionDigits Minimum fraction digits to display
 * @param maximumFractionDigits Maximum fraction digits to display
 */
export const formatCurrency = (
    value: number,
    currency = '$',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
): string => {
    return `${currency}${value.toLocaleString('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
    })}`;
};

/**
 * Formats a percentage value for display
 * @param value The value to format (0-1)
 * @param minimumFractionDigits Minimum fraction digits to display
 * @param maximumFractionDigits Maximum fraction digits to display
 */
export const formatPercentage = (
    value: number,
    minimumFractionDigits = 0,
    maximumFractionDigits = 1
): string => {
    return `${(value * 100).toLocaleString('en-US', {
        minimumFractionDigits,
        maximumFractionDigits,
    })}%`;
};

/**
 * Formats a date for display
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions
 */
export const formatDate = (
    date: Date | string,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }
): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Formats a string in title case
 * @param str The string to format
 */
export const formatTitleCase = (str: string): string => {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Formats a card value for display
 * @param value The card value/rank
 */
export const formatCardValue = (value: string): string => {
    return value;
};

/**
 * Formats a card suit for display
 * @param suit The card suit
 */
export const formatCardSuit = (suit: string): string => {
    const suitSymbols: Record<string, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠',
    };

    return suitSymbols[suit.toLowerCase()] || suit;
};

/**
 * Formats a round result for display
 * @param result The round result
 */
export const formatRoundResult = (result: string | null): string => {
    if (!result) return '';

    const resultMap: Record<string, string> = {
        win: 'Win',
        loss: 'Loss',
        push: 'Push',
        blackjack: 'Blackjack!',
        bust: 'Bust',
        surrender: 'Surrendered',
        insurance: 'Insurance Paid',
        pending: 'In Progress',
    };

    return resultMap[result] || result;
};

/**
 * Formats a time duration in milliseconds to human-readable format
 * @param ms Time in milliseconds
 */
export const formatDuration = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
};