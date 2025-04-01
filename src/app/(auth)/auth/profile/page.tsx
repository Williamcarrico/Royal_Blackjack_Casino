'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/layout/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Define the schema for profile validation
const profileSchema = z.object({
	username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
	display_name: z.string().optional(),
	avatar_url: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
	bio: z.string().max(500, { message: 'Bio must be 500 characters or less' }).optional(),
	birthdate: z
		.date({
			required_error: 'Birthdate is required',
		})
		.refine(
			date => {
				// Calculate age
				const today = new Date()
				const birthDate = new Date(date)
				let age = today.getFullYear() - birthDate.getFullYear()
				const monthDiff = today.getMonth() - birthDate.getMonth()

				if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
					age--
				}

				return age >= 21 // Ensure user is at least 21 years old
			},
			{
				message: 'You must be at least 21 years old to use this platform',
			}
		),
})

// Define the schema for preferences validation
const preferencesSchema = z.object({
	theme: z.enum(['dark', 'light', 'system']),
	sound_enabled: z.boolean(),
	animation_speed: z.enum(['slow', 'normal', 'fast']),
	bet_amount: z.number().min(1).max(1000),
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PreferencesFormValues = z.infer<typeof preferencesSchema>

export default function ProfilePage() {
	const { user, preferences, updateProfile, updatePreferences, isLoading } = useAuth()
	const [activeTab, setActiveTab] = useState('profile')
	const [isUpdating, setIsUpdating] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [ageVerified, setAgeVerified] = useState<boolean | null>(null)

	// Profile form
	const profileForm = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			username: '',
			display_name: '',
			avatar_url: '',
			bio: '',
			birthdate: undefined,
		},
	})

	// Preferences form
	const preferencesForm = useForm<PreferencesFormValues>({
		resolver: zodResolver(preferencesSchema),
		defaultValues: {
			theme: 'dark',
			sound_enabled: true,
			animation_speed: 'normal',
			bet_amount: 10,
		},
	})

	// Function to render age verification badge
	const renderAgeBadge = (showFullText = true) => {
		if (ageVerified === true) {
			return (
				<Badge
					variant="outline"
					className={`${showFullText ? 'ml-2' : ''} text-green-600 border-green-200 bg-green-50`}
				>
					<CheckCircle2 className="w-3 h-3 mr-1" /> {showFullText ? 'Age Verified' : 'Verified'}
				</Badge>
			)
		} else if (ageVerified === false) {
			return (
				<Badge
					variant="outline"
					className={`${showFullText ? 'ml-2' : ''} text-red-600 border-red-200 bg-red-50`}
				>
					<AlertCircle className="w-3 h-3 mr-1" />{' '}
					{showFullText ? 'Age Verification Failed' : 'Failed'}
				</Badge>
			)
		} else {
			return (
				<Badge
					variant="outline"
					className={`${showFullText ? 'ml-2' : ''} bg-amber-50 text-amber-600 border-amber-200`}
				>
					<AlertCircle className="w-3 h-3 mr-1" />{' '}
					{showFullText ? 'Age Verification Needed' : 'Needed'}
				</Badge>
			)
		}
	}

	// Update form defaults when user data is loaded
	useEffect(() => {
		if (user) {
			profileForm.reset({
				username: user.username,
				display_name: user.display_name ?? '',
				avatar_url: user.avatar_url ?? '',
				bio: user.bio ?? '',
				// We'll set birthdate if it exists in the user object, otherwise it remains undefined
				birthdate: user.birthdate ? new Date(user.birthdate) : undefined,
			})

			// Check age verification status
			if (user.birthdate) {
				const birthDate = new Date(user.birthdate)
				const today = new Date()
				let age = today.getFullYear() - birthDate.getFullYear()
				const monthDiff = today.getMonth() - birthDate.getMonth()

				if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
					age--
				}

				setAgeVerified(age >= 21)
			} else {
				setAgeVerified(null)
			}
		}
	}, [user, profileForm])

	// Update preferences form when preferences data is loaded
	useEffect(() => {
		if (preferences) {
			preferencesForm.reset({
				theme: preferences.theme as 'dark' | 'light' | 'system',
				sound_enabled: preferences.sound_enabled,
				animation_speed: preferences.animation_speed as 'slow' | 'normal' | 'fast',
				bet_amount: preferences.bet_amount,
			})
		}
	}, [preferences, preferencesForm])

	const onProfileSubmit = async (data: ProfileFormValues) => {
		setIsUpdating(true)
		setError(null)

		try {
			// Convert the date to ISO string for the API
			const formattedData = {
				...data,
				birthdate: data.birthdate?.toISOString(),
			}

			const { success, error } = await updateProfile(formattedData)
			if (success) {
				toast.success('Profile updated successfully')

				// Update age verification status
				const birthDate = new Date(data.birthdate)
				const today = new Date()
				let age = today.getFullYear() - birthDate.getFullYear()
				const monthDiff = today.getMonth() - birthDate.getMonth()

				if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
					age--
				}

				setAgeVerified(age >= 21)
			} else {
				setError(error ?? 'Failed to update profile')
			}
		} catch (err) {
			console.error('Error updating profile:', err)
			setError('An unexpected error occurred')
		} finally {
			setIsUpdating(false)
		}
	}

	const onPreferencesSubmit = async (data: PreferencesFormValues) => {
		setIsUpdating(true)
		setError(null)

		try {
			const { success, error } = await updatePreferences(data)
			if (success) {
				toast.success('Preferences updated successfully')
			} else {
				setError(error ?? 'Failed to update preferences')
			}
		} catch (err) {
			console.error('Error updating preferences:', err)
			setError('An unexpected error occurred')
		} finally {
			setIsUpdating(false)
		}
	}

	if (isLoading) {
		return (
			<div className="flex h-[80vh] items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		)
	}

	if (!user) {
		return (
			<div className="container p-4 mx-auto">
				<Alert variant="destructive">
					<AlertCircle className="w-4 h-4" />
					<AlertTitle>Authentication Error</AlertTitle>
					<AlertDescription>You must be signed in to view this page</AlertDescription>
				</Alert>
			</div>
		)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className="container p-4 mx-auto"
		>
			<h1 className="mb-6 text-3xl font-bold">Your Profile</h1>

			{ageVerified === false && (
				<Alert variant="destructive" className="mb-6">
					<AlertCircle className="w-4 h-4" />
					<AlertTitle>Age Verification Failed</AlertTitle>
					<AlertDescription>
						You must be at least 21 years old to use this platform.
					</AlertDescription>
				</Alert>
			)}

			{ageVerified === null && (
				<Alert variant="default" className="mb-6 border-amber-200 bg-amber-50">
					<AlertCircle className="w-4 h-4 text-amber-600" />
					<AlertTitle className="text-amber-600">Age Verification Required</AlertTitle>
					<AlertDescription className="text-amber-600">
						Please add your birthdate in the profile section for age verification.
					</AlertDescription>
				</Alert>
			)}

			<Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
				<TabsList className="mb-6">
					<TabsTrigger value="profile">Profile</TabsTrigger>
					<TabsTrigger value="preferences">Preferences</TabsTrigger>
					<TabsTrigger value="statistics">Statistics</TabsTrigger>
				</TabsList>

				{/* Profile Tab */}
				<TabsContent value="profile">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									Profile Information
									{renderAgeBadge(false)}
								</CardTitle>
								<CardDescription>
									Update your personal information and verify your age
								</CardDescription>
							</CardHeader>
							<CardContent>
								{error && (
									<Alert variant="destructive" className="mb-4">
										<AlertCircle className="w-4 h-4" />
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}

								<Form {...profileForm}>
									<form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
										<div className="flex flex-col gap-6 md:flex-row">
											<FormField
												control={profileForm.control}
												name="username"
												render={({ field }) => (
													<FormItem className="flex-1">
														<FormLabel>Username</FormLabel>
														<FormControl>
															<Input {...field} disabled={isUpdating} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={profileForm.control}
												name="display_name"
												render={({ field }) => (
													<FormItem className="flex-1">
														<FormLabel>Display Name</FormLabel>
														<FormControl>
															<Input {...field} disabled={isUpdating} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={profileForm.control}
											name="birthdate"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Date of Birth</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant="outline"
																	className={`w-full pl-3 text-left font-normal ${!field.value && 'text-muted-foreground'}`}
																>
																	{field.value ? (
																		format(field.value, 'PPP')
																	) : (
																		<span>Pick a date</span>
																	)}
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0" align="start">
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																disabled={isUpdating}
																captionLayout="dropdown"
																fromYear={1900}
																toYear={new Date().getFullYear()}
															/>
														</PopoverContent>
													</Popover>
													<FormDescription>
														Must be at least 21 years old to use this platform
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={profileForm.control}
											name="avatar_url"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Avatar URL</FormLabel>
													<FormControl>
														<Input {...field} type="url" disabled={isUpdating} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={profileForm.control}
											name="bio"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Bio</FormLabel>
													<FormControl>
														<Textarea
															placeholder="Tell us about yourself..."
															className="min-h-[100px]"
															{...field}
															disabled={isUpdating}
														/>
													</FormControl>
													<p className="mt-1 text-xs text-muted-foreground">
														{field.value?.length ?? 0}/500 characters
													</p>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="flex justify-end">
											<Button type="submit" disabled={isUpdating}>
												{isUpdating ? (
													<>
														<Loader2 className="w-4 h-4 mr-2 animate-spin" />
														Saving...
													</>
												) : (
													'Save Changes'
												)}
											</Button>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>
					</motion.div>
				</TabsContent>

				{/* Preferences Tab */}
				<TabsContent value="preferences">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Card>
							<CardHeader>
								<CardTitle>Game Preferences</CardTitle>
								<CardDescription>Customize your gaming experience</CardDescription>
							</CardHeader>
							<CardContent>
								{error && (
									<Alert variant="destructive" className="mb-4">
										<AlertCircle className="w-4 h-4" />
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}

								<Form {...preferencesForm}>
									<form
										onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}
										className="space-y-6"
									>
										<div className="space-y-4">
											<FormField
												control={preferencesForm.control}
												name="theme"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Theme</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
															disabled={isUpdating}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select theme" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="dark">Dark</SelectItem>
																<SelectItem value="light">Light</SelectItem>
																<SelectItem value="system">System</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={preferencesForm.control}
												name="sound_enabled"
												render={({ field }) => (
													<FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
														<div className="space-y-0.5">
															<FormLabel className="text-base">Sound Effects</FormLabel>
															<FormDescription>
																Enable sound effects during gameplay
															</FormDescription>
														</div>
														<FormControl>
															<Switch
																checked={field.value}
																onCheckedChange={field.onChange}
																disabled={isUpdating}
																aria-label="Toggle sound effects"
															/>
														</FormControl>
													</FormItem>
												)}
											/>

											<FormField
												control={preferencesForm.control}
												name="animation_speed"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Animation Speed</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
															disabled={isUpdating}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select speed" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="slow">Slow</SelectItem>
																<SelectItem value="normal">Normal</SelectItem>
																<SelectItem value="fast">Fast</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={preferencesForm.control}
												name="bet_amount"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Default Bet Amount</FormLabel>
														<FormControl>
															<Input
																type="number"
																min={1}
																max={1000}
																value={field.value}
																onChange={e => field.onChange(parseInt(e.target.value) || 10)}
																disabled={isUpdating}
															/>
														</FormControl>
														<FormDescription>Set your default bet amount (1-1000)</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<div className="flex justify-end">
											<Button type="submit" disabled={isUpdating}>
												{isUpdating ? (
													<>
														<Loader2 className="w-4 h-4 mr-2 animate-spin" />
														Saving...
													</>
												) : (
													'Save Preferences'
												)}
											</Button>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>
					</motion.div>
				</TabsContent>

				{/* Statistics Tab */}
				<TabsContent value="statistics">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3 }}
					>
						<Card>
							<CardHeader>
								<CardTitle>Game Statistics</CardTitle>
								<CardDescription>Your gaming performance and history</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Total Hands</span>
										<span className="text-2xl font-bold">{user.total_hands_played}</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Hands Won</span>
										<span className="text-2xl font-bold">{user.hands_won}</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Hands Lost</span>
										<span className="text-2xl font-bold">{user.hands_lost}</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Hands Tied</span>
										<span className="text-2xl font-bold">{user.hands_tied}</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Blackjacks Hit</span>
										<span className="text-2xl font-bold">{user.blackjacks_hit}</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Win Rate</span>
										<span className="text-2xl font-bold">
											{user.total_hands_played && user.hands_won
												? ((user.hands_won / user.total_hands_played) * 100).toFixed(1) + '%'
												: '0%'}
										</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Current Streak</span>
										<span className="text-2xl font-bold">{user.current_win_streak}</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Highest Streak</span>
										<span className="text-2xl font-bold">{user.highest_win_streak}</span>
									</motion.div>

									<motion.div
										whileHover={{ scale: 1.02 }}
										className="flex flex-col p-4 border rounded-lg shadow-sm bg-card"
									>
										<span className="text-sm text-muted-foreground">Current Chips</span>
										<span className="text-2xl font-bold">{user.chips}</span>
									</motion.div>
								</div>

								<div className="p-6 mt-8 border rounded-lg">
									<h3 className="mb-4 text-lg font-semibold">Account Information</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-between pb-2 border-b border-border">
											<span className="font-medium">Email</span>
											<span>{user.email}</span>
										</div>
										<div className="flex items-center justify-between pb-2 border-b border-border">
											<span className="font-medium">Account Created</span>
											<span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
										</div>
										<div className="flex items-center justify-between pb-2 border-b border-border">
											<span className="font-medium">Last Login</span>
											<span>
												{user.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="font-medium">Age Verification</span>
											<span>{renderAgeBadge(true)}</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</TabsContent>
			</Tabs>
		</motion.div>
	)
}
