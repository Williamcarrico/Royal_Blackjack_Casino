'use client'
/// <reference types="react" />

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'
import { CheckCircle2, InfoIcon } from 'lucide-react'
import Link from 'next/link'

// UI Components
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'

// Types
type CookiePreference = {
	necessary: boolean
	functional: boolean
	analytics: boolean
	marketing: boolean
}

type CookiePolicy = {
	category: string
	description: string
	required: boolean
	cookies: {
		name: string
		purpose: string
		duration: string
		provider: string
	}[]
}

// Cookie policy data
const cookiePolicies: CookiePolicy[] = [
	{
		category: 'Necessary',
		description:
			'Essential cookies that enable core functionality of the website and security features.',
		required: true,
		cookies: [
			{
				name: 'session',
				purpose: 'Maintains your session state across page requests.',
				duration: 'Session',
				provider: 'House Edge Blackjack',
			},
			{
				name: 'csrf_token',
				purpose: 'Provides protection against Cross-Site Request Forgery attacks.',
				duration: 'Session',
				provider: 'House Edge Blackjack',
			},
			{
				name: 'cookie_consent',
				purpose: 'Stores your cookie consent preferences.',
				duration: '1 year',
				provider: 'House Edge Blackjack',
			},
		],
	},
	{
		category: 'Functional',
		description: 'Cookies that remember your preferences and enhance your experience.',
		required: false,
		cookies: [
			{
				name: 'game_settings',
				purpose: 'Remembers your game settings and preferences.',
				duration: '30 days',
				provider: 'House Edge Blackjack',
			},
			{
				name: 'ui_theme',
				purpose: 'Stores your UI theme preference (light/dark).',
				duration: '1 year',
				provider: 'House Edge Blackjack',
			},
			{
				name: 'last_played',
				purpose: 'Records your most recently played games for quick access.',
				duration: '7 days',
				provider: 'House Edge Blackjack',
			},
		],
	},
	{
		category: 'Analytics',
		description: 'Cookies that collect anonymous information about how you use our website.',
		required: false,
		cookies: [
			{
				name: '_ga',
				purpose: 'Used to distinguish users in Google Analytics.',
				duration: '2 years',
				provider: 'Google Analytics',
			},
			{
				name: '_ga_[ID]',
				purpose: 'Used to maintain session state in Google Analytics.',
				duration: '2 years',
				provider: 'Google Analytics',
			},
			{
				name: 'amplitude_id',
				purpose: 'Tracks user behavior to improve game experience.',
				duration: '2 years',
				provider: 'Amplitude',
			},
		],
	},
	{
		category: 'Marketing',
		description: 'Cookies used to track and deliver personalized advertisements.',
		required: false,
		cookies: [
			{
				name: '_fbp',
				purpose: 'Used by Facebook to deliver advertisements.',
				duration: '3 months',
				provider: 'Facebook',
			},
			{
				name: 'ads_prefs',
				purpose: 'Stores ad personalization preferences.',
				duration: '1 year',
				provider: 'House Edge Blackjack',
			},
			{
				name: '__adroll',
				purpose: 'Used for retargeting by AdRoll.',
				duration: '1 year',
				provider: 'AdRoll',
			},
		],
	},
]

// Helper functions
const saveCookiePreferences = (preferences: CookiePreference) => {
	// Set the cookie using js-cookie
	Cookies.set('cookie_consent', JSON.stringify(preferences), {
		expires: 365, // 1 year
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
	})

	// Apply relevant cookie changes based on preferences
	if (!preferences.analytics) {
		// Clear analytics cookies
		Cookies.remove('_ga', { path: '/' })
		Cookies.remove('_ga_[ID]', { path: '/' })
		Cookies.remove('amplitude_id', { path: '/' })
	}

	if (!preferences.marketing) {
		// Clear marketing cookies
		Cookies.remove('_fbp', { path: '/' })
		Cookies.remove('ads_prefs', { path: '/' })
		Cookies.remove('__adroll', { path: '/' })
	}

	if (!preferences.functional) {
		// Clear functional cookies while preserving necessary ones
		Cookies.remove('game_settings', { path: '/' })
		Cookies.remove('ui_theme', { path: '/' })
		Cookies.remove('last_played', { path: '/' })
	}
}

const getDefaultPreferences = (): CookiePreference => {
	return {
		necessary: true, // Always required
		functional: false,
		analytics: false,
		marketing: false,
	}
}

