/**
 * Statistics service for game analytics and stats
 */
import { BaseService, ServiceOptions } from '../serviceInterface';
import HttpClient from '../httpClient';
import {
    LeaderboardResponse,
    GameHistoryResponse
} from '../../types/apiTypes';
import { GameSession, RoundAnalytics, ActionAnalytics, PlayerAnalytics } from '../../hooks/analytics/useGameAnalytics';

export interface StatsServiceConfig extends ServiceOptions {
    apiUrl: string;
    authTokenProvider: () => Promise<string | null>;
}

class StatsService extends BaseService {
    private static instance: StatsService;
    private readonly httpClient: HttpClient;
    private readonly leaderboardCache: Map<string, LeaderboardResponse['data']> = new Map();
    private readonly gameHistoryCache: Map<string, GameHistoryResponse['data']> = new Map();

    private constructor(config: StatsServiceConfig) {
        super(config);

        this.httpClient = HttpClient.getInstance({
            baseUrl: config.apiUrl,
            authTokenProvider: config.authTokenProvider,
            timeout: config.timeout
        });
    }

    public static getInstance(config?: StatsServiceConfig): StatsService {
        if (!StatsService.instance) {
            if (!config) {
                throw new Error('StatsService must be initialized with a configuration');
            }
            StatsService.instance = new StatsService(config);
        }
        return StatsService.instance;
    }

    protected async initializeImpl(): Promise<void> {
        this.log('Statistics service initialized');
    }

    protected async resetImpl(): Promise<void> {
        this.leaderboardCache.clear();
        this.gameHistoryCache.clear();
        this.log('Statistics service reset');
    }

    /**
     * Get global game statistics
     */
    public async getGlobalStats(): Promise<{
        totalGames: number;
        totalHands: number;
        totalBetsAmount: number;
        totalWinningsAmount: number;
        houseEdge: number;
        mostPopularVariant: string;
        biggestWin: {
            amount: number;
            userId: string;
            gameId: string;
            timestamp: string;
        };
    }> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{
                data: {
                    totalGames: number;
                    totalHands: number;
                    totalBetsAmount: number;
                    totalWinningsAmount: number;
                    houseEdge: number;
                    mostPopularVariant: string;
                    biggestWin: {
                        amount: number;
                        userId: string;
                        gameId: string;
                        timestamp: string;
                    };
                };
            }>('/stats/global');

            return response.data;
        });
    }

    /**
     * Get leaderboard by timeframe
     */
    public async getLeaderboard(
        timeframe: 'daily' | 'weekly' | 'monthly' | 'allTime' = 'allTime'
    ): Promise<LeaderboardResponse['data']> {
        // Check cache first
        const cachedLeaderboard = this.leaderboardCache.get(timeframe);

        if (cachedLeaderboard) {
            return cachedLeaderboard;
        }

        return this.withRetry(async () => {
            const response = await this.httpClient.get<LeaderboardResponse>(
                '/stats/leaderboard',
                { params: { timeframe } }
            );

            // Cache the leaderboard
            this.leaderboardCache.set(timeframe, response.data);

            return response.data;
        });
    }

    /**
     * Get game history
     */
    public async getGameHistory(gameId: string): Promise<GameHistoryResponse['data']> {
        // Check cache first
        const cachedHistory = this.gameHistoryCache.get(gameId);

        if (cachedHistory) {
            return cachedHistory;
        }

        return this.withRetry(async () => {
            const response = await this.httpClient.get<GameHistoryResponse>(
                `/stats/games/${gameId}/history`
            );

            // Cache the game history
            this.gameHistoryCache.set(gameId, response.data);

            return response.data;
        });
    }

    /**
     * Get player game history
     */
    public async getPlayerGameHistory(
        playerId: string,
        limit: number = 10,
        offset: number = 0
    ): Promise<{
        games: Array<{
            gameId: string;
            variant: string;
            startTime: string;
            endTime?: string;
            handsPlayed: number;
            netWinnings: number;
        }>;
        total: number;
    }> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{
                data: {
                    games: Array<{
                        gameId: string;
                        variant: string;
                        startTime: string;
                        endTime?: string;
                        handsPlayed: number;
                        netWinnings: number;
                    }>;
                    total: number;
                };
            }>(
                `/stats/players/${playerId}/games`,
                { params: { limit, offset } }
            );

            return response.data;
        });
    }

    /**
     * Submit game session analytics
     */
    public async submitGameSession(session: GameSession): Promise<void> {
        await this.withRetry(async () => {
            await this.httpClient.post(
                '/stats/sessions',
                { session }
            );
        });
    }

    /**
     * Submit round analytics
     */
    public async submitRoundAnalytics(gameId: string, round: RoundAnalytics): Promise<void> {
        await this.withRetry(async () => {
            await this.httpClient.post(
                `/stats/games/${gameId}/rounds`,
                { round }
            );
        });
    }

    /**
     * Get player statistics
     */
    public async getPlayerStatistics(playerId: string): Promise<PlayerAnalytics> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{ data: PlayerAnalytics }>(
                `/stats/players/${playerId}`
            );

            return response.data;
        });
    }

    /**
     * Get action success rates
     */
    public async getActionAnalytics(): Promise<ActionAnalytics[]> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{ data: ActionAnalytics[] }>(
                '/stats/actions'
            );

            return response.data;
        });
    }

    /**
     * Get variant popularity
     */
    public async getVariantPopularity(): Promise<Array<{
        variant: string;
        count: number;
        percentage: number;
    }>> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{
                data: Array<{
                    variant: string;
                    count: number;
                    percentage: number;
                }>;
            }>('/stats/variants');

            return response.data;
        });
    }

    /**
     * Get betting statistics
     */
    public async getBettingStats(): Promise<{
        averageBetSize: number;
        totalBets: number;
        totalWagered: number;
        totalPaidOut: number;
        houseEdge: number;
        mostCommonBetSize: number;
        largestBet: {
            amount: number;
            userId: string;
            gameId: string;
            timestamp: string;
        };
    }> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<{
                data: {
                    averageBetSize: number;
                    totalBets: number;
                    totalWagered: number;
                    totalPaidOut: number;
                    houseEdge: number;
                    mostCommonBetSize: number;
                    largestBet: {
                        amount: number;
                        userId: string;
                        gameId: string;
                        timestamp: string;
                    };
                };
            }>('/stats/betting');

            return response.data;
        });
    }

    /**
     * Invalidate leaderboard cache
     */
    public invalidateLeaderboardCache(timeframe?: 'daily' | 'weekly' | 'monthly' | 'allTime'): void {
        if (timeframe) {
            this.leaderboardCache.delete(timeframe);
        } else {
            this.leaderboardCache.clear();
        }
    }

    /**
     * Invalidate game history cache
     */
    public invalidateGameHistoryCache(gameId?: string): void {
        if (gameId) {
            this.gameHistoryCache.delete(gameId);
        } else {
            this.gameHistoryCache.clear();
        }
    }
}

export default StatsService;