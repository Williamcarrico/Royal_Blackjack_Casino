/**
 * Hook for using the Audio service with React
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useService, getTypedService } from './useService';
import AudioManager from '../../services/audio/audioManager';
import { SoundEffect, SoundCategory } from '../../services/audio/soundEffects';

export interface AudioSettings {
    masterVolume: number;
    musicVolume: number;
    soundVolume: number;
    musicEnabled: boolean;
    soundEnabled: boolean;
    audioEnabled: boolean;
}

export default function useAudioService() {
    const {
        service: audioService,
        isLoading: serviceLoading,
        error: serviceError,
        initialize
    } = useService<AudioManager>('audio');

    const [settings, setSettings] = useState<AudioSettings>({
        masterVolume: 1,
        musicVolume: 1,
        soundVolume: 1,
        musicEnabled: true,
        soundEnabled: true,
        audioEnabled: true
    });

    const [currentMusic, setCurrentMusic] = useState<string | null>(null);
    const [isPlayingMusic, setIsPlayingMusic] = useState(false);
    const [lastPlayedSounds, setLastPlayedSounds] = useState<string[]>([]);

    // Initialize settings from the audio service
    useEffect(() => {
        if (audioService && !serviceLoading) {
            const newSettings = {
                masterVolume: audioService.getVolume(),
                musicVolume: audioService.getMusicVolume(),
                soundVolume: audioService.getSoundVolume(),
                musicEnabled: audioService.isMusicEnabled(),
                soundEnabled: audioService.isSoundEffectsEnabled(),
                audioEnabled: audioService.isAudioEnabled()
            };

            setSettings(newSettings);
        }
    }, [audioService, serviceLoading]);

    /**
     * Play a sound effect
     */
    const playSound = useCallback((
        sound: SoundEffect,
        options?: { volume?: number; loop?: boolean; rate?: number }
    ) => {
        if (!audioService) {
            console.warn('Audio service not initialized');
            return null;
        }

        if (!settings.audioEnabled || !settings.soundEnabled) {
            return null;
        }

        try {
            const instanceId = audioService.playSound(sound, options);

            // Keep track of last played sounds (limit to 10)
            setLastPlayedSounds(prev => [instanceId, ...prev.slice(0, 9)]);

            return instanceId;
        } catch (error) {
            console.error('Failed to play sound:', error);
            return null;
        }
    }, [audioService, settings.audioEnabled, settings.soundEnabled]);

    /**
     * Stop a sound effect
     */
    const stopSound = useCallback((instanceId: string) => {
        if (!audioService || !instanceId) {
            return;
        }

        try {
            audioService.stopSound(instanceId);

            // Remove from last played sounds
            setLastPlayedSounds(prev => prev.filter(id => id !== instanceId));
        } catch (error) {
            console.error('Failed to stop sound:', error);
        }
    }, [audioService]);

    /**
     * Play background music
     */
    const playMusic = useCallback((
        src: string,
        options?: { volume?: number; fadeIn?: number; loop?: boolean }
    ) => {
        if (!audioService) {
            console.warn('Audio service not initialized');
            return;
        }

        if (!settings.audioEnabled || !settings.musicEnabled) {
            setCurrentMusic(src);
            setIsPlayingMusic(false);
            return;
        }

        try {
            audioService.playMusic(src, options);
            setCurrentMusic(src);
            setIsPlayingMusic(true);
        } catch (error) {
            console.error('Failed to play music:', error);
        }
    }, [audioService, settings.audioEnabled, settings.musicEnabled]);

    /**
     * Stop the currently playing music
     */
    const stopMusic = useCallback((fadeOut?: number) => {
        if (!audioService) {
            return;
        }

        try {
            audioService.stopMusic(fadeOut);
            setIsPlayingMusic(false);
        } catch (error) {
            console.error('Failed to stop music:', error);
        }
    }, [audioService]);

    /**
     * Preload sounds for faster playback
     */
    const preloadSounds = useCallback((category?: SoundCategory) => {
        if (!audioService) {
            return Promise.reject(new Error('Audio service not initialized'));
        }

        return audioService.preloadSounds(category);
    }, [audioService]);

    /**
     * Update master volume
     */
    const setMasterVolume = useCallback((volume: number) => {
        if (!audioService) {
            return;
        }

        audioService.setVolume(volume);
        setSettings(prev => ({ ...prev, masterVolume: volume }));
    }, [audioService]);

    /**
     * Update music volume
     */
    const setMusicVolume = useCallback((volume: number) => {
        if (!audioService) {
            return;
        }

        audioService.setMusicVolume(volume);
        setSettings(prev => ({ ...prev, musicVolume: volume }));
    }, [audioService]);

    /**
     * Update sound effects volume
     */
    const setSoundVolume = useCallback((volume: number) => {
        if (!audioService) {
            return;
        }

        audioService.setSoundVolume(volume);
        setSettings(prev => ({ ...prev, soundVolume: volume }));
    }, [audioService]);

    /**
     * Enable/disable audio
     */
    const setAudioEnabled = useCallback((enabled: boolean) => {
        if (!audioService) {
            return;
        }

        if (enabled) {
            audioService.enableAudio();

            // If music was playing before, restart it
            if (currentMusic && settings.musicEnabled) {
                audioService.playMusic(currentMusic);
                setIsPlayingMusic(true);
            }
        } else {
            audioService.disableAudio();
            setIsPlayingMusic(false);
        }

        setSettings(prev => ({ ...prev, audioEnabled: enabled }));
    }, [audioService, currentMusic, settings.musicEnabled]);

    /**
     * Enable/disable music
     */
    const setMusicEnabled = useCallback((enabled: boolean) => {
        if (!audioService) {
            return;
        }

        if (enabled) {
            audioService.enableMusic();

            // If we have current music, start playing it
            if (currentMusic && settings.audioEnabled) {
                audioService.playMusic(currentMusic);
                setIsPlayingMusic(true);
            }
        } else {
            audioService.disableMusic();
            setIsPlayingMusic(false);
        }

        setSettings(prev => ({ ...prev, musicEnabled: enabled }));
    }, [audioService, currentMusic, settings.audioEnabled]);

    /**
     * Enable/disable sound effects
     */
    const setSoundEnabled = useCallback((enabled: boolean) => {
        if (!audioService) {
            return;
        }

        if (enabled) {
            audioService.enableSoundEffects();
        } else {
            audioService.disableSoundEffects();

            // Stop all currently playing sounds
            lastPlayedSounds.forEach(id => {
                audioService.stopSound(id);
            });

            setLastPlayedSounds([]);
        }

        setSettings(prev => ({ ...prev, soundEnabled: enabled }));
    }, [audioService, lastPlayedSounds]);

    /**
     * Toggle audio on/off
     */
    const toggleAudio = useCallback(() => {
        setAudioEnabled(!settings.audioEnabled);
    }, [settings.audioEnabled, setAudioEnabled]);

    /**
     * Toggle music on/off
     */
    const toggleMusic = useCallback(() => {
        setMusicEnabled(!settings.musicEnabled);
    }, [settings.musicEnabled, setMusicEnabled]);

    /**
     * Toggle sound effects on/off
     */
    const toggleSound = useCallback(() => {
        setSoundEnabled(!settings.soundEnabled);
    }, [settings.soundEnabled, setSoundEnabled]);

    /**
     * Reset audio settings to defaults
     */
    const resetSettings = useCallback(() => {
        if (!audioService) {
            return;
        }

        audioService.resetOptions();

        setSettings({
            masterVolume: audioService.getVolume(),
            musicVolume: audioService.getMusicVolume(),
            soundVolume: audioService.getSoundVolume(),
            musicEnabled: audioService.isMusicEnabled(),
            soundEnabled: audioService.isSoundEffectsEnabled(),
            audioEnabled: audioService.isAudioEnabled()
        });
    }, [audioService]);

    /**
     * Check if audio context is suspended (needs user interaction)
     */
    const isSuspended = useMemo(() => {
        if (!audioService) {
            return true;
        }

        return audioService.isContextSuspended();
    }, [audioService]);

    /**
     * Resume audio context after user interaction
     */
    const resumeAudioContext = useCallback(() => {
        if (!audioService) {
            return Promise.reject(new Error('Audio service not initialized'));
        }

        return audioService.resumeContext();
    }, [audioService]);

    return {
        service: getTypedService<AudioManager>(audioService),
        isLoading: serviceLoading,
        error: serviceError,
        settings,
        isPlayingMusic,
        currentMusic,
        isSuspended,
        playSound,
        stopSound,
        playMusic,
        stopMusic,
        preloadSounds,
        setMasterVolume,
        setMusicVolume,
        setSoundVolume,
        setAudioEnabled,
        setMusicEnabled,
        setSoundEnabled,
        toggleAudio,
        toggleMusic,
        toggleSound,
        resetSettings,
        resumeAudioContext,
        initialize
    };
}