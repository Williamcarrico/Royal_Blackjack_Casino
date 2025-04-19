// app/privacy-policy/components/index.tsx
'use client'

import React, { useState } from 'react'
import { useNavigation } from '../NavigationProvider'
import { useTheme } from '../ThemeProvider'
import { Moon, Sun, Share, ChevronRight, Link, Loader2 } from 'lucide-react'
import { PolicyMetadata } from '../types'
import { PrivacyPolicyDocument } from '../utils/pdf'
import { Button } from '@/components/ui/button'
import { PDFDownloadButton } from '@/components/ui/pdf-download-button'

// ThemeSwitcher Component
export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme()

	return (
		<div className="flex items-center gap-2 p-2 rounded-full bg-gray-800/50 dark:bg-gray-900/50">
			<button
				onClick={() => setTheme('light')}
				className={`p-2 rounded-full ${theme === 'light'
					? 'bg-blue-500 text-white'
					: 'text-gray-400 hover:text-gray-100 hover:bg-gray-700/50'
					}`}
				aria-label="Light theme"
			>
				<Sun className="w-4 h-4" />
			</button>
			<button
				onClick={() => setTheme('dark')}
				className={`p-2 rounded-full ${theme === 'dark'
					? 'bg-blue-500 text-white'
					: 'text-gray-400 hover:text-gray-100 hover:bg-gray-700/50'
					}`}
				aria-label="Dark theme"
			>
				<Moon className="w-4 h-4" />
			</button>
		</div>
	)
}

// ProgressBar Component
export function ProgressBar() {
	const { progress } = useNavigation()

	// Create a unique class name based on the progress value
	const progressClass = `progress-width-${Math.round(progress)}`

	return (
		<div className="fixed top-0 left-0 right-0 z-50 h-1">
			<div className={`progress-bar ${progressClass}`} />
		</div>
	)
}

// TableOfContents Component
export function TableOfContents() {
	const { sections, activeSection, setActiveSection } = useNavigation()

	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(sectionId)
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' })
			setActiveSection(sectionId)
		}
	}

	return (
		<div className="pr-2 space-y-2">
			<h3 className="mb-4 text-lg font-semibold text-blue-400">Policy Contents</h3>
			{sections.map((section, index) => (
				<button
					key={section.id}
					onClick={() => scrollToSection(section.id)}
					className={`flex items-center gap-2 w-full text-left p-2 rounded-lg transition-all duration-200 ${activeSection === section.id
						? 'bg-blue-500/10 text-blue-400 font-medium'
						: 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
						}`}
				>
					<div
						className={`flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full ${activeSection === section.id ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
							}`}
					>
						{index + 1}
					</div>
					<span>{section.title}</span>
					{activeSection === section.id && <ChevronRight className="w-4 h-4 ml-auto" />}
				</button>
			))}
		</div>
	)
}

// ActionButtons Component
export function ActionButtons({ metadata }: { readonly metadata: PolicyMetadata }) {
	const [isCopying, setIsCopying] = useState(false)
	const [isSharing, setIsSharing] = useState(false)

	const handleCopyLink = async () => {
		setIsCopying(true)
		try {
			await navigator.clipboard.writeText(window.location.href)
			setTimeout(() => setIsCopying(false), 2000)
		} catch (err) {
			console.error('Failed to copy link:', err)
			setIsCopying(false)
		}
	}

	const handleShare = async () => {
		setIsSharing(true)
		try {
			if (navigator.share) {
				await navigator.share({
					title: 'House Edge Blackjack Privacy Policy',
					text: 'Check out the House Edge Blackjack Privacy Policy',
					url: window.location.href,
				})
			} else {
				await handleCopyLink()
			}
		} catch (err) {
			console.error('Error sharing:', err)
		}
		setIsSharing(false)
	}

	return (
		<div className="flex items-center my-4 space-x-2">
			<Button
				onClick={handleCopyLink}
				variant="outline"
				size="sm"
				disabled={isCopying}
				className="flex items-center"
			>
				{isCopying ? (
					<Loader2 className="w-4 h-4 mr-2 animate-spin" />
				) : (
					<Link className="w-4 h-4 mr-2" />
				)}
				Copy Link
			</Button>

			<Button
				onClick={handleShare}
				variant="outline"
				size="sm"
				disabled={isSharing}
				className="flex items-center"
			>
				{isSharing ? (
					<Loader2 className="w-4 h-4 mr-2 animate-spin" />
				) : (
					<Share className="w-4 h-4 mr-2" />
				)}
				Share
			</Button>

			<PDFDownloadButton
				document={<PrivacyPolicyDocument metadata={metadata} />}
				filename="House_Edge_Blackjack_Privacy_Policy"
				buttonText="Download PDF"
			/>
		</div>
	)
}

