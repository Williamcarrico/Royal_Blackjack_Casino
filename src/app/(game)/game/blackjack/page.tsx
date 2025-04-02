'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import useGameStore from '@/store/gameStore';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { GameStore } from '@/types/storeTypes';
import type { Suit, Rank, Card } from '@/types/cardTypes';
import type { ChipValue } from '@/components/betting/Chip';
import type { GamePhase } from '@/types/gameTypes';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import StrategyCard from '@/components/strategy/StrategyCard';
import { RuleConfiguration } from '@/components/game/rules/RuleConfiguration';
import { GameSidebar } from '@/components/game/controls/GameSidebar';
import GameControls from '@/components/game/controls/GameControls';

// Define valid chip values
const VALID_CHIP_VALUES: readonly ChipValue[] = [1, 5, 10, 25, 50, 100, 500, 1000];

// Message type for status messages
type MessageType = 'info' | 'success' | 'warning' | 'error';

// Define player action type
type PlayerAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

// Extend with additional properties for implementation
interface ExtendedGameState {
    isInitialized?: boolean;
    message?: string;
    gamePhase?: string;
    roundResult?: string | null;
    activePlayerHandId?: string | null;
    dealerHandId?: string | null;
    entities?: {
        hands?: Record<string, any>;
        cards?: Record<string, any>;
    };
    shoe?: string[];
    dealtCards?: string[];
    runningCount?: number;
    trueCount?: number;
    showInsurance?: boolean;
    canDoubleDown?: () => boolean;
    canSplit?: () => boolean;
    canSurrender?: () => boolean;
    takeInsurance?: () => void;
    declineInsurance?: () => void;
    playDealer?: () => void;
    updateRules?: (rules: any) => void;
    clearBet?: () => void;
    doubleDown?: () => void;
    bet?: number;
    chips?: number;
}

// Extended settings interface
interface ExtendedSettingsStore {
    gameRules?: {
        minBet?: number;
        maxBet?: number;
    };
    showCountingInfo?: boolean;
    showBasicStrategy?: boolean;
    showProbabilities?: boolean;
    tableColor?: string;
}

// Player spot interface
interface PlayerSpot {
    id: number;
    position: string;
    hand: any;
    chips: number;
    bet: number;
    isActive: boolean;
    isCurrentPlayer: boolean;
    result?: 'win' | 'lose' | 'push' | 'blackjack';
}

// Game UI state interface
interface GameUIState {
    isLoading: boolean;
    soundEnabled: boolean;
    activeTab: string;
    showRulesDialog: boolean;
    showStrategyDialog: boolean;
    showSettings: boolean;
    showMobileMenu: boolean;
    isIntroShown: boolean;
    isGamePlaying: boolean;
    tutorialMode: boolean;
    welcomeShown: boolean;
    showInsuranceDialog: boolean;
    showSideBets: boolean;
}

// Audio tracks reference type
type AudioTracks = {
    music: HTMLAudioElement | null;
    deal: HTMLAudioElement | null;
    win: HTMLAudioElement | null;
    chips: HTMLAudioElement | null;
    shuffle: HTMLAudioElement | null;
    buttonClick: HTMLAudioElement | null;
};

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
        // Create a more specific identifier for objects
        try {
            return `card-${JSON.stringify(cardId)}`;
        } catch {
            return `card-object-${Math.random().toString(36).substring(2, 9)}`;
        }
    }
    // For numbers or other primitives
    return `card-${String(cardId)}`;
};

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

// Custom hook to track if component is mounted
function useIsMounted() {
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return isMountedRef;
}

// Status Message Component
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

