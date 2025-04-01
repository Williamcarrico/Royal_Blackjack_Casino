import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient()

        // Get current authenticated user to check admin status
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // Check if user is admin
        const { data: userRole, error: roleError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (roleError || !userRole) {
            console.error('Error fetching user role:', roleError)
            return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 500 })
        }

        // Only allow admins
        if (userRole.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin access required' }, { status: 403 })
        }

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || 'all'
        const format = searchParams.get('format') || 'json'

        // Define time period for filtering
        let startDate: Date | null = null

        if (period !== 'all') {
            const now = new Date()
            startDate = new Date(now)

            switch (period) {
                case 'day':
                    startDate.setDate(now.getDate() - 1)
                    break
                case 'week':
                    startDate.setDate(now.getDate() - 7)
                    break
                case 'month':
                    startDate.setMonth(now.getMonth() - 1)
                    break
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1)
                    break
                default:
                    startDate = null
            }
        }

        // Prepare database queries

        // 1. Get global table stats
        const { data: tableStats, error: tableStatsError } = await supabase
            .from('table_stats')
            .select('*')
            .eq('id', 'global')
            .single()

        if (tableStatsError) {
            console.error('Error fetching table stats:', tableStatsError)
            return NextResponse.json({ error: 'Failed to fetch table statistics' }, { status: 500 })
        }

        // 2. Get user statistics
        const userQuery = supabase
            .from('profiles')
            .select('id, username, email, created_at, total_games, total_hands, total_wins, total_losses, total_pushes, total_blackjacks, balance')
            .order('balance', { ascending: false })

        // 3. Get game sessions data
        const sessionsQuery = supabase
            .from('game_sessions')
            .select('id, user_id, session_start, session_end')
            .order('session_start', { ascending: false })

        // Apply date filtering if period is specified
        if (startDate) {
            const startDateString = startDate.toISOString()
            sessionsQuery.gte('session_start', startDateString)
        }

        // Execute queries in parallel
        const [usersResult, sessionsResult] = await Promise.all([
            userQuery,
            sessionsQuery
        ])

        if (usersResult.error) {
            console.error('Error fetching user statistics:', usersResult.error)
            return NextResponse.json({ error: 'Failed to fetch user statistics' }, { status: 500 })
        }

        if (sessionsResult.error) {
            console.error('Error fetching game sessions:', sessionsResult.error)
            return NextResponse.json({ error: 'Failed to fetch game sessions' }, { status: 500 })
        }

        // Prepare response data
        const statistics = {
            generatedAt: new Date().toISOString(),
            period,
            summary: {
                totalUsers: usersResult.data.length,
                totalGames: tableStats.total_games,
                totalHands: tableStats.total_hands,
                totalPlayerWins: tableStats.total_player_wins,
                totalPlayerLosses: tableStats.total_player_losses,
                totalPushes: tableStats.total_pushes,
                totalBlackjacks: tableStats.total_blackjacks,
                houseEdge: tableStats.house_edge,
                activeSessions: sessionsResult.data.filter(s => !s.session_end).length,
                totalSessions: sessionsResult.data.length,
                averageBalance: usersResult.data.reduce((sum, user) => sum + user.balance, 0) / usersResult.data.length
            },
            // Include detailed data (redacted for security in a real application)
            users: usersResult.data.map(user => ({
                id: user.id,
                username: user.username,
                created: user.created_at,
                totalGames: user.total_games,
                totalHands: user.total_hands,
                totalWins: user.total_wins,
                totalLosses: user.total_losses,
                winRate: user.total_hands > 0 ? (user.total_wins / user.total_hands) * 100 : 0,
                balance: user.balance
            })),
            sessions: sessionsResult.data.map(session => ({
                id: session.id,
                userId: session.user_id,
                start: session.session_start,
                end: session.session_end,
                duration: session.session_end
                    ? (new Date(session.session_end).getTime() - new Date(session.session_start).getTime()) / 60000
                    : null
            }))
        }

        // Handle different output formats
        if (format === 'csv') {
            // In a real application, we would generate CSV here
            // For simplicity, we're returning JSON with a note
            return NextResponse.json({
                note: "CSV export would be implemented here in a real application",
                ...statistics
            })
        } else {
            // Default to JSON format
            return NextResponse.json(statistics)
        }
    } catch (error) {
        console.error('Unexpected error in admin statistics API:', error)
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
}