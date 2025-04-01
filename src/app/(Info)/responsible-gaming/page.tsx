// app/responsible-gaming/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import Link from 'next/link'
import {
	Shield,
	Clock,
	Ban,
	HeartHandshake,
	Phone,
	AlertCircle,
	ExternalLink,
	ChevronRight,
	Settings,
	LifeBuoy,
	Calendar,
	Sparkles,
	Brain,
	ArrowUpRight,
	BarChart3,
	Fingerprint,
	Lock,
	LineChart,
} from 'lucide-react'
import {
	Card,
	CardHeader,
	CardContent,
	CardTitle,
	CardDescription,
	CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/layout/button'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card'

// Enhanced Animation variants
const pageVariants = {
	initial: { opacity: 0 },
	animate: {
		opacity: 1,
		transition: {
			duration: 0.8,
			staggerChildren: 0.14,
			delayChildren: 0.12,
			ease: [0.25, 0.1, 0.25, 1.0],
		},
	},
	exit: {
		opacity: 0,
		transition: {
			duration: 0.6,
			ease: [0.25, 0.1, 0.25, 1.0],
		}
	}
}

const cardVariants = {
	initial: { opacity: 0, y: 30, scale: 0.96 },
	animate: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { type: 'spring', stiffness: 100, damping: 15 },
	},
	hover: {
		scale: 1.03,
		boxShadow: '0 15px 40px -20px rgba(0, 0, 0, 0.25)',
		borderColor: 'rgba(var(--primary-rgb), 0.6)',
		y: -5,
	},
	tap: {
		scale: 0.98,
		boxShadow: '0 5px 15px -8px rgba(0, 0, 0, 0.3)',
		borderColor: 'rgba(var(--primary-rgb), 0.8)',
	}
}

const staggeredItemVariants = {
	initial: { opacity: 0, y: 30 },
	animate: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: {
			delay: i * 0.12,
			duration: 0.6,
			ease: [0.215, 0.61, 0.355, 1.0],
		},
	}),
	hover: {
		y: -8,
		transition: {
			duration: 0.3,
			ease: [0.25, 0.1, 0.25, 1.0],
		}
	},
	tap: {
		y: -2,
		transition: {
			duration: 0.15,
			ease: [0.25, 0.1, 0.25, 1.0],
		}
	}
}

const glowVariants = {
	initial: { opacity: 0.2 },
	animate: {
		opacity: [0.2, 0.5, 0.2],
		scale: [1, 1.05, 1],
		transition: {
			duration: 5,
			repeat: Infinity,
			ease: 'easeInOut',
			repeatType: "mirror" as const,
		},
	},
}

const textRevealVariants = {
	initial: { y: 30, opacity: 0 },
	animate: {
		y: 0,
		opacity: 1,
		transition: {
			duration: 0.8,
			ease: [0.215, 0.61, 0.355, 1.0]
		}
	},
	exit: {
		y: -20,
		opacity: 0,
		transition: {
			duration: 0.6,
			ease: [0.215, 0.61, 0.355, 1.0]
		}
	}
}

const floatVariants = {
	initial: { y: 0 },
	animate: {
		y: [0, -10, 0],
		transition: {
			duration: 6,
			repeat: Infinity,
			ease: "easeInOut",
		}
	}
}

const shimmerVariants = {
	initial: { backgroundPosition: "0 0" },
	animate: {
		backgroundPosition: ["0 0", "100% 0", "100% 0"],
		transition: {
			duration: 2.5,
			repeat: Infinity,
			ease: "linear"
		}
	}
}

// Enhanced Component data
const guidelines = [
	{
		icon: Clock,
		title: 'Temporal Sovereignty',
		description:
			'Establish quantified session parameters to maintain refined chronological boundaries for optimal leisure equilibrium.',
		color: 'text-amber-500',
		bgColor: 'bg-amber-500/10',
		stat: '78% of elite players who implement temporal frameworks report enhanced experiential satisfaction',
		iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
		borderColor: 'border-amber-500/20',
		accentColor: 'amber',
		recommendation: 'Schedule 45-minute sessions with 15-minute intermissions',
	},
	{
		icon: Ban,
		title: 'Strategic Cessation',
		description:
			'Exercise supreme self-governance by preemptively determining exit thresholds. True sophistication lies in graceful withdrawal.',
		color: 'text-rose-500',
		bgColor: 'bg-rose-500/10',
		stat: 'Disciplined cessation protocols reduce suboptimal patterns by 63% among distinguished clientele',
		iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
		borderColor: 'border-rose-500/20',
		accentColor: 'rose',
		recommendation: 'Establish non-negotiable loss thresholds at 15% of allocated capital',
	},
	{
		icon: Shield,
		title: 'Cognitive Calibration',
		description:
			'Conceptualize gaming as a cultivated diversion of intellect, never as an asset acquisition or financial recalibration mechanism.',
		color: 'text-emerald-500',
		bgColor: 'bg-emerald-500/10',
		stat: '92% of virtuoso players maintain gaming as purely experiential rather than fiscal',
		iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
		borderColor: 'border-emerald-500/20',
		accentColor: 'emerald',
		recommendation: 'Allocate entertainment funds exclusively, separate from essential assets',
	},
	{
		icon: HeartHandshake,
		title: 'Consilium Sapientiae',
		description:
			'Exercise preeminent judgment by soliciting expert counsel when gaming influences social, psychological, or financial equilibrium.',
		color: 'text-sky-500',
		bgColor: 'bg-sky-500/10',
		stat: 'Preemptive consultation enhances positive resolution by 84% among discerning participants',
		iconBg: 'bg-gradient-to-br from-sky-400 to-sky-600',
		borderColor: 'border-sky-500/20',
		accentColor: 'sky',
		recommendation: 'Engage with our elite concierge before patterns of concern emerge',
	},
]

