'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { SupabaseClient, Session } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { toast } from 'sonner'

// Types for our User model
export interface UserProfile {
    id: string
    username: string
    display_name: string | null
    email: string
    avatar_url: string | null
    bio: string | null
    date_of_birth: string | null
    country_code: string
    chips: number
    created_at: string
    updated_at: string

    // Game statistics
    total_games: number
    total_hands: number
    total_wins: number
    total_losses: number
    total_pushes: number
    total_blackjacks: number
    current_win_streak: number
    highest_win_streak: number
}

// Types for user preferences
export interface UserPreferences {
    theme: 'dark' | 'light' | 'system'
    sound_enabled: boolean
    animation_speed: 'slow' | 'normal' | 'fast'
    bet_amount: number
    created_at: string
    updated_at: string
}

// Profile update params
export interface ProfileUpdateParams {
    username?: string
    display_name?: string | null
    avatar_url?: string | null
    bio?: string | null
    date_of_birth?: string | null
}

// Auth response
export interface AuthResponse {
    success: boolean
    error: string | null
}

// Auth context type definition
interface AuthContextType {
    user: UserProfile | null
    preferences: UserPreferences | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    session: Session | null

    // Auth methods
    signIn: (email: string, password: string) => Promise<AuthResponse>
    signUp: (email: string, password: string, username: string, dob: string, countryCode: string) => Promise<AuthResponse>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<AuthResponse>

    // Profile and preferences methods
    updateProfile: (data: ProfileUpdateParams) => Promise<AuthResponse>
    updatePreferences: (data: Partial<UserPreferences>) => Promise<AuthResponse>

    clearError: () => void

    // Direct Supabase client access (use with caution)
    supabase: SupabaseClient<Database> | null
}

