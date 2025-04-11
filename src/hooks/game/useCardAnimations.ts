'use client';

/**
 * Hook for managing card animations in blackjack game
 */
import { useState, useCallback, useEffect } from 'react';
import { ANIMATION } from '@/lib/constants/uiConstants';

export interface CardPosition {
    id: string;
    x: number;
    y: number;
}

export interface CardAnimationState {
    isDealing: boolean;
    isFlipping: boolean;
    isCollecting: boolean;
    animationQueue: CardAnimationRequest[];
}

export type CardAnimationType = 'deal' | 'flip' | 'collect' | 'slide';

export interface CardAnimationRequest {
    id: string;
    type: CardAnimationType;
    sourcePosition?: CardPosition;
    targetPosition: CardPosition;
    delay?: number;
    duration?: number;
    onComplete?: () => void;
}

interface UseCardAnimationsProps {
    enabled?: boolean;
    soundEnabled?: boolean;
    onAnimationComplete?: () => void;
}

/**
 * Custom hook for handling card animations in the blackjack game
 * Manages dealing, flipping, and collecting animations with sound effects
 */
export function useCardAnimations({
    enabled = true,
    soundEnabled = true,
    onAnimationComplete,
}: UseCardAnimationsProps = {}) {
    // Animation state
    const [animationState, setAnimationState] = useState<CardAnimationState>({
        isDealing: false,
        isFlipping: false,
        isCollecting: false,
        animationQueue: []
    });

    // Currently animating card IDs
    const [activeAnimations, setActiveAnimations] = useState<Record<string, CardAnimationType>>({});

    // Sound effects
    const playSound = useCallback((soundName: string) => {
        if (!soundEnabled) return;

        try {
            const audio = new Audio(`/sounds/${soundName}.mp3`);
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }, [soundEnabled]);

    // Process the next animation in the queue
    const processNextAnimation = useCallback(() => {
        setAnimationState(prevState => {
            if (prevState.animationQueue.length === 0) {
                return {
                    ...prevState,
                    isDealing: false,
                    isFlipping: false,
                    isCollecting: false,
                };
            }

            // Get the next animation request
            const [nextAnimation, ...remainingQueue] = prevState.animationQueue;

            // TypeScript safety - this should never happen due to the check above
            if (!nextAnimation) {
                return prevState;
            }

            // Mark this card as being animated
            setActiveAnimations(prev => ({
                ...prev,
                [nextAnimation.id]: nextAnimation.type
            }));

            // Play appropriate sound effect
            if (nextAnimation.type === 'deal') {
                playSound('card-deal');
            } else if (nextAnimation.type === 'flip') {
                playSound('card-flip');
            }

            // Set a timeout to complete this animation
            const duration = nextAnimation.duration ||
                (nextAnimation.type === 'deal' ? ANIMATION.CARD_DEAL :
                    nextAnimation.type === 'flip' ? ANIMATION.CARD_FLIP :
                        ANIMATION.CARD_DEAL);

            setTimeout(() => {
                // Remove from active animations
                setActiveAnimations(prev => {
                    const updated = { ...prev };
                    delete updated[nextAnimation.id];
                    return updated;
                });

                // Call completion callback if provided
                if (nextAnimation.onComplete) {
                    nextAnimation.onComplete();
                }

                // Process next animation in queue
                processNextAnimation();
            }, duration + (nextAnimation.delay || 0));

            return {
                ...prevState,
                animationQueue: remainingQueue,
                isDealing: nextAnimation.type === 'deal' || prevState.isDealing,
                isFlipping: nextAnimation.type === 'flip' || prevState.isFlipping,
                isCollecting: nextAnimation.type === 'collect' || prevState.isCollecting,
            };
        });
    }, [playSound]);

    /**
     * Add an animation to the queue
     */
    const queueAnimation = useCallback((request: CardAnimationRequest) => {
        if (!enabled) {
            // If animations are disabled, just call the completion handler immediately
            if (request.onComplete) {
                request.onComplete();
            }
            return;
        }

        setAnimationState(prevState => {
            const wasEmpty = prevState.animationQueue.length === 0;
            const updatedQueue = [...prevState.animationQueue, request];

            // If queue was empty, this will trigger processing to start
            if (wasEmpty) {
                setTimeout(() => processNextAnimation(), 0);
            }

            return {
                ...prevState,
                animationQueue: updatedQueue
            };
        });
    }, [enabled, processNextAnimation]);

    /**
     * Deal a card with animation
     */
    const dealCard = useCallback((
        cardId: string,
        fromPosition: CardPosition,
        toPosition: CardPosition,
        delay: number = 0,
        onComplete?: () => void
    ) => {
        queueAnimation({
            id: cardId,
            type: 'deal',
            sourcePosition: fromPosition,
            targetPosition: toPosition,
            delay,
            duration: ANIMATION.CARD_DEAL,
            onComplete
        });
    }, [queueAnimation]);

    /**
     * Flip a card with animation
     */
    const flipCard = useCallback((
        cardId: string,
        position: CardPosition,
        delay: number = 0,
        onComplete?: () => void
    ) => {
        queueAnimation({
            id: cardId,
            type: 'flip',
            targetPosition: position,
            delay,
            duration: ANIMATION.CARD_FLIP,
            onComplete
        });
    }, [queueAnimation]);

    /**
     * Collect cards with animation (move to discard pile)
     */
    const collectCards = useCallback((
        cardIds: string[],
        fromPositions: CardPosition[],
        toPosition: CardPosition,
        delay: number = 0,
        onComplete?: () => void
    ) => {
        // Queue a collection animation for each card
        cardIds.forEach((cardId, index) => {
            const fromPosition = fromPositions[index] || fromPositions[0];

            queueAnimation({
                id: cardId,
                type: 'collect',
                sourcePosition: fromPosition,
                targetPosition: toPosition,
                delay: delay + (index * 100), // Stagger the collection
                duration: ANIMATION.CARD_DEAL,
                onComplete: index === cardIds.length - 1 ? onComplete : undefined
            });
        });

        // Play collection sound
        if (cardIds.length > 0) {
            setTimeout(() => playSound('card-shuffle'), delay);
        }
    }, [queueAnimation, playSound]);

    /**
     * Check if a specific card is currently being animated
     */
    const isCardAnimating = useCallback((cardId: string): boolean => {
        return !!activeAnimations[cardId];
    }, [activeAnimations]);

    /**
     * Get the type of animation currently applied to a card
     */
    const getCardAnimationType = useCallback((cardId: string): CardAnimationType | null => {
        return activeAnimations[cardId] || null;
    }, [activeAnimations]);

    /**
     * Clear all pending animations
     */
    const clearAnimations = useCallback(() => {
        setAnimationState({
            isDealing: false,
            isFlipping: false,
            isCollecting: false,
            animationQueue: []
        });
        setActiveAnimations({});
    }, []);

    // Notify when all animations complete
    useEffect(() => {
        if (
            animationState.animationQueue.length === 0 &&
            !animationState.isDealing &&
            !animationState.isFlipping &&
            !animationState.isCollecting &&
            Object.keys(activeAnimations).length === 0 &&
            onAnimationComplete
        ) {
            onAnimationComplete();
        }
    }, [
        animationState.animationQueue.length,
        animationState.isDealing,
        animationState.isFlipping,
        animationState.isCollecting,
        activeAnimations,
        onAnimationComplete
    ]);

    return {
        // Animation state
        isDealing: animationState.isDealing,
        isFlipping: animationState.isFlipping,
        isCollecting: animationState.isCollecting,
        isAnimating: animationState.animationQueue.length > 0 ||
            Object.keys(activeAnimations).length > 0,

        // Card-specific animation checks
        isCardAnimating,
        getCardAnimationType,

        // Animation methods
        dealCard,
        flipCard,
        collectCards,
        clearAnimations,

        // Direct queue access for custom animations
        queueAnimation
    };
}

export default useCardAnimations;