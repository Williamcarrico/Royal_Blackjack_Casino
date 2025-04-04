'use client'

/** @jsxImportSource react */
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { Bell, X, CheckCheck, ChevronRight, MoreVertical, Settings, Archive } from 'lucide-react'
import { Button } from '@/components/ui/layout/button'
import { cn } from '@/lib/utils/utils'
import Link from 'next/link'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import {
	GiDiamonds,
	GiCoins,
	GiBallGlow,
	GiInfo,
	GiPerson,
	GiCrown,
	GiMoneyStack
} from 'react-icons/gi'
import { useNotifications } from '@/hooks/services/useNotifications'
import type { EnrichedNotification, NotificationType } from '@/types/notifications'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import '@/styles/notifications.css'

// Create forwarded ref component first
const DialogComponent = React.forwardRef<
	HTMLDialogElement,
	React.DialogHTMLAttributes<HTMLDialogElement>
>((props, ref) => <dialog ref={ref} {...props} />)
DialogComponent.displayName = 'DialogComponent'

// Then create the motion component
const MotionDialog = motion.create(DialogComponent)

// NotificationItem component for individual notifications
interface NotificationItemProps {
	notification: EnrichedNotification
	onMarkAsRead: (id: string) => void
	onDelete: (id: string) => void
	onArchive: (id: string) => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({
	notification,
	onMarkAsRead,
	onDelete,
	onArchive
}) => {
	// Animation variants
	const revealAnimation = {
		hidden: { opacity: 0, x: -5 },
		visible: { opacity: 1, x: 0 },
		exit: { opacity: 0, x: -5 }
	};

	const handleClick = () => {
		if (notification.status === 'unread') {
			onMarkAsRead(notification.id);
		}

		// If notification has an action URL and is not disabled, navigate
		if (notification.actionUrl) {
			// Programmatic navigation could happen here if needed
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	};

	return (
		<motion.div
			initial="hidden"
			animate="visible"
			exit="exit"
			variants={revealAnimation}
			transition={{ duration: 0.2 }}
			className="relative group"
		>
			<div
				className={cn(
					'w-full text-left p-4 hover:bg-gradient-to-r hover:from-amber-900/20 hover:to-transparent focus:bg-amber-900/15 focus:outline-none transition-colors relative cursor-pointer',
					notification.isNew && 'bg-gradient-to-r from-amber-900/15 to-transparent',
					notification.animationVariant === 'premium' && 'premium-animation',
					notification.animationVariant === 'highlight' && 'border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
					notification.animationVariant === 'promotional' && 'border border-green-500/50',
					notification.animationVariant === 'important' && 'border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
				)}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				data-notification
				role="button"
				tabIndex={0}
				aria-label={`${notification.title} notification ${notification.isNew ? ' (New)' : ''}`}
			>
				<div className="flex">
					<div className="flex-shrink-0 mt-1 mr-3">
						{notification.iconComponent}
					</div>
					<div className="flex-1 min-w-0"> {/* Prevent overflow with min-width */}
						<div className="flex items-start justify-between">
							<h4 className="font-medium truncate transition-colors text-amber-300 group-hover:text-amber-200">
								{notification.title}
								{notification.isNew && <span className="sr-only"> (New)</span>}
							</h4>
							{notification.isNew && (
								<motion.span
									initial={{ scale: 1, opacity: 0.9 }}
									animate={{
										scale: [1, 1.2, 1],
										opacity: [0.9, 1, 0.9]
									}}
									transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
									className="flex-shrink-0 ml-2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"
									aria-hidden="true"
								/>
							)}
						</div>
						<p className="mt-1 text-sm text-gray-400 transition-colors group-hover:text-gray-300">
							{notification.message}
						</p>
						<div className="flex items-center justify-between mt-2">
							<span className="text-xs text-amber-500/70">
								{notification.timeSince}
							</span>

							{/* Action button */}
							{notification.actionLabel && (
								<Button
									variant="link"
									size="sm"
									className="h-auto px-0 py-0 text-xs text-amber-400 hover:text-amber-300"
									onClick={(e) => {
										e.stopPropagation();
										// Handle action
									}}
								>
									{notification.actionLabel}
									<ChevronRight className="w-3 h-3 ml-1" />
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Premium animation overlay for special notifications */}
				{notification.animationVariant === 'premium' && (
					<motion.div
						className="absolute inset-0 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"
						initial={false}
						whileHover={{
							opacity: 1,
							translateX: ['100%', '-100%'],
							transition: { duration: 1.5 }
						}}
					/>
				)}
			</div>

			{/* Actions dropdown menu - Moved outside the button */}
			<div
				className="absolute transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100"
			>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="w-6 h-6 p-0 text-gray-400 hover:text-gray-300 hover:bg-amber-900/20"
							onClick={(e) => e.stopPropagation()}
						>
							<MoreVertical className="w-4 h-4" />
							<span className="sr-only">Notification actions</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="bg-gradient-to-b from-[#0a0605]/95 to-[#100a0a]/98 border-amber-800/40 text-xs"
					>
						{notification.isNew && (
							<DropdownMenuItem
								className="flex items-center gap-2 cursor-pointer text-amber-200 hover:text-amber-100"
								onClick={() => onMarkAsRead(notification.id)}
							>
								<CheckCheck className="w-3.5 h-3.5" />
								Mark as read
							</DropdownMenuItem>
						)}

						<DropdownMenuItem
							className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-gray-200"
							onClick={() => onArchive(notification.id)}
						>
							<Archive className="w-3.5 h-3.5" />
							Archive
						</DropdownMenuItem>

						<DropdownMenuItem
							className="flex items-center gap-2 text-red-400 cursor-pointer hover:text-red-300"
							onClick={() => onDelete(notification.id)}
						>
							<X className="w-3.5 h-3.5" />
							Remove
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</motion.div>
	);
};

interface NotificationFilterButtonProps {
	type: NotificationType | 'all';
	isActive: boolean;
	count: number;
	onClick: () => void;
}

const NotificationFilterButton: React.FC<NotificationFilterButtonProps> = ({
	type,
	isActive,
	count,
	onClick
}) => {
	// Get the icon and label based on the type
	const getIconAndLabel = () => {
		switch (type) {
			case 'bonus':
				return { icon: <GiCoins className="w-4 h-4 text-yellow-400" />, label: 'Bonuses' };
			case 'tournament':
				return { icon: <GiDiamonds className="w-4 h-4 text-blue-400" />, label: 'Tournaments' };
			case 'promo':
				return { icon: <span className="w-4 h-4 text-green-400">%</span>, label: 'Promos' };
			case 'achievement':
				return { icon: <span className="w-4 h-4 text-purple-400">🏆</span>, label: 'Achievements' };
			case 'game':
				return { icon: <GiBallGlow className="w-4 h-4 text-cyan-400" />, label: 'Games' };
			case 'system':
				return { icon: <GiInfo className="w-4 h-4 text-gray-400" />, label: 'System' };
			case 'account':
				return { icon: <GiPerson className="w-4 h-4 text-orange-400" />, label: 'Account' };
			case 'vip':
				return { icon: <GiCrown className="w-4 h-4 text-amber-400" />, label: 'VIP' };
			case 'reward':
				return { icon: <GiMoneyStack className="w-4 h-4 text-emerald-400" />, label: 'Rewards' };
			case 'all':
			default:
				return { icon: <Bell className="w-4 h-4 text-amber-400" />, label: 'All' };
		}
	};

	const { icon, label } = getIconAndLabel();

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						className={cn(
							"px-2 py-1.5 rounded-md relative transition-all",
							isActive
								? "bg-amber-900/40 text-amber-200"
								: "text-gray-400 hover:text-amber-300 hover:bg-amber-900/20"
						)}
						onClick={onClick}
					>
						<div className="flex items-center gap-1.5">
							{icon}
							<span className="text-xs font-medium">{label}</span>
							{count > 0 && (
								<span className="w-4 h-4 flex items-center justify-center text-[10px] rounded-full bg-amber-800/60 text-amber-200">
									{count > 9 ? '9+' : count}
								</span>
							)}
						</div>
					</button>
				</TooltipTrigger>
				<TooltipContent
					className="text-xs bg-black/90 border-amber-800/50 text-amber-200"
					side="bottom"
				>
					{label} notifications
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export function NotificationsPanel() {
	// Use our custom hook for notifications
	const {
		notifications,
		unseenCount,
		markAsRead,
		markAllAsRead,
		deleteNotification,
		archiveNotification,
		filterByType
	} = useNotifications();

	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState('all');
	const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');
	const panelRef = useRef<HTMLDialogElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [bellHover, setBellHover] = useState(false);

	// Close panel when clicking outside
	useOnClickOutside(panelRef, (event: MouseEvent | TouchEvent) => {
		if (buttonRef.current?.contains(event.target as Node)) return;
		setIsOpen(false);
	});

	// Handle escape key press
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				setIsOpen(false);
				buttonRef.current?.focus();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen]);

	// Focus management
	useEffect(() => {
		if (isOpen) {
			const firstNotification = panelRef.current?.querySelector(
				'[data-notification]'
			) as HTMLElement;
			if (firstNotification) {
				firstNotification.focus();
			}
		}
	}, [isOpen]);

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
	};

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
	};

