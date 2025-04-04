'use client';

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { EnhancedSettingsStore } from '@/types/storeTypes'
import type { GameVariant, GameOptions } from '@/types/gameTypes'

/**
 * Theme options for the application UI
 */
export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system',
}

/**
 * Card visual style options
 */
export enum CardStyle {
    CLASSIC = 'classic',
    MODERN = 'modern',
    RETRO = 'retro',
}

/**
 * Type for CountingSystem string union
 */
export type CountingSystem = 'none' | 'hi-lo' | 'hi-opt-i' | 'hi-opt-ii' | 'omega-ii' | 'red7' | 'zen'

/**
 * Enhanced settings store with advanced blackjack features
 * Extends the base Settings store with card counting capabilities,
 * advanced rules configuration, and visual preferences
 */
export const useEnhancedSettingsStore = create<EnhancedSettingsStore>()(
    devtools(
        persist(
            (set) => ({
                // Base SettingsStore properties
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
                theme: Theme.SYSTEM,
                cardStyle: CardStyle.CLASSIC,

                // Advanced rules configuration
                advancedRules: {
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
                },

                // Card counting features
                countingSystem: 'hi-lo' as CountingSystem,

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
                    theme: Theme.SYSTEM,
                    cardStyle: CardStyle.CLASSIC,
                })),
                toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
                toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
                toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
                toggleConfirmActions: () => set((state) => ({ confirmActions: !state.confirmActions })),

                // Enhanced settings methods
                setTheme: (theme: Theme) => set({ theme } as Partial<EnhancedSettingsStore>),
                setCardStyle: (style: CardStyle) => set({ cardStyle: style } as Partial<EnhancedSettingsStore>),
                updateAdvancedRules: (rules) => set((state) => ({
                    advancedRules: { ...state.advancedRules, ...rules }
                })),
                setCountingSystem: (system: CountingSystem) => set({ countingSystem: system }),
                updateVariantRules: (variant: GameVariant, options: Partial<GameOptions>) =>
                    set((state) => ({
                        tableRules: {
                            ...state.tableRules,
                            [variant]: {
                                ...(state.tableRules[variant] || {}),
                                ...options
                            } as GameOptions
                        }
                    }))
            }),
            {
                name: 'enhanced-settings',
                version: 2,
                migrate: (persistedState: unknown, version: number) => {
                    // If we're at a previous version, migrate to the current version
                    if (version === 0 || version === 1) {
                        const typedState = persistedState as Record<string, unknown>;
                        return {
                            ...typedState,
                            // Set defaults for any new fields
                            audioEnabled: typedState.audioEnabled ?? true,
                            volume: typedState.volume ?? 0.7,
                            musicEnabled: typedState.musicEnabled ?? true,
                            musicVolume: typedState.musicVolume ?? 0.5,
                            animationSpeed: typedState.animationSpeed ?? 'normal',
                            tableColor: typedState.tableColor ?? '#076324',
                            cardBack: typedState.cardBack ?? 'default',
                            chipStyle: typedState.chipStyle ?? 'classic',
                            theme: (
                                typeof typedState.theme === 'string' &&
                                Object.values(Theme).includes(typedState.theme as Theme)
                            ) ? typedState.theme as Theme : Theme.SYSTEM,
                            cardStyle: (
                                typeof typedState.cardStyle === 'string' &&
                                Object.values(CardStyle).includes(typedState.cardStyle as CardStyle)
                            ) ? typedState.cardStyle as CardStyle : CardStyle.CLASSIC,
                            advancedRules: typedState.advancedRules || {
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
                            },
                            countingSystem: typeof typedState.countingSystem === 'string' ?
                                typedState.countingSystem as CountingSystem : 'hi-lo'
                        };
                    }
                    return persistedState as Partial<EnhancedSettingsStore>;
                },
                storage: createJSONStorage(() => {
                    if (typeof window !== 'undefined') {
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
                partialize: (state) => ({
                    ...state,
                    // Exclude computed properties or methods from persistence
                    updateSettings: undefined,
                    resetSettings: undefined,
                    toggleAudio: undefined,
                    toggleMusic: undefined,
                    toggleDarkMode: undefined,
                    toggleConfirmActions: undefined,
                    setTheme: undefined,
                    setCardStyle: undefined,
                    updateAdvancedRules: undefined,
                    setCountingSystem: undefined,
                    updateVariantRules: undefined
                })
            }
        )
    )
)