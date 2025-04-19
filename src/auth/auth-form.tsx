'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { AuthCard } from '@/components/auth/auth-card'
import { AuthFooter } from '@/components/auth/auth-footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

// Form validation schemas
const signInSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" }),
    password: z
        .string()
        .min(1, { message: "Password is required" }),
})

const signUpSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters" })
        .max(30, { message: "Username must not exceed 30 characters" })
        .regex(/^\w+$/, { message: "Username can only contain letters, numbers, and underscores" }),
    email: z
        .string()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" }),
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/\d/, { message: "Password must contain at least one number" }),
    confirmPassword: z
        .string()
        .min(1, { message: "Please confirm your password" }),
    terms: z
        .boolean()
        .refine(val => val === true, { message: "You must agree to the terms and conditions" }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

const resetPasswordSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" }),
})

type SignInFormValues = z.infer<typeof signInSchema>
type SignUpFormValues = z.infer<typeof signUpSchema>
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

type AuthFormMode = 'sign-in' | 'sign-up' | 'reset-password'

interface AuthFormProps {
    readonly defaultMode?: AuthFormMode
    readonly redirectAfterSuccess?: string
    readonly showSocialLogin?: boolean
    readonly showTabs?: boolean
    readonly cardVariant?: 'default' | 'premium' | 'bordered'
    readonly cardSize?: 'default' | 'sm' | 'lg'
}

