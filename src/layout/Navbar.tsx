'use client'

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring, useAnimationControls } from 'framer-motion'
import { usePathname } from 'next/navigation'
import {
	Menu,
	X,
	ChevronDown,
	LogIn,
	LogOut,
	User,
	KeyRound,
	UserPlus,
} from 'lucide-react'
import {
	GiDiamonds,
	GiCardAceClubs,
	GiPokerHand,
	GiPaperClip,
	GiDatabase,
	GiWorld,
	GiBookPile,
	GiTeacher,
	GiBallGlow,
	GiBrain,
	GiStigmata,
	GiComputing,
	GiRuleBook,
	GiInfo,
	GiRelationshipBounds,
	GiPerson,
	GiPhone,
	GiBookmark,
	GiCrown,
	GiSettingsKnobs,
	GiMoneyStack,
	GiPadlock,
} from 'react-icons/gi'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/layout/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationsPanel } from './NotificationsPanel'

// Types
interface NavChildLink {
	href: string
	label: string
	icon?: React.ReactNode
	disabled?: boolean
}

interface NavLink {
	href?: string
	label: string
	children?: NavChildLink[]
}

interface AccountLink {
	href: string
	label: string
	icon: React.ReactNode
}

// Navigation Links Configuration
const navLinks: NavLink[] = [
	{ href: '/', label: 'Home' },
	{
		label: 'Casino Games',
		children: [
			{
				href: '/game/blackjack',
				label: 'Blackjack',
				icon: <GiCardAceClubs className="text-amber-400" size={18} />,
			},
			{
				href: '/games/poker',
				label: 'Poker (Coming Soon)',
				icon: <GiPokerHand className="text-amber-400" size={18} />,
				disabled: true,
			},
			{ href: '/games', label: 'View All Games' },
		],
	},
	{
		label: 'Features',
		children: [
			{
				href: '/vip',
				label: 'VIP',
				icon: <GiCrown className="text-amber-400" size={18} />,
			},
			{
				href: '/leaderboard',
				label: 'Leaderboard',
				icon: <GiWorld className="text-amber-400" size={18} />,
			},
			{
				href: '/dashboard',
				label: 'Statistics',
				icon: <GiBookPile className="text-amber-400" size={18} />,
			},
			{
				href: '/tutorial',
				label: 'Tutorial',
				icon: <GiTeacher className="text-amber-400" size={18} />,
			},
			{
				href: '/analytics',
				label: 'Analytics',
				icon: <GiDatabase className="text-amber-400" size={18} />,
			},
			{
				href: '/tournaments',
				label: 'Tournaments (Coming Soon)',
				icon: <GiBallGlow className="text-amber-400" size={18} />,
				disabled: true,
			}
		],
	},
	{
		label: 'Strategy',
		children: [
			{
				href: '/strategy-guide',
				label: 'Strategy Guide',
				icon: <GiBrain className="text-amber-400" size={18} />,
			},
			{
				href: '/probability',
				label: 'Probability Charts',
				icon: <GiStigmata className="text-amber-400" size={18} />,
			},
			{
				href: '/card-counting',
				label: 'Card Counting',
				icon: <GiComputing className="text-amber-400" size={18} />,
			},
			{
				href: '/house-rules',
				label: 'Game Rules',
				icon: <GiRuleBook className="text-amber-400" size={18} />,
			},
			{
				href: '/blog',
				label: 'Blog (Coming Soon)',
				icon: <GiPaperClip className="text-amber-400" size={18} />,
				disabled: true,
			},
		],
	},
	{
		label: 'Info',
		children: [
			{
				href: '/responsible-gaming',
				label: 'Responsible Gaming',
				icon: <GiRelationshipBounds className="text-amber-400" size={18} />,
			},
			{
				href: '/about-us',
				label: 'About Us',
				icon: <GiPerson className="text-amber-400" size={18} />,
			},
			{
				href: '/contact-us',
				label: 'Contact Us',
				icon: <GiPhone className="text-amber-400" size={18} />,
			},
			{
				href: '/faq',
				label: 'FAQ',
				icon: <GiBookmark className="text-amber-400" size={18} />,
			},
		],
	},
]

// Account Links Configuration
const accountLinks: AccountLink[] = [
	{ href: '/auth/profile', label: 'Profile', icon: <User size={16} /> },
	{ href: '/analytics', label: 'Game Statistics', icon: <GiComputing size={16} /> },
	{ href: '/cashier', label: 'Cashier', icon: <GiMoneyStack size={16} /> },
	{ href: '/settings', label: 'Settings', icon: <GiSettingsKnobs size={16} /> },
	{ href: '/auth/update-password', label: 'Change Password', icon: <GiPadlock size={16} /> },
]