const CookiePage = () => {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [activeTab, setActiveTab] = useState<string>('preferences')
	const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false)
	const [preferences, setPreferences] = useState<CookiePreference>(getDefaultPreferences())
	const [initialLoad, setInitialLoad] = useState<boolean>(true)
	const [returnPath, setReturnPath] = useState<string>('/')

	// Check for return path in query params
	useEffect(() => {
		const returnTo = searchParams.get('returnTo')
		if (returnTo) {
			setReturnPath(returnTo)
		}
	}, [searchParams])

	// Load existing preferences from cookies
	useEffect(() => {
		if (typeof window !== 'undefined') {
			try {
				const cookieConsent = Cookies.get('cookie_consent')
				if (cookieConsent) {
					const savedPreferences = JSON.parse(cookieConsent)
					setPreferences({
						...getDefaultPreferences(),
						...savedPreferences,
					})
				}
				setInitialLoad(false)
			} catch (error) {
				console.error('Failed to parse cookie preferences:', error)
				setInitialLoad(false)
			}
		}
	}, [])

	// Handle preference changes
	const handleToggle = (type: keyof CookiePreference) => {
		if (type === 'necessary') return // Cannot toggle necessary cookies

		setPreferences(prev => ({
			...prev,
			[type]: !prev[type],
		}))
	}

	// Save preferences and show confirmation
	const handleSave = () => {
		saveCookiePreferences(preferences)
		setShowSuccessDialog(true)
	}

	// Accept all cookies
	const handleAcceptAll = () => {
		const allEnabled: CookiePreference = {
			necessary: true,
			functional: true,
			analytics: true,
			marketing: true,
		}

		setPreferences(allEnabled)
		saveCookiePreferences(allEnabled)
		setShowSuccessDialog(true)
	}

	// Reject all optional cookies
	const handleRejectAll = () => {
		const onlyNecessary: CookiePreference = {
			necessary: true,
			functional: false,
			analytics: false,
			marketing: false,
		}

		setPreferences(onlyNecessary)
		saveCookiePreferences(onlyNecessary)
		setShowSuccessDialog(true)
	}

	// Continue to app after setting preferences
	const handleContinue = () => {
		setShowSuccessDialog(false)
		router.push(returnPath)
	}

	// Loading state
	if (initialLoad) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="w-16 h-16 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
			</div>
		)
	}

	return (
		<div className="container max-w-4xl py-10">
			<Alert className="mb-8">
				<InfoIcon className="w-4 h-4" />
				<AlertTitle>Why we use cookies</AlertTitle>
				<AlertDescription>
					We use cookies to improve your experience, analyze site usage, and assist in our marketing
					efforts. Some cookies are essential for our site to function properly, while others help
					us understand how you interact with our site and tailor content to your interests.
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle>Cookie Settings</CardTitle>
					<CardDescription>
						Customize which cookies you want to allow. Necessary cookies are required for basic site
						functionality.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="details">Cookie Details</TabsTrigger>
						</TabsList>

						<TabsContent value="preferences" className="pt-4 space-y-4">
							{/* Cookie preferences toggles */}
							{Object.keys(preferences).map(type => {
								const key = type as keyof CookiePreference
								const policy = cookiePolicies.find(
									p => p.category.toLowerCase() === key.toLowerCase()
								)

								return (
									<div key={key} className="flex items-center justify-between py-4 border-b">
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<h3 className="font-medium">{policy?.category ?? key}</h3>
												{key === 'necessary' && (
													<span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
														Required
													</span>
												)}
											</div>
											<p className="text-sm text-muted-foreground">{policy?.description}</p>
										</div>
										<Switch
											checked={preferences[key]}
											disabled={key === 'necessary'}
											onCheckedChange={() => handleToggle(key)}
										/>
									</div>
								)
							})}
						</TabsContent>

						<TabsContent value="details">
							<div className="pt-4 space-y-6">
								{cookiePolicies.map(policy => (
									<div key={policy.category} className="space-y-4">
										<div className="flex items-center gap-2 pb-2 border-b">
											<h3 className="font-medium">{policy.category}</h3>
											{policy.required && (
												<span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
													Required
												</span>
											)}
										</div>

										<div className="overflow-x-auto">
											<table className="w-full text-sm">
												<thead>
													<tr className="text-left border-b">
														<th className="px-2 py-2 font-medium">Cookie</th>
														<th className="px-2 py-2 font-medium">Purpose</th>
														<th className="px-2 py-2 font-medium">Duration</th>
														<th className="px-2 py-2 font-medium">Provider</th>
													</tr>
												</thead>
												<tbody>
													{policy.cookies.map(cookie => (
														<tr key={cookie.name} className="border-b">
															<td className="px-2 py-2 font-mono text-xs">{cookie.name}</td>
															<td className="px-2 py-2">{cookie.purpose}</td>
															<td className="px-2 py-2">{cookie.duration}</td>
															<td className="px-2 py-2">{cookie.provider}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								))}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
				<CardFooter className="flex flex-col justify-between gap-3 sm:flex-row">
					<div className="flex gap-3">
						<Button variant="outline" onClick={handleRejectAll}>
							Reject All
						</Button>
						<Button variant="outline" onClick={handleAcceptAll}>
							Accept All
						</Button>
					</div>
					<Button onClick={handleSave}>Save Preferences</Button>
				</CardFooter>
			</Card>

			<div className="mt-8 text-sm text-center text-muted-foreground">
				<p>
					For more information about how we use cookies and your data, please read our{' '}
					<Link href="/privacy-policy" className="underline text-primary underline-offset-4">
						Privacy Policy
					</Link>{' '}
					and{' '}
					<Link href="/terms-of-service" className="underline text-primary underline-offset-4">
						Terms of Service
					</Link>
					.
				</p>
			</div>

			{/* Success Dialog */}
			<Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
				<DialogContent>
					<DialogHeader>
						<div className="flex items-center gap-2">
							<CheckCircle2 className="w-6 h-6 text-primary" />
							<DialogTitle>Preferences Saved</DialogTitle>
						</div>
						<DialogDescription>
							Your cookie preferences have been successfully saved.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={handleContinue}>
							Continue to {returnPath === '/' ? 'Home' : 'Game'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default CookiePage
