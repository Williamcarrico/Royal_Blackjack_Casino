'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, Variants } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { InfoIcon, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { CardData } from '../game/hand/Hand';

export type ProbabilityType = 'bust' | 'improve' | 'blackjack' | 'win' | 'lose' | 'push';

export interface ProbabilityData {
  name: string;
  value: number;
  color: string;
  type: ProbabilityType;
  description: string;
}

export interface ProbabilityDisplayProps {
  playerCards?: CardData[];
  dealerUpcard?: CardData | null;
  remainingDeckCards?: CardData[];
  playerScore?: number;
  dealerScore?: number;
  showPieChart?: boolean;
  showProgressBars?: boolean;
  showPercentages?: boolean;
  showDescriptions?: boolean;
  className?: string;
  compact?: boolean;
  animated?: boolean;
  title?: string;
  description?: string;
  showImproveProbability?: boolean;
  highlightBest?: boolean;
}

// Simplified probability calculation
// In a real implementation, these would be much more accurate and based on card counting
const calculateProbabilities = (
  playerCards: CardData[],
  dealerUpcard: CardData | null,
  remainingDeckCards: CardData[],
  playerScore: number,
  dealerScore: number,
  showImproveProbability: boolean
): ProbabilityData[] => {
  // Default probabilities if we don't have enough information
  if (!playerCards.length || !dealerUpcard) {
    return getDefaultProbabilities();
  }

  const bustProbability = calculateBustProbability(playerScore);
  const dealerBustProbability = calculateDealerBustProbability(dealerUpcard);
  const improveProbability = calculateImproveProbability(playerScore, bustProbability);
  const blackjackProbability = calculateBlackjackProbability(playerCards);

  // Calculate win/lose/push probabilities
  const { winProbability, loseProbability, pushProbability } =
    calculateOutcomeProbabilities(playerScore, bustProbability, dealerUpcard, dealerBustProbability);

  // Format data for chart display
  return formatProbabilityData(
    winProbability,
    loseProbability,
    pushProbability,
    bustProbability,
    improveProbability,
    blackjackProbability,
    showImproveProbability
  );
};

// Helper functions to reduce complexity
const getDefaultProbabilities = (): ProbabilityData[] => {
  return [
    { name: 'Win', value: 43, color: '#16a34a', type: 'win', description: 'Probability of winning this hand' },
    { name: 'Lose', value: 47, color: '#dc2626', type: 'lose', description: 'Probability of losing this hand' },
    { name: 'Push', value: 10, color: '#4b5563', type: 'push', description: 'Probability of pushing (tie) this hand' },
  ];
};

const calculateBustProbability = (playerScore: number): number => {
  if (playerScore <= 11) return 0;
  return Math.min(100, Math.max(0, ((playerScore - 11) / 10) * 100));
};

const calculateDealerBustProbability = (dealerUpcard: CardData): number => {
  const dealerBustProbabilities: Record<string, number> = {
    '2': 35.2, '3': 37.2, '4': 40.3, '5': 42.9, '6': 42.1,
    '7': 25.8, '8': 23.9, '9': 23.3, '10': 21.4, 'J': 21.4,
    'Q': 21.4, 'K': 21.4, 'A': 11.7,
  };
  return dealerBustProbabilities[dealerUpcard.rank] ?? 25;
};

const calculateImproveProbability = (playerScore: number, bustProbability: number): number => {
  if (playerScore >= 17) return 0;

  let improveProbability = Math.min(100, Math.max(0, 100 - bustProbability));

  if (playerScore >= 12) {
    improveProbability = improveProbability * (21 - playerScore) / 9;
  }

  return improveProbability;
};

const calculateBlackjackProbability = (playerCards: CardData[]): number => {
  if (!playerCards || playerCards.length === 0) return 4.8; // Starting fresh

  if (playerCards.length === 1) {
    const hasAce = playerCards[0]?.rank === 'A';
    const hasTen = playerCards[0]?.rank && ['10', 'J', 'Q', 'K'].includes(playerCards[0].rank);

    if (hasAce) return 30.8; // Approximate percentage of 10-value cards in deck
    if (hasTen) return 7.7;  // Approximate percentage of Aces in deck
  } else if (playerCards.length === 0) {
    return 4.8; // Starting fresh, probability of blackjack in first two cards
  }

  return 0;
};

