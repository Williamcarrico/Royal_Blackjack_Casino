'use client';

/**
 * useGameEffects.ts
 *
 * Hook for handling game side effects like sounds, animations,
 * and UI updates based on game state changes.
 */
import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/game/gameStore';

/**
 * Hook for managing game effects
 */
export function useGameEffects() {
    // Get relevant state and actions from the store
    const {
        // Game state
        gamePhase,
        gameStatus,
        lastAction,

        // Effects
        soundEnabled,
        vibrationEnabled,
        animationSpeed,
        isTableRotated,
        playSound,
        triggerVibration,
        setTableRotation,
        startAnimation,
        endAnimation,

        // Store actions
        trackAction
    } = useGameStore();

    /**
     * Play phase transition sounds
     */
    useEffect(() => {
        if (!soundEnabled) return;

        switch (gamePhase) {
            case 'dealing':
                playSound('deal');
                break;
            case 'playerTurn':
                playSound('turn');
                break;
            case 'dealerTurn':
                playSound('dealer');
                break;
            case 'settlement':
                // Play winning sound based on result
                // This would need to be improved with actual result checking
                if (Math.random() > 0.5) {
                    playSound('win');
                } else {
                    playSound('lose');
                }
                break;
        }
    }, [gamePhase, soundEnabled, playSound]);

    /**
     * Handle vibration on certain actions and events
     */
    useEffect(() => {
        if (!vibrationEnabled) return;

        // Vibrate on specific actions
        if (lastAction) {
            switch (lastAction) {
                case 'hit':
                    triggerVibration(50);
                    break;
                case 'win':
                    triggerVibration([100, 50, 100]);
                    break;
                case 'lose':
                    triggerVibration([50, 30, 40, 30, 50]);
                    break;
            }
        }
    }, [lastAction, vibrationEnabled, triggerVibration]);

    /**
     * Apply responsive layout adjustments
     */
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 640;
            const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

            // Apply table rotation for tablet
            setTableRotation(isTablet && !isMobile);
        };

        // Run on mount
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [setTableRotation]);

    /**
     * Play a card animation
     */
    const playCardAnimation = useCallback((
        type: 'deal' | 'hit' | 'flip',
        cardId: string,
        destination: string,
        onComplete?: () => void
    ) => {
        const animationId = `${type}_${cardId}_${Date.now()}`;

        // Add to active animations
        startAnimation(animationId);

        // Log this animation
        trackAction('animation', { type, cardId, destination });

        // Determine animation duration based on speed setting
        let duration = 600; // default for 'normal'
        if (animationSpeed === 'slow') duration = 1000;
        if (animationSpeed === 'fast') duration = 300;

        // Remove from active animations when done
        setTimeout(() => {
            endAnimation(animationId);
            if (onComplete) onComplete();
        }, duration);

        return animationId;
    }, [startAnimation, trackAction, animationSpeed, endAnimation]);

    /**
     * Play a chip animation
     */
    const playChipAnimation = useCallback((
        type: 'bet' | 'win' | 'lose',
        amount: number,
        source: string,
        destination: string,
        onComplete?: () => void
    ) => {
        const animationId = `chip_${type}_${Date.now()}`;

        // Add to active animations
        startAnimation(animationId);

        // Log this animation
        trackAction('animation', { type: `chip_${type}`, amount, source, destination });

        // Determine animation duration based on speed setting
        let duration = 800; // default for 'normal'
        if (animationSpeed === 'slow') duration = 1200;
        if (animationSpeed === 'fast') duration = 400;

        // Play sound if enabled
        if (soundEnabled) {
            playSound('chips');
        }

        // Remove from active animations when done
        setTimeout(() => {
            endAnimation(animationId);
            if (onComplete) onComplete();
        }, duration);

        return animationId;
    }, [startAnimation, trackAction, animationSpeed, soundEnabled, playSound, endAnimation]);

    /**
     * Play a notification animation
     */
    const playNotification = useCallback((
        message: string,
        type: 'info' | 'success' | 'error' | 'warning' = 'info',
        duration: number = 3000
    ) => {
        const notificationId = `notification_${Date.now()}`;

        // Add to active animations
        startAnimation(notificationId);

        // Play sound if enabled
        if (soundEnabled) {
            playSound(type === 'success' ? 'win' : type === 'error' ? 'lose' : 'notification');
        }

        // Trigger vibration if enabled
        if (vibrationEnabled) {
            if (type === 'success') triggerVibration([100, 50, 100]);
            else if (type === 'error') triggerVibration([50, 30, 50]);
            else triggerVibration(50);
        }

        // Remove from active animations when done
        setTimeout(() => {
            endAnimation(notificationId);
        }, duration);

        return notificationId;
    }, [startAnimation, soundEnabled, vibrationEnabled, playSound, triggerVibration, endAnimation]);

    return {
        // State
        gamePhase,
        gameStatus,
        isTableRotated,

        // Animation methods
        playCardAnimation,
        playChipAnimation,
        playNotification
    };
}