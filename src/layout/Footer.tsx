'use client'

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView, AnimatePresence, useAnimation } from 'framer-motion'
import {
	Twitter,
	Instagram,
	Facebook,
	ChevronUp,
	Shield,
	HelpCircle,
	ArrowUpRight,
	ExternalLink,
	AlertCircle,
	Sparkles,
	MessageCircle,
	Diamond,
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import specific icons only when needed
const GiCardAceSpades = dynamic(() => import('react-icons/gi').then(mod => mod.GiCardAceSpades))
const GiCardAceHearts = dynamic(() => import('react-icons/gi').then(mod => mod.GiCardAceHearts))
const GiCardAceDiamonds = dynamic(() => import('react-icons/gi').then(mod => mod.GiCardAceDiamonds))
const GiCardAceClubs = dynamic(() => import('react-icons/gi').then(mod => mod.GiCardAceClubs))
const GiPokerHand = dynamic(() => import('react-icons/gi').then(mod => mod.GiPokerHand))
const GiCrownedSkull = dynamic(() => import('react-icons/gi').then(mod => mod.GiCrownedSkull))
const GiCardRandom = dynamic(() => import('react-icons/gi').then(mod => mod.GiCardRandom))

import { Button } from '@/components/ui/layout/button'
import { cn } from '@/lib/utils/utils'
import { z } from 'zod'

// Define link group type
interface FooterLinkGroup {
	title: string
	icon: React.ReactNode
	links: Array<{
		label: string
		href: string
		isNew?: boolean
		isExternal?: boolean
		icon?: React.ReactNode
	}>
}

// Social media link type
interface SocialLink {
	icon: React.ReactNode
	href: string
	label: string
}

// Email schema validation
const emailSchema = z.string().email('Please enter a valid email address')

// Enhanced animation variants
const fadeInUp = {
	hidden: { opacity: 0, y: 30 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			delay: delay * 0.1,
			ease: [0.22, 1, 0.36, 1],
		},
	}),
}

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
}

const shimmer = {
	hidden: { opacity: 0.4, x: -100 },
	visible: {
		opacity: [0.4, 1, 0.4],
		x: [100, 0, -100],
		transition: {
			repeat: Infinity,
			duration: 3,
			ease: "linear",
		}
	}
}

// Card suit animation for enhanced Vegas theme
const CardSuitAnimation = memo(() => {
	const icons = [
		<GiCardAceSpades key="spades" className="text-white" />,
		<GiCardAceHearts key="hearts" className="text-red-500" />,
		<GiCardAceDiamonds key="diamonds" className="text-red-500" />,
		<GiCardAceClubs key="clubs" className="text-white" />
	]

	return (
		<div className="absolute top-0 bottom-0 left-0 right-0 z-0 overflow-hidden pointer-events-none opacity-5">
			{[...Array(12)].map((_, i) => (
				<motion.div
					key={`card-suit-animation-${i}-${Math.random().toString(36).slice(2, 11)}`}
					className="absolute text-4xl"
					initial={{
						x: Math.random() * 100 - 50 + "%",
						y: -50,
						rotate: Math.random() * 360,
						opacity: 0.3 + Math.random() * 0.7
					}}
					animate={{
						y: ["0%", "100%"],
						rotate: [0, 360],
						opacity: [0.3 + Math.random() * 0.7, 0]
					}}
					transition={{
						duration: 10 + Math.random() * 15,
						repeat: Infinity,
						ease: "linear",
						delay: Math.random() * 10
					}}
				>
					{icons[i % icons.length]}
				</motion.div>
			))}
		</div>
	)
})

CardSuitAnimation.displayName = 'CardSuitAnimation'

