/**
 * @module app/settings/page
 * @description Settings dashboard page for customizing game options
 */

import React from 'react'
import { Metadata } from 'next'
import { SettingsDashboard } from '@/components/dashboard/SettingsDashboard'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
	title: 'Settings | Royal Edge Blackjack',
	description:
		'Customize your blackjack gaming experience with visual, gameplay, and advanced settings.',
}

export default function SettingsPage() {
	return (
		<>
			<main className="container p-4 pt-24 mx-auto mt-16 max-w-7xl">
				<SettingsDashboard />
			</main>
			<Toaster />
		</>
	)
}
