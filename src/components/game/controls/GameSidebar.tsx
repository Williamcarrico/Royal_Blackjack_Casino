'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/utils';
import GameControls from './GameControls';
import Image from 'next/image';
import ProbabilityDisplay from '@/components/strategy/ProbabilityDisplay';
import AdvicePanel from '@/components/strategy/AdvicePanel';
import { CardData } from '../hand/Hand';

// Update the GameSidebarProps interface
interface GameSidebarProps {
  className?: string;
  playerName?: string;
  playerBalance?: number;
  playerWinStreak?: number;
  currentBet?: number;
  handCount?: number;
  onOpenSettings?: () => void;
  onOpenRules?: () => void;
  onToggleSound?: () => void;
  onOpenChat?: () => void;
  onOpenHistory?: () => void;
  onOpenBankroll?: () => void;
  isSoundEnabled?: boolean;
  showControlLabels?: boolean;
  variant?: 'light' | 'dark';
  // New props for ProbabilityDisplay
  playerCards?: CardData[];
  dealerUpcard?: CardData | null;
  remainingDeckCards?: CardData[];
  playerScore?: number;
  dealerScore?: number;
  // New props for AdvicePanel
  gamePhase?: string;
  canSplit?: boolean;
  canDouble?: boolean;
  canSurrender?: boolean;
  isInsuranceAvailable?: boolean;
  remainingCards?: Record<string, number>;
  trueCount?: number;
  hintMode?: 'basic' | 'advanced' | 'counting' | 'perfect';
  onActionClick?: (action: string) => void;
}

/**
 * GameSidebar component provides game information and additional controls
 * Displays player stats, current hand information, and game control options
 */
