'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { motion, type Variants, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Code2, Brain, Cpu, Award, TrendingUp, ChevronRight, Zap, Github } from 'lucide-react'
import {
	Card,
	CardHeader,
	CardContent,
	CardTitle,
	CardDescription,
	CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { VEGAS_RULES } from '@/lib/utils/gameLogic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Animation variants
const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
			ease: 'easeInOut',
			duration: 0.6,
		},
	},
}

const itemVariants: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring',
			stiffness: 100,
			damping: 15,
		},
	},
}

const glowVariants: Variants = {
	initial: { opacity: 0 },
	animate: {
		opacity: [0.2, 0.4, 0.2],
		scale: [1, 1.1, 1],
		transition: {
			duration: 3,
			repeat: Infinity,
			ease: 'easeInOut',
		},
	},
}

const cardHoverVariants: Variants = {
	initial: {
		boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
		y: 0,
	},
	hover: {
		boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
		y: -5,
		transition: {
			type: 'spring',
			stiffness: 300,
			damping: 20,
		},
	},
}

// Enhanced slide-in variants for improved section transitions
const slideInVariants: Variants = {
	hidden: { opacity: 0, x: -30 },
	visible: {
		opacity: 1,
		x: 0,
		transition: {
			type: 'spring',
			stiffness: 80,
			damping: 20,
		},
	},
}

// Button hover animation
const buttonVariants: Variants = {
	initial: { scale: 1 },
	hover: {
		scale: 1.05,
		transition: {
			type: 'spring',
			stiffness: 400,
			damping: 10
		}
	},
	tap: {
		scale: 0.98,
		transition: {
			type: 'spring',
			stiffness: 400,
			damping: 10
		}
	}
}

interface Feature {
	id: string
	icon: React.ReactNode
	title: string
	description: string
	stats?: string
}

const features: Feature[] = [
	{
		id: 'ai-strategy',
		icon: <Brain className="w-8 h-8" />,
		title: 'Advanced AI Strategy',
		description:
			'Powered by sophisticated algorithms that analyze optimal play patterns and card counting techniques.',
		stats: '99.5% accuracy',
	},
	{
		id: 'tech-stack',
		icon: <Code2 className="w-8 h-8" />,
		title: 'Modern Tech Stack',
		description:
			'Built with Next.js 15, React 19, TypeScript, and Zustand for a seamless gaming experience.',
		stats: '100ms response time',
	},
	{
		id: 'analytics',
		icon: <TrendingUp className="w-8 h-8" />,
		title: 'Real-time Analytics',
		description: 'Comprehensive performance tracking and visualization of your gaming statistics.',
		stats: 'Live updates',
	},
	{
		id: 'professional',
		icon: <Award className="w-8 h-8" />,
		title: 'Professional Grade',
		description: 'Casino-quality gameplay with advanced features for both beginners and experts.',
		stats: 'Vegas standard rules',
	},
]

interface TeamMember {
	name: string
	role: string
	image: string
}

const teamMembers: TeamMember[] = [
	{
		name: 'William Carrico',
		role: 'Lead Game Developer',
		image: 'https://i.pravatar.cc/150?u=alex',
	},
	{
		name: 'Amy Carrico',
		role: 'AI Strategy Expert',
		image: 'https://i.pravatar.cc/150?u=jamie',
	},
	{
		name: 'James Bond',
		role: 'UX Designer',
		image: 'https://i.pravatar.cc/150?u=sam',
	},
]

// Enhanced feature card with improved animations
const FeatureCard = ({ feature }: { feature: Feature }) => (
	<motion.div
		key={feature.id}
		variants={itemVariants}
		whileHover="hover"
		initial="initial"
		className="relative"
	>
		<motion.div variants={cardHoverVariants}>
			<Card
				className={cn(
					'p-6 h-full backdrop-blur-sm border transition-all duration-300',
					'bg-card/50 border-primary/10 hover:border-primary/30',
					'dark:bg-card/30 dark:border-primary/20 dark:hover:border-primary/40'
				)}
			>
				<CardHeader>
					<div className="flex items-center space-x-4">
						<motion.div
							className="p-2 rounded-lg bg-primary/10 text-primary"
							whileHover={{ rotate: [0, -10, 10, -5, 0], transition: { duration: 0.5 } }}
						>
							{feature.icon}
						</motion.div>
						<CardTitle>{feature.title}</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<CardDescription className="text-base leading-relaxed">
						{feature.description}
					</CardDescription>
				</CardContent>
				{feature.stats && (
					<CardFooter className="pt-2 border-t border-primary/10">
						<motion.div
							className="px-2 py-1 text-xs font-medium rounded-full bg-secondary/80 text-secondary-foreground"
							whileHover={{ scale: 1.05 }}
						>
							{feature.stats}
						</motion.div>
					</CardFooter>
				)}
			</Card>
		</motion.div>
	</motion.div>
)

