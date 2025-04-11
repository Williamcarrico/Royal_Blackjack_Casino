'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Settings,
    ChartBar,
    HelpCircle,
    Volume2,
    VolumeX,
    Menu
} from 'lucide-react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    SafeDropdownMenu,
    SafeDropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';

interface GameHeaderProps {
    onLeaveGame?: () => void;
    onSettingsOpen?: () => void;
    onStatisticsOpen?: () => void;
    onTutorialOpen?: () => void;
    onToggleSound?: () => void;
    isSoundEnabled?: boolean;
    playerBalance?: number;
    className?: string;
}

/**
 * GameHeader component provides navigation and controls for the blackjack game
 */
const GameHeader: React.FC<GameHeaderProps> = ({
    onLeaveGame,
    onSettingsOpen,
    onStatisticsOpen,
    onTutorialOpen,
    onToggleSound,
    isSoundEnabled = true,
    playerBalance = 0,
    className,
}) => {
    return (
        <header className={cn(
            'w-full bg-black/40 backdrop-blur-md border-b border-amber-900/30',
            'py-3 px-4 md:px-6 flex items-center justify-between',
            'sticky top-0 z-50 shadow-lg',
            className
        )}>
            {/* Left side - Logo and back button */}
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onLeaveGame}
                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                    aria-label="Leave game"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="hidden md:flex items-center space-x-2">
                    <div className="relative h-8 w-8">
                        <Image
                            src="/logos/royal-logo.png"
                            alt="Royal Casino"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-xl font-bold text-amber-100">Royal Blackjack</h1>
                </div>
            </div>

            {/* Center - Player balance */}
            <motion.div
                className="flex items-center bg-amber-950/40 rounded-full px-4 py-1.5 border border-amber-700/30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex flex-col items-center">
                    <span className="text-xs text-amber-400/80">BALANCE</span>
                    <span className="text-lg font-bold text-amber-100">${playerBalance.toLocaleString()}</span>
                </div>
            </motion.div>

            {/* Right side - Controls */}
            <div className="flex items-center space-x-2">
                <div className="hidden md:flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleSound}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                        aria-label={isSoundEnabled ? "Mute sound" : "Enable sound"}
                    >
                        {isSoundEnabled ? (
                            <Volume2 className="h-5 w-5" />
                        ) : (
                            <VolumeX className="h-5 w-5" />
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onTutorialOpen}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                        aria-label="How to play"
                    >
                        <HelpCircle className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onStatisticsOpen}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                        aria-label="Statistics"
                    >
                        <ChartBar className="h-5 w-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSettingsOpen}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                        aria-label="Settings"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </div>

                {/* Mobile menu */}
                <div className="md:hidden">
                    <SafeDropdownMenu>
                        <SafeDropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SafeDropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-amber-800/50">
                            <DropdownMenuLabel className="text-amber-300">Game Menu</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-amber-800/30" />
                            <DropdownMenuItem onClick={onToggleSound} className="text-amber-100 focus:bg-amber-950 focus:text-amber-300">
                                {isSoundEnabled ? (
                                    <Volume2 className="h-4 w-4 mr-2" />
                                ) : (
                                    <VolumeX className="h-4 w-4 mr-2" />
                                )}
                                {isSoundEnabled ? "Mute Sound" : "Enable Sound"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onTutorialOpen} className="text-amber-100 focus:bg-amber-950 focus:text-amber-300">
                                <HelpCircle className="h-4 w-4 mr-2" />
                                How to Play
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onStatisticsOpen} className="text-amber-100 focus:bg-amber-950 focus:text-amber-300">
                                <ChartBar className="h-4 w-4 mr-2" />
                                Statistics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onSettingsOpen} className="text-amber-100 focus:bg-amber-950 focus:text-amber-300">
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-amber-800/30" />
                            <DropdownMenuItem onClick={onLeaveGame} className="text-amber-100 focus:bg-amber-950 focus:text-amber-300">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Leave Game
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </SafeDropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default GameHeader;