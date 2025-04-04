'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import useGameStore from '@/store/gameStore';
import { useEnhancedSettingsStore } from '@/store/enhancedSettingsStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { GameStore as _GameStore } from '@/types/storeTypes';
import type { Suit, Rank, Card, CardFace } from '@/types/cardTypes';
import type { ChipValue } from '@/components/betting/Chip';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import { RuleConfiguration } from '@/components/game/rules/RuleConfiguration';
import { GameSidebar } from '@/components/game/controls/GameSidebar';
import GameControls from '@/components/game/controls/GameControls';

// ========== TYPE DEFINITIONS ==========

// Define valid chip values
const VALID_CHIP_VALUES: readonly ChipValue[] = [1, 5, 10, 25, 50, 100, 500, 1000];

// Message type for status messages
type MessageType = 'info' | 'success' | 'warning' | 'error';

// Define player action type
type PlayerAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender';

// Basic entity types for type safety
interface HandEntity {
    cards?: string[];
    value?: number;
    isBusted?: boolean;
    isBlackjack?: boolean;
    [key: string]: unknown;
}

interface CardEntity {
    id: string;
    suit: Suit;
    rank: Rank;
    value: number;
    face: CardFace;
    [key: string]: unknown;
}

// Create a type that matches the shape of processed card objects
interface ProcessedCard {
    id: string;
    suit: Suit;
    rank: Rank;
    value?: number | number[];
    face?: CardFace;
    isFaceUp?: boolean;
}

interface GameRules {
    minBet?: number;
    maxBet?: number;
    [key: string]: unknown;
}

// Define GameStoreType and AnalyticsStore interfaces
interface GameStoreType {
    chips: number;
    bet: number;
    message?: string;
    gamePhase?: string;
    entities?: {
        hands?: Record<string, HandEntity>;
        cards?: Record<string, CardEntity>;
    };
    isInitialized?: boolean;
    hit?: (playerId: string, handId: string) => void;
    stand?: (playerId: string, handId: string) => void;
    double?: (playerId: string, handId: string) => void;
    split?: (playerId: string, handId: string) => void;
    surrender?: (playerId: string, handId: string) => void;
    placeBet?: (playerId: string, amount: number) => void;
    dealCards?: () => void;
    resetRound?: () => void;
    initializeGame?: () => void;
    [key: string]: unknown;
}

// Define decision data type for analytics
interface DecisionData {
    playerHand: Record<string, unknown>;
    dealerUpCard: Card | null;
    decision: string;
    recommendedDecision: string;
    outcome: string;
    betAmount: number;
    finalChips: number;
    effectiveCount: number;
    deckPenetration: number;
}

// Define bet data type for analytics
interface BetData {
    amount: number;
    recommendedAmount: number | null;
    followedRecommendation: boolean;
    effectiveCount: number;
    deckPenetration: number;
    reason: string | null;
}

interface AnalyticsStore {
    gameStats?: {
        handsPlayed: number;
        handsWon: number;
        handsLost: number;
        pushes: number;
        blackjacks: number;
        netProfit: number;
        [key: string]: unknown;
    };
    recordDecision: (data: DecisionData) => void;
    recordBet: (data: BetData) => void;
    startSession: (startingChips: number) => void;
    endSession: (endingChips: number) => void;
    sessionActive?: boolean;
    [key: string]: unknown;
}

// Extend with additional properties for implementation
interface ExtendedGameState {
    isInitialized?: boolean;
    message?: string;
    gamePhase?: string;
    roundResult?: string | null;
    activePlayerHandId?: string | null;
    dealerHandId?: string | null;
    entities?: {
        hands?: Record<string, HandEntity>;
        cards?: Record<string, CardEntity>;
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
    updateRules?: (rules: GameRules) => void;
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
    hand: HandEntity | null;
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

// Timer Manager type
interface TimerManager {
    setTimer: (id: string, callback: () => void, delay: number) => void;
    clearTimer: (id: string) => void;
    clearAllTimers: () => void;
}

// ========== UTILITY FUNCTIONS AND OPTIMIZED SINGLETONS ==========

// AudioManager implementation - extract nested handlers
const AudioManager = (() => {
    const sounds: Record<string, HTMLAudioElement> = {};
    let isSoundEnabled = false;
    const sources = {
        music: '/sounds/casino-ambience.mp3',
        deal: '/sounds/card-deal.mp3',
        win: '/sounds/win.mp3',
        chips: '/sounds/chips.mp3',
        shuffle: '/sounds/shuffle.mp3',
        buttonClick: '/sounds/button-click.mp3'
    };

    type SoundKey = keyof typeof sources;

    // Track last play time to prevent rapid repeats
    const lastPlayTime: Record<string, number> = {};

    // Lazy loading flag
    let isPreloaded = false;

    // Debounce time for sound effects (ms)
    const DEBOUNCE_TIME = 80;

    // Load a single audio file with proper error handling
    const loadAudio = (key: string, src: string): Promise<void> => {
        return new Promise((resolve) => {
            try {
                // Check if already loaded
                if (sounds[key] && sounds[key].readyState > 0) {
                    resolve();
                    return;
                }

                const audio = new Audio();

                // Setup event handlers
                const handleLoad = () => {
                    sounds[key] = audio;
                    resolve();
                };

                const handleError = () => {
                    console.warn(`Failed to load audio: ${key} (${src})`);
                    resolve(); // Resolve anyway to not block other operations
                };

                audio.addEventListener('canplaythrough', handleLoad, { once: true });
                audio.addEventListener('error', handleError, { once: true });

                // Set a timeout in case the audio never loads
                const timeout = setTimeout(() => {
                    audio.removeEventListener('canplaythrough', handleLoad);
                    audio.removeEventListener('error', handleError);
                    handleError();
                }, 5000);

                // Configure audio
                audio.preload = 'auto';
                audio.volume = key === 'music' ? 0.3 : 0.5;
                audio.loop = key === 'music';

                // Set source last to start loading
                audio.src = src;

                // Cleanup on successful load
                audio.addEventListener('canplaythrough', () => clearTimeout(timeout), { once: true });
            } catch (error) {
                console.warn(`Error setting up audio ${key}:`, error);
                resolve(); // Resolve anyway to not block other operations
            }
        });
    };

    // Preload audio files - with better error handling and performance
    const preload = async (): Promise<void> => {
        // Skip if already preloaded
        if (isPreloaded) return;

        try {
            // Only preload critical sounds first
            const critical = ['music', 'deal', 'buttonClick'] as const;

            // Load critical sounds first
            await Promise.all(
                critical.map(key => loadAudio(key, sources[key]))
            );

            // Then load the rest in the background
            const allSoundKeys = Object.keys(sources) as Array<keyof typeof sources>;
            const nonCritical = allSoundKeys.filter(key =>
                !critical.includes(key as typeof critical[number])
            );

            // Don't await these - let them load in background
            nonCritical.forEach(key => {
                loadAudio(key, sources[key]);
            });

            isPreloaded = true;
        } catch (error) {
            console.warn('Error during audio preload:', error);
            // Continue regardless of errors
        }
    };

    // Enable or disable all sounds - with better performance
    const setSoundEnabled = (enabled: boolean): void => {
        if (isSoundEnabled === enabled) return; // No change needed

        isSoundEnabled = enabled;

        // Handle background music specifically
        if (sounds.music) {
            if (enabled) {
                // Only try to play music if the document isn't hidden (tab in focus)
                if (!document.hidden) {
                    sounds.music.play().catch(() => {
                        // Auto-play may be blocked - will try again when user interacts
                        console.info('Background music auto-play prevented by browser');
                    });
                }
            } else {
                sounds.music.pause();
            }
        } else if (enabled) {
            // Lazy load music if needed
            if ('music' in sources) {
                const musicKey = 'music' as keyof typeof sources;
                loadAudio('music', sources[musicKey]).then(() => {
                    if (isSoundEnabled && !document.hidden) {
                        sounds.music?.play().catch(() => {
                            console.info('Background music auto-play prevented by browser');
                        });
                    }
                });
            }
        }
    };

    // Play a sound with throttling to prevent rapid repeats
    const play = (key: string): void => {
        if (!isSoundEnabled) return;

        // Check if the sound exists or needs to be loaded
        if (!sounds[key]) {
            // Lazy load sound if needed
            if (key in sources) {
                const soundKey = key as SoundKey;
                loadAudio(key, sources[soundKey]);
            }
            return; // Skip this time, it will be available next time
        }

        const now = performance.now();

        // Throttle sound effects to prevent stuttering
        if (lastPlayTime[key] && now - lastPlayTime[key] < DEBOUNCE_TIME) {
            return;
        }

        lastPlayTime[key] = now;

        const sound = sounds[key];

        // Skip if already playing and not a long sound
        if (key !== 'music' && !sound.paused && sound.currentTime > 0 && sound.currentTime < sound.duration - 0.2) {
            return;
        }

        // For short sounds, reset to beginning
        if (key !== 'music') {
            try {
                sound.currentTime = 0;
            } catch (_e) {
                // Some browsers might throw error if the audio isn't loaded yet
            }
        }

        // Play with error handling
        sound.play().catch(_e => {
            // Auto-play may be blocked - common in browsers
            if (key === 'music') {
                console.info('Background music auto-play prevented by browser');
            }
        });
    };

    // Stop a specific sound - with better error handling
    const stop = (key: string): void => {
        if (!sounds[key]) return;

        try {
            const sound = sounds[key];

            // Fade out for better experience
            if (key === 'music' && sound.volume > 0) {
                // Simple fade out
                const fadeOut = () => {
                    if (sound.volume > 0.05) {
                        sound.volume -= 0.05;
                        setTimeout(fadeOut, 50);
                    } else {
                        sound.pause();
                        sound.currentTime = 0;
                        // Reset volume for next time
                        sound.volume = key === 'music' ? 0.3 : 0.5;
                    }
                };
                fadeOut();
            } else {
                sound.pause();
                sound.currentTime = 0;
            }
        } catch (e) {
            console.warn(`Error stopping sound ${key}:`, e);
        }
    };

    // Clean up all audio resources
    const cleanup = (): void => {
        Object.entries(sounds).forEach(([key, audio]) => {
            try {
                audio.pause();
                audio.src = '';
                audio.removeAttribute('src');

                // Remove event listeners
                audio.oncanplaythrough = null;
                audio.onerror = null;

                delete sounds[key];
            } catch (e) {
                console.warn(`Error cleaning up sound ${key}:`, e);
            }
        });

        // Reset state
        isPreloaded = false;
    };

    // Handle visibility change to pause/resume music
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (isSoundEnabled && sounds.music) {
                if (document.hidden) {
                    sounds.music.pause();
                } else {
                    sounds.music.play().catch(() => { });
                }
            }
        });
    }

