import { UsersIcon, BookOpenIcon, DollarSignIcon, ShieldIcon, AwardIcon } from 'lucide-react'
import { FAQ } from '../faq-data'

// Get appropriate color class for each category
export const getCategoryColor = (category: FAQ['category']) => {
	const colors = {
		gameplay:
			'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 border dark:border-emerald-600',
		rules:
			'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 border dark:border-blue-600',
		payouts:
			'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border dark:border-green-600',
		account:
			'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 border dark:border-purple-600',
		technical:
			'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100 border dark:border-orange-600',
	}
	return colors[category]
}

// Get appropriate icon for each category
export const getCategoryIcon = (category: FAQ['category']) => {
	const icons = {
		gameplay: <UsersIcon className="w-4 h-4" />,
		rules: <BookOpenIcon className="w-4 h-4" />,
		payouts: <DollarSignIcon className="w-4 h-4" />,
		account: <ShieldIcon className="w-4 h-4" />,
		technical: <AwardIcon className="w-4 h-4" />,
	}
	return icons[category]
}

// Get gradient styles for various UI elements
export const getGradientStyles = () => {
	return {
		heading:
			'text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400',
		button:
			'text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700',
		card: 'border-t-2 border-blue-500 dark:border-blue-400',
	}
}

// Animation presets for consistent motion
export const getAnimationPresets = () => {
	return {
		fadeIn: {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			transition: { duration: 0.3 },
		},
		slideUp: {
			initial: { opacity: 0, y: 20 },
			animate: { opacity: 1, y: 0 },
			transition: { duration: 0.5 },
		},
		staggerItems: {
			container: {
				hidden: { opacity: 0 },
				show: {
					opacity: 1,
					transition: {
						staggerChildren: 0.1,
					},
				},
			},
			item: {
				hidden: { opacity: 0, y: 20 },
				show: { opacity: 1, y: 0 },
			},
		},
		scrollFade: {
			initial: { opacity: 0, y: 10 },
			animate: { opacity: 1, y: 0 },
			exit: { opacity: 0, y: 10 },
			transition: { duration: 0.3 },
		},
	}
}

// Utility to format ID for anchor links
export const formatAnchorId = (str: string) => {
	return str
		.toLowerCase()
		.replace(/[^\w\s]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
}

// Define a type for user preferences
interface FaqUserPreferences {
	defaultView: 'accordion' | 'cards'
	preferredCategories: string[]
	expandAll: boolean
	[key: string]: unknown
}

// Helper for handling user preferences
export const getUserPreferences = (): FaqUserPreferences => {
	// Get from localStorage if available
	if (typeof window !== 'undefined') {
		try {
			const preferences = localStorage.getItem('faqPreferences')
			if (preferences) {
				return JSON.parse(preferences)
			}
		} catch (error) {
			console.error('Error retrieving user preferences:', error)
		}
	}

	// Default preferences
	return {
		defaultView: 'accordion',
		preferredCategories: [],
		expandAll: false,
	}
}

// Save user preferences
export const saveUserPreferences = (preferences: FaqUserPreferences) => {
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem('faqPreferences', JSON.stringify(preferences))
		} catch (error) {
			console.error('Error saving user preferences:', error)
		}
	}
}
