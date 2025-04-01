/**
 * Authentication service for user authentication and session management
 */
import { BaseService, ServiceOptions, AuthenticationError } from '../serviceInterface';
import HttpClient from '../httpClient';
import {
    AuthCredentials,
    LoginResponse,
    RegistrationData,
    TokenPair,
    UserProfile,
    EmailVerificationData,
    PasswordResetRequest,
    PasswordResetConfirmation,
    UpdateProfileRequest,
    TwoFactorMethod,
    TwoFactorSettings,
    TwoFactorChallenge
} from '../../types/authTypes';

export interface AuthServiceConfig extends ServiceOptions {
    apiUrl: string;
    tokenStorageKey?: string;
    refreshTokenStorageKey?: string;
}

class AuthService extends BaseService {
    private static instance: AuthService;
    private readonly httpClient: HttpClient;
    private readonly tokenStorageKey: string;
    private readonly refreshTokenStorageKey: string;
    private currentUser: UserProfile | null = null;
    private tokens: TokenPair | null = null;
    private refreshPromise: Promise<TokenPair> | null = null;

    private constructor(config: AuthServiceConfig) {
        super(config);

        this.tokenStorageKey = config.tokenStorageKey || 'blackjack_auth_token';
        this.refreshTokenStorageKey = config.refreshTokenStorageKey || 'blackjack_refresh_token';

        this.httpClient = HttpClient.getInstance({
            baseUrl: config.apiUrl,
            authTokenProvider: this.getAccessToken.bind(this),
            timeout: config.timeout
        });
    }

    public static getInstance(config?: AuthServiceConfig): AuthService {
        if (!AuthService.instance) {
            if (!config) {
                throw new Error('AuthService must be initialized with a configuration');
            }
            AuthService.instance = new AuthService(config);
        }
        return AuthService.instance;
    }

    protected async initializeImpl(): Promise<void> {
        // Try to load tokens from storage
        await this.loadTokensFromStorage();

        // If we have tokens, try to refresh and get the current user
        if (this.tokens) {
            try {
                await this.refreshToken();
                await this.getCurrentUser();
                this.log('Auth service initialized with existing tokens');
            } catch (error) {
                this.logError('Failed to initialize with existing tokens', error);
                this.clearTokens();
            }
        } else {
            this.log('Auth service initialized without existing tokens');
        }
    }

    protected async resetImpl(): Promise<void> {
        this.clearTokens();
        this.currentUser = null;
        this.log('Auth service reset');
    }

    /**
     * Login with email and password
     */
    public async login(credentials: AuthCredentials): Promise<UserProfile> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<LoginResponse>(
                '/auth/login',
                credentials
            );

            this.setTokens({
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: response.expiresAt
            });

            this.currentUser = response.user;