// PolicyHeader Component
export function PolicyHeader({ metadata }: { readonly metadata: PolicyMetadata }) {
	return (
		<header className="relative py-12 overflow-hidden border-b border-gray-700">
			{/* Background Pattern */}
			<div className="absolute inset-0 z-0 opacity-20">
				<div className="absolute inset-0 background-pattern"></div>
			</div>

			<div className="container relative z-10 px-4 mx-auto">
				<div className="flex flex-col items-center">
					<h1 className="mb-4 text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
						Privacy Policy
					</h1>

					<p className="max-w-2xl mx-auto mt-4 text-lg text-center text-gray-400">
						Your privacy is our priority. Learn how we protect and manage your data on our advanced
						blackjack platform.
					</p>

					<div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
						<div>Version {metadata.version}</div>
						<div className="w-px h-4 bg-gray-700"></div>
						<div>Effective: {new Date(metadata.effectiveDate).toLocaleDateString()}</div>
						<div className="w-px h-4 bg-gray-700"></div>
						<div>Updated: {new Date(metadata.lastModified).toLocaleDateString()}</div>
					</div>
				</div>
			</div>
		</header>
	)
}

// PolicySection Component
export function PolicySection({
	id,
	title,
	subtitle,
	icon: Icon,
	content,
	lastUpdated,
}: {
	readonly id: string
	readonly title: string
	readonly subtitle?: string
	readonly icon: React.ElementType
	readonly content: string[]
	readonly lastUpdated?: string
}) {
	return (
		<section id={id} className="py-12 border-b border-gray-700/50 scroll-mt-24">
			<div className="flex items-start gap-4">
				<div className="p-3 text-blue-400 rounded-xl bg-blue-500/10">
					<Icon className="w-6 h-6" />
				</div>

				<div className="flex-1">
					<div className="flex items-start justify-between mb-6">
						<div>
							<h2 className="text-2xl font-bold text-gray-100">{title}</h2>
							{subtitle && <p className="mt-1 text-gray-400">{subtitle}</p>}
						</div>

						{lastUpdated && (
							<div className="flex items-center gap-1 text-sm text-gray-500">
								<span>Updated:</span>
								<time dateTime={lastUpdated}>{new Date(lastUpdated).toLocaleDateString()}</time>
							</div>
						)}
					</div>

					<div className="space-y-4">
						{content.map((paragraph, idx) => (
							<p key={`${id}-p-${idx}`} className="leading-relaxed text-gray-300">
								{paragraph}
							</p>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}

// PolicyFooter Component
export function PolicyFooter() {
	return (
		<footer className="py-8 mt-12 text-gray-400 border-t border-gray-700 bg-gray-900/80">
			<div className="container px-4 mx-auto">
				<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div className="text-center md:text-left">
						<p>© {new Date().getFullYear()} House Edge Blackjack. All rights reserved.</p>
						<p className="mt-1 text-sm">
							By continuing to use our platform, you acknowledge and agree to this Privacy Policy.
						</p>
					</div>

					<div className="flex flex-wrap justify-center gap-4 mt-4 text-sm md:mt-0">
						<a href="/terms" className="text-gray-400 transition-colors hover:text-blue-400">
							Terms of Service
						</a>
						<span className="text-gray-700">|</span>
						<a href="/privacy-policy" className="text-blue-400">
							Privacy Policy
						</a>
						<span className="text-gray-700">|</span>
						<a href="/cookies" className="text-gray-400 transition-colors hover:text-blue-400">
							Cookie Policy
						</a>
						<span className="text-gray-700">|</span>
						<a href="/contact" className="text-gray-400 transition-colors hover:text-blue-400">
							Contact Us
						</a>
					</div>
				</div>
			</div>
		</footer>
	)
}
