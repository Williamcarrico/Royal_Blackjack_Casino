// app/privacy-policy/types.ts
import { LucideIcon } from 'lucide-react'

export interface PolicySection {
	id: string
	title: string
	subtitle?: string
	icon: LucideIcon
	content: string[]
	lastUpdated?: string
}

export interface PolicyMetadata {
	version: string
	effectiveDate: string
	lastModified: string
}

export type ThemeMode = 'dark' | 'light' | 'system'

export interface ThemeContextType {
	theme: ThemeMode
	setTheme: (theme: ThemeMode) => void
}

export interface NavigationContextType {
	activeSection: string
	setActiveSection: (section: string) => void
	progress: number
	sections: PolicySection[]
}
