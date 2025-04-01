'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSideBetsStore } from '@/store/sideBetsStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Award, Zap } from 'lucide-react';

interface SideBetsPanelProps {
  className?: string;
  playerChips: number;
  availableBets: Record<string, boolean>;
  currentBets: Array<{ type: string; amount: number }>;
  onPlaceBet?: (type: string, amount: number) => void;
  onClose?: () => void;
}

// Map for display names of bet types
const BET_TYPE_DISPLAY_NAMES: Record<string, string> = {
  'insurance': 'Insurance',
  'perfectPairs': 'Perfect Pairs',
  '21+3': '21+3',
  'luckyLadies': 'Lucky Lucky',
  'royalMatch': 'Royal Match',
  'overUnder13': 'Over/Under 13'
};

// Map for descriptions of bet types
const BET_TYPE_DESCRIPTIONS: Record<string, string> = {
  'insurance': 'Bet against dealer blackjack when an Ace is showing',
  'perfectPairs': 'Bet on getting a pair as your first two cards',
  '21+3': 'Your first two cards plus dealer up card form a poker hand',
  'luckyLadies': 'Your first two cards plus dealer up card total 19, 20, or 21',
  'royalMatch': 'First two cards are same suit with at least one royal card',
  'overUnder13': 'Bet on whether your first two cards total over or under 13'
};

// Local mapping for bet types
const BET_TYPE_MAP: Record<string, string> = {
  'insurance': 'insurance',
  'perfectPairs': 'perfect-pairs',
  '21+3': 'twenty-one-plus-three',
  'luckyLadies': 'lucky-lucky',
  'royalMatch': 'royal-match',
  'overUnder13': 'over-under-13'
};

export const SideBetsPanel: React.FC<SideBetsPanelProps> = ({
  className = '',
  playerChips,
  availableBets,
  currentBets,
  onPlaceBet,
  onClose
}) => {
  const sideBetsStore = useSideBetsStore();
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(5);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Handle selecting a side bet type
  const handleSelectBet = (betType: string) => {
    setSelectedBet(betType);

    // Set initial bet amount to minimum for this bet type
    const betConfig = sideBetsStore.availableSideBets.find(
      b => b.name === BET_TYPE_MAP[betType] || betType
    );

    if (betConfig) {
      setBetAmount(betConfig.minBet);
    } else {
      setBetAmount(5); // Default minimum bet
    }
  };

  // Handle placing a side bet
  const handlePlaceBet = () => {
    if (!selectedBet || betAmount <= 0 || betAmount > playerChips) return;

    // Call the callback function to place bet
    if (onPlaceBet) {
      onPlaceBet(selectedBet, betAmount);
    }

    // Reset selection
    setSelectedBet(null);
    setBetAmount(5);
  };

  // Toggle the expanded state of a bet's details
  const toggleExpanded = (betType: string) => {
    setExpanded(prev => ({
      ...prev,
      [betType]: !prev[betType]
    }));
  };

  // Get payouts from store for a bet type
  const getPayoutsForBetType = (betType: string) => {
    const actualBetType = BET_TYPE_MAP[betType] || betType;
    const betConfig = sideBetsStore.availableSideBets.find(b => b.name === actualBetType);
    return betConfig?.payouts || {};
  };

  // Get min/max bet limits for a bet type
  const getBetLimitsForType = (betType: string) => {
    const actualBetType = BET_TYPE_MAP[betType] || betType;
    const betConfig = sideBetsStore.availableSideBets.find(b => b.name === actualBetType);
    return {
      min: betConfig?.minBet ?? 5,
      max: betConfig?.maxBet ?? 100
    };
  };

  return (
    <Card className={`border bg-black/30 backdrop-blur-sm border-slate-700 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-amber-400" />
            Side Bets
          </span>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-1">
              <ChevronDown className="w-5 h-5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="available">
          <TabsList className="w-full mb-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="available" className="flex-1">Available Bets</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Active Bets</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-3">
            {Object.entries(availableBets)
              .filter(([_, isAvailable]) => isAvailable)
              .map(([betType]) => {
                const { min, max } = getBetLimitsForType(betType);
                const displayName = BET_TYPE_DISPLAY_NAMES[betType] ?? betType;
                const description = BET_TYPE_DESCRIPTIONS[betType] ?? 'Place a side bet';

                return (
                  <div key={betType} className="p-3 border rounded-md bg-black/20 border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox
                          id={`bet-${betType}`}
                          checked={selectedBet === betType}
                          onCheckedChange={() => handleSelectBet(betType)}
                          className="mr-2"
                        />
                        <Label
                          htmlFor={`bet-${betType}`}
                          className="font-medium cursor-pointer"
                        >
                          {displayName}
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-black/30 text-amber-300 border-amber-500/50">
                          ${min}-${max}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(betType)}
                          className="p-1 h-7 w-7"
                        >
                          {expanded[betType] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {expanded[betType] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 text-sm text-gray-300"
                      >
                        <p className="mb-2">{description}</p>
                        <div className="mt-3">
                          <h4 className="mb-1 text-xs font-semibold text-gray-400">Payouts:</h4>
                          <div className="grid grid-cols-2 gap-1">
                            {Object.entries(getPayoutsForBetType(betType)).map(([outcome, payout]) => (
                              <div key={outcome} className="flex justify-between text-xs">
                                <span className="capitalize">{outcome.replace(/-/g, ' ')}:</span>
                                <span className="font-semibold text-amber-400">{payout}:1</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
          </TabsContent>

          <TabsContent value="active" className="min-h-[200px]">
            {currentBets.length > 0 ? (
              <div className="space-y-3">
                {currentBets.map((bet) => {
                  const displayName = BET_TYPE_DISPLAY_NAMES[bet.type] ?? bet.type;
                  const betKey = `${bet.type}-${bet.amount}-${Math.random().toString(36).substring(2, 11)}`;

                  return (
                    <div key={betKey} className="p-3 border rounded-md bg-black/20 border-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{displayName}</span>
                        <Badge
                          variant="outline"
                          className="bg-black/30"
                        >
                          Pending
                        </Badge>
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                        <span>Amount:</span>
                        <span className="font-semibold text-amber-300">${bet.amount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                <Award className="w-10 h-10 mb-2 opacity-40" />
                <p>No active side bets</p>
                <p className="text-sm">Place a side bet to see it here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {selectedBet && (
        <CardFooter className="flex-col space-y-3 border-t border-slate-700 bg-black/20">
          <div className="w-full">
            <Label htmlFor="betAmount" className="mb-1 text-sm">
              Bet Amount for {BET_TYPE_DISPLAY_NAMES[selectedBet] ?? selectedBet}
            </Label>
            <div className="flex space-x-2">
              <Input
                id="betAmount"
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={getBetLimitsForType(selectedBet).min}
                max={Math.min(
                  getBetLimitsForType(selectedBet).max,
                  playerChips
                )}
                className="bg-black/40 border-slate-600"
                aria-label="Bet amount"
              />
              <Button onClick={handlePlaceBet} disabled={betAmount <= 0 || betAmount > playerChips}>
                Place Bet
              </Button>
            </div>
          </div>

          {betAmount > playerChips && (
            <p className="text-xs text-red-400">Insufficient chips</p>
          )}
        </CardFooter>
      )}
    </Card>
  );
};