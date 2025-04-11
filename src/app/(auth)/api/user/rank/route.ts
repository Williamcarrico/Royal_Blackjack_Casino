import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { formatQueryResult } from '@/lib/utils/supabaseUtils'
import type { Database } from '@/types/supabase'

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

interface UserProfile {
    id: string;
    username?: string;
    chips?: number;
    total_games?: number;
    total_wins?: number;
    total_hands?: number;
}

// Type-safe cache with expiry
const userRankCache = new Map<string, { data: UserRankData; timestamp: number }>()

export async function GET(_request: NextRequest) {
    try {
        const supabase = await createServerClient<Database>()

        // Get current authenticated user
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
            return NextResponse.json({
                error: 'Failed to authenticate user',
                details: sessionError.message
            }, { status: 401 })
        }

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
        const profileResult = await supabase
            .from('user_profiles')
            .select('id, username, chips, total_games, total_wins, total_hands')
            .eq('id', userId)
            .single()

        // Format the response with error handling
        const { data: profile, error: profileError, success: profileSuccess } = formatQueryResult<UserProfile>(profileResult, {
            fallbackMessage: 'Failed to fetch user profile',
            showToast: false
        })

        if (!profileSuccess || !profile) {
            return NextResponse.json({
                error: 'Failed to fetch user profile',
                details: profileError?.message
            }, { status: 500 })
        }

        // Get all users ordered by balance to determine rank
        const usersResult = await supabase
            .from('user_profiles')
            .select('id, chips')
            .order('chips', { ascending: false })

        // Format the response with error handling
        const { data: allUsers, error: rankError, success: rankSuccess } = formatQueryResult<UserProfile[]>(usersResult, {
            fallbackMessage: 'Failed to fetch rank data',
            showToast: false
        })

        if (!rankSuccess || !allUsers) {
            return NextResponse.json({
                error: 'Failed to fetch rank data',
                details: rankError?.message
            }, { status: 500 })
        }

        // Calculate rank and percentile
        const userIndex = allUsers.findIndex(user => user.id === userId)
        const rank = userIndex !== -1 ? userIndex + 1 : null
        const totalUsers = allUsers.length
        const percentile = rank ? Math.round(((totalUsers - rank) / totalUsers) * 100) : null

        // Calculate win rate
        const totalHands = profile.total_hands ?? 0
        const totalWins = profile.total_wins ?? 0
        const winRate = totalHands > 0
            ? (totalWins / totalHands) * 100
            : 0

        // Build user rank data object
        const userRankData: UserRankData = {
            userId,
            username: profile.username ?? 'User',
            rank,
            totalUsers,
            percentile,
            metrics: {
                balance: profile.chips ?? 0,
                winRate,
                gamesPlayed: profile.total_games ?? 0,
                totalWins: profile.total_wins ?? 0
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
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        return NextResponse.json({
            error: 'An unexpected error occurred',
            details: errorMessage
        }, { status: 500 })
    }
}