// Extract game message logic to a custom hook
function useGameMessages(gameState: ExtendedGameState): {
    statusMessage: string;
    messageType: MessageType
} {
    const [statusMessage, setStatusMessage] = useState('');
    const [messageType, setMessageType] = useState<MessageType>('info');

    // Memoize message type determination function to prevent recreating on each render
    const getMessageType = useCallback((message: string): MessageType => {
        if (message.includes('win') || message.includes('blackjack')) return 'success';
        if (message.includes('lose') || message.includes('bust')) return 'error';
        if (message.includes('push')) return 'warning';
        return 'info';
    }, []);

    // Memoize settlement message generation
    const getSettlementMessage = useCallback((result: string | null, bet: number): [string, MessageType] => {
        if (result === 'win') return [`You won $${bet}!`, 'success'];
        if (result === 'lose') return [`You lost $${bet}`, 'error'];
        if (result === 'push') return ['Push - your bet is returned', 'warning'];
        if (result === 'blackjack') return [`Blackjack! You won $${Math.floor(bet * 1.5)}!`, 'success'];
        return ['Round complete', 'info'];
    }, []);

    // Memoize default status message generation
    const getDefaultStatusMessage = useCallback((
        phase: string | undefined,
        bet: number,
        result: string | null
    ): [string, MessageType] => {
        switch (phase) {
            case 'betting':
                return [bet > 0 ? `` : 'Place your bet to start a new hand', 'info'];
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

    // Update message based on game state
    useEffect(() => {
        if (gameState.message) {
            if (!gameState.message.includes('Bet placed:')) {
                setStatusMessage(gameState.message);
                setMessageType(getMessageType(gameState.message));
            } else {
                setStatusMessage('');
                setMessageType('info');
            }
        } else {
            const [message, type] = getDefaultStatusMessage(
                gameState.gamePhase,
                gameState?.bet || 0,
                gameState.roundResult ?? null
            );
            setStatusMessage(message);
            setMessageType(type);
        }
    }, [
        gameState.message,
        gameState.gamePhase,
        gameState.roundResult,
        gameState?.bet,
        getMessageType,
        getDefaultStatusMessage
    ]);

    return { statusMessage, messageType };
}

// Extract sound effects logic to a custom hook with improved audio handling
function useSoundEffects(soundEnabled: boolean, gameState: ExtendedGameState) {
    // Use ref to store audio elements to prevent recreation on every render
    const audioRef = useRef<AudioTracks>({
        music: null,
        deal: null,
        win: null,
        chips: null,
        shuffle: null,
        buttonClick: null
    });

    // Initialize audio elements once
    useEffect(() => {
        // Only create audio objects if they don't exist yet
        if (!audioRef.current.music) {
            audioRef.current.music = new Audio('/sounds/casino-ambience.mp3');
            audioRef.current.music.loop = true;
            audioRef.current.music.volume = 0.5;
        }
        if (!audioRef.current.deal) {
            audioRef.current.deal = new Audio('/sounds/card-deal.mp3');
            audioRef.current.deal.volume = 0.5;
        }
        if (!audioRef.current.win) {
            audioRef.current.win = new Audio('/sounds/win.mp3');
            audioRef.current.win.volume = 0.5;
        }
        if (!audioRef.current.chips) {
            audioRef.current.chips = new Audio('/sounds/chips.mp3');
            audioRef.current.chips.volume = 0.5;
        }
        if (!audioRef.current.shuffle) {
            audioRef.current.shuffle = new Audio('/sounds/shuffle.mp3');
            audioRef.current.shuffle.volume = 0.5;
        }
        if (!audioRef.current.buttonClick) {
            audioRef.current.buttonClick = new Audio('/sounds/button-click.mp3');
            audioRef.current.buttonClick.volume = 0.5;
        }

        // Proper cleanup on component unmount
        return () => {
            Object.values(audioRef.current).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.src = "";
                }
            });

            // Clear references
            audioRef.current = {
                music: null,
                deal: null,
                win: null,
                chips: null,
                shuffle: null,
                buttonClick: null
            };
        };
    }, []); // Only run once on mount

    // Handle background music based on sound enabled state
    useEffect(() => {
        const music = audioRef.current.music;
        if (!music) return;

        if (soundEnabled) {
            // Only play if not already playing
            if (music.paused) {
                music.play().catch(e => console.error("Error playing ambient sound:", e));
            }
        } else {
            music.pause();
        }

        return () => {
            // No need to handle cleanup here as it's done in the main effect
        };
    }, [soundEnabled]);

    // Handle game state specific sounds
    useEffect(() => {
        if (!soundEnabled) return;

        const { deal, win, chips } = audioRef.current;

        // Safety check
        if (!deal || !win || !chips) return;

        try {
            if (gameState?.gamePhase === 'dealing') {
                // Ensure other sounds are stopped
                win.pause();
                win.currentTime = 0;
                chips.pause();
                chips.currentTime = 0;

                // Play deal sound
                deal.currentTime = 0;
                deal.play().catch(e => console.error("Error playing deal sound:", e));
            } else if (gameState?.gamePhase === 'settlement' && gameState?.roundResult === 'win') {
                // Ensure other sounds are stopped
                deal.pause();
                deal.currentTime = 0;
                chips.pause();
                chips.currentTime = 0;

                // Play win sound
                win.currentTime = 0;
                win.play().catch(e => console.error("Error playing win sound:", e));
            } else if (gameState?.gamePhase === 'betting' && (gameState?.bet || 0) > 0) {
                // Ensure other sounds are stopped
                deal.pause();
                deal.currentTime = 0;
                win.pause();
                win.currentTime = 0;

                // Play chips sound
                chips.currentTime = 0;
                chips.play().catch(e => console.error("Error playing chips sound:", e));
            }
        } catch (error) {
            console.error("Error managing game sounds:", error);
        }
    }, [soundEnabled, gameState?.gamePhase, gameState?.roundResult, gameState?.bet]);

    // Sound effect functions
    const playButtonSound = useCallback(() => {
        if (!soundEnabled || !audioRef.current.buttonClick) return;

        try {
            const buttonSound = audioRef.current.buttonClick;
            buttonSound.currentTime = 0;
            buttonSound.play().catch(e => console.error("Error playing button sound:", e));
        } catch (error) {
            console.error("Error playing button sound:", error);
        }
    }, [soundEnabled]);

    const playChipsSound = useCallback(() => {
        if (!soundEnabled || !audioRef.current.chips) return;

        try {
            const chipsSound = audioRef.current.chips;
            chipsSound.currentTime = 0;
            chipsSound.play().catch(e => console.error("Error playing chips sound:", e));
        } catch (error) {
            console.error("Error playing chips sound:", error);
        }
    }, [soundEnabled]);

    const playDealSound = useCallback(() => {
        if (!soundEnabled || !audioRef.current.deal) return;

        try {
            const dealSound = audioRef.current.deal;
            dealSound.currentTime = 0;
            dealSound.play().catch(e => console.error("Error playing deal sound:", e));
        } catch (error) {
            console.error("Error playing deal sound:", error);
        }
    }, [soundEnabled]);

    return { playButtonSound, playChipsSound, playDealSound };
}