const selfAssessment = [
	{
		id: 'question-1',
		question:
			'Do you engage in gaming as a respite from quotidian challenges or to alleviate psychological disquietude?',
		risk: 'high',
		recommendation: 'Consider diversifying your leisure portfolio with complementary activities',
		insightTag: 'Escapism Indicator'
	},
	{
		id: 'question-2',
		question: 'Have prior attempts to modulate or suspend your gaming engagements proven unsuccessful?',
		risk: 'high',
		recommendation: 'Implement our proprietary self-restriction protocols with tiered reintroduction',
		insightTag: 'Control Assessment'
	},
	{
		id: 'question-3',
		question:
			'Do temporal and fiscal allocations to gaming consistently exceed your predetermined parameters?',
		risk: 'medium',
		recommendation: 'Utilize our advanced threshold notification system with biometric verification',
		insightTag: 'Boundary Analysis'
	},
	{
		id: 'question-4',
		question:
			'Have you explored unconventional fiscal arrangements or liquidated appreciable assets to facilitate gaming?',
		risk: 'high',
		recommendation: 'Consult with our financial comportment specialists for portfolio rebalancing',
		insightTag: 'Financial Behavior'
	},
	{
		id: 'question-5',
		question:
			'Has your participation in gaming activities created disharmony in interpersonal or professional spheres?',
		risk: 'high',
		recommendation: 'Engage with our relationship equilibrium counselors for harmonic restoration',
		insightTag: 'Social Harmony'
	},
	{
		id: 'question-6',
		question:
			'Do you find yourself preoccupied with strategic gaming considerations during unrelated activities?',
		risk: 'medium',
		recommendation: 'Explore our cognitive compartmentalization techniques for mental clarity',
		insightTag: 'Thought Pattern'
	},
	{
		id: 'question-7',
		question:
			'Have you experienced physiological manifestations of tension when attempting to reduce gaming frequency?',
		risk: 'high',
		recommendation: 'Utilize our proprietary neuro-relaxation protocols to alleviate transition stress',
		insightTag: 'Physiological Response'
	},
]

const resources = [
	{
		title: 'Gamblers Anonymous',
		url: 'https://www.gamblersanonymous.org',
		description:
			'Premier 24/7 support community for those affected by gaming concerns. Access confidential meetings, comprehensive resources, and sophisticated recovery protocols.',
		phone: '1-800-522-4700',
		availabilityHours: '24/7',
		responseTime: 'Immediate',
		resourceType: 'Support Network',
		specialFeatures: ['Virtual Reality Meetings', 'Anonymous Blockchain Verification', 'AI-Guided Recovery Paths'],
		testimonial: {
			quote: "Their proprietary cognitive recalibration protocol transformed my relationship with gaming within weeks.",
			author: "Distinguished Member, 2023"
		}
	},
	{
		title: 'National Problem Gambling Helpline',
		url: 'https://www.ncpgambling.org',
		description:
			'Discreet consultation services offering personalized referrals and expert guidance for individuals and families seeking balanced gaming practices.',
		phone: '1-800-522-4700',
		availabilityHours: '24/7',
		responseTime: 'Immediate',
		resourceType: 'Elite Hotline',
		specialFeatures: ['Encrypted Voice Communication', 'Biometric Stress Analysis', 'Custom Intervention Design'],
		testimonial: {
			quote: "The algorithmic intervention design was tailored precisely to my neural response patterns.",
			author: "Executive Client, 2023"
		}
	},
	{
		title: 'GamCare',
		url: 'https://www.gamcare.org.uk',
		description:
			'Complimentary professional support, bespoke counseling, and tailored treatment for gaming concerns. Offering exclusive tools, curated resources and expert guidance.',
		phone: '0808-802-0133',
		availabilityHours: '24/7',
		responseTime: 'Within 24 hours',
		resourceType: 'Bespoke Counseling',
		specialFeatures: ['Cognitive Behavioral Recalibration', 'Neural Pattern Recognition', 'Immersive Therapy Environments'],
		testimonial: {
			quote: "Their quantum-informed behavioral modification techniques produced measurable results after just three sessions.",
			author: "International Client, 2023"
		}
	},
	{
		title: 'Responsible Gaming Foundation',
		url: 'https://www.rgf.org',
		description:
			'Avant-garde research institute dedicated to developing cutting-edge methodologies for gaming moderation and cognitive balance enhancement.',
		phone: '1-866-890-7865',
		availabilityHours: '8am-10pm',
		responseTime: 'Same Day',
		resourceType: 'Research Institute',
		specialFeatures: ['Neuro-Adaptive Protocols', 'Personalized AI Coaching', 'Quantum Psychology Applications'],
		testimonial: {
			quote: "Their proprietary balance optimization algorithm restructured my approach to leisure activities entirely.",
			author: "Distinguished Patron, 2023"
		}
	},
]

