import { useState, useEffect, useCallback } from 'react';
import dealerLogic, { DealerMove } from '@/domains/dealer/dealerLogic';
import type { CardData } from '@/components/game/hand/Hand';
import type { OutcomeType } from '@types/uiTypes';
import { UIGamePhase } from '@types/gameTypes';
import { Card } from '@/domains/card/cardTypes';
import { DealerHand as DealerHandType } from '@/types/handTypes';

export interface UseDealerTurnOptions {
    cards: CardData[];
    gamePhase: UIGamePhase;
    isActive: boolean;
    standValue?: number;
    drawDelay?: number;
    flipDelay?: number;
    autoPlay?: boolean;
    onDealerAction?: (action: 'hit' | 'stand', score: number) => void;
    onDealerTurnEnd?: (finalScore: number, outcome: OutcomeType) => void;
}

export interface UseDealerTurnResult {
    currentCards: CardData[];
    currentScore: number;
    isThinking: boolean;
    message: string;
    isDealerTurnComplete: boolean;
    lastAction: 'hit' | 'stand' | 'reveal' | null;
    isBust: boolean;
}

// Convert UI CardData to domain Card type
const convertCardDataToDomainCard = (cardData: CardData): Card => {
    let value;
    if (cardData.rank === 'A') {
        value = 'A';
    } else if (['K', 'Q', 'J', '10'].includes(cardData.rank)) {
        value = '10';
    } else {
        value = cardData.rank;
    }

    return {
        suit: cardData.suit,
        rank: cardData.rank,
        value,
        face: cardData.faceDown ? 'down' : 'up'
    };
};

// Convert domain Card to UI CardData
const convertDomainCardToCardData = (card: Card): CardData => {
    return {
        id: `${card.suit}-${card.rank}`,
        suit: card.suit,
        rank: card.rank,
        faceDown: card.face === 'down',
    };
};

// Calculate score from cards
const calculateScore = (cards: CardData[]): number => {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
        const rank = card.rank;
        if (rank === 'A') {
            aces += 1;
            total += 1;
        } else if (['K', 'Q', 'J'].includes(rank)) {
            total += 10;
        } else {
            total += parseInt(rank, 10);
        }
    }

    // Optimize aces
    while (aces > 0 && total + 10 <= 21) {
        total += 10;
        aces -= 1;
    }

    return total;
};