// Default preferences
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'created_at' | 'updated_at'> = {
    theme: 'dark',
    sound_enabled: true,
    animation_speed: 'normal',
    bet_amount: 10,
}

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [session, setSession] = useState<Session | null>(null)
    const [error, setError] = useState<string | null>(null)
    const supabaseRef = useRef<SupabaseClient<Database> | null>(null)

    // Initialize supabase client only once
    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            supabaseRef.current = createBrowserClient<Database>()
        } catch (err) {
            console.error('Failed to initialize Supabase client:', err)
            setError('Authentication service unavailable')
        }
    }, [])

    // Function to load user data from Supabase
    const loadUserData = useCallback(async (userId: string) => {
        if (!supabaseRef.current) return null

        try {
            console.log(`Attempting to load profile data for user: ${userId}`)

            // Get user profile data
            const { data: profileData, error: profileError } = await supabaseRef.current
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError) {
                console.error('Error fetching profile:', JSON.stringify(profileError))

                // Check if profile doesn't exist (PGRST116 is PostgreSQL not found error)
                if (profileError.code === 'PGRST116') {
                    console.log('Profile not found, creating default profile...')

                    // Get user email from auth
                    const { data: userData } = await supabaseRef.current.auth.getUser()
                    if (!userData?.user?.email) {
                        console.error('Cannot create profile: No user email available')
                        return null
                    }

                    // Create initial profile
                    const now = new Date().toISOString()
                    const defaultProfile = {
                        id: userId,
                        username: `user_${userId.substring(0, 8)}`,
                        email: userData.user.email,
                        country_code: 'US', // Default country
                        date_of_birth: new Date('2000-01-01').toISOString(), // Default date
                        created_at: now,
                        updated_at: now,
                        chips: 1500, // Starting chips
                        total_games: 0,
                        total_hands: 0,
                        total_wins: 0,
                        total_losses: 0,
                        total_pushes: 0,
                        total_blackjacks: 0,
                        current_win_streak: 0,
                        highest_win_streak: 0,
                    }

                    const { data: newProfile, error: createError } = await supabaseRef.current
                        .from('user_profiles')
                        .insert(defaultProfile)
                        .select()
                        .single()

                    if (createError) {
                        console.error('Failed to create default profile:', JSON.stringify(createError))
                        return null
                    }

                    console.log('Created default profile successfully')
                    setUser(newProfile)
                    return newProfile
                } else {
                    // Some other error occurred
                    return null
                }
            }

            console.log('Profile data retrieved successfully')

            // Set user profile
            setUser(profileData)

            // Get user preferences
            const { data: preferencesData, error: preferencesError } = await supabaseRef.current
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (preferencesError && preferencesError.code !== 'PGRST116') { // Not found error is ok
                console.error('Error fetching preferences:', preferencesError)
            }

            // Set preferences (use defaults if not found)
            if (preferencesData) {
                setPreferences(preferencesData)
            } else {
                // Create default preferences if none exist
                try {
                    const now = new Date().toISOString()
                    const defaultPrefs = {
                        user_id: userId,
                        ...DEFAULT_PREFERENCES,
                        created_at: now,
                        updated_at: now,
                    }

                    const { data: newPreferences, error: insertError } = await supabaseRef.current
                        .from('user_preferences')
                        .insert(defaultPrefs)
                        .select()
                        .single()

                    if (insertError) {
                        console.error('Error creating default preferences:', insertError)
                    } else if (newPreferences) {
                        setPreferences(newPreferences)
                    }
                } catch (err) {
                    console.error('Error creating default preferences:', err)
                }
            }

            return profileData
        } catch (err) {
            console.error('Error loading user data:', err)
            return null
        }
    }, [])

    // Effect to check for existing auth on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            if (!supabaseRef.current) return

            try {
                setIsLoading(true)

                // Get current session
                const { data: { session }, error: sessionError } = await supabaseRef.current.auth.getSession()

                if (sessionError) {
                    throw sessionError
                }

                if (session) {
                    setSession(session)

                    // Load user data from database
                    await loadUserData(session.user.id)
                }
            } catch (err) {
                console.error('Auth check failed:', err)
                if (err instanceof Error) {
                    setError(err.message)
                } else {
                    setError('Authentication check failed')
                }
            } finally {
                setIsLoading(false)
            }
        }

        if (supabaseRef.current) {
            checkAuthStatus()

            // Set up auth subscription
            const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(
                async (event, currentSession): Promise<void> => {
                    if (event === 'SIGNED_IN' && currentSession) {
                        setSession(currentSession)
                        await loadUserData(currentSession.user.id)
                    } else if (event === 'SIGNED_OUT') {
                        setUser(null)
                        setPreferences(null)
                        setSession(null)
                    } else if (event === 'USER_UPDATED' && currentSession) {
                        setSession(currentSession)
                        await loadUserData(currentSession.user.id)
                    }
                }
            )

            return () => {
                subscription.unsubscribe()
            }
        }
    }, [loadUserData])

    const handleAuthError = useCallback((error: unknown): string => {
        if (!error) return 'An unknown error occurred'

        if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: string }).message === 'string') {
            return (error as { message: string }).message
        }

        if (typeof error === 'string') {
            return error
        }

        return 'Authentication failed'
    }, [])

    const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
        if (!supabaseRef.current) {
            return { success: false, error: 'Authentication service unavailable' }
        }

        setIsLoading(true)
        setError(null)

        try {
            const { data: _data, error } = await supabaseRef.current.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                const errorMessage = handleAuthError(error)
                setError(errorMessage)
                return { success: false, error: errorMessage }
            }

            return { success: true, error: null }
        } catch (err) {
            const errorMessage = handleAuthError(err)
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [handleAuthError])

    const signUp = useCallback(async (
        email: string,
        password: string,
        username: string,
        dob: string,
        countryCode: string
    ): Promise<AuthResponse> => {
        if (!supabaseRef.current) {
            return { success: false, error: 'Authentication service unavailable' }
        }

        setIsLoading(true)
        setError(null)

        try {
            // Check if username is already taken
            const { data: existingUsers, error: usernameError } = await supabaseRef.current
                .from('user_profiles')
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
            const { data, error } = await supabaseRef.current.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                    }
                }
            })

            if (error) {
                const errorMessage = handleAuthError(error)
                setError(errorMessage)
                return { success: false, error: errorMessage }
            }

            if (data.user) {
                // Create initial profile
                const now = new Date().toISOString()
                const { error: profileError } = await supabaseRef.current
                    .from('user_profiles')
                    .insert({
                        id: data.user.id,
                        username,
                        email,
                        date_of_birth: dob,
                        country_code: countryCode,
                        created_at: now,
                        updated_at: now,
                        chips: 1500, // Starting chips
                        total_games: 0,
                        total_hands: 0,
                        total_wins: 0,
                        total_losses: 0,
                        total_pushes: 0,
                        total_blackjacks: 0,
                        current_win_streak: 0,
                        highest_win_streak: 0,
                    })

                if (profileError) {
                    console.error('Error creating profile:', profileError)
                    // Try to sign out to clean up
                    await supabaseRef.current.auth.signOut()
                    return { success: false, error: profileError.message || 'Failed to create profile' }
                }

                // Set default preferences
                const { error: prefError } = await supabaseRef.current
                    .from('user_preferences')
                    .insert({
                        user_id: data.user.id,
                        ...DEFAULT_PREFERENCES,
                        created_at: now,
                        updated_at: now,
                    })

                if (prefError) {
                    console.error('Error setting preferences:', prefError)
                    // Not critical, can continue
                }

                return { success: true, error: null }
            }

            return { success: false, error: 'Failed to create account' }
        } catch (err) {
            const errorMessage = handleAuthError(err)
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [handleAuthError])

    const signOut = useCallback(async () => {
        if (!supabaseRef.current) return

        setIsLoading(true)
        try {
            const { error } = await supabaseRef.current.auth.signOut()
            if (error) {
                throw error
            }

            // Auth change listener will handle state cleanup
        } catch (err) {
            console.error('Error signing out:', err)
            const errorMessage = handleAuthError(err)
            setError(errorMessage)
            toast.error('Failed to sign out')
        } finally {
            setIsLoading(false)
        }
    }, [handleAuthError])

    const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
        if (!supabaseRef.current) {
            return { success: false, error: 'Authentication service unavailable' }
        }

        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabaseRef.current.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            })

            if (error) {
                const errorMessage = handleAuthError(error)
                setError(errorMessage)
                return { success: false, error: errorMessage }
            }

            return { success: true, error: null }
        } catch (err) {
            const errorMessage = handleAuthError(err)
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [handleAuthError])

    const updateProfile = useCallback(async (data: ProfileUpdateParams): Promise<AuthResponse> => {
        if (!supabaseRef.current || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        setIsLoading(true)
        setError(null)

        try {
            const updates = {
                ...data,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabaseRef.current
                .from('user_profiles')
                .update(updates)
                .eq('id', user.id)

            if (error) {
                const errorMessage = handleAuthError(error)
                setError(errorMessage)
                return { success: false, error: errorMessage }
            }

            // Update local user state with new data
            setUser(prev => prev ? { ...prev, ...data } : null)

            return { success: true, error: null }
        } catch (err) {
            const errorMessage = handleAuthError(err)
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [user, handleAuthError])

    const updatePreferences = useCallback(async (data: Partial<UserPreferences>): Promise<AuthResponse> => {
        if (!supabaseRef.current || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        setIsLoading(true)
        setError(null)

        try {
            const updates = {
                ...data,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabaseRef.current
                .from('user_preferences')
                .update(updates)
                .eq('user_id', user.id)

            if (error) {
                const errorMessage = handleAuthError(error)
                setError(errorMessage)
                return { success: false, error: errorMessage }
            }

            // Update local preferences state
            setPreferences(prev => prev ? { ...prev, ...data } : null)

            return { success: true, error: null }
        } catch (err) {
            const errorMessage = handleAuthError(err)
            setError(errorMessage)
            return { success: false, error: errorMessage }
        } finally {
            setIsLoading(false)
        }
    }, [user, handleAuthError])

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Create context value
    const contextValue = useMemo<AuthContextType>(() => ({
        user,
        preferences,
        isAuthenticated: !!user,
        isLoading,
        error,
        session,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        updatePreferences,
        clearError,
        supabase: supabaseRef.current
    }), [
        user, preferences, isLoading, error, session,
        signIn, signUp, signOut, resetPassword, updateProfile,
        updatePreferences, clearError
    ])

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Hook to access the auth context
 * @throws Error if used outside of an AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}