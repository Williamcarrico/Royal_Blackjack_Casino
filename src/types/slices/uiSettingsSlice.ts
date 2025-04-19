'use client';

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { ThemeEnum, CardStyleEnum } from '@/store/enhancedSettingsStore';
import type { Theme, CardStyle } from '@/store/enhancedSettingsStore';
import type { AnimationSpeed } from '@/store/slices/settingsSlice';

/**
 * UI Settings Slice
 * Combines UI preferences and audio settings. Persists only theme flags: tableColor and chipStyle.
 */
export interface UISettingsState {
    // Audio settings
    audioEnabled: boolean;
    volume: number;
    musicEnabled: boolean;
    musicVolume: number;

    // UI preferences
    animationSpeed: AnimationSpeed;
    tableColor: string;
    cardBack: string;
    chipStyle: string;
    language: string;
    currency: string;
    darkMode: boolean;
    theme: Theme;
    cardStyle: CardStyle;

    // Actions
    setTableColor: (color: string) => void;
    setChipStyle: (style: string) => void;
    setTheme: (theme: Theme) => void;
    setCardStyle: (style: CardStyle) => void;
    setCardBack: (back: string) => void;
    toggleDarkMode: () => void;
    setAnimationSpeed: (speed: AnimationSpeed) => void;
    setLanguage: (language: string) => void;
    setCurrency: (currency: string) => void;
    toggleAudio: () => void;
    setVolume: (volume: number) => void;
    toggleMusic: () => void;
    setMusicVolume: (volume: number) => void;
    updateSettings: (settings: Partial<UISettingsState>) => void;
    resetSettings: () => void;
}

export const useUISettingsStore = create<UISettingsState>()(
    devtools(
        persist(
            (set, _get) => ({
                // Audio defaults
                audioEnabled: true,
                volume: 0.7,
                musicEnabled: true,
                musicVolume: 0.5,

                // UI defaults
                animationSpeed: 'normal' as AnimationSpeed,
                tableColor: '#076324',
                cardBack: 'default',
                chipStyle: 'classic',
                language: 'en',
                currency: 'USD',
                darkMode: false,
                theme: ThemeEnum.SYSTEM,
                cardStyle: CardStyleEnum.CLASSIC,

                // Actions
                setTableColor: (color) => set({ tableColor: color }),
                setChipStyle: (style) => set({ chipStyle: style }),
                setTheme: (theme) => set({ theme }),
                setCardStyle: (style) => set({ cardStyle: style }),
                setCardBack: (back) => set({ cardBack: back }),
                toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
                setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
                setLanguage: (language) => set({ language }),
                setCurrency: (currency) => set({ currency }),

                toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
                setVolume: (volume) => set({ volume }),
                toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
                setMusicVolume: (volume) => set({ musicVolume: volume }),

                updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
                resetSettings: () => set({
                    audioEnabled: true,
                    volume: 0.7,
                    musicEnabled: true,
                    musicVolume: 0.5,
                    animationSpeed: 'normal' as AnimationSpeed,
                    tableColor: '#076324',
                    cardBack: 'default',
                    chipStyle: 'classic',
                    language: 'en',
                    currency: 'USD',
                    darkMode: false,
                    theme: ThemeEnum.SYSTEM,
                    cardStyle: CardStyleEnum.CLASSIC,
                }),
            }),
            {
                name: 'ui-settings',
                version: 1,
                storage: createJSONStorage(() => {
                    if (typeof window !== 'undefined') {
                        return localStorage;
                    }
                    // no-op storage if window is undefined
                    return {
                        getItem: () => null,
                        setItem: () => { },
                        removeItem: () => { },
                    };
                }),
                // Persist only the theme flags
                partialize: (state) => ({
                    tableColor: state.tableColor,
                    chipStyle: state.chipStyle,
                }),
            }
        )
    )
);