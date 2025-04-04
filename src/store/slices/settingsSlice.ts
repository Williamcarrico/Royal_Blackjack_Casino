'use client';

/**
 * Settings Slice
 *
 * Manages user preferences and game settings.
 * Provides centralized configuration for UI, gameplay, and technical settings.
 */
import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import type { GameVariant, GameOptions } from '@/types/gameTypes';

// Theme options
export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system',
}

// Card visual style options
export enum CardStyle {
    CLASSIC = 'classic',
    MODERN = 'modern',
    RETRO = 'retro',
}

// Animation speed options
export type AnimationSpeed = 'slow' | 'normal' | 'fast';

// Counting system options
export type CountingSystem =
    | 'none'
    | 'hi-lo'
    | 'hi-opt-i'
    | 'hi-opt-ii'
    | 'omega-ii'
    | 'red7'
    | 'zen';

// Define advanced rules configuration
export interface AdvancedRules {
    dealerPeeks: boolean;
    surrenderAllowed: 'none' | 'early' | 'late';
    doubleAllowed: 'any2' | '9-11' | '10-11' | 'none';
    doubleAfterSplit: boolean;
    resplitAllowed: boolean;
    resplitAcesAllowed: boolean;
    hitSplitAces: boolean;
    maxSplits: number;
    maxHands: number;
    dealer17: 'stand' | 'hit';
}

// Define the store state
interface SettingsState {
    // UI settings
    theme: Theme;
    language: string;
    currency: string;
    cardStyle: CardStyle;
    cardBack: string;
    chipStyle: string;
    tableColor: string;
    darkMode: boolean;
    animationSpeed: AnimationSpeed;

    // Game settings
    autoStand17: boolean;
    showProbabilities: boolean;
    showBasicStrategy: boolean;
    confirmActions: boolean;

    // Advanced settings
    advancedRules: AdvancedRules;
    countingSystem: CountingSystem;
    tableRules: Record<GameVariant, GameOptions>;

    // Actions
    setTheme: (theme: Theme) => void;
    setDarkMode: (darkMode: boolean) => void;
    setLanguage: (language: string) => void;
    setCurrency: (currency: string) => void;
    setCardStyle: (style: CardStyle) => void;
    setCardBack: (cardBack: string) => void;
    setChipStyle: (chipStyle: string) => void;
    setTableColor: (color: string) => void;
    setAnimationSpeed: (speed: AnimationSpeed) => void;
    toggleAutoStand17: () => void;
    toggleShowProbabilities: () => void;
    toggleShowBasicStrategy: () => void;
    toggleConfirmActions: () => void;
    updateAdvancedRules: (rules: Partial<AdvancedRules>) => void;
    setCountingSystem: (system: CountingSystem) => void;
    updateVariantRules: (variant: GameVariant, options: Partial<GameOptions>) => void;
    updateSettings: (settings: Partial<SettingsState>) => void;
    resetSettings: () => void;
}

// Default advanced rules
const DEFAULT_ADVANCED_RULES: AdvancedRules = {
    dealerPeeks: true,
    surrenderAllowed: 'late',
    doubleAllowed: 'any2',
    doubleAfterSplit: true,
    resplitAllowed: true,
    resplitAcesAllowed: false,
    hitSplitAces: false,
    maxSplits: 3,
    maxHands: 4,
    dealer17: 'stand',
};

// Create a function that returns the slice for integration with the main store
export const createSettingsSlice = (
    set: (partial: Partial<SettingsState> | ((state: SettingsState) => Partial<SettingsState>)) => void,
    _get: () => SettingsState
): SettingsState => ({
    // UI settings - initial values
    theme: Theme.SYSTEM,
    language: 'en',
    currency: 'USD',
    cardStyle: CardStyle.CLASSIC,
    cardBack: 'default',
    chipStyle: 'classic',
    tableColor: '#076324',
    darkMode: false,
    animationSpeed: 'normal' as AnimationSpeed,

    // Game settings - initial values
    autoStand17: true,
    showProbabilities: false,
    showBasicStrategy: false,
    confirmActions: true,

    // Advanced settings - initial values
    advancedRules: DEFAULT_ADVANCED_RULES,
    countingSystem: 'hi-lo',
    tableRules: {} as Record<GameVariant, GameOptions>,

    // Set theme
    setTheme: (theme: Theme) => set({ theme }),

    // Set dark mode
    setDarkMode: (darkMode: boolean) => set({ darkMode }),

    // Set language
    setLanguage: (language: string) => set({ language }),

    // Set currency
    setCurrency: (currency: string) => set({ currency }),

    // Set card style
    setCardStyle: (style: CardStyle) => set({ cardStyle: style }),

    // Set card back design
    setCardBack: (cardBack: string) => set({ cardBack }),

    // Set chip style
    setChipStyle: (chipStyle: string) => set({ chipStyle }),

    // Set table color
    setTableColor: (color: string) => set({ tableColor: color }),

    // Set animation speed
    setAnimationSpeed: (speed: AnimationSpeed) => set({ animationSpeed: speed }),

    // Toggle auto stand on 17
    toggleAutoStand17: () => set((state) => ({ autoStand17: !state.autoStand17 })),

    // Toggle show probabilities
    toggleShowProbabilities: () => set((state) => ({ showProbabilities: !state.showProbabilities })),

    // Toggle show basic strategy
    toggleShowBasicStrategy: () => set((state) => ({ showBasicStrategy: !state.showBasicStrategy })),

    // Toggle confirm actions
    toggleConfirmActions: () => set((state) => ({ confirmActions: !state.confirmActions })),

    // Update advanced rules
    updateAdvancedRules: (rules: Partial<AdvancedRules>) => set((state) => ({
        advancedRules: { ...state.advancedRules, ...rules }
    })),

    // Set counting system
    setCountingSystem: (system: CountingSystem) => set({ countingSystem: system }),

    // Update variant rules
    updateVariantRules: (variant: GameVariant, options: Partial<GameOptions>) => set((state) => ({
        tableRules: {
            ...state.tableRules,
            [variant]: {
                ...(state.tableRules[variant] || {}),
                ...options
            } as GameOptions
        }
    })),

    // Update multiple settings at once
    updateSettings: (settings: Partial<SettingsState>) => set((state) => ({
        ...state,
        ...settings
    })),

    // Reset settings to defaults
    resetSettings: () => set({
        theme: Theme.SYSTEM,
        language: 'en',
        currency: 'USD',
        cardStyle: CardStyle.CLASSIC,
        cardBack: 'default',
        chipStyle: 'classic',
        tableColor: '#076324',
        darkMode: false,
        animationSpeed: 'normal' as AnimationSpeed,
        autoStand17: true,
        showProbabilities: false,
        showBasicStrategy: false,
        confirmActions: true,
        advancedRules: DEFAULT_ADVANCED_RULES,
        countingSystem: 'hi-lo',
        tableRules: {} as Record<GameVariant, GameOptions>,
    })
});

