import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Cache duration in milliseconds (2 minutes)
const CACHE_DURATION = 120000

interface Achievement {
    achievement_id: string;
    earned_at: string;
    achievements: {
        name: string;
        description: string;
        badge_image_url: string;
    };
}

interface GameSession {
    id: string;
    session_start: string;
    session_end: string | null;
    hands_played: number;
    hands_won: number;
    hands_lost: number;
    hands_pushed: number;
    blackjacks_dealt: number;
    biggest_win_amount: number;
    net_result: number;
}

interface UserStats {
    totalGames: number;
    totalHands: number;
    totalWins: number;
    totalLosses: number;
    totalPushes: number;
    totalBlackjacks: number;
    winRate: number;
    blackjackRate: number;
    balance: number;
    currentWinStreak: number;
    highestWinStreak: number;
    avgBetSize: number;
    totalWagered: number;
    totalProfit: number;
    biggestWin: number;
    memberSince: string;
    lastPlayed: string | null;
    rank: number | null;
    totalPlayers: number;
    percentile: number | null;
    recentPerformanceTrend: number;
    achievements: Achievement[];
    recentSessions: GameSession[];
}

interface ProfileData {
    total_hands: number;
    total_wins: number;
    total_blackjacks: number;
    total_bets: number;
    total_bet_amount: number;
    current_win_streak: number;
    highest_win_streak: number;
}

const userStatsCache = new Map<string, { data: UserStats; timestamp: number }>()

// Check if stats are available in cache
function getFromCache(userId: string) {
    const cachedStats = userStatsCache.get(userId)
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_DURATION) {
        return cachedStats.data
    }
    return null
}

// Calculate performance metrics from profile data
function calculateMetrics(profile: ProfileData) {
    return {
        winRate: profile.total_hands > 0
            ? (profile.total_wins / profile.total_hands) * 100
            : 0,
        blackjackRate: profile.total_hands > 0
            ? (profile.total_blackjacks / profile.total_hands) * 100
            : 0,
        avgBetSize: profile.total_bets > 0 && profile.total_bet_amount > 0
            ? profile.total_bet_amount / profile.total_bets
            : 0,
        currentWinStreak: profile.current_win_streak || 0,
        highestWinStreak: profile.highest_win_streak || 0
    }
}

// Calculate trend from recent sessions
function calculatePerformanceTrend(recentSessions: GameSession[] | null) {
    if (!recentSessions || recentSessions.length <= 1) {
        return 0
    }

    const lastIndex = recentSessions.length - 1;
    // Both must exist since we've checked length > 1
    const oldestSession = recentSessions[lastIndex];
    const newestSession = recentSessions[0];

    // Guard clause for extra type safety
    if (!oldestSession || !newestSession) {
        return 0;
    }

    const oldWinRate = oldestSession.hands_played > 0
        ? (oldestSession.hands_won / oldestSession.hands_played) * 100
        : 0
    const newWinRate = newestSession.hands_played > 0
        ? (newestSession.hands_won / newestSession.hands_played) * 100
        : 0

    return newWinRate - oldWinRate
}

// Map database achievements to Achievement interface
function mapAchievements(dbAchievements: unknown[]): Achievement[] {
    if (!dbAchievements || !Array.isArray(dbAchievements)) return [];

    interface DbAchievementItem {
        achievement_id?: string;
        earned_at?: string;
        achievements?: unknown;
    }

    return dbAchievements.map(item => {
        const dbItem = item as DbAchievementItem;
        return {
            achievement_id: dbItem.achievement_id ?? '',
            earned_at: dbItem.earned_at ?? '',
            achievements: extractAchievementData(dbItem.achievements)
        };
    });
}

// Helper function to extract achievement data from different data shapes
function extractAchievementData(achievements: unknown) {
    const defaultData = {
        name: '',
        description: '',
        badge_image_url: ''
    };

    // Early return if achievements is falsy
    if (!achievements) return defaultData;

    // Early return if not an object
    if (typeof achievements !== 'object') return defaultData;

    // Handle array case
    if (Array.isArray(achievements)) {
        return achievements[0] || defaultData;
    }

    // Handle object case
    const achievementsObj = achievements as Record<string, unknown>;
    return {
        name: typeof achievementsObj.name === 'string' ? achievementsObj.name : '',
        description: typeof achievementsObj.description === 'string' ? achievementsObj.description : '',
        badge_image_url: typeof achievementsObj.badge_image_url === 'string' ? achievementsObj.badge_image_url : ''
    };
}

