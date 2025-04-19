/**
 * Audio Preloader for handling sound loading and caching
 */

type CreateAudioContextFn = () => AudioContext | null;

export class AudioPreloader {
    private audioContext: AudioContext | null = null;
    private loadedBuffers: Map<string, AudioBuffer> = new Map();
    private loadPromises: Map<string, Promise<AudioBuffer>> = new Map();
    private createAudioContextFn: CreateAudioContextFn;

    constructor(createAudioContextFn: CreateAudioContextFn) {
        this.createAudioContextFn = createAudioContextFn;
    }

    /**
     * Load a single audio file
     */
    public async loadAudio(src: string): Promise<AudioBuffer> {
        // Get or create audio context
        this.audioContext = this.audioContext || this.createAudioContextFn();

        if (!this.audioContext) {
            throw new Error('Failed to create audio context');
        }

        try {
            // Fetch the audio file
            const response = await fetch(src);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio file: ${src}`);
            }

            // Convert to array buffer
            const arrayBuffer = await response.arrayBuffer();

            // Decode audio data
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load audio file: ${src}`, error);
            throw error;
        }
    }

    /**
     * Preload a single sound effect
     */
    public async preloadSound(src: string, id: string): Promise<AudioBuffer> {
        // Check if already loaded
        if (this.loadedBuffers.has(id)) {
            return this.loadedBuffers.get(id)!;
        }

        // Check if already loading
        if (this.loadPromises.has(id)) {
            return this.loadPromises.get(id)!;
        }

        // Create new load promise
        const loadPromise = this.loadAudio(src).then(buffer => {
            // Store buffer and remove promise
            this.loadedBuffers.set(id, buffer);
            this.loadPromises.delete(id);
            return buffer;
        });

        // Store promise
        this.loadPromises.set(id, loadPromise);

        return loadPromise;
    }

    /**
     * Preload multiple sound effects
     */
    public async preloadSounds(sounds: Array<{ id: string; src: string }>): Promise<void> {
        await Promise.all(
            sounds.map(({ id, src }) => this.preloadSound(src, id))
        );
    }

    /**
     * Get all loaded audio buffers
     */
    public getLoadedBuffers(): Map<string, AudioBuffer> {
        return new Map(this.loadedBuffers);
    }
}