	// Notification dot pulse animation
	const dotVariants: Variants = {
		initial: { scale: 1, opacity: 0.9 },
		pulse: {
			scale: [1, 1.2, 1],
			opacity: [0.9, 1, 0.9],
			transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" as const }
		}
	};

	// Toggle panel
	const togglePanel = useCallback(() => {
		setIsOpen(prev => !prev);
	}, []);

	// Filter notifications based on active filter
	const filteredNotifications = activeFilter === 'all'
		? notifications
		: filterByType(activeFilter);

	// Filter notifications based on active tab
	const getTabNotifications = () => {
		switch (activeTab) {
			case 'unread':
				return filteredNotifications.filter(n => n.isNew);
			case 'all':
			default:
				return filteredNotifications;
		}
	};

	const displayedNotifications = getTabNotifications();

	// Get counts for each type for filter badges
	const getCounts = () => {
		const types: (NotificationType | 'all')[] = ['all', 'bonus', 'tournament', 'promo', 'achievement', 'game', 'system', 'vip', 'reward'];

		return types.reduce((acc, type) => {
			if (type === 'all') {
				acc[type] = notifications.filter(n => n.isNew).length;
			} else {
				acc[type] = filterByType(type).filter(n => n.isNew).length;
			}
			return acc;
		}, {} as Record<NotificationType | 'all', number>);
	};

