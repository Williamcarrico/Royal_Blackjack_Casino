'use client'

/** @jsxImportSource react */
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Bell, X, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/layout/button'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { GiDiamonds, GiCoins } from 'react-icons/gi'

interface Notification {
	id: number
	title: string
	message: string
	time: string
	isNew: boolean
	type?: 'bonus' | 'tournament' | 'promo' | 'system' | 'achievement'
}

// Create forwarded ref component first
const DialogComponent = React.forwardRef<
	HTMLDialogElement,
	React.DialogHTMLAttributes<HTMLDialogElement>
>((props, ref) => <dialog ref={ref} {...props} />)
DialogComponent.displayName = 'DialogComponent'

// Then create the motion component
const MotionDialog = motion.create(DialogComponent)

export function NotificationsPanel() {
	const [isOpen, setIsOpen] = useState(false)
	const [notifications, setNotifications] = useState<Notification[]>([
		{
			id: 1,
			title: 'Daily Bonus Ready!',
			message: 'Claim your 1,000 chip daily bonus now',
			time: 'Just now',
			isNew: true,
			type: 'bonus',
		},
		{
			id: 2,
			title: 'Weekend Tournament',
			message: 'Join our high-stakes tournament this weekend',
			time: '2 hours ago',
			isNew: true,
			type: 'tournament',
		},
		{
			id: 3,
			title: 'New Strategy Guide',
			message: 'Check out our updated blackjack strategy guide',
			time: 'Yesterday',
			isNew: false,
			type: 'system',
		},
		{
			id: 4,
			title: 'Weekly Promotion',
			message: 'Double chips on all deposits this weekend!',
			time: '2 days ago',
			isNew: false,
			type: 'promo',
		},
		{
			id: 5,
			title: 'Achievement Unlocked',
			message: 'Royal Flush: Win 5 blackjack hands in a row',
			time: '3 days ago',
			isNew: false,
			type: 'achievement',
		},
	])
	const panelRef = useRef<HTMLDialogElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const [bellHover, setBellHover] = useState(false)

	// Close panel when clicking outside
	useOnClickOutside(panelRef, (event: MouseEvent | TouchEvent) => {
		if (buttonRef.current?.contains(event.target as Node)) return
		setIsOpen(false)
	})

	// Handle escape key press
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				setIsOpen(false)
				buttonRef.current?.focus()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen])

	// Focus management
	useEffect(() => {
		if (isOpen) {
			const firstNotification = panelRef.current?.querySelector(
				'[data-notification]'
			) as HTMLElement
			if (firstNotification) {
				firstNotification.focus()
			}
		}
	}, [isOpen])

	// Animation variants
	const panelVariants = {
		hidden: { opacity: 0, y: 10, scale: 0.95 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				duration: 0.3,
				type: 'spring',
				stiffness: 400,
				damping: 30
			}
		},
		exit: {
			opacity: 0,
			y: 10,
			scale: 0.95,
			transition: {
				duration: 0.2
			}
		},
	}

	// Bell animation variants
	const bellVariants = {
		initial: { rotate: 0 },
		ring: {
			rotate: [0, 15, -15, 10, -10, 5, -5, 0],
			transition: { duration: 0.6, ease: "easeInOut" }
		},
		hover: {
			scale: 1.1,
			transition: { duration: 0.2 }
		}
	}

	// Notification dot pulse animation
	const dotVariants: Variants = {
		initial: { scale: 1, opacity: 0.9 },
		pulse: {
			scale: [1, 1.2, 1],
			opacity: [0.9, 1, 0.9],
			transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" as const }
		}
	}

	// Toggle panel
	const togglePanel = useCallback(() => {
		setIsOpen(prev => !prev)
	}, [])

	// Mark notification as read
	const markAsRead = useCallback((id: number) => {
		setNotifications(prev =>
			prev.map(notif => (notif.id === id ? { ...notif, isNew: false } : notif))
		)
	}, [])

	// Mark all as read
	const markAllAsRead = useCallback(() => {
		setNotifications(prev =>
			prev.map(notif => ({ ...notif, isNew: false }))
		)
	}, [])

	// Get notification icon based on type
	const getNotificationIcon = (type?: Notification['type']) => {
		switch (type) {
			case 'bonus':
				return <GiCoins className="w-5 h-5 text-yellow-400" />
			case 'tournament':
				return <GiDiamonds className="w-5 h-5 text-blue-400" />
			case 'promo':
				return <span className="w-5 h-5 text-green-400">%</span>
			case 'achievement':
				return <span className="w-5 h-5 text-purple-400">🏆</span>
			default:
				return <span className="w-5 h-5 text-gray-400">i</span>
		}
	}

	const hasNewNotifications = notifications.some(n => n.isNew)
	const newNotificationsCount = notifications.filter(n => n.isNew).length

	return (
		<div className="relative">
			<motion.div
				animate={hasNewNotifications && !isOpen ? { rotate: [0, 15, -15, 10, -10, 5, -5, 0] } : {}}
				transition={{
					repeat: hasNewNotifications && !isOpen ? Infinity : 0,
					repeatDelay: 5,
					duration: 0.6
				}}
			>
				<Button
					ref={buttonRef}
					variant="ghost"
					size="icon"
					onClick={togglePanel}
					onMouseEnter={() => setBellHover(true)}
					onMouseLeave={() => setBellHover(false)}
					className="relative text-amber-400 hover:text-amber-300 hover:bg-amber-900/20 focus-visible:ring-2 focus-visible:ring-amber-500/70"
					aria-label={
						hasNewNotifications
							? 'Notifications, ' + newNotificationsCount + ' unread'
							: 'Notifications'
					}
					aria-expanded={isOpen}
					aria-haspopup="true"
				>
					<motion.div
						variants={bellVariants}
						animate={bellHover ? "hover" : "initial"}
					>
						<Bell size={20} />
					</motion.div>
					{hasNewNotifications && (
						<motion.span
							variants={dotVariants}
							initial="initial"
							animate="pulse"
							className="absolute flex items-center justify-center w-4 h-4 text-xs font-semibold text-white bg-gradient-to-br from-red-500 to-red-700 rounded-full -top-1 -right-1 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
							aria-hidden="true"
						>
							{newNotificationsCount > 9 ? '9+' : newNotificationsCount}
						</motion.span>
					)}
				</Button>
			</motion.div>

			<AnimatePresence>
				{isOpen && (
					<MotionDialog
						ref={panelRef}
						variants={panelVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="absolute right-0 z-50 flex-col p-0 m-0 mt-2 overflow-hidden border rounded-md shadow-2xl w-96 bg-gradient-to-b from-black to-gray-900/95 border-amber-800/30 open:flex backdrop-blur-md"
						aria-label="Notifications panel"
						open
					>
						{/* Ambient texture overlay */}
						<div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

						{/* Header with glow effect */}
						<div className="relative p-4 border-b border-amber-900/30 bg-gradient-to-r from-amber-900/10 to-transparent">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text">Notifications</h3>
								{hasNewNotifications && (
									<Button
										variant="ghost"
										size="sm"
										onClick={markAllAsRead}
										className="flex items-center h-auto gap-1 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
									>
										<CheckCheck size={12} />
										<span>Mark all as read</span>
									</Button>
								)}
							</div>
							{/* Subtle glow line under header */}
							<div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
						</div>

						<ul className="overflow-y-auto max-h-[min(70vh,500px)] divide-y divide-amber-900/10">
							{notifications.length > 0 ? (
								notifications.map(notification => (
									<li key={notification.id}>
										<motion.div
											initial={{ opacity: 0, y: -5 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.2 }}
										>
											<button
												data-notification
												className={cn(
													'w-full text-left p-4 hover:bg-gradient-to-r hover:from-amber-900/20 hover:to-transparent focus:bg-amber-900/15 focus:outline-none transition-colors relative group',
													notification.isNew && 'bg-gradient-to-r from-amber-900/15 to-transparent'
												)}
												onClick={() => markAsRead(notification.id)}
											>
												<div className="flex">
													<div className="flex-shrink-0 mt-1 mr-3">
														{getNotificationIcon(notification.type)}
													</div>
													<div className="flex-1">
														<div className="flex items-start justify-between">
															<h4 className="font-medium transition-colors text-amber-300 group-hover:text-amber-200">
																{notification.title}
																{notification.isNew && <span className="sr-only"> (New)</span>}
															</h4>
															{notification.isNew && (
																<motion.span
																	variants={dotVariants}
																	initial="initial"
																	animate="pulse"
																	className="flex-shrink-0 ml-2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"
																	aria-hidden="true"
																/>
															)}
														</div>
														<p className="mt-1 text-sm text-gray-400 transition-colors group-hover:text-gray-300">
															{notification.message}
														</p>
														<span className="block mt-2 text-xs text-amber-500/70">
															{notification.time}
														</span>
													</div>
												</div>

												{/* Reveal animation effect */}
												<motion.div
													className="absolute inset-0 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"
													initial={false}
													whileHover={{
														opacity: 1,
														translateX: ['100%', '-100%'],
														transition: { duration: 1.5 }
													}}
												/>
											</button>
										</motion.div>
									</li>
								))
							) : (
								<li className="p-8 text-center">
									<p className="text-gray-400">No notifications</p>
								</li>
							)}
						</ul>

						{/* Footer with gradient background */}
						<div className="p-3 text-center border-t bg-gradient-to-t from-amber-900/15 to-transparent border-amber-900/20">
							<Link
								href="/notifications"
								className="text-sm transition-colors text-amber-400 hover:text-amber-300 focus:text-amber-200 focus:outline-none hover:underline"
								onClick={() => setIsOpen(false)}
							>
								View All Notifications
							</Link>
						</div>

						{/* Close button absolute positioned */}
						<Button
							variant="ghost"
							size="sm"
							className="absolute h-auto p-1 text-gray-500 top-2 right-2 hover:text-gray-300 hover:bg-amber-900/20"
							onClick={() => setIsOpen(false)}
							aria-label="Close notifications"
						>
							<X size={16} />
						</Button>
					</MotionDialog>
				)}
			</AnimatePresence>
		</div>
	)
}

export default NotificationsPanel
