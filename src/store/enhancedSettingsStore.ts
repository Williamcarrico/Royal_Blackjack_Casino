'use client';

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { EnhancedSettingsStore } from '@/types/storeTypes'
import type { GameVariant, GameOptions } from '@/types/gameTypes'
import { z } from 'zod'

/**
 * Theme options for the application UI
 */
export const ThemeEnum = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
} as const

export type Theme = typeof ThemeEnum[keyof typeof ThemeEnum]

/**
 * Card visual style options
 */
export const CardStyleEnum = {
    CLASSIC: 'classic',
    MODERN: 'modern',
    RETRO: 'retro',
} as const

export type CardStyle = typeof CardStyleEnum[keyof typeof CardStyleEnum]

/**
 * Counting system options
 */
export const CountingSystemEnum = {
    NONE: 'none',
    HI_LO: 'hi-lo',
    HI_OPT_I: 'hi-opt-i',
    HI_OPT_II: 'hi-opt-ii',
    OMEGA_II: 'omega-ii',
    RED7: 'red7',
    ZEN: 'zen',
} as const

export type CountingSystem = typeof CountingSystemEnum[keyof typeof CountingSystemEnum]

/**
 * Advanced rules schema using Zod for validation
 */
export const advancedRulesSchema = z.object({
    dealerPeeks: z.boolean().default(true),
    surrenderAllowed: z.enum(['none', 'early', 'late']).default('late'),
    doubleAllowed: z.enum(['none', 'any2', '9-11', '10-11']).default('any2'),
    doubleAfterSplit: z.boolean().default(true),
    resplitAllowed: z.boolean().default(true),
    resplitAcesAllowed: z.boolean().default(false),
    hitSplitAces: z.boolean().default(false),
    maxSplits: z.number().int().min(1).max(4).default(3),
    maxHands: z.number().int().min(2).max(6).default(4),
    dealer17: z.enum(['hit', 'stand']).default('stand'),
});

export type AdvancedRules = z.infer<typeof advancedRulesSchema>;

// Default values
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

/**
 * Enhanced settings store with advanced blackjack features
 * Extends the base Settings store with card counting capabilities,
 * advanced rules configuration, and visual preferences
 */
export const useEnhancedSettingsStore = create<EnhancedSettingsStore>()(
    devtools(
        persist(
            (set, get) => ({
                // Base settings
                audioEnabled: true,
                volume: 0.7,
                musicEnabled: true,
                musicVolume: 0.5,
                animationSpeed: 'normal',
                tableColor: '#076324',
                cardBack: 'default',
                chipStyle: 'classic',
                language: 'en',
                currency: 'USD',
                darkMode: false,
                autoStand17: true,
                showProbabilities: false,
                showBasicStrategy: false,
                confirmActions: true,

                // Enhanced UI settings
                theme: ThemeEnum.SYSTEM,
                cardStyle: CardStyleEnum.CLASSIC,

                // Advanced rules configuration
                advancedRules: DEFAULT_ADVANCED_RULES,

                // Card counting features
                countingSystem: CountingSystemEnum.HI_LO,

                // Table rules by variant
                tableRules: {} as Record<GameVariant, GameOptions>,

                // Base SettingsStore methods
                updateSettings: (settings) => set(settings),
                resetSettings: () => set((state) => ({
                    ...state,
                    audioEnabled: true,
                    volume: 0.7,
                    musicEnabled: true,
                    musicVolume: 0.5,
                    animationSpeed: 'normal',
                    tableColor: '#076324',
                    cardBack: 'default',
                    chipStyle: 'classic',
                    confirmActions: true,
                    theme: ThemeEnum.SYSTEM,
                    cardStyle: CardStyleEnum.CLASSIC,
                    advancedRules: DEFAULT_ADVANCED_RULES,
                    countingSystem: CountingSystemEnum.HI_LO,
                })),

                // Base SettingsStore toggle methods - optimized with function memoization
                toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
                toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
                toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
                toggleConfirmActions: () => set((state) => ({ confirmActions: !state.confirmActions })),

                // Enhanced methods with validation
                setTheme: (theme: Theme) => {
                    if (Object.values(ThemeEnum).includes(theme)) {
                        set({ theme });
                    }
                },

                setCardStyle: (style: CardStyle) => {
                    if (Object.values(CardStyleEnum).includes(style)) {
                        set({ cardStyle: style });
                    }
                },

                updateAdvancedRules: (rules) => {
                    try {
                        // Validate and merge with existing rules
                        const currentRules = get().advancedRules;
                        const mergedRules = { ...currentRules, ...rules };
                        const validatedRules = advancedRulesSchema.parse(mergedRules);
                        set({ advancedRules: validatedRules });
                    } catch (error) {
                        console.error("Invalid advanced rules:", error);
                    }
                },

                setCountingSystem: (system: CountingSystem) => {
                    if (Object.values(CountingSystemEnum).includes(system)) {
                        set({ countingSystem: system });
                    }
                },

                updateVariantRules: (variant: GameVariant, options: Partial<GameOptions>) =>
                    set((state) => ({
                        tableRules: {
                            ...state.tableRules,
                            [variant]: {
                                ...(state.tableRules[variant] || {}),
                                ...options
                            } as GameOptions
                        }
                    })),

                // Add selectors for common derived state
                getAnimationDuration: () => {
                    const speed = get().animationSpeed;
                    switch (speed) {
                        case 'slow': return 800;
                        case 'fast': return 200;
                        default: return 400;
                    }
                },

                getEffectiveTheme: () => {
                    const theme = get().theme;
                    if (theme === ThemeEnum.SYSTEM) {
                        // Check system preference
                        if (typeof window !== 'undefined') {
                            return window.matchMedia('(prefers-color-scheme: dark)').matches
                                ? ThemeEnum.DARK
                                : ThemeEnum.LIGHT;
                        }
                    }
                    return theme;
                }
            }),
            {
                name: 'enhanced-settings',
                version: 3, // Incremented version for new structure
                migrate: (persistedState: unknown, version: number) => {
                    // Type guard for persisted state
                    if (!isValidPersistedState(persistedState)) {
                        return getDefaultState();
                    }

                    const typedState = persistedState as Record<string, unknown>;

                    // Handle migrations from older versions
                    if (version < 3) {
                        return migrateFromOlderVersion(typedState);
                    }

                    return persistedState;
                },
                storage: createJSONStorage(() => {
                    if (typeof localStorage !== 'undefined') {
                        return localStorage;
                    }
                    // Return a no-op storage implementation when localStorage is not available
                    return {
                        getItem: (_name) => null,
                        setItem: (_name, _value) => { },
                        removeItem: (_name) => { }
                    };
                }),
                skipHydration: true,
                partialize: (state) => {
                    // Use typed object to exclude methods from persistence
                    const {
                        updateSettings: _updateSettings,
                        resetSettings: _resetSettings,
                        toggleAudio: _toggleAudio,
                        toggleMusic: _toggleMusic,
                        toggleDarkMode: _toggleDarkMode,
                        toggleConfirmActions: _toggleConfirmActions,
                        setTheme: _setTheme,
                        setCardStyle: _setCardStyle,
                        updateAdvancedRules: _updateAdvancedRules,
                        setCountingSystem: _setCountingSystem,
                        updateVariantRules: _updateVariantRules,
                        getAnimationDuration: _getAnimationDuration,
                        getEffectiveTheme: _getEffectiveTheme,
                        ...persistedState
                    } = state;

                    return persistedState;
                }
            }
        )
    )
);

