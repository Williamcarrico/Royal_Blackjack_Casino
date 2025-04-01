"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { supabase } from '../../../supabaseClient'
import { format } from 'date-fns'

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
                const { data, error } = await supabase
                    .from('countries')
                    .select('*')
                    .order('name', { ascending: true })

                if (error) {
                    throw error
                }

                setCountries(data || [])
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
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: authData.user.id,
                        username: values.username,
                        email: values.email,
                        country_code: values.country,
                        date_of_birth: format(values.dateOfBirth, 'yyyy-MM-dd'),
                    })

                if (profileError) {
                    console.error('Error creating profile:', profileError)
                    // Attempt to clean up the auth user if profile creation fails
                    // Note: This is a best effort and might not always succeed
                    await supabase.auth.signOut()
                    toast.error('Error creating your profile')
                    return
                }

                // Create default user preferences
                await supabase
                    .from('user_preferences')
                    .insert({
                        user_id: authData.user.id,
                    })
                    .then(({ error }) => {
                        if (error) console.error('Error creating preferences:', error)
                    })

                toast.success('Sign up successful! Please check your email for verification.')
                form.reset()
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
            console.error('Error signing up:', error)
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
                            className="w-full mt-6"
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
                    <Button variant="link" className="h-auto p-0">Sign In</Button>
                </p>
            </CardFooter>
        </Card>
    )
}

export default SignUp