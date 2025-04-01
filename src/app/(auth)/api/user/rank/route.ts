import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 300000

interface UserRankData {
    userId: string;
    username: string;
    rank: number | null;
    totalUsers: number;
    percentile: number | null;
    metrics: {
        balance: number;
        winRate: number;
        gamesPlayed: number;
        totalWins: number;
    }
}

const userRankCache = new Map<string, { data: UserRankData; timestamp: number }>()

export async function GET(_request: NextRequest) {
    try {
        const supabase = createClient()

        // Get current authenticated user
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const userId = session.user.id

        // Check cache first
        const cachedRank = userRankCache.get(userId)
        if (cachedRank && Date.now() - cachedRank.timestamp < CACHE_DURATION) {
            return NextResponse.json(cachedRank.data)
        }

        // Get user profile data
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, balance, total_games, total_wins, total_hands')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            console.error('Error fetching user profile:', profileError)
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
        }

        // Get all users ordered by balance to determine rank
        const { data: allUsers, error: rankError } = await supabase
            .from('profiles')
            .select('id, balance')
            .order('balance', { ascending: false })

        if (rankError) {
            console.error('Error fetching user ranks:', rankError)
            return NextResponse.json({ error: 'Failed to fetch rank data' }, { status: 500 })
        }

        // Calculate rank and percentile
        const userIndex = allUsers.findIndex(user => user.id === userId)
        const rank = userIndex !== -1 ? userIndex + 1 : null
        const totalUsers = allUsers.length
        const percentile = rank ? Math.round(((totalUsers - rank) / totalUsers) * 100) : null

        // Calculate win rate
        const winRate = profile.total_hands > 0
            ? (profile.total_wins / profile.total_hands) * 100
            : 0

        // Build user rank data object
        const userRankData = {
            userId,
            username: profile.username,
            rank,
            totalUsers,
            percentile,
            metrics: {
                balance: profile.balance || 0,
                winRate,
                gamesPlayed: profile.total_games || 0,
                totalWins: profile.total_wins || 0
            }
        }

        // Store in cache
        userRankCache.set(userId, {
            data: userRankData,
            timestamp: Date.now()
        })

        return NextResponse.json(userRankData)
    } catch (error) {
        console.error('Unexpected error in user rank API:', error)
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
}