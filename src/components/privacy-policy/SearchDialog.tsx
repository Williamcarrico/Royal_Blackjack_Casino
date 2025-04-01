// app/privacy-policy/SearchDialog.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { PolicySection } from './types'

interface SearchDialogProps {
	isOpen: boolean
	onClose: () => void
	sections: PolicySection[]
}

interface SearchResult {
	sectionId: string
	sectionTitle: string
	matchType: 'title' | 'content'
	contentIndex?: number
	contentSnippet?: string
	relevanceScore: number
}

export default function SearchDialog({ isOpen, onClose, sections }: Readonly<SearchDialogProps>) {
	const [searchQuery, setSearchQuery] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])

	// Reset search when dialog opens
	useEffect(() => {
		if (isOpen) {
			setSearchQuery('')
			setResults([])
		}
	}, [isOpen])

	// Handle keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Close on escape
			if (e.key === 'Escape') {
				onClose()
			}

			// Focus search input on / key
			if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
				e.preventDefault()
				document.getElementById('privacy-search-input')?.focus()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [onClose])

	// Perform search when query changes
	useEffect(() => {
		if (!searchQuery.trim()) {
			setResults([])
			return
		}

		const query = searchQuery.toLowerCase()
		const searchResults: SearchResult[] = []

		// Search through all sections
		sections.forEach(section => {
			// Check section title
			if (section.title.toLowerCase().includes(query)) {
				searchResults.push({
					sectionId: section.id,
					sectionTitle: section.title,
					matchType: 'title',
					relevanceScore: 100, // Title matches are most relevant
				})
			}

			// Check section content
			section.content.forEach((paragraph, index) => {
				if (paragraph.toLowerCase().includes(query)) {
					// Find the position of the match to create a snippet
					const matchPosition = paragraph.toLowerCase().indexOf(query)
					const startPos = Math.max(0, matchPosition - 40)
					const endPos = Math.min(paragraph.length, matchPosition + query.length + 40)

					// Create snippet with ellipses if needed
					let snippet = paragraph.substring(startPos, endPos)
					if (startPos > 0) snippet = '...' + snippet
					if (endPos < paragraph.length) snippet = snippet + '...'

					// Calculate relevance score based on position in paragraph
					// Earlier matches are more relevant
					const positionScore = Math.max(50, 90 - (matchPosition / paragraph.length) * 40)

					searchResults.push({
						sectionId: section.id,
						sectionTitle: section.title,
						matchType: 'content',
						contentIndex: index,
						contentSnippet: snippet,
						relevanceScore: positionScore,
					})
				}
			})
		})

		// Sort by relevance score
		searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

		setResults(searchResults)
	}, [searchQuery, sections])

	// Handle clicking a search result - wrap in useCallback
	const handleResultClick = useCallback(
		(sectionId: string, contentIndex?: number) => {
			onClose()

			// Scroll to the section
			setTimeout(() => {
				const section = document.getElementById(sectionId)
				if (section) {
					section.scrollIntoView({ behavior: 'smooth' })

					// If we have a specific paragraph, try to highlight it
					if (contentIndex !== undefined) {
						const paragraphs = section.querySelectorAll('p')
						const paragraph = paragraphs[contentIndex]

						if (paragraph) {
							// Add a temporary highlight
							paragraph.classList.add(
								'bg-yellow-100',
								'dark:bg-yellow-900/30',
								'transition-colors',
								'duration-500'
							)

							// Remove it after a few seconds
							setTimeout(() => {
								paragraph.classList.remove(
									'bg-yellow-100',
									'dark:bg-yellow-900/30',
									'transition-colors',
									'duration-500'
								)
							}, 3000)
						}
					}
				}
			}, 100)
		},
		[onClose]
	)

	// Memoize results rendering to avoid unnecessary re-renders
	const renderedResults = useMemo(() => {
		if (results.length === 0) {
			if (searchQuery.trim() === '') {
				return (
					<div className="py-8 text-center text-gray-500">
						<Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
						<p>Type to search through our privacy policy</p>
						<p className="mt-2 text-sm">
							Press <kbd className="px-2 py-1 bg-gray-100 rounded dark:bg-gray-800">ESC</kbd> to
							close
						</p>
					</div>
				)
			} else {
				return (
					<div className="py-8 text-center text-gray-500">
						<p>No results found for &ldquo;{searchQuery}&rdquo;</p>
						<p className="mt-2 text-sm">Try using different keywords or broader terms</p>
					</div>
				)
			}
		}

		return (
			<div className="mt-4 space-y-4">
				<p className="text-sm text-gray-500">
					{results.length} result{results.length !== 1 ? 's' : ''} found
				</p>

				{results.map(result => (
					<button
						key={`result-${result.sectionId}-${result.matchType}-${result.contentIndex ?? 'title'}`}
						className="w-full p-4 text-left transition-colors bg-gray-100 rounded-lg cursor-pointer dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800"
						onClick={() => handleResultClick(result.sectionId, result.contentIndex)}
						aria-label={`View ${result.sectionTitle} section`}
					>
						<h3 className="font-medium text-blue-600 dark:text-blue-400">{result.sectionTitle}</h3>

						{result.matchType === 'title' ? (
							<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
								Title match - click to view section
							</p>
						) : (
							<p className="mt-2 text-sm text-gray-800 dark:text-gray-300">
								{result.contentSnippet
									?.split(new RegExp(`(${searchQuery})`, 'gi'))
									.map((part, i) =>
										part.toLowerCase() === searchQuery.toLowerCase() ? (
											<mark
												key={`mark-${result.sectionId}-${i}-${part}`}
												className="px-1 bg-yellow-200 rounded dark:bg-yellow-900"
											>
												{part}
											</mark>
										) : (
											<React.Fragment
												key={`frag-${result.sectionId}-${i}-${part.substring(0, 10)}`}
											>
												{part}
											</React.Fragment>
										)
									)}
							</p>
						)}
					</button>
				))}
			</div>
		)
	}, [results, searchQuery, handleResultClick])

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Search Privacy Policy</DialogTitle>
				</DialogHeader>

				<div className="relative">
					<Input
						id="privacy-search-input"
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						placeholder="Search for terms, provisions, or topics..."
						className="pl-10 pr-10"
						autoFocus
					/>
					<Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />

					{searchQuery && (
						<button
							className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600 dark:hover:text-gray-200"
							onClick={() => setSearchQuery('')}
							aria-label="Clear search"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>

				<div className="mt-2 max-h-[60vh] overflow-y-auto pr-2">{renderedResults}</div>
			</DialogContent>
		</Dialog>
	)
}