const responsibleTools = [
	{
		title: 'Quantum Threshold Calibration',
		description: 'Establish multi-variable parameters with real-time adaptation based on behavioral analysis',
		icon: LineChart,
		action: '/account/limits',
		features: ['AI-driven adjustment suggestions', 'Temporal variance allowances', 'Biometric verification'],
		status: 'Premium Feature',
		popularityScore: 94
	},
	{
		title: 'Chronometric Oversight Protocol',
		description: 'Receive elegantly designed notifications with cognitive pattern interruption',
		icon: Clock,
		action: '/account/notifications',
		features: ['Variable frequency algorithms', 'Attention-optimized design', 'Neural engagement verification'],
		status: 'Enhanced',
		popularityScore: 87
	},
	{
		title: 'Strategic Disengagement Suite',
		description: 'Orchestrate sophisticated temporary or permanent cessation with reintegration pathways',
		icon: Ban,
		action: '/account/self-exclusion',
		features: ['Graduated reintroduction options', 'Multi-platform synchronization', 'Legal compliance verification'],
		status: 'Standard',
		popularityScore: 91
	},
	{
		title: 'Cognitive Calibration System',
		description: 'Configure intelligent reality verification prompts with psychological optimization',
		icon: Brain,
		action: '/account/reality-check',
		features: ['Adaptive interruption timing', 'Cognitive bias counterbalances', 'Engagement pattern analysis'],
		status: 'Premium Feature',
		popularityScore: 82
	},
	{
		title: 'Behavioral Analytics Dashboard',
		description: 'Access sophisticated visualization of your gaming patterns with predictive insights',
		icon: BarChart3,
		action: '/account/analytics',
		features: ['Trend identification algorithms', 'Comparative benchmarking', 'Personalized recommendation engine'],
		status: 'Enhanced',
		popularityScore: 88
	},
	{
		title: 'Biometric Authentication Gateway',
		description: 'Implement advanced identity verification to prevent unauthorized account access',
		icon: Fingerprint,
		action: '/account/security',
		features: ['Facial recognition', 'Behavioral pattern authentication', 'Geographic verification'],
		status: 'Premium Feature',
		popularityScore: 95
	},
]

