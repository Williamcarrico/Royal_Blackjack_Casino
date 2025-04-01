'use client'

import * as React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
	AlertCircle,
	Shuffle,
	Play,
	Pause,
	RotateCcw,
	Settings,
	PlusCircle,
	MinusCircle,
} from 'lucide-react'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

// Types
interface Card {
	value: string
	suit: string
	image: string
	count: number
}

type CountingSystem = 'hilo' | 'ko' | 'omega2'
type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface CountingSystemDetails {
	name: string
	description: string
	values: Record<CardRank, number>
}

type CountingSystems = Record<CountingSystem, CountingSystemDetails>

interface GameState {
	deck: Card[]
	cardsDealt: Card[]
	runningCount: number
	trueCount: number
	decksRemaining: number
	correctGuesses: number
	totalGuesses: number
	isRunning: boolean
	dealSpeed: number
	countingSystem: CountingSystem
	showCount: boolean
	isSettingsOpen: boolean
	isHintMode: boolean
	showValueHints: boolean
	isPaused: boolean
}

// Component for the interactive card counting trainer
const ClientSideCardCountingTrainer: React.FC = () => {
	// Constants
	const DECK_COUNT = 6 // Number of decks in the shoe

	// Use useMemo to memoize constant values
	const SUITS = useMemo(() => ['hearts', 'diamonds', 'clubs', 'spades'], [])
	const VALUES = useMemo(
		() => ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
		[]
	)

	const COUNTING_SYSTEMS = useMemo<CountingSystems>(
		() => ({
			hilo: {
				name: 'Hi-Lo',
				description: 'The most common counting system. Easy to learn, but less accurate.',
				values: {
					'2': 1,
					'3': 1,
					'4': 1,
					'5': 1,
					'6': 1,
					'7': 0,
					'8': 0,
					'9': 0,
					'10': -1,
					J: -1,
					Q: -1,
					K: -1,
					A: -1,
				},
			},
			ko: {
				name: 'Knockout (KO)',
				description: "A balanced counting system that's easier to use.",
				values: {
					'2': 1,
					'3': 1,
					'4': 1,
					'5': 1,
					'6': 1,
					'7': 1,
					'8': 0,
					'9': 0,
					'10': -1,
					J: -1,
					Q: -1,
					K: -1,
					A: -1,
				},
			},
			omega2: {
				name: 'Omega II',
				description: 'Advanced system with higher accuracy but more complex.',
				values: {
					'2': 1,
					'3': 1,
					'4': 2,
					'5': 2,
					'6': 2,
					'7': 1,
					'8': 0,
					'9': -1,
					'10': -2,
					J: -2,
					Q: -2,
					K: -2,
					A: 0,
				},
			},
		}),
		[]
	)

	// State
	const [gameState, setGameState] = useState<GameState>({
		deck: [],
		cardsDealt: [],
		runningCount: 0,
		trueCount: 0,
		decksRemaining: DECK_COUNT,
		correctGuesses: 0,
		totalGuesses: 0,
		isRunning: false,
		dealSpeed: 2000, // milliseconds
		countingSystem: 'hilo',
		showCount: false,
		isSettingsOpen: false,
		isHintMode: true,
		showValueHints: true,
		isPaused: false,
	})

	// Initialize deck
	const initializeDeck = useCallback(() => {
		const newDeck: Card[] = []

		for (let d = 0; d < DECK_COUNT; d++) {
			for (const suit of SUITS) {
				for (const value of VALUES) {
					const countValue = COUNTING_SYSTEMS[gameState.countingSystem].values[value as CardRank]
					newDeck.push({
						value,
						suit,
						image: `/images/cards/${value}_of_${suit}.png`,
						count: countValue,
					})
				}
			}
		}

		// Shuffle
		for (let i = newDeck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
				;[newDeck[i]!, newDeck[j]!] = [newDeck[j]!, newDeck[i]!]
		}

		setGameState(prev => ({
			...prev,
			deck: newDeck,
			cardsDealt: [],
			runningCount: 0,
			trueCount: 0,
			decksRemaining: DECK_COUNT,
			correctGuesses: 0,
			totalGuesses: 0,
			isPaused: false,
		}))
	}, [gameState.countingSystem, COUNTING_SYSTEMS, SUITS, VALUES, DECK_COUNT])

	// Initialize on first load and system change
	useEffect(() => {
		initializeDeck()
	}, [initializeDeck])

	// Deal a card
	const dealCard = useCallback(() => {
		if (gameState.deck.length === 0 || gameState.isPaused) return

		setGameState(prev => {
			const newDeck = [...prev.deck]
			const card = newDeck.pop()

			if (!card) return prev

			const newCardsDealt = [...prev.cardsDealt, card]
			const newRunningCount = prev.runningCount + card.count
			const decksRemaining = newDeck.length / 52
			const newTrueCount = Math.round((newRunningCount / decksRemaining) * 10) / 10

			return {
				...prev,
				deck: newDeck,
				cardsDealt: newCardsDealt,
				runningCount: newRunningCount,
				trueCount: newTrueCount,
				decksRemaining,
			}
		})
	}, [gameState.deck, gameState.isPaused])

	// Auto deal loop
	useEffect(() => {
		let dealInterval: NodeJS.Timeout

		if (gameState.isRunning && !gameState.isPaused) {
			dealInterval = setInterval(dealCard, gameState.dealSpeed)
		}

		return () => clearInterval(dealInterval)
	}, [gameState.isRunning, gameState.dealSpeed, dealCard, gameState.isPaused])

	// Handle user count guess
	const handleGuess = (guess: number) => {
		const isCorrect = guess === gameState.runningCount

		setGameState(prev => ({
			...prev,
			correctGuesses: isCorrect ? prev.correctGuesses + 1 : prev.correctGuesses,
			totalGuesses: prev.totalGuesses + 1,
			showCount: true,
		}))

		if (isCorrect) {
			toast.success(`Correct! The running count is ${gameState.runningCount}`)
		} else {
			toast.error(`Incorrect. The running count is ${gameState.runningCount}`)
		}

		// Hide count after 2 seconds
		setTimeout(() => {
			setGameState(prev => ({
				...prev,
				showCount: false,
			}))
		}, 2000)
	}

	// Calculate the user's accuracy
	const accuracy = useMemo(() => {
		if (gameState.totalGuesses === 0) return 0
		return Math.round((gameState.correctGuesses / gameState.totalGuesses) * 100)
	}, [gameState.correctGuesses, gameState.totalGuesses])

	// Get bet recommendations based on true count
	const getBetRecommendation = useMemo(() => {
		const { trueCount } = gameState

		if (trueCount <= 0) return { text: 'Minimum Bet', color: 'text-yellow-500' }
		if (trueCount > 0 && trueCount <= 2) return { text: '2x Minimum Bet', color: 'text-green-500' }
		if (trueCount > 2 && trueCount <= 4)
			return { text: '4x Minimum Bet', color: 'text-emerald-600' }
		return { text: '8x Minimum Bet', color: 'text-blue-600' }
	}, [gameState])

	// Get strategy adjustments based on true count
	const getStrategyAdjustments = useMemo(() => {
		const { trueCount } = gameState

		const adjustments = []

		if (trueCount >= 3) {
			adjustments.push('Take insurance')
			adjustments.push('16 vs 10: Stand')
		}

		if (trueCount >= 2) {
			adjustments.push('12 vs 3: Stand')
			adjustments.push('15 vs 10: Stand')
		}

		if (trueCount <= -2) {
			adjustments.push('9 vs 2: Hit')
			adjustments.push('16 vs 9: Hit')
		}

		return adjustments.length > 0 ? adjustments : ['No adjustments needed - follow basic strategy']
	}, [gameState])

	// Handle settings changes
	const updateSettings = (newSettings: Partial<GameState>) => {
		setGameState(prev => ({
			...prev,
			...newSettings,
		}))
	}

	// Extract card value hint styling to avoid nested ternaries
	const getCardCountStyle = (count: number) => {
		if (count > 0) return 'bg-green-600 text-white'
		if (count < 0) return 'bg-red-600 text-white'
		return 'bg-gray-600 text-white'
	}

	// Extract card value text to avoid nested ternaries
	const getCardCountText = (count: number) => {
		return count > 0 ? `+${count}` : `${count}`
	}

	// Safe system key check for CountingSystem type using array of valid systems
	const VALID_COUNTING_SYSTEMS: ReadonlyArray<CountingSystem> = ['hilo', 'ko', 'omega2'] as const

	// Type guard for checking if a string is a valid counting system
	const isValidCountingSystem = (key: string): key is CountingSystem => {
		return VALID_COUNTING_SYSTEMS.includes(key as CountingSystem)
	}

	return (
		<div className="pt-16 space-y-8">
			{/* Main card counting simulator */}
			<Card className="border-2 shadow-lg">
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<div>
						<CardTitle className="text-2xl">Card Counting Simulator</CardTitle>
						<CardDescription>
							System: {COUNTING_SYSTEMS[gameState.countingSystem].name}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										onClick={() => updateSettings({ isSettingsOpen: true })}
									>
										<Settings className="w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Settings</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" size="icon" onClick={initializeDeck}>
										<RotateCcw className="w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Reset Deck</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Deck progress and stats */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Cards Remaining: {gameState.deck.length}</span>
							<span>Decks Remaining: {gameState.decksRemaining.toFixed(1)}</span>
						</div>
						<Progress value={(gameState.cardsDealt.length / (DECK_COUNT * 52)) * 100} />
					</div>

					{/* Cards display area */}
					<div className="relative h-64 p-4 border rounded-lg bg-gradient-to-b from-green-900/20 to-green-900/30">
						<div className="absolute top-0 right-0 px-2 py-1 m-2 text-sm text-white rounded bg-black/60">
							{gameState.deck.length > 0
								? `${((gameState.deck.length / (DECK_COUNT * 52)) * 100).toFixed(0)}% remaining`
								: 'Deck empty'}
						</div>

						{gameState.cardsDealt.length === 0 ? (
							<div className="flex items-center justify-center h-full">
								<div className="text-center">
									<Shuffle className="w-12 h-12 mx-auto text-muted-foreground" />
									<p className="mt-2">Press Start to begin dealing cards</p>
								</div>
							</div>
						) : (
							<div className="relative h-full">
								<div className="absolute bottom-0 left-0 flex flex-wrap max-h-full gap-1 pb-10 overflow-y-auto">
									{gameState.cardsDealt.slice(-15).map((card, index) => (
										<motion.div
											key={`${card.value}-${card.suit}-${index}-${gameState.cardsDealt.length}`}
											initial={{ opacity: 0, y: -20 }}
											animate={{ opacity: 1, y: 0 }}
											className="relative"
										>
											<div className="relative w-16 h-24 overflow-hidden bg-white border rounded shadow-md">
												<div
													className={`
                                                    absolute inset-0 flex items-center justify-center
                                                    ${card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}
                                                `}
												>
													<span className="text-xl font-bold">{card.value}</span>
													<span className="ml-1 text-2xl">
														{card.suit === 'hearts' && '♥'}
														{card.suit === 'diamonds' && '♦'}
														{card.suit === 'clubs' && '♣'}
														{card.suit === 'spades' && '♠'}
													</span>
												</div>
											</div>
											{gameState.showValueHints && gameState.isHintMode && (
												<div
													className={`
                                                    absolute -bottom-3 left-1/2 transform -translate-x-1/2
                                                    px-2 py-0.5 rounded-full text-xs font-bold
                                                    ${getCardCountStyle(card.count)}
                                                `}
												>
													{getCardCountText(card.count)}
												</div>
											)}
										</motion.div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Controls */}
					<div className="flex flex-wrap items-center justify-center gap-4 sm:justify-between">
						<div className="flex items-center space-x-2">
							<Button
								onClick={() =>
									setGameState(prev => ({
										...prev,
										isRunning: !prev.isRunning,
										isPaused: false,
									}))
								}
								variant={gameState.isRunning ? 'secondary' : 'default'}
								className="flex items-center gap-2"
							>
								{gameState.isRunning ? (
									<>
										<Pause className="w-4 h-4" /> Stop
									</>
								) : (
									<>
										<Play className="w-4 h-4" /> Start
									</>
								)}
							</Button>

							{gameState.isRunning && (
								<Button
									onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
									variant="outline"
								>
									{gameState.isPaused ? 'Resume' : 'Pause'}
								</Button>
							)}

							<Button
								onClick={dealCard}
								variant="outline"
								disabled={gameState.isRunning && !gameState.isPaused}
							>
								Deal One
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-sm font-medium">Speed:</span>
							<Slider
								value={[gameState.dealSpeed]}
								min={500}
								max={5000}
								step={100}
								onValueChange={(value: number[]) => updateSettings({ dealSpeed: value[0] })}
								className="w-32"
								disabled={gameState.isRunning && !gameState.isPaused}
							/>
							<span className="text-sm">{(gameState.dealSpeed / 1000).toFixed(1)}s</span>
						</div>
					</div>
				</CardContent>

				<CardFooter className="flex flex-col gap-4 pt-4 border-t md:flex-row">
					<div className="w-full space-y-4 md:w-1/2">
						<div className="flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-blue-500" />
							<span className="font-medium">Counting Statistics</span>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 rounded-md bg-muted/50">
								<div className="text-sm text-muted-foreground">Running Count</div>
								<div className="mt-1 text-xl font-bold">
									{gameState.showCount ? gameState.runningCount : '?'}
								</div>
							</div>

							<div className="p-3 rounded-md bg-muted/50">
								<div className="text-sm text-muted-foreground">True Count</div>
								<div className="mt-1 text-xl font-bold">
									{gameState.showCount ? gameState.trueCount : '?'}
								</div>
							</div>

							<div className="p-3 rounded-md bg-muted/50">
								<div className="text-sm text-muted-foreground">Accuracy</div>
								<div className="mt-1 text-xl font-bold">{accuracy}%</div>
							</div>

							<div className="p-3 rounded-md bg-muted/50">
								<div className="text-sm text-muted-foreground">Guesses</div>
								<div className="mt-1 text-xl font-bold">
									{gameState.correctGuesses}/{gameState.totalGuesses}
								</div>
							</div>
						</div>

						<div className="flex gap-2">
							<Button variant="outline" onClick={() => handleGuess(gameState.runningCount + 1)}>
								<PlusCircle className="w-4 h-4 mr-2" />
								Count is {gameState.runningCount + 1}
							</Button>
							<Button variant="outline" onClick={() => handleGuess(gameState.runningCount)}>
								Count is {gameState.runningCount}
							</Button>
							<Button variant="outline" onClick={() => handleGuess(gameState.runningCount - 1)}>
								<MinusCircle className="w-4 h-4 mr-2" />
								Count is {gameState.runningCount - 1}
							</Button>
						</div>
					</div>

					<div className="w-full p-4 rounded-md md:w-1/2 bg-muted/30">
						<h4 className="mb-3 font-medium">Recommendations</h4>
						<div className="space-y-4">
							<div>
								<p className="text-sm text-muted-foreground">Betting:</p>
								<p className={`font-medium ${getBetRecommendation.color}`}>
									{getBetRecommendation.text}
								</p>
							</div>

							<div>
								<p className="text-sm text-muted-foreground">Strategy Adjustments:</p>
								<ul className="mt-1 space-y-1 text-sm">
									{getStrategyAdjustments.map(adjustment => (
										<li key={`adjustment-${adjustment}`} className="flex items-start">
											<span className="mr-2">•</span>
											<span>{adjustment}</span>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</CardFooter>
			</Card>

			{/* Systems and information tabs */}
			<Tabs defaultValue="systems" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="systems">Counting Systems</TabsTrigger>
					<TabsTrigger value="tips">Tips & Strategy</TabsTrigger>
					<TabsTrigger value="about">About Card Counting</TabsTrigger>
				</TabsList>

				<TabsContent value="systems" className="py-4 space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						{Object.entries(COUNTING_SYSTEMS).map(([key, system]) => {
							// Get card styles safely
							const getCardValueStyle = (value: number) => {
								if (value > 0) return 'bg-green-100 text-green-800'
								if (value < 0) return 'bg-red-100 text-red-800'
								return 'bg-gray-100 text-gray-800'
							}

							return (
								<Card
									key={key}
									className={`transition-all ${gameState.countingSystem === key ? 'border-primary border-2' : ''
										}`}
								>
									<CardHeader className="pb-2">
										<CardTitle>{system.name}</CardTitle>
										<CardDescription>{system.description}</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-3 gap-2">
											{Object.entries(system.values).map(([card, value]) => (
												<div
													key={`${key}-${card}`}
													className={`
                                                        rounded p-2 text-center font-mono
                                                        ${getCardValueStyle(value)}
                                                    `}
												>
													{card}: {value > 0 ? `+${value}` : value}
												</div>
											))}
										</div>
									</CardContent>
									<CardFooter>
										<Button
											variant={gameState.countingSystem === key ? 'secondary' : 'outline'}
											className="w-full"
											onClick={() => {
												if (isValidCountingSystem(key)) {
													updateSettings({ countingSystem: key })
												}
											}}
										>
											{gameState.countingSystem === key ? 'Selected' : 'Select System'}
										</Button>
									</CardFooter>
								</Card>
							)
						})}
					</div>
				</TabsContent>

				<TabsContent value="tips" className="py-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Card Counting Tips</CardTitle>
							<CardDescription>
								Improve your card counting skills with these professional tips
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="mb-2 text-lg font-medium">Practice Techniques</h4>
								<ul className="space-y-2">
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Start with a single deck before moving to multiple decks</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>
											Practice counting down a deck - it should equal zero for balanced systems
										</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Count pairs of cards to improve speed</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Practice with distractions to simulate real casino environments</span>
									</li>
								</ul>
							</div>

							<div>
								<h4 className="mb-2 text-lg font-medium">Advanced Techniques</h4>
								<ul className="space-y-2">
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>
											True Count: Divide the running count by decks remaining for better accuracy
										</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>
											Bet spread: Vary your bets based on the true count (1-8x minimum bet)
										</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Practice deviations from basic strategy based on the count</span>
									</li>
								</ul>
							</div>

							<div className="p-4 rounded-md bg-muted/30">
								<h4 className="mb-2 font-medium">Casino Behavior</h4>
								<p className="mb-2 text-sm text-muted-foreground">
									Card counting is legal but casinos may ask you to leave if they suspect counting.
								</p>
								<ul className="space-y-1 text-sm">
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Maintain a consistent betting pattern</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Don&apos;t stare at the cards intensely</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Blend in with other casual players</span>
									</li>
									<li className="flex gap-2">
										<span className="text-primary">•</span>
										<span>Avoid obvious count-based betting patterns</span>
									</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="about" className="py-4 space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>About Card Counting</CardTitle>
							<CardDescription>
								Understanding the mathematics and history behind card counting
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h4 className="mb-2 text-lg font-medium">What is Card Counting?</h4>
								<p className="text-sm text-muted-foreground">
									Card counting is a strategy used in blackjack to determine whether the next hand
									is likely to give an advantage to the player or the dealer. When the count
									indicates an advantage to the player, the player increases their bets.
								</p>
							</div>

							<div>
								<h4 className="mb-2 text-lg font-medium">The Mathematics</h4>
								<p className="text-sm text-muted-foreground">
									Card counting works because blackjack has a memory - cards removed from the deck
									affect the probability of future hands. High cards (10, J, Q, K, A) benefit the
									player, while low cards (2-6) benefit the dealer. When many high cards remain,
									players have better odds of winning.
								</p>
							</div>

							<div>
								<h4 className="mb-2 text-lg font-medium">Edge Calculation</h4>
								<p className="text-sm text-muted-foreground">
									For every +1 true count, the player gains approximately a 0.5% edge over the
									house. So a true count of +5 gives the player about a 2.5% advantage, which is
									significant in blackjack where the house edge is typically around 0.5%.
								</p>
							</div>

							<div className="p-4 mt-6 rounded-md bg-muted/30">
								<h4 className="mb-2 font-medium">Famous Card Counters</h4>
								<ul className="space-y-2 text-sm">
									<li>
										<span className="font-medium">Edward Thorp</span> - Author of &quot;Beat the
										Dealer&quot; (1962), the first book to mathematically prove card counting could
										beat blackjack
									</li>
									<li>
										<span className="font-medium">MIT Blackjack Team</span> - Group of students who
										used team-based counting strategies to win millions from casinos in the
										1980s-90s
									</li>
									<li>
										<span className="font-medium">Stanford Wong</span> - Developed the technique of
										&quot;Wonging&quot; (joining tables only when the count is favorable)
									</li>
								</ul>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Settings Dialog */}
			<Dialog
				open={gameState.isSettingsOpen}
				onOpenChange={(open: boolean) => updateSettings({ isSettingsOpen: open })}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Card Counting Settings</DialogTitle>
						<DialogDescription>Customize your card counting practice experience</DialogDescription>
					</DialogHeader>

					<div className="py-4 space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="hint-mode" className="flex flex-col">
								<span>Hint Mode</span>
								<span className="text-sm font-normal text-muted-foreground">
									Show counting hints for learning
								</span>
							</Label>
							<Switch
								id="hint-mode"
								checked={gameState.isHintMode}
								onCheckedChange={(checked: boolean) => updateSettings({ isHintMode: checked })}
							/>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="value-hints" className="flex flex-col">
								<span>Card Value Hints</span>
								<span className="text-sm font-normal text-muted-foreground">
									Show +/- values on cards
								</span>
							</Label>
							<Switch
								id="value-hints"
								checked={gameState.showValueHints}
								onCheckedChange={(checked: boolean) => updateSettings({ showValueHints: checked })}
								disabled={!gameState.isHintMode}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="system-select">Counting System</Label>
							<Select
								value={gameState.countingSystem}
								onValueChange={(value: string) => {
									if (isValidCountingSystem(value)) {
										updateSettings({ countingSystem: value })
									}
								}}
							>
								<SelectTrigger id="system-select">
									<SelectValue placeholder="Select a counting system" />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(COUNTING_SYSTEMS).map(([key, system]) => (
										<SelectItem key={key} value={key}>
											{system.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex justify-between">
								<Label htmlFor="deal-speed">Card Deal Speed</Label>
								<span className="text-sm text-muted-foreground">
									{(gameState.dealSpeed / 1000).toFixed(1)}s
								</span>
							</div>
							<Slider
								id="deal-speed"
								value={[gameState.dealSpeed]}
								min={500}
								max={5000}
								step={100}
								onValueChange={(value: number[]) => updateSettings({ dealSpeed: value[0] })}
							/>
						</div>
					</div>

					<DialogFooter className="sm:justify-between">
						<Button type="button" variant="destructive" onClick={initializeDeck}>
							Reset Deck
						</Button>
						<Button type="button" onClick={() => updateSettings({ isSettingsOpen: false })}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default ClientSideCardCountingTrainer