// Export utility hooks for specific settings to optimize re-renders
export const useAudioSettings = () => {
    return useEnhancedSettingsStore(state => ({
        audioEnabled: state.audioEnabled,
        volume: state.volume,
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
        toggleAudio: state.toggleAudio,
        toggleMusic: state.toggleMusic,
    }));
};

export const useThemeSettings = () => {
    return useEnhancedSettingsStore(state => ({
        theme: state.theme,
        darkMode: state.darkMode,
        setTheme: state.setTheme,
        toggleDarkMode: state.toggleDarkMode,
        getEffectiveTheme: state.getEffectiveTheme,
    }));
};

export const useGameplaySettings = () => {
    return useEnhancedSettingsStore(state => ({
        advancedRules: state.advancedRules,
        updateAdvancedRules: state.updateAdvancedRules,
        countingSystem: state.countingSystem,
        setCountingSystem: state.setCountingSystem,
        showProbabilities: state.showProbabilities,
        showBasicStrategy: state.showBasicStrategy,
    }));
};

// Helper functions for migration
const isValidPersistedState = (state: unknown): state is Partial<EnhancedSettingsStore> => {
    return typeof state === 'object' && state !== null;
};

const getDefaultState = (): Partial<EnhancedSettingsStore> => ({
    audioEnabled: true,
    volume: 0.7,
    theme: ThemeEnum.SYSTEM,
    cardStyle: CardStyleEnum.CLASSIC,
    advancedRules: DEFAULT_ADVANCED_RULES,
    countingSystem: CountingSystemEnum.HI_LO,
});

const migrateFromOlderVersion = (state: Record<string, unknown>): Partial<EnhancedSettingsStore> => {
    return {
        ...state,
        theme: migrateTheme(state.theme),
        cardStyle: migrateCardStyle(state.cardStyle),
        advancedRules: migrateAdvancedRules(state.advancedRules),
        countingSystem: migrateCountingSystem(state.countingSystem)
    };
};

const migrateTheme = (theme: unknown): Theme => {
    if (typeof theme === 'string' && Object.values(ThemeEnum).includes(theme as Theme)) {
        return theme as Theme;
    }
    return ThemeEnum.SYSTEM;
};

const migrateCardStyle = (cardStyle: unknown): CardStyle => {
    if (typeof cardStyle === 'string' && Object.values(CardStyleEnum).includes(cardStyle as CardStyle)) {
        return cardStyle as CardStyle;
    }
    return CardStyleEnum.CLASSIC;
};

const migrateCountingSystem = (countingSystem: unknown): CountingSystem => {
    if (typeof countingSystem !== 'string') {
        return CountingSystemEnum.HI_LO;
    }

    const normalizedSystem = countingSystem.toLowerCase();
    const matchingSystem = Object.values(CountingSystemEnum).find(
        system => system.toLowerCase() === normalizedSystem
    );

    return matchingSystem || CountingSystemEnum.HI_LO;
};

const migrateAdvancedRules = (rules: unknown): AdvancedRules => {
    try {
        if (rules && typeof rules === 'object') {
            return advancedRulesSchema.parse({
                ...DEFAULT_ADVANCED_RULES,
                ...rules
            });
        }
    } catch (error) {
        console.error("Error migrating advanced rules:", error);
    }

    return DEFAULT_ADVANCED_RULES;
};