'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail } from 'lucide-react'
import { AuthCard } from '@/components/auth/auth-card'
import { AuthFooter } from '@/components/auth/auth-footer'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { Label } from '@/components/ui/label'

// Define schema with proper validation
const resetSchema = z.object({
	email: z
		.string({ required_error: 'Email is required' })
		.min(1, 'Email is required')
		.email('Please enter a valid email address'),
})

export default function ResetPasswordPage() {
	const [success, setSuccess] = useState(false)
	const [submittedEmail, setSubmittedEmail] = useState('')
	const [globalError, setGlobalError] = useState<string | null>(null)
	const { resetPassword } = useAuth()

	// Initialize form with TanStack Form v1.0+
	const form = useForm({
		defaultValues: {
			email: '',
		},
		async onSubmit({ value }) {
			setGlobalError(null)
			try {
				// Attempt to reset password
				const { success, error } = await resetPassword(value.email)

				if (success) {
					setSuccess(true)
					setSubmittedEmail(value.email)
					form.reset()
				} else {
					// Instead of using setFieldError, we'll set the global error
					// since we don't have direct access to field errors
					setGlobalError(error ?? 'Failed to send password reset email')
				}
			} catch (err) {
				console.error('Password reset error:', err)
				setGlobalError('An unexpected error occurred')
			}
		},
	})

	return (
		<AuthCard
			title="Reset Password"
			description="Enter your email address and we'll send you a link to reset your password"
			footer={<AuthFooter link="/auth/sign-in" label="Return to sign in" />}
		>
			{success ? (
				<Alert className="mb-4 text-green-800 border-green-200 bg-green-50">
					<AlertDescription className="flex items-start gap-2">
						<Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
						<span>
							If an account exists with that email, we&apos;ve sent password reset instructions to{' '}
							<span className="font-medium">{submittedEmail}</span>. Please check your inbox (and
							spam folder).
						</span>
					</AlertDescription>
				</Alert>
			) : (
				<form
					onSubmit={e => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className="space-y-4"
				>
					{globalError && (
						<Alert variant="destructive">
							<AlertDescription>{globalError}</AlertDescription>
						</Alert>
					)}

					<form.Field
						name="email"
						validators={{
							onChange: value => {
								const result = resetSchema.shape.email.safeParse(value)
								if (!result.success) {
									return result.error.errors[0]?.message ?? 'Invalid email'
								}
								return undefined
							},
						}}
					>
						{field => (
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="you@example.com"
									autoComplete="email"
									disabled={form.state.isSubmitting}
									aria-describedby="email-error"
									className="transition-all duration-200"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={e => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors && (
									<p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
								)}
							</div>
						)}
					</form.Field>

					<Button
						type="submit"
						className="w-full transition-all duration-200"
						disabled={form.state.isSubmitting}
					>
						{form.state.isSubmitting ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Sending...
							</>
						) : (
							'Send Reset Link'
						)}
					</Button>
				</form>
			)}
		</AuthCard>
	)
}
