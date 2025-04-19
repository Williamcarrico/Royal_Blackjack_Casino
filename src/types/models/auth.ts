/**
 * Authentication domain model types for Royal Blackjack Casino
 */

import { UserID, TransactionID } from '../branded';
import { UserRole, AuthStatus } from '../enums';

/**
 * Authentication method
 */
export enum AuthMethod {
    EMAIL = 'email',
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
    TWITTER = 'twitter',
    APPLE = 'apple',
    GUEST = 'guest'
}

/**
 * User profile
 */
export interface UserProfile {
    id: UserID;
    email: string;
    name: string;
    avatar?: string;
    balance: number;
    role: UserRole;
    createdAt: Date;
    lastLoginAt: Date;
    preferences: {
        theme: 'light' | 'dark' | 'system';
        currency: string;
        language: string;
        notifications: boolean;
        soundEnabled: boolean;
        musicEnabled: boolean;
    };
    stats: {
        gamesPlayed: number;
        handsPlayed: number;
        winRate: number;
        totalWagered: number;
        totalWon: number;
        netProfit: number;
        highestBalance: number;
        lowestBalance: number;
    };
    vipStatus?: {
        level: number;
        points: number;
        pointsToNextLevel: number;
        benefits: string[];
        unlockDate: Date;
    };
}

/**
 * Authentication credentials
 */
export interface AuthCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

/**
 * Registration data
 */
export interface RegistrationData {
    email: string;
    password: string;
    name: string;
    acceptTerms: boolean;
    acceptMarketing?: boolean;
    referralCode?: string;
    initialDeposit?: number;
}

/**
 * Login response
 */
export interface LoginResponse {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

/**
 * Token pair
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

/**
 * Auth error codes
 */
export enum AuthErrorCode {
    INVALID_CREDENTIALS = 'invalid_credentials',
    USER_NOT_FOUND = 'user_not_found',
    EMAIL_ALREADY_EXISTS = 'email_already_exists',
    WEAK_PASSWORD = 'weak_password',
    SESSION_EXPIRED = 'session_expired',
    UNAUTHORIZED = 'unauthorized',
    ACCOUNT_LOCKED = 'account_locked',
    TOO_MANY_ATTEMPTS = 'too_many_attempts',
    SERVER_ERROR = 'server_error'
}

/**
 * Auth error
 */
export interface AuthError {
    code: AuthErrorCode;
    message: string;
    details?: Record<string, string>;
}

/**
 * Transaction type
 */
export enum TransactionType {
    BET = 'bet',
    WIN = 'win',
    LOSS = 'loss',
    PUSH = 'push',
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    BONUS = 'bonus'
}

/**
 * Transaction status
 */
export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REVERSED = 'reversed'
}

/**
 * Transaction
 */
export interface Transaction {
    id: TransactionID;
    userId: UserID;
    type: TransactionType;
    amount: number;
    balance: number; // Balance after transaction
    timestamp: Date;
    status: TransactionStatus;
    description?: string;
    gameId?: string;
    handId?: string;
    paymentMethod?: string;
    reference?: string;
}

/**
 * Two-factor authentication method
 */
export enum TwoFactorMethod {
    APP = 'app',
    SMS = 'sms',
    EMAIL = 'email',
    NONE = 'none'
}

/**
 * Authentication state
 */
export interface AuthState {
    status: AuthStatus;
    user: UserProfile | null;
    error: AuthError | null;
    isLoading: boolean;
    tokens: TokenPair | null;
}