const GameSidebar: React.FC<GameSidebarProps> = ({
  className,
  playerName = 'Player',
  playerBalance = 1000,
  playerWinStreak = 0,
  currentBet = 0,
  handCount = 0,
  onOpenSettings,
  onOpenRules,
  onToggleSound,
  onOpenChat,
  onOpenHistory,
  onOpenBankroll,
  isSoundEnabled = true,
  showControlLabels = false,
  variant = 'dark',
  // New props with defaults
  playerCards = [],
  dealerUpcard = null,
  remainingDeckCards = [],
  playerScore = 0,
  dealerScore = 0,
  gamePhase = 'betting',
  canSplit = false,
  canDouble = false,
  canSurrender = false,
  isInsuranceAvailable = false,
  remainingCards = {},
  trueCount = 0,
  hintMode = 'basic',
  onActionClick = () => { },
}) => {
  // Animation variants
  const sidebarVariants = {
    hidden: { opacity: 0, x: 200 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    },
  };

  // Determine if we should show the strategy components
  const showStrategyComponents = playerCards.length > 0 && dealerUpcard !== null;

  return (
    <motion.div
      className={cn(
        'flex flex-col h-full w-[240px] rounded-lg shadow-lg py-4 px-3 mr-2',
        variant === 'dark'
          ? 'bg-black/70 backdrop-blur-md border border-white/10 text-white'
          : 'bg-white/70 backdrop-blur-md border border-black/10 text-black',
        className
      )}
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with logo */}
      <motion.div
        className="flex items-center justify-center flex-shrink-0 mb-4"
        variants={itemVariants}
      >
        <div className="relative w-full h-14">
          <Image
            src="/logos/royal-logo.png"
            alt="Royal Casino"
            fill
            className="object-contain"
          />
        </div>
      </motion.div>

      {/* Scrollable content area */}
      <div className="flex-grow pr-1 overflow-y-auto custom-scrollbar">
        {/* Player info section */}
        <motion.div
          className={cn(
            'mb-4 p-3 rounded-lg',
            variant === 'dark' ? 'bg-gray-900/60' : 'bg-gray-100/60'
          )}
          variants={itemVariants}
        >
          <h3 className={cn(
            'text-lg font-bold mb-2 border-b pb-2',
            variant === 'dark' ? 'border-gray-700' : 'border-gray-300'
          )}>
            Player Info
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Name:</span>
              <span className="font-medium">{playerName}</span>
            </div>

            <div className="flex justify-between">
              <span>Balance:</span>
              <span className={cn(
                'font-medium',
                playerBalance > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                ${playerBalance.toLocaleString()}
              </span>
            </div>

            {playerWinStreak > 0 && (
              <div className="flex justify-between">
                <span>Win Streak:</span>
                <span className="font-medium text-amber-400">{playerWinStreak}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Current hand info */}
        <motion.div
          className={cn(
            'mb-4 p-3 rounded-lg',
            variant === 'dark' ? 'bg-gray-900/60' : 'bg-gray-100/60'
          )}
          variants={itemVariants}
        >
          <h3 className={cn(
            'text-lg font-bold mb-2 border-b pb-2',
            variant === 'dark' ? 'border-gray-700' : 'border-gray-300'
          )}>
            Current Hand
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Hand #:</span>
              <span className="font-medium">{handCount}</span>
            </div>

            <div className="flex justify-between">
              <span>Current Bet:</span>
              <span className={cn(
                'font-medium',
                currentBet > 0 ? 'text-amber-400' : 'text-gray-400'
              )}>
                ${currentBet.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Strategy components - only shown when we have cards */}
        {showStrategyComponents && (
          <>
            {/* Probability Display */}
            <motion.div
              className="mb-4"
              variants={itemVariants}
            >
              <ProbabilityDisplay
                playerCards={playerCards}
                dealerUpcard={dealerUpcard}
                remainingDeckCards={remainingDeckCards}
                playerScore={playerScore}
                dealerScore={dealerScore}
                showPieChart={false}
                showProgressBars={true}
                showPercentages={true}
                showDescriptions={false}
                compact={true}
                className={cn(
                  variant === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-100/60 border-gray-200'
                )}
              />
            </motion.div>

            {/* Advice Panel */}
            <motion.div
              className="mb-4"
              variants={itemVariants}
            >
              <AdvicePanel
                playerCards={playerCards}
                dealerUpcard={dealerUpcard}
                playerScore={playerScore}
                dealerScore={dealerScore}
                canSplit={canSplit}
                canDouble={canDouble}
                canSurrender={canSurrender}
                isInsuranceAvailable={isInsuranceAvailable}
                gamePhase={gamePhase}
                remainingCards={remainingCards}
                trueCount={trueCount}
                hintMode={hintMode}
                useRealTimeAdvice={true}
                showConfidence={true}
                showExplanation={true}
                showMathDetails={false}
                showAlternatives={false}
                compact={true}
                condensed={false}
                showSettings={false}
                onActionClick={onActionClick}
                className={cn(
                  variant === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-100/60 border-gray-200'
                )}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom controls section - fixed at bottom */}
      <div className="flex-shrink-0 pt-2 mt-2 border-t border-gray-800/30">
        {/* Game controls */}
        <motion.div className="mb-2" variants={itemVariants}>
          <h3 className={cn(
            'text-sm font-bold mb-2',
            variant === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}>
            Game Controls
          </h3>

          <GameControls
            onOpenSettings={onOpenSettings}
            onOpenRules={onOpenRules}
            onToggleSound={onToggleSound}
            onOpenChat={onOpenChat}
            onOpenHistory={onOpenHistory}
            onOpenBankroll={onOpenBankroll}
            isSoundEnabled={isSoundEnabled}
            vertical={true}
            showLabels={showControlLabels}
          />
        </motion.div>

        {/* Footer with version */}
        <motion.div
          className={cn(
            'text-center text-xs',
            variant === 'dark' ? 'text-gray-500' : 'text-gray-400'
          )}
          variants={itemVariants}
        >
          Royal Blackjack v1.0
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GameSidebar;