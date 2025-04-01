import { Metadata, Viewport } from 'next'
import React from 'react'

export const metadata: Metadata = {
	title: 'House Rules - Blackjack',
	description: 'Review the detailed house rules for playing Blackjack on our platform.',
	keywords: 'blackjack, house rules, rules, gameplay, payouts, dealer rules',
	themeColor: '#000000',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
}

export default function HouseRulesLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return <>{children}</>
}
