'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, X } from 'lucide-react';
import { CardData } from '@/domains/card/cardTypes';

export type StrategyType = 'basic' | 'advanced' | 'deviation';
export type StrategyView = 'hard' | 'soft' | 'pairs' | 'surrender' | 'insurance';

export interface StrategyCardProps {
  activeType?: StrategyType;
  activeView?: StrategyView;
  playerCards?: CardData[];
  dealerUpcard?: CardData | null;
  highlightActive?: boolean;
  fullScreenEnabled?: boolean;
  downloadEnabled?: boolean;
  legendVisible?: boolean;
  showDeviation?: boolean;
  compact?: boolean;
  animated?: boolean;
  className?: string;
  trueCount?: number;
  onActionSelected?: (action: string) => void;
}

// Strategy action constants
const HIT = 'H';
const STAND = 'S';
const DOUBLE = 'D';
const DOUBLE_OR_HIT = 'Dh';
const DOUBLE_OR_STAND = 'Ds';
const SPLIT = 'P';
const SURRENDER = 'R';
const SURRENDER_OR_HIT = 'Rh';
const INSURANCE = 'I';

// Style classes for actions
const actionClasses: Record<string, string> = {
  [HIT]: 'bg-blue-500/90 hover:bg-blue-600',
  [STAND]: 'bg-green-500/90 hover:bg-green-600',
  [DOUBLE]: 'bg-purple-500/90 hover:bg-purple-600',
  [DOUBLE_OR_HIT]: 'bg-purple-400/90 hover:bg-purple-500',
  [DOUBLE_OR_STAND]: 'bg-emerald-500/90 hover:bg-emerald-600',
  [SPLIT]: 'bg-amber-500/90 hover:bg-amber-600',
  [SURRENDER]: 'bg-red-500/90 hover:bg-red-600',
  [SURRENDER_OR_HIT]: 'bg-red-400/90 hover:bg-red-500',
  [INSURANCE]: 'bg-indigo-500/90 hover:bg-indigo-600',
};

// Full names for actions in the legend
const actionFullNames: Record<string, string> = {
  [HIT]: 'Hit',
  [STAND]: 'Stand',
  [DOUBLE]: 'Double Down',
  [DOUBLE_OR_HIT]: 'Double (or Hit)',
  [DOUBLE_OR_STAND]: 'Double (or Stand)',
  [SPLIT]: 'Split',
  [SURRENDER]: 'Surrender',
  [SURRENDER_OR_HIT]: 'Surrender (or Hit)',
  [INSURANCE]: 'Insurance',
};

// Define strategy charts
const hardTotalStrategy: string[][] = [
  // Dealer upcard →    2    3    4    5    6    7    8    9   10    A
  /* Hard  8 */[HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT],
  /* Hard  9 */[HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT, HIT, HIT, HIT],
  /* Hard 10 */[DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT],
  /* Hard 11 */[DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT],
  /* Hard 12 */[HIT, HIT, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  /* Hard 13 */[STAND, STAND, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  /* Hard 14 */[STAND, STAND, STAND, STAND, STAND, HIT, HIT, HIT, HIT, HIT],
  /* Hard 15 */[STAND, STAND, STAND, STAND, STAND, HIT, HIT, HIT, SURRENDER_OR_HIT, SURRENDER_OR_HIT],
  /* Hard 16 */[STAND, STAND, STAND, STAND, STAND, HIT, HIT, SURRENDER_OR_HIT, SURRENDER_OR_HIT, SURRENDER_OR_HIT],
  /* Hard 17 */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  /* Hard 18 */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  /* Hard 19 */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  /* Hard 20 */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  /* Hard 21 */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
];

const softTotalStrategy: string[][] = [
  // Dealer upcard →    2    3    4    5    6    7    8    9   10    A
  /* Soft 13 (A+2) */[HIT, HIT, HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT, HIT, HIT, HIT],
  /* Soft 14 (A+3) */[HIT, HIT, HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT, HIT, HIT, HIT],
  /* Soft 15 (A+4) */[HIT, HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT, HIT, HIT, HIT],
  /* Soft 16 (A+5) */[HIT, HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT, HIT, HIT, HIT],
  /* Soft 17 (A+6) */[HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT, HIT, HIT, HIT],
  /* Soft 18 (A+7) */[DOUBLE_OR_STAND, DOUBLE_OR_STAND, DOUBLE_OR_STAND, DOUBLE_OR_STAND, DOUBLE_OR_STAND, STAND, STAND, HIT, HIT, HIT],
  /* Soft 19 (A+8) */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  /* Soft 20 (A+9) */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
];

const pairSplittingStrategy: string[][] = [
  // Dealer upcard →    2     3     4     5     6     7     8     9    10     A
  /* Pair of 2s */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT, HIT],
  /* Pair of 3s */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT, HIT],
  /* Pair of 4s */[HIT, HIT, HIT, SPLIT, SPLIT, HIT, HIT, HIT, HIT, HIT],
  /* Pair of 5s */[DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, DOUBLE_OR_HIT, HIT, HIT],
  /* Pair of 6s */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT, HIT, HIT],
  /* Pair of 7s */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, HIT, HIT, HIT, HIT],
  /* Pair of 8s */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT],
  /* Pair of 9s */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, STAND, SPLIT, SPLIT, STAND, STAND],
  /* Pair of 10s */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  /* Pair of As */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT],
];

