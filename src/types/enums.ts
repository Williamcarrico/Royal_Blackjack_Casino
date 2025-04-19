/**
 * Enum definitions for Royal Blackjack Casino
 * Uses TypeScript enums for better autocompletion and type safety
 */

/**
 * Game phases define the current stage of a blackjack round
 */
export enum GamePhase {
    BETTING = 'betting',
    DEALING = 'dealing',
    PLAYER_TURN = 'playerTurn',
    DEALER_TURN = 'dealerTurn',
    SETTLEMENT = 'settlement',
    CLEANUP = 'cleanup',
    COMPLETED = 'completed'
}

/**
 * Outcome types define possible results of a hand or bet
 */
export enum OutcomeType {
    WIN = 'win',
    LOSE = 'lose',
    PUSH = 'push',
    BLACKJACK = 'blackjack',
    BUST = 'bust',
    INSURANCE = 'insurance',
    SURRENDER = 'surrender'
}

/**
 * Chip size options for UI rendering
 */
export enum ChipSize {
    SMALL = 'sm',
    MEDIUM = 'md',
    LARGE = 'lg'
}

/**
 * Chip value denominations available in the game
 */
export enum ChipValue {
    ONE = 1,
    FIVE = 5,
    TEN = 10,
    TWENTY = 20,
    TWENTY_FIVE = 25,
    FIFTY = 50,
    ONE_HUNDRED = 100,
    FIVE_HUNDRED = 500,
    ONE_THOUSAND = 1000,
    FIVE_THOUSAND = 5000,
    TEN_THOUSAND = 10000
}

/**
 * Hand status values
 */
export enum HandStatus {
    ACTIVE = 'active',
    STANDING = 'standing',
    BUSTED = 'busted',
    BLACKJACK = 'blackjack',
    SURRENDER = 'surrender',
    PUSH = 'push',
    WIN = 'win',
    LOSS = 'loss'
}

/**
 * Available actions a player can take during their turn
 */
export enum HandAction {
    HIT = 'hit',
    STAND = 'stand',
    DOUBLE = 'double',
    SPLIT = 'split',
    SURRENDER = 'surrender',
    INSURANCE = 'insurance'
}

/**
 * Game status values
 */
export enum GameStatus {
    IDLE = 'idle',
    RUNNING = 'running',
    PAUSED = 'paused',
    COMPLETED = 'completed'
}

/**
 * User roles in the system
 */
export enum UserRole {
    GUEST = 'guest',
    PLAYER = 'player',
    VIP = 'vip',
    ADMIN = 'admin'
}

/**
 * Authentication status values
 */
export enum AuthStatus {
    AUTHENTICATED = 'authenticated',
    UNAUTHENTICATED = 'unauthenticated',
    LOADING = 'loading'
}

/**
 * Bet status values
 */
export enum BetStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    WON = 'won',
    LOST = 'lost',
    PUSH = 'push',
    CANCELLED = 'cancelled',
    SURRENDERED = 'surrendered'
}

/**
 * Side bet types
 */
export enum SideBetType {
    PERFECT_PAIRS = 'perfectPairs',
    TWENTY_ONE_PLUS_THREE = '21+3',
    LUCKY_LADIES = 'luckyLadies',
    ROYAL_MATCH = 'royalMatch',
    LUCKY_LUCKY = 'luckyLucky',
    IN_BETWEEN = 'inBetween',
    OVER_UNDER_13 = 'overUnder13'
}

/**
 * Card style options
 */
export enum CardStyleOption {
    MODERN = 'modern',
    CLASSIC = 'classic',
    MINIMAL = 'minimal',
    RETRO = 'retro'
}

/**
 * Theme mode options
 */
export enum ThemeMode {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system'
}

/**
 * Animation speed options
 */
export enum AnimationSpeed {
    SLOW = 'slow',
    NORMAL = 'normal',
    FAST = 'fast'
}