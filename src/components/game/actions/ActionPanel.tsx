'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';

export interface ActionPanelProps {
    className?: string;
    onHit?: () => void;
    onStand?: () => void;
    onDouble?: () => void;
    onSplit?: () => void;
    onSurrender?: () => void;
    canHit?: boolean;
    canStand?: boolean;
    canDouble?: boolean;
    canSplit?: boolean;
    canSurrender?: boolean;
    isPlayerTurn?: boolean;
    isAnimating?: boolean;
    compact?: boolean;
}

/**
 * ActionPanel component provides buttons for blackjack gameplay actions
 * Displays hit, stand, double, split, and surrender options based on game state
 */
const ActionPanel: React.FC<ActionPanelProps> = ({
    className,
    onHit,
    onStand,
    onDouble,
    onSplit,
    onSurrender,
    canHit = true,
    canStand = true,
    canDouble = false,
    canSplit = false,
    canSurrender = false,
    isPlayerTurn = true,
    isAnimating = false,
    compact = false,
}) => {
    // Button variants based on state
    const getButtonStyles = (isEnabled: boolean) => cn(
        'px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide shadow-md transition-all',
        'flex items-center justify-center',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        isEnabled && !isAnimating
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-50',
        compact ? 'text-xs px-3 py-2' : ''
    );

    // Animation variants
    const buttonVariants = {
        initial: { opacity: 0, y: 20 },
        animate: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: { delay: 0.1 * i, duration: 0.3 }
        }),
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
    };

    if (!isPlayerTurn) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex gap-2 p-3 rounded-lg backdrop-blur-md bg-black/40',
                compact ? 'flex-col' : 'flex-row',
                className
            )}
        >
            {/* Hit button */}
            <motion.button
                type="button"
                onClick={canHit && !isAnimating ? onHit : undefined}
                className={cn(
                    getButtonStyles(canHit),
                    'bg-green-600 hover:bg-green-500 focus:ring-green-500',
                )}
                disabled={!canHit || isAnimating}
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover={canHit && !isAnimating ? "hover" : undefined}
                whileTap={canHit && !isAnimating ? "tap" : undefined}
                custom={0}
                aria-label="Hit"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Hit
            </motion.button>

            {/* Stand button */}
            <motion.button
                type="button"
                onClick={canStand && !isAnimating ? onStand : undefined}
                className={cn(
                    getButtonStyles(canStand),
                    'bg-red-600 hover:bg-red-500 focus:ring-red-500',
                )}
                disabled={!canStand || isAnimating}
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover={canStand && !isAnimating ? "hover" : undefined}
                whileTap={canStand && !isAnimating ? "tap" : undefined}
                custom={1}
                aria-label="Stand"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
                Stand
            </motion.button>

            {/* Double button */}
            {canDouble && (
                <motion.button
                    type="button"
                    onClick={!isAnimating ? onDouble : undefined}
                    className={cn(
                        getButtonStyles(true),
                        'bg-yellow-600 hover:bg-yellow-500 focus:ring-yellow-500',
                    )}
                    disabled={isAnimating}
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover={!isAnimating ? "hover" : undefined}
                    whileTap={!isAnimating ? "tap" : undefined}
                    custom={2}
                    aria-label="Double"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                    Double
                </motion.button>
            )}

            {/* Split button */}
            {canSplit && (
                <motion.button
                    type="button"
                    onClick={!isAnimating ? onSplit : undefined}
                    className={cn(
                        getButtonStyles(true),
                        'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500',
                    )}
                    disabled={isAnimating}
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover={!isAnimating ? "hover" : undefined}
                    whileTap={!isAnimating ? "tap" : undefined}
                    custom={3}
                    aria-label="Split"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                    </svg>
                    Split
                </motion.button>
            )}

            {/* Surrender button */}
            {canSurrender && (
                <motion.button
                    type="button"
                    onClick={!isAnimating ? onSurrender : undefined}
                    className={cn(
                        getButtonStyles(true),
                        'bg-gray-600 hover:bg-gray-500 focus:ring-gray-500',
                    )}
                    disabled={isAnimating}
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover={!isAnimating ? "hover" : undefined}
                    whileTap={!isAnimating ? "tap" : undefined}
                    custom={4}
                    aria-label="Surrender"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Surrender
                </motion.button>
            )}
        </div>
    );
};

export default ActionPanel;