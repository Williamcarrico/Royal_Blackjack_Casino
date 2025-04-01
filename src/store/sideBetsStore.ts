import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { SideBetsStore } from '@/types/storeTypes';
import type { DealerHand, Hand } from '@/types/handTypes';
import type { Card } from '@/types/cardTypes';
import { v4 as uuidv4 } from 'uuid';

// Side bet outcome types
type SideBetOutcome = 'pending' | 'won' | 'lost';

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

/**
 * Side bets store to manage all side betting activities in the blackjack game
 */
const useSideBetsStore = create<SideBetsStore>()(
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
        } as Record<string, string>,

        // For compatibility with the page.tsx interface
        // Tracks which bets are available
        _availableBetTypes: {
          'insurance': false,
          'perfectPairs': false,
          '21+3': false,
          'luckyLadies': false,
          'royalMatch': false,
          'overUnder13': false
        } as Record<string, boolean>,

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
              if (!result) return bet;

              return {
                ...bet,
                status: result.outcome,
                payout: result.payout,
                payoutMultiplier: result.payoutMultiplier,
                winningCombination: result.winningCombination
              };
            });

            // Update statistics
            const newStatistics = { ...state.sideBetStatistics };
            results.forEach(result => {
              // Ensure type stats exist
              if (!newStatistics.typeStats[result.type]) {
                newStatistics.typeStats[result.type] = {
                  betsPlaced: 0,
                  totalAmount: 0,
                  wins: 0,
                  losses: 0,
                  totalPayouts: 0,
                  roi: 0
                };
              }

              const typeStats = newStatistics.typeStats[result.type];
              if (typeStats) {
                if (result.outcome === 'won') {
                  newStatistics.sideBetWins += 1;
                  newStatistics.totalSideBetPayouts += result.payout;
                  typeStats.wins += 1;
                  typeStats.totalPayouts += result.payout;
                } else if (result.outcome === 'lost') {
                  newStatistics.sideBetLosses += 1;
                  typeStats.losses += 1;
                }
              }
            });

            // Calculate updated win rate
            newStatistics.winRate = newStatistics.sideBetWins /
              (newStatistics.sideBetWins + newStatistics.sideBetLosses || 1) * 100;

            // Calculate net profit
            newStatistics.netProfit = newStatistics.totalSideBetPayouts - newStatistics.totalSideBetAmount;

            // Calculate ROI for each bet type
            Object.keys(newStatistics.typeStats).forEach(type => {
              const stats = newStatistics.typeStats[type];
              stats.roi = (stats.totalPayouts - stats.totalAmount) / (stats.totalAmount || 1) * 100;
            });

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
            // Move active bets to history before clearing
            const updatedHistory = [
              ...state.sideBetHistory,
              ...state.activeSideBets.filter(bet => bet.status !== 'pending')
            ];

            return {
              activeSideBets: [],
              sideBetHistory: updatedHistory
            };
          });
        },

        // Get recommended side bets based on current hand
        getRecommendedSideBets: (playerHand: Hand, dealerUpCard: Card) => {
          const recommendations: Array<{ type: string, confidence: number }> = [];

          // Only recommend if we have valid inputs
          if (!playerHand || !playerHand.cards || playerHand.cards.length < 2 || !dealerUpCard) {
            return recommendations;
          }

          // Get the entire card objects
          const playerCards = playerHand.cards;

          // For Perfect Pairs - recommend if player already has a pair
          if (playerCards.length >= 2) {
            const card1Rank = playerCards[0]?.rank;
            const card2Rank = playerCards[1]?.rank;

            if (card1Rank && card2Rank && card1Rank === card2Rank) {
              recommendations.push({
                type: 'Perfect Pairs',
                confidence: 95
              });
            }
          }

          // For 21+3 - recommend based on potential for poker hands
          if (playerCards.length >= 2 && dealerUpCard) {
            const threeCards = [...playerCards.slice(0, 2), dealerUpCard];
            const pokerHandStrength = evaluatePokerHandStrength(threeCards as any);

            if (pokerHandStrength > 0) {
              recommendations.push({
                type: '21+3',
                confidence: Math.min(pokerHandStrength * 10, 90)
              });
            }
          }

          // For Insurance - recommend if dealer shows an Ace
          if (dealerUpCard && dealerUpCard.rank === 'A') {
            // Insurance is mathematically only profitable with card counting
            // and a very high true count, so confidence is relatively low
            recommendations.push({
              type: 'Insurance',
              confidence: 30
            });
          }

          // For Lucky Lucky - recommend based on potential for totals of 19-21
          if (playerCards.length >= 2 && dealerUpCard) {
            const cardValues = playerCards.map(card => getCardValue(card as any))
              .concat(getCardValue(dealerUpCard as any));
            const total = cardValues.reduce((sum, val) => sum + val, 0);

            if (total >= 19 && total <= 21) {
              let confidence = 70;

              // Higher confidence for 21
              if (total === 21) confidence = 90;

              // Check for 777
              const all7s = cardValues.every(val => val === 7);
              if (all7s) confidence = 95;

              recommendations.push({
                type: 'Lucky Lucky',
                confidence
              });
            }
          }

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
            // Move active bets to history before clearing
            const updatedHistory = [
              ...state.sideBetHistory,
              ...state.activeSideBets.filter(bet => bet.status !== 'pending')
            ];

            return {
              activeSideBets: [],
              sideBetHistory: updatedHistory
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
  const playerCards = playerHand.cards.map(cardId => {
    // In a real implementation, we'd get the card objects from the game state
    // This is a simplification for demonstration
    const [rank, suit] = cardId.split('-');
    return { id: cardId, rank, suit, value: getCardValue({ rank, suit } as Card) };
  });

  // Evaluate the bet outcome based on bet type
  switch (betType) {
    case 'Perfect Pairs': {
      if (playerCards.length < 2) return result;

      const [card1, card2] = playerCards;

      // Check if the cards form a pair (same rank)
      if (card1.rank === card2.rank) {
        // Perfect pair - same rank and same suit
        if (card1.suit === card2.suit) {
          result.outcome = 'won';
          result.winningCombination = 'perfect-pair';
          result.payoutMultiplier = betConfig.payouts['perfect-pair'] || 30;
        }
        // Colored pair - same rank and same color (both red or both black)
        else if (isRedCard(card1 as Card) === isRedCard(card2 as Card)) {
          result.outcome = 'won';
          result.winningCombination = 'colored-pair';
          result.payoutMultiplier = betConfig.payouts['colored-pair'] || 10;
        }
        // Mixed pair - same rank but different colors
        else {
          result.outcome = 'won';
          result.winningCombination = 'mixed-pair';
          result.payoutMultiplier = betConfig.payouts['mixed-pair'] || 5;
        }
      }
      break;
    }

    case '21+3': {
      if (playerCards.length < 2) return result;

      const pokerHand = evaluatePokerHand([...playerCards, dealerUpCard] as Card[]);

      if (pokerHand) {
        result.outcome = 'won';
        result.winningCombination = pokerHand;
        result.payoutMultiplier = betConfig.payouts[pokerHand] || 0;
      }
      break;
    }

    case 'Insurance': {
      // Insurance bet pays if dealer has blackjack
      // In a real implementation, we'd check the dealer's hole card
      // This is a simplification for demonstration
      if (dealerUpCard.rank === 'A') {
        // Simulate a 30.8% chance of dealer having blackjack
        const dealerHasBlackjack = Math.random() < 0.308;

        if (dealerHasBlackjack) {
          result.outcome = 'won';
          result.winningCombination = 'win';
          result.payoutMultiplier = betConfig.payouts['win'] || 2;
        }
      }
      break;
    }

    case 'Lucky Lucky': {
      if (playerCards.length < 2) return result;

      const allCards = [...playerCards, dealerUpCard];
      const total = getTotalCardValue(allCards as Card[]);

      const allSevens = allCards.every(card => card.rank === '7');
      const allSameSuit = allCards.every(card => card.suit === allCards[0].suit);

      if (total === 21 && allSevens && allSameSuit) {
        result.outcome = 'won';
        result.winningCombination = '21-777-suited';
        result.payoutMultiplier = betConfig.payouts['21-777-suited'] || 100;
      } else if (total === 21 && allSevens) {
        result.outcome = 'won';
        result.winningCombination = '21-777-unsuited';
        result.payoutMultiplier = betConfig.payouts['21-777-unsuited'] || 50;
      } else if (total === 21 && allSameSuit) {
        result.outcome = 'won';
        result.winningCombination = '21-suited';
        result.payoutMultiplier = betConfig.payouts['21-suited'] || 25;
      } else if (total === 21) {
        result.outcome = 'won';
        result.winningCombination = '21-unsuited';
        result.payoutMultiplier = betConfig.payouts['21-unsuited'] || 15;
      } else if (total === 20) {
        result.outcome = 'won';
        result.winningCombination = '20';
        result.payoutMultiplier = betConfig.payouts['20'] || 3;
      } else if (total === 19) {
        result.outcome = 'won';
        result.winningCombination = '19';
        result.payoutMultiplier = betConfig.payouts['19'] || 2;
      }
      break;
    }

    case 'Royal Match': {
      if (playerCards.length < 2) return result;

      const [card1, card2] = playerCards;
      const sameSuit = card1.suit === card2.suit;

      if (!sameSuit) break;

      const isRoyal1 = ['J', 'Q', 'K'].includes(card1.rank);
      const isRoyal2 = ['J', 'Q', 'K'].includes(card2.rank);

      if (isRoyal1 && isRoyal2) {
        result.outcome = 'won';
        result.winningCombination = 'royal-match';
        result.payoutMultiplier = betConfig.payouts['royal-match'] || 25;
      } else if (isBlackjack(playerHand)) {
        result.outcome = 'won';
        result.winningCombination = 'suited-blackjack';
        result.payoutMultiplier = betConfig.payouts['suited-blackjack'] || 50;
      } else if (card1.rank === card2.rank) {
        result.outcome = 'won';
        result.winningCombination = 'suited-pair';
        result.payoutMultiplier = betConfig.payouts['suited-pair'] || 10;
      }
      break;
    }

    case 'Over/Under 13': {
      if (playerCards.length < 2) return result;

      const total = getTotalCardValue(playerCards as Card[]);

      if (total === 13) {
        result.outcome = 'won';
        result.winningCombination = 'exactly-13';
        result.payoutMultiplier = betConfig.payouts['exactly-13'] || 10;
      } else if (total > 13) {
        result.outcome = 'won';
        result.winningCombination = 'over-13';
        result.payoutMultiplier = betConfig.payouts['over-13'] || 1;
      } else if (total < 13) {
        result.outcome = 'won';
        result.winningCombination = 'under-13';
        result.payoutMultiplier = betConfig.payouts['under-13'] || 1;
      }
      break;
    }
  }

  // Calculate payout
  if (result.outcome === 'won') {
    result.payout = betAmount * result.payoutMultiplier;
  }

  return result;
};

// Utility function to check if a card is red (hearts or diamonds)
const isRedCard = (card: Card): boolean => {
  return card.suit === 'hearts' || card.suit === 'diamonds';
};

// Utility function to get the value of a card for total calculations
const getCardValue = (card: Card): number => {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank, 10) || 0;
};

// Utility function to get the total value of cards
const getTotalCardValue = (cards: Card[]): number => {
  return cards.reduce((total, card) => total + getCardValue(card), 0);
};

// Utility function to check if a hand is a blackjack
const isBlackjack = (hand: Hand): boolean => {
  return hand.value === 21 && hand.cards.length === 2;
};

// Evaluate poker hand for 21+3 side bet
const evaluatePokerHand = (cards: Card[]): string | null => {
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
    (values[1] === values[0] + 1 && values[2] === values[1] + 1) ||
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
  const pokerHand = evaluatePokerHand(cards);

  switch (pokerHand) {
    case 'suited-trips': return 9;
    case 'straight-flush': return 8;
    case 'three-of-a-kind': return 7;
    case 'straight': return 5;
    case 'flush': return 3;
    default: return 0;
  }
};

export { useSideBetsStore };