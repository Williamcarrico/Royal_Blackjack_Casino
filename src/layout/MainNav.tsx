'use client'

import React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from '@/components/ui/layout/navigation-menu'
import { cn } from '@/lib/utils/utils'
import { Trophy, Sparkles, FileSpreadsheet, CreditCard, HelpCircle, Ban, ArrowUpDown } from 'lucide-react'
import {
	GiCardAceClubs,
	GiCardAceHearts,
	GiPokerHand,
	GiDiamondHard,
	GiRollingDices,
	GiCoinsPile,
	GiGoldBar,
	GiCardRandom,
	GiBrain,
} from 'react-icons/gi'

export function MainNav() {
	const pathname = usePathname()

	// Animation variants
	const itemVariants = {
		hidden: { opacity: 0, x: -20 },
		visible: (i: number) => ({
			opacity: 1,
			x: 0,
			transition: { delay: i * 0.1, duration: 0.3 },
		}),
	}

	return (
		<NavigationMenu className="mx-auto">
			<NavigationMenuList className="px-2">
				<NavigationMenuItem>
					<Link href="/" legacyBehavior passHref>
						<NavigationMenuLink
							className={cn(
								navigationMenuTriggerStyle(),
								pathname === '/' && 'bg-amber-900/30 text-amber-300 border-b-2 border-amber-500',
								'font-playfair text-base transition-all hover:bg-amber-900/20'
							)}
						>
							Home
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuTrigger
						className={cn(
							'font-playfair text-base',
							(pathname === '/game' || pathname === '/games/blackjack') &&
							'bg-amber-900/30 text-amber-300 border-b-2 border-amber-500',
							'bg-gradient-to-r from-amber-900/30 to-amber-800/20 hover:from-amber-900/40 hover:to-amber-800/30'
						)}
					>
						Casino Games
					</NavigationMenuTrigger>
					<NavigationMenuContent>
						<div className="w-[500px] p-4 bg-gradient-to-b from-black to-black/95 border border-amber-900/30 backdrop-blur-xl shadow-2xl rounded-b-lg">
							<div className="grid grid-cols-2 gap-4">
								{/* Featured Game */}
								<div className="col-span-2 p-4 mb-2 border rounded-lg bg-gradient-to-r from-amber-950 to-black border-amber-800/30">
									<div className="flex items-center gap-4">
										<div className="flex items-center justify-center rounded-lg shadow-lg w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700">
											<GiCardAceClubs className="text-3xl text-white" />
										</div>
										<div>
											<div className="flex items-center gap-2">
												<h3 className="text-lg font-bold text-white">Vegas Blackjack</h3>
												<span className="px-2 py-0.5 bg-amber-700/60 text-amber-300 text-xs rounded-full">
													FEATURED
												</span>
											</div>
											<p className="mt-1 text-sm text-gray-400">
												Classic Vegas-style blackjack with optimal strategy hints.
											</p>
											<Link
												href="/game"
												className="inline-block mt-2 text-sm transition-colors text-amber-400 hover:text-amber-300"
											>
												Play Now →
											</Link>
										</div>
									</div>
								</div>

								{/* Available Games */}
								<div>
									<h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-amber-500">
										Available Games
									</h4>
									<ul className="space-y-3">
										<li>
											<motion.div
												custom={0}
												variants={itemVariants}
												initial="hidden"
												whileInView="visible"
												viewport={{ once: true }}
											>
												<Link href="/game" className="flex items-center gap-3 group">
													<div className="flex items-center justify-center w-8 h-8 transition-colors rounded-md shadow-sm bg-green-900/60 group-hover:bg-green-800/80">
														<GiCardAceHearts className="text-lg text-white" />
													</div>
													<div>
														<span className="font-medium text-white transition-colors group-hover:text-amber-300">
															Blackjack
														</span>
														<span className="block text-xs text-gray-500">Hit or stand</span>
													</div>
												</Link>
											</motion.div>
										</li>
										<li className="opacity-60">
											<motion.div
												custom={1}
												variants={itemVariants}
												initial="hidden"
												whileInView="visible"
												viewport={{ once: true }}
											>
												<div className="flex items-center gap-3 cursor-not-allowed">
													<div className="flex items-center justify-center w-8 h-8 rounded-md shadow-sm bg-blue-900/60">
														<GiPokerHand className="text-lg text-white" />
													</div>
													<div>
														<span className="flex items-center gap-2 font-medium text-white">
															Poker
															<Ban size={12} className="text-gray-500" />
														</span>
														<span className="block text-xs text-gray-500">Coming Soon</span>
													</div>
												</div>
											</motion.div>
										</li>
										<li className="opacity-60">
											<motion.div
												custom={2}
												variants={itemVariants}
												initial="hidden"
												whileInView="visible"
												viewport={{ once: true }}
											>
												<div className="flex items-center gap-3 cursor-not-allowed">
													<div className="flex items-center justify-center w-8 h-8 rounded-md shadow-sm bg-red-900/60">
														<GiRollingDices className="text-lg text-white" />
													</div>
													<div>
														<span className="flex items-center gap-2 font-medium text-white">
															Craps
															<Ban size={12} className="text-gray-500" />
														</span>
														<span className="block text-xs text-gray-500">Coming Soon</span>
													</div>
												</div>
											</motion.div>
										</li>
									</ul>
								</div>

								{/* Coming Soon Games */}
								<div>
									<h4 className="mb-3 text-xs font-bold tracking-wider uppercase text-amber-500">
										Coming Soon
									</h4>
									<ul className="space-y-3">
										<li className="opacity-60">
											<motion.div
												custom={3}
												variants={itemVariants}
												initial="hidden"
												whileInView="visible"
												viewport={{ once: true }}
											>
												<div className="flex items-center gap-3 cursor-not-allowed">
													<div className="flex items-center justify-center w-8 h-8 rounded-md shadow-sm bg-amber-900/60">
														<GiCoinsPile className="text-lg text-white" />
													</div>
													<div>
														<span className="font-medium text-white">Slots</span>
														<span className="block text-xs text-gray-500">Q3 2023</span>
													</div>
												</div>
											</motion.div>
										</li>
										<li className="opacity-60">
											<motion.div
												custom={4}
												variants={itemVariants}
												initial="hidden"
												whileInView="visible"
												viewport={{ once: true }}
											>
												<div className="flex items-center gap-3 cursor-not-allowed">
													<div className="flex items-center justify-center w-8 h-8 rounded-md shadow-sm bg-purple-900/60">
														<GiCardRandom className="text-lg text-white" />
													</div>
													<div>
														<span className="font-medium text-white">Baccarat</span>
														<span className="block text-xs text-gray-500">Q4 2023</span>
													</div>
												</div>
											</motion.div>
										</li>
										<li className="opacity-60">
											<motion.div
												custom={5}
												variants={itemVariants}
												initial="hidden"
												whileInView="visible"
												viewport={{ once: true }}
											>
												<div className="flex items-center gap-3 cursor-not-allowed">
													<div className="flex items-center justify-center w-8 h-8 rounded-md shadow-sm bg-red-900/60">
														<GiDiamondHard className="text-lg text-white" />
													</div>
													<div>
														<span className="font-medium text-white">Roulette</span>
														<span className="block text-xs text-gray-500">Q4 2023</span>
													</div>
												</div>
											</motion.div>
										</li>
									</ul>
								</div>
							</div>

							{/* Promotion Banner */}
							<div className="p-3 mt-4 border rounded-md bg-gradient-to-r from-amber-900/20 to-amber-800/10 border-amber-700/20">
								<div className="flex items-center gap-3">
									<Sparkles className="text-amber-400" size={18} />
									<p className="text-sm text-amber-300">
										<span className="font-semibold">VIP Rewards:</span> Play more to unlock
										exclusive benefits
									</p>
								</div>
							</div>
						</div>
					</NavigationMenuContent>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuTrigger
						className={cn(
							'font-playfair text-base',
							(pathname === '/profile' || pathname === '/analytics' || pathname === '/settings') &&
							'bg-amber-900/30 text-amber-300 border-b-2 border-amber-500',
							'hover:bg-amber-900/20'
						)}
					>
						My Account
					</NavigationMenuTrigger>
					<NavigationMenuContent>
						<div className="grid gap-3 p-6 w-[400px] bg-black/95 border border-amber-900/30 backdrop-blur-xl shadow-2xl rounded-b-lg">
							<div className="flex items-center gap-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-amber-700 to-amber-900">
									<span className="text-xl">👤</span>
								</div>
								<div>
									<Link href="/profile" legacyBehavior passHref>
										<NavigationMenuLink className="text-xl font-bold text-white transition-colors hover:text-amber-300 font-playfair">
											Player Profile
										</NavigationMenuLink>
									</Link>
									<p className="text-sm text-gray-400">View your stats and achievements</p>
								</div>
							</div>

							<div className="my-2 border-t border-amber-900/10" />

							<div className="flex items-center gap-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-blue-700 to-blue-900">
									<FileSpreadsheet className="text-white" size={24} />
								</div>
								<div>
									<Link href="/analytics" legacyBehavior passHref>
										<NavigationMenuLink className="text-xl font-bold text-white transition-colors hover:text-amber-300 font-playfair">
											Analytics
										</NavigationMenuLink>
									</Link>
									<p className="text-sm text-gray-400">Detailed game statistics</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-green-700 to-green-900">
									<ArrowUpDown className="text-white" size={24} />
								</div>
								<div>
									<Link href="/transactions" legacyBehavior passHref>
										<NavigationMenuLink className="text-xl font-bold text-white transition-colors hover:text-amber-300 font-playfair">
											Transactions
										</NavigationMenuLink>
									</Link>
									<p className="text-sm text-gray-400">View your balance and transaction history</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-amber-600 to-yellow-700">
									<CreditCard className="text-white" size={24} />
								</div>
								<div>
									<Link href="/cashier" legacyBehavior passHref>
										<NavigationMenuLink className="text-xl font-bold text-white transition-colors hover:text-amber-300 font-playfair">
											Cashier
										</NavigationMenuLink>
									</Link>
									<p className="text-sm text-gray-400">Manage your chips and transactions</p>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-purple-700 to-purple-900">
									<GiGoldBar className="text-amber-300" size={24} />
								</div>
								<div>
									<Link href="/vip" legacyBehavior passHref>
										<NavigationMenuLink className="text-xl font-bold text-white transition-colors hover:text-amber-300 font-playfair group">
											VIP Program{' '}
											<span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-900/30 text-amber-300 rounded-sm">
												NEW
											</span>
										</NavigationMenuLink>
									</Link>
									<p className="text-sm text-gray-400">Exclusive rewards and benefits</p>
								</div>
							</div>
						</div>
					</NavigationMenuContent>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<Link href="/leaderboard" legacyBehavior passHref>
						<NavigationMenuLink
							className={cn(
								navigationMenuTriggerStyle(),
								pathname === '/leaderboard' &&
								'bg-amber-900/30 text-amber-300 border-b-2 border-amber-500',
								'font-playfair text-base transition-all hover:bg-amber-900/20'
							)}
						>
							<Trophy size={16} className="mr-2" />
							Leaderboard
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuTrigger
						className={cn(
							'font-playfair text-base',
							pathname === '/strategy-guide' &&
							'bg-amber-900/30 text-amber-300 border-b-2 border-amber-500',
							'hover:bg-amber-900/20'
						)}
					>
						Strategy
					</NavigationMenuTrigger>
					<NavigationMenuContent>
						<div className="w-[400px] p-4 bg-black/95 border border-amber-900/30 backdrop-blur-xl shadow-2xl rounded-b-lg">
							<div className="flex items-center gap-4 mb-4">
								<div className="flex items-center justify-center w-10 h-10 rounded-md shadow-sm bg-green-900/60">
									<GiBrain className="text-lg text-white" />
								</div>
								<h3 className="text-lg font-bold text-white">Game Strategies</h3>
							</div>

							<div className="space-y-3">
								<Link
									href="/strategy/basic"
									className="block p-3 transition-colors rounded-md hover:bg-amber-900/20"
								>
									<h4 className="font-medium text-amber-400">Basic Strategy</h4>
									<p className="mt-1 text-sm text-gray-400">
										Learn the fundamentals of blackjack strategy
									</p>
								</Link>

								<Link
									href="/strategy/advanced"
									className="block p-3 transition-colors rounded-md hover:bg-amber-900/20"
								>
									<h4 className="font-medium text-amber-400">Advanced Techniques</h4>
									<p className="mt-1 text-sm text-gray-400">
										Master card counting and betting strategies
									</p>
								</Link>

								<Link
									href="/strategy/charts"
									className="block p-3 transition-colors rounded-md hover:bg-amber-900/20"
								>
									<h4 className="font-medium text-amber-400">Strategy Charts</h4>
									<p className="mt-1 text-sm text-gray-400">
										Visual guides for optimal play decisions
									</p>
								</Link>
							</div>

							<div className="p-3 mt-4 text-center rounded-md bg-amber-900/10">
								<Link
									href="/strategy-guide"
									className="text-sm transition-colors text-amber-400 hover:text-amber-300"
								>
									View Complete Strategy Guide →
								</Link>
							</div>
						</div>
					</NavigationMenuContent>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<Link href="/help" legacyBehavior passHref>
						<NavigationMenuLink
							className={cn(
								navigationMenuTriggerStyle(),
								pathname === '/help' &&
								'bg-amber-900/30 text-amber-300 border-b-2 border-amber-500',
								'font-playfair text-base transition-all hover:bg-amber-900/20'
							)}
						>
							<HelpCircle size={16} className="mr-2" />
							Help
						</NavigationMenuLink>
					</Link>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	)
}
