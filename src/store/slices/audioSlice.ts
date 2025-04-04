'use client';

/**
 * Audio Slice
 *
 * Manages sound effects and audio playback for the Blackjack game.
 * Controls volume, muting, and playing different categories of sounds.
 */
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { SoundEffect, SoundCategory, soundEffects, categoryVolumes } from '@/services/audio/soundEffects';

interface AudioState {
    // General audio settings
    enabled: boolean;
    masterVolume: number;

    // Music settings
    musicEnabled: boolean;
    musicVolume: number;
    currentMusic: string | null;
    isPlayingMusic: boolean;

    // Sound effects settings
    soundsEnabled: boolean;
    soundsVolume: number;
    categoryVolumes: Record<SoundCategory, number>;
    lastPlayedSounds: Record<string, {
        id: string;
        sound: SoundEffect;
        timestamp: number;
    }>;

    // Audio context state
    isAudioContextCreated: boolean;
    isAudioContextSuspended: boolean;

    // Preloaded sounds
    preloadedSounds: SoundEffect[];

    // Actions
    setEnabled: (enabled: boolean) => void;
    setMasterVolume: (volume: number) => void;
    setMusicEnabled: (enabled: boolean) => void;
    setMusicVolume: (volume: number) => void;
    setSoundsEnabled: (enabled: boolean) => void;
    setSoundsVolume: (volume: number) => void;
    setCategoryVolume: (category: SoundCategory, volume: number) => void;
    playSound: (sound: SoundEffect, options?: {
        volume?: number;
        rate?: number;
        loop?: boolean;
    }) => string | null;
    stopSound: (instanceId: string) => void;
    playMusic: (src: string, options?: {
        volume?: number;
        fadeIn?: number;
        loop?: boolean;
    }) => void;
    stopMusic: (fadeOut?: number) => void;
    preloadSounds: (category?: SoundCategory) => Promise<void>;
    resumeAudioContext: () => Promise<void>;
    resetSettings: () => void;
}

