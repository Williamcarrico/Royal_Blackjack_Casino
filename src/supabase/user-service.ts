import { createClient } from '@/lib/supabase/client'
import { TransactionType } from '@/types/authTypes'
import { SupabaseClient } from '@supabase/supabase-js'

// Enhanced type definitions
export interface UserStats {
    balance: number
    totalGames: number
    totalWins: number
    totalHands: number
}

export interface DatabaseProfile {
    id: string
    balance: number
    total_games?: number
    total_wins?: number
    total_hands?: number
}

export interface TransactionDetails {
    userId: string
    amount: number
    type: TransactionType
    gameId?: string
    description?: string
}

export class UserServiceError extends Error {
    public code: string
    public originalError?: unknown

    constructor(message: string, code: string, originalError?: unknown) {
        super(message)
        this.name = 'UserServiceError'
        this.code = code
        this.originalError = originalError
    }
}

// Define error codes
export const UserErrorCodes = {
    PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
    UPDATE_FAILED: 'UPDATE_FAILED',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

// Type definitions for RPC function parameters
interface UpdateBalanceParams {
    p_user_id: string
    p_amount: number
    p_type: TransactionType
    p_game_id: string | null
    p_description: string | null
}

interface IncrementStatsParams {
    p_user_id: string
    p_total_games: number
    p_total_hands: number
    p_total_wins: number
}

// Client instance cache
let supabaseClientInstance: ReturnType<typeof createClient>

/**
 * Get a cached Supabase client instance
 */
const getSupabaseClient = (): SupabaseClient => {
    if (!supabaseClientInstance) {
        supabaseClientInstance = createClient()
    }
    return supabaseClientInstance
}

/**
 * Safely checks if an error message contains specific text
 */
const errorMessageIncludes = (error: unknown, searchText: string): boolean => {
    if (!error) return false

    if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof error.message === 'string') {
            return error.message.includes(searchText)
        }
    }

    return false
}

/**
 * Update a user's balance and record the transaction
 */
export const updateUserBalance = async ({
    userId,
    amount,
    type,
    gameId,
    description
}: TransactionDetails): Promise<number> => {
    const supabase = getSupabaseClient()

    try {
        // Get current balance
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single()

        if (fetchError) {
            throw new UserServiceError(
                'Failed to fetch user profile',
                UserErrorCodes.PROFILE_NOT_FOUND,
                fetchError
            )
        }

        if (!profile) {
            throw new UserServiceError(
                'User profile not found',
                UserErrorCodes.PROFILE_NOT_FOUND
            )
        }

        // Validate amount (prevent negative balance if applicable)
        const newBalance = profile.balance + amount
        if (type !== 'deposit' && type !== 'win' && type !== 'bonus' && newBalance < 0) {
            throw new UserServiceError(
                'Insufficient balance for this transaction',
                UserErrorCodes.INSUFFICIENT_BALANCE
            )
        }

        try {
            // Use a transaction to ensure data consistency
            const params: UpdateBalanceParams = {
                p_user_id: userId,
                p_amount: amount,
                p_type: type,
                p_game_id: gameId || null,
                p_description: description || null,
            }

            const { data, error } = await supabase
                .rpc('update_balance_with_transaction', params)

            if (error) {
                throw new UserServiceError(
                    'Failed to update balance',
                    UserErrorCodes.UPDATE_FAILED,
                    error
                )
            }

            // Cast data to expected return type
            const result = data as unknown as { new_balance: number }
            return result?.new_balance || newBalance
        } catch (rpcError) {
            // If RPC doesn't exist, fall back to manual update
            if (
                rpcError instanceof UserServiceError &&
                rpcError.originalError &&
                errorMessageIncludes(rpcError.originalError, 'function "update_balance_with_transaction" does not exist')
            ) {
                return updateUserBalanceManual({
                    userId,
                    amount,
                    type,
                    gameId,
                    description
                })
            }
            throw rpcError
        }
    } catch (error) {
        // Handle known errors
        if (error instanceof UserServiceError) {
            throw error
        }

        // Handle unknown errors
        throw new UserServiceError(
            'Unknown error updating user balance',
            UserErrorCodes.UNKNOWN_ERROR,
            error
        )
    }
}

/**
 * Get user statistics including balance
 */
export const getUserStats = async (userId: string): Promise<UserStats> => {
    const supabase = getSupabaseClient()

    try {
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('chips, total_games, total_wins, total_hands')
            .eq('id', userId)
            .single()

        if (error) {
            throw new UserServiceError(
                'Failed to fetch user statistics',
                UserErrorCodes.PROFILE_NOT_FOUND,
                error
            )
        }

        // Return default values if profile doesn't exist
        if (!profile) {
            return {
                balance: 0,
                totalGames: 0,
                totalWins: 0,
                totalHands: 0
            }
        }

        return {
            balance: profile.chips ?? 0,
            totalGames: profile.total_games ?? 0,
            totalWins: profile.total_wins ?? 0,
            totalHands: profile.total_hands ?? 0
        }
    } catch (error) {
        if (error instanceof UserServiceError) {
            throw error
        }

        throw new UserServiceError(
            'Unknown error fetching user stats',
            UserErrorCodes.UNKNOWN_ERROR,
            error
        )
    }
}