// Updated Logo Component with enhanced luxury effects
const Logo = memo(() => {
	// Refined pulse effect using spring physics for luxury appeal
	const scale = useSpring(1, { stiffness: 220, damping: 18 })
	const rotation = useSpring(0, { stiffness: 150, damping: 15 })
	const glowOpacity = useMotionValue(0.6)

	useEffect(() => {
		// Subtle scale animation
		const scaleInterval = setInterval(() => {
			scale.set(1.04)
			setTimeout(() => scale.set(1), 350)
		}, 5000)

		// Occasional subtle rotation for dynamic feel
		const rotationInterval = setInterval(() => {
			rotation.set(2)
			setTimeout(() => rotation.set(-1), 300)
			setTimeout(() => rotation.set(0), 600)
		}, 8000)

		// Ambient glow pulsing
		const glowInterval = setInterval(() => {
			glowOpacity.set(0.8)
			setTimeout(() => glowOpacity.set(0.6), 1500)
		}, 3000)

		return () => {
			clearInterval(scaleInterval)
			clearInterval(rotationInterval)
			clearInterval(glowInterval)
		}
	}, [scale, rotation, glowOpacity])

	return (
		<Link
			href="/"
			className="flex items-center gap-3 group"
			aria-label="Royal Blackjack Casino Home"
			onMouseEnter={() => {
				scale.set(1.03)
				glowOpacity.set(0.9)
			}}
			onMouseLeave={() => {
				scale.set(1)
				glowOpacity.set(0.6)
			}}
		>
			{/* Logo Image Container with Enhanced Luxury Effects */}
			<motion.div
				className="relative w-[76px] h-[76px]" // Slightly larger for more prominence
				style={{
					scale,
					rotate: rotation
				}}
				transition={{ type: 'spring', stiffness: 350, damping: 20 }}
			>
				{/* Premium Ambient Glow Effect */}
				<motion.div
					className="absolute inset-0 rounded-full bg-gradient-radial from-amber-500/30 via-amber-500/10 to-transparent blur-xl"
					style={{ opacity: glowOpacity }}
					animate={{
						scale: [1, 1.15, 1],
					}}
					transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
				/>

				{/* Secondary Glow Layer for Depth */}
				<motion.div
					className="absolute rounded-full inset-2 bg-gradient-radial from-amber-300/20 via-red-500/5 to-transparent blur-lg"
					animate={{
						opacity: [0.7, 0.9, 0.7],
						scale: [0.9, 1.05, 0.9],
					}}
					transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', delay: 0.5 }}
				/>

				{/* The Logo Image with Premium Treatment */}
				<motion.div
					className="relative z-10 w-full h-full overflow-hidden rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)]" // Enhanced with shadow
					whileHover={{
						scale: 1.06,
						boxShadow: '0 0 25px rgba(245,158,11,0.5)'
					}}
					whileTap={{ scale: 0.97 }}
					transition={{ type: 'spring', stiffness: 400, damping: 17 }}
				>
					<Image
						src="/images/Royal-Blackjack-Logo.png"
						alt="Royal Blackjack Casino Logo"
						width={76}
						height={76}
						priority // Prioritize loading the logo
						className="object-contain" // Maintain aspect ratio
						style={{ width: 'auto', height: 'auto' }}
					/>

					{/* Premium Overlay Effect */}
					<div className="absolute inset-0 bg-gradient-to-b from-amber-600/10 to-transparent mix-blend-overlay"></div>
				</motion.div>

				{/* Luxury Shimmer Effect */}
				<motion.div
					className="absolute inset-0 z-20 rounded-lg opacity-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
					animate={{
						opacity: [0, 0.6, 0],
						transform: ['translateX(-100%) translateY(-100%)', 'translateX(100%) translateY(100%)'],
					}}
					transition={{
						duration: 2.8,
						repeat: Infinity,
						repeatDelay: 4,
						ease: 'easeInOut',
					}}
				/>
			</motion.div>

			{/* Text Section - Enhanced Luxury Styling */}
			<div className="flex flex-col">
				<div className="relative">
					<motion.h1
						key="house-edge-title"
						className="text-xl font-bold tracking-wider text-transparent uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text cinzel-decorative-regular"
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, ease: 'easeOut' }}
					>
						Royal Edge
					</motion.h1>

					<div className="flex items-center gap-1.5 relative">
						<motion.span
							className="h-[1px] w-4 bg-gradient-to-r from-transparent via-amber-500 to-amber-500" // Enhanced gold accent
							initial={{ scaleX: 0, originX: 0 }}
							animate={{ scaleX: 1 }}
							transition={{ duration: 0.5, delay: 0.2 }}
						/>
						<motion.h1
							key="blackjack-title"
							className="text-2xl font-bold tracking-wider text-transparent uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text cinzel-decorative-regular" // Increased size
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
						>
							Blackjack
						</motion.h1>
						<motion.span
							className="h-[1px] w-4 bg-gradient-to-l from-transparent via-amber-500 to-amber-500" // Enhanced gold accent
							initial={{ scaleX: 0, originX: 1 }}
							animate={{ scaleX: 1 }}
							transition={{ duration: 0.5, delay: 0.2 }}
						/>
					</div>

					{/* Enhanced Decorative Line */}
					<motion.div
						className="absolute left-0 right-0 h-[1.5px] -bottom-1.5 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" // Thicker line
						initial={{ scaleX: 0 }}
						animate={{ scaleX: 1 }}
						transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
						style={{ transformOrigin: 'center' }}
					/>
				</div>

				{/* Enhanced VIP Badge */}
				<motion.div
					className="flex items-center justify-center mt-1"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.7, delay: 0.4 }}
				>
					<motion.span
						className="relative px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wider uppercase rounded-sm text-amber-100 bg-gradient-to-r from-red-900/60 to-black/60 border border-amber-500/20 shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
						whileHover={{
							color: '#fcd34d',
							borderColor: 'rgba(245, 158, 11, 0.5)',
							boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
						}}
						transition={{ duration: 0.3 }}
					>
						<span className="relative z-10">VIP Experience</span>
						<span className="ml-1.5 font-bold text-amber-400">21</span>

						{/* Subtle card suit accent */}
						<motion.span
							className="absolute -right-1 -top-1 text-[8px] text-amber-500/60"
							animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
							transition={{ duration: .8, repeat: Infinity, repeatDelay: 5 }}
						>
							♠
						</motion.span>
					</motion.span>
				</motion.div>
			</div>
		</Link>
	)
})

Logo.displayName = 'Logo'

