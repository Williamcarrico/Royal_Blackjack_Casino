'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useInView as useFramerInView } from 'framer-motion'
import {
	Crown,
	Diamond,
	Sparkles,
	Star,
	Award,
	ChevronRight,
	Gift,
	CreditCard,
	Trophy,
	Clock,
	Check,
	ArrowRight,
} from 'lucide-react'
import { DynamicIcon } from '@/components/ui/icons/DynamicIcon'
import { Button } from '@/components/ui/layout/button'
import { cn } from '@/lib/utils/utils'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import Link from 'next/link'

// Define types
interface VIPTier {
	id: string
	name: string
	icon: React.ReactNode
	color: string
	benefits: string[]
	pointsRequired: number
	current?: boolean
}

interface VIPBenefit {
	id: string
	title: string
	description: string
	icon: React.ReactNode
}

interface Particle {
	id: string
	x: number
	y: number
	opacity: number
	scale: number
	duration: number
	delay: number
}

// Animated section component that fades in when scrolled into view
const AnimatedSection = ({
	children,
	delay = 0,
	className = '',
}: {
	children: React.ReactNode
	delay?: number
	className?: string
}) => {
	const controls = useAnimation()
	const ref = useRef(null)
	const inView = useFramerInView(ref, {
		once: true,
		amount: 0.1,
	})

	useEffect(() => {
		if (inView) {
			controls.start('visible')
		}
	}, [controls, inView])

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={controls}
			variants={{
				hidden: { opacity: 0, y: 30 },
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						duration: 0.7,
						ease: [0.25, 0.1, 0.25, 1],
						delay,
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	)
}

// Animated gradient card for VIP tiers
const VIPTierCard = ({ tier, index }: { tier: VIPTier; index: number }) => {
	const cardRef = useRef<HTMLButtonElement>(null)

	// Gradient movement effect on hover
	const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (!cardRef.current) return

		const rect = cardRef.current.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		cardRef.current.style.setProperty('--mouse-x', `${x}px`)
		cardRef.current.style.setProperty('--mouse-y', `${y}px`)
	}

	// Handle keyboard interaction
	const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
		// Activate on Enter or Space key
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 30 }}
			animate={{
				opacity: 1,
				y: 0,
				transition: {
					duration: 0.5,
					delay: 0.1 * index,
				},
			}}
			className="relative"
		>
			<button
				ref={cardRef}
				type="button"
				onMouseMove={handleMouseMove}
				onKeyDown={handleKeyDown}
				aria-label={`${tier.name} tier details`}
				className={cn(
					'relative w-full h-full p-6 md:p-8 rounded-2xl overflow-hidden border text-left',
					'bg-black-30 backdrop-blur-md shadow-xl transition-all duration-300',
					'before:absolute before:inset-0 before:rounded-2xl before:p-0.5',
					'before:bg-gradient-to-br',
					`before:from-${tier.color}-400/40 before:to-${tier.color}-600/40`,
					'before:opacity-50 before:transition-opacity',
					'hover:before:opacity-100 hover:scale-[1.01] focus:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary/50',
					'after:absolute after:inset-0 after:rounded-2xl',
					'after:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.1),transparent_40%)]',
					tier.current ? 'border-primary/50 shadow-primary/10' : 'border-gray-800/50'
				)}
			>
				<div className="relative z-10 flex flex-col items-start justify-between h-full">
					<div>
						<div className={`text-${tier.color}-400 mb-3 flex items-center gap-2`}>
							{tier.icon}
							<h3 className="text-xl font-semibold font-playfair">{tier.name}</h3>
						</div>

						<div className="mt-5">
							<ul className="space-y-2">
								{tier.benefits.map(benefit => (
									<li
										key={`${tier.id}-benefit-${benefit.replace(/\s+/g, '-').toLowerCase()}`}
										className="flex items-start gap-2 text-sm text-gray-300"
									>
										<Check className="h-4 w-4 mt-0.5 text-primary-400 flex-shrink-0" />
										<span>{benefit}</span>
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="w-full mt-6">
						<div className="mb-2 text-sm text-gray-400">
							{tier.current ? (
								<span className="text-primary">Your current tier</span>
							) : (
								<span>{tier.pointsRequired.toLocaleString()} points required</span>
							)}
						</div>

						<div
							className={cn(
								'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium w-full mt-2',
								'ring-offset-white transition-colors',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
								tier.current
									? 'bg-primary text-primary-foreground hover:bg-primary/90'
									: 'border border-gray-700 hover:bg-gray-800/50 text-gray-200'
							)}
						>
							{tier.current ? 'View Benefits' : 'Learn More'}
							<ChevronRight className="w-4 h-4 ml-2" />
						</div>
					</div>
				</div>

				{/* Decorative elements */}
				<div className="absolute z-0 w-32 h-32 rounded-full -top-10 -right-10 blur-3xl opacity-20 bg-gradient-to-br from-white via-primary-400 to-primary-600"></div>
				<div className="absolute z-0 w-40 h-40 rounded-full -bottom-10 -left-10 blur-3xl opacity-10 bg-gradient-to-tl from-white via-primary-400 to-primary-600"></div>
			</button>
		</motion.div>
	)
}

// Main VIP Component
export default function VIPPage() {
	// Define VIP tiers
	const vipTiers: VIPTier[] = [
		{
			id: 'silver',
			name: 'Silver Elite',
			icon: <Star className="w-5 h-5" />,
			color: 'gray',
			pointsRequired: 5000,
			benefits: [
				'Premium customer support',
				'Monthly bonus of 5,000 chips',
				'Access to exclusive tournaments',
				'1.2x points multiplier',
			],
		},
		{
			id: 'gold',
			name: 'Gold Prestige',
			icon: <Award className="w-5 h-5" />,
			color: 'yellow',
			pointsRequired: 25000,
			benefits: [
				'VIP customer support',
				'Monthly bonus of 15,000 chips',
				'Access to high-roller tables',
				'1.5x points multiplier',
				'Weekly exclusive promotions',
			],
			current: true,
		},
		{
			id: 'platinum',
			name: 'Platinum Royale',
			icon: <Crown className="w-5 h-5" />,
			color: 'blue',
			pointsRequired: 100000,
			benefits: [
				'24/7 dedicated VIP host',
				'Monthly bonus of 50,000 chips',
				'Access to private tables',
				'2x points multiplier',
				'Exclusive gifts and rewards',
				'Custom table limits',
			],
		},
		{
			id: 'diamond',
			name: 'Diamond Sovereign',
			icon: <Diamond className="w-5 h-5" />,
			color: 'purple',
			pointsRequired: 500000,
			benefits: [
				'Personal account manager',
				'Monthly bonus of 250,000 chips',
				'Invitation to exclusive events',
				'3x points multiplier',
				'Luxury gifts and experiences',
				'Custom game development input',
				'Unlimited table limits',
			],
		},
	]

	// Define VIP benefits
	const vipBenefits: VIPBenefit[] = [
		{
			id: 'bonus',
			title: 'Monthly Bonuses',
			description:
				'Receive generous chip bonuses every month based on your VIP tier, with no wagering requirements.',
			icon: <Gift className="w-6 h-6" />,
		},
		{
			id: 'points',
			title: 'Enhanced Points',
			description:
				'Earn loyalty points faster with tier multipliers, accelerating your progression and rewards.',
			icon: <DynamicIcon icon="GiCoins" library="gi" className="w-6 h-6" />,
		},
		{
			id: 'tables',
			title: 'Exclusive Tables',
			description: 'Access high-limit tables and private games not available to regular players.',
			icon: <DynamicIcon icon="GiDiamonds" library="gi" className="w-6 h-6" />,
		},
		{
			id: 'events',
			title: 'VIP Tournaments',
			description:
				'Participate in invitation-only tournaments with massive prize pools and unique formats.',
			icon: <Trophy className="w-6 h-6" />,
		},
		{
			id: 'support',
			title: 'Priority Support',
			description:
				'Skip the queue with dedicated VIP support available 24/7 through private channels.',
			icon: <CreditCard className="w-6 h-6" />,
		},
		{
			id: 'promotions',
			title: 'Special Promotions',
			description:
				'Receive tailored promotions and exclusive offers designed specifically for your playing style.',
			icon: <Sparkles className="w-6 h-6" />,
		},
	]

	// Static arrays with unique IDs for animation elements
	const lightBeams = [
		{ id: 'beam-1', duration: 7, delay: 0, left: 15, rotate: 45 },
		{ id: 'beam-2', duration: 8, delay: 1.5, left: 35, rotate: 50 },
		{ id: 'beam-3', duration: 9, delay: 3, left: 55, rotate: 55 },
		{ id: 'beam-4', duration: 10, delay: 4.5, left: 75, rotate: 60 },
		{ id: 'beam-5', duration: 11, delay: 6, left: 95, rotate: 65 },
	]

	const [isBrowser, setIsBrowser] = useState(false)
	const [particles, setParticles] = useState<Particle[]>([])

	// Only set isBrowser to true after component mounts (client-side only)
	useEffect(() => {
		setIsBrowser(true)
		// Generate particles only on the client side
		setParticles(
			Array.from({ length: 20 }, (_, i) => ({
				id: `particle-${i + 1}`,
				x: Math.random() * 100,
				y: Math.random() * 100,
				opacity: Math.random() * 0.5 + 0.2,
				scale: Math.random() * 0.5 + 0.5,
				duration: 3 + Math.random() * 5,
				delay: Math.random() * 5,
			}))
		)
	}, [])

	// Calculate the current progress to the next tier
	const currentTierIndex = vipTiers.findIndex(tier => tier.current)
	const nextTier = currentTierIndex < vipTiers.length - 1 ? vipTiers[currentTierIndex + 1] : null
	const currentTier = vipTiers[currentTierIndex]!
	const progressPercent = nextTier ? 65 : 100 // This would be calculated based on actual points

	const handleClaimReward = () => {
		toast('Daily Reward Claimed!', {
			description: '5,000 chips have been added to your account.',
		})
	}

	return (
		<div className="w-full min-h-screen text-white bg-gradient-to-b from-black via-gray-950 to-black">
			{/* Hero Section with Parallax Effect */}
			<section className="relative w-full overflow-hidden">
				{/* Background Effects */}
				<div className="absolute inset-0 bg-black">
					<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(120,41,230,0.5),transparent_70%)]"></div>

					{/* Animated light beams */}
					<div className="absolute inset-0">
						{lightBeams.map(beam => (
							<motion.div
								key={beam.id}
								initial={{ opacity: 0.1, scale: 1 }}
								animate={{
									opacity: [0.1, 0.3, 0.1],
									scale: [1, 1.1, 1],
									rotate: [0, 5, 0],
								}}
								transition={{
									duration: beam.duration,
									ease: 'easeInOut',
									repeat: Infinity,
									repeatType: 'reverse',
									delay: beam.delay,
								}}
								className="absolute h-[500px] w-[60px] bg-gradient-to-b from-primary/10 via-primary/30 to-primary/10 blur-3xl"
								style={{
									top: '-20%',
									left: `${beam.left}%`,
									transform: `rotate(${beam.rotate}deg) translateZ(0)`,
									transformOrigin: 'center',
								}}
							/>
						))}
					</div>

					{/* Floating particles */}
					<div className="absolute inset-0">
						{isBrowser &&
							particles.map(particle => (
								<motion.div
									key={particle.id}
									initial={{
										x: (particle.x / 100) * window.innerWidth,
										y: (particle.y / 100) * window.innerHeight,
										opacity: particle.opacity,
										scale: particle.scale,
									}}
									animate={{
										y: [0, -15, 0],
										opacity: [0.3, 0.7, 0.3],
									}}
									transition={{
										duration: particle.duration,
										ease: 'easeInOut',
										repeat: Infinity,
										repeatType: 'reverse',
										delay: particle.delay,
									}}
									className="absolute w-1 h-1 rounded-full bg-primary-400"
								/>
							))}
					</div>
				</div>

				<div className="container relative z-10 px-4 py-24 mx-auto md:py-32">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, ease: 'easeOut' }}
						className="max-w-4xl mx-auto text-center"
					>
						<div className="flex justify-center mb-6">
							<div className="relative">
								<Crown className="w-16 h-16 text-primary" />
								<motion.div
									animate={{
										opacity: [0.4, 1, 0.4],
										scale: [1, 1.2, 1],
									}}
									transition={{
										duration: 3,
										ease: 'easeInOut',
										repeat: Infinity,
									}}
									className="absolute inset-0 rounded-full bg-primary/30 blur-xl -z-10"
								/>
							</div>
						</div>

						<h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl font-playfair">
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-primary-600">
								VIP Experience
							</span>
						</h1>

						<p className="max-w-3xl mx-auto mb-8 text-xl leading-relaxed text-gray-300 md:text-2xl">
							Elevate your gaming journey with exclusive rewards, personalized service, and premium
							benefits designed for our most valued players.
						</p>

						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Button size="lg" className="font-medium text-white bg-primary hover:bg-primary/90">
								View Your Benefits
								<ChevronRight className="w-5 h-5 ml-2" />
							</Button>
							<Button
								size="lg"
								variant="outline"
								className="text-white border-primary/50 hover:bg-primary/10"
							>
								Upgrade Tier
								<ArrowRight className="w-5 h-5 ml-2" />
							</Button>
						</div>
					</motion.div>
				</div>
			</section>

			{/* VIP Status Section */}
			<section className="relative py-16 overflow-hidden md:py-24">
				<div className="container px-4 mx-auto">
					<AnimatedSection className="relative p-6 overflow-hidden border bg-black-30 backdrop-blur-md rounded-3xl border-gray-800/50 md:p-10">
						{/* Decorative elements */}
						<div className="absolute z-0 w-64 h-64 rounded-full -top-20 -right-20 blur-3xl opacity-10 bg-gradient-to-br from-white via-primary-400 to-primary-600"></div>
						<div className="absolute z-0 w-64 h-64 rounded-full -bottom-20 -left-20 blur-3xl opacity-10 bg-gradient-to-tl from-white via-primary-400 to-primary-600"></div>

						<div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
							{/* Current status */}
							<div className="flex flex-col col-span-1">
								<h2 className="mb-2 text-2xl font-semibold font-playfair">Your VIP Status</h2>
								<div className="mb-6 text-sm text-gray-400">Updated 2 hours ago</div>

								<div className="flex items-center gap-3 mb-4">
									<div className="p-3 rounded-full bg-yellow-500/20">
										<Award className="w-6 h-6 text-yellow-400" />
									</div>
									<div>
										<div className="text-xl font-semibold text-yellow-400">{currentTier.name}</div>
										<div className="text-sm text-gray-400">Member since June 2023</div>
									</div>
								</div>

								<div className="mt-2 mb-4">
									<div className="flex justify-between mb-2 text-sm">
										<span className="text-gray-400">Current Points</span>
										<span className="font-medium">25,650</span>
									</div>
									<div className="w-full h-2 overflow-hidden bg-gray-800 rounded-full">
										<div
											className={`h-full rounded-full bg-gradient-to-r from-yellow-500 to-primary-500 progress-width-${progressPercent}`}
										></div>
									</div>
									{nextTier && (
										<div className="flex justify-between mt-2 text-sm">
											<span className="text-gray-400">Next Tier</span>
											<span className="font-medium">
												{nextTier.name} ({nextTier.pointsRequired - 25650} points needed)
											</span>
										</div>
									)}
								</div>

								<div className="mt-auto">
									<div className="p-4 border bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border-gray-700/50">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												<Gift className="w-5 h-5 text-primary-400" />
												<span className="font-medium">Daily VIP Reward</span>
											</div>
											<Clock className="w-4 h-4 text-gray-400" />
										</div>
										<div className="mb-3 text-sm text-gray-300">
											Claim your 5,000 bonus chips available for Gold Prestige members.
										</div>
										<Button className="w-full" onClick={handleClaimReward}>
											Claim Reward
										</Button>
									</div>
								</div>
							</div>

							{/* Stats */}
							<div className="flex flex-col col-span-2">
								<h2 className="mb-6 text-2xl font-semibold font-playfair">Your Activity</h2>

								<div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 md:grid-cols-3">
									<div className="p-4 border bg-black-50 border-gray-800/50 rounded-xl">
										<div className="mb-1 text-sm text-gray-400">Total Games</div>
										<div className="text-2xl font-semibold">2,487</div>
									</div>
									<div className="p-4 border bg-black-50 border-gray-800/50 rounded-xl">
										<div className="mb-1 text-sm text-gray-400">Win Rate</div>
										<div className="text-2xl font-semibold text-green-400">52.3%</div>
									</div>
									<div className="p-4 border bg-black-50 border-gray-800/50 rounded-xl">
										<div className="mb-1 text-sm text-gray-400">Tournament Wins</div>
										<div className="text-2xl font-semibold">14</div>
									</div>
								</div>

								<div className="flex-1 p-6 border bg-black-50 border-gray-800/50 rounded-xl">
									<div className="flex items-center justify-between mb-4">
										<h3 className="font-medium">Recent Activity</h3>
										<Button variant="link" className="h-auto p-0 text-primary">
											View All
										</Button>
									</div>

									<div className="space-y-4">
										{[
											{ action: 'Won tournament', reward: '25,000 chips', time: '2 days ago' },
											{
												action: 'Blackjack streak bonus',
												reward: '5,000 chips',
												time: '3 days ago',
											},
											{ action: 'Monthly VIP bonus', reward: '15,000 chips', time: '1 week ago' },
											{
												action: 'Perfect strategy reward',
												reward: '2,500 chips',
												time: '1 week ago',
											},
										].map(activity => (
											<div
												key={`activity-${activity.action.replace(/\s+/g, '-').toLowerCase()}-${activity.time.replace(/\s+/g, '-').toLowerCase()}`}
												className="flex items-center justify-between p-3 border rounded-lg bg-black-30 border-gray-800/30"
											>
												<div>
													<div className="font-medium">{activity.action}</div>
													<div className="text-sm text-gray-400">{activity.time}</div>
												</div>
												<div className="font-medium text-green-400">+{activity.reward}</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</AnimatedSection>
				</div>
			</section>

			{/* VIP Tiers Section */}
			<section className="py-16 md:py-24">
				<div className="container px-4 mx-auto">
					<AnimatedSection className="max-w-3xl mx-auto mb-12 text-center">
						<h2 className="mb-4 text-3xl font-bold md:text-4xl font-playfair">
							Exclusive VIP Tiers
						</h2>
						<p className="text-lg text-gray-300">
							Explore our premium membership levels and unlock increasingly prestigious rewards as
							you progress through our VIP program.
						</p>
					</AnimatedSection>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 md:gap-8">
						{vipTiers.map((tier, index) => (
							<VIPTierCard key={tier.id} tier={tier} index={index} />
						))}
					</div>
				</div>
			</section>

			{/* VIP Benefits Section */}
			<section className="relative py-16 overflow-hidden md:py-24">
				{/* Background decoration */}
				<div className="absolute inset-0 opacity-30">
					<div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(120,41,230,0.2),transparent_70%)]"></div>
					<div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(120,41,230,0.1),transparent_70%)]"></div>
				</div>

				<div className="container relative z-10 px-4 mx-auto">
					<AnimatedSection className="max-w-3xl mx-auto mb-16 text-center">
						<h2 className="mb-4 text-3xl font-bold md:text-4xl font-playfair">Premium Benefits</h2>
						<p className="text-lg text-gray-300">
							Experience the royal treatment with our curated selection of VIP perks designed to
							enhance your gaming experience.
						</p>
					</AnimatedSection>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{vipBenefits.map((benefit, index) => (
							<TooltipProvider key={benefit.id}>
								<Tooltip>
									<TooltipTrigger asChild>
										<AnimatedSection
											delay={index * 0.1}
											className="p-6 transition-all duration-300 border bg-black-30 backdrop-blur-md border-gray-800/50 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
										>
											<div className="flex items-start gap-4">
												<div className="p-3 bg-gray-800/80 rounded-xl text-primary">
													{benefit.icon}
												</div>
												<div>
													<h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
													<p className="text-gray-400">{benefit.description}</p>
												</div>
											</div>
										</AnimatedSection>
									</TooltipTrigger>
									<TooltipContent>
										<span>Click to learn more about {benefit.title}</span>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 md:py-24">
				<div className="container px-4 mx-auto">
					<AnimatedSection className="relative overflow-hidden rounded-3xl">
						<div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-purple-900/20 to-black"></div>

						{/* Animated glow effect */}
						<motion.div
							animate={{
								opacity: [0.2, 0.5, 0.2],
								scale: [1, 1.1, 1],
							}}
							transition={{
								duration: 5,
								ease: 'easeInOut',
								repeat: Infinity,
							}}
							className="absolute z-0 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full top-1/2 left-1/2 h-3/4 bg-primary/20 blur-3xl"
						/>

						<div className="relative z-10 flex flex-col items-center px-8 py-16 text-center md:py-20 md:px-16">
							<Crown className="w-16 h-16 mb-6 text-primary" />

							<h2 className="max-w-2xl mb-6 text-3xl font-bold md:text-4xl font-playfair">
								Ready to Experience the Royal Treatment?
							</h2>

							<p className="max-w-3xl mb-10 text-xl text-gray-300">
								Join our VIP program today and start enjoying exclusive benefits, personalized
								service, and premium rewards designed for discerning players.
							</p>

							<div className="flex flex-col gap-4 sm:flex-row">
								<Link href="/vip/join">
									<Button size="lg" className="font-medium text-white bg-primary hover:bg-primary/90">
										Join VIP Program
									</Button>
								</Link>
								<Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5">
									Learn More
								</Button>
							</div>
						</div>
					</AnimatedSection>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-16 md:py-24">
				<div className="container px-4 mx-auto">
					<AnimatedSection className="max-w-3xl mx-auto mb-12 text-center">
						<h2 className="mb-4 text-3xl font-bold md:text-4xl font-playfair">
							Frequently Asked Questions
						</h2>
						<p className="text-lg text-gray-300">
							Everything you need to know about our exclusive VIP program.
						</p>
					</AnimatedSection>

					<div className="grid max-w-4xl grid-cols-1 gap-6 mx-auto md:grid-cols-2">
						{[
							{
								question: 'How do I qualify for VIP status?',
								answer:
									"VIP status is determined by your gameplay activity and loyalty points accumulated. Once you reach 5,000 points, you'll automatically qualify for our Silver Elite tier.",
							},
							{
								question: 'How are loyalty points calculated?',
								answer:
									'Loyalty points are earned based on your gameplay. You earn 1 point for every 100 chips wagered, with VIP tiers offering point multipliers to accelerate your progress.',
							},
							{
								question: 'Can I lose my VIP status?',
								answer:
									'VIP status is reviewed quarterly. To maintain your status, you need to meet the minimum activity requirements for your tier during each review period.',
							},
							{
								question: 'Are VIP benefits available immediately?',
								answer:
									"Yes, once you reach a VIP tier, benefits are activated immediately. You'll receive a notification and your first monthly bonus will be credited to your account.",
							},
							{
								question: 'How do I contact my VIP host?',
								answer:
									'Gold tier and above members have access to dedicated VIP support. You can contact your host through the VIP section in your account settings or via email.',
							},
							{
								question: 'Are VIP tournaments available on mobile?',
								answer:
									'Yes, all VIP tournaments and exclusive tables are fully accessible on our mobile platform with the same premium experience as desktop.',
							},
						].map((faq, index) => (
							<AnimatedSection
								key={`faq-${faq.question.replace(/\s+/g, '-').toLowerCase().substring(0, 40)}`}
								delay={index * 0.1}
								className="p-6 border bg-gray-900/40 backdrop-blur-sm border-gray-800/50 rounded-xl"
							>
								<h3 className="mb-3 text-lg font-medium">{faq.question}</h3>
								<p className="text-gray-400">{faq.answer}</p>
							</AnimatedSection>
						))}
					</div>

					<AnimatedSection className="mt-12 text-center">
						<p className="mb-4 text-gray-400">Still have questions about our VIP program?</p>
						<Button variant="link" className="text-primary">
							Contact VIP Support <ArrowRight className="w-4 h-4 ml-1" />
						</Button>
					</AnimatedSection>
				</div>
			</section>
		</div>
	)
}
