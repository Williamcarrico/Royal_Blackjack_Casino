/**
 * Audio Manager service for handling game sounds and music
 */
import { BaseService, ServiceOptions } from '../serviceInterface';
import { soundEffects, SoundEffect, SoundCategory } from './soundEffects';
import { AudioPreloader } from './audioPreloader';

export interface AudioOptions {
    enabled: boolean;
    volume: number;
    musicEnabled: boolean;
    musicVolume: number;
    soundsEnabled: boolean;
    soundsVolume: number;
}

export interface AudioManagerConfig extends ServiceOptions {
    options?: Partial<AudioOptions>;
    storageKey?: string;
}

class AudioManager extends BaseService {
    private static instance: AudioManager;
    // Private fields with service options
    private audioOptions: AudioOptions;
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private musicGainNode: GainNode | null = null;
    private soundsGainNode: GainNode | null = null;
    private currentMusic: { source: AudioBufferSourceNode; buffer: AudioBuffer } | null = null;
    private soundBuffers: Map<string, AudioBuffer> = new Map();
    private readonly preloader: AudioPreloader;
    private readonly storageKey: string;
    private readonly soundInstances: Map<string, AudioBufferSourceNode> = new Map();
    private readonly debug: boolean = false;

    protected log(message: string): void {
        if (this.debug) {
            console.log(`[AudioManager] ${message}`);
        }
    }

    protected logError(message: string, error?: unknown): void {
        console.error(`[AudioManager] ${message}`, error);
    }

    private constructor(config: AudioManagerConfig = {}) {
        super(config);

        this.storageKey = config.storageKey ?? 'blackjack_audio_options';

        // Default options
        this.audioOptions = {
            enabled: true,
            volume: 0.8,
            musicEnabled: true,
            musicVolume: 0.5,
            soundsEnabled: true,
            soundsVolume: 0.8,
            ...config.options
        };

        // Load options from localStorage if available
        this.loadOptions();

        // Initialize audio preloader
        this.preloader = new AudioPreloader(this.createAudioContext.bind(this));
    }