// Enhanced Dropdown Item Component
const DropdownItem = memo(
	({
		child,
		pathname,
		onSelect,
	}: {
		child: NavChildLink
		pathname: string
		onSelect: () => void
	}) => (
		<Link
			key={child.label}
			href={child.disabled ? '#' : child.href}
			className={cn(
				'px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-amber-900/50 hover:to-red-900/30 text-gray-300 hover:text-amber-200 transition-all duration-200 flex items-center gap-3 relative overflow-hidden group',
				pathname === child.href && 'bg-gradient-to-r from-amber-800/40 to-amber-800/20 text-amber-200 font-medium shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]',
				child.disabled && 'opacity-60 cursor-not-allowed hover:bg-transparent hover:text-gray-400'
			)}
			onClick={e => {
				if (child.disabled) e.preventDefault()
				onSelect()
			}}
			aria-disabled={child.disabled}
			tabIndex={child.disabled ? -1 : 0}
			role="menuitem"
		>
			{/* Premium Shimmer Effect */}
			<motion.div
				className="absolute top-0 bottom-0 left-0 w-2/3 opacity-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent group-hover:opacity-100"
				style={{ x: '-150%' }}
				transition={{ duration: 0.7, ease: 'linear' }}
				whileHover={{
					x: '200%',
					transition: { duration: 0.9, ease: 'linear' }
				}}
			/>

			{/* Enhanced Icon with Animation */}
			{child.icon && (
				<motion.div
					className="transition-transform duration-200 group-hover:scale-110 group-hover:text-amber-300"
					whileHover={{ rotate: 8 }}
					transition={{ type: 'spring', stiffness: 400, damping: 10 }}
				>
					{child.icon}
				</motion.div>
			)}

			<span className="relative z-10 tracking-wide">{child.label}</span>

			{child.disabled && (
				<span className="ml-auto text-xs px-1.5 py-0.5 bg-gray-800/70 text-gray-400 rounded border border-gray-700/50 shadow-inner">
					SOON
				</span>
			)}

			{/* Subtle Hover Border */}
			<motion.div
				className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100"
				transition={{ duration: 0.2 }}
			/>
		</Link>
	)
)

DropdownItem.displayName = 'DropdownItem'

