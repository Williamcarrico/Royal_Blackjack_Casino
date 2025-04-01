import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@/types/authTypes'

interface UserStats {
    balance: number
    totalGames: number
    totalWins: number
    totalHands: number
}

export class UserService {
    /**
     * Update a user's balance and record the transaction
     */
    static async updateUserBalance(
        userId: string,
        amount: number,
        type: TransactionType,
        gameId?: string,
        description?: string
    ): Promise<boolean> {
        try {
            const supabase = createClient()

            // Get current balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', userId)
                .single()

            if (!profile) {
                console.error('User profile not found')
                return false
            }

            // Calculate new balance
            const newBalance = profile.balance + amount

            // Update user balance
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', userId)

            if (updateError) {
                console.error('Error updating balance:', updateError)
                return false
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
                    balance: newBalance
                })

            if (transactionError) {
                console.error('Error recording transaction:', transactionError)
                // Still consider this successful as the balance was updated
            }

            return true
        } catch (error) {
            console.error('Error in updateUserBalance:', error)
            return false
        }
    }

    /**
     * Get user statistics including balance
     */
    static async getUserStats(userId: string): Promise<UserStats> {
        try {
            const supabase = createClient()

            const { data: profile } = await supabase
                .from('profiles')
                .select('balance, total_games, total_wins, total_hands')
                .eq('id', userId)
                .single()

            if (!profile) {
                return {
                    balance: 0,
                    totalGames: 0,
                    totalWins: 0,
                    totalHands: 0
                }
            }

            return {
                balance: profile.balance || 0,
                totalGames: profile.total_games || 0,
                totalWins: profile.total_wins || 0,
                totalHands: profile.total_hands || 0
            }
        } catch (error) {
            console.error('Error in getUserStats:', error)
            return {
                balance: 0,
                totalGames: 0,
                totalWins: 0,
                totalHands: 0
            }
        }
    }
}