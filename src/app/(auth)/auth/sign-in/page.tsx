'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Github, Mail, ArrowRight } from 'lucide-react'
import { AuthCard } from '@/components/auth/auth-card'
import { AuthFooter } from '@/components/auth/auth-footer'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required'),
	rememberMe: z.boolean().optional().default(false),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function SignInPage() {
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { login } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const redirect = searchParams.get('redirect')

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
			rememberMe: false,
		},
	})

	// Auto focus on email field when component mounts
	useEffect(() => {
		const emailInput = document.getElementById('email')
		if (emailInput) emailInput.focus()
	}, [])

	const togglePasswordVisibility = useCallback(() => {
		setShowPassword(prev => !prev)
	}, [])

	const onSubmit = useCallback(
		async (data: LoginFormValues) => {
			setError(null)
			setIsLoading(true)

			try {
				// Call the login method instead of signIn
				await login(data.email, data.password)

				// Redirect to the intended page or default to home
				const redirectUrl = redirect ? decodeURIComponent(redirect) : '/'
				router.push(redirectUrl)
			} catch (err) {
				setError('An unexpected error occurred')
				console.error('Login error:', err)
				form.setFocus('email')
			} finally {
				setIsLoading(false)
			}
		},
		[login, redirect, router, form]
	)

	const handleSocialSignIn = useCallback(
		(provider: string) => {
			setIsLoading(true)
			setError(null)
			// Implementation would depend on your auth provider
			console.log(`Sign in with ${provider}`)
			// For demonstration purposes:
			setTimeout(() => {
				setIsLoading(false)
				// Redirect after successful login
				router.push('/')
			}, 1500)
		},
		[router]
	)

	return (
		<div className="duration-500 animate-in fade-in">
			<AuthCard
				title="Welcome Back"
				description="Sign in to your account to continue"
				footer={
					<AuthFooter
						links={[
							{ label: "Don't have an account?", href: '/auth/sign-up' },
							{ label: 'Forgot password?', href: '/auth/reset-password' },
						]}
					/>
				}
				className="overflow-hidden border-none shadow-2xl bg-white/95 dark:bg-slate-900/95"
			>
				<div className="space-y-6">
					{error && (
						<Alert
							variant="destructive"
							role="alert"
							aria-live="assertive"
							className="border-l-4 border-l-destructive animate-in fade-in slide-in-from-top-5"
						>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="grid grid-cols-2 gap-3 mb-4">
						<Button
							type="button"
							variant="outline"
							size="lg"
							className="w-full transition-all duration-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
							onClick={() => handleSocialSignIn('github')}
							disabled={isLoading}
						>
							<Github className="mr-2 size-4" />
							<span>GitHub</span>
						</Button>
						<Button
							type="button"
							variant="outline"
							size="lg"
							className="w-full transition-all duration-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
							onClick={() => handleSocialSignIn('google')}
							disabled={isLoading}
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="mr-2 size-4" viewBox="0 0 48 48">
								<path
									fill="#FFC107"
									d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
								/>
								<path
									fill="#FF3D00"
									d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
								/>
								<path
									fill="#4CAF50"
									d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
								/>
								<path
									fill="#1976D2"
									d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
								/>
							</svg>
							<span>Google</span>
						</Button>
					</div>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator className="w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
								Or continue with Email
							</span>
						</div>
					</div>

					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email" className="text-sm font-medium">
								Email
							</Label>
							<div className="relative">
								<Mail className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-slate-500 dark:text-slate-400" />
								<Input
									id="email"
									type="email"
									placeholder="you@example.com"
									aria-required="true"
									aria-invalid={!!form.formState.errors.email}
									aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
									{...form.register('email')}
									disabled={isLoading}
									className={cn(
										'pl-10 h-11 rounded-md',
										form.formState.errors.email && 'border-destructive',
										'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
									)}
								/>
							</div>
							{form.formState.errors.email && (
								<p id="email-error" className="mt-1 text-sm text-destructive">
									{form.formState.errors.email.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password" className="text-sm font-medium">
									Password
								</Label>
								<Link
									href="/auth/reset-password"
									className="text-xs rounded text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900"
								>
									Forgot password?
								</Link>
							</div>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? 'text' : 'password'}
									aria-required="true"
									aria-invalid={!!form.formState.errors.password}
									aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
									{...form.register('password')}
									disabled={isLoading}
									className={cn(
										'h-11 rounded-md',
										form.formState.errors.password && 'border-destructive',
										'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
									)}
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute w-8 h-8 p-0 -translate-y-1/2 right-2 top-1/2 hover:bg-transparent"
									onClick={togglePasswordVisibility}
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</Button>
							</div>
							{form.formState.errors.password && (
								<p id="password-error" className="mt-1 text-sm text-destructive">
									{form.formState.errors.password.message}
								</p>
							)}
						</div>

						<div className="flex items-center my-6 space-x-2">
							<Checkbox id="rememberMe" {...form.register('rememberMe')} disabled={isLoading} />
							<Label
								htmlFor="rememberMe"
								className="text-sm font-normal cursor-pointer text-slate-700 dark:text-slate-300"
							>
								Remember me for 30 days
							</Label>
						</div>

						<div>
							<Button
								type="submit"
								className="w-full text-base font-medium transition-all duration-200 shadow-md h-11 hover:shadow-lg group"
								disabled={isLoading}
								aria-busy={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
										Signing in...
									</>
								) : (
									<>
										Sign In
										<ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
									</>
								)}
							</Button>
						</div>
					</form>
				</div>
			</AuthCard>
		</div>
	)
}
