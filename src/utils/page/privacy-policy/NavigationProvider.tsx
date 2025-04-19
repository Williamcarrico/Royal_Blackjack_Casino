// app/privacy-policy/NavigationProvider.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { NavigationContextType, PolicySection } from './types'

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({
	children,
	sections,
}: {
	readonly children: React.ReactNode
	readonly sections: PolicySection[]
}) {
	const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '')
	const [progress, setProgress] = useState<number>(0)

	// Effect to update progress based on scroll position
	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY
			const windowHeight = window.innerHeight
			const documentHeight = document.body.scrollHeight

			// Calculate scroll progress (0 to 100)
			const scrollProgress = Math.min(
				100,
				Math.ceil((scrollPosition / (documentHeight - windowHeight)) * 100)
			)

			setProgress(scrollProgress)

			// Determine active section based on scroll position
			const sectionElements = sections.map(section => {
				const element = document.getElementById(section.id)
				if (!element) return { id: section.id, position: 0 }

				const rect = element.getBoundingClientRect()
				return {
					id: section.id,
					position: rect.top + scrollPosition,
				}
			})

			// Find the section closest to the top of the viewport
			for (let i = sectionElements.length - 1; i >= 0; i--) {
				if (sectionElements[i].position <= scrollPosition + 100) {
					setActiveSection(sectionElements[i].id)

					// Update URL hash without triggering a scroll
					history.replaceState(null, '', `#${sectionElements[i].id}`)

					break
				}
			}
		}

		window.addEventListener('scroll', handleScroll)
		handleScroll() // Initial call

		return () => window.removeEventListener('scroll', handleScroll)
	}, [sections])

	// Effect to handle initial hash navigation
	useEffect(() => {
		const hash = window.location.hash.substring(1)
		if (hash) {
			const section = sections.find(s => s.id === hash)
			if (section) {
				setActiveSection(section.id)

				// Scroll to section with a small delay to ensure the DOM is fully loaded
				setTimeout(() => {
					const element = document.getElementById(hash)
					if (element) {
						element.scrollIntoView({ behavior: 'smooth' })
					}
				}, 300)
			}
		}
	}, [sections])

	// Memoize the context value to prevent unnecessary re-renders
	const contextValue = useMemo(() => {
		return { activeSection, setActiveSection, progress, sections }
	}, [activeSection, progress, sections])

	return <NavigationContext.Provider value={contextValue}>{children}</NavigationContext.Provider>
}

export const useNavigation = () => {
	const context = useContext(NavigationContext)
	if (context === undefined) {
		throw new Error('useNavigation must be used within a NavigationProvider')
	}
	return context
}
