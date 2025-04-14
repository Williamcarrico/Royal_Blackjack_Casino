import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Type for query parameters
type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime'
type LeaderboardMetric = 'balance' | 'winRate' | 'gamesPlayed' | 'biggestWin'

// Define interfaces for type safety
interface ProfileData {
    id: string;
    username: string;
    avatar_url: string | null;
    total_games: number;
    total_wins: number;
    total_losses: number;
    total_hands: number;
    total_blackjacks: number;
    balance: number;
    created_at: string;
    biggest_win?: number;
    last_played_at?: string;
    chips?: number;
}

interface LeaderboardPlayer {
    id: string;
    rank: number;
    username: string;
    avatar: string;
    winnings: number;
    winRate: number;
    gamesPlayed: number;
    biggestWin: number;
    isVIP: boolean;
    lastActive: string;
}

// Cache the leaderboard data for 5 minutes (300000ms)
const CACHE_DURATION = 300000
let cachedLeaderboard: { leaderboard: LeaderboardPlayer[]; timestamp: number } | null = null

export async function GET(request: NextRequest) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const period = (searchParams.get('period') as LeaderboardPeriod) || 'weekly'
        const metric = (searchParams.get('metric') as LeaderboardMetric) || 'balance'
        const limit = Number(searchParams.get('limit')) || 10
        const search = searchParams.get('search') ?? ''

        // Check if we have a valid cache
        if (cachedLeaderboard && Date.now() - cachedLeaderboard.timestamp < CACHE_DURATION) {
            // If there's a search query, filter the cached results
            if (search) {
                const filteredLeaderboard = cachedLeaderboard.leaderboard.filter(
                    (player: LeaderboardPlayer) => player.username.toLowerCase().includes(search.toLowerCase())
                )
                return NextResponse.json({ leaderboard: filteredLeaderboard })
            }
            return NextResponse.json({ leaderboard: cachedLeaderboard.leaderboard })
        }

        const now = new Date()
        let startDate: Date | null = null

        switch (period) {
            case 'daily':
                startDate = new Date(now)
                startDate.setDate(now.getDate() - 1)
                break
            case 'weekly':
                startDate = new Date(now)
                startDate.setDate(now.getDate() - 7)
                break
            case 'monthly':
                startDate = new Date(now)
                startDate.setMonth(now.getMonth() - 1)
                break
            default:
                // All time - startDate remains null
        }

        // Base query for profiles with games data
        const supabase = await createServerClient(request, new NextResponse())
        let query = supabase
            .from('user_profiles')
            .select('id, username, avatar_url, chips, total_games, total_wins, total_hands')
            .order('chips', { ascending: false })
            .limit(limit)

        // Apply search filter if provided
        if (search) {
            query = query.ilike('username', `%${search}%`)
        }

        // Apply time-based filtering for specific periods
        if (startDate && period !== 'allTime') {
            const startTimestamp = startDate.toISOString()

            // For time-based metrics, we'll need to join with game_sessions
            // or create a materialized view with time-based aggregates
            // For now, since the frontend shows the time period selector, we'll use a simpler approach

            // This is a placeholder - you would implement more complex time filtering logic
            // e.g., joining with game sessions, filtering by game date, etc.
            query = query.gte('last_played_at', startTimestamp)
        }

        // Apply sorting based on metric (with optimized indexes)
        switch (metric) {
            case 'balance':
                query = query.order('chips', { ascending: false })
                break
            case 'winRate':
                // Using a computed column or function for win rate would be more efficient
                // For now, we'll fetch and calculate
                query = query.order('total_wins', { ascending: false })
                break
            case 'gamesPlayed':
                query = query.order('total_games', { ascending: false })
                break
            case 'biggestWin':
                query = query.order('biggest_win', { ascending: false })
                break
            default:
                query = query.order('chips', { ascending: false })
        }

        // Limit the number of results
        const { data, error } = await query

        if (error) {
            console.error('Error fetching leaderboard:', error)
            return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 })
        }

        // Process data to calculate win rates and add ranks
        const leaderboard = data.map((player: ProfileData, index: number) => {
            const winRate = player.total_hands > 0 ? (player.total_wins / player.total_hands) * 100 : 0

            return {
                id: player.id,
                rank: index + 1,
                username: player.username,
                avatar: player.avatar_url ?? '/avatars/default.jpg',
                winnings: player.chips ?? 0,
                winRate: parseFloat(winRate.toFixed(1)),
                gamesPlayed: player.total_games,
                biggestWin: player.biggest_win ?? player.total_blackjacks * 150, // Fallback calculation
                isVIP: (player.chips ?? 0) > 10000, // Example VIP threshold
                lastActive: player.last_played_at ?? player.created_at,
            }
        })

        // For win rate sorting, we need to re-sort after calculation
        if (metric === 'winRate') {
            leaderboard.sort((a: LeaderboardPlayer, b: LeaderboardPlayer) => b.winRate - a.winRate)
            // Reassign ranks after sorting
            leaderboard.forEach((player: LeaderboardPlayer, index: number) => {
                player.rank = index + 1
            })
        }

        // Cache the result
        cachedLeaderboard = {
            leaderboard,
            timestamp: Date.now()
        }

        return NextResponse.json({ leaderboard })
    } catch (error) {
        console.error('Unexpected error in leaderboard API:', error)
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
}