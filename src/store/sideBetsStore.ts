import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SideBetsStore } from '@/types/storeTypes';
import type { DealerHand, Hand } from '@/types/handTypes';
import type { Card } from '@/types/cardTypes';
import { v4 as uuidv4 } from 'uuid';

// Side bet outcome types
type SideBetOutcome = 'pending' | 'won' | 'lost';

// Additional types for internal card handling
interface InternalCard {
  id: string;
  rank: string;
  suit: string;
  value: number;
}

// Side bet result with detailed information
interface SideBetResult {
  type: string;
  handId: string;
  playerId: string;
  outcome: SideBetOutcome;
  winningCombination?: string;
  payoutMultiplier: number;
  payout: number;
  originalBet: number;
}

// Extended SideBetsStore interface with additional properties needed for page.tsx
interface ExtendedSideBetsStore extends SideBetsStore {
  _betTypeMap: Record<string, string>;
  _availableBetTypes: Record<string, boolean>;

  // Additional convenience methods for page.tsx
  resetBets: () => void;
  setAvailableBet: (type: string, available: boolean) => void;
  placeBet: (type: string, amount: number) => void;
  getTotalBetAmount: () => number;
  getBets: () => Array<{ type: string; amount: number }>;
  getAvailableBets: () => Record<string, boolean>;
}

// Define types for the helper functions
interface SideBet {
  id: string;
  type: string;
  handId: string;
  playerId: string;
  amount: number;
  status: SideBetOutcome;
  payout: number;
  payoutMultiplier?: number;
  winningCombination?: string;
  timestamp: Date;
}

interface SideBetStatistics {
  totalSideBetsPlaced: number;
  totalSideBetAmount: number;
  sideBetWins: number;
  sideBetLosses: number;
  totalSideBetPayouts: number;
  netProfit: number;
  winRate: number;
  typeStats: Record<string, {
    betsPlaced: number;
    totalAmount: number;
    wins: number;
    losses: number;
    totalPayouts: number;
    roi: number;
  }>;
}

// Helper function to update side bet from result
const updateSideBetFromResult = (bet: SideBet, result: SideBetResult | undefined) => {
  if (!result) return bet;

  return {
    ...bet,
    status: result.outcome,
    payout: result.payout,
    payoutMultiplier: result.payoutMultiplier,
    winningCombination: result.winningCombination
  };
};

// Helper function to update statistics for a result
const updateStatisticsForResult = (statistics: SideBetStatistics, result: SideBetResult) => {
  // Ensure type stats exist
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

  // TypeStats is guaranteed to exist due to the initialization above
  const typeStats = statistics.typeStats[result.type]!;
  if (result.outcome === 'won') {
    statistics.sideBetWins += 1;
    statistics.totalSideBetPayouts += result.payout;
    typeStats.wins += 1;
    typeStats.totalPayouts += result.payout;
  } else if (result.outcome === 'lost') {
    statistics.sideBetLosses += 1;
    typeStats.losses += 1;
  }
};

// Helper function to calculate statistics after updates
const calculateUpdatedStatistics = (statistics: SideBetStatistics) => {
  // Calculate updated win rate
  statistics.winRate = statistics.sideBetWins /
    (statistics.sideBetWins + statistics.sideBetLosses || 1) * 100;

  // Calculate net profit
  statistics.netProfit = statistics.totalSideBetPayouts - statistics.totalSideBetAmount;

  // Calculate ROI for each bet type
  Object.keys(statistics.typeStats).forEach(type => {
    // Stats is guaranteed to exist because we're iterating over existing keys
    const stats = statistics.typeStats[type]!;
    stats.roi = (stats.totalPayouts - stats.totalAmount) / (stats.totalAmount || 1) * 100;
  });

  return statistics;
};

/**
 * Side bets store to manage all side betting activities in the blackjack game
 */
