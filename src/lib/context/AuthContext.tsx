'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// Extended User interface with additional profile properties
interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    // Additional profile fields
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    birthdate?: string;
    // Game statistics
    total_hands_played?: number;
    hands_won?: number;
    hands_lost?: number;
    hands_tied?: number;
    blackjacks_hit?: number;
    current_win_streak?: number;
    highest_win_streak?: number;
    chips?: number;
    created_at?: string;
    last_login?: string;
}

// User preferences interface
interface UserPreferences {
    theme: string;
    sound_enabled: boolean;
    animation_speed: string;
    bet_amount: number;
}

interface AuthContextType {
    user: User | null;
    preferences: UserPreferences | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; error: string | null }>;
    updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error: string | null }>;
    updatePreferences: (preferencesData: Partial<UserPreferences>) => Promise<{ success: boolean; error: string | null }>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    // Effect to check for existing auth on mount
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                setIsLoading(true);

                // Get session from Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    throw sessionError;
                }

                if (session) {
                    const { data: userData, error: userError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (userError) {
                        throw userError;
                    }

                    // Transform to our User shape
                    const authUser: User = {
                        id: userData.id,
                        username: userData.username || session.user.email?.split('@')[0] || '',
                        email: session.user.email || '',
                        avatar: userData.avatar_url
                    };

                    setUser(authUser);

                    // Instead of direct store access, dispatch a custom event
                    // This breaks the circular dependency
                    window.dispatchEvent(new CustomEvent('user-authenticated', {
                        detail: { userId: authUser.id }
                    }));
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                setError('Authentication check failed. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        // Check auth initially
        checkAuthStatus();

        // Set up listener for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    const { data: userData, error: userError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (!userError && userData) {
                        const authUser: User = {
                            id: userData.id,
                            username: userData.username || session.user.email?.split('@')[0] || '',
                            email: session.user.email || '',
                            avatar: userData.avatar_url
                        };

                        setUser(authUser);

                        // Dispatch event instead of direct store access
                        window.dispatchEvent(new CustomEvent('user-authenticated', {
                            detail: { userId: authUser.id }
                        }));
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    window.dispatchEvent(new CustomEvent('user-signed-out'));
                }
            }
        );

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                throw signInError;
            }

            // Immediately fetch user profile after successful login instead of waiting for auth state change
            if (data.session && data.user) {
                const { data: userData, error: userError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (userError) {
                    console.warn('Could not fetch user profile:', userError);
                    // Auth listener will handle profile fetch
                } else if (userData) {
                    // Set user immediately for faster UI response
                    const authUser: User = {
                        id: userData.id,
                        username: userData.username || data.user.email?.split('@')[0] || '',
                        email: data.user.email || '',
                        avatar: userData.avatar_url,
                        // Include additional profile fields
                        display_name: userData.display_name,
                        bio: userData.bio,
                        birthdate: userData.birthdate,
                        total_hands_played: userData.total_hands_played,
                        hands_won: userData.hands_won,
                        hands_lost: userData.hands_lost,
                        hands_tied: userData.hands_tied,
                        blackjacks_hit: userData.blackjacks_hit,
                        current_win_streak: userData.current_win_streak,
                        highest_win_streak: userData.highest_win_streak,
                        chips: userData.chips,
                        created_at: userData.created_at,
                        last_login: userData.last_login
                    };

                    setUser(authUser);

                    // Dispatch user-authenticated event
                    window.dispatchEvent(new CustomEvent('user-authenticated', {
                        detail: { userId: authUser.id }
                    }));
                }
            }
            // Auth state listener will still capture changes if the above fetch fails
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);

            const { error: signOutError } = await supabase.auth.signOut();

            if (signOutError) {
                throw signOutError;
            }

            // User will be cleared by the auth state change listener
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Logout failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const register = useCallback(async (username: string, email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            // Sign up with Supabase
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username
                    }
                }
            });

            if (signUpError) {
                throw signUpError;
            }

            if (authData.user) {
                // Create profile entry
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        username,
                        email,
                        created_at: new Date().toISOString()
                    });

                if (profileError) {
                    throw profileError;
                }
            }

            // User will be set by the auth state change listener
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const resetPassword = useCallback(async (email: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

            if (resetError) {
                throw resetError;
            }

            return { success: true, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Password reset failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    const updateProfile = useCallback(async (userData: Partial<User>) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!user) {
                throw new Error('You must be logged in to update your profile.');
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    username: userData.username,
                    avatar_url: userData.avatar_url,
                    display_name: userData.display_name,
                    bio: userData.bio,
                    birthdate: userData.birthdate
                })
                .eq('id', user.id);

            if (updateError) {
                throw updateError;
            }

            // Update local user state
            setUser({ ...user, ...userData });

            return { success: true, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Profile update failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [user, supabase]);

    const updatePreferences = useCallback(async (preferencesData: Partial<UserPreferences>) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!user) {
                throw new Error('You must be logged in to update your preferences.');
            }

            const { error: updateError } = await supabase
                .from('user_preferences')
                .update({
                    ...preferencesData,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (updateError) {
                throw updateError;
            }

            // Update local preferences state
            setPreferences(prev => prev ? { ...prev, ...preferencesData } : null);

            return { success: true, error: null };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Preferences update failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, [user, supabase]);

    // Load user preferences when user changes
    useEffect(() => {
        const loadPreferences = async () => {
            if (!user) {
                setPreferences(null);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('user_preferences')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') { // Not found error
                        // Create default preferences
                        const defaultPreferences = {
                            user_id: user.id,
                            theme: 'dark',
                            sound_enabled: true,
                            animation_speed: 'normal',
                            bet_amount: 10,
                        };

                        const { data: newPrefs, error: insertError } = await supabase
                            .from('user_preferences')
                            .insert(defaultPreferences)
                            .select()
                            .single();

                        if (!insertError && newPrefs) {
                            setPreferences(newPrefs);
                        }
                    } else {
                        console.error('Error loading preferences:', error);
                    }
                } else if (data) {
                    setPreferences(data);
                }
            } catch (err) {
                console.error('Failed to load preferences:', err);
            }
        };

        loadPreferences();
    }, [user, supabase]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Create context value
    const contextValue = useMemo(() => ({
        user,
        preferences,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        register,
        resetPassword,
        updateProfile,
        updatePreferences,
        clearError
    }), [user, preferences, isLoading, error, login, logout, register, resetPassword, updateProfile, updatePreferences, clearError]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};