import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterIcon, Search, History, XCircle, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/layout/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import TagFilter from './TagFilter'

interface AdvancedSearchProps {
	searchQuery: string
	setSearchQuery: (query: string) => void
	searchHistory: string[]
	allTags: string[]
	selectedTags: string[]
	toggleTag: (tag: string) => void
	clearFilters: () => void
	className?: string
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
	searchQuery,
	setSearchQuery,
	searchHistory,
	allTags,
	selectedTags,
	toggleTag,
	clearFilters,
	className,
}) => {
	const [showFilter, setShowFilter] = useState(false)
	const [isSearchFocused, setIsSearchFocused] = useState(false)

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		// Search is already tracked in the useFaqSearch hook
	}

	return (
		<div className={`relative ${className}`}>
			<div className="mb-4">
				<form onSubmit={handleSearch} className="relative">
					<Search className="absolute w-5 h-5 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
					<Input
						type="text"
						placeholder="Search for questions or keywords..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
						className="h-12 pl-10 bg-white border-gray-200 rounded-lg pr-28 dark:bg-gray-800 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
					/>

					<div className="absolute flex gap-2 transform -translate-y-1/2 right-2 top-1/2">
						{searchQuery && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => setSearchQuery('')}
								className="w-8 h-8 p-1"
							>
								<XCircle className="w-5 h-5 text-gray-500" />
								<span className="sr-only">Clear search</span>
							</Button>
						)}

						<Popover>
							<PopoverTrigger asChild>
								<Button type="button" variant="ghost" size="sm" className="w-8 h-8 p-1">
									<History className="w-5 h-5 text-gray-500" />
									<span className="sr-only">Search history</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="p-3 w-72" align="end">
								<h3 className="mb-2 text-sm font-medium">Recent Searches</h3>
								{searchHistory.length === 0 ? (
									<p className="text-sm text-gray-500">No recent searches</p>
								) : (
									<div className="space-y-1">
										{searchHistory.map(query => (
											<Button
												key={`history-${query}`}
												variant="ghost"
												size="sm"
												className="justify-start w-full text-left"
												onClick={() => setSearchQuery(query)}
											>
												{query}
											</Button>
										))}
									</div>
								)}
							</PopoverContent>
						</Popover>

						<Button
							type="button"
							variant={showFilter ? 'default' : 'ghost'}
							size="sm"
							onClick={() => setShowFilter(!showFilter)}
							className={`p-1 h-8 w-8 ${showFilter ? 'bg-blue-600 text-white' : ''}`}
						>
							<FilterIcon className="w-5 h-5" />
							<span className="sr-only">Advanced filters</span>
						</Button>
					</div>
				</form>

				<AnimatePresence>
					{isSearchFocused && searchHistory.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="absolute z-10 w-full mt-1 overflow-hidden bg-white border rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700"
						>
							<div className="p-2">
								<h3 className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
									Recent Searches
								</h3>
								{searchHistory.map(query => (
									<Button
										key={`suggestion-${query}`}
										variant="ghost"
										size="sm"
										className="justify-start w-full text-left"
										onClick={() => setSearchQuery(query)}
									>
										<History className="w-4 h-4 mr-2 text-gray-500" />
										{query}
									</Button>
								))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{showFilter && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="overflow-hidden"
					>
						<div className="p-4 mb-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
							<div className="flex items-center justify-between mb-4">
								<h3 className="flex items-center gap-2 text-sm font-medium">
									<Tag className="w-4 h-4" />
									Advanced Filters
								</h3>
								<Button
									variant="ghost"
									size="sm"
									className="text-xs text-gray-500 h-7"
									onClick={clearFilters}
								>
									Reset All
								</Button>
							</div>

							<TagFilter
								allTags={allTags}
								selectedTags={selectedTags}
								onToggleTag={toggleTag}
								onClearTags={() => {
									// Clear just the tags, not the search query
									selectedTags.forEach(tag => toggleTag(tag))
								}}
							/>

							{selectedTags.length > 0 && (
								<div className="flex justify-end pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
									<Button size="sm" className="text-sm" onClick={() => setShowFilter(false)}>
										Apply Filters
									</Button>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{selectedTags.length > 0 && !showFilter && (
				<div className="flex flex-wrap items-center gap-2 mb-4">
					<span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
					{selectedTags.map(tag => (
						<Badge
							key={`active-${tag}`}
							className="flex items-center gap-1 text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200"
						>
							{tag}
							<button
								onClick={() => toggleTag(tag)}
								className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
							>
								<XCircle className="w-3 h-3" />
								<span className="sr-only">Remove tag</span>
							</button>
						</Badge>
					))}
					<Button
						variant="link"
						size="sm"
						className="h-6 p-0 text-xs text-blue-600 dark:text-blue-400"
						onClick={clearFilters}
					>
						Clear all
					</Button>
				</div>
			)}
		</div>
	)
}

export default AdvancedSearch