            return response.user;
        });
    }

    /**
     * Register a new user
     */
    public async register(data: RegistrationData): Promise<UserProfile> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<LoginResponse>(
                '/auth/register',
                data
            );

            this.setTokens({
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: response.expiresAt
            });

            this.currentUser = response.user;

            return response.user;
        });
    }

    /**
     * Logout the current user
     */
    public async logout(): Promise<void> {
        if (!this.tokens) {
            return;
        }

        try {
            await this.httpClient.post(
                '/auth/logout',
                { refreshToken: this.tokens.refreshToken }
            );
        } catch (error) {
            // Continue with logout even if API call fails
            this.logError('Error during logout', error);
        } finally {
            this.clearTokens();
            this.currentUser = null;
        }
    }

    /**
     * Get the current user profile
     */
    public async getCurrentUser(): Promise<UserProfile | null> {
        if (!this.tokens) {
            return null;
        }

        try {
            const response = await this.httpClient.get<{ user: UserProfile }>(
                '/auth/me'
            );

            this.currentUser = response.user;
            return this.currentUser;
        } catch (error) {
            if (error instanceof AuthenticationError) {
                this.clearTokens();
                this.currentUser = null;
            }
            throw error;
        }
    }

    /**
     * Check if the user is authenticated
     */
    public isAuthenticated(): boolean {
        return !!this.tokens && this.isTokenValid();
    }

    /**
     * Get the current user (from memory, doesn't make API call)
     */
    public getUser(): UserProfile | null {
        return this.currentUser;
    }

    /**
     * Refresh the access token
     */
    public async refreshToken(): Promise<TokenPair> {
        // If there's already a refresh in progress, return that promise
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        if (!this.tokens?.refreshToken) {
            throw new AuthenticationError('No refresh token available');
        }

        // Create a new refresh promise
        this.refreshPromise = this.withRetry(async () => {
            const response = await this.httpClient.post<{ accessToken: string; refreshToken: string; expiresAt: number }>(
                '/auth/refresh',
                { refreshToken: this.tokens?.refreshToken }
            );

            const newTokens = {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: response.expiresAt
            };

            this.setTokens(newTokens);
            return newTokens;
        });

        try {
            // Wait for the refresh to complete
            return await this.refreshPromise;
        } finally {
            // Clear the promise when done
            this.refreshPromise = null;
        }
    }

    /**
     * Request a password reset
     */
    public async requestPasswordReset(email: string): Promise<void> {
        const request: PasswordResetRequest = { email };

        await this.withRetry(async () => {
            await this.httpClient.post(
                '/auth/password/reset',
                request
            );
        });
    }

    /**
     * Confirm a password reset
     */
    public async confirmPasswordReset(data: PasswordResetConfirmation): Promise<void> {
        await this.withRetry(async () => {
            await this.httpClient.post(
                '/auth/password/reset/confirm',
                data
            );
        });
    }

    /**
     * Verify email address
     */
    public async verifyEmail(data: EmailVerificationData): Promise<void> {
        await this.withRetry(async () => {
            await this.httpClient.post(
                '/auth/email/verify',
                data
            );
        });
    }

    /**
     * Update user profile
     */
    public async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
        return this.withRetry(async () => {
            const response = await this.httpClient.put<{ user: UserProfile }>(
                '/auth/profile',
                data
            );

            this.currentUser = response.user;
            return response.user;
        });
    }

    /**
     * Enable two-factor authentication
     */
    public async enableTwoFactor(method: TwoFactorMethod): Promise<TwoFactorSettings> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<{ twoFactor: TwoFactorSettings }>(
                '/auth/two-factor/enable',
                { method }
            );

            return response.twoFactor;
        });
    }

    /**
     * Disable two-factor authentication
     */
    public async disableTwoFactor(): Promise<void> {
        await this.withRetry(async () => {
            await this.httpClient.post(
                '/auth/two-factor/disable',
                {}
            );
        });
    }

    /**
     * Verify two-factor authentication
     */
    public async verifyTwoFactor(challenge: TwoFactorChallenge): Promise<TokenPair> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<{ accessToken: string; refreshToken: string; expiresAt: number }>(
                '/auth/two-factor/verify',
                challenge
            );

            const newTokens = {
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresAt: response.expiresAt
            };

            this.setTokens(newTokens);
            return newTokens;
        });
    }

    /**
     * Get the access token (for use with other services)
     */
    public async getAccessToken(): Promise<string | null> {
        // If there's no token, return null
        if (!this.tokens) {
            return null;
        }

        // If the token is expired or about to expire, refresh it
        if (!this.isTokenValid()) {
            try {
                await this.refreshToken();
            } catch (error) {
                this.logError('Failed to refresh token', error);
                this.clearTokens();
                return null;
            }
        }

        return this.tokens.accessToken;
    }

    private isTokenValid(): boolean {
        if (!this.tokens?.expiresAt) {
            return false;
        }

        // Check if the token is expired or about to expire (within 60 seconds)
        const now = Date.now();
        const expiresAt = this.tokens.expiresAt;
        const timeToExpire = expiresAt - now;

        return timeToExpire > 60 * 1000; // 60 seconds buffer
    }

    private async loadTokensFromStorage(): Promise<void> {
        try {
            const tokenJson = localStorage.getItem(this.tokenStorageKey);
            const refreshTokenJson = localStorage.getItem(this.refreshTokenStorageKey);

            if (tokenJson && refreshTokenJson) {
                const token = JSON.parse(tokenJson);
                const refreshToken = JSON.parse(refreshTokenJson);
                const expiresAt = parseInt(localStorage.getItem(`${this.tokenStorageKey}_expires`) || '0', 10);

                this.tokens = {
                    accessToken: token,
                    refreshToken: refreshToken,
                    expiresAt: expiresAt
                };
            }
        } catch (error) {
            this.logError('Failed to load tokens from storage', error);
            this.clearTokens();
        }
    }

    private setTokens(tokens: TokenPair): void {
        this.tokens = tokens;

        try {
            localStorage.setItem(this.tokenStorageKey, JSON.stringify(tokens.accessToken));
            localStorage.setItem(this.refreshTokenStorageKey, JSON.stringify(tokens.refreshToken));
            localStorage.setItem(`${this.tokenStorageKey}_expires`, tokens.expiresAt.toString());
        } catch (error) {
            this.logError('Failed to save tokens to storage', error);
        }
    }

    private clearTokens(): void {
        this.tokens = null;

        try {
            localStorage.removeItem(this.tokenStorageKey);
            localStorage.removeItem(this.refreshTokenStorageKey);
            localStorage.removeItem(`${this.tokenStorageKey}_expires`);
        } catch (error) {
            this.logError('Failed to clear tokens from storage', error);
        }
    }
}

export default AuthService;