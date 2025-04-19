import type { SideBetResult, SideBetsStore } from '@/types/storeTypes';
import type { Hand } from '@/types/handTypes';
import type { Card } from '@/domains/card/cardTypes';

// Internal representation of a card for side-bet evaluation
interface InternalCard {
    id: string;
    rank: string;
    suit: string;
    value: number;
}

/**
 * Update an active side bet object with the evaluation result
 */
export function updateSideBetFromResult(
    bet: SideBetsStore['activeSideBets'][0],
    result?: SideBetResult
): SideBetsStore['activeSideBets'][0] {
    if (!result) return bet;
    return {
        ...bet,
        status: result.outcome,
        payout: result.payout,
        payoutMultiplier: result.payoutMultiplier,
        winningCombination: result.winningCombination
    };
}

/**
 * Incorporate a single result into statistics
 */
export function updateStatisticsForResult(
    statistics: SideBetsStore['sideBetStatistics'],
    result: SideBetResult
): void {
    if (!statistics.typeStats[result.type]) {
        statistics.typeStats[result.type] = {
            betsPlaced: 0,
            totalAmount: 0,
            wins: 0,
            losses: 0,
            totalPayouts: 0,
            roi: 0
        };
    }

    const stats = statistics.typeStats[result.type];
    if (result.outcome === 'won') {
        statistics.sideBetWins += 1;
        statistics.totalSideBetPayouts += result.payout;
        stats.wins += 1;
        stats.totalPayouts += result.payout;
    } else if (result.outcome === 'lost') {
        statistics.sideBetLosses += 1;
        stats.losses += 1;
    }
}

/**
 * Finalize statistics after multiple updates
 */
export function calculateUpdatedStatistics(
    statistics: SideBetsStore['sideBetStatistics']
): SideBetsStore['sideBetStatistics'] {
    const wins = statistics.sideBetWins;
    const losses = statistics.sideBetLosses;
    statistics.winRate = (wins / (wins + losses || 1)) * 100;
    statistics.netProfit = statistics.totalSideBetPayouts - statistics.totalSideBetAmount;

    Object.values(statistics.typeStats).forEach(stats => {
        stats.roi = ((stats.totalPayouts - stats.totalAmount) / (stats.totalAmount || 1)) * 100;
    });

    return statistics;
}

/**
 * Core evaluator: given bet type, player hand, dealer up card and amount, return SideBetResult
 */
export function evaluateSideBetResult(
    betType: string,
    playerHand: Hand,
    dealerUpCard: Card,
    betAmount: number,
    availableBets: SideBetsStore['availableSideBets']
): SideBetResult {
    const result: SideBetResult = {
        type: betType,
        handId: playerHand.id,
        playerId: playerHand.id.split('-')[0] || 'player-1',
        outcome: 'lost',
        payoutMultiplier: 0,
        payout: 0,
        originalBet: betAmount
    };

    const betConfig = availableBets.find(b => b.name === betType);
    if (!betConfig) return result;

    // Convert cards to internal format
    const playerCards: InternalCard[] = playerHand.cards.map((card: Card) => ({
        id: card.id,
        rank: String(card.value), // Use value as rank
        suit: card.suit,
        value: getCardValue(card)
    }));

    const dealerCardInternal: InternalCard = {
        id: dealerUpCard.id,
        rank: String(dealerUpCard.value), // Use value as rank
        suit: dealerUpCard.suit,
        value: getCardValue(dealerUpCard)
    };

    // Delegate to specific type evaluator
    const evalResult = evaluateBetByType(
        betType,
        playerCards,
        dealerCardInternal,
        playerHand,
        betConfig
    );

    if (evalResult) {
        result.outcome = 'won';
        result.winningCombination = evalResult.combination;
        result.payoutMultiplier = evalResult.multiplier;
        result.payout = betAmount * evalResult.multiplier;
    }

    return result;
}

/**
 * Dispatch evaluation by bet type
 */
