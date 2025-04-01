/**
 * Hook for using the Auth service with React
 */
import { useState, useEffect, useCallback } from 'react';
import { useService, getTypedService } from './useService';
import AuthService from '../../services/api/authService';
import EventTracker from '../../services/analytics/eventTracker';
import { ServiceError } from '../../services/serviceInterface';
import ServiceManager from '../../services/serviceRegistry';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    username: string;
}

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any | null;
    error: ServiceError | null;
}

export default function useAuthService() {
    const {
        service: authService,
        isLoading: serviceLoading,
        error: serviceError
    } = useService<AuthService>('auth');

    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        error: null
    });

    // Load the current auth state on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (!authService) return;

            try {
                setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

                // Check if we have a valid token
                const isValid = await authService.validateToken();

                if (isValid) {
                    // If valid, get the user data
                    const userData = await authService.getCurrentUser();

                    setAuthState({
                        isAuthenticated: true,
                        isLoading: false,
                        user: userData,
                        error: null
                    });

                    // Track the authentication in analytics
                    try {
                        const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                        eventTracker.setUserId(userData?.id);
                        eventTracker.track('user', 'authentication_restored', { method: 'token' });
                    } catch (e) {
                        // Silently fail if analytics isn't available
                    }
                } else {
                    // If not valid, clear the auth state
                    setAuthState({
                        isAuthenticated: false,
                        isLoading: false,
                        user: null,
                        error: null
                    });
                }
            } catch (err) {
                let error: ServiceError;

                if (err instanceof ServiceError) {
                    error = err;
                } else {
                    error = new ServiceError(
                        'Failed to check authentication status',
                        'auth_check_failed',
                        err
                    );
                }

                setAuthState({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null,
                    error
                });
            }
        };

        if (authService && !serviceLoading) {
            checkAuth();
        }
    }, [authService, serviceLoading]);

    // Update state if there's a service error
    useEffect(() => {
        if (serviceError) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: serviceError
            }));
        }
    }, [serviceError]);

    /**
     * Login with email and password
     */
    const login = useCallback(async (credentials: LoginCredentials) => {
        if (!authService) {
            throw new Error('Auth service not initialized');
        }

        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Call the login method from the auth service
            const { token, user } = await authService.login(credentials.email, credentials.password);

            // Store the token
            await authService.setToken(token);

            // Update the auth state
            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user,
                error: null
            });

            // Track the login in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.setUserId(user.id);
                eventTracker.track('user', 'login', { method: 'password' });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, user };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Login failed',
                    'login_failed',
                    err
                );
            }

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [authService]);

    /**
     * Register a new user
     */
    const register = useCallback(async (data: RegisterData) => {
        if (!authService) {
            throw new Error('Auth service not initialized');
        }

        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Call the register method from the auth service
            const { token, user } = await authService.register(
                data.email,
                data.password,
                data.username
            );

            // Store the token
            await authService.setToken(token);

            // Update the auth state
            setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user,
                error: null
            });

            // Track the registration in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.setUserId(user.id);
                eventTracker.track('user', 'register', { method: 'email' });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, user };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Registration failed',
                    'registration_failed',
                    err
                );
            }

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [authService]);

    /**
     * Logout the current user
     */
    const logout = useCallback(async () => {
        if (!authService) {
            throw new Error('Auth service not initialized');
        }

        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Track the logout in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'logout', {});

                // Clear user ID after tracking the logout
                eventTracker.setUserId('');
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            // Call the logout method from the auth service
            await authService.logout();

            // Update the auth state
            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: null
            });

            return { success: true };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Logout failed',
                    'logout_failed',
                    err
                );
            }

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error
            }));

            return { success: false, error };
        }
    }, [authService]);

    /**
     * Reset password with email
     */
    const resetPassword = useCallback(async (email: string) => {
        if (!authService) {
            throw new Error('Auth service not initialized');
        }

        try {
            // Call the reset password method from the auth service
            await authService.requestPasswordReset(email);

            // Track the password reset request in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'request_password_reset', { email });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Password reset request failed',
                    'password_reset_failed',
                    err
                );
            }

            return { success: false, error };
        }
    }, [authService]);

    /**
     * Update user profile
     */
    const updateProfile = useCallback(async (userData: Partial<any>) => {
        if (!authService) {
            throw new Error('Auth service not initialized');
        }

        if (!authState.isAuthenticated) {
            throw new Error('User is not authenticated');
        }

        try {
            // Call the update profile method from the auth service
            const updatedUser = await authService.updateProfile(userData);

            // Update the auth state
            setAuthState(prev => ({
                ...prev,
                user: updatedUser
            }));

            // Track the profile update in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'update_profile', {
                    fields: Object.keys(userData).join(',')
                });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, user: updatedUser };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Profile update failed',
                    'profile_update_failed',
                    err
                );
            }

            setAuthState(prev => ({
                ...prev,
                error
            }));

            return { success: false, error };
        }
    }, [authService, authState.isAuthenticated]);

    return {
        ...authState,
        service: getTypedService<AuthService>(authService),
        login,
        register,
        logout,
        resetPassword,
        updateProfile
    };
}