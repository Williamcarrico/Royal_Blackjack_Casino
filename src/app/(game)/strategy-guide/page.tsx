'use client'

import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/layout/button'
import { cn } from '@/lib/utils/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
}

const slideIn = {
	hidden: { opacity: 0, x: -20 },
	visible: { opacity: 1, x: 0 },
}

const scaleIn = {
	hidden: { opacity: 0, scale: 0.95 },
	visible: { opacity: 1, scale: 1 },
}

export default function StrategyGuidePage() {
	const [activeTab, setActiveTab] = useState('basic')
	const [showFullChart, setShowFullChart] = useState(false)

	// Create multiple refs for different sections
	const [headerRef, headerInView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	})

	const [strategyRef, strategyInView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
		delay: 200,
	})

	const [practiceRef, practiceInView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	})

	const [countingRef, countingInView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
	})

	const handleViewFullChart = () => {
		setShowFullChart(true)
	}

	const handleCloseFullChart = () => {
		setShowFullChart(false)
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-black via-black/95 to-black/90">
			<div className="container px-4 py-10 pt-32 mx-auto">
				<motion.div
					ref={headerRef}
					initial="hidden"
					animate={headerInView ? 'visible' : 'hidden'}
					variants={fadeIn}
					transition={{ duration: 0.6 }}
				>
					<h1 className="mb-6 text-5xl font-bold text-center text-transparent bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 bg-clip-text">
						Master Blackjack Strategy Guide
					</h1>
					<p className="max-w-2xl mx-auto mb-10 text-center text-gray-400">
						From basic rules to advanced techniques, master the art of blackjack with our
						comprehensive guide powered by real-time analytics and AI-driven insights.
					</p>
				</motion.div>

				<div className="max-w-6xl mx-auto">
					<motion.div
						ref={strategyRef}
						initial="hidden"
						animate={strategyInView ? 'visible' : 'hidden'}
						variants={slideIn}
						transition={{ duration: 0.4, delay: 0.2 }}
					>
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
							<TabsList className="grid grid-cols-4 mb-8">
								<TabsTrigger
									value="basic"
									className={cn(
										'text-lg transition-all duration-200',
										activeTab === 'basic' &&
										'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg'
									)}
								>
									Basic Strategy
								</TabsTrigger>
								<TabsTrigger
									value="advanced"
									className={cn(
										'text-lg transition-all duration-200',
										activeTab === 'advanced' &&
										'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg'
									)}
								>
									Advanced Play
								</TabsTrigger>
								<TabsTrigger
									value="counting"
									className={cn(
										'text-lg transition-all duration-200',
										activeTab === 'counting' &&
										'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg'
									)}
								>
									Card Counting
								</TabsTrigger>
								<TabsTrigger
									value="engine"
									className={cn(
										'text-lg transition-all duration-200',
										activeTab === 'engine' &&
										'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg'
									)}
								>
									Probability Engine
								</TabsTrigger>
							</TabsList>

							{/* Basic Strategy Content */}
							<TabsContent value="basic">
								<AnimatePresence mode="wait">
									<motion.div
										key="basic-content"
										ref={practiceRef}
										initial="hidden"
										animate={practiceInView ? 'visible' : 'hidden'}
										variants={scaleIn}
										transition={{ duration: 0.4 }}
										className="space-y-6"
									>
										<Card className="bg-black/50 border-yellow-800/30">
											<CardHeader>
												<CardTitle className="text-2xl text-yellow-500">
													Basic Strategy Fundamentals
												</CardTitle>
												<CardDescription className="text-gray-400">
													Master the core principles that form the foundation of winning blackjack
													play
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="grid gap-6 md:grid-cols-2">
													<div className="space-y-4">
														<h3 className="text-xl font-semibold text-amber-400">Core Rules</h3>
														<ul className="space-y-2 text-gray-300">
															<li className="flex items-center gap-2">
																<TooltipProvider>
																	<Tooltip>
																		<TooltipTrigger>
																			<Badge variant="outline" className="bg-green-900/20">
																				Rule 1
																			</Badge>
																		</TooltipTrigger>
																		<TooltipContent>
																			<p>
																				With a hard total of 8 or less, hitting is always the
																				mathematically correct play
																			</p>
																		</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
																Always hit on hard 8 or below
															</li>
															<li className="flex items-center gap-2">
																<TooltipProvider>
																	<Tooltip>
																		<TooltipTrigger>
																			<Badge variant="outline" className="bg-green-900/20">
																				Rule 2
																			</Badge>
																		</TooltipTrigger>
																		<TooltipContent>
																			<p>
																				A hard 17 or higher has a good chance of winning without
																				risking a bust
																			</p>
																		</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
																Always stand on hard 17 and above
															</li>
															<li className="flex items-center gap-2">
																<TooltipProvider>
																	<Tooltip>
																		<TooltipTrigger>
																			<Badge variant="outline" className="bg-green-900/20">
																				Rule 3
																			</Badge>
																		</TooltipTrigger>
																		<TooltipContent>
																			<p>
																				11 is the strongest double down hand - you can&apos;t bust
																				and have a good chance of making 21
																			</p>
																		</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
																Double down on 11 vs any dealer card
															</li>
														</ul>
													</div>

													<div className="relative h-[300px] rounded-lg overflow-hidden group">
														<Image
															src="/images/ai-strategy.webp"
															alt="Basic Strategy Chart"
															fill
															className="object-cover transition-transform duration-300 group-hover:scale-105"
															priority
														/>
														<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
														<Button
															className="absolute z-10 transition-transform bg-yellow-600 bottom-4 left-4 hover:bg-yellow-700"
															onClick={handleViewFullChart}
															aria-label="View full blackjack strategy chart"
														>
															View Full Chart
														</Button>
													</div>
												</div>

												<div className="grid gap-4 mt-8 md:grid-cols-3">
													<Card className="bg-green-900/20 border-green-800/30">
														<CardHeader>
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger>
																		<CardTitle className="text-lg text-green-400 cursor-help">
																			Hard Hands
																		</CardTitle>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>A hand without an Ace counting as 11</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														</CardHeader>
														<CardContent>
															<ScrollArea className="h-[200px] rounded-md border border-green-900/20 p-4">
																<ul className="space-y-2 text-gray-300">
																	<li>• 8 or less: Always hit</li>
																	<li>• 9: Double vs 3-6, otherwise hit</li>
																	<li>• 10: Double vs 2-9, otherwise hit</li>
																	<li>• 11: Double vs all, hit vs Ace</li>
																	<li>• 12: Stand vs 4-6, otherwise hit</li>
																	<li>• 13-16: Stand vs 2-6, otherwise hit</li>
																	<li>• 17+: Always stand</li>
																</ul>
															</ScrollArea>
														</CardContent>
													</Card>

													<Card className="bg-blue-900/20 border-blue-800/30">
														<CardHeader>
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger>
																		<CardTitle className="text-lg text-blue-400 cursor-help">
																			Soft Hands
																		</CardTitle>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>A hand with an Ace counting as 11</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														</CardHeader>
														<CardContent>
															<ScrollArea className="h-[200px] rounded-md border border-blue-900/20 p-4">
																<ul className="space-y-2 text-gray-300">
																	<li>• A,2-A,5: Double vs 4-6, otherwise hit</li>
																	<li>• A,6: Double vs 3-6, otherwise hit</li>
																	<li>• A,7: Double vs 3-6, stand vs 7-8, hit vs 9-A</li>
																	<li>• A,8: Stand vs 2-8, hit vs 9-A</li>
																	<li>• A,9: Always stand</li>
																</ul>
															</ScrollArea>
														</CardContent>
													</Card>

													<Card className="bg-purple-900/20 border-purple-800/30">
														<CardHeader>
															<CardTitle className="text-lg text-purple-400">Pairs</CardTitle>
														</CardHeader>
														<CardContent>
															<ScrollArea className="h-[200px] rounded-md border border-purple-900/20 p-4">
																<ul className="space-y-2 text-gray-300">
																	<li>• 2,2 / 3,3: Split vs 4-7, otherwise hit</li>
																	<li>• 4,4: Never split</li>
																	<li>• 5,5: Never split, treat as 10</li>
																	<li>• 6,6: Split vs 2-6, otherwise hit</li>
																	<li>• 7,7: Split vs 2-7, otherwise hit</li>
																	<li>• 8,8: Always split</li>
																	<li>• 9,9: Split vs 2-9 except 7, stand vs 7</li>
																	<li>• A,A: Always split</li>
																</ul>
															</ScrollArea>
														</CardContent>
													</Card>
												</div>
											</CardContent>
										</Card>

										<Card className="bg-black/50 border-yellow-800/30">
											<CardHeader>
												<CardTitle className="text-2xl text-yellow-500">
													Interactive Practice
												</CardTitle>
												<CardDescription className="text-gray-400">
													Test your knowledge with our interactive practice mode
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="p-8 text-center">
													<Button className="text-black bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700">
														Start Practice Session
													</Button>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								</AnimatePresence>
							</TabsContent>

							{/* Card Counting Content */}
							<TabsContent value="counting">
								<AnimatePresence mode="wait">
									<motion.div
										key="counting-content"
										ref={countingRef}
										initial="hidden"
										animate={countingInView ? 'visible' : 'hidden'}
										variants={scaleIn}
										transition={{ duration: 0.4 }}
										className="space-y-6"
									>
										<Card className="bg-black/50 border-yellow-800/30">
											<CardHeader>
												<CardTitle className="text-2xl text-yellow-500">
													Card Counting Systems
												</CardTitle>
												<CardDescription className="text-gray-400">
													Learn various card counting methods and their applications
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="grid gap-6 md:grid-cols-3">
													<Card className="bg-green-900/20">
														<CardHeader>
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger>
																		<CardTitle className="text-lg text-green-400 cursor-help">
																			Hi-Lo System
																		</CardTitle>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>The most popular counting system - balanced and effective</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														</CardHeader>
														<CardContent>
															<ul className="space-y-2 text-gray-300">
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				2-6: +1
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Low cards favor the dealer - count increases</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				7-9: 0
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Neutral cards - no effect on count</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				10-A: -1
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>High cards favor the player - count decreases</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
															</ul>
														</CardContent>
													</Card>

													<Card className="bg-blue-900/20">
														<CardHeader>
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger>
																		<CardTitle className="text-lg text-blue-400 cursor-help">
																			KO System
																		</CardTitle>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>Knockout System - Unbalanced but easier to learn</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														</CardHeader>
														<CardContent>
															<ul className="space-y-2 text-gray-300">
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				2-7: +1
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Includes 7 as a low card for easier counting</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				8-9: 0
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Neutral cards in the KO system</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				10-A: -1
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>High cards decrease the count</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
															</ul>
														</CardContent>
													</Card>

													<Card className="bg-purple-900/20">
														<CardHeader>
															<TooltipProvider>
																<Tooltip>
																	<TooltipTrigger>
																		<CardTitle className="text-lg text-purple-400 cursor-help">
																			Zen Count
																		</CardTitle>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>Advanced system with more precise values</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														</CardHeader>
														<CardContent>
															<ul className="space-y-2 text-gray-300">
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				2-6: +1
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Low cards increase the count</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				7: 0
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Seven is neutral in Zen Count</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				8-9: -1
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Medium-high cards slightly decrease count</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				10-K: -2
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Ten-value cards have highest negative value</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
																<li>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger className="w-full text-left">
																				A: -1
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>Aces are tracked separately in Zen Count</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</li>
															</ul>
														</CardContent>
													</Card>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								</AnimatePresence>
							</TabsContent>

							{/* Advanced Content */}
							<TabsContent value="advanced">
								<AnimatePresence mode="wait">
									<motion.div
										key="advanced-content"
										initial="hidden"
										whileInView="visible"
										viewport={{ once: true, amount: 0.1 }}
										variants={scaleIn}
										transition={{ duration: 0.4 }}
										className="space-y-6"
									>
										<Card className="bg-black/50 border-yellow-800/30">
											<CardHeader>
												<CardTitle className="text-2xl text-yellow-500">
													Advanced Techniques
												</CardTitle>
												<CardDescription className="text-gray-400">
													Master sophisticated strategies to gain an edge
												</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="grid gap-6 md:grid-cols-2">
													<div className="space-y-4">
														<h3 className="text-xl font-semibold text-amber-400">
															Deviations from Basic Strategy
														</h3>
														<div className="space-y-4">
															<Card className="bg-black/30">
																<CardHeader>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger>
																				<CardTitle className="text-lg cursor-help">
																					Insurance Decisions
																				</CardTitle>
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>
																					Insurance is a side bet that pays 2:1 if dealer has
																					blackjack
																				</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</CardHeader>
																<CardContent>
																	<p className="text-gray-300">
																		Take insurance when true count {`>`} +3
																	</p>
																</CardContent>
															</Card>
															<Card className="bg-black/30">
																<CardHeader>
																	<TooltipProvider>
																		<Tooltip>
																			<TooltipTrigger>
																				<CardTitle className="text-lg cursor-help">
																					16 vs 10
																				</CardTitle>
																			</TooltipTrigger>
																			<TooltipContent>
																				<p>A key index play that changes based on the count</p>
																			</TooltipContent>
																		</Tooltip>
																	</TooltipProvider>
																</CardHeader>
																<CardContent>
																	<p className="text-gray-300">Stand when true count {`>`} 0</p>
																</CardContent>
															</Card>
														</div>
													</div>

													<div className="space-y-4">
														<h3 className="text-xl font-semibold text-amber-400">
															Composition-Dependent Plays
														</h3>
														<div className="space-y-4">
															<Card className="bg-black/30">
																<CardHeader>
																	<CardTitle className="text-lg">Multi-Card 16</CardTitle>
																</CardHeader>
																<CardContent>
																	<p className="text-gray-300">Stand vs 10 with 3+ cards</p>
																</CardContent>
															</Card>
															<Card className="bg-black/30">
																<CardHeader>
																	<CardTitle className="text-lg">Rich Deck Analysis</CardTitle>
																</CardHeader>
																<CardContent>
																	<p className="text-gray-300">
																		Adjust decisions based on remaining deck composition
																	</p>
																</CardContent>
															</Card>
														</div>
													</div>
												</div>
											</CardContent>
										</Card>
									</motion.div>
								</AnimatePresence>
							</TabsContent>

							{/* Probability Engine Content */}
							<TabsContent value="engine">
								<AnimatePresence mode="wait">
									<motion.div
										key="engine-content"
										initial="hidden"
										whileInView="visible"
										viewport={{ once: true, amount: 0.1 }}
										variants={scaleIn}
										transition={{ duration: 0.4 }}
										className="space-y-6"
									>
										<h2 className="mb-4 text-2xl font-bold text-yellow-500">
											The Probability Engine
										</h2>

										<p className="mb-6 text-gray-300">
											Our Vegas Blackjack game features a sophisticated probability engine that
											calculates real-time odds and recommends optimal plays. It combines basic
											strategy with advanced simulation techniques to give you the edge.
										</p>

										<motion.div
											initial={{ opacity: 0, y: 20 }}
											whileInView={{ opacity: 1, y: 0 }}
											viewport={{ once: true }}
											transition={{ duration: 0.6, delay: 0.2 }}
											className="p-5 mb-8 border rounded-lg bg-black/40 border-yellow-900/30"
										>
											<h3 className="mb-3 text-xl font-bold text-amber-400">Key Features</h3>

											<div className="grid gap-5 md:grid-cols-2">
												<div className="flex items-start gap-3">
													<div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-900 rounded-full">
														<span className="text-lg">🧮</span>
													</div>
													<div>
														<h4 className="font-bold text-white">Monte Carlo Simulations</h4>
														<p className="text-sm text-gray-300">
															Runs thousands of possible game outcomes to calculate win
															probabilities
														</p>
													</div>
												</div>

												<div className="flex items-start gap-3">
													<div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-green-900 rounded-full">
														<span className="text-lg">🃏</span>
													</div>
													<div>
														<h4 className="font-bold text-white">Exact Card Composition</h4>
														<p className="text-sm text-gray-300">
															Takes into account exactly which cards have been dealt from the shoe
														</p>
													</div>
												</div>

												<div className="flex items-start gap-3">
													<div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-900 rounded-full">
														<span className="text-lg">📊</span>
													</div>
													<div>
														<h4 className="font-bold text-white">Card Counting Analysis</h4>
														<p className="text-sm text-gray-300">
															Tracks running count and true count to refine recommendations
														</p>
													</div>
												</div>

												<div className="flex items-start gap-3">
													<div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-amber-900">
														<span className="text-lg">💡</span>
													</div>
													<div>
														<h4 className="font-bold text-white">AI-Powered Analysis</h4>
														<p className="text-sm text-gray-300">
															Uses TensorFlow.js to process simulations in parallel
														</p>
													</div>
												</div>
											</div>
										</motion.div>

										<motion.div
											initial={{ opacity: 0, y: 20 }}
											whileInView={{ opacity: 1, y: 0 }}
											viewport={{ once: true }}
											transition={{ duration: 0.6, delay: 0.4 }}
											className="mb-8"
										>
											<h3 className="mb-3 text-xl font-bold text-amber-400">
												Understanding the Display
											</h3>

											<div className="flex flex-wrap gap-6">
												<div className="w-full p-4 rounded-lg bg-black/70 md:w-auto">
													<h4 className="mb-2 font-bold text-white">Win Chance</h4>
													<div className="h-4 mb-2 overflow-hidden bg-gray-800 rounded-full">
														<div className="h-full bg-green-500 rounded-full w-[65%]" />
													</div>
													<p className="text-sm text-gray-300">
														Probability of winning the current hand against the dealer
													</p>
												</div>

												<div className="w-full p-4 rounded-lg bg-black/70 md:w-auto">
													<h4 className="mb-2 font-bold text-white">Dealer Bust</h4>
													<div className="h-4 mb-2 overflow-hidden bg-gray-800 rounded-full">
														<div className="h-full bg-red-500 rounded-full w-[40%]" />
													</div>
													<p className="text-sm text-gray-300">
														Probability that the dealer will exceed 21 and bust
													</p>
												</div>

												<div className="w-full p-4 rounded-lg bg-black/70">
													<h4 className="mb-2 font-bold text-white">Recommended Action</h4>
													<div className="grid grid-cols-4 gap-2 mb-2 text-center">
														<div className="p-1 font-bold text-blue-400 rounded bg-blue-900/50">
															HIT
														</div>
														<div className="p-1 font-bold text-green-400 rounded bg-green-900/50">
															STAND
														</div>
														<div className="p-1 font-bold text-purple-400 rounded bg-purple-900/50">
															DOUBLE
														</div>
														<div className="p-1 font-bold text-yellow-400 rounded bg-yellow-900/50">
															SPLIT
														</div>
													</div>
													<p className="text-sm text-gray-300">
														Optimal play based on probability calculations
													</p>
												</div>
											</div>
										</motion.div>

										<motion.div
											initial={{ opacity: 0, scale: 0.95 }}
											whileInView={{ opacity: 1, scale: 1 }}
											viewport={{ once: true }}
											transition={{ duration: 0.4 }}
											className="mt-10 text-center"
										>
											<Link href="/probability">
												<Button className="text-black bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700">
													Try the Probability Demo
												</Button>
											</Link>
										</motion.div>
									</motion.div>
								</AnimatePresence>
							</TabsContent>
						</Tabs>
					</motion.div>
				</div>
			</div>

			{/* Full Chart Modal */}
			{showFullChart && (
				<dialog
					open
					className="fixed inset-0 z-50 flex items-center justify-center w-full h-full p-0 m-0 bg-black/80"
					onClose={handleCloseFullChart}
					aria-modal="true"
					aria-labelledby="chart-modal-title"
				>
					<div
						className="relative max-w-4xl max-h-[90vh] w-full p-2"
						onClick={e => e.stopPropagation()}
						aria-hidden="true"
					>
						<h2 id="chart-modal-title" className="sr-only">
							Basic Strategy Chart
						</h2>
						<Button
							className="absolute z-10 bg-red-600 top-2 right-2 hover:bg-red-700"
							onClick={handleCloseFullChart}
							aria-label="Close chart view"
						>
							✕
						</Button>
						<div className="h-full p-4 overflow-auto bg-black rounded-lg">
							<Image
								src="/images/ai-strategy.webp"
								alt="Basic Strategy Chart - Full View"
								width={1200}
								height={800}
								className="object-contain w-full"
								priority
							/>
						</div>
					</div>
				</dialog>
			)}
		</div>
	)
}
