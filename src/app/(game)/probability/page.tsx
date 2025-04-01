'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/layout/button'
import { Info, Download, ChevronRight } from 'lucide-react'

// Types for our probability data
interface ProbabilityData {
	playerHand: string
	dealerUpcard: string
	hit: number
	stand: number
	double: number
	split?: number
}

interface BustProbability {
	handValue: number
	bustPercentage: number
}

interface DealerFinalHand {
	value: string
	probability: number
	cumulativeProbability: number
}

interface TwoCardFrequency {
	handType: string
	frequency: number
}

interface CountingSystem {
	name: string
	description: string
	values: {
		cards: string
		count: number
	}[]
	difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
	effectiveness: number
}

interface AdvancedStrategy {
	name: string
	description: string
	keyPoints: string[]
	effectiveness: number
}

// Bust Probabilities Data
const bustProbabilities: BustProbability[] = [
	{ handValue: 21, bustPercentage: 100 },
	{ handValue: 20, bustPercentage: 92 },
	{ handValue: 19, bustPercentage: 85 },
	{ handValue: 18, bustPercentage: 77 },
	{ handValue: 17, bustPercentage: 69 },
	{ handValue: 16, bustPercentage: 62 },
	{ handValue: 15, bustPercentage: 58 },
	{ handValue: 14, bustPercentage: 56 },
	{ handValue: 13, bustPercentage: 39 },
	{ handValue: 12, bustPercentage: 31 },
	{ handValue: 11, bustPercentage: 0 },
]

// Dealer Final Hand Probabilities
const dealerFinalHands: DealerFinalHand[] = [
	{ value: 'Natural 21', probability: 4.82, cumulativeProbability: 4.83 },
	{ value: '21 (3+ Cards)', probability: 7.36, cumulativeProbability: 12.19 },
	{ value: '20', probability: 17.58, cumulativeProbability: 29.77 },
	{ value: '19', probability: 13.48, cumulativeProbability: 43.25 },
	{ value: '18', probability: 13.81, cumulativeProbability: 57.06 },
	{ value: '17', probability: 14.58, cumulativeProbability: 71.64 },
	{ value: '16 or Less', probability: 28.36, cumulativeProbability: 100.0 },
]

// Two-Card Count Frequencies
const twoCardFrequencies: TwoCardFrequency[] = [
	{ handType: 'Natural 21', frequency: 4.8 },
	{ handType: 'Hard Standing (17-20)', frequency: 30.0 },
	{ handType: 'Decision Hands (12-16)', frequency: 38.7 },
	{ handType: 'No Bust (11 or less)', frequency: 26.5 },
]

// Basic Strategy Data with more comprehensive scenarios
const basicStrategyData: ProbabilityData[] = [
	{
		playerHand: 'Hard 16',
		dealerUpcard: '7',
		hit: 0.4235,
		stand: 0.3765,
		double: 0,
	},
	{
		playerHand: 'Hard 12',
		dealerUpcard: '4',
		hit: 0.3012,
		stand: 0.6988,
		double: 0,
	},
	{
		playerHand: 'Soft 18',
		dealerUpcard: '2',
		hit: 0.2341,
		stand: 0.7659,
		double: 0.1234,
	},
	{
		playerHand: 'Pair of 8s',
		dealerUpcard: '10',
		hit: 0.3876,
		stand: 0.2124,
		double: 0,
		split: 0.4,
	},
]

const countingSystems: CountingSystem[] = [
	{
		name: 'Hi-Lo',
		description: 'The most popular card counting system. Balanced and effective for beginners.',
		values: [
			{ cards: '2, 3, 4, 5, 6', count: 1 },
			{ cards: '7, 8, 9', count: 0 },
			{ cards: '10, J, Q, K, A', count: -1 },
		],
		difficulty: 'Beginner',
		effectiveness: 0.97,
	},
	{
		name: 'KO (Knockout)',
		description: "An unbalanced system that's easier to use than Hi-Lo but still effective.",
		values: [
			{ cards: '2, 3, 4, 5, 6, 7', count: 1 },
			{ cards: '8, 9', count: 0 },
			{ cards: '10, J, Q, K, A', count: -1 },
		],
		difficulty: 'Beginner',
		effectiveness: 0.95,
	},
	{
		name: 'Hi-Opt II',
		description: 'A more complex system that provides greater accuracy in betting correlation.',
		values: [
			{ cards: '2, 3, 6, 7', count: 1 },
			{ cards: '4, 5', count: 2 },
			{ cards: '8, 9', count: 0 },
			{ cards: '10, J, Q, K', count: -2 },
			{ cards: 'A', count: 0 },
		],
		difficulty: 'Advanced',
		effectiveness: 0.99,
	},
	{
		name: 'Omega II',
		description: 'One of the most powerful counting systems, offering high betting correlation.',
		values: [
			{ cards: '2, 3, 7', count: 1 },
			{ cards: '4, 5, 6', count: 2 },
			{ cards: '8', count: 0 },
			{ cards: '9', count: -1 },
			{ cards: '10, J, Q, K', count: -2 },
			{ cards: 'A', count: 0 },
		],
		difficulty: 'Advanced',
		effectiveness: 1.0,
	},
]

