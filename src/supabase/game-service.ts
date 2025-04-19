import { createClient } from '@/lib/supabase/client'
import { GameStats } from '@/types/gameState'
import { v4 as uuidv4 } from 'uuid'

interface GameSession {
    id: string
    user_id: string
    start_time: string
    end_time: string | null
    starting_chips: number
    ending_chips: number | null
    hands_played: number
    wins: number
    losses: number
    pushes: number
    blackjacks: number
}

export class GameService {
    /**
     * Create a new game session
     */
    static async createSession(userId: string, startingChips: number): Promise<string> {
        try {
            const supabase = createClient()
            const sessionId = uuidv4()

            const { error } = await supabase
                .from('game_sessions')
                .insert({
                    id: sessionId,
                    user_id: userId,
                    start_time: new Date().toISOString(),
                    starting_chips: startingChips
                })

            if (error) {
                console.error('Error creating game session:', error)
                throw error
            }

            return sessionId
        } catch (error) {
            console.error('Error in createSession:', error)
            throw error
        }
    }

    /**
     * Update a game session with final stats
     */
    static async updateSession(sessionId: string, gameStats: GameStats): Promise<boolean> {
        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('game_sessions')
                .update({
                    end_time: new Date().toISOString(),
                    ending_chips: gameStats.endingChips,
                    hands_played: gameStats.handsPlayed,
                    wins: gameStats.wins,
                    losses: gameStats.losses,
                    pushes: gameStats.pushes,
                    blackjacks: gameStats.blackjacks
                })
                .eq('id', sessionId)

            if (error) {
                console.error('Error updating game session:', error)
                return false
            }

            return true
        } catch (error) {
            console.error('Error in updateSession:', error)
            return false
        }
    }

    /**
     * Get user's game sessions
     */
    static async getUserSessions(userId: string): Promise<GameSession[]> {
        try {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('start_time', { ascending: false })

            if (error) {
                console.error('Error fetching user sessions:', error)
                return []
            }

            return data as GameSession[]
        } catch (error) {
            console.error('Error in getUserSessions:', error)
            return []
        }
    }

    /**
     * Record a completed hand
     */
    static async recordHand({
        sessionId,
        userId,
        betAmount,
        playerCards,
        dealerCards,
        actions,
        result,
        payout,
        sideBets
    }: {
        sessionId: string,
        userId: string,
        betAmount: number,
        playerCards: any[],
        dealerCards: any[],
        actions: string[],
        result: string,
        payout: number,
        sideBets?: { type: string; amount: number; payout?: number }[]
    }): Promise<string> {
        try {
            const supabase = createClient()
            const handId = uuidv4()

            const { error } = await supabase
                .from('game_hands')
                .insert({
                    id: handId,
                    session_id: sessionId,
                    user_id: userId,
                    bet_amount: betAmount,
                    player_cards: playerCards,
                    dealer_cards: dealerCards,
                    actions: actions,
                    result: result,
                    payout: payout,
                    side_bets: sideBets || [],
                    created_at: new Date().toISOString()
                })

            if (error) {
                console.error('Error recording hand:', error)
                throw error
            }

            return handId
        } catch (error) {
            console.error('Error in recordHand:', error)
            throw error
        }
    }
}