    return {
        preload,
        setSoundEnabled,
        play,
        stop,
        cleanup,
        get isEnabled() { return isSoundEnabled; }
    };
})();

// Timer Manager to handle all timeouts centrally
const createTimerManager = (): TimerManager => {
    const timers = new Map<string, number>();

    const setTimer = (id: string, callback: () => void, delay: number): void => {
        // Clear existing timer with same ID if it exists
        if (timers.has(id)) {
            clearTimeout(timers.get(id));
            timers.delete(id);
        }

        // Create new timer and store its ID
        const timerId = window.setTimeout(() => {
            // Execute callback and remove from map
            try {
                callback();
            } catch (error) {
                console.error(`Error in timer callback ${id}:`, error);
            } finally {
                timers.delete(id);
            }
        }, delay);

        timers.set(id, timerId);
    };

    const clearTimer = (id: string): void => {
        if (timers.has(id)) {
            clearTimeout(timers.get(id));
            timers.delete(id);
        }
    };

    const clearAllTimers = (): void => {
        timers.forEach((timerId) => clearTimeout(timerId));
        timers.clear();
    };

    return {
        setTimer,
        clearTimer,
        clearAllTimers
    };
};

// Singleton instance of TimerManager
const TimerService = createTimerManager();

// Error Boundary Component to catch and handle rendering errors
class ErrorBoundary extends React.Component<
    { children: React.ReactNode, fallback?: React.ReactNode },
    { hasError: boolean, error: Error | null }
> {
    constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Game render error:", error, errorInfo);
        // Could add analytics logging here
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 text-white rounded-md bg-red-900/60">
                    <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
                    <p className="mb-4">The game encountered an error. Please try restarting.</p>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        Restart Game
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Helper function to format card ID safely - memoized version
const memoizedFormatCardId = (() => {
    const cache = new Map<unknown, string>();

    // Handle string conversion for card object
    const formatCardObject = (card: Record<string, unknown>): string => {
        if ('rank' in card && 'suit' in card) {
            return `${String(card.rank)}-${String(card.suit)}`;
        }

        try {
            const json = JSON.stringify(card);
            return `card-${json.length > 20 ? json.substring(0, 20) + '...' : json}`;
        } catch {
            return `card-object-${Math.random().toString(36).substring(2, 9)}`;
        }
    };

    return (cardId: unknown): string => {
        // Check cache first
        if (cache.has(cardId)) {
            return cache.get(cardId)!;
        }

        let result: string;

        // Handle basic types directly
        if (typeof cardId === 'string') {
            result = cardId;
        } else if (cardId === null || cardId === undefined) {
            result = 'unknown';
        } else if (typeof cardId === 'object') {
            // Extract id if present
            if (cardId && 'id' in cardId) {
                result = String((cardId as Record<string, unknown>).id);
            } else {
                result = formatCardObject(cardId as Record<string, unknown>);
            }
        } else {
            // For primitive types (number, boolean, symbol, etc.)
            try {
                result = `card-${String(cardId)}`;
            } catch {
                result = `card-unknown-${Math.random().toString(36).substring(2, 9)}`;
            }
        }

        cache.set(cardId, result);
        return result;
    };
})();

// Create a default card for fallback situations
const DEFAULT_CARD: Card = {
    id: 'unknown',
    suit: 'hearts' as Suit,
    rank: 'A' as Rank,
    value: 11,
    face: 'up' as CardFace
};

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

// ========== OPTIMIZED HOOKS ==========

// Custom hook to handle game messages with reduced dependencies
function useGameMessages(gameState: ExtendedGameState): {
    statusMessage: string;
    messageType: MessageType
} {
    const [statusMessage, setStatusMessage] = useState('');
    const [messageType, setMessageType] = useState<MessageType>('info');

    // Memoize message type determination function
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

    // Extract default status message generation to reduce dependencies
    const phaseToMessage = useMemo(() => ({
        'betting': (bet: number) => bet > 0 ? `` : 'Place your bet to start a new hand',
        'dealing': () => 'Dealing cards...',
        'playerTurn': () => 'Your turn: Hit, Stand, or Double?',
        'dealerTurn': () => 'Dealer is playing...'
    }), []);

    // Update message based on game state - with improved dependency handling
    useEffect(() => {
        // Destructure needed properties to simplify dependency tracking
        const { message, gamePhase, roundResult, bet = 0 } = gameState;

        if (message) {
            if (!message.includes('Bet placed:')) {
                setStatusMessage(message);
                setMessageType(getMessageType(message));
            } else {
                setStatusMessage('');
                setMessageType('info');
            }
        } else if (gamePhase === 'settlement') {
            const [settlementMsg, settlementType] = getSettlementMessage(roundResult ?? null, bet);
            setStatusMessage(settlementMsg);
            setMessageType(settlementType);
        } else if (gamePhase && phaseToMessage[gamePhase as keyof typeof phaseToMessage]) {
            // Use the lookup object for better performance
            const messageGenerator = phaseToMessage[gamePhase as keyof typeof phaseToMessage];
            setStatusMessage(messageGenerator(bet));
            setMessageType('info');
        } else {
            setStatusMessage('Welcome to Royal Edge Casino');
            setMessageType('info');
        }
    }, [gameState.message, gameState.gamePhase, gameState.roundResult, gameState.bet, getMessageType, getSettlementMessage, phaseToMessage, gameState]);

    return { statusMessage, messageType };
}

// Custom hook for sound effects management - completely overhauled
function useSoundEffects(soundEnabled: boolean) {
    // Set the sound enabled state in the AudioManager
    useEffect(() => {
        AudioManager.setSoundEnabled(soundEnabled);
    }, [soundEnabled]);

    // Handle game-specific sounds based on game state changes
    const handleGameStateSound = useCallback((gamePhase: string | undefined, roundResult: string | null | undefined, bet: number | undefined) => {
        if (!soundEnabled) return;

        // Convert undefined roundResult to null to satisfy the type checker
        const safeRoundResult = roundResult ?? null;

        if (gamePhase === 'dealing') {
            AudioManager.stop('win');
            AudioManager.stop('chips');
            AudioManager.play('deal');
        } else if (gamePhase === 'settlement' && safeRoundResult === 'win') {
            AudioManager.stop('deal');
            AudioManager.stop('chips');
            AudioManager.play('win');
        } else if (gamePhase === 'betting' && (bet || 0) > 0) {
            AudioManager.stop('deal');
            AudioManager.stop('win');
            AudioManager.play('chips');
        }
    }, [soundEnabled]);

    // Sound effect functions - memoized to prevent recreation
    const playButtonSound = useCallback(() => {
        if (soundEnabled) {
            AudioManager.play('buttonClick');
        }
    }, [soundEnabled]);

    const playChipsSound = useCallback(() => {
        if (soundEnabled) {
            AudioManager.play('chips');
        }
    }, [soundEnabled]);

    const playDealSound = useCallback(() => {
        if (soundEnabled) {
            AudioManager.play('deal');
        }
    }, [soundEnabled]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            // No need to cleanup here as we're using the singleton AudioManager
        };
    }, []);

    return {
        handleGameStateSound,
        playButtonSound,
        playChipsSound,
        playDealSound
    };
}

