/**
 * Hook for using the User service with React
 */
import { useState, useEffect, useCallback } from 'react';
import { useService, getTypedService } from './useService';
import UserService from '../../services/api/userService';
import EventTracker from '../../services/analytics/eventTracker';
import { ServiceError } from '../../services/serviceInterface';
import ServiceManager from '../../services/serviceRegistry';
import { useAuthService } from './';

export default function useUserService() {
    const {
        service: userService,
        isLoading: serviceLoading,
        error: serviceError
    } = useService<UserService>('user');

    const { isAuthenticated, user: authUser } = useAuthService();

    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [userStats, setUserStats] = useState<any | null>(null);
    const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<ServiceError | null>(null);

    // Load user profile when authenticated
    useEffect(() => {
        if (isAuthenticated && authUser && userService && !serviceLoading) {
            fetchUserProfile();
        }
    }, [isAuthenticated, authUser, userService, serviceLoading]);

    // Update error state if there's a service error
    useEffect(() => {
        if (serviceError) {
            setError(serviceError);
        }
    }, [serviceError]);

    /**
     * Fetch the user profile
     */
    const fetchUserProfile = useCallback(async () => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const profile = await userService.getUserProfile();

            setUserProfile(profile);
            setIsLoading(false);

            // Track profile fetch in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'profile_fetched', {
                    userId: profile.id
                });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, profile };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to fetch user profile',
                    'profile_fetch_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    /**
     * Fetch user statistics
     */
    const fetchUserStats = useCallback(async () => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const stats = await userService.getUserStats();

            setUserStats(stats);
            setIsLoading(false);

            return { success: true, stats };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to fetch user statistics',
                    'stats_fetch_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    /**
     * Fetch transaction history
     */
    const fetchTransactionHistory = useCallback(async (limit = 10, offset = 0) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const history = await userService.getTransactionHistory(limit, offset);

            setTransactionHistory(history);
            setIsLoading(false);

            return { success: true, history };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to fetch transaction history',
                    'transaction_history_fetch_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    /**
     * Update user profile
     */
    const updateProfile = useCallback(async (profileData: Partial<any>) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const updatedProfile = await userService.updateUserProfile(profileData);

            setUserProfile(updatedProfile);
            setIsLoading(false);

            // Track profile update in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'profile_updated', {
                    userId: updatedProfile.id,
                    fields: Object.keys(profileData).join(',')
                });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, profile: updatedProfile };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to update user profile',
                    'profile_update_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    /**
     * Update user preferences
     */
    const updatePreferences = useCallback(async (preferences: Partial<any>) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const updatedPreferences = await userService.updateUserPreferences(preferences);

            // Update the profile with new preferences
            setUserProfile(prev => ({
                ...prev,
                preferences: {
                    ...prev?.preferences,
                    ...updatedPreferences
                }
            }));

            setIsLoading(false);

            // Track preferences update in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'preferences_updated', {
                    userId: authUser.id,
                    fields: Object.keys(preferences).join(',')
                });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, preferences: updatedPreferences };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to update user preferences',
                    'preferences_update_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    /**
     * Get user balance
     */
    const getBalance = useCallback(async () => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const balance = await userService.getUserBalance();

            // Update the profile with new balance
            setUserProfile(prev => ({
                ...prev,
                balance
            }));

            setIsLoading(false);

            return { success: true, balance };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to get user balance',
                    'balance_fetch_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    /**
     * Process a deposit
     */
    const processDeposit = useCallback(async (amount: number, method: string, extras?: any) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await userService.processDeposit(amount, method, extras);

            // Update the profile with new balance
            if (result.success) {
                setUserProfile(prev => ({
                    ...prev,
                    balance: result.newBalance
                }));

                // Add the transaction to history
                setTransactionHistory(prev => [result.transaction, ...prev]);
            }

            setIsLoading(false);

            // Track deposit in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'deposit_processed', {
                    userId: authUser.id,
                    amount,
                    method,
                    status: result.success ? 'success' : 'pending'
                });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return result;
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to process deposit',
                    'deposit_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    /**
     * Process a withdrawal
     */
    const processWithdrawal = useCallback(async (amount: number, method: string, extras?: any) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await userService.processWithdrawal(amount, method, extras);

            // Update the profile with new balance
            if (result.success) {
                setUserProfile(prev => ({
                    ...prev,
                    balance: result.newBalance
                }));

                // Add the transaction to history
                setTransactionHistory(prev => [result.transaction, ...prev]);
            }

            setIsLoading(false);

            // Track withdrawal in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'withdrawal_processed', {
                    userId: authUser.id,
                    amount,
                    method,
                    status: result.success ? 'success' : 'pending'
                });
            } catch (e) {
                // Silently fail if analytics isn't available
            }

            return result;
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to process withdrawal',
                    'withdrawal_failed',
                    err
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    return {
        service: getTypedService<UserService>(userService),
        isLoading: isLoading || serviceLoading,
        error: error || serviceError,
        userProfile,
        userStats,
        transactionHistory,
        fetchUserProfile,
        fetchUserStats,
        fetchTransactionHistory,
        updateProfile,
        updatePreferences,
        getBalance,
        processDeposit,
        processWithdrawal
    };
}