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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose,
    SheetFooter
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ChevronLeft, ChevronRight, HelpCircle, Volume2, VolumeX, Cog
} from 'lucide-react';
import TutorialOverlay from '@/components/tutorial/TutorialOverlay';
import AdvicePanel from '@/components/strategy/AdvicePanel';
import StatisticsPanel from '@/components/game/stats/StatisticsPanel';
import SettingsPanel from '@/components/game/settings/SettingsPanel';
import { SideBetsPanel } from '@/components/betting/SideBetsPanel';

import { useGameState } from '@/hooks/game/useGameState';
import { useHandCalculator } from '@/hooks/game/useHandCalculator';
import { useGameStore } from '@/store/gameStore';
import { useGamePhaseMachine } from '@/store/slices/gamePhaseSlice';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useSideBetsStore } from '@/store/sideBetsStore';
import { useShallow } from 'zustand/react/shallow';

import { cn } from '@/lib/utils/utils';
import { GamePhase } from '@/types/gameTypes';
import { CreateNotificationRequest } from '@/types/notifications';
import { DEFAULT_STARTING_CHIPS } from '@/lib/constants/gameConstants';
import { toUIPhase, toStorePhase } from '@/utils/phase-mapping';

/**
 * BlackjackPage is the main component for the blackjack game experience
 * Integrates all game functionality and UI components with a modern, sophisticated design
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
    const { isInitialized, isLoading, error, addPlayer } = useGameStore(
        useShallow(state => ({
            isInitialized: state.isInitialized,
            isLoading: state.isLoading,
            error: state.error,
            addPlayer: state.addPlayer
        }))
    );

    // Game phase and transitions from XState machine
    const { currentPhase: gamePhase, transitionTo: setGamePhase } = useGamePhaseMachine();

    // Convert store phase to UI phase label
    const uiPhase = toUIPhase(gamePhase);

    // Handle phase change from UI components
    const _handlePhaseChange = useCallback((uiPhase: UIGamePhase) => {
        // Map UI phase back to store phase for transitions
        const storePhase = toStorePhase(uiPhase);
        setGamePhase(storePhase);
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
        }
    }, [addNotification]);

    // UI States
    const [showTutorial, setShowTutorial] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarTab, setSidebarTab] = useState('advice');
    const [showSettings, setShowSettings] = useState(false);
    const [showSideBets, setShowSideBets] = useState(false);

    // Side bets states
    const getAvailableBets = useSideBetsStore(state => state.getAvailableBets);
    const availableBets = React.useMemo(() => getAvailableBets(), [getAvailableBets]);
    const sideBets = React.useMemo(() => ({
        perfectPairs: availableBets['perfectPairs'] || false,
        twentyOneThree: availableBets['21+3'] || false,
        luckyLadies: availableBets['luckyLadies'] || false
    }), [availableBets]);

    // Memoize callback functions for UI interactions
    const handleToggleSound = useCallback(() => {
        toggleSound();
        toast.success(isSoundEnabled ? "Sound disabled" : "Sound enabled");
    }, [toggleSound, isSoundEnabled]);

    const handleToggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev);
    }, []);

    // Analytics tracking
    const trackEvent = useCallback((event: string, data?: Record<string, unknown>) => {
        console.log(`Analytics event: ${event}`, data);
    }, []);

    // Get active player balance
    const activePlayer = gameState.getActivePlayer();
    const playerBalance = activePlayer?.balance ?? DEFAULT_STARTING_CHIPS;

    // Debug: Track player balance
    useEffect(() => {
        if (activePlayer && activePlayer.balance === 0) {
            console.log('Force updating player with DEFAULT_STARTING_CHIPS');
            gameState.addPlayer('Player', DEFAULT_STARTING_CHIPS);
        }
    }, [activePlayer, playerBalance, gameState]);

    // Add initialization ref to prevent multiple initializations
    const hasInitialized = useRef(false);
    const [isPlayerInitialized, setIsPlayerInitialized] = useState(false);

    // Modify the initialization effect
    useEffect(() => {
        if (!isInitialized && !hasInitialized.current) {
            hasInitialized.current = true;
            console.log('Initializing game state...');

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

                setIsPlayerInitialized(true);

                toast.success("Game initialized", {
                    description: `Starting balance: $${DEFAULT_STARTING_CHIPS}`,
                });

                trackEvent('game_loaded', { type: 'blackjack' });
            }, 500);
        }

        return () => {
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

            if (!error.includes('notification')) {
                safeAddNotification({
                    title: "Error",
                    message: error,
                    type: "system",
                    priority: "high"
                });
            }
        }
    }, [error, safeAddNotification]);

    // Memoize player actions
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

        if (amount > 0 && amount > player.balance) {
            console.log(`Insufficient balance: ${player.balance} < ${amount}`);
            toast.error("Insufficient funds", {
                description: `You need ${amount - player.balance} more chips to place this bet`,
            });
            return;
        }

        try {
            placeBet(player.id, amount);

            if (amount > 0) {
                toast.success("Bet placed", {
                    description: `$${amount} added to your bet`,
                });
            } else {
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
    }, [gamePhase, gameState, placeBet, trackEvent]);

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
            setGamePhase('dealing');

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
            type: "game",
            priority: "medium"
        });
    }, [endGame, safeAddNotification]);

    // Handle game reset
    const handleResetGame = useCallback(() => {
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
            type: "game",
            priority: "medium"
        });
    }, [initializeGame, safeAddNotification]);

    // Handle clearing bet
    const handleClearBet = useCallback(() => {
        const player = gameState.getActivePlayer();
        if (player) {
            placeBet(player.id, -player.currentBet);
            trackEvent('bet_cleared');
        }
    }, [gameState, placeBet, trackEvent]);

    // Handle max bet
    const handleMaxBet = useCallback(() => {
        const player = gameState.getActivePlayer();
        if (player) {
            const maxBet = 500;
            const betAmount = Math.min(maxBet, player.balance);
            placeBet(player.id, betAmount);
            trackEvent('max_bet_placed', { amount: betAmount });
        }
    }, [gameState, placeBet, trackEvent]);

    // Handle double bet
    const handleDoubleBet = useCallback(() => {
        const player = gameState.getActivePlayer();
        if (player) {
            const currentBet = player.currentBet || 0;
            const doubledBet = currentBet * 2;
            const canAfford = doubledBet <= player.balance;
            const maxBet = 500;
            const withinLimits = doubledBet <= maxBet;

            if (canAfford && withinLimits && currentBet > 0) {
                placeBet(player.id, currentBet);
                trackEvent('bet_doubled', { amount: doubledBet });
            }
        }
    }, [gameState, placeBet, trackEvent]);

    // Side bets handling
    const handlePlaceSideBet = useCallback((betType: string, amount: number) => {
        console.log(`Placing side bet: ${betType} - $${amount}`);
        // Implementation would go here
        toast.success(`$${amount} side bet placed on ${betType}`);
    }, []);

    // Card values for advice panel
    const activeHand = gameState.getActiveHand();
    const playerCards = activeHand?.cards || [];
    const dealerCards = gameState.getDealerHand()?.cards || [];
    const dealerUpcard = dealerCards[0] || null;

    // Calculate scores for advice panel
    const playerScore = playerCards.length > 0 ?
        handCalculator.determineBestValue(handCalculator.calculateValues(playerCards)) : 0;
    const dealerScore = dealerCards.length > 0 ?
        handCalculator.determineBestValue(handCalculator.calculateValues(dealerCards)) : 0;

    // Determine available actions
    const availableActions = gameState.getAvailableActions();
    const canSplit = availableActions.includes('split');
    const canDouble = availableActions.includes('double');
    const canSurrender = availableActions.includes('surrender');

    // Dynamic styling based on sidebar state
    const mainContainerClass = cn(
        "flex-1 w-full mx-auto",
        "flex flex-col items-center justify-center",
        "h-[calc(100vh-70px)]",
        sidebarOpen ? "pr-[320px] transition-all duration-300 ease-in-out" : "pr-4 transition-all duration-300 ease-in-out",
        "pl-4",
        gamePhase === 'dealerTurn' && "bg-opacity-80"
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
        type TableVariant = 'green' | 'red' | 'blue' | 'black' | 'dark' | 'light' | 'vip';
        const validVariants: TableVariant[] = ['green', 'red', 'blue', 'black', 'dark', 'light', 'vip'];

        const isValidVariant = (color: string): color is TableVariant =>
            validVariants.includes(color as TableVariant);

        return isValidVariant(tableColor) ? tableColor : 'green';
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

            {/* Main Game Table */}
            <main className={mainContainerClass}>
                <div className="relative flex flex-col items-center w-full h-full">
                    {/* Status Message */}
                    <motion.div
                        className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30 w-[80%] max-w-[600px]"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="px-4 py-2 text-center border rounded-lg shadow-lg bg-black/60 text-amber-300 backdrop-blur-sm border-amber-800/40">
                            {gamePhase === 'betting' && "Place your bet to begin"}
                            {gamePhase === 'dealing' && "Dealing cards..."}
                            {gamePhase === 'playerTurn' && "Your turn - Hit or Stand?"}
                            {gamePhase === 'dealerTurn' && "Dealer's turn"}
                            {gamePhase === 'settlement' && "Round complete!"}
                        </div>
                    </motion.div>

                    {/* BlackjackTable */}
                    <BlackjackTable
                        className="w-full h-full aspect-[4/3] max-h-[calc(100vh-150px)] mx-auto"
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
                        isPlayerInitialized={isPlayerInitialized}
                    />

                    {/* Player Action Controls - Only during player turn */}
                    {gamePhase === 'playerTurn' && (
                        <motion.div
                            className="absolute z-30 transform -translate-x-1/2 bottom-8 left-1/2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="flex gap-3 p-3 border rounded-lg shadow-lg bg-black/60 backdrop-blur-sm border-amber-800/40">
                                <Button
                                    onClick={handleHit}
                                    disabled={!availableActions.includes('hit')}
                                    className="text-white shadow-md bg-emerald-700 hover:bg-emerald-600"
                                >
                                    Hit
                                </Button>
                                <Button
                                    onClick={handleStand}
                                    disabled={!availableActions.includes('stand')}
                                    className="text-white shadow-md bg-rose-700 hover:bg-rose-600"
                                >
                                    Stand
                                </Button>
                                <Button
                                    onClick={handleDouble}
                                    disabled={!availableActions.includes('double')}
                                    className="text-white bg-indigo-700 shadow-md hover:bg-indigo-600"
                                >
                                    Double
                                </Button>
                                <Button
                                    onClick={handleSplit}
                                    disabled={!availableActions.includes('split')}
                                    className="text-white shadow-md bg-amber-700 hover:bg-amber-600"
                                >
                                    Split
                                </Button>
                                <Button
                                    onClick={handleSurrender}
                                    disabled={!availableActions.includes('surrender')}
                                    className="text-white shadow-md bg-slate-700 hover:bg-slate-600"
                                >
                                    Surrender
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Sidebar Toggle Button */}
                    <motion.button
                        className="fixed top-1/2 right-[320px] z-50 -translate-y-1/2 bg-black/40 backdrop-blur-sm border border-amber-800/40 rounded-l-md p-2 shadow-lg"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleToggleSidebar}
                        style={{ right: sidebarOpen ? "320px" : "0" }}
                        transition={{ duration: 0.3 }}
                    >
                        {sidebarOpen ? <ChevronRight className="w-5 h-5 text-amber-300" /> : <ChevronLeft className="w-5 h-5 text-amber-300" />}
                    </motion.button>

                    {/* Game Sidebar with Tabs */}
                    <motion.div
                        className="fixed top-0 right-0 z-40 h-screen pt-16 pb-20 border-l shadow-xl bg-black/60 backdrop-blur-md border-amber-800/40"
                        initial={{ width: 320, x: 0 }}
                        animate={{
                            width: 320,
                            x: sidebarOpen ? 0 : 320
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="flex flex-col h-full p-4">
                            <div className="mb-4 text-xl font-bold text-amber-300">Royal Blackjack</div>

                            {/* Player Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 border rounded-lg shadow-md bg-black/40 border-amber-800/60">
                                    <div className="mb-1 text-sm text-amber-300/80">Balance</div>
                                    <div className="text-xl font-bold text-white">${playerBalance}</div>
                                </div>
                                <div className="p-3 border rounded-lg shadow-md bg-black/40 border-amber-800/60">
                                    <div className="mb-1 text-sm text-amber-300/80">Current Bet</div>
                                    <div className="text-xl font-bold text-white">${currentBet}</div>
                                </div>
                            </div>

                            {/* Sidebar Tabs */}
                            <Tabs
                                defaultValue={sidebarTab}
                                value={sidebarTab}
                                onValueChange={setSidebarTab}
                                className="flex flex-col flex-1"
                            >
                                <TabsList className="grid grid-cols-3 mb-4 border bg-black/40 border-amber-800/40">
                                    <TabsTrigger value="advice" className="data-[state=active]:bg-amber-900/60">Advice</TabsTrigger>
                                    <TabsTrigger value="stats" className="data-[state=active]:bg-amber-900/60">Stats</TabsTrigger>
                                    <TabsTrigger value="bets" className="data-[state=active]:bg-amber-900/60">Side Bets</TabsTrigger>
                                </TabsList>

                                <TabsContent value="advice" className="flex-1 overflow-auto">
                                    <AdvicePanel
                                        playerCards={playerCards}
                                        dealerUpcard={dealerUpcard}
                                        playerScore={playerScore}
                                        dealerScore={dealerScore}
                                        canSplit={canSplit}
                                        canDouble={canDouble}
                                        canSurrender={canSurrender}
                                        gamePhase={uiPhase}
                                        hintMode="basic"
                                        useRealTimeAdvice={true}
                                        showConfidence={true}
                                        showExplanation={true}
                                        className="shadow-md bg-black/20 border-amber-800/40"
                                        onActionClick={(action) => console.log(`Action suggested: ${action}`)}
                                    />
                                </TabsContent>

                                <TabsContent value="stats" className="flex-1 overflow-auto">
                                    <StatisticsPanel />
                                </TabsContent>

                                <TabsContent value="bets" className="flex-1 overflow-auto">
                                    <SideBetsPanel
                                        playerChips={playerBalance}
                                        availableBets={{
                                            'perfectPairs': true,
                                            '21+3': true,
                                            'luckyLadies': true
                                        }}
                                        currentBets={[]}
                                        onPlaceBet={handlePlaceSideBet}
                                    />
                                </TabsContent>
                            </Tabs>

                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-4">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="bg-black/30 border-amber-800/60 text-amber-300"
                                                onClick={handleToggleSound}>
                                                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {isSoundEnabled ? "Mute Sound" : "Enable Sound"}
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="bg-black/30 border-amber-800/60 text-amber-300"
                                                onClick={() => setShowSettings(true)}>
                                                <Cog className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Game Settings
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="bg-black/30 border-amber-800/60 text-amber-300"
                                                onClick={() => setShowTutorial(true)}>
                                                <HelpCircle className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Game Rules
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="icon" className="bg-black/30 border-amber-800/60 text-amber-300"
                                                onClick={() => router.push('/')}>
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Exit Game
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Game Footer */}
            <GameFooter
                gamePhase={uiPhase}
                onPlaceBet={handlePlaceBet}
                onClearBet={handleClearBet}
                onMaxBet={handleMaxBet}
                onDoubleBet={handleDoubleBet}
                onDeal={handleDeal}
                onHit={handleHit}
                onStand={handleStand}
                onDouble={handleDouble}
                onSplit={handleSplit}
                onSurrender={handleSurrender}
                onNextRound={handleNextRound}
                onEndGame={handleEndGame}
                onResetGame={handleResetGame}
                availableActions={gameState.getAvailableActions()}
                isPlayerTurn={gamePhase === 'playerTurn'}
                isDealerTurn={gamePhase === 'dealerTurn'}
                isRoundOver={['settlement', 'cleanup', 'betting'].includes(gamePhase)}
                playerBalance={playerBalance}
                currentBet={currentBet}
                className="border-t bg-black/50 backdrop-blur-md border-amber-900/40"
            />

            {/* Settings Sheet */}
            <Sheet open={showSettings} onOpenChange={setShowSettings}>
                <SheetContent side="right" className="bg-gray-900 border-l border-amber-800/40 w-[350px]">
                    <SheetHeader>
                        <SheetTitle className="text-amber-300">Game Settings</SheetTitle>
                        <SheetDescription>
                            Customize your game experience
                        </SheetDescription>
                    </SheetHeader>
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
                    <SheetFooter className="mt-4">
                        <SheetClose asChild>
                            <Button className="w-full text-white bg-amber-700 hover:bg-amber-600">
                                Save Changes
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Side Bets Sheet */}
            <Sheet open={showSideBets} onOpenChange={setShowSideBets}>
                <SheetContent side="bottom" className="bg-gray-900 border-t border-amber-800/40 h-[40vh]">
                    <SheetHeader>
                        <SheetTitle className="text-amber-300">Side Bets</SheetTitle>
                        <SheetDescription>
                            Place additional bets for bigger payouts
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        <SideBetsPanel
                            playerChips={playerBalance}
                            availableBets={{
                                'perfectPairs': true,
                                '21+3': true,
                                'luckyLadies': true
                            }}
                            currentBets={[]}
                            onPlaceBet={handlePlaceSideBet}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Tutorial Overlay - Conditionally render only when needed */}
            {showTutorial && (
                <TutorialOverlay
                    isActive={true}
                    targets={[]}
                    onOverlayClick={() => setShowTutorial(false)}
                />
            )}
        </PageLayout>
    );
};

export default BlackjackPage;