"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { format } from 'date-fns'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import type { Country } from '@/types/supabase'

// Helper function to check if user is at least 21 years old
const isAtLeast21 = (date: Date): boolean => {
	const today = new Date()
	let age = today.getFullYear() - date.getFullYear()
	const monthDifference = today.getMonth() - date.getMonth()

	// Adjust age if birth month is after current month, or same month but birth day is after current day
	if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < date.getDate())) {
		age--
	}

	return age >= 21
}

// Form validation schema
const signUpSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	username: z.string()
		.min(3, { message: "Username must be at least 3 characters" })
		.max(20, { message: "Username must be less than 20 characters" })
		.regex(/^\w+$/, { message: "Username can only contain letters, numbers, and underscores" }),
	password: z.string()
		.min(8, { message: "Password must be at least 8 characters" })
		.regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
		.regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
		.regex(/\d/, { message: "Password must contain at least one number" }),
	dateOfBirth: z.date({
		required_error: "Date of birth is required",
	}).refine(isAtLeast21, {
		message: "You must be at least 21 years old to create an account"
	}),
	country: z.string({
		required_error: "Country is required",
	})
})

type SignUpFormValues = z.infer<typeof signUpSchema>

const SignUp = () => {
	const [isLoading, setIsLoading] = useState(false)
	const [countries, setCountries] = useState<Country[]>([])
	const [loadingCountries, setLoadingCountries] = useState(true)

	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: '',
			username: '',
			password: '',
		}
	})

	useEffect(() => {
		const fetchCountries = async () => {
			try {
				setLoadingCountries(true);
				const { data, error } = await supabase
					.from('countries')
					.select('*')
					.order('name', { ascending: true })

				if (error) {
					throw error
				}

				if (!data || data.length === 0) {
					console.warn('No countries returned from database');
					toast.error('Failed to load countries data');
				}

				setCountries(data || [])
				console.log('Countries fetched:', data); // Debug countries data
			} catch (error) {
				console.error('Error fetching countries:', error)
				toast.error('Failed to load countries')
			} finally {
				setLoadingCountries(false)
			}
		}

		fetchCountries()
	}, [])

	const handleSignUp = async (values: SignUpFormValues) => {
		setIsLoading(true)
		try {
			// Validate form values again before submission
			if (!values.email || !values.username || !values.password || !values.dateOfBirth || !values.country) {
				toast.error('Please fill in all required fields');
				return;
			}

			console.log('Submitting signup form with values:', {
				...values,
				dateOfBirth: format(values.dateOfBirth, 'yyyy-MM-dd'),
				password: '[REDACTED]'
			});

			// First, register the user with Supabase Auth
			const { data: authData, error: authError } = await supabase.auth.signUp({
				email: values.email,
				password: values.password,
			})

			if (authError) {
				toast.error(authError.message)
				console.error('Error signing up:', authError.message)
				return
			}

			// If auth signup was successful, create the user profile
			if (authData.user) {
				console.log('Auth successful, creating user profile');

				// Create user profile with more detailed error handling
				const { data: profileData, error: profileError } = await supabase
					.from('user_profiles')
					.insert({
						id: authData.user.id,
						username: values.username,
						email: values.email,
						country_code: values.country,
						date_of_birth: format(values.dateOfBirth, 'yyyy-MM-dd'),
					})
					.select()

				if (profileError) {
					// Log more details about the error
					console.error('Error creating profile - full details:', JSON.stringify(profileError))

					let errorMessage = 'Error creating your profile';

					// Check for specific error types
					if (profileError.code === '23505') {
						// Unique violation error code
						if (profileError.message?.includes('username')) {
							errorMessage = 'Username already exists. Please choose another username.';
						} else if (profileError.message?.includes('email')) {
							errorMessage = 'Email already exists. Please use another email or sign in.';
						}
					} else if (profileError.code === '23503') {
						// Foreign key violation
						errorMessage = 'Invalid country selected. Please try again.';
					} else if (profileError.code === '42P01') {
						errorMessage = 'Database configuration issue. Please contact support.';
					}

					// Clean up the auth user since profile creation failed
					console.log('Cleaning up auth user after profile creation failure');
					await supabase.auth.signOut()
					toast.error(errorMessage)
					return
				}

				console.log('Profile created successfully:', profileData);

				// Create default user preferences
				console.log('Creating user preferences');
				const { error: preferencesError } = await supabase
					.from('user_preferences')
					.insert({
						user_id: authData.user.id,
					})
					.select()

				if (preferencesError) {
					console.error('Error creating preferences - full details:', JSON.stringify(preferencesError))
					// We don't need to fail the whole sign-up if just the preferences creation fails
					// but we should log it
				}

				toast.success('Sign up successful! Please check your email for verification.')
				form.reset()
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
			toast.error(errorMessage)
			console.error('Error in sign up process:', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full max-w-md mx-auto shadow-lg">
			<CardHeader>
				<CardTitle className="text-2xl font-bold">Create an account</CardTitle>
				<CardDescription>
					Enter your details to sign up (must be 21+ years old)
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter your email"
											type="email"
											{...field}
											disabled={isLoading}
											autoComplete="email"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input
											placeholder="Choose a username"
											type="text"
											{...field}
											disabled={isLoading}
											autoComplete="username"
										/>
									</FormControl>
									<FormDescription>
										3-20 characters, letters, numbers and underscores only
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="dateOfBirth"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Date of Birth</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														"w-full pl-3 text-left font-normal",
														!field.value && "text-muted-foreground"
													)}
													disabled={isLoading}
												>
													{field.value ? (
														format(field.value, "PPP")
													) : (
														<span>Select your date of birth</span>
													)}
													<CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={field.value}
												onSelect={field.onChange}
												disabled={isLoading}
												captionLayout="dropdown"
												fromYear={1900}
												toYear={new Date().getFullYear()}
												initialFocus
												className="border rounded-md shadow-md bg-card"
												classNames={{
													day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
													day_today: "bg-accent text-accent-foreground",
													day: "text-foreground hover:bg-accent hover:text-accent-foreground"
												}}
											/>
										</PopoverContent>
									</Popover>
									<FormDescription>
										You must be at least 21 years old to sign up
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="country"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Country</FormLabel>
									<Select
										disabled={isLoading || loadingCountries}
										onValueChange={field.onChange}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select your country" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{loadingCountries ? (
												<div className="flex items-center justify-center p-2">
													<Loader2 className="w-4 h-4 animate-spin" />
													<span className="ml-2">Loading countries...</span>
												</div>
											) : (
												countries.map((country) => (
													<SelectItem
														key={country.code}
														value={country.code}
														disabled={!country.allowed}
													>
														{country.name}
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											placeholder="Create a password"
											type="password"
											{...field}
											disabled={isLoading}
											autoComplete="new-password"
										/>
									</FormControl>
									<FormDescription>
										Password must be at least 8 characters with uppercase, lowercase, and numbers
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="w-full mt-6 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Creating account...
								</>
							) : (
								"Sign Up"
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
			<CardFooter className="flex justify-center p-4 border-t">
				<p className="text-sm text-muted-foreground">
					Already have an account?{" "}
					<Button variant="link" className="h-auto p-0" asChild>
						<Link href="/auth/sign-in">Sign In</Link>
					</Button>
				</p>
			</CardFooter>
		</Card>
	)
}

export default SignUp