'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { AuthCard } from '@/components/auth/auth-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { AuthFooter } from '@/components/auth/auth-footer'
import { z } from 'zod'

// Password validation schema
const passwordSchema = z.object({
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			'Password must include uppercase, lowercase and number'
		),
})

export default function UpdatePasswordPage() {
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setIsLoading(true)

		// Validate passwords match
		if (password !== confirmPassword) {
			setError('Passwords do not match')
			setIsLoading(false)
			return
		}

		// Validate password meets requirements
		try {
			passwordSchema.parse({ password })
		} catch (err) {
			if (err instanceof z.ZodError) {
				setError(err.errors?.[0]?.message ?? 'Password validation failed');
				setIsLoading(false)
				return
			}
		}

		try {
			const { error } = await supabase.auth.updateUser({
				password,
			})

			if (error) {
				setError(error.message)
			} else {
				setSuccess(true)
				// Redirect after a short delay
				setTimeout(() => {
					router.push('/auth/sign-in')
				}, 3000)
			}
		} catch (err) {
			console.error('Error updating password:', err)
			setError('Failed to update password')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<AuthCard
			title="Update Password"
			description="Enter your new password below to update your account."
			footer={<AuthFooter links={[{ label: 'Return to sign in', href: '/auth/sign-in' }]} />}
		>
			{success ? (
				<Alert className="mb-4 text-green-800 border-green-200 bg-green-50">
					<AlertDescription>
						Password updated successfully! You will be redirected to sign in...
					</AlertDescription>
				</Alert>
			) : (
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<div className="space-y-2">
						<Label htmlFor="password">New Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
							required
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm New Password</Label>
						<Input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
							required
							disabled={isLoading}
						/>
						<p className="text-xs text-muted-foreground">
							Password must be at least 8 characters and include uppercase, lowercase, and number.
						</p>
					</div>
					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Updating...
							</>
						) : (
							'Update Password'
						)}
					</Button>
				</form>
			)}
		</AuthCard>
	)
}