const surrenderStrategy: string[][] = [
  // Dealer upcard →      2       3       4       5       6       7       8       9       10      A
  /* Hard 14 */[HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT],
  /* Hard 15 */[HIT, HIT, HIT, HIT, HIT, HIT, HIT, HIT, SURRENDER, SURRENDER],
  /* Hard 16 */[HIT, HIT, HIT, HIT, HIT, HIT, HIT, SURRENDER, SURRENDER, SURRENDER],
  /* Hard 17 */[STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND, STAND],
  /* Pair of 8s */[SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SPLIT, SURRENDER, SURRENDER],
];

const insuranceStrategy: string[][] = [
  // True Count →     < -1   -1 to 0    0 to 1    1 to 2    2 to 3   > 3
  /* Insurance */[HIT, HIT, HIT, HIT, HIT, INSURANCE],
];

// Counting deviations for basic strategy (used in deviation view)
const countingDeviations = [
  { playerHand: 'Hard 16', dealerUpcard: '10', trueCountThreshold: 0, action: STAND, baseAction: HIT },
  { playerHand: 'Hard 15', dealerUpcard: '10', trueCountThreshold: 4, action: STAND, baseAction: HIT },
  { playerHand: 'Hard 12', dealerUpcard: '3', trueCountThreshold: 2, action: STAND, baseAction: HIT },
  { playerHand: 'Hard 12', dealerUpcard: '2', trueCountThreshold: 3, action: STAND, baseAction: HIT },
  { playerHand: 'Hard 10', dealerUpcard: 'A', trueCountThreshold: 4, action: DOUBLE, baseAction: HIT },
  { playerHand: 'Hard 9', dealerUpcard: '2', trueCountThreshold: 1, action: DOUBLE, baseAction: HIT },
  { playerHand: 'Hard 9', dealerUpcard: '7', trueCountThreshold: 3, action: DOUBLE, baseAction: HIT },
  { playerHand: 'Hard 11', dealerUpcard: 'A', trueCountThreshold: 1, action: DOUBLE, baseAction: HIT },
  { playerHand: 'Soft 19', dealerUpcard: '6', trueCountThreshold: 2, action: DOUBLE, baseAction: STAND },
  { playerHand: 'Pair of 10s', dealerUpcard: '5', trueCountThreshold: 5, action: SPLIT, baseAction: STAND },
  { playerHand: 'Pair of 10s', dealerUpcard: '6', trueCountThreshold: 4, action: SPLIT, baseAction: STAND },
  { playerHand: 'Insurance', dealerUpcard: 'A', trueCountThreshold: 3, action: INSURANCE, baseAction: HIT },
];

// Helper function to get message based on true count
const getTrueCountMessage = (count: number): string => {
  if (count >= 3) {
    return 'Favorable for counting deviations - many deviations are now in play.';
  }
  if (count >= 1) {
    return 'Slightly favorable - some deviations may be applicable.';
  }
  return 'Unfavorable for most deviations - stay with basic strategy.';
};

const hasMultipleAces = (cards: CardData[]): boolean => {
  return cards.filter(card => card.rank === 'A').length > 1;
};

const getCardValue = (rank: string): number => {
  if (rank === 'A') return 11;
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
  return parseInt(rank);
};

