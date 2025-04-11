/**
 * @module app/settings/page
 * @description Settings dashboard page for customizing game options with enhanced user experience
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { SettingsDashboard } from '@/components/dashboard/SettingsDashboard'
import { Toaster } from '@/components/ui/sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
	title: 'Settings | Royal Edge Blackjack',
	description:
		'Customize your blackjack gaming experience with visual, gameplay, and advanced settings.',
	keywords: 'blackjack settings, casino customization, game preferences',
	openGraph: {
		title: 'Settings | Royal Edge Blackjack',
		description: 'Personalize your Royal Edge Blackjack experience with custom settings',
		type: 'website',
	},
}

function SettingsLoader() {
	return (
		<Card className="w-full">
			<CardContent className="p-6 space-y-6">
				<div className="space-y-2">
					<Skeleton className="h-8 w-[250px]" />
					<Skeleton className="h-4 w-[400px]" />
				</div>
				<div className="space-y-4">
					<Skeleton className="h-[200px] w-full rounded-lg" />
					<Skeleton className="h-[150px] w-full rounded-lg" />
				</div>
			</CardContent>
		</Card>
	)
}

export default function SettingsPage() {
	return (
		<main className="flex flex-col min-h-screen">
			<div className="container p-4 pt-24 mx-auto mt-16 max-w-7xl">
				<Suspense fallback={<SettingsLoader />}>
					<SettingsDashboard />
				</Suspense>
			</div>
			<Toaster position="top-right" closeButton richColors />
		</main>
	)
}
