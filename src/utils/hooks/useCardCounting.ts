/**
 * Hook for card counting strategies in Blackjack
 */
import { useCallback, useMemo, useState } from 'react';
import { Card, Rank } from '../../domains/card/cardTypes';
import { CountingSystem, getCountingSystem } from '../../domains/strategy/cardCounting';

/**
 * Hook for implementing card counting strategies
 */
export function useCardCounting(
    countingSystem: string = 'hiLo',
    numberOfDecks: number = 6
) {
    const [runningCount, setRunningCount] = useState<number>(0);
    const [cardsDealt, setCardsDealt] = useState<Card[]>([]);
    const [visibleCards, setVisibleCards] = useState<Card[]>([]);
    const [countHistory, setCountHistory] = useState<{ count: number, time: number }[]>([]);

    // Get the selected counting system
    const system = useMemo((): CountingSystem => {
        return getCountingSystem(countingSystem);
    }, [countingSystem]);

    /**
     * Reset the count
     */
    const resetCount = useCallback((): void => {
        setRunningCount(0);
        setCardsDealt([]);
        setVisibleCards([]);
        setCountHistory([]);
    }, []);

    /**
     * Track a newly dealt card
     */
    const trackCard = useCallback((card: Card): void => {
        // Only track face-up cards
        if (!card.isFaceUp) {
            return;
        }

        // Add to cards dealt
        setCardsDealt(prev => [...prev, card]);
        setVisibleCards(prev => [...prev, card]);

        // Update running count
        if (system) {
            const cardValue = system.values[card.rank] || 0;
            setRunningCount(prev => prev + cardValue);

            // Update count history
            setCountHistory(prev => [
                ...prev,
                { count: runningCount + cardValue, time: Date.now() }
            ]);
        }
    }, [system, runningCount]);

    /**
     * Track a revealed card (like dealer's hole card)
     */
    const trackRevealedCard = useCallback((card: Card): void => {
        // Card was already counted in dealt cards, but not in visible cards
        setVisibleCards(prev => [...prev, card]);

        // Update running count
        if (system) {
            const cardValue = system.values[card.rank] || 0;
            setRunningCount(prev => prev + cardValue);

            // Update count history
            setCountHistory(prev => [
                ...prev,
                { count: runningCount + cardValue, time: Date.now() }
            ]);
        }
    }, [system, runningCount]);

    /**
     * Track multiple cards at once
     */
    const trackCards = useCallback((cards: Card[]): void => {
        // Only track face-up cards
        const faceUpCards = cards.filter(card => card.isFaceUp);

        if (faceUpCards.length === 0) {
            return;
        }

        // Add to cards dealt and visible
        setCardsDealt(prev => [...prev, ...faceUpCards]);
        setVisibleCards(prev => [...prev, ...faceUpCards]);

        // Update running count
        if (system) {
            let countChange = 0;

            for (const card of faceUpCards) {
                countChange += system.values[card.rank] || 0;
            }

            setRunningCount(prev => prev + countChange);

            // Update count history
            setCountHistory(prev => [
                ...prev,
                { count: runningCount + countChange, time: Date.now() }
            ]);
        }
    }, [system, runningCount]);

    /**
     * Calculate the true count (running count adjusted for remaining decks)
     */
    const trueCount = useMemo((): number => {
        // Calculate remaining decks (approximately)
        const totalCards = numberOfDecks * 52;
        const remainingCards = totalCards - cardsDealt.length;
        const remainingDecks = Math.max(remainingCards / 52, 1);

        // Calculate true count
        return runningCount / remainingDecks;
    }, [runningCount, numberOfDecks, cardsDealt.length]);

    /**
     * Get count values for all card ranks in the current system
     */
    const countValues = useMemo((): Record<Rank, number> => {
        if (!system) {
            return {
                'A': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0,
                '8': 0, '9': 0, '10': 0, 'J': 0, 'Q': 0, 'K': 0
            };
        }

        return system.values;
    }, [system]);

    /**
     * Get a betting recommendation based on the count
     */
    const getBettingRecommendation = useCallback((): number => {
        if (!system) {
            return 1;
        }

        // Calculate how favorable the count is
        const countValue = trueCount;

        // Simple formula for bet recommendation
        if (countValue <= 0) {
            return 1; // Minimum bet
        } else if (countValue <= 1) {
            return 2; // Double minimum
        } else if (countValue <= 2) {
            return 3; // Triple minimum
        } else if (countValue <= 3) {
            return 4; // Quadruple minimum
        } else {
            return Math.min(5, Math.floor(countValue)); // Cap at 5x minimum
        }
    }, [system, trueCount]);

    /**
     * Get the count change for a specific card
     */
    const getCardCountValue = useCallback((card: Card): number => {
        if (!system) {
            return 0;
        }

        return system.values[card.rank] || 0;
    }, [system]);

    /**
     * Get the player advantage based on the count
     */
    const getPlayerAdvantage = useCallback((): number => {
        // Each true count point is approximately 0.5% advantage
        return trueCount * 0.5;
    }, [trueCount]);

    /**
     * Check if the deck is favorable for the player
     */
    const isDeckFavorable = useMemo((): boolean => {
        return trueCount > 1;
    }, [trueCount]);

    /**
     * Get strategy deviation recommendations based on the count
     */
    const getStrategyDeviations = useCallback((
        playerTotal: number,
        dealerUpCard: Rank,
        _hasAce: boolean = false,
        canDouble: boolean = false,
        canSurrender: boolean = false
    ): string => {
        // These are simplified basic strategy deviations based on the count
        if (!system) {
            return 'Follow basic strategy';
        }

        // Check for insurance first
        if (dealerUpCard === 'A' && trueCount >= 3) {
            return 'Take insurance';
        }

        // Use a strategy lookup approach instead of nested conditions
        const strategies: Array<{
            condition: boolean;
            action: string;
        }> = [
                // Surrender actions
                {
                    condition: canSurrender && playerTotal === 15 && dealerUpCard === '10' && trueCount >= 4,
                    action: 'Surrender'
                },
                {
                    condition: canSurrender && playerTotal === 15 && dealerUpCard === '9' && trueCount >= 2,
                    action: 'Surrender'
                },

                // Double down actions
                {
                    condition: canDouble && playerTotal === 9 && dealerUpCard === '2' && trueCount >= 1,
                    action: 'Double down'
                },

                // Stand actions
                {
                    condition: playerTotal === 16 && dealerUpCard === '10' && trueCount >= 0,
                    action: 'Stand'
                },
                {
                    condition: playerTotal === 15 && dealerUpCard === '10' && trueCount >= 4,
                    action: 'Stand'
                },
                {
                    condition: playerTotal === 12 && (dealerUpCard === '2' || dealerUpCard === '3') && trueCount >= 2,
                    action: 'Stand'
                }
            ];

        // Find the first matching strategy
        const matchedStrategy = strategies.find(strategy => strategy.condition);
        return matchedStrategy ? matchedStrategy.action : 'Follow basic strategy';
    }, [system, trueCount]);

    /**
     * Get statistics about the card counting
     */
    const getCountingStats = useCallback(() => {
        return {
            runningCount,
            trueCount,
            cardsDealt: cardsDealt.length,
            visibleCards: visibleCards.length,
            playerAdvantage: getPlayerAdvantage(),
            isDeckFavorable,
            system: system?.name || 'None',
            maxCount: Math.max(...countHistory.map(entry => entry.count), 0),
            minCount: Math.min(...countHistory.map(entry => entry.count), 0)
        };
    }, [
        runningCount, trueCount, cardsDealt, visibleCards,
        getPlayerAdvantage, isDeckFavorable, system, countHistory
    ]);

    /**
     * Get a description of the current count status
     */
    const getCountDescription = useMemo((): string => {
        if (trueCount < -3) {
            return 'Very cold deck - bet minimum';
        } else if (trueCount < -1) {
            return 'Cold deck - bet minimum';
        } else if (trueCount < 1) {
            return 'Neutral deck - bet minimum';
        } else if (trueCount < 3) {
            return 'Warm deck - increase bet';
        } else {
            return 'Hot deck - bet maximum';
        }
    }, [trueCount]);

    return {
        // State
        runningCount,
        trueCount,
        countValues,
        isDeckFavorable,
        countHistory,

        // Card tracking
        trackCard,
        trackRevealedCard,
        trackCards,
        resetCount,

        // Analysis
        getBettingRecommendation,
        getCardCountValue,
        getPlayerAdvantage,
        getStrategyDeviations,
        getCountingStats,
        getCountDescription
    };
}

export default useCardCounting;