// Create a function that returns the slice for integration with the main store
export const createAudioSlice = (
    set: (state: Partial<AudioState> | ((state: AudioState) => Partial<AudioState>)) => void,
    get: () => AudioState
) => ({
    // Default state
    enabled: true,
    masterVolume: 0.8,
    musicEnabled: true,
    musicVolume: 0.5,
    soundsEnabled: true,
    soundsVolume: 0.8,
    categoryVolumes,
    currentMusic: null,
    isPlayingMusic: false,
    lastPlayedSounds: {},
    isAudioContextCreated: false,
    isAudioContextSuspended: true,
    preloadedSounds: [],

    // Audio service implementation
    audioContext: null as (AudioContext | null),

    // Toggle all audio
    setEnabled: (enabled: boolean) => {
        set({ enabled });

        if (!enabled) {
            // Stop all sounds
            const audioManager = getAudioManager();
            if (audioManager) {
                audioManager.stopAllSounds();
            }
        }
    },

    // Set master volume
    setMasterVolume: (volume: number) => {
        set({ masterVolume: Math.max(0, Math.min(1, volume)) });

        const audioManager = getAudioManager();
        if (audioManager) {
            audioManager.setVolume(volume);
        }
    },

    // Toggle music
    setMusicEnabled: (enabled: boolean) => {
        set({ musicEnabled: enabled });

        const audioManager = getAudioManager();
        if (audioManager) {
            if (enabled) {
                audioManager.setMusicEnabled(true);

                // Resume current music if available
                const { currentMusic, enabled } = get();
                if (currentMusic && enabled) {
                    audioManager.playMusic(currentMusic);
                    set({ isPlayingMusic: true });
                }
            } else {
                audioManager.setMusicEnabled(false);
                set({ isPlayingMusic: false });
            }
        }
    },

    // Set music volume
    setMusicVolume: (volume: number) => {
        set({ musicVolume: Math.max(0, Math.min(1, volume)) });

        const audioManager = getAudioManager();
        if (audioManager) {
            audioManager.setMusicVolume(volume);
        }
    },

    // Toggle sound effects
    setSoundsEnabled: (enabled: boolean) => {
        set({ soundsEnabled: enabled });

        const audioManager = getAudioManager();
        if (audioManager) {
            if (enabled) {
                audioManager.setSoundEnabled(true);
            } else {
                audioManager.setSoundEnabled(false);

                // Clear last played sounds
                set({ lastPlayedSounds: {} });
            }
        }
    },

    // Set sound effects volume
    setSoundsVolume: (volume: number) => {
        set({ soundsVolume: Math.max(0, Math.min(1, volume)) });

        const audioManager = getAudioManager();
        if (audioManager) {
            audioManager.setSoundVolume(volume);
        }
    },

    // Set volume for a specific sound category
    setCategoryVolume: (category: SoundCategory, volume: number) => {
        set((state: AudioState) => ({
            categoryVolumes: {
                ...state.categoryVolumes,
                [category]: Math.max(0, Math.min(1, volume))
            }
        }));
    },

    // Play a sound effect
    playSound: (sound: SoundEffect, options: {
        volume?: number;
        rate?: number;
        loop?: boolean;
    } = {}) => {
        const { enabled, soundsEnabled, soundsVolume, categoryVolumes } = get();

        if (!enabled || !soundsEnabled) {
            return null;
        }

        // Ensure audio context is ready
        initializeAudioContext();

        const audioManager = getAudioManager();
        if (!audioManager) {
            console.error('Audio manager not initialized');
            return null;
        }

        try {
            // Calculate volume based on options, sound category, and global settings
            const soundData = soundEffects[sound];
            const category = soundData?.category;
            const categoryVolume = category ? categoryVolumes[category] : 1;
            const effectiveVolume = (options.volume ?? 1) * categoryVolume * soundsVolume;

            // Play the sound
            const instanceId = audioManager.playSound(
                sound,
                {
                    volume: effectiveVolume,
                    loop: options.loop,
                    playbackRate: options.rate
                }
            );

            if (instanceId) {
                // Store in lastPlayedSounds
                set((state: AudioState) => ({
                    lastPlayedSounds: {
                        ...state.lastPlayedSounds,
                        [instanceId]: {
                            id: instanceId,
                            sound,
                            timestamp: Date.now()
                        }
                    }
                }));
            }

            return instanceId;
        } catch (error) {
            console.error('Failed to play sound:', error);
            return null;
        }
    },

    // Stop a sound effect
    stopSound: (instanceId: string) => {
        if (!instanceId) return;

        const audioManager = getAudioManager();
        if (!audioManager) return;

        try {
            audioManager.stopSound(instanceId);

            // Remove from lastPlayedSounds
            set((state: AudioState) => {
                const newLastPlayed = { ...state.lastPlayedSounds };
                delete newLastPlayed[instanceId];
                return { lastPlayedSounds: newLastPlayed };
            });
        } catch (error) {
            console.error('Failed to stop sound:', error);
        }
    },

    // Play background music
    playMusic: (src: string, options: {
        volume?: number;
        fadeIn?: number;
        loop?: boolean;
    } = {}) => {
        const { enabled, musicEnabled, musicVolume } = get();

        if (!enabled || !musicEnabled) {
            set({ currentMusic: src, isPlayingMusic: false });
            return;
        }

        // Ensure audio context is ready
        initializeAudioContext();

        const audioManager = getAudioManager();
        if (!audioManager) {
            console.error('Audio manager not initialized');
            return;
        }

        try {
            const effectiveOptions = {
                volume: (options.volume ?? 1) * musicVolume,
                fadeIn: options.fadeIn,
                loop: options.loop ?? true
            };

            audioManager.playMusic(src, effectiveOptions);
            set({ currentMusic: src, isPlayingMusic: true });
        } catch (error) {
            console.error('Failed to play music:', error);
        }
    },

    // Stop background music
    stopMusic: (fadeOut?: number) => {
        const audioManager = getAudioManager();
        if (!audioManager) return;

        try {
            audioManager.stopMusic(fadeOut);
            set({ isPlayingMusic: false });
        } catch (error) {
            console.error('Failed to stop music:', error);
        }
    },

    // Preload sound effects
    preloadSounds: async (category?: SoundCategory) => {
        const audioManager = getAudioManager();
        if (!audioManager) {
            return Promise.reject(new Error('Audio manager not initialized'));
        }

        try {
            await audioManager.preloadSounds(category);

            // Update preloaded sounds list
            const preloadedSounds = Object.keys(soundEffects)
                .filter(key => {
                    const sound = key as SoundEffect;
                    return !category || soundEffects[sound].category === category;
                }) as SoundEffect[];

            set((state: AudioState) => ({
                preloadedSounds: Array.from(new Set([...state.preloadedSounds, ...preloadedSounds]))
            }));

            return Promise.resolve();
        } catch (error) {
            console.error('Failed to preload sounds:', error);
            return Promise.reject(new Error(`Failed to preload sounds: ${error}`));
        }
    },

    // Resume audio context after user interaction
    resumeAudioContext: async () => {
        const audioManager = getAudioManager();
        if (!audioManager) {
            return Promise.reject(new Error('Audio manager not initialized'));
        }

        try {
            audioManager.resumeAudioContext();
            set({ isAudioContextSuspended: false });
            return Promise.resolve();
        } catch (error) {
            console.error('Failed to resume audio context:', error);
            return Promise.reject(new Error(`Failed to resume audio context: ${error}`));
        }
    },

    // Reset audio settings to defaults
    resetSettings: () => {
        set({
            enabled: true,
            masterVolume: 0.8,
            musicEnabled: true,
            musicVolume: 0.5,
            soundsEnabled: true,
            soundsVolume: 0.8,
            categoryVolumes
        });

        const audioManager = getAudioManager();
        if (audioManager) {
            audioManager.setVolume(0.8);
            audioManager.setMusicVolume(0.5);
            audioManager.setSoundVolume(0.8);
        }
    }
});

