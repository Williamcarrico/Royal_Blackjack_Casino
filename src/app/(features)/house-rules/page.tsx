// app/house-rules/page.tsx
'use client'

/// <reference types="react" />
import * as React from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PDFDownloadButton } from '@/components/ui/pdf-download-button'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import PlayingCard, { type Suit, type Rank } from '@/components/game/card/Card'
import {
	InfoIcon,
	FilterIcon,
	ArrowUpIcon,
	BookOpenIcon,
	DollarSignIcon,
	UserIcon,
	ShieldIcon,
	SearchIcon,
	ChevronDownIcon,
	TrophyIcon,
	HelpCircleIcon,
	LayoutGridIcon,
	ListIcon,
	SettingsIcon,
	MapIcon,
	GlobeIcon,
	HeartIcon,
	DiamondIcon,
	ClubIcon,
	SpadeIcon,
	LayersIcon,
	BookmarkIcon,
	StarIcon,
	ClockIcon,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils/utils'

// Enhanced types for rules data with support for blackjack variants
interface Rule {
	id: string
	title: string
	description: string
	category: 'basic' | 'payout' | 'dealer' | 'player' | 'advanced' | 'etiquette'
	details?: string[]
	variant?: BlackjackVariant
	importance?: 'essential' | 'important' | 'optional'
	source?: string
}

// Blackjack variants
type BlackjackVariant =
	| 'classic'
	| 'european'
	| 'vegas'
	| 'atlantic-city'
	| 'pontoon'
	| 'spanish-21'
	| 'double-exposure'
	| 'blackjack-switch'
	| 'tournament'
	| 'perfect-pairs'
	| 'progressive'

// Enhancement: Animation variants for framer-motion with added effects
const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.075,
			delayChildren: 0.1,
		},
	},
}

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring',
			damping: 15,
			stiffness: 200
		}
	},
}


// Category definitions with enhanced metadata
interface CategoryMetadata {
	name: string
	description: string
	icon: React.ReactNode
	color: string
	bgColor: string
	borderColor: string
	textColor: string
}

const categoryMetadata: Record<Rule['category'] | 'all', CategoryMetadata> = {
	all: {
		name: 'All Rules',
		description: 'Complete list of blackjack rules and guidelines',
		icon: <InfoIcon className="w-5 h-5" />,
		color: 'text-indigo-400',
		bgColor: 'bg-indigo-900/20',
		borderColor: 'border-indigo-800/30',
		textColor: 'text-indigo-300'
	},
	basic: {
		name: 'Basic Rules',
		description: 'Core rules and foundation of blackjack',
		icon: <BookOpenIcon className="w-5 h-5" />,
		color: 'text-blue-400',
		bgColor: 'bg-blue-900/20',
		borderColor: 'border-blue-800/30',
		textColor: 'text-blue-300'
	},
	payout: {
		name: 'Payouts',
		description: 'Payout structures and betting rewards',
		icon: <DollarSignIcon className="w-5 h-5" />,
		color: 'text-green-400',
		bgColor: 'bg-green-900/20',
		borderColor: 'border-green-800/30',
		textColor: 'text-green-300'
	},
	dealer: {
		name: 'Dealer Rules',
		description: 'Rules governing dealer actions and decisions',
		icon: <ShieldIcon className="w-5 h-5" />,
		color: 'text-purple-400',
		bgColor: 'bg-purple-900/20',
		borderColor: 'border-purple-800/30',
		textColor: 'text-purple-300'
	},
	player: {
		name: 'Player Rules',
		description: 'Player options, decisions, and strategies',
		icon: <UserIcon className="w-5 h-5" />,
		color: 'text-amber-400',
		bgColor: 'bg-amber-900/20',
		borderColor: 'border-amber-800/30',
		textColor: 'text-amber-300'
	},
	advanced: {
		name: 'Advanced Rules',
		description: 'Complex rules, variants, and edge cases',
		icon: <SettingsIcon className="w-5 h-5" />,
		color: 'text-red-400',
		bgColor: 'bg-red-900/20',
		borderColor: 'border-red-800/30',
		textColor: 'text-red-300'
	},
	etiquette: {
		name: 'Etiquette',
		description: 'Casino etiquette and table manners',
		icon: <BookmarkIcon className="w-5 h-5" />,
		color: 'text-teal-400',
		bgColor: 'bg-teal-900/20',
		borderColor: 'border-teal-800/30',
		textColor: 'text-teal-300'
	}
}

