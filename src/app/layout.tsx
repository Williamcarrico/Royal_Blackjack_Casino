// src/app/layout.tsx
import React from 'react'
import { Inter, Playfair_Display } from 'next/font/google'
import { Metadata, Viewport } from 'next'
import Header from '../layout/Navbar'
import Footer from '../layout/Footer'
import { cn } from '../lib/utils/utils'
import './globals.css'
import { Toaster as SonnerToaster } from 'sonner'
import Providers from './providers'
import AuthProviderWrapper from '@/components/providers/AuthProviderWrapper'

// Configure fonts
const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
	display: 'swap',
})

const playfair = Playfair_Display({
	subsets: ['latin'],
	variable: '--font-playfair',
	display: 'swap',
})

export const metadata: Metadata = {
	title: 'Royal Blackjack Casino | Experience Authentic Vegas Blackjack',
	description: 'Experience the thrill of Las Vegas blackjack with our premium casino game featuring realistic physics, strategy guides, and immersive gameplay.',
	keywords: 'blackjack, casino, card game, gambling, strategy, vegas, las vegas, 21, card counting, casino game',
	authors: [{ name: 'House Edge Gaming' }],
	creator: 'House Edge Gaming',
	publisher: 'House Edge Gaming',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	metadataBase: new URL('https://royalblackjackcasino.com'),
	alternates: {
		canonical: '/',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-video-preview': -1,
			'max-snippet': -1,
		},
	},
	openGraph: {
		type: 'website',
		url: 'https://royalblackjackcasino.com',
		title: 'Royal Blackjack Casino | Experience Authentic Vegas Blackjack',
		description: 'Experience the thrill of Las Vegas blackjack with our premium casino game featuring realistic physics, strategy guides, and immersive gameplay.',
		siteName: 'Royal Blackjack Casino',
		images: [
			{
				url: '/og-image.jpg',
				width: 1200,
				height: 630,
				alt: 'Royal Blackjack Casino',
			}
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Royal Blackjack Casino | Experience Authentic Vegas Blackjack',
		description: 'Experience the thrill of Las Vegas blackjack with our premium casino game featuring realistic physics, strategy guides, and immersive gameplay.',
		creator: '@HouseEdgeGaming',
		images: ['/twitter-image.jpg'],
	},
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: '#000000',
	colorScheme: 'dark',
}

export default function RootLayout({
	children,
}: {
	readonly children: React.ReactNode;
}) {
	return (
		<html lang="en" className={cn(
			inter.variable,
			playfair.variable,
			'font-sans',
			'scroll-smooth'
		)} suppressHydrationWarning>
			<body
				className={cn(
					'min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white antialiased',
					'dark:bg-gradient-to-b dark:from-gray-950 dark:via-black dark:to-gray-950'
				)}
			>
				<AuthProviderWrapper>
					<Providers>
						<div className="relative flex flex-col min-h-screen">
							<Header />
							<main className="flex-1">{children}</main>
							<Footer />
						</div>
						<div id="toaster-container"></div>
						<SonnerToaster richColors position="top-right" />
					</Providers>
				</AuthProviderWrapper>
			</body>
		</html>
	)
}