// FooterLinkGroup component - memoized for performance
const FooterLinkGroupComponent = memo(
	({ title, icon, links, delay = 0 }: FooterLinkGroup & { delay?: number }) => {
		const ref = useRef<HTMLDivElement>(null)
		const isInView = useInView(ref, { once: true, amount: 0.3 })
		const controls = useAnimation()

		useEffect(() => {
			if (isInView) {
				controls.start('visible')
			}
		}, [isInView, controls])

		return (
			<motion.div
				ref={ref}
				variants={fadeInUp}
				initial="hidden"
				animate={controls}
				custom={delay}
				className="flex flex-col gap-3"
			>
				<div className="flex items-center gap-2 mb-1">
					<div className="text-amber-400">{icon}</div>
					<h3 className="text-sm font-semibold tracking-wider uppercase text-amber-300 font-playfair">
						{title}
					</h3>
				</div>

				<motion.ul
					className="flex flex-col gap-2.5"
					variants={staggerContainer}
					initial="hidden"
					animate={isInView ? 'visible' : 'hidden'}
				>
					{links.map(link => (
						<motion.li
							key={link.label}
							variants={{
								hidden: { opacity: 0, x: -20 },
								visible: {
									opacity: 1,
									x: 0,
									transition: { duration: 0.4 }
								}
							}}
							whileHover={{ x: 5 }}
						>
							<Link
								href={link.href}
								target={link.isExternal ? '_blank' : undefined}
								rel={link.isExternal ? 'noopener noreferrer' : undefined}
								className="flex items-center gap-1.5 text-sm text-gray-300 transition-all duration-300 hover:text-amber-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-sm px-1 py-0.5"
								aria-label={`Go to ${link.label}${link.isExternal ? ' (opens in new tab)' : ''}`}
							>
								{link.icon || <div className="w-1 h-1 transition-all duration-300 rounded-full bg-amber-500/70 group-hover:bg-amber-300 group-hover:scale-125" />}
								<span>{link.label}</span>
								{link.isExternal && (
									<ExternalLink
										size={12}
										className="text-gray-500 group-hover:text-amber-300"
										aria-hidden="true"
									/>
								)}
								{link.isNew && (
									<span className="relative ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-900/50 text-amber-300 rounded-sm overflow-hidden group-hover:bg-amber-800/50">
										NEW
										<motion.div
											className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
											variants={shimmer}
											animate="visible"
										/>
									</span>
								)}
							</Link>
						</motion.li>
					))}
				</motion.ul>
			</motion.div>
		)
	}
)

FooterLinkGroupComponent.displayName = 'FooterLinkGroupComponent'

// Social media component
const SocialMediaButton = memo(({ icon, href, label }: SocialLink) => {
	const [isHovered, setIsHovered] = useState(false)

	return (
		<motion.a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={label}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			className="relative p-2.5 text-gray-500 transition-colors rounded-full overflow-hidden border border-amber-900/20 hover:text-amber-400 hover:border-amber-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 group"
			whileHover={{
				scale: 1.1,
				y: -2,
				transition: { type: 'spring', stiffness: 400, damping: 10 }
			}}
			whileTap={{ scale: 0.95 }}
		>
			{icon}
			{isHovered && (
				<motion.div
					className="absolute inset-0 pointer-events-none bg-gradient-to-r from-amber-900/20 via-amber-700/30 to-amber-900/20"
					initial={{ opacity: 0 }}
					animate={{
						opacity: 1,
					}}
					exit={{ opacity: 0 }}
				/>
			)}
			<motion.div
				className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-600/0 via-amber-500 to-amber-600/0"
				initial={{ scaleX: 0 }}
				animate={{ scaleX: isHovered ? 1 : 0 }}
				transition={{ duration: 0.3 }}
			/>
		</motion.a>
	)
})

SocialMediaButton.displayName = 'SocialMediaButton'

