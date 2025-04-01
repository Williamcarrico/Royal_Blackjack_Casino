'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/layout/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowUpIcon, HelpCircleIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

// Import new components
import FaqFeedback from './components/FaqFeedback'
import GlossarySection from './components/GlossarySection'
import FaqSkeletonList, { SearchSkeleton } from './components/FaqSkeleton'
import PopularFaqs from './components/PopularFaqs'
import RecentlyViewed from './components/RecentlyViewed'
import AdvancedSearch from './components/AdvancedSearch'

// Import data and hooks
import { FAQ, getRelatedFAQs } from './faq-data'
import { useFaqSearch } from './hooks/useFaqSearch'
import {
	getCategoryIcon,
	getCategoryColor,
	getAnimationPresets,
	getUserPreferences,
	saveUserPreferences,
} from './utils/ui-helpers'

export default function FAQPage() {
	// Get user preferences
	const preferences = getUserPreferences()

	// State
	const [showScrollTop, setShowScrollTop] = useState(false)
	const [openFAQ, setOpenFAQ] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [expandAll, setExpandAll] = useState(preferences.expandAll ?? false)
	const [viewMode, setViewMode] = useState<'accordion' | 'cards'>(
		preferences.defaultView ?? 'accordion'
	)

	// Initialize FAQ search hook
	const {
		searchQuery,
		setSearchQuery,
		selectedCategory,
		setSelectedCategory,
		selectedTags,
		toggleTag,
		clearFilters,
		filteredFAQs,
		sortFAQs,
		allTags,
		searchHistory,
		recentlyViewed,
		trackViewedFaq,
	} = useFaqSearch({
		initialCategory: 'all',
		initialQuery: '',
		initialTags: Array.isArray(preferences.activeTags) ? preferences.activeTags : [],
	})

	// Animation presets
	const animations = getAnimationPresets()

	// Simulate loading state on initial load
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false)
		}, 700)

		return () => clearTimeout(timer)
	}, [])

	// Handle scroll events for scroll-to-top button
	useEffect(() => {
		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 200)
		}

		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Create scroll anchors for categories
	useEffect(() => {
		// Create hash-based navigation if the URL has a hash
		const hash = window.location.hash
		if (hash) {
			const faqId = hash.substring(1)
			// Open the FAQ if it exists
			setOpenFAQ(faqId)

			// Scroll to the FAQ after a short delay to ensure it's open
			setTimeout(() => {
				const element = document.getElementById(faqId)
				if (element) {
					element.scrollIntoView({ behavior: 'smooth' })
				}
			}, 100)
		}
	}, [])

	// Save preferences when they change
	useEffect(() => {
		saveUserPreferences({
			defaultView: viewMode,
			expandAll,
			preferredCategories: [],
			activeTags: selectedTags,
		})
	}, [viewMode, expandAll, selectedTags])

	// Handlers
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleViewFaq = useCallback(
		(faqId: string) => {
			setOpenFAQ(faqId)
			trackViewedFaq(faqId)

			// Add to URL without page reload
			window.history.pushState({}, '', `#${faqId}`)
		},
		[trackViewedFaq]
	)

	const handleFeedbackSubmit = useCallback((faqId: string, isHelpful: boolean, comment: string) => {
		// In a real application, this would send feedback to an API
		console.log('Feedback submitted:', { faqId, isHelpful, comment })
		// Could also track analytics events here
	}, [])

	const toggleExpandAll = useCallback(() => {
		if (expandAll) {
			setExpandAll(false)
			setOpenFAQ(null)
		} else {
			setExpandAll(true)
			// When expanding all, don't set openFAQ to avoid scrolling
		}
	}, [expandAll])

	// Sort FAQs by category
	const sortedFAQs = sortFAQs(filteredFAQs, 'popularity')

	// Render an accordion item with FAQ data
	const renderAccordionItem = (faq: FAQ) => (
		<motion.div
			key={faq.id}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.3 }}
			id={faq.id}
		>
			<AccordionItem
				value={faq.id}
				className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-600"
			>
				<AccordionTrigger className="px-6 py-4 transition-colors duration-normal hover:bg-gray-50 dark:hover:bg-gray-700 group">
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<div className="flex-shrink-0">{getCategoryIcon(faq.category)}</div>
							<span className="text-xl font-medium text-left text-pretty">{faq.question}</span>
						</div>
						<Badge variant="outline" className={`${getCategoryColor(faq.category)} hidden sm:flex`}>
							{faq.category}
						</Badge>
					</div>
				</AccordionTrigger>
				<AccordionContent className="px-6 pb-4">
					<div className="mt-2 leading-relaxed text-gray-600 text-balance dark:text-gray-300">
						<p>{faq.answer}</p>

						{faq.details && (
							<div className="pl-4 mt-4 border-l-2 border-gray-200 dark:border-gray-600">
								<ul className="space-y-2">
									{faq.details.map((detail, index) => (
										<li
											key={`${faq.id}-detail-${index}`}
											className="text-sm text-gray-600 dark:text-gray-300"
										>
											• {detail}
										</li>
									))}
								</ul>
							</div>
						)}

						{faq.relatedFAQs && faq.relatedFAQs.length > 0 && (
							<div className="mt-var(--space-6)">
								<h4 className="mb-var(--space-2) text-sm font-medium">Related Questions:</h4>
								<div className="flex flex-wrap gap-2">
									{getRelatedFAQs(faq.relatedFAQs).map(relatedFaq => (
										<Button
											key={relatedFaq.id}
											variant="outline"
											size="sm"
											onClick={() => handleViewFaq(relatedFaq.id)}
											onKeyDown={e => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault()
													handleViewFaq(relatedFaq.id)
												}
											}}
											className="text-sm"
											aria-label={`View related question: ${relatedFaq.question}`}
											tabIndex={0}
										>
											{relatedFaq.question}
										</Button>
									))}
								</div>
							</div>
						)}

						<FaqFeedback faqId={faq.id} onSubmitFeedback={handleFeedbackSubmit} />
					</div>
				</AccordionContent>
			</AccordionItem>
		</motion.div>
	)

	// Empty search result message
	const emptyResultMessage = (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center">
			<p className="text-gray-600 dark:text-gray-400">
				No matching questions found. Try a different search term or category.
			</p>
		</motion.div>
	)

	// Render the appropriate accordion based on expandAll
	const renderAccordion = () => {
		if (isLoading) {
			return <FaqSkeletonList count={5} type="accordion" />
		}

		if (expandAll) {
			// Multiple accordion when expanded
			return (
				<Accordion type="multiple" className="space-y-4" value={sortedFAQs.map(faq => faq.id)}>
					<AnimatePresence>
						{sortedFAQs.length > 0 ? sortedFAQs.map(renderAccordionItem) : emptyResultMessage}
					</AnimatePresence>
				</Accordion>
			)
		}

		// Single accordion when not expanded
		return (
			<Accordion
				type="single"
				collapsible
				className="space-y-4"
				value={openFAQ ?? undefined}
				onValueChange={(value: string) => {
					setOpenFAQ(value ?? null)

					// Track viewed FAQ and update URL if a FAQ is opened
					if (value) {
						trackViewedFaq(value)
						window.history.pushState({}, '', `#${value}`)
					} else {
						// Remove hash if FAQ is closed
						window.history.pushState({}, '', window.location.pathname)
					}
				}}
			>
				<AnimatePresence>
					{sortedFAQs.length > 0 ? sortedFAQs.map(renderAccordionItem) : emptyResultMessage}
				</AnimatePresence>
			</Accordion>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
			<div className="container px-var(--space-4) py-var(--space-8) pt-20 mx-auto">
				<motion.div {...animations.slideUp} className="mb-var(--space-8) text-center">
					<h1 className="text-5xl font-bold text-transparent font-heading bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
						Frequently Asked Questions
					</h1>
					<p className="max-w-3xl mx-auto mt-var(--space-4) text-xl text-balance text-gray-600 dark:text-gray-300">
						Find answers to common questions about our blackjack game, rules, strategies, and
						technical support
					</p>
				</motion.div>

				<div className="grid grid-cols-1 gap-var(--space-6) lg:grid-cols-12">
					{/* Main content area */}
					<div className="lg:col-span-8">
						<Card className="backdrop-blur-sm glass">
							<CardHeader>
								{isLoading ? (
									<SearchSkeleton />
								) : (
									<AdvancedSearch
										searchQuery={searchQuery}
										setSearchQuery={setSearchQuery}
										searchHistory={searchHistory}
										allTags={allTags}
										selectedTags={selectedTags}
										toggleTag={toggleTag}
										clearFilters={clearFilters}
									/>
								)}

								<div className="flex flex-wrap items-center justify-between gap-4">
									<div className="flex items-center gap-2">
										<HelpCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
										<h2 className="text-2xl font-semibold text-sky-700 dark:text-sky-400">
											Common Questions
										</h2>
									</div>

									<div className="flex items-center gap-2">
										<select
											className="px-3 py-2 bg-transparent border border-gray-200 rounded-md dark:border-gray-700"
											value={selectedCategory}
											onChange={e => {
												const value = e.target.value
												const isValidCategory = [
													'all',
													'gameplay',
													'rules',
													'payouts',
													'account',
													'technical',
												].includes(value)
												if (isValidCategory) {
													setSelectedCategory(value as FAQ['category'] | 'all')
												}
											}}
											aria-label="Filter FAQs by category"
										>
											<option value="all">All Categories</option>
											<option value="gameplay">Gameplay</option>
											<option value="rules">Rules</option>
											<option value="payouts">Payouts</option>
											<option value="account">Account</option>
											<option value="technical">Technical</option>
										</select>

										<Button
											variant="outline"
											size="sm"
											onClick={toggleExpandAll}
											className="items-center hidden gap-1 md:flex"
											aria-label={expandAll ? 'Collapse all questions' : 'Expand all questions'}
											tabIndex={0}
											onKeyDown={e => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault()
													toggleExpandAll()
												}
											}}
										>
											{expandAll ? (
												<>
													<ChevronUpIcon className="w-4 h-4" />
													Collapse All
												</>
											) : (
												<>
													<ChevronDownIcon className="w-4 h-4" />
													Expand All
												</>
											)}
										</Button>
									</div>
								</div>
								<Separator className="my-var(--space-4)" />
							</CardHeader>

							<CardContent>
								<Tabs
									defaultValue={viewMode}
									className="mb-6"
									onValueChange={value => setViewMode(value as 'accordion' | 'cards')}
								>
									<TabsList className="grid w-full grid-cols-2 font-serif font-semibold border-2 text-emerald-500 shadow-sky-800 border-sky-600 md:w-auto md:flex md:flex-row">
										<TabsTrigger value="accordion">Accordion View</TabsTrigger>
										<TabsTrigger value="cards">Card View</TabsTrigger>
									</TabsList>

									<TabsContent value="accordion" className="mt-6">
										{renderAccordion()}
									</TabsContent>

									<TabsContent value="cards" className="mt-6">
										<ScrollArea className="h-[600px] pr-4">
											{isLoading ? (
												<FaqSkeletonList count={6} type="card" />
											) : (
												<motion.div
													variants={animations.staggerItems.container}
													initial="hidden"
													animate="show"
													className="grid grid-cols-1 gap-6 md:grid-cols-2 text-sky-800 dark:text-sky-400"
												>
													{sortedFAQs.length > 0 ? (
														sortedFAQs.map(faq => (
															<motion.div
																key={faq.id}
																variants={animations.staggerItems.item}
																className="group"
																id={`card-${faq.id}`}
															>
																<Card className="h-full transition-all duration-normal shadow hover:shadow-lg hover:scale-[1.01] dark:bg-gray-800">
																	<CardContent className="p-6">
																		<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
																			<div className="flex items-center gap-2">
																				{getCategoryIcon(faq.category)}
																				<Badge
																					variant="secondary"
																					className={getCategoryColor(faq.category)}
																				>
																					{faq.category}
																				</Badge>
																			</div>
																		</div>
																		<h3 className="mb-3 text-xl font-bold text-gray-900 text-balance dark:text-gray-100">
																			{faq.question}
																		</h3>
																		<p className="leading-relaxed text-gray-600 text-pretty dark:text-gray-300">
																			{faq.answer}
																		</p>

																		{faq.details && (
																			<div className="pl-4 mt-4 border-l-2 border-gray-200 dark:border-gray-600">
																				<ul className="space-y-2">
																					{faq.details.slice(0, 3).map((detail, index) => (
																						<li
																							key={`${faq.id}-detail-${index}`}
																							className="text-sm text-gray-600 dark:text-gray-300"
																						>
																							• {detail}
																						</li>
																					))}
																					{faq.details.length > 3 && (
																						<li className="text-sm">
																							<button
																								className="p-0 m-0 text-sm text-blue-600 bg-transparent border-none cursor-pointer dark:text-blue-400 hover:underline"
																								onClick={() => handleViewFaq(faq.id)}
																								aria-label="Show more details"
																								tabIndex={0}
																								onKeyDown={e => {
																									if (e.key === 'Enter' || e.key === ' ') {
																										e.preventDefault()
																										handleViewFaq(faq.id)
																									}
																								}}
																							>
																								+ {faq.details.length - 3} more details
																							</button>
																						</li>
																					)}
																				</ul>
																			</div>
																		)}

																		{faq.relatedFAQs && faq.relatedFAQs.length > 0 && (
																			<div className="mt-4">
																				<span className="text-xs text-gray-500 dark:text-gray-400">
																					Related:{' '}
																				</span>
																				{getRelatedFAQs(faq.relatedFAQs)
																					.slice(0, 2)
																					.map((relatedFaq, index) => (
																						<button
																							key={relatedFaq.id}
																							className="inline p-0 m-0 text-xs text-blue-600 bg-transparent border-none cursor-pointer dark:text-blue-400 hover:underline"
																							onClick={() => handleViewFaq(relatedFaq.id)}
																							aria-label={`View related question: ${relatedFaq.question}`}
																							tabIndex={0}
																							onKeyDown={e => {
																								if (e.key === 'Enter' || e.key === ' ') {
																									e.preventDefault()
																									handleViewFaq(relatedFaq.id)
																								}
																							}}
																						>
																							{relatedFaq.question}
																							{index < Math.min(faq.relatedFAQs?.length ?? 0, 2) - 1
																								? ', '
																								: ''}
																						</button>
																					))}
																				{faq.relatedFAQs.length > 2 && (
																					<button
																						className="inline p-0 m-0 ml-1 text-xs text-blue-600 bg-transparent border-none cursor-pointer dark:text-blue-400 hover:underline"
																						onClick={() => handleViewFaq(faq.id)}
																						aria-label={`View all ${faq.relatedFAQs.length} related questions`}
																						tabIndex={0}
																						onKeyDown={e => {
																							if (e.key === 'Enter' || e.key === ' ') {
																								e.preventDefault()
																								handleViewFaq(faq.id)
																							}
																						}}
																					>
																						+ {faq.relatedFAQs.length - 2} more
																					</button>
																				)}
																			</div>
																		)}

																		<div className="flex justify-end mt-4">
																			<Button
																				variant="outline"
																				size="sm"
																				onClick={() => {
																					setViewMode('accordion')
																					handleViewFaq(faq.id)
																				}}
																				className="text-xs"
																				aria-label={`View full answer for: ${faq.question}`}
																				tabIndex={0}
																				onKeyDown={e => {
																					if (e.key === 'Enter' || e.key === ' ') {
																						e.preventDefault()
																						setViewMode('accordion')
																						handleViewFaq(faq.id)
																					}
																				}}
																			>
																				View Full Answer
																			</Button>
																		</div>
																	</CardContent>
																</Card>
															</motion.div>
														))
													) : (
														<motion.div
															initial={{ opacity: 0 }}
															animate={{ opacity: 1 }}
															className="col-span-2 py-10 text-center"
														>
															<p className="text-gray-500 dark:text-gray-400">
																No matching questions found. Try a different search term or
																category.
															</p>
														</motion.div>
													)}
												</motion.div>
											)}
										</ScrollArea>
									</TabsContent>
								</Tabs>

								<div className="pb-4 mt-8 text-center">
									<p className="mb-4 text-gray-600 dark:text-gray-300">
										Can&apos;t find what you&apos;re looking for?
									</p>
									<Button
										className="text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
										aria-label="Contact Support"
										tabIndex={0}
									>
										Contact Support
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Glossary Section */}
						<motion.div
							{...animations.slideUp}
							transition={{ delay: 0.2, duration: 0.5 }}
							className="mt-var(--space-6)"
						>
							<GlossarySection />
						</motion.div>
					</div>

					{/* Sidebar */}
					<div className="space-y-var(--space-6) lg:col-span-4">
						{/* Popular FAQs */}
						<PopularFaqs onSelectFaq={handleViewFaq} />

						{/* Recently Viewed */}
						{recentlyViewed.length > 0 && (
							<RecentlyViewed recentlyViewedIds={recentlyViewed} onSelectFaq={handleViewFaq} />
						)}

						{/* Quick Tips Section */}
						<motion.div
							{...animations.slideUp}
							transition={{ delay: 0.3, duration: 0.5 }}
							className="rounded-lg glass"
						>
							<Card>
								<CardHeader className="pb-3">
									<div className="flex items-center gap-2">
										<HelpCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
										<h2 className="font-serif text-xl font-semibold text-blue-500 dark:text-blue-400">
											Quick Blackjack Tips
										</h2>
									</div>
									<Separator className="mt-3" />
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="p-4 border rounded-lg bg-primary-10 border-primary-20 dark:bg-primary-10 dark:border-primary-30">
											<h3 className="mb-2 font-bold text-blue-700 dark:text-blue-400">
												Basic Strategy
											</h3>
											<p className="text-sm text-gray-700 text-pretty dark:text-gray-300">
												Always follow basic strategy charts for mathematically optimal play. This
												reduces the house edge to less than 1%.
											</p>
										</div>
										<div className="p-4 border rounded-lg bg-primary-10 border-primary-20 dark:bg-primary-10 dark:border-primary-30">
											<h3 className="mb-2 font-bold text-green-700 dark:text-green-400">
												Bankroll Management
											</h3>
											<p className="text-sm text-gray-700 text-pretty dark:text-gray-300">
												Set a budget before playing and stick to it. A good rule is to have at least
												20 times your average bet as your bankroll.
											</p>
										</div>
										<div className="p-4 border rounded-lg bg-primary-10 border-primary-20 dark:bg-primary-10 dark:border-primary-30">
											<h3 className="mb-2 font-bold text-purple-700 dark:text-purple-400">
												Avoid Insurance
											</h3>
											<p className="text-sm text-gray-700 text-pretty dark:text-gray-300">
												Insurance bets have a high house edge. Unless you&apos;re counting cards,
												it&apos;s mathematically better to decline insurance.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					</div>
				</div>
			</div>

			{/* Scroll to top button */}
			<AnimatePresence>
				{showScrollTop && (
					<motion.button
						{...animations.scrollFade}
						onClick={scrollToTop}
						className="fixed z-50 p-3 text-white transition-colors rounded-full shadow-lg bottom-8 right-8 bg-black-70 dark:bg-white-10 backdrop-blur-md hover:bg-black-70 dark:hover:bg-white-10 focus-ring"
						aria-label="Scroll to top"
						tabIndex={0}
						onKeyDown={e => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								scrollToTop()
							}
						}}
					>
						<ArrowUpIcon className="w-5 h-5" />
					</motion.button>
				)}
			</AnimatePresence>
		</div>
	)
}