const calculateOutcomeProbabilities = (
  playerScore: number,
  bustProbability: number,
  dealerUpcard: CardData | null,
  dealerBustProbability: number
): { winProbability: number, loseProbability: number, pushProbability: number } => {

  let winProbability = 48;
  let loseProbability = 45;
  let pushProbability = 7;

  if (playerScore > 0) {
    // Adjust based on current hand situation
    if (playerScore > 18) {
      winProbability = 65 - (bustProbability / 2);
      loseProbability = 25 + (bustProbability / 2);
    } else if (playerScore >= 17) {
      winProbability = 55 - (bustProbability / 2);
      loseProbability = 35 + (bustProbability / 2);
    } else if (playerScore >= 12) {
      winProbability = 40 - bustProbability;
      loseProbability = 50 + (bustProbability / 2);
      pushProbability = 10 - (bustProbability / 2);
    }

    // Adjust based on dealer's upcard
    if (dealerUpcard) {
      const dealerValue = adjustForDealerUpcard(dealerUpcard);

      if (dealerValue >= 7) {
        winProbability -= 10;
        loseProbability += 10;
      } else if (dealerValue <= 6 && dealerValue >= 4) {
        winProbability += 10;
        loseProbability -= 10;
      }
    }

    // Final adjustments based on dealer bust probability
    winProbability += (dealerBustProbability / 5);
    loseProbability -= (dealerBustProbability / 5);
  }

  // Ensure probabilities are valid and sum to 100%
  return normalizeProbabilities(winProbability, loseProbability, pushProbability);
};

const adjustForDealerUpcard = (dealerUpcard: CardData): number => {
  if (!dealerUpcard?.rank) return 0;

  if (['10', 'J', 'Q', 'K'].includes(dealerUpcard.rank)) {
    return 10;
  }

  if (dealerUpcard.rank === 'A') {
    return 11;
  }

  return parseInt(dealerUpcard.rank);
};

const normalizeProbabilities = (
  winProbability: number,
  loseProbability: number,
  pushProbability: number
): { winProbability: number, loseProbability: number, pushProbability: number } => {

  // Ensure probabilities don't exceed bounds
  winProbability = Math.min(100, Math.max(0, winProbability));
  loseProbability = Math.min(100, Math.max(0, loseProbability));
  pushProbability = Math.min(100, Math.max(0, pushProbability));

  // Ensure probabilities sum to 100%
  const total = winProbability + loseProbability + pushProbability;
  if (total !== 100) {
    const scale = 100 / total;
    winProbability *= scale;
    loseProbability *= scale;
    pushProbability *= scale;
  }

  return {
    winProbability: Math.round(winProbability),
    loseProbability: Math.round(loseProbability),
    pushProbability: Math.round(pushProbability)
  };
};

const formatProbabilityData = (
  winProbability: number,
  loseProbability: number,
  pushProbability: number,
  bustProbability: number,
  improveProbability: number,
  blackjackProbability: number,
  showImproveProbability: boolean
): ProbabilityData[] => {

  const probabilities: ProbabilityData[] = [
    {
      name: 'Win',
      value: winProbability,
      color: '#16a34a',
      type: 'win',
      description: 'Probability of winning this hand'
    },
    {
      name: 'Lose',
      value: loseProbability,
      color: '#dc2626',
      type: 'lose',
      description: 'Probability of losing this hand'
    },
    {
      name: 'Push',
      value: pushProbability,
      color: '#4b5563',
      type: 'push',
      description: 'Probability of pushing (tie) this hand'
    },
  ];

  // Add bust probability if relevant
  if (bustProbability > 0) {
    probabilities.push({
      name: 'Bust',
      value: Math.round(bustProbability),
      color: '#9f1239',
      type: 'bust',
      description: 'Probability of busting if you take another card'
    });
  }

  // Add improve probability if relevant and requested
  if (improveProbability > 0 && showImproveProbability) {
    probabilities.push({
      name: 'Improve',
      value: Math.round(improveProbability),
      color: '#0284c7',
      type: 'improve',
      description: 'Probability of improving your hand with the next card'
    });
  }

  // Add blackjack probability if relevant
  if (blackjackProbability > 0) {
    probabilities.push({
      name: 'Blackjack',
      value: Math.round(blackjackProbability),
      color: '#eab308',
      type: 'blackjack',
      description: 'Probability of getting a blackjack'
    });
  }

  return probabilities;
};

// Custom tooltip for the pie chart
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ProbabilityData;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="p-2 border rounded-md shadow-md bg-background/95 backdrop-blur-sm border-border">
      <p className="font-medium">{data.name}: {data.value}%</p>
      <p className="text-xs text-muted-foreground">{data.description}</p>
    </div>
  );
};

