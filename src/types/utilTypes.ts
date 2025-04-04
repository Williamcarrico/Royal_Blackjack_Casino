/**
 * Utility type definitions for the blackjack game
 */

// Currency code
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CNY';

// Language code
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja';

// Money amount
export interface Money {
    amount: number;
    currency: CurrencyCode;
}

// Pagination params
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Pagination response
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// Filter params
export interface FilterParams {
    [key: string]: string | number | boolean | string[] | number[] | null;
}

// Date range
export interface DateRange {
    start: Date | string;
    end: Date | string;
}

// Result type
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

// Async operation status
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

// Async data
export interface AsyncData<T, E = Error> {
    data: T | null;
    status: AsyncStatus;
    error: E | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    timestamp?: number;
}

// Logger level
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Log entry
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, unknown>;
    stackTrace?: string;
}

// Config settings
export interface ConfigSettings {
    apiUrl: string;
    wsUrl: string;
    environment: 'development' | 'staging' | 'production';
    version: string;
    debug: boolean;
    features: {
        [featureName: string]: boolean;
    };
    timeouts: {
        api: number;
        authentication: number;
        animation: number;
        inactivity: number;
    };
    limits: {
        maxPlayers: number;
        maxBet: number;
        minBet: number;
        maxHands: number;
    };
}

// Validation error
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

// Validation result
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

// Validator function
export type Validator<T> = (data: T) => ValidationResult;

// Storage type
export type StorageType = 'local' | 'session' | 'cookie' | 'memory';

// Storage options
export interface StorageOptions {
    prefix?: string;
    expiry?: number; // in seconds
    secure?: boolean;
    path?: string;
    serializer?: (data: unknown) => string;
    deserializer?: (data: string) => unknown;
}

// Storage interface
export interface Storage {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T, options?: Partial<StorageOptions>) => void;
    remove: (key: string) => void;
    clear: () => void;
    keys: () => string[];
}

// Event types
export type EventType =
    | 'game:start'
    | 'game:end'
    | 'round:start'
    | 'round:end'
    | 'hand:dealt'
    | 'hand:hit'
    | 'hand:stand'
    | 'hand:double'
    | 'hand:split'
    | 'hand:surrender'
    | 'hand:insurance'
    | 'hand:blackjack'
    | 'hand:bust'
    | 'hand:win'
    | 'hand:loss'
    | 'hand:push'
    | 'bet:placed'
    | 'bet:settled'
    | 'dealer:play'
    | 'dealer:reveal'
    | 'shuffle:start'
    | 'shuffle:end'
    | 'error'
    | 'warning'
    | 'user:login'
    | 'user:logout'
    | 'balance:update';

// Event payload
export interface EventPayload<T = unknown> {
    type: EventType;
    timestamp: Date;
    data: T;
    source?: string;
}

// Event handler
export type EventHandler<T = unknown> = (payload: EventPayload<T>) => void;

// Event bus
export interface EventBus {
    subscribe: <T>(type: EventType | EventType[], handler: EventHandler<T>) => () => void;
    publish: <T>(type: EventType, data: T) => void;
    unsubscribe: (type: EventType, handler: EventHandler) => void;
    once: <T>(type: EventType, handler: EventHandler<T>) => void;
    clear: (type?: EventType) => void;
}

// Timer
export interface Timer {
    id: string;
    start: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    reset: () => void;
    getElapsed: () => number;
    getRemaining: () => number;
    isRunning: () => boolean;
    onTick?: (elapsed: number, remaining: number) => void;
    onComplete?: () => void;
}

// Random number generator options
export interface RandomOptions {
    min: number;
    max: number;
    seed?: number;
    isInteger?: boolean;
}

// Random generator
export interface RandomGenerator {
    nextInt: (min: number, max: number) => number;
    nextFloat: (min: number, max: number) => number;
    shuffle: <T>(array: T[]) => T[];
    pick: <T>(array: T[]) => T;
    pickMultiple: <T>(array: T[], count: number) => T[];
    setSeed: (seed: number) => void;
    probability: (percentage: number) => boolean;
}

// Analytics event
export interface AnalyticsEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
    timestamp: Date;
    userId?: string;
    gameId?: string;
    sessionId?: string;
    extraData?: Record<string, unknown>;
}

// Analytics service
export interface AnalyticsService {
    trackEvent: (event: Omit<AnalyticsEvent, 'timestamp'>) => void;
    trackPageView: (page: string) => void;
    trackTiming: (category: string, variable: string, time: number) => void;
    identify: (userId: string, traits?: Record<string, unknown>) => void;
    reset: () => void;
    flush: () => Promise<void>;
}