const advancedStrategies: AdvancedStrategy[] = [
	{
		name: 'Deck Penetration Analysis',
		description:
			'Understanding how deck penetration affects your advantage and when to adjust your strategy.',
		keyPoints: [
			'Optimal penetration is 75% or deeper for most counting systems',
			'Advantage increases significantly after 65% penetration',
			'True count becomes more reliable with deeper penetration',
			'Consider increasing bet spread in deep penetration',
		],
		effectiveness: 0.92,
	},
	{
		name: 'Composition-Dependent Strategy',
		description:
			'Adjusting basic strategy based on the specific cards in your hand rather than just the total.',
		keyPoints: [
			'16 composed of 10-6 plays differently than 9-7',
			'Multiple small cards increase the value of doubling down',
			'Specific card removal effects influence optimal play',
			'Consider card combinations when splitting pairs',
		],
		effectiveness: 0.95,
	},
	{
		name: 'Wonging Technique',
		description: 'Strategic table entry and exit based on count conditions to maximize advantage.',
		keyPoints: [
			'Enter tables when count is favorable',
			'Exit or reduce bets when count becomes negative',
			'Consider multiple table positions',
			'Track shuffle timing and procedures',
		],
		effectiveness: 0.88,
	},
]

export default function ProbabilityChartsPage() {
	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.6,
				staggerChildren: 0.1,
			},
		},
	}

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 },
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
			<motion.div
				className="container px-4 py-16 mx-auto"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				{/* Header Section */}
				<motion.div variants={itemVariants} className="pt-16 mb-12 text-center">
					<h1 className="mb-4 text-4xl font-bold text-transparent bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 bg-clip-text font-playfair">
						Blackjack Probability Charts
					</h1>
					<p className="max-w-2xl mx-auto text-gray-400">
						Master the game with our comprehensive probability analysis and strategic insights. From
						basic odds to advanced calculations, make informed decisions at every hand.
					</p>
				</motion.div>

				{/* Main Content */}
				<motion.div variants={itemVariants}>
					<Card className="overflow-hidden border-amber-900/20">
						<Tabs defaultValue="basic-strategy" className="w-full">
							<TabsList className="grid w-full grid-cols-3 bg-black/50">
								<TabsTrigger value="basic-strategy">Basic Strategy</TabsTrigger>
								<TabsTrigger value="card-counting">Card Counting</TabsTrigger>
								<TabsTrigger value="advanced-odds">Advanced Odds</TabsTrigger>
							</TabsList>

							<ScrollArea className="h-[800px]">
								{/* Basic Strategy Content */}
								<TabsContent value="basic-strategy" className="p-6">
									<div className="space-y-6">
										<div className="flex items-center justify-between">
											<h2 className="text-2xl font-semibold text-amber-400">
												Basic Strategy Charts
											</h2>
											<Button variant="outline" size="sm" className="gap-2">
												<Download size={16} />
												Download PDF
											</Button>
										</div>

										{/* Strategy Table */}
										<div className="overflow-hidden border rounded-lg border-amber-900/20">
											<Table>
												<TableHeader className="bg-black/50">
													<TableRow>
														<TableHead className="text-amber-400">Player Hand</TableHead>
														<TableHead className="text-amber-400">Dealer Upcard</TableHead>
														<TableHead className="text-amber-400">Hit %</TableHead>
														<TableHead className="text-amber-400">Stand %</TableHead>
														<TableHead className="text-amber-400">Double %</TableHead>
														<TableHead className="text-amber-400">Split %</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{basicStrategyData.map(row => (
														<TableRow key={`${row.playerHand}-${row.dealerUpcard}`}>
															<TableCell className="font-medium">{row.playerHand}</TableCell>
															<TableCell>{row.dealerUpcard}</TableCell>
															<TableCell>{(row.hit * 100).toFixed(2)}%</TableCell>
															<TableCell>{(row.stand * 100).toFixed(2)}%</TableCell>
															<TableCell>{(row.double * 100).toFixed(2)}%</TableCell>
															<TableCell>
																{row.split ? (row.split * 100).toFixed(2) + '%' : 'N/A'}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>

										{/* Bust Probability Table */}
										<div className="mt-8">
											<div className="mb-4 text-xl font-semibold text-amber-400">
												Probability of Busting
											</div>
											<div className="overflow-hidden border rounded-lg border-amber-900/20">
												<Table>
													<TableHeader className="bg-black/50">
														<TableRow>
															<TableHead className="text-amber-400">Hand Value</TableHead>
															<TableHead className="text-amber-400">Bust Probability</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{bustProbabilities.map(prob => (
															<TableRow key={prob.handValue}>
																<TableCell className="font-medium">{prob.handValue}</TableCell>
																<TableCell>{prob.bustPercentage}%</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>

										{/* Dealer Final Hand Probabilities */}
										<div className="mt-8">
											<div className="mb-4 text-xl font-semibold text-amber-400">
												Dealer Final Hand Probabilities
											</div>
											<div className="overflow-hidden border rounded-lg border-amber-900/20">
												<Table>
													<TableHeader className="bg-black/50">
														<TableRow>
															<TableHead className="text-amber-400">Final Hand</TableHead>
															<TableHead className="text-amber-400">Probability</TableHead>
															<TableHead className="text-amber-400">Cumulative</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{dealerFinalHands.map(hand => (
															<TableRow key={hand.value}>
																<TableCell className="font-medium">{hand.value}</TableCell>
																<TableCell>{hand.probability}%</TableCell>
																<TableCell>{hand.cumulativeProbability}%</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>

										{/* Two-Card Frequencies */}
										<div className="mt-8">
											<div className="mb-4 text-xl font-semibold text-amber-400">
												Two-Card Hand Frequencies
											</div>
											<div className="overflow-hidden border rounded-lg border-amber-900/20">
												<Table>
													<TableHeader className="bg-black/50">
														<TableRow>
															<TableHead className="text-amber-400">Hand Type</TableHead>
															<TableHead className="text-amber-400">Frequency</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{twoCardFrequencies.map(freq => (
															<TableRow key={freq.handType}>
																<TableCell className="font-medium">{freq.handType}</TableCell>
																<TableCell>{freq.frequency}%</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>

										{/* Strategy Explanations */}
										<Accordion type="single" collapsible className="w-full">
											<AccordionItem value="hard-totals">
												<AccordionTrigger className="text-amber-400 hover:text-amber-300">
													Hard Totals Strategy
												</AccordionTrigger>
												<AccordionContent className="text-gray-400">
													Hard totals are hands that either don&apos;t contain an Ace, or contain an
													Ace that must be counted as 1 to avoid busting. The strategy for hard
													totals is generally more straightforward than for soft hands.
												</AccordionContent>
											</AccordionItem>
											<AccordionItem value="soft-totals">
												<AccordionTrigger className="text-amber-400 hover:text-amber-300">
													Soft Totals Strategy
												</AccordionTrigger>
												<AccordionContent className="text-gray-400">
													Soft hands contain an Ace that can be counted as either 1 or 11 without
													busting. These hands offer more flexibility and often different strategic
													options compared to hard totals.
												</AccordionContent>
											</AccordionItem>
											<AccordionItem value="pair-splitting">
												<AccordionTrigger className="text-amber-400 hover:text-amber-300">
													Pair Splitting Rules
												</AccordionTrigger>
												<AccordionContent className="text-gray-400">
													When you&apos;re dealt a pair, you have the option to split them into two
													separate hands. The decision to split depends on both the pair you have
													and the dealer&apos;s upcard.
												</AccordionContent>
											</AccordionItem>
										</Accordion>
									</div>
								</TabsContent>

								{/* Card Counting Content */}
								<TabsContent value="card-counting" className="p-6">
									<div className="space-y-8">
										<div className="flex items-center justify-between">
											<h2 className="text-2xl font-semibold text-amber-400">
												Card Counting Systems
											</h2>
											<Button variant="outline" size="sm" className="gap-2">
												<Download size={16} />
												Download Guide
											</Button>
										</div>

										{/* Systems Grid */}
										<div className="grid gap-6 md:grid-cols-2">
											{countingSystems.map(system => (
												<Card key={system.name} className="p-6 bg-black/30 border-amber-900/20">
													<div className="flex items-start justify-between mb-4">
														<h3 className="text-lg font-semibold text-amber-300">{system.name}</h3>
														<div className="px-2 py-1 text-xs font-medium rounded-full bg-amber-900/20 text-amber-400">
															{system.difficulty}
														</div>
													</div>
													<p className="mb-4 text-gray-400">{system.description}</p>

													{/* Count Values Table */}
													<div className="mb-4 overflow-hidden border rounded-lg border-amber-900/20">
														<Table>
															<TableHeader className="bg-black/50">
																<TableRow>
																	<TableHead className="text-amber-400">Cards</TableHead>
																	<TableHead className="text-amber-400">Count</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{system.values.map(value => (
																	<TableRow key={`${value.cards}-${value.count}`}>
																		<TableCell className="font-medium">{value.cards}</TableCell>
																		<TableCell>
																			{value.count > 0 ? `+${value.count}` : value.count}
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</div>

													<div className="flex items-center justify-between">
														<div className="text-sm text-gray-400">
															Effectiveness: {(system.effectiveness * 100).toFixed(0)}%
														</div>
														<Button variant="outline" size="sm" className="gap-2">
															Practice <ChevronRight size={16} />
														</Button>
													</div>
												</Card>
											))}
										</div>

										{/* Additional Tips */}
										<div className="mt-8">
											<div className="mb-4 text-xl font-semibold text-amber-400">
												Essential Card Counting Tips
											</div>
											<div className="grid gap-6 md:grid-cols-2">
												<Card className="p-6 bg-black/30 border-amber-900/20">
													<h4 className="mb-3 text-lg font-semibold text-amber-300">
														True Count Calculation
													</h4>
													<p className="text-gray-400">
														True Count = Running Count ÷ Decks Remaining
														<br />
														<br />
														This conversion is crucial for accurate betting decisions. Always
														estimate decks remaining to the nearest 0.5 deck for better precision.
													</p>
												</Card>
												<Card className="p-6 bg-black/30 border-amber-900/20">
													<h4 className="mb-3 text-lg font-semibold text-amber-300">
														Betting Correlation
													</h4>
													<p className="text-gray-400">
														Increase your bet when the true count is positive, as this indicates a
														player advantage. A general rule is to increase your bet by one unit for
														each positive true count value.
													</p>
												</Card>
											</div>
										</div>
									</div>
								</TabsContent>

								{/* Advanced Odds Content */}
								<TabsContent value="advanced-odds" className="p-6">
									<div className="space-y-8">
										<div className="flex items-center justify-between">
											<h2 className="text-2xl font-semibold text-amber-400">
												Advanced Probability Analysis
											</h2>
											<Button variant="outline" size="sm" className="gap-2">
												<Download size={16} />
												Export Data
											</Button>
										</div>

										{/* Advanced Strategies Grid */}
										<div className="grid gap-6">
											{advancedStrategies.map(strategy => (
												<Card key={strategy.name} className="p-6 bg-black/30 border-amber-900/20">
													<div className="flex items-start gap-4">
														<div className="p-2 rounded-full bg-amber-900/20">
															<Info className="w-6 h-6 text-amber-400" />
														</div>
														<div className="flex-1">
															<div className="flex items-center justify-between mb-2">
																<h3 className="text-lg font-semibold text-amber-300">
																	{strategy.name}
																</h3>
																<div className="px-3 py-1 text-sm rounded-full bg-amber-900/20 text-amber-400">
																	{(strategy.effectiveness * 100).toFixed(0)}% Effective
																</div>
															</div>
															<p className="mb-4 text-gray-400">{strategy.description}</p>
															<div className="space-y-2">
																{strategy.keyPoints.map((point, pIndex) => (
																	<div
																		key={`${strategy.name}-point-${pIndex}`}
																		className="flex items-start gap-2"
																	>
																		<div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
																		<p className="flex-1 text-sm text-gray-400">{point}</p>
																	</div>
																))}
															</div>
														</div>
													</div>
												</Card>
											))}
										</div>

										{/* Probability Analysis Tools */}
										<div className="mt-8">
											<div className="mb-4 text-xl font-semibold text-amber-400">
												Advanced Analysis Tools
											</div>
											<div className="grid gap-6 md:grid-cols-2">
												<Card className="p-6 bg-black/30 border-amber-900/20">
													<h4 className="mb-3 text-lg font-semibold text-amber-300">
														Expected Value Calculator
													</h4>
													<p className="mb-4 text-gray-400">
														Calculate the expected value of any playing decision based on:
														<br />- Current hand composition
														<br />- Dealer&apos;s upcard
														<br />- True count
														<br />- Deck penetration
													</p>
													<Button variant="outline" className="w-full gap-2">
														Open Calculator <ChevronRight size={16} />
													</Button>
												</Card>
												<Card className="p-6 bg-black/30 border-amber-900/20">
													<h4 className="mb-3 text-lg font-semibold text-amber-300">
														Risk Analysis Dashboard
													</h4>
													<p className="mb-4 text-gray-400">
														Monitor your risk and variance in real-time:
														<br />- Bankroll fluctuation
														<br />- Win/loss streaks
														<br />- Optimal bet sizing
														<br />- Risk of ruin calculations
													</p>
													<Button variant="outline" className="w-full gap-2">
														View Dashboard <ChevronRight size={16} />
													</Button>
												</Card>
											</div>
										</div>
									</div>
								</TabsContent>
							</ScrollArea>
						</Tabs>
					</Card>
				</motion.div>
			</motion.div>
		</div>
	)
}
