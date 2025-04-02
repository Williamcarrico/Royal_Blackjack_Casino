'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import useGameStore from '@/store/gameStore';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { useSideBetsStore } from '@/store/sideBetsStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import { Suit, Rank } from '@/components/game/card/Card';
import { GameStore, EnhancedSettingsStore } from '@/types/storeTypes';
import { Hand as HandEntity } from '@/types/handTypes';
import { ChipValue } from '@/components/betting/Chip';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
    ChevronDown,
    Settings,
    BarChart2,
    Zap,
    HelpCircle,
    DollarSign,
    Award,
    Volume2,
    VolumeX,
    Menu
} from 'lucide-react';

// Game Components
import BlackjackTable from '@/components/game/table/BlackjackTable';
import BettingControls from '@/components/betting/BettingControls';
import { SideBetsPanel } from '@/components/betting/SideBetsPanel';
import StrategyCard from '@/components/strategy/StrategyCard';
import { RuleConfiguration } from '@/components/game/rules/RuleConfiguration';
import { GameSidebar } from '@/components/game/controls/GameSidebar';
import GameControls from '@/components/game/controls/GameControls';
import CountingDisplay from '@/components/strategy/CountingDisplay';

// Type definitions
interface PlayerSpot {
    id: number;
    position: string;
    hand: Record<string, unknown> | null; // Changed to accept null
    chips: number;
    bet: number;
    isActive: boolean;
    isCurrentPlayer: boolean;
    result?: string;
}

// Extended GameStore type with properties used in this component
interface ExtendedGameStore {
    gamePhase: string;
    message: string;
    chips: number;
    bet: number;
    roundResult: string | null;
    activePlayerHandId: string | null;
    dealerHandId: string | null;
    playerHandIds: string[];
    entities: {
        hands: Record<string, HandEntity>;
        cards: Record<string, {
            suit: string;
            rank: string;
        }>;
    };
    isInitialized: boolean;
    runningCount: number;
    trueCount: number;
    dealtCards: string[];
    shoe: string[];
    showInsurance: boolean;
    gameState?: {
        currentPhase: string;
        count: {
            running: number;
            true: number;
        };
        deck: {
            remainingCards: number;
        };
    };

    // Methods
    initializeGame: () => void;
    placeBet: (amount: number) => void;
    clearBet: () => void;
    dealCards: () => void;
    hit: () => void;
    stand: () => void;
    doubleDown: () => void;
    split: () => void;
    surrender: () => void;
    playDealer: () => void;
    endRound: () => void;
    resetRound: () => void;
    takeInsurance: () => void;
    declineInsurance: () => void;
    updateRules: (rules: Record<string, unknown>) => void;
    updateChips: (amount: number) => void;
    canDoubleDown: () => boolean;
    canSplit: () => boolean;
    canSurrender: () => boolean;
}

// Extended EnhancedSettingsStore type
interface ExtendedEnhancedSettingsStore {
    tableColor: string;
    showBasicStrategy: boolean;
    showProbabilities: boolean;
    showCountingInfo: boolean;
    confirmActions: boolean;
    cardStyle: string;
    animationSpeed: 'slow' | 'normal' | 'fast';
    gameRules: {
        minBet: number;
        maxBet: number;
    };
    updateSettings: (settings: Record<string, unknown>) => void;
}

// Extended SideBetsStore type
interface ExtendedSideBetsStore {
    getAvailableBets: () => Array<{
        id: string;
        name: string;
        payout: string;
        minBet: number;
        maxBet: number;
    }>;
    getBets: () => Array<{
        type: string;
        amount: number;
    }>;
    placeBet: (type: string, amount: number) => void;
}

// Game phase type for TypeScript
type GamePhaseType = 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over';

// Ambient sound effects
const ambientSounds = {
    music: new Audio('/sounds/casino-ambience.mp3'),
    deal: new Audio('/sounds/card-deal.mp3'),
    win: new Audio('/sounds/win.mp3'),
    chips: new Audio('/sounds/chips.mp3'),
    shuffle: new Audio('/sounds/shuffle.mp3'),
    buttonClick: new Audio('/sounds/button-click.mp3')
};

// Set up ambient sounds
Object.values(ambientSounds).forEach(sound => {
    sound.volume = 0.5;
    if (sound === ambientSounds.music) {
        sound.loop = true;
    }
});

// Player position types
export type PlayerPosition = 'left-far' | 'left' | 'center' | 'right' | 'right-far';

// Message type for status messages
type MessageType = 'info' | 'success' | 'warning' | 'error';

// Player action type
type PlayerAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

// Define valid chip values at the top of your file, after imports
const VALID_CHIP_VALUES = [1, 5, 10, 25, 50, 100, 500, 1000] as const;

// Helper function to get card key from card ID
const getCardKey = (cardId: unknown): string => {
    // If it's already a string, just return it
    if (typeof cardId === 'string') return cardId;

    // Handle object with id property
    if (cardId && typeof cardId === 'object' && 'id' in cardId) {
        const idObj = cardId as Record<string, unknown>;
        return String(idObj.id);
    }

    // Use formatCardId for proper stringification
    return formatCardId(cardId);
};

// Helper function to determine text color based on count
const getCountTextColor = (count: number): string => {
    if (count > 1.5) return 'text-green-400';
    if (count < -1.5) return 'text-red-400';
    return 'text-white';
};

// Helper function to get running count text color
const getRunningCountTextColor = (count: number): string => {
    if (count > 0) return 'text-green-400';
    if (count < 0) return 'text-red-400';
    return 'text-white';
};

// Helper function to get dealer card property

// Helper function to format card ID safely
const formatCardId = (cardId: unknown): string => {
    if (typeof cardId === 'string') return cardId;
    if (cardId === null || cardId === undefined) return 'unknown';
    if (typeof cardId === 'object') {
        // Extract id property if it exists
        if (cardId && 'id' in cardId) {
            const idObj = cardId as Record<string, unknown>;
            return String(idObj.id);
        }
        // Create a more specific identifier for objects instead of default stringification
        try {
            return `card-${JSON.stringify(cardId)}`;
        } catch {
            return `card-object-${Math.random().toString(36).substring(2, 9)}`;
        }
    }
    // For numbers or other primitives
    return `card-${String(cardId)}`;
};

