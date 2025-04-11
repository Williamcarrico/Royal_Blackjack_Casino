'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import {
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ChatBubbleLeftRightIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

export interface GameControlsProps {
    className?: string;
    onOpenSettings?: () => void;
    onOpenRules?: () => void;
    onToggleSound?: () => void;
    onOpenChat?: () => void;
    onOpenHistory?: () => void;
    onOpenBankroll?: () => void;
    isSoundEnabled?: boolean;
    vertical?: boolean;
    showLabels?: boolean;
}

/**
 * GameControls component provides buttons for controlling the game environment
 * Includes settings, rules, chat, history, and bankroll management
 */
const GameControls: React.FC<GameControlsProps> = ({
    className,
    onOpenSettings,
    onOpenRules,
    onToggleSound,
    onOpenChat,
    onOpenHistory,
    onOpenBankroll,
    isSoundEnabled = true,
    vertical = false,
    showLabels = false,
}) => {
    // Button variants
    const buttonVariants = {
        initial: { opacity: 0, y: vertical ? 20 : 0, x: vertical ? 0 : 20 },
        animate: (i: number) => ({
            opacity: 1,
            y: 0,
            x: 0,
            transition: { delay: 0.05 * i, duration: 0.3 }
        }),
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
    };

    return (
        <div
            className={cn(
                'flex p-2 bg-black/30 backdrop-blur-sm rounded-lg',
                vertical ? 'flex-col gap-2' : 'flex-row gap-2',
                className
            )}
        >
            {/* Settings button */}
            <motion.button
                type="button"
                onClick={onOpenSettings}
                className={cn(
                    'flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-colors'
                )}
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                whileTap="tap"
                custom={0}
                aria-label="Settings"
            >
                <Cog6ToothIcon className="w-5 h-5" />
                {showLabels && <span className="ml-2">Settings</span>}
            </motion.button>

            {/* Rules button */}
            <motion.button
                type="button"
                onClick={onOpenRules}
                className={cn(
                    'flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-colors'
                )}
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                whileTap="tap"
                custom={1}
                aria-label="Game Rules"
            >
                <QuestionMarkCircleIcon className="w-5 h-5" />
                {showLabels && <span className="ml-2">Rules</span>}
            </motion.button>

            {/* Sound toggle button */}
            <motion.button
                type="button"
                onClick={onToggleSound}
                className={cn(
                    'flex items-center justify-center rounded-md p-2 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-amber-400/50',
                    isSoundEnabled ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-400'
                )}
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                whileTap="tap"
                custom={2}
                aria-label={isSoundEnabled ? "Mute Sound" : "Enable Sound"}
            >
                {isSoundEnabled ? (
                    <SpeakerWaveIcon className="w-5 h-5" />
                ) : (
                    <SpeakerXMarkIcon className="w-5 h-5" />
                )}
                {showLabels && <span className="ml-2">{isSoundEnabled ? 'Sound On' : 'Sound Off'}</span>}
            </motion.button>

            {/* Chat button */}
            {onOpenChat && (
                <motion.button
                    type="button"
                    onClick={onOpenChat}
                    className={cn(
                        'flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-colors'
                    )}
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    custom={3}
                    aria-label="Open Chat"
                >
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    {showLabels && <span className="ml-2">Chat</span>}
                </motion.button>
            )}

            {/* History button */}
            {onOpenHistory && (
                <motion.button
                    type="button"
                    onClick={onOpenHistory}
                    className={cn(
                        'flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-colors'
                    )}
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    custom={4}
                    aria-label="Game History"
                >
                    <ClockIcon className="w-5 h-5" />
                    {showLabels && <span className="ml-2">History</span>}
                </motion.button>
            )}

            {/* Bankroll button */}
            {onOpenBankroll && (
                <motion.button
                    type="button"
                    onClick={onOpenBankroll}
                    className={cn(
                        'flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-colors'
                    )}
                    variants={buttonVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    custom={5}
                    aria-label="Bankroll Management"
                >
                    <CurrencyDollarIcon className="w-5 h-5" />
                    {showLabels && <span className="ml-2">Bankroll</span>}
                </motion.button>
            )}
        </div>
    );
};

export default GameControls;