// Newsletter form component with enhanced design
const NewsletterForm = memo(() => {
	const [emailValue, setEmailValue] = useState('')
	const [emailError, setEmailError] = useState('')
	const [emailSuccess, setEmailSuccess] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const newsletterRef = useRef<HTMLDivElement>(null)
	const isNewsletterInView = useInView(newsletterRef, { once: true, amount: 0.5 })
	const [isInputFocused, setIsInputFocused] = useState(false)

	const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setEmailValue(e.target.value)
		setEmailError('')
	}, [])

	const handleEmailSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			setIsSubmitting(true)

			try {
				// Validate with zod
				emailSchema.parse(emailValue)

				// Simulate API call
				await new Promise(resolve => setTimeout(resolve, 800))

				// In a real implementation, we would also send a copy to the CEO
				console.log('Newsletter signup - CEO will be notified at:', 'ceo@dmscasinogaming.com')

				// Success state
				setEmailError('')
				setEmailSuccess(true)
				setEmailValue('')

				// Reset success message after 3 seconds
				setTimeout(() => {
					setEmailSuccess(false)
				}, 5000)
			} catch (error) {
				if (error instanceof z.ZodError) {
					setEmailError(error.errors?.[0]?.message || 'Invalid email format')
				} else {
					setEmailError('Failed to subscribe. Please try again.')
				}
				setEmailSuccess(false)
			} finally {
				setIsSubmitting(false)
			}
		},
		[emailValue]
	)

	return (
		<motion.div
			ref={newsletterRef}
			initial={{ opacity: 0, y: 30 }}
			animate={isNewsletterInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
			transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
			className="relative flex flex-col items-center gap-8 pt-10 mt-10 border-t md:flex-row border-amber-900/30"
		>
			<div className="flex-1">
				<div className="flex items-center gap-2 text-xl font-semibold text-white font-playfair">
					<div className="p-1.5 rounded-full bg-amber-900/30">
						<Sparkles size={18} className="text-amber-400" aria-hidden="true" />
					</div>
					<div>Get Exclusive VIP Rewards</div>
				</div>
				<div className="max-w-md mt-2 text-sm text-gray-400">
					Join our newsletter for exclusive gambling strategies, VIP promotions, and insider tips from professional blackjack players.
				</div>
			</div>

			<form
				className="flex flex-col flex-1 w-full gap-2"
				onSubmit={handleEmailSubmit}
				aria-label="Newsletter subscription form"
			>
				<div className="relative flex">
					<div className="relative flex-1">
						<motion.div
							className="absolute inset-0 border-2 rounded-l-md border-amber-500/50"
							animate={{
								opacity: isInputFocused ? 1 : 0,
								scale: isInputFocused ? 1 : 0.98,
							}}
							transition={{ duration: 0.3 }}
						/>
						{(() => {
							const getBorderClass = () => {
								if (emailError) return 'border-red-700/80 focus:border-red-600';
								if (isInputFocused) return 'border-amber-500/80';
								return 'border-amber-900/50';
							};

							return (
								<input
									type="email"
									id="newsletter-email"
									name="email"
									placeholder="Your email address"
									value={emailValue}
									onChange={handleEmailChange}
									onFocus={() => setIsInputFocused(true)}
									onBlur={() => setIsInputFocused(false)}
									disabled={isSubmitting}
									aria-label="Your email address"
									aria-describedby={emailError ? 'newsletter-error' : undefined}
									className={cn(
										'bg-black/70 border-2 text-white px-4 py-2.5 rounded-l-md w-full focus:outline-none transition-all duration-300',
										getBorderClass()
									)}
								/>
							);
						})()}
						{emailError && (
							<div className="absolute -translate-y-1/2 right-2 top-1/2">
								<AlertCircle size={16} className="text-red-500" aria-hidden="true" />
							</div>
						)}
					</div>
					<Button
						type="submit"
						disabled={isSubmitting}
						className="relative font-medium text-black border-0 rounded-l-none px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.2)]"
						aria-label="Subscribe to newsletter"
					>
						<div className="relative z-10 flex items-center">
							{isSubmitting ? 'Subscribing...' : 'Subscribe'}
							{!isSubmitting && <ArrowUpRight size={16} className="ml-2" aria-hidden="true" />}
						</div>
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-300/30 to-amber-400/0"
							initial={{ x: '-100%' }}
							animate={{ x: ['100%', '-100%'] }}
							transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
						/>
					</Button>
				</div>

				{/* Form feedback messages */}
				<AnimatePresence mode="wait">
					{emailError && (
						<motion.p
							id="newsletter-error"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="text-xs text-red-400"
							role="alert"
						>
							{emailError}
						</motion.p>
					)}

					{emailSuccess && (
						<motion.output
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: 'auto' }}
							exit={{ opacity: 0, height: 0 }}
							className="text-xs text-green-400 flex items-center gap-1.5"
							htmlFor="newsletter-email"
						>
							<Sparkles size={12} className="text-amber-400" />
							Thank you for subscribing! Check your email for exclusive VIP offers.
						</motion.output>
					)}
				</AnimatePresence>
			</form>
		</motion.div>
	)
})

NewsletterForm.displayName = 'NewsletterForm'