export const useSettingsStore = create<SettingsState>()(
    devtools(
        persist(
            (set, get) => createSettingsSlice(set, get),
            {
                name: 'blackjack-settings',
                version: 1, // Add version information to enable migrations
                migrate: (persistedState: unknown, version: number) => {
                    // If we're at version 0 (or undefined), migrate to version 1
                    if (version === 0) {
                        const typedState = persistedState as Partial<SettingsState>;
                        return {
                            ...typedState,
                            // Add any default values for new fields not in the old state
                            advancedRules: typedState.advancedRules || DEFAULT_ADVANCED_RULES,
                            countingSystem: typedState.countingSystem || 'hi-lo',
                            tableRules: typedState.tableRules || {},
                        };
                    }
                    return persistedState;
                },
                storage: createJSONStorage(() => {
                    if (typeof window !== 'undefined') {
                        return localStorage;
                    }
                    // Return a no-op storage implementation when localStorage is not available
                    return {
                        getItem: () => null,
                        setItem: () => { },
                        removeItem: () => { }
                    };
                }),
            }
        )
    )
);

// Custom hooks for common settings operations
export const useGameSettings = () => {
    const gameSettings = useSettingsStore(state => ({
        autoStand17: state.autoStand17,
        showProbabilities: state.showProbabilities,
        showBasicStrategy: state.showBasicStrategy,
        confirmActions: state.confirmActions,
        advancedRules: state.advancedRules,
        countingSystem: state.countingSystem,
        toggleAutoStand17: state.toggleAutoStand17,
        toggleShowProbabilities: state.toggleShowProbabilities,
        toggleShowBasicStrategy: state.toggleShowBasicStrategy,
        toggleConfirmActions: state.toggleConfirmActions,
        updateAdvancedRules: state.updateAdvancedRules,
        setCountingSystem: state.setCountingSystem
    }));

    return gameSettings;
};

export const useUISettings = () => {
    const uiSettings = useSettingsStore(state => ({
        theme: state.theme,
        language: state.language,
        cardStyle: state.cardStyle,
        cardBack: state.cardBack,
        chipStyle: state.chipStyle,
        tableColor: state.tableColor,
        darkMode: state.darkMode,
        animationSpeed: state.animationSpeed,
        setTheme: state.setTheme,
        setDarkMode: state.setDarkMode,
        setLanguage: state.setLanguage,
        setCardStyle: state.setCardStyle,
        setCardBack: state.setCardBack,
        setChipStyle: state.setChipStyle,
        setTableColor: state.setTableColor,
        setAnimationSpeed: state.setAnimationSpeed
    }));

    return uiSettings;
};

// Utility function to get current game options based on variant
export const getGameOptions = (variant: GameVariant): GameOptions => {
    const { tableRules, advancedRules } = useSettingsStore.getState();

    // Get variant-specific rules or use defaults
    const variantRules = tableRules[variant] || {};

    // Create proper GameOptions object matching the interface
    return {
        variant,
        numberOfDecks: variantRules.numberOfDecks || 6,
        dealerHitsSoft17: advancedRules.dealer17 === 'hit',
        blackjackPays: variantRules.blackjackPays || 1.5,
        doubleAfterSplit: advancedRules.doubleAfterSplit,
        resplitAces: advancedRules.resplitAcesAllowed,
        lateSurrender: advancedRules.surrenderAllowed === 'late',
        maxSplitHands: advancedRules.maxHands,
        penetration: variantRules.penetration || 0.75,
        tableLimits: variantRules.tableLimits || { min: 5, max: 500 },
        payoutRules: variantRules.payoutRules || { blackjack: 1.5, insurance: 2 },
        allowedActions: variantRules.allowedActions || ['hit', 'stand', 'double', 'split'],
        availableSideBets: variantRules.availableSideBets || [],
        deckRotationStrategy: variantRules.deckRotationStrategy || 'perShoe'
    };
};