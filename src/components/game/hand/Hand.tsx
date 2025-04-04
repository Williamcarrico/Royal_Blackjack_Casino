'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import Card, { Suit, Rank } from '../card/Card';
import HandValue from './HandValue';

export interface CardData {
    id: string;
    suit: Suit;
    rank: Rank;
    faceDown?: boolean;
}

export interface HandProps {
    cards: CardData[];
    handId?: string;
    isDealer?: boolean;
    isActive?: boolean;
    isWinner?: boolean;
    isLoser?: boolean;
    isPush?: boolean;
    showValue?: boolean;
    className?: string;
    compact?: boolean;
    animate?: boolean;
    hideSecondCard?: boolean;
    handType?: 'player' | 'dealer' | 'split';
    onCardClick?: (cardId: string) => void;
}

const Hand = ({
    cards = [],
    handId = 'hand-1',
    isDealer = false,
    isActive = false,
    isWinner = false,
    isLoser = false,
    isPush = false,
    showValue = true,
    className = '',
    compact = false,
    animate = true,
    hideSecondCard = false,
    handType = 'player',
    onCardClick
}: HandProps) => {
    // Calculate the overlap between cards - less overlap in compact mode
    const baseOverlap = 60;
    const cardOverlap = compact ? baseOverlap / 2 : baseOverlap;

    // Calculate hand value for players (or dealers when all cards are shown)
    const handValue = calculateHandValue(cards, hideSecondCard);

    // Determine the outcome styling classes
    let outcomeClass = '';
    if (isWinner) {
        outcomeClass = 'ring-2 ring-green-500 dark:ring-green-400 bg-green-100/20';
    } else if (isLoser) {
        outcomeClass = 'ring-2 ring-red-500 dark:ring-red-400 bg-red-100/20';
    } else if (isPush) {
        outcomeClass = 'ring-2 ring-yellow-500 dark:ring-yellow-400 bg-yellow-100/20';
    }
    return (
        <div
            className={cn(
                'relative py-2 px-1 rounded-xl transition-all duration-300',
                isActive && 'outline-2 outline-offset-2 outline-primary',
                outcomeClass,
                className
            )}
            data-hand-id={handId}
        >
            <legend className="sr-only">{`${handType} hand with ${cards.length} cards`}</legend>
            {/* The cards container with fan effect */}
            <div className="relative mx-auto h-44">
                {cards.map((card, index) => {
                    // Should this card be hidden (dealer's hole card)
                    const isFaceDown = card.faceDown === true || (hideSecondCard && index === 1);

                    // Calculate offset for the fan effect
                    const offset = index * (compact ? 15 : 30) - (cards.length * (compact ? 7.5 : 15));

                    // Calculate the z-index to ensure proper stacking
                    const zIndex = index + 1;

                    return (
                        <div
                            key={card.id}
                            className={cn(
                                "absolute",
                                "game-card",
                            )}
                            data-offset={offset}
                            data-z-index={zIndex}
                            data-card-overlap={cardOverlap}
                        >
                            <Card
                                suit={card.suit}
                                rank={card.rank}
                                faceDown={isFaceDown}
                                dealt={animate}
                                index={index}
                                highlighted={isActive && index === cards.length - 1}
                                onClick={onCardClick ? () => onCardClick(card.id) : undefined}
                                aria-label={isFaceDown ? 'Face down card' : `${card.rank} of ${card.suit}`}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Display the hand value if requested */}
            {showValue && cards.length > 0 && (
                <HandValue
                    value={handValue}
                    isSoft={isSoftHand(cards, hideSecondCard)}
                    isBlackjack={isBlackjack(cards, hideSecondCard)}
                    isBust={isBust(handValue)}
                    isDealer={isDealer}
                />
            )}
        </div>
    );
};

// Calculate the value of a blackjack hand, considering aces
function calculateHandValue(cards: CardData[] = [], hideSecondCard = false): number {
    if (!cards || cards.length === 0) return 0;

    let sum = 0;
    let aceCount = 0;

    // Calculate the base value, counting aces as 1 initially
    cards.forEach((card, index) => {
        // Skip the second card if it should be hidden (dealer's hole card)
        if (hideSecondCard && index === 1) return;

        // Skip any face down cards
        if (card.faceDown) return;

        const rank = card.rank;

        if (rank === 'A') {
            aceCount += 1;
            sum += 1; // Count ace as 1 initially
        } else if (['K', 'Q', 'J'].includes(rank)) {
            sum += 10;
        } else {
            sum += parseInt(rank, 10);
        }
    });

    // Adjust for aces (use them as 11 when beneficial)
    while (aceCount > 0 && sum <= 11) {
        sum += 10; // Add 10 more (as we already counted ace as 1)
        aceCount -= 1;
    }

    return sum;
}

// Check if the hand has a soft value (an ace counted as 11)
function isSoftHand(cards: CardData[] = [], hideSecondCard = false): boolean {
    if (!cards || cards.length === 0) return false;

    let sum = 0;
    let hasAce = false;

    cards.forEach((card, index) => {
        if (hideSecondCard && index === 1) return;
        if (card.faceDown) return;

        if (card.rank === 'A') {
            hasAce = true;
        }

        if (['K', 'Q', 'J', '10'].includes(card.rank)) {
            sum += 10;
        } else if (card.rank === 'A') {
            sum += 1; // Count ace as 1 for now
        } else {
            sum += parseInt(card.rank, 10);
        }
    });

    // If we have an ace and adding 10 doesn't bust, it's a soft hand
    return hasAce && (sum + 10) <= 21;
}

// Check if the hand is a blackjack (an ace and a 10-value card)
function isBlackjack(cards: CardData[] = [], hideSecondCard = false): boolean {
    if (!cards || hideSecondCard || cards.length !== 2) return false;

    let hasAce = false;
    let hasTenValueCard = false;

    cards.forEach(card => {
        if (card.faceDown) return;

        if (card.rank === 'A') {
            hasAce = true;
        } else if (['K', 'Q', 'J', '10'].includes(card.rank)) {
            hasTenValueCard = true;
        }
    });

    return hasAce && hasTenValueCard;
}

// Check if the hand is busted (value over 21)
function isBust(handValue: number): boolean {
    return handValue > 21;
}

export default Hand;