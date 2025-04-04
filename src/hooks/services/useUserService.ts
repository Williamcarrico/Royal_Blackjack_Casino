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
import { UserProfile, Transaction, UpdateProfileRequest, DepositRequest, WithdrawalRequest } from '../../types/authTypes';
import { PlayerStatsResponse } from '../../types/apiTypes';

export default function useUserService() {
    const {
        service: userService,
        isLoading: serviceLoading,
        error: serviceError
    } = useService<UserService>('user');

    const { isAuthenticated, user: authUser } = useAuthService();

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [userStats, setUserStats] = useState<PlayerStatsResponse['data'] | null>(null);
    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<ServiceError | null>(null);

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
            const profile = await userService.getUserProfile(authUser.id);

            setUserProfile(profile);
            setIsLoading(false);

            // Track profile fetch in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'profile_fetched', {
                    userId: profile.id
                });
            } catch (_e) {
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
                    err as Record<string, unknown>
                );
            }

            setError(error);
            setIsLoading(false);

            return { success: false, error };
        }
    }, [userService, isAuthenticated, authUser]);

    // Load user profile when authenticated
    useEffect(() => {
        if (isAuthenticated && authUser && userService && !serviceLoading) {
            fetchUserProfile();
        }
    }, [isAuthenticated, authUser, userService, serviceLoading, fetchUserProfile]);

    // Update error state if there's a service error
    useEffect(() => {
        if (serviceError) {
            setError(serviceError);
        }
    }, [serviceError]);

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
            const stats = await userService.getUserStats(authUser.id);

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
                    err as Record<string, unknown>
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
            // Note: getUserTransactions doesn't actually support limit/offset
            // This would need to be implemented in the service if needed
            const history = await userService.getUserTransactions(authUser.id);

            // Apply limit/offset client-side for now
            const paginatedHistory = history.slice(offset, offset + limit);

            setTransactionHistory(paginatedHistory);
            setIsLoading(false);

            return { success: true, history: paginatedHistory };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to fetch transaction history',
                    'transaction_history_fetch_failed',
                    err as Record<string, unknown>
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
    const updateProfile = useCallback(async (profileData: Partial<UpdateProfileRequest>) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const updatedProfile = await userService.updateUserProfile(authUser.id, profileData);

            setUserProfile(updatedProfile);
            setIsLoading(false);

            // Track profile update in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'profile_updated', {
                    userId: updatedProfile.id,
                    fields: Object.keys(profileData).join(',')
                });
            } catch (_e) {
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
                    err as Record<string, unknown>
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
    const updatePreferences = useCallback(async (preferences: Partial<UserProfile['preferences']>) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            // We'll use updateUserProfile since there's no dedicated preferences endpoint
            const updatedProfile = await userService.updateUserProfile(authUser.id, {
                preferences
            });

            // Update the profile with new preferences
            setUserProfile(updatedProfile);
            setIsLoading(false);

            // Track preferences update in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'preferences_updated', {
                    userId: authUser.id,
                    fields: Object.keys(preferences || {}).join(',')
                });
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return { success: true, preferences: updatedProfile.preferences };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to update user preferences',
                    'preferences_update_failed',
                    err as Record<string, unknown>
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
            // We'll fetch the full profile since there's no dedicated balance endpoint
            const profile = await userService.getUserProfile(authUser.id);

            // Update the profile with new balance
            setUserProfile(profile);
            setIsLoading(false);

            return { success: true, balance: profile.balance };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to get user balance',
                    'balance_fetch_failed',
                    err as Record<string, unknown>
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
    const processDeposit = useCallback(async (amount: number, method: string, extras?: Record<string, unknown>) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const request: DepositRequest = {
                amount,
                paymentMethod: method,
                ...(extras && typeof extras === 'object' ? { savePaymentMethod: !!extras.savePaymentMethod } : {})
            };

            const transaction = await userService.deposit(authUser.id, request);

            // Refresh profile to get updated balance
            const profile = await userService.getUserProfile(authUser.id);
            setUserProfile(profile);

            // Add the transaction to history
            setTransactionHistory(prev => [transaction, ...prev]);
            setIsLoading(false);

            // Track deposit in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'deposit_processed', {
                    userId: authUser.id,
                    amount,
                    method,
                    status: transaction.status
                });
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return {
                success: true,
                transaction,
                newBalance: profile.balance
            };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to process deposit',
                    'deposit_failed',
                    err as Record<string, unknown>
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
    const processWithdrawal = useCallback(async (amount: number, method: string, extras?: Record<string, unknown>) => {
        if (!userService) {
            throw new Error('User service not initialized');
        }

        if (!isAuthenticated || !authUser) {
            throw new Error('User is not authenticated');
        }

        setIsLoading(true);
        setError(null);

        try {
            const request: WithdrawalRequest = {
                amount,
                paymentMethod: method,
                ...(extras?.accountDetails && typeof extras.accountDetails === 'object'
                    ? { accountDetails: extras.accountDetails as Record<string, string> }
                    : {})
            };

            const transaction = await userService.withdraw(authUser.id, request);

            // Refresh profile to get updated balance
            const profile = await userService.getUserProfile(authUser.id);
            setUserProfile(profile);

            // Add the transaction to history
            setTransactionHistory(prev => [transaction, ...prev]);
            setIsLoading(false);

            // Track withdrawal in analytics
            try {
                const eventTracker = await ServiceManager.getInstance().getService<EventTracker>('eventTracker');
                eventTracker.track('user', 'withdrawal_processed', {
                    userId: authUser.id,
                    amount,
                    method,
                    status: transaction.status
                });
            } catch (_e) {
                // Silently fail if analytics isn't available
            }

            return {
                success: true,
                transaction,
                newBalance: profile.balance
            };
        } catch (err) {
            let error: ServiceError;

            if (err instanceof ServiceError) {
                error = err;
            } else {
                error = new ServiceError(
                    'Failed to process withdrawal',
                    'withdrawal_failed',
                    err as Record<string, unknown>
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