export const useAudioStore = create<AudioState>()(
    devtools(
        persist(
            (set, get) => ({
                ...createAudioSlice(set, get),

                // Any additional methods that should only be in the hook
            }),
            {
                name: 'blackjack-audio',
                partialize: (state) => ({
                    enabled: state.enabled,
                    masterVolume: state.masterVolume,
                    musicEnabled: state.musicEnabled,
                    musicVolume: state.musicVolume,
                    soundsEnabled: state.soundsEnabled,
                    soundsVolume: state.soundsVolume,
                    categoryVolumes: state.categoryVolumes,
                    currentMusic: state.currentMusic
                }),
            }
        )
    )
);

// Initialize AudioContext - this needs to happen after user interaction
let audioManager: ReturnType<typeof import('@/services/audio/audioManager').default.getInstance> | null = null;

function initializeAudioContext() {
    if (!audioManager) {
        // We're in a browser environment, so we need to dynamically import
        import('@/services/audio/audioManager').then(module => {
            const AudioManager = module.default;
            audioManager = AudioManager.getInstance({
                options: useAudioStore.getState()
            });
            audioManager.initialize();

            useAudioStore.setState({
                isAudioContextCreated: true,
                isAudioContextSuspended: !audioManager.isAudioContextAvailable()
            });
        }).catch(error => {
            console.error('Failed to initialize audio context:', error);
        });
    }
}

function getAudioManager() {
    return audioManager;
}

// Custom hooks for common audio operations
export const useGameSounds = () => {
    const { playSound } = useAudioStore();

    const playCardSound = (type: 'deal' | 'flip' | 'shuffle') => {
        const soundMap: Record<string, SoundEffect> = {
            'deal': 'cardDeal',
            'flip': 'cardFlip',
            'shuffle': 'cardShuffle'
        };
        const sound = soundMap[type];
        if (!sound) return null;
        return playSound(sound);
    };

    const playChipSound = (type: 'bet' | 'collect' | 'toss') => {
        const soundMap: Record<string, SoundEffect> = {
            'bet': 'betPlaced',
            'collect': 'betCollect',
            'toss': 'chipToss'
        };
        const sound = soundMap[type];
        if (!sound) return null;
        return playSound(sound);
    };

    const playActionSound = (action: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance') => {
        return playSound(action as SoundEffect);
    };

    const playOutcomeSound = (result: 'win' | 'lose' | 'push' | 'blackjack' | 'bust') => {
        const soundMap: Record<string, SoundEffect> = {
            'win': 'win',
            'lose': 'lose',
            'push': 'push',
            'blackjack': 'winBlackjack',
            'bust': 'bust'
        };
        const sound = soundMap[result];
        if (!sound) return null;
        return playSound(sound);
    };

    return {
        playCardSound,
        playChipSound,
        playActionSound,
        playOutcomeSound,
        playUISound: (type: 'click' | 'hover' | 'menuOpen' | 'menuClose') => {
            const soundMap: Record<string, SoundEffect> = {
                'click': 'buttonClick',
                'hover': 'buttonHover',
                'menuOpen': 'menuOpen',
                'menuClose': 'menuClose'
            };
            const sound = soundMap[type];
            if (!sound) return null;
            return playSound(sound);
        }
    };
};

export const useAudioSettings = () => {
    const settings = useAudioStore(state => ({
        enabled: state.enabled,
        masterVolume: state.masterVolume,
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume,
        soundsEnabled: state.soundsEnabled,
        soundsVolume: state.soundsVolume
    }));

    const {
        setEnabled,
        setMasterVolume,
        setMusicEnabled,
        setMusicVolume,
        setSoundsEnabled,
        setSoundsVolume,
        resetSettings
    } = useAudioStore();

    return {
        ...settings,
        setEnabled,
        setMasterVolume,
        setMusicEnabled,
        setMusicVolume,
        setSoundsEnabled,
        setSoundsVolume,
        resetSettings,
        toggleAudio: () => setEnabled(!settings.enabled),
        toggleMusic: () => setMusicEnabled(!settings.musicEnabled),
        toggleSounds: () => setSoundsEnabled(!settings.soundsEnabled)
    };
};