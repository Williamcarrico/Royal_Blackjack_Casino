/**
 * UI-related type definitions for the blackjack game
 */

// UI theme settings
export interface UITheme {
    mode: 'light' | 'dark' | 'system';
    tableColor: string;
    feltTexture: string;
    accentColor: string;
    cardDesign: string;
    chipDesign: string;
    fontFamily: string;
}

// UI animation settings
export interface AnimationSettings {
    speed: 'slow' | 'normal' | 'fast';
    dealingDuration: number;
    shufflingDuration: number;
    actionDelay: number;
    resultDisplayDuration: number;
    enableAnimations: boolean;
    enableParticles: boolean;
    enableSoundEffects: boolean;
}

// UI sound settings
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

// Table layout options
export type TableLayout =
    | 'classic'    // Semicircular layout
    | 'modern'     // Linear layout
    | 'stadium'    // Stadium-style layout
    | 'compact'    // Compact layout for small screens
    | 'immersive'; // Full-screen immersive layout

// Player position
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

// Card position
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

// Animation sequence
export interface AnimationSequence {
    id: string;
    type: 'deal' | 'hit' | 'collect' | 'shuffle' | 'flip' | 'slide';
    duration: number;
    delay: number;
    elements: string[];
    onComplete?: () => void;
}

// Modal type
export type ModalType =
    | 'settings'
    | 'rules'
    | 'statistics'
    | 'history'
    | 'strategy'
    | 'help'
    | 'login'
    | 'register'
    | 'confirm'
    | 'result';

// Modal options
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

// Toast message
export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
    position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
    onClose?: () => void;
}

// Game table dimensions
export interface TableDimensions {
    width: number;
    height: number;
    playerPositions: PlayerPosition[];
    dealerPosition: {
        x: number;
        y: number;
    };
    deckPosition: {
        x: number;
        y: number;
    };
    chipStackPosition: {
        x: number;
        y: number;
    };
    actionAreaPosition: {
        x: number;
        y: number;
    };
    messageAreaPosition: {
        x: number;
        y: number;
    };
    responsive: {
        smallScreen: Partial<TableDimensions>;
        mediumScreen: Partial<TableDimensions>;
        largeScreen: Partial<TableDimensions>;
    };
}

// Screen orientation
export type ScreenOrientation = 'portrait' | 'landscape';

// Responsive breakpoints
export interface ResponsiveBreakpoints {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
}

// UI state
export interface UIState {
    theme: UITheme;
    animation: AnimationSettings;
    sound: SoundSettings;
    layout: TableLayout;
    dimensions: TableDimensions;
    currentModal: ModalOptions | null;
    toasts: ToastMessage[];
    orientation: ScreenOrientation;
    isFullscreen: boolean;
    isMobile: boolean;
    breakpoints: ResponsiveBreakpoints;
    tableDimensions: {
        width: number;
        height: number;
    };
    windowDimensions: {
        width: number;
        height: number;
    };
    zoomLevel: number;
    focusMode: boolean;
    tutorialMode: boolean;
    accessibilityMode: boolean;

    // Actions
    setTheme: (theme: Partial<UITheme>) => void;
    setAnimation: (animation: Partial<AnimationSettings>) => void;
    setSound: (sound: Partial<SoundSettings>) => void;
    setLayout: (layout: TableLayout) => void;
    openModal: (options: Omit<ModalOptions, 'isOpen'>) => void;
    closeModal: () => void;
    showToast: (toast: Omit<ToastMessage, 'id'>) => void;
    dismissToast: (id: string) => void;
    toggleFullscreen: () => void;
    toggleFocusMode: () => void;
    toggleTutorialMode: () => void;
    toggleAccessibilityMode: () => void;
    setZoomLevel: (level: number) => void;
    handleResize: () => void;
    handleOrientationChange: () => void;
}

// UI customization options
export interface UICustomizationOptions {
    tableColors: string[];
    feltTextures: string[];
    accentColors: string[];
    cardDesigns: string[];
    chipDesigns: string[];
    fontFamilies: string[];
    layouts: TableLayout[];
    musicTracks: string[];
}

// UI elements
export type UIElement =
    | 'card'
    | 'chip'
    | 'button'
    | 'table'
    | 'dealer'
    | 'player'
    | 'hand'
    | 'actionPanel'
    | 'betArea'
    | 'messageArea'
    | 'statusArea'
    | 'controlPanel'
    | 'statisticsPanel';

// UI element state
export type UIElementState =
    | 'default'
    | 'hover'
    | 'active'
    | 'disabled'
    | 'highlighted'
    | 'selected'
    | 'error'
    | 'success'
    | 'warning';

// UI element style mapping
export type UIElementStyleMap = Record<UIElement, Record<UIElementState, React.CSSProperties>>;

// Accessibility options
export interface AccessibilityOptions {
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    reducedMotion: boolean;
    keyboardShortcuts: boolean;
    colorBlindMode: boolean;
    colorBlindType: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia' | 'none';
}