// Enhanced scroll to top button component
const ScrollToTopButton = memo(({ showScrollTop }: { showScrollTop: boolean }) => {
	const handleScrollToTop = useCallback(() => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		})
	}, [])

	return (
		<motion.button
			onClick={handleScrollToTop}
			className="fixed z-50 p-3 overflow-hidden text-white rounded-full shadow-lg bottom-6 right-6 bg-gradient-to-br from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-black"
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{
				opacity: showScrollTop ? 1 : 0,
				scale: showScrollTop ? 1 : 0.8,
				y: showScrollTop ? 0 : 20,
			}}
			transition={{ duration: 0.3 }}
			whileHover={{
				scale: 1.1,
				boxShadow: "0 0 20px rgba(251,191,36,0.4)"
			}}
			whileTap={{ scale: 0.9 }}
			aria-label="Scroll to top"
		>
			<div className="relative">
				<ChevronUp size={22} aria-hidden="true" />
				<motion.div
					className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
					initial={{ x: '-100%', opacity: 0 }}
					animate={{ x: '100%', opacity: 0.5 }}
					transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
				/>
			</div>
		</motion.button>
	)
})

ScrollToTopButton.displayName = 'ScrollToTopButton'

// Enhanced footer divider with animated golden lights
const FooterDivider = memo(() => {
	return (
		<div className="relative w-full h-px my-6 overflow-hidden">
			<div className="absolute inset-0 bg-amber-900/30" />
			<motion.div
				className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent"
				initial={{ x: '-100%' }}
				animate={{ x: '400%' }}
				transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
			/>
		</div>
	)
})

FooterDivider.displayName = 'FooterDivider'

// Casino chips animation for background
const CasinoChipsBackground = memo(() => {
	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			<div className="relative h-full mx-auto max-w-7xl">
				{[...Array(6)].map((_, i) => (
					<motion.div
						key={`casino-chip-${i}-${Math.random().toString(36).slice(2, 11)}`}
						className="absolute w-32 h-32 rounded-full border-4 border-amber-600/5 opacity-[0.03]"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
						}}
						initial={{ scale: 0.8, rotate: 0 }}
						animate={{
							scale: [0.8, 1.2, 0.8],
							rotate: 360,
							borderColor: [
								'rgba(217, 119, 6, 0.05)',
								'rgba(245, 158, 11, 0.08)',
								'rgba(217, 119, 6, 0.05)'
							]
						}}
						transition={{
							duration: 15 + Math.random() * 10,
							repeat: Infinity,
							ease: "linear"
						}}
					/>
				))}
			</div>
		</div>
	)
})

CasinoChipsBackground.displayName = 'CasinoChipsBackground'

// Footer Logo Component with modern design
const FooterLogo = memo(() => (
	<Link
		href="/"
		className="flex items-center group"
		aria-label="Royal Blackjack Casino"
	>
		<div className="relative w-16 h-16 mr-4 transition-all duration-300 group-hover:scale-105">
			<Image
				src="/images/Royal-Blackjack-Logo.png"
				alt="Royal Blackjack Casino Logo"
				width={64}
				height={64}
				className="object-contain w-auto h-auto"
				style={{ width: 'auto', height: 'auto' }}
				priority
			/>
			{/* Animated glow effect on hover */}
			<motion.div
				className="absolute inset-0 rounded-full bg-amber-500/0 blur-xl"
				animate={{
					backgroundColor: ['rgba(245,158,11,0)', 'rgba(245,158,11,0.1)', 'rgba(245,158,11,0)'],
				}}
				transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
			/>
		</div>

		<div className="flex flex-col">
			<div className="overflow-hidden">
				<motion.h2
					className="text-2xl font-bold text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text font-playfair drop-shadow-sm"
					whileHover={{ scale: 1.03 }}
					transition={{ type: "spring", stiffness: 400, damping: 10 }}
				>
					ROYAL BLACKJACK
				</motion.h2>
			</div>
			<div className="flex items-center">
				<span className="text-xs uppercase tracking-widest text-amber-500/90 font-medium ml-0.5">
					Premium Casino Experience
				</span>
			</div>
			<div className="flex mt-1">
				{['♠', '♥', '♦', '♣'].map((suit, i) => (
					<motion.span
						key={`card-suit-${suit}-${i}`}
						className={cn(
							"text-xs",
							i % 2 === 0 ? "text-white" : "text-red-500"
						)}
						initial={{ opacity: 0.7, scale: 0.9 }}
						animate={{
							opacity: [0.7, 1, 0.7],
							scale: [0.9, 1.1, 0.9],
						}}
						transition={{
							duration: 2,
							delay: i * 0.5,
							repeat: Infinity,
							ease: "easeInOut"
						}}
					>
						{suit}
					</motion.span>
				))}
			</div>
		</div>
	</Link>
))