// Enhanced expandable rule card component with advanced animation effects
const ExpandableRuleCard = ({ rule }: { rule: Rule }) => {
	const [isExpanded, setIsExpanded] = useState(false)
	const [isHovered, setIsHovered] = useState(false)
	const category = categoryMetadata[rule.category]

	return (
		<motion.div
			variants={itemVariants}
			className={cn(
				'relative overflow-hidden border rounded-lg',
				'backdrop-blur-sm bg-gray-800/60 border-gray-700',
				'transition-all duration-300 group',
				isHovered && 'border-gray-500 shadow-lg',
				isExpanded && 'shadow-xl'
			)}
			onHoverStart={() => setIsHovered(true)}
			onHoverEnd={() => setIsHovered(false)}
		>
			{/* Gradient accent based on category */}
			<div className={cn(
				'absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300',
				`bg-gradient-to-br from-transparent via-transparent to-${category.borderColor.split('-')[1]}-600/30`
			)} />

			{/* Importance indicator - subtle visual cue */}
			{rule.importance && (
				<div className={cn(
					'absolute top-0 left-0 w-1 h-full',
					rule.importance === 'essential' && 'bg-red-500',
					rule.importance === 'important' && 'bg-amber-500',
					rule.importance === 'optional' && 'bg-blue-500'
				)} />
			)}

			<div className="relative z-10 w-full p-4">
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-medium text-white">{rule.title}</h3>

						{/* Contextual help tooltip for more information */}
						{rule.source && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div>
											<HelpCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
										</div>
									</TooltipTrigger>
									<TooltipContent side="top" className="max-w-sm">
										<p className="text-xs">Source: {rule.source}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>

					<div className="flex items-center gap-2">
						{/* Variant badge - only show when a specific variant exists */}
						{rule.variant && rule.variant !== 'classic' && (
							<Badge className="text-xs text-gray-300 bg-gray-700/70 hover:bg-gray-700">
								{rule.variant.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
							</Badge>
						)}

						{/* Category badge with matching color scheme */}
						<Badge
							className={cn(
								category.bgColor,
								category.textColor
							)}
						>
							{category.name.replace(' Rules', '')}
						</Badge>
					</div>
				</div>

				<p className="text-sm text-gray-300">{rule.description}</p>

				{rule.details && rule.details.length > 0 && (
					<div className="flex items-center gap-1 mt-3">
						<Button
							variant="link"
							className={cn(
								"h-auto p-0 text-amber-400 hover:text-amber-300",
								"flex items-center gap-2 text-sm"
							)}
							onClick={() => setIsExpanded(!isExpanded)}
							aria-expanded={isExpanded ? 'true' : 'false'}
							aria-controls={`details-${rule.id}`}
						>
							{isExpanded ? 'Hide details' : 'Show details'}
							<motion.div
								animate={{ rotate: isExpanded ? 180 : 0 }}
								transition={{ duration: 0.3 }}
							>
								<ChevronDownIcon className="w-4 h-4" />
							</motion.div>
						</Button>
					</div>
				)}
			</div>

			<AnimatePresence>
				{isExpanded && rule.details && (
					<motion.div
						id={`details-${rule.id}`}
						initial={{ height: 0, opacity: 0 }}
						animate={{
							height: 'auto',
							opacity: 1,
							transition: {
								height: {
									duration: 0.3,
								},
								opacity: {
									duration: 0.3,
									delay: 0.1
								}
							}
						}}
						exit={{
							height: 0,
							opacity: 0,
							transition: {
								height: {
									duration: 0.3,
								},
								opacity: {
									duration: 0.2,
								}
							}
						}}
						className="px-4 pb-4"
					>
						<Separator className="my-3 bg-gray-700/50" />
						<ul className="pl-5 mt-2 space-y-2 text-sm text-gray-300">
							{rule.details.map((detail, idx) => (
								<motion.li
									key={`${rule.id}-detail-${idx}-${detail.substring(0, 10).replace(/\s/g, '')}`}
									className="list-disc"
									initial={{ opacity: 0, x: -5 }}
									animate={{
										opacity: 1,
										x: 0,
										transition: {
											delay: idx * 0.05,
											duration: 0.3
										}
									}}
								>
									{detail}
								</motion.li>
							))}
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

// Enhanced comprehensive rules data
const rules: Rule[] = [
	{
		id: 'basic-1',
		title: 'Game Objective',
		description: "Beat the dealer's hand without going over 21.",
		category: 'basic',
		importance: 'essential',
		details: [
			'Cards 2-10 are worth face value',
			'Face cards (J, Q, K) are worth 10 points',
			'Aces can be worth 1 or 11 points',
			"Player wins if their hand is closer to 21 than the dealer's",
			"If both player and dealer have the same total, it's a push (tie)",
			"If player goes over 21, they bust and lose their bet regardless of dealer's hand"
		],
		source: 'Hoyle\'s Rules of Games'
	},
	{
		id: 'basic-2',
		title: 'Card Values',
		description: 'Understanding how cards are valued in Blackjack.',
		category: 'basic',
		importance: 'essential',
		details: [
			'Number cards (2-10) count as their face value',
			'Face cards (Jack, Queen, King) count as 10',
			'Aces count as either 1 or 11, whichever benefits the hand more',
			'A hand with an Ace counted as 11 is called a "soft" hand',
			'When an Ace must be counted as 1 to avoid busting, the hand becomes "hard"',
			'Suits have no significance in standard Blackjack'
		]
	},
	{
		id: 'basic-3',
		title: 'Game Flow',
		description: 'The step-by-step process of a Blackjack hand.',
		category: 'basic',
		importance: 'essential',
		details: [
			'Players place initial bets',
			'Dealer gives each player two cards face up',
			'Dealer takes two cards, one face up and one face down',
			'Players take turns deciding whether to hit, stand, double down, split, or surrender',
			'After all players act, dealer reveals their face-down card',
			'Dealer must hit until reaching at least 17 (specific rules may vary)',
			'Payouts are made based on hand results'
		]
	},
	{
		id: 'payout-1',
		title: 'Blackjack Payout',
		description: 'Natural blackjack pays 3:2 on standard tables.',
		category: 'payout',
		importance: 'important',
		details: [
			'A blackjack is an ace with a 10, J, Q or K as first two cards',
			"If dealer also has blackjack, it's a push (tie)",
			'Insurance pays 2:1 when dealer has blackjack',
			'Some casinos offer reduced 6:5 or even 1:1 payouts on blackjack (avoid these tables)',
			'Blackjack beats any other 21-point hand, including a 21 made with 3+ cards'
		],
		source: 'Casino Player Magazine'
	},
	{
		id: 'payout-2',
		title: 'Standard Payouts',
		description: 'Payouts for regular wins and special bets.',
		category: 'payout',
		details: [
			'Regular wins pay 1:1 (even money)',
			'Blackjack typically pays 3:2',
			'Insurance pays 2:1',
			'Five-card Charlie pays 2:1 (where offered)',
			'Perfect Pairs side bet payouts vary by casino',
			"21+3 side bet (player's two cards plus dealer's up card) pays based on poker hands"
		]
	},
	{
		id: 'payout-3',
		title: 'European Payouts',
		description: 'Payouts specific to European Blackjack.',
		category: 'payout',
		variant: 'european',
		details: [
			'Regular wins pay 1:1 (even money)',
			'Blackjack pays 3:2',
			'No insurance or dealer peek in classic European rules',
			'If dealer draws to blackjack after player doubles or splits, player loses only original bet',
			'Some casinos offer "early surrender" where player can surrender before dealer checks for blackjack'
		]
	},
	{
		id: 'dealer-1',
		title: 'Dealer Rules',
		description: 'Standard dealing procedures and requirements.',
		category: 'dealer',
		importance: 'important',
		details: [
			'Dealer stands on hard 17 or higher',
			'Dealer hits on 16 or lower',
			'Some variants require dealer to hit on soft 17 (A-6)',
			'Dealer must follow these rules - no choices',
			'Dealer checks for blackjack if their up card is an Ace or 10-value card',
			'When dealer has blackjack, hand ends immediately and all bets lose except for player blackjacks (push)'
		]
	},
	{
		id: 'dealer-2',
		title: 'Soft 17 Rule',
		description: 'Variations in how dealers play a soft 17.',
		category: 'dealer',
		details: [
			'In most casinos, dealers must stand on any 17 (hard or soft)',
			'Some casinos require dealers to hit on soft 17 (A-6)',
			'The "H17" rule (hit on soft 17) gives the house an additional 0.2% edge',
			'Vegas Strip rules typically use "S17" (stand on soft 17)',
			'Atlantic City rules often use "H17" (hit on soft 17)',
			'Players should check the table rules before playing'
		]
	},
	{
		id: 'dealer-3',
		title: 'Dealer Peek',
		description: 'When and how dealers check for blackjack.',
		category: 'dealer',
		details: [
			'In American rules, dealer peeks for blackjack when showing an Ace or 10-value card',
			'In European rules, dealer does not peek for blackjack',
			'Dealer peek prevents players from losing additional bets when dealer has blackjack',
			'In no-peek games, players may lose split or double bets when dealer reveals blackjack',
			'Electronic peek devices are often used in modern casinos for security'
		]
	},
	{
		id: 'player-1',
		title: 'Splitting Pairs',
		description: 'When and how to split pairs into separate hands.',
		category: 'player',
		importance: 'important',
		details: [
			'Split identical pairs by placing a second bet equal to the first',
			'Each split card becomes the first card of a new hand',
			'Most casinos allow re-splitting up to 3 or 4 hands total',
			'Split aces usually receive only one card each',
			'Ten-value cards can be split even if not identical (e.g., K-Q)',
			'Each split hand is played independently',
			'Some casinos allow doubling after splitting'
		]
	},
	{
		id: 'player-2',
		title: 'Doubling Down',
		description: 'Doubling your bet in favorable situations.',
		category: 'player',
		importance: 'important',
		details: [
			'Double your bet in exchange for receiving exactly one more card',
			'Most casinos allow doubling on any first two cards',
			'Some restrict doubling to hands totaling 9, 10, or 11',
			'Doubling down on soft hands can be profitable in specific situations',
			'Many casinos allow doubling after splitting pairs',
			'Cannot double down after hitting'
		]
	},
	{
		id: 'player-3',
		title: 'Surrender Option',
		description: 'When to forfeit your hand and save half your bet.',
		category: 'player',
		details: [
			'Surrender forfeits half your bet and ends your hand immediately',
			'Late surrender: allowed after dealer checks for blackjack',
			'Early surrender: allowed before dealer checks for blackjack (rare)',
			'Best used with hard 15-16 against dealer 9, 10, or Ace',
			'Not offered at all tables - check rules before playing',
			'Signal surrender by drawing an imaginary line behind your bet'
		]
	},
	{
		id: 'player-4',
		title: 'Insurance Bets',
		description: 'Protection against dealer blackjack when an Ace is showing.',
		category: 'player',
		details: [
			'Available when dealer shows an Ace',
			'Insurance costs up to half your original bet',
			'Pays 2:1 if dealer has blackjack',
			'Not recommended for basic strategy players (negative expected value)',
			'Can be profitable for card counters who track 10-value concentration',
			'Even money option for player blackjack is mathematically equivalent to taking insurance'
		]
	},
	{
		id: 'advanced-1',
		title: 'Spanish 21 Rules',
		description: 'Special rules for the Spanish 21 variant.',
		category: 'advanced',
		variant: 'spanish-21',
		details: [
			'Played with Spanish decks (standard decks with all 10s removed)',
			'Player blackjack always wins, even against dealer blackjack',
			'Player 21 always wins, even against dealer 21',
			'Late surrender allowed, including after doubling (unusual)',
			'Bonus payouts for specific 21 combinations (5-card 21, 6-card 21, etc.)',
			'Player can double down on any number of cards',
			'Match the Dealer side bet offers additional win opportunities'
		],
		source: 'Spanish 21 Dealer Rules'
	},
	{
		id: 'advanced-2',
		title: 'Double Exposure',
		description: 'Variant where both dealer cards are face up.',
		category: 'advanced',
		variant: 'double-exposure',
		details: [
			'Both dealer cards are dealt face up',
			'Blackjack typically pays only 1:1 instead of 3:2',
			'Dealer wins all ties except on blackjack',
			'Restrictions on doubling and splitting to offset player advantage',
			'No insurance offered (unnecessary since both cards are visible)',
			'Despite seeing both dealer cards, house edge remains similar to regular blackjack'
		]
	},
	{
		id: 'advanced-3',
		title: 'Tournament Rules',
		description: 'Special rules for blackjack tournaments.',
		category: 'advanced',
		variant: 'tournament',
		details: [
			'Players compete against each other, not just the dealer',
			'Each round has a set number of hands with elimination of lowest chip stacks',
			'Final table determines the winner',
			'Strategic betting becomes critical, sometimes contradicting basic strategy',
			'Some tournaments have buy-back or wild card rounds',
			'Final decisions often involve analyzing opponent chip stacks',
			'Tournament-specific strategies may differ dramatically from regular play'
		]
	},
	{
		id: 'etiquette-1',
		title: 'Table Etiquette',
		description: 'Proper behavior and protocol at the blackjack table.',
		category: 'etiquette',
		importance: 'optional',
		details: [
			'Wait for a space to open or for the dealer to invite you to join',
			'Place cash on the table for the dealer to exchange for chips',
			'Never hand cash directly to the dealer',
			"Don't touch your bets once cards are dealt",
			'Use hand signals for hit (tap table) and stand (wave hand horizontally)',
			'Be mindful of other players – avoid controversial advice or criticism',
			'Tip the dealer occasionally (especially after winning streaks)'
		]
	},
	{
		id: 'etiquette-2',
		title: 'Hand Signals',
		description: 'Standard hand signals used to communicate with the dealer.',
		category: 'etiquette',
		details: [
			'Hit: Tap the table with your finger',
			'Stand: Wave your hand horizontally over your cards',
			'Double Down: Place additional chips next to original bet and hold up one finger',
			'Split: Place additional chips next to original bet and form a "V" with two fingers',
			'Surrender: Draw an imaginary line behind your bet',
			'Always use hand signals even when announcing your decision verbally'
		]
	}
]

// Category icons and colors for UI

// Interactive Blackjack Strategy Matrix component
const BlackjackStrategyMatrix = () => {
	const [activeMatrix, setActiveMatrix] = useState<'hard' | 'soft' | 'pairs'>('hard')
	const [showTooltips, setShowTooltips] = useState(true)

	// Define dealer up cards and player hands
	const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']

	// Hand values for different matrices
	const hardHands = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17+']
	const softHands = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9']
	const pairHands = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A']

	// Strategy actions
	type Action = 'H' | 'S' | 'D' | 'P' | 'DS' | 'SU' | 'DSU'

	// Define action colors and labels
	const actionData: Record<Action, { color: string, label: string, description: string }> = {
		'H': { color: 'bg-red-600/80', label: 'H', description: 'Hit' },
		'S': { color: 'bg-green-600/80', label: 'S', description: 'Stand' },
		'D': { color: 'bg-yellow-500/80', label: 'D', description: 'Double if allowed, otherwise Hit' },
		'DS': { color: 'bg-yellow-700/80', label: 'DS', description: 'Double if allowed, otherwise Stand' },
		'P': { color: 'bg-blue-500/80', label: 'P', description: 'Split' },
		'SU': { color: 'bg-purple-500/80', label: 'SU', description: 'Surrender if allowed, otherwise Hit' },
		'DSU': { color: 'bg-purple-700/80', label: 'DSU', description: 'Double if allowed, Surrender if not allowed, otherwise Hit' }
	}

	// Define strategy matrices
	const hardMatrix: Record<string, Record<string, Action>> = {
		'8': { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'9': { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'10': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
		'11': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'D', 'A': 'H' },
		'12': { '2': 'H', '3': 'H', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'13': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'14': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'15': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'SU', 'A': 'H' },
		'16': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'SU', '10': 'SU', 'A': 'SU' },
		'17+': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' }
	}

	const softMatrix: Record<string, Record<string, Action>> = {
		'A,2': { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'A,3': { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'A,4': { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'A,5': { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'A,6': { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'A,7': { '2': 'DS', '3': 'DS', '4': 'DS', '5': 'DS', '6': 'DS', '7': 'S', '8': 'S', '9': 'H', '10': 'H', 'A': 'H' },
		'A,8': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'DS', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
		'A,9': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' }
	}

	const pairMatrix: Record<string, Record<string, Action>> = {
		'2,2': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'3,3': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'4,4': { '2': 'H', '3': 'H', '4': 'H', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'5,5': { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
		'6,6': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'7,7': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
		'8,8': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
		'9,9': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'S', '8': 'P', '9': 'P', '10': 'S', 'A': 'S' },
		'10,10': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
		'A,A': { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' }
	}

	// Get current matrix based on selection
	const getCurrentMatrix = () => {
		switch (activeMatrix) {
			case 'hard': return { matrix: hardMatrix, hands: hardHands }
			case 'soft': return { matrix: softMatrix, hands: softHands }
			case 'pairs': return { matrix: pairMatrix, hands: pairHands }
			default: return { matrix: hardMatrix, hands: hardHands }
		}
	}

	const { matrix, hands } = getCurrentMatrix()

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h3 className="text-xl font-semibold text-white">Interactive Strategy Chart</h3>
					<p className="text-sm text-gray-400">Hover over any cell to see detailed advice</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="flex items-center gap-2">
						<label htmlFor="toggle-tooltips" className="text-xs text-gray-300">Show Tooltips</label>
						<Switch
							id="toggle-tooltips"
							checked={showTooltips}
							onCheckedChange={setShowTooltips}
							className="data-[state=checked]:bg-amber-600"
						/>
					</div>

					<TabsList className="bg-gray-800 border border-gray-700">
						<TabsTrigger
							value="hard"
							className={cn("data-[state=active]:bg-gray-700", activeMatrix === 'hard' && 'bg-gray-700')}
							onClick={() => setActiveMatrix('hard')}
						>
							Hard Hands
						</TabsTrigger>
						<TabsTrigger
							value="soft"
							className={cn("data-[state=active]:bg-gray-700", activeMatrix === 'soft' && 'bg-gray-700')}
							onClick={() => setActiveMatrix('soft')}
						>
							Soft Hands
						</TabsTrigger>
						<TabsTrigger
							value="pairs"
							className={cn("data-[state=active]:bg-gray-700", activeMatrix === 'pairs' && 'bg-gray-700')}
							onClick={() => setActiveMatrix('pairs')}
						>
							Pairs
						</TabsTrigger>
					</TabsList>
				</div>
			</div>

			<div className="relative overflow-x-auto border border-gray-700 rounded-lg bg-gray-800/50">
				<table className="w-full text-sm text-gray-300">
					<thead>
						<tr className="text-xs text-gray-400 border-b border-gray-700">
							<th className="px-2 py-3 text-left bg-gray-900/40">
								Player<br />Hand
							</th>
							{dealerCards.map(card => (
								<th key={card} className="px-2 py-3 text-center bg-gray-900/40">
									Dealer:<br />{card}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{hands.map(hand => (
							<tr key={hand} className="border-b border-gray-700">
								<td className="px-3 py-2 font-medium text-left bg-gray-900/40">{hand}</td>
								{dealerCards.map(card => {
									const action = matrix[hand]?.[card]
									const cellData = action ? actionData[action] : actionData['H'] // Default to 'Hit' if undefined

									return (
										<td
											key={`${hand}-${card}`}
											className="relative px-0 py-0 text-center"
										>
											<HoverCard open={showTooltips ? undefined : false}>
												<HoverCardTrigger asChild>
													<div
														className={cn(
															"flex h-12 w-full items-center justify-center font-bold text-white",
															cellData.color,
															"transition duration-150 hover:brightness-110 hover:z-10 cursor-help"
														)}
													>
														{cellData.label}
													</div>
												</HoverCardTrigger>
												<HoverCardContent className="w-80" side="top">
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<div className={cn("w-4 h-4 rounded", cellData.color)} />
															<h4 className="font-semibold">{cellData.description}</h4>
														</div>
														<p className="text-sm">
															{action === 'H' && "Take another card."}
															{action === 'S' && "Keep your current hand."}
															{action === 'D' && "Double your bet and take exactly one more card."}
															{action === 'DS' && "Double if allowed, otherwise stand."}
															{action === 'P' && "Split your pair and play two hands."}
															{action === 'SU' && "Surrender half your bet and end the hand."}
															{action === 'DSU' && "Double if allowed, surrender if not allowed, otherwise hit."}
														</p>
														<p className="mt-1 text-xs text-gray-500">
															Player: {hand} vs. Dealer: {card}
														</p>
													</div>
												</HoverCardContent>
											</HoverCard>
										</td>
									)
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{(Object.entries(actionData) as [Action, typeof actionData[Action]][]).map(([key, data]) => (
					<div key={key} className="flex items-center gap-2 text-sm">
						<div className={cn("h-5 w-5 flex-shrink-0 rounded", data.color)} />
						<span className="text-gray-300">{data.description} ({data.label})</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default function HouseRulesPage() {
	// State management for filtering and UI
	const [selectedCategory, setSelectedCategory] = useState<Rule['category'] | 'all'>('all')
	const [selectedVariant, setSelectedVariant] = useState<BlackjackVariant | 'all'>('all')
	const [showScrollTop, setShowScrollTop] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [showGlossary, setShowGlossary] = useState(false)
	const [activeTab, setActiveTab] = useState('grid')

	// Refs for scroll effects and animations
	const headerRef = useRef<HTMLDivElement>(null)
	const showcaseRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)

	// Create scroll-linked animation
	const { scrollY } = useScroll()
	const headerOpacity = useTransform(scrollY, [0, 300], [1, 0])
	const headerY = useTransform(scrollY, [0, 300], [0, -50])

	// Handle scroll events
	useEffect(() => {
		const handleScroll = () => {
			setShowScrollTop(window.scrollY > 200)

			// Update parallax effects for other elements
			if (contentRef.current) {
				const elements = contentRef.current.querySelectorAll('.parallax-element')
				elements.forEach((el) => {
					const speed = parseFloat((el as HTMLElement).dataset.speed || '0.1')
					const yPos = -window.scrollY * speed
						; (el as HTMLElement).style.transform = `translateY(${yPos}px)`
				})
			}
		}

		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Handle showcase visibility with IntersectionObserver
	useEffect(() => {
		const options = {
			root: null,
			rootMargin: '0px',
			threshold: 0.1,
		}

		const observer = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					// Add animation class or trigger effect when visible
					entry.target.classList.add('showcase-visible')
					observer.disconnect()
				}
			})
		}, options)

		if (showcaseRef.current) {
			observer.observe(showcaseRef.current)
		}

		return () => observer.disconnect()
	}, [])

	// Filter rules by category, variant, and search query
	const filteredRules = useMemo(() => {
		return rules.filter(rule => {
			// Category filter
			const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory

			// Variant filter (only apply if rule has a variant)
			const matchesVariant = selectedVariant === 'all' || !rule.variant || rule.variant === selectedVariant

			// Search query filter
			const matchesSearch =
				searchQuery === '' ||
				rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				rule.details?.some(detail => detail.toLowerCase().includes(searchQuery.toLowerCase()))

			return matchesCategory && matchesVariant && matchesSearch
		})
	}, [selectedCategory, selectedVariant, searchQuery])

	// Function to generate blackjack term glossary
	const generateGlossary = () => {
		// Blackjack glossary for quick reference
		const glossaryTerms = [
			{ term: 'Blackjack', definition: 'An Ace and a 10-value card as the first two cards dealt, paying 3:2 in most casinos.' },
			{ term: 'Bust', definition: 'When a hand exceeds a total of 21, resulting in an automatic loss.' },
			{ term: 'Double Down', definition: 'Doubling your initial bet in exchange for receiving exactly one more card.' },
			{ term: 'Hard Hand', definition: 'A hand without an Ace, or where the Ace must be counted as 1 to avoid busting.' },
			{ term: 'Hit', definition: 'To request another card from the dealer.' },
			{ term: 'Insurance', definition: 'A side bet offered when the dealer shows an Ace, paying 2:1 if dealer has blackjack.' },
			{ term: 'Natural', definition: 'Another term for a blackjack (an Ace and a 10-value card).' },
			{ term: 'Push', definition: 'A tie between the player and dealer, resulting in no win or loss.' },
			{ term: 'Soft Hand', definition: 'A hand containing an Ace that can be counted as 11 without busting.' },
			{ term: 'Split', definition: 'Dividing a pair into two separate hands, each with its own bet.' },
			{ term: 'Stand', definition: 'To end your turn and keep your current hand total.' },
			{ term: 'Surrender', definition: 'Forfeiting half your bet and ending the hand immediately.' },
			{ term: 'Hole Card', definition: "The dealer's face-down card." },
			{ term: 'Even Money', definition: 'Taking a 1:1 payout on your blackjack when dealer shows an Ace.' },
			{ term: 'Upcard', definition: "The dealer's face-up card." },
		]

		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-xl font-semibold text-white">Blackjack Glossary</h3>
					<Button
						variant="outline"
						size="sm"
						className="text-sm border-gray-700"
						onClick={() => setShowGlossary(false)}
					>
						Close
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
					{glossaryTerms.map(({ term, definition }) => (
						<motion.div
							key={term}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
							className="p-3 border border-gray-700 rounded-lg bg-gray-800/60"
						>
							<h4 className="mb-1 font-medium text-amber-400">{term}</h4>
							<p className="text-sm text-gray-300">{definition}</p>
						</motion.div>
					))}
				</div>
			</div>
		)
	}

	// Handle scroll to top action
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	// Generate PDF content with rules
	const generatePdfContent = () => {
		return {
			title: "Royal Edge Casino - Official Blackjack Rules",
			content: rules.map(rule =>
				`${rule.title}\n${rule.description}\n${rule.details?.join('\n• ')}\n\n`
			).join('')
		}
	}

	return (
		<div className="min-h-screen text-gray-100 bg-gradient-to-b from-gray-900 via-gray-950 to-gray-900">
			{/* Enhanced decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{/* Animated cards in background */}
				<div className="absolute inset-0 opacity-10">
					{Array.from({ length: 12 }).map((_, i) => (
						<motion.div
							key={`card-decorative-${crypto.randomUUID()}`}
							className={`absolute w-20 h-30 bg-white rounded-lg shadow-xl card-${i}`}
							initial={{ opacity: 0, x: Math.random() * 100 - 50, y: -100, rotate: Math.random() * 180 - 90 }}
							animate={{
								opacity: 0.2 + (Math.random() * 0.3),
								x: Math.random() * window.innerWidth,
								y: Math.random() * window.innerHeight,
								rotate: Math.random() * 360,
								transition: {
									duration: 15 + Math.random() * 15,
									repeat: Infinity,
									repeatType: 'reverse',
									ease: 'linear'
								}
							}}
						/>
					))}
				</div>

				{/* Animated chips in background */}
				<div className="absolute inset-0 opacity-10">
					{Array.from({ length: 20 }).map((_, i) => (
						<motion.div
							key={`chip-decorative-${crypto.randomUUID()}`}
							className={`absolute w-12 h-12 rounded-full chip-${i} border-4 border-white`}
							style={{
								backgroundColor: ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6'][Math.floor(Math.random() * 5)]
							}}
							initial={{ opacity: 0, x: Math.random() * 100 - 50, y: -100 }}
							animate={{
								opacity: 0.2 + (Math.random() * 0.3),
								x: Math.random() * window.innerWidth,
								y: Math.random() * window.innerHeight,
								rotate: Math.random() * 360 * (Math.round(Math.random()) ? 1 : -1),
								transition: {
									duration: 20 + Math.random() * 20,
									repeat: Infinity,
									repeatType: 'reverse',
									ease: 'linear'
								}
							}}
						/>
					))}
				</div>
			</div>

			{/* Gradient accents */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
				<div className="absolute top-0 w-1/2 -left-1/4 h-1/2 bg-gradient-radial from-red-900/30 to-transparent blur-3xl" />
				<div className="absolute bottom-0 w-1/2 -right-1/4 h-1/2 bg-gradient-radial from-amber-900/30 to-transparent blur-3xl" />
			</div>

			{/* Enhanced header with parallax effect */}
			<header className="relative px-4 py-16 header-section md:px-6 lg:px-8">
				<motion.div
					ref={headerRef}
					style={{ opacity: headerOpacity, y: headerY }}
					className="relative z-10 flex flex-col items-center justify-center px-4 py-24 text-center"
				>
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<Badge
							variant="outline"
							className="px-3 py-1 mb-4 backdrop-blur-sm bg-black/10 border-zinc-700"
						>
							Royal Edge Casino
						</Badge>
					</motion.div>

					<motion.h1
						className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
					>
						Blackjack Rules & Strategy
					</motion.h1>

					<motion.p
						className="max-w-3xl text-lg md:text-xl text-zinc-200"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						Master the complete rules, variants, and optimal strategies for our premium Blackjack tables.
						Royal Edge Casino offers the best odds and professional dealers.
					</motion.p>

					<motion.div
						className="flex flex-wrap items-center justify-center gap-3 mt-8"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.3 }}
					>
						<Button
							className="text-white bg-red-900 hover:bg-red-800"
							onClick={() => {
								// Scroll to content
								if (contentRef.current) {
									contentRef.current.scrollIntoView({ behavior: 'smooth' })
								}
							}}
						>
							<BookOpenIcon className="w-4 h-4 mr-2" />
							Browse Rules
						</Button>

						<PDFDownloadButton
							filename="royal-edge-blackjack-rules"
							documentProps={generatePdfContent()}
							buttonText="Download PDF Guide"
							variant="outline"
							className="text-white border-gray-700 bg-gray-800/40 hover:bg-gray-700/60"
						/>
					</motion.div>
				</motion.div>

				{/* Animated cards illustration */}
				<div className="absolute bottom-0 z-20 flex justify-center transform -translate-x-1/2 translate-y-1/2 left-1/2">
					<motion.div
						className="relative"
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.5, duration: 0.6 }}
					>
						<div className="relative">
							<PlayingCard rank="A" suit="spades" className="absolute -left-16 -rotate-12" />
							<PlayingCard rank="K" suit="hearts" className="absolute -left-8 -rotate-6" />
							<PlayingCard rank="Q" suit="diamonds" className="z-10" />
							<PlayingCard rank="J" suit="clubs" className="absolute -right-8 rotate-6" />
							<PlayingCard rank="10" suit="hearts" className="absolute -right-16 rotate-12" />
						</div>
					</motion.div>
				</div>
			</header>

			{/* Main Content with enhanced navigation and filters */}
			<div ref={contentRef} className="container relative z-10 px-4 pt-24 mx-auto mb-16 -mt-12">
				<Card className="overflow-hidden border-gray-800 shadow-2xl backdrop-blur-sm bg-gray-900/80">
					<CardHeader className="p-6 lg:p-8">
						<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
							<div className="flex items-center gap-3">
								<InfoIcon className="w-6 h-6 text-red-500" />
								<div>
									<CardTitle className="text-2xl font-bold md:text-3xl">
										Official Blackjack Rules
									</CardTitle>
									<CardDescription className="text-gray-400">
										Complete guide to rules, variants, and optimal strategy
									</CardDescription>
								</div>
							</div>

							{/* Enhanced Search & Filter Controls */}
							<div className="flex flex-col gap-4 sm:flex-row">
								<div className="relative">
									<SearchIcon className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
									<input
										type="text"
										placeholder="Search rules..."
										value={searchQuery}
										onChange={e => setSearchQuery(e.target.value)}
										className="w-full py-2 pr-4 text-sm text-gray-200 border border-gray-700 rounded-md pl-9 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-red-600/50"
										aria-label="Search rules"
									/>
								</div>

								<div className="flex gap-2">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="relative w-full">
													<FilterIcon className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
													<select
														className="w-full py-2 pr-4 text-sm text-gray-200 border border-gray-700 rounded-md appearance-none h-9 pl-9 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-red-600/50"
														value={selectedCategory}
														onChange={e =>
															setSelectedCategory(e.target.value as Rule['category'] | 'all')
														}
														aria-label="Filter rules by category"
													>
														<option value="all">All Categories</option>
														<option value="basic">Basic Rules</option>
														<option value="payout">Payouts</option>
														<option value="dealer">Dealer Rules</option>
														<option value="player">Player Rules</option>
														<option value="advanced">Advanced Rules</option>
														<option value="etiquette">Etiquette</option>
													</select>
													<ChevronDownIcon className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 right-3 top-1/2" />
												</div>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												<p>Filter rules by category</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>

									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="relative w-full">
													<GlobeIcon className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
													<select
														className="w-full py-2 pr-4 text-sm text-gray-200 border border-gray-700 rounded-md appearance-none h-9 pl-9 bg-gray-800/60 focus:outline-none focus:ring-2 focus:ring-red-600/50"
														value={selectedVariant}
														onChange={e =>
															setSelectedVariant(e.target.value as BlackjackVariant | 'all')
														}
														aria-label="Filter rules by variant"
													>
														<option value="all">All Variants</option>
														<option value="classic">Classic Blackjack</option>
														<option value="european">European Blackjack</option>
														<option value="vegas">Vegas Strip Blackjack</option>
														<option value="atlantic-city">Atlantic City Blackjack</option>
														<option value="spanish-21">Spanish 21</option>
														<option value="double-exposure">Double Exposure</option>
														<option value="blackjack-switch">Blackjack Switch</option>
														<option value="tournament">Tournament Blackjack</option>
													</select>
													<ChevronDownIcon className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 right-3 top-1/2" />
												</div>
											</TooltipTrigger>
											<TooltipContent side="bottom">
												<p>Filter by game variant</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</div>
						</div>

						<Separator className="my-6 bg-gray-800" />

						{/* Category Selection Pills with enhanced visuals */}
						<div className="flex flex-wrap gap-2 pb-2">
							{(Object.keys(categoryMetadata) as (Rule['category'] | 'all')[]).map(category => (
								<motion.button
									key={category}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => setSelectedCategory(category)}
									className={cn(
										'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
										selectedCategory === category
											? (() => {
												const colorBase = category === 'all' ? 'indigo' : categoryMetadata[category].color.split('-')[1];
												return `bg-${colorBase}-900/60 text-white border border-${colorBase}-700/50`;
											})()
											: 'bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-700/50'
									)}
								>
									{categoryMetadata[category].icon}
									<span>{categoryMetadata[category].name}</span>
								</motion.button>
							))}
						</div>
					</CardHeader>

					<CardContent className="p-6 pt-0 lg:p-8">
						<Tabs
							defaultValue="grid"
							value={activeTab}
							onValueChange={setActiveTab}
							className="space-y-6"
						>
							<div className="flex justify-end mb-4">
								<TabsList className="border border-gray-700 bg-gray-800/60">
									<TabsTrigger value="grid" className="data-[state=active]:bg-gray-700">
										<LayoutGridIcon className="w-4 h-4 mr-2" />
										Grid
									</TabsTrigger>
									<TabsTrigger value="list" className="data-[state=active]:bg-gray-700">
										<ListIcon className="w-4 h-4 mr-2" />
										List
									</TabsTrigger>
									<TabsTrigger value="strategy" className="data-[state=active]:bg-gray-700">
										<MapIcon className="w-4 h-4 mr-2" />
										Strategy
									</TabsTrigger>
									<TabsTrigger value="visualizer" className="data-[state=active]:bg-gray-700">
										<LayersIcon className="w-4 h-4 mr-2" />
										Visualizer
									</TabsTrigger>
								</TabsList>
							</div>

							{/* Grid View Tab */}
							<TabsContent value="grid">
								{!showGlossary ? (
									<>
										<div className="flex justify-between mb-4">
											<div className="text-sm text-gray-400">
												{filteredRules.length} {filteredRules.length === 1 ? 'rule' : 'rules'} found
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => setShowGlossary(true)}
												className="text-sm border-gray-700"
											>
												<BookmarkIcon className="w-4 h-4 mr-2" />
												Glossary
											</Button>
										</div>

										<ScrollArea className="h-[600px] pr-4 overflow-y-auto">
											{filteredRules.length > 0 ? (
												<motion.div
													variants={containerVariants}
													initial="hidden"
													animate="show"
													className="grid grid-cols-1 gap-6 md:grid-cols-2"
												>
													{filteredRules.map(rule => (
														<ExpandableRuleCard key={rule.id} rule={rule} />
													))}
												</motion.div>
											) : (
												<motion.div
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													className="flex flex-col items-center justify-center h-40 text-center"
												>
													<p className="mb-4 text-gray-400">No rules match your search criteria</p>
													<Button
														variant="outline"
														onClick={() => {
															setSearchQuery('')
															setSelectedCategory('all')
															setSelectedVariant('all')
														}}
														className="text-sm"
													>
														Reset All Filters
													</Button>
												</motion.div>
											)}
										</ScrollArea>
									</>
								) : (
									generateGlossary()
								)}
							</TabsContent>

							{/* List View Tab */}
							<TabsContent value="list">
								<ScrollArea className="h-[600px] pr-4 overflow-y-auto">
									{filteredRules.length > 0 ? (
										<motion.div
											variants={containerVariants}
											initial="hidden"
											animate="show"
											className="space-y-4"
										>
											{filteredRules.map(rule => {
												const category = categoryMetadata[rule.category]

												return (
													<motion.div
														key={rule.id}
														variants={itemVariants}
														className="p-4 transition-colors border border-gray-800 rounded-lg bg-gray-800/50 hover:bg-gray-800/80"
													>
														<div className="flex items-center justify-between mb-2">
															<h3 className="text-lg font-medium text-white">{rule.title}</h3>
															<div className="flex gap-2">
																{rule.variant && rule.variant !== 'classic' && (
																	<Badge className="text-xs text-gray-300 bg-gray-700/70 hover:bg-gray-700">
																		{rule.variant.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
																	</Badge>
																)}

																<Badge
																	className={cn(
																		category.bgColor,
																		category.textColor
																	)}
																>
																	{category.name.replace(' Rules', '')}
																</Badge>
															</div>
														</div>
														<p className="mb-2 text-sm text-gray-300">{rule.description}</p>
														<div className="text-xs text-gray-400">
															{rule.details && rule.details.length > 0 && (
																<div>
																	<Button
																		variant="link"
																		className="h-auto p-0 text-amber-400 hover:text-amber-300"
																		onClick={e => {
																			e.stopPropagation()
																			const element = document.getElementById(`list-details-${rule.id}`)
																			if (element) {
																				element.classList.toggle('hidden')
																			}
																		}}
																	>
																		Show details
																	</Button>
																	<ul
																		id={`list-details-${rule.id}`}
																		className="hidden pl-4 mt-2 space-y-1"
																	>
																		{rule.details.map((detail, idx) => (
																			<li
																				key={`${rule.id}-detail-${idx}-${detail.substring(0, 10).replace(/\s/g, '')}`}
																				className="list-disc list-inside"
																			>
																				{detail}
																			</li>
																		))}
																	</ul>
																</div>
															)}
														</div>
													</motion.div>
												)
											})}
										</motion.div>
									) : (
										<motion.div
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="flex flex-col items-center justify-center h-40 text-center"
										>
											<p className="mb-4 text-gray-400">No rules match your search criteria</p>
											<Button
												variant="outline"
												onClick={() => {
													setSearchQuery('')
													setSelectedCategory('all')
													setSelectedVariant('all')
												}}
												className="text-sm"
											>
												Reset All Filters
											</Button>
										</motion.div>
									)}
								</ScrollArea>
							</TabsContent>

							{/* Strategy Tab with Interactive Matrix */}
							<TabsContent value="strategy">
								<ScrollArea className="h-[600px] pr-4 overflow-y-auto">
									<BlackjackStrategyMatrix />
								</ScrollArea>
							</TabsContent>

							{/* Visualizer Tab with Interactive Card Visualizer */}
							<TabsContent value="visualizer">
								<ScrollArea className="h-[600px] pr-4 overflow-y-auto">
									<HandValueVisualizer />
								</ScrollArea>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* Scroll to Top Button with enhanced animation */}
				<AnimatePresence>
					{showScrollTop && (
						<motion.button
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							className="fixed z-50 p-3 text-white rounded-full shadow-lg bottom-8 right-8 bg-red-900/80 hover:bg-red-800 focus:outline-none"
							onClick={scrollToTop}
							aria-label="Scroll to top"
						>
							<ArrowUpIcon className="w-5 h-5" />
						</motion.button>
					)}
				</AnimatePresence>

				{/* Showcase section with enhanced visuals */}
				<div
					ref={showcaseRef}
					className="relative max-w-4xl p-6 mx-auto mt-12 overflow-hidden border bg-gradient-to-br from-red-950/40 to-amber-950/40 backdrop-blur-md rounded-xl md:p-8 border-zinc-800"
				>
					<motion.h2
						className="flex items-center gap-2 mb-6 text-2xl font-bold text-white md:text-3xl"
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<TrophyIcon className="w-6 h-6 text-amber-500" />
						Premium Tables
					</motion.h2>

					<motion.div
						className="relative z-10"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div className="space-y-4">
								<div className="overflow-hidden rounded-lg aspect-video bg-zinc-800">
									<div className="w-full h-full bg-gradient-to-r from-zinc-900 to-zinc-800 animate-pulse"></div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Badge className="text-white bg-red-900/60 hover:bg-red-900">$25 Minimum</Badge>
									<Badge className="text-white bg-amber-900/60 hover:bg-amber-900">
										$1000 Maximum
									</Badge>
									<Badge className="text-white bg-zinc-800/60 hover:bg-zinc-800">
										VIP Rooms Available
									</Badge>
								</div>
							</div>

							<div className="space-y-4">
								<div>
									<h3 className="mb-2 text-xl font-bold text-white">Exclusive VIP Experience</h3>
									<p className="text-zinc-300">
										Royal Edge Casino offers premium blackjack tables with professional dealers and
										the best odds in town. Our tables are open 24/7 for your gaming pleasure.
									</p>
								</div>

								<div className="flex flex-col gap-3">
									<div className="flex items-center gap-2">
										<StarIcon className="w-5 h-5 text-amber-500" />
										<span className="text-zinc-300">Professional dealers</span>
									</div>
									<div className="flex items-center gap-2">
										<StarIcon className="w-5 h-5 text-amber-500" />
										<span className="text-zinc-300">Complimentary beverages</span>
									</div>
									<div className="flex items-center gap-2">
										<StarIcon className="w-5 h-5 text-amber-500" />
										<span className="text-zinc-300">Regular tournaments with special prizes</span>
									</div>
								</div>

								<Button className="mt-4 text-white bg-amber-900/80 hover:bg-amber-800">
									<ClockIcon className="w-4 h-4 mr-2" />
									Reserve a Seat
								</Button>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
		</div>
	)
}

// Interactive hand value calculator using card components
const HandValueVisualizer = () => {
	// Card state
	// Define card type interface
	interface Card {
		suit: Suit
		rank: Rank
	}

	// Card state with proper typing
	const [firstCard, setFirstCard] = useState<Card>({ suit: 'hearts', rank: 'A' })
	const [secondCard, setSecondCard] = useState<Card>({ suit: 'spades', rank: 'J' })

	// Card selection options
	const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
	const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

	// Calculate hand value

	// Determine hand type


	// Get optimal play recommendation


	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h3 className="text-xl font-semibold text-white">Interactive Hand Visualizer</h3>
				<p className="text-sm text-gray-400">Experiment with different card combinations to see optimal plays</p>
			</div>

			<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
				<div className="space-y-6">
					<div className="space-y-2">
						<h4 className="flex items-center gap-2 text-lg font-medium text-gray-200">
							<UserIcon className="w-5 h-5 text-amber-400" />
							Your Cards
						</h4>

						<div className="flex flex-wrap justify-center gap-4 md:justify-start">
							{/* First player card with selector */}
							<div className="relative">
								<motion.div
									whileHover={{ scale: 1.05 }}
									className="relative z-10"
								>
									<PlayingCard
										suit={firstCard.suit}
										rank={firstCard.rank}
										aria-label={`Your first card: ${firstCard.rank} of ${firstCard.suit}`}
									/>
								</motion.div>

								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="absolute z-20 flex items-center gap-1 transform -translate-x-1/2 border-gray-700 bottom-2 left-1/2 bg-gray-900/80 hover:bg-gray-800"
										>
											Change
											<ChevronDownIcon className="w-3 h-3" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-64 p-3">
										<div className="space-y-2">
											<div className="grid grid-cols-4 gap-1">
												{suits.map(suit => (
													<Button
														key={suit}
														variant="ghost"
														size="sm"
														className={cn(
															"p-1",
															firstCard.suit === suit && "bg-gray-700"
														)}
														onClick={() => setFirstCard(prev => ({ ...prev, suit }))}
													>
														<div className={cn(
															"text-lg",
															(suit === 'hearts' || suit === 'diamonds') ? "text-red-500" : "text-white"
														)}>
															{suit === 'hearts' && <HeartIcon className="w-5 h-5" />}
															{suit === 'diamonds' && <DiamondIcon className="w-5 h-5" />}
															{suit === 'clubs' && <ClubIcon className="w-5 h-5" />}
															{suit === 'spades' && <SpadeIcon className="w-5 h-5" />}
														</div>
													</Button>
												))}
											</div>

											<div className="grid grid-cols-4 gap-1">
												{ranks.map(rank => (
													<Button
														key={rank}
														variant="ghost"
														size="sm"
														className={cn(
															"p-1",
															firstCard.rank === rank && "bg-gray-700"
														)}
														onClick={() => setFirstCard(prev => ({ ...prev, rank }))}
													>
														{rank}
													</Button>
												))}
											</div>
										</div>
									</PopoverContent>
								</Popover>
							</div>

							{/* Second player card with selector */}
							<div className="relative">
								<motion.div
									whileHover={{ scale: 1.05 }}
									className="relative z-10"
								>
									<PlayingCard
										suit={secondCard.suit}
										rank={secondCard.rank}
										aria-label={`Your second card: ${secondCard.rank} of ${secondCard.suit}`}
									/>
								</motion.div>

								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="absolute z-20 flex items-center gap-1 transform -translate-x-1/2 border-gray-700 bottom-2 left-1/2 bg-gray-900/80 hover:bg-gray-800"
										>
											Change
											<ChevronDownIcon className="w-3 h-3" />
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-64 p-3">
										<div className="space-y-2">
											<div className="grid grid-cols-4 gap-1">
												{suits.map(suit => (
													<Button
														key={suit}
														variant="ghost"
														size="sm"
														className={cn(
															"p-1",
															secondCard.suit === suit && "bg-gray-700"
														)}
														onClick={() => setSecondCard(prev => ({ ...prev, suit }))}
													>
														<div className={cn(
															"text-lg",
															(suit === 'hearts' || suit === 'diamonds') ? "text-red-500" : "text-white"
														)}>
															{suit === 'hearts' && <HeartIcon className="w-5 h-5" />}
															{suit === 'diamonds' && <DiamondIcon className="w-5 h-5" />}
															{suit === 'clubs' && <ClubIcon className="w-5 h-5" />}
															{suit === 'spades' && <SpadeIcon className="w-5 h-5" />}
														</div>
													</Button>
												))}
											</div>

											<div className="grid grid-cols-4 gap-1">
												{ranks.map(rank => (
													<Button
														key={rank}
														variant="ghost"
														size="sm"
														className={cn(
															"p-1",
															secondCard.rank === rank && "bg-gray-700"
														)}
														onClick={() => setSecondCard(prev => ({ ...prev, rank }))}
													>
														{rank}
													</Button>
												))}
											</div>
										</div>
									</PopoverContent>
								</Popover>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<h4 className="flex items-center gap-2 text-lg font-medium text-gray-200">
							<ShieldIcon className="w-5 h-5 text-purple-400" />
							Dealer Upcard
						</h4>

						{/* Add your dealer upcard content here */}
						<div className="flex flex-wrap justify-center gap-4 md:justify-start">
							{/* Dealer upcard implementation */}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
