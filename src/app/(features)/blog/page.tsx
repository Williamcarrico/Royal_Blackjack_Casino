'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
	Search,
	Calendar,
	Clock,
	Tag,
	ChevronRight,
	ArrowRight,
	Bookmark,
	TrendingUp,
	LayoutGrid,
	List,
	Filter,
	X,
	Eye,
	MessageSquare,
	ArrowUpRight,
	Sparkles,
} from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/layout/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Type definitions
interface BlogPost {
	id: string
	slug: string
	title: string
	excerpt: string
	featuredImage: string
	category: string
	tags: string[]
	author: {
		name: string
		avatar: string
	}
	publishedAt: string
	readTime: number
	viewCount: number
	commentCount: number
	isFeatured?: boolean
	isTrending?: boolean
}

interface Category {
	id: string
	name: string
	slug: string
	count: number
}

// Mock data for blog posts
const BLOG_POSTS: BlogPost[] = [
	{
		id: '1',
		slug: 'master-blackjack-strategy',
		title: 'Master the Art of Blackjack: Advanced Strategies for Consistent Wins',
		excerpt:
			'Elevate your blackjack game with proven techniques used by professional players to maximize your winning potential.',
		featuredImage: '/images/blog/blackjack-strategy.jpg',
		category: 'Strategy',
		tags: ['blackjack', 'strategy', 'card counting', 'professional tips'],
		author: {
			name: 'Alex Morgan',
			avatar: '/images/avatars/alex-morgan.jpg',
		},
		publishedAt: '2023-08-15T09:00:00.000Z',
		readTime: 8,
		viewCount: 3452,
		commentCount: 27,
		isFeatured: true,
	},
	{
		id: '2',
		slug: 'psychology-of-gambling',
		title: "The Psychology of Gambling: Understanding the Player's Mind",
		excerpt:
			'Explore the fascinating psychological aspects that influence decision-making at the casino table.',
		featuredImage: '/images/blog/psychology-gambling.jpg',
		category: 'Psychology',
		tags: ['psychology', 'mindset', 'decision making', 'risk management'],
		author: {
			name: 'Dr. Sarah Chen',
			avatar: '/images/avatars/sarah-chen.jpg',
		},
		publishedAt: '2023-07-28T14:30:00.000Z',
		readTime: 12,
		viewCount: 2189,
		commentCount: 34,
		isTrending: true,
	},
	{
		id: '3',
		slug: 'card-counting-techniques',
		title: 'Card Counting Techniques: From Beginner to Advanced Systems',
		excerpt:
			'Learn the art of card counting with a step-by-step guide covering multiple systems for different skill levels.',
		featuredImage: '/images/blog/card-counting.jpg',
		category: 'Strategy',
		tags: ['card counting', 'blackjack', 'advantage play', 'techniques'],
		author: {
			name: 'James Wilson',
			avatar: '/images/avatars/james-wilson.jpg',
		},
		publishedAt: '2023-07-12T11:45:00.000Z',
		readTime: 15,
		viewCount: 4721,
		commentCount: 52,
		isTrending: true,
	},
	{
		id: '4',
		slug: 'history-of-blackjack',
		title: 'The Rich History of Blackjack: From European Salons to Vegas Casinos',
		excerpt:
			'Trace the fascinating evolution of blackjack through centuries of gambling history and cultural significance.',
		featuredImage: '/images/blog/blackjack-history.jpg',
		category: 'History',
		tags: ['history', 'blackjack', 'casinos', 'vegas'],
		author: {
			name: 'Elizabeth Taylor',
			avatar: '/images/avatars/elizabeth-taylor.jpg',
		},
		publishedAt: '2023-06-24T16:20:00.000Z',
		readTime: 10,
		viewCount: 1876,
		commentCount: 19,
	},
	{
		id: '5',
		slug: 'online-vs-live-blackjack',
		title: 'Online vs. Live Blackjack: Pros, Cons, and Essential Differences',
		excerpt:
			'Compare the experience of playing blackjack online versus at a physical casino table to find your ideal gaming environment.',
		featuredImage: '/images/blog/online-vs-live.jpg',
		category: 'Comparison',
		tags: ['online gambling', 'live casino', 'comparison', 'gaming experience'],
		author: {
			name: 'Ryan Martinez',
			avatar: '/images/avatars/ryan-martinez.jpg',
		},
		publishedAt: '2023-06-10T08:15:00.000Z',
		readTime: 7,
		viewCount: 2543,
		commentCount: 31,
	},
	{
		id: '6',
		slug: 'responsible-gambling-guide',
		title: 'Responsible Gambling: Setting Limits and Maintaining Control',
		excerpt:
			'Essential guidelines for enjoying casino games while keeping your gambling habits healthy and sustainable.',
		featuredImage: '/images/blog/responsible-gambling.jpg',
		category: 'Responsible Gaming',
		tags: ['responsible gaming', 'bankroll management', 'mental health', 'limits'],
		author: {
			name: 'Michelle Johnson',
			avatar: '/images/avatars/michelle-johnson.jpg',
		},
		publishedAt: '2023-05-22T13:40:00.000Z',
		readTime: 9,
		viewCount: 3128,
		commentCount: 45,
	},
]

