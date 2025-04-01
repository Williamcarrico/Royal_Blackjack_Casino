/**
 * Game API service for interacting with the backend game engine
 */
import { BaseService, ServiceOptions } from '../serviceInterface';
import HttpClient from '../httpClient';
import {
    CreateGameRequest,
    CreateGameResponse,
    PlaceBetRequest,
    PlaceBetResponse,
    GameActionRequest,
    GameActionResponse,
    GetGameStateResponse,
    GameHistoryResponse,
    AvailableGamesResponse
} from '../../types/apiTypes';
import {
    GameState,
    GameOptions,
    GameVariant,
    GameAction
} from '../../types/gameTypes';
import { HandAction } from '../../types/handTypes';
import { Bet, SideBetType } from '../../types/betTypes';
import { Hand } from '../../types/handTypes';
import { Card } from '../../types/cardTypes';

export interface GameServiceConfig extends ServiceOptions {
    apiUrl: string;
    authTokenProvider?: () => Promise<string | null>;
}

class GameService extends BaseService {
    private static instance: GameService;
    private readonly httpClient: HttpClient;
    private readonly gameCache: Map<string, GameState> = new Map();

    private constructor(config: GameServiceConfig) {
        super(config);

        this.httpClient = HttpClient.getInstance({
            baseUrl: config.apiUrl,
            authTokenProvider: config.authTokenProvider,
            timeout: config.timeout
        });
    }

    public static getInstance(config?: GameServiceConfig): GameService {
        if (!GameService.instance) {
            if (!config) {
                throw new Error('GameService must be initialized with a configuration');
            }
            GameService.instance = new GameService(config);
        }
        return GameService.instance;
    }

    protected async initializeImpl(): Promise<void> {
        // Initialization logic if needed
        this.log('Game service initialized');
    }

    protected async resetImpl(): Promise<void> {
        this.gameCache.clear();
        this.log('Game service reset');
    }

    /**
     * Create a new game with specified options
     */
    public async createGame(options: {
        variant: GameVariant;
        gameOptions?: Partial<GameOptions>;
        playerNames?: string[];
        initialBalance?: number;
    }): Promise<{ gameId: string; gameState: GameState }> {
        const request: CreateGameRequest = {
            variant: options.variant,
            options: options.gameOptions,
            playerNames: options.playerNames,
            initialBalance: options.initialBalance
        };

        return this.withRetry(async () => {
            const response = await this.httpClient.post<CreateGameResponse>(
                '/games',
                request
            );

            // Cache the game state
            this.gameCache.set(response.data.gameId, response.data.gameState);

            return response.data;
        });
    }

    /**
     * Place a bet in a game
     */
    public async placeBet(
        gameId: string,
        playerId: string,
        amount: number,
        sideBets?: Array<{ type: SideBetType; amount: number }>
    ): Promise<{ bet: Bet; playerBalance: number; gameState: GameState }> {
        const request: PlaceBetRequest = {
            gameId,
            playerId,
            amount,
            sideBets
        };

        return this.withRetry(async () => {
            const response = await this.httpClient.post<PlaceBetResponse>(
                `/games/${gameId}/bets`,
                request
            );

            // Update the cached game state
            this.gameCache.set(gameId, response.data.gameState);

            return response.data;
        });
    }

    /**
     * Perform a game action (hit, stand, double, split, etc.)
     */
    public async performAction(
        gameId: string,
        playerId: string,
        handId: string,
        action: HandAction,
        amount?: number
    ): Promise<{ action: GameAction; hand?: Hand; card?: Card; gameState: GameState }> {
        const request: GameActionRequest = {
            gameId,
            playerId,
            handId,
            action,
            amount
        };

        return this.withRetry(async () => {
            const response = await this.httpClient.post<GameActionResponse>(
                `/games/${gameId}/actions`,
                request
            );

            // Update the cached game state
            this.gameCache.set(gameId, response.data.gameState);

            return response.data;
        });
    }

    /**
     * Get the current state of a game
     */
    public async getGameState(gameId: string): Promise<GameState> {
        // Check cache first
        const cachedState = this.gameCache.get(gameId);

        if (cachedState) {
            return cachedState;
        }

        return this.withRetry(async () => {
            const response = await this.httpClient.get<GetGameStateResponse>(
                `/games/${gameId}`
            );

            // Cache the game state
            this.gameCache.set(gameId, response.data.gameState);

            return response.data.gameState;
        });
    }

    /**
     * Get the history of a completed game
     */
    public async getGameHistory(gameId: string): Promise<GameHistoryResponse['data']> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<GameHistoryResponse>(
                `/games/${gameId}/history`
            );

            return response.data;
        });
    }

    /**
     * Get a list of available games
     */
    public async getAvailableGames(): Promise<AvailableGamesResponse['data']> {
        return this.withRetry(async () => {
            const response = await this.httpClient.get<AvailableGamesResponse>(
                '/games/available'
            );

            return response.data;
        });
    }

    /**
     * Join an existing game
     */
    public async joinGame(
        gameId: string,
        playerName: string,
        initialBalance?: number
    ): Promise<GameState> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<GetGameStateResponse>(
                `/games/${gameId}/join`,
                {
                    playerName,
                    initialBalance
                }
            );

            // Cache the game state
            this.gameCache.set(gameId, response.data.gameState);

            return response.data.gameState;
        });
    }

    /**
     * Leave a game
     */
    public async leaveGame(gameId: string, playerId: string): Promise<GameState> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<GetGameStateResponse>(
                `/games/${gameId}/leave`,
                { playerId }
            );

            // Cache the game state
            this.gameCache.set(gameId, response.data.gameState);

            return response.data.gameState;
        });
    }

    /**
     * End a game
     */
    public async endGame(gameId: string): Promise<GameState> {
        return this.withRetry(async () => {
            const response = await this.httpClient.post<GetGameStateResponse>(
                `/games/${gameId}/end`,
                {}
            );

            // Cache the game state
            this.gameCache.set(gameId, response.data.gameState);

            return response.data.gameState;
        });
    }

    /**
     * Invalidate cached game state
     */
    public invalidateGameCache(gameId: string): void {
        this.gameCache.delete(gameId);
    }
}

export default GameService;