// Fallback implementation for environments without the stored procedure
export const updateUserBalanceManual = async ({
    userId,
    amount,
    type,
    gameId,
    description
}: TransactionDetails): Promise<number> => {
    const supabase = getSupabaseClient()

    try {
        // Start transaction (simulation - Supabase client doesn't support true transactions)
        // Get current balance
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single()

        if (fetchError) {
            throw new UserServiceError(
                'Failed to fetch user profile',
                UserErrorCodes.PROFILE_NOT_FOUND,
                fetchError
            )
        }

        if (!profile) {
            throw new UserServiceError(
                'User profile not found',
                UserErrorCodes.PROFILE_NOT_FOUND
            )
        }

        // Calculate new balance
        const newBalance = profile.balance + amount

        // Update user balance
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId)

        if (updateError) {
            throw new UserServiceError(
                'Failed to update balance',
                UserErrorCodes.UPDATE_FAILED,
                updateError
            )
        }

        // Record the transaction
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                amount,
                type,
                game_id: gameId,
                description,
                balance: newBalance,
                status: 'completed',
                timestamp: new Date().toISOString()
            })

        if (transactionError) {
            // In a production environment, we should roll back here
            console.error('Error recording transaction:', transactionError)
        }

        return newBalance
    } catch (error) {
        if (error instanceof UserServiceError) {
            throw error
        }

        throw new UserServiceError(
            'Unknown error updating user balance',
            UserErrorCodes.UNKNOWN_ERROR,
            error
        )
    }
}

/**
 * Try to update user stats using the RPC function
 */
const updateStatsViaRpc = async (
    supabase: SupabaseClient,
    userId: string,
    isWin: boolean
): Promise<void> => {
    const params: IncrementStatsParams = {
        p_user_id: userId,
        p_total_games: 1,
        p_total_hands: 1,
        p_total_wins: isWin ? 1 : 0
    }

    const { error } = await supabase.rpc('increment_user_stats', params)

    if (error) {
        throw new UserServiceError(
            'Failed to update user game statistics',
            UserErrorCodes.UPDATE_FAILED,
            error
        )
    }
}

/**
 * Fallback method to update user stats directly in the database
 */
const updateStatsDirect = async (
    supabase: SupabaseClient,
    userId: string,
    isWin: boolean
): Promise<void> => {
    const updates: Record<string, number> = {}

    // Get current stats
    const { data: profile } = await supabase
        .from('profiles')
        .select('total_games, total_hands, total_wins')
        .eq('id', userId)
        .single()

    if (!profile) return

    updates.total_games = (profile.total_games || 0) + 1
    updates.total_hands = (profile.total_hands || 0) + 1

    if (isWin) {
        updates.total_wins = (profile.total_wins || 0) + 1
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

    if (updateError) {
        throw new UserServiceError(
            'Failed to update user game statistics directly',
            UserErrorCodes.UPDATE_FAILED,
            updateError
        )
    }
}

/**
 * Check if error is due to missing RPC function
 */
const isMissingRpcError = (error: unknown): boolean => {
    return (
        error instanceof UserServiceError &&
        !!error.originalError &&
        errorMessageIncludes(error.originalError, 'function "increment_user_stats" does not exist')
    )
}

/**
 * Handle general errors in user stats updates
 */
const handleUserStatsError = (error: unknown): never => {
    if (error instanceof UserServiceError) {
        throw error
    }

    throw new UserServiceError(
        'Unknown error updating user game stats',
        UserErrorCodes.UNKNOWN_ERROR,
        error
    )
}

/**
 * Update user game statistics
 */
export const updateUserGameStats = async (
    userId: string,
    isWin: boolean
): Promise<void> => {
    const supabase = getSupabaseClient()

    try {
        await updateStatsViaRpc(supabase, userId, isWin)
        return
    } catch (error) {
        if (!isMissingRpcError(error)) {
            handleUserStatsError(error)
        }
    }

    // Fallback to direct update if RPC failed with specific error
    try {
        await updateStatsDirect(supabase, userId, isWin)
    } catch (error) {
        handleUserStatsError(error)
    }
}

// For backwards compatibility
export const UserService = {
    updateUserBalance: async (
        userId: string,
        amount: number,
        type: TransactionType,
        gameId?: string,
        description?: string
    ): Promise<boolean> => {
        try {
            await updateUserBalance({
                userId,
                amount,
                type,
                gameId,
                description
            })
            return true
        } catch (error) {
            console.error('Error in updateUserBalance:', error)
            return false
        }
    },

    getUserStats
}