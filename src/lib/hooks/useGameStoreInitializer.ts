'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

/**
 * Hook to initialize the game store and set up event listeners for user authentication
 * This breaks the circular dependency between AuthContext and gameStore
 */
export function useGameStoreInitializer() {
    const setUserId = useGameStore((state) => state.setUserId);
    const initializeGame = useGameStore((state) => state.initializeGame);

    useEffect(() => {
        // Initialize the game on mount
        initializeGame();

        // Set up event listeners for auth events
        const handleUserAuthenticated = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId: string }>;
            if (customEvent.detail?.userId) {
                setUserId(customEvent.detail.userId);
            }
        };

        const handleUserSignedOut = () => {
            setUserId(null);
        };

        // Add event listeners
        window.addEventListener('user-authenticated', handleUserAuthenticated);
        window.addEventListener('user-signed-out', handleUserSignedOut);

        // Clean up event listeners
        return () => {
            window.removeEventListener('user-authenticated', handleUserAuthenticated);
            window.removeEventListener('user-signed-out', handleUserSignedOut);
        };
    }, [initializeGame, setUserId]);

    return null;
}

export default useGameStoreInitializer;