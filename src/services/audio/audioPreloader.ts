/**
 * Audio Preloader for efficient audio file loading
 */

export class AudioPreloader {
    private audioContext: (() => AudioContext | null);
    private loadedBuffers: Map<string, AudioBuffer> = new Map();
    private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();
    private retryCount: Map<string, number> = new Map();
    private maxRetries: number = 3;
    private retryDelay: number = 1000;

    constructor(audioContextProvider: () => AudioContext | null) {
        this.audioContext = audioContextProvider;
    }

    /**
     * Load an audio file and return the audio buffer
     */
    public async loadAudio(src: string): Promise<AudioBuffer> {
        // If the buffer is already loaded, return it
        if (this.loadedBuffers.has(src)) {
            return this.loadedBuffers.get(src)!;
        }

        // If the audio is already being loaded, return the existing promise
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src)!;
        }

        // Create the audio context if needed
        const audioContext = this.audioContext();
        if (!audioContext) {
            throw new Error('Audio context not available');
        }

        // Start loading the audio file
        const loadPromise = this.fetchAndDecodeAudio(src, audioContext);
        this.loadingPromises.set(src, loadPromise);

        try {
            // Wait for the audio to load
            const buffer = await loadPromise;

            // Cache the loaded buffer
            this.loadedBuffers.set(src, buffer);
            this.loadingPromises.delete(src);

            return buffer;
        } catch (error) {
            // Remove the failed promise
            this.loadingPromises.delete(src);
            throw error;
        }
    }

    /**
     * Preload a single sound
     */
    public async preloadSound(src: string, id: string): Promise<AudioBuffer> {
        try {
            return await this.loadAudio(src);
        } catch (error) {
            console.error(`Failed to preload sound ${id}: ${src}`, error);
            throw error;
        }
    }

    /**
     * Preload a list of sounds
     */
    public async preloadSounds(sounds: Array<{ id: string; src: string }>): Promise<void> {
        const loadPromises = sounds.map(({ id, src }) =>
            this.preloadSound(src, id)
                .catch(error => {
                    console.error(`Failed to preload sound ${id}: ${src}`, error);
                    return null;
                })
        );

        await Promise.all(loadPromises);
    }

    /**
     * Get all loaded buffers
     */
    public getLoadedBuffers(): Map<string, AudioBuffer> {
        return new Map(this.loadedBuffers);
    }

    /**
     * Check if a specific audio file is loaded
     */
    public isLoaded(src: string): boolean {
        return this.loadedBuffers.has(src);
    }

    /**
     * Clear all loaded buffers
     */
    public clearBuffers(): void {
        this.loadedBuffers.clear();
    }

    /**
     * Get the count of loaded audio files
     */
    public getLoadedCount(): number {
        return this.loadedBuffers.size;
    }

    /**
     * Get the count of audio files currently being loaded
     */
    public getLoadingCount(): number {
        return this.loadingPromises.size;
    }

    /**
     * Fetch and decode an audio file into an AudioBuffer
     */
    private async fetchAndDecodeAudio(src: string, audioContext: AudioContext): Promise<AudioBuffer> {
        const retryCount = this.retryCount.get(src) || 0;

        try {
            // Fetch the audio file
            const response = await fetch(src);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }

            // Get the array buffer
            const arrayBuffer = await response.arrayBuffer();

            // Decode the audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Reset retry count on success
            this.retryCount.delete(src);

            return audioBuffer;
        } catch (error) {
            // Increment retry count
            this.retryCount.set(src, retryCount + 1);

            // If we haven't reached the maximum retry count, try again after a delay
            if (retryCount < this.maxRetries) {
                console.warn(`Retrying audio load for ${src} (${retryCount + 1}/${this.maxRetries})`);

                // Wait for the retry delay
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));

                // Try again
                return this.fetchAndDecodeAudio(src, audioContext);
            }

            // Otherwise, give up
            this.retryCount.delete(src);
            throw error;
        }
    }
}