// Get current player status for highlighting
const getPlayerHandType = (cards: CardData[]): { type: string, value: number } => {
  if (!cards || cards.length === 0) return { type: 'none', value: 0 };

  // Check for pairs
  if (cards.length === 2 && cards[0]?.rank === cards[1]?.rank) {
    return { type: 'pair', value: getCardValue(cards[0]?.rank ?? '') };
  }

  // Calculate total and check for soft hands
  let total = 0;
  let hasAce = false;

  for (const card of cards) {
    if (card?.rank === 'A') {
      hasAce = true;
      total += 11;
    } else {
      total += getCardValue(card?.rank ?? '');
    }
  }

  // Adjust for aces
  if (hasAce && total > 21) {
    total -= 10;
    // If we still have a soft total after adjusting one ace
    if (total <= 21 && hasMultipleAces(cards)) {
      return { type: 'soft', value: total };
    }
    return { type: 'hard', value: total };
  }

  if (hasAce) {
    return { type: 'soft', value: total };
  }

  return { type: 'hard', value: total };
};

// Helper function to convert dealerUpcard to column index
const getDealerUpcardIndex = (card: CardData | null): number => {
  if (!card) return -1;

  // Column indices are 0-9, representing dealer cards 2-A
  if (card.rank === 'A') return 9;
  if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J' || card.rank === '10') return 8;
  return parseInt(card.rank) - 2;
};

// Helper function to convert playerHand to row index for highlighting deviations
const getRowIndexFromHandType = (handType: string): number => {
  if (handType.startsWith('Hard')) {
    const value = parseInt(handType.split(' ')[1] ?? '0');
    return value - 8; // Hard rows start at 8
  } else if (handType.startsWith('Soft')) {
    const value = parseInt(handType.split(' ')[1] ?? '0');
    return value - 13; // Soft rows start at A+2 (13)
  } else if (handType.startsWith('Pair')) {
    const value = parseInt(handType.split(' ')[2] ?? '0');
    return isNaN(value) ? 9 : value - 2; // Handle "Pair of As" as special case
  } else if (handType === 'Insurance') {
    return 0; // Insurance has only one row
  }
  return -1;
};

// Helper function to convert dealerUpcard to column index
const getColumnIndexFromDealerCard = (dealerCard: string): number => {
  if (dealerCard === 'A') return 9;
  return parseInt(dealerCard) - 2;
};

// Helper to get view-specific description for deviations
const getDeviationDescription = (view: StrategyView): string => {
  switch (view) {
    case 'hard':
      return 'These deviations from basic strategy should be applied when your card counting technique indicates the true count has reached the threshold shown.';
    case 'soft':
      return 'Deviations for soft hands (hands containing an Ace counted as 11) based on the true count value.';
    case 'pairs':
      return 'Count-dependent strategy adjustments for pair splitting decisions.';
    case 'surrender':
      return 'Late surrender deviations based on the true count. Only surrender when the count reaches or exceeds the threshold.';
    case 'insurance':
      return 'Take insurance only when the true count is +3 or higher. This is one of the most profitable deviations in card counting.';
    default:
      return 'Apply these deviations when the true count reaches or exceeds the threshold shown.';
  }
};

// Helper to get the view type from a hand description
const getViewFromHandType = (handType: string): StrategyView => {
  if (handType.startsWith('Hard')) return 'hard';
  if (handType.startsWith('Soft')) return 'soft';
  if (handType.startsWith('Pair')) return 'pairs';
  if (handType === 'Insurance') return 'insurance';
  if (handType.includes('surrender')) return 'surrender';
  return 'hard';
};

// Extracted component for rendering dealer upcards row
const DealerUpcardsRow = ({ dealerIndex }: { dealerIndex: number }) => {
  const dealerCards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

  return (
    <tr>
      <th className="sticky top-0 z-10 p-1 text-xs font-medium bg-muted/80 backdrop-blur-sm"></th>
      {dealerCards.map((card) => (
        <th
          key={`dealer-card-${card}`}
          className={cn(
            "sticky top-0 bg-muted/80 backdrop-blur-sm z-10 p-1 text-center",
            dealerCards.indexOf(card) === dealerIndex && "bg-primary text-primary-foreground"
          )}
        >
          {card}
        </th>
      ))}
    </tr>
  );
};

// Extracted component for rendering insurance headers
const InsuranceHeadersRow = () => {
  const countRanges = ['< -1', '-1 to 0', '0 to 1', '1 to 2', '2 to 3', '> 3'];

  return (
    <tr>
      <th className="sticky top-0 z-10 p-1 text-xs font-medium bg-muted/80 backdrop-blur-sm">True Count</th>
      {countRanges.map((range) => (
        <th
          key={`count-range-${range}`}
          className="sticky top-0 z-10 p-1 text-center bg-muted/80 backdrop-blur-sm"
        >
          {range}
        </th>
      ))}
    </tr>
  );
};

