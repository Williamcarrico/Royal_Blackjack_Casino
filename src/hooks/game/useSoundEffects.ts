'use client';

/**
 * Hook for managing sound effects in blackjack game
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// Sound effect types
export type SoundEffectType =
    | 'card-deal'   // When a card is dealt to a player or dealer
    | 'card-flip'   // When a card is flipped over
    | 'chips'       // When chips are placed on the table
    | 'win'         // Player wins a hand
    | 'lose'        // Player loses a hand
    | 'push'        // Tie result
    | 'blackjack'   // Player or dealer gets blackjack
    | 'shuffle'     // When cards are shuffled
    | 'button-click' // UI button interaction
    | 'alert'       // General alert sound
    | 'timer';      // Time warning

interface UseSoundEffectsProps {
    enabled?: boolean;
    volume?: number;
    muted?: boolean;
}

/**
 * Custom hook for managing sound effects in the blackjack game
 * Handles preloading, playing, and volume control for game sounds
 */
const useSoundEffects = ({
    enabled = true,
    volume = 0.5,
    muted = false
}: UseSoundEffectsProps = {}) => {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [masterVolume, setMasterVolume] = useState(volume);
    const [isMuted, setIsMuted] = useState(muted);
    const [isLoaded, setIsLoaded] = useState(false);

    // Store audio elements by sound type
    const audioRefs = useRef<Record<SoundEffectType, HTMLAudioElement | null>>({
        'card-deal': null,
        'card-flip': null,
        'chips': null,
        'win': null,
        'lose': null,
        'push': null,
        'blackjack': null,
        'shuffle': null,
        'button-click': null,
        'alert': null,
        'timer': null
    });

    // Sound file mapping
    const soundFiles = useMemo<Record<SoundEffectType, string>>(() => ({
        'card-deal': '/sounds/card-deal.mp3',
        'card-flip': '/sounds/card-flip.mp3',
        'chips': '/sounds/chips.mp3',
        'win': '/sounds/win.mp3',
        'lose': '/sounds/lose.mp3',
        'push': '/sounds/push.mp3',
        'blackjack': '/sounds/blackjack.mp3',
        'shuffle': '/sounds/shuffle.mp3',
        'button-click': '/sounds/button-click.mp3',
        'alert': '/sounds/alert.mp3',
        'timer': '/sounds/timer.mp3'
    }), []);

    // Preload sound effects
    useEffect(() => {
        if (!isEnabled) return;

        const soundTypes = Object.keys(soundFiles) as SoundEffectType[];
        let loadedCount = 0;

        soundTypes.forEach(type => {
            try {
                const audio = new Audio(soundFiles[type]);

                // Set up event listeners
                audio.addEventListener('canplaythrough', () => {
                    loadedCount++;
                    if (loadedCount === soundTypes.length) {
                        setIsLoaded(true);
                    }
                });

                audio.addEventListener('error', (err) => {
                    console.warn(`Failed to load sound effect: ${type}`, err);
                    // Consider the sound as "loaded" even if it failed so we don't block
                    loadedCount++;
                    if (loadedCount === soundTypes.length) {
                        setIsLoaded(true);
                    }
                });

                // Load the audio file
                audio.load();

                // Store the audio element
                audioRefs.current[type] = audio;

                // Set initial volume
                audio.volume = masterVolume;
                audio.muted = isMuted;
            } catch (error) {
                console.error(`Error preloading sound effect: ${type}`, error);
                // Consider the sound as "loaded" even if it failed
                loadedCount++;
                if (loadedCount === soundTypes.length) {
                    setIsLoaded(true);
                }
            }
        });

        // Cleanup on unmount
        return () => {
            // Store ref in a variable inside the effect to avoid closure issues
            const currentRefs = audioRefs.current;

            Object.values(currentRefs).forEach(audio => {
                if (audio) {
                    audio.pause();
                    audio.src = '';
                }
            });
        };
    }, [isEnabled, soundFiles, masterVolume, isMuted]);

    // Update volume for all sounds when masterVolume changes
    useEffect(() => {
        if (!isEnabled) return;

        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.volume = masterVolume;
            }
        });
    }, [masterVolume, isEnabled]);

    // Update muted state for all sounds
    useEffect(() => {
        if (!isEnabled) return;

        Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
                audio.muted = isMuted;
            }
        });
    }, [isMuted, isEnabled]);

    /**
     * Play a sound effect
     */
    const play = useCallback((
        type: SoundEffectType,
        volume?: number,
        loop: boolean = false
    ) => {
        if (!isEnabled || isMuted || !isLoaded) return;

        try {
            let audio = audioRefs.current[type];

            // If audio doesn't exist, create a new one
            if (!audio) {
                audio = new Audio(soundFiles[type]);
                audioRefs.current[type] = audio;
            }

            // Reset the audio if it's already playing
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }

            // Set volume and loop
            audio.volume = volume !== undefined ? volume : masterVolume;
            audio.loop = loop;

            // Play the sound
            audio.play().catch(err => {
                console.warn(`Failed to play sound effect: ${type}`, err);
            });
        } catch (error) {
            console.error(`Error playing sound effect: ${type}`, error);
        }
    }, [isEnabled, isMuted, isLoaded, masterVolume, soundFiles]);

    /**
     * Stop a sound effect
     */
    const stop = useCallback((type: SoundEffectType) => {
        const audio = audioRefs.current[type];
        if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
    }, []);

    /**
     * Stop all sound effects
     */
    const stopAll = useCallback(() => {
        Object.values(audioRefs.current).forEach(audio => {
            if (audio && !audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }, []);

    /**
     * Toggle sound effects on/off
     */
    const toggleSounds = useCallback(() => {
        setIsEnabled(prev => !prev);
    }, []);

    /**
     * Toggle mute on/off
     */
    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    /**
     * Set master volume level
     */
    const setVolume = useCallback((level: number) => {
        const normalizedLevel = Math.max(0, Math.min(level, 1));
        setMasterVolume(normalizedLevel);
    }, []);

    /**
     * Create a looping sound effect
     * Returns a function that stops the sound when called
     */
    const createLoopingSound = useCallback((
        type: SoundEffectType,
        volume?: number
    ): () => void => {
        if (!isEnabled || isMuted || !isLoaded) {
            return () => { }; // No-op if disabled
        }

        play(type, volume, true);

        return () => {
            stop(type);
        };
    }, [isEnabled, isMuted, isLoaded, play, stop]);

    /**
     * Convenience methods for common game sounds
     */
    const playCardDeal = useCallback(() => play('card-deal'), [play]);
    const playCardFlip = useCallback(() => play('card-flip'), [play]);
    const playChips = useCallback(() => play('chips'), [play]);
    const playWin = useCallback(() => play('win'), [play]);
    const playLose = useCallback(() => play('lose'), [play]);
    const playPush = useCallback(() => play('push'), [play]);
    const playBlackjack = useCallback(() => play('blackjack'), [play]);
    const playShuffle = useCallback(() => play('shuffle'), [play]);
    const playButtonClick = useCallback(() => play('button-click', masterVolume * 0.7), [play, masterVolume]);
    const playAlert = useCallback(() => play('alert'), [play]);
    const playTimer = useCallback((loop: boolean = false) => play('timer', undefined, loop), [play]);

    return {
        // State
        isEnabled,
        isMuted,
        masterVolume,
        isLoaded,

        // Main methods
        play,
        stop,
        stopAll,
        toggleSounds,
        toggleMute,
        setVolume,
        createLoopingSound,

        // Convenience methods
        playCardDeal,
        playCardFlip,
        playChips,
        playWin,
        playLose,
        playPush,
        playBlackjack,
        playShuffle,
        playButtonClick,
        playAlert,
        playTimer
    };
};

export default useSoundEffects;