/**
 * UI domain model types for Royal Blackjack Casino
 */

import { ToastID } from '../branded';
import {
    ChipSize,
    AnimationSpeed,
    OutcomeType,
    ThemeMode
} from '../enums';

/**
 * UI theme settings
 */
export interface UITheme {
    mode: ThemeMode;
    tableColor: string;
    feltTexture: string;
    accentColor: string;
    cardDesign: string;
    chipDesign: string;
    fontFamily: string;
}

/**
 * UI animation settings
 */
export interface AnimationSettings {
    speed: AnimationSpeed;
    dealingDuration: number;
    shufflingDuration: number;
    actionDelay: number;
    resultDisplayDuration: number;
    enableAnimations: boolean;
    enableParticles: boolean;
    enableSoundEffects: boolean;
}

/**
 * UI sound settings
 */
export interface SoundSettings {
    masterVolume: number;
    musicVolume: number;
    effectsVolume: number;
    dealingSound: boolean;
    shufflingSound: boolean;
    chipsSound: boolean;
    winSound: boolean;
    loseSound: boolean;
    pushSound: boolean;
    blackjackSound: boolean;
    bustSound: boolean;
    buttonSound: boolean;
    ambientSound: boolean;
    musicTrack: string;
}

/**
 * Table layout options
 */
export enum TableLayout {
    CLASSIC = 'classic',
    MODERN = 'modern',
    STADIUM = 'stadium',
    COMPACT = 'compact',
    IMMERSIVE = 'immersive'
}

/**
 * Player position
 */
export interface PlayerPosition {
    id: string;
    index: number;
    isActive: boolean;
    coordinates: {
        x: number;
        y: number;
    };
    scale: number;
    rotation: number;
}

/**
 * Card position
 */
export interface CardPosition {
    handId: string;
    cardIndex: number;
    coordinates: {
        x: number;
        y: number;
    };
    rotation: number;
    scale: number;
    zIndex: number;
}

/**
 * Animation sequence
 */
export interface AnimationSequence {
    id: string;
    type: 'deal' | 'hit' | 'collect' | 'shuffle' | 'flip' | 'slide';
    duration: number;
    delay: number;
    elements: string[];
    onComplete?: () => void;
}

/**
 * Modal type
 */
export enum ModalType {
    SETTINGS = 'settings',
    RULES = 'rules',
    STATISTICS = 'statistics',
    HISTORY = 'history',
    STRATEGY = 'strategy',
    HELP = 'help',
    LOGIN = 'login',
    REGISTER = 'register',
    CONFIRM = 'confirm',
    RESULT = 'result'
}

/**
 * Modal options
 */
export interface ModalOptions {
    type: ModalType;
    title: string;
    content: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    position?: 'center' | 'top' | 'right' | 'bottom' | 'left';
    closeOnOutsideClick?: boolean;
    showCloseButton?: boolean;
    animation?: 'fade' | 'slide' | 'scale' | 'none';
}

/**
 * Toast type
 */
export enum ToastType {
    SUCCESS = 'success',
    ERROR = 'error',
    INFO = 'info',
    WARNING = 'warning'
}

/**
 * Toast position
 */
export enum ToastPosition {
    TOP_RIGHT = 'top-right',
    TOP_CENTER = 'top-center',
    TOP_LEFT = 'top-left',
    BOTTOM_RIGHT = 'bottom-right',
    BOTTOM_CENTER = 'bottom-center',
    BOTTOM_LEFT = 'bottom-left'
}

/**
 * Toast message
 */
export interface ToastMessage {
    id: ToastID;
    type: ToastType;
    message: string;
    duration?: number;
    position?: ToastPosition;
    onClose?: () => void;
}

/**
 * Screen orientation
 */
export enum ScreenOrientation {
    PORTRAIT = 'portrait',
    LANDSCAPE = 'landscape'
}

/**
 * Responsive breakpoints
 */
export interface ResponsiveBreakpoints {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
}

/**
 * UI Element types
 */
export enum UIElement {
    CARD = 'card',
    CHIP = 'chip',
    BUTTON = 'button',
    TABLE = 'table',
    DEALER = 'dealer',
    PLAYER = 'player',
    HAND = 'hand',
    ACTION_PANEL = 'actionPanel',
    BET_AREA = 'betArea',
    MESSAGE_AREA = 'messageArea',
    STATUS_AREA = 'statusArea',
    CONTROL_PANEL = 'controlPanel',
    STATISTICS_PANEL = 'statisticsPanel'
}

/**
 * UI Element states
 */
export enum UIElementState {
    DEFAULT = 'default',
    HOVER = 'hover',
    ACTIVE = 'active',
    DISABLED = 'disabled',
    HIGHLIGHTED = 'highlighted',
    SELECTED = 'selected',
    ERROR = 'error',
    SUCCESS = 'success',
    WARNING = 'warning'
}

/**
 * Accessibility options
 */
export interface AccessibilityOptions {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    reducedMotion: boolean;
    keyboardShortcuts: boolean;
    colorBlindMode: boolean;
    colorBlindType: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | 'none';
}