	const typeCounts = getCounts();

	return (
		<div className="relative">
			<motion.div
				animate={unseenCount > 0 && !isOpen ? { rotate: [0, 15, -15, 10, -10, 5, -5, 0] } : {}}
				transition={{
					repeat: unseenCount > 0 && !isOpen ? Infinity : 0,
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
						unseenCount > 0
							? `Notifications, ${unseenCount} unread`
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
					{unseenCount > 0 && (
						<motion.span
							variants={dotVariants}
							initial="initial"
							animate="pulse"
							className="absolute flex items-center justify-center w-4 h-4 text-xs font-semibold text-white bg-gradient-to-br from-red-500 to-red-700 rounded-full -top-1 -right-1 shadow-[0_0_5px_rgba(239,68,68,0.5)]"
							aria-hidden="true"
						>
							{unseenCount > 9 ? '9+' : unseenCount}
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
								{unseenCount > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => markAllAsRead()}
										className="flex items-center h-auto gap-1 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
									>
										<CheckCheck size={12} />
										<span>Mark all as read</span>
									</Button>
								)}
							</div>

							{/* Tabs */}
							<div className="mt-2">
								<Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
									<TabsList className="grid w-full grid-cols-2 mb-1 bg-black/40">
										<TabsTrigger
											value="all"
											className={cn(
												"text-xs text-gray-400 data-[state=active]:text-amber-300 data-[state=active]:bg-amber-900/30",
											)}
										>
											All
										</TabsTrigger>
										<TabsTrigger
											value="unread"
											className={cn(
												"text-xs text-gray-400 data-[state=active]:text-amber-300 data-[state=active]:bg-amber-900/30",
											)}
										>
											Unread
											{unseenCount > 0 && (
												<span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-800/70 text-amber-200">
													{unseenCount}
												</span>
											)}
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>

							{/* Filter scrollable row */}
							<div className="flex items-center px-4 mt-3 -mx-4 overflow-x-auto hide-scrollbar">
								<div className="flex items-center py-1 space-x-1">
									{['all', 'bonus', 'tournament', 'promo', 'achievement', 'vip', 'system'].map((type) => (
										<NotificationFilterButton
											key={type}
											type={type as NotificationType | 'all'}
											isActive={activeFilter === type}
											count={typeCounts[type as NotificationType | 'all']}
											onClick={() => setActiveFilter(type as NotificationType | 'all')}
										/>
									))}
								</div>
							</div>

							{/* Subtle glow line under header */}
							<div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
						</div>

						<ul className="overflow-y-auto max-h-[min(70vh,500px)] divide-y divide-amber-900/10">
							{displayedNotifications.length > 0 ? (
								displayedNotifications.map(notification => (
									<li key={notification.id}>
										<NotificationItem
											notification={notification}
											onMarkAsRead={markAsRead}
											onDelete={deleteNotification}
											onArchive={archiveNotification}
										/>
									</li>
								))
							) : (
								<li className="p-8 text-center">
									<p className="text-gray-400">No notifications</p>
								</li>
							)}
						</ul>

						{/* Footer with gradient background */}
						<div className="flex items-center justify-between p-3 text-center border-t bg-gradient-to-t from-amber-900/15 to-transparent border-amber-900/20">
							<Link
								href="/notifications"
								className="text-sm transition-colors text-amber-400 hover:text-amber-300 focus:text-amber-200 focus:outline-none hover:underline"
								onClick={() => setIsOpen(false)}
							>
								View All
							</Link>

							<Button
								variant="ghost"
								size="sm"
								className="flex items-center h-6 gap-1 px-2 py-1 text-xs text-gray-400 hover:text-amber-300 hover:bg-amber-900/20"
								onClick={() => {
									// Navigate to notification settings
									setIsOpen(false);
								}}
							>
								<Settings size={12} />
								<span>Settings</span>
							</Button>
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