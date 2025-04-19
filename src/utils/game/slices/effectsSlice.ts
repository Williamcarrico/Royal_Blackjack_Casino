'use client';

/**
 * Effects Slice
 *
 * Manages UI effects, animations, and sounds for the game
 */
import { StateCreator } from 'zustand';

// Animation speed type alias
type AnimationSpeed = 'slow' | 'normal' | 'fast';

// Define the EffectsSlice interface
interface EffectsSlice {
    // State
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    animationSpeed: AnimationSpeed;
    tableTheme: string;
    tableColor: string;
    cardTheme: string;
    chipTheme: string;
    dealerVoice: string;

    // UI state
    isTableRotated: boolean;
    isPendingAction: boolean;
    showChipRack: boolean;
    activeAnimations: string[];

    // Actions
    toggleSound: () => void;
    toggleVibration: () => void;
    setAnimationSpeed: (speed: AnimationSpeed) => void;
    setTableTheme: (theme: string) => void;
    setCardTheme: (theme: string) => void;
    setChipTheme: (theme: string) => void;
    setTableColor: (color: string) => void;
    setDealerVoice: (voice: string) => void;
    playSound: (sound: string) => void;
    triggerVibration: (pattern?: number[]) => void;
    setTableRotation: (isRotated: boolean) => void;
    startAnimation: (animationId: string) => void;
    endAnimation: (animationId: string) => void;
    setShowChipRack: (show: boolean) => void;
}

/**
 * Creates the effects slice
 */
const createEffectsSlice: StateCreator<EffectsSlice> = (set, get) => ({
    // Effects settings
    soundEnabled: true,
    vibrationEnabled: true,
    animationSpeed: 'normal',
    tableTheme: 'green-felt',
    tableColor: '#1a5f7a',
    cardTheme: 'classic',
    chipTheme: 'casino',
    dealerVoice: 'default',

    // UI state
    isTableRotated: false,
    isPendingAction: false,
    showChipRack: true,
    activeAnimations: [],

    /**
     * Toggle sound on/off
     */
    toggleSound: () => {
        set(state => ({ soundEnabled: !state.soundEnabled }));
    },

    /**
     * Toggle vibration on/off
     */
    toggleVibration: () => {
        set(state => ({ vibrationEnabled: !state.vibrationEnabled }));
    },

    /**
     * Set animation speed
     */
    setAnimationSpeed: (speed: AnimationSpeed) => {
        set({ animationSpeed: speed });
    },

    /**
     * Set table theme
     */
    setTableTheme: (theme: string) => {
        set({ tableTheme: theme });
    },

    /**
     * Set card theme
     */
    setCardTheme: (theme: string) => {
        set({ cardTheme: theme });
    },

    /**
     * Set chip theme
     */
    setChipTheme: (theme: string) => {
        set({ chipTheme: theme });
    },

    /**
     * Set table color
     */
    setTableColor: (color: string) => {
        set({ tableColor: color });
        // Apply color to CSS variables
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--table-theme-color', color);
        }
    },

    /**
     * Set dealer voice
     */
    setDealerVoice: (voice: string) => {
        set({ dealerVoice: voice });
    },

    /**
     * Play a sound effect if sound is enabled
     */
    playSound: (sound: string) => {
        const { soundEnabled } = get();
        if (!soundEnabled) return;

        // Play sound implementation
        try {
            // Implementation would depend on your sound system
            console.log(`Playing sound: ${sound}`);

            // Example implementation with Audio API if available:
            if (typeof Audio !== 'undefined') {
                const audio = new Audio(`/sounds/${sound}.mp3`);
                audio.play().catch(e => console.error('Sound play error:', e));
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    },

    /**
     * Trigger device vibration if enabled
     */
    triggerVibration: (pattern?: number[]) => {
        const { vibrationEnabled } = get();
        if (!vibrationEnabled) return;

        try {
            // Check if vibration API is available
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(pattern || 200);
            }
        } catch (error) {
            console.error('Error triggering vibration:', error);
        }
    },

    /**
     * Set table rotation (for responsive layouts)
     */
    setTableRotation: (isRotated: boolean) => {
        set({ isTableRotated: isRotated });
    },

    /**
     * Start an animation
     */
    startAnimation: (animationId: string) => {
        set(state => ({
            activeAnimations: [...state.activeAnimations, animationId]
        }));
    },

    /**
     * End an animation
     */
    endAnimation: (animationId: string) => {
        set(state => ({
            activeAnimations: state.activeAnimations.filter(id => id !== animationId)
        }));
    },

    /**
     * Show/hide chip rack
     */
    setShowChipRack: (show: boolean) => {
        set({ showChipRack: show });
    }
});

export default createEffectsSlice;