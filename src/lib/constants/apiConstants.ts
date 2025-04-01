/**
 * API-related constants for the blackjack game application
 */

/**
 * Base API URL
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REGISTER: '/auth/register',
        REFRESH_TOKEN: '/auth/refresh-token',
        RESET_PASSWORD: '/auth/reset-password',
        VERIFY_EMAIL: '/auth/verify-email',
        ME: '/auth/me'
    },

    // User endpoints
    USER: {
        PROFILE: '/user/profile',
        SETTINGS: '/user/settings',
        STATS: '/user/stats',
        ACHIEVEMENTS: '/user/achievements',
        UPDATE_PROFILE: '/user/profile/update',
        UPDATE_SETTINGS: '/user/settings/update'
    },

    // Game endpoints
    GAME: {
        SAVE_SESSION: '/game/save-session',
        LOAD_SESSION: '/game/load-session',
        GAME_HISTORY: '/game/history',
        LEADERBOARD: '/game/leaderboard'
    },

    // Wallet endpoints
    WALLET: {
        BALANCE: '/wallet/balance',
        DEPOSIT: '/wallet/deposit',
        WITHDRAW: '/wallet/withdraw',
        TRANSACTIONS: '/wallet/transactions'
    },

    // Analytics endpoints
    ANALYTICS: {
        GAME_STATS: '/analytics/game-stats',
        PLAYER_STATS: '/analytics/player-stats',
        PERFORMANCE: '/analytics/performance'
    }
};

/**
 * HTTP response status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

/**
 * API request methods
 */
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE'
};

/**
 * API request timeouts (in milliseconds)
 */
export const API_TIMEOUTS = {
    DEFAULT: 10000,
    EXTENDED: 30000,
    SHORT: 5000
};

/**
 * API error codes
 */
export const API_ERROR_CODES = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    SERVER_ERROR: 'SERVER_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * HTTP headers
 */
export const HTTP_HEADERS = {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    ACCEPT: 'Accept',
    ACCEPT_LANGUAGE: 'Accept-Language',
    X_REQUEST_ID: 'X-Request-ID',
    X_API_KEY: 'X-API-Key'
};

/**
 * Content types
 */
export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM: 'application/x-www-form-urlencoded',
    MULTIPART: 'multipart/form-data',
    TEXT: 'text/plain'
};

/**
 * Authentication token storage keys
 */
export const AUTH_STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_ID: 'user_id',
    EXPIRY: 'token_expiry'
};

/**
 * API response messages
 */
export const API_MESSAGES = {
    SESSION_SAVED: 'Game session saved successfully',
    SESSION_LOADED: 'Game session loaded successfully',
    PROFILE_UPDATED: 'Profile updated successfully',
    SETTINGS_UPDATED: 'Settings updated successfully',
    WALLET_UPDATED: 'Wallet updated successfully',
    LOGIN_SUCCESSFUL: 'Login successful',
    LOGOUT_SUCCESSFUL: 'Logout successful',
    REGISTER_SUCCESSFUL: 'Registration successful',
    PASSWORD_RESET: 'Password reset successfully',
    EMAIL_VERIFIED: 'Email verified successfully'
};

/**
 * API errors
 */
export const API_ERRORS = {
    SESSION_NOT_FOUND: 'Game session not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    INSUFFICIENT_FUNDS: 'Insufficient funds',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    INVALID_TOKEN: 'Invalid token',
    EXPIRED_TOKEN: 'Token has expired',
    UNAUTHORIZED: 'Unauthorized access',
    SERVER_ERROR: 'Server error',
    NETWORK_ERROR: 'Network error',
    TIMEOUT: 'Request timed out'
};

/**
 * Default API request configuration
 */
export const DEFAULT_API_CONFIG = {
    headers: {
        [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
        [HTTP_HEADERS.ACCEPT]: CONTENT_TYPES.JSON
    },
    timeout: API_TIMEOUTS.DEFAULT,
    withCredentials: true
};

/**
 * API rate limits
 */
export const API_RATE_LIMITS = {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_HOUR: 1000
};