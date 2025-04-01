'use client'

import React, { Suspense, lazy } from 'react'
import { ThemeProvider } from '@/components/privacy-policy/ThemeProvider'
import { NavigationProvider } from '@/components/privacy-policy/NavigationProvider'
import { policySections, policyMetadata } from '@/components/privacy-policy/policyContent'
import {
	ProgressBar,
	ThemeSwitcher,
	TableOfContents,
	ActionButtons,
	PolicyHeader,
	PolicySection,
} from '@/components/privacy-policy/components/index'

// Use React.lazy for components that might not be immediately needed
const SearchDialog = lazy(() => import('@/components/privacy-policy/SearchDialog'))

export default function PrivacyPolicyClient() {
	const [isSearchOpen, setIsSearchOpen] = React.useState(false)
	const [sidebarVisible, setSidebarVisible] = React.useState(true)

	// Effect to handle sidebar visibility based on screen size
	React.useEffect(() => {
		const handleResize = () => {
			setSidebarVisible(window.innerWidth >= 1024)
		}

		// Initial check
		handleResize()

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return (
		<ThemeProvider>
			<NavigationProvider sections={policySections}>
				{/* Progress indicator */}
				<ProgressBar />

				{/* Main Layout */}
				<div className="flex flex-col min-h-screen text-gray-900 transition-colors duration-300 bg-white dark:bg-gray-900 dark:text-gray-100">
					{/* Header */}
					<PolicyHeader metadata={policyMetadata} />

					{/* Content area with sidebar */}
					<div className="container flex flex-col px-4 mx-auto lg:flex-row">
						{/* Sidebar for larger screens */}
						{sidebarVisible && (
							<aside className="w-full py-8 lg:w-64 xl:w-72 lg:sticky lg:top-8 lg:self-start lg:pr-8">
								<div className="sticky top-8">
									<div className="flex items-center justify-between mb-6">
										<h2 className="text-xl font-semibold">Navigation</h2>
										<ThemeSwitcher />
									</div>

									<TableOfContents />

									<div className="p-4 mt-8 border rounded-lg bg-blue-500/10 border-blue-500/20">
										<h3 className="mb-2 text-sm font-medium text-blue-500">Need Help?</h3>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											If you have questions about our privacy practices, please contact our privacy
											team.
										</p>
										<button
											className="w-full py-2 mt-3 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
											onClick={() => (window.location.href = '/contact')}
										>
											Contact Privacy Team
										</button>
									</div>
								</div>
							</aside>
						)}

						{/* Main content area */}
						<main className="flex-1 py-8">
							{/* Mobile view toggle for sidebar */}
							<div className="flex items-center justify-between mb-6 lg:hidden">
								<button
									onClick={() => setSidebarVisible(!sidebarVisible)}
									className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md dark:bg-gray-800"
								>
									{sidebarVisible ? 'Hide Navigation' : 'Show Navigation'}
								</button>

								<ThemeSwitcher />
							</div>

							{/* Policy sections */}
							<div className="space-y-8">
								{policySections.map(section => (
									<PolicySection
										key={section.id}
										id={section.id}
										title={section.title}
										subtitle={section.subtitle}
										icon={section.icon}
										content={section.content}
										lastUpdated={section.lastUpdated}
									/>
								))}
							</div>
						</main>
					</div>

					{/* Floating action buttons */}
					<ActionButtons metadata={policyMetadata} />

					{/* Search dialog */}
					{isSearchOpen && (
						<Suspense fallback={null}>
							<SearchDialog
								isOpen={isSearchOpen}
								onClose={() => setIsSearchOpen(false)}
								sections={policySections}
							/>
						</Suspense>
					)}
				</div>
			</NavigationProvider>
		</ThemeProvider>
	)
}