export function AuthForm({
    defaultMode = 'sign-in',
    redirectAfterSuccess = '/dashboard',
    showSocialLogin = true,
    showTabs = true,
    cardVariant = 'default',
    cardSize = 'default',
}: AuthFormProps) {
    const [formMode, setFormMode] = useState<AuthFormMode>(defaultMode)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [passwordResetSent, setPasswordResetSent] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl') ?? redirectAfterSuccess

    const { signIn, signUp, resetPassword } = useAuth()

    // Sign in form
    const signInForm = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    // Sign up form
    const signUpForm = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            terms: false,
        },
    })

    // Reset password form
    const resetPasswordForm = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            email: '',
        },
    })

    const handleSignIn = async (values: SignInFormValues) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn(values.email, values.password)

            if (result.success) {
                toast.success('Signed in successfully!')
                router.push(returnUrl)
            } else {
                setError(result.error ?? 'Failed to sign in')
            }
        } catch (err) {
            setError('An unexpected error occurred')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignUp = async (values: SignUpFormValues) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signUp(values.email, values.password, values.username)

            if (result.success) {
                toast.success('Account created successfully!')
                router.push(returnUrl)
            } else {
                setError(result.error ?? 'Failed to create account')
            }
        } catch (err) {
            setError('An unexpected error occurred')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (values: ResetPasswordFormValues) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await resetPassword(values.email)

            if (result.success) {
                setPasswordResetSent(true)
                toast.success('Password reset email sent')
            } else {
                setError(result.error ?? 'Failed to send password reset email')
            }
        } catch (err) {
            setError('An unexpected error occurred')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const switchMode = (mode: AuthFormMode) => {
        setFormMode(mode)
        setError(null)

        // Clear form error messages
        if (mode === 'sign-in') signInForm.clearErrors()
        if (mode === 'sign-up') signUpForm.clearErrors()
        if (mode === 'reset-password') resetPasswordForm.clearErrors()
    }

    const togglePassword = () => setShowPassword(!showPassword)
    const toggleConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword)

    // Get the correct form component based on mode
    const renderFormContent = () => {
        if (formMode === 'reset-password' && passwordResetSent) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="py-8 text-center"
                >
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                            <Mail className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <h3 className="mb-2 text-xl font-semibold">Check your email</h3>
                    <p className="mb-6 text-muted-foreground">
                        We&apos;ve sent a password reset link to your email address.
                        Please check your inbox and follow the instructions.
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => setFormMode('sign-in')}
                            variant="outline"
                            className="w-full"
                        >
                            Back to Sign In
                        </Button>
                        <Button
                            onClick={() => {
                                setPasswordResetSent(false)
                                resetPasswordForm.reset()
                            }}
                            variant="ghost"
                            className="w-full"
                        >
                            Try again
                        </Button>
                    </div>
                </motion.div>
            )
        }

        if (formMode === 'sign-in') {
            return (
                <Form {...signInForm}>
                    <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                        <FormField
                            control={signInForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter your email"
                                                className="pl-10"
                                                disabled={isLoading}
                                                autoComplete="email"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={signInForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Button
                                            variant="link"
                                            className="h-auto px-0 text-xs font-normal"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                switchMode('reset-password')
                                            }}
                                            tabIndex={0}
                                            aria-label="Forgot password"
                                        >
                                            Forgot password?
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter your password"
                                                type={showPassword ? "text" : "password"}
                                                className="pl-10 pr-10"
                                                disabled={isLoading}
                                                autoComplete="current-password"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute w-8 h-8 p-0 right-1 top-1"
                                                onClick={togglePassword}
                                                tabIndex={0}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Sign In
                        </Button>
                    </form>
                </Form>
            )
        }

        if (formMode === 'sign-up') {
            return (
                <Form {...signUpForm}>
                    <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                        <FormField
                            control={signUpForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="Choose a username"
                                                className="pl-10"
                                                disabled={isLoading}
                                                autoComplete="username"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={signUpForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter your email"
                                                className="pl-10"
                                                disabled={isLoading}
                                                autoComplete="email"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="Create a password"
                                                type={showPassword ? "text" : "password"}
                                                className="pl-10 pr-10"
                                                disabled={isLoading}
                                                autoComplete="new-password"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute w-8 h-8 p-0 right-1 top-1"
                                                onClick={togglePassword}
                                                tabIndex={0}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={signUpForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="Confirm your password"
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="pl-10 pr-10"
                                                disabled={isLoading}
                                                autoComplete="new-password"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute w-8 h-8 p-0 right-1 top-1"
                                                onClick={toggleConfirmPassword}
                                                tabIndex={0}
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={signUpForm.control}
                            name="terms"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start py-2 space-x-3 space-y-0">
                                    <FormControl>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
                                                checked={field.value}
                                                onChange={field.onChange}
                                                id="terms"
                                                disabled={isLoading}
                                                aria-label="I agree to the Terms of Service and Privacy Policy"
                                                aria-required="true"
                                            />
                                        </div>
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel className="text-sm font-normal" htmlFor="terms">
                                            I agree to the <Link href="/terms" className="underline text-primary">Terms of Service</Link> and <Link href="/privacy" className="underline text-primary">Privacy Policy</Link>
                                        </FormLabel>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Create Account
                        </Button>
                    </form>
                </Form>
            )
        }

        if (formMode === 'reset-password') {
            return (
                <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                        <div className="mb-4 text-center">
                            <h3 className="text-lg font-medium">Forgot your password?</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Enter your email address below and we&apos;ll send you a link to reset your password.
                            </p>
                        </div>

                        <FormField
                            control={resetPasswordForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter your email"
                                                className="pl-10"
                                                disabled={isLoading}
                                                autoComplete="email"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            Send Reset Link
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            disabled={isLoading}
                            onClick={() => switchMode('sign-in')}
                        >
                            Back to Sign In
                        </Button>
                    </form>
                </Form>
            )
        }

        // Default return in case no condition matches
        return null;
    }

    const renderSocialLoginButtons = () => {
        if (!showSocialLogin) return null

        return (
            <div className="mt-6 space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-2 bg-background text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" disabled={isLoading} className="w-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            className="w-4 h-4 mr-2"
                        >
                            <path
                                fill="#FFC107"
                                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                            />
                            <path
                                fill="#FF3D00"
                                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                            />
                            <path
                                fill="#4CAF50"
                                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                            />
                            <path
                                fill="#1976D2"
                                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                            />
                        </svg>
                        Google
                    </Button>

                    <Button variant="outline" disabled={isLoading} className="w-full">
                        <svg
                            className="w-4 h-4 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0014.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                        </svg>
                        Facebook
                    </Button>
                </div>
            </div>
        )
    }

    const getCardFooter = () => {
        if (formMode === 'sign-in') {
            return (
                <p className="text-sm text-center text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => switchMode('sign-up')}
                        tabIndex={0}
                        aria-label="Sign up"
                    >
                        Sign up
                    </Button>
                </p>
            )
        }

        if (formMode === 'sign-up') {
            return (
                <p className="text-sm text-center text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => switchMode('sign-in')}
                        tabIndex={0}
                        aria-label="Sign in"
                    >
                        Sign in
                    </Button>
                </p>
            )
        }

        return null
    }

    const getCardTitle = () => {
        if (formMode === 'sign-in') return 'Sign in to your account'
        if (formMode === 'sign-up') return 'Create an account'
        if (formMode === 'reset-password') return 'Reset your password'
        return ''
    }

    const getCardDescription = () => {
        if (formMode === 'sign-in') return 'Enter your credentials to access your account'
        if (formMode === 'sign-up') return 'Create a new account to get started'
        if (formMode === 'reset-password') return 'We\'ll email you instructions to reset your password'
        return ''
    }

    // Main render function
    return (
        <div className="container max-w-lg p-4 mx-auto">
            {showTabs ? (
                <Tabs
                    defaultValue={formMode}
                    value={formMode}
                    onValueChange={(value) => switchMode(value as AuthFormMode)}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                        <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sign-in">
                        <AuthCard
                            title={getCardTitle()}
                            description={getCardDescription()}
                            footer={getCardFooter()}
                            variant={cardVariant}
                            size={cardSize}
                            logoPosition="top"
                        >
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="sign-in-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {renderFormContent()}
                                    {renderSocialLoginButtons()}
                                </motion.div>
                            </AnimatePresence>
                        </AuthCard>
                    </TabsContent>

                    <TabsContent value="sign-up">
                        <AuthCard
                            title={getCardTitle()}
                            description={getCardDescription()}
                            footer={getCardFooter()}
                            variant={cardVariant}
                            size={cardSize}
                            logoPosition="top"
                        >
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="sign-up-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {renderFormContent()}
                                    {renderSocialLoginButtons()}
                                </motion.div>
                            </AnimatePresence>
                        </AuthCard>
                    </TabsContent>

                    <TabsContent value="reset-password">
                        <AuthCard
                            title={getCardTitle()}
                            description={getCardDescription()}
                            variant={cardVariant}
                            size={cardSize}
                            logoPosition="top"
                        >
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key="reset-password-form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {renderFormContent()}
                                </motion.div>
                            </AnimatePresence>
                        </AuthCard>
                    </TabsContent>
                </Tabs>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={formMode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <AuthCard
                            title={getCardTitle()}
                            description={getCardDescription()}
                            footer={getCardFooter()}
                            variant={cardVariant}
                            size={cardSize}
                            logoPosition="top"
                        >
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {renderFormContent()}

                            {formMode !== 'reset-password' && renderSocialLoginButtons()}
                        </AuthCard>
                    </motion.div>
                </AnimatePresence>
            )}

            <AuthFooter variant="centered" className="mt-8" />
        </div>
    )
}