export async function GET(_request: NextRequest) {
    try {
        const supabase = await createServerClient()

        // Get current authenticated user
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const userId = session.user.id

        // Check cache first
        const cachedStats = getFromCache(userId)
        if (cachedStats) {
            return NextResponse.json(cachedStats)
        }

        // Get user profile data with a single efficient query
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select(`
                *,
                game_sessions(
                    id,
                    session_start,
                    session_end,
                    hands_played,
                    hands_won,
                    hands_lost,
                    hands_pushed,
                    blackjacks_dealt,
                    biggest_win_amount,
                    net_result
                )
            `)
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            console.error('Error fetching user profile:', JSON.stringify(profileError))
            return NextResponse.json({ error: 'Failed to fetch user profile', details: profileError }, { status: 500 })
        }

        // Get user ranking data
        const { data: allUsers, error: rankError } = await supabase
            .from('user_profiles')
            .select('id, chips as balance')
            .order('chips', { ascending: false })

        if (rankError) {
            console.error('Error fetching user ranks:', JSON.stringify(rankError))
            return NextResponse.json({ error: 'Failed to fetch rank data', details: rankError }, { status: 500 })
        }

        // Calculate rank and percentile
        const userIndex = Array.isArray(allUsers) ? allUsers.findIndex(user => user && typeof user === 'object' && 'id' in user && user.id === userId) : -1
        const rank = userIndex !== -1 ? userIndex + 1 : null
        const totalPlayers = allUsers.length
        const percentile = rank ? Math.round(((totalPlayers - rank) / totalPlayers) * 100) : null

        // Get user achievements and recent sessions
        const [achievementsResult, sessionsResult, transactionResult] = await Promise.all([
            supabase
                .from('user_achievements')
                .select('achievement_id, earned_at, achievements(name, description, badge_image_url)')
                .eq('user_id', userId)
                .order('earned_at', { ascending: false }),
            supabase
                .from('game_sessions')
                .select(`
                    id,
                    session_start,
                    session_end,
                    hands_played,
                    hands_won,
                    hands_lost,
                    hands_pushed,
                    blackjacks_dealt,
                    biggest_win_amount,
                    net_result
                `)
                .eq('user_id', userId)
                .order('session_start', { ascending: false })
                .limit(10),
            supabase
                .rpc('get_user_transaction_summary', { user_id: userId })
        ]);

        const { data: achievements } = achievementsResult;
        const { data: recentSessions } = sessionsResult;
        const { data: transactionSummary } = transactionResult;

        // Calculate metrics
        const metrics = calculateMetrics(profile);
        const recentPerformanceTrend = calculatePerformanceTrend(recentSessions);

        // Build the complete stats object with enriched data
        const completeStats = {
            // Basic stats
            totalGames: profile.total_games || 0,
            totalHands: profile.total_hands || 0,
            totalWins: profile.total_wins || 0,
            totalLosses: profile.total_losses || 0,
            totalPushes: profile.total_pushes || 0,
            totalBlackjacks: profile.total_blackjacks || 0,
            winRate: metrics.winRate,
            blackjackRate: metrics.blackjackRate,
            balance: profile.balance || 0,

            // Streaks
            currentWinStreak: metrics.currentWinStreak,
            highestWinStreak: metrics.highestWinStreak,

            // Financial metrics
            avgBetSize: metrics.avgBetSize,
            totalWagered: profile.total_bet_amount || 0,
            totalProfit: transactionSummary?.total_profit || 0,
            biggestWin: profile.biggest_win || 0,

            // Time metrics
            memberSince: profile.created_at,
            lastPlayed: profile.last_played_at,

            // Ranking
            rank,
            totalPlayers,
            percentile,

            // Trend
            recentPerformanceTrend,

            // Related data
            achievements: mapAchievements(achievements || []),
            recentSessions: recentSessions || []
        }

        // Store in cache
        userStatsCache.set(userId, {
            data: completeStats,
            timestamp: Date.now()
        })

        return NextResponse.json(completeStats)
    } catch (error) {
        console.error('Unexpected error in user stats API:', error)
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
    }
}