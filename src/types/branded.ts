/**
 * Branded type definitions for Royal Blackjack Casino
 * Adds nominal typing to improve type safety
 */

/**
 * Branded type utility for creating branded types
 */
export type Brand<K, T> = K & { readonly __brand: T };

/**
 * Branded string types
 */
export type CardID = Brand<string, 'CardID'>;
export type DeckID = Brand<string, 'DeckID'>;
export type HandID = Brand<string, 'HandID'>;
export type PlayerID = Brand<string, 'PlayerID'>;
export type GameID = Brand<string, 'GameID'>;
export type BetID = Brand<string, 'BetID'>;
export type SessionID = Brand<string, 'SessionID'>;
export type UserID = Brand<string, 'UserID'>;
export type TransactionID = Brand<string, 'TransactionID'>;
export type NotificationID = Brand<string, 'NotificationID'>;
export type ToastID = Brand<string, 'ToastID'>;

/**
 * Branded number types
 */
export type Balance = Brand<number, 'Balance'>;
export type BetAmount = Brand<number, 'BetAmount'>;
export type Percentage = Brand<number, 'Percentage'>;
export type CardValue = Brand<number, 'CardValue'>;
export type Timestamp = Brand<number, 'Timestamp'>;
export type Currency = Brand<number, 'Currency'>;

/**
 * Type guard functions for branded types
 */

/**
 * Type guard for CardID
 */
export function isCardID(value: string): value is CardID {
    // Validation logic (e.g., check format)
    return typeof value === 'string' && /^card_[a-zA-Z0-9]+$/.test(value);
}

/**
 * Type guard for HandID
 */
export function isHandID(value: string): value is HandID {
    return typeof value === 'string' && /^hand_[a-zA-Z0-9]+$/.test(value);
}

/**
 * Type guard for BetID
 */
export function isBetID(value: string): value is BetID {
    return typeof value === 'string' && /^bet_[a-zA-Z0-9]+$/.test(value);
}

/**
 * Type guard for PlayerID
 */
export function isPlayerID(value: string): value is PlayerID {
    return typeof value === 'string' && /^player_[a-zA-Z0-9]+$/.test(value);
}

/**
 * Type guard for GameID
 */
export function isGameID(value: string): value is GameID {
    return typeof value === 'string' && /^game_[a-zA-Z0-9]+$/.test(value);
}

/**
 * Type guard for UserID
 */
export function isUserID(value: string): value is UserID {
    return typeof value === 'string' && /^user_[a-zA-Z0-9]+$/.test(value);
}

/**
 * Type guard for Balance
 */
export function isBalance(value: number): value is Balance {
    return typeof value === 'number' && value >= 0;
}

/**
 * Type guard for BetAmount
 */
export function isBetAmount(value: number): value is BetAmount {
    return typeof value === 'number' && value > 0;
}

/**
 * Type guard for Percentage
 */
export function isPercentage(value: number): value is Percentage {
    return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Helper functions to create branded types
 */

/**
 * Creates a CardID from a string
 */
export function createCardID(value: string): CardID {
    if (!isCardID(value)) {
        throw new Error(`Invalid CardID format: ${value}`);
    }
    return value as CardID;
}

/**
 * Creates a BetID from a string
 */
export function createBetID(value: string): BetID {
    if (!isBetID(value)) {
        throw new Error(`Invalid BetID format: ${value}`);
    }
    return value as BetID;
}

/**
 * Creates a HandID from a string
 */
export function createHandID(value: string): HandID {
    if (!isHandID(value)) {
        throw new Error(`Invalid HandID format: ${value}`);
    }
    return value as HandID;
}

/**
 * Creates a Balance from a number
 */
export function createBalance(value: number): Balance {
    if (!isBalance(value)) {
        throw new Error(`Invalid Balance value: ${value}`);
    }
    return value as Balance;
}

/**
 * Creates a BetAmount from a number
 */
export function createBetAmount(value: number): BetAmount {
    if (!isBetAmount(value)) {
        throw new Error(`Invalid BetAmount value: ${value}`);
    }
    return value as BetAmount;
}