// Extracted component for rendering strategy legend
const StrategyLegend = ({ strategyType }: { strategyType: StrategyType }) => {
  return (
    <div className="flex flex-wrap justify-center gap-1 pt-2">
      {Object.entries(actionFullNames).map(([key, name]) => (
        <div
          key={key}
          className="flex items-center text-xs"
        >
          <div
            className={cn(
              "w-6 h-6 flex items-center justify-center mr-1 rounded text-white font-medium",
              actionClasses[key]
            )}
          >
            {key}
          </div>
          <span className="mr-2">{name}</span>
        </div>
      ))}
      {strategyType === 'deviation' && (
        <div className="flex items-center pl-2 ml-2 text-xs border-l">
          <div className="relative flex items-center justify-center w-6 h-6 mr-1 font-medium text-black bg-gray-100 border-2 border-yellow-300 rounded dark:bg-gray-800 dark:text-white">
            <span className="absolute top-0 right-0 bg-yellow-300 text-black text-[8px] px-0.5 rounded-bl font-bold">
              3+
            </span>
          </div>
          <span>Count Deviation</span>
        </div>
      )}
    </div>
  );
};

// Extracted component for deviation info banner
const DeviationInfoBanner = ({ strategyType, strategyView }: { strategyType: StrategyType, strategyView: StrategyView }) => {
  if (strategyType !== 'deviation') return null;

  return (
    <div className="p-2 mb-4 text-xs text-yellow-800 bg-yellow-100 rounded-md dark:bg-yellow-950/50 dark:text-yellow-300">
      <div className="font-medium">Count-Dependent Strategy</div>
      <p className="mt-1">{getDeviationDescription(strategyView)}</p>
      <p className="mt-1 text-[10px] opacity-70">
        Note: Yellow borders with numbers indicate the true count threshold required for the deviation.
      </p>
    </div>
  );
};

// Extracted component for strategy cell
const StrategyCell = ({
  action,
  rowIndex,
  colIndex,
  viewType,
  shouldHighlight,
  strategyType,
  trueCount,
  onClick
}: {
  action: string;
  rowIndex: number;
  colIndex: number;
  viewType: string;
  shouldHighlight: boolean;
  strategyType: StrategyType;
  trueCount?: number;
  onClick: (action: string) => void;
}) => {
  // Function to check if a cell shows a counting deviation
  const isCountingDeviation = (): { isDeviation: boolean, threshold: number, isActive: boolean } => {
    if (strategyType !== 'deviation') return { isDeviation: false, threshold: 0, isActive: false };

    // Find matching deviations for the current view
    const matchingDeviations = countingDeviations.filter(deviation => {
      // Convert the string representation to indices
      const deviationRowIndex = getRowIndexFromHandType(deviation.playerHand);
      const deviationColIndex = getColumnIndexFromDealerCard(deviation.dealerUpcard);

      return viewType === getViewFromHandType(deviation.playerHand) &&
        rowIndex === deviationRowIndex &&
        colIndex === deviationColIndex;
    });

    if (matchingDeviations.length > 0) {
      const deviation = matchingDeviations[0];
      const threshold = deviation ? deviation.trueCountThreshold : 0;
      // If trueCount is provided, check if the deviation is currently active
      const isActive = typeof trueCount === 'number' && trueCount >= threshold;

      return {
        isDeviation: true,
        threshold,
        isActive
      };
    }

    return { isDeviation: false, threshold: 0, isActive: false };
  };

  const deviation = isCountingDeviation();

  return (
    <td
      className={cn(
        "text-center p-1 cursor-pointer transition-colors relative",
        actionClasses[action],
        "text-white font-medium",
        shouldHighlight && "ring-2 ring-white ring-offset-2 ring-offset-background scale-110 z-10",
        deviation.isDeviation && "border-2 border-yellow-300",
        deviation.isActive && "shadow-[0_0_8px_2px_rgba(250,204,21,0.7)]"
      )}
      onClick={() => onClick(action)}
    >
      {action}
      {deviation.isDeviation && (
        <div className="absolute top-0 right-0 bg-yellow-300 text-black text-[8px] px-0.5 rounded-bl font-bold">
          {deviation.threshold}+
        </div>
      )}
    </td>
  );
};