// Navigation Dropdown Component with improved accessibility
const NavDropdown = memo(
	({
		link,
		activeDropdown,
		toggleDropdown,
		pathname,
	}: {
		link: NavLink
		activeDropdown: string | null
		toggleDropdown: (label: string) => void
		pathname: string
	}) => {
		const isActive = activeDropdown === link.label
		const dropdownRef = useRef<HTMLDivElement>(null)
		const menuId = `dropdown-${link.label}`
		const controls = useAnimationControls()

		useEffect(() => {
			if (isActive) {
				controls.start({ rotate: 180 })
			} else {
				controls.start({ rotate: 0 })
			}
		}, [isActive, controls])

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent) => {
				if (e.key === 'Escape') {
					toggleDropdown('')
				} else if (e.key === 'ArrowDown' && !isActive) {
					e.preventDefault()
					toggleDropdown(link.label)
				}
			},
			[isActive, link.label, toggleDropdown]
		)

		return (
			<div
				ref={node => {
					if (dropdownRef.current && node) {
						dropdownRef.current = node
					}
				}}
				className="relative"
				aria-label={`${link.label} dropdown menu`}
			>
				<Button
					variant="ghost"
					onClick={() => toggleDropdown(link.label)}
					onKeyDown={handleKeyDown}
					className={cn(
						'px-4 py-2.5 text-base font-medium focus-visible:ring-2 focus-visible:ring-amber-500/80 relative overflow-hidden group transition-all duration-200 rounded-md',
						isActive
							? 'text-amber-200 bg-gradient-to-r from-amber-900/50 to-red-900/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)]'
							: 'text-gray-200 hover:text-amber-200 hover:bg-gradient-to-b hover:from-amber-950/20 hover:to-transparent'
					)}
					aria-expanded={isActive}
					aria-haspopup="true"
					aria-controls={isActive ? menuId : undefined}
				>
					{/* Premium Button Background Effect */}
					<div className="absolute inset-0 bg-[url('/pattern/art-deco.svg')] bg-repeat opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>

					<span className="relative z-10">{link.label}</span>
					<motion.div
						animate={controls}
						transition={{ duration: 0.3, type: 'spring', stiffness: 350, damping: 25 }}
						className="inline-flex ml-1.5"
					>
						<ChevronDown size={18} />
					</motion.div>

					{/* Elegant Hover Underline */}
					<motion.div
						className="absolute bottom-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"
						initial={false}
						animate={isActive ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
						whileHover={!isActive ? { scaleX: 1, opacity: 0.8 } : {}}
						transition={{ duration: 0.3 }}
						style={{ originX: 0.5 }}
					/>
				</Button>

				<AnimatePresence>
					{isActive && link.children && (
						<motion.div
							id={menuId}
							initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: 'top' }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
							className="absolute top-full left-0 mt-2 bg-gradient-to-b from-[#0a0605]/95 to-[#100808]/98 border border-amber-800/50 backdrop-blur-xl rounded-lg shadow-[0_10px_40px_-5px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.15)] py-2 min-w-[260px] z-50 overflow-hidden"
							role="menu"
							aria-orientation="vertical"
						>
							{/* Premium Top Glow */}
							<div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-80"></div>

							{/* Luxury Pattern Overlay */}
							<div className="absolute inset-0 bg-[url('/pattern/luxury-casino-pattern.svg')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>

							{link.children.map((child, index) => (
								<motion.div
									key={child.label}
									initial={{ opacity: 0, x: -5 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.05, duration: 0.2 }}
								>
									<DropdownItem
										child={child}
										pathname={pathname}
										onSelect={() => toggleDropdown('')}
									/>
								</motion.div>
							))}

							{/* Bottom Accent */}
							<div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-800/30 to-transparent"></div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		)
	}
)

NavDropdown.displayName = 'NavDropdown'

// Enhanced User Menu Component with Premium Casino Styling
const UserMenu = memo(
	({
		isLoggedIn,
		activeDropdown,
		toggleDropdown,
		pathname,
	}: {
		isLoggedIn: boolean
		activeDropdown: string | null
		toggleDropdown: (label: string) => void
		pathname: string
	}) => {
		const isActive = activeDropdown === 'account'
		const menuId = isLoggedIn ? 'account-dropdown' : 'auth-dropdown'
		const dropdownRef = useRef<HTMLDivElement>(null)

		const handleLogout = useCallback(() => {
			// Handle logout logic here
			console.log('Logout action triggered') // Placeholder
			toggleDropdown('')
		}, [toggleDropdown])

		return (
			<div ref={node => {
				if (dropdownRef.current && node) {
					dropdownRef.current = node
				}
			}}
				className="relative">
				<Button
					variant={isLoggedIn ? 'outline' : 'default'}
					size="sm"
					onClick={() => toggleDropdown('account')}
					className={cn(
						'ml-2 text-amber-300 relative overflow-hidden group transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-amber-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 rounded-md',
						isLoggedIn
							? 'border-amber-700/60 bg-transparent hover:bg-gradient-to-br hover:from-amber-900/50 hover:to-red-900/30 hover:border-amber-600 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
							: 'border-transparent bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-[0_3px_15px_rgba(245,158,11,0.3)] hover:shadow-[0_5px_25px_rgba(245,158,11,0.4)]'
					)}
					aria-expanded={isActive}
					aria-haspopup="true"
					aria-controls={isActive ? menuId : undefined}
				>
					{/* Premium Gold Shimmer Effect */}
					<motion.div
						className="absolute top-0 bottom-0 left-0 w-1/2 opacity-0 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent group-hover:opacity-100"
						style={{ x: '-150%' }}
						transition={{ duration: 0.6, ease: 'linear' }}
						whileHover={{
							x: '200%',
							transition: { duration: 0.8, ease: 'linear' }
						}}
					/>

					{/* Subtle Pattern Overlay */}
					<div className="absolute inset-0 bg-[url('/pattern/art-deco.svg')] bg-repeat opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300"></div>

					<div className="relative z-10 flex items-center">
						{isLoggedIn ? (
							<>
								{/* VIP Avatar */}
								<motion.div
									className="flex items-center justify-center w-7 h-7 mr-2 text-xs font-bold text-black rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),_0_2px_3px_rgba(0,0,0,0.2)] group-hover:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),_0_0_8px_rgba(245,158,11,0.5)] transition-shadow duration-300"
									whileTap={{ scale: 0.95 }}
									animate={{
										boxShadow: ['inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 3px rgba(0,0,0,0.2)',
											'inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 3px rgba(0,0,0,0.2), 0 0 5px rgba(245,158,11,0.3)',
											'inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 3px rgba(0,0,0,0.2)']
									}}
									transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
								>
									<span className="tracking-wider">VIP</span>
								</motion.div>
								<span className="hidden text-sm font-medium tracking-wide sm:inline">My Account</span>
								<motion.div
									animate={isActive ? { rotate: 180 } : { rotate: 0 }}
									transition={{ duration: 0.3, type: 'spring', stiffness: 350, damping: 25 }}
									className="inline-flex ml-1.5"
								>
									<ChevronDown size={18} />
								</motion.div>
							</>
						) : (
							<>
								<motion.div
									className="mr-1.5"
									whileHover={{ rotate: 10 }}
									transition={{ type: 'spring', stiffness: 400, damping: 10 }}
								>
									<LogIn size={16} />
								</motion.div>
								<span className="text-sm font-medium tracking-wide">Sign In</span>
							</>
						)}
					</div>
				</Button>

				{/* Enhanced Account Dropdown Panel */}
				<AnimatePresence>
					{(isLoggedIn && isActive) && (
						<motion.div
							id="account-dropdown"
							initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: 'top right' }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
							className="absolute top-full right-0 mt-2 bg-gradient-to-b from-[#0a0605]/95 to-[#100808]/98 border border-amber-800/50 backdrop-blur-xl rounded-lg shadow-[0_10px_40px_-5px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.15)] py-2 min-w-[260px] z-50 overflow-hidden"
							role="menu"
							aria-orientation="vertical"
						>
							{/* Premium Gold Top Accent */}
							<div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-80"></div>

							{/* Luxury Pattern Overlay */}
							<div className="absolute inset-0 bg-[url('/pattern/luxury-casino-pattern.svg')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>

							{/* Enhanced VIP Header with Chips Display */}
							<div className="px-4 py-3 mb-2 border-b border-amber-900/40 bg-gradient-to-b from-amber-900/20 to-transparent">
								<div className="flex items-center gap-3">
									{/* VIP Badge */}
									<motion.div
										className="flex items-center justify-center w-10 h-10 text-sm font-bold text-black rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),_0_2px_3px_rgba(0,0,0,0.2)]"
										whileHover={{ scale: 1.05 }}
										animate={{
											boxShadow: ['inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 3px rgba(0,0,0,0.2)',
												'inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 3px rgba(0,0,0,0.2), 0 0 8px rgba(245,158,11,0.4)',
												'inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 3px rgba(0,0,0,0.2)']
										}}
										transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
									>
										<span className="tracking-wider">VIP</span>
									</motion.div>

									<div>
										<p className="text-sm font-semibold text-amber-200">Vegas Royal Elite</p>
										<p className="text-xs text-amber-100/70">Premium Member</p>
									</div>
								</div>

								{/* Chips Display with Animation */}
								<div className="flex items-center p-2 mt-3 border rounded-md bg-black/30 border-amber-900/30">
									<motion.div
										className="w-5 h-5 mr-2 text-amber-500"
										animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.1, 1] }}
										transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
									>
										<GiDiamonds className="w-full h-full" />
									</motion.div>
									<div className="flex-1">
										<div className="flex items-baseline justify-between">
											<p className="text-xs text-amber-100/80">Available Chips</p>
											<p className="text-sm font-bold text-amber-400">1,250</p>
										</div>
										<div className="w-full h-1.5 mt-1 bg-black/60 rounded-full overflow-hidden">
											<motion.div
												className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
												initial={{ width: "0%" }}
												animate={{ width: "45%" }}
												transition={{ duration: 1, ease: "easeOut" }}
											/>
										</div>
									</div>
								</div>
							</div>

							<div role="none">
								{accountLinks.map((link, index) => (
									<motion.div
										key={link.label}
										initial={{ opacity: 0, x: -5 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.05, duration: 0.2 }}
									>
										<Link
											href={link.href}
											className={cn(
												'px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-amber-900/40 hover:to-red-900/20 text-gray-300 hover:text-amber-200 transition-all duration-200 flex items-center gap-3 relative overflow-hidden group',
												pathname === link.href && 'bg-gradient-to-r from-amber-800/30 to-amber-800/15 text-amber-200 font-medium'
											)}
											onClick={() => toggleDropdown('')}
											role="menuitem"
										>
											{/* Premium Shimmer Effect */}
											<motion.div
												className="absolute top-0 bottom-0 left-0 w-2/3 opacity-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent group-hover:opacity-100"
												style={{ x: '-150%' }}
												transition={{ duration: 0.7, ease: 'linear' }}
												whileHover={{
													x: '200%',
													transition: { duration: 0.9, ease: 'linear' }
												}}
											/>

											{/* Enhanced Icon Animation */}
											<motion.div
												className="transition-transform duration-200 group-hover:scale-110 text-amber-500/90 group-hover:text-amber-400"
												whileHover={{ rotate: 8 }}
												transition={{ type: 'spring', stiffness: 400, damping: 10 }}
											>
												{link.icon}
											</motion.div>

											<span className="relative z-10 tracking-wide">{link.label}</span>

											{/* Subtle Hover Border */}
											<motion.div
												className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100"
												transition={{ duration: 0.2 }}
											/>
										</Link>
									</motion.div>
								))}
							</div>

							{/* Enhanced Sign Out Section with fixed aria role */}
							<div className="pt-2 mt-2 border-t border-amber-900/30">
								<div role="menu" aria-orientation="vertical">
									<div role="none">
										<button
											className="relative flex items-center w-full gap-3 px-4 py-3 overflow-hidden text-sm text-left text-gray-300 transition-all duration-200 hover:bg-gradient-to-r hover:from-red-900/40 hover:to-red-900/20 hover:text-red-300 group"
											onClick={handleLogout}
											role="menuitem"
										>
											{/* Rest of sign out button content */}
										</button>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* Enhanced Auth Dropdown (Sign In / Sign Up) with Casino Styling */}
					{(!isLoggedIn && isActive) && (
						<motion.div
							id="auth-dropdown"
							initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: 'top right' }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
							className="absolute top-full right-0 mt-2 bg-gradient-to-b from-[#0a0605]/95 to-[#100808]/98 border border-amber-800/50 backdrop-blur-xl rounded-lg shadow-[0_10px_40px_-5px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.15)] py-2 min-w-[240px] z-50 overflow-hidden"
							role="menu"
							aria-orientation="vertical"
						>
							{/* Premium Gold Top Accent */}
							<div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent opacity-80"></div>

							{/* Luxury Pattern Overlay */}
							<div className="absolute inset-0 bg-[url('/pattern/luxury-casino-pattern.svg')] opacity-[0.02] pointer-events-none mix-blend-overlay"></div>

							{/* Welcome Banner */}
							<div className="px-4 py-3 mb-2 border-b border-amber-900/40 bg-gradient-to-b from-amber-900/20 to-transparent">
								<p className="text-sm font-semibold text-amber-200">Welcome to Royal Blackjack</p>
								<p className="text-xs text-amber-100/70">Sign in to access VIP features</p>
							</div>

							<div role="none">
								{[
									{ href: '/auth/sign-in', label: 'Sign In', icon: <LogIn size={16} /> },
									{ href: '/auth/sign-up', label: 'Sign Up', icon: <UserPlus size={16} /> },
									{ href: '/auth/profile', label: 'Profile', icon: <GiInfo size={16} /> },
								].map((link, index) => (
									<motion.div
										key={link.label}
										initial={{ opacity: 0, x: -5 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.05, duration: 0.2 }}
									>
										<Link
											href={link.href}
											className="relative flex items-center gap-3 px-4 py-3 overflow-hidden text-sm text-gray-300 transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-900/40 hover:to-red-900/20 hover:text-amber-200 group"
											onClick={() => toggleDropdown('')}
											role="menuitem"
										>
											{/* Premium Shimmer Effect */}
											<motion.div
												className="absolute top-0 bottom-0 left-0 w-2/3 opacity-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent group-hover:opacity-100"
												style={{ x: '-150%' }}
												transition={{ duration: 0.7, ease: 'linear' }}
												whileHover={{
													x: '200%',
													transition: { duration: 0.9, ease: 'linear' }
												}}
											/>

											{/* Enhanced Icon Animation */}
											<motion.div
												className="transition-transform duration-200 group-hover:scale-110 text-amber-500/90 group-hover:text-amber-400"
												whileHover={{ rotate: 8 }}
												transition={{ type: 'spring', stiffness: 400, damping: 10 }}
											>
												{link.icon}
											</motion.div>

											<span className="relative z-10 tracking-wide">{link.label}</span>

											{/* Subtle Hover Border */}
											<motion.div
												className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent opacity-0 group-hover:opacity-100"
												transition={{ duration: 0.2 }}
											/>
										</Link>
									</motion.div>
								))}
							</div>

							{/* Forgot Password with Enhanced Styling */}
							<div className="pt-2 mt-2 border-t border-amber-900/30" role="none">
								<Link
									href="/auth/reset-password"
									className="relative flex items-center gap-3 px-4 py-3 overflow-hidden text-sm text-gray-400 transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-900/30 hover:to-amber-900/10 hover:text-amber-300 group"
									onClick={() => toggleDropdown('')}
									role="menuitem"
								>
									{/* Premium Shimmer Effect */}
									<motion.div
										className="absolute top-0 bottom-0 left-0 w-2/3 opacity-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent group-hover:opacity-100"
										style={{ x: '-150%' }}
										transition={{ duration: 0.7, ease: 'linear' }}
										whileHover={{
											x: '200%',
											transition: { duration: 0.9, ease: 'linear' }
										}}
									/>

									<motion.div
										className="transition-transform duration-200 group-hover:scale-110 text-amber-600/70 group-hover:text-amber-500"
										whileHover={{ rotate: 8 }}
										transition={{ type: 'spring', stiffness: 400, damping: 10 }}
									>
										<KeyRound size={16} />
									</motion.div>

									<span className="relative z-10 tracking-wide">Forgot Password</span>

									{/* Subtle Hover Border */}
									<motion.div
										className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100"
										transition={{ duration: 0.2 }}
									/>
								</Link>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		)
	}
)