FooterLogo.displayName = 'FooterLogo'

export function Footer() {
	const [showScrollTop, setShowScrollTop] = useState(false)
	const footerRef = useRef<HTMLElement>(null)
	const isInView = useInView(footerRef, { once: true, amount: 0.1 })
	const currentYear = new Date().getFullYear()

	// Move sparkle effect on mouse move for interactive background
	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		if (!footerRef.current) return
		const rect = footerRef.current.getBoundingClientRect()
		const x = ((e.clientX - rect.left) / rect.width) * 100
		const y = ((e.clientY - rect.top) / rect.height) * 100

		// Update CSS variables directly on the element instead of using state
		footerRef.current.style.setProperty('--spotlight-x', `${x}%`)
		footerRef.current.style.setProperty('--spotlight-y', `${y}%`)
	}, [])

	// Footer link groups with icons for enhanced visual hierarchy
	const linkGroups: FooterLinkGroup[] = [
		{
			title: 'Casino',
			icon: <GiCardRandom size={16} />,
			links: [
				{ label: 'Home', href: '/' },
				{ label: 'Games', href: '/game' },
				{ label: 'Leaderboard', href: '/leaderboard' },
				{ label: 'Tournaments', href: '/tournaments', isNew: true },
			],
		},
		{
			title: 'Account',
			icon: <GiCrownedSkull size={16} />,
			links: [
				{ label: 'Sign In', href: '/auth/sign-in' },
				{ label: 'Sign Up', href: '/auth/sign-up' },
				{ label: 'Profile', href: '/auth/profile' },
				{ label: 'Reset Password', href: '/auth/reset-password' },
				{ label: 'VIP Program', href: '/vip', isNew: true },
			],
		},
		{
			title: 'Resources',
			icon: <GiPokerHand size={16} />,
			links: [
				{ label: 'Strategy Guide', href: '/strategy-guide' },
				{ label: 'Probability Charts', href: '/probability' },
				{ label: 'Card Counting', href: '/card-counting' },
				{ label: 'Game Rules', href: '/house-rules' },
			],
		},
		{
			title: 'Support',
			icon: <MessageCircle size={14} />,
			links: [
				{ label: 'Contact Us', href: '/contact-us' },
				{ label: 'CEO Direct Line', href: 'mailto:ceo@dmscasinogaming.com', isExternal: true },
				{ label: 'FAQ', href: '/faq' },
				{ label: 'Terms & Conditions', href: '/terms-of-service' },
				{ label: 'Privacy Policy', href: '/privacy-policy' },
				{ label: 'About Us', href: '/about-us' },
			],
		},
	]

	// Social media links with enhanced styling
	const socialLinks: SocialLink[] = [
		{ icon: <Twitter size={20} />, href: 'https://twitter.com/dmscasinogaming', label: 'Follow us on Twitter' },
		{ icon: <Facebook size={20} />, href: 'https://facebook.com/dmscasinogaming', label: 'Follow us on Facebook' },
		{
			icon: <Instagram size={20} />,
			href: 'https://instagram.com/dmscasinogaming',
			label: 'Follow us on Instagram',
		},
		{ icon: <Diamond size={20} />, href: '/vip', label: 'VIP Program' },
	]

	// Scroll to top button visibility
	useEffect(() => {
		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 400)
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	return (
		<footer
			ref={footerRef}
			onMouseMove={handleMouseMove}
			className="relative pb-8 overflow-hidden border-t pt-14 bg-gradient-to-b from-black via-black to-amber-950/20 border-amber-900/30"
			aria-labelledby="footer-heading"
		>
			<h2 id="footer-heading" className="sr-only">
				Footer
			</h2>

			{/* Background animations */}
			<CardSuitAnimation />
			<CasinoChipsBackground />

			{/* Interactive spotlight effect */}
			<div
				className="absolute inset-0 pointer-events-none opacity-10 dynamic-spotlight"
			/>

			{/* Main Footer Content */}
			<div className="container relative z-10 px-4 mx-auto">
				<motion.div
					initial="hidden"
					animate={isInView ? "visible" : "hidden"}
					variants={staggerContainer}
					className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6"
				>
					{/* Logo & Description */}
					<motion.div
						className="flex flex-col gap-5 lg:col-span-2"
						variants={fadeInUp}
					>
						<FooterLogo />

						<p className="max-w-md text-sm leading-relaxed text-gray-300">
							Experience the authentic thrill of Las Vegas in our premium blackjack casino. Featuring realistic
							card physics, advanced betting systems, and sophisticated probability analysis for the ultimate
							royal gaming experience.
						</p>

						{/* Social Media - enhanced design */}
						<div className="flex gap-3 mt-2">
							{socialLinks.map(social => (
								<SocialMediaButton
									key={social.href}
									icon={social.icon}
									href={social.href}
									label={social.label}
								/>
							))}
						</div>
					</motion.div>

					{/* Link Groups with enhanced animations */}
					{linkGroups.map((group, i) => (
						<FooterLinkGroupComponent
							key={group.title}
							title={group.title}
							icon={group.icon}
							links={group.links}
							delay={i}
						/>
					))}
				</motion.div>

				<FooterDivider />

				{/* Responsible Gaming Banner - enhanced luxury design */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
					transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
					className="relative px-8 py-6 mt-10 border rounded-xl bg-gradient-to-r from-black via-amber-950/10 to-black border-amber-800/40 overflow-hidden shadow-[0_5px_30px_-15px_rgba(245,158,11,0.2)]"
				>
					{/* Animated border */}
					<div className="absolute inset-0 z-0 overflow-hidden">
						<motion.div
							className="absolute border -inset-1 border-amber-500/30 rounded-xl"
							animate={{ scale: [1, 1.02, 1], opacity: [0.6, 1, 0.6] }}
							transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
						/>
					</div>

					<div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center">
						<div className="flex items-center gap-4">
							<div className="p-3 border rounded-full shadow-inner bg-gradient-to-br from-amber-900/80 to-amber-950/80 border-amber-700/20">
								<Shield className="text-amber-400" size={24} aria-hidden="true" />
							</div>
							<div>
								<h3 className="text-xl font-semibold text-amber-300 font-playfair">
									Responsible Gaming
								</h3>
								<p className="mt-1 text-sm text-gray-400">
									Play for entertainment, not for profit.
								</p>
							</div>
						</div>

						<div className="flex items-center flex-1">
							<div
								className="hidden w-px h-16 mr-6 bg-amber-900/40 md:block"
								aria-hidden="true"
							></div>
							<p className="text-sm leading-relaxed text-gray-300">
								We promote responsible gaming and are committed to providing a safe, fair, and
								enjoyable experience for all our players.
							</p>
						</div>

						<Button
							variant="outline"
							size="sm"
							className="transition-all duration-300 whitespace-nowrap border-amber-700/40 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300 hover:border-amber-600/60 focus:ring-amber-500 focus-visible:ring-2"
							aria-label="Get support for responsible gaming"
						>
							<HelpCircle size={14} className="mr-2" aria-hidden="true" />
							Get Support
						</Button>
					</div>
				</motion.div>

				{/* Enhanced Newsletter */}
				<NewsletterForm />
			</div>

			{/* Bottom Footer with elegant design */}
			<div className="mt-12 border-t border-amber-900/20 bg-black/80">
				<div className="container px-4 py-5 mx-auto">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<motion.div
							className="text-sm text-amber-800"
							whileHover={{ color: "#d97706" }}
						>
							&copy; {currentYear} DMS CASINO GAMING. All rights reserved.
						</motion.div>

						<div className="flex items-center gap-6">
							<div className="text-xs text-gray-600">
								<Link
									href="/terms-of-service"
									className="px-1 transition-colors rounded-sm hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
								>
									Terms
								</Link>
								<span className="mx-2 text-amber-900" aria-hidden="true">
									•
								</span>
								<Link
									href="/privacy-policy"
									className="px-1 transition-colors rounded-sm hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
								>
									Privacy
								</Link>
								<span className="mx-2 text-amber-900" aria-hidden="true">
									•
								</span>
								<Link
									href="/cookies"
									className="px-1 transition-colors rounded-sm hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
								>
									Cookies
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Enhanced scroll to top button */}
			<ScrollToTopButton showScrollTop={showScrollTop} />
		</footer>
	)
}

export default Footer
