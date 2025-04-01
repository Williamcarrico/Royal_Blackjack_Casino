import { useState, useMemo, useCallback, useEffect } from 'react'
import { FAQ, faqs } from '../faq-data'

interface FaqSearchOptions {
	initialCategory?: FAQ['category'] | 'all'
	initialQuery?: string
	initialTags?: string[]
}

export const useFaqSearch = (options: FaqSearchOptions = {}) => {
	const { initialCategory = 'all', initialQuery = '', initialTags = [] } = options

	const [searchQuery, setSearchQuery] = useState(initialQuery)
	const [selectedCategory, setSelectedCategory] = useState<FAQ['category'] | 'all'>(initialCategory)
	const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)
	const [searchHistory, setSearchHistory] = useState<string[]>([])
	const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])

	// Get all unique tags from FAQs
	const allTags = useMemo(() => {
		const tags = new Set<string>()
		faqs.forEach(faq => {
			faq.tags?.forEach(tag => {
				tags.add(tag)
			})
		})
		return Array.from(tags).sort((a, b) => a.localeCompare(b))
	}, [])

	// Filter FAQs based on search criteria with memoization
	const filteredFAQs = useMemo(() => {
		return faqs.filter(faq => {
			// Category filter
			const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory

			// Text search
			const matchesSearch =
				searchQuery === '' ||
				faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
				faq.answer.toLowerCase().includes(searchQuery.toLowerCase())

			// Tags filter
			const matchesTags =
				selectedTags.length === 0 ||
				(faq.tags && selectedTags.every(tag => faq.tags?.includes(tag)))

			return matchesCategory && matchesSearch && matchesTags
		})
	}, [searchQuery, selectedCategory, selectedTags])

	// Track search history
	const handleSearch = useCallback(
		(query: string) => {
			setSearchQuery(query)

			if (query && !searchHistory.includes(query)) {
				setSearchHistory(prev => [query, ...prev].slice(0, 5))
			}
		},
		[searchHistory]
	)

	// Track viewed FAQs
	const trackViewedFaq = useCallback((faqId: string) => {
		setRecentlyViewed(prev => {
			// Remove if already exists to move to front
			const filtered = prev.filter(id => id !== faqId)
			// Add to front and limit to 5 items
			return [faqId, ...filtered].slice(0, 5)
		})
	}, [])

	// Clear all filters
	const clearFilters = useCallback(() => {
		setSearchQuery('')
		setSelectedCategory('all')
		setSelectedTags([])
	}, [])

	// Add or remove a tag filter
	const toggleTag = useCallback((tag: string) => {
		setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
	}, [])

	// Sort FAQs by different criteria
	const sortFAQs = useCallback(
		(faqs: FAQ[], sortBy: 'popularity' | 'alphabetical' = 'popularity') => {
			return [...faqs].sort((a, b) => {
				if (sortBy === 'popularity') {
					return (b.popularity ?? 0) - (a.popularity ?? 0)
				} else {
					return a.question.localeCompare(b.question)
				}
			})
		},
		[]
	)

	// Keep recently viewed FAQs in localStorage
	useEffect(() => {
		// Load from localStorage on initial mount
		const savedViewed = localStorage.getItem('recentlyViewedFaqs')
		if (savedViewed) {
			setRecentlyViewed(JSON.parse(savedViewed))
		}
	}, [])

	useEffect(() => {
		// Save to localStorage when recentlyViewed changes
		if (recentlyViewed.length > 0) {
			localStorage.setItem('recentlyViewedFaqs', JSON.stringify(recentlyViewed))
		}
	}, [recentlyViewed])

	return {
		searchQuery,
		setSearchQuery: handleSearch,
		selectedCategory,
		setSelectedCategory,
		selectedTags,
		toggleTag,
		clearFilters,
		filteredFAQs,
		sortFAQs,
		allTags,
		searchHistory,
		recentlyViewed,
		trackViewedFaq,
	}
}
