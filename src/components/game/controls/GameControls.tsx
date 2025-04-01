'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Play,
    PauseCircle,
    RotateCcw,
    HelpCircle,
    Settings,
    BookOpen,
    X,
    Volume2,
    VolumeX,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

export interface GameControlsProps {
    gamePhase: 'idle' | 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';
    isPlaying: boolean;
    isMuted?: boolean;
    isTutorialMode?: boolean;
    isCollapsed?: boolean;
    showTutorial?: boolean;
    showSettings?: boolean;
    showStatistics?: boolean;
    className?: string;
    onStart?: () => void;
    onStop?: () => void;
    onReset?: () => void;
    onNewGame?: () => void;
    onMuteToggle?: () => void;
    onShowTutorial?: () => void;
    onShowSettings?: () => void;
    onShowStatistics?: () => void;
    onToggleCollapse?: () => void;
}

const GameControls = ({
    gamePhase,
    isPlaying,
    isMuted = false,
    isTutorialMode = false,
    isCollapsed = false,
    showTutorial = true,
    showSettings = true,
    showStatistics = true,
    className = '',
    onStart,
    onStop,
    onReset,
    onNewGame,
    onMuteToggle,
    onShowTutorial,
    onShowSettings,
    onShowStatistics,
    onToggleCollapse,
}: GameControlsProps) => {
    // Determine if the game is in progress
    const isGameInProgress = ['betting', 'dealing', 'player-turn', 'dealer-turn', 'payout'].includes(gamePhase);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                staggerChildren: 0.05
            }
        },
        exit: { opacity: 0, y: 20 }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 15 }
        },
        exit: { opacity: 0, scale: 0.9 }
    };

    const handleStart = () => {
        onStart?.();
    };

    const handleStop = () => {
        onStop?.();
    };

    const handleResetClick = () => {
        onReset?.();
    };

    const handleNewGameClick = () => {
        onNewGame?.();
    };

    const handleMuteToggle = () => {
        onMuteToggle?.();
    };

    const handleShowTutorial = () => {
        onShowTutorial?.();
    };

    const handleShowSettings = () => {
        onShowSettings?.();
    };

    const handleShowStatistics = () => {
        onShowStatistics?.();
    };

    const handleToggleCollapse = () => {
        onToggleCollapse?.();
    };

    // Collapsed view
    if (isCollapsed) {
        return (
            <div className={cn("fixed bottom-4 right-4 z-50", className)}>
                <Button
                    variant="outline"
                    size="icon"
                    className="text-white bg-black/50 backdrop-blur-sm border-white/20 hover:bg-black/70"
                    onClick={handleToggleCollapse}
                    aria-label="Expand game controls"
                >
                    <ChevronUp className="w-5 h-5" />
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            className={cn(
                "p-3 rounded-lg bg-black/70 backdrop-blur-sm text-white border border-white/10 shadow-xl",
                className
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Game Controls</h3>

                {/* Collapse button */}
                {onToggleCollapse && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 text-gray-400 hover:text-white hover:bg-transparent"
                        onClick={handleToggleCollapse}
                        aria-label="Collapse game controls"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {/* Start/Stop button */}
                <motion.div variants={itemVariants}>
                    {isPlaying ? (
                        <Button
                            variant="destructive"
                            className="flex items-center justify-center w-full gap-1"
                            onClick={handleStop}
                            disabled={gamePhase === 'game-over'}
                            aria-label="Pause game"
                        >
                            <PauseCircle className="w-4 h-4 mr-1" /> Pause
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            className="flex items-center justify-center w-full gap-1"
                            onClick={handleStart}
                            disabled={gamePhase === 'game-over'}
                            aria-label="Start game"
                        >
                            <Play className="w-4 h-4 mr-1" /> {isGameInProgress ? 'Resume' : 'Start'}
                        </Button>
                    )}
                </motion.div>

                {/* Reset button */}
                <motion.div variants={itemVariants}>
                    <Button
                        variant="secondary"
                        className="flex items-center justify-center w-full gap-1"
                        onClick={handleResetClick}
                        disabled={gamePhase === 'idle'}
                        aria-label="Reset current game"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                </motion.div>

                {/* New Game button */}
                <motion.div variants={itemVariants} className="col-span-2">
                    <Button
                        variant="outline"
                        className="flex items-center justify-center w-full gap-1 text-green-400 border-green-800 bg-green-600/20 hover:bg-green-600/30"
                        onClick={handleNewGameClick}
                        disabled={gamePhase === 'idle' && !isGameInProgress}
                        aria-label="Start new game"
                    >
                        New Game
                    </Button>
                </motion.div>
            </div>

            {/* Secondary controls */}
            <div className="flex items-center justify-between mt-3">
                {/* Mute toggle */}
                <motion.div variants={itemVariants}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-full",
                            isMuted ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"
                        )}
                        onClick={handleMuteToggle}
                        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
                    >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                </motion.div>

                {/* Tutorial button */}
                {showTutorial && (
                    <motion.div variants={itemVariants}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-blue-400 rounded-full hover:text-blue-300"
                            onClick={handleShowTutorial}
                            aria-label="Show tutorial"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}

                {/* Strategy guide button */}
                {showStatistics && (
                    <motion.div variants={itemVariants}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-purple-400 rounded-full hover:text-purple-300"
                            onClick={handleShowStatistics}
                            aria-label="Show strategy guide"
                        >
                            <BookOpen className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}

                {/* Settings button */}
                {showSettings && (
                    <motion.div variants={itemVariants}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-full text-amber-400 hover:text-amber-300"
                            onClick={handleShowSettings}
                            aria-label="Show settings"
                        >
                            <Settings className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Tutorial mode indicator */}
            <AnimatePresence>
                {isTutorialMode && (
                    <motion.div
                        className="flex items-center justify-between p-1 mt-2 text-xs text-blue-300 border border-blue-700 rounded bg-blue-900/50"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <span>Tutorial Mode Active</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-4 h-4 text-blue-400 hover:text-blue-300"
                            onClick={handleShowTutorial}
                            aria-label="Exit tutorial mode"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default GameControls;