const useSideBetsStore = create<ExtendedSideBetsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Available side bets with their rules and payouts
        availableSideBets: [
          {
            name: 'Perfect Pairs',
            description: 'Bet on getting a pair as your first two cards',
            minBet: 5,
            maxBet: 100,
            payouts: {
              'mixed-pair': 5,
              'colored-pair': 10,
              'perfect-pair': 30
            }
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
              'suited-trips': 100
            }
          },
          {
            name: 'Insurance',
            description: 'Bet against dealer blackjack when an Ace is showing',
            minBet: 1,
            maxBet: 250,
            payouts: {
              'win': 2
            }
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
              '21-777-suited': 100
            }
          },
          {
            name: 'Royal Match',
            description: 'First two cards are same suit with at least one royal card',
            minBet: 5,
            maxBet: 100,
            payouts: {
              'royal-match': 25,
              'suited-blackjack': 50,
              'suited-pair': 10
            }
          },
          {
            name: 'Over/Under 13',
            description: 'Bet on whether your first two cards total over or under 13',
            minBet: 5,
            maxBet: 100,
            payouts: {
              'over-13': 1,
              'under-13': 1,
              'exactly-13': 10
            }
          }
        ],

        // Active side bets in the current game
        activeSideBets: [],

        // Historical record of side bets
        sideBetHistory: [],

        // Statistics tracking
        sideBetStatistics: {
          totalSideBetsPlaced: 0,
          totalSideBetAmount: 0,
          sideBetWins: 0,
          sideBetLosses: 0,
          totalSideBetPayouts: 0,
          netProfit: 0,
          winRate: 0,
          typeStats: {} as Record<string, {
            betsPlaced: number,
            totalAmount: number,
            wins: number,
            losses: number,
            totalPayouts: number,
            roi: number
          }>
        },

        // For compatibility with the page.tsx interface
        // This maps string types to actual bet names
        _betTypeMap: {
          'insurance': 'Insurance',
          'perfectPairs': 'Perfect Pairs',
          '21+3': '21+3',
          'luckyLadies': 'Lucky Lucky',
          'royalMatch': 'Royal Match',
          'overUnder13': 'Over/Under 13'
        },

        // For compatibility with the page.tsx interface
        // Tracks which bets are available
        _availableBetTypes: {
          'insurance': false,
          'perfectPairs': false,
          '21+3': false,
          'luckyLadies': false,
          'royalMatch': false,
          'overUnder13': false
        },

        // Place a side bet
        placeSideBet: (type, handId, playerId, amount) => {
          // Validate if side bet is available
          const availableBet = get().availableSideBets.find(bet => bet.name === type);

          if (!availableBet) {
            console.error(`Side bet type '${type}' is not available`);
            return;
          }

          // Validate bet amount
          if (amount < availableBet.minBet || amount > availableBet.maxBet) {
            console.error(`Bet amount must be between ${availableBet.minBet} and ${availableBet.maxBet}`);
            return;
          }

          const betId = uuidv4();

          // Add side bet
          set(state => {
            // Update statistics
            const newStatistics = { ...state.sideBetStatistics };
            newStatistics.totalSideBetsPlaced += 1;
            newStatistics.totalSideBetAmount += amount;

            // Update type-specific stats
            if (!newStatistics.typeStats[type]) {
              newStatistics.typeStats[type] = {
                betsPlaced: 0,
                totalAmount: 0,
                wins: 0,
                losses: 0,
                totalPayouts: 0,
                roi: 0
              };
            }
            newStatistics.typeStats[type].betsPlaced += 1;
            newStatistics.typeStats[type].totalAmount += amount;

            return {
              activeSideBets: [
                ...state.activeSideBets,
                {
                  id: betId,
                  type,
                  handId,
                  playerId,
                  amount,
                  status: 'pending',
                  payout: 0,
                  payoutMultiplier: 0,
                  timestamp: new Date()
                }
              ],
              sideBetStatistics: newStatistics
            };
          });

          return betId;
        },

        // Evaluate side bets based on player hand and dealer's up card
        evaluateSideBets: (dealerHand: DealerHand, playerHands: Hand[]) => {
          const results: SideBetResult[] = [];
          const activeSideBets = get().activeSideBets;

          // Process each active side bet
          activeSideBets.forEach(bet => {
            const playerHand = playerHands.find(hand => hand.id === bet.handId);

            if (!playerHand || playerHand.cards.length < 2 || !dealerHand.cards.length) {
              return;
            }

            const dealerUpCard = dealerHand.cards[0];
            if (!dealerUpCard) return;

            const result = evaluateSideBetResult(
              bet.type,
              playerHand,
              dealerUpCard,
              bet.amount,
              get().availableSideBets
            );

            results.push(result);
          });

          // Update the active side bets with evaluation results
          set(state => {
            const updatedSideBets = state.activeSideBets.map(bet => {
              const result = results.find(r => r.handId === bet.handId && r.type === bet.type);
              return updateSideBetFromResult(bet, result);
            });

            // Update statistics
            const newStatistics = { ...state.sideBetStatistics };

            // Update statistics for each result
            results.forEach(result => updateStatisticsForResult(newStatistics, result));

            // Calculate final statistics
            calculateUpdatedStatistics(newStatistics);

            return {
              activeSideBets: updatedSideBets,
              sideBetStatistics: newStatistics
            };
          });

          return results;
        },

        // Clear all side bets
        clearSideBets: () => {
          set(state => {
            // Filter out pending bets for history
            const historyBets = state.activeSideBets.filter(bet => bet.status !== 'pending') as {
              id: string;
              type: string;
              handId: string;
              playerId: string;
              amount: number;
              status: 'won' | 'lost';
              payout: number;
              payoutMultiplier: number;
              winningCombination?: string;
              timestamp: Date;
            }[];

            return {
              activeSideBets: [],
              sideBetHistory: [...state.sideBetHistory, ...historyBets]
            };
          });
        },

        // Get recommended side bets based on current hand
        getRecommendedSideBets: (playerHand: Hand, dealerUpCard: Card) => {
          // Only recommend if we have valid inputs
          if (!isValidHandForRecommendation(playerHand, dealerUpCard)) {
            return [];
          }

          const playerCards = playerHand.cards;
          const recommendations: Array<{ type: string, confidence: number }> = [];

          // Process each bet type recommendation
          checkPerfectPairsRecommendation(playerCards, recommendations);
          check21Plus3Recommendation(playerCards, dealerUpCard, recommendations);
          checkInsuranceRecommendation(dealerUpCard, recommendations);
          checkLuckyLuckyRecommendation(playerCards, dealerUpCard, recommendations);

          return recommendations;
        },

        // Reset statistics
        resetStatistics: () => {
          set({
            sideBetStatistics: {
              totalSideBetsPlaced: 0,
              totalSideBetAmount: 0,
              sideBetWins: 0,
              sideBetLosses: 0,
              totalSideBetPayouts: 0,
              netProfit: 0,
              winRate: 0,
              typeStats: {}
            }
          });
        },

        // === Additional convenience methods for the page.tsx interface ===

        // Reset all bets
        resetBets: () => {
          set(state => {
            // Filter out pending bets for history
            const historyBets = state.activeSideBets.filter(bet => bet.status !== 'pending') as {
              id: string;
              type: string;
              handId: string;
              playerId: string;
              amount: number;
              status: 'won' | 'lost';
              payout: number;
              payoutMultiplier: number;
              winningCombination?: string;
              timestamp: Date;
            }[];

            return {
              activeSideBets: [],
              sideBetHistory: [...state.sideBetHistory, ...historyBets]
            };
          });
        },

        // Set whether a specific bet type is available
        setAvailableBet: (type: string, available: boolean) => {
          set(state => ({
            _availableBetTypes: {
              ...state._availableBetTypes,
              [type]: available
            }
          }));
        },

        // Place a bet using the simplified interface required by page.tsx
        placeBet: (type: string, amount: number) => {
          const betMap = get()._betTypeMap;
          const actualBetType = betMap[type] || type;

          // Default to first player and hand if not specified
          // In a real system we would get these from the game state
          const defaultPlayerId = "player-1";
          const defaultHandId = "hand-1";

          // Call the underlying implementation
          get().placeSideBet(actualBetType, defaultHandId, defaultPlayerId, amount);
        },

        // Get the total amount of all active bets
        getTotalBetAmount: () => {
          return get().activeSideBets.reduce((total, bet) => {
            if (bet.status === 'pending') {
              return total + bet.amount;
            }
            return total;
          }, 0);
        },

        // Get all active bets in the format expected by page.tsx
        getBets: () => {
          const betTypeMap = Object.entries(get()._betTypeMap).reduce((map, [key, value]) => {
            map[value] = key;
            return map;
          }, {} as Record<string, string>);

          return get().activeSideBets
            .filter(bet => bet.status === 'pending')
            .map(bet => ({
              type: betTypeMap[bet.type] || bet.type,
              amount: bet.amount
            }));
        },

        // Get all available bet types
        getAvailableBets: () => {
          return get()._availableBetTypes;
        }
      }),
      {
        name: 'side-bets-storage',
      }
    )
  )
);

