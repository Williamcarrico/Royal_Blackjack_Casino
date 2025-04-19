import type { TableLimits, ProgressiveBetting } from '../../types/betTypes';
import type { SideBetsStore } from '../../types/storeTypes';

// Default table limits for bets and side bets
export const DEFAULT_TABLE_LIMITS: TableLimits = {
    minimumBet: 5,
    maximumBet: 500,
    minimumSideBet: 1,
    maximumSideBet: 100,
};

// Default progressive betting configuration
export const DEFAULT_PROGRESSIVE_BETTING: ProgressiveBetting = {
    enabled: false,
    baseBet: 5,
    winProgression: 1,
    lossProgression: 2,
    maxProgressionSteps: 5,
    resetCondition: 'win',
};

// Available side bets definitions and payouts
export const AVAILABLE_SIDE_BETS: SideBetsStore['availableSideBets'] = [
    {
        name: 'Perfect Pairs',
        description: 'Bet on getting a pair as your first two cards',
        minBet: 5,
        maxBet: 100,
        payouts: {
            'mixed-pair': 5,
            'colored-pair': 10,
            'perfect-pair': 30,
        },
    },
    {
        name: '21+3',
        description: 'Your first two cards plus dealer up card form a poker hand',
        minBet: 5,
        maxBet: 100,
        payouts: {
            'flush': 5,
            'straight': 10,
            'three-of-a-kind': 30,
            'straight-flush': 40,
            'suited-trips': 100,
        },
    },
    {
        name: 'Insurance',
        description: 'Bet against dealer blackjack when an Ace is showing',
        minBet: 1,
        maxBet: 250,
        payouts: {
            'win': 2,
        },
    },
    {
        name: 'Lucky Lucky',
        description: 'Your first two cards plus dealer up card total 19, 20, or 21',
        minBet: 5,
        maxBet: 100,
        payouts: {
            '19': 2,
            '20': 3,
            '21-unsuited': 15,
            '21-suited': 25,
            '21-777-unsuited': 50,
            '21-777-suited': 100,
        },
    },
    {
        name: 'Royal Match',
        description: 'First two cards are same suit with at least one royal card',
        minBet: 5,
        maxBet: 100,
        payouts: {
            'royal-match': 25,
            'suited-blackjack': 50,
            'suited-pair': 10,
        },
    },
    {
        name: 'Over/Under 13',
        description: 'Bet on whether your first two cards total over or under 13',
        minBet: 5,
        maxBet: 100,
        payouts: {
            'over-13': 1,
            'under-13': 1,
            'exactly-13': 10,
        },
    },
];