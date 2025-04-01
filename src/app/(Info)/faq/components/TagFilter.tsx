import * as React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TagFilterProps {
	allTags: string[]
	selectedTags: string[]
	onToggleTag: (tag: string) => void
	onClearTags: () => void
	className?: string
}

const TagFilter: React.FC<TagFilterProps> = ({
	allTags,
	selectedTags,
	onToggleTag,
	onClearTags,
	className = '',
}) => {
	// Animation variants for tag hover effect
	const tagVariants = {
		hover: {
			scale: 1.05,
			boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
			transition: { duration: 0.2 },
		},
		tap: {
			scale: 0.95,
			transition: { duration: 0.1 },
		},
	}

	// Group tags by first letter
	const groupedTags: Record<string, string[]> = {}
	allTags.forEach(tag => {
		// Group by first character
		const firstChar = tag.charAt(0).toUpperCase()
		if (!groupedTags[firstChar]) {
			groupedTags[firstChar] = []
		}
		groupedTags[firstChar].push(tag)
	})

	// Sort groups alphabetically
	const sortedGroups = Object.keys(groupedTags).sort((a, b) => a.localeCompare(b))

	return (
		<div className={`mb-4 ${className}`}>
			<div className="flex items-center justify-between mb-3">
				<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Tags</h3>
				{selectedTags.length > 0 && (
					<button
						onClick={onClearTags}
						className="flex items-center px-2 py-1 text-xs text-gray-600 transition-colors bg-gray-100 rounded-md dark:text-gray-400 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
					>
						<X className="w-3 h-3 mr-1" />
						Clear All
					</button>
				)}
			</div>

			{selectedTags.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-3">
					{selectedTags.map(tag => (
						<Badge
							key={`selected-${tag}`}
							className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full cursor-pointer dark:bg-blue-900 dark:text-blue-300"
							onClick={() => onToggleTag(tag)}
						>
							{tag}
							<X className="w-3 h-3" />
						</Badge>
					))}
				</div>
			)}

			<ScrollArea className="h-[120px] pr-2 pb-2">
				<div className="flex flex-wrap gap-2">
					{sortedGroups.map(group => (
						<div key={group} className="mb-2 mr-4">
							{groupedTags[group].map(tag => (
								<motion.div
									key={tag}
									variants={tagVariants}
									whileHover="hover"
									whileTap="tap"
									className="inline-block mb-2 mr-2"
								>
									<Badge
										variant={selectedTags.includes(tag) ? 'default' : 'outline'}
										className={`cursor-pointer transition-all px-3 py-1 text-xs ${
											selectedTags.includes(tag)
												? 'bg-blue-600 hover:bg-blue-700 text-white'
												: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
										}`}
										onClick={() => onToggleTag(tag)}
									>
										{tag}
									</Badge>
								</motion.div>
							))}
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	)
}

export default TagFilter
