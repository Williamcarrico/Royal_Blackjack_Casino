// src/app/layout.tsx
import React from 'react'
import { Inter, Playfair_Display, Cinzel_Decorative } from 'next/font/google'
import { Metadata, Viewport } from 'next'
import Header from '../layout/Navbar'
import Footer from '../layout/Footer'
import { cn } from '../lib/utils/utils'
import './globals.css'
import { Toaster as SonnerToaster } from 'sonner'
import Providers from './providers'
import AuthProviderWrapper from '@/components/providers/AuthProviderWrapper'
import { validateConfig } from '@/lib/utils/validateConfig'

// Add JSX namespace for intrinsic elements
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
	namespace JSX {
		interface IntrinsicElements {
			html: React.DetailedHTMLProps<React.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>;
			head: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>;
			body: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>;
			div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
			main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
			link: React.DetailedHTMLProps<React.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>;
		}
	}
}
/* eslint-enable @typescript-eslint/no-namespace */

// Configure fonts with optimized loading
const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
	display: 'swap',
	preload: false,
})

const playfair = Playfair_Display({
	subsets: ['latin'],
	variable: '--font-playfair',
	display: 'swap',
	preload: false,
})

const cinzelDecorative = Cinzel_Decorative({
	weight: ['400', '700', '900'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--font-cinzel-decorative',
	preload: false,
})

// Enhanced metadata for better SEO and sharing
export const metadata: Metadata = {
	title: 'Royal Blackjack Casino | Experience Authentic Vegas Blackjack',
	description: 'Experience the thrill of Las Vegas blackjack with our premium casino game featuring realistic physics, strategy guides, and immersive gameplay.',
	keywords: 'blackjack, casino, card game, gambling, strategy, vegas, las vegas, 21, card counting, casino game, royal blackjack',
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
	verification: {
		google: 'google-site-verification-code', // Replace with actual verification code if available
	},
	applicationName: 'Royal Blackjack Casino',
}

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: '#000000',
	colorScheme: 'dark',
}

// Run validation in a try/catch block
try {
	validateConfig()
} catch (error) {
	console.error('Environment configuration error:', error)
	// Validation errors will be handled during rendering
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
			cinzelDecorative.variable,
			'font-sans',
			'scroll-smooth'
		)} suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link rel="prefetch" href="/og-image.jpg" as="image" />
				<link rel="prefetch" href="/twitter-image.jpg" as="image" />
				<link rel="preload" href="/images/Royal-Blackjack-Logo.png" as="image" />
			</head>
			<body
				className={cn(
					'min-h-screen text-white antialiased relative',
					'bg-gradient-to-b from-black via-gray-950 to-black',
					'dark:bg-gradient-to-b dark:from-gray-950 dark:via-black dark:to-gray-950',
					'selection:bg-gold selection:text-black'
				)}
			>
				{/* Ambient casino background effect overlay */}
				<div className="fixed inset-0 z-0 pointer-events-none bg-vegas-card-pattern opacity-5" />
				<div className="fixed inset-0 z-0 pointer-events-none ambient-lighting" />

				<AuthProviderWrapper>
					<Providers>
						<div className="relative z-10 flex flex-col min-h-screen">
							<Header />
							<main className="flex-1">{children}</main>
							<Footer />
						</div>
						<div id="toaster-container"></div>
						<SonnerToaster
							richColors
							position="top-right"
							toastOptions={{
								className: 'shadow-gold glass-gold',
								duration: 5000,
							}}
						/>
					</Providers>
				</AuthProviderWrapper>
			</body>
		</html>
	)
}