export default function ResponsibleGamingPage() {
	// Enhanced Local state
	const [activeTab, setActiveTab] = useState<string>('questionnaire')
	const [progressValue, setProgressValue] = useState<number>(0)
	const [showConfetti, setShowConfetti] = useState<boolean>(false)
	const [answerState, setAnswerState] = useState<Record<string, string>>({})
	const [userProfile, setUserProfile] = useState<{
		riskScore: number;
		recommendationLevel: 'minimal' | 'moderate' | 'substantial';
		insightMetrics: Record<string, number>;
		personaType: string;
	}>({
		riskScore: 45,
		recommendationLevel: 'moderate',
		insightMetrics: {
			discipline: 72,
			awareness: 84,
			control: 68,
			balance: 76
		},
		personaType: 'Discerning Enthusiast'
	})
	const [animationEnabled] = useState<boolean>(true)

	// Animation hooks
	const { scrollYProgress } = useScroll()
	const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
	const sectionScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

	// Refs for intersection observers
	const heroRef = useRef<HTMLDivElement>(null)

	// Effects
	useEffect(() => {
		if (activeTab === 'questionnaire') {
			// Simulate progress increase based on answers
			const answeredQuestions = Object.keys(answerState).length
			const totalQuestions = selfAssessment.length
			const newProgress = Math.round((answeredQuestions / totalQuestions) * 100)
			setProgressValue(newProgress)
		} else {
			// Ensure progress is shown as complete when viewing results
			setProgressValue(100)
		}
	}, [activeTab, answerState])

	useEffect(() => {
		// Initialize confetti library if needed (in production)
		const initConfetti = async () => {
			// This would load a confetti library in production
		}

		initConfetti()

		// Set up smooth scroll behavior
		document.documentElement.style.scrollBehavior = 'smooth'

		return () => {
			document.documentElement.style.scrollBehavior = 'auto'
		}
	}, [])

	useMotionValueEvent(scrollYProgress, "change", () => {
		// Update any scroll-based state here if needed
	})

	// Enhanced Event handlers
	const handleToolClick = (tool: string) => {
		console.log(`Engaging with tool: ${tool}`)
		setShowConfetti(true)
		setTimeout(() => setShowConfetti(false), 3000)
	}

	const handleQuestionAnswer = (questionId: string, answer: string) => {
		setAnswerState(prev => ({
			...prev,
			[questionId]: answer
		}))

		// In a real implementation, this would calculate risk in real-time
		if (answer === 'yes') {
			// Increase risk score for "yes" answers to risk-associated questions
			const question = selfAssessment.find(q => q.id === questionId)
			if (question?.risk === 'high') {
				setUserProfile(prev => ({
					...prev,
					riskScore: Math.min(prev.riskScore + 10, 100)
				}))
			} else if (question?.risk === 'medium') {
				setUserProfile(prev => ({
					...prev,
					riskScore: Math.min(prev.riskScore + 5, 100)
				}))
			}
		}
	}

	// Helper functions for risk class determination
	const getRiskBgClass = (risk: string): string => {
		if (risk === 'high') return 'bg-red-500/20'
		if (risk === 'medium') return 'bg-amber-500/20'
		return 'bg-green-500/20'
	}

	const getRiskDotClass = (risk: string): string => {
		if (risk === 'high') return 'bg-red-500'
		if (risk === 'medium') return 'bg-amber-500'
		return 'bg-green-500'
	}

	const getRiskColorClass = (score: number): string => {
		if (score > 70) return 'bg-red-500'
		if (score > 40) return 'bg-amber-500'
		return 'bg-emerald-500'
	}

	const getMetricColorClass = (value: number): string => {
		if (value > 80) return 'bg-emerald-500'
		if (value > 60) return 'bg-amber-500'
		return 'bg-red-500'
	}

	const getRecommendationText = (level: string): string => {
		if (level === 'minimal') return 'Minimal Attention'
		if (level === 'moderate') return 'Intermediate Consideration'
		return 'Substantial Vigilance'
	}

	const getRecommendationItems = (level: string) => {
		if (level === 'minimal') {
			return (
				<>
					<p>• Maintain your current distinguished approach to gaming</p>
					<p>• Consider optional session reminders for extended play</p>
					<p>• Continue your exemplary self-governance practices</p>
				</>
			)
		} else if (level === 'moderate') {
			return (
				<>
					<p>• Consider implementing more refined deposit parameters</p>
					<p>• Establish sophisticated session duration notifications</p>
					<p>• Regularly review your gaming chronicle for patterns</p>
				</>
			)
		} else {
			return (
				<>
					<p>• Implement strict temporal and financial boundaries</p>
					<p>• Consider our premium cognitive recalibration protocol</p>
					<p>• Schedule a confidential consultation with our advisors</p>
				</>
			)
		}
	}

	return (
		<motion.div
			initial="initial"
			animate="animate"
			exit="exit"
			variants={pageVariants}
			className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background/95 to-background/90"
		>
			{/* Enhanced Abstract Background Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<motion.div
					className="absolute top-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-primary/5 blur-[150px]"
					variants={glowVariants}
				/>
				<motion.div
					className="absolute bottom-[25%] left-[-15%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[130px]"
					variants={glowVariants}
					custom={1}
				/>
				<motion.div
					className="absolute top-[35%] left-[20%] w-[30%] h-[30%] rounded-full bg-sky-900/5 blur-[100px]"
					variants={glowVariants}
					custom={2}
				/>
				<motion.div
					className="absolute bottom-[10%] right-[15%] w-[25%] h-[25%] rounded-full bg-emerald-500/5 blur-[80px]"
					variants={glowVariants}
					custom={3}
				/>

				{/* Animated grid pattern */}
				<div className="absolute inset-0 z-0 opacity-[0.02]">
					<div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-repeat"></div>
				</div>

				{/* Floating particles */}
				{animationEnabled && (
					<>
						<motion.div
							className="absolute w-2 h-2 rounded-full bg-primary/30"
							variants={floatVariants}
							style={{ top: '20%', left: '10%' }}
						/>
						<motion.div
							className="absolute w-3 h-3 rounded-full bg-amber-500/30"
							variants={floatVariants}
							style={{ top: '30%', right: '15%' }}
							custom={1}
						/>
						<motion.div
							className="absolute w-2 h-2 rounded-full bg-emerald-500/30"
							variants={floatVariants}
							style={{ bottom: '25%', left: '20%' }}
							custom={2}
						/>
						<motion.div
							className="absolute w-1.5 h-1.5 rounded-full bg-sky-500/30"
							variants={floatVariants}
							style={{ bottom: '40%', right: '25%' }}
							custom={3}
						/>
					</>
				)}
			</div>

			{/* Enhanced Hero Section with Parallax Effect */}
			<section ref={heroRef} className="relative pb-20 overflow-hidden pt-28">
				<motion.div
					className="absolute inset-0 z-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background/80"
					style={{ opacity: backgroundOpacity }}
				/>
				<div className="absolute inset-0 bg-[url('/images/pattern-casino.svg')] opacity-[0.04] z-0" />

				{/* Futuristic grid overlay */}
				<div className="absolute inset-0 z-0">
					<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50"></div>
					<div className="absolute inset-0 backdrop-blur-[2px]"></div>
				</div>

				<div className="container relative z-10 px-4 mx-auto">
					<motion.div
						variants={cardVariants}
						className="max-w-3xl mx-auto text-center"
						style={{ scale: sectionScale }}
					>
						<motion.div
							className="flex items-center justify-center mb-12"
							variants={textRevealVariants}
						>
							<Badge
								variant="secondary"
								className="relative overflow-hidden px-5 py-1.5 font-serif text-lg font-bold text-yellow-500 border-2 border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm"
							>
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent"
									variants={shimmerVariants}
									style={{ backgroundSize: "200% 100%" }}
								/>
								<Sparkles className="w-4 h-4 mr-1.5" />
								ROYAL BLACKJACK PRESTIGE
							</Badge>
						</motion.div>

						<motion.h1
							className="mb-6 text-5xl text-transparent font-display md:text-6xl bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary/70"
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.8, ease: [0.215, 0.61, 0.355, 1.0] }}
						>
							<span className="block font-light">The Art of</span>
							<span className="font-bold">Distinguished Play</span>
						</motion.h1>

						<motion.p
							className="max-w-2xl mx-auto mb-10 text-xl leading-relaxed text-muted-foreground"
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.8, ease: [0.215, 0.61, 0.355, 1.0] }}
						>
							We&apos;re devoted to cultivating an environment where sophistication meets
							responsibility. Your discerning experience remains our paramount priority at Royal Blackjack Casino.
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.6, duration: 0.8, ease: [0.215, 0.61, 0.355, 1.0] }}
							className="flex flex-wrap justify-center gap-4"
						>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											size="lg"
											className="gap-2 px-8 font-medium rounded-full shadow-xl py-7 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
											onClick={() => document.getElementById('assessment-section')?.scrollIntoView()}
										>
											Begin Personal Assessment
											<ArrowUpRight className="w-4 h-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom" className="p-3 text-sm bg-card/80 backdrop-blur-md">
										<p>Complete our sophisticated assessment to receive tailored insights</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<HoverCard>
								<HoverCardTrigger asChild>
									<Button
										size="lg"
										variant="outline"
										className="gap-2 px-8 font-medium border-2 rounded-full py-7 border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20 backdrop-blur-sm text-sky-500"
									>
										<LifeBuoy className="w-5 h-5" />
										Access Support Concierge
									</Button>
								</HoverCardTrigger>
								<HoverCardContent className="p-0 w-80 border-primary/10 bg-card/80 backdrop-blur-md">
									<div className="p-4 space-y-2">
										<h4 className="text-sm font-semibold">Elite Support Services</h4>
										<p className="text-xs text-muted-foreground">
											Our concierge team offers discreet, personalized guidance with quantum-informed protocols.
										</p>
									</div>
									<div className="p-3 border-t bg-muted/30 border-primary/5">
										<div className="flex items-center gap-2 text-xs">
											<Badge variant="secondary" className="text-[10px]">AVAILABLE 24/7</Badge>
											<Badge variant="outline" className="text-[10px]">PRIVATE CHANNEL</Badge>
										</div>
									</div>
								</HoverCardContent>
							</HoverCard>
						</motion.div>

						{/* Feature Highlights */}
						<motion.div
							className="grid grid-cols-2 gap-4 mt-16 md:grid-cols-4"
							variants={{
								initial: { opacity: 0, y: 20 },
								animate: {
									opacity: 1,
									y: 0,
									transition: {
										delay: 0.8,
										staggerChildren: 0.1,
										delayChildren: 0.8
									}
								}
							}}
						>
							{[
								{ icon: Brain, text: "Neural-Adaptive Protocols" },
								{ icon: LineChart, text: "Quantum Threshold Engine" },
								{ icon: Fingerprint, text: "Biometric Authentication" },
								{ icon: Lock, text: "Advanced Encryption" }
							].map((feature, i) => (
								<motion.div
									key={feature.text}
									className="flex flex-col items-center justify-center p-3 border rounded-lg border-primary/10 bg-card/20 backdrop-blur-sm"
									variants={staggeredItemVariants}
									custom={i}
								>
									<feature.icon className="w-5 h-5 mb-2 text-primary/70" />
									<p className="text-xs font-medium text-center text-muted-foreground">{feature.text}</p>
								</motion.div>
							))}
						</motion.div>
					</motion.div>
				</div>

				{/* Scroll indicator */}
				<motion.div
					className="absolute flex flex-col items-center transform -translate-x-1/2 bottom-8 left-1/2"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1.5, duration: 1 }}
				>
					<span className="mb-2 text-xs text-muted-foreground">Scroll to Explore</span>
					<motion.div
						className="flex justify-center w-6 h-10 pt-2 border-2 rounded-full border-primary/30"
						animate={{
							boxShadow: ["0 0 0 0 rgba(var(--primary-rgb), 0.1)", "0 0 0 4px rgba(var(--primary-rgb), 0)", "0 0 0 0 rgba(var(--primary-rgb), 0.1)"]
						}}
						transition={{ duration: 2, repeat: Infinity }}
					>
						<motion.div
							className="w-1 h-1.5 rounded-full bg-primary"
							animate={{ y: [0, 12, 0] }}
							transition={{ duration: 2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
						/>
					</motion.div>
				</motion.div>
			</section>

			{/* Stats Banner */}
			<motion.section
				className="py-6 bg-card/30 backdrop-blur-sm border-y border-primary/5"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.8, duration: 0.8 }}
			>
				<div className="container px-4 mx-auto">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0 md:divide-x divide-primary/10">
						<div className="flex flex-col items-center justify-center p-4 text-center">
							<span className="mb-1 text-3xl font-bold text-yellow-500 text-primary">87%</span>
							<span className="font-sans text-lg text-muted-foreground">
								of our distinguished patrons utilize our bespoke gaming protocols
							</span>
						</div>
						<div className="flex flex-col items-center justify-center p-4 text-center">
							<span className="mb-1 text-3xl font-bold text-yellow-500 text-primary">24/7</span>
							<span className="font-sans text-lg text-muted-foreground">
								exclusive concierge support for clientele seeking assistance
							</span>
						</div>
						<div className="flex flex-col items-center justify-center p-4 text-center">
							<span className="mb-1 text-3xl font-bold text-yellow-500 text-primary">15+</span>
							<span className="font-serif text-lg text-muted-foreground">
								curated management instruments at your disposal
							</span>
						</div>
					</div>
				</div>
			</motion.section>

			{/* Guidelines Grid with Interactive Cards */}
			<section className="relative py-20">
				<div className="container px-4 mx-auto">
					<motion.div variants={cardVariants} className="mb-12 text-center">
						<h2 className="mb-3 font-serif text-3xl font-semibold text-yellow-500">
							Principles of Discerning Play
						</h2>
						<p className="max-w-2xl mx-auto text-muted-foreground">
							Embrace these refined tenets to ensure your gaming experience remains an exquisite
							form of leisure
						</p>
					</motion.div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						{guidelines.map((guideline, index) => (
							<motion.div
								key={guideline.title}
								custom={index}
								variants={staggeredItemVariants}
								whileHover="hover"
								className="h-full"
							>
								<Card className="h-full overflow-hidden transition-all duration-300 border bg-card/50 backdrop-blur-sm border-primary/10">
									<CardHeader>
										<div className="flex items-center space-x-4">
											<div className={`p-3 rounded-lg ${guideline.bgColor} ${guideline.color}`}>
												<guideline.icon className="w-6 h-6" />
											</div>
											<CardTitle className="text-lg">{guideline.title}</CardTitle>
										</div>
									</CardHeader>
									<CardContent>
										<CardDescription className="mb-4">{guideline.description}</CardDescription>
										<div className="pt-2 mt-2 border-t border-primary/5">
											<p className="text-xs font-medium text-muted-foreground">
												CONNOISSEUR INSIGHT
											</p>
											<p className="mt-1 text-sm">{guideline.stat}</p>
										</div>
									</CardContent>
									<div className="absolute bottom-0 left-0 w-full h-1.5 bg-muted">
										<motion.div
											className={`h-full ${guideline.color}`}
											initial={{ width: '0%' }}
											whileInView={{ width: '100%' }}
											transition={{ duration: 1.5, delay: index * 0.2 }}
											viewport={{ once: true }}
										/>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Self-Assessment Tool Section */}
			<section className="py-16 bg-muted/30">
				<div className="container px-4 mx-auto">
					<motion.div variants={cardVariants} className="max-w-4xl mx-auto">
						<Card className="overflow-hidden bg-card/60 backdrop-blur-md border-primary/10">
							<CardHeader className="pb-2">
								<Badge variant="outline" className="mb-2 w-fit">
									Exclusive Assessment
								</Badge>
								<CardTitle className="text-2xl font-bold">Personalized Gaming Profile</CardTitle>
								<CardDescription>
									Evaluate your gaming patterns with our confidential, bespoke assessment instrument
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Tabs
									defaultValue="questionnaire"
									value={activeTab}
									onValueChange={setActiveTab}
									className="w-full"
								>
									<TabsList className="grid w-full grid-cols-2 mb-6 border-2 shadow-xl border-sky-500">
										<TabsTrigger value="questionnaire">Consultation</TabsTrigger>
										<TabsTrigger value="results">Insights & Recommendations</TabsTrigger>
									</TabsList>

									<TabsContent value="questionnaire" className="space-y-4">
										<div className="p-4 mb-6 rounded-md bg-primary/5">
											<div className="flex items-center justify-between mb-2">
												<span className="font-medium text-red-500 text-md">
													Assessment Progression
												</span>
												<span className="font-medium text-red-500 text-md">{progressValue}%</span>
											</div>
											<Progress value={progressValue} className="h-2" />
										</div>

										<div className="space-y-4">
											{selfAssessment.map(item => (
												<div
													key={item.id}
													className="p-4 transition-all border rounded-lg border-primary/10 bg-card hover:border-primary/30"
												>
													<div className="flex items-start gap-4">
														<div
															className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${getRiskBgClass(item.risk)} flex items-center justify-center`}
														>
															<div
																className={`w-2.5 h-2.5 rounded-full ${getRiskDotClass(item.risk)}`}
															/>
														</div>
														<div className="flex-1">
															<p className="mb-3 text-base font-medium">{item.question}</p>
															<div className="flex items-center space-x-6">
																<div className="flex items-center">
																	<input
																		id={`${item.id}-yes`}
																		type="radio"
																		name={item.id}
																		className="w-4 h-4 text-primary border-muted-foreground focus:ring-primary"
																		onChange={(e) => handleQuestionAnswer(item.id, e.target.value)}
																	/>
																	<label
																		htmlFor={`${item.id}-yes`}
																		className="ml-2 text-sm font-medium"
																	>
																		Indeed
																	</label>
																</div>
																<div className="flex items-center">
																	<input
																		id={`${item.id}-no`}
																		type="radio"
																		name={item.id}
																		className="w-4 h-4 text-primary border-muted-foreground focus:ring-primary"
																		onChange={(e) => handleQuestionAnswer(item.id, e.target.value)}
																	/>
																	<label
																		htmlFor={`${item.id}-no`}
																		className="ml-2 text-sm font-medium"
																	>
																		Not at all
																	</label>
																</div>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>

										<div className="flex justify-end pt-4">
											<Button onClick={() => setActiveTab('results')} className="gap-2">
												Review Personalized Insights
												<ChevronRight className="w-4 h-4" />
											</Button>
										</div>
									</TabsContent>

									<TabsContent value="results">
										<div className="p-6 mb-6 border rounded-lg border-primary/10 bg-card">
											<div className="flex items-center justify-between mb-3">
												<h3 className="text-lg font-medium">Your Bespoke Analysis</h3>
												<Badge variant="outline" className="px-2 py-1">
													{userProfile.personaType}
												</Badge>
											</div>
											<p className="mb-4 text-muted-foreground">
												Based on your thoughtful responses, here&apos;s a curated assessment of your
												gaming inclinations:
											</p>
											<div className="flex items-center gap-3 mb-3">
												<div className="w-full h-3 overflow-hidden rounded-full bg-muted">
													<div
														className={`h-full rounded-full ${getRiskColorClass(userProfile.riskScore)}`}
														style={{ width: `${userProfile.riskScore}%` }}
													/>
												</div>
												<span className="text-sm font-medium whitespace-nowrap">
													{getRecommendationText(userProfile.recommendationLevel)}
												</span>
											</div>

											<div className="grid grid-cols-2 gap-4 p-4 mb-4 border rounded-lg border-primary/10">
												<h4 className="col-span-2 text-sm font-medium">Cognitive Balance Profile</h4>
												{Object.entries(userProfile.insightMetrics).map(([key, value]) => (
													<div key={key} className="space-y-1">
														<div className="flex items-center justify-between">
															<span className="text-xs capitalize text-muted-foreground">{key}</span>
															<span className="text-xs font-medium">{value}%</span>
														</div>
														<div className="w-full h-1.5 rounded-full bg-muted/50">
															<div
																className={`h-full rounded-full ${getMetricColorClass(value)}`}
																style={{ width: `${value}%` }}
															/>
														</div>
													</div>
												))}
											</div>

											<h4 className="mb-2 text-sm font-medium">Personalized Recommendations</h4>
											<div className="space-y-3 text-sm">
												{getRecommendationItems(userProfile.recommendationLevel)}
											</div>
										</div>

										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											<Button variant="outline" className="flex flex-col items-start h-auto p-4">
												<div className="flex w-full">
													<Calendar className="w-5 h-5 mr-2" />
													<span className="font-medium">Arrange a Private Consultation</span>
												</div>
												<p className="mt-1 text-xs text-left text-muted-foreground">
													Engage with a distinguished gaming advisor
												</p>
											</Button>
											<Button variant="outline" className="flex flex-col items-start h-auto p-4">
												<div className="flex w-full">
													<Settings className="w-5 h-5 mr-2" />
													<span className="font-medium">Calibrate Your Experience Parameters</span>
												</div>
												<p className="mt-1 text-xs text-left text-muted-foreground">
													Tailor deposit, wager and temporal boundaries
												</p>
											</Button>
										</div>
									</TabsContent>
								</Tabs>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* Responsible Gaming Tools */}
			<section className="py-16">
				<div className="container px-4 mx-auto">
					<motion.div variants={cardVariants} className="mb-12 text-center">
						<h2 className="mb-3 font-serif text-3xl font-bold text-yellow-500">
							Experience Management Suite
						</h2>
						<p className="max-w-2xl mx-auto text-muted-foreground">
							Bespoke instruments designed to maintain sovereignty over your curated gaming journey
						</p>
					</motion.div>

					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{responsibleTools.map((tool, index) => (
							<motion.div
								key={tool.title}
								custom={index}
								variants={staggeredItemVariants}
								whileHover={{ y: -5 }}
								className="h-full"
							>
								<Card
									className="h-full cursor-pointer bg-gradient-to-b from-card to-card/50 border-primary/10 group"
									onClick={() => handleToolClick(tool.action)}
								>
									<CardHeader>
										<div className="flex items-center justify-center w-12 h-12 p-3 mb-2 transition-colors duration-200 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white">
											<tool.icon className="w-6 h-6" />
										</div>
										<CardTitle className="text-lg transition-colors duration-200 group-hover:text-primary">
											{tool.title}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription>{tool.description}</CardDescription>
									</CardContent>
									<CardFooter>
										<Button
											variant="ghost"
											size="sm"
											className="justify-between w-full transition-colors duration-200 group-hover:bg-primary/10"
										>
											<span>Personalize</span>
											<ChevronRight className="w-4 h-4" />
										</Button>
									</CardFooter>
								</Card>
							</motion.div>
						))}
					</div>

					{/* Confetti animation when a tool is clicked */}
					<AnimatePresence>
						{showConfetti && (
							<motion.div
								className="fixed inset-0 z-50 pointer-events-none"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
							>
								{/* This would be implemented with a confetti library in production */}
								<div className="absolute inset-0 flex items-center justify-center">
									<span className="text-2xl">🎉</span>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</section>

			{/* Resources Section with Enhanced Accordion */}
			<section className="py-16 bg-muted/30">
				<div className="container px-4 mx-auto">
					<motion.div variants={cardVariants} className="max-w-4xl mx-auto">
						<Card className="bg-card/60 backdrop-blur-md border-primary/10">
							<CardHeader>
								<CardTitle className="text-2xl font-bold">Curated Assistance Network</CardTitle>
								<CardDescription>
									Distinguished professional guidance and concierge services available at your
									convenience
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Accordion type="single" collapsible className="w-full">
									{resources.map(resource => (
										<AccordionItem
											key={resource.title}
											value={`item-${resource.title}`}
											className="py-2 border-b border-primary/10 last:border-0"
										>
											<AccordionTrigger className="text-left hover:no-underline">
												<div className="flex items-center space-x-2">
													<span className="font-medium">{resource.title}</span>
													<Badge variant="outline" className="ml-2 text-xs">
														{resource.availabilityHours}
													</Badge>
													<Badge variant="secondary" className="hidden text-xs sm:inline-flex">
														{resource.resourceType}
													</Badge>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<div className="pt-2 space-y-4">
													<p className="text-muted-foreground">{resource.description}</p>

													<div className="grid grid-cols-2 gap-2 mb-4 text-sm">
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">Response Protocol:</span>
															<span className="font-medium">{resource.responseTime}</span>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-muted-foreground">Assistance Category:</span>
															<span className="font-medium">{resource.resourceType}</span>
														</div>
													</div>

													<Separator className="my-3" />

													<div className="flex flex-col gap-4 sm:flex-row">
														<Button variant="outline" className="flex items-center gap-2" asChild>
															<a href={`tel:${resource.phone}`}>
																<Phone className="w-4 h-4" />
																{resource.phone}
															</a>
														</Button>
														<Button variant="outline" className="flex items-center gap-2" asChild>
															<a href={resource.url} target="_blank" rel="noopener noreferrer">
																<ExternalLink className="w-4 h-4" />
																Visit Digital Portal
															</a>
														</Button>
													</div>
												</div>
											</AccordionContent>
										</AccordionItem>
									))}
								</Accordion>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* CTA Section with Enhanced Design */}
			<section className="relative py-20 overflow-hidden">
				<div className="absolute inset-0 z-0 bg-gradient-to-r from-primary/5 to-primary/10" />
				<div className="absolute inset-0 bg-[url('/images/pattern-casino.svg')] opacity-[0.03] z-0" />

				<div className="container relative z-10 px-4 mx-auto">
					<motion.div
						variants={cardVariants}
						className="max-w-3xl p-8 mx-auto text-center border shadow-xl bg-card/50 backdrop-blur-md rounded-2xl border-primary/10"
					>
						<div className="inline-flex items-center justify-center p-3 mb-8 rounded-full bg-warning/10 text-warning">
							<AlertCircle className="w-6 h-6" />
						</div>
						<h2 className="mb-4 text-3xl font-bold">Contemplating a Refined Pause?</h2>
						<p className="max-w-xl mx-auto mb-8 text-muted-foreground">
							We offer sophisticated instruments to orchestrate your gaming journey. Establish
							boundaries, arrange intervals, or designate exclusion periods with elegance.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Link href="/game-settings">
											<Button size="lg" className="gap-2 px-6 rounded-full">
												Orchestrate Experience Parameters
												<ChevronRight className="w-4 h-4" />
											</Button>
										</Link>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										<p>Define deposit, wager and temporal parameters</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<Link href="/support">
								<Button size="lg" variant="outline" className="gap-2 px-6 rounded-full">
									<LifeBuoy className="w-4 h-4" />
									Engage Personal Concierge
								</Button>
							</Link>
						</div>

						<div className="pt-6 mt-8 border-t border-primary/10">
							<p className="text-sm text-muted-foreground">
								House Edge Casino is devoted to cultivating distinguished gaming practices. Engage
								discerningly and recognize your boundaries.
							</p>
						</div>
					</motion.div>
				</div>
			</section>
		</motion.div>
	)
}