// Define cell rendering functions outside the component
type CellConfig = {
  strategyType: StrategyType;
  trueCount?: number;
  shouldHighlight: boolean;
}

const renderHardCell = (
  action: string,
  rowIndex: number,
  colIndex: number,
  hardValue: number,
  config: CellConfig,
  onClick?: (action: string) => void
) => (
  <StrategyCell
    key={`hard-cell-value-${hardValue}-dealer-${colIndex + 2}`}
    action={action}
    rowIndex={rowIndex}
    colIndex={colIndex}
    viewType="hard"
    shouldHighlight={config.shouldHighlight}
    strategyType={config.strategyType}
    trueCount={config.trueCount}
    onClick={onClick || (() => { })}
  />
);

const renderSoftCell = (
  action: string,
  rowIndex: number,
  colIndex: number,
  handValue: number,
  config: CellConfig,
  onClick?: (action: string) => void
) => (
  <StrategyCell
    key={`soft-cell-value-${handValue}-dealer-${colIndex + 2}`}
    action={action}
    rowIndex={rowIndex}
    colIndex={colIndex}
    viewType="soft"
    shouldHighlight={config.shouldHighlight}
    strategyType={config.strategyType}
    trueCount={config.trueCount}
    onClick={onClick || (() => { })}
  />
);

const renderPairCell = (
  action: string,
  rowIndex: number,
  colIndex: number,
  pairValue: string | number,
  config: CellConfig,
  onClick?: (action: string) => void
) => (
  <StrategyCell
    key={`pair-cell-value-${pairValue}-dealer-${colIndex + 2}`}
    action={action}
    rowIndex={rowIndex}
    colIndex={colIndex}
    viewType="pairs"
    shouldHighlight={config.shouldHighlight}
    strategyType={config.strategyType}
    trueCount={config.trueCount}
    onClick={onClick || (() => { })}
  />
);

const renderSurrenderCell = (
  action: string,
  rowIndex: number,
  colIndex: number,
  handValue: string,
  config: CellConfig,
  onClick?: (action: string) => void
) => (
  <StrategyCell
    key={`surrender-cell-${handValue}-dealer-${colIndex + 2}`}
    action={action}
    rowIndex={rowIndex}
    colIndex={colIndex}
    viewType="surrender"
    shouldHighlight={config.shouldHighlight}
    strategyType={config.strategyType}
    trueCount={config.trueCount}
    onClick={onClick || (() => { })}
  />
);

const renderInsuranceCell = (
  action: string,
  colIndex: number,
  thresholdKey: string,
  isHighlighted: boolean,
  onClick?: (action: string) => void
) => (
  <td
    key={`insurance-threshold-${thresholdKey}`}
    className={cn(
      "text-center p-1 cursor-pointer transition-colors relative",
      actionClasses[action],
      "text-white font-medium",
      isHighlighted && "ring-2 ring-white ring-offset-1 ring-offset-background"
    )}
    onClick={() => onClick && onClick(action)}
  >
    {action}
  </td>
);