// Mock categories
const CATEGORIES: Category[] = [
	{ id: '1', name: 'Strategy', slug: 'strategy', count: 28 },
	{ id: '2', name: 'Psychology', slug: 'psychology', count: 14 },
	{ id: '3', name: 'History', slug: 'history', count: 9 },
	{ id: '4', name: 'Comparison', slug: 'comparison', count: 12 },
	{ id: '5', name: 'Responsible Gaming', slug: 'responsible-gaming', count: 16 },
	{ id: '6', name: 'Tutorials', slug: 'tutorials', count: 22 },
	{ id: '7', name: 'News', slug: 'news', count: 31 },
]

// Animation variants
const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.5,
			delay: delay * 0.1,
		},
	}),
}

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
}

// Format date utility
const formatDate = (dateString: string): string => {
	const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
	return new Date(dateString).toLocaleDateString('en-US', options)
}

// Featured Article Component
const FeaturedArticle = ({ post }: { post: BlogPost }) => {
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.2,
	})

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={inView ? 'visible' : 'hidden'}
			variants={fadeInUp}
			className="relative overflow-hidden rounded-2xl"
		>
			<div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

			<div className="relative h-[600px] w-full">
				<Image
					src={post.featuredImage}
					alt={post.title}
					fill
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
					className="object-cover transition-transform duration-700 group-hover:scale-105"
					priority
				/>
			</div>

			<div className="absolute bottom-0 left-0 right-0 z-20 p-8">
				<div className="flex items-center gap-3 mb-4">
					<span className="px-3 py-1 text-xs font-medium text-white rounded-full bg-amber-500/90">
						{post.category}
					</span>
					<span className="flex items-center gap-1 text-xs text-gray-300">
						<Calendar size={12} className="text-amber-400" />
						{formatDate(post.publishedAt)}
					</span>
					<span className="flex items-center gap-1 text-xs text-gray-300">
						<Clock size={12} className="text-amber-400" />
						{post.readTime} min read
					</span>
				</div>

				<h1 className="mb-4 text-3xl font-bold leading-tight text-white md:text-4xl font-playfair">
					{post.title}
				</h1>

				<p className="mb-6 text-gray-300 md:w-4/5">{post.excerpt}</p>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Image
							src={post.author.avatar}
							alt={post.author.name}
							width={40}
							height={40}
							className="border-2 rounded-full border-amber-500"
						/>
						<span className="text-sm font-medium text-white">{post.author.name}</span>
					</div>

					<Link href={`/blog/${post.slug}`}>
						<Button className="gap-2 transition-all bg-amber-500 hover:bg-amber-600">
							Read Article
							<ArrowRight size={16} />
						</Button>
					</Link>
				</div>
			</div>
		</motion.div>
	)
}

