/**
 * Service provider hook for accessing multiple services in components
 */
import { useMemo } from 'react';
import useAuthService from './useAuthService';
import useGameService from './useGameService';
import useUserService from './useUserService';
import useAudioService from './useAudioService';
import useAnalyticsService from './useAnalyticsService';
import useLocalStorageService from './useLocalStorageService';
import { useServiceContext } from '../../app/providers';

/**
 * Hook to provide access to all services in a single object
 * This is useful for components that need multiple services
 */
export function useServiceProvider() {
    // Get the service initialization status
    const { isInitialized, isInitializing, error } = useServiceContext();

    // Get all services
    const auth = useAuthService();
    const game = useGameService();
    const user = useUserService();
    const audio = useAudioService();
    const analytics = useAnalyticsService();
    const storage = useLocalStorageService();

    // Combine services into a single object
    const services = useMemo(() => ({
        auth,
        game,
        user,
        audio,
        analytics,
        storage
    }), [auth, game, user, audio, analytics, storage]);

    // Determine overall loading state
    const isLoading = useMemo(() =>
        isInitializing ||
        auth.isLoading ||
        game.isLoading ||
        user.isLoading ||
        audio.isLoading ||
        analytics.isLoading ||
        storage.isLoading,
        [
            isInitializing,
            auth.isLoading,
            game.isLoading,
            user.isLoading,
            audio.isLoading,
            analytics.isLoading,
            storage.isLoading
        ]);

    // Combine all errors
    const errors = useMemo(() => {
        const allErrors = [
            error,
            auth.error,
            game.error,
            user.error,
            audio.error,
            analytics.error,
            storage.error
        ].filter(Boolean);

        return allErrors.length > 0 ? allErrors : null;
    }, [
        error,
        auth.error,
        game.error,
        user.error,
        audio.error,
        analytics.error,
        storage.error
    ]);

    return {
        services,
        isInitialized,
        isInitializing,
        isLoading,
        errors
    };
}

export default useServiceProvider;