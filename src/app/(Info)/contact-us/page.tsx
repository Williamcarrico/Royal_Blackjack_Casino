/** @jsxImportSource react */
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, type Variants, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
	MapPin,
	Phone,
	Mail,
	Clock,
	Send,
	CheckCircle,
	Facebook,
	Twitter,
	Instagram,
	Linkedin,
	MessageSquare,
	Globe,
	ArrowRight,
	Users,
	Sparkles,
	HelpCircle,
	Zap,
	Lock,
	Shield,
	Star,
	Cpu,
	Headphones,
	RefreshCw,
	LifeBuoy,
	Smartphone
} from 'lucide-react'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/layout/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter,
} from '@/components/ui/card'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from '@/components/ui/tabs'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils/utils'

// Enhanced animation variants
const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
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
		scale: 1,
		boxShadow: '0 0 0 rgba(255, 191, 0, 0)'
	},
	hover: {
		scale: 1.02,
		boxShadow: '0 0 20px rgba(255, 191, 0, 0.15)'
	}
}

const marqueeVariants: Variants = {
	animate: {
		x: [0, -1000],
		transition: {
			x: {
				repeat: Infinity,
				repeatType: "loop",
				duration: 20,
				ease: "linear",
			},
		},
	},
}

const floatVariants: Variants = {
	initial: { y: 0 },
	animate: {
		y: [-8, 8, -8],
		transition: {
			duration: 6,
			repeat: Infinity,
			ease: "easeInOut"
		}
	}
}

const rotateVariants: Variants = {
	initial: { rotate: 0 },
	animate: {
		rotate: 360,
		transition: {
			duration: 20,
			repeat: Infinity,
			ease: "linear"
		}
	}
}

const pulseVariants: Variants = {
	initial: { scale: 1, opacity: 0.7 },
	animate: {
		scale: [1, 1.05, 1],
		opacity: [0.7, 1, 0.7],
		transition: {
			duration: 2,
			repeat: Infinity,
			ease: "easeInOut"
		}
	}
}