// Custom hook to handle card entities with improved memoization
function useGameEntities(gameState: ExtendedGameState) {
    // Player spots state with default value - use lazy initializer
    const [playerSpots, setPlayerSpots] = useState<PlayerSpot[]>(() => [{
        id: 1,
        position: 'center',
        hand: null,
        chips: gameState?.chips || 1500,
        bet: 0,
        isActive: false,
        isCurrentPlayer: true,
    }]);

    // Cache references to dependencies to reduce object identity changes
    const activePlayerHandIdRef = useRef(gameState.activePlayerHandId);
    const handsRef = useRef(gameState.entities?.hands);
    const chipsRef = useRef(gameState?.chips || 0);
    const betRef = useRef(gameState?.bet || 0);
    const gamePhaseRef = useRef(gameState.gamePhase);
    const roundResultRef = useRef(gameState.roundResult);
    const dealerHandIdRef = useRef(gameState.dealerHandId);

    // Update refs only when values actually change
    useEffect(() => {
        if (activePlayerHandIdRef.current !== gameState.activePlayerHandId) {
            activePlayerHandIdRef.current = gameState.activePlayerHandId;
        }
        if (handsRef.current !== gameState.entities?.hands) {
            handsRef.current = gameState.entities?.hands;
        }
        if (chipsRef.current !== (gameState?.chips || 0)) {
            chipsRef.current = gameState?.chips || 0;
        }
        if (betRef.current !== (gameState?.bet || 0)) {
            betRef.current = gameState?.bet || 0;
        }
        if (gamePhaseRef.current !== gameState.gamePhase) {
            gamePhaseRef.current = gameState.gamePhase;
        }
        if (roundResultRef.current !== gameState.roundResult) {
            roundResultRef.current = gameState.roundResult;
        }
        if (dealerHandIdRef.current !== gameState.dealerHandId) {
            dealerHandIdRef.current = gameState.dealerHandId;
        }
    }, [
        gameState.activePlayerHandId,
        gameState.entities?.hands,
        gameState?.chips,
        gameState?.bet,
        gameState.gamePhase,
        gameState.roundResult,
        gameState.dealerHandId
    ]);

    // Memoize player hand info - handle nullability and type constraints
    const playerHandInfo = useMemo(() => {
        // Make sure the result is of the expected type
        let result: 'win' | 'lose' | 'push' | 'blackjack' | undefined;

        if (roundResultRef.current === 'win' ||
            roundResultRef.current === 'lose' ||
            roundResultRef.current === 'push' ||
            roundResultRef.current === 'blackjack') {
            result = roundResultRef.current;
        } else {
            result = undefined;
        }

        return {
            hand: activePlayerHandIdRef.current && handsRef.current ? handsRef.current[activePlayerHandIdRef.current] : null,
            chips: chipsRef.current,
            bet: betRef.current,
            isActive: gamePhaseRef.current === 'playerTurn',
            result
        };
    }, []);

    // Use isomorphic layout effect to batch UI updates
    useLayoutEffect(() => {
        setPlayerSpots(prevPlayers => {
            // Find the center player
            const centerPlayerIndex = prevPlayers.findIndex(p => p.position === 'center');

            // No changes needed if we can't find the center player
            if (centerPlayerIndex === -1) return prevPlayers;

            // Create a new array and update only the center player
            const newPlayers = [...prevPlayers];
            const centerPlayer = newPlayers[centerPlayerIndex];

            // Add null check for centerPlayer
            if (!centerPlayer) return prevPlayers;

            // Only update if values have actually changed
            if (
                centerPlayer.hand !== playerHandInfo.hand ||
                centerPlayer.chips !== playerHandInfo.chips ||
                centerPlayer.bet !== playerHandInfo.bet ||
                centerPlayer.isActive !== playerHandInfo.isActive ||
                centerPlayer.result !== playerHandInfo.result
            ) {
                newPlayers[centerPlayerIndex] = {
                    ...centerPlayer,
                    hand: playerHandInfo.hand || null, // Ensure null instead of undefined
                    chips: playerHandInfo.chips,
                    bet: playerHandInfo.bet,
                    isActive: playerHandInfo.isActive,
                    result: playerHandInfo.result
                };
                return newPlayers;
            }

            // No change needed
            return prevPlayers;
        });
    }, [playerHandInfo]);

    // Cache entities to reduce reference changes
    const entitiesRef = useRef(gameState.entities);
    useEffect(() => {
        entitiesRef.current = gameState.entities;
    }, [gameState.entities]);

    // Memoize dealer hand to prevent unnecessary re-renders
    const dealerHand = useMemo(() =>
        dealerHandIdRef.current && entitiesRef.current?.hands
            ? entitiesRef.current.hands[dealerHandIdRef.current]
            : null,
        []
    );

    // Cache the dealer hand cards to reduce reference changes
    const dealerHandCardsRef = useRef(dealerHand?.cards || []);
    useEffect(() => {
        dealerHandCardsRef.current = dealerHand?.cards || [];
    }, [dealerHand?.cards]);

    // Process dealer cards once per update to avoid repeated processing
    const dealerCards = useMemo(() => {
        if (!dealerHandCardsRef.current.length || !entitiesRef.current?.cards) return [];

        // Create a cache for processed cards to avoid duplicate work
        const processedCards: Record<string, ProcessedCard> = {};

        return dealerHandCardsRef.current.map((cardId: string) => {
            // Check if we've already processed this card
            if (processedCards[cardId]) {
                return processedCards[cardId];
            }

            // Get the card data from the normalized state
            if (typeof cardId === 'string' && entitiesRef.current?.cards) {
                const cardData = entitiesRef.current.cards[cardId];
                if (cardData) {
                    // Store processed card in cache
                    const card = {
                        id: cardId,
                        suit: cardData.suit || 'hearts',
                        rank: cardData.rank || 'A'
                    };
                    processedCards[cardId] = card;
                    return card;
                }
            }

            // Fallback for missing card
            const defaultCard = { ...DEFAULT_CARD, id: memoizedFormatCardId(cardId) };
            processedCards[cardId] = defaultCard;
            return defaultCard;
        });
    }, []);

    // Cache player hand cards
    const playerHandsRef = useRef(playerSpots.map(spot => spot.hand?.cards || []));
    useEffect(() => {
        playerHandsRef.current = playerSpots.map(spot => spot.hand?.cards || []);
    }, [playerSpots]);

    // Process player cards once per update to avoid repeated processing
    const playerCards = useMemo(() => {
        // Use a single processed cards cache across all players
        const processedCards: Record<string, ProcessedCard> = {};

        return playerSpots.map((spot, _spotIndex) => {
            const cards = spot.hand?.cards || [];
            if (!cards.length || !entitiesRef.current?.cards) return [];

            return cards.map((cardId: string) => {
                // Check if we've already processed this card
                if (processedCards[cardId]) {
                    return processedCards[cardId];
                }

                // Get the card data from the normalized state
                if (typeof cardId === 'string' && entitiesRef.current?.cards) {
                    const cardData = entitiesRef.current.cards[cardId];
                    if (cardData) {
                        // Store processed card in cache
                        const card = {
                            id: cardId,
                            suit: cardData.suit || 'hearts',
                            rank: cardData.rank || 'A'
                        };
                        processedCards[cardId] = card;
                        return card;
                    }
                }

                // Fallback for missing card
                const defaultCard = { ...DEFAULT_CARD, id: memoizedFormatCardId(cardId) };
                processedCards[cardId] = defaultCard;
                return defaultCard;
            });
        });
    }, [playerSpots]);

    // Determine dealer result based on game outcome
    const dealerResult = useMemo(() => {
        if (roundResultRef.current === 'win' || roundResultRef.current === 'blackjack') return 'lose';
        if (roundResultRef.current === 'lose' || roundResultRef.current === 'bust') return 'win';
        if (roundResultRef.current === 'push') return 'push';
        return undefined;
    }, []);

    return { playerSpots, dealerHand, dealerCards, playerCards, dealerResult };
}

