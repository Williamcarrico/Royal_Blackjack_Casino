'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR from 'swr'
import { cn } from '@/lib/utils/utils'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Trophy,
	Medal,
	Star,
	Search,
	RefreshCcw,
	X,
	ChevronDown,
	Users,
	Filter,
	SlidersHorizontal,
	DollarSign,
	Percent,
	Gamepad as GamepadIcon,
	TrendingUp
} from 'lucide-react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

// Types for leaderboard data
interface LeaderboardPlayer {
	id: string
	rank: number
	username: string
	avatar: string
	winnings: number
	winRate: number
	gamesPlayed: number
	biggestWin: number
	country: string
	isVIP: boolean
	lastActive: string
}

// Filter types for the leaderboard
type FilterPeriod = 'daily' | 'weekly' | 'monthly' | 'allTime'
type SortOption = 'winnings' | 'winRate' | 'gamesPlayed' | 'biggestWin'

// SWR fetcher function
const fetcher = async (url: string) => {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error('Failed to fetch data')
	}
	return response.json()
}

export default function LeaderboardPage() {
	// State for filters and search
	const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('weekly')
	const [sortBy, setSortBy] = useState<SortOption>('winnings')
	const [searchQuery, setSearchQuery] = useState('')
	const [searchInputValue, setSearchInputValue] = useState('')
	const [isFilterOpen, setIsFilterOpen] = useState(false)

	// Build the SWR key based on the current filters
	const getLeaderboardKey = () => {
		const params = new URLSearchParams({
			period: filterPeriod,
			metric: sortBy,
			limit: '20', // Get top 20 players
		})

		if (searchQuery) {
			params.append('search', searchQuery)
		}

		return `/api/leaderboard?${params.toString()}`
	}

	// Fetch leaderboard data with SWR for automatic revalidation
	const { data, isLoading, mutate } = useSWR(
		getLeaderboardKey(),
		fetcher,
		{
			refreshInterval: 60000, // Refresh every minute
			dedupingInterval: 30000, // Dedupe requests within 30 seconds
			revalidateOnFocus: false, // Don't revalidate on focus to reduce unnecessary requests
		}
	)

	// Fetch user's personal ranking
	const { data: userRankData } = useSWR('/api/user/rank', fetcher, {
		refreshInterval: 300000, // Refresh every 5 minutes
	})

	// Handle search form submission
	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		setSearchQuery(searchInputValue)
	}

	// Clear search
	const clearSearch = () => {
		setSearchQuery('')
		setSearchInputValue('')
	}

	// Format currency values
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount)
	}

	// Get styling for top ranks
	const getRankStyle = (rank: number) => {
		if (rank === 1) return 'text-amber-500 font-bold'
		if (rank === 2) return 'text-zinc-400 font-semibold'
		if (rank === 3) return 'text-amber-700 font-semibold'
		return 'text-foreground'
	}

	// Get badge for top ranks
	const getRankBadge = (rank: number) => {
		if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />
		if (rank === 2) return <Medal className="w-5 h-5 text-zinc-400" />
		if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />
		return <span className={cn("font-mono", getRankStyle(rank))}>{rank}</span>
	}

	// Create the leaderboard table rows
	const renderLeaderboardRows = () => {
		if (!data?.leaderboard || data.leaderboard.length === 0) {
			return (
				<tr>
					<td colSpan={5} className="px-4 py-8 text-center">
						<div className="flex flex-col items-center justify-center">
							<Users className="w-8 h-8 mb-2 text-muted-foreground" />
							<p className="mb-2 text-muted-foreground">No players found</p>
							{searchQuery && (
								<Button variant="outline" size="sm" onClick={clearSearch}>
									Clear search
								</Button>
							)}
						</div>
					</td>
				</tr>
			)
		}

		return data.leaderboard.map((player: LeaderboardPlayer) => (
			<motion.tr
				key={player.id}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0 }}
				className={cn(
					"border-b transition-colors hover:bg-muted/50",
					userRankData?.userId === player.id && "bg-primary/5 hover:bg-primary/10"
				)}
			>
				<td className="px-4 py-2.5 text-center">
					<div className="flex items-center justify-center w-10">
						{getRankBadge(player.rank)}
					</div>
				</td>
				<td className="px-4 py-2.5">
					<div className="flex items-center gap-3">
						<Avatar className="w-8 h-8 border">
							<AvatarImage src={player.avatar} alt={player.username} />
							<AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
						</Avatar>
						<div>
							<div className="flex items-center font-medium">
								{player.username}
								{player.isVIP && (
									<Badge variant="outline" className="ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
										<Star className="w-3 h-3 mr-1" />
										VIP
									</Badge>
								)}
							</div>
							<div className="text-xs text-muted-foreground">
								Last active {formatDistanceToNow(new Date(player.lastActive), { addSuffix: true })}
							</div>
						</div>
					</div>
				</td>
				<td className="px-4 py-2.5 text-right">
					<div className="text-base font-semibold">{formatCurrency(player.winnings)}</div>
				</td>
				<td className="px-4 py-2.5 text-right">
					<div className="text-base">{player.winRate.toFixed(1)}%</div>
				</td>
				<td className="px-4 py-2.5 text-right">
					<div className="text-base">{player.gamesPlayed.toLocaleString()}</div>
				</td>
			</motion.tr>
		))
	}

	// Render loading skeletons
	const renderSkeletons = () => {
		return Array(10).fill(0).map((_, i) => (
			<tr key={`skeleton-position-${i + 1}`} className="border-b">
				<td className="px-4 py-2.5 text-center">
					<Skeleton className="w-6 h-6 mx-auto rounded-full" />
				</td>
				<td className="px-4 py-2.5">
					<div className="flex items-center gap-3">
						<Skeleton className="w-8 h-8 rounded-full" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-28" />
							<Skeleton className="w-20 h-3" />
						</div>
					</div>
				</td>
				<td className="px-4 py-2.5 text-right">
					<Skeleton className="w-16 h-5 ml-auto" />
				</td>
				<td className="px-4 py-2.5 text-right">
					<Skeleton className="w-10 h-5 ml-auto" />
				</td>
				<td className="px-4 py-2.5 text-right">
					<Skeleton className="w-12 h-5 ml-auto" />
				</td>
			</tr>
		))
	}

	// User's ranking card
	const renderUserRanking = () => {
		if (!userRankData) return null

		const { rank, totalUsers, metrics } = userRankData

		return (
			<Card className="mb-6">
				<div className="p-4 md:p-6">
					<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
						<div>
							<h3 className="text-lg font-semibold">Your Ranking</h3>
							<p className="text-muted-foreground">
								You are ranked #{rank} out of {totalUsers} players
							</p>
						</div>
						<div className="flex items-center gap-4">
							<div className="text-center">
								<div className="text-sm font-medium text-muted-foreground">Balance</div>
								<div className="text-xl font-bold">{formatCurrency(metrics.balance)}</div>
							</div>
							<div className="text-center">
								<div className="text-sm font-medium text-muted-foreground">Win Rate</div>
								<div className="text-xl font-bold">{metrics.winRate.toFixed(1)}%</div>
							</div>
							<div className="text-center">
								<div className="text-sm font-medium text-muted-foreground">Games</div>
								<div className="text-xl font-bold">{metrics.gamesPlayed}</div>
							</div>
						</div>
					</div>
				</div>
			</Card>
		)
	}

	return (
		<div className="container px-4 py-8 mx-auto max-w-7xl">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="mb-6"
			>
				<h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
				<p className="text-muted-foreground">
					See how you stack up against other players around the world
				</p>
			</motion.div>

			{userRankData && renderUserRanking()}

			<Card className="overflow-hidden">
				<div className="p-4 border-b">
					<div className="flex flex-col justify-between gap-4 md:flex-row">
						<div className="flex items-center space-x-4">
							<Tabs
								value={filterPeriod}
								onValueChange={(value) => setFilterPeriod(value as FilterPeriod)}
								className="w-full md:w-auto"
							>
								<TabsList>
									<TabsTrigger value="daily">Today</TabsTrigger>
									<TabsTrigger value="weekly">This Week</TabsTrigger>
									<TabsTrigger value="monthly">This Month</TabsTrigger>
									<TabsTrigger value="allTime">All Time</TabsTrigger>
								</TabsList>
							</Tabs>

							<div className="hidden md:block">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="gap-1">
											<SlidersHorizontal className="w-4 h-4" />
											{sortBy === 'winnings' && 'Winnings'}
											{sortBy === 'winRate' && 'Win Rate'}
											{sortBy === 'gamesPlayed' && 'Games Played'}
											{sortBy === 'biggestWin' && 'Biggest Win'}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Sort by</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem onClick={() => setSortBy('winnings')}>
												<DollarSign className="w-4 h-4 mr-2" />
												<span>Winnings</span>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => setSortBy('winRate')}>
												<Percent className="w-4 h-4 mr-2" />
												<span>Win Rate</span>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => setSortBy('gamesPlayed')}>
												<GamepadIcon className="w-4 h-4 mr-2" />
												<span>Games Played</span>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => setSortBy('biggestWin')}>
												<TrendingUp className="w-4 h-4 mr-2" />
												<span>Biggest Win</span>
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							<Button
								variant="ghost"
								size="icon"
								onClick={() => mutate()}
								disabled={isLoading}
								className="hidden md:flex"
							>
								<RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
								<span className="sr-only">Refresh</span>
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<div className="relative w-full md:w-auto">
								<form onSubmit={handleSearch}>
									<Input
										placeholder="Search players..."
										value={searchInputValue}
										onChange={(e) => setSearchInputValue(e.target.value)}
										className="w-full pr-8 md:w-auto"
									/>
									{searchInputValue && (
										<button
											type="button"
											onClick={clearSearch}
											className="absolute -translate-y-1/2 right-8 top-1/2 text-muted-foreground hover:text-foreground"
										>
											<X className="w-4 h-4" />
											<span className="sr-only">Clear</span>
										</button>
									)}
									<button
										type="submit"
										className="absolute -translate-y-1/2 right-2 top-1/2 text-muted-foreground hover:text-foreground"
									>
										<Search className="w-4 h-4" />
										<span className="sr-only">Search</span>
									</button>
								</form>
							</div>

							<Button
								variant="ghost"
								size="icon"
								onClick={() => mutate()}
								disabled={isLoading}
								className="md:hidden"
							>
								<RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
								<span className="sr-only">Refresh</span>
							</Button>

							<Button
								variant="outline"
								size="icon"
								className="md:hidden"
								onClick={() => setIsFilterOpen(!isFilterOpen)}
							>
								<Filter className="w-4 h-4" />
								<span className="sr-only">Filter</span>
							</Button>
						</div>
					</div>

					{isFilterOpen && (
						<div className="p-4 mt-4 border rounded-md md:hidden">
							<div className="space-y-4">
								<div>
									<label htmlFor="mobile-sort-select" className="text-sm font-medium mb-1.5 block">Sort by</label>
									<Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
										<SelectTrigger id="mobile-sort-select">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="winnings">Winnings</SelectItem>
											<SelectItem value="winRate">Win Rate</SelectItem>
											<SelectItem value="gamesPlayed">Games Played</SelectItem>
											<SelectItem value="biggestWin">Biggest Win</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="h-10 px-4 text-xs font-medium text-center text-muted-foreground">Rank</th>
								<th className="h-10 px-4 text-xs font-medium text-left text-muted-foreground">Player</th>
								<th className="h-10 px-4 text-xs font-medium text-right text-muted-foreground">
									<div className="flex items-center justify-end gap-1">
										<span>Winnings</span>
										{sortBy === 'winnings' && <ChevronDown className="w-3 h-3" />}
									</div>
								</th>
								<th className="h-10 px-4 text-xs font-medium text-right text-muted-foreground">
									<div className="flex items-center justify-end gap-1">
										<span>Win Rate</span>
										{sortBy === 'winRate' && <ChevronDown className="w-3 h-3" />}
									</div>
								</th>
								<th className="h-10 px-4 text-xs font-medium text-right text-muted-foreground">
									<div className="flex items-center justify-end gap-1">
										<span>Games</span>
										{sortBy === 'gamesPlayed' && <ChevronDown className="w-3 h-3" />}
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							<AnimatePresence mode="wait">
								{isLoading ? renderSkeletons() : renderLeaderboardRows()}
							</AnimatePresence>
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	)
}