// Extract player spots and dealer hand logic with reduced dependencies
function useGameEntities(gameState: ExtendedGameState) {
    // Player spots state
    const [playerSpots, setPlayerSpots] = useState<PlayerSpot[]>([{
        id: 1,
        position: 'center',
        hand: null,
        chips: gameState?.chips || 1500,
        bet: 0,
        isActive: false,
        isCurrentPlayer: true,
    }]);

    // Memoize player hand data to reduce dependencies and prevent unnecessary updates
    const playerHandInfo = useMemo(() => ({
        hand: gameState.activePlayerHandId && gameState.entities?.hands
            ? gameState.entities.hands[gameState.activePlayerHandId]
            : null,
        chips: gameState?.chips || 0,
        bet: gameState?.bet || 0,
        isActive: gameState.gamePhase === 'playerTurn',
        result: gameState.roundResult as 'win' | 'lose' | 'push' | 'blackjack' | undefined
    }), [
        gameState.activePlayerHandId,
        gameState.entities?.hands,
        gameState?.chips,
        gameState?.bet,
        gameState.gamePhase,
        gameState.roundResult
    ]);

    // Update player spots based on memoized data
    useEffect(() => {
        setPlayerSpots(prevPlayers => {
            const newPlayers = [...prevPlayers];
            const centerPlayerIndex = newPlayers.findIndex(p => p.position === 'center');

            if (centerPlayerIndex !== -1 && centerPlayerIndex < newPlayers.length) {
                newPlayers[centerPlayerIndex] = {
                    ...newPlayers[centerPlayerIndex],
                    hand: playerHandInfo.hand,
                    chips: playerHandInfo.chips,
                    bet: playerHandInfo.bet,
                    isActive: playerHandInfo.isActive,
                    isCurrentPlayer: true,
                    result: playerHandInfo.result,
                    id: newPlayers[centerPlayerIndex]?.id ?? 1,
                    position: newPlayers[centerPlayerIndex]?.position ?? 'center'
                };
            }

            return newPlayers;
        });
    }, [playerHandInfo]);

    // Memoize dealer hand to prevent unnecessary re-renders
    const dealerHand = useMemo(() =>
        gameState.dealerHandId && gameState.entities?.hands
            ? gameState.entities.hands[gameState.dealerHandId]
            : null,
        [gameState.dealerHandId, gameState.entities?.hands]
    );

    return { playerSpots, dealerHand };
}

// Extract validation logic with improved error handling
function useValidations(gameState: ExtendedGameState) {
    const validateBetAction = useCallback((amount: number): { isValid: boolean; errorMessage?: string } => {
        if (gameState?.gamePhase !== 'betting') {
            return {
                isValid: false,
                errorMessage: 'Cannot place bet at this time. Please wait for the current action to complete.'
            };
        }

        if (amount <= 0) {
            return {
                isValid: false,
                errorMessage: 'Please select a valid bet amount.'
            };
        }

        if (amount > (gameState?.chips || 0)) {
            return {
                isValid: false,
                errorMessage: 'Insufficient funds. You don\'t have enough chips for this bet.'
            };
        }

        return { isValid: true };
    }, [gameState?.gamePhase, gameState?.chips]);

    const validateClearBet = useCallback((): { isValid: boolean; reason?: string } => {
        if (!gameState?.bet || gameState.bet <= 0) {
            return { isValid: false, reason: 'no-bet' };
        }

        if (gameState?.gamePhase !== 'betting') {
            return { isValid: false, reason: 'wrong-phase' };
        }

        return { isValid: true };
    }, [gameState?.bet, gameState?.gamePhase]);

    const validateDealCards = useCallback((): { isValid: boolean; errorMessage?: string } => {
        if (gameState?.gamePhase !== 'betting') {
            return {
                isValid: false,
                errorMessage: 'Cannot deal cards at this time'
            };
        }

        if (!gameState?.bet || gameState.bet <= 0) {
            return {
                isValid: false,
                errorMessage: 'Please place a bet first'
            };
        }

        return { isValid: true };
    }, [gameState?.gamePhase, gameState?.bet]);

    return { validateBetAction, validateClearBet, validateDealCards };
}