// Blog Card Component
const BlogCard = ({ post, index }: { post: BlogPost; index: number }) => {
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.1,
		rootMargin: '50px',
	})

	return (
		<motion.div
			ref={ref}
			variants={fadeInUp}
			initial="hidden"
			animate={inView ? 'visible' : 'hidden'}
			custom={index}
			className="h-full"
		>
			<Card className="h-full overflow-hidden transition-all border-transparent bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-amber-500/20 group">
				<div className="relative w-full pt-[56.25%]">
					<Image
						src={post.featuredImage}
						alt={post.title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover transition-transform duration-500 group-hover:scale-105"
					/>
					{post.isTrending && (
						<div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
							<TrendingUp size={12} />
							Trending
						</div>
					)}
					<div className="absolute top-3 right-3">
						<Button
							variant="ghost"
							size="icon"
							className="text-white rounded-full bg-black/50 hover:bg-black/70 hover:text-amber-400"
						>
							<Bookmark size={16} />
						</Button>
					</div>
				</div>

				<CardHeader className="pb-2">
					<div className="flex items-center gap-2 mb-2">
						<span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
							{post.category}
						</span>
					</div>
					<CardTitle className="text-xl transition-colors group-hover:text-amber-400">
						<Link href={`/blog/${post.slug}`} className="hover:underline">
							{post.title}
						</Link>
					</CardTitle>
				</CardHeader>

				<CardContent>
					<p className="text-gray-400 line-clamp-3">{post.excerpt}</p>
				</CardContent>

				<CardFooter className="flex flex-col items-start gap-4">
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-2">
							<Image
								src={post.author.avatar}
								alt={post.author.name}
								width={28}
								height={28}
								className="border rounded-full border-amber-500/30"
							/>
							<span className="text-xs text-gray-300">{post.author.name}</span>
						</div>

						<div className="flex items-center gap-3 text-xs text-gray-400">
							<span className="flex items-center gap-1">
								<Calendar size={12} className="text-amber-500/70" />
								{formatDate(post.publishedAt).split(',')[0]}
							</span>
							<span className="flex items-center gap-1">
								<Clock size={12} className="text-amber-500/70" />
								{post.readTime} min
							</span>
						</div>
					</div>

					<div className="flex items-center justify-between w-full pt-3 border-t border-gray-800">
						<div className="flex items-center gap-3 text-xs text-gray-400">
							<span className="flex items-center gap-1">
								<Eye size={12} className="text-amber-500/70" />
								{post.viewCount}
							</span>
							<span className="flex items-center gap-1">
								<MessageSquare size={12} className="text-amber-500/70" />
								{post.commentCount}
							</span>
						</div>

						<Link
							href={`/blog/${post.slug}`}
							className="flex items-center gap-1 text-xs font-medium transition-colors text-amber-400 hover:text-amber-300"
						>
							Read More
							<ArrowRight size={12} />
						</Link>
					</div>
				</CardFooter>
			</Card>
		</motion.div>
	)
}

