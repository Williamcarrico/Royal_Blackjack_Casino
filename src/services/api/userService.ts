/**
 * User service for handling user data and operations
 */
import { BaseService, ServiceOptions } from '../serviceInterface';
import HttpClient from '../httpClient';
import {
    UserProfile,
    Transaction,
    UpdateProfileRequest,
    UserPermissions,
    DepositRequest,
    WithdrawalRequest
} from '../../types/authTypes';
import {
    PlayerStatsRequest,
    PlayerStatsResponse,
    LeaderboardResponse
} from '../../types/apiTypes';

export interface UserServiceConfig extends ServiceOptions {
    apiUrl: string;
    authTokenProvider: () => Promise<string | null>;
}

class UserService extends BaseService {
    private static instance: UserService;
    private readonly httpClient: HttpClient;
    private readonly userCache: Map<string, UserProfile> = new Map();
    private readonly statsCache: Map<string, PlayerStatsResponse['data']> = new Map();

    private constructor(config: UserServiceConfig) {
        super(config);

        this.httpClient = HttpClient.getInstance({
            baseUrl: config.apiUrl,
            authTokenProvider: config.authTokenProvider,
            timeout: config.timeout
        });
    }

    public static getInstance(config?: UserServiceConfig): UserService {
        if (!UserService.instance) {
            if (!config) {
                throw new Error('UserService must be initialized with a configuration');
            }
            UserService.instance = new UserService(config);
        }
        return UserService.instance;
    }

    protected async initializeImpl(): Promise<void> {
        this.log('User service initialized');
    }

    protected async resetImpl(): Promise<void> {
        this.userCache.clear();
        this.statsCache.clear();
        this.log('User service reset');
    }

    /**
     * Get user profile by ID
     */
    public async getUserProfile(userId: string): Promise<UserProfile> {
        // Check cache first
        const cachedUser = this.userCache.get(userId);

        if (cachedUser) {
            return cachedUser;
        }

        return this.withRetry(async () => {
            const response = await this.httpClient.get<{ data: { user: UserProfile } }>(
                `/users/${userId}`
            );

            // Cache the user
            this.userCache.set(userId, response.data.user);

            return response.data.user;
        });
    }

    /**
     * Update user profile
     */
    public async updateUserProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile> {
        return this.withRetry(async () => {
            const response = await this.httpClient.put<{ data: { user: UserProfile } }>(
                `/users/${userId}`,
                data
            );

            // Update cache
            this.userCache.set(userId, response.data.user);

            return response.data.user;
        });
    }

    /**
     * Get user statistics
     */
    public async getUserStats(
        userId: string,
        timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'allTime'
    ): Promise<PlayerStatsResponse['data']> {
        // Check cache first
        const cacheKey = `${userId}_${timeframe}`;
        const cachedStats = this.statsCache.get(cacheKey);

        if (cachedStats) {
            return cachedStats;
        }

        const request: PlayerStatsRequest = {
            playerId: userId,
            timeframe
        };

        return this.withRetry(async () => {
            const response = await this.httpClient.get<{ data: PlayerStatsResponse['data'] }>(
                `/users/${userId}/stats`,
                { params: request as unknown as Record<string, string | number | boolean | undefined> }
            );

            // Cache the stats
            this.statsCache.set(cacheKey, response.data);

            return response.data;
        });
    }

    /**
     * Get user transaction history
     */
    public async getUserTransactions(userId: string): Promise<Transaction[]> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{ data: { transactions: Transaction[] } }>(
                `/users/${userId}/transactions`
            );

            return response.data.transactions;
        });
    }

    /**
     * Deposit funds to user account
     */
    public async deposit(userId: string, request: DepositRequest): Promise<Transaction> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<{ data: { transaction: Transaction } }>(
                `/users/${userId}/deposit`,
                request
            );

            // Invalidate user cache as balance has changed
            this.userCache.delete(userId);

            return response.data.transaction;
        });
    }

    /**
     * Withdraw funds from user account
     */
    public async withdraw(userId: string, request: WithdrawalRequest): Promise<Transaction> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<{ data: { transaction: Transaction } }>(
                `/users/${userId}/withdraw`,
                request
            );

            // Invalidate user cache as balance has changed
            this.userCache.delete(userId);

            return response.data.transaction;
        });
    }

    /**
     * Get user permissions
     */
    public async getUserPermissions(userId: string): Promise<UserPermissions> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{ data: { permissions: UserPermissions } }>(
                `/users/${userId}/permissions`
            );

            return response.data.permissions;
        });
    }

    /**
     * Update user permissions
     */
    public async updateUserPermissions(
        userId: string,
        permissions: Partial<UserPermissions>
    ): Promise<UserPermissions> {
        return this.withRetry(async () => {
            const response = await this.httpClient.put<{ data: { permissions: UserPermissions } }>(
                `/users/${userId}/permissions`,
                permissions
            );

            return response.data.permissions;
        });
    }

    /**
     * Set user self-exclusion
     */
    public async setSelfExclusion(userId: string, days: number): Promise<UserPermissions> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<{ data: { permissions: UserPermissions } }>(
                `/users/${userId}/self-exclusion`,
                { days }
            );

            return response.data.permissions;
        });
    }

    /**
     * Get leaderboard
     */
    public async getLeaderboard(
        timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'allTime'
    ): Promise<LeaderboardResponse['data']> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<LeaderboardResponse>(
                '/leaderboard',
                { params: { timeframe } }
            );

            return response.data;
        });
    }

    /**
     * Search for users
     */
    public async searchUsers(query: string): Promise<UserProfile[]> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{ data: { users: UserProfile[] } }>(
                '/users/search',
                { params: { query } }
            );

            // Cache the users
            response.data.users.forEach((user: UserProfile) => {
                this.userCache.set(user.id, user);
            });

            return response.data.users;
        });
    }

    /**
     * Invalidate user cache
     */
    public invalidateUserCache(userId: string): void {
        this.userCache.delete(userId);

        // Clear stats cache for this user
        const statsKeys = Array.from(this.statsCache.keys())
            .filter(key => key.startsWith(`${userId}_`));

        statsKeys.forEach(key => this.statsCache.delete(key));
    }
}

export default UserService;