// Custom hook for game validations with reduced dependencies
function useValidations(gameState: ExtendedGameState) {
    // Save current game phase and chips to refs to reduce hook dependencies
    const gamePhaseRef = useRef(gameState.gamePhase);
    const chipsRef = useRef(gameState.chips);
    const betRef = useRef(gameState.bet);

    // Update refs when values change
    useEffect(() => {
        gamePhaseRef.current = gameState.gamePhase;
        chipsRef.current = gameState.chips;
        betRef.current = gameState.bet;
    }, [gameState.gamePhase, gameState.chips, gameState.bet]);

    // Validate bet action with stable function
    const validateBetAction = useCallback((amount: number): { isValid: boolean; errorMessage?: string } => {
        if (gamePhaseRef.current !== 'betting') {
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

        if (amount > (chipsRef.current || 0)) {
            return {
                isValid: false,
                errorMessage: 'Insufficient funds. You don\'t have enough chips for this bet.'
            };
        }

        return { isValid: true };
    }, []);

    // Validate clear bet action
    const validateClearBet = useCallback((): { isValid: boolean; reason?: string } => {
        if (!betRef.current || betRef.current <= 0) {
            return { isValid: false, reason: 'no-bet' };
        }

        if (gamePhaseRef.current !== 'betting') {
            return { isValid: false, reason: 'wrong-phase' };
        }

        return { isValid: true };
    }, []);

    // Validate deal cards action
    const validateDealCards = useCallback((): { isValid: boolean; errorMessage?: string } => {
        if (gamePhaseRef.current !== 'betting') {
            return {
                isValid: false,
                errorMessage: 'Cannot deal cards at this time'
            };
        }

        if (!betRef.current || betRef.current <= 0) {
            return {
                isValid: false,
                errorMessage: 'Please place a bet first'
            };
        }

        return { isValid: true };
    }, []);

    return { validateBetAction, validateClearBet, validateDealCards };
}

// Custom hook for game action handlers with improved error handling and reduced dependencies
function useGameActions(
    gameStore: GameStoreType,
    gameState: ExtendedGameState,
    analytics: AnalyticsStore,
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

    // Record player decision with error handling
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

    // Execute game action with improved error handling
    const executeGameAction = useCallback((action: PlayerAction) => {
        try {
            // Default values if not available
            const playerId = 'player1';
            const handId = gameState.activePlayerHandId || 'hand1';

            switch (action) {
                case 'hit':
                    if (gameStore.hit) gameStore.hit(playerId, handId);
                    break;
                case 'stand':
                    if (gameStore.stand) gameStore.stand(playerId, handId);
                    break;
                case 'double':
                    if (gameStore.double) gameStore.double(playerId, handId);
                    break;
                case 'split':
                    if (gameStore.split) gameStore.split(playerId, handId);
                    break;
                case 'surrender':
                    if (gameStore.surrender) gameStore.surrender(playerId, handId);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }
        } catch (error) {
            console.error(`Error executing game action ${action}:`, error);
            toast.error(`Error executing ${action}. Please try again.`);
        }
    }, [gameStore, gameState.activePlayerHandId]);

    // Trigger dealer turn with improved timer management
    const triggerDealerTurn = useCallback(() => {
        if (gameState.gamePhase === 'dealerTurn' && gameState.playDealer) {
            // Use the TimerService instead of direct setTimeout
            TimerService.setTimer('dealerTurn', () => {
                try {
                    gameState.playDealer!();
                } catch (error) {
                    console.error('Error during dealer turn:', error);
                    toast.error('Error during dealer turn. Please try starting a new game.');
                }
            }, 1000);
        }
    }, [gameState.gamePhase, gameState.playDealer]);

    // Ensure timer cleanup on component unmount
    useEffect(() => {
        return () => {
            TimerService.clearTimer('dealerTurn');
        };
    }, []);

    // Handle player action with sound and validation
    const handlePlayerAction = useCallback((action: string) => {
        soundEffects.playButtonSound();

        // Validate action
        if (!['hit', 'stand', 'double', 'split', 'surrender'].includes(action)) {
            console.error(`Invalid action: ${action}`);
            toast.error('Invalid action. Please try again.');
            return;
        }

        const validAction = action as PlayerAction;
        recordPlayerDecision(validAction);
        executeGameAction(validAction);
        triggerDealerTurn();
    }, [soundEffects, recordPlayerDecision, executeGameAction, triggerDealerTurn]);

    // Handle bet action with validation
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
            if (gameStore.placeBet) gameStore.placeBet(playerIdStr, amount);

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
    }, [validations, gameStore, analytics, gameState.trueCount, gameState.dealtCards, gameState.shoe, soundEffects]);

    // Handle clear bet with validation
    const handleClearBet = useCallback(() => {
        try {
            const validation = validations.validateClearBet();

            if (!validation.isValid) return;

            if (typeof gameState.clearBet === 'function') {
                gameState.clearBet();
                toast.info('Bet cleared');
            } else if (gameStore.placeBet && typeof gameStore.placeBet === 'function') {
                // Fallback if clearBet isn't available
                const defaultPlayerId = 'player1';
                gameStore.placeBet(defaultPlayerId, 0);
                toast.info('Bet cleared');
            } else {
                toast.warning('Cannot clear bet at this time');
            }
        } catch (error) {
            console.error('Error clearing bet:', error);
            toast.error('Error clearing bet. Please try again.');
        }
    }, [validations, gameState, gameStore]);

    // Handle deal cards with validation
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

            if (gameStore.dealCards) gameStore.dealCards();
            soundEffects.playDealSound();
        } catch (error) {
            console.error('Error dealing cards:', error);
            toast.error('Error dealing cards. Please try again.');
        }
    }, [validations, gameStore, soundEffects]);

    // Handle insurance with better error handling
    const handleTakeInsurance = useCallback(() => {
        try {
            const playerId = 'player1';
            const handId = gameState.activePlayerHandId || 'hand1';
            const amount = gameState?.bet ? gameState.bet / 2 : 0;

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

    // Handle decline insurance
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
            if (gameStore.resetRound && typeof gameStore.resetRound === 'function') {
                gameStore.resetRound();
            } else {
                console.warn('Reset round function not available');
            }
            toast.info('Round reset');
        } catch (error) {
            console.error('Error resetting round:', error);
            toast.error('Error resetting round. Please try starting a new game.');
        }
    }, [gameStore]);

    const handleNewGame = useCallback(() => {
        try {
            if (gameStore.initializeGame && typeof gameStore.initializeGame === 'function') {
                gameStore.initializeGame();
            }
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

// Custom hook for game initialization with improved error handling
function useInitializeGame(
    gameStore: GameStoreType,
    analytics: AnalyticsStore,
    gameUI: GameUIState,
    updateGameUI: (updates: Partial<GameUIState>) => void
) {
    const initializationAttempted = useRef(false);

    useEffect(() => {
        // Prevent multiple initialization attempts
        if (initializationAttempted.current) return;
        initializationAttempted.current = true;

        const initGame = async () => {
            try {
                // Preload audio first
                await AudioManager.preload();

                // Start analytics session
                analytics.startSession(gameStore.chips || 0);

                // Initialize game if needed
                if (!gameStore.isInitialized && gameStore.initializeGame && typeof gameStore.initializeGame === 'function') {
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
                } else {
                    // Still update loading state
                    updateGameUI({ isLoading: false });
                }
            } catch (error) {
                console.error('Error initializing game:', error);
                toast.error('Error initializing game. Please refresh the page.');
                updateGameUI({ isLoading: false });
            }
        };

        // Initialize with a slight delay to allow UI to render first
        TimerService.setTimer('init', initGame, 100);

        // Cleanup function that only runs on unmount
        return () => {
            TimerService.clearTimer('init');

            try {
                // End analytics session if active
                if (analytics.sessionActive) {
                    analytics.endSession(gameStore.chips || 0);
                }

                // Clean up audio resources
                AudioManager.cleanup();

                // Clear all timers
                TimerService.clearAllTimers();
            } catch (error) {
                console.error('Error cleaning up game:', error);
            }
        };
    }, [analytics, gameStore, updateGameUI, gameUI.welcomeShown]);
}

// Custom hook for round reset timing with improved timer management
function useRoundResetTiming(gamePhase: string | undefined, gameStore: GameStoreType) {
    useEffect(() => {
        // Only run this effect for completed or settlement phases
        if (gamePhase !== 'completed' && gamePhase !== 'settlement') {
            TimerService.clearTimer('roundReset');
            return;
        }

        // Set a timer to reset the round after a delay
        TimerService.setTimer('roundReset', () => {
            try {
                if (gameStore.resetRound && typeof gameStore.resetRound === 'function') {
                    gameStore.resetRound();
                } else {
                    console.warn('Reset round function not available');
                }
            } catch (error) {
                console.error('Error resetting round:', error);
                toast.error('Error resetting round. Please try starting a new game.');
            }
        }, 3000);

        // Cleanup on phase change
        return () => {
            TimerService.clearTimer('roundReset');
        };
    }, [gamePhase, gameStore]);
}

// ========== OPTIMIZED COMPONENTS ==========

// Status Message Component
const StatusMessage = React.memo(({ message, type }: { message: string, type: MessageType }) => (
    <AnimatePresence mode="wait">
        <motion.div
            key={`${message}-${type}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "rounded-lg shadow-md backdrop-blur-sm",
                "flex items-center justify-center",
                "text-white font-medium px-4 py-2",
                "will-change-transform",
                {
                    'bg-blue-500/70': type === 'info',
                    'bg-green-500/70': type === 'success',
                    'bg-amber-500/70': type === 'warning',
                    'bg-red-500/70': type === 'error'
                }
            )}
            style={{
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
            }}
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
));

StatusMessage.displayName = 'StatusMessage';

// Loading Screen Component
const LoadingScreen = React.memo(() => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-black">
        <div className="mb-8">
            <Image
                src="/images/Royal-Blackjack-Logo.png"
                alt="Royal Edge Casino"
                className="w-auto h-24 sm:h-32"
                width={128}
                height={96}
                priority
                style={{ width: 'auto', height: 'auto' }}
            />
        </div>
        <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 animate-bounce animation-delay-0" />
            <div className="w-4 h-4 rounded-full bg-amber-500 animate-bounce animation-delay-200" />
            <div className="w-4 h-4 rounded-full bg-amber-500 animate-bounce animation-delay-400" />
        </div>
    </div>
));

LoadingScreen.displayName = 'LoadingScreen';

// Ambient Lighting Component
const AmbientLighting = React.memo(({ tableColor }: { tableColor: string }) => (
    <div
        className="absolute inset-0 pointer-events-none bg-blend-overlay opacity-60 mix-blend-color-dodge table-ambient-lighting"
        data-table-color={`${tableColor}40`}
    />
));

AmbientLighting.displayName = 'AmbientLighting';

// Intro Animation Component with reduced animation complexity
const IntroAnimation = React.memo(({ isShown }: { isShown: boolean }) => (
    <AnimatePresence>
        {!isShown && (
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black will-change-opacity"
                style={{
                    transform: 'translateZ(0)'
                }}
            >
                <Image
                    src="/images/Royal-Blackjack-Logo.png"
                    alt="Royal Edge Casino"
                    className="w-auto h-32 md:h-48"
                    width={192}
                    height={128}
                    priority
                    style={{ width: 'auto', height: 'auto' }}
                />
            </motion.div>
        )}
    </AnimatePresence>
));

IntroAnimation.displayName = 'IntroAnimation';

// Game Header Component
const GameHeader = React.memo(({
    soundEnabled,
    chips,
    onToggleSound,
    onShowSettings,
    onToggleMobileMenu
}: {
    soundEnabled: boolean,
    chips: number,
    onToggleSound: () => void,
    onShowSettings: () => void,
    onToggleMobileMenu: () => void
}) => (
    <header className="fixed left-0 right-0 z-40 flex items-center justify-between p-4 top-16 bg-gradient-to-b from-black via-black/80 to-transparent backdrop-blur-sm will-change-transform transform-gpu">
        <div className="flex items-center">
            <Image
                src="/images/Royal-Blackjack-Logo.png"
                alt="Royal Edge Casino"
                className="w-auto h-8 md:h-10"
                width={40}
                height={40}
                priority
                style={{ width: 'auto', height: 'auto' }}
            />
        </div>

        <div className="flex items-center space-x-3">
            {/* Sound toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSound}
                className="rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                style={{ width: '36px', height: '36px' }}
            >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </Button>

            {/* Settings */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onShowSettings}
                className="rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60"
                style={{ width: '36px', height: '36px' }}
            >
                <Settings size={18} />
            </Button>

            {/* Mobile menu toggle (only on mobile) */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMobileMenu}
                className="rounded-full md:hidden bg-black/40 backdrop-blur-sm hover:bg-black/60"
                style={{ width: '36px', height: '36px' }}
            >
                <Menu size={18} />
            </Button>

            {/* Chips display */}
            <Badge
                variant="outline"
                className="px-3 py-1.5 bg-black/40 backdrop-blur-sm text-amber-300 border-amber-500/50 min-w-[100px] text-center"
            >
                <DollarSign className="w-4 h-4 mr-1" />
                {chips.toLocaleString()}
            </Badge>
        </div>
    </header>
));

GameHeader.displayName = 'GameHeader';

// Status Message Display Component
const StatusMessageDisplay = React.memo(({ message, type }: { message: string, type: MessageType }) => (
    <div className="absolute z-40 w-full max-w-md transform -translate-x-1/2 top-40 left-1/2 min-h-[60px] flex items-center justify-center">
        {message && <StatusMessage message={message} type={type} />}
    </div>
));

StatusMessageDisplay.displayName = 'StatusMessageDisplay';

// Game Tabs Component
const GameTabs = React.memo(({
    activeTab,
    onTabChange,
    gameContent,
    strategyContent,
    analysisContent
}: {
    activeTab: string,
    onTabChange: (tab: string) => void,
    gameContent: React.ReactNode,
    strategyContent: React.ReactNode,
    analysisContent: React.ReactNode
}) => (
    <Tabs
        value={activeTab}
        onValueChange={onTabChange}
        className="mx-auto max-w-7xl"
    >
        <TabsList className="mx-auto mb-4 border bg-black/50 border-slate-700 backdrop-blur-sm">
            <TabsTrigger value="game" className="min-w-[100px]">Main Game</TabsTrigger>
            <TabsTrigger value="strategy" className="min-w-[100px]">Strategy</TabsTrigger>
            <TabsTrigger value="analysis" className="min-w-[100px]">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="game" className="focus:outline-none">
            {gameContent}
        </TabsContent>

        <TabsContent value="strategy" className="focus:outline-none">
            {strategyContent}
        </TabsContent>

        <TabsContent value="analysis" className="focus:outline-none">
            {analysisContent}
        </TabsContent>
    </Tabs>
));

GameTabs.displayName = 'GameTabs';

// Mobile Menu Component
const MobileMenu = React.memo(({
    isOpen,
    onClose,
    onTabChange,
    onShowRules,
    onShowSideBets,
    soundEnabled,
    onToggleSound
}: {
    isOpen: boolean,
    onClose: () => void,
    onTabChange: (tab: string) => void,
    onShowRules: () => void,
    onShowSideBets: () => void,
    soundEnabled: boolean,
    onToggleSound: () => void
}) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0, x: '100%' }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-0 right-0 z-50 w-64 h-full p-4 border-l shadow-lg bg-slate-900/95 backdrop-blur-sm border-slate-700 will-change-transform"
                style={{
                    transform: 'translate3d(0,0,0)',
                    backfaceVisibility: 'hidden'
                }}
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium">Menu</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full"
                        >
                            <ChevronDown size={18} />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={() => onTabChange('game')}
                        >
                            <DollarSign className="w-5 h-5 mr-2" />
                            Main Game
                        </Button>

                        <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={() => onTabChange('strategy')}
                        >
                            <Award className="w-5 h-5 mr-2" />
                            Strategy
                        </Button>

                        <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={() => onTabChange('analysis')}
                        >
                            <BarChart2 className="w-5 h-5 mr-2" />
                            Analysis
                        </Button>

                        <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={onShowRules}
                        >
                            <HelpCircle className="w-5 h-5 mr-2" />
                            Game Rules
                        </Button>

                        <Button
                            variant="ghost"
                            className="justify-start w-full"
                            onClick={onShowSideBets}
                        >
                            <Zap className="w-5 h-5 mr-2" />
                            Side Bets
                        </Button>
                    </div>

                    <div className="mt-auto">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={onToggleSound}
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
                            {soundEnabled ? 'Sound On' : 'Sound Off'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
));

MobileMenu.displayName = 'MobileMenu';

// Game Content Component - Optimized with memoization
interface GameContentProps {
    gameState: ExtendedGameState;
    enhancedSettings: ExtendedSettingsStore;
    gameUI: GameUIState;
    playerSpots: PlayerSpot[];
    _dealerHand: HandEntity | null;
    dealerCards: Card[];
    playerCards: Card[][];
    dealerResult: 'win' | 'lose' | 'push' | undefined;
    _tableColor: string;
    updateGameUI: (updates: Partial<GameUIState>) => void;
    _soundEffects: {
        playButtonSound: () => void;
        playChipsSound: () => void;
        playDealSound: () => void;
    }; // Properly typed instead of any
    analytics: AnalyticsStore;
    _messageType: MessageType;
    handlePlayerAction: (action: string) => void;
    handleBetAction: (playerId: string | number, amount: number) => void;
    handleClearBet: () => void;
    handleDealCards: () => void;
    handleReset: () => void;
    handleNewGame: () => void;
    handleStartStop: () => void;
    handleToggleTutorial: () => void;
    handleToggleSound: () => void;
}

const GameContent = React.memo(({
    gameState,
    enhancedSettings,
    gameUI,
    playerSpots,
    _dealerHand,
    dealerCards,
    playerCards,
    dealerResult,
    _tableColor,
    updateGameUI,
    _soundEffects,
    analytics,
    _messageType,
    handlePlayerAction,
    handleBetAction,
    handleClearBet,
    handleDealCards,
    handleReset,
    handleNewGame,
    handleStartStop,
    handleToggleTutorial,
    handleToggleSound
}: GameContentProps) => {
    // Precompute values that would be calculated in render
    const currentPlayerId = useMemo(() => {
        const currentPlayer = playerSpots.find((p: PlayerSpot) => p.isCurrentPlayer);
        return String(currentPlayer?.id || '1');
    }, [playerSpots]);

    const activeHandId = useMemo(() => {
        const currentPlayer = playerSpots.find((p: PlayerSpot) => p.isCurrentPlayer);
        return `${currentPlayer?.id || '1'}-hand`;
    }, [playerSpots]);

    // Precompute available actions based on game state
    const availableActions = useMemo(() => ({
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
    }), [gameState]);

    // Create prepared players for BlackjackTable with proper memoization - use stable object references
    const preparedPlayers = useMemo(() => {
        return playerSpots.map((spot: PlayerSpot, index: number) => ({
            id: String(spot.id),
            name: spot.position === 'center' ? 'Player' : `Player ${spot.id}`,
            balance: spot.chips,
            hands: [{
                id: `${spot.id}-hand`,
                cards: playerCards[index] || [],
                bet: spot.bet,
                betChips: spot.bet > 0 ? [{
                    value: (VALID_CHIP_VALUES.find(v => v >= spot.bet) ||
                        VALID_CHIP_VALUES[VALID_CHIP_VALUES.length - 1]) as ChipValue,
                    count: 1
                }] : [],
                isActive: spot.isActive,
                result: spot.result
            }]
        }));
    }, [playerSpots, playerCards]);

    // Create prepared dealer for BlackjackTable
    const preparedDealer = useMemo(() => ({
        cards: dealerCards || [],
        isActive: gameState.gamePhase === 'dealerTurn',
        result: (dealerResult && ['win', 'lose', 'push'].includes(dealerResult)
            ? dealerResult
            : undefined)
    }), [dealerCards, gameState.gamePhase, dealerResult]);

    // Create game store data for sidebar - using primitive values in dependencies when possible
    const sidebarGameStore = useMemo(() => {
        // Create a partial implementation with the most important properties
        return {
            isLoading: false,
            error: null,
            userId: null,
            chips: gameState?.chips || 0,
            bet: gameState?.bet || 0,
            lastAction: gameState?.message || '',
            gameState: {
                currentPhase: gameState?.gamePhase || 'betting',
                count: {
                    running: gameState?.runningCount || 0,
                    true: gameState?.trueCount || 0
                },
                deck: {
                    remainingCards: gameState?.shoe?.length || 0
                }
            },
            entities: gameState.entities || { hands: {} },
            gamePhase: gameState?.gamePhase || 'betting'
        } as GameStoreType;
    }, [
        gameState?.chips,
        gameState?.bet,
        gameState?.message,
        gameState?.gamePhase,
        gameState?.runningCount,
        gameState?.trueCount,
        gameState?.shoe?.length,
        gameState.entities
    ]);

    // Create enhanced settings for sidebar - extract only needed primitives
    const sidebarEnhancedSettings = useMemo(() => {
        const showCountingInfo = !!enhancedSettings.showCountingInfo;
        const showBasicStrategy = !!enhancedSettings.showBasicStrategy;
        const showProbabilities = !!enhancedSettings.showProbabilities;
        const gameRules = enhancedSettings.gameRules || { minBet: 5, maxBet: 500 };
        const tableColorValue = enhancedSettings.tableColor;

        // Create a partial implementation with the most important properties
        return {
            countingSystem: showCountingInfo ? 'hi-lo' : 'none',
            showCountingInfo,
            showBasicStrategy,
            showProbabilities,
            gameRules,
            tableColor: tableColorValue
        } as ExtendedSettingsStore;
    }, [
        enhancedSettings.showCountingInfo,
        enhancedSettings.showBasicStrategy,
        enhancedSettings.showProbabilities,
        enhancedSettings.gameRules,
        enhancedSettings.tableColor
    ]);

    // Create analytics data for sidebar - extract only needed primitives
    const sidebarAnalytics = useMemo(() => {
        const handsPlayed = analytics.gameStats?.handsPlayed || 0;
        const handsWon = analytics.gameStats?.handsWon || 0;
        const handsLost = analytics.gameStats?.handsLost || 0;
        const pushes = analytics.gameStats?.pushes || 0;
        const blackjacks = analytics.gameStats?.blackjacks || 0;
        const netProfit = analytics.gameStats?.netProfit || 0;

        return {
            gameStats: {
                handsPlayed,
                handsWon,
                handsLost,
                handsPushed: pushes,
                blackjacks,
                netProfit
            }
        };
    }, [
        analytics.gameStats?.handsPlayed,
        analytics.gameStats?.handsWon,
        analytics.gameStats?.handsLost,
        analytics.gameStats?.pushes,
        analytics.gameStats?.blackjacks,
        analytics.gameStats?.netProfit
    ]);

    // Handle sidebar dialog toggles with proper memoization
    const handleShowRulesDialog = useCallback(() => {
        updateGameUI({ showRulesDialog: true });
    }, [updateGameUI]);

    const handleShowStrategyDialog = useCallback(() => {
        updateGameUI({ showStrategyDialog: true });
    }, [updateGameUI]);

    const handleShowSettings = useCallback(() => {
        updateGameUI({ showSettings: true });
    }, [updateGameUI]);

    const handleShowAnalytics = useCallback(() => {
        updateGameUI({ activeTab: 'analysis' });
    }, [updateGameUI]);

    // Custom handler for table bets to reduce re-renders
    const handleTableBet = useCallback((playerId: string, bet: number) => {
        handleBetAction(playerId, bet);
    }, [handleBetAction]);

    // Custom handler for table actions to reduce re-renders
    const handleTableAction = useCallback((action: string) => {
        handlePlayerAction(action);
    }, [handlePlayerAction]);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Main blackjack table */}
            <div className="lg:col-span-3 h-[60vh] md:h-[70vh] relative">
                <BlackjackTable
                    dealer={preparedDealer}
                    players={preparedPlayers}
                    currentPlayerId={currentPlayerId}
                    activeHandId={activeHandId}
                    gamePhase={convertGamePhase(gameState.gamePhase)}
                    minBet={enhancedSettings.gameRules?.minBet || 5}
                    maxBet={enhancedSettings.gameRules?.maxBet || 500}
                    availableActions={availableActions}
                    recommendedAction={enhancedSettings.showBasicStrategy ? 'hit' : undefined}
                    message={gameState.message && !gameState.message.includes('Bet placed:') ? gameState.message : ''}
                    darkMode={true}
                    onPlaceBet={handleTableBet}
                    onClearBet={handleClearBet}
                    onAction={handleTableAction}
                    onDealCards={handleDealCards}
                    showBettingControls={false}
                />

                {/* Game controls - positioned below the table */}
                <div className="w-full py-4 mt-4">
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
                        onShowSettings={handleShowSettings}
                        onShowStatistics={handleShowAnalytics}
                    />
                </div>

                {/* Probability display when enabled */}
                {enhancedSettings.showProbabilities && gameState.activePlayerHandId && (
                    <div className="absolute z-20 w-64 bottom-4 left-4">
                        {/* Probability card content would go here */}
                    </div>
                )}
            </div>

            {/* Sidebar content */}
            <div className="flex flex-col space-y-4">
                <GameSidebar
                    // @ts-expect-error TODO: Update GameSidebar to accept both GameStoreType and ExtendedGameStore
                    gameStore={sidebarGameStore}
                    // @ts-expect-error TODO: Update GameSidebar to accept both ExtendedSettingsStore and EnhancedSettingsStore
                    enhancedSettings={sidebarEnhancedSettings}
                    analytics={sidebarAnalytics}
                    setShowRulesDialog={handleShowRulesDialog}
                    setShowBasicStrategyDialog={handleShowStrategyDialog}
                />
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render when these specific props change
    return (
        prevProps.gameState.gamePhase === nextProps.gameState.gamePhase &&
        prevProps.gameState.bet === nextProps.gameState.bet &&
        prevProps.gameState.chips === nextProps.gameState.chips &&
        prevProps.gameState.message === nextProps.gameState.message &&
        prevProps.gameState.runningCount === nextProps.gameState.runningCount &&
        prevProps.gameState.trueCount === nextProps.gameState.trueCount &&
        prevProps.gameState.activePlayerHandId === nextProps.gameState.activePlayerHandId &&
        prevProps.gameUI.isGamePlaying === nextProps.gameUI.isGamePlaying &&
        prevProps.gameUI.soundEnabled === nextProps.gameUI.soundEnabled &&
        prevProps.gameUI.tutorialMode === nextProps.gameUI.tutorialMode &&
        prevProps._tableColor === nextProps._tableColor &&
        prevProps.playerSpots.length === nextProps.playerSpots.length &&
        prevProps.dealerCards.length === nextProps.dealerCards.length &&
        JSON.stringify(prevProps.enhancedSettings.gameRules) === JSON.stringify(nextProps.enhancedSettings.gameRules)
    );
});

GameContent.displayName = 'GameContent';

// Placeholder content components
const StrategyContent = React.memo(() => <div>Strategy content would be here</div>);
StrategyContent.displayName = 'StrategyContent';

const AnalysisContent = React.memo(() => <div>Analysis content would be here</div>);
AnalysisContent.displayName = 'AnalysisContent';

// Game Dialogs Component - Add typed props
interface GameDialogsProps {
    gameUI: GameUIState;
    updateGameUI: (updates: Partial<GameUIState>) => void;
    gameState: ExtendedGameState;
    enhancedSettings: ExtendedSettingsStore;
    gameStore: GameStoreType;
    _dealerHand: HandEntity | null;
    _handleTakeInsurance: () => void;
    _handleDeclineInsurance: () => void;
}

// Game Dialogs Component
const GameDialogs = React.memo(({
    gameUI,
    updateGameUI,
    gameState,
    enhancedSettings,
    gameStore,
    _dealerHand,
    _handleTakeInsurance,
    _handleDeclineInsurance
}: GameDialogsProps) => {
    // Create callback for rules dialog close to reduce re-renders
    const handleRulesDialogClose = useCallback(() => {
        updateGameUI({ showRulesDialog: false });
    }, [updateGameUI]);

    // Create callback for rules change to reduce re-renders
    const handleRulesChanged = useCallback(() => {
        try {
            // Re-initialize game with new rules
            if (enhancedSettings.gameRules && typeof gameState.updateRules === 'function') {
                gameState.updateRules(enhancedSettings.gameRules);
                toast.success('Game rules updated');
            } else {
                // Fallback to reset if needed
                gameStore.initializeGame?.();
                toast.success('Game restarted with new rules');
            }
        } catch (error) {
            console.error('Error updating rules:', error);
            toast.error('Error updating rules. Please try again.');
        }
    }, [enhancedSettings.gameRules, gameState, gameStore]);

    // Create callback for dialog open change to reduce re-renders
    const handleRulesOpenChange = useCallback((open: boolean) => {
        updateGameUI({ showRulesDialog: open });
    }, [updateGameUI]);

    return (
        <>
            {/* Rules Dialog */}
            <Dialog
                open={gameUI.showRulesDialog}
                onOpenChange={handleRulesOpenChange}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogTitle>Game Rules</DialogTitle>
                    <RuleConfiguration
                        onClose={handleRulesDialogClose}
                        onRulesChanged={handleRulesChanged}
                    />
                </DialogContent>
            </Dialog>

            {/* Other dialogs would follow similar pattern */}
            {/* Strategy dialog, Settings dialog, Insurance dialog, Side Bets dialog */}
        </>
    );
});

GameDialogs.displayName = 'GameDialogs';

// ========== MAIN COMPONENT ==========

// BlackjackPage Component - refactored to use custom hooks
const BlackjackPage = () => {
    console.log('Rendering BlackjackPage');

    // Access game stores with performance tracking
    const startTime = performance.now();
    const gameStore = useGameStore();
    const settingsStore = useEnhancedSettingsStore();
    const analytics = useAnalyticsStore();
    console.log(`Stores loaded in ${performance.now() - startTime}ms`);

    // Memoize derived state to prevent reference changes on every render
    const gameState = useMemo(() => ({
        ...gameStore as unknown as _GameStore & ExtendedGameState
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

    // Function to update specific UI state properties - memoized to prevent recreation
    const updateGameUI = useCallback((updates: Partial<GameUIState>) => {
        setGameUI(prev => ({ ...prev, ...updates }));
    }, []);

    // Use custom hooks
    const { statusMessage, messageType: _messageType } = useGameMessages(gameState);
    const soundEffects = useSoundEffects(gameUI.soundEnabled);
    const { playerSpots, dealerHand, dealerCards, playerCards, dealerResult } = useGameEntities(gameState);
    const validations = useValidations(gameState);

    // Pass gameState sounds to be played based on changes
    useEffect(() => {
        soundEffects.handleGameStateSound(
            gameState.gamePhase,
            gameState.roundResult ?? null,
            gameState.bet
        );
    }, [
        soundEffects,
        gameState.gamePhase,
        gameState.roundResult,
        gameState.bet
    ]);

    const {
        handlePlayerAction,
        handleBetAction,
        handleClearBet,
        handleDealCards,
        handleTakeInsurance,
        handleDeclineInsurance,
        handleReset,
        handleNewGame
    } = useGameActions(
        // @ts-expect-error TODO: Update useGameActions to accept ExtendedGameStore
        gameStore,
        gameState,
        analytics,
        validations,
        soundEffects
    );

    // Initialize game
    // @ts-expect-error TODO: Update useInitializeGame to accept ExtendedGameStore
    useInitializeGame(gameStore, analytics, gameUI, updateGameUI);

    // Monitor insurance state
    useEffect(() => {
        if (gameState.showInsurance !== gameUI.showInsuranceDialog) {
            updateGameUI({ showInsuranceDialog: !!gameState.showInsurance });
        }
    }, [gameState.showInsurance, gameUI.showInsuranceDialog, updateGameUI]);

    // Handle round reset timing
    // @ts-expect-error TODO: Update useRoundResetTiming to accept ExtendedGameStore
    useRoundResetTiming(gameState.gamePhase, gameStore);

    // Simple state handlers with updater function - memoized to prevent recreation
    const handleStartStop = useCallback(() => {
        updateGameUI({ isGamePlaying: !gameUI.isGamePlaying });
    }, [updateGameUI, gameUI.isGamePlaying]);

    const handleToggleTutorial = useCallback(() => {
        updateGameUI({ tutorialMode: !gameUI.tutorialMode });
    }, [updateGameUI, gameUI.tutorialMode]);

    const handleToggleSound = useCallback(() => {
        updateGameUI({ soundEnabled: !gameUI.soundEnabled });
    }, [updateGameUI, gameUI.soundEnabled]);

    const handleShowMobileMenu = useCallback(() => {
        updateGameUI({ showMobileMenu: !gameUI.showMobileMenu });
    }, [updateGameUI, gameUI.showMobileMenu]);

    const handleCloseMobileMenu = useCallback(() => {
        updateGameUI({ showMobileMenu: false });
    }, [updateGameUI]);

    const handleShowSettings = useCallback(() => {
        updateGameUI({ showSettings: true });
    }, [updateGameUI]);

    // Table color from settings
    const tableColor = enhancedSettings.tableColor || '#1a5f7a';

    // Render different states
    if (gameUI.isLoading) {
        return <LoadingScreen />;
    }

    return (
        <ErrorBoundary>
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 to-black">
                {/* Ambient lighting effects */}
                <AmbientLighting tableColor={tableColor} />

                <Toaster position="top-center" expand={false} richColors />

                {/* Intro animation */}
                <IntroAnimation isShown={gameUI.isIntroShown} />

                {/* Main header */}
                <GameHeader
                    soundEnabled={gameUI.soundEnabled}
                    chips={gameState?.chips || 0}
                    onToggleSound={handleToggleSound}
                    onShowSettings={handleShowSettings}
                    onToggleMobileMenu={handleShowMobileMenu}
                />

                {/* Mobile menu drawer */}
                <MobileMenu
                    isOpen={gameUI.showMobileMenu}
                    onClose={handleCloseMobileMenu}
                    onTabChange={(tab) => updateGameUI({ activeTab: tab, showMobileMenu: false })}
                    onShowRules={() => updateGameUI({ showRulesDialog: true, showMobileMenu: false })}
                    onShowSideBets={() => updateGameUI({ showSideBets: true, showMobileMenu: false })}
                    soundEnabled={gameUI.soundEnabled}
                    onToggleSound={handleToggleSound}
                />

                {/* Main game content */}
                <main className="relative min-h-screen px-4 overflow-x-hidden pt-36 pb-28 md:px-8">
                    {/* Status message display */}
                    <StatusMessageDisplay message={statusMessage} type={_messageType} />

                    <GameTabs
                        activeTab={gameUI.activeTab}
                        onTabChange={(tab) => updateGameUI({ activeTab: tab })}
                        gameContent={
                            <GameContent
                                gameState={gameState}
                                enhancedSettings={enhancedSettings}
                                gameUI={gameUI}
                                playerSpots={playerSpots}
                                _dealerHand={dealerHand || null}
                                dealerCards={dealerCards as Card[]}
                                playerCards={playerCards as Card[][]}
                                dealerResult={(dealerResult && ['win', 'lose', 'push'].includes(dealerResult))
                                    ? dealerResult as 'win' | 'lose' | 'push'
                                    : undefined}
                                _tableColor={tableColor}
                                updateGameUI={updateGameUI}
                                _soundEffects={soundEffects}
                                analytics={analytics as unknown as AnalyticsStore}
                                _messageType={_messageType}
                                handlePlayerAction={handlePlayerAction}
                                handleBetAction={handleBetAction}
                                handleClearBet={handleClearBet}
                                handleDealCards={handleDealCards}
                                handleReset={handleReset}
                                handleNewGame={handleNewGame}
                                handleStartStop={handleStartStop}
                                handleToggleTutorial={handleToggleTutorial}
                                handleToggleSound={handleToggleSound}
                            />
                        }
                        strategyContent={<StrategyContent />}
                        analysisContent={<AnalysisContent />}
                    />
                </main>

                {/* Dialogs */}
                <GameDialogs
                    gameUI={gameUI}
                    updateGameUI={updateGameUI}
                    gameState={gameState}
                    enhancedSettings={enhancedSettings}
                    // @ts-expect-error TODO: Update GameDialogs to accept ExtendedGameStore
                    gameStore={gameStore}
                    _dealerHand={dealerHand || null}
                    _handleTakeInsurance={handleTakeInsurance}
                    _handleDeclineInsurance={handleDeclineInsurance}
                />
            </div>
        </ErrorBoundary>
    );
};

// Main export component with error boundary
export default function BlackjackPageWrapper() {
    // Performance monitoring code removed to fix loading error
    return <BlackjackPage />;
}