// Interactive 3D card effect
const useTilt = (active: boolean) => {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!ref.current || !active) return

		const handleMouseMove = (event: MouseEvent) => {
			const el = ref.current
			if (!el) return

			const rect = el.getBoundingClientRect()
			const x = event.clientX - rect.left
			const y = event.clientY - rect.top

			const xPercent = x / rect.width - 0.5
			const yPercent = y / rect.height - 0.5

			const rotateX = yPercent * 10 // Max 10 degrees
			const rotateY = xPercent * -10 // Max 10 degrees

			el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
		}

		const handleMouseLeave = () => {
			if (ref.current) {
				ref.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`
			}
		}

		const element = ref.current
		element.addEventListener('mousemove', handleMouseMove)
		element.addEventListener('mouseleave', handleMouseLeave)

		return () => {
			element.removeEventListener('mousemove', handleMouseMove)
			element.removeEventListener('mouseleave', handleMouseLeave)
		}
	}, [active, ref])

	return ref
}

// Form validation schema
const formSchema = z.object({
	name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
	email: z.string().email({ message: 'Please enter a valid email address' }),
	phone: z.string().optional(),
	subject: z.string().min(5, { message: 'Subject must be at least 5 characters' }),
	message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
	preferredContact: z.enum(['email', 'phone']).default('email'),
	reason: z.enum(['general', 'support', 'business', 'feedback']).default('general'),
	priority: z.enum(['low', 'medium', 'high']).default('medium'),
	newsletter: z.boolean().default(false),
	copyCEO: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

// Business information
const businessInfo = {
	name: 'Royal Edge Casino Blackjack',
	address: '123 Casino Ave, Gulf Breeze, FL 32561',
	phone: '(850) 555-1234',
	email: 'support@dmscasinogaming.com',
	ceo_email: 'ceo@dmscasinogaming.com',
	hours: [
		{ days: 'Monday - Thursday', time: '12:00 PM - 12:00 AM' },
		{ days: 'Friday - Saturday', time: '10:00 AM - 2:00 AM' },
		{ days: 'Sunday', time: '12:00 PM - 10:00 PM' },
	],
	socialMedia: [
		{
			name: 'Facebook',
			icon: <Facebook className="w-5 h-5" />,
			url: 'https://facebook.com/dmscasinogaming',
		},
		{
			name: 'Twitter',
			icon: <Twitter className="w-5 h-5" />,
			url: 'https://twitter.com/dmscasinogaming',
		},
		{
			name: 'Instagram',
			icon: <Instagram className="w-5 h-5" />,
			url: 'https://instagram.com/dmscasinogaming',
		},
		{
			name: 'LinkedIn',
			icon: <Linkedin className="w-5 h-5" />,
			url: 'https://linkedin.com/company/dmscasinogaming',
		},
	],
	staff: [
		{
			name: 'David Smith',
			position: 'CEO',
			email: 'ceo@dmscasinogaming.com',
			avatar: 'https://randomuser.me/api/portraits/men/45.jpg'
		},
		{
			name: 'Alexis Morgan',
			position: 'Customer Relations Manager',
			email: 'alexis@dmscasinogaming.com',
			avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
		},
		{
			name: 'James Wilson',
			position: 'VIP Services Coordinator',
			email: 'james@dmscasinogaming.com',
			avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
		},
		{
			name: 'Sarah Chen',
			position: 'Technical Support Lead',
			email: 'sarah@dmscasinogaming.com',
			avatar: 'https://randomuser.me/api/portraits/women/63.jpg'
		}
	],
	features: [
		{
			title: 'Secure Gameplay',
			description: 'End-to-end encryption and advanced security protocols',
			icon: <Shield className="w-5 h-5" />
		},
		{
			title: 'AI-Enhanced Experience',
			description: 'Smart gaming assistance and personalized recommendations',
			icon: <Cpu className="w-5 h-5" />
		},
		{
			title: '24/7 Support',
			description: 'Round-the-clock assistance through multiple channels',
			icon: <Headphones className="w-5 h-5" />
		},
		{
			title: 'Premium Features',
			description: 'VIP benefits and exclusive gaming opportunities',
			icon: <Star className="w-5 h-5" />
		},
	]
}

// Contact reasons with descriptions
const contactReasons = [
	{
		id: 'general',
		name: 'General Inquiry',
		description: 'Questions about our services or establishment',
		icon: <MessageSquare className="w-5 h-5" />
	},
	{
		id: 'support',
		name: 'Technical Support',
		description: 'Help with our website or mobile app',
		icon: <HelpCircle className="w-5 h-5" />
	},
	{
		id: 'business',
		name: 'Business Partnership',
		description: 'Collaboration or partnership opportunities',
		icon: <Users className="w-5 h-5" />
	},
	{
		id: 'feedback',
		name: 'Feedback & Suggestions',
		description: 'Share your experience or ideas with us',
		icon: <Sparkles className="w-5 h-5" />
	}
]

// Enhanced FAQ items
const faqItems = [
	{
		question: 'What are your operating hours?',
		answer:
			'Our virtual blackjack platform is available 24/7 for online play. Our physical location is open Monday through Thursday from 12 PM to 12 AM, Friday and Saturday from 10 AM to 2 AM, and Sunday from 12 PM to 10 PM.',
		icon: <Clock className="w-5 h-5 text-primary" />
	},
	{
		question: 'Do you offer blackjack strategy assistance?',
		answer:
			'Yes, we offer personalized blackjack strategy assistance through our AI-powered coaching system. For more advanced players, we also provide one-on-one sessions with our expert dealers.',
		icon: <Zap className="w-5 h-5 text-primary" />
	},
	{
		question: 'How secure is your platform?',
		answer: 'Our platform employs bank-level encryption and security protocols. We use advanced fraud detection systems and regular security audits to ensure the integrity of all games and player data.',
		icon: <Lock className="w-5 h-5 text-primary" />
	},
	{
		question: 'What payment methods do you accept?',
		answer:
			'We accept all major credit cards, digital wallets (PayPal, Apple Pay, Google Pay), and cryptocurrency transactions (Bitcoin, Ethereum, and selected altcoins).',
		icon: <Globe className="w-5 h-5 text-primary" />
	},
	{
		question: 'Do you have a mobile app?',
		answer:
			'Yes, our mobile app is available for both iOS and Android devices, offering all features of the web platform with additional mobile-exclusive benefits and optimized gameplay.',
		icon: <Smartphone className="w-5 h-5 text-primary" />
	},
	{
		question: 'How do I report technical issues?',
		answer:
			'You can report technical issues through our 24/7 live chat, dedicated support email, or by using the in-app/website feedback tool that automatically captures system information to help us resolve your issue faster.',
		icon: <RefreshCw className="w-5 h-5 text-primary" />
	},
]

// Live chat simulation messages
const chatMessages = [
	{
		id: 1,
		message: "Welcome to Royal Edge Casino! I'm Nova, your AI assistant. How may I help you today?",
		sender: "ai",
		timestamp: "Just now"
	},
	{
		id: 2,
		message: "I'd like to know more about your advanced blackjack features.",
		sender: "user",
		timestamp: "Just now"
	},
	{
		id: 3,
		message: "Our advanced blackjack platform features real-time strategy assistance, multi-angle table views, and adaptive card counting detection. Would you like details on specific features or our premium membership tiers?",
		sender: "ai",
		timestamp: "Just now"
	}
]

// Create particles with different properties for enhanced visual effect
const particles = Array.from({ length: 30 }, (_, i) => {
	let color = "bg-primary"; // Default color
	if (i % 5 === 0) {
		color = "bg-amber-400";
	} else if (i % 3 === 0) {
		color = "bg-amber-300";
	}

	return {
		id: `particle-${Math.random().toString(36).slice(2, 11)}`,
		size: Math.random() * 2 + 1,
		speed: Math.random() * 15 + 10,
		opacity: Math.random() * 0.4 + 0.2,
		color
	};
});

// Marquee text with emphasized keywords
const marqueeItems = Array.from({ length: 8 }, () => ({
	id: `marquee-${Math.random().toString(36).slice(2, 11)}`,
	text: "ADVANCED BLACKJACK • PREMIUM EXPERIENCE • EXPERT AI • SECURE PLATFORM • VIP REWARDS • "
}));

// Features showcase
const showcaseFeatures = [
	{
		title: "Advanced AI Analysis",
		description: "Get real-time gameplay insights and personalized recommendations.",
		icon: <Cpu />,
		color: "from-blue-500 to-cyan-400"
	},
	{
		title: "Secure Environment",
		description: "Best-in-class encryption and secure payment processing.",
		icon: <Shield />,
		color: "from-amber-500 to-yellow-400"
	},
	{
		title: "24/7 Support",
		description: "Access multi-channel assistance whenever you need it.",
		icon: <LifeBuoy />,
		color: "from-green-500 to-emerald-400"
	}
];

export default function ContactUs() {
	const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
	const [, setActiveTab] = useState('contact')
	const [chatInput, setChatInput] = useState('')
	const [enableTilt, setEnableTilt] = useState(true)
	const [showAIAssistant, setShowAIAssistant] = useState(false)
	const [useDarkMode, setUseDarkMode] = useState(true)
	const [activeFaq, setActiveFaq] = useState<string>('')

	// Refs for interactive elements
	const cardRef = useTilt(enableTilt)
	const formContainerRef = useRef<HTMLDivElement>(null)
	const heroRef = useRef<HTMLDivElement>(null)

	// Scroll animations
	const { scrollYProgress } = useScroll({
		target: heroRef,
		offset: ["start start", "end start"]
	})

	const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
	const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

	// Form handling
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			subject: '',
			message: '',
			preferredContact: 'email',
			reason: 'general',
			priority: 'medium',
			newsletter: false,
			copyCEO: false,
		},
	})

	const onSubmit = async (data: FormValues) => {
		setFormStatus('submitting')

		// Simulate API call
		try {
			// In a real application, you would send the form data to your backend
			await new Promise(resolve => setTimeout(resolve, 1500))
			console.log('Form submitted:', data)

			// Log if a copy should be sent to the CEO
			if (data.copyCEO) {
				console.log('Sending a copy to the CEO:', businessInfo.ceo_email)
				// In a real implementation, you would add the CEO's email address to the recipients list
			}

			setFormStatus('success')
			form.reset()
		} catch (error) {
			console.error('Error submitting form:', error)
			setFormStatus('error')
		}
	}

	// Chat functionality
	const handleSendChat = (e: React.FormEvent) => {
		e.preventDefault()
		if (!chatInput.trim()) return

		// In a real application, you would send this to your chat backend
		console.log('Chat message sent:', chatInput)
		setChatInput('')
	}

	// AI Assistant toggle
	const toggleAIAssistant = useCallback(() => {
		setShowAIAssistant(prev => !prev)
	}, [])

	// Change to use empty string instead of null to fix type error
	const handleFaqChange = (value: string) => {
		setActiveFaq(value === activeFaq ? '' : value);
	};

	return (
		<motion.div
			className={cn(
				"min-h-screen pb-16 bg-gradient-to-b transition-colors duration-300",
				useDarkMode
					? "from-background to-background/80"
					: "from-gray-50 to-gray-100 text-gray-900"
			)}
			initial="hidden"
			animate="visible"
			variants={containerVariants}
		>
			{/* AI Assistant Toggle Button - Fixed Position */}
			<motion.button
				className={cn(
					"fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg",
					"bg-gradient-to-r from-amber-500 to-amber-600 text-black",
					"flex items-center justify-center"
				)}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={toggleAIAssistant}
				aria-label="Toggle AI Assistant"
			>
				<Cpu className="w-6 h-6" />
			</motion.button>

			{/* AI Assistant Drawer */}
			<AnimatePresence>
				{showAIAssistant && (
					<motion.div
						className="fixed inset-0 z-40 flex items-end justify-end p-4 pointer-events-none"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<motion.div
							className="w-full max-w-md p-6 border shadow-xl pointer-events-auto bg-card rounded-2xl border-primary/20"
							initial={{ y: 100, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: 100, opacity: 0 }}
							transition={{ type: "spring", damping: 20, stiffness: 300 }}
						>
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-3">
									<div className="relative">
										<motion.div
											className="absolute inset-0 rounded-full bg-primary/30 blur-md"
											variants={pulseVariants}
											initial="initial"
											animate="animate"
										/>
										<Avatar className="relative border-2 border-primary">
											<AvatarImage src="/images/ai-assistant.png" alt="AI Assistant" />
											<AvatarFallback className="bg-primary/20">AI</AvatarFallback>
										</Avatar>
									</div>
									<div>
										<h3 className="font-semibold">Nova AI Assistant</h3>
										<p className="text-xs text-muted-foreground">Powered by advanced analytics</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={toggleAIAssistant}
									className="hover:bg-primary/10"
								>
									<span className="sr-only">Close</span>
									×
								</Button>
							</div>

							<div className="h-64 p-3 mb-4 overflow-y-auto border rounded-lg border-primary/10 bg-black/10">
								<div className="space-y-4">
									{chatMessages.map((msg) => (
										<div
											key={msg.id}
											className={cn(
												"flex",
												msg.sender === "user" ? "justify-end" : "justify-start"
											)}
										>
											<div className={cn(
												"max-w-[80%] px-4 py-2 rounded-2xl break-words",
												msg.sender === "user"
													? "bg-primary/20 rounded-br-none"
													: "bg-card/80 rounded-bl-none border border-primary/10"
											)}>
												<p className="text-sm">{msg.message}</p>
												<p className="mt-1 text-xs text-muted-foreground">{msg.timestamp}</p>
											</div>
										</div>
									))}
								</div>
							</div>

							<form onSubmit={handleSendChat} className="flex gap-2">
								<Input
									value={chatInput}
									onChange={(e) => setChatInput(e.target.value)}
									placeholder="Ask Nova anything..."
									className="flex-1 border-primary/20 focus-visible:ring-primary/30 bg-card/50"
								/>
								<Button
									type="submit"
									className="text-black shadow-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
								>
									<Send className="w-4 h-4" />
								</Button>
							</form>

							<div className="flex justify-between pt-2 mt-4 text-xs border-t border-primary/10 text-muted-foreground">
								<p>AI-enhanced support</p>
								<div className="flex items-center space-x-1">
									<span>Dark Mode</span>
									<Switch
										checked={useDarkMode}
										onCheckedChange={setUseDarkMode}
										className="data-[state=checked]:bg-primary"
									/>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Floating particles effect */}
			<div className="fixed inset-0 pointer-events-none">
				{particles.map((particle) => (
					<motion.div
						key={particle.id}
						className={cn(
							"absolute rounded-full",
							particle.color,
							`w-${Math.ceil(particle.size)} h-${Math.ceil(particle.size)}`
						)}
						initial={{
							x: Math.random() * 100 + "%",
							y: Math.random() * 100 + "%",
							opacity: particle.opacity
						}}
						animate={{
							y: ["-10%", "110%"],
							opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity]
						}}
						transition={{
							duration: particle.speed,
							repeat: Infinity,
							ease: "linear"
						}}
					/>
				))}
			</div>

			<div className="relative px-4 mx-auto space-y-12 max-w-7xl lg:space-y-20">
				{/* Hero Section with enhanced design */}
				<motion.section
					ref={heroRef}
					variants={itemVariants}
					className="relative pt-20 space-y-6 text-center md:pt-28"
					style={{ opacity: heroOpacity, scale: heroScale }}
				>
					<motion.div
						className="absolute inset-x-0 pointer-events-none -top-20"
						variants={glowVariants}
						initial="initial"
						animate="animate"
					>
						<div className="absolute inset-0 opacity-70 bg-gradient-radial from-primary/20 to-transparent blur-3xl" />
					</motion.div>

					<motion.div
						className="relative inline-block"
						variants={floatVariants}
						initial="initial"
						animate="animate"
					>
						<Badge className="absolute -right-10 -top-5 py-1.5 font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-500 border-amber-600/20">Premium Support</Badge>
						<h1 className="text-5xl font-bold text-transparent md:text-7xl bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-primary/60">
							Connect With Us
						</h1>
					</motion.div>

					<div className="relative">
						<p className="max-w-3xl mx-auto text-xl text-muted-foreground md:text-2xl">
							Experience premium support and assistance from the Royal Edge Casino team.
						</p>

						{/* Animated indicator line */}
						<motion.div
							className="w-24 h-1 mx-auto mt-8 bg-gradient-to-r from-transparent via-primary to-transparent"
							animate={{ width: ["0%", "100%", "0%"], x: ["-50%", "0%", "50%"] }}
							transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
						/>
					</div>

					{/* Feature highlights */}
					<motion.div
						className="grid max-w-4xl grid-cols-1 gap-6 mx-auto mt-10 md:grid-cols-3"
						variants={itemVariants}
					>
						{showcaseFeatures.map((feature, index) => (
							<motion.div
								key={feature.title}
								className="relative overflow-hidden rounded-xl"
								whileHover={{ y: -5 }}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 + 0.3 }}
							>
								<div className="absolute inset-0 border opacity-70 bg-gradient-to-br border-primary/10" />
								<div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${feature.color}`} />
								<div className="relative p-6 text-center">
									<motion.div
										className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-primary/10"
										whileHover={{ rotate: 10 }}
									>
										{feature.icon}
									</motion.div>
									<h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
									<p className="text-sm text-muted-foreground">{feature.description}</p>
								</div>
							</motion.div>
						))}
					</motion.div>

					{/* Marquee text for visual appeal */}
					<div className="relative w-full py-3 mt-8 overflow-hidden">
						<motion.div
							className="inline-flex gap-4 text-sm font-medium whitespace-nowrap text-primary/30"
							variants={marqueeVariants}
							animate="animate"
						>
							{marqueeItems.map((item) => (
								<span key={item.id} dangerouslySetInnerHTML={{ __html: item.text.replace(/•/g, '<span class="text-primary/60">•</span>') }} />
							))}
						</motion.div>
					</div>
				</motion.section>

				{/* Interactive Communication Tabs */}
				<motion.div variants={itemVariants} className="w-full max-w-5xl mx-auto">
					<Tabs defaultValue="contact" className="w-full" onValueChange={setActiveTab}>
						<TabsList className="grid w-full h-auto grid-cols-3 p-1">
							<TabsTrigger value="contact" className="py-3">
								<MessageSquare className="w-4 h-4 mr-2" />
								Contact Form
							</TabsTrigger>
							<TabsTrigger value="live-chat" className="py-3">
								<span className="relative flex w-3 h-3 mr-2">
									<span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
									<span className="relative inline-flex w-3 h-3 bg-green-500 rounded-full"></span>
								</span>
								Live Chat
							</TabsTrigger>
							<TabsTrigger value="team" className="py-3">
								<Users className="w-4 h-4 mr-2" />
								Our Team
							</TabsTrigger>
						</TabsList>

						{/* Contact Form Tab Content */}
						<TabsContent value="contact" className="mt-6">
							<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
								{/* Enhanced Contact Form */}
								<motion.div
									ref={formContainerRef}
									variants={itemVariants}
									className="lg:col-span-2"
									onMouseEnter={() => setEnableTilt(false)}
									onMouseLeave={() => setEnableTilt(true)}
								>
									<Card
										ref={cardRef}
										className={cn(
											'backdrop-blur-sm border transition-all duration-300',
											'bg-card/50 border-primary/10 hover:border-primary/30',
											'dark:bg-card/30 dark:border-primary/20 dark:hover:border-primary/40',
											'shadow-lg hover:shadow-primary/5 overflow-hidden'
										)}
									>
										<div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-primary to-amber-600 opacity-80"></div>

										<CardHeader>
											<CardTitle className="text-2xl text-transparent md:text-3xl bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">
												Send Us a Message
											</CardTitle>
											<CardDescription className="text-lg">
												We&apos;re excited to hear from you. Complete the form below and our team will respond promptly.
											</CardDescription>
										</CardHeader>
										<CardContent>
											{formStatus === 'success' ? (
												<motion.div
													initial={{ opacity: 0, y: 10 }}
													animate={{ opacity: 1, y: 0 }}
													className="flex flex-col items-center justify-center p-6 text-center"
												>
													<motion.div
														initial={{ scale: 0 }}
														animate={{ scale: 1 }}
														transition={{ type: "spring", stiffness: 200, damping: 10 }}
													>
														<CheckCircle className="w-16 h-16 mb-4 text-green-500" />
													</motion.div>
													<h3 className="mb-2 text-xl font-semibold">Message Received!</h3>
													<p className="mb-6 text-muted-foreground">
														Thank you for reaching out. A member of our team will be in touch within 24 hours.
													</p>
													<Button
														variant="outline"
														onClick={() => setFormStatus('idle')}
														className="border-primary/20 hover:border-primary/40"
													>
														Send Another Message
													</Button>
												</motion.div>
											) : (
												<Form {...form}>
													<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
														{/* Contact reason selector with icons */}
														<div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
															{contactReasons.map((reason) => {
																// Validate reason.id is a valid value
																const isValid = ['general', 'support', 'business', 'feedback'].includes(reason.id);
																const reasonId = isValid ? reason.id : 'general';

																return (
																	<button
																		key={reason.id}
																		type="button"
																		className={cn(
																			"w-full text-left border rounded-lg p-3 cursor-pointer transition-all",
																			form.watch('reason') === reasonId
																				? "border-primary/40 bg-primary/5"
																				: "border-border hover:border-primary/20"
																		)}
																		onClick={() => {
																			if (isValid) {
																				// Use a type-safe approach by validating the value first
																				const validReason = reasonId as 'general' | 'support' | 'business' | 'feedback';
																				form.setValue('reason', validReason);
																			}
																		}}
																	>
																		<div className="flex">
																			<div className="p-2 mr-3 rounded-full bg-primary/10">
																				{reason.icon}
																			</div>
																			<div>
																				<div className="font-medium">{reason.name}</div>
																				<div className="text-sm text-muted-foreground">{reason.description}</div>
																			</div>
																		</div>
																	</button>
																);
															})}
														</div>

														<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
															<FormField
																control={form.control}
																name="name"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Name</FormLabel>
																		<FormControl>
																			<Input
																				placeholder="Your full name"
																				className="border-primary/10 focus:border-primary/30"
																				{...field}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name="email"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Email</FormLabel>
																		<FormControl>
																			<Input
																				placeholder="Your email address"
																				className="border-primary/10 focus:border-primary/30"
																				type="email"
																				{...field}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>

														<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
															<FormField
																control={form.control}
																name="phone"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Phone (Optional)</FormLabel>
																		<FormControl>
																			<Input
																				placeholder="Your phone number"
																				className="border-primary/10 focus:border-primary/30"
																				type="tel"
																				{...field}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<FormField
																control={form.control}
																name="subject"
																render={({ field }) => (
																	<FormItem>
																		<FormLabel>Subject</FormLabel>
																		<FormControl>
																			<Input
																				placeholder="Message subject"
																				className="border-primary/10 focus:border-primary/30"
																				{...field}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
														</div>

														<FormField
															control={form.control}
															name="message"
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Message</FormLabel>
																	<FormControl>
																		<Textarea
																			placeholder="How can we help you? Please provide details about your inquiry..."
																			className="min-h-[150px] border-primary/10 focus:border-primary/30"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														{/* Additional form options for sophistication */}
														<div className="flex flex-wrap gap-6 pt-2 border-t border-primary/10">
															<FormField
																control={form.control}
																name="priority"
																render={({ field }) => (
																	<FormItem className="space-y-1">
																		<FormLabel>Priority</FormLabel>
																		<div className="flex gap-2">
																			{(['low', 'medium', 'high'] as const).map((priority) => (
																				<button
																					key={priority}
																					type="button"
																					className={cn(
																						"px-3 py-1 text-sm rounded-md border transition-all",
																						field.value === priority
																							? "bg-primary/20 border-primary/40 text-foreground"
																							: "bg-transparent border-border text-muted-foreground hover:border-primary/20"
																					)}
																					onClick={() => field.onChange(priority)}
																				>
																					{priority.charAt(0).toUpperCase() + priority.slice(1)}
																				</button>
																			))}
																		</div>
																	</FormItem>
																)}
															/>

															<FormField
																control={form.control}
																name="preferredContact"
																render={({ field }) => (
																	<FormItem className="space-y-1">
																		<FormLabel>Preferred Contact Method</FormLabel>
																		<div className="flex gap-2">
																			{(['email', 'phone'] as const).map((method) => (
																				<button
																					key={method}
																					type="button"
																					className={cn(
																						"px-3 py-1 text-sm rounded-md border transition-all",
																						field.value === method
																							? "bg-primary/20 border-primary/40 text-foreground"
																							: "bg-transparent border-border text-muted-foreground hover:border-primary/20"
																					)}
																					onClick={() => field.onChange(method)}
																				>
																					{method.charAt(0).toUpperCase() + method.slice(1)}
																				</button>
																			))}
																		</div>
																	</FormItem>
																)}
															/>

															<FormField
																control={form.control}
																name="newsletter"
																render={({ field }) => (
																	<FormItem className="flex flex-row items-start mt-4 space-x-3 space-y-0">
																		<FormControl>
																			<Switch
																				checked={field.value}
																				onCheckedChange={field.onChange}
																				className="data-[state=checked]:bg-primary"
																			/>
																		</FormControl>
																		<div className="space-y-1 leading-none">
																			<FormLabel>Subscribe to Newsletter</FormLabel>
																			<p className="text-xs text-muted-foreground">
																				Receive updates about promotions and new features
																			</p>
																		</div>
																	</FormItem>
																)}
															/>

															<FormField
																control={form.control}
																name="copyCEO"
																render={({ field }) => (
																	<FormItem className="flex flex-row items-start mt-4 space-x-3 space-y-0">
																		<FormControl>
																			<Switch
																				checked={field.value}
																				onCheckedChange={field.onChange}
																				className="data-[state=checked]:bg-primary"
																			/>
																		</FormControl>
																		<div className="space-y-1 leading-none">
																			<FormLabel>Send Copy to CEO</FormLabel>
																			<p className="text-xs text-muted-foreground">
																				Also send a copy to our CEO ({businessInfo.ceo_email})
																			</p>
																		</div>
																	</FormItem>
																)}
															/>
														</div>

														<Button
															type="submit"
															className="w-full text-black transition-all duration-300 shadow-md bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 hover:shadow-lg"
															disabled={formStatus === 'submitting'}
														>
															{formStatus === 'submitting' ? (
																<span className="flex items-center">
																	<svg
																		className="w-5 h-5 mr-2 animate-spin"
																		xmlns="http://www.w3.org/2000/svg"
																		fill="none"
																		viewBox="0 0 24 24"
																	>
																		<circle
																			className="opacity-25"
																			cx="12"
																			cy="12"
																			r="10"
																			stroke="currentColor"
																			strokeWidth="4"
																		></circle>
																		<path
																			className="opacity-75"
																			fill="currentColor"
																			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																		></path>
																	</svg>
																	Sending Message...
																</span>
															) : (
																<span className="flex items-center">
																	<Send className="w-5 h-5 mr-2" />
																	Send Message
																</span>
															)}
														</Button>
													</form>
												</Form>
											)}
										</CardContent>
									</Card>
								</motion.div>

								{/* Contact Information with enhanced design */}
								<motion.div variants={itemVariants} className="space-y-6">
									<motion.div
										initial="initial"
										whileHover="hover"
										variants={cardHoverVariants}
									>
										<Card
											className={cn(
												'backdrop-blur-sm border transition-all duration-300',
												'bg-card/50 border-primary/10',
												'dark:bg-card/30 dark:border-primary/20',
												'shadow-lg overflow-hidden'
											)}
										>
											<div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-amber-600 via-primary to-amber-400 opacity-80"></div>
											<CardHeader>
												<CardTitle className="flex items-center text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">
													<motion.div
														className="mr-2"
														variants={rotateVariants}
														initial="initial"
														animate="animate"
													>
														<div className="p-1 rounded-full bg-primary/20">
															<Globe className="w-5 h-5 text-primary" />
														</div>
													</motion.div>
													Contact Information
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-6">
												<div className="space-y-4">
													<div className="flex items-start space-x-3 group">
														<div className="p-2 transition-colors rounded-full bg-primary/10 group-hover:bg-primary/20">
															<MapPin className="w-5 h-5 text-primary" />
														</div>
														<div>
															<h3 className="font-medium">Address</h3>
															<p className="text-muted-foreground">{businessInfo.address}</p>
														</div>
													</div>
													<div className="flex items-start space-x-3 group">
														<div className="p-2 transition-colors rounded-full bg-primary/10 group-hover:bg-primary/20">
															<Phone className="w-5 h-5 text-primary" />
														</div>
														<div>
															<h3 className="font-medium">Phone</h3>
															<p className="text-muted-foreground">{businessInfo.phone}</p>
														</div>
													</div>
													<div className="flex items-start space-x-3 group">
														<div className="p-2 transition-colors rounded-full bg-primary/10 group-hover:bg-primary/20">
															<Mail className="w-5 h-5 text-primary" />
														</div>
														<div>
															<h3 className="font-medium">Email</h3>
															<p className="text-muted-foreground">{businessInfo.email}</p>
															<p className="mt-1 text-xs text-muted-foreground">
																CEO: <a href={`mailto:${businessInfo.ceo_email}`} className="text-primary hover:underline">{businessInfo.ceo_email}</a>
															</p>
														</div>
													</div>
												</div>

												<div className="pt-4 border-t border-primary/10">
													<div className="flex items-start space-x-3 group">
														<div className="p-2 transition-colors rounded-full bg-primary/10 group-hover:bg-primary/20">
															<Clock className="w-5 h-5 text-primary" />
														</div>
														<div>
															<h3 className="font-medium">Business Hours</h3>
															<div className="mt-2 space-y-2">
																{businessInfo.hours.map(schedule => (
																	<div key={schedule.days} className="flex justify-between text-sm">
																		<span className="text-muted-foreground">{schedule.days}</span>
																		<span>{schedule.time}</span>
																	</div>
																))}
															</div>
														</div>
													</div>
												</div>

												<div className="pt-4 border-t border-primary/10">
													<h3 className="font-medium">Connect With Us</h3>
													<div className="flex mt-3 space-x-4">
														{businessInfo.socialMedia.map(social => (
															<TooltipProvider key={social.name}>
																<Tooltip>
																	<TooltipTrigger asChild>
																		<motion.a
																			href={social.url}
																			target="_blank"
																			rel="noreferrer noopener"
																			className="p-2 transition-colors rounded-full bg-card hover:bg-primary/20"
																			aria-label={`Follow us on ${social.name}`}
																			whileHover={{ scale: 1.1 }}
																			whileTap={{ scale: 0.95 }}
																		>
																			{social.icon}
																		</motion.a>
																	</TooltipTrigger>
																	<TooltipContent>
																		<p>Follow us on {social.name}</p>
																	</TooltipContent>
																</Tooltip>
															</TooltipProvider>
														))}
													</div>
												</div>
											</CardContent>
										</Card>
									</motion.div>

									{/* Map Card with enhanced styling */}
									<motion.div
										initial="initial"
										whileHover="hover"
										variants={cardHoverVariants}
									>
										<Card
											className={cn(
												'overflow-hidden backdrop-blur-sm border transition-all duration-300',
												'bg-card/50 border-primary/10',
												'dark:bg-card/30 dark:border-primary/20',
												'shadow-lg'
											)}
										>
											<div className="relative">
												<div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent to-background/80"></div>
												<iframe
													title="Royal Edge Casino Location"
													src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d108906.10649000479!2d-87.19739535913904!3d30.357925116116235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8890b08d94ef7e6d%3A0x7a77e7eca34177ae!2sGulf%20Breeze%2C%20FL!5e0!3m2!1sen!2sus!4v1719288543397!5m2!1sen!2sus"
													width="100%"
													height="250"
													className="transition-all duration-700 border-0 grayscale hover:grayscale-0"
													allowFullScreen={false}
													referrerPolicy="no-referrer-when-downgrade"
												></iframe>
											</div>
											<CardFooter className="py-3 bg-gradient-to-r from-amber-600/10 to-amber-400/5">
												<div className="flex items-center justify-between w-full">
													<span className="text-sm font-medium">Gulf Breeze, FL</span>
													<a
														href="https://goo.gl/maps/JXpmeRf7CnGzXZ9V7"
														target="_blank"
														rel="noreferrer noopener"
														className="flex items-center text-sm transition-colors hover:text-primary"
													>
														Get Directions
														<ArrowRight className="w-3 h-3 ml-1" />
													</a>
												</div>
											</CardFooter>
										</Card>
									</motion.div>

									{/* Key Features Card */}
									<motion.div
										initial="initial"
										whileHover="hover"
										variants={cardHoverVariants}
									>
										<Card
											className={cn(
												'overflow-hidden backdrop-blur-sm border transition-all duration-300',
												'bg-card/50 border-primary/10',
												'dark:bg-card/30 dark:border-primary/20',
												'shadow-lg'
											)}
										>
											<div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-primary to-amber-400 opacity-80"></div>
											<CardHeader className="pb-2">
												<CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">
													Why Choose Us
												</CardTitle>
											</CardHeader>
											<CardContent>
												<ul className="space-y-2">
													{businessInfo.features.map((feature, index) => (
														<li key={feature.title}>
															<motion.div
																className="flex items-start p-2 space-x-3 transition-colors rounded-lg hover:bg-primary/5"
																initial={{ opacity: 0, x: -10 }}
																animate={{ opacity: 1, x: 0 }}
																transition={{ delay: index * 0.1 }}
															>
																<div className="p-1.5 rounded-full bg-primary/10">
																	{feature.icon}
																</div>
																<div>
																	<p className="font-medium">{feature.title}</p>
																	<p className="text-sm text-muted-foreground">{feature.description}</p>
																</div>
															</motion.div>
														</li>
													))}
												</ul>
											</CardContent>
										</Card>
									</motion.div>
								</motion.div>
							</div>
						</TabsContent>

						{/* Live Chat Tab Content - Enhanced with AI features */}
						<TabsContent value="live-chat" className="mt-6">
							<Card className="overflow-hidden border shadow-lg border-primary/10 dark:border-primary/20 backdrop-blur-sm bg-card/50 dark:bg-card/30">
								<div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-green-400 via-primary to-green-500 opacity-80"></div>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div>
											<CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">
												Live Chat Support
											</CardTitle>
											<CardDescription>
												Chat with our support team in real-time. We&apos;re available 24/7 to assist you.
											</CardDescription>
										</div>
										<div className="flex items-center space-x-2">
											<Badge variant="outline" className="py-1 text-green-400 border-green-500/30 bg-green-500/10">
												Online
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex flex-col mb-4 h-[400px]">
										<div className="relative flex-1 p-6 space-y-4 overflow-y-auto border rounded-lg border-primary/10 bg-black/10">
											{/* AI Assistant indicator */}
											<div className="absolute top-2 right-2">
												<Badge variant="outline" className="px-2 py-1 border-primary/30 bg-primary/10 text-primary/80">
													<Cpu className="w-3 h-3 mr-1" />
													AI Assistant
												</Badge>
											</div>

											{chatMessages.map((msg) => (
												<div
													key={msg.id}
													className={cn(
														"flex",
														msg.sender === "user" ? "justify-end" : "justify-start"
													)}
												>
													{msg.sender === "ai" && (
														<div className="self-end mb-1 mr-2">
															<Avatar className="w-8 h-8 border border-primary/20">
																<AvatarImage src="/images/ai-avatar.png" alt="AI Assistant" />
																<AvatarFallback className="text-xs bg-primary/20">AI</AvatarFallback>
															</Avatar>
														</div>
													)}

													<div className={cn(
														"max-w-[80%] px-4 py-3 rounded-2xl break-words",
														msg.sender === "user"
															? "bg-primary/20 rounded-br-none"
															: "bg-card/80 rounded-bl-none border border-primary/10"
													)}>
														<p className="text-sm">{msg.message}</p>
														<p className="mt-1 text-xs text-muted-foreground">{msg.timestamp}</p>
													</div>

													{msg.sender === "user" && (
														<div className="self-end mb-1 ml-2">
															<Avatar className="w-8 h-8 border border-primary/20">
																<AvatarImage src="/images/user-avatar.png" alt="User" />
																<AvatarFallback className="text-xs bg-primary/20">You</AvatarFallback>
															</Avatar>
														</div>
													)}
												</div>
											))}

											{/* "Typing" indicator */}
											<div className="flex justify-start">
												<div className="flex items-center p-2 space-x-1 border rounded-lg bg-card/80 border-primary/10">
													<motion.div
														className="w-2 h-2 rounded-full bg-primary/60"
														animate={{ opacity: [0.4, 1, 0.4] }}
														transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
													/>
													<motion.div
														className="w-2 h-2 rounded-full bg-primary/60"
														animate={{ opacity: [0.4, 1, 0.4] }}
														transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, times: [0, 0.5, 1] }}
													/>
													<motion.div
														className="w-2 h-2 rounded-full bg-primary/60"
														animate={{ opacity: [0.4, 1, 0.4] }}
														transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, times: [0, 0.5, 1] }}
													/>
													<span className="ml-1 text-xs text-muted-foreground">Nova is typing...</span>
												</div>
											</div>
										</div>
									</div>

									<div className="space-y-4">
										<form onSubmit={handleSendChat} className="flex gap-2">
											<Input
												value={chatInput}
												onChange={(e) => setChatInput(e.target.value)}
												placeholder="Type your message here..."
												className="flex-1 border-primary/10 focus-visible:ring-primary/30 bg-card/50"
											/>
											<Button
												type="submit"
												className="text-black shadow-md bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400"
											>
												<Send className="w-4 h-4" />
											</Button>
										</form>

										{/* Quick response buttons */}
										<div className="flex flex-wrap gap-2">
											{["Tell me about VIP benefits", "I need technical help", "How do I upgrade my account?", "Payment methods"].map((text) => (
												<Button
													key={text}
													variant="outline"
													size="sm"
													className="text-xs border-primary/10 hover:bg-primary/5 hover:border-primary/20"
													onClick={() => setChatInput(text)}
												>
													{text}
												</Button>
											))}
										</div>

										<div className="flex items-center justify-between pt-2 text-xs border-t text-muted-foreground border-primary/10">
											<p>All conversations are encrypted end-to-end</p>
											<p className="flex items-center">
												<Lock className="w-3 h-3 mr-1" />
												Secure Chat
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Team Tab Content - Enhanced with visual effects */}
						<TabsContent value="team" className="mt-6">
							<Card className="overflow-hidden border shadow-lg border-primary/10 dark:border-primary/20 backdrop-blur-sm bg-card/50 dark:bg-card/30">
								<div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-primary to-blue-500 opacity-80"></div>
								<CardHeader>
									<CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">
										Meet Our Team
									</CardTitle>
									<CardDescription>
										Connect with our dedicated specialists who are ready to assist you with any inquiries or support needs.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
										{businessInfo.staff.map((member, index) => (
											<motion.div
												key={member.name}
												variants={itemVariants}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												whileHover={{ y: -5 }}
											>
												<Card className="overflow-hidden transition-all border border-primary/10 hover:border-primary/30">
													<div className="relative p-4 text-center">
														<motion.div
															className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-primary/5 to-transparent opacity-60"
															initial={{ opacity: 0 }}
															whileHover={{ opacity: 1 }}
															transition={{ duration: 0.3 }}
														/>

														<div className="relative">
															<div className="inline-block p-1 mb-4 rounded-full bg-gradient-to-r from-amber-500/20 to-primary/20">
																<Avatar className="w-24 h-24 border-4 border-background">
																	<AvatarImage src={member.avatar} alt={member.name} />
																	<AvatarFallback className="text-xl">{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
																</Avatar>
															</div>
															<h3 className="text-lg font-medium">{member.name}</h3>
															<p className="mb-1 text-sm text-muted-foreground">{member.position}</p>
															<p className="text-xs text-primary/80">{member.email}</p>

															<div className="flex justify-center mt-4">
																<Button
																	variant="outline"
																	size="sm"
																	className="px-4 py-1 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
																	onClick={() => {
																		setActiveTab('contact');
																		setTimeout(() => {
																			// Auto-fill form subject with team member name
																			form.setValue('subject', `Attention: ${member.name}`, { shouldValidate: true });
																			// Scroll to form
																			formContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
																		}, 100);
																	}}
																>
																	Contact {member.name.split(' ')[0]}
																</Button>
															</div>
														</div>
													</div>
												</Card>
											</motion.div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</motion.div>

				{/* Enhanced FAQ Section with interactive elements */}
				<motion.section variants={itemVariants} className="max-w-5xl mx-auto space-y-8">
					<div className="text-center">
						<div className="inline-block mb-4">
							<motion.div
								className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-primary/10"
								animate={{
									boxShadow: ['0 0 0 rgba(255, 191, 0, 0.3)', '0 0 20px rgba(255, 191, 0, 0.6)', '0 0 0 rgba(255, 191, 0, 0.3)']
								}}
								transition={{ duration: 2, repeat: Infinity }}
							>
								<HelpCircle className="w-6 h-6 text-primary" />
							</motion.div>
						</div>
						<motion.h2
							className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
						>
							Frequently Asked Questions
						</motion.h2>
						<motion.p
							className="max-w-3xl mx-auto mt-4 text-lg text-muted-foreground"
							initial={{ opacity: 0 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.2 }}
						>
							Find quick answers to common questions about Royal Edge Casino Blackjack.
						</motion.p>
					</div>

					<Accordion
						type="single"
						collapsible
						className="w-full"
						value={activeFaq}
						onValueChange={handleFaqChange}
					>
						{faqItems.map((item, index) => (
							<motion.div
								key={`faq-item-${item.question}`}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
							>
								<AccordionItem
									value={`item-${index}`}
									className="overflow-hidden border-primary/10 hover:border-primary/20"
								>
									<AccordionTrigger
										className="px-1 py-4 text-left transition-all hover:no-underline group"
									>
										<div className="flex items-center">
											<motion.div
												className="mr-3 p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors"
												animate={activeFaq === `item-${index}` ? { rotate: [0, 10, 0] } : {}}
												transition={{ duration: 0.5 }}
											>
												{item.icon}
											</motion.div>
											<span>{item.question}</span>
										</div>
									</AccordionTrigger>
									<AccordionContent className="text-muted-foreground">
										<motion.div
											className="pl-10"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ duration: 0.3 }}
										>
											{item.answer}
										</motion.div>
									</AccordionContent>
								</AccordionItem>
							</motion.div>
						))}
					</Accordion>

					<motion.div
						className="flex justify-center pt-6"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
					>
						<Card className="max-w-lg p-4 overflow-hidden border shadow-lg border-primary/10 bg-card/50 backdrop-blur-sm">
							<div className="absolute -right-10 -top-10">
								<motion.div
									className="w-20 h-20 rounded-full bg-primary/5"
									variants={pulseVariants}
									initial="initial"
									animate="animate"
								/>
							</div>
							<CardContent className="relative z-10 p-2 text-center">
								<p className="text-muted-foreground">
									Didn&apos;t find what you&apos;re looking for?
									<Button
										variant="link"
										className="text-primary hover:text-primary/80"
										onClick={() => {
											setActiveTab('contact');
											setTimeout(() => {
												// Auto-fill form subject
												form.setValue('subject', 'Additional Question', { shouldValidate: true });
												// Scroll to form
												formContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
											}, 100);
										}}
									>
										Contact us directly
									</Button>
								</p>
							</CardContent>
						</Card>
					</motion.div>
				</motion.section>

				{/* Enhanced Footer Section */}
				<motion.footer
					variants={itemVariants}
					className="relative pt-16 pb-8 mt-20 overflow-hidden border-t border-primary/10"
				>
					{/* Background decorative elements */}
					<div className="absolute inset-0 -z-10 opacity-30">
						<motion.div
							className="absolute w-64 h-64 rounded-full -top-20 -right-20 bg-primary/5"
							variants={floatVariants}
							initial="initial"
							animate="animate"
						/>
						<motion.div
							className="absolute w-40 h-40 rounded-full top-40 -left-10 bg-amber-500/5"
							variants={rotateVariants}
							initial="initial"
							animate="animate"
						/>
						<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
					</div>

					<div className="container px-4 mx-auto text-center">
						<motion.div
							className="inline-block mb-6"
							whileHover={{ y: -5, transition: { duration: 0.2 } }}
						>
							<h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">
								Royal Edge Casino
							</h3>
						</motion.div>

						<p className="max-w-2xl mx-auto mb-8 text-muted-foreground">
							Experience the thrill of premium blackjack gaming with our advanced platform. Connect with us today and elevate your gameplay.
						</p>

						<div className="flex flex-wrap justify-center gap-6 mb-10">
							{businessInfo.socialMedia.map(social => (
								<TooltipProvider key={social.name}>
									<Tooltip>
										<TooltipTrigger asChild>
											<motion.a
												href={social.url}
												target="_blank"
												rel="noreferrer noopener"
												className="p-3 transition-all border rounded-full bg-card hover:bg-primary/20 border-primary/10"
												aria-label={`Follow us on ${social.name}`}
												whileHover={{ scale: 1.1, y: -3 }}
												whileTap={{ scale: 0.95 }}
											>
												{social.icon}
											</motion.a>
										</TooltipTrigger>
										<TooltipContent>
											<p>Follow us on {social.name}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							))}
						</div>

						<div className="flex flex-wrap justify-center mb-8 text-sm gap-x-8 gap-y-2">
							<a
								href="/about"
								className="transition-colors text-muted-foreground hover:text-primary"
							>
								About Us
							</a>
							<a
								href="/privacy-policy"
								className="transition-colors text-muted-foreground hover:text-primary"
							>
								Privacy Policy
							</a>
							<a
								href="/terms-of-service"
								className="transition-colors text-muted-foreground hover:text-primary"
							>
								Terms of Service
							</a>
							<a
								href="/responsible-gaming"
								className="transition-colors text-muted-foreground hover:text-primary"
							>
								Responsible Gaming
							</a>
						</div>

						<div className="text-xs text-muted-foreground/70">
							<p>© {new Date().getFullYear()} Royal Edge Casino. All rights reserved.</p>
							<p className="mt-1">Designed for entertainment purposes only. No real money gambling.</p>
						</div>
					</div>
				</motion.footer>
			</div>
		</motion.div>
	)
}
