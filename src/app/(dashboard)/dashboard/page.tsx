'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, TrendingUp, Trophy, Award } from 'lucide-react'
import { StatsOverview } from '@/components/profile/StatsOverview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'

interface Achievement {
    achievement_id: string
    earned_at: string
    achievements: {
        name: string
        description: string
        badge_image_url: string | null
    }
}

interface GameSession {
    id: string
    session_start: string
    session_end?: string
}

interface UserStats {
    achievements: Achievement[]
    recentSessions: GameSession[]
    // Stats overview properties
    totalGames: number
    totalHands: number
    totalWins: number
    totalLosses: number
    totalPushes: number
    totalBlackjacks: number
    winRate: number
    blackjackRate: number
    balance: number
    avgBetSize?: number
    largestWin?: number
    longestStreak?: number
    favoriteAction?: string
    rank?: number
    percentile?: number
}

export default function StatsDashboardPage() {
    const router = useRouter()
    const [stats, setStats] = useState<UserStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true)
                const response = await fetch('/api/user/stats')

                if (!response.ok) {
                    // If not authenticated, redirect to auth page
                    if (response.status === 401) {
                        router.push('/auth/login?redirect=/dashboard/stats')
                        return
                    }
                    throw new Error('Failed to fetch stats')
                }

                const data = await response.json()
                setStats(data)
            } catch (err) {
                console.error('Error fetching user stats:', err)
                setError('Failed to load statistics. Please try again later.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchStats()
    }, [router])

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading your statistics...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center">
                    <p className="mb-4 text-red-500">{error}</p>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container px-4 py-8 mx-auto max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
            >
                <h1 className="mb-2 text-3xl font-bold">Your Performance Dashboard</h1>
                <p className="text-muted-foreground">
                    Track your blackjack performance, achievements, and global ranking
                </p>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                    <TabsTrigger value="overview">Statistics Overview</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                    <TabsTrigger value="history">Game History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {stats && <StatsOverview stats={stats} />}
                </TabsContent>

                <TabsContent value="achievements">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {(stats?.achievements?.length ?? 0) > 0 ? (
                            stats?.achievements.map((achievement: Achievement) => (
                                <motion.div
                                    key={achievement.achievement_id}
                                    whileHover={{ y: -5 }}
                                    className="transition-all"
                                >
                                    <Card className="overflow-hidden border-amber-500/20">
                                        <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600" />
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-700">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">
                                                    {achievement.achievements.name}
                                                </CardTitle>
                                                <p className="text-xs text-muted-foreground">
                                                    Earned {format(new Date(achievement.earned_at), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="text-sm">
                                            {achievement.achievements.description}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center col-span-full">
                                <Trophy className="w-12 h-12 mb-4 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">No Achievements Yet</h3>
                                <p className="max-w-md text-muted-foreground">
                                    Keep playing to earn achievements! Win streaks, blackjacks, and consistent play will unlock special badges.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Game Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(stats?.recentSessions?.length ?? 0) > 0 ? (
                                <div className="border rounded-md">
                                    <div className="grid grid-cols-12 px-4 py-3 text-sm font-medium bg-muted/50">
                                        <div className="col-span-4">Date</div>
                                        <div className="col-span-2 text-right">Duration</div>
                                        <div className="col-span-2 text-right">Hands</div>
                                        <div className="col-span-2 text-right">Win Rate</div>
                                        <div className="col-span-2 text-right">Net Result</div>
                                    </div>
                                    {stats?.recentSessions?.map((session: GameSession) => {
                                        const startTime = new Date(session.session_start)
                                        const endTime = session.session_end ? new Date(session.session_end) : new Date()
                                        const durationMs = endTime.getTime() - startTime.getTime()
                                        const durationMinutes = Math.floor(durationMs / 60000)

                                        // These would come from the session data in a real implementation
                                        // For now we'll create placeholder data
                                        const handsPlayed = 12 // Example
                                        const winsInSession = 7 // Example
                                        const sessionWinRate = (winsInSession / handsPlayed) * 100
                                        const netResult = 250 // Example profit

                                        return (
                                            <div key={session.id} className="grid grid-cols-12 px-4 py-3 text-sm border-t">
                                                <div className="col-span-4">
                                                    {format(startTime, 'MMM d, yyyy h:mm a')}
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    {durationMinutes} min
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    {handsPlayed}
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    {sessionWinRate.toFixed(1)}%
                                                </div>
                                                <div className={`col-span-2 text-right ${netResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {netResult >= 0 ? '+' : ''}{netResult}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-medium">No Game History Yet</h3>
                                    <p className="text-muted-foreground">
                                        Start playing to build your game history and track your progress over time.
                                    </p>
                                    <Button
                                        className="mt-4"
                                        onClick={() => router.push('/game')}
                                    >
                                        Play Now
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}