/**
 * Evaluate the outcome of a side bet
 */
const evaluateSideBetResult = (
  betType: string,
  playerHand: Hand,
  dealerUpCard: Card,
  betAmount: number,
  availableBets: SideBetsStore['availableSideBets']
): SideBetResult => {
  const result: SideBetResult = {
    type: betType,
    handId: playerHand.id,
    playerId: playerHand.id.split('-')[0] || 'player-1', // Extract player ID from hand ID
    outcome: 'lost',
    payoutMultiplier: 0,
    payout: 0,
    originalBet: betAmount
  };

  // Determine the bet configuration
  const betConfig = availableBets.find(bet => bet.name === betType);
  if (!betConfig) return result;

  // Get player cards
  const playerCards = playerHand.cards.map(card => {
    // This converts cards to our internal format for evaluation
    return {
      id: card.id,
      rank: card.rank,
      suit: card.suit,
      value: getCardValue(card)
    } as InternalCard;
  });

  // Create dealer card in internal format
  const dealerCardInternal: InternalCard = {
    id: dealerUpCard.id,
    rank: dealerUpCard.rank,
    suit: dealerUpCard.suit,
    value: getCardValue(dealerUpCard)
  };

  // Evaluate based on bet type
  const evaluationResult = evaluateBetByType(
    betType,
    playerCards,
    dealerCardInternal,
    playerHand,
    betConfig
  );

  // Update the result with evaluation outcomes
  if (evaluationResult) {
    result.outcome = 'won';
    result.winningCombination = evaluationResult.combination;
    result.payoutMultiplier = evaluationResult.multiplier;
  }

  // Calculate payout
  if (result.outcome === 'won') {
    result.payout = betAmount * result.payoutMultiplier;
  }

  return result;
};

