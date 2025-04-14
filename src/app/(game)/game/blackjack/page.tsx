'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { UIGamePhase } from '@/components/game/BlackjackGameTable';
import BlackjackTable from '@/components/game/table/BlackjackTable';
import PageLayout from '@/components/layouts/PageLayout';
import LoadingOverlay from '@/components/LoadingOverlay';
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
import { CreateNotificationRequest } from '@/types/notifications';
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
    const { isInitialized, isLoading, error, gamePhase, addPlayer } = useGameStore(
        useShallow(state => ({
            isInitialized: state.isInitialized,
            isLoading: state.isLoading,
            error: state.error,
            gamePhase: state.gamePhase,
            addPlayer: state.addPlayer
        }))
    );

    // Get the transitionTo function to handle phase transitions
    const setGamePhase = useGameStore(state => state.setGamePhase);

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
    const _handlePhaseChange = useCallback((uiPhase: UIGamePhase) => {
        if (setGamePhase) {
            // Map UI game phase to store game phase (moved inside useCallback)
            const mapUIPhaseToStorePhase = (uiPhase: UIGamePhase): GamePhase => {
                const phaseMap: Record<UIGamePhase, GamePhase> = {
                    'betting': 'betting',
                    'dealing': 'dealing',
                    'player-turn': 'playerTurn',
                    'dealer-turn': 'dealerTurn',
                    'payout': 'settlement',
                    'game-over': 'cleanup'
                };
                return phaseMap[uiPhase];
            };

            const storePhase = mapUIPhaseToStorePhase(uiPhase);
            setGamePhase(storePhase);
        }
    }, [setGamePhase]);

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

    // Memoized addNotification function to prevent it from causing re-renders
    const safeAddNotification = useCallback(async (notification: CreateNotificationRequest) => {
        try {
            await addNotification(notification);
        } catch (error) {
            console.warn('Error adding notification:', error);
            // Just log the error without triggering another notification
        }
    }, [addNotification]);

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
    // Make sure to provide DEFAULT_STARTING_CHIPS as fallback if balance is 0 or undefined
    const playerBalance = activePlayer?.balance ?? DEFAULT_STARTING_CHIPS;

    // Debug: Track player balance
    useEffect(() => {
        console.log('Active player:', activePlayer);
        console.log('Player balance updated:', playerBalance);

        // Force update if balance is 0
        if (activePlayer && activePlayer.balance === 0) {
            console.log('Force updating player with DEFAULT_STARTING_CHIPS');
            gameState.addPlayer('Player', DEFAULT_STARTING_CHIPS);
        }
    }, [activePlayer, playerBalance, gameState]);

    // Add initialization ref to prevent multiple initializations
    const hasInitialized = useRef(false);

    // Add to BlackjackPage component state
    const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);

    // Modify the initialization effect
    useEffect(() => {
        if (!isInitialized && !hasInitialized.current) {
            hasInitialized.current = true;
            console.log('Initializing game state...');

            // Set loading state
            setIsPlayerInitialized(false);

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

            setTimeout(() => {
                console.log('Adding player to gameState with starting balance...');

                if (addPlayer && !activePlayer) {
                    console.log(`Adding player to gameStore with ${DEFAULT_STARTING_CHIPS} chips`);
                    addPlayer('Player', DEFAULT_STARTING_CHIPS);
                }

                const playerId = gameState.addPlayer('Player', DEFAULT_STARTING_CHIPS);
                console.log(`Player added to gameState with ID: ${playerId}`);

                // Mark player as initialized
                setIsPlayerInitialized(true);

                toast.success("Game initialized", {
                    description: `Starting balance: $${DEFAULT_STARTING_CHIPS}`,
                });

                trackEvent('game_loaded', { type: 'blackjack' });
            }, 500);
        }

        return () => {
            // Clean up or save game state when unmounting
            trackEvent('game_exited', {
                duration: Date.now(),
                chips: playerBalance
            });
        };
    }, [isInitialized, initializeGame, gameState, trackEvent, playerBalance, addPlayer, activePlayer]);

    // Handle game errors
    useEffect(() => {
        if (error) {
            toast.error("Error", {
                description: error,
            });

            // Show error notification only if there isn't already an error in notification system
            if (!error.includes('notification')) {
                safeAddNotification({
                    title: "Error",
                    message: error,
                    type: "system", // Using allowed notification type
                    priority: "high"
                });
            }
        }
    }, [error, safeAddNotification]);

    // Memoize player actions to prevent infinite renders
    const handleHit = useCallback(() => {
        const activePlayer = gameState.getActivePlayer();
        const activeHand = gameState.getActiveHand();

        if (!activePlayer || !activeHand) return;

        const handValue = handCalculator.determineBestValue(
            handCalculator.calculateValues(activeHand.cards)
        );

        const handEvaluation = handCalculator.evaluateHand(activeHand);

        safeAddNotification({
            title: "Hand Info",
            message: `${handEvaluation.description} (${handValue})`,
            type: "game",
            priority: "medium"
        });

        hit(activePlayer.id, activeHand.id);
        trackEvent('player_action', { action: 'hit' });
    }, [gameState, handCalculator, safeAddNotification, hit, trackEvent]);

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
        if (gamePhase !== 'betting') {
            console.log('Cannot place bet outside of betting phase');
            toast.error("Cannot place bet", {
                description: "Bets can only be placed during the betting phase",
            });
            return;
        }

        const player = gameState.getActivePlayer();
        if (!player) {
            console.log('No active player found');
            toast.error("Cannot place bet", {
                description: "No active player found",
            });
            return;
        }

        // Check if player has enough balance for the bet
        if (amount > 0 && amount > player.balance) {
            console.log(`Insufficient balance: ${player.balance} < ${amount}`);
            toast.error("Insufficient funds", {
                description: `You need ${amount - player.balance} more chips to place this bet`,
            });
            return;
        }

        try {
            // Place the bet - pass the amount directly to placeBet
            // The placeBet function will add this to the current bet
            placeBet(player.id, amount);

            // Play bet sound
            if (isSoundEnabled) {
                // Sound effect logic would go here
            }

            // Show success toast for positive bets
            if (amount > 0) {
                toast.success("Bet placed", {
                    description: `$${amount} added to your bet`,
                });
            } else {
                // Show info toast for bet adjustments
                toast.info("Bet adjusted", {
                    description: `Bet adjusted to $${Math.max(0, player.currentBet + amount)}`,
                });
            }

            trackEvent('bet_placed', { amount });
        } catch (error) {
            console.error('Error placing bet:', error);
            toast.error("Error placing bet", {
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });
        }
    }, [gamePhase, gameState, placeBet, trackEvent, isSoundEnabled]);

    // Handle dealing
    const handleDeal = useCallback(() => {
        if (gamePhase !== 'betting') {
            console.log('Cannot deal cards outside of betting phase');
            toast.error("Cannot deal cards", {
                description: "Cards can only be dealt during the betting phase",
            });
            return;
        }

        const player = gameState.getActivePlayer();
        if (!player) {
            console.log('No active player found');
            toast.error("Cannot deal cards", {
                description: "No active player found",
            });
            return;
        }

        if (player.currentBet <= 0) {
            console.log('Player must place a bet before dealing');
            toast.error("Cannot deal cards", {
                description: "Please place a bet first",
            });
            return;
        }

        try {
            dealCards();
            trackEvent('deal_cards');

            // Ensure UI phase is updated if not automatically done by dealCards
            setGamePhase('dealing');

            // Add notification about dealing
            safeAddNotification({
                title: "Dealing Cards",
                message: `Starting new hand with $${player.currentBet} bet`,
                type: "game",
                priority: "medium"
            });
        } catch (error) {
            console.error('Error dealing cards:', error);
            toast.error("Error dealing cards", {
                description: error instanceof Error ? error.message : "An unknown error occurred",
            });
        }
    }, [gamePhase, gameState, dealCards, trackEvent, setGamePhase, safeAddNotification]);

    // Handle next round
    const handleNextRound = useCallback(() => {
        nextRound();
        trackEvent('next_round');
    }, [nextRound, trackEvent]);

    // Handle game end scenarios
    const handleEndGame = useCallback(() => {
        endGame();
        safeAddNotification({
            title: "Game Ended",
            message: 'Game ended',
            type: "game", // Using allowed notification type
            priority: "medium"
        });
    }, [endGame, safeAddNotification]);

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

        safeAddNotification({
            title: "Game Reset",
            message: 'Game reset',
            type: "game", // Using allowed notification type
            priority: "medium"
        });
    }, [initializeGame, safeAddNotification]);

    // Handle leaving game
    const _handleLeaveGame = useCallback(() => {
        // Save game state or perform any cleanup
        router.push('/');
    }, [router]);

    // Handle clear bet
    const handleClearBet = useCallback(() => {
        // Clear the player's bet
        const player = gameState.getActivePlayer();
        if (player) {
            // Reset the current bet to 0
            placeBet(player.id, -playerBalance);
            trackEvent('bet_cleared');
        }
    }, [gameState, playerBalance, placeBet, trackEvent]);

    // Handle max bet
    const handleMaxBet = useCallback(() => {
        // Place the maximum allowed bet
        const player = gameState.getActivePlayer();
        if (player) {
            // Use the game options to get table limits since getTableLimits() isn't available
            const maxBet = 500; // Default max bet from initialization
            const betAmount = Math.min(maxBet, playerBalance);
            placeBet(player.id, betAmount);
            trackEvent('max_bet_placed', { amount: betAmount });
        }
    }, [gameState, playerBalance, placeBet, trackEvent]);

    // Handle double bet
    const handleDoubleBet = useCallback(() => {
        // Double the current bet if possible
        const player = gameState.getActivePlayer();
        if (player) {
            const currentBet = player.currentBet || 0;
            const doubledBet = currentBet * 2;
            const canAfford = doubledBet <= playerBalance;

            // Use the default max bet from initialization
            const maxBet = 500;
            const withinLimits = doubledBet <= maxBet;

            if (canAfford && withinLimits && currentBet > 0) {
                // Place the additional bet amount instead of clearing and replacing
                placeBet(player.id, currentBet);
                trackEvent('bet_doubled', { amount: doubledBet });
            }
        }
    }, [gameState, playerBalance, placeBet, trackEvent]);

    const mainContainerClass = cn(
        "flex-1 w-full max-w-[1280px] mx-auto px-4 py-6",
        "flex flex-col items-center justify-center",
        "h-[calc(100vh-70px)]",
        "pr-[260px]",
        gamePhase === 'dealer-turn' && "bg-opacity-80"
    );

    // Fixed table limits
    const minBet = 5;
    const maxBet = 500;

    // Get current bet from active player
    const currentBet = activePlayer?.currentBet || 0;

    // Determine if we're in betting phase
    const isBettingPhase = gamePhase === 'betting';

    // Safely map tableColor to BlackjackTable variant
    const getTableVariant = (): 'green' | 'red' | 'blue' | 'black' | 'dark' | 'light' | 'vip' => {
        const validVariants = ['green', 'red', 'blue', 'black', 'dark', 'light', 'vip'];
        return (validVariants.includes(tableColor) ? tableColor : 'green') as 'green' | 'red' | 'blue' | 'black' | 'dark' | 'light' | 'vip';
    };

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

            {/* Main Game Table - Using the realistic BlackjackTable as the main component */}
            <main className={mainContainerClass}>
                <div className="relative flex flex-col items-center w-full h-full">
                    {/* Message display at the top */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-[80%] max-w-[600px]">
                        {/* Add a message display for game status */}
                        <div className="px-4 py-2 text-center border rounded-lg bg-black/60 text-amber-300 backdrop-blur-sm border-amber-800/40">
                            {gamePhase === 'betting' && "Place your bet to begin"}
                            {gamePhase === 'dealing' && "Dealing cards..."}
                            {gamePhase === 'playerTurn' && "Your turn - Hit or Stand?"}
                            {gamePhase === 'dealerTurn' && "Dealer's turn"}
                            {gamePhase === 'settlement' && "Round complete!"}
                        </div>
                    </div>

                    {/* Main BlackjackTable */}
                    <BlackjackTable
                        className="w-full h-full max-h-[700px]"
                        variant={getTableVariant()}
                        playerBalance={playerBalance}
                        currentBet={currentBet}
                        minBet={minBet}
                        maxBet={maxBet}
                        onPlaceBet={handlePlaceBet}
                        onClearBet={handleClearBet}
                        onMaxBet={handleMaxBet}
                        onDoubleBet={handleDoubleBet}
                        onDealCards={handleDeal}
                        isBettingPhase={isBettingPhase}
                        disableBetting={!isBettingPhase || !isPlayerInitialized}
                    />

                    {/* Player Action Controls - Only during player turn */}
                    {gamePhase === 'playerTurn' && (
                        <div className="absolute z-30 transform -translate-x-1/2 bottom-8 left-1/2">
                            <div className="flex gap-3 p-3 border rounded-lg bg-black/60 backdrop-blur-sm border-amber-800/40">
                                <Button
                                    onClick={handleHit}
                                    disabled={!gameState.getAvailableActions().includes('hit')}
                                    className="bg-amber-700 hover:bg-amber-600"
                                >
                                    Hit
                                </Button>
                                <Button
                                    onClick={handleStand}
                                    disabled={!gameState.getAvailableActions().includes('stand')}
                                    className="bg-amber-700 hover:bg-amber-600"
                                >
                                    Stand
                                </Button>
                                <Button
                                    onClick={handleDouble}
                                    disabled={!gameState.getAvailableActions().includes('double')}
                                    className="bg-amber-700 hover:bg-amber-600"
                                >
                                    Double
                                </Button>
                                <Button
                                    onClick={handleSplit}
                                    disabled={!gameState.getAvailableActions().includes('split')}
                                    className="bg-amber-700 hover:bg-amber-600"
                                >
                                    Split
                                </Button>
                                <Button
                                    onClick={handleSurrender}
                                    disabled={!gameState.getAvailableActions().includes('surrender')}
                                    className="bg-amber-700 hover:bg-amber-600"
                                >
                                    Surrender
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Game Controls / Sidebar - Fixed position */}
                    <div className="fixed top-0 right-0 z-40 h-full py-4">
                        <div className="h-full w-[250px] bg-black/50 backdrop-blur-sm flex flex-col p-4 border-l border-amber-800/40">
                            <div className="mb-4 text-xl font-bold text-amber-300">Royal Blackjack</div>

                            <div className="mb-4">
                                <div className="text-sm text-amber-300">Player</div>
                                <div className="font-bold text-white">{gameState.getActivePlayer()?.name ?? 'Player'}</div>
                            </div>

                            <div className="mb-4">
                                <div className="text-sm text-amber-300">Balance</div>
                                <div className="font-bold text-white">${playerBalance}</div>
                            </div>

                            <div className="mb-4">
                                <div className="text-sm text-amber-300">Current Bet</div>
                                <div className="font-bold text-white">${currentBet}</div>
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSettingsOpen}
                                    className="justify-start w-full bg-black/30 border-amber-800/60 text-amber-300"
                                >
                                    <Settings className="w-4 h-4 mr-2" /> Settings
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTutorialOpen}
                                    className="justify-start w-full bg-black/30 border-amber-800/60 text-amber-300"
                                >
                                    <motion.div className="mr-2">📘</motion.div> Game Rules
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleStatisticsOpen}
                                    className="justify-start w-full bg-black/30 border-amber-800/60 text-amber-300"
                                >
                                    <motion.div className="mr-2">📊</motion.div> Statistics
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleToggleSound}
                                    className="justify-start w-full bg-black/30 border-amber-800/60 text-amber-300"
                                >
                                    {isSoundEnabled ? (
                                        <motion.div className="mr-2">🔊</motion.div>
                                    ) : (
                                        <motion.div className="mr-2">🔇</motion.div>
                                    )}
                                    {isSoundEnabled ? 'Sound On' : 'Sound Off'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
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
                currentBet={currentBet}
            />

            {/* Admin Actions - Moved to avoid overlapping with footer */}
            <div className="fixed flex flex-row gap-3 bottom-[70px] right-4 z-50">
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