export function useDealerTurn({
    cards,
    gamePhase,
    isActive,
    drawDelay = 1000,
    flipDelay = 500,
    autoPlay = true,
    onDealerAction,
    onDealerTurnEnd,
}: UseDealerTurnOptions): UseDealerTurnResult {
    const [currentCards, setCurrentCards] = useState<CardData[]>(cards);
    const [isThinking, setIsThinking] = useState(false);
    const [message, setMessage] = useState('');
    const [lastAction, setLastAction] = useState<'hit' | 'stand' | 'reveal' | null>(null);
    const [actionTimer, setActionTimer] = useState<NodeJS.Timeout | null>(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
    const [dealerMoves, setDealerMoves] = useState<DealerMove[]>([]);
    const [isDealerTurnComplete, setIsDealerTurnComplete] = useState(false);

    // Get the current dealer score
    const currentScore = calculateScore(currentCards);

    // Determine if the dealer busts
    const isBust = currentScore > 21;

    // Cleanup on unmount or when dependencies change
    useEffect(() => {
        return () => {
            if (actionTimer) {
                clearTimeout(actionTimer);
            }
        };
    }, [actionTimer]);

    // Update from external card changes
    useEffect(() => {
        // Only update from external card changes if not in the middle of our own sequence
        if (!isActive || gamePhase !== UIGamePhase.DealerTurn || isDealerTurnComplete) {
            setCurrentCards(cards);
        }
    }, [cards, isActive, gamePhase, isDealerTurnComplete]);

    // Initialize dealer turn - compute all moves at the start
    useEffect(() => {
        if (isActive && gamePhase === UIGamePhase.DealerTurn && autoPlay && dealerMoves.length === 0) {
            setIsThinking(true);
            setMessage('Dealer\'s turn');
            setIsDealerTurnComplete(false);

            // Create a dealer hand from the card data
            const dealerHand: DealerHandType = {
                id: 'dealer',
                cards: cards.map(convertCardDataToDomainCard),
                values: [],
                bestValue: 0,
                status: 'active',
                hasHiddenCard: cards.some(card => card.faceDown)
            };

            // Create a set of remaining cards (simulated)
            // In a real implementation, this would use the actual remaining deck
            const remainingCards: Card[] = Array(20).fill(null).map((_, i) => ({
                suit: ['hearts', 'diamonds', 'clubs', 'spades'][i % 4],
                rank: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'][i % 13],
                value: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '10', '10', '10', 'A'][i % 13],
                face: 'up'
            }));

            // Compute all dealer moves upfront
            const options = { dealerHitsSoft17: true };
            const moves = dealerLogic.computeDealerMoves(dealerHand, remainingCards, options);
            setDealerMoves(moves);

            // Start processing the moves with a slight delay
            const timer = setTimeout(() => {
                setCurrentMoveIndex(0);
            }, flipDelay);

            setActionTimer(timer);
        }
    }, [isActive, gamePhase, cards, autoPlay, flipDelay, dealerMoves]);

    // Process each dealer move with appropriate delays
    useEffect(() => {
        if (currentMoveIndex >= 0 && currentMoveIndex < dealerMoves.length && isActive && gamePhase === UIGamePhase.DealerTurn) {
            const currentMove = dealerMoves[currentMoveIndex];

            // Update UI based on the current move
            switch (currentMove.action) {
                case 'reveal': {
                    setMessage('Revealing hole card...');
                    setIsThinking(true);
                    setLastAction('reveal');

                    // Update cards to show the revealed hole card
                    const revealedCards = currentMove.hand.cards.map(convertDomainCardToCardData);
                    setCurrentCards(revealedCards);

                    // Notify parent about the reveal
                    onDealerAction?.('hit', calculateScore(revealedCards));

                    // Schedule next move
                    const revealTimer = setTimeout(() => {
                        setIsThinking(false);
                        setCurrentMoveIndex(prev => prev + 1);
                    }, drawDelay);

                    setActionTimer(revealTimer);
                    break;
                }

                case 'hit': {
                    setMessage('Dealer draws a card...');
                    setIsThinking(true);
                    setLastAction('hit');

                    // Update cards with the new hit card
                    const updatedCards = currentMove.hand.cards.map(convertDomainCardToCardData);
                    setCurrentCards(updatedCards);

                    // Notify parent about the hit
                    onDealerAction?.('hit', calculateScore(updatedCards));

                    // Schedule next move
                    const hitTimer = setTimeout(() => {
                        setIsThinking(false);
                        setCurrentMoveIndex(prev => prev + 1);
                    }, drawDelay);

                    setActionTimer(hitTimer);
                    break;
                }

                case 'stand': {
                    setIsThinking(false);
                    setLastAction('stand');

                    // Determine final outcome
                    let dealerOutcome: OutcomeType = null;
                    if (currentMove.hand.status === 'busted') {
                        dealerOutcome = 'bust';
                        setMessage('Dealer busts!');
                    } else {
                        dealerOutcome = null;
                        setMessage(`Dealer stands with ${currentMove.hand.bestValue}`);
                    }

                    // Update cards to the final state
                    const finalCards = currentMove.hand.cards.map(convertDomainCardToCardData);
                    setCurrentCards(finalCards);

                    // Notify parent that dealer's turn is complete
                    const finalScore = currentMove.hand.bestValue;

                    // Schedule completion action
                    const standTimer = setTimeout(() => {
                        onDealerAction?.('stand', finalScore);
                        onDealerTurnEnd?.(finalScore, dealerOutcome);
                        setIsDealerTurnComplete(true);
                    }, drawDelay);

                    setActionTimer(standTimer);
                    break;
                }
            }
        }
    }, [currentMoveIndex, dealerMoves, isActive, gamePhase, drawDelay, onDealerAction, onDealerTurnEnd]);

    return {
        currentCards,
        currentScore,
        isThinking,
        message,
        isDealerTurnComplete,
        lastAction,
        isBust
    };
}