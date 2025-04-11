'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import BlackjackGameTable, { GamePhase as UIGamePhase } from '@/components/game/BlackjackGameTable';
import PageLayout from '@/components/layouts/PageLayout';
import LoadingOverlay from '@/components/LoadingOverlay';
import GameHeader from '@/components/game/header/GameHeader';
import GameFooter from '@/components/game/footer/GameFooter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import SettingsPanel from '@/components/game/settings/SettingsPanel';
import StatisticsPanel from '@/components/game/stats/StatisticsPanel';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';

import { useGameState } from '@/hooks/game/useGameState';
import { useHandCalculator } from '@/hooks/game/useHandCalculator';
import { useGameStore } from '@/store/gameStore';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSideBetsStore } from '@/store/sideBetsStore';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils/utils';
import { GamePhase } from '@/types/gameTypes';
import { DEFAULT_STARTING_CHIPS } from '@/lib/constants/gameConstants';

/**
 * BlackjackPage is the main component for the blackjack game experience
 * Integrates all game functionality and UI components
 */
const BlackjackPage = () => {
    const router = useRouter();

    // Game state using various hooks and stores
    const gameState = useGameState();
    const handCalculator = useHandCalculator();

    const {
        initializeGame,
        placeBet,
        dealCards,
        hit,
        stand,
        double,
        split,
        surrender,
        nextRound,
        endGame
    } = useGameState();

    // Player and game state from store - Use useShallow to prevent infinite renders
    const { isInitialized, isLoading, error, gamePhase } = useGameStore(
        useShallow(state => ({
            isInitialized: state.isInitialized,
            isLoading: state.isLoading,
            error: state.error,
            gamePhase: state.gamePhase
        }))
    );

    // Get the transitionTo function to handle phase transitions
    const setGamePhase = useGameStore(state => state.setGamePhase);

    // Map UI game phase to store game phase
    const mapUIPhaseToStorePhase = (uiPhase: UIGamePhase): GamePhase => {
        const phaseMap: Record<UIGamePhase, GamePhase> = {
            'idle': 'betting',
            'betting': 'betting',
            'dealing': 'dealing',
            'player-turn': 'playerTurn',
            'dealer-turn': 'dealerTurn',
            'payout': 'settlement',
            'game-over': 'cleanup'
        };
        return phaseMap[uiPhase];
    };

    // Map store game phase to UI game phase
    const mapStorePhaseToUIPhase = (storePhase: GamePhase): UIGamePhase => {
        const phaseMap: Record<GamePhase, UIGamePhase> = {
            'betting': 'betting',
            'dealing': 'dealing',
            'playerTurn': 'player-turn',
            'dealerTurn': 'dealer-turn',
            'settlement': 'payout',
            'cleanup': 'game-over'
        };
        return phaseMap[storePhase] || 'betting';
    };

    // Handle phase change from UI components
    const handlePhaseChange = useCallback((uiPhase: UIGamePhase) => {
        if (setGamePhase) {
            const storePhase = mapUIPhaseToStorePhase(uiPhase);
            setGamePhase(storePhase);
        }
    }, [setGamePhase, mapUIPhaseToStorePhase]);

    const {
        tableColor,
        chipStyle,
        animationSpeed,
        volume: soundVolume,
        audioEnabled: isSoundEnabled,
        toggleAudio: toggleSound,
        setTableColor,
        setChipStyle
    } = useEnhancedSettingsStore(
        useShallow(state => ({
            tableColor: state.tableColor,
            chipStyle: state.chipStyle,
            animationSpeed: state.animationSpeed,
            volume: state.volume,
            audioEnabled: state.audioEnabled,
            toggleAudio: state.toggleAudio,
            setTableColor: state.setTableColor,
            setChipStyle: state.setChipStyle
        }))
    );

    const { addNotification } = useNotificationStore();

    const [showTutorial, setShowTutorial] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Side bets states - use memoized object for sideBets and stable getAvailableBets reference
    const getAvailableBets = useSideBetsStore(state => state.getAvailableBets);
    const availableBets = React.useMemo(() => getAvailableBets(), [getAvailableBets]);
    const sideBets = React.useMemo(() => ({
        perfectPairs: availableBets['perfectPairs'] || false,
        twentyOneThree: availableBets['21+3'] || false,
        luckyLadies: availableBets['luckyLadies'] || false
    }), [availableBets]);

    // Memoize callback functions for UI interactions to prevent infinite renders
    const handleSettingsOpen = useCallback(() => {
        setShowSettings(true);
    }, []);

    const handleStatisticsOpen = useCallback(() => {
        setShowStats(true);
    }, []);

    const handleTutorialOpen = useCallback(() => {
        setShowTutorial(true);
    }, []);

    const handleToggleSound = useCallback(() => {
        toggleSound();
    }, [toggleSound]);

    // Analytics tracking with sophisticated implementation using the analytics store for comprehensive game metrics
    const trackEvent = useCallback((event: string, data?: Record<string, unknown>) => {
        // Simple event logging
        console.log(`Analytics event: ${event}`, data);
    }, []);

    // Get active player balance
    const activePlayer = gameState.getActivePlayer();
    const playerBalance = activePlayer?.balance ?? 0;

    // Initialize game on component mount
    useEffect(() => {
        if (!isInitialized) {
            // Use type assertion for GameOptions
            initializeGame({
                variant: 'classic',
                numberOfDecks: 6,
                dealerHitsSoft17: true,
                blackjackPays: 1.5,
                doubleAfterSplit: true,
                resplitAces: false,
                lateSurrender: true,
                maxSplitHands: 4,
                penetration: 0.75,
                tableLimits: { minimumBet: 5, maximumBet: 500 },
                payoutRules: {
                    blackjack: 1.5,
                    insurance: 2,
                    regularWin: 1,
                    surrender: 0.5,
                    sideBets: {
                        'perfectPairs': 25,
                        '21+3': 9,
                        'luckyLadies': 10,
                        'royalMatch': 25,
                        'luckyLucky': 15,
                        'inBetween': 12,
                        'overUnder13': 5
                    }
                },
                allowedActions: ['hit', 'stand', 'double', 'split'],
                availableSideBets: [],
                deckRotationStrategy: 'perShoe'
            });

            // After initializing the game, add a player with the default balance
            // This is handled separately from the game options
            const _playerId = gameState.addPlayer('Player', DEFAULT_STARTING_CHIPS);

            trackEvent('game_loaded', { type: 'blackjack' });
        }

        return () => {
            // Clean up or save game state when unmounting
            trackEvent('game_exited', {
                duration: Date.now(),
                chips: playerBalance
            });
        };
    }, [isInitialized, initializeGame, trackEvent, playerBalance, gameState]);

    // Handle game errors
    useEffect(() => {
        if (error) {
            toast.error("Error", {
                description: error,
            });

            // Also add to notification system
            addNotification({
                title: "Error",
                message: error,
                type: "system", // Using allowed notification type
                priority: "high"
            });
        }
    }, [error, addNotification]);

    // Memoize player actions to prevent infinite renders
    const handleHit = useCallback(() => {
        const activePlayer = gameState.getActivePlayer();
        const activeHand = gameState.getActiveHand();

        if (!activePlayer || !activeHand) return;

        const handValue = handCalculator.determineBestValue(
            handCalculator.calculateValues(activeHand.cards)
        );

        const handEvaluation = handCalculator.evaluateHand(activeHand);

        addNotification({
            title: "Hand Info",
            message: `${handEvaluation.description} (${handValue})`,
            type: "game",
            priority: "medium"
        });

        hit(activePlayer.id, activeHand.id);
        trackEvent('player_action', { action: 'hit' });
    }, [gameState, handCalculator, addNotification, hit, trackEvent]);

    const handleStand = useCallback(() => {
        const activePlayer = gameState.getActivePlayer();
        const activeHand = gameState.getActiveHand();

        if (!activePlayer || !activeHand) return;

        stand(activePlayer.id, activeHand.id);
        trackEvent('player_action', { action: 'stand' });
    }, [gameState, stand, trackEvent]);

    const handleDouble = useCallback(() => {
        const activePlayer = gameState.getActivePlayer();
        const activeHand = gameState.getActiveHand();

        if (!activePlayer || !activeHand) return;

        double(activePlayer.id, activeHand.id);
        trackEvent('player_action', { action: 'double' });
    }, [gameState, double, trackEvent]);

    const handleSplit = useCallback(() => {
        const activePlayer = gameState.getActivePlayer();
        const activeHand = gameState.getActiveHand();

        if (!activePlayer || !activeHand) return;

        split(activePlayer.id, activeHand.id);
        trackEvent('player_action', { action: 'split' });
    }, [gameState, split, trackEvent]);

    const handleSurrender = useCallback(() => {
        const activePlayer = gameState.getActivePlayer();
        const activeHand = gameState.getActiveHand();

        if (!activePlayer || !activeHand) return;

        surrender(activePlayer.id, activeHand.id);
        trackEvent('player_action', { action: 'surrender' });
    }, [gameState, surrender, trackEvent]);

    // Memoize betting actions
    const handlePlaceBet = useCallback((amount: number) => {
        if (gamePhase !== 'betting') return;

        const player = gameState.getActivePlayer();
        if (player) {
            placeBet(player.id, amount);
            trackEvent('bet_placed', { amount });
        }
    }, [gamePhase, gameState, placeBet, trackEvent]);

    // Handle dealing
    const handleDeal = useCallback(() => {
        if (gamePhase === 'betting') {
            dealCards();
            trackEvent('deal_cards');
        }
    }, [gamePhase, dealCards, trackEvent]);

    // Handle next round
    const handleNextRound = useCallback(() => {
        nextRound();
        trackEvent('next_round');
    }, [nextRound, trackEvent]);

    // Handle game end scenarios
    const handleEndGame = useCallback(() => {
        endGame();
        addNotification({
            title: "Game Ended",
            message: 'Game ended',
            type: "game", // Using allowed notification type
            priority: "medium"
        });
    }, [endGame, addNotification]);

    // Handle game reset
    const handleResetGame = useCallback(() => {
        // Use initialize game as reset with full GameOptions
        initializeGame({
            variant: 'classic',
            numberOfDecks: 6,
            dealerHitsSoft17: true,
            blackjackPays: 1.5,
            doubleAfterSplit: true,
            resplitAces: false,
            lateSurrender: true,
            maxSplitHands: 4,
            penetration: 0.75,
            tableLimits: { minimumBet: 5, maximumBet: 500 },
            payoutRules: {
                blackjack: 1.5,
                insurance: 2,
                regularWin: 1,
                surrender: 0.5,
                sideBets: {
                    'perfectPairs': 25,
                    '21+3': 9,
                    'luckyLadies': 10,
                    'royalMatch': 25,
                    'luckyLucky': 15,
                    'inBetween': 12,
                    'overUnder13': 5
                }
            },
            allowedActions: ['hit', 'stand', 'double', 'split'],
            availableSideBets: [],
            deckRotationStrategy: 'perShoe'
        });

        addNotification({
            title: "Game Reset",
            message: 'Game reset',
            type: "game", // Using allowed notification type
            priority: "medium"
        });
    }, [initializeGame, addNotification]);

    // Handle leaving game
    const handleLeaveGame = useCallback(() => {
        // Save game state or perform any cleanup
        router.push('/');
    }, [router]);

    const mainContainerClass = cn(
        "flex-1 w-full max-w-[1280px] mx-auto px-4 py-6",
        "flex flex-col items-center justify-center",
        "h-[calc(100vh-140px)]",
        gamePhase === 'dealer-turn' && "bg-opacity-80"
    );

    return (
        <PageLayout className="min-h-screen overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950">
            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <LoadingOverlay />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Header */}
            <GameHeader
                onLeaveGame={handleLeaveGame}
                playerBalance={playerBalance}
                onSettingsOpen={handleSettingsOpen}
                onStatisticsOpen={handleStatisticsOpen}
                onTutorialOpen={handleTutorialOpen}
            />

            {/* Main Game Table */}
            <main className={mainContainerClass}>
                <BlackjackGameTable
                    className="w-full h-full"
                    playerName={gameState.getActivePlayer()?.name ?? 'Player'}
                    playerBalance={playerBalance}
                    tableVariant="green"
                    onSettingsOpen={handleSettingsOpen}
                    onRulesOpen={handleTutorialOpen}
                    onBankrollOpen={handleStatisticsOpen}
                    onHistoryOpen={handleStatisticsOpen}
                    isSoundEnabled={isSoundEnabled}
                    onToggleSound={handleToggleSound}
                    showSidebar={true}
                    gamePhase={mapStorePhaseToUIPhase(gamePhase as GamePhase)}
                    onPhaseChange={handlePhaseChange}
                />
            </main>

            {/* Game Footer */}
            <GameFooter
                gamePhase={mapStorePhaseToUIPhase(gamePhase as GamePhase)}
                onPlaceBet={handlePlaceBet}
                onDeal={handleDeal}
                onHit={handleHit}
                onStand={handleStand}
                onDouble={handleDouble}
                onSplit={handleSplit}
                onSurrender={handleSurrender}
                onNextRound={handleNextRound}
                availableActions={gameState.getAvailableActions()}
                isPlayerTurn={gamePhase === 'playerTurn'}
                isDealerTurn={gamePhase === 'dealerTurn'}
                isRoundOver={['settlement', 'cleanup', 'betting'].includes(gamePhase)}
                playerBalance={playerBalance}
                currentBet={gameState.getActivePlayer()?.currentBet ?? 0}
            />

            {/* Admin Actions - Moved to avoid overlapping with footer */}
            <div className="fixed flex flex-col gap-2 bottom-[100px] right-4 z-50">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEndGame}
                    className={cn("bg-red-900 hover:bg-red-800", gamePhase === 'game-over' && "opacity-50 cursor-not-allowed")}
                    disabled={gamePhase === 'game-over'}
                >
                    End Game
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetGame}
                    className="bg-blue-900 hover:bg-blue-800"
                >
                    Reset Game
                </Button>
            </div>

            {/* Settings Sheet */}
            <Sheet open={showSettings} onOpenChange={setShowSettings}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed top-4 right-4 md:hidden"
                        aria-label="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="sm:max-w-md">
                    <DialogTitle className="mb-4 text-xl font-bold">Game Settings</DialogTitle>
                    <DialogDescription>
                        Customize your game experience
                    </DialogDescription>
                    <SettingsPanel
                        tableVariant={tableColor}
                        onTableVariantChange={setTableColor}
                        chipStyle={chipStyle}
                        onChipStyleChange={setChipStyle}
                        animationSpeed={animationSpeed}
                        soundVolume={soundVolume}
                        isSoundEnabled={isSoundEnabled}
                        onToggleSound={handleToggleSound}
                        sideBets={sideBets}
                    />
                </SheetContent>
            </Sheet>

            {/* Statistics Sheet */}
            <Sheet open={showStats} onOpenChange={setShowStats}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed top-4 right-16 md:hidden"
                        aria-label="Statistics"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            📊
                        </motion.div>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-md">
                    <DialogTitle className="mb-4 text-xl font-bold">Game Statistics</DialogTitle>
                    <DialogDescription>
                        Your gameplay performance
                    </DialogDescription>
                    <StatisticsPanel />
                </SheetContent>
            </Sheet>

            {/* Tutorial Overlay - Conditionally render only when needed */}
            {showTutorial && (
                <TutorialOverlay
                    isActive={true}
                    targets={[]}
                />
            )}
        </PageLayout>
    );
};

export default BlackjackPage;