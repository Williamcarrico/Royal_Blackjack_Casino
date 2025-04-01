import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { SearchIcon, BookOpenIcon, XIcon } from 'lucide-react'
import { glossaryTerms, GlossaryTerm } from '../faq-data'
import { Button } from '@/components/ui/layout/button'

interface GlossarySectionProps {
	className?: string
}

const GlossarySection: React.FC<GlossarySectionProps> = ({ className }) => {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null)

	// Filter terms based on search
	const filteredTerms = glossaryTerms.filter(item => {
		if (!searchTerm) return true
		return (
			item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.definition.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	// Group terms alphabetically
	const groupedTerms: Record<string, GlossaryTerm[]> = {}

	filteredTerms.forEach(term => {
		const firstLetter = term.term.charAt(0).toUpperCase()
		if (!groupedTerms[firstLetter]) {
			groupedTerms[firstLetter] = []
		}
		groupedTerms[firstLetter].push(term)
	})

	const sortedGroups = Object.keys(groupedTerms).sort((a, b) => a.localeCompare(b))

	return (
		<Card
			className={`overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 ${className}`}
		>
			<CardHeader className="border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
						<CardTitle>Blackjack Glossary</CardTitle>
					</div>
					<div className="relative w-64">
						<SearchIcon className="absolute w-4 h-4 text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
						<Input
							type="text"
							placeholder="Search terms..."
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-0">
				<div className="flex flex-col md:flex-row">
					<div className="w-full border-r border-gray-200 md:w-1/3 dark:border-gray-700">
						<ScrollArea className="h-[400px]">
							<div className="p-4">
								{filteredTerms.length === 0 ? (
									<div className="p-4 text-center text-gray-500">No matching terms found</div>
								) : (
									sortedGroups.map(letter => (
										<div key={letter} className="mb-4">
											<div className="flex items-center mb-2">
												<Badge className="text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-300">
													{letter}
												</Badge>
												<div className="flex-grow h-px ml-2 bg-gray-200 dark:bg-gray-700"></div>
											</div>

											<ul className="space-y-1">
												{groupedTerms[letter].map(term => (
													<li key={term.term}>
														<button
															onClick={() => setSelectedTerm(term)}
															className={`w-full px-3 py-2 text-left rounded-md transition-colors ${
																selectedTerm?.term === term.term
																	? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
																	: 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
															}`}
														>
															{term.term}
														</button>
													</li>
												))}
											</ul>
										</div>
									))
								)}
							</div>
						</ScrollArea>
					</div>

					<div className="w-full p-6 md:w-2/3">
						<AnimatePresence mode="wait">
							{selectedTerm ? (
								<motion.div
									key={selectedTerm.term}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{ duration: 0.2 }}
									className="h-full"
								>
									<div className="flex items-center justify-between mb-4">
										<h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
											{selectedTerm.term}
										</h3>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setSelectedTerm(null)}
											className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
										>
											<XIcon className="w-4 h-4" />
										</Button>
									</div>
									<p className="text-gray-700 dark:text-gray-300">{selectedTerm.definition}</p>
								</motion.div>
							) : (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="flex flex-col items-center justify-center h-full text-center"
								>
									<BookOpenIcon className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
									<p className="mb-2 text-xl font-medium text-gray-600 dark:text-gray-400">
										Select a term
									</p>
									<p className="text-sm text-gray-500 dark:text-gray-500">
										Click on any term from the list to view its definition
									</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export default GlossarySection