export function evaluateBetByType(
    betType: string,
    playerCards: InternalCard[],
    dealerCard: InternalCard,
    playerHand: Hand,
    betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null {
    if (playerCards.length < 2) return null;
    switch (betType) {
        case 'Perfect Pairs':
            return evaluatePerfectPairs(playerCards, betConfig);
        case '21+3':
            return evaluate21Plus3(playerCards, dealerCard, betConfig);
        case 'Insurance':
            return evaluateInsurance(dealerCard, betConfig);
        case 'Lucky Lucky':
            return evaluateLuckyLucky(playerCards, dealerCard, betConfig);
        case 'Royal Match':
            return evaluateRoyalMatch(playerCards, playerHand, betConfig);
        case 'Over/Under 13':
            return evaluateOverUnder13(playerCards, betConfig);
        default:
            return null;
    }
}

/** Perfect Pairs evaluator */
export function evaluatePerfectPairs(
    playerCards: InternalCard[],
    betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null {
    const [c1, c2] = playerCards;
    if (!c1 || !c2 || c1.rank !== c2.rank) return null;
    if (c1.suit === c2.suit) {
        return { combination: 'perfect-pair', multiplier: betConfig.payouts['perfect-pair'] ?? 0 };
    }
    if (isRedCard(c1) === isRedCard(c2)) {
        return { combination: 'colored-pair', multiplier: betConfig.payouts['colored-pair'] ?? 0 };
    }
    return { combination: 'mixed-pair', multiplier: betConfig.payouts['mixed-pair'] ?? 0 };
}

/** 21+3 evaluator */
export function evaluate21Plus3(
    playerCards: InternalCard[],
    dealerCard: InternalCard,
    betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null {
    const pokerHand = evaluatePokerHand([...playerCards.slice(0, 2), dealerCard]);
    if (!pokerHand) return null;
    return { combination: pokerHand, multiplier: betConfig.payouts[pokerHand] ?? 0 };
}

/** Insurance evaluator */
export function evaluateInsurance(
    dealerCard: InternalCard,
    betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null {
    if (dealerCard.rank !== 'A') return null;
    if (Math.random() < 0.308) {
        return { combination: 'win', multiplier: betConfig.payouts['win'] ?? 0 };
    }
    return null;
}

/** Lucky Lucky evaluator */
export function evaluateLuckyLucky(
    playerCards: InternalCard[],
    dealerCard: InternalCard,
    betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null {
    const all = [...playerCards, dealerCard];
    const total = getTotalCardValue(all);
    const allSevens = all.every(c => c.rank === '7');
    const allSameSuit = all.every(c => c.suit === all[0].suit);
    if (total === 21) {
        if (allSevens && allSameSuit) return { combination: '21-777-suited', multiplier: betConfig.payouts['21-777-suited'] ?? 0 };
        if (allSevens) return { combination: '21-777-unsuited', multiplier: betConfig.payouts['21-777-unsuited'] ?? 0 };
        if (allSameSuit) return { combination: '21-suited', multiplier: betConfig.payouts['21-suited'] ?? 0 };
        return { combination: '21-unsuited', multiplier: betConfig.payouts['21-unsuited'] ?? 0 };
    }
    if (total === 20) return { combination: '20', multiplier: betConfig.payouts['20'] ?? 0 };
    if (total === 19) return { combination: '19', multiplier: betConfig.payouts['19'] ?? 0 };
    return null;
}

/** Royal Match evaluator */
export function evaluateRoyalMatch(
    playerCards: InternalCard[],
    playerHand: Hand,
    betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null {
    const [c1, c2] = playerCards;
    if (!c1 || !c2 || c1.suit !== c2.suit) return null;
    const isRoyal = (r: string) => ['J', 'Q', 'K'].includes(r);
    if (isRoyal(c1.rank) && isRoyal(c2.rank)) {
        return { combination: 'royal-match', multiplier: betConfig.payouts['royal-match'] ?? 0 };
    }
    if (isBlackjack(playerHand)) {
        return { combination: 'suited-blackjack', multiplier: betConfig.payouts['suited-blackjack'] ?? 0 };
    }
    if (c1.rank === c2.rank) {
        return { combination: 'suited-pair', multiplier: betConfig.payouts['suited-pair'] ?? 0 };
    }
    return null;
}

/** Over/Under 13 evaluator */
export function evaluateOverUnder13(
    playerCards: InternalCard[],
    betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null {
    const total = getTotalCardValue(playerCards);
    if (total === 13) return { combination: 'exactly-13', multiplier: betConfig.payouts['exactly-13'] ?? 0 };
    if (total > 13) return { combination: 'over-13', multiplier: betConfig.payouts['over-13'] ?? 0 };
    if (total < 13) return { combination: 'under-13', multiplier: betConfig.payouts['under-13'] ?? 0 };
    return null;
}

/** Checks if card suit is red */
export function isRedCard(card: InternalCard): boolean {
    return card.suit === 'hearts' || card.suit === 'diamonds';
}

/** Map Card to its blackjack value */
export function getCardValue(card: Card): number {
    if (card.value === 'A') return 1;
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    return parseInt(String(card.value), 10);
}

/** Sum internal card values */
export function getTotalCardValue(cards: InternalCard[]): number {
    return cards.reduce((sum, c) => sum + c.value, 0);
}

/** Check if hand is blackjack */
export function isBlackjack(hand: Hand): boolean {
    return hand.bestValue === 21 && hand.cards.length === 2;
}

/** Evaluate poker hand ranking for 21+3 */
export function evaluatePokerHand(cards: InternalCard[]): string | null {
    if (cards.length !== 3) return null;
    const ranks = cards.map(c => c.rank);
    const uniqueRanks = new Set(ranks);
    // Three of a kind or suited trips
    if (uniqueRanks.size === 1) {
        const suits = cards.map(c => c.suit);
        if (new Set(suits).size === 1) return 'suited-trips';
        return 'three-of-a-kind';
    }
    // Helper for values
    const rankValues: Record<string, number> = {
        'A': 1,
        'J': 11,
        'Q': 12,
        'K': 13
    };
    const mapRank = (card: InternalCard) => rankValues[card.rank] ?? parseInt(card.rank, 10);
    const values = cards.map(mapRank).sort((a, b) => a - b);
    const isConsecutive = (values[1] === values[0] + 1 && values[2] === values[1] + 1) || (values[0] === 1 && values[1] === 12 && values[2] === 13);
    const isFlush = new Set(cards.map(c => c.suit)).size === 1;
    if (isConsecutive && isFlush) return 'straight-flush';
    if (isConsecutive) return 'straight';
    if (isFlush) return 'flush';
    return null;
}

/**
 * Evaluates the poker hand strength of a set of cards
 */
export function evaluatePokerHandStrength(cards: Card[]): number {
    // Convert to internal cards for consistent evaluation
    const internalCards: InternalCard[] = cards.map(card => ({
        id: card.id,
        rank: String(card.value),
        suit: card.suit,
        value: getCardValue(card)
    }));

    // Use internalCards for evaluation
    if (internalCards.length !== 3) return 0;

    // Basic evaluation using existing helper functions
    const pokerHand = evaluatePokerHand(internalCards);

    // Return strength value based on hand type
    switch (pokerHand) {
        case 'straight-flush': return 0.9;
        case 'suited-trips': return 0.8;
        case 'three-of-a-kind': return 0.7;
        case 'straight': return 0.5;
        case 'flush': return 0.4;
        default: return 0;
    }
}

/**
 * Checks if a hand is valid for recommendation
 */
export function isValidHandForRecommendation(playerHand: Hand, _dealerUpCard: Card): boolean {
    return playerHand.cards.length >= 2;
}

/**
 * Checks for perfect pairs recommendation
 */
export function checkPerfectPairsRecommendation(
    playerCards: Card[],
    recs: Array<{ type: string; confidence: number }>
): void {
    if (playerCards.length < 2) return;

    const c1 = playerCards[0];
    const c2 = playerCards[1];

    if (c1.value === c2.value) {
        // Recommendation logic here
        recs.push({ type: 'Perfect Pairs', confidence: 0.8 });
    }
}

export function check21Plus3Recommendation(
    playerCards: Card[],
    dealerUpCard: Card,
    recs: Array<{ type: string; confidence: number }>
): void {
    const strength = evaluatePokerHandStrength([...playerCards.slice(0, 2), dealerUpCard]);
    if (strength > 0) recs.push({ type: '21+3', confidence: Math.min(strength * 10, 90) });
}

export function checkInsuranceRecommendation(
    dealerUpCard: Card,
    recs: Array<{ type: string; confidence: number }>
): void {
    if (dealerUpCard.rank === 'A') recs.push({ type: 'Insurance', confidence: 30 });
}

export function checkLuckyLuckyRecommendation(
    playerCards: Card[],
    dealerUpCard: Card,
    recs: Array<{ type: string; confidence: number }>
): void {
    const total = [...playerCards, dealerUpCard].map(c => getCardValue(c)).reduce((a, b) => a + b, 0);
    if (total >= 19 && total <= 21) {
        let confidence = total === 21 ? 90 : 70;
        if ([...playerCards, dealerUpCard].every(c => getCardValue(c) === 7)) confidence = 95;
        recs.push({ type: 'Lucky Lucky', confidence });
    }
}