UserMenu.displayName = 'UserMenu'

// Mobile Menu enhancement with Vegas casino styling
const MobileMenu = memo(
	({
		isOpen,
		onClose,
		links,
		accountLinks,
		pathname,
		isLoggedIn,
		activeDropdown,
		toggleDropdown,
	}: {
		isOpen: boolean
		onClose: () => void
		links: NavLink[]
		accountLinks: AccountLink[]
		pathname: string
		isLoggedIn: boolean
		activeDropdown: string | null
		toggleDropdown: (label: string) => void
	}) => {
		const handleLogout = useCallback(() => {
			console.log('Mobile Logout action triggered') // Placeholder
			onClose()
		}, [onClose])

		return (
			<AnimatePresence>
				{isOpen && (
					<motion.div
						id="mobile-menu"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
						transition={{ duration: 0.35, type: 'spring', stiffness: 300, damping: 30 }}
						className="absolute top-full left-0 right-0 lg:hidden bg-gradient-to-b from-black/98 via-[#0a0707]/98 to-[#100a0a]/98 backdrop-blur-xl border-t border-b border-amber-800/40 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] z-40"
					>
						{/* Ambient texture overlay */}
						<div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none mix-blend-soft-light"></div>

						{/* Top Accent */}
						<div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-80"></div>

						<div className="container px-4 py-5 mx-auto">
							<nav className="flex flex-col space-y-1.5">
								{links.map(link => {
									const isActive = activeDropdown === link.label
									const controlId = `mobile-dropdown-${link.label}`

									return (
										<div key={link.label}>
											{link.children ? (
												<>
													<button
														type="button"
														onClick={() => toggleDropdown(link.label)}
														className={cn(
															'w-full text-left px-4 py-3.5 rounded-lg flex items-center justify-between text-base transition-all duration-200',
															isActive
																? 'bg-gradient-to-r from-amber-900/40 to-amber-900/20 text-amber-200 shadow-inner'
																: 'text-gray-200 hover:bg-white/5 hover:text-amber-300'
														)}
														aria-expanded={isActive}
														aria-controls={controlId}
														aria-haspopup="true"
													>
														{link.label}
														<motion.div
															animate={{ rotate: isActive ? 180 : 0 }}
															transition={{ duration: 0.3 }}
															className="inline-flex ml-1"
														>
															<ChevronDown size={18} aria-hidden="true" />
														</motion.div>
													</button>

													<AnimatePresence>
														{isActive && (
															<motion.ul
																id={controlId}
																initial={{ opacity: 0, height: 0 }}
																animate={{ opacity: 1, height: 'auto' }}
																exit={{ opacity: 0, height: 0 }}
																transition={{ duration: 0.25, type: 'spring', stiffness: 350, damping: 30 }}
																className="pl-5 mt-1.5 space-y-1.5 border-l border-amber-800/30 ml-2"
																role="menu"
																aria-orientation="vertical"
															>
																{link.children.map((child, index) => (
																	<motion.li
																		key={child.label}
																		role="none"
																		initial={{ opacity: 0, x: -15 }}
																		animate={{ opacity: 1, x: 0 }}
																		transition={{ duration: 0.2, delay: index * 0.05 }}
																	>
																		{child.disabled ? (
																			<span
																				className="flex items-center gap-3 px-4 py-2.5 text-gray-400 rounded-md cursor-not-allowed opacity-60"
																				aria-disabled="true"
																			>
																				{child.icon && (
																					<span className="text-amber-600/70">{child.icon}</span>
																				)}
																				<span>{child.label}</span>
																				<span className="ml-auto text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">
																					SOON
																				</span>
																			</span>
																		) : (
																			<Link
																				href={child.href}
																				className={cn(
																					'px-4 py-2.5 rounded-md text-gray-300 hover:text-amber-200 hover:bg-amber-900/20 flex items-center gap-3 transition-all duration-200 group',
																					pathname === child.href && 'bg-gradient-to-r from-amber-800/30 to-amber-800/15 text-amber-200 font-medium'
																				)}
																				onClick={onClose}
																				role="menuitem"
																			>
																				{child.icon && (
																					<motion.div
																						className="transition-colors duration-200 text-amber-400 group-hover:text-amber-300"
																						whileHover={{ scale: 1.1, rotate: 5 }}
																					>
																						{child.icon}
																					</motion.div>
																				)}
																				<span>{child.label}</span>
																			</Link>
																		)}
																	</motion.li>
																))}
															</motion.ul>
														)}
													</AnimatePresence>
												</>
											) : (
												<Link
													href={link.href ?? ''}
													className={cn(
														'px-4 py-3.5 rounded-lg text-base flex items-center gap-3 transition-all duration-200',
														pathname === link.href
															? 'bg-gradient-to-r from-amber-900/40 to-amber-900/20 text-amber-200 shadow-inner'
															: 'text-gray-200 hover:bg-white/5 hover:text-amber-300'
													)}
													onClick={onClose}
												>
													{link.label}
												</Link>
											)}
										</div>
									)
								})}
							</nav>

							{/* Mobile User Account Section */}
							<div className="pt-6 mt-6 border-t border-amber-800/40">
								{isLoggedIn ? (
									<>
										<div className="flex items-center gap-4 px-4 pb-4 mb-4 border-b border-amber-900/20">
											{/* Enhanced Avatar */}
											<motion.div
												className="flex items-center justify-center w-12 h-12 text-lg font-bold text-black rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),_0_1px_1px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform duration-200"
												animate={{ scale: [1, 1.03, 1] }}
												transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror' }}
											>
												VR
											</motion.div>
											<div>
												<p className="text-base font-semibold text-amber-200">Vegas Royal</p>
												<div className="flex items-center mt-1">
													<motion.div
														animate={{ rotate: [0, -15, 10, 0] }}
														transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
														className="w-4 h-4 mr-1.5 text-amber-500"
													>
														<GiDiamonds className="w-full h-full" />
													</motion.div>
													<p className="text-sm text-amber-300/90"><span className="font-semibold">1,250</span> chips</p>
												</div>
											</div>
										</div>

										<div className="space-y-1.5">
											{accountLinks.map(link => (
												<Link
													key={link.label}
													href={link.href}
													className={cn(
														'px-4 py-3 rounded-lg text-gray-300 hover:text-amber-200 flex items-center gap-3 transition-all duration-200 group',
														pathname === link.href
															? 'bg-gradient-to-r from-amber-900/40 to-amber-900/20 text-amber-200'
															: 'hover:bg-white/5'
													)}
													onClick={onClose}
												>
													<motion.div
														className="transition-colors duration-200 text-amber-400 group-hover:text-amber-300"
														whileHover={{ scale: 1.1, rotate: 5 }}
													>
														{link.icon}
													</motion.div>
													<span>{link.label}</span>
												</Link>
											))}

											{/* Mobile Theme Toggle - Enhanced Layout */}
											<div className="flex items-center justify-between px-4 py-3 transition-all duration-200 rounded-lg hover:bg-white/5">
												<div className="flex items-center gap-3 text-gray-300">
													{/* Placeholder icon can be added if needed */}
													<span>Theme</span>
												</div>
												<ThemeToggle />
											</div>

											{/* Mobile Sign Out Button with fixed aria role */}
											<div role="none">
												<button
													type="button"
													className="flex items-center w-full gap-3 px-4 py-3 text-left text-gray-300 transition-all duration-200 rounded-lg hover:text-red-300 hover:bg-red-900/20 group"
													onClick={handleLogout}
													tabIndex={0}
													onKeyDown={e => {
														if (e.key === 'Enter' || e.key === ' ') {
															e.preventDefault()
															handleLogout()
														}
													}}
												>
													<motion.div
														className="text-red-400 transition-colors duration-200 group-hover:text-red-300"
														whileHover={{ scale: 1.1, rotate: -5 }}
													>
														<LogOut size={16} />
													</motion.div>
													<span>Sign Out</span>
												</button>
											</div>
										</div>
									</>
								) : (
									// Logged Out State - Mobile
									<div className="space-y-1.5">
										{[
											{ href: '/auth/sign-in', label: 'Sign In', icon: <LogIn size={16} /> },
											{ href: '/auth/sign-up', label: 'Sign Up', icon: <UserPlus size={16} /> },
										].map(link => (
											<Link
												key={link.label}
												href={link.href}
												className="flex items-center w-full gap-3 px-4 py-3 text-left text-gray-300 transition-all duration-200 rounded-lg hover:text-amber-200 hover:bg-white/5 group"
												onClick={onClose}
											>
												<motion.div
													className="transition-colors duration-200 text-amber-400 group-hover:text-amber-300"
													whileHover={{ scale: 1.1, rotate: 5 }}
												>
													{link.icon}
												</motion.div>
												<span>{link.label}</span>
											</Link>
										))}

										{/* Mobile Theme Toggle - Logged Out */}
										<div className="flex items-center justify-between px-4 py-3 transition-all duration-200 rounded-lg hover:bg-white/5">
											<div className="flex items-center gap-3 text-gray-300">
												{/* Placeholder icon can be added if needed */}
												<span>Theme</span>
											</div>
											<ThemeToggle />
										</div>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		)
	}
)

MobileMenu.displayName = 'MobileMenu'

export function Header() {
	const [isScrolled, setIsScrolled] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
	const headerRef = useRef<HTMLElement>(null)
	const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
	const pathname = usePathname()
	const { scrollY } = useScroll()
	// Replace with actual auth state from context/store when implemented
	const isLoggedIn = false

	// Enhanced scroll transformations for more depth and luxury
	const headerBgOpacity = useTransform(
		scrollY,
		[0, 80],
		['rgba(10, 2, 3, 0.35)', 'rgba(15, 3, 5, 0.95)']
	)
	const headerBackdropBlur = useTransform(scrollY, [0, 80], ['blur(0px)', 'blur(20px)'])
	const headerBorderOpacity = useTransform(scrollY, [0, 80], [0.1, 0.5])
	const headerShadowOpacity = useTransform(scrollY, [0, 80], [0, 0.7])

	// Vegas-inspired animated background effect
	const chipColors = useMemo(() => ['rgba(245,158,11,0.05)', 'rgba(220,38,38,0.05)', 'rgba(59,130,246,0.05)'], [])
	const [currentBackgroundColor, setCurrentBackgroundColor] = useState(chipColors[0])

	// Cycle through ambient background colors for Vegas effect
	useEffect(() => {
		const interval = setInterval(() => {
			const currentIndex = currentBackgroundColor ? chipColors.indexOf(currentBackgroundColor) : 0
			const nextIndex = (currentIndex + 1) % chipColors.length
			setCurrentBackgroundColor(chipColors[nextIndex])
		}, 8000) // Slow transition for subtle effect

		return () => clearInterval(interval)
	}, [chipColors, currentBackgroundColor])

	useEffect(() => {
		const updateStyles = () => {
			const bg = headerBgOpacity.get()
			const blurValue = headerBackdropBlur.get()
			const border = `rgba(215, 140, 25, ${headerBorderOpacity.get()})`
			const shadow = `0 6px 30px rgba(10, 0, 0, ${headerShadowOpacity.get()})`

			if (headerRef.current) {
				headerRef.current.style.backgroundColor = bg
				headerRef.current.style.setProperty('-webkit-backdrop-filter', blurValue)
				headerRef.current.style.borderBottomColor = border
				headerRef.current.style.boxShadow = shadow
			}
		}

		const unsubscribeScroll = scrollY.on('change', updateStyles)
		handleScroll() // Initial check

		return () => {
			unsubscribeScroll()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scrollY, headerBgOpacity, headerBackdropBlur, headerBorderOpacity, headerShadowOpacity])

	// Scroll listener for isScrolled state (used for conditional classes if needed)
	const handleScroll = useCallback(() => {
		setIsScrolled(window.scrollY > 10) // Trigger slightly earlier
	}, [])

	useEffect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [handleScroll])

	// Close dropdown on outside click or Escape key
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const isOutside = Object.values(dropdownRefs.current).every(ref =>
				ref && !ref.contains(event.target instanceof Node ? event.target : document.body)
			)

			if (activeDropdown && isOutside) {
				setActiveDropdown(null)
			}
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setActiveDropdown(null)
				setMobileMenuOpen(false) // Also close mobile menu on Escape
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [activeDropdown])

	// Toggle dropdown logic, ensures only one is open
	const toggleDropdown = useCallback((label: string) => {
		setActiveDropdown(prev => (prev === label ? null : label))
	}, [])

	// Toggle mobile menu logic
	const toggleMobileMenu = useCallback(() => {
		setMobileMenuOpen(prev => !prev)
		if (!mobileMenuOpen) {
			setActiveDropdown(null) // Close desktop dropdowns when opening mobile menu
		}
	}, [mobileMenuOpen])

	// Close mobile menu function passed down
	const closeMobileMenu = useCallback(() => {
		setMobileMenuOpen(false)
	}, [])

	return (
		<>
			<motion.header
				ref={headerRef}
				className={cn(
					"fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out border-b",
					isScrolled && "shadow-lg"
				)}
				style={{
					backgroundColor: 'rgba(10, 2, 3, 0.35)',
					backdropFilter: 'blur(0px)',
					WebkitBackdropFilter: 'blur(0px)',
					borderBottom: '1px solid rgba(215, 140, 25, 0.1)',
					boxShadow: '0 6px 30px rgba(10, 0, 0, 0)',
				}}
			>
				{/* Enhanced Vegas-Inspired Ambient Color Effect */}
				<motion.div
					className="absolute inset-0 pointer-events-none opacity-30"
					animate={{
						backgroundColor: currentBackgroundColor
					}}
					transition={{ duration: 3.5 }}
				/>

				{/* Enhanced Texture Overlay */}
				<div className="absolute inset-0 bg-[url('/pattern/luxury-casino-pattern.svg')] opacity-[0.035] mix-blend-overlay pointer-events-none"></div>

				{/* Rich Ambient Glow Effect */}
				<div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-amber-900/10 to-red-950/5"></div>

				{/* Premium Top Border Glow with Animation */}
				<motion.div
					className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
					animate={{
						opacity: [0.5, 0.8, 0.5],
						backgroundImage: [
							'linear-gradient(to right, transparent, rgba(245, 158, 11, 0.5), transparent)',
							'linear-gradient(to right, transparent, rgba(245, 158, 11, 0.7), transparent)',
							'linear-gradient(to right, transparent, rgba(245, 158, 11, 0.5), transparent)'
						]
					}}
					transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
				/>

				<div className="container flex items-center justify-between h-20 px-4 mx-auto sm:px-6 lg:px-8">
					{/* Logo */}
					<Logo />

					{/* Desktop Navigation */}
					<nav
						className="items-center hidden gap-1.5 lg:flex"
						role="navigation"
						aria-label="Main Navigation"
					>
						{navLinks.map(link =>
							link.children ? (
								<NavDropdown
									key={link.label}
									link={link}
									activeDropdown={activeDropdown}
									toggleDropdown={toggleDropdown}
									pathname={pathname}
								/>
							) : (
								<Link
									key={link.label}
									href={link.href ?? ''}
									className={cn(
										'px-4 py-2 text-base font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-500/80 relative overflow-hidden group rounded-md',
										pathname === link.href
											? 'text-amber-200'
											: 'text-gray-200 hover:text-amber-200'
									)}
									onClick={() => setActiveDropdown(null)}
								>
									<span className="relative z-10">{link.label}</span>

									{/* Enhanced Animated Underline for Hover and Active State */}
									<motion.div
										className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/80 to-amber-400/80"
										initial={false}
										animate={pathname === link.href ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
										whileHover={pathname !== link.href ? { scaleX: 1, opacity: 1 } : {}}
										transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
										style={{ originX: 0.5 }}
									/>

									{/* Subtle Vegas Spotlight Effect on Hover */}
									<motion.div
										className="absolute inset-0 opacity-0 bg-gradient-to-r from-amber-600/5 via-amber-400/10 to-amber-600/5"
										initial={{ opacity: 0 }}
										whileHover={{ opacity: 1 }}
										transition={{ duration: 0.3 }}
									/>
								</Link>
							)
						)}
					</nav>

					{/* Actions Section */}
					<div className="flex items-center gap-2 ml-auto lg:ml-0">
						{/* Theme Toggle - Desktop */}
						<div className="hidden sm:block">
							<ThemeToggle />
						</div>

						{/* Enhanced Notifications with Vegas-Appropriate Visual Cues */}
						<div className="relative">
							<NotificationsPanel />

							{/* Casino-Inspired Glow Effect Around Notifications */}
							<motion.div
								className="absolute inset-0 rounded-full bg-amber-500/10"
								animate={{
									opacity: [0, 0.8, 0],
									scale: [0.8, 1.3, 0.8]
								}}
								transition={{
									duration: 4,
									repeat: Infinity,
									ease: "easeInOut",
									repeatDelay: 5
								}}
							/>
						</div>

						{/* User Menu */}
						<UserMenu
							isLoggedIn={isLoggedIn}
							activeDropdown={activeDropdown}
							toggleDropdown={toggleDropdown}
							pathname={pathname}
						/>

						{/* Mobile Menu Button */}
						<div className="lg:hidden">
							<motion.div
								initial={false}
								animate={mobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
								transition={{ duration: 0.3, type: 'spring', stiffness: 350, damping: 25 }}
							>
								<Button
									variant="ghost"
									size="icon"
									className="ml-1 rounded-md text-amber-300 hover:text-amber-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
									onClick={toggleMobileMenu}
									aria-label={mobileMenuOpen ? "Close main menu" : "Open main menu"}
									aria-expanded={mobileMenuOpen}
									aria-controls="mobile-menu"
								>
									{mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
								</Button>
							</motion.div>
						</div>
					</div>
				</div>

				{/* Mobile Menu Render */}
				<MobileMenu
					isOpen={mobileMenuOpen}
					onClose={closeMobileMenu}
					links={navLinks}
					accountLinks={accountLinks}
					pathname={pathname}
					isLoggedIn={isLoggedIn}
					activeDropdown={activeDropdown}
					toggleDropdown={toggleDropdown}
				/>
			</motion.header>

			{/* Global Styles (Keep existing fonts if desired) */}
			<style>
				{`
				@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&display=swap');

				.cinzel-decorative-regular {
					font-family: 'Cinzel Decorative', serif;
				}
				`}
			</style>
		</>
	)
}

export default Header
