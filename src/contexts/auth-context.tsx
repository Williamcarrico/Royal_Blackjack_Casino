'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Types for our User model
export interface User {
    id: string
    username: string
    display_name: string | null
    email: string
    avatar_url: string | null
    bio: string | null
    birthdate: string | null
    created_at: string
    last_login: string | null

    // Game statistics
    total_hands_played: number
    hands_won: number
    hands_lost: number
    hands_tied: number
    blackjacks_hit: number
    current_win_streak: number
    highest_win_streak: number
    chips: number
}

// Types for user preferences
export interface UserPreferences {
    theme: 'dark' | 'light' | 'system'
    sound_enabled: boolean
    animation_speed: 'slow' | 'normal' | 'fast'
    bet_amount: number
}

// Profile update params
export interface ProfileUpdateParams {
    username?: string
    display_name?: string | null
    avatar_url?: string | null
    bio?: string | null
    birthdate?: string | null
}

// Auth context type definition
interface AuthContextType {
    user: User | null
    preferences: UserPreferences | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null

    // Auth methods
    signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>
    signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error: string | null }>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>

    // Profile and preferences methods
    updateProfile: (data: ProfileUpdateParams) => Promise<{ success: boolean; error: string | null }>
    updatePreferences: (data: Partial<UserPreferences>) => Promise<{ success: boolean; error: string | null }>

    clearError: () => void
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
    theme: 'dark',
    sound_enabled: true,
    animation_speed: 'normal',
    bet_amount: 10,
}

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // Function to load user data from Supabase
    const loadUserData = useCallback(async (userId: string) => {
        try {
            // Get user profile data
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError) {
                console.error('Error fetching profile:', profileError)
                return
            }

            // Get user preferences
            const { data: preferencesData, error: preferencesError } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (preferencesError && preferencesError.code !== 'PGRST116') { // Not found error is ok
                console.error('Error fetching preferences:', preferencesError)
            }

            // Get user statistics
            const { data: statsData, error: statsError } = await supabase
                .from('user_statistics')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (statsError && statsError.code !== 'PGRST116') { // Not found error is ok
                console.error('Error fetching statistics:', statsError)
            }

            // Merge the user data from different tables
            const userData: User = {
                id: userId,
                username: profileData?.username || 'player',
                display_name: profileData?.display_name,
                email: profileData?.email,
                avatar_url: profileData?.avatar_url,
                bio: profileData?.bio,
                birthdate: profileData?.birthdate,
                created_at: profileData?.created_at || new Date().toISOString(),
                last_login: profileData?.last_login,

                // Game statistics (defaults if not found)
                total_hands_played: statsData?.total_hands_played || 0,
                hands_won: statsData?.hands_won || 0,
                hands_lost: statsData?.hands_lost || 0,
                hands_tied: statsData?.hands_tied || 0,
                blackjacks_hit: statsData?.blackjacks_hit || 0,
                current_win_streak: statsData?.current_win_streak || 0,
                highest_win_streak: statsData?.highest_win_streak || 0,
                chips: statsData?.chips || 1000, // Default starting chips
            }

            // User preferences (use defaults if not found)
            const userPreferences: UserPreferences = preferencesData ? {
                theme: preferencesData.theme as 'dark' | 'light' | 'system',
                sound_enabled: preferencesData.sound_enabled,
                animation_speed: preferencesData.animation_speed as 'slow' | 'normal' | 'fast',
                bet_amount: preferencesData.bet_amount,
            } : DEFAULT_PREFERENCES

            setUser(userData)
            setPreferences(userPreferences)
        } catch (err) {
            console.error('Error loading user data:', err)
        }
    }, [supabase, setUser, setPreferences])

    // Effect to check for existing auth on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                setIsLoading(true)

                // Get current session
                const { data: { session } } = await supabase.auth.getSession()

                if (session) {
                    // Update last login time
                    await supabase.auth.updateUser({
                        data: { last_login: new Date().toISOString() }
                    })

                    // Load user data from database
                    await loadUserData(session.user.id)

                    // Set up auth subscription
                    const { data: authListener } = supabase.auth.onAuthStateChange(
                        async (event, newSession) => {
                            if (event === 'SIGNED_IN' && newSession) {
                                await loadUserData(newSession.user.id)
                            } else if (event === 'SIGNED_OUT') {
                                setUser(null)
                                setPreferences(null)
                            }
                        }
                    )

                    return () => {
                        authListener.subscription.unsubscribe()
                    }
                }
            } catch (err) {
                console.error('Auth check failed:', err)
                setError('Authentication check failed. Please try again.')
            } finally {
                setIsLoading(false)
            }

            // Return empty cleanup function when no session exists
            return () => { }
        }

        checkAuthStatus()
    }, [loadUserData, supabase.auth])

    const signIn = useCallback(async (email: string, password: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                return { success: false, error: error.message }
            }

            if (data.user) {
                await loadUserData(data.user.id)
                return { success: true, error: null }
            }

            return { success: false, error: 'Failed to sign in' }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [loadUserData, supabase, setError, setIsLoading])

    const signUp = useCallback(async (email: string, password: string, username: string) => {
        setIsLoading(true)
        setError(null)

        try {
            // Check if username is already taken
            const { data: existingUsers, error: usernameError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .limit(1)

            if (usernameError) {
                return { success: false, error: 'Could not verify username availability' }
            }

            if (existingUsers && existingUsers.length > 0) {
                return { success: false, error: 'Username is already taken' }
            }

            // Create the user account
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                    }
                }
            })

            if (error) {
                setError(error.message)
                return { success: false, error: error.message }
            }

            if (data.user) {
                // Create initial profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        username,
                        email,
                        created_at: new Date().toISOString(),
                    })

                if (profileError) {
                    console.error('Error creating profile:', profileError)
                }

                // Set default preferences
                const { error: prefError } = await supabase
                    .from('user_preferences')
                    .insert({
                        user_id: data.user.id,
                        ...DEFAULT_PREFERENCES
                    })

                if (prefError) {
                    console.error('Error setting preferences:', prefError)
                }

                // Initialize statistics
                const { error: statsError } = await supabase
                    .from('user_statistics')
                    .insert({
                        user_id: data.user.id,
                        chips: 1000, // Starting chips
                    })

                if (statsError) {
                    console.error('Error initializing statistics:', statsError)
                }

                await loadUserData(data.user.id)
                return { success: true, error: null }
            }

            return { success: false, error: 'Failed to sign up' }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [loadUserData, supabase, setError, setIsLoading])

    const signOut = useCallback(async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                setError(error.message)
            } else {
                setUser(null)
                setPreferences(null)
            }
        } catch (err) {
            console.error('Error signing out:', err)
            setError('Failed to sign out. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [supabase, setError, setIsLoading, setUser, setPreferences])

    const resetPassword = useCallback(async (email: string) => {
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) {
                setError(error.message)
                return { success: false, error: error.message }
            }

            return { success: true, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [supabase, setError, setIsLoading])

    const updateProfile = useCallback(async (data: ProfileUpdateParams) => {
        setIsLoading(true)
        setError(null)

        try {
            if (!user) {
                throw new Error('You must be logged in to update your profile')
            }

            const { error } = await supabase
                .from('profiles')
                .update(data)
                .eq('id', user.id)

            if (error) {
                setError(error.message)
                return { success: false, error: error.message }
            }

            // Update local user state
            setUser(prev => prev ? { ...prev, ...data } : null)

            return { success: true, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [user, supabase, setError, setIsLoading, setUser])

    const updatePreferences = useCallback(async (data: Partial<UserPreferences>) => {
        setIsLoading(true)
        setError(null)

        try {
            if (!user) {
                throw new Error('You must be logged in to update your preferences')
            }

            const { error } = await supabase
                .from('user_preferences')
                .update(data)
                .eq('user_id', user.id)

            if (error) {
                setError(error.message)
                return { success: false, error: error.message }
            }

            // Update local preferences state
            setPreferences(prev => prev ? { ...prev, ...data } : null)

            return { success: true, error: null }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [user, supabase, setError, setIsLoading, setPreferences])

    const clearError = useCallback(() => {
        setError(null)
    }, [setError])

    // Create context value
    const contextValue = useMemo(() => ({
        user,
        preferences,
        isAuthenticated: !!user,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        updatePreferences,
        clearError
    }), [user, preferences, isLoading, error, resetPassword, signIn, signOut, signUp, updatePreferences, updateProfile, clearError]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}