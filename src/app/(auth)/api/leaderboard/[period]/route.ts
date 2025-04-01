import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { period: string } }
) {
    try {
        const period = params.period
        const { searchParams } = new URL(request.url)
        const limit = Number(searchParams.get('limit')) || 10

        if (!['daily', 'weekly', 'monthly'].includes(period)) {
            return NextResponse.json(
                { error: 'Invalid period. Use daily, weekly, or monthly' },
                { status: 400 }
            )
        }

        const supabase = createClient()

        // Calculate date range based on period
        const now = new Date()
        let startDate: Date

        // Set default value (weekly) that will be used if case is weekly or default
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)

        // Override only for non-weekly periods
        switch (period) {
            case 'daily':
                startDate = new Date(now)
                startDate.setDate(now.getDate() - 1)
                break
            case 'monthly':
                startDate = new Date(now)
                startDate.setMonth(now.getMonth() - 1)
                break
            // weekly case uses the default value set above
        }

        const startDateString = startDate.toISOString()

        // For a real implementation, we would query game results within the time period
        // Here, we'll create a more basic implementation that gets players who have played
        // games in the specified period, and calculate their performance for that timeframe

        // Option 1: If we have a game_sessions or transactions table with timestamps,
        // we could join with that to calculate period-specific metrics

        // Simple approach: Get active users during this period and their overall stats
        // In a production app, we would use SQL aggregation with proper time filtering
        const { data: activeUsers, error } = await supabase
            .from('game_sessions')
            .select('user_id')
            .gte('session_start', startDateString)
            .order('session_start', { ascending: false })

        if (error) {
            console.error(`Error fetching ${period} leaderboard:`, error)
            return NextResponse.json(
                { error: `Failed to fetch ${period} leaderboard data` },
                { status: 500 }
            )
        }

        // Get unique active user IDs
        const activeUserIds = Array.from(new Set(activeUsers.map(user => user.user_id)))

        if (activeUserIds.length === 0) {
            return NextResponse.json({ leaderboard: [] })
        }

        // Get profiles of active users
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, total_games, total_wins, total_hands, balance')
            .in('id', activeUserIds)
            .order('balance', { ascending: false })
            .limit(limit)

        if (profilesError) {
            console.error(`Error fetching profiles for ${period} leaderboard:`, profilesError)
            return NextResponse.json(
                { error: `Failed to fetch profiles for ${period} leaderboard` },
                { status: 500 }
            )
        }

        // Process profiles to calculate win rates and form the leaderboard
        const leaderboard = profiles.map((profile, index) => {
            const winRate = profile.total_hands > 0
                ? (profile.total_wins / profile.total_hands) * 100
                : 0

            return {
                id: profile.id,
                rank: index + 1,
                username: profile.username,
                avatar: profile.avatar_url || '/avatars/default.jpg',
                winnings: profile.balance,
                winRate: parseFloat(winRate.toFixed(1)),
                gamesPlayed: profile.total_games,
                // In a real app, we would calculate period-specific metrics here
                period: period
            }
        })

        return NextResponse.json({ leaderboard, period })

    } catch (error) {
        console.error(`Unexpected error in ${params.period} leaderboard API:`, error)
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}