    public static getInstance(config?: AudioManagerConfig): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager(config);
        }
        return AudioManager.instance;
    }

    protected async initializeImpl(): Promise<void> {
        try {
            // Create audio context
            this.createAudioContext();

            // Configure audio graph
            if (this.audioContext) {
                this.setupAudioGraph();
            }

            // Start preloading sounds
            await this.preloadSounds();

            this.log('Audio manager initialized');
        } catch (error) {
            this.logError('Failed to initialize audio manager', error);
        }
    }

    protected async resetImpl(): Promise<void> {
        // Stop all sounds
        this.stopAllSounds();

        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            await this.audioContext.close();
            this.audioContext = null;
            this.gainNode = null;
            this.musicGainNode = null;
            this.soundsGainNode = null;
        }

        this.log('Audio manager reset');
    }

    /**
     * Play a sound effect
     */
    public playSound(id: SoundEffect, options: {
        volume?: number;
        loop?: boolean;
        playbackRate?: number;
        onEnded?: () => void;
    } = {}): string | null {
        if (!this.audioContext || !this.audioOptions.enabled || !this.audioOptions.soundsEnabled) {
            return null;
        }

        // Resume audio context if it's suspended
        this.resumeAudioContext();

        // Get sound data
        const soundData = soundEffects[id];

        if (!soundData) {
            this.logError(`Sound not found: ${id}`);
            return null;
        }

        // Get or load the sound buffer
        const buffer = this.soundBuffers.get(id);

        if (!buffer) {
            // If buffer isn't loaded yet, try to load it
            this.preloader.preloadSound(soundData.src, id)
                .then(() => {
                    // Try playing again after loading
                    this.playSound(id, options);
                })
                .catch((error: Error) => {
                    this.logError(`Failed to load sound: ${id}`, error);
                });
            return null;
        }

        try {
            // Create source node
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = options.loop || false;
            source.playbackRate.value = options.playbackRate ?? 1.0;

            // Create a gain node for this sound
            const gainNode = this.audioContext.createGain();
            const volumeScale = (options.volume ?? 1) *
                this.audioOptions.soundsVolume;
            gainNode.gain.value = volumeScale;

            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(this.soundsGainNode || this.gainNode || this.audioContext.destination);

            // Generate unique ID for this sound instance
            const instanceId = `${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // Store the sound instance
            this.soundInstances.set(instanceId, source);

            // Handle sound ending
            source.onended = () => {
                this.soundInstances.delete(instanceId);
                if (options.onEnded) {
                    options.onEnded();
                }
            };

            // Start playback
            source.start(0);

            return instanceId;
        } catch (error) {
            this.logError(`Failed to play sound: ${id}`, error);
            return null;
        }
    }

    /**
     * Stop a specific sound instance
     */
    public stopSound(instanceId: string): void {
        const source = this.soundInstances.get(instanceId);

        if (source) {
            try {
                source.stop();
                this.soundInstances.delete(instanceId);
            } catch (error) {
                this.log(`Ignored error stopping sound: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    /**
     * Stop all sounds
     */
    public stopAllSounds(): void {
        // Stop all sound instances
        this.soundInstances.forEach((source, _id) => {
            try {
                source.stop();
            } catch (error) {
                this.log(`Ignored error stopping sound: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        this.soundInstances.clear();

        // Stop current music
        this.stopMusic();
    }

    /**
     * Play background music
     */
    public playMusic(src: string, options: {
        volume?: number;
        fadeIn?: number;
        loop?: boolean;
    } = {}): void {
        if (!this.audioContext || !this.audioOptions.enabled || !this.audioOptions.musicEnabled) {
            return;
        }

        // Resume audio context if it's suspended
        this.resumeAudioContext();

        // Stop current music
        this.stopMusic();

        // Load and play the music
        this.preloader.loadAudio(src)
            .then((buffer: AudioBuffer) => {
                if (!this.audioContext) return;

                // Create source node
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.loop = options.loop !== false; // Loop by default

                // Create a gain node for fade-in if needed
                const fadeGain = this.audioContext.createGain();
                const volumeScale = (options.volume ?? 1) *
                    this.audioOptions.musicVolume;

                if (options.fadeIn) {
                    fadeGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    fadeGain.gain.linearRampToValueAtTime(
                        volumeScale,
                        this.audioContext.currentTime + options.fadeIn
                    );
                } else {
                    fadeGain.gain.value = volumeScale;
                }

                // Connect nodes
                source.connect(fadeGain);
                fadeGain.connect(this.musicGainNode || this.gainNode || this.audioContext.destination);

                // Store current music
                this.currentMusic = { source, buffer };

                // Start playback
                source.start(0);
            })
            .catch((error: Error) => {
                this.logError(`Failed to load music: ${src}`, error);
            });
    }

    /**
     * Stop background music
     */
    public stopMusic(fadeOut?: number): void {
        if (!this.audioContext || !this.currentMusic) {
            return;
        }

        try {
            const { source } = this.currentMusic;

            if (fadeOut && this.audioContext.state === 'running') {
                // Create a gain node for fade-out
                const fadeGain = this.audioContext.createGain();
                fadeGain.gain.setValueAtTime(1, this.audioContext.currentTime);
                fadeGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut);

                // Disconnect from current output and connect through fade gain
                source.disconnect();
                source.connect(fadeGain);
                fadeGain.connect(this.musicGainNode || this.gainNode || this.audioContext.destination);

                // Stop after fade out
                setTimeout(() => {
                    try {
                        source.stop();
                    } catch (error) {
                        this.log(`Ignored error stopping sound: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }, fadeOut * 1000);
            } else {
                // Stop immediately
                source.stop();
            }
        } catch (error) {
            this.log(`Ignored error stopping music: ${error instanceof Error ? error.message : String(error)}`);
        }

        this.currentMusic = null;
    }

    /**
     * Preload all sound effects
     */
    public async preloadSounds(category?: SoundCategory): Promise<void> {
        try {
            // Get sounds to preload
            const soundsToPreload = Object.entries(soundEffects)
                .filter(([, data]) => !category || data.category === category)
                .map(([id, data]) => ({ id, src: data.src }));

            // Preload sounds
            await this.preloader.preloadSounds(soundsToPreload);

            // Update sound buffers map
            this.soundBuffers = this.preloader.getLoadedBuffers();

            // Fix nested template literals
            const categoryText = category ? ` in category ${category}` : '';
            this.log(`Preloaded ${soundsToPreload.length} sounds${categoryText}`);
        } catch (error) {
            this.logError('Failed to preload sounds', error);
        }
    }

    /**
     * Set master volume
     */
    public setVolume(volume: number): void {
        this.audioOptions.volume = Math.max(0, Math.min(1, volume));

        if (this.gainNode) {
            this.gainNode.gain.value = this.audioOptions.volume;
        }

        this.saveOptions();
    }

    /**
     * Set music volume
     */
    public setMusicVolume(volume: number): void {
        this.audioOptions.musicVolume = Math.max(0, Math.min(1, volume));

        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.audioOptions.musicVolume;
        }

        this.saveOptions();
    }

    /**
     * Set sound effects volume
     */
    public setSoundVolume(volume: number): void {
        this.audioOptions.soundsVolume = Math.max(0, Math.min(1, volume));

        if (this.soundsGainNode) {
            this.soundsGainNode.gain.value = this.audioOptions.soundsVolume;
        }

        this.saveOptions();
    }

    /**
     * Enable or disable all audio
     */
    public setEnabled(enabled: boolean): void {
        this.audioOptions.enabled = enabled;

        if (!enabled) {
            this.stopAllSounds();
        }

        this.saveOptions();
    }

    /**
     * Enable or disable music
     */
    public setMusicEnabled(enabled: boolean): void {
        this.audioOptions.musicEnabled = enabled;

        if (!enabled) {
            this.stopMusic();
        }

        this.saveOptions();
    }

    /**
     * Enable or disable sound effects
     */
    public setSoundEnabled(enabled: boolean): void {
        this.audioOptions.soundsEnabled = enabled;

        if (!enabled) {
            // Stop all sounds except music
            this.soundInstances.forEach((source, _id) => {
                try {
                    source.stop();
                } catch (error) {
                    this.log(`Ignored error stopping sound: ${error instanceof Error ? error.message : String(error)}`);
                }
            });

            this.soundInstances.clear();
        }

        this.saveOptions();
    }

    /**
     * Get current audio options
     */
    public getOptions(): AudioOptions {
        return { ...this.audioOptions };
    }

    /**
     * Get list of available sound effects
     */
    public getAvailableSounds(): Array<{ id: SoundEffect; name: string; category: SoundCategory }> {
        return Object.entries(soundEffects).map(([id, data]) => {
            // Use type predicate to ensure id is SoundEffect
            const soundId = id;
            if (this.isSoundEffect(soundId)) {
                return {
                    id: soundId,
                    name: data.name,
                    category: data.category
                };
            }
            // This should never happen if soundEffects is properly typed
            throw new Error(`Invalid sound effect ID: ${id}`);
        });
    }

    /**
     * Type guard to check if a string is a valid SoundEffect
     */
    private isSoundEffect(id: string): id is SoundEffect {
        // Create a type-safe array of valid sound effect keys
        const validSoundEffects = Object.keys(soundEffects) as SoundEffect[];
        // Check if the id is in the array of valid keys
        return validSoundEffects.includes(id as SoundEffect);
    }

    /**
     * Check if the specified sound is loaded
     */
    public isSoundLoaded(id: SoundEffect): boolean {
        return this.soundBuffers.has(id);
    }

    /**
     * Check if audio context is available
     */
    public isAudioContextAvailable(): boolean {
        return this.audioContext !== null && this.audioContext.state !== 'closed';
    }

    /**
     * Resume audio context (needed after user interaction in some browsers)
     */
    public resumeAudioContext(): void {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume()
                .catch(error => {
                    this.logError('Failed to resume audio context', error);
                });
        }
    }

    private createAudioContext(): AudioContext | null {
        if (this.audioContext) {
            return this.audioContext;
        }

        try {
            // Define the webkit window interface
            interface WebkitWindow extends Window {
                webkitAudioContext: typeof AudioContext;
            }

            // Use safer type checking
            const AudioContextClass = window.AudioContext ||
                (('webkitAudioContext' in window) ? (window as WebkitWindow).webkitAudioContext : undefined);

            if (!AudioContextClass) {
                this.logError('AudioContext is not supported in this browser');
                return null;
            }

            this.audioContext = new AudioContextClass();
            return this.audioContext;
        } catch (error) {
            this.logError('Failed to create audio context', error);
            return null;
        }
    }

    private setupAudioGraph(): void {
        if (!this.audioContext) return;

        // Create master gain node
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.audioOptions.volume;
        this.gainNode.connect(this.audioContext.destination);

        // Create music gain node
        this.musicGainNode = this.audioContext.createGain();
        this.musicGainNode.gain.value = this.audioOptions.musicVolume;
        this.musicGainNode.connect(this.gainNode);

        // Create sounds gain node
        this.soundsGainNode = this.audioContext.createGain();
        this.soundsGainNode.gain.value = this.audioOptions.soundsVolume;
        this.soundsGainNode.connect(this.gainNode);
    }

    private saveOptions(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.audioOptions));
        } catch (error) {
            this.logError('Failed to save audio options', error);
        }
    }

    private loadOptions(): void {
        try {
            const savedOptions = localStorage.getItem(this.storageKey);

            if (savedOptions) {
                const parsedOptions = JSON.parse(savedOptions);
                this.audioOptions = {
                    ...this.audioOptions,
                    ...parsedOptions
                };
            }
        } catch (error) {
            this.logError('Failed to load audio options', error);
        }
    }
}

export default AudioManager;