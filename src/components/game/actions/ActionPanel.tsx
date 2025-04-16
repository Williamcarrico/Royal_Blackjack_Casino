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
 * Displays hit, stand, double, split, and surrender options with elegant styling
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
    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const buttonVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 15
            }
        },
        hover: (disabled: boolean) => ({
            scale: disabled ? 1 : 1.05,
            y: disabled ? 0 : -2,
            boxShadow: disabled ? "0 0 0 rgba(0,0,0,0)" : "0 8px 20px rgba(0,0,0,0.15)",
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 15
            }
        }),
        tap: (disabled: boolean) => ({
            scale: disabled ? 1 : 0.95,
            y: disabled ? 0 : 2,
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            transition: { duration: 0.1 }
        })
    };

    // Button styles
    const getButtonStyles = (isEnabled: boolean, color: string) => cn(
        'relative overflow-hidden group',
        'px-5 py-3 rounded-xl',
        'text-sm font-bold tracking-wide',
        'shadow-md transition-all duration-300',
        'flex items-center justify-center gap-2',
        'backdrop-blur-sm',
        color,
        isEnabled && !isAnimating
            ? 'cursor-pointer'
            : 'opacity-50 cursor-not-allowed',
        compact ? 'text-xs px-3 py-2 rounded-lg' : ''
    );

    if (!isPlayerTurn) {
        return null;
    }

    return (
        <motion.div
            className={cn(
                'flex items-center gap-3 p-4 rounded-xl',
                compact ? 'flex-col' : 'flex-row flex-wrap justify-center',
                className
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Hit button */}
            <motion.button
                type="button"
                onClick={canHit && !isAnimating ? onHit : undefined}
                className={getButtonStyles(canHit, 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border border-emerald-500/30')}
                disabled={!canHit || isAnimating}
                variants={buttonVariants}
                custom={!canHit || isAnimating}
                whileHover="hover"
                whileTap="tap"
                aria-label="Hit"
            >
                <span className="relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Hit
                </span>
                <span className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
            </motion.button>

            {/* Stand button */}
            <motion.button
                type="button"
                onClick={canStand && !isAnimating ? onStand : undefined}
                className={getButtonStyles(canStand, 'bg-gradient-to-br from-rose-600 to-rose-800 text-white border border-rose-500/30')}
                disabled={!canStand || isAnimating}
                variants={buttonVariants}
                custom={!canStand || isAnimating}
                whileHover="hover"
                whileTap="tap"
                aria-label="Stand"
            >
                <span className="relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Stand
                </span>
                <span className="absolute inset-0 bg-gradient-to-br from-rose-500 to-rose-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
            </motion.button>

            {/* Double button */}
            {canDouble && (
                <motion.button
                    type="button"
                    onClick={!isAnimating ? onDouble : undefined}
                    className={getButtonStyles(true, 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border border-indigo-500/30')}
                    disabled={isAnimating}
                    variants={buttonVariants}
                    custom={isAnimating}
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Double"
                >
                    <span className="relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                        Double
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
                </motion.button>
            )}

            {/* Split button */}
            {canSplit && (
                <motion.button
                    type="button"
                    onClick={!isAnimating ? onSplit : undefined}
                    className={getButtonStyles(true, 'bg-gradient-to-br from-amber-600 to-amber-800 text-white border border-amber-500/30')}
                    disabled={isAnimating}
                    variants={buttonVariants}
                    custom={isAnimating}
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Split"
                >
                    <span className="relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                        </svg>
                        Split
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
                </motion.button>
            )}

            {/* Surrender button */}
            {canSurrender && (
                <motion.button
                    type="button"
                    onClick={!isAnimating ? onSurrender : undefined}
                    className={getButtonStyles(true, 'bg-gradient-to-br from-slate-600 to-slate-800 text-white border border-slate-500/30')}
                    disabled={isAnimating}
                    variants={buttonVariants}
                    custom={isAnimating}
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Surrender"
                >
                    <span className="relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Surrender
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
                </motion.button>
            )}
        </motion.div>
    );
};

export default ActionPanel;