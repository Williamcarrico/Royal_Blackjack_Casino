/**
 * Authentication-related type definitions for the blackjack game
 */

// User role
export type UserRole = 'guest' | 'player' | 'vip' | 'admin';

// Authentication status
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

// Authentication method
export type AuthMethod = 'email' | 'google' | 'facebook' | 'twitter' | 'apple' | 'guest';

// User profile
export interface UserProfile {
    id: string;
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

// Authentication credentials
export interface AuthCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

// Registration data
export interface RegistrationData {
    email: string;
    password: string;
    name: string;
    acceptTerms: boolean;
    acceptMarketing?: boolean;
    referralCode?: string;
    initialDeposit?: number;
}

// Login response
export interface LoginResponse {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

// Token pair
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

// Auth error
export interface AuthError {
    code:
    | 'invalid_credentials'
    | 'user_not_found'
    | 'email_already_exists'
    | 'weak_password'
    | 'session_expired'
    | 'unauthorized'
    | 'account_locked'
    | 'too_many_attempts'
    | 'server_error';
    message: string;
    details?: Record<string, string>;
}

// Password reset request
export interface PasswordResetRequest {
    email: string;
}

// Password reset confirmation
export interface PasswordResetConfirmation {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

// Email verification data
export interface EmailVerificationData {
    token: string;
    email: string;
}

// Update profile request
export interface UpdateProfileRequest {
    name?: string;
    avatar?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    preferences?: Partial<UserProfile['preferences']>;
}

// Transaction type
export type TransactionType =
    | 'bet'
    | 'win'
    | 'loss'
    | 'push'
    | 'deposit'
    | 'withdrawal'
    | 'bonus';

// Transaction
export interface Transaction {
    id: string;
    userId: string;
    type: TransactionType;
    amount: number;
    balance: number; // Balance after transaction
    timestamp: Date;
    status: 'pending' | 'completed' | 'failed' | 'reversed';
    description?: string;
    gameId?: string;
    handId?: string;
    paymentMethod?: string;
    reference?: string;
}

// Deposit request
export interface DepositRequest {
    amount: number;
    paymentMethod: string;
    savePaymentMethod?: boolean;
}

// Withdrawal request
export interface WithdrawalRequest {
    amount: number;
    paymentMethod: string;
    accountDetails?: Record<string, string>;
}

// Auth session
export interface AuthSession {
    userId: string;
    createdAt: Date;
    expiresAt: Date;
    ip: string;
    userAgent: string;
    isActive: boolean;
    lastActivityAt: Date;
    deviceId?: string;
}

// Two-factor authentication method
export type TwoFactorMethod = 'app' | 'sms' | 'email' | 'none';

// Two-factor authentication settings
export interface TwoFactorSettings {
    enabled: boolean;
    method: TwoFactorMethod;
    phone?: string;
    backup_codes?: string[];
    last_verified?: Date;
}

// Two-factor authentication challenge
export interface TwoFactorChallenge {
    userId: string;
    method: TwoFactorMethod;
    code: string;
    token: string;
    expiresAt: Date;
}

// OAuth provider
export interface OAuthProvider {
    id: string;
    name: string;
    connected: boolean;
    email?: string;
    avatarUrl?: string;
    lastUsed?: Date;
}

// User permissions
export interface UserPermissions {
    canDeposit: boolean;
    canWithdraw: boolean;
    canPlay: boolean;
    dailyLimit: number;
    weeklyLimit: number;
    monthlyLimit: number;
    maxBet: number;
    selfExcluded: boolean;
    selfExclusionEndDate?: Date;
}

// Authentication state
export interface AuthState {
    status: AuthStatus;
    user: UserProfile | null;
    error: AuthError | null;
    isLoading: boolean;
    tokens: TokenPair | null;
    twoFactor: TwoFactorSettings | null;
    permissions: UserPermissions | null;
    sessions: AuthSession[];
    transactions: Transaction[];
    oauthProviders: OAuthProvider[];

    // Actions
    login: (credentials: AuthCredentials) => Promise<LoginResponse>;
    register: (data: RegistrationData) => Promise<LoginResponse>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<TokenPair>;
    resetPassword: (request: PasswordResetRequest) => Promise<void>;
    confirmPasswordReset: (confirmation: PasswordResetConfirmation) => Promise<void>;
    verifyEmail: (data: EmailVerificationData) => Promise<void>;
    updateProfile: (request: UpdateProfileRequest) => Promise<UserProfile>;
    deposit: (request: DepositRequest) => Promise<Transaction>;
    withdraw: (request: WithdrawalRequest) => Promise<Transaction>;
    getTransactions: () => Promise<Transaction[]>;
    enableTwoFactor: (method: TwoFactorMethod) => Promise<TwoFactorSettings>;
    disableTwoFactor: () => Promise<void>;
    verifyTwoFactor: (challenge: TwoFactorChallenge) => Promise<TokenPair>;
    connectOAuthProvider: (provider: string) => Promise<OAuthProvider>;
    disconnectOAuthProvider: (providerId: string) => Promise<void>;
    setSelfExclusion: (days: number) => Promise<UserPermissions>;
    setLimits: (limits: Partial<UserPermissions>) => Promise<UserPermissions>;
}