// Extract UI components
const StatusMessage = ({ message, type }: { message: string, type: MessageType }) => (
    <AnimatePresence mode="wait">
        <motion.div
            key={`${message}-${type}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "rounded-lg shadow-lg backdrop-blur-sm",
                "flex items-center justify-center",
                "text-white font-medium px-4 py-2",
                {
                    'bg-blue-500/70': type === 'info',
                    'bg-green-500/70': type === 'success',
                    'bg-amber-500/70': type === 'warning',
                    'bg-red-500/70': type === 'error'
                }
            )}
            role="alert"
            aria-live="assertive"
        >
            {/* Message icon */}
            <span className="mr-2">
                {type === 'info' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                {type === 'success' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                {type === 'warning' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )}
                {type === 'error' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </span>
            <span>{message}</span>
        </motion.div>
    </AnimatePresence>
);

// Extract custom hooks
const useGameInitialization = (
    gameStore: ExtendedGameStore,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analytics: any,
    welcomeShown: boolean,
    setWelcomeShown: (shown: boolean) => void,
    setIsIntroShown: (shown: boolean) => void,
    setIsLoading: (loading: boolean) => void
) => {
    const isMounted = useRef(true);

    useEffect(() => {
        const initGame = async () => {
            if (isMounted.current) {
                analytics.startSession(gameStore?.chips || 0);
            }

            if (gameStore && !gameStore.isInitialized) {
                gameStore.initializeGame();
            }

            if (!welcomeShown && isMounted.current) {
                toast.success('Welcome to Royal Edge Casino', {
                    description: 'Place your bets to begin playing!',
                    duration: 5000,
                });
                setWelcomeShown(true);
            }

            setIsIntroShown(true);
            setIsLoading(false);
        };

        initGame();

        return () => {
            isMounted.current = false;
            if (analytics.sessionActive && gameStore) {
                analytics.endSession(gameStore?.chips || 0);
            }

            Object.values(ambientSounds).forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
        };
    }, [analytics, welcomeShown, gameStore, setWelcomeShown, setIsIntroShown, setIsLoading]);

    return isMounted;
};

const useGameMessages = (gameStore: ExtendedGameStore) => {
    const [statusMessage, setStatusMessage] = useState('');
    const [messageType, setMessageType] = useState<MessageType>('info');

    const getMessageType = useCallback((message: string): MessageType => {
        if (message.includes('win') || message.includes('blackjack')) return 'success';
        if (message.includes('lose') || message.includes('bust')) return 'error';
        if (message.includes('push')) return 'warning';
        return 'info';
    }, []);

    const getSettlementMessage = useCallback((result: string | null, bet: number): [string, MessageType] => {
        if (result === 'win') return [`You won $${bet}!`, 'success'];
        if (result === 'lose') return [`You lost $${bet}`, 'error'];
        if (result === 'push') return ['Push - your bet is returned', 'warning'];
        if (result === 'blackjack') return [`Blackjack! You won $${Math.floor(bet * 1.5)}!`, 'success'];
        return ['Round complete', 'info'];
    }, []);

    const getDefaultStatusMessage = useCallback((phase: string, bet: number, result: string | null): [string, MessageType] => {
        switch (phase) {
            case 'betting':
                return [bet > 0 ? `Bet: $${bet} - Press Deal to start` : 'Place your bet to start a new hand', 'info'];
            case 'dealing':
                return ['Dealing cards...', 'info'];
            case 'playerTurn':
                return ['Your turn: Hit, Stand, or Double?', 'info'];
            case 'dealerTurn':
                return ['Dealer is playing...', 'info'];
            case 'settlement':
                return getSettlementMessage(result, bet);
            default:
                return ['Welcome to Royal Edge Casino', 'info'];
        }
    }, [getSettlementMessage]);

    useEffect(() => {
        if (gameStore.message) {
            setStatusMessage(gameStore.message);
            setMessageType(getMessageType(gameStore.message));
        } else {
            const [message, type] = getDefaultStatusMessage(
                gameStore.gamePhase,
                gameStore.bet,
                gameStore.roundResult
            );
            setStatusMessage(message);
            setMessageType(type);
        }
    }, [gameStore.message, gameStore.gamePhase, gameStore.roundResult, gameStore.bet, getMessageType, getDefaultStatusMessage]);

    return { statusMessage, messageType };
};

const useSoundEffects = (soundEnabled: boolean, gameStore: ExtendedGameStore) => {
    useEffect(() => {
        if (soundEnabled) {
            ambientSounds.music.play().catch(e => console.error("Error playing ambient sound:", e));
        } else {
            ambientSounds.music.pause();
        }

        return () => {
            ambientSounds.music.pause();
        };
    }, [soundEnabled]);

    useEffect(() => {
        if (!soundEnabled) return;

        if (gameStore?.gamePhase === 'dealing') {
            ambientSounds.deal.play().catch(e => console.error("Error playing deal sound:", e));
        } else if (gameStore?.gamePhase === 'settlement' && gameStore?.roundResult === 'win') {
            ambientSounds.win.play().catch(e => console.error("Error playing win sound:", e));
        } else if (gameStore?.gamePhase === 'betting' && (gameStore?.bet || 0) > 0) {
            ambientSounds.chips.play().catch(e => console.error("Error playing chips sound:", e));
        }

        return () => {
            Object.values(ambientSounds).forEach(sound => {
                if (sound !== ambientSounds.music) {
                    sound.pause();
                    sound.currentTime = 0;
                }
            });
        };
    }, [soundEnabled, gameStore?.gamePhase, gameStore?.roundResult, gameStore?.bet]);
};

const usePlayerSpots = (gameStore: ExtendedGameStore) => {
    const [playerSpots, setPlayerSpots] = useState<PlayerSpot[]>([
        {
            id: 1,
            position: 'center',
            hand: null,
            chips: gameStore?.chips || 1500,
            bet: 0,
            isActive: false,
            isCurrentPlayer: true,
        }
    ]);

    useEffect(() => {
        const playerHand = gameStore.activePlayerHandId && gameStore.entities?.hands
            ? gameStore.entities.hands[gameStore.activePlayerHandId]
            : null;

        setPlayerSpots(prevPlayers => {
            const newPlayers = [...prevPlayers];
            const centerPlayerIndex = newPlayers.findIndex(p => p.position === 'center');

            if (centerPlayerIndex !== -1 && centerPlayerIndex < newPlayers.length) {
                // Define the valid result types
                type ResultType = 'win' | 'lose' | 'push' | 'blackjack' | undefined;
                // Safely determine the result type
                let resultType: ResultType = undefined;
                if (gameStore.roundResult) {
                    if (['win', 'lose', 'push', 'blackjack'].includes(gameStore.roundResult)) {
                        resultType = gameStore.roundResult as ResultType;
                    }
                }

                newPlayers[centerPlayerIndex] = {
                    ...newPlayers[centerPlayerIndex],
                    // Convert playerHand to the expected type
                    hand: playerHand ? (playerHand as unknown) as Record<string, unknown> : null,
                    chips: gameStore?.chips || 0,
                    bet: gameStore?.bet || 0,
                    isActive: gameStore.gamePhase === 'playerTurn',
                    isCurrentPlayer: true,
                    result: resultType,
                    id: newPlayers[centerPlayerIndex]?.id ?? 1,
                    position: newPlayers[centerPlayerIndex]?.position ?? 'center'
                };
            }

            return newPlayers;
        });
    }, [
        gameStore?.entities?.hands,
        gameStore?.activePlayerHandId,
        gameStore?.gamePhase,
        gameStore?.bet,
        gameStore?.roundResult,
        gameStore?.chips
    ]);

    return playerSpots;
};

const useGameActions = (
    gameStore: ExtendedGameStore,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analytics: any,
    enhancedSettings: ExtendedEnhancedSettingsStore,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dealerHand: any,
    soundEnabled: boolean
) => {
    const basicStrategyLogic = useCallback((action: string): string => {
        return action;
    }, []);

    const recordPlayerDecision = useCallback((action: PlayerAction) => {
        if (gameStore.activePlayerHandId && dealerHand) {
            const playerHand = gameStore.entities?.hands?.[gameStore.activePlayerHandId];

            let dealerUpCard = null;
            if (dealerHand.cards && dealerHand.cards.length > 0 && dealerHand.cards[0]) {
                const firstCard = dealerHand.cards[0];
                if (typeof firstCard === 'string') {
                    dealerUpCard = gameStore.entities?.cards?.[firstCard];
                }
            }

            const recommendedAction = enhancedSettings.showBasicStrategy
                ? basicStrategyLogic(action)
                : action;

            // Create a variable that is guaranteed to be a HandEntity or an empty object with HandEntity shape
            const safePlayerHand = playerHand || {};

            analytics.recordDecision({
                playerHand: safePlayerHand,
                dealerUpCard,
                decision: action,
                recommendedDecision: recommendedAction,
                outcome: 'pending',
                betAmount: gameStore?.bet || 0,
                finalChips: gameStore?.chips || 0,
                effectiveCount: gameStore.trueCount,
                deckPenetration: gameStore.dealtCards && gameStore.shoe ?
                    gameStore.dealtCards.length / (gameStore.dealtCards.length + gameStore.shoe.length) : 0
            });
        }
    }, [gameStore, dealerHand, enhancedSettings.showBasicStrategy, analytics, basicStrategyLogic]);

    const executeGameAction = useCallback((action: PlayerAction) => {
        switch (action) {
            case 'hit':
                gameStore.hit();
                break;
            case 'stand':
                gameStore.stand();
                break;
            case 'double':
                gameStore.doubleDown();
                break;
            case 'split':
                gameStore.split();
                break;
            case 'surrender':
                gameStore.surrender();
                break;
        }
    }, [gameStore]);

    const handleBetAction = useCallback((playerId: number | string, amount: number) => {
        try {
            if (gameStore.gamePhase !== 'betting') {
                console.warn(`Cannot place bet in current game phase: ${gameStore.gamePhase}`);
                toast.error('Cannot place bet at this time', {
                    description: 'Please wait for the current action to complete',
                });
                return;
            }

            if (amount <= 0) {
                console.warn(`Invalid bet amount: ${amount}`);
                return;
            }

            if (amount > (gameStore?.chips || 0)) {
                console.warn(`Insufficient chips: ${gameStore?.chips}`);
                toast.error('Insufficient funds', {
                    description: 'You don\'t have enough chips for this bet',
                });
                return;
            }

            console.log('Placing bet:', { playerId, amount, currentPhase: gameStore.gamePhase, currentChips: gameStore.chips });

            gameStore.placeBet(amount);

            analytics.recordBet({
                amount,
                recommendedAmount: null,
                followedRecommendation: false,
                effectiveCount: gameStore.trueCount,
                deckPenetration: gameStore.dealtCards && gameStore.shoe ?
                    gameStore.dealtCards.length / (gameStore.dealtCards.length + gameStore.shoe.length) : 0,
                reason: null
            });

            if (soundEnabled) {
                ambientSounds.chips.pause();
                ambientSounds.chips.currentTime = 0;
                ambientSounds.chips.play().catch(e => console.error("Error playing chips sound:", e));
            }

            toast.success(`Bet placed: $${amount}`, {
                duration: 2000,
            });
        } catch (error) {
            console.error('Error placing bet:', error);
            toast.error('Error placing bet', {
                description: 'Please try again',
            });
        }
    }, [soundEnabled, analytics, gameStore]);

    const handleClearBet = useCallback(() => {
        try {
            if (!gameStore.bet || gameStore.bet <= 0) {
                console.log('No bet to clear');
                return;
            }

            if (gameStore.gamePhase !== 'betting') {
                console.warn(`Cannot clear bet in current game phase: ${gameStore.gamePhase}`);
                return;
            }

            console.log('Clearing current bet:', gameStore.bet);
            gameStore.clearBet();
            console.log('Bet cleared, chips restored to:', gameStore.chips);
        } catch (error) {
            console.error('Error clearing bet:', error);
        }
    }, [gameStore]);

    const handleDealCards = useCallback(() => {
        try {
            if (gameStore.gamePhase !== 'betting') {
                console.warn(`Cannot deal cards in current game phase: ${gameStore.gamePhase}`);
                toast.error('Cannot deal cards at this time');
                return;
            }

            if (!gameStore.bet || gameStore.bet <= 0) {
                console.warn('Cannot deal cards without a bet');
                toast.error('Please place a bet first');
                return;
            }

            console.log('Dealing cards...', {
                currentPhase: gameStore.gamePhase,
                currentBet: gameStore.bet,
                currentChips: gameStore.chips
            });

            gameStore.dealCards();

            if (soundEnabled) {
                ambientSounds.deal.pause();
                ambientSounds.deal.currentTime = 0;
                ambientSounds.deal.play().catch(e => console.error("Error playing deal sound:", e));
            }
        } catch (error) {
            console.error('Error dealing cards:', error);
            toast.error('Error dealing cards', {
                description: 'Please try again',
            });
        }
    }, [soundEnabled, gameStore]);

    const handlePlayerAction = useCallback((action: string) => {
        if (soundEnabled) {
            ambientSounds.buttonClick.play().catch(e => console.error("Error playing button sound:", e));
        }

        // Ensure action is a valid PlayerAction before proceeding
        if (['hit', 'stand', 'double', 'split', 'surrender'].includes(action)) {
            const validAction = action as PlayerAction;
            recordPlayerDecision(validAction);
            executeGameAction(validAction);
        } else {
            console.error(`Invalid action: ${action}`);
        }

        if (gameStore.gamePhase === 'dealerTurn') {
            setTimeout(() => {
                gameStore.playDealer();
            }, 1000);
        }
    }, [soundEnabled, gameStore, recordPlayerDecision, executeGameAction]);

    const handleTakeInsurance = useCallback(() => {
        gameStore.takeInsurance();
    }, [gameStore]);

    const handleDeclineInsurance = useCallback(() => {
        gameStore.declineInsurance();
    }, [gameStore]);

    return {
        handleBetAction,
        handleClearBet,
        handleDealCards,
        handlePlayerAction,
        handleTakeInsurance,
        handleDeclineInsurance
    };
};

const BlackjackPage = () => {
    // Use type assertions with explicit type declarations
    const gameStore = useGameStore() as unknown as ExtendedGameStore;
    const enhancedSettings = useEnhancedSettingsStore() as unknown as ExtendedEnhancedSettingsStore;
    const sideBetsStore = useSideBetsStore() as unknown as ExtendedSideBetsStore;
    const analytics = useAnalyticsStore();

    // Local state
    const [isLoading, setIsLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [activeTab, setActiveTab] = useState('game');
    const [showRulesDialog, setShowRulesDialog] = useState(false);
    const [showStrategyDialog, setShowStrategyDialog] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSideBets, setShowSideBets] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isIntroShown, setIsIntroShown] = useState(false);
    const [isGamePlaying, setIsGamePlaying] = useState(false);
    const [tutorialMode, setTutorialMode] = useState(false);
    const [welcomeShown, setWelcomeShown] = useState(false);
    const [showInsuranceDialog, setShowInsuranceDialog] = useState(false);

    // Custom hooks
    const _isMounted = useGameInitialization(
        gameStore,
        analytics,
        welcomeShown,
        setWelcomeShown,
        setIsIntroShown,
        setIsLoading
    );

    const { statusMessage, messageType } = useGameMessages(gameStore);

    useSoundEffects(soundEnabled, gameStore);

    const _playerSpots = usePlayerSpots(gameStore);

    const dealerHand = gameStore.dealerHandId && gameStore.entities?.hands
        ? gameStore.entities.hands[gameStore.dealerHandId]
        : null;

    const {
        handleBetAction,
        handleClearBet,
        handleDealCards,
        handlePlayerAction,
        handleTakeInsurance,
        handleDeclineInsurance
    } = useGameActions(
        gameStore,
        analytics,
        enhancedSettings,
        dealerHand,
        soundEnabled
    );

    // Game control actions
    const handleStartStop = useCallback(() => {
        setIsGamePlaying(prev => !prev);
    }, []);

    const handleReset = useCallback(() => {
        gameStore.resetRound();
    }, [gameStore]);

    const handleNewGame = useCallback(() => {
        gameStore.initializeGame();
    }, [gameStore]);

    const handleToggleTutorial = useCallback(() => {
        setTutorialMode(prev => !prev);
    }, []);

    // Table color from settings
    const tableColor = enhancedSettings.tableColor || '#1a5f7a';

    // Start game loop if completed or in settlement
    useEffect(() => {
        if (gameStore.gamePhase === 'completed' || gameStore.gamePhase === 'settlement') {
            const timer = setTimeout(() => {
                gameStore.resetRound();
            }, 3000);
            return () => clearTimeout(timer);
        }
        return () => { };
    }, [gameStore.gamePhase, gameStore]);

    // Game phase conversion for BlackjackTable component
    const convertGamePhase = (phase: string): GamePhaseType => {
        switch (phase) {
            case 'betting': return 'betting';
            case 'dealing': return 'dealing';
            case 'playerTurn': return 'player-turn';
            case 'dealerTurn': return 'dealer-turn';
            case 'settlement': return 'payout';
            case 'completed': return 'game-over';
            default: return 'betting';
        }
    };

    // Monitor the game store's showInsurance state
    useEffect(() => {
        setShowInsuranceDialog(gameStore.showInsurance);
    }, [gameStore.showInsurance]);

    // Loading screen
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8"
                >
                    <Image
                        src="/images/Royal-Blackjack-Logo.png"
                        alt="Royal Edge Casino"
                        className="w-auto h-24 sm:h-32"
                        width={128}
                        height={96}
                        priority
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="flex items-center space-x-2"
                >
                    <div className="w-4 h-4 rounded-full bg-amber-500 animate-bounce animation-delay-0" />
                    <div className="w-4 h-4 rounded-full bg-amber-500 animate-bounce animation-delay-200" />
                    <div className="w-4 h-4 rounded-full bg-amber-500 animate-bounce animation-delay-400" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 to-black">
            {/* Ambient lighting effects */}
            <div
                className="absolute inset-0 pointer-events-none bg-blend-overlay opacity-60 mix-blend-color-dodge table-ambient-lighting"
                data-table-color={`${tableColor}40`}
            />

            <Toaster position="top-center" expand={false} richColors />

            {/* Intro animation */}
            <AnimatePresence>
                {!isIntroShown && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            transition={{ duration: 1.2 }}
                        >
                            <Image
                                src="/images/Royal-Blackjack-Logo.png"
                                alt="Royal Edge Casino"
                                className="w-auto h-32 md:h-48"
                                width={192}
                                height={128}
                                priority
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main header */}
            <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black via-black/80 to-transparent backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="flex items-center"
                >
                    <Image
                        src="/images/Royal-Blackjack-Logo.png"
                        alt="Royal Edge Casino"
                        className="w-auto h-8 md:h-10"
                        width={40}
                        height={40}
                        priority
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="flex items-center space-x-3"
                >
                    {/* Sound toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                    >
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </Button>

                    {/* Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSettings(true)}
                        className="rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                    >
                        <Settings size={18} />
                    </Button>

                    {/* Mobile menu toggle (only on mobile) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="rounded-full md:hidden bg-black/40 backdrop-blur-sm hover:bg-black/60"
                    >
                        <Menu size={18} />
                    </Button>

                    {/* Chips display */}
                    <Badge
                        variant="outline"
                        className="px-3 py-1.5 bg-black/40 backdrop-blur-sm text-amber-300 border-amber-500/50"
                    >
                        <DollarSign className="w-4 h-4 mr-1" />
                        {(gameStore?.chips ?? 0).toLocaleString()}
                    </Badge>
                </motion.div>
            </header>

            {/* Mobile menu drawer */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 z-50 w-64 h-full p-4 border-l shadow-xl bg-slate-900/95 backdrop-blur-lg border-slate-700"
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-medium">Menu</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowMobileMenu(false)}
                                    className="rounded-full"
                                >
                                    <ChevronDown size={18} />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        setActiveTab('game');
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Main Game
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        setActiveTab('strategy');
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <Award className="w-5 h-5 mr-2" />
                                    Strategy
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        setActiveTab('analysis');
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <BarChart2 className="w-5 h-5 mr-2" />
                                    Analysis
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        setShowRulesDialog(true);
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <HelpCircle className="w-5 h-5 mr-2" />
                                    Game Rules
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        setShowSideBets(true);
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    <Zap className="w-5 h-5 mr-2" />
                                    Side Bets
                                </Button>
                            </div>

                            <div className="mt-auto">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setSoundEnabled(!soundEnabled);
                                    }}
                                >
                                    {soundEnabled ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
                                    {soundEnabled ? 'Sound On' : 'Sound Off'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main game content */}
            <main className="relative min-h-screen px-4 overflow-x-hidden pt-36 pb-28 md:px-8">
                {/* Status message display with extracted component */}
                <div className="absolute z-40 w-full max-w-md transform -translate-x-1/2 top-4 left-1/2">
                    <StatusMessage message={statusMessage} type={messageType} />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mx-auto max-w-7xl">
                    <TabsList className="mx-auto mb-4 border bg-black/50 border-slate-700 backdrop-blur-sm">
                        <TabsTrigger value="game">Main Game</TabsTrigger>
                        <TabsTrigger value="strategy">Strategy</TabsTrigger>
                        <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="game" className="focus:outline-none">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                            {/* Main blackjack table */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className="lg:col-span-3 h-[60vh] md:h-[70vh] relative"
                            >
                                <BlackjackTable
                                    dealer={{
                                        cards: dealerHand?.cards?.map((cardId) => {
                                            // Get the card data from the normalized state
                                            if (typeof cardId === 'string' && gameStore.entities?.cards) {
                                                const cardData = gameStore.entities.cards[cardId];
                                                // Create variable for suit with proper narrowing
                                                const suitValue: Suit = (cardData?.suit || 'hearts') as Suit;
                                                // Create variable for rank with proper narrowing
                                                const rankValue: Rank = (cardData?.rank || 'A') as Rank;
                                                return {
                                                    id: cardId,
                                                    suit: suitValue,
                                                    rank: rankValue
                                                };
                                            }

                                            // Fallback for missing card
                                            return {
                                                id: formatCardId(cardId),
                                                suit: 'hearts' as Suit,
                                                rank: 'A' as Rank
                                            };
                                        }) || [],
                                        isActive: gameStore.gamePhase === 'dealerTurn',
                                        result: (() => {
                                            // Determine dealer result based on game outcome
                                            if (gameStore.roundResult === 'win' || gameStore.roundResult === 'blackjack') return 'lose';
                                            if (gameStore.roundResult === 'lose' || gameStore.roundResult === 'bust') return 'win';
                                            if (gameStore.roundResult === 'push') return 'push';
                                            return undefined;
                                        })()
                                    }}
                                    players={[{
                                        id: '1',
                                        name: 'Player',
                                        balance: gameStore?.chips ?? 0,
                                        hands: [{
                                            id: '1-hand',
                                            cards: gameStore.activePlayerHandId && gameStore.entities?.hands && gameStore.entities.cards ?
                                                gameStore.entities.hands[gameStore.activePlayerHandId]?.cards?.map((cardId) => {
                                                    // Get the card data from the normalized state
                                                    if (typeof cardId === 'string') {
                                                        const cardData = gameStore.entities?.cards[cardId];
                                                        return {
                                                            id: cardId,
                                                            suit: (cardData?.suit || 'hearts') as Suit,
                                                            rank: (cardData?.rank || 'A') as Rank
                                                        };
                                                    }

                                                    // Fallback for missing card
                                                    return {
                                                        id: formatCardId(cardId),
                                                        suit: 'hearts' as Suit,
                                                        rank: 'A' as Rank
                                                    };
                                                }) || [] : [],
                                            bet: gameStore?.bet || 0,
                                            betChips: [{
                                                value: ((gameStore?.bet || 0) > 0
                                                    ? (VALID_CHIP_VALUES.find(v => v >= (gameStore?.bet || 0)) || 1000)
                                                    : 1) as ChipValue,
                                                count: 1
                                            }],
                                            isActive: gameStore.gamePhase === 'playerTurn',
                                            result: gameStore.roundResult as "win" | "lose" | "push" | "blackjack" | undefined
                                        }]
                                    }]}
                                    currentPlayerId="1"
                                    activeHandId="1-hand"
                                    gamePhase={convertGamePhase(gameStore.gamePhase)}
                                    minBet={enhancedSettings.gameRules?.minBet || 5}
                                    maxBet={enhancedSettings.gameRules?.maxBet || 500}
                                    availableActions={{
                                        hit: gameStore.gamePhase === 'playerTurn',
                                        stand: gameStore.gamePhase === 'playerTurn',
                                        double: gameStore.gamePhase === 'playerTurn' && gameStore.canDoubleDown(),
                                        split: gameStore.gamePhase === 'playerTurn' && gameStore.canSplit(),
                                        surrender: gameStore.gamePhase === 'playerTurn' && gameStore.canSurrender(),
                                        insurance: gameStore.showInsurance,
                                        deal: gameStore.gamePhase === 'betting' && (gameStore?.bet || 0) > 0
                                    }}
                                    recommendedAction={enhancedSettings.showBasicStrategy ? 'hit' : undefined}
                                    message={gameStore.message || ''}
                                    darkMode={true}
                                    onPlaceBet={(playerId, bet) => handleBetAction(playerId, bet)}
                                    onClearBet={handleClearBet}
                                    onAction={(action) => handlePlayerAction(action as PlayerAction)}
                                    onDealCards={handleDealCards}
                                />

                                {/* Game controls - positioned below the table */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.8 }}
                                    className="w-full py-4 mt-4"
                                >
                                    <GameControls
                                        gamePhase={convertGamePhase(gameStore.gamePhase)}
                                        isPlaying={isGamePlaying}
                                        isMuted={!soundEnabled}
                                        isTutorialMode={tutorialMode}
                                        isCollapsed={false}
                                        showTutorial={true}
                                        showSettings={true}
                                        showStatistics={true}
                                        onStart={handleStartStop}
                                        onStop={handleStartStop}
                                        onReset={handleReset}
                                        onNewGame={handleNewGame}
                                        onMuteToggle={() => setSoundEnabled(!soundEnabled)}
                                        onShowTutorial={handleToggleTutorial}
                                        onShowSettings={() => setShowSettings(true)}
                                        onShowStatistics={() => setActiveTab('analysis')}
                                    />
                                </motion.div>

                                {/* Probability display when enabled */}
                                {enhancedSettings.showProbabilities && gameStore.activePlayerHandId && (
                                    <div className="absolute z-20 w-64 bottom-4 left-4">
                                        <Card className="p-3 border bg-black/40 backdrop-blur-sm border-slate-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-medium">Win Probability</h4>
                                                <Badge variant="outline" className="text-green-400 border-green-500">65%</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Win</span>
                                                    <span className="text-xs font-medium text-green-400">65%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-slate-700">
                                                    <div className="h-1.5 rounded-full bg-green-500 w-65"></div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Lose</span>
                                                    <span className="text-xs font-medium text-red-400">28%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-slate-700">
                                                    <div className="h-1.5 rounded-full bg-red-500 w-28"></div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400">Push</span>
                                                    <span className="text-xs font-medium text-gray-400">7%</span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-slate-700">
                                                    <div className="h-1.5 rounded-full bg-gray-500 w-7"></div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                )}
                            </motion.div>

                            {/* Sidebar content */}
                            <div className="flex flex-col space-y-4">
                                {/* Always render GameSidebar with fallbacks for missing properties */}
                                <GameSidebar
                                    gameStore={{
                                        ...gameStore,
                                        gameState: gameStore.gameState || {
                                            currentPhase: gameStore.gamePhase,
                                            count: {
                                                running: gameStore.runningCount || 0,
                                                true: gameStore.trueCount || 0
                                            },
                                            deck: {
                                                remainingCards: gameStore.shoe?.length || 0
                                            }
                                        },
                                        lastAction: gameStore.message || ''
                                    } as unknown as GameStore}
                                    enhancedSettings={{
                                        ...enhancedSettings,
                                        countingSystem: enhancedSettings.showCountingInfo ? 'hi-lo' : 'none'
                                    } as unknown as EnhancedSettingsStore}
                                    analytics={{
                                        ...analytics,
                                        gameStats: {
                                            handsPlayed: analytics.gameStats?.handsPlayed || 0,
                                            handsWon: analytics.gameStats?.handsWon || 0,
                                            handsLost: analytics.gameStats?.handsLost || 0,
                                            handsPushed: analytics.gameStats?.pushes || 0,
                                            blackjacks: analytics.gameStats?.handsWon || 0,
                                            netProfit: analytics.gameStats?.netProfit || 0
                                        }
                                    }}
                                    setShowRulesDialog={setShowRulesDialog}
                                    setShowBasicStrategyDialog={setShowStrategyDialog}
                                />

                                {/* Strategy advisor */}
                                {gameStore.gamePhase === 'playerTurn' && enhancedSettings.showBasicStrategy && (
                                    <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                        <h3 className="mb-2 text-sm font-medium">Strategy Advice</h3>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center">
                                                <Badge variant="secondary" className="mr-2 text-green-400 bg-green-500/20 border-green-500/50">
                                                    Hit
                                                </Badge>
                                                <span className="text-xs text-gray-400">Recommended move</span>
                                            </div>
                                            <span className="text-xs font-medium text-green-400">95% confidence</span>
                                        </div>
                                        <div className="p-3 rounded-md bg-black/20">
                                            <p className="text-xs text-gray-300">
                                                Based on basic strategy, you should hit when you have 14 against a dealer&apos;s 10.
                                                This gives you the best mathematical chance of winning.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs text-green-400 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
                                                onClick={() => handlePlayerAction('hit')}
                                            >
                                                Hit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => handlePlayerAction('stand')}
                                            >
                                                Stand
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                disabled={!gameStore.canDoubleDown?.()}
                                                onClick={() => handlePlayerAction('double')}
                                            >
                                                Double
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                disabled={!gameStore.canSplit?.()}
                                                onClick={() => handlePlayerAction('split')}
                                            >
                                                Split
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                disabled={!gameStore.canSurrender?.()}
                                                onClick={() => handlePlayerAction('surrender')}
                                            >
                                                Surr.
                                            </Button>
                                        </div>
                                    </Card>
                                )}

                                {/* Auto-play strategy option */}
                                {enhancedSettings.showBasicStrategy && (
                                    <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                        <div className="flex items-center justify-between space-x-4">
                                            <div>
                                                <h3 className="text-sm font-medium">Auto-Play Basic Strategy</h3>
                                                <p className="text-xs text-gray-400">Let the computer play perfect strategy</p>
                                            </div>
                                            <Switch
                                                checked={enhancedSettings.showBasicStrategy}
                                                onCheckedChange={(checked) => {
                                                    enhancedSettings.updateSettings?.({ showBasicStrategy: checked });
                                                }}
                                            />
                                        </div>
                                        {enhancedSettings.showBasicStrategy && (
                                            <div className="p-2 mt-3 rounded-md bg-black/20">
                                                <div className="flex items-center text-sm">
                                                    <Zap className="w-4 h-4 mr-2 text-amber-400" />
                                                    <span>Recommended move: <span className="font-medium text-green-400">Hit</span></span>
                                                </div>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Basic strategy recommends hitting on this hand against dealer&apos;s upcard.
                                                </p>
                                            </div>
                                        )}
                                    </Card>
                                )}
                            </div>
                        </div>

                        {/* Betting controls - fixed position at bottom of screen with proper z-index */}
                        {(gameStore.gamePhase === 'betting' || gameStore.gamePhase === 'waiting' || gameStore.gamePhase === 'initial') && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black to-transparent"
                            >
                                <div className="max-w-md mx-auto">
                                    <BettingControls
                                        balance={gameStore?.chips ?? 0}
                                        maxBet={enhancedSettings.gameRules?.maxBet || 500}
                                        minBet={enhancedSettings.gameRules?.minBet || 5}
                                        currentBet={gameStore?.bet || 0}
                                        onPlaceBet={(amount) => handleBetAction('1', amount)}
                                        onClearBet={handleClearBet}
                                        disabled={gameStore.gamePhase !== 'betting' && gameStore.gamePhase !== 'waiting' && gameStore.gamePhase !== 'initial'}
                                        className="p-4 border rounded-lg bg-black/70 backdrop-blur-sm border-slate-700"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </TabsContent>

                    <TabsContent value="strategy" className="focus:outline-none">
                        {/* Strategy card tabs */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <Card className="border bg-black/30 backdrop-blur-sm border-slate-700 md:col-span-2">
                                <Tabs defaultValue="hard" className="p-4">
                                    <TabsList className="mb-4 bg-slate-800 border-slate-700">
                                        <TabsTrigger value="hard">Hard Hands</TabsTrigger>
                                        <TabsTrigger value="soft">Soft Hands</TabsTrigger>
                                        <TabsTrigger value="pairs">Pairs</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="hard">
                                        <StrategyCard activeView="hard" />
                                    </TabsContent>

                                    <TabsContent value="soft">
                                        <StrategyCard activeView="soft" />
                                    </TabsContent>

                                    <TabsContent value="pairs">
                                        <StrategyCard activeView="pairs" />
                                    </TabsContent>
                                </Tabs>
                            </Card>

                            <div className="space-y-6">
                                <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                    <h3 className="mb-3 text-lg font-semibold text-white">Strategy Tips</h3>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-300">Always follow basic strategy for optimal results.</p>
                                        <p className="text-sm text-gray-300">Consider increasing your bets when the count is positive.</p>
                                        <p className="text-sm text-gray-300">Insurance is rarely a good bet unless the count is very high.</p>
                                    </div>
                                </Card>

                                <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                    <h3 className="mb-3 text-lg font-semibold text-white">Card Counting</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Running Count:</span>
                                            <span className={`font-semibold ${getRunningCountTextColor(gameStore.runningCount)}`}>
                                                {gameStore.runningCount > 0 ? `+${gameStore.runningCount}` : gameStore.runningCount}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">True Count:</span>
                                            <span className={`font-semibold ${getCountTextColor(gameStore.trueCount || 0)}`}>
                                                {gameStore.trueCount !== undefined ? gameStore.trueCount.toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Cards Dealt:</span>
                                            <span className="font-semibold text-white">{gameStore.dealtCards?.length || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Cards Remaining:</span>
                                            <span className="font-semibold text-white">{gameStore.shoe?.length || 0}</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                    <h3 className="mb-3 text-lg font-semibold text-white">Your Strategy Stats</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Basic Strategy Accuracy:</span>
                                            <span className="font-semibold text-green-400">85%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-300">Bet Correlation with Count:</span>
                                            <span className="font-semibold text-amber-400">67%</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="analysis" className="focus:outline-none">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Win/Loss Analysis */}
                            <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700 lg:col-span-3">
                                <h3 className="mb-3 text-lg font-semibold text-white">Performance Analytics</h3>
                                <div className="w-full h-64">
                                    {/* Chart will be implemented here */}
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <BarChart2 className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                                            <p className="text-slate-400">Play more hands to see your performance analytics</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Game statistics */}
                            <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                <h3 className="mb-3 text-lg font-semibold text-white">Session Stats</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-lg bg-black/20">
                                            <div className="text-sm text-gray-400">Hands Played</div>
                                            <div className="text-2xl font-bold">{analytics.gameStats.handsPlayed}</div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/20">
                                            <div className="text-sm text-gray-400">Win Rate</div>
                                            <div className="text-2xl font-bold text-green-400">
                                                {analytics.gameStats.handsPlayed > 0 ?
                                                    `${Math.round((analytics.gameStats.handsWon / analytics.gameStats.handsPlayed) * 100)}%` :
                                                    '0%'}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/20">
                                            <div className="text-sm text-gray-400">Profit/Loss</div>
                                            <div className={`text-2xl font-bold ${analytics.gameStats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                ${analytics.gameStats.netProfit}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/20">
                                            <div className="text-sm text-gray-400">Avg. Bet</div>
                                            <div className="text-2xl font-bold text-amber-400">
                                                ${analytics.gameStats.handsPlayed > 0 ?
                                                    Math.round(analytics.gameStats.netProfit / analytics.gameStats.handsPlayed) :
                                                    0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Betting Patterns */}
                            <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                <h3 className="mb-3 text-lg font-semibold text-white">Betting Patterns</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Betting Efficiency</span>
                                        <span className="text-sm text-green-400">Good</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-700">
                                        <div className="h-2 bg-green-500 rounded-full w-65"></div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Your betting pattern shows good correlation with the count.
                                    </p>

                                    <div className="mt-4">
                                        <h4 className="mb-2 text-sm font-medium text-white">Recommendations:</h4>
                                        <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                                            <li>Increase your bet spread for better results</li>
                                            <li>Bet more aggressively on positive counts</li>
                                            <li>Maintain minimum bets on negative counts</li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>

                            {/* Decision Analysis */}
                            <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700">
                                <h3 className="mb-3 text-lg font-semibold text-white">Decision Analysis</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-400">Strategy Adherence</span>
                                        <span className="text-sm text-amber-400">Moderate</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-700">
                                        <div className="h-2 rounded-full bg-amber-500 w-55"></div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-sm text-gray-400">Deviations Accuracy</span>
                                        <span className="text-sm text-red-400">Low</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-slate-700">
                                        <div className="h-2 bg-red-500 rounded-full w-35"></div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="mb-2 text-sm font-medium text-white">Improvement Areas:</h4>
                                        <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                                            <li>Review basic strategy for hard 16 vs dealer 10</li>
                                            <li>Improve decisions on soft 18 vs dealer 9+</li>
                                            <li>Consider surrender more often with 16 vs 9-A</li>
                                        </ul>
                                    </div>
                                </div>
                            </Card>

                            {/* Counting Display */}
                            <Card className="p-4 border bg-black/30 backdrop-blur-sm border-slate-700 lg:col-span-3">
                                <CountingDisplay
                                    compact
                                    playedCards={gameStore.activePlayerHandId && gameStore.entities?.hands ?
                                        gameStore.entities.hands[gameStore.activePlayerHandId]?.cards?.map((cardId) => {
                                            // Handle both string IDs and card objects
                                            const cardKey = getCardKey(cardId);

                                            return {
                                                id: String(cardKey),
                                                suit: (gameStore.entities?.cards?.[cardKey]?.suit ?? 'hearts') as Suit,
                                                rank: (gameStore.entities?.cards?.[cardKey]?.rank ?? 'A') as Rank
                                            };
                                        }) || [] : []}
                                    deckCount={6}
                                    autoCount={true}
                                    showCardValues={true}
                                    showRecommendation={true}
                                    onRunningCountChange={(count: number, trueCount: number) => {
                                        // Explicitly use the parameters to avoid lint errors
                                        console.log(`Running count: ${count}, True count: ${trueCount}`);
                                        // Additional logic can be added here if needed
                                    }}
                                />
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Modal dialogs */}

            {/* Rules dialog */}
            <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Game Rules</DialogTitle>
                    <RuleConfiguration
                        onClose={() => setShowRulesDialog(false)}
                        onRulesChanged={() => {
                            // Re-initialize game with new rules - safely handle potential missing property
                            if (enhancedSettings.gameRules && typeof gameStore.updateRules === 'function') {
                                gameStore.updateRules(enhancedSettings.gameRules);
                            } else {
                                // Fallback to reset if needed
                                gameStore.initializeGame();
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Strategy dialog */}
            <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Basic Strategy</DialogTitle>
                    <StrategyCard
                        activeType="basic"
                        activeView="hard"
                        highlightActive={true}
                        trueCount={gameStore.trueCount}
                        playerCards={gameStore.activePlayerHandId && gameStore.entities?.hands ?
                            gameStore.entities.hands[gameStore.activePlayerHandId]?.cards?.map((cardId) => {
                                // Handle both string IDs and card objects
                                const cardKey = getCardKey(cardId);

                                return {
                                    id: String(cardKey),
                                    suit: (gameStore.entities?.cards?.[cardKey]?.suit ?? 'hearts') as Suit,
                                    rank: (gameStore.entities?.cards?.[cardKey]?.rank ?? 'A') as Rank
                                };
                            }) || [] : []}
                        dealerUpcard={dealerHand?.cards && dealerHand.cards.length > 0 ? {
                            id: formatCardId(dealerHand.cards[0]),
                            suit: (dealerHand.cards[0] && typeof dealerHand.cards[0] === 'string'
                                ? (gameStore.entities?.cards?.[dealerHand.cards[0]]?.suit ?? 'hearts')
                                : 'hearts') as Suit,
                            rank: (dealerHand.cards[0] && typeof dealerHand.cards[0] === 'string'
                                ? (gameStore.entities?.cards?.[dealerHand.cards[0]]?.rank ?? 'A')
                                : 'A') as Rank
                        } : null}
                        showDeviation={true}
                        fullScreenEnabled={true}
                    />
                </DialogContent>
            </Dialog>

            {/* Settings dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Game Settings</DialogTitle>
                    <DialogDescription>
                        Customize your blackjack experience
                    </DialogDescription>
                    <Tabs defaultValue="gameplay">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="gameplay">Gameplay</TabsTrigger>
                            <TabsTrigger value="display">Display</TabsTrigger>
                            <TabsTrigger value="audio">Audio</TabsTrigger>
                        </TabsList>

                        <TabsContent value="gameplay" className="py-4 space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium">Auto-Play Basic Strategy</h4>
                                        <p className="text-xs text-muted-foreground">Let the computer play perfect basic strategy for you</p>
                                    </div>
                                    <Switch
                                        checked={enhancedSettings.showBasicStrategy}
                                        onCheckedChange={(checked) => {
                                            enhancedSettings.updateSettings?.({ showBasicStrategy: checked });
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium">Show Probabilities</h4>
                                        <p className="text-xs text-muted-foreground">Display win/lose probabilities during gameplay</p>
                                    </div>
                                    <Switch
                                        checked={enhancedSettings.showProbabilities}
                                        onCheckedChange={(checked) => {
                                            enhancedSettings.updateSettings?.({ showProbabilities: checked });
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium">Counting Info</h4>
                                        <p className="text-xs text-muted-foreground">Show card counting information</p>
                                    </div>
                                    <Switch
                                        checked={enhancedSettings.showCountingInfo || false}
                                        onCheckedChange={(checked) => {
                                            // Apply settings if the update function exists
                                            if (typeof enhancedSettings.updateSettings === 'function') {
                                                enhancedSettings.updateSettings({ showCountingInfo: checked });
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium">Confirm Actions</h4>
                                        <p className="text-xs text-muted-foreground">Ask for confirmation before major actions</p>
                                    </div>
                                    <Switch
                                        checked={enhancedSettings.confirmActions}
                                        onCheckedChange={(checked) => {
                                            const safeUpdateSettings = (settings: Record<string, unknown>) => {
                                                if (typeof enhancedSettings.updateSettings === 'function') {
                                                    enhancedSettings.updateSettings(settings);
                                                }
                                            };
                                            safeUpdateSettings({ confirmActions: checked });
                                        }}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="display" className="py-4 space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="mb-2 text-sm font-medium">Card Style</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Button
                                            variant={(enhancedSettings.cardStyle ?? 'modern') === 'modern' ? 'default' : 'outline'}
                                            onClick={() => {
                                                enhancedSettings.updateSettings?.({ cardStyle: 'modern' });
                                            }}
                                            className="flex flex-col items-center justify-center w-full h-24"
                                        >
                                            <span className="block mb-1 text-xs">Modern</span>
                                            <div className="flex items-center justify-center w-10 text-blue-500 border rounded-md h-14 bg-gradient-to-br from-sky-100 to-white"></div>
                                        </Button>

                                        <Button
                                            variant={(enhancedSettings.cardStyle ?? 'classic') === 'classic' ? 'default' : 'outline'}
                                            onClick={() => {
                                                enhancedSettings.updateSettings?.({ cardStyle: 'classic' });
                                            }}
                                            className="flex flex-col items-center justify-center w-full h-24"
                                        >
                                            <span className="block mb-1 text-xs">Classic</span>
                                            <div className="flex items-center justify-center w-10 text-green-500 border rounded-md h-14 bg-gradient-to-br from-green-50 to-white"></div>
                                        </Button>

                                        <Button
                                            variant={(enhancedSettings.cardStyle ?? 'classic') === 'retro' ? 'default' : 'outline'}
                                            onClick={() => {
                                                enhancedSettings.updateSettings?.({ cardStyle: 'retro' });
                                            }}
                                            className="flex flex-col items-center justify-center w-full h-24"
                                        >
                                            <span className="block mb-1 text-xs">Retro</span>
                                            <div className="flex items-center justify-center w-10 text-red-500 border rounded-md h-14 bg-gradient-to-br from-amber-50 to-white"></div>
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-2 text-sm font-medium">Table Color</h4>
                                    <div className="grid grid-cols-4 gap-3">
                                        <Button
                                            variant={enhancedSettings.tableColor === '#076324' ? 'default' : 'outline'}
                                            onClick={() => enhancedSettings.updateSettings?.({ tableColor: '#076324' })}
                                            className="w-full h-10"
                                            style={{ backgroundColor: '#076324', color: 'white' }}
                                        >
                                            Classic
                                        </Button>

                                        <Button
                                            variant={enhancedSettings.tableColor === '#1a5f7a' ? 'default' : 'outline'}
                                            onClick={() => enhancedSettings.updateSettings?.({ tableColor: '#1a5f7a' })}
                                            className="w-full h-10"
                                            style={{ backgroundColor: '#1a5f7a', color: 'white' }}
                                        >
                                            Azure
                                        </Button>

                                        <Button
                                            variant={enhancedSettings.tableColor === '#7a1a5f' ? 'default' : 'outline'}
                                            onClick={() => enhancedSettings.updateSettings?.({ tableColor: '#7a1a5f' })}
                                            className="w-full h-10"
                                            style={{ backgroundColor: '#7a1a5f', color: 'white' }}
                                        >
                                            Magenta
                                        </Button>

                                        <Button
                                            variant={enhancedSettings.tableColor === '#5f7a1a' ? 'default' : 'outline'}
                                            onClick={() => enhancedSettings.updateSettings?.({ tableColor: '#5f7a1a' })}
                                            className="w-full h-10"
                                            style={{ backgroundColor: '#5f7a1a', color: 'white' }}
                                        >
                                            Olive
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-2 text-sm font-medium">Animation Speed</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <Button
                                            variant={enhancedSettings.animationSpeed === 'slow' ? 'default' : 'outline'}
                                            onClick={() => enhancedSettings.updateSettings?.({ animationSpeed: 'slow' })}
                                        >
                                            Slow
                                        </Button>

                                        <Button
                                            variant={enhancedSettings.animationSpeed === 'normal' ? 'default' : 'outline'}
                                            onClick={() => enhancedSettings.updateSettings?.({ animationSpeed: 'normal' })}
                                        >
                                            Normal
                                        </Button>

                                        <Button
                                            variant={enhancedSettings.animationSpeed === 'fast' ? 'default' : 'outline'}
                                            onClick={() => enhancedSettings.updateSettings?.({ animationSpeed: 'fast' })}
                                        >
                                            Fast
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="audio" className="py-4 space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium">Sound Effects</h4>
                                        <p className="text-xs text-muted-foreground">Enable sound effects during gameplay</p>
                                    </div>
                                    <Switch
                                        checked={soundEnabled}
                                        onCheckedChange={setSoundEnabled}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Music Volume</h4>
                                <div className="w-full h-2 rounded-full bg-slate-700">
                                    <div className="h-2 bg-blue-500 rounded-full w-30"></div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowSettings(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            setShowSettings(false);
                            toast.success('Settings saved', {
                                description: 'Your preferences have been updated',
                            });
                        }}>
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Side Bets Dialog */}
            <Dialog open={showSideBets} onOpenChange={setShowSideBets}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Side Bets</DialogTitle>
                    <SideBetsPanel
                        playerChips={gameStore?.chips || 0}
                        availableBets={
                            // Extract nested ternary to independent variable
                            (() => {
                                if (typeof sideBetsStore.getAvailableBets !== 'function') {
                                    return { 'perfect-pairs': true };
                                }

                                const availableBets = sideBetsStore.getAvailableBets();
                                if (!Array.isArray(availableBets)) {
                                    return { 'perfect-pairs': true };
                                }

                                return availableBets.reduce((acc, bet) => ({ ...acc, [bet.id]: true }), {});
                            })()
                        }
                        currentBets={
                            // Use a safe getter with fallback
                            typeof sideBetsStore.getBets === 'function'
                                ? sideBetsStore.getBets()
                                : []
                        }
                        onPlaceBet={(type, amount) => {
                            // Safely call placeBet with a fallback
                            if (typeof sideBetsStore.placeBet === 'function') {
                                sideBetsStore.placeBet(type, amount);
                            } else {
                                console.log(`Would place bet: ${type}, ${amount}`);
                                // Ensure we have updateChips as a fallback
                                if (typeof gameStore.updateChips === 'function') {
                                    gameStore.updateChips((gameStore?.chips || 0) - amount);
                                }
                            }

                            toast.success(`Side bet placed: ${amount}`, {
                                description: `${type} bet has been placed.`,
                            });
                        }}
                        onClose={() => setShowSideBets(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Insurance dialog */}
            <Dialog open={showInsuranceDialog} onOpenChange={setShowInsuranceDialog}>
                <DialogContent className="max-w-md">
                    <DialogTitle>Insurance Offered</DialogTitle>
                    <div className="py-4">
                        <p className="mb-4">Dealer is showing an Ace. Would you like to take insurance?</p>
                        <p className="mb-4 text-sm text-slate-400">Insurance costs half your original bet and pays 2:1 if the dealer has blackjack.</p>

                        <div className="flex justify-center mt-6 space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    handleDeclineInsurance();
                                    setShowInsuranceDialog(false);
                                }}
                            >
                                No Thanks
                            </Button>
                            <Button
                                onClick={() => {
                                    handleTakeInsurance();
                                    setShowInsuranceDialog(false);
                                }}
                            >
                                Take Insurance
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default function BlackjackPageWrapper() {
    return <BlackjackPage />;
}