// Newsletter Component
const NewsletterSection = () => {
	const [email, setEmail] = useState('')
	const [ref, inView] = useInView({
		triggerOnce: true,
		threshold: 0.3,
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		// Handle newsletter submission logic here
		console.log('Subscribing email:', email)
		setEmail('')
		// Show success message or toast notification
	}

	return (
		<motion.section
			ref={ref}
			initial="hidden"
			animate={inView ? 'visible' : 'hidden'}
			variants={fadeInUp}
			className="py-16"
		>
			<div className="relative px-6 py-12 overflow-hidden border rounded-2xl bg-gradient-to-br from-amber-900/40 via-amber-800/20 to-black/80 border-amber-500/10">
				{/* Decorative elements */}
				<div className="absolute top-0 left-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl"></div>
				<div className="absolute bottom-0 right-0 w-64 h-64 translate-x-1/2 translate-y-1/2 rounded-full bg-amber-500/5 blur-3xl"></div>

				<div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto text-center">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
						transition={{ delay: 0.2, duration: 0.5 }}
						className="flex items-center justify-center w-16 h-16 mb-6 text-black rounded-full bg-gradient-to-br from-amber-500 to-amber-600"
					>
						<Sparkles size={28} />
					</motion.div>

					<h2 className="mb-3 text-3xl font-bold text-white font-playfair">
						Get Expert Casino Tips & Exclusive Content
					</h2>

					<p className="mb-8 text-gray-300">
						Subscribe to our newsletter and receive expert gambling strategies, early access to new
						features, and exclusive promotions.
					</p>

					<form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
						<div className="relative flex-1">
							<Input
								type="email"
								placeholder="Your email address"
								value={email}
								onChange={e => setEmail(e.target.value)}
								required
								className="w-full h-12 text-white bg-black/50 border-amber-500/30 focus:border-amber-500 placeholder:text-gray-500"
							/>
						</div>

						<Button type="submit" className="h-12 gap-2 text-white bg-amber-500 hover:bg-amber-600">
							Subscribe
							<ArrowUpRight size={16} />
						</Button>
					</form>

					<p className="mt-4 text-xs text-gray-400">
						By subscribing, you agree to our{' '}
						<Link href="/privacy-policy" className="underline text-amber-400 hover:text-amber-300">
							Privacy Policy
						</Link>{' '}
						and consent to receive updates from our company.
					</p>
				</div>
			</div>
		</motion.section>
	)
}

// TagList Component - Consolidate tag rendering logic
const TagList = ({
	tags,
	selectedTags,
	setSelectedTags,
}: {
	tags: string[]
	selectedTags: string[]
	setSelectedTags: (tags: string[]) => void
}) => (
	<>
		{tags.map(tag => (
			<Button
				key={tag}
				variant={selectedTags.includes(tag) ? 'default' : 'outline'}
				size="sm"
				onClick={() => {
					if (selectedTags.includes(tag)) {
						setSelectedTags(selectedTags.filter(t => t !== tag))
					} else {
						setSelectedTags([...selectedTags, tag])
					}
				}}
				className={
					selectedTags.includes(tag) ? 'bg-amber-500 hover:bg-amber-600' : 'border-gray-800'
				}
			>
				{tag}
			</Button>
		))}
	</>
)

// Main Component
export default function BlogPage() {
	const [searchQuery, setSearchQuery] = useState('')
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [isFilterOpen, setIsFilterOpen] = useState(false)

	// Get featured post
	const featuredPost = BLOG_POSTS.find(post => post.isFeatured) ?? BLOG_POSTS[0]

	// Filter posts based on search query, category, and tags
	const filteredPosts = BLOG_POSTS.filter(post => {
		if (featuredPost && post.id === featuredPost.id) return false // Exclude featured post from the list

		// Search filter
		if (
			searchQuery &&
			!post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
			!post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) &&
			!post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
		) {
			return false
		}

		// Category filter
		if (selectedCategory && post.category !== selectedCategory) {
			return false
		}

		// Tags filter
		if (selectedTags.length > 0 && !selectedTags.some(tag => post.tags.includes(tag))) {
			return false
		}

		return true
	})

	// Extract all unique tags from blog posts
	const allTags = Array.from(new Set(BLOG_POSTS.flatMap(post => post.tags)))

	// Scroll animations
	const { scrollY } = useScroll()
	const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8])

	return (
		<div className="min-h-screen">
			{/* Hero section with parallax effect */}
			<motion.section
				style={{ opacity: headerOpacity }}
				className="relative pt-12 pb-24 overflow-hidden md:pt-16 md:pb-32"
			>
				<div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black">
					<div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e5a50a_1px,transparent_1px)] [background-size:24px_24px]"></div>
				</div>

				<div className="container relative z-10 px-6 mx-auto">
					<div className="grid gap-8 md:grid-cols-2 lg:gap-12">
						<motion.div
							initial={{ opacity: 0, x: -50 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.7, ease: 'easeOut' }}
							className="max-w-xl"
						>
							<h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl font-playfair">
								Royal Edge Casino{' '}
								<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
									Insider
								</span>
							</h1>

							<p className="mb-8 text-xl text-gray-300">
								Expert strategies, industry insights, and exclusive content to elevate your casino
								gaming experience.
							</p>

							<div className="flex flex-col gap-4 sm:flex-row">
								<Button className="gap-2 text-black bg-amber-500 hover:bg-amber-600">
									Latest Articles
									<ChevronRight size={16} />
								</Button>

								<Button
									variant="outline"
									className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
								>
									Casino Strategy Guides
								</Button>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
							className="flex items-center justify-center"
						>
							<div className="relative w-full max-w-md h-80 md:h-96">
								<Image
									src="/images/blog/blog-hero.jpg"
									alt="Casino cards and chips"
									fill
									priority
									className="object-cover shadow-2xl rounded-2xl shadow-amber-900/20"
								/>
								<div className="absolute inset-0 border rounded-2xl border-amber-500/20"></div>
							</div>
						</motion.div>
					</div>
				</div>
			</motion.section>

			{/* Main blog content */}
			<section className="py-12">
				<div className="container px-6 mx-auto">
					{/* Featured post */}
					<div className="mb-16">
						<h2 className="mb-8 text-2xl font-bold text-white">Featured Article</h2>
						{featuredPost && <FeaturedArticle post={featuredPost} />}
					</div>

					{/* Blog list with filters */}
					<div className="mb-12">
						<div className="flex flex-col justify-between gap-6 mb-8 md:flex-row md:items-center">
							<h2 className="text-2xl font-bold text-white">Latest Articles</h2>

							<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
								{/* Search */}
								<div className="relative">
									<Search className="absolute top-0 w-4 h-4 text-gray-500 transform translate-y-1/2 left-3" />
									<Input
										placeholder="Search articles..."
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className="pl-10 text-white border-gray-800 bg-black/30 focus:border-amber-500 placeholder:text-gray-500"
									/>
								</div>

								{/* Filter button (mobile) */}
								<Button
									variant="outline"
									onClick={() => setIsFilterOpen(true)}
									className="flex items-center justify-center gap-2 border-gray-800 sm:hidden"
								>
									<Filter size={16} />
									Filters
								</Button>

								{/* View mode toggle */}
								<ToggleGroup
									type="single"
									value={viewMode}
									onValueChange={(value: string | undefined) => {
										if (value === 'grid' || value === 'list') {
											setViewMode(value)
										}
									}}
									className="hidden sm:flex"
								>
									<ToggleGroupItem value="grid" aria-label="Grid view">
										<LayoutGrid size={16} />
									</ToggleGroupItem>
									<ToggleGroupItem value="list" aria-label="List view">
										<List size={16} />
									</ToggleGroupItem>
								</ToggleGroup>

								{/* Category dropdown (desktop) */}
								<div className="hidden sm:block">
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" className="gap-2 border-gray-800">
												{selectedCategory ?? 'All Categories'}
												<ChevronRight
													size={16}
													className="transition-transform group-data-[state=open]:rotate-90"
												/>
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-56 p-0 bg-gray-900 border-gray-800">
											<div className="p-2">
												<button
													className={cn(
														'w-full px-2 py-1.5 text-sm rounded-md text-left cursor-pointer hover:bg-amber-500/10 hover:text-amber-400',
														!selectedCategory && 'bg-amber-500/10 text-amber-400'
													)}
													onClick={() => setSelectedCategory(null)}
												>
													All Categories
												</button>
												{CATEGORIES.map(category => (
													<button
														key={category.id}
														className={cn(
															'w-full px-2 py-1.5 text-sm rounded-md text-left cursor-pointer hover:bg-amber-500/10 hover:text-amber-400 flex justify-between',
															selectedCategory === category.name && 'bg-amber-500/10 text-amber-400'
														)}
														onClick={() => setSelectedCategory(category.name)}
													>
														<span>{category.name}</span>
														<span className="text-xs text-gray-500">{category.count}</span>
													</button>
												))}
											</div>
										</PopoverContent>
									</Popover>
								</div>
							</div>
						</div>

						{/* Tags bar (desktop) */}
						<div className="hidden gap-2 mb-8 overflow-x-auto sm:flex scrollbar-hide">
							<Button
								variant={selectedTags.length === 0 ? 'default' : 'outline'}
								size="sm"
								onClick={() => setSelectedTags([])}
								className={
									selectedTags.length === 0 ? 'bg-amber-500 hover:bg-amber-600' : 'border-gray-800'
								}
							>
								All
							</Button>

							<TagList
								tags={allTags}
								selectedTags={selectedTags}
								setSelectedTags={setSelectedTags}
							/>
						</div>

						{/* Mobile filters drawer */}
						<AnimatePresence>
							{isFilterOpen && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="fixed inset-0 z-50 flex justify-end bg-black/60 sm:hidden"
									onClick={() => setIsFilterOpen(false)}
								>
									<motion.div
										initial={{ x: '100%' }}
										animate={{ x: 0 }}
										exit={{ x: '100%' }}
										transition={{ type: 'tween', duration: 0.3 }}
										className="w-4/5 h-full max-w-xs shadow-xl bg-gray-950"
										onClick={e => e.stopPropagation()}
									>
										<div className="flex items-center justify-between p-4 border-b border-gray-800">
											<h3 className="text-lg font-medium">Filters</h3>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setIsFilterOpen(false)}
												className="text-gray-400 hover:text-white"
											>
												<X size={18} />
											</Button>
										</div>

										<div className="p-4">
											<div className="space-y-2">
												<button
													className={cn(
														'w-full px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-amber-500/10 hover:text-amber-400',
														!selectedCategory && 'bg-amber-500/10 text-amber-400'
													)}
													onClick={() => setSelectedCategory(null)}
												>
													All Categories
												</button>
												{CATEGORIES.map(category => (
													<button
														key={category.id}
														className={cn(
															'w-full px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-amber-500/10 hover:text-amber-400 flex justify-between',
															selectedCategory === category.name && 'bg-amber-500/10 text-amber-400'
														)}
														onClick={() => setSelectedCategory(category.name)}
													>
														<span>{category.name}</span>
														<span className="text-xs text-gray-500">{category.count}</span>
													</button>
												))}
											</div>

											<div>
												<h4 className="mb-3 text-sm font-medium text-gray-400">Tags</h4>
												<div className="flex flex-wrap gap-2">
													<TagList
														tags={allTags}
														selectedTags={selectedTags}
														setSelectedTags={setSelectedTags}
													/>
												</div>
											</div>
										</div>

										<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
											<Button
												onClick={() => {
													setSelectedCategory(null)
													setSelectedTags([])
												}}
												variant="outline"
												className="w-full"
											>
												Reset Filters
											</Button>
										</div>
									</motion.div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Blog posts grid/list */}
						{filteredPosts.length > 0 ? (
							<>
								{viewMode === 'grid' ? (
									<motion.div
										variants={staggerContainer}
										initial="hidden"
										animate="visible"
										className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
									>
										{filteredPosts.map((post, index) => (
											<BlogCard key={post.id} post={post} index={index} />
										))}
									</motion.div>
								) : (
									<motion.div
										variants={staggerContainer}
										initial="hidden"
										animate="visible"
										className="space-y-6"
									>
										{filteredPosts.map((post, index) => (
											<motion.div key={post.id} variants={fadeInUp} custom={index}>
												<Card className="overflow-hidden transition-all border-transparent bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-amber-500/20 group">
													<div className="flex flex-col md:flex-row">
														<div className="relative w-full md:w-1/3 h-60 md:h-auto">
															<Image
																src={post.featuredImage}
																alt={post.title}
																fill
																className="object-cover transition-transform duration-500 group-hover:scale-105"
															/>
															{post.isTrending && (
																<div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
																	<TrendingUp size={12} />
																	Trending
																</div>
															)}
														</div>

														<div className="flex flex-col justify-between flex-1 p-6">
															<div>
																<div className="flex items-center gap-2 mb-2">
																	<span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
																		{post.category}
																	</span>
																</div>

																<h3 className="mb-3 text-xl font-bold transition-colors group-hover:text-amber-400">
																	<Link href={`/blog/${post.slug}`} className="hover:underline">
																		{post.title}
																	</Link>
																</h3>

																<p className="mb-4 text-gray-400">{post.excerpt}</p>
															</div>

															<div className="flex flex-wrap items-center justify-between gap-4">
																<div className="flex items-center gap-3">
																	<Image
																		src={post.author.avatar}
																		alt={post.author.name}
																		width={32}
																		height={32}
																		className="border rounded-full border-amber-500/30"
																	/>
																	<div>
																		<div className="text-sm text-gray-300">{post.author.name}</div>
																		<div className="flex items-center gap-3 text-xs text-gray-500">
																			<span className="flex items-center gap-1">
																				<Calendar size={12} className="text-amber-500/70" />
																				{formatDate(post.publishedAt)}
																			</span>
																			<span className="flex items-center gap-1">
																				<Clock size={12} className="text-amber-500/70" />
																				{post.readTime} min read
																			</span>
																		</div>
																	</div>
																</div>

																<div className="flex items-center gap-6">
																	<div className="flex items-center gap-3 text-xs text-gray-400">
																		<span className="flex items-center gap-1">
																			<Eye size={12} className="text-amber-500/70" />
																			{post.viewCount}
																		</span>
																		<span className="flex items-center gap-1">
																			<MessageSquare size={12} className="text-amber-500/70" />
																			{post.commentCount}
																		</span>
																	</div>

																	<Link
																		href={`/blog/${post.slug}`}
																		className="flex items-center gap-1 text-sm font-medium transition-colors text-amber-400 hover:text-amber-300"
																	>
																		Read More
																		<ArrowRight size={14} />
																	</Link>
																</div>
															</div>
														</div>
													</div>
												</Card>
											</motion.div>
										))}
									</motion.div>
								)}
							</>
						) : (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<div className="mb-4 text-gray-400">
									<Search size={48} className="mx-auto mb-4 opacity-30" />
									<h3 className="mb-2 text-xl font-medium text-white">No articles found</h3>
									<p className="text-gray-500">
										We couldn&apos;t find any articles matching your search criteria. Please try
										adjusting your filters.
									</p>
								</div>
								<Button
									onClick={() => {
										setSearchQuery('')
										setSelectedCategory(null)
										setSelectedTags([])
									}}
									className="mt-4"
									variant="outline"
								>
									Reset Filters
								</Button>
							</div>
						)}

						{/* Pagination */}
						{filteredPosts.length > 0 && (
							<div className="flex justify-center mt-12">
								<div className="flex items-center gap-2">
									<Button variant="outline" size="icon" className="border-gray-800">
										<ChevronRight size={16} className="rotate-180" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="border-gray-800 w-9 bg-amber-500/10 text-amber-400"
									>
										1
									</Button>
									<Button variant="outline" size="sm" className="border-gray-800 w-9">
										2
									</Button>
									<Button variant="outline" size="sm" className="border-gray-800 w-9">
										3
									</Button>
									<span className="px-2 text-gray-500">...</span>
									<Button variant="outline" size="sm" className="border-gray-800 w-9">
										8
									</Button>
									<Button variant="outline" size="icon" className="border-gray-800">
										<ChevronRight size={16} />
									</Button>
								</div>
							</div>
						)}
					</div>

					{/* Newsletter subscription */}
					<NewsletterSection />

					{/* Categories section */}
					<motion.section
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.3 }}
						variants={fadeInUp}
						className="pt-12 mt-12 border-t border-gray-800"
					>
						<h2 className="mb-8 text-2xl font-bold text-white">Explore Topics</h2>

						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{CATEGORIES.map((category, index) => (
								<motion.div key={category.id} variants={fadeInUp} custom={index * 0.1}>
									<Link href={`/blog/category/${category.slug}`}>
										<Card className="h-full transition-all border-transparent hover:bg-white/10 hover:border-amber-500/20 bg-white/5 backdrop-blur-sm">
											<CardContent className="flex flex-col items-center justify-center pt-6 text-center">
												<div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-amber-500/20">
													<Tag className="text-amber-400" />
												</div>
												<h3 className="mb-2 text-lg font-medium text-white">{category.name}</h3>
												<p className="text-sm text-gray-400">{category.count} articles</p>
											</CardContent>
										</Card>
									</Link>
								</motion.div>
							))}
						</div>
					</motion.section>
				</div>
			</section>
		</div>
	)
}
