import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Award, HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { GameStore, EnhancedSettingsStore } from '@/types/storeTypes';
import MessageDisplay from '@/components/game/status/MessageDisplay';
import { AutoStrategyPlayer } from '@/components/analytics/AutoStrategyPlayer';
import ProbabilityDisplay from '@/components/strategy/ProbabilityDisplay';
import GameStats from '@/components/analytics/GameStats';
import { SideBet } from '@/types/betTypes';

// Define interfaces for extended GameState properties
interface ExtendedGameState {
  sideBets?: {
    totalAmount: number;
    active?: SideBet[];
  };
  count?: {
    running: number;
    true: number;
  };
  deck?: {
    remainingCards: number;
  };
}

// Type guard to check if gameState has ExtendedGameState properties
function hasExtendedProperties(state: unknown): state is ExtendedGameState {
  return state !== undefined &&
    typeof state === 'object' &&
    state !== null && (
      ('sideBets' in state) ||
      ('count' in state) ||
      ('deck' in state)
    );
}

// Define GameStats interface
interface GameStatsData {
  handsPlayed: number;
  handsWon: number;
  handsLost: number;
  handsPushed: number;
  blackjacks: number;
  netProfit: number;
  winRate?: number;
}

// Add this interface to define the Hand structure
interface Hand {
  cards: string[];
  value?: number;
  isSoft?: boolean;
  status?: string;
}

// Update the ExtendedGameStore interface
interface ExtendedGameStore extends GameStore {
  entities?: {
    hands?: Record<string, Hand>;
  };
  gamePhase?: string;
}

// Update the GameSidebarProps interface
interface GameSidebarProps {
  gameStore: ExtendedGameStore;
  enhancedSettings: EnhancedSettingsStore;
  analytics: {
    gameStats?: GameStatsData;
    [key: string]: unknown;
  };
  setShowRulesDialog: (show: boolean) => void;
  setShowBasicStrategyDialog: (show: boolean) => void;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({
  gameStore,
  enhancedSettings,
  analytics,
  setShowRulesDialog,
  setShowBasicStrategyDialog
}) => {
  const [isTableRotated, setIsTableRotated] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Use the type guard with a fallback for missing gameState
  const gameState = gameStore.gameState || {};
  const extendedGameState = hasExtendedProperties(gameState) ? gameState : undefined;

  // Add console log for debugging
  React.useEffect(() => {
    console.log('GameSidebar mounted with gameStore:', {
      hasGameState: !!gameStore.gameState,
      hasEntities: !!gameStore.entities,
      gamePhase: gameStore.gamePhase
    });
  }, [gameStore]);

  // Helper functions to extract nested ternary operations
  const getCountTextColor = (count: number | undefined): string => {
    const value = count ?? 0;
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-white';
  };

  const getTrueCountTextColor = (count: number | undefined): string => {
    const value = count ?? 0;
    if (value > 1.5) return 'text-green-400';
    if (value < -1.5) return 'text-red-400';
    return 'text-white';
  };

  const formatRunningCount = (count: number | undefined): string => {
    const value = count ?? 0;
    return value > 0 ? `+${value}` : `${value}`;
  };

  // Toggle sidebar collapse state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="space-y-4 z-20 relative"
    >
      {/* Collapse/Expand button for mobile */}
      <div className="md:hidden flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleCollapse}
          className="bg-black/40 backdrop-blur-sm border-slate-700"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          {isCollapsed ? "Show" : "Hide"} Sidebar
        </Button>
      </div>

      {/* Sidebar content - conditionally shown based on collapse state */}
      <div className={`space-y-4 ${isCollapsed ? 'hidden' : 'block'} md:block`}>
        {/* Game message */}
        <div className="overflow-hidden">
          <MessageDisplay message={gameStore.lastAction ?? ''} />
        </div>

        {/* Auto Strategy component - only render when game is fully initialized */}
        {gameStore?.entities?.hands && (
          <AutoStrategyPlayer className="p-4 border rounded-lg bg-black/30 backdrop-blur-sm border-slate-700" />
        )}

        {/* Probability display */}
        {enhancedSettings.showProbabilities && gameStore.gameState?.currentPhase !== 'betting' && (
          <ProbabilityDisplay
            compact
            className="p-4 border rounded-lg bg-black/30 backdrop-blur-sm border-slate-700"
          />
        )}

        {/* Quick buttons for additional features */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="bg-black/30 backdrop-blur-sm border-slate-700 hover:bg-slate-800"
            onClick={() => setShowBasicStrategyDialog(true)}
          >
            <Award className="w-4 h-4 mr-2" /> Strategy
          </Button>

          <Button
            variant="outline"
            className="bg-black/30 backdrop-blur-sm border-slate-700 hover:bg-slate-800"
            onClick={() => setShowRulesDialog(true)}
          >
            <HelpCircle className="w-4 h-4 mr-2" /> Rules
          </Button>

          <Button
            variant="outline"
            className="bg-black/30 backdrop-blur-sm border-slate-700 hover:bg-slate-800"
            onClick={() => setIsTableRotated(!isTableRotated)}
          >
            {isTableRotated ?
              <><ChevronDown className="w-4 h-4 mr-2" /> View</> :
              <><ChevronUp className="w-4 h-4 mr-2" /> View</>
            }
          </Button>
        </div>

        {/* Game stats */}
        <GameStats stats={analytics.gameStats} />

        {/* Display active side bets when they exist */}
        {(extendedGameState?.sideBets?.totalAmount ?? 0) > 0 && (
          <Card className="p-4 border rounded-lg bg-black/30 backdrop-blur-sm border-slate-700">
            <h3 className="mb-3 text-lg font-semibold text-white">Active Side Bets</h3>
            <div className="space-y-2">
              {extendedGameState?.sideBets?.active?.map((bet: SideBet) => (
                bet.amount > 0 && (
                  <div key={bet.id} className="flex justify-between">
                    <span className="text-gray-300">{bet.type}:</span>
                    <span className="font-semibold text-amber-400">${bet.amount}</span>
                  </div>
                )
              ))}
            </div>
          </Card>
        )}

        {/* Card counting information */}
        {enhancedSettings.countingSystem !== 'none' && (
          <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
            <h3 className="mb-2 text-sm font-semibold text-white">Card Counting</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Running Count:</span>
                <span className={`font-semibold ${getCountTextColor(extendedGameState?.count?.running)}`}>
                  {formatRunningCount(extendedGameState?.count?.running)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">True Count:</span>
                <span className={`font-semibold ${getTrueCountTextColor(extendedGameState?.count?.true)}`}>
                  {(extendedGameState?.count?.true ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Cards Remaining:</span>
                <span className="font-semibold text-white">{extendedGameState?.deck?.remainingCards ?? 0}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
};