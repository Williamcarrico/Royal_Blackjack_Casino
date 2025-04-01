'use client';

import React, { createContext, useContext, useEffect } from 'react';
import {
    useEnhancedSettingsStore,
    VisualSettingsState,
    GameplaySettingsState,
    AdvancedSettingsState,
    GameVariantState,
    useSettingsVisual,
    useSettingsGameplay,
    useSettingsAdvanced
} from '@/store/enhancedSettingsStore';
import { BlackjackVariant, GameRules } from '@/types/game';
import { Theme, CardStyle } from '@/store/enhancedSettingsStore';
import { CardBackOption } from '@/types/card';
import { useGameStore } from '@/store/gameStore';

// Combined type for all settings
interface AllSettings extends
    VisualSettingsState,
    GameplaySettingsState,
    AdvancedSettingsState,
    GameVariantState { }

interface SettingsContextType {
    // Visual settings
    theme: Theme;
    animationSpeed: number;
    tableColor: string;
    cardStyle: CardStyle;
    cardBackDesign: CardBackOption;
    showPlayerAvatars: boolean;

    // Gameplay settings
    autoStand17: boolean;
    autoPlayBasicStrategy: boolean;
    showProbabilities: boolean;
    showCountingInfo: boolean;
    defaultBetSize: number;

    // Advanced settings
    enableHeatmap: boolean;
    showEV: boolean;
    autoAdjustBetSize: boolean;
    riskTolerance: number;

    // Game variant
    variant: BlackjackVariant;
    gameRules: GameRules;

    // Actions
    setTheme: (value: Theme) => void;
    setAnimationSpeed: (value: number) => void;
    setTableColor: (value: string) => void;
    setCardStyle: (value: CardStyle) => void;
    setCardBackDesign: (value: CardBackOption) => void;
    setShowPlayerAvatars: (value: boolean) => void;

    setAutoStand17: (value: boolean) => void;
    setAutoPlayBasicStrategy: (value: boolean) => void;
    setShowProbabilities: (value: boolean) => void;
    setShowCountingInfo: (value: boolean) => void;
    setDefaultBetSize: (value: number) => void;

    setEnableHeatmap: (value: boolean) => void;
    setShowEV: (value: boolean) => void;
    setAutoAdjustBetSize: (value: boolean) => void;
    setRiskTolerance: (value: number) => void;

    setVariant: (variant: BlackjackVariant) => void;
    setGameRules: (rules: GameRules) => void;

    resetToDefaults: () => void;
    saveSettings: () => void;
    isDirty: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    // Access the settings store
    const visualSettings = useSettingsVisual();
    const gameplaySettings = useSettingsGameplay();
    const advancedSettings = useSettingsAdvanced();
    const gameVariant = useEnhancedSettingsStore(state => ({
        variant: state.variant,
        gameRules: state.gameRules
    }));

    const isDirty = useEnhancedSettingsStore(state => state.isDirty);
    const setIsDirty = useEnhancedSettingsStore(state => state.setIsDirty);

    // Actions from the store
    const {
        setTheme,
        setAnimationSpeed,
        setTableColor,
        setCardStyle,
        setCardBackDesign,
        setShowPlayerAvatars,

        setAutoStand17,
        setAutoPlayBasicStrategy,
        setShowProbabilities,
        setShowCountingInfo,
        setDefaultBetSize,

        setEnableHeatmap,
        setShowEV,
        setAutoAdjustBetSize,
        setRiskTolerance,

        setVariant,
        setGameRules,

        resetToDefaults
    } = useEnhancedSettingsStore();

    // Game store integration
    const updateGameFromRules = useGameStore(state => state.updateGameFromRules);

    // Effect to sync settings with game when variant changes
    useEffect(() => {
        if (isDirty) {
            updateGameFromRules();
            setIsDirty(false);
        }
    }, [gameVariant.variant, gameVariant.gameRules, isDirty, updateGameFromRules, setIsDirty]);

    // Mock saving settings to an API
    const saveSettings = () => {
        // In a real app, this would make an API call to save settings
        console.log('Saving settings...');

        // For now, just mark settings as saved
        setIsDirty(false);
    };

    // Combine all settings for the context value
    const contextValue: SettingsContextType = {
        // Visual settings
        ...visualSettings,

        // Gameplay settings
        ...gameplaySettings,

        // Advanced settings
        ...advancedSettings,

        // Game variant
        ...gameVariant,

        // Actions
        setTheme,
        setAnimationSpeed,
        setTableColor,
        setCardStyle,
        setCardBackDesign,
        setShowPlayerAvatars,

        setAutoStand17,
        setAutoPlayBasicStrategy,
        setShowProbabilities,
        setShowCountingInfo,
        setDefaultBetSize,

        setEnableHeatmap,
        setShowEV,
        setAutoAdjustBetSize,
        setRiskTolerance,

        setVariant,
        setGameRules,

        resetToDefaults,
        saveSettings,
        isDirty
    };

    return (
        <SettingsContext.Provider value={contextValue}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);

    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }

    return context;
};

// Specialized hooks for smaller re-renders
export const useVisualSettings = () => {
    const settings = useContext(SettingsContext);

    if (settings === undefined) {
        throw new Error('useVisualSettings must be used within a SettingsProvider');
    }

    return {
        theme: settings.theme,
        animationSpeed: settings.animationSpeed,
        tableColor: settings.tableColor,
        cardStyle: settings.cardStyle,
        cardBackDesign: settings.cardBackDesign,
        showPlayerAvatars: settings.showPlayerAvatars,
        setTheme: settings.setTheme,
        setAnimationSpeed: settings.setAnimationSpeed,
        setTableColor: settings.setTableColor,
        setCardStyle: settings.setCardStyle,
        setCardBackDesign: settings.setCardBackDesign,
        setShowPlayerAvatars: settings.setShowPlayerAvatars
    };
};

export const useGameplaySettings = () => {
    const settings = useContext(SettingsContext);

    if (settings === undefined) {
        throw new Error('useGameplaySettings must be used within a SettingsProvider');
    }

    return {
        autoStand17: settings.autoStand17,
        autoPlayBasicStrategy: settings.autoPlayBasicStrategy,
        showProbabilities: settings.showProbabilities,
        showCountingInfo: settings.showCountingInfo,
        defaultBetSize: settings.defaultBetSize,
        setAutoStand17: settings.setAutoStand17,
        setAutoPlayBasicStrategy: settings.setAutoPlayBasicStrategy,
        setShowProbabilities: settings.setShowProbabilities,
        setShowCountingInfo: settings.setShowCountingInfo,
        setDefaultBetSize: settings.setDefaultBetSize
    };
};