// Main component
const StrategyCard = ({
  activeType = 'basic',
  activeView = 'hard',
  playerCards = [],
  dealerUpcard = null,
  highlightActive = true,
  fullScreenEnabled = true,
  downloadEnabled = true,
  legendVisible = true,
  showDeviation = false,
  compact = false,
  animated = true,
  className = '',
  trueCount,
  onActionSelected,
}: StrategyCardProps) => {
  // State for active mode, view, and full screen status
  const [strategyType, setStrategyType] = useState<StrategyType>(activeType);
  const [strategyView, setStrategyView] = useState<StrategyView>(activeView);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Get current player hand type and value
  const playerHand = getPlayerHandType(playerCards);
  const dealerIndex = getDealerUpcardIndex(dealerUpcard);

  // Handle strategy cell click
  const handleCellClick = (action: string) => {
    if (onActionSelected) {
      onActionSelected(action);
    }
  };

  // Handle download strategy chart as image
  const handleDownload = () => {
    console.log('Download strategy chart');
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  // Helper to check if a cell should be highlighted
  const shouldHighlightCell = (viewType: string, rowIndex: number, colIndex: number): boolean => {
    if (!highlightActive || !dealerUpcard) return false;
    if (colIndex !== dealerIndex) return false;

    if (viewType === 'hard' && playerHand.type === 'hard') {
      return rowIndex === playerHand.value - 8;
    }
    if (viewType === 'soft' && playerHand.type === 'soft') {
      return rowIndex === playerHand.value - 13;
    }
    if (viewType === 'pairs' && playerHand.type === 'pair') {
      return rowIndex === playerHand.value - 2;
    }
    return false;
  };

  // Helper to determine if current true count matches a column (for insurance)
  const isCurrentTrueCountForColumn = (colIndex: number): boolean => {
    if (typeof trueCount !== 'number') return false;

    if (colIndex === 0) return trueCount < -1;
    if (colIndex === 1) return trueCount >= -1 && trueCount < 0;
    if (colIndex === 2) return trueCount >= 0 && trueCount < 1;
    if (colIndex === 3) return trueCount >= 1 && trueCount < 2;
    if (colIndex === 4) return trueCount >= 2 && trueCount < 3;
    if (colIndex === 5) return trueCount >= 3;
    return false;
  };

  // Render hard totals table
  const renderHardTotalsTable = () => {
    const renderHardRow = (row: string[], rowIndex: number) => {
      const hardValue = rowIndex + 8;
      const cellConfig: CellConfig = {
        strategyType,
        trueCount,
        shouldHighlight: false
      };

      return (
        <tr key={`hard-total-value-${hardValue}`}>
          <th className="p-1 font-medium text-center bg-muted/50">
            {hardValue}
          </th>
          {row.map((action, colIndex) => {
            cellConfig.shouldHighlight = shouldHighlightCell('hard', rowIndex, colIndex);
            return renderHardCell(
              action,
              rowIndex,
              colIndex,
              hardValue,
              cellConfig,
              handleCellClick
            );
          })}
        </tr>
      );
    };

    return (
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <DealerUpcardsRow dealerIndex={dealerIndex} />
        </thead>
        <tbody>
          {hardTotalStrategy.map(renderHardRow)}
        </tbody>
      </table>
    );
  };

  // Render soft totals table
  const renderSoftTotalsTable = () => {
    const renderSoftRow = (row: string[], rowIndex: number) => {
      const handValue = rowIndex + 13; // A+2 is Soft 13
      const cellConfig: CellConfig = {
        strategyType,
        trueCount,
        shouldHighlight: false
      };

      return (
        <tr key={`soft-total-value-${handValue}`}>
          <th className="p-1 font-medium text-center bg-muted/50">
            A,{rowIndex + 2}
          </th>
          {row.map((action, colIndex) => {
            cellConfig.shouldHighlight = shouldHighlightCell('soft', rowIndex, colIndex);
            return renderSoftCell(
              action,
              rowIndex,
              colIndex,
              handValue,
              cellConfig,
              handleCellClick
            );
          })}
        </tr>
      );
    };

    return (
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <DealerUpcardsRow dealerIndex={dealerIndex} />
        </thead>
        <tbody>
          {softTotalStrategy.map(renderSoftRow)}
        </tbody>
      </table>
    );
  };

  // Render pair splitting table
  const renderPairSplittingTable = () => {
    const renderPairRow = (row: string[], rowIndex: number) => {
      const pairValue = rowIndex === 9 ? 'A' : rowIndex + 2;
      const cellConfig: CellConfig = {
        strategyType,
        trueCount,
        shouldHighlight: false
      };

      return (
        <tr key={`pair-value-${pairValue}`}>
          <th className="p-1 font-medium text-center bg-muted/50">
            {rowIndex === 9 ? 'A,A' : `${rowIndex + 2},${rowIndex + 2}`}
          </th>
          {row.map((action, colIndex) => {
            cellConfig.shouldHighlight = shouldHighlightCell('pairs', rowIndex, colIndex);
            return renderPairCell(
              action,
              rowIndex,
              colIndex,
              pairValue,
              cellConfig,
              handleCellClick
            );
          })}
        </tr>
      );
    };

    return (
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <DealerUpcardsRow dealerIndex={dealerIndex} />
        </thead>
        <tbody>
          {pairSplittingStrategy.map(renderPairRow)}
        </tbody>
      </table>
    );
  };

  // Render surrender table
  const renderSurrenderTable = () => {
    const renderSurrenderRow = (row: string[], rowIndex: number) => {
      const handValue = rowIndex === 4 ? 'pair-8-8' : `hard-${rowIndex + 14}`;
      const cellConfig: CellConfig = {
        strategyType,
        trueCount,
        shouldHighlight: false
      };

      return (
        <tr key={`surrender-hand-${handValue}`}>
          <th className="p-1 font-medium text-center bg-muted/50">
            {rowIndex === 4 ? '8,8' : (rowIndex + 14)}
          </th>
          {row.map((action, colIndex) => {
            cellConfig.shouldHighlight = shouldHighlightCell('surrender', rowIndex, colIndex);
            return renderSurrenderCell(
              action,
              rowIndex,
              colIndex,
              handValue,
              cellConfig,
              handleCellClick
            );
          })}
        </tr>
      );
    };

    return (
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <DealerUpcardsRow dealerIndex={dealerIndex} />
        </thead>
        <tbody>
          {surrenderStrategy.map(renderSurrenderRow)}
        </tbody>
      </table>
    );
  };

  // Render insurance table
  const renderInsuranceTable = () => {
    const thresholdKeys = ['lt-neg1', 'neg1-to-0', '0-to-1', '1-to-2', '2-to-3', 'gt-3'];

    const renderInsuranceRow = (row: string[], rowIndex: number) => (
      <tr key={`insurance-option-${rowIndex}-threshold`}>
        <th className="p-1 font-medium text-center bg-muted/50">
          Insurance
        </th>
        {row.map((action, colIndex) =>
          renderInsuranceCell(
            action,
            colIndex,
            thresholdKeys[colIndex] ?? `col-${colIndex}`, // Ensure string is provided
            isCurrentTrueCountForColumn(colIndex),
            handleCellClick
          )
        )}
      </tr>
    );

    return (
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <InsuranceHeadersRow />
        </thead>
        <tbody>
          {insuranceStrategy.map(renderInsuranceRow)}
        </tbody>
      </table>
    );
  };

  // Render the deviation summary view
  const renderDeviationView = () => {
    const renderDeviationRow = (deviation: {
      playerHand: string;
      dealerUpcard: string;
      trueCountThreshold: number;
      action: string;
      baseAction: string;
    }) => {
      const isActive = typeof trueCount === 'number' && trueCount >= deviation.trueCountThreshold;
      return (
        <tr
          key={`deviation-${deviation.playerHand}-${deviation.dealerUpcard}`}
          className={cn("border-b border-muted/20", isActive && "bg-yellow-100/20")}
        >
          <td className="p-1">{deviation.playerHand}</td>
          <td className="p-1 text-center">{deviation.dealerUpcard}</td>
          <td className={cn("p-1 text-center", isActive && "font-medium")}>
            {deviation.trueCountThreshold}
          </td>
          <td className={cn(
            "p-1 text-center font-medium",
            "text-white rounded-sm mx-1",
            actionClasses[deviation.baseAction]
          )}>
            {deviation.baseAction}
          </td>
          <td className={cn(
            "p-1 text-center font-medium",
            "text-white rounded-sm mx-1",
            actionClasses[deviation.action],
            isActive && "ring-2 ring-yellow-300"
          )}>
            {deviation.action}
          </td>
        </tr>
      );
    };

    return (
      <div className="space-y-4">
        <div className="text-sm font-medium">Count-Dependent Strategy Deviations</div>
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-left bg-muted/80">Player Hand</th>
              <th className="p-1 text-center bg-muted/80">Dealer</th>
              <th className="p-1 text-center bg-muted/80">True Count ≥</th>
              <th className="p-1 text-center bg-muted/80">Basic Strategy</th>
              <th className="p-1 text-center bg-muted/80">Deviation</th>
            </tr>
          </thead>
          <tbody>
            {countingDeviations.map(renderDeviationRow)}
          </tbody>
        </table>
        {typeof trueCount === 'number' && (
          <div className="p-2 text-xs border rounded bg-background/80">
            <span className="font-medium">Current True Count: {trueCount}</span>
            <span className="block mt-1 text-muted-foreground">
              {getTrueCountMessage(trueCount)}
            </span>
          </div>
        )}
        <div className="mt-2 text-xs text-muted-foreground">
          Note: Apply these deviations only when the True Count is greater than or equal to the threshold shown.
        </div>
      </div>
    );
  };

  // Prepare card container class based on state
  const cardClass = cn(
    className,
    "transition-all",
    isFullScreen && "fixed inset-2 z-50 m-0 h-[calc(100vh-16px)] w-[calc(100vw-16px)] overflow-auto"
  );

  const renderCardContent = () => {
    // Extract nested ternary into a separate variable
    const contentPadding = compact ? 'px-3 pb-3' : 'px-4 pb-4';
    const cardContentPadding = isFullScreen ? 'p-4' : contentPadding;

    return (
      <>
        <CardHeader className={compact ? 'p-3' : 'p-4'}>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle className={compact ? 'text-base' : 'text-lg'}>Strategy Chart</CardTitle>
              {!compact && <CardDescription>Basic blackjack strategy reference</CardDescription>}
            </div>

            <div className="flex items-center gap-2">
              {!compact && downloadEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 px-2"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Download</span>
                </Button>
              )}

              {fullScreenEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullScreen}
                  className="h-8 px-2"
                >
                  {isFullScreen ? (
                    <>
                      <Minimize2 className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">Exit</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs">Expand</span>
                    </>
                  )}
                </Button>
              )}

              {isFullScreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullScreen}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <Tabs
            value={strategyView}
            onValueChange={(value) => {
              if (value === 'hard' || value === 'soft' || value === 'pairs' ||
                value === 'surrender' || value === 'insurance') {
                setStrategyView(value);
              }
            }}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="hard">Hard</TabsTrigger>
              <TabsTrigger value="soft">Soft</TabsTrigger>
              <TabsTrigger value="pairs">Pairs</TabsTrigger>
              <TabsTrigger value="surrender">Surrender</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
            </TabsList>
          </Tabs>

          {showDeviation && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">Strategy Type:</span>
              <Tabs
                value={strategyType}
                onValueChange={(value) => {
                  if (value === 'basic' || value === 'advanced' || value === 'deviation') {
                    setStrategyType(value);
                  }
                }}
                className="w-auto"
              >
                <TabsList className="h-7">
                  <TabsTrigger value="basic" className="px-2 py-0.5 text-xs">Basic</TabsTrigger>
                  <TabsTrigger value="deviation" className="px-2 py-0.5 text-xs">Count Dependent</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardHeader>

        <CardContent className={cn(
          cardContentPadding,
          "overflow-auto"
        )}>
          {strategyType === 'deviation' && strategyView === 'hard' ? (
            renderDeviationView()
          ) : (
            <>
              <DeviationInfoBanner strategyType={strategyType} strategyView={strategyView} />
              <div className="relative overflow-auto max-h-96">
                <Tabs value={strategyView} onValueChange={(value) => {
                  if (value === 'hard' || value === 'soft' || value === 'pairs' ||
                    value === 'surrender' || value === 'insurance') {
                    setStrategyView(value);
                  }
                }}>
                  <TabsContent value="hard" className="mt-0">
                    {renderHardTotalsTable()}
                  </TabsContent>

                  <TabsContent value="soft" className="mt-0">
                    {renderSoftTotalsTable()}
                  </TabsContent>

                  <TabsContent value="pairs" className="mt-0">
                    {renderPairSplittingTable()}
                  </TabsContent>

                  <TabsContent value="surrender" className="mt-0">
                    {renderSurrenderTable()}
                  </TabsContent>

                  <TabsContent value="insurance" className="mt-0">
                    {renderInsuranceTable()}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {legendVisible && (
            <div className={cn("mt-4", compact && "mt-3")}>
              <StrategyLegend strategyType={strategyType} />
            </div>
          )}
        </CardContent>

        {!compact && (
          <CardFooter className="flex items-center justify-between px-4 py-3 border-t bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Toggle
                variant="outline"
                size="sm"
                pressed={highlightActive}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <span className="text-xs">Highlight Current Hand</span>
              </Toggle>

              {showDeviation && (
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={strategyType === 'deviation'}
                  onPressedChange={(pressed) => setStrategyType(pressed ? 'deviation' : 'basic')}
                  className="data-[state=on]:bg-yellow-500 data-[state=on]:text-white"
                >
                  <span className="text-xs">Show Deviations</span>
                </Toggle>
              )}
            </div>

            <div className="flex items-center text-xs text-muted-foreground">
              <ChevronLeft className="w-3 h-3" />
              <span>Click or tap strategy cells to learn more</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </CardFooter>
        )}
      </>
    );
  };

  return (
    <Card className={cardClass}>
      {animated ? (
        <motion.div
          variants={!isFullScreen ? containerVariants : undefined}
          initial={!isFullScreen ? "hidden" : undefined}
          animate={!isFullScreen ? "visible" : undefined}
        >
          {renderCardContent()}
        </motion.div>
      ) : (
        renderCardContent()
      )}
    </Card>
  );
};

export default StrategyCard;