export default function AboutUs() {
	// Scroll-based animations
	const { scrollYProgress } = useScroll()
	const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.2])
	const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
	const translateY = useTransform(scrollYProgress, [0, 1], [0, -50])

	// Memoize game rules to avoid unnecessary recalculations
	const gameRules = useMemo(() => {
		return {
			houseEdge: '0.5%',
			deckCount: VEGAS_RULES.decksCount,
			blackjackPays: '3:2',
			dealerRules: VEGAS_RULES.dealerHitsSoft17 ? 'H17' : 'S17',
		}
	}, [])

	return (
		<motion.div
			className="min-h-screen px-4 py-16 overflow-hidden bg-gradient-to-b from-background to-background/80"
			initial="hidden"
			animate="visible"
			variants={containerVariants}
		>
			<div className="max-w-6xl mx-auto space-y-20">
				{/* Hero Section with Parallax */}
				<motion.section
					style={{ opacity, scale }}
					className="relative py-16 space-y-6 text-center"
				>
					<motion.div
						className="absolute inset-0 pointer-events-none"
						variants={glowVariants}
						initial="initial"
						animate="animate"
					>
						<div className="absolute inset-0 opacity-50 bg-gradient-radial from-primary/20 to-transparent blur-3xl" />
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
					>
						<div className="inline-flex items-center px-4 py-1 mb-6 text-sm font-medium border rounded-full border-primary/20">
							<Zap size={14} className="mr-1 animate-pulse" /> House Edge Blackjack
						</div>
					</motion.div>

					<h1 className="text-4xl font-bold text-transparent md:text-6xl lg:text-7xl bg-clip-text bg-gradient-to-r from-primary to-primary/60">
						Elevating the Art of Blackjack
					</h1>
					<p className="max-w-3xl mx-auto text-xl text-muted-foreground md:text-2xl">
						Welcome to the future of blackjack gaming. Our platform combines cutting-edge technology
						with sophisticated gameplay mechanics to deliver an unparalleled gaming experience.
					</p>

					<motion.div
						className="flex flex-wrap justify-center gap-4 pt-8"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1, transition: { delay: 0.6 } }}
					>
						<motion.div
							variants={buttonVariants}
							whileHover="hover"
							whileTap="tap"
							initial="initial"
						>
							<Button size="lg" className="text-base font-medium">
								Start Playing
							</Button>
						</motion.div>
						<motion.div
							variants={buttonVariants}
							whileHover="hover"
							whileTap="tap"
							initial="initial"
						>
							<Button variant="outline" size="lg" className="text-base font-medium">
								Learn Strategy
							</Button>
						</motion.div>
					</motion.div>
				</motion.section>

				{/* Features Grid */}
				<motion.section
					variants={slideInVariants}
					className="space-y-10"
					aria-label="Features"
				>
					<div className="space-y-4 text-center">
						<motion.h2
							className="text-3xl font-bold md:text-4xl"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ delay: 0.2 }}
						>
							Cutting-Edge Features
						</motion.h2>
						<motion.p
							className="max-w-3xl mx-auto text-lg text-muted-foreground"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ delay: 0.3 }}
						>
							Our platform integrates the latest in gaming technology to provide an authentic casino
							experience
						</motion.p>
					</div>

					<div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-2">
						{features.map((feature, index) => (
							<motion.div
								key={feature.id}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-50px" }}
								transition={{ delay: 0.1 * index }}
							>
								<FeatureCard feature={feature} />
							</motion.div>
						))}
					</div>
				</motion.section>

				{/* Technical Excellence with Tabs */}
				<motion.section
					variants={itemVariants}
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6 }}
					className="p-6 border md:p-10 rounded-2xl bg-card/50 backdrop-blur-sm border-primary/10"
				>
					<div className="flex items-center justify-center mb-8 space-x-4">
						<motion.div
							initial={{ rotate: 0 }}
							whileInView={{ rotate: 360 }}
							viewport={{ once: true }}
							transition={{ duration: 0.8, ease: "easeInOut" }}
						>
							<Cpu className="w-8 h-8 text-primary" />
						</motion.div>
						<h2 className="text-2xl font-bold md:text-3xl">Technical Excellence</h2>
					</div>

					<Tabs defaultValue="performance" className="w-full">
						<TabsList className="grid w-full grid-cols-1 mb-8 sm:grid-cols-3">
							<TabsTrigger value="performance">Performance</TabsTrigger>
							<TabsTrigger value="security">Security</TabsTrigger>
							<TabsTrigger value="architecture">Architecture</TabsTrigger>
						</TabsList>

						<AnimatePresence mode="wait">
							<TabsContent value="performance" className="space-y-4">
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.3 }}
									className="grid grid-cols-1 gap-6 text-center md:grid-cols-3"
								>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">React 19 Features</h3>
										<p className="text-sm text-muted-foreground">
											Leveraging the latest React capabilities for optimal rendering performance
										</p>
									</div>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">Real-time Updates</h3>
										<p className="text-sm text-muted-foreground">
											Sub-50ms response time for all game actions
										</p>
									</div>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">Optimized Assets</h3>
										<p className="text-sm text-muted-foreground">
											Compressed card imagery and intelligent preloading
										</p>
									</div>
								</motion.div>
							</TabsContent>

							<TabsContent value="security" className="space-y-4">
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.3 }}
									className="grid grid-cols-1 gap-6 text-center md:grid-cols-3"
								>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">Verified RNG</h3>
										<p className="text-sm text-muted-foreground">
											Cryptographically secure random number generation for fair play
										</p>
									</div>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">Type Safety</h3>
										<p className="text-sm text-muted-foreground">
											100% TypeScript coverage with strict mode enabled
										</p>
									</div>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">Data Encryption</h3>
										<p className="text-sm text-muted-foreground">
											End-to-end encryption for all player data and game states
										</p>
									</div>
								</motion.div>
							</TabsContent>

							<TabsContent value="architecture" className="space-y-4">
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.3 }}
									className="grid grid-cols-1 gap-6 text-center md:grid-cols-3"
								>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">State Management</h3>
										<p className="text-sm text-muted-foreground">
											Efficient state handling with Zustand for predictable game state
										</p>
									</div>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">Server Components</h3>
										<p className="text-sm text-muted-foreground">
											Next.js App Router with streaming SSR for optimal loading
										</p>
									</div>
									<div className="p-6 space-y-3 transition-all duration-300 border rounded-lg border-primary/10 hover:border-primary/30">
										<h3 className="font-semibold">Modular Design</h3>
										<p className="text-sm text-muted-foreground">
											Component-based architecture for maintainability and reusability
										</p>
									</div>
								</motion.div>
							</TabsContent>
						</AnimatePresence>
					</Tabs>
				</motion.section>

				{/* Team Section */}
				<motion.section
					variants={itemVariants}
					style={{ y: translateY }}
					className="space-y-12"
				>
					<div className="space-y-4 text-center">
						<motion.h2
							className="text-3xl font-bold md:text-4xl"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
						>
							Built by Enthusiasts, for Enthusiasts
						</motion.h2>
						<motion.p
							className="max-w-3xl mx-auto text-lg text-muted-foreground"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ delay: 0.1 }}
						>
							Our team combines decades of experience in software engineering, game theory, and
							casino gaming to create the most sophisticated blackjack platform available.
						</motion.p>
					</div>

					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
						<AnimatePresence>
							{teamMembers.map((member, index) => (
								<motion.div
									key={member.name}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-50px" }}
									transition={{ delay: 0.1 * index }}
									whileHover={{
										y: -10,
										transition: { type: 'spring', stiffness: 400, damping: 10 },
									}}
									className="group"
								>
									<Card className="overflow-hidden border bg-card/50 backdrop-blur-sm border-primary/10">
										<div className="relative overflow-hidden aspect-square">
											<Image
												src={member.image}
												alt={member.name}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
												className="object-cover transition-transform duration-500 group-hover:scale-110"
												priority={index === 0}
											/>
											<div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-100"></div>
											<motion.div
												className="absolute bottom-0 left-0 right-0 p-4 text-white transition-all duration-300 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
												initial={false}
											>
												<p className="text-sm font-medium">{member.role}</p>
											</motion.div>
										</div>
										<CardContent className="p-6 text-center">
											<h3 className="text-xl font-bold">{member.name}</h3>
											<p className="text-sm text-muted-foreground">{member.role}</p>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</AnimatePresence>
					</div>

					<div className="flex justify-center pt-8">
						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="inline-block"
						>
							<Button variant="outline" size="lg" className="group" asChild>
								<a
									href="https://github.com/yourusername/blackjack"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center space-x-2"
								>
									<Github className="w-5 h-5" />
									<span>View on GitHub</span>
									<ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
								</a>
							</Button>
						</motion.div>
					</div>
				</motion.section>

				{/* Game Statistics */}
				<motion.section
					variants={itemVariants}
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					className="space-y-8"
				>
					<div className="space-y-4 text-center">
						<h2 className="text-3xl font-bold md:text-4xl">Game Parameters</h2>
						<p className="max-w-3xl mx-auto text-lg text-muted-foreground">
							Our blackjack implementation follows standard Vegas rules for an authentic experience
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						<motion.div
							whileHover={{ scale: 1.05 }}
							transition={{ type: 'spring', stiffness: 300, damping: 10 }}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							custom={0}
						>
							<Card className="overflow-hidden border bg-card/50 backdrop-blur-sm border-primary/10">
								<div className="absolute top-0 right-0 w-16 h-16 -mt-8 -mr-8 rounded-bl-full bg-primary/10"></div>
								<CardHeader>
									<CardTitle className="text-lg">House Edge</CardTitle>
									<CardDescription>With perfect basic strategy</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-primary">{gameRules.houseEdge}</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							whileHover={{ scale: 1.05 }}
							transition={{ type: 'spring', stiffness: 300, damping: 10 }}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							custom={1}
						>
							<Card className="overflow-hidden border bg-card/50 backdrop-blur-sm border-primary/10">
								<div className="absolute top-0 right-0 w-16 h-16 -mt-8 -mr-8 rounded-bl-full bg-primary/10"></div>
								<CardHeader className="space-y-1">
									<CardTitle className="text-lg">Number of Decks</CardTitle>
									<CardDescription>Vegas standard</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-primary">{gameRules.deckCount}</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							whileHover={{ scale: 1.05 }}
							transition={{ type: 'spring', stiffness: 300, damping: 10 }}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							custom={2}
						>
							<Card className="overflow-hidden border bg-card/50 backdrop-blur-sm border-primary/10">
								<div className="absolute top-0 right-0 w-16 h-16 -mt-8 -mr-8 rounded-bl-full bg-primary/10"></div>
								<CardHeader>
									<CardTitle className="text-lg">Blackjack Pays</CardTitle>
									<CardDescription>Standard payout ratio</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-primary">{gameRules.blackjackPays}</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							whileHover={{ scale: 1.05 }}
							transition={{ type: 'spring', stiffness: 300, damping: 10 }}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							custom={3}
						>
							<Card className="overflow-hidden border bg-card/50 backdrop-blur-sm border-primary/10">
								<div className="absolute top-0 right-0 w-16 h-16 -mt-8 -mr-8 rounded-bl-full bg-primary/10"></div>
								<CardHeader>
									<CardTitle className="text-lg">Dealer Rules</CardTitle>
									<CardDescription>Standard casino rules</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-primary">{gameRules.dealerRules}</p>
								</CardContent>
							</Card>
						</motion.div>
					</div>
				</motion.section>

				{/* Call to Action */}
				<motion.section
					variants={itemVariants}
					className="py-16 space-y-8 text-center"
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true, margin: "-100px" }}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ type: 'spring', delay: 0.2 }}
						className="max-w-3xl mx-auto"
					>
						<h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to Test Your Strategy?</h2>
						<p className="mb-8 text-xl text-muted-foreground">
							Join thousands of players who are perfecting their blackjack skills with our platform
						</p>
						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<Button size="lg" className="px-8 py-6 text-lg font-medium">
								Play Now
							</Button>
						</motion.div>
					</motion.div>
				</motion.section>
			</div>
		</motion.div>
	)
}