// Extracted sub-components
const SituationalBadge = ({ playerScore, playerCards, dealerUpcard }: {
  playerScore: number;
  playerCards: CardData[];
  dealerUpcard: CardData | null;
}) => {
  if (!playerCards.length || !dealerUpcard) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Badge variant="outline" className="text-xs">
        You: {playerScore}
      </Badge>
      <Badge variant="outline" className="text-xs">
        Dealer: {dealerUpcard.rank}
      </Badge>
    </div>
  );
};

const ProbabilityPieChart = ({
  probabilities,
  compact,
  bestOutcome
}: {
  probabilities: ProbabilityData[];
  compact: boolean;
  bestOutcome: ProbabilityData | null;
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={probabilities}
        cx="50%"
        cy="50%"
        innerRadius={compact ? 30 : 40}
        outerRadius={compact ? 60 : 80}
        paddingAngle={2}
        dataKey="value"
        nameKey="name"
      >
        {probabilities.map((entry) => (
          <Cell
            key={`cell-${entry.type}`}
            fill={entry.color}
            stroke={entry.type === bestOutcome?.type ? '#ffffff' : 'transparent'}
            strokeWidth={entry.type === bestOutcome?.type ? 2 : 0}
          />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend
        iconSize={8}
        layout="horizontal"
        verticalAlign="bottom"
        align="center"
        wrapperStyle={{ fontSize: compact ? 10 : 12 }}
      />
    </PieChart>
  </ResponsiveContainer>
);

const ProbabilityBar = ({
  prob,
  showPercentages,
  showDescriptions,
  bestOutcome,
  getIcon
}: {
  prob: ProbabilityData;
  showPercentages: boolean;
  showDescriptions: boolean;
  bestOutcome: ProbabilityData | null;
  getIcon: (type: ProbabilityType) => React.ReactNode;
}) => (
  <div className="space-y-1">
    <div className={cn(
      "flex items-center justify-between text-xs",
      bestOutcome?.type === prob.type && "font-bold"
    )}>
      <div className="flex items-center">
        {getIcon(prob.type)}
        <span className={cn(
          "ml-1 font-medium",
          bestOutcome?.type === prob.type && "text-primary font-semibold"
        )}>
          {prob.name}
          {bestOutcome?.type === prob.type && " (Best)"}
        </span>
      </div>
      {showPercentages && (
        <span className={cn(
          "text-muted-foreground",
          bestOutcome?.type === prob.type && "text-primary font-semibold"
        )}>
          {prob.value}%
        </span>
      )}
    </div>
    <Progress
      value={prob.value}
      max={100}
      className={cn(
        "h-2",
        {
          'bg-green-500': prob.type === 'win',
          'bg-red-500': prob.type === 'lose',
          'bg-gray-500': prob.type === 'push',
          'bg-red-600': prob.type === 'bust',
          'bg-blue-500': prob.type === 'improve',
          'bg-yellow-500': prob.type === 'blackjack',
        },
        bestOutcome?.type === prob.type && "ring-2 ring-primary/50"
      )}
      style={{
        '--tw-bar-color': prob.color,
      } as React.CSSProperties}
    />
    {showDescriptions && (
      <p className={cn(
        "text-xs text-muted-foreground",
        bestOutcome?.type === prob.type && "text-primary-foreground/80"
      )}>
        {prob.description}
      </p>
    )}
  </div>
);

const ProgressBars = ({
  sortedProbabilities,
  showPercentages,
  showDescriptions,
  bestOutcome,
  getIcon,
  animated,
  itemVariants
}: {
  sortedProbabilities: ProbabilityData[];
  showPercentages: boolean;
  showDescriptions: boolean;
  bestOutcome: ProbabilityData | null;
  getIcon: (type: ProbabilityType) => React.ReactNode;
  animated: boolean;
  itemVariants?: Variants;
}) => (
  <div className="space-y-2">
    {sortedProbabilities.map((prob) => {
      const Bar = (
        <ProbabilityBar
          key={`progress-${prob.type}`}
          prob={prob}
          showPercentages={showPercentages}
          showDescriptions={showDescriptions}
          bestOutcome={bestOutcome}
          getIcon={getIcon}
        />
      );

      if (animated && itemVariants) {
        return (
          <motion.div
            key={`progress-${prob.type}`}
            className="space-y-1"
            variants={itemVariants}
          >
            {Bar}
          </motion.div>
        );
      }

      return (
        <div
          key={`progress-${prob.type}`}
          className="space-y-1"
        >
          {Bar}
        </div>
      );
    })}
  </div>
);

// Main component with reduced complexity
const ProbabilityDisplay = ({
  playerCards = [],
  dealerUpcard = null,
  remainingDeckCards = [],
  playerScore = 0,
  dealerScore = 0,
  showPieChart = true,
  showProgressBars = true,
  showPercentages = true,
  showDescriptions = false,
  className = '',
  compact = false,
  animated = true,
  title = 'Outcome Probabilities',
  description = 'Statistical likelihood of hand outcomes',
  showImproveProbability = true,
  highlightBest = true,
}: ProbabilityDisplayProps) => {
  // Calculate probabilities
  const probabilities = useMemo(() =>
    calculateProbabilities(
      playerCards,
      dealerUpcard,
      remainingDeckCards,
      playerScore,
      dealerScore,
      showImproveProbability
    ),
    [playerCards, dealerUpcard, remainingDeckCards, playerScore, dealerScore, showImproveProbability]
  );

  // Sort probabilities for progress bars (descending)
  const sortedProbabilities = [...probabilities].sort((a, b) => b.value - a.value);

  // Find best outcome for highlighting
  const bestOutcome = highlightBest
    ? probabilities.find(p => p.type === 'win' || p.type === 'blackjack') || null
    : null;

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 15 }
    }
  };

  // Get icon for probability type
  const getIcon = (type: ProbabilityType) => {
    switch (type) {
      case 'win':
        return <TrendingUp className="h-3.5 w-3.5" />;
      case 'lose':
        return <TrendingDown className="h-3.5 w-3.5" />;
      case 'blackjack':
        return <Zap className="h-3.5 w-3.5" />;
      default:
        return <InfoIcon className="h-3.5 w-3.5" />;
    }
  };

  // Render card content
  const renderCardContent = () => (
    <CardContent className={compact ? 'px-3 pb-3 space-y-3' : 'px-4 pb-4 space-y-4'}>
      {/* Situational Badge */}
      <SituationalBadge
        playerScore={playerScore}
        playerCards={playerCards}
        dealerUpcard={dealerUpcard}
      />

      {/* Pie Chart */}
      {showPieChart && (
        <div className={cn("w-full", compact ? 'h-36' : 'h-48')}>
          <ProbabilityPieChart
            probabilities={probabilities}
            compact={compact}
            bestOutcome={bestOutcome}
          />
        </div>
      )}

      {/* Progress Bars */}
      {showProgressBars && (
        <ProgressBars
          sortedProbabilities={sortedProbabilities}
          showPercentages={showPercentages}
          showDescriptions={showDescriptions}
          bestOutcome={bestOutcome}
          getIcon={getIcon}
          animated={false}
        />
      )}
    </CardContent>
  );

  // Render card footer
  const renderCardFooter = () => {
    if (compact) return null;

    return (
      <CardFooter className="px-4 py-3 text-xs border-t text-muted-foreground">
        <InfoIcon className="w-3 h-3 mr-1" />
        <span>Probabilities are estimates based on current game state</span>
      </CardFooter>
    );
  };

  // Render animated version
  if (animated) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className={className}>
          <CardHeader className={compact ? 'p-3' : 'p-4'}>
            <CardTitle className={compact ? 'text-base' : 'text-lg'}>{title}</CardTitle>
            {!compact && <CardDescription>{description}</CardDescription>}
          </CardHeader>

          <CardContent className={compact ? 'px-3 pb-3 space-y-3' : 'px-4 pb-4 space-y-4'}>
            {/* Situational Badge */}
            <SituationalBadge
              playerScore={playerScore}
              playerCards={playerCards}
              dealerUpcard={dealerUpcard}
            />

            {/* Pie Chart */}
            {showPieChart && (
              <motion.div
                className={cn("w-full", compact ? 'h-36' : 'h-48')}
                variants={itemVariants}
              >
                <ProbabilityPieChart
                  probabilities={probabilities}
                  compact={compact}
                  bestOutcome={bestOutcome}
                />
              </motion.div>
            )}

            {/* Progress Bars */}
            {showProgressBars && (
              <ProgressBars
                sortedProbabilities={sortedProbabilities}
                showPercentages={showPercentages}
                showDescriptions={showDescriptions}
                bestOutcome={bestOutcome}
                getIcon={getIcon}
                animated={true}
                itemVariants={itemVariants}
              />
            )}
          </CardContent>

          {renderCardFooter()}
        </Card>
      </motion.div>
    );
  }

  // Non-animated version
  return (
    <Card className={className}>
      <CardHeader className={compact ? 'p-3' : 'p-4'}>
        <CardTitle className={compact ? 'text-base' : 'text-lg'}>{title}</CardTitle>
        {!compact && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      {renderCardContent()}
      {renderCardFooter()}
    </Card>
  );
};

export default ProbabilityDisplay;