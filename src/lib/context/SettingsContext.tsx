'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react';
import {
    useEnhancedSettingsStore,
    Theme,
    CardStyle,
    CountingSystem
} from '@/store/enhancedSettingsStore';
import type { GameVariant, GameRules, GameOptions, CardBackOption } from '@/types/gameTypes';
import { useGameStore } from '@/store/gameStore';

// Add this near the other type definitions
type AnimationSpeed = 'slow' | 'normal' | 'fast';

// Define interfaces for the different setting categories
interface VisualSettings {
    theme: Theme;
    animationSpeed: AnimationSpeed;
    tableColor: string;
    cardStyle: CardStyle;
    cardBackDesign: CardBackOption;
    showPlayerAvatars: boolean;
}

interface GameplaySettings {
    autoStand17: boolean;
    autoPlayBasicStrategy: boolean;
    showProbabilities: boolean;
    showCountingInfo: boolean;
    defaultBetSize: number;
}

interface AdvancedSettings {
    enableHeatmap: boolean;
    showEV: boolean;
    autoAdjustBetSize: boolean;
    riskTolerance: number;
}

interface GameVariantSettings {
    variant: GameVariant;
    gameRules: GameRules;
}

interface SettingsContextType extends
    VisualSettings,
    GameplaySettings,
    AdvancedSettings,
    GameVariantSettings {
    // Actions
    setTheme: (value: Theme) => void;
    setAnimationSpeed: (value: AnimationSpeed) => void;
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

    setVariant: (variant: GameVariant) => void;
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
    const settings = useEnhancedSettingsStore();
    const gameStore = useGameStore();

    const isDirty = false; // Track if settings have unsaved changes

    // Update game based on rule changes
    const updateGameFromRules = useCallback(() => {
        const options: Partial<GameOptions> = {
            variant: 'vegas',
            // Convert GameRules to GameOptions as needed
            numberOfDecks: gameStore.gameRules.decksCount,
            dealerHitsSoft17: gameStore.gameRules.dealerHitsSoft17,
            doubleAfterSplit: gameStore.gameRules.doubleAfterSplit,
            resplitAces: gameStore.gameRules.resplitAces,
            lateSurrender: gameStore.gameRules.surrender
        };
        gameStore.initializeGame(options as GameOptions);
    }, [gameStore]);

    // Effect to sync settings with game when variant changes
    useEffect(() => {
        if (isDirty) {
            updateGameFromRules();
        }
    }, [isDirty, updateGameFromRules]);

    // Mock saving settings to an API
    const saveSettings = useCallback(() => {
        // In a real app, this would make an API call to save settings
        console.log('Saving settings...');
    }, []);

    // Combine all settings for the context value
    const contextValue = useMemo<SettingsContextType>(() => {
        // Extract visual settings
        const visualSettings: VisualSettings = {
            theme: settings.theme,
            animationSpeed: settings.animationSpeed,
            tableColor: settings.tableColor,
            cardStyle: settings.cardStyle,
            cardBackDesign: settings.cardBack as CardBackOption,
            showPlayerAvatars: Boolean(settings.confirmActions) // using confirmActions as a placeholder
        };

        // Extract gameplay settings
        const gameplaySettings: GameplaySettings = {
            autoStand17: settings.autoStand17,
            autoPlayBasicStrategy: settings.showBasicStrategy,
            showProbabilities: settings.showProbabilities,
            showCountingInfo: settings.countingSystem !== 'none',
            defaultBetSize: 10 // Default value as currentBet doesn't exist
        };

        // Extract advanced settings
        const advancedSettings: AdvancedSettings = {
            enableHeatmap: false, // Initialize with defaults
            showEV: false,
            autoAdjustBetSize: false,
            riskTolerance: 0.5
        };

        // Extract game variant settings
        const gameVariant: GameVariantSettings = {
            variant: 'vegas' as GameVariant, // Default to vegas
            gameRules: gameStore.gameRules
        };

        // Define setters inside the useMemo callback
        const setTheme = (value: Theme) => {
            useEnhancedSettingsStore.setState({
                theme: value
            } as unknown as Partial<typeof settings>);
        };

        const setAnimationSpeed = (value: AnimationSpeed) => {
            useEnhancedSettingsStore.setState({
                animationSpeed: value
            } as unknown as Partial<typeof settings>);
        };

        const setTableColor = (value: string) => {
            useEnhancedSettingsStore.setState({
                tableColor: value
            } as unknown as Partial<typeof settings>);
        };

        const setCardStyle = (value: CardStyle) => {
            useEnhancedSettingsStore.setState({
                cardStyle: value
            } as unknown as Partial<typeof settings>);
        };

        const setCardBackDesign = (value: CardBackOption) => {
            useEnhancedSettingsStore.setState({
                cardBack: value
            } as unknown as Partial<typeof settings>);
        };

        const setShowPlayerAvatars = (value: boolean) => {
            useEnhancedSettingsStore.setState({
                confirmActions: value // Using confirmActions as a proxy
            } as unknown as Partial<typeof settings>);
        };

        const setAutoStand17 = (value: boolean) => {
            useEnhancedSettingsStore.setState({
                autoStand17: value
            } as unknown as Partial<typeof settings>);
        };

        const setAutoPlayBasicStrategy = (value: boolean) => {
            useEnhancedSettingsStore.setState({
                showBasicStrategy: value
            } as unknown as Partial<typeof settings>);
        };

        const setShowProbabilities = (value: boolean) => {
            useEnhancedSettingsStore.setState({
                showProbabilities: value
            } as unknown as Partial<typeof settings>);
        };

        const setShowCountingInfo = (value: boolean) => {
            useEnhancedSettingsStore.setState({
                countingSystem: value ? 'hi-lo' as CountingSystem : 'none' as CountingSystem
            } as unknown as Partial<typeof settings>);
        };

        const setDefaultBetSize = (value: number) => {
            // Since currentBet doesn't exist, this is a no-op
            console.log('Setting default bet size to', value);
        };

        // These methods need implementation in the actual store
        const setEnableHeatmap = (_value: boolean) => {
            // Would need to be implemented in the store
            console.log('setEnableHeatmap not implemented');
        };

        const setShowEV = (_value: boolean) => {
            // Would need to be implemented in the store
            console.log('setShowEV not implemented');
        };

        const setAutoAdjustBetSize = (_value: boolean) => {
            // Would need to be implemented in the store
            console.log('setAutoAdjustBetSize not implemented');
        };

        const setRiskTolerance = (_value: number) => {
            // Would need to be implemented in the store
            console.log('setRiskTolerance not implemented');
        };

        const setVariant = (_variant: GameVariant) => {
            // This would update the store and game rules
            console.log('setVariant not implemented');
        };

        const setGameRules = (rules: GameRules) => {
            // Convert GameRules to GameOptions for initializeGame
            const options: Partial<GameOptions> = {
                variant: 'vegas' as GameVariant,
                numberOfDecks: rules.decksCount,
                dealerHitsSoft17: rules.dealerHitsSoft17,
                doubleAfterSplit: rules.doubleAfterSplit,
                resplitAces: rules.resplitAces,
                lateSurrender: rules.surrender
            };
            gameStore.initializeGame(options as GameOptions);
        };

        const resetToDefaults = () => {
            // Reset to default settings
            useEnhancedSettingsStore.getState().resetSettings();
        };

        return {
            // Settings objects
            ...visualSettings,
            ...gameplaySettings,
            ...advancedSettings,
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
    }, [settings, gameStore, isDirty, saveSettings]);

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