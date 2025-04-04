/**
 * Component prop type definitions for the blackjack game
 */
import { ReactNode } from 'react';
import {
    Card} from './cardTypes';
import {
    Hand,
    DealerHand,
    HandAction} from './handTypes';
import {
    ChipValue,
    Chip,
    SideBetType,
    TableLimits
} from './betTypes';
import {
    GameState,
    GamePhase,
    GameStatus,
    GameVariant,
    GameOptions,
    Player
} from './gameTypes';

// Layout props
export interface LayoutProps {
    children: ReactNode;
}

// Card component props
export interface CardProps {
    card: Card;
    faceUp?: boolean;
    isDealing?: boolean;
    index?: number;
    isHighlighted?: boolean;
    isSelectable?: boolean;
    onClick?: (card: Card) => void;
    style?: React.CSSProperties;
    className?: string;
}

// Card back props
export interface CardBackProps {
    design?: string;
    className?: string;
    style?: React.CSSProperties;
}

// Hand component props
export interface HandProps {
    hand: Hand;
    isActive?: boolean;
    isDealer?: boolean;
    showValue?: boolean;
    showActions?: boolean;
    onAction?: (action: HandAction) => void;
    className?: string;
    style?: React.CSSProperties;
}

// Dealer hand props
export interface DealerHandProps {
    hand: DealerHand;
    isRevealed?: boolean;
    phase: GamePhase;
    className?: string;
    style?: React.CSSProperties;
}

// Chip component props
export interface ChipProps {
    value: ChipValue;
    count?: number;
    isSelected?: boolean;
    isDisabled?: boolean;
    onClick?: (value: ChipValue) => void;
    style?: React.CSSProperties;
    className?: string;
}

// Chip stack props
export interface ChipStackProps {
    chips: Chip[];
    total: number;
    isInteractive?: boolean;
    onChipClick?: (value: ChipValue) => void;
    className?: string;
    style?: React.CSSProperties;
}

// Betting area props
export interface BettingAreaProps {
    player: Player;
    isActive?: boolean;
    minBet: number;
    maxBet: number;
    currentBet: number;
    availableChips: ChipValue[];
    onBetChange: (amount: number) => void;
    onBetConfirm: () => void;
    onBetClear: () => void;
    className?: string;
    style?: React.CSSProperties;
}

// Action button props
export interface ActionButtonProps {
    action: HandAction;
    isDisabled?: boolean;
    onClick: () => void;
    hotkey?: string;
    className?: string;
    style?: React.CSSProperties;
}

// Action panel props
export interface ActionPanelProps {
    availableActions: HandAction[];
    onAction: (action: HandAction) => void;
    isDisabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Game table props
export interface GameTableProps {
    gameState: GameState;
    onAction: (action: HandAction, handId: string) => void;
    onBet: (amount: number) => void;
    className?: string;
    style?: React.CSSProperties;
}

// Player position props
export interface PlayerPositionProps {
    player: Player;
    index: number;
    isActive: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Game controls props
export interface GameControlsProps {
    gamePhase: GamePhase;
    onNewGame: () => void;
    onDeal: () => void;
    onClearBets: () => void;
    onRepeatBet: () => void;
    onDoubleBet: () => void;
    onHalfBet: () => void;
    isDisabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Game status props
export interface GameStatusProps {
    phase: GamePhase;
    status: GameStatus;
    message?: string;
    className?: string;
    style?: React.CSSProperties;
}

// Side bet area props
export interface SideBetAreaProps {
    type: SideBetType;
    minBet: number;
    maxBet: number;
    currentBet: number;
    availableChips: ChipValue[];
    isActive: boolean;
    onBetChange: (amount: number) => void;
    onBetConfirm: () => void;
    onBetClear: () => void;
    className?: string;
    style?: React.CSSProperties;
}

// Statistics panel props
export interface StatisticsPanelProps {
    handsPlayed: number;
    winRate: number;
    netProfit: number;
    blackjackRate: number;
    bustRate: number;
    averageBet: number;
    className?: string;
    style?: React.CSSProperties;
}

// Card counting display props
export interface CardCountingDisplayProps {
    runningCount: number;
    trueCount: number;
    decksRemaining: number;
    system: string;
    showAdvice?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Game options panel props
export interface GameOptionsPanelProps {
    currentOptions: GameOptions;
    variants: GameVariant[];
    onOptionChange: (options: Partial<GameOptions>) => void;
    onVariantChange: (variant: GameVariant) => void;
    className?: string;
    style?: React.CSSProperties;
}

// Settings modal props
export interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        audioEnabled: boolean;
        volume: number;
        musicEnabled: boolean;
        musicVolume: number;
        animationSpeed: 'slow' | 'normal' | 'fast';
        tableColor: string;
        cardBack: string;
        chipStyle: string;
        darkMode: boolean;
        showProbabilities: boolean;
        showBasicStrategy: boolean;
        confirmActions: boolean;
    };
    onSettingsChange: (settings: Partial<SettingsModalProps['settings']>) => void;
    className?: string;
    style?: React.CSSProperties;
}

// Bet history props
export interface BetHistoryProps {
    bets: Array<{
        amount: number;
        result: string;
        payout: number;
        timestamp: Date;
    }>;
    className?: string;
    style?: React.CSSProperties;
}

// Game history props
export interface GameHistoryProps {
    games: Array<{
        id: string;
        variant: GameVariant;
        handsPlayed: number;
        netProfit: number;
        timestamp: Date;
        duration: number;
    }>;
    className?: string;
    style?: React.CSSProperties;
}

// Basic strategy chart props
export interface BasicStrategyChartProps {
    variant: GameVariant;
    playerHand?: Hand;
    dealerCard?: Card;
    highlightCurrent?: boolean;
    isInteractive?: boolean;
    onActionSelect?: (action: HandAction) => void;
    className?: string;
    style?: React.CSSProperties;
}

// Probability display props
export interface ProbabilityDisplayProps {
    playerHand: Hand;
    dealerUpCard: Card;
    remainingCards: Card[];
    showProbabilities: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Progressive betting control props
export interface ProgressiveBettingControlProps {
    strategies: Array<{
        id: string;
        name: string;
        description: string;
        risk: 'low' | 'medium' | 'high';
    }>;
    selectedStrategy: string | null;
    isEnabled: boolean;
    baseBet: number;
    minBet: number;
    maxBet: number;
    onStrategyChange: (strategyId: string | null) => void;
    onEnableChange: (enabled: boolean) => void;
    onBaseBetChange: (amount: number) => void;
    className?: string;
    style?: React.CSSProperties;
}

// Table limits display props
export interface TableLimitsDisplayProps {
    limits: TableLimits;
    className?: string;
    style?: React.CSSProperties;
}

// Game timer props
export interface GameTimerProps {
    startTime: Date;
    isRunning: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Card animation props
export interface CardAnimationProps {
    card: Card;
    from: { x: number; y: number };
    to: { x: number; y: number };
    duration: number;
    onComplete: () => void;
    className?: string;
    style?: React.CSSProperties;
}

// Result message props
export interface ResultMessageProps {
    result: 'win' | 'loss' | 'push' | 'blackjack' | 'surrender';
    amount: number;
    isVisible: boolean;
    className?: string;
    style?: React.CSSProperties;
}

// Dealer's rule display props
export interface DealerRulesDisplayProps {
    dealerHitsSoft17: boolean;
    blackjackPayout: number;
    className?: string;
    style?: React.CSSProperties;
}