/**
 * Evaluate bet by type - delegates to specific evaluation functions
 */
const evaluateBetByType = (
  betType: string,
  playerCards: InternalCard[],
  dealerCard: InternalCard,
  playerHand: Hand,
  betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null => {
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
};

/**
 * Evaluate Perfect Pairs side bet
 */
const evaluatePerfectPairs = (
  playerCards: InternalCard[],
  betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null => {
  const card1 = playerCards[0];
  const card2 = playerCards[1];

  if (!card1 || !card2 || card1.rank !== card2.rank) {
    return null;
  }

  // Perfect pair - same rank and same suit
  if (card1.suit === card2.suit) {
    return {
      combination: 'perfect-pair',
      multiplier: betConfig.payouts['perfect-pair'] || 30
    };
  }

  // Colored pair - same rank and same color
  if (isRedCard(card1) === isRedCard(card2)) {
    return {
      combination: 'colored-pair',
      multiplier: betConfig.payouts['colored-pair'] || 10
    };
  }

  // Mixed pair - same rank but different colors
  return {
    combination: 'mixed-pair',
    multiplier: betConfig.payouts['mixed-pair'] || 5
  };
};

/**
 * Evaluate 21+3 side bet
 */
const evaluate21Plus3 = (
  playerCards: InternalCard[],
  dealerCard: InternalCard,
  betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null => {
  const pokerHand = evaluatePokerHand([...playerCards.slice(0, 2), dealerCard]);

  if (!pokerHand) {
    return null;
  }

  return {
    combination: pokerHand,
    multiplier: betConfig.payouts[pokerHand] || 0
  };
};

/**
 * Evaluate Insurance side bet
 */
const evaluateInsurance = (
  dealerCard: InternalCard,
  betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null => {
  // Insurance bet pays if dealer has blackjack
  if (dealerCard.rank !== 'A') {
    return null;
  }

  // Simulate a 30.8% chance of dealer having blackjack
  const dealerHasBlackjack = Math.random() < 0.308;

  if (!dealerHasBlackjack) {
    return null;
  }

  return {
    combination: 'win',
    multiplier: betConfig.payouts['win'] || 2
  };
};

/**
 * Evaluate Lucky Lucky side bet
 */
const evaluateLuckyLucky = (
  playerCards: InternalCard[],
  dealerCard: InternalCard,
  betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null => {
  const allCards = [...playerCards, dealerCard];
  const total = getTotalCardValue(allCards);

  if (total < 19) {
    return null;
  }

  const allSevens = allCards.every(card => card.rank === '7');
  const allSameSuit = allCards.every(card => card.suit === allCards[0]?.suit);

  if (total === 21) {
    if (allSevens && allSameSuit) {
      return {
        combination: '21-777-suited',
        multiplier: betConfig.payouts['21-777-suited'] || 100
      };
    }

    if (allSevens) {
      return {
        combination: '21-777-unsuited',
        multiplier: betConfig.payouts['21-777-unsuited'] || 50
      };
    }

    if (allSameSuit) {
      return {
        combination: '21-suited',
        multiplier: betConfig.payouts['21-suited'] || 25
      };
    }

    return {
      combination: '21-unsuited',
      multiplier: betConfig.payouts['21-unsuited'] || 15
    };
  }

  if (total === 20) {
    return {
      combination: '20',
      multiplier: betConfig.payouts['20'] || 3
    };
  }

  if (total === 19) {
    return {
      combination: '19',
      multiplier: betConfig.payouts['19'] || 2
    };
  }

  return null;
};

/**
 * Evaluate Royal Match side bet
 */
const evaluateRoyalMatch = (
  playerCards: InternalCard[],
  playerHand: Hand,
  betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null => {
  const card1 = playerCards[0];
  const card2 = playerCards[1];

  if (!card1 || !card2 || card1.suit !== card2.suit) {
    return null;
  }

  const isRoyal1 = ['J', 'Q', 'K'].includes(card1.rank);
  const isRoyal2 = ['J', 'Q', 'K'].includes(card2.rank);

  if (isRoyal1 && isRoyal2) {
    return {
      combination: 'royal-match',
      multiplier: betConfig.payouts['royal-match'] || 25
    };
  }

  if (isBlackjack(playerHand)) {
    return {
      combination: 'suited-blackjack',
      multiplier: betConfig.payouts['suited-blackjack'] || 50
    };
  }

  if (card1.rank === card2.rank) {
    return {
      combination: 'suited-pair',
      multiplier: betConfig.payouts['suited-pair'] || 10
    };
  }

  return null;
};

/**
 * Evaluate Over/Under 13 side bet
 */
const evaluateOverUnder13 = (
  playerCards: InternalCard[],
  betConfig: SideBetsStore['availableSideBets'][0]
): { combination: string; multiplier: number } | null => {
  const total = getTotalCardValue(playerCards);

  if (total === 13) {
    return {
      combination: 'exactly-13',
      multiplier: betConfig.payouts['exactly-13'] || 10
    };
  }

  if (total > 13) {
    return {
      combination: 'over-13',
      multiplier: betConfig.payouts['over-13'] || 1
    };
  }

  if (total < 13) {
    return {
      combination: 'under-13',
      multiplier: betConfig.payouts['under-13'] || 1
    };
  }

  return null;
};

// Utility function to check if a card is red (hearts or diamonds)
const isRedCard = (card: InternalCard): boolean => {
  return card.suit === 'hearts' || card.suit === 'diamonds';
};

// Utility function to get the value of a card for total calculations
const getCardValue = (card: Card): number => {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank, 10) || 0;
};

// Utility function to get the total value of cards
const getTotalCardValue = (cards: InternalCard[]): number => {
  return cards.reduce((total, card) => total + card.value, 0);
};

// Utility function to check if a hand is a blackjack
const isBlackjack = (hand: Hand): boolean => {
  return hand.bestValue === 21 && hand.cards.length === 2;
};

// Evaluate poker hand for 21+3 side bet
const evaluatePokerHand = (cards: InternalCard[]): string | null => {
  if (cards.length !== 3) return null;

  // Check for three of a kind
  const ranks = cards.map(card => card.rank);
  const uniqueRanks = new Set(ranks);

  // Three of a kind - all three cards have the same rank
  if (uniqueRanks.size === 1) {
    const suits = cards.map(card => card.suit);
    const uniqueSuits = new Set(suits);

    // Suited Trips - three of a kind with the same suit
    if (uniqueSuits.size === 1) {
      return 'suited-trips';
    }

    return 'three-of-a-kind';
  }

  // Helper function to convert card rank to numeric value for straight checking
  const rankToValue = (rank: string): number => {
    if (rank === 'A') return 1; // For A-2-3 straight
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    return parseInt(rank, 10);
  };

  // Convert ranks to values for straight checking
  const values = ranks.map(rankToValue).sort((a, b) => a - b);

  // Check for straight (A-2-3, 2-3-4, ..., Q-K-A)
  const isConsecutive =
    (values[0] !== undefined && values[1] !== undefined && values[2] !== undefined &&
      values[1] === values[0] + 1 && values[2] === values[1] + 1) ||
    (values[0] === 1 && values[1] === 12 && values[2] === 13); // Special case for K-A-2

  // Check for flush (all same suit)
  const suits = cards.map(card => card.suit);
  const isFlush = new Set(suits).size === 1;

  // Straight flush - consecutive cards of the same suit
  if (isConsecutive && isFlush) {
    return 'straight-flush';
  }

  // Straight - consecutive cards of different suits
  if (isConsecutive) {
    return 'straight';
  }

  // Flush - non-consecutive cards of the same suit
  if (isFlush) {
    return 'flush';
  }

  return null;
};

// Calculate poker hand strength for recommendations
const evaluatePokerHandStrength = (cards: Card[]): number => {
  // Convert Card to InternalCard for evaluation
  const internalCards = cards.map(card => ({
    id: card.id,
    rank: card.rank,
    suit: card.suit,
    value: getCardValue(card)
  }));

  const pokerHand = evaluatePokerHand(internalCards);

  switch (pokerHand) {
    case 'suited-trips': return 9;
    case 'straight-flush': return 8;
    case 'three-of-a-kind': return 7;
    case 'straight': return 5;
    case 'flush': return 3;
    default: return 0;
  }
};

// Helper functions for side bet recommendations
const isValidHandForRecommendation = (playerHand: Hand, dealerUpCard: Card): boolean => {
  return !!(playerHand && playerHand.cards && playerHand.cards.length >= 2 && dealerUpCard);
};

const checkPerfectPairsRecommendation = (playerCards: Card[], recommendations: Array<{ type: string, confidence: number }>): void => {
  const card1Rank = playerCards[0]?.rank;
  const card2Rank = playerCards[1]?.rank;

  if (card1Rank && card2Rank && card1Rank === card2Rank) {
    recommendations.push({
      type: 'Perfect Pairs',
      confidence: 95
    });
  }
};

const check21Plus3Recommendation = (playerCards: Card[], dealerUpCard: Card, recommendations: Array<{ type: string, confidence: number }>): void => {
  const threeCards = [...playerCards.slice(0, 2), dealerUpCard];
  const pokerHandStrength = evaluatePokerHandStrength(threeCards);

  if (pokerHandStrength > 0) {
    recommendations.push({
      type: '21+3',
      confidence: Math.min(pokerHandStrength * 10, 90)
    });
  }
};

const checkInsuranceRecommendation = (dealerUpCard: Card, recommendations: Array<{ type: string, confidence: number }>): void => {
  if (dealerUpCard.rank === 'A') {
    recommendations.push({
      type: 'Insurance',
      confidence: 30
    });
  }
};

const checkLuckyLuckyRecommendation = (playerCards: Card[], dealerUpCard: Card, recommendations: Array<{ type: string, confidence: number }>): void => {
  const cardValues = playerCards.map(card => getCardValue(card))
    .concat(getCardValue(dealerUpCard));
  const total = cardValues.reduce((sum, val) => sum + val, 0);

  if (total >= 19 && total <= 21) {
    let confidence = 70;

    if (total === 21) confidence = 90;

    const all7s = cardValues.every(val => val === 7);
    if (all7s) confidence = 95;

    recommendations.push({
      type: 'Lucky Lucky',
      confidence
    });
  }
};

export { useSideBetsStore };