// Extract game action handlers with improved error handling
function useGameActions(
    gameStore: any,
    gameState: ExtendedGameState,
    analytics: any,
    validations: {
        validateBetAction: (amount: number) => { isValid: boolean; errorMessage?: string },
        validateClearBet: () => { isValid: boolean; reason?: string },
        validateDealCards: () => { isValid: boolean; errorMessage?: string }
    },
    soundEffects: {
        playButtonSound: () => void,
        playChipsSound: () => void,
        playDealSound: () => void
    }
) {
    // Helper function to get dealer upcard - memoized
    const getDealerUpCard = useCallback((): Card | null => {
        const dealerHand = gameState.dealerHandId && gameState.entities?.hands
            ? gameState.entities.hands[gameState.dealerHandId]
            : null;

        if (!dealerHand?.cards?.[0]) {
            return null;
        }

        const firstCard = dealerHand.cards[0];
        if (typeof firstCard === 'string' && gameState.entities?.cards) {
            return gameState.entities.cards[firstCard] as Card || null;
        }

        return null;
    }, [gameState.dealerHandId, gameState.entities?.hands, gameState.entities?.cards]);

    // Record player decision
    const recordPlayerDecision = useCallback((action: PlayerAction) => {
        if (!gameState.activePlayerHandId) return;

        try {
            const playerHand = gameState.entities?.hands?.[gameState.activePlayerHandId] || {};
            const dealerUpCard = getDealerUpCard();

            analytics.recordDecision({
                playerHand,
                dealerUpCard,
                decision: action,
                recommendedDecision: action,
                outcome: 'pending',
                betAmount: gameState?.bet || 0,
                finalChips: gameState?.chips || 0,
                effectiveCount: gameState.trueCount || 0,
                deckPenetration: gameState.dealtCards && gameState.shoe ?
                    gameState.dealtCards.length / (gameState.dealtCards.length + gameState.shoe.length) : 0
            });
        } catch (error) {
            console.error('Error recording player decision:', error);
        }
    }, [gameState, analytics, getDealerUpCard]);

    // Execute game action
    const executeGameAction = useCallback((action: PlayerAction) => {
        try {
            const playerId = 'player1'; // Default player ID
            const handId = gameState.activePlayerHandId || 'hand1'; // Default hand ID

            switch (action) {
                case 'hit':
                    gameStore.hit(playerId, handId);
                    break;
                case 'stand':
                    gameStore.stand(playerId, handId);
                    break;
                case 'double':
                    gameStore.double(playerId, handId);
                    break;
                case 'split':
                    gameStore.split(playerId, handId);
                    break;
                case 'surrender':
                    gameStore.surrender(playerId, handId);
                    break;
            }
        } catch (error) {
            console.error(`Error executing game action ${action}:`, error);
            toast.error(`Error executing ${action}. Please try again.`);
        }
    }, [gameStore, gameState.activePlayerHandId]);

    // Track dealer turn timer to prevent race conditions
    const dealerTurnTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Trigger dealer turn with safeguards
    const triggerDealerTurn = useCallback(() => {
        // Clear any existing timer
        if (dealerTurnTimerRef.current) {
            clearTimeout(dealerTurnTimerRef.current);
            dealerTurnTimerRef.current = null;
        }

        if (gameState.gamePhase === 'dealerTurn' && gameState.playDealer) {
            dealerTurnTimerRef.current = setTimeout(() => {
                try {
                    gameState.playDealer!();
                } catch (error) {
                    console.error('Error during dealer turn:', error);
                    toast.error('Error during dealer turn. Please try starting a new game.');
                } finally {
                    // Clear the ref after execution
                    dealerTurnTimerRef.current = null;
                }
            }, 1000);
        }
    }, [gameState]);

    // Cleanup for dealer turn timer
    useEffect(() => {
        return () => {
            if (dealerTurnTimerRef.current) {
                clearTimeout(dealerTurnTimerRef.current);
                dealerTurnTimerRef.current = null;
            }
        };
    }, []);

    // Handle player action
    const handlePlayerAction = useCallback((action: string) => {
        soundEffects.playButtonSound();

        if (!['hit', 'stand', 'double', 'split', 'surrender'].includes(action)) {
            console.error(`Invalid action: ${action}`);
            toast.error('Invalid action. Please try again.');
            return;
        }

        const validAction = action as PlayerAction;
        recordPlayerDecision(validAction);
        executeGameAction(validAction);
        triggerDealerTurn();
    }, [
        soundEffects.playButtonSound,
        recordPlayerDecision,
        executeGameAction,
        triggerDealerTurn
    ]);

    // Handle bet action
    const handleBetAction = useCallback((playerId: string | number, amount: number) => {
        try {
            const validation = validations.validateBetAction(amount);

            if (!validation.isValid) {
                if (validation.errorMessage) {
                    console.warn(validation.errorMessage);
                    toast.error(validation.errorMessage);
                }
                return;
            }

            // Convert playerId to string if it's a number
            const playerIdStr = typeof playerId === 'number' ? playerId.toString() : playerId;
            gameStore.placeBet(playerIdStr, amount);

            // Record bet in analytics
            analytics.recordBet({
                amount,
                recommendedAmount: null,
                followedRecommendation: false,
                effectiveCount: gameState.trueCount || 0,
                deckPenetration: gameState.dealtCards && gameState.shoe ?
                    gameState.dealtCards.length / (gameState.dealtCards.length + gameState.shoe.length) : 0,
                reason: null
            });

            soundEffects.playChipsSound();
        } catch (error) {
            console.error('Error placing bet:', error);
            toast.error('Error placing bet. Please try again.');
        }
    }, [
        validations.validateBetAction,
        gameStore,
        analytics,
        gameState,
        soundEffects.playChipsSound
    ]);

    // Handle clear bet
    const handleClearBet = useCallback(() => {
        try {
            const validation = validations.validateClearBet();

            if (!validation.isValid) return;

            if (typeof gameState.clearBet === 'function') {
                gameState.clearBet();
                toast.info('Bet cleared');
            } else {
                // Fallback if clearBet isn't available
                const defaultPlayerId = 'player1';
                gameStore.placeBet(defaultPlayerId, 0);
                toast.info('Bet cleared');
            }
        } catch (error) {
            console.error('Error clearing bet:', error);
            toast.error('Error clearing bet. Please try again.');
        }
    }, [validations.validateClearBet, gameState, gameStore]);

    // Handle deal cards
    const handleDealCards = useCallback(() => {
        try {
            const validation = validations.validateDealCards();

            if (!validation.isValid) {
                if (validation.errorMessage) {
                    console.warn(validation.errorMessage);
                    toast.error(validation.errorMessage);
                }
                return;
            }

            gameStore.dealCards();
            soundEffects.playDealSound();
        } catch (error) {
            console.error('Error dealing cards:', error);
            toast.error('Error dealing cards. Please try again.');
        }
    }, [validations.validateDealCards, gameStore, soundEffects.playDealSound]);

    // Handle insurance
    const handleTakeInsurance = useCallback(() => {
        try {
            const playerId = 'player1'; // Default player ID
            const handId = gameState.activePlayerHandId || 'hand1'; // Default hand ID
            const amount = gameState?.bet ? gameState.bet / 2 : 0; // Insurance is typically half the bet

            // Use the appropriate function based on availability
            if (typeof gameStore.insurance === 'function') {
                gameStore.insurance(playerId, handId, amount);
            } else if (typeof gameState.takeInsurance === 'function') {
                gameState.takeInsurance();
            }

            toast.info(`Insurance bet placed: $${amount}`);
        } catch (error) {
            console.error('Error taking insurance:', error);
            toast.error('Error taking insurance. Please try again.');
        }
    }, [gameStore, gameState]);

    const handleDeclineInsurance = useCallback(() => {
        try {
            if (typeof gameState.declineInsurance === 'function') {
                gameState.declineInsurance();
                toast.info('Insurance declined');
            }
        } catch (error) {
            console.error('Error declining insurance:', error);
            toast.error('Error declining insurance. Please try again.');
        }
    }, [gameState]);

    // Game control actions
    const handleReset = useCallback(() => {
        try {
            gameStore.resetRound();
            toast.info('Round reset');
        } catch (error) {
            console.error('Error resetting round:', error);
            toast.error('Error resetting round. Please try starting a new game.');
        }
    }, [gameStore]);

    const handleNewGame = useCallback(() => {
        try {
            gameStore.initializeGame();
            toast.success('New game started!');
        } catch (error) {
            console.error('Error starting new game:', error);
            toast.error('Error starting new game. Please refresh the page.');
        }
    }, [gameStore]);

    return {
        handlePlayerAction,
        handleBetAction,
        handleClearBet,
        handleDealCards,
        handleTakeInsurance,
        handleDeclineInsurance,
        handleReset,
        handleNewGame
    };
}

// Game phase conversion utility
const convertGamePhase = (phase: string | undefined): 'betting' | 'dealing' | 'player-turn' | 'dealer-turn' | 'payout' | 'game-over' => {
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

// BlackjackPage Component - refactored to use custom hooks
const BlackjackPage = () => {
    // Access game stores
    const gameStore = useGameStore();
    const settingsStore = useEnhancedSettingsStore();
    const analytics = useAnalyticsStore();

    // Memoize derived state to prevent reference changes on every render
    const gameState = useMemo(() => ({
        ...gameStore as unknown as GameStore & ExtendedGameState
    }), [gameStore]);

    // Memoize enhanced settings
    const enhancedSettings = useMemo(() => ({
        ...settingsStore as unknown as ExtendedSettingsStore
    }), [settingsStore]);

    // Group related UI state into a single object
    const [gameUI, setGameUI] = useState<GameUIState>({
        isLoading: true,
        soundEnabled: false,
        activeTab: 'game',
        showRulesDialog: false,
        showStrategyDialog: false,
        showSettings: false,
        showMobileMenu: false,
        isIntroShown: false,
        isGamePlaying: false,
        tutorialMode: false,
        welcomeShown: false,
        showInsuranceDialog: false,
        showSideBets: false
    });

    // Function to update specific UI state properties
    const updateGameUI = useCallback((updates: Partial<GameUIState>) => {
        setGameUI(prev => ({ ...prev, ...updates }));
    }, []);

    // Round reset timer reference to track active timeout
    const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Use custom hooks
    const { statusMessage, messageType } = useGameMessages(gameState);
    const soundEffects = useSoundEffects(gameUI.soundEnabled, gameState);
    const { playerSpots, dealerHand } = useGameEntities(gameState);
    const validations = useValidations(gameState);
    const {
        handlePlayerAction,
        handleBetAction,
        handleClearBet,
        handleDealCards,
        handleTakeInsurance,
        handleDeclineInsurance,
        handleReset,
        handleNewGame
    } = useGameActions(gameStore, gameState, analytics, validations, soundEffects);

    // Initialize game with proper error handling and cleanup
    useEffect(() => {
        const initGame = async () => {
            try {
                // Start analytics session
                analytics.startSession(gameStore.chips || 0);

                // Initialize game if needed
                if (!gameStore.isInitialized) {
                    gameStore.initializeGame();
                }

                // Show welcome toast if not already shown
                if (!gameUI.welcomeShown) {
                    toast.success('Welcome to Royal Edge Casino', {
                        description: 'Place your bets to begin playing!',
                        duration: 5000,
                    });

                    // Update welcome state
                    updateGameUI({
                        welcomeShown: true,
                        isIntroShown: true,
                        isLoading: false
                    });
                }
            } catch (error) {
                console.error('Error initializing game:', error);
                toast.error('Error initializing game. Please refresh the page.');
                updateGameUI({ isLoading: false });
            }
        };

        initGame();

        // Cleanup function that only runs on unmount
        return () => {
            try {
                // End analytics session if active
                if (analytics.sessionActive) {
                    analytics.endSession(gameStore.chips || 0);
                }
            } catch (error) {
                console.error('Error cleaning up game:', error);
            }
        };
    }, [analytics, gameStore, updateGameUI, gameUI.welcomeShown]);

    // Monitor insurance state
    useEffect(() => {
        if (gameState.showInsurance !== gameUI.showInsuranceDialog) {
            updateGameUI({ showInsuranceDialog: !!gameState.showInsurance });
        }
    }, [gameState.showInsurance, gameUI.showInsuranceDialog, updateGameUI]);

    // Start game loop if completed or in settlement with timer safety
    useEffect(() => {
        // Cleanup any existing timer first
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }

        if (gameState.gamePhase === 'completed' || gameState.gamePhase === 'settlement') {
            resetTimerRef.current = setTimeout(() => {
                try {
                    gameStore.resetRound();
                } catch (error) {
                    console.error('Error resetting round:', error);
                    toast.error('Error resetting round. Please try starting a new game.');
                } finally {
                    resetTimerRef.current = null;
                }
            }, 3000);
        }

        // Cleanup on unmount or phase change
        return () => {
            if (resetTimerRef.current) {
                clearTimeout(resetTimerRef.current);
                resetTimerRef.current = null;
            }
        };
    }, [gameState.gamePhase, gameStore]);

    // Simple state handlers with updater function
    const handleStartStop = useCallback(() => {
        updateGameUI({ isGamePlaying: !gameUI.isGamePlaying });
    }, [updateGameUI, gameUI.isGamePlaying]);

    const handleToggleTutorial = useCallback(() => {
        updateGameUI({ tutorialMode: !gameUI.tutorialMode });
    }, [updateGameUI, gameUI.tutorialMode]);

    const handleToggleSound = useCallback(() => {
        updateGameUI({ soundEnabled: !gameUI.soundEnabled });
    }, [updateGameUI, gameUI.soundEnabled]);

    // Table color from settings
    const tableColor = enhancedSettings.tableColor || '#1a5f7a';

    // Loading screen
    if (gameUI.isLoading) {
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
                {!gameUI.isIntroShown && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black"
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
            <header className="fixed left-0 right-0 z-40 flex items-center justify-between p-4 top-16 bg-gradient-to-b from-black via-black/80 to-transparent backdrop-blur-sm">
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
                        onClick={handleToggleSound}
                        className="rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                    >
                        {gameUI.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </Button>

                    {/* Settings */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateGameUI({ showSettings: true })}
                        className="rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                    >
                        <Settings size={18} />
                    </Button>

                    {/* Mobile menu toggle (only on mobile) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateGameUI({ showMobileMenu: !gameUI.showMobileMenu })}
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
                        {(gameState?.chips ?? 0).toLocaleString()}
                    </Badge>
                </motion.div>
            </header>

            {/* Mobile menu drawer */}
            <AnimatePresence>
                {gameUI.showMobileMenu && (
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
                                    onClick={() => updateGameUI({ showMobileMenu: false })}
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
                                        updateGameUI({
                                            activeTab: 'game',
                                            showMobileMenu: false
                                        });
                                    }}
                                >
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Main Game
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        updateGameUI({
                                            activeTab: 'strategy',
                                            showMobileMenu: false
                                        });
                                    }}
                                >
                                    <Award className="w-5 h-5 mr-2" />
                                    Strategy
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        updateGameUI({
                                            activeTab: 'analysis',
                                            showMobileMenu: false
                                        });
                                    }}
                                >
                                    <BarChart2 className="w-5 h-5 mr-2" />
                                    Analysis
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        updateGameUI({
                                            showRulesDialog: true,
                                            showMobileMenu: false
                                        });
                                    }}
                                >
                                    <HelpCircle className="w-5 h-5 mr-2" />
                                    Game Rules
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="justify-start w-full"
                                    onClick={() => {
                                        updateGameUI({
                                            showSideBets: true,
                                            showMobileMenu: false
                                        });
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
                                    onClick={handleToggleSound}
                                >
                                    {gameUI.soundEnabled ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
                                    {gameUI.soundEnabled ? 'Sound On' : 'Sound Off'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main game content */}
            <main className="relative min-h-screen px-4 overflow-x-hidden pt-36 pb-28 md:px-8">
                {/* Status message display with extracted component */}
                <div className="absolute z-40 w-full max-w-md transform -translate-x-1/2 top-40 left-1/2">
                    {statusMessage && <StatusMessage message={statusMessage} type={messageType} />}
                </div>

                <Tabs
                    value={gameUI.activeTab}
                    onValueChange={(tab) => updateGameUI({ activeTab: tab })}
                    className="mx-auto max-w-7xl"
                >
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
                                        cards: dealerHand?.cards?.map((cardId: string) => {
                                            // Get the card data from the normalized state
                                            if (typeof cardId === 'string' && gameState.entities?.cards) {
                                                const cardData = gameState.entities.cards[cardId];
                                                // Safely access suit and rank properties
                                                const suitValue = (cardData?.suit || 'hearts') as Suit;
                                                const rankValue = (cardData?.rank || 'A') as Rank;
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
                                        isActive: gameState.gamePhase === 'dealerTurn',
                                        result: (() => {
                                            // Determine dealer result based on game outcome
                                            if (gameState.roundResult === 'win' || gameState.roundResult === 'blackjack') return 'lose';
                                            if (gameState.roundResult === 'lose' || gameState.roundResult === 'bust') return 'win';
                                            if (gameState.roundResult === 'push') return 'push';
                                            return undefined;
                                        })()
                                    }}
                                    players={playerSpots.map(spot => ({
                                        id: String(spot.id),
                                        name: spot.position === 'center' ? 'Player' : `Player ${spot.id}`,
                                        balance: spot.chips,
                                        hands: [{
                                            id: `${spot.id}-hand`,
                                            cards: spot.hand?.cards?.map((cardId: string) => {
                                                // Get the card data from the normalized state
                                                if (typeof cardId === 'string' && gameState.entities?.cards) {
                                                    const cardData = gameState.entities.cards[cardId];
                                                    // Safely access suit and rank properties
                                                    const suitValue = (cardData?.suit || 'hearts') as Suit;
                                                    const rankValue = (cardData?.rank || 'A') as Rank;
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
                                            bet: spot.bet,
                                            betChips: spot.bet > 0 ? [{
                                                value: (VALID_CHIP_VALUES.find(v => v >= spot.bet) ||
                                                    VALID_CHIP_VALUES[VALID_CHIP_VALUES.length - 1]) as ChipValue,
                                                count: 1
                                            }] : [],
                                            isActive: spot.isActive,
                                            result: spot.result
                                        }]
                                    }))}
                                    currentPlayerId={String(playerSpots.find(p => p.isCurrentPlayer)?.id || '1')}
                                    activeHandId={`${playerSpots.find(p => p.isCurrentPlayer)?.id || '1'}-hand`}
                                    gamePhase={convertGamePhase(gameState.gamePhase)}
                                    minBet={enhancedSettings.gameRules?.minBet || 5}
                                    maxBet={enhancedSettings.gameRules?.maxBet || 500}
                                    availableActions={{
                                        hit: gameState.gamePhase === 'playerTurn',
                                        stand: gameState.gamePhase === 'playerTurn',
                                        double: gameState.gamePhase === 'playerTurn' &&
                                            (typeof gameState.canDoubleDown === 'function' ?
                                                gameState.canDoubleDown() : false),
                                        split: gameState.gamePhase === 'playerTurn' &&
                                            (typeof gameState.canSplit === 'function' ?
                                                gameState.canSplit() : false),
                                        surrender: gameState.gamePhase === 'playerTurn' &&
                                            (typeof gameState.canSurrender === 'function' ?
                                                gameState.canSurrender() : false),
                                        insurance: !!gameState.showInsurance,
                                        deal: gameState.gamePhase === 'betting' && (gameState?.bet || 0) > 0
                                    }}
                                    recommendedAction={enhancedSettings.showBasicStrategy ? 'hit' : undefined}
                                    message={gameState.message && !gameState.message.includes('Bet placed:') ? gameState.message : ''}
                                    darkMode={true}
                                    onPlaceBet={(playerId, bet) => handleBetAction(playerId, bet)}
                                    onClearBet={handleClearBet}
                                    onAction={(action) => handlePlayerAction(action)}
                                    onDealCards={handleDealCards}
                                    showBettingControls={false}
                                />

                                {/* Game controls - positioned below the table */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.8 }}
                                    className="w-full py-4 mt-4"
                                >
                                    <GameControls
                                        gamePhase={convertGamePhase(gameState.gamePhase)}
                                        isPlaying={gameUI.isGamePlaying}
                                        isMuted={!gameUI.soundEnabled}
                                        isTutorialMode={gameUI.tutorialMode}
                                        isCollapsed={false}
                                        showTutorial={true}
                                        showSettings={true}
                                        showStatistics={true}
                                        onStart={handleStartStop}
                                        onStop={handleStartStop}
                                        onReset={handleReset}
                                        onNewGame={handleNewGame}
                                        onMuteToggle={handleToggleSound}
                                        onShowTutorial={handleToggleTutorial}
                                        onShowSettings={() => updateGameUI({ showSettings: true })}
                                        onShowStatistics={() => updateGameUI({ activeTab: 'analysis' })}
                                    />
                                </motion.div>

                                {/* Probability display when enabled */}
                                {enhancedSettings.showProbabilities && gameState.activePlayerHandId && (
                                    <div className="absolute z-20 w-64 bottom-4 left-4">
                                        {/* Probability card content would go here */}
                                    </div>
                                )}
                            </motion.div>

                            {/* Sidebar content */}
                            <div className="flex flex-col space-y-4">
                                <GameSidebar
                                    gameStore={{
                                        isLoading: false,
                                        error: null,
                                        userId: null,
                                        chips: gameState?.chips || 0,
                                        bet: gameState?.bet || 0,
                                        lastAction: gameState?.message || '',
                                        gameState: {
                                            currentPhase: gameState?.gamePhase as GamePhase || 'betting',
                                            count: {
                                                running: gameState?.runningCount || 0,
                                                true: gameState?.trueCount || 0
                                            },
                                            deck: {
                                                remainingCards: gameState?.shoe?.length || 0
                                            }
                                        } as any
                                    } as any}
                                    enhancedSettings={{
                                        countingSystem: enhancedSettings.showCountingInfo ? 'hi-lo' : 'none',
                                        showCountingInfo: !!enhancedSettings.showCountingInfo,
                                        showBasicStrategy: !!enhancedSettings.showBasicStrategy,
                                        showProbabilities: !!enhancedSettings.showProbabilities,
                                        gameRules: enhancedSettings.gameRules || { minBet: 5, maxBet: 500 }
                                    } as any}
                                    analytics={{
                                        gameStats: {
                                            handsPlayed: analytics.gameStats?.handsPlayed || 0,
                                            handsWon: analytics.gameStats?.handsWon || 0,
                                            handsLost: analytics.gameStats?.handsLost || 0,
                                            handsPushed: analytics.gameStats?.pushes || 0,
                                            blackjacks: analytics.gameStats?.handsWon || 0,
                                            netProfit: analytics.gameStats?.netProfit || 0
                                        }
                                    }}
                                    setShowRulesDialog={() => updateGameUI({ showRulesDialog: true })}
                                    setShowBasicStrategyDialog={() => updateGameUI({ showStrategyDialog: true })}
                                />

                                {/* Additional strategy components would go here */}
                            </div>
                        </div>

                        {/* Betting controls - fixed position at bottom of screen with proper z-index */}
                        {(gameState.gamePhase === 'betting' || gameState.gamePhase === 'waiting' || gameState.gamePhase === 'initial') && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black to-transparent"
                            >
                                <div className="max-w-md mx-auto">
                                    <BettingControls
                                        balance={gameState?.chips ?? 0}
                                        maxBet={enhancedSettings.gameRules?.maxBet || 500}
                                        minBet={enhancedSettings.gameRules?.minBet || 5}
                                        currentBet={gameState?.bet || 0}
                                        onPlaceBet={(amount) => handleBetAction('1', amount)}
                                        onClearBet={handleClearBet}
                                        onDealCards={handleDealCards}
                                        disabled={gameState.gamePhase !== 'betting'}
                                        className="p-4 border rounded-lg bg-black/70 backdrop-blur-sm border-slate-700"
                                        autoConfirm={true}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </TabsContent>

                    <TabsContent value="strategy" className="focus:outline-none">
                        {/* Strategy card tabs would go here */}
                    </TabsContent>

                    <TabsContent value="analysis" className="focus:outline-none">
                        {/* Analysis content would go here */}
                    </TabsContent>
                </Tabs>
            </main>

            {/* Modal dialogs */}
            <Dialog
                open={gameUI.showRulesDialog}
                onOpenChange={(open) => updateGameUI({ showRulesDialog: open })}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Game Rules</DialogTitle>
                    <RuleConfiguration
                        onClose={() => updateGameUI({ showRulesDialog: false })}
                        onRulesChanged={() => {
                            try {
                                // Re-initialize game with new rules
                                if (enhancedSettings.gameRules && typeof gameState.updateRules === 'function') {
                                    gameState.updateRules(enhancedSettings.gameRules);
                                    toast.success('Game rules updated');
                                } else {
                                    // Fallback to reset if needed
                                    gameStore.initializeGame();
                                    toast.success('Game restarted with new rules');
                                }
                            } catch (error) {
                                console.error('Error updating rules:', error);
                                toast.error('Error updating rules. Please try again.');
                            }
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Strategy dialog */}
            <Dialog
                open={gameUI.showStrategyDialog}
                onOpenChange={(open) => updateGameUI({ showStrategyDialog: open })}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Basic Strategy</DialogTitle>
                    <StrategyCard
                        activeType="basic"
                        activeView="hard"
                        highlightActive={true}
                        trueCount={gameState.trueCount || 0}
                        playerCards={gameState.activePlayerHandId && gameState.entities?.hands ?
                            gameState.entities.hands[gameState.activePlayerHandId]?.cards?.map((cardId: string) => {
                                // Handle both string IDs and card objects
                                const cardKey = getCardKey(cardId);
                                // Safely access suit and rank properties
                                const cardData = gameState.entities?.cards?.[cardKey];
                                const suitValue = (cardData?.suit || 'hearts') as Suit;
                                const rankValue = (cardData?.rank || 'A') as Rank;

                                return {
                                    id: String(cardKey),
                                    suit: suitValue,
                                    rank: rankValue
                                };
                            }) || [] : []}
                        dealerUpcard={dealerHand?.cards && dealerHand.cards.length > 0 ? {
                            id: formatCardId(dealerHand.cards[0]),
                            suit: (dealerHand.cards[0] && typeof dealerHand.cards[0] === 'string'
                                ? (gameState.entities?.cards?.[dealerHand.cards[0]]?.suit || 'hearts')
                                : 'hearts') as Suit,
                            rank: (dealerHand.cards[0] && typeof dealerHand.cards[0] === 'string'
                                ? (gameState.entities?.cards?.[dealerHand.cards[0]]?.rank || 'A')
                                : 'A') as Rank
                        } : null}
                        showDeviation={true}
                        fullScreenEnabled={true}
                    />
                </DialogContent>
            </Dialog>

            {/* Settings dialog */}
            <Dialog
                open={gameUI.showSettings}
                onOpenChange={(open) => updateGameUI({ showSettings: open })}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Game Settings</DialogTitle>
                    <DialogDescription>
                        Customize your blackjack experience
                    </DialogDescription>
                    {/* Settings content would go here */}
                </DialogContent>
            </Dialog>

            {/* Insurance dialog */}
            <Dialog
                open={gameUI.showInsuranceDialog}
                onOpenChange={(open) => updateGameUI({ showInsuranceDialog: open })}
            >
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
                                    updateGameUI({ showInsuranceDialog: false });
                                }}
                            >
                                No Thanks
                            </Button>
                            <Button
                                onClick={() => {
                                    handleTakeInsurance();
                                    updateGameUI({ showInsuranceDialog: false });
                                }}
                            >
                                Take Insurance
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Side Bets dialog */}
            <Dialog
                open={gameUI.showSideBets}
                onOpenChange={(open) => updateGameUI({ showSideBets: open })}
            >
                <DialogContent className="max-w-md">
                    <DialogTitle>Side Bets</DialogTitle>
                    <div className="py-4">
                        <p className="mb-4">Place additional side bets to increase your potential winnings.</p>

                        <div className="space-y-4">
                            <div className="p-3 border rounded-lg border-amber-500/30 bg-black/50">
                                <h3 className="flex items-center justify-between mb-2 font-semibold">
                                    <span>Perfect Pairs</span>
                                    <Badge variant="outline" className="text-amber-300 border-amber-500/50">
                                        Pays 30:1
                                    </Badge>
                                </h3>
                                <p className="mb-3 text-sm text-slate-300">Bet on your first two cards forming a pair.</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-2">
                                        {[5, 10, 25].map((amount) => (
                                            <Button
                                                key={amount}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    toast.success(`${amount} bet placed on Perfect Pairs`, {
                                                        description: "Side bet placed successfully"
                                                    });
                                                }}
                                                disabled={gameState.gamePhase !== 'betting'}
                                                className="text-sm"
                                            >
                                                ${amount}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 border rounded-lg border-amber-500/30 bg-black/50">
                                <h3 className="flex items-center justify-between mb-2 font-semibold">
                                    <span>21+3</span>
                                    <Badge variant="outline" className="text-amber-300 border-amber-500/50">
                                        Pays 9:1
                                    </Badge>
                                </h3>
                                <p className="mb-3 text-sm text-slate-300">Bet on your first two cards plus dealer's up card forming a poker hand.</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-2">
                                        {[5, 10, 25].map((amount) => (
                                            <Button
                                                key={amount}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    toast.success(`${amount} bet placed on 21+3`, {
                                                        description: "Side bet placed successfully"
                                                    });
                                                }}
                                                disabled={gameState.gamePhase !== 'betting'}
                                                className="text-sm"
                                            >
                                                ${amount}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button
                                variant="default"
                                onClick={() => updateGameUI({ showSideBets: false })}
                            >
                                Close
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