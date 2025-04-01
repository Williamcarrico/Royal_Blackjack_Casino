// app/privacy-policy/ThemeProvider.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { ThemeContextType, ThemeMode } from './types'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
	// Initialize with system preference but check localStorage on client
	const [themeMode, setThemeMode] = useState<ThemeMode>('system')

	// Effect to handle initial theme
	useEffect(() => {
		// Try to get theme from localStorage
		const storedTheme = localStorage.getItem('privacy-policy-theme') as ThemeMode | null

		if (storedTheme) {
			setThemeMode(storedTheme)
		} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			setThemeMode('dark')
		}
	}, [])

	// Effect to apply theme changes
	useEffect(() => {
		const root = document.documentElement

		if (themeMode === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			root.classList.toggle('dark', systemTheme === 'dark')
		} else {
			root.classList.toggle('dark', themeMode === 'dark')
		}

		// Save preference to localStorage
		localStorage.setItem('privacy-policy-theme', themeMode)
	}, [themeMode])

	// Effect to listen for system preference changes
	useEffect(() => {
		if (themeMode !== 'system') return

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

		const handleChange = () => {
			document.documentElement.classList.toggle('dark', mediaQuery.matches)
		}

		mediaQuery.addEventListener('change', handleChange)
		return () => mediaQuery.removeEventListener('change', handleChange)
	}, [themeMode])

	const setTheme = (newTheme: ThemeMode) => {
		setThemeMode(newTheme)
	}

	// Memoize the context value to prevent unnecessary re-renders
	const contextValue = useMemo(() => {
		return { theme